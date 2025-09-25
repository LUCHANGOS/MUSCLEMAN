# 📚 Documentación de la API - NutriFit

Esta documentación describe los tipos TypeScript, funciones principales y la arquitectura interna de NutriFit.

## 🗄️ Tipos de Datos Principales

### Usuario (`User`)

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height_cm: number;
  weight_kg: number;
  activity_level: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active';
  goal: 'lose_weight' | 'maintain_weight' | 'gain_weight' | 'gain_muscle';
  dietary_restrictions: string[];
  equipment_available: EquipmentType[];
  created_at: Date;
  updated_at: Date;
  
  // Preferencias específicas
  preferences: {
    no_oil: boolean;
    no_sugar: boolean;
    budget_mode: boolean;
    baes_eligible: boolean;
    batch_cooking: boolean;
    google_calendar_sync: boolean;
  };
  
  // Objetivos calculados
  target_kcal: number;
  target_protein_g: number;
  target_fat_g: number;
  target_carbs_g: number;
}
```

### Receta (`Recipe`)

```typescript
interface Recipe {
  id: string;
  name: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  servings: number;
  prep_time_min: number;
  cook_time_min: number;
  difficulty: 'easy' | 'medium' | 'hard';
  
  // Ingredientes con gramajes
  ingredients: RecipeIngredient[];
  
  // Pasos de preparación
  instructions: string[];
  
  // Información nutricional por porción
  nutrition: {
    kcal: number;
    protein_g: number;
    fat_g: number;
    carbs_g: number;
    fiber_g: number;
    sugar_g: number;
    sodium_mg: number;
  };
  
  // Tags para filtrado
  tags: RecipeTag[];
  
  // Costo estimado por porción
  estimated_cost_clp: number;
  
  // Metadatos
  source: string;
  created_at: Date;
  updated_at: Date;
}

interface RecipeIngredient {
  food_item_id: string;
  quantity: number;
  unit: 'g' | 'ml' | 'cup' | 'piece' | 'tbsp' | 'tsp';
  notes?: string;
}

type RecipeTag = 
  | 'sin_aceite' 
  | 'sin_azucar' 
  | 'alta_prote' 
  | 'budget' 
  | 'colesterol_friendly' 
  | 'diabetico_friendly'
  | 'vegetariano'
  | 'vegano'
  | 'sin_gluten'
  | 'batch_cookeable';
```

### Plan Alimentario (`MealPlan`)

```typescript
interface MealPlan {
  id: string;
  user_id: string;
  name: string;
  start_date: Date;
  duration_days: number;
  
  // Configuración del plan
  template_type: 'normal' | 'intermittent_fasting' | 'three_meals';
  target_kcal_daily: number;
  target_macros: MacroTargets;
  
  // Días del plan
  days: MealPlanDay[];
  
  // Metadatos
  created_at: Date;
  updated_at: Date;
  
  // Estado de adherencia
  adherence_score?: number;
  completed_days?: number;
}

interface MealPlanDay {
  date: Date;
  meals: PlannedMeal[];
  total_kcal: number;
  total_protein_g: number;
  total_fat_g: number;
  total_carbs_g: number;
  
  // Estado del día
  completed: boolean;
  actual_consumed?: DailyConsumption;
}

interface PlannedMeal {
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  recipe_id: string;
  servings: number;
  scheduled_time?: string; // HH:MM
  
  // Valores nutricionales calculados
  kcal: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
}
```

### Rutina de Entrenamiento (`WorkoutPlan`)

```typescript
interface WorkoutPlan {
  id: string;
  user_id: string;
  name: string;
  template_id: string;
  
  // Configuración
  frequency_per_week: number;
  duration_weeks: number;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  
  // Sesiones programadas
  sessions: WorkoutSession[];
  
  // Progresión
  progression: WorkoutProgression;
  
  // Metadatos
  created_at: Date;
  updated_at: Date;
}

interface WorkoutSession {
  id: string;
  date: Date;
  workout_type: 'hiit' | 'cardio' | 'strength' | 'mixed';
  
