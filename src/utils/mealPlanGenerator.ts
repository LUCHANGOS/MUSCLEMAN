import { 
  User, 
  Recipe, 
  MealPlanDay, 
  Meal, 
  FoodItem,
  RecipeFilter,
  RecipeTag 
} from '@/types';
import { calculateAllMetrics } from '@/utils/calculators';

/**
 * Plantilla de día alimentario con distribución de macros
 */
interface DayTemplate {
  id: string;
  name: string;
  has_breakfast: boolean;
  has_snack: boolean;
  has_fasting: boolean;
  kcal_distribution: {
    desayuno?: number;
    almuerzo: number;
    colacion?: number;
    cena: number;
    post_entreno?: number;
  };
}

/**
 * Reglas de personalización para el motor
 */
interface PersonalizationRules {
  no_oil: boolean;
  no_sugar: boolean;
  no_fried: boolean;
  budget_priority: boolean;
  cholesterol_friendly: boolean;
  high_protein: boolean;
  batch_cooking: boolean;
  excluded_ingredients: string[];
  preferred_ingredients: string[];
  max_prep_time?: number;
}

/**
 * Plantillas predefinidas de días alimentarios
 */
const DAY_TEMPLATES: DayTemplate[] = [
  {
    id: 'normal_day',
    name: 'Día normal',
    has_breakfast: true,
    has_snack: true,
    has_fasting: false,
    kcal_distribution: {
      desayuno: 0.18, // 18%
      almuerzo: 0.35, // 35%
      colacion: 0.15, // 15%
      cena: 0.27,     // 27%
      post_entreno: 0.05, // 5%
    }
  },
  {
    id: 'fasting_morning',
    name: 'Ayuno mañanero',
    has_breakfast: false,
    has_snack: true,
    has_fasting: true,
    kcal_distribution: {
      almuerzo: 0.40, // 40%
      colacion: 0.20, // 20%
      cena: 0.35,     // 35%
      post_entreno: 0.05, // 5%
    }
  },
  {
    id: 'simple_3_meals',
    name: 'Tres comidas simples',
    has_breakfast: true,
    has_snack: false,
    has_fasting: false,
    kcal_distribution: {
      desayuno: 0.25, // 25%
      almuerzo: 0.40, // 40%
      cena: 0.35,     // 35%
    }
  }
];

/**
 * Genera reglas de personalización basadas en el usuario
 */
function generatePersonalizationRules(user: User): PersonalizationRules {
  return {
    no_oil: user.preferences.no_oil,
    no_sugar: user.preferences.no_sugar,
    no_fried: user.preferences.no_fried,
    budget_priority: user.budget_level === 'low',
    cholesterol_friendly: !!(user.health.ldl && user.health.ldl > 130), // LDL alto
    high_protein: user.goal_weight_kg < user.weight_kg, // Pérdida de peso
    batch_cooking: user.preferences.likes.includes('batch_cooking'),
    excluded_ingredients: user.preferences.dislikes,
    preferred_ingredients: user.preferences.likes,
    max_prep_time: user.budget_level === 'low' ? 30 : undefined,
  };
}

/**
 * Selecciona la plantilla de día más apropiada para el usuario
 */
function selectDayTemplate(user: User, rules: PersonalizationRules): DayTemplate {
  // Si tiene ayuno configurado, usar plantilla de ayuno
  if (user.preferences.likes.includes('ayuno_intermitente')) {
    return DAY_TEMPLATES.find(t => t.id === 'fasting_morning') || DAY_TEMPLATES[0];
  }
  
  // Si es budget y quiere simplicidad
  if (rules.budget_priority && !rules.batch_cooking) {
    return DAY_TEMPLATES.find(t => t.id === 'simple_3_meals') || DAY_TEMPLATES[0];
  }
  
  // Por defecto, día normal
  return DAY_TEMPLATES[0];
}

/**
 * Filtra recetas según las reglas de personalización
 */
function filterRecipesByRules(
  recipes: Recipe[], 
  rules: PersonalizationRules,
  category?: 'desayuno' | 'almuerzo' | 'colacion' | 'cena'
): Recipe[] {
  return recipes.filter(recipe => {
    // Filtrar por categoría si se especifica
    if (category && recipe.category !== category) return false;
    
    // Reglas obligatorias
    if (rules.no_oil && !recipe.tags.includes('sin_aceite')) return false;
    if (rules.no_sugar && !recipe.tags.includes('sin_azucar')) return false;
    
    // Ingredientes excluidos
    const hasExcludedIngredient = rules.excluded_ingredients.some(excluded =>
      recipe.ingredients.some(ing => ing.food_id.includes(excluded.toLowerCase()))
    );
    if (hasExcludedIngredient) return false;
    
    // Tiempo de preparación
    if (rules.max_prep_time && 
        (recipe.prep_time_min + recipe.cooking_time_min) > rules.max_prep_time) {
      return false;
    }
    
    // Preferencias (dar bonus pero no filtrar)
    return true;
  });
}

