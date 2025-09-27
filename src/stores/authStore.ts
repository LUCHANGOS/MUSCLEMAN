import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthUser, RegisterFormData, LoginFormData, OnboardingData } from '../types';

interface AuthState {
  // Estado
  currentUser: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  onboardingData: OnboardingData;
  
  // Acciones de autenticación
  register: (userData: RegisterFormData) => Promise<boolean>;
  login: (loginData: LoginFormData) => Promise<boolean>;
  logout: () => void;
  
  // Acciones de onboarding
  updateOnboardingStep: (step: number) => void;
  updatePersonalInfo: (data: OnboardingData['personalInfo']) => void;
  updateHealthInfo: (data: OnboardingData['healthInfo']) => void;
  updatePreferencesInfo: (data: OnboardingData['preferencesInfo']) => void;
  updateEquipmentInfo: (data: OnboardingData['equipmentInfo']) => void;
  updateScheduleInfo: (data: OnboardingData['scheduleInfo']) => void;
  completeProfile: () => Promise<boolean>;
  
  // Utilidades
  clearError: () => void;
  reset: () => void;
}

const initialOnboardingData: OnboardingData = {
  currentStep: 1,
  totalSteps: 5,
  personalInfo: undefined,
  healthInfo: undefined,
  preferencesInfo: undefined,
  equipmentInfo: undefined,
  scheduleInfo: undefined,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      currentUser: null,
      isLoading: false,
      error: null,
      onboardingData: initialOnboardingData,
      
      // Registrar nuevo usuario
      register: async (userData: RegisterFormData) => {
        set({ isLoading: true, error: null });
        
        try {
          // Verificar que el teléfono sea único
          const existingUsers = JSON.parse(localStorage.getItem('nutrifit-registered-users') || '[]');
          const phoneExists = existingUsers.some((user: any) => user.phone === userData.phone);
          
          if (phoneExists) {
            set({ error: 'Este número de teléfono ya está registrado', isLoading: false });
            return false;
          }
          
          // Crear nuevo usuario
          const newUser: AuthUser = {
            id: `user_${Date.now()}`,
            name: userData.name,
            lastName: userData.lastName,
            phone: userData.phone,
            email: userData.email,
            isAuthenticated: true,
            profileCompleted: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          
          // Guardar en "base de datos" local
          existingUsers.push(newUser);
          localStorage.setItem('nutrifit-registered-users', JSON.stringify(existingUsers));
          
          set({ 
            currentUser: newUser, 
            isLoading: false,
            onboardingData: { ...initialOnboardingData } 
          });
          
          return true;
        } catch (error) {
          set({ error: 'Error al registrar usuario', isLoading: false });
          return false;
        }
      },
      
      // Iniciar sesión
      login: async (loginData: LoginFormData) => {
        set({ isLoading: true, error: null });
        
        try {
          const existingUsers = JSON.parse(localStorage.getItem('nutrifit-registered-users') || '[]');
          const user = existingUsers.find((u: AuthUser) => u.phone === loginData.phone);
          
          if (!user) {
            set({ error: 'Usuario no encontrado', isLoading: false });
            return false;
          }
          
          // Actualizar último acceso
          user.updated_at = new Date().toISOString();
          user.isAuthenticated = true;
          
          // Actualizar en storage
          const userIndex = existingUsers.findIndex((u: AuthUser) => u.id === user.id);
          existingUsers[userIndex] = user;
          localStorage.setItem('nutrifit-registered-users', JSON.stringify(existingUsers));
          
          set({ currentUser: user, isLoading: false });
          return true;
        } catch (error) {
          set({ error: 'Error al iniciar sesión', isLoading: false });
          return false;
        }
      },
      
      // Cerrar sesión
      logout: () => {
        set({ 
          currentUser: null, 
          onboardingData: initialOnboardingData,
          error: null 
        });
      },
      
      // Actualizar paso del onboarding
      updateOnboardingStep: (step: number) => {
        set((state) => ({
          onboardingData: { ...state.onboardingData, currentStep: step }
        }));
      },
      
      // Actualizar información personal
      updatePersonalInfo: (data: OnboardingData['personalInfo']) => {
        set((state) => ({
          onboardingData: { ...state.onboardingData, personalInfo: data }
        }));
      },
      
      // Actualizar información de salud
      updateHealthInfo: (data: OnboardingData['healthInfo']) => {
        set((state) => ({
          onboardingData: { ...state.onboardingData, healthInfo: data }
        }));
      },
      
      // Actualizar preferencias
      updatePreferencesInfo: (data: OnboardingData['preferencesInfo']) => {
        set((state) => ({
          onboardingData: { ...state.onboardingData, preferencesInfo: data }
        }));
      },
      
      // Actualizar equipamiento
      updateEquipmentInfo: (data: OnboardingData['equipmentInfo']) => {
        set((state) => ({
          onboardingData: { ...state.onboardingData, equipmentInfo: data }
        }));
      },
      
      // Actualizar horarios
      updateScheduleInfo: (data: OnboardingData['scheduleInfo']) => {
        set((state) => ({
          onboardingData: { ...state.onboardingData, scheduleInfo: data }
        }));
      },
      
      // Completar perfil y crear usuario completo
      completeProfile: async () => {
        const { currentUser, onboardingData } = get();
        
        if (!currentUser || !onboardingData.personalInfo) {
          set({ error: 'Datos incompletos para completar el perfil' });
          return false;
        }
        
        set({ isLoading: true });
        
        try {
          // Actualizar usuario con perfil completado
          const updatedUser: AuthUser = {
            ...currentUser,
            profileCompleted: true,
            updated_at: new Date().toISOString(),
          };
          
          // Guardar en storage
          const existingUsers = JSON.parse(localStorage.getItem('nutrifit-registered-users') || '[]');
          const userIndex = existingUsers.findIndex((u: AuthUser) => u.id === currentUser.id);
          if (userIndex !== -1) {
            existingUsers[userIndex] = updatedUser;
            localStorage.setItem('nutrifit-registered-users', JSON.stringify(existingUsers));
          }
          
          // Crear perfil completo en userStore (será manejado por otro store)
          set({ currentUser: updatedUser, isLoading: false });
          return true;
        } catch (error) {
          set({ error: 'Error al completar el perfil', isLoading: false });
          return false;
        }
      },
      
      // Limpiar error
      clearError: () => set({ error: null }),
      
      // Resetear estado
      reset: () => set({
        currentUser: null,
        isLoading: false,
        error: null,
        onboardingData: initialOnboardingData,
      }),
    }),
    {
      name: 'nutrifit-auth',
      partialize: (state) => ({
        currentUser: state.currentUser,
        onboardingData: state.onboardingData,
      }),
    }
  )
);