  // Estructura de la sesión
  warmup: ExerciseBlock;
  main_blocks: ExerciseBlock[];
  cooldown: ExerciseBlock;
  
  // Duración total estimada
  estimated_duration_min: number;
  
  // Progreso de la sesión
  completed: boolean;
  actual_duration_min?: number;
  rpe?: number; // 1-10
  notes?: string;
  
  // Calorías estimadas quemadas
  estimated_kcal_burned: number;
}

interface ExerciseBlock {
  name: string;
  type: 'circuit' | 'straight_sets' | 'amrap' | 'emom' | 'tabata';
  duration_min?: number;
  rounds?: number;
  rest_between_rounds_sec?: number;
  
  // Ejercicios del bloque
  exercises: Exercise[];
}

interface Exercise {
  name: string;
  equipment_required: EquipmentType[];
  target_muscle_groups: MuscleGroup[];
  
  // Parámetros del ejercicio
  reps?: number;
  sets?: number;
  duration_sec?: number;
  weight_kg?: number;
  rest_sec?: number;
  
  // Progresión
  progression_type: 'reps' | 'weight' | 'duration' | 'difficulty';
  
  // MET value para cálculo de calorías
  met_value: number;
  
  // Instrucciones
  instructions?: string;
  modifications?: string;
}
```

### Lista de Compras (`ShoppingList`)

```typescript
interface ShoppingList {
  id: string;
  user_id: string;
  meal_plan_id: string;
  week_start_date: Date;
  
  // Configuración de compra
  mode: 'budget' | 'baes' | 'convenience';
  stores_selected: StoreType[];
  
  // Items consolidados
  items: ShoppingItem[];
  
  // Distribución por tienda
  store_distribution: StoreShoppingList[];
  
  // Resumen de costos
  cost_summary: {
    total_cost_clp: number;
    savings_clp: number;
    baes_discount_applied: boolean;
  };
  
  // Notas y sugerencias
  notes: string[];
  batch_cooking_suggestions: BatchCookingSuggestion[];
  
  // Estado
  completed: boolean;
  created_at: Date;
}

interface ShoppingItem {
  food_item_id: string;
  total_quantity_needed: number;
  unit: string;
  
  // Información del alimento
  food_name: string;
  category: FoodCategory;
  
  // Costos por tienda
  store_prices: StorePriceInfo[];
  
  // Mejor opción calculada
  recommended_store: StoreType;
  final_price_per_unit: number;
  
  // Metadatos
  priority: 'high' | 'medium' | 'low';
  perishable: boolean;
  bulk_discount_available: boolean;
}

interface StorePriceInfo {
  store: StoreType;
  base_price_per_unit: number;
  discount_pct: number;
  final_price_per_unit: number;
  availability: 'in_stock' | 'limited' | 'out_of_stock';
  quality_score: number; // 1-5
}
```

## 🧮 Calculadoras Nutricionales

### Fórmulas Implementadas

```typescript
// IMC
function calculateBMI(weight_kg: number, height_cm: number): number {
  return weight_kg / Math.pow(height_cm / 100, 2);
}

// TMB (Mifflin-St Jeor)
function calculateBMR(weight_kg: number, height_cm: number, age: number, gender: string): number {
  const base = 10 * weight_kg + 6.25 * height_cm - 5 * age;
  return gender === 'male' ? base + 5 : base - 161;
}

// GET (Gasto Energético Total)
function calculateTDEE(bmr: number, activity_level: ActivityLevel): number {
  const factors = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extra_active: 1.9
  };
  
  return bmr * factors[activity_level];
}

// Déficit/Superávit calórico
function calculateCalorieTarget(tdee: number, goal: Goal): number {
  const adjustments = {
    lose_weight: -0.15,        // -15% para pérdida de peso gradual
    maintain_weight: 0,        // Mantener
    gain_weight: 0.10,         // +10% para ganancia de peso
    gain_muscle: 0.05          // +5% para recomposición corporal
  };
  
  const adjusted_kcal = tdee * (1 + adjustments[goal]);
  
  // Pisos de seguridad
  const min_kcal = goal === 'lose_weight' ? Math.max(1200, tdee * 0.8) : 1200;
  
  return Math.max(adjusted_kcal, min_kcal);
}