/**
 * Puntúa recetas basándose en las preferencias del usuario
 */
function scoreRecipe(recipe: Recipe, rules: PersonalizationRules): number {
  let score = 0;
  
  // Bonus por tags preferidos
  if (rules.budget_priority && recipe.tags.includes('budget')) score += 3;
  if (rules.cholesterol_friendly && recipe.tags.includes('colesterol_friendly')) score += 2;
  if (rules.high_protein && recipe.tags.includes('alta_prote')) score += 2;
  if (rules.batch_cooking && recipe.tags.includes('batch_cooking')) score += 1;
  if (recipe.tags.includes('rapida')) score += 1;
  
  // Bonus por ingredientes preferidos
  const hasPreferredIngredient = rules.preferred_ingredients.some(preferred =>
    recipe.ingredients.some(ing => ing.food_id.includes(preferred.toLowerCase()))
  );
  if (hasPreferredIngredient) score += 1;
  
  // Penalización por costo alto si es budget
  if (rules.budget_priority && recipe.cost_estimate && recipe.cost_estimate > 1500) score -= 2;
  
  return score;
}

/**
 * Selecciona la mejor receta para un objetivo calórico específico
 */
function selectRecipeForCalories(
  availableRecipes: Recipe[],
  targetKcal: number,
  rules: PersonalizationRules,
  tolerance: number = 0.15
): Recipe | null {
  if (availableRecipes.length === 0) return null;
  
  // Filtrar recetas dentro del rango calórico
  const inRangeRecipes = availableRecipes.filter(recipe => {
    const deviation = Math.abs(recipe.per_portion.kcal - targetKcal) / targetKcal;
    return deviation <= tolerance;
  });
  
  // Si no hay recetas en rango, usar las más cercanas
  const recipesToScore = inRangeRecipes.length > 0 ? inRangeRecipes : availableRecipes;
  
  // Puntuar y ordenar recetas
  const scoredRecipes = recipesToScore
    .map(recipe => ({
      recipe,
      score: scoreRecipe(recipe, rules),
      kcalDiff: Math.abs(recipe.per_portion.kcal - targetKcal)
    }))
    .sort((a, b) => {
      // Priorizar score, luego cercanía calórica
      if (a.score !== b.score) return b.score - a.score;
      return a.kcalDiff - b.kcalDiff;
    });
  
  return scoredRecipes[0]?.recipe || null;
}

/**
 * Ajusta porciones de una receta para alcanzar un objetivo calórico
 */
function adjustPortionsForCalories(
  recipe: Recipe,
  targetKcal: number,
  maxPortion: number = 2.0
): { portions: number; adjustedKcal: number } {
  const baseKcal = recipe.per_portion.kcal;
  let portions = targetKcal / baseKcal;
  
  // Limitar porciones para mantener realismo
  portions = Math.max(0.5, Math.min(maxPortion, portions));
  portions = Math.round(portions * 4) / 4; // Redondear a cuartos
  
  const adjustedKcal = Math.round(baseKcal * portions);
  
  return { portions, adjustedKcal };
}

/**
 * Genera un plan alimentario para un día específico
 */
export function generateDailyMealPlan(
  user: User,
  recipes: Recipe[],
  date: string,
  activityFactor: number = 1.55
): MealPlanDay | null {
  try {
    const metrics = calculateAllMetrics(user, activityFactor);
    const rules = generatePersonalizationRules(user);
    const template = selectDayTemplate(user, rules);
    
    const targetKcal = metrics.kcal_range.target;
    const meals: Meal[] = [];
    
    let totalKcal = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalCarbs = 0;
    let totalFiber = 0;
    
    // Generar cada comida según la plantilla
    for (const [mealType, kcalPct] of Object.entries(template.kcal_distribution)) {
      const mealTargetKcal = Math.round(targetKcal * (kcalPct as number));
      const mealCategory = mealType as 'desayuno' | 'almuerzo' | 'colacion' | 'cena' | 'post_entreno';
      
      // Para post_entreno, usar recetas de colación
      const categoryForFilter = mealCategory === 'post_entreno' ? 'colacion' : mealCategory;
      
      const availableRecipes = filterRecipesByRules(recipes, rules, categoryForFilter);
      const selectedRecipe = selectRecipeForCalories(availableRecipes, mealTargetKcal, rules);
      
      if (!selectedRecipe) {
        console.warn(`No se encontró receta para ${mealType} con ${mealTargetKcal} kcal`);
        continue;
      }
      
      const { portions, adjustedKcal } = adjustPortionsForCalories(selectedRecipe, mealTargetKcal);
      
      // Agregar comida al plan
      meals.push({
        type: mealCategory,
        recipe_id: selectedRecipe.id,
        portions,
        time_scheduled: getScheduledTime(mealCategory),
        completed: false,
      });
      
      // Acumular macros
      totalKcal += adjustedKcal;
      totalProtein += Math.round(selectedRecipe.per_portion.protein * portions);
      totalFat += Math.round(selectedRecipe.per_portion.fat * portions);
      totalCarbs += Math.round(selectedRecipe.per_portion.carbs * portions);
      totalFiber += Math.round(selectedRecipe.per_portion.fiber * portions);
    }
    
    if (meals.length === 0) {
      console.error('No se pudieron generar comidas para el día');
      return null;
    }
    
    const mealPlan: MealPlanDay = {
      id: `${user.id}_${date}`,
      user_id: user.id,
      date,
      meals,
      totals: {
        kcal: totalKcal,
        protein: totalProtein,
        fat: totalFat,
        carbs: totalCarbs,
        fiber: totalFiber,
      },
      adherence: 0,
      notes: `Plan generado con plantilla: ${template.name}`,
    };
    
    return mealPlan;
    
  } catch (error) {
    console.error('Error generando plan alimentario:', error);
    return null;
  }
}

