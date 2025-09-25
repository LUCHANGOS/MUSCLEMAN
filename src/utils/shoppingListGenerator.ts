import { 
  User, 
  MealPlanDay, 
  ShoppingList, 
  ShoppingItem, 
  FoodItem, 
  Recipe 
} from '@/types';

/**
 * Configuración de precios por tienda (en pesos chilenos)
 * BAES = Beneficiarios de Asignación Familiar (descuentos sociales)
 */
interface StoreConfig {
  name: string;
  baes_discount: number; // porcentaje de descuento para BAES
  seasonal_discount: number; // descuento adicional por productos de temporada
  bulk_discount_threshold: number; // gramos mínimos para descuento por volumen
  bulk_discount_pct: number; // porcentaje descuento por volumen
  delivery_cost?: number; // costo envío si aplica
}

const STORE_CONFIGS: Record<string, StoreConfig> = {
  supermarket: {
    name: 'Supermercado',
    baes_discount: 0, // Sin descuento BAES
    seasonal_discount: 5,
    bulk_discount_threshold: 2000, // 2kg
    bulk_discount_pct: 8,
    delivery_cost: 2000
  },
  market: {
    name: 'Feria/Mercado',
    baes_discount: 15, // 15% descuento para BAES
    seasonal_discount: 20, // Mayor descuento en productos de temporada
    bulk_discount_threshold: 1000, // 1kg
    bulk_discount_pct: 12,
    delivery_cost: 0 // Sin costo de envío
  },
  baes: {
    name: 'Almacén BAES',
    baes_discount: 25, // 25% descuento base
    seasonal_discount: 10,
    bulk_discount_threshold: 500, // 500g
    bulk_discount_pct: 15,
    delivery_cost: 0
  }
};

/**
 * Ingrediente consolidado para compras
 */
interface ConsolidatedIngredient {
  food_id: string;
  total_grams: number;
  used_in_recipes: string[]; // IDs de recetas que lo usan
  priority: 'high' | 'medium' | 'low';
}

/**
 * Consolida ingredientes de múltiples planes alimentarios
 */
function consolidateIngredients(
  mealPlans: MealPlanDay[],
  recipes: Recipe[]
): ConsolidatedIngredient[] {
  const ingredientMap = new Map<string, ConsolidatedIngredient>();
  
  for (const plan of mealPlans) {
    for (const meal of plan.meals) {
      const recipe = recipes.find(r => r.id === meal.recipe_id);
      if (!recipe) continue;
      
      for (const ingredient of recipe.ingredients) {
        const totalGrams = ingredient.grams * meal.portions;
        const existing = ingredientMap.get(ingredient.food_id);
        
        if (existing) {
          existing.total_grams += totalGrams;
          if (!existing.used_in_recipes.includes(recipe.id)) {
            existing.used_in_recipes.push(recipe.id);
          }
        } else {
          ingredientMap.set(ingredient.food_id, {
            food_id: ingredient.food_id,
            total_grams: totalGrams,
            used_in_recipes: [recipe.id],
            priority: determineIngredientPriority(ingredient.food_id, totalGrams)
          });
        }
      }
    }
  }
  
  return Array.from(ingredientMap.values());
}

/**
 * Determina prioridad de ingrediente según uso y cantidad
 */
function determineIngredientPriority(
  foodId: string,
  totalGrams: number
): 'high' | 'medium' | 'low' {
  // Proteínas principales = alta prioridad
  const highPriorityFoods = ['chicken_breast', 'ground_beef_lean', 'white_fish', 'eggs', 'protein_powder'];
  if (highPriorityFoods.includes(foodId)) return 'high';
  
  // Verduras básicas con alta cantidad = media prioridad
  const mediumPriorityFoods = ['mushrooms', 'onion', 'zucchini', 'green_beans', 'cucumber'];
  if (mediumPriorityFoods.includes(foodId) && totalGrams >= 500) return 'medium';
  
  // Condimentos y pequeñas cantidades = baja prioridad
  return 'low';
}

/**
 * Calcula precio con descuentos aplicados
 */
function calculateDiscountedPrice(
  basePrice: number,
  foodItem: FoodItem,
  grams: number,
  storeConfig: StoreConfig,
  user: User,
  currentMonth: number
): {
  original_price: number;
  final_price: number;
  applied_discounts: string[];
} {
  const original_price = Math.round((basePrice / 1000) * grams); // precio por gramos
  let final_price = original_price;
  const applied_discounts: string[] = [];
  
  // Descuento BAES
  if (user.budget_level === 'low' && storeConfig.baes_discount > 0) {
    const discount = final_price * (storeConfig.baes_discount / 100);
    final_price -= discount;
    applied_discounts.push(`BAES ${storeConfig.baes_discount}%`);
  }
  
  // Descuento por temporada
  if (foodItem.seasonal_months?.includes(currentMonth)) {
    const discount = final_price * (storeConfig.seasonal_discount / 100);
    final_price -= discount;
    applied_discounts.push(`Temporada ${storeConfig.seasonal_discount}%`);
  }
  
  // Descuento por volumen
  if (grams >= storeConfig.bulk_discount_threshold) {
    const discount = final_price * (storeConfig.bulk_discount_pct / 100);
    final_price -= discount;
    applied_discounts.push(`Volumen ${storeConfig.bulk_discount_pct}%`);
  }
  
  return {
    original_price,
    final_price: Math.round(final_price),
    applied_discounts
  };
}

