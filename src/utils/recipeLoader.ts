import { Recipe, FoodItem, RecipeTag } from '@/types';

/**
 * Interfaz para el formato de texto de las recetas
 */
export interface RecipeTextFormat {
  name: string;
  ingredients: string[];
  preparation: string[];
  nutrition: {
    kcal: number;
    protein: number;
    fat: number;
    carbs: number;
  };
}

/**
 * Parse una receta desde el formato de texto especificado
 * Formato esperado:
 * Nombre: [nombre de la receta]
 * 
 * Ingredientes:
 * [listado con gramajes]
 * 
 * Preparación:
 * [pasos breves]
 * 
 * Información Nutricional (por porción):
 * - Calorías: [kcal] kcal
 * - Proteína: [g] g
 * - Grasas: [g] g
 * - Carbohidratos: [g] g
 */
export function parseRecipeFromText(
  recipeText: string,
  category: 'desayuno' | 'almuerzo' | 'cena',
  recipeId: string
): RecipeTextFormat | null {
  try {
    const lines = recipeText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let currentSection = '';
    let name = '';
    const ingredients: string[] = [];
    const preparation: string[] = [];
    let nutrition = { kcal: 0, protein: 0, fat: 0, carbs: 0 };
    
    for (const line of lines) {
      // Detectar secciones
      if (line.startsWith('Nombre:')) {
        name = line.replace('Nombre:', '').trim();
        continue;
      }
      
      if (line === 'Ingredientes:') {
        currentSection = 'ingredients';
        continue;
      }
      
      if (line === 'Preparación:') {
        currentSection = 'preparation';
        continue;
      }
      
      if (line.includes('Información Nutricional')) {
        currentSection = 'nutrition';
        continue;
      }
      
      // Procesar contenido según sección
      switch (currentSection) {
        case 'ingredients':
          if (line.startsWith('-') || line.includes('g') || line.includes('ml') || line.includes('u')) {
            ingredients.push(line.replace(/^-\s*/, ''));
          }
          break;
          
        case 'preparation':
          if (line.length > 0 && !line.includes('Información Nutricional')) {
            preparation.push(line.replace(/^-\s*/, '').replace(/^\d+\.\s*/, ''));
          }
          break;
          
        case 'nutrition':
          if (line.includes('Calorías:')) {
            const match = line.match(/(\d+)\s*kcal/);
            if (match) nutrition.kcal = parseInt(match[1]);
          }
          if (line.includes('Proteína:')) {
            const match = line.match(/(\d+)\s*g/);
            if (match) nutrition.protein = parseInt(match[1]);
          }
          if (line.includes('Grasas:')) {
            const match = line.match(/(\d+)\s*g/);
            if (match) nutrition.fat = parseInt(match[1]);
          }
          if (line.includes('Carbohidratos:')) {
            const match = line.match(/(\d+)\s*g/);
            if (match) nutrition.carbs = parseInt(match[1]);
          }
          break;
      }
    }
    
    // Validar que tenemos datos mínimos
    if (!name || ingredients.length === 0 || preparation.length === 0 || nutrition.kcal === 0) {
      console.warn(`Receta ${recipeId} incompleta o mal formateada`);
      return null;
    }
    
    return { name, ingredients, preparation, nutrition };
  } catch (error) {
    console.error(`Error parseando receta ${recipeId}:`, error);
    return null;
  }
}

/**
 * Extrae gramajes de ingredientes desde texto
 * Ej: "Pechuga de pollo 150g" -> { ingredient: "Pechuga de pollo", grams: 150 }
 */