// Macronutrientes
function calculateMacros(weight_kg: number, target_kcal: number, goal: Goal): MacroTargets {
  // Proteína: 1.6-2.2g/kg según objetivo
  const protein_per_kg = goal === 'gain_muscle' ? 2.2 : 
                         goal === 'lose_weight' ? 2.0 : 1.8;
  const protein_g = weight_kg * protein_per_kg;
  
  // Grasas: 0.6-0.8g/kg
  const fat_per_kg = 0.7;
  const fat_g = weight_kg * fat_per_kg;
  
  // Carbohidratos: resto de calorías
  const protein_kcal = protein_g * 4;
  const fat_kcal = fat_g * 9;
  const remaining_kcal = target_kcal - protein_kcal - fat_kcal;
  const carbs_g = Math.max(0, remaining_kcal / 4);
  
  return {
    protein_g: Math.round(protein_g),
    fat_g: Math.round(fat_g),
    carbs_g: Math.round(carbs_g)
  };
}
```

## 🎯 Motor de Generación de Planes

### Algoritmo Principal

```typescript
function generateMealPlan(user: User, duration_days: number): MealPlan {
  // 1. Calcular objetivos nutricionales
  const daily_targets = calculateDailyTargets(user);
  
  // 2. Seleccionar plantilla de día
  const template = selectDayTemplate(user.preferences);
  
  // 3. Generar cada día del plan
  const days: MealPlanDay[] = [];
  
  for (let i = 0; i < duration_days; i++) {
    const day_date = addDays(new Date(), i);
    const day = generateDayPlan(daily_targets, template, user, i);
    days.push(day);
  }
  
  // 4. Validar y ajustar plan completo
  const adjusted_plan = validateAndAdjustPlan(days, daily_targets);
  
  return {
    id: generateId(),
    user_id: user.id,
    name: `Plan ${duration_days} días`,
    start_date: new Date(),
    duration_days,
    template_type: template.id,
    target_kcal_daily: daily_targets.kcal,
    target_macros: daily_targets.macros,
    days: adjusted_plan,
    created_at: new Date(),
    updated_at: new Date()
  };
}

