import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Metrics, AppConfig } from '@/types';
import { dataStorage, StorageUtils } from '@/utils/dataStorage';
import { calculateAllMetrics } from '@/utils/calculators';

interface UserState {
  // Estado
  currentUser: User | null;
  isAuthenticated: boolean;
  currentMetrics: Metrics | null;
  appConfig: AppConfig | null;
  isLoading: boolean;
  error: string | null;
  
  // Acciones
  setUser: (user: User) => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
  loadUserData: () => Promise<void>;
  setAppConfig: (config: AppConfig) => Promise<void>;
  refreshMetrics: () => void;
  clearError: () => void;
}

// Configuración por defecto de la aplicación
const DEFAULT_APP_CONFIG: AppConfig = {
  theme: 'light',
  units: {
    weight: 'kg',
    distance: 'km',
    temperature: 'celsius',
  },
  notifications_enabled: true,
  google_calendar_connected: false,
  data_export_format: 'json',
};

// Usuario demo para desarrollo (eliminar en producción)
const DEMO_USER: User = {
  id: 'demo_user_' + Date.now(),
  name: 'Usuario Demo',
  email: 'demo@nutrifit.app',
  authProvider: 'local',
  sex: 'female',
  age: 28,
  height_cm: 165,
  weight_kg: 70,
  goal_weight_kg: 65,
  goal_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 meses
  kcal_target: 1400,
  budget_level: 'medium',
  preferences: {
    no_oil: true,
    no_sugar: true,
    no_fried: true,
    dislikes: ['pescado', 'apio'],
    likes: ['pollo', 'huevo', 'avena'],
    avocado_daily_g: 20,
    nuts_weekly_servings: 2,
    fish_weekly_servings: 1, // Menos porque no le gusta
  },
  health: {
    ldl: 120,
    hdl: 45,
    tg: 150,
    allergies: [],
    intolerances: ['lactosa'],
    medical_notes: 'Objetivo: reducir LDL y mejorar composición corporal',
    doctor_approval: true,
  },
  equipment: {
    treadmill: true,
    dumbbells_kg: 3,
    rope: true,
    mat: true,
    resistance_bands: false,
  },
  timezone: 'America/Santiago',
  locale: 'es',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      currentUser: null,
      isAuthenticated: false,
      currentMetrics: null,
      appConfig: null,
      isLoading: false,
      error: null,

      // Establecer usuario y calcular métricas
      setUser: (user: User) => {
        const metrics = calculateAllMetrics(user, 1.55); // Factor de actividad moderado por defecto
        
        set({ 
          currentUser: user, 
          isAuthenticated: true, 
          currentMetrics: metrics,
          error: null 
        });
        
        // Guardar en almacenamiento persistente
        dataStorage.saveUser(user);
      },

      // Actualizar usuario
      updateUser: async (updates: Partial<User>) => {
        const { currentUser } = get();
        if (!currentUser) return;

        const updatedUser: User = {
          ...currentUser,
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        try {
          set({ isLoading: true, error: null });
          
          const success = await dataStorage.saveUser(updatedUser);
          if (success) {
            const metrics = calculateAllMetrics(updatedUser, 1.55);
            set({ 
              currentUser: updatedUser, 
              currentMetrics: metrics,
              isLoading: false 
            });
          } else {
            throw new Error('No se pudo guardar el usuario');
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Error desconocido',
            isLoading: false 
          });
        }
      },

      // Cerrar sesión
      logout: async () => {
        const { currentUser } = get();
        
        try {
          set({ isLoading: true });
          
          // Opcional: limpiar datos del usuario
          if (currentUser) {
            // Solo limpiar si el usuario lo solicita explícitamente
            // await dataStorage.clearUserData(currentUser.id);
          }
          
          set({
            currentUser: null,
            isAuthenticated: false,
            currentMetrics: null,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Error cerrando sesión',
            isLoading: false 
          });
        }
      },

      // Cargar datos del usuario al iniciar la aplicación
      loadUserData: async () => {
        try {
          set({ isLoading: true, error: null });
          
          // Por ahora, crear usuario demo
          // En producción, aquí cargarías desde almacenamiento o autenticación
          const demoUser = DEMO_USER;
          
          // Guardar usuario demo
          await dataStorage.saveUser(demoUser);
          
          // Cargar configuración
          let config = await dataStorage.getAppConfig();
          if (!config) {
            config = DEFAULT_APP_CONFIG;
            await dataStorage.saveAppConfig(config);
          }
          
          const metrics = calculateAllMetrics(demoUser, 1.55);
          
          set({
            currentUser: demoUser,
            isAuthenticated: true,
            currentMetrics: metrics,
            appConfig: config,
            isLoading: false,
          });
          
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Error cargando datos',
            isLoading: false 
          });
        }
      },

      // Configurar aplicación
      setAppConfig: async (config: AppConfig) => {
        try {
          const success = await dataStorage.saveAppConfig(config);
          if (success) {
            set({ appConfig: config });
          } else {
            throw new Error('No se pudo guardar la configuración');
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Error guardando configuración'
          });
        }
      },

      // Recalcular métricas (ej: cuando cambia factor de actividad)
      refreshMetrics: () => {
        const { currentUser } = get();
        if (currentUser) {
          const metrics = calculateAllMetrics(currentUser, 1.55);
          set({ currentMetrics: metrics });
        }
      },

      // Limpiar error
      clearError: () => set({ error: null }),
    }),
    {
      name: 'nutrifit-user-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        appConfig: state.appConfig,
      }),
    }
  )
);

// Hook para obtener información específica del usuario
export const useUserInfo = () => {
  const { currentUser, currentMetrics, isAuthenticated } = useUserStore();
  
  return {
    user: currentUser,
    metrics: currentMetrics,
    isAuthenticated,
    // Información derivada útil
    displayName: currentUser?.name || 'Usuario',
    weightGoal: currentUser ? (currentUser.goal_weight_kg - currentUser.weight_kg) : 0,
    isWeightLossGoal: currentUser ? currentUser.goal_weight_kg < currentUser.weight_kg : false,
    daysToGoal: currentUser ? Math.ceil((new Date(currentUser.goal_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0,
    bmiStatus: currentMetrics ? (
      currentMetrics.bmi < 18.5 ? 'Bajo peso' :
      currentMetrics.bmi < 25 ? 'Normal' :
      currentMetrics.bmi < 30 ? 'Sobrepeso' : 'Obesidad'
    ) : null,
  };
};

// Hook para acciones rápidas
export const useUserActions = () => {
  const { setUser, updateUser, logout, loadUserData, setAppConfig, refreshMetrics, clearError } = useUserStore();
  
  return {
    setUser,
    updateUser,
    logout,
    loadUserData,
    setAppConfig,
    refreshMetrics,
    clearError,
    // Acciones específicas útiles
    updateWeight: (newWeight: number) => updateUser({ weight_kg: newWeight }),
    updateGoalWeight: (goalWeight: number) => updateUser({ goal_weight_kg: goalWeight }),
    updateKcalTarget: (kcalTarget: number) => updateUser({ kcal_target: kcalTarget }),
  };
};