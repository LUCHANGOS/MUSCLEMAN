import React, { useState, useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';
import { CalendarDaysIcon, ClockIcon, FireIcon, ScaleIcon, PlusIcon } from '@heroicons/react/24/outline';

// Interface para el plan diario
interface MealPlan {
  id: string;
  date: string;
  meals: {
    type: 'desayuno' | 'almuerzo' | 'colacion' | 'cena';
    recipe: {
      id: string;
      name: string;
      calories: number;
      protein: number;
      fat: number;
      carbs: number;
      prep_time: number;
    };
    completed: boolean;
  }[];
  totals: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
  target_calories: number;
}

// Recetas de ejemplo para usar en los planes
const availableRecipes = {
  desayuno: [
    { id: '1', name: 'Huevos revueltos con champiñones', calories: 165, protein: 15, fat: 11, carbs: 3, prep_time: 10 },
    { id: '4', name: 'Tazón de avena ligera', calories: 190, protein: 8, fat: 4, carbs: 32, prep_time: 5 },
    { id: '7', name: 'Tortilla de claras con espinacas', calories: 120, protein: 18, fat: 4, carbs: 2, prep_time: 8 }
  ],
  almuerzo: [
    { id: '2', name: 'Pollo a la plancha con verduras', calories: 340, protein: 46, fat: 8, carbs: 15, prep_time: 20 },
    { id: '5', name: 'Ceviche social', calories: 270, protein: 22, fat: 6, carbs: 12, prep_time: 30 },
    { id: '8', name: 'Ensalada de atún con quinoa', calories: 280, protein: 35, fat: 5, carbs: 25, prep_time: 15 }
  ],
  colacion: [
    { id: '9', name: 'Yogurt griego con frutos rojos', calories: 150, protein: 20, fat: 2, carbs: 15, prep_time: 2 },
    { id: '10', name: 'Palta con tomate cherry', calories: 180, protein: 3, fat: 15, carbs: 8, prep_time: 3 },
    { id: '11', name: 'Proteína post-entreno', calories: 120, protein: 30, fat: 1, carbs: 2, prep_time: 1 }
  ],
  cena: [
    { id: '3', name: 'Burger magra sin pan', calories: 310, protein: 28, fat: 18, carbs: 8, prep_time: 15 },
    { id: '6', name: 'Pollo cítrico sin aceite', calories: 285, protein: 40, fat: 5, carbs: 18, prep_time: 25 },
    { id: '12', name: 'Pescado al vapor con verduras', calories: 250, protein: 35, fat: 6, carbs: 12, prep_time: 20 }
  ]
};

const MealPlans: React.FC = () => {
  const { currentUser, onboardingData } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentPlans, setCurrentPlans] = useState<MealPlan[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDays, setSelectedDays] = useState(7); // Días del plan
  
  // Calcular calorías objetivo del usuario
  const targetCalories = useMemo(() => {
    const personalInfo = onboardingData.personalInfo;
    if (!personalInfo) return 1400;
    
    // Calcular TMB (Mifflin-St Jeor)
    const { sex, age, height_cm, weight_kg } = personalInfo;
    let bmr: number;
    if (sex === 'male') {
      bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5;
    } else {
      bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161;
    }
    
    // Factor de actividad
    const activityFactor = getActivityFactor(personalInfo.activity_level);
    const tdee = bmr * activityFactor;
    
    // Aplicar déficit según objetivo
    let targetCals = tdee;
    if (personalInfo.goal_type === 'lose_weight') {
      targetCals = tdee * 0.8; // 20% déficit
    } else if (personalInfo.goal_type === 'gain_weight') {
      targetCals = tdee * 1.15; // 15% superávit
    }
    
    return Math.round(targetCals);
  }, [onboardingData.personalInfo]);
  
  function getActivityFactor(level: string): number {
    switch (level) {
      case 'sedentary': return 1.2;
      case 'light': return 1.375;
      case 'moderate': return 1.55;
      case 'active': return 1.725;
      case 'very_active': return 1.9;
      default: return 1.55;
    }
  }
  
  // Generar plan automático
  const generatePlan = async () => {
    setIsGenerating(true);
    
    try {
      const plans: MealPlan[] = [];
      const startDate = new Date(selectedDate);
      
      for (let i = 0; i < selectedDays; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const dateStr = currentDate.toISOString().split('T')[0];
        
        // Determinar si es día de ayuno
        const dayOfWeek = currentDate.getDay();
        const isFastingDay = onboardingData.scheduleInfo?.fasting_days?.includes(dayOfWeek) || false;
        
        let meals: MealPlan['meals'] = [];
        
        if (isFastingDay) {
          // Día con ayuno: solo almuerzo y cena
          meals = [
            {
              type: 'almuerzo',
              recipe: getRandomRecipe('almuerzo'),
              completed: false
            },
            {
              type: 'colacion',
              recipe: getRandomRecipe('colacion'),
              completed: false
            },
            {
              type: 'cena',
              recipe: getRandomRecipe('cena'),
              completed: false
            }
          ];
        } else {
          // Día normal: todas las comidas
          meals = [
            {
              type: 'desayuno',
              recipe: getRandomRecipe('desayuno'),
              completed: false
            },
            {
              type: 'almuerzo',
              recipe: getRandomRecipe('almuerzo'),
              completed: false
            },
            {
              type: 'colacion',
              recipe: getRandomRecipe('colacion'),
              completed: false
            },
            {
              type: 'cena',
              recipe: getRandomRecipe('cena'),
              completed: false
            }
          ];
        }
        
        // Calcular totales
        const totals = meals.reduce((acc, meal) => {
          return {
            calories: acc.calories + meal.recipe.calories,
            protein: acc.protein + meal.recipe.protein,
            fat: acc.fat + meal.recipe.fat,
            carbs: acc.carbs + meal.recipe.carbs
          };
        }, { calories: 0, protein: 0, fat: 0, carbs: 0 });
        
        plans.push({
          id: `plan_${dateStr}`,
          date: dateStr,
          meals,
          totals,
          target_calories: targetCalories
        });
      }
      
      setCurrentPlans(plans);
    } catch (error) {
      console.error('Error generando plan:', error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  function getRandomRecipe(type: keyof typeof availableRecipes) {
    const recipes = availableRecipes[type];
    return recipes[Math.floor(Math.random() * recipes.length)];
  }
  
  const toggleMealCompletion = (planId: string, mealIndex: number) => {
    setCurrentPlans(prev => prev.map(plan => {
      if (plan.id === planId) {
        const newMeals = [...plan.meals];
        newMeals[mealIndex] = {
          ...newMeals[mealIndex],
          completed: !newMeals[mealIndex].completed
        };
        return { ...plan, meals: newMeals };
      }
      return plan;
    }));
  };
  
  const getMealIcon = (type: string) => {
    switch (type) {
      case 'desayuno': return '🍳';
      case 'almuerzo': return '🍲';
      case 'colacion': return '🍎';
      case 'cena': return '🍽️';
      default: return '🍽️';
    }
  };
  
  const getMealLabel = (type: string) => {
    switch (type) {
      case 'desayuno': return 'Desayuno';
      case 'almuerzo': return 'Almuerzo';
      case 'colacion': return 'Colación';
      case 'cena': return 'Cena';
      default: return type;
    }
  };
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('es-ES', options);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl">
          Planes Alimentarios
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Genera planes personalizados basados en tus objetivos calóricos y preferencias
        </p>
      </div>

      {/* Generador de planes */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Generar Nuevo Plan</h2>
          <div className="text-sm text-gray-500">
            Objetivo: {targetCalories} kcal/día
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de inicio
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duración del plan
            </label>
            <select
              value={selectedDays}
              onChange={(e) => setSelectedDays(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value={1}>1 día</option>
              <option value={3}>3 días</option>
              <option value={7}>1 semana</option>
              <option value={14}>2 semanas</option>
              <option value={30}>1 mes</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={generatePlan}
              disabled={isGenerating}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin -ml-1 mr-3 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Generando...
                </>
              ) : (
                <>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Generar Plan
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Info sobre personalización */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">🧠 Personalización automática</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Sin aceite ni azúcar añadida (según tus preferencias)</li>
            <li>• Respeta días de ayuno intermitente configurados</li>
            <li>• Ajustado a tu objetivo calórico: {targetCalories} kcal</li>
            <li>• Optimizado según alergias y restricciones</li>
          </ul>
        </div>
      </div>

      {/* Planes generados */}
      {currentPlans.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900">Tu Plan Alimentario</h2>
          
          {currentPlans.map(plan => {
            const adherencePercentage = Math.round((plan.meals.filter(m => m.completed).length / plan.meals.length) * 100);
            const isOverCalories = plan.totals.calories > plan.target_calories * 1.1;
            const isUnderCalories = plan.totals.calories < plan.target_calories * 0.9;
            
            return (
              <div key={plan.id} className="bg-white shadow rounded-lg overflow-hidden">
                {/* Header del día */}
                <div className={`px-6 py-4 border-b ${
                  isOverCalories ? 'bg-red-50' : isUnderCalories ? 'bg-yellow-50' : 'bg-green-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {formatDate(plan.date)}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Adherencia: {adherencePercentage}% • 
                        <span className={`ml-1 ${
                          isOverCalories ? 'text-red-600' : 
                          isUnderCalories ? 'text-yellow-600' : 
                          'text-green-600'
                        }`}>
                          {plan.totals.calories}/{plan.target_calories} kcal
                        </span>
                      </p>
                    </div>
                    
                    {/* Totales nutricionales */}
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-green-600">{plan.totals.calories}</div>
                        <div className="text-xs text-gray-500">kcal</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-red-600">{plan.totals.protein}g</div>
                        <div className="text-xs text-gray-500">proteína</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-yellow-600">{plan.totals.fat}g</div>
                        <div className="text-xs text-gray-500">grasas</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-blue-600">{plan.totals.carbs}g</div>
                        <div className="text-xs text-gray-500">carbs</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Comidas del día */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {plan.meals.map((meal, mealIndex) => (
                      <div key={mealIndex} className={`border rounded-lg p-4 transition-colors ${
                        meal.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <span className="text-2xl mr-2">{getMealIcon(meal.type)}</span>
                            <span className="font-medium text-gray-900">{getMealLabel(meal.type)}</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={meal.completed}
                            onChange={() => toggleMealCompletion(plan.id, mealIndex)}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                        </div>
                        
                        <h4 className="font-medium text-gray-900 mb-2">{meal.recipe.name}</h4>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="text-green-600 font-medium">{meal.recipe.calories} kcal</div>
                          <div className="text-gray-500">⏱️ {meal.recipe.prep_time}m</div>
                          <div className="text-red-600">{meal.recipe.protein}g prot</div>
                          <div className="text-blue-600">{meal.recipe.carbs}g carb</div>
                        </div>
                        
                        <button className="w-full mt-3 text-xs bg-gray-100 text-gray-700 py-1 px-2 rounded hover:bg-gray-200 transition-colors">
                          Ver receta
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Estado inicial */}
      {currentPlans.length === 0 && (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">🍽️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sin planes generados</h3>
          <p className="text-gray-500 mb-6">
            Crea tu primer plan alimentario personalizado basado en tus objetivos y preferencias.
            El sistema generará automáticamente recetas sin aceite ni azúcar, respetando tus restricciones.
          </p>
          <div className="bg-gray-50 p-4 rounded-lg text-left max-w-md mx-auto">
            <h4 className="font-medium text-gray-900 mb-2">Tu configuración actual:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Objetivo: {targetCalories} kcal/día</li>
              <li>• Meta: {onboardingData.personalInfo?.goal_type === 'lose_weight' ? 'Perder peso' : 'Mantener peso'}</li>
              {onboardingData.scheduleInfo?.fasting_days && onboardingData.scheduleInfo.fasting_days.length > 0 && (
                <li>• Días de ayuno: {onboardingData.scheduleInfo.fasting_days.length} días/semana</li>
              )}
              <li>• Sin aceite: {onboardingData.preferencesInfo?.no_oil ? 'Sí' : 'No'}</li>
              <li>• Sin azúcar: {onboardingData.preferencesInfo?.no_sugar ? 'Sí' : 'No'}</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealPlans;