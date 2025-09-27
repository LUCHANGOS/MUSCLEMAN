import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useMealPlanStore } from '../stores/mealPlanStore';
import { calculateAllMetrics } from '../utils/calculators';

const Dashboard: React.FC = () => {
  const { currentUser, onboardingData } = useAuthStore();
  const { getPlanByDate } = useMealPlanStore();
  const navigate = useNavigate();
  
  // Crear datos temporales hasta que se implemente el perfil completo
  const userData = {
    ...currentUser,
    ...onboardingData.personalInfo,
    kcal_target: onboardingData.personalInfo?.kcal_target || 1400,
    preferences: onboardingData.preferencesInfo || {
      no_oil: true,
      no_sugar: true,
      no_fried: true,
      likes: [],
      dislikes: [],
      budget_level: 'medium' as const,
      baes_mode: false
    },
    health: onboardingData.healthInfo || {
      medical_conditions: [],
      allergies: [],
      medications: [],
      cholesterol_concerns: false
    },
    equipment: onboardingData.equipmentInfo || {
      treadmill: false,
      dumbbells: false,
      jump_rope: false,
      yoga_mat: false,
      resistance_bands: false
    }
  };
  
  // Calcular métricas si tenemos datos suficientes
  const currentMetrics = userData.age && userData.height_cm && userData.weight_kg
    ? calculateAllMetrics({
        sex: userData.sex || 'female',
        age: userData.age,
        height_cm: userData.height_cm,
        weight_kg: userData.weight_kg,
        goal_weight_kg: userData.goal_weight_kg || userData.weight_kg,
        goal_date: userData.goal_date || new Date().toISOString().split('T')[0],
        kcal_target: userData.kcal_target || 1400,
        activity_level: userData.activity_level || 'moderate'
      } as any, getActivityFactor(userData.activity_level || 'moderate'))
    : null;
    
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
  
  function getGoalText(goal: string): string {
    switch (goal) {
      case 'lose_weight': return 'Perder peso saludablemente';
      case 'maintain': return 'Mantener peso actual';
      case 'gain_weight': return 'Aumentar peso';
      case 'gain_muscle': return 'Ganar masa muscular';
      default: return 'Mejorar salud general';
    }
  }
  
  function getActivityText(level: string): string {
    switch (level) {
      case 'sedentary': return 'Sedentario';
      case 'light': return 'Ligeramente activo';
      case 'moderate': return 'Moderadamente activo';
      case 'active': return 'Muy activo';
      case 'very_active': return 'Extremadamente activo';
      default: return 'Moderadamente activo';
    }
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Cargando perfil...</h2>
          <p className="mt-2 text-gray-600">Obteniendo tus datos personalizados</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Bienvenido a MUSCULOSO</h2>
          <p className="mt-2 text-gray-600">Configura tu perfil para comenzar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl">
          ¡Hola, {currentUser.name} {currentUser.lastName}! 👋
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Aquí tienes un resumen de tu progreso nutricional y de entrenamiento
        </p>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* IMC */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">IMC</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Índice de Masa Corporal</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {currentMetrics?.bmi?.toFixed(1) || '0.0'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* TMB */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">TMB</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Tasa Metabólica Basal</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {currentMetrics?.bmr?.toFixed(0) || '0'} kcal
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* GET */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">GET</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Gasto Energético Total</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {currentMetrics?.tdee?.toFixed(0) || '0'} kcal
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Objetivo calórico */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">🎯</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Objetivo Diario</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {userData.kcal_target || currentMetrics?.kcal_range?.target || 1400} kcal
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Macronutrientes objetivo */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Objetivos de Macronutrientes
          </h3>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {/* Proteína */}
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-medium">P</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">Proteína</p>
                  <p className="text-2xl font-bold text-red-900">{Math.round((userData.weight_kg || 70) * 1.8)}g</p>
                  <p className="text-xs text-red-600">25% del total</p>
                </div>
              </div>
            </div>

            {/* Grasas */}
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-medium">G</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-800">Grasas</p>
                  <p className="text-2xl font-bold text-yellow-900">{Math.round((userData.weight_kg || 70) * 0.7)}g</p>
                  <p className="text-xs text-yellow-600">30% del total</p>
                </div>
              </div>
            </div>

            {/* Carbohidratos */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-medium">C</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-800">Carbohidratos</p>
                  <p className="text-2xl font-bold text-blue-900">{Math.round(((userData.kcal_target || currentMetrics?.kcal_range?.target || 1400) * 0.45) / 4)}g</p>
                  <p className="text-xs text-blue-600">45% del total</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Plan del día */}
      {(() => {
        const todayPlan = getPlanByDate(new Date().toISOString().split('T')[0]);
        if (todayPlan) {
          return (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    🍽️ Plan de Hoy ({new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })})
                  </h3>
                  <div className="text-sm text-gray-500">
                    {todayPlan.totals.calories} / {todayPlan.target_calories} kcal
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {todayPlan.meals.map((meal, index) => (
                    <div key={index} className={`p-3 rounded-lg border-2 ${
                      meal.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="text-sm font-medium text-gray-900">
                        {meal.type === 'desayuno' ? '🍳 Desayuno' :
                         meal.type === 'almuerzo' ? '🍲 Almuerzo' :
                         meal.type === 'colacion' ? '🍎 Colación' : '🍽️ Cena'}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {meal.recipe.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {meal.recipe.calories} kcal • {meal.recipe.protein}g prot.
                      </div>
                      {meal.completed && (
                        <div className="text-xs text-green-600 mt-1 font-medium">✓ Completado</div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <button
                    onClick={() => navigate('/planes')}
                    className="text-sm text-green-600 hover:text-green-700"
                  >
                    Ver plan completo →
                  </button>
                  <div className="text-sm text-gray-500">
                    Progreso: {Math.round((todayPlan.totals.calories / todayPlan.target_calories) * 100)}%
                  </div>
                </div>
              </div>
            </div>
          );
        }
        return (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="text-center py-8">
                <h3 className="text-lg font-medium text-gray-900 mb-2">📋 No tienes plan para hoy</h3>
                <p className="text-gray-500 mb-4">Genera un plan alimentario personalizado para comenzar</p>
                <button
                  onClick={() => navigate('/planes')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                >
                  Generar Plan del Día
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Acciones rápidas */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Acciones Rápidas
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <button 
              onClick={() => navigate('/planes')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              📋 Generar Plan
            </button>
            <button 
              onClick={() => navigate('/entrenamientos')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              🏋️ Nueva Rutina
            </button>
            <button 
              onClick={() => navigate('/compras')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              🛒 Lista de Compras
            </button>
            <button 
              onClick={() => navigate('/progreso')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              📊 Ver Progreso
            </button>
          </div>
        </div>
      </div>

      {/* Información del perfil */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Información del Perfil
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-gray-500">Edad</p>
              <p className="text-sm text-gray-900">{userData.age || 'No especificado'} {userData.age ? 'años' : ''}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Altura</p>
              <p className="text-sm text-gray-900">{userData.height_cm || 'No especificado'} {userData.height_cm ? 'cm' : ''}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Peso</p>
              <p className="text-sm text-gray-900">{userData.weight_kg || 'No especificado'} {userData.weight_kg ? 'kg' : ''}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Objetivo</p>
              <p className="text-sm text-gray-900">
                {getGoalText(userData.goal_type || 'lose_weight')}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Nivel de Actividad</p>
              <p className="text-sm text-gray-900">
                {getActivityText(userData.activity_level || 'moderate')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;