/**
 * Obtiene hora programada por tipo de comida
 */
function getScheduledTime(mealType: string): string {
  const defaultTimes: Record<string, string> = {
    desayuno: '08:00',
    almuerzo: '13:00',
    colacion: '16:00',
    cena: '20:00',
    post_entreno: '18:30',
  };
  
  return defaultTimes[mealType] || '12:00';
}

/**
 * Genera plan semanal completo
 */
export function generateWeeklyMealPlan(
  user: User,
  recipes: Recipe[],
  startDate: string,
  activityFactor: number = 1.55
): MealPlanDay[] {
  const weekPlan: MealPlanDay[] = [];
  
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + i);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    const dayPlan = generateDailyMealPlan(user, recipes, dateStr, activityFactor);
    if (dayPlan) {
      weekPlan.push(dayPlan);
    }
  }
  
  return weekPlan;
}

/**
 * Valida si un plan cumple con las metas nutricionales del usuario
 */
export function validateMealPlan(
  plan: MealPlanDay,
  user: User,
  activityFactor: number = 1.55
): { valid: boolean; issues: string[] } {
  const metrics = calculateAllMetrics(user, activityFactor);
  const issues: string[] = [];
  
  // Validar calorías
  const kcalDeviation = Math.abs(plan.totals.kcal - metrics.kcal_range.target) / metrics.kcal_range.target;
  if (kcalDeviation > 0.15) {
    issues.push(`Calorías fuera de rango: ${plan.totals.kcal} kcal (objetivo: ${metrics.kcal_range.target})`);
  }
  
  // Validar proteína
  const proteinDeviation = Math.abs(plan.totals.protein - metrics.macros.protein_g) / metrics.macros.protein_g;
  if (proteinDeviation > 0.20) {
    issues.push(`Proteína insuficiente: ${plan.totals.protein}g (objetivo: ${metrics.macros.protein_g}g)`);
  }
  
  // Validar que no hay aceite/azúcar si está restringido
  if (user.preferences.no_oil || user.preferences.no_sugar) {
    // Esta validación se hace a nivel de recetas en el filtro
  }
  
  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Sugiere sustituciones para mejorar un plan alimentario
 */
export function suggestMealSubstitutions(
  plan: MealPlanDay,
  recipes: Recipe[],
  user: User
): Array<{ mealIndex: number; currentRecipe: string; suggestions: Recipe[] }> {
  const suggestions = [];
  const rules = generatePersonalizationRules(user);
  
  for (let i = 0; i < plan.meals.length; i++) {
    const meal = plan.meals[i];
    const currentRecipe = recipes.find(r => r.id === meal.recipe_id);
    
    if (!currentRecipe) continue;
    
    // Buscar alternativas de la misma categoría
    const alternatives = filterRecipesByRules(
      recipes.filter(r => 
        r.category === currentRecipe.category && 
        r.id !== currentRecipe.id
      ),
      rules
    );
    
    // Filtrar por rango calórico similar
    const targetKcal = currentRecipe.per_portion.kcal * meal.portions;
    const similarKcalRecipes = alternatives.filter(recipe => {
      const deviation = Math.abs(recipe.per_portion.kcal - currentRecipe.per_portion.kcal) / currentRecipe.per_portion.kcal;
      return deviation <= 0.25; // 25% de tolerancia
    });
    
    if (similarKcalRecipes.length > 0) {
      suggestions.push({
        mealIndex: i,
        currentRecipe: currentRecipe.id,
        suggestions: similarKcalRecipes.slice(0, 3), // Top 3 alternativas
      });
    }
  }
  
  return suggestions;
}