function generateDayPlan(targets: DailyTargets, template: DayTemplate, user: User, day_index: number): MealPlanDay {
  const meals: PlannedMeal[] = [];
  
  // Distribuir calorías según plantilla
  const calorie_distribution = template.calorie_distribution;
  
  for (const meal_config of template.meals) {
    const meal_kcal = targets.kcal * calorie_distribution[meal_config.type];
    
    // Encontrar receta que se ajuste
    const suitable_recipes = findSuitableRecipes(
      meal_config.type,
      meal_kcal,
      user.dietary_restrictions,
      user.preferences
    );
    
    // Seleccionar receta con algoritmo de scoring
    const selected_recipe = selectBestRecipe(suitable_recipes, meal_kcal, targets.macros);
    
    // Ajustar porciones para cumplir objetivo calórico
    const servings = calculateServings(selected_recipe, meal_kcal);
    
    meals.push({
      meal_type: meal_config.type,
      recipe_id: selected_recipe.id,
      servings,
      scheduled_time: meal_config.time,
      kcal: selected_recipe.nutrition.kcal * servings,
      protein_g: selected_recipe.nutrition.protein_g * servings,
      fat_g: selected_recipe.nutrition.fat_g * servings,
      carbs_g: selected_recipe.nutrition.carbs_g * servings
    });
  }
  
  // Calcular totales del día
  const day_totals = calculateDayTotals(meals);
  
  return {
    date: addDays(new Date(), day_index),
    meals,
    total_kcal: day_totals.kcal,
    total_protein_g: day_totals.protein_g,
    total_fat_g: day_totals.fat_g,
    total_carbs_g: day_totals.carbs_g,
    completed: false
  };
}
```

### Sistema de Scoring para Recetas

```typescript
function calculateRecipeScore(recipe: Recipe, target_kcal: number, target_macros: MacroTargets, user_preferences: UserPreferences): number {
  let score = 100;
  
  // 1. Cercanía calórica (peso: 30%)
  const kcal_diff = Math.abs(recipe.nutrition.kcal - target_kcal);
  const kcal_penalty = (kcal_diff / target_kcal) * 30;
  score -= kcal_penalty;
  
  // 2. Perfil de macros (peso: 25%)
  const protein_ratio = recipe.nutrition.protein_g / recipe.nutrition.kcal * 4;
  const target_protein_ratio = target_macros.protein_g / target_kcal * 4;
  const macro_penalty = Math.abs(protein_ratio - target_protein_ratio) * 25;
  score -= macro_penalty;
  
  // 3. Preferencias del usuario (peso: 25%)
  if (user_preferences.no_oil && !recipe.tags.includes('sin_aceite')) {
    score -= 40; // Penalización alta por preferencia crítica
  }
  
  if (user_preferences.budget_mode && recipe.tags.includes('budget')) {
    score += 15; // Bonus por ser económica
  }
  
  if (user_preferences.no_sugar && !recipe.tags.includes('sin_azucar')) {
    score -= 30;
  }
  
  // 4. Variedad y repetición (peso: 20%)
  // Penalizar recetas usadas recientemente
  const recent_usage_penalty = calculateRepetitionPenalty(recipe.id) * 20;
  score -= recent_usage_penalty;
  
  return Math.max(0, Math.min(100, score));
}
```

## 🏋️ Motor de Rutinas de Entrenamiento

### Generador de Sesiones

```typescript
function generateWorkoutSession(user: User, template: WorkoutTemplate, week_number: number): WorkoutSession {
  // Ajustar intensidad según progresión
  const progression_factor = calculateProgressionFactor(user, week_number);
  
  // Generar bloques del entrenamiento
  const warmup = generateWarmupBlock(template.warmup_template);
  const main_blocks = template.main_blocks.map(block => 
    adaptBlockToUser(block, user.equipment_available, progression_factor)
  );
  const cooldown = generateCooldownBlock(template.cooldown_template);
  
  // Calcular duración estimada
  const estimated_duration = calculateTotalDuration(warmup, main_blocks, cooldown);
  
  // Estimar calorías quemadas
  const estimated_kcal = estimateCaloriesBurned(main_blocks, user.weight_kg, estimated_duration);
  
  return {
    id: generateId(),
    date: new Date(), // Se asignará al programar
    workout_type: template.type,
    warmup,
    main_blocks,
    cooldown,
    estimated_duration_min: estimated_duration,
    estimated_kcal_burned: estimated_kcal,
    completed: false
  };
}

function adaptBlockToUser(block: ExerciseBlockTemplate, available_equipment: EquipmentType[], progression_factor: number): ExerciseBlock {
  const adapted_exercises: Exercise[] = [];
  
  for (const exercise_template of block.exercises) {
    // Verificar si el usuario tiene el equipamiento necesario
    const has_equipment = exercise_template.equipment_required.every(eq => 
      available_equipment.includes(eq)
    );
    
    let final_exercise: Exercise;
    
    if (has_equipment) {
      // Usar ejercicio original con progresión aplicada
      final_exercise = applyProgression(exercise_template, progression_factor);
    } else {
      // Buscar sustituto con equipamiento disponible
      const substitute = findExerciseSubstitute(
        exercise_template.target_muscle_groups,
        available_equipment
      );
      final_exercise = applyProgression(substitute, progression_factor);
    }
    
    adapted_exercises.push(final_exercise);
  }
  
  return {
    name: block.name,
    type: block.type,
    duration_min: block.duration_min,
    rounds: block.rounds,
    rest_between_rounds_sec: block.rest_between_rounds_sec,
    exercises: adapted_exercises
  };
}
```

## 📊 Sistema de Progresión y Tracking

### Analizador de Progreso Semanal

```typescript
function analyzeWeeklyProgress(user: User, week_data: WeeklyData): ProgressAnalysis {
  const analysis: ProgressAnalysis = {
    weight_trend: analyzeWeightTrend(week_data.weight_measurements),
    adherence_score: calculateAdherenceScore(week_data),
    recommendations: [],
    adjustments: []
  };
  
  // Aplicar reglas de progresión
  for (const rule of PROGRESS_RULES) {
    if (evaluateRule(rule, analysis, week_data)) {
      const action = executeRule(rule, user, analysis);
      analysis.recommendations.push(action.message);
      
      if (action.adjustment) {
        analysis.adjustments.push(action.adjustment);
      }
    }
  }
  
  return analysis;
}