export function extractIngredientsWithGrams(ingredientText: string): { ingredient: string; grams: number; notes?: string } | null {
  // Patrones para detectar cantidades
  const patterns = [
    /(.+?)\s+(\d+)\s*g(?:ramos)?/i,
    /(.+?)\s+(\d+)\s*ml/i,
    /(.+?)\s+(\d+)\s*u(?:nidad|nidades)?/i,
    /(\d+)\s*g\s+(.+)/i,
    /(\d+)\s*ml\s+(.+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = ingredientText.match(pattern);
    if (match) {
      let ingredient = '';
      let grams = 0;
      let notes = '';
      
      if (pattern.source.includes('(.+?)\\s+')) {
        // El ingrediente está antes del número
        ingredient = match[1].trim();
        grams = parseInt(match[2]);
      } else {
        // El número está antes del ingrediente
        grams = parseInt(match[1]);
        ingredient = match[2].trim();
      }
      
      // Detectar notas opcionales
      if (ingredientText.toLowerCase().includes('opcional')) {
        notes = 'opcional';
      }
      if (ingredientText.toLowerCase().includes('al gusto')) {
        notes = 'al gusto';
      }
      
      return { ingredient: ingredient.toLowerCase(), grams, notes: notes || undefined };
    }
  }
  
  return null;
}

/**
 * Mapea ingredientes de texto a IDs de alimentos conocidos
 */
export function mapIngredientToFoodId(ingredientName: string, foodItems: FoodItem[]): string | null {
  const normalizedName = ingredientName.toLowerCase().trim();
  
  // Mapeo de sinónimos y variaciones comunes
  const synonyms: Record<string, string[]> = {
    'chicken_breast': ['pechuga', 'pechuga de pollo', 'pollo pechuga'],
    'eggs': ['huevo', 'huevos'],
    'ground_beef_lean': ['carne molida', 'carne molida magra', 'molida magra'],
    'mushrooms': ['champiñón', 'champiñones', 'champignon'],
    'onion': ['cebolla', 'cebolla blanca'],
    'zucchini': ['zapallo', 'zapallo italiano', 'zucchini'],
    'green_beans': ['porotos verdes', 'judías verdes', 'vainitas'],
    'cucumber': ['pepino'],
    'oats': ['avena'],
    'mandarin': ['mandarina'],
    'white_fish': ['pescado', 'pescado blanco'],
    'red_onion': ['cebolla morada', 'cebolla roja'],
    'cilantro': ['cilantro'],
    'lemon_juice': ['limón', 'jugo de limón'],
    'avocado': ['palta', 'aguacate'],
    'protein_powder': ['proteína', 'proteína en polvo', 'whey']
  };
  
  // Buscar en sinónimos
  for (const [foodId, variations] of Object.entries(synonyms)) {
    if (variations.some(variation => normalizedName.includes(variation))) {
      return foodId;
    }
  }
  
  // Buscar coincidencia directa en nombres de alimentos
  const directMatch = foodItems.find(food => 
    normalizedName.includes(food.name.toLowerCase()) || 
    food.name.toLowerCase().includes(normalizedName)
  );
  
  return directMatch?.id || null;
}

/**
 * Determina tags automáticos basados en el contenido de la receta
 */
export function autoDetectTags(
  name: string,
  ingredients: string[],
  preparation: string[],
  nutrition: { kcal: number; protein: number; fat: number; carbs: number },
  category: string
): RecipeTag[] {
  const tags: RecipeTag[] = [];
  const fullText = [name, ...ingredients, ...preparation].join(' ').toLowerCase();
  
  // Sin aceite (por defecto para todas las recetas de la app)
  if (!fullText.includes('aceite') && !fullText.includes('fritar')) {
    tags.push('sin_aceite');
  }
  
  // Sin azúcar
  if (!fullText.includes('azúcar') && !fullText.includes('miel') && !fullText.includes('endulzante')) {
    tags.push('sin_azucar');
  }
  
  // Budget (ingredientes económicos)
  const budgetIngredients = ['huevo', 'avena', 'pollo', 'cebolla', 'zapallo'];
  if (budgetIngredients.some(ing => fullText.includes(ing))) {
    tags.push('budget');
  }
  
  // Alta proteína (>20g por porción)
  if (nutrition.protein >= 20) {
    tags.push('alta_prote');
  }
  
  // Rápida (tiempo total < 15 min)
  if (fullText.includes('rápida') || fullText.includes('minutos') || category === 'colacion') {
    tags.push('rapida');
  }
  
  // Social (eventos)
  if (fullText.includes('social') || fullText.includes('ceviche') || fullText.includes('eventos')) {
    tags.push('social');
  }
  
  // Colesterol friendly
  const healthyIngredients = ['pescado', 'palta', 'avena'];
  if (healthyIngredients.some(ing => fullText.includes(ing))) {
    tags.push('colesterol_friendly');
  }
  
  // Batch cooking
  if (fullText.includes('batch') || fullText.includes('masiva') || fullText.includes('porciones')) {
    tags.push('batch_cooking');
  }
  
  // Bajo sodio
  if (nutrition.protein > 25 && !fullText.includes('sal') && !fullText.includes('embutido')) {
    tags.push('bajo_sodio');
  }
  
  return tags;
}

/**
 * Estima costo de una receta basado en los ingredientes
 */
export function estimateRecipeCost(ingredients: string[], foodItems: FoodItem[]): number {
  let totalCost = 0;
  
  for (const ingredientText of ingredients) {
    const parsed = extractIngredientsWithGrams(ingredientText);
    if (parsed) {
      const foodId = mapIngredientToFoodId(parsed.ingredient, foodItems);
      const food = foodItems.find(f => f.id === foodId);
      
      if (food && food.cost_per_kg) {
        const costPerGram = food.cost_per_kg / 1000;
        totalCost += costPerGram * parsed.grams;
      }
    }
  }
  
  return Math.round(totalCost);
}

/**
 * Función principal para cargar recetas desde archivos de texto
 */
export async function loadRecipeFromFile(
  fileContent: string,
  filename: string,
  category: 'desayuno' | 'almuerzo' | 'cena',
  foodItems: FoodItem[]
): Promise<Recipe | null> {
  const recipeId = filename.replace('.txt', '').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  
  const parsedRecipe = parseRecipeFromText(fileContent, category, recipeId);
  if (!parsedRecipe) return null;
  
  // Convertir ingredientes de texto a estructura Recipe
  const recipeIngredients = parsedRecipe.ingredients
    .map(ingredientText => {
      const parsed = extractIngredientsWithGrams(ingredientText);
      if (!parsed) return null;
      
      const foodId = mapIngredientToFoodId(parsed.ingredient, foodItems);
      if (!foodId) return null;
      
      return {
        food_id: foodId,
        grams: parsed.grams,
        notes: parsed.notes
      };
    })
    .filter(Boolean);
  
  if (recipeIngredients.length === 0) {
    console.warn(`No se pudieron mapear ingredientes para ${filename}`);
    return null;
  }
  
  const tags = autoDetectTags(
    parsedRecipe.name,
    parsedRecipe.ingredients,
    parsedRecipe.preparation,
    parsedRecipe.nutrition,
    category
  );
  
  const costEstimate = estimateRecipeCost(parsedRecipe.ingredients, foodItems);
  
  const recipe: Recipe = {
    id: `${category}_${recipeId}`,
    name: parsedRecipe.name,
    category,
    tags,
    ingredients: recipeIngredients as any[], // Type assertion para evitar errores de TS
    steps: parsedRecipe.preparation,
    per_portion: {
      kcal: parsedRecipe.nutrition.kcal,
      protein: parsedRecipe.nutrition.protein,
      fat: parsedRecipe.nutrition.fat,
      carbs: parsedRecipe.nutrition.carbs,
      fiber: Math.round(parsedRecipe.nutrition.carbs * 0.1), // Estimado
    },
    portions: 1,
    prep_time_min: tags.includes('rapida') ? 10 : 20,
    cooking_time_min: tags.includes('rapida') ? 5 : 15,
    cost_estimate: costEstimate,
  };
  
  return recipe;
}