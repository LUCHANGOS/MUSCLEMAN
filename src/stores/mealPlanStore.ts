import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Interface para el plan diario
export interface MealPlan {
  id: string;
  user_id: string;
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

interface MealPlanState {
  // Estado
  currentPlans: MealPlan[];
  isLoading: boolean;
  error: string | null;
  
  // Acciones
  setPlans: (plans: MealPlan[]) => void;
  addPlan: (plan: MealPlan) => void;
  updatePlan: (planId: string, updates: Partial<MealPlan>) => void;
  deletePlan: (planId: string) => void;
  toggleMealCompletion: (planId: string, mealIndex: number) => void;
  getPlansByDateRange: (startDate: string, endDate: string) => MealPlan[];
  getPlanByDate: (date: string) => MealPlan | null;
  clearAllPlans: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useMealPlanStore = create<MealPlanState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      currentPlans: [],
      isLoading: false,
      error: null,

      // Establecer planes
      setPlans: (plans: MealPlan[]) => {
        set({ currentPlans: plans, error: null });
      },

      // Agregar un plan
      addPlan: (plan: MealPlan) => {
        const { currentPlans } = get();
        const existingIndex = currentPlans.findIndex(p => p.id === plan.id);
        
        if (existingIndex >= 0) {
          // Reemplazar plan existente
          const newPlans = [...currentPlans];
          newPlans[existingIndex] = plan;
          set({ currentPlans: newPlans });
        } else {
          // Agregar nuevo plan
          set({ currentPlans: [...currentPlans, plan] });
        }
      },

      // Actualizar un plan
      updatePlan: (planId: string, updates: Partial<MealPlan>) => {
        const { currentPlans } = get();
        const updatedPlans = currentPlans.map(plan =>
          plan.id === planId ? { ...plan, ...updates } : plan
        );
        set({ currentPlans: updatedPlans });
      },

      // Eliminar un plan
      deletePlan: (planId: string) => {
        const { currentPlans } = get();
        set({ currentPlans: currentPlans.filter(plan => plan.id !== planId) });
      },

      // Alternar completado de una comida
      toggleMealCompletion: (planId: string, mealIndex: number) => {
        const { currentPlans } = get();
        const updatedPlans = currentPlans.map(plan => {
          if (plan.id === planId) {
            const updatedMeals = [...plan.meals];
            updatedMeals[mealIndex] = {
              ...updatedMeals[mealIndex],
              completed: !updatedMeals[mealIndex].completed
            };
            return { ...plan, meals: updatedMeals };
          }
          return plan;
        });
        set({ currentPlans: updatedPlans });
      },

      // Obtener planes por rango de fechas
      getPlansByDateRange: (startDate: string, endDate: string) => {
        const { currentPlans } = get();
        return currentPlans.filter(plan => 
          plan.date >= startDate && plan.date <= endDate
        ).sort((a, b) => a.date.localeCompare(b.date));
      },

      // Obtener plan por fecha específica
      getPlanByDate: (date: string) => {
        const { currentPlans } = get();
        return currentPlans.find(plan => plan.date === date) || null;
      },

      // Limpiar todos los planes
      clearAllPlans: () => {
        set({ currentPlans: [], error: null });
      },

      // Establecer estado de carga
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      // Establecer error
      setError: (error: string | null) => {
        set({ error });
      }
    }),
    {
      name: 'meal-plan-storage',
      partialize: (state) => ({
        currentPlans: state.currentPlans
      })
    }
  )
);