const PROGRESS_RULES: ProgressRule[] = [
  {
    id: 'rapid_weight_loss',
    condition: 'weight_loss_pct > 1.0 && consecutive_weeks >= 1',
    action: 'increase_kcal',
    adjustment_pct: 5,
    priority: 1,
    message: 'Pérdida de peso muy rápida. Aumentando calorías 5% para preservar masa muscular.'
  },
  {
    id: 'stalled_weight_loss',
    condition: 'weight_loss_pct < 0.25 && consecutive_weeks >= 2 && goal === "lose_weight"',
    action: 'decrease_kcal',
    adjustment_pct: 5,
    priority: 2,
    message: 'Pérdida de peso estancada. Reduciendo calorías 5% para reactivar déficit.'
  },
  {
    id: 'low_protein_adherence',
    condition: 'protein_adherence_days < 4',
    action: 'alert',
    priority: 3,
    message: 'Bajo consumo de proteína. Considera agregar un snack proteico post-entrenamiento.'
  },
  {
    id: 'high_rpe_sustained',
    condition: 'avg_rpe >= 8 && consecutive_weeks >= 2',
    action: 'reduce_training_volume',
    adjustment_pct: 10,
    priority: 2,
    message: 'RPE alto sostenido. Reduciendo volumen de entrenamiento 10% para mejor recuperación.'
  }
];

function evaluateRule(rule: ProgressRule, analysis: ProgressAnalysis, week_data: WeeklyData): boolean {
  // Parse y evalúa la condición de la regla
  // Esto sería un evaluador de expresiones más complejo en implementación real
  
  switch (rule.id) {
    case 'rapid_weight_loss':
      return analysis.weight_trend.loss_pct_per_week > 1.0;
      
    case 'stalled_weight_loss':
      return analysis.weight_trend.loss_pct_per_week < 0.25 && 
             analysis.weight_trend.consecutive_low_weeks >= 2;
             
    case 'low_protein_adherence':
      return week_data.nutrition_adherence.protein_target_days < 4;
      
    case 'high_rpe_sustained':
      return week_data.training_data.avg_rpe >= 8 && 
             week_data.training_data.consecutive_high_rpe_weeks >= 2;
             
    default:
      return false;
  }
}
```

## 🛒 Generador de Lista de Compras

### Optimizador de Precios por Tienda

```typescript
function optimizeShoppingDistribution(consolidated_items: ShoppingItem[], user: User): StoreDistribution {
  const distribution: StoreDistribution = {
    supermercado: [],
    feria: [],
    almacen_baes: []
  };
  
  for (const item of consolidated_items) {
    const best_option = findBestStoreOption(item, user);
    distribution[best_option.store].push({
      ...item,
      final_store: best_option.store,
      final_price: best_option.price,
      savings: item.store_prices[0].base_price_per_unit - best_option.price
    });
  }
  
  // Validar mínimos de compra y consolidar
  return validateAndConsolidateDistribution(distribution, user);
}

function findBestStoreOption(item: ShoppingItem, user: User): StoreOption {
  let best_option: StoreOption | null = null;
  
  for (const store_price of item.store_prices) {
    // Aplicar descuentos según usuario
    let final_price = store_price.base_price_per_unit;
    
    // Descuento BAES
    if (store_price.store === 'almacen_baes' && user.preferences.baes_eligible) {
      final_price *= 0.75; // 25% descuento
    }
    
    // Descuento por volumen
    if (item.total_quantity_needed > 1000) { // >1kg
      final_price *= 0.85; // 15% descuento por volumen
    }
    
    // Descuento estacional (simulado)
    if (isSeasonalDiscount(item.food_item_id)) {
      final_price *= 0.80; // 20% descuento temporal
    }
    
    const option: StoreOption = {
      store: store_price.store,
      price: final_price,
      quality_score: store_price.quality_score,
      availability: store_price.availability
    };
    
    // Evaluar mejor opción considerando precio, calidad y disponibilidad
    if (!best_option || isOptionBetter(option, best_option, item.priority)) {
      best_option = option;
    }
  }
  
  return best_option!;
}