/**
 * Optimiza distribución de compras entre tiendas
 */
function optimizeStoreDistribution(
  consolidatedIngredients: ConsolidatedIngredient[],
  foodItems: FoodItem[],
  user: User
): {
  distribution: Record<string, ConsolidatedIngredient[]>;
  cost_breakdown: Record<string, number>;
  total_cost: number;
  total_savings: number;
} {
  const currentMonth = new Date().getMonth() + 1;
  const distribution: Record<string, ConsolidatedIngredient[]> = {};
  const cost_breakdown: Record<string, number> = {};
  let total_cost = 0;
  let total_savings = 0;
  
  // Inicializar distribución
  const availableStores = user.budget_level === 'low' 
    ? ['supermarket', 'market', 'baes'] 
    : ['supermarket', 'market'];
  
  for (const store of availableStores) {
    distribution[store] = [];
    cost_breakdown[store] = 0;
  }
  
  // Asignar cada ingrediente a la tienda más conveniente
  for (const ingredient of consolidatedIngredients) {
    const foodItem = foodItems.find(f => f.id === ingredient.food_id);
    if (!foodItem?.cost_per_kg) continue;
    
    let bestStore = 'market'; // Default
    let bestPrice = Infinity;
    let bestSavings = 0;
    
    // Comparar precio en cada tienda
    for (const storeKey of availableStores) {
      const storeConfig = STORE_CONFIGS[storeKey];
      const pricing = calculateDiscountedPrice(
        foodItem.cost_per_kg,
        foodItem,
        ingredient.total_grams,
        storeConfig,
        user,
        currentMonth
      );
      
      if (pricing.final_price < bestPrice) {
        bestPrice = pricing.final_price;
        bestStore = storeKey;
        bestSavings = pricing.original_price - pricing.final_price;
      }
    }
    
    // Asignar a la mejor tienda
    distribution[bestStore].push(ingredient);
    cost_breakdown[bestStore] += bestPrice;
    total_cost += bestPrice;
    total_savings += bestSavings;
  }
  
  // Agregar costos de envío
  for (const [storeKey, ingredients] of Object.entries(distribution)) {
    if (ingredients.length > 0) {
      const storeConfig = STORE_CONFIGS[storeKey];
      if (storeConfig.delivery_cost) {
        cost_breakdown[storeKey] += storeConfig.delivery_cost;
        total_cost += storeConfig.delivery_cost;
      }
    }
  }
  
  return {
    distribution,
    cost_breakdown,
    total_cost,
    total_savings
  };
}

/**
 * Genera lista de compras optimizada para una semana
 */
export function generateWeeklyShoppingList(
  user: User,
  mealPlans: MealPlanDay[],
  recipes: Recipe[],
  foodItems: FoodItem[],
  weekStart: string
): ShoppingList {
  try {
    // Consolidar ingredientes de todos los planes
    const consolidatedIngredients = consolidateIngredients(mealPlans, recipes);
    
    // Optimizar distribución entre tiendas
    const optimization = optimizeStoreDistribution(consolidatedIngredients, foodItems, user);
    
    // Crear items de compra
    const shoppingItems: ShoppingItem[] = [];
    
    for (const [storeKey, ingredients] of Object.entries(optimization.distribution)) {
      if (ingredients.length === 0) continue;
      
      const storeHint = storeKey as 'market' | 'supermarket' | 'baes';
      
      for (const ingredient of ingredients) {
        const foodItem = foodItems.find(f => f.id === ingredient.food_id);
        if (!foodItem) continue;
        
        // Calcular costo estimado
        const storeConfig = STORE_CONFIGS[storeKey];
        const currentMonth = new Date().getMonth() + 1;
        const pricing = calculateDiscountedPrice(
          foodItem.cost_per_kg || 0,
          foodItem,
          ingredient.total_grams,
          storeConfig,
          user,
          currentMonth
        );
        
        shoppingItems.push({
          food_id: ingredient.food_id,
          grams_total: ingredient.total_grams,
          store_hint: storeHint,
          priority: ingredient.priority,
          cost_estimate: pricing.final_price,
          purchased: false
        });
      }
    }
    
    // Determinar modo de tienda principal
    let store_mode: 'mixed' | 'supermarket' | 'market' | 'baes' = 'mixed';
    const storeCosts = Object.entries(optimization.cost_breakdown)
      .filter(([_, cost]) => cost > 0)
      .sort(([, a], [, b]) => b - a);
    
    if (storeCosts.length === 1) {
      store_mode = storeCosts[0][0] as any;
    } else if (user.budget_level === 'low') {
      store_mode = 'baes';
    }
    
    const shoppingList: ShoppingList = {
      id: `${user.id}_shopping_${weekStart}`,
      user_id: user.id,
      week_start: weekStart,
      items: shoppingItems,
      total_cost_estimate: optimization.total_cost,
      store_mode
    };
    
    return shoppingList;
    
  } catch (error) {
    console.error('Error generando lista de compras:', error);
    throw new Error('No se pudo generar la lista de compras');
  }
}

/**
 * Agrupa lista de compras por tienda para facilitar las compras
 */
export function groupShoppingListByStore(
  shoppingList: ShoppingList,
  foodItems: FoodItem[]
): Record<string, Array<ShoppingItem & { food_name: string; notes?: string }>> {
  const grouped: Record<string, Array<ShoppingItem & { food_name: string; notes?: string }>> = {};
  
  for (const item of shoppingList.items) {
    const foodItem = foodItems.find(f => f.id === item.food_id);
    if (!foodItem) continue;
    
    const storeKey = item.store_hint;
    if (!grouped[storeKey]) {
      grouped[storeKey] = [];
    }
    
    grouped[storeKey].push({
      ...item,
      food_name: foodItem.name,
      notes: generateShoppingNotes(item, foodItem)
    });
  }
  
  // Ordenar items por prioridad dentro de cada tienda
  for (const storeItems of Object.values(grouped)) {
    storeItems.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }
  
  return grouped;
}

/**
 * Genera notas útiles para cada item de compra
 */
function generateShoppingNotes(
  item: ShoppingItem,
  foodItem: FoodItem
): string {
  const notes: string[] = [];
  
  // Cantidad en unidades más amigables
  if (item.grams_total >= 1000) {
    const kg = Math.round((item.grams_total / 1000) * 10) / 10;
    notes.push(`${kg} kg aprox.`);
  } else {
    notes.push(`${item.grams_total}g`);
  }
  
  // Notas especiales por tipo de alimento
  if (item.food_id.includes('chicken')) {
    notes.push('Preferir pechuga sin piel');
  }
  if (item.food_id.includes('ground_beef')) {
    notes.push('Molida magra (90% carne)');
  }
  if (item.food_id.includes('fish')) {
    notes.push('Fresco o congelado');
  }
  if (item.food_id === 'eggs') {
    const dozens = Math.ceil(item.grams_total / 60 / 12); // ~60g por huevo
    notes.push(`${dozens} docena${dozens > 1 ? 's' : ''}`);
  }
  
  // Nota de temporada si aplica
  const currentMonth = new Date().getMonth() + 1;
  if (foodItem.seasonal_months?.includes(currentMonth)) {
    notes.push('¡De temporada!');
  }
  
  return notes.join(' • ');
}

/**
 * Genera sugerencias de batch cooking para la lista de compras
 */
export function generateBatchCookingSuggestions(
  shoppingList: ShoppingList,
  recipes: Recipe[]
): Array<{
  food_id: string;
  batch_size_kg: number;
  suggested_recipes: string[];
  prep_instructions: string[];
  storage_days: number;
}> {
  const batchSuggestions = [];
  const proteinItems = shoppingList.items.filter(item => 
    ['chicken_breast', 'ground_beef_lean', 'white_fish'].includes(item.food_id) &&
    item.grams_total >= 1000 // Mínimo 1kg para batch cooking
  );
  
  for (const item of proteinItems) {
    const batch_size_kg = Math.round(item.grams_total / 1000 * 10) / 10;
    const relatedRecipes = recipes.filter(recipe =>
      recipe.ingredients.some(ing => ing.food_id === item.food_id) &&
      recipe.tags.includes('batch_cooking')
    ).slice(0, 3); // Top 3 recetas
    
    let prep_instructions: string[] = [];
    let storage_days = 3;
    
    if (item.food_id === 'chicken_breast') {
      prep_instructions = [
        'Cocinar a la plancha en lotes grandes',
        'Cortar en porciones de 150g',
        'Envasar al vacío o en contenedores herméticos'
      ];
      storage_days = 4;
    } else if (item.food_id === 'ground_beef_lean') {
      prep_instructions = [
        'Cocinar la carne molida con cebolla',
        'Formar hamburguesas y congelar por separado',
        'Guardar en bolsas con fecha'
      ];
      storage_days = 5;
    }
    
    batchSuggestions.push({
      food_id: item.food_id,
      batch_size_kg,
      suggested_recipes: relatedRecipes.map(r => r.name),
      prep_instructions,
      storage_days
    });
  }
  
  return batchSuggestions;
}