function isOptionBetter(option: StoreOption, current_best: StoreOption, item_priority: 'high' | 'medium' | 'low'): boolean {
  // Para items de alta prioridad, priorizar disponibilidad y calidad
  if (item_priority === 'high') {
    if (option.availability === 'in_stock' && current_best.availability !== 'in_stock') {
      return true;
    }
    
    if (option.quality_score > current_best.quality_score + 0.5) {
      return true;
    }
  }
  
  // Para todos los items, comparar precio ajustado por calidad
  const option_value = option.price / option.quality_score;
  const current_value = current_best.price / current_best.quality_score;
  
  return option_value < current_value;
}
```

## 🔌 Integración Google Calendar

### Exportador de Eventos

```typescript
class GoogleCalendarExporter {
  private auth_token: string | null = null;
  
  async exportWorkoutPlan(workout_plan: WorkoutPlan): Promise<CalendarEvent[]> {
    if (!this.auth_token) {
      throw new Error('Usuario no autenticado con Google');
    }
    
    const events: CalendarEvent[] = [];
    
    for (const session of workout_plan.sessions) {
      const event = this.createWorkoutEvent(session);
      const calendar_event = await this.createGoogleEvent(event);
      events.push(calendar_event);
    }
    
    return events;
  }
  
  private createWorkoutEvent(session: WorkoutSession): CalendarEvent {
    const start_time = session.date;
    const end_time = new Date(start_time.getTime() + session.estimated_duration_min * 60000);
    
    // Generar descripción detallada
    const description = this.generateWorkoutDescription(session);
    
    return {
      summary: `🏋️ ${session.workout_type.toUpperCase()} - ${session.estimated_duration_min}min`,
      description,
      start: {
        dateTime: start_time.toISOString(),
        timeZone: 'America/Santiago'
      },
      end: {
        dateTime: end_time.toISOString(),
        timeZone: 'America/Santiago'
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 15 },
          { method: 'popup', minutes: 5 }
        ]
      },
      colorId: this.getEventColor(session.workout_type)
    };
  }
  
  private generateWorkoutDescription(session: WorkoutSession): string {
    let description = `Entrenamiento de ${session.estimated_duration_min} minutos\n\n`;
    
    // Calentamiento
    description += `🔥 CALENTAMIENTO (${session.warmup.duration_min}min)\n`;
    session.warmup.exercises.forEach(ex => {
      description += `  • ${ex.name}: ${ex.duration_sec}s\n`;
    });
    
    // Bloques principales
    session.main_blocks.forEach((block, index) => {
      description += `\n💪 BLOQUE ${index + 1}: ${block.name}\n`;
      description += `   ${block.rounds} rondas, descanso ${block.rest_between_rounds_sec}s\n`;
      
      block.exercises.forEach(ex => {
        let exercise_detail = `  • ${ex.name}`;
        if (ex.reps) exercise_detail += `: ${ex.reps} reps`;
        if (ex.duration_sec) exercise_detail += `: ${ex.duration_sec}s`;
        if (ex.weight_kg) exercise_detail += ` @ ${ex.weight_kg}kg`;
        exercise_detail += '\n';
        description += exercise_detail;
      });
    });
    
    // Enfriamiento
    description += `\n🧘 ENFRIAMIENTO (${session.cooldown.duration_min}min)\n`;
    session.cooldown.exercises.forEach(ex => {
      description += `  • ${ex.name}: ${ex.duration_sec}s\n`;
    });
    
    description += `\n📊 Calorías estimadas: ${session.estimated_kcal_burned} kcal`;
    description += `\n🎯 Al finalizar, registra tu RPE (1-10) en NutriFit`;
    
    return description;
  }
  
  private getEventColor(workout_type: string): string {
    const color_map = {
      'hiit': '11',      // Rojo - Alta intensidad
      'cardio': '9',     // Azul - Resistencia
      'strength': '10',  // Verde - Fuerza
      'mixed': '5'       // Amarillo - Mixto
    };
    
    return color_map[workout_type] || '1';
  }
}
```

## 💾 Sistema de Persistencia

### Manager de IndexedDB

```typescript
class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'NutrifitDB';
  private readonly DB_VERSION = 1;
  
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.createStores(db);
      };
    });
  }
  
  private createStores(db: IDBDatabase): void {
    // Store para usuarios
    if (!db.objectStoreNames.contains('users')) {
      const userStore = db.createObjectStore('users', { keyPath: 'id' });
      userStore.createIndex('email', 'email', { unique: true });
    }
    
    // Store para planes alimentarios
    if (!db.objectStoreNames.contains('meal_plans')) {
      const mealPlanStore = db.createObjectStore('meal_plans', { keyPath: 'id' });
      mealPlanStore.createIndex('user_id', 'user_id');
      mealPlanStore.createIndex('start_date', 'start_date');
    }
    
    // Store para recetas
    if (!db.objectStoreNames.contains('recipes')) {
      const recipeStore = db.createObjectStore('recipes', { keyPath: 'id' });
      recipeStore.createIndex('category', 'category');
      recipeStore.createIndex('tags', 'tags', { multiEntry: true });
    }
    
    // Store para rutinas
    if (!db.objectStoreNames.contains('workout_plans')) {
      const workoutStore = db.createObjectStore('workout_plans', { keyPath: 'id' });
      workoutStore.createIndex('user_id', 'user_id');
    }
    
    // Store para mediciones
    if (!db.objectStoreNames.contains('measurements')) {
      const measurementStore = db.createObjectStore('measurements', { keyPath: 'id' });
      measurementStore.createIndex('user_id', 'user_id');
      measurementStore.createIndex('date', 'date');
    }
  }
  
  async save<T>(store_name: string, data: T): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }
      
      const transaction = this.db.transaction([store_name], 'readwrite');
      const store = transaction.objectStore(store_name);
      const request = store.put(data);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
  
  async get<T>(store_name: string, key: string): Promise<T | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }
      
      const transaction = this.db.transaction([store_name], 'readonly');
      const store = transaction.objectStore(store_name);
      const request = store.get(key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }
  
  async query<T>(store_name: string, index_name: string, value: any): Promise<T[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }
      
      const transaction = this.db.transaction([store_name], 'readonly');
      const store = transaction.objectStore(store_name);
      const index = store.index(index_name);
      const request = index.getAll(value);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }
}
```

## 🎮 Hooks Personalizados

### Hook para Manejo de Planes Alimentarios

```typescript
export function useMealPlans(user_id: string) {
  const queryClient = useQueryClient();
  
  // Query para obtener planes del usuario
  const plansQuery = useQuery({
    queryKey: ['meal-plans', user_id],
    queryFn: () => dataStorage.getUserMealPlans(user_id),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
  
  // Mutation para crear nuevo plan
  const createPlan = useMutation({
    mutationFn: async (plan_data: CreateMealPlanData) => {
      const new_plan = await generateMealPlan(plan_data.user, plan_data.duration_days);
      await dataStorage.saveMealPlan(new_plan);
      return new_plan;
    },
    onSuccess: (new_plan) => {
      queryClient.setQueryData(['meal-plans', user_id], (old: MealPlan[] = []) => [
        ...old,
        new_plan
      ]);
      
      queryClient.invalidateQueries(['meal-plans', user_id]);
    }
  });
  
  // Mutation para actualizar adherencia
  const updateAdherence = useMutation({
    mutationFn: async (update_data: AdherenceUpdate) => {
      const plan = await dataStorage.getMealPlan(update_data.plan_id);
      if (!plan) throw new Error('Plan not found');
      
      const updated_plan = updatePlanAdherence(plan, update_data);
      await dataStorage.saveMealPlan(updated_plan);
      return updated_plan;
    },
    onSuccess: (updated_plan) => {
      queryClient.setQueryData(['meal-plans', user_id], (old: MealPlan[] = []) =>
        old.map(plan => plan.id === updated_plan.id ? updated_plan : plan)
      );
    }
  });
  
  return {
    plans: plansQuery.data || [],
    loading: plansQuery.isLoading,
    error: plansQuery.error,
    createPlan: createPlan.mutate,
    updateAdherence: updateAdherence.mutate,
    isCreating: createPlan.isLoading,
    isUpdating: updateAdherence.isLoading
  };
}
```

## 🔧 Utilidades de Validación

### Validadores de Datos

```typescript
export const validators = {
  user: {
    validateBasicInfo: (user: Partial<User>): ValidationResult => {
      const errors: string[] = [];
      
      if (!user.name || user.name.length < 2) {
        errors.push('Nombre debe tener al menos 2 caracteres');
      }
      
      if (!user.email || !isValidEmail(user.email)) {
        errors.push('Email inválido');
      }
      
      if (!user.age || user.age < 14 || user.age > 100) {
        errors.push('Edad debe estar entre 14 y 100 años');
      }
      
      if (!user.height_cm || user.height_cm < 120 || user.height_cm > 250) {
        errors.push('Altura debe estar entre 120 y 250 cm');
      }
      
      if (!user.weight_kg || user.weight_kg < 30 || user.weight_kg > 300) {
        errors.push('Peso debe estar entre 30 y 300 kg');
      }
      
      return {
        valid: errors.length === 0,
        errors
      };
    }
  },
  
  recipe: {
    validateNutrition: (nutrition: RecipeNutrition): ValidationResult => {
      const errors: string[] = [];
      
      if (nutrition.kcal < 10 || nutrition.kcal > 2000) {
        errors.push('Calorías por porción fuera de rango válido (10-2000)');
      }
      
      if (nutrition.protein_g < 0 || nutrition.protein_g > 100) {
        errors.push('Proteína fuera de rango válido (0-100g)');
      }
      
      if (nutrition.fat_g < 0 || nutrition.fat_g > 100) {
        errors.push('Grasas fuera de rango válido (0-100g)');
      }
      
      if (nutrition.carbs_g < 0 || nutrition.carbs_g > 200) {
        errors.push('Carbohidratos fuera de rango válido (0-200g)');
      }
      
      // Verificar coherencia calórica
      const calculated_kcal = (nutrition.protein_g * 4) + (nutrition.fat_g * 9) + (nutrition.carbs_g * 4);
      const kcal_diff = Math.abs(calculated_kcal - nutrition.kcal);
      
      if (kcal_diff > nutrition.kcal * 0.15) { // Margen de error 15%
        errors.push('Información calórica inconsistente con macronutrientes');
      }
      
      return {
        valid: errors.length === 0,
        errors
      };
    }
  },
  
  mealPlan: {
    validateDaily: (day: MealPlanDay, targets: DailyTargets): ValidationResult => {
      const errors: string[] = [];
      
      // Verificar mínimos de calorías
      if (day.total_kcal < targets.kcal * 0.7) {
        errors.push('Calorías muy por debajo del objetivo (< 70%)');
      }
      
      if (day.total_kcal > targets.kcal * 1.3) {
        errors.push('Calorías muy por encima del objetivo (> 130%)');
      }
      
      // Verificar proteína mínima
      if (day.total_protein_g < targets.macros.protein_g * 0.8) {
        errors.push('Proteína insuficiente (< 80% del objetivo)');
      }
      
      // Verificar que tenga al menos 2 comidas
      if (day.meals.length < 2) {
        errors.push('Día debe tener al menos 2 comidas');
      }
      
      return {
        valid: errors.length === 0,
        errors
      };
    }
  }
};

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function isValidEmail(email: string): boolean {
  const email_regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return email_regex.test(email);
}
```

---

Esta documentación cubre los aspectos técnicos principales de NutriFit. Para información sobre instalación y uso, consulta el README principal.