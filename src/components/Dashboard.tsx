import React, { useEffect } from 'react';
import { useUserStore } from '../stores/userStore';

const Dashboard: React.FC = () => {
  const { currentUser, currentMetrics, loadUserData, isLoading } = useUserStore();

  useEffect(() => {
    if (!currentUser) {
      loadUserData();
    }
  }, [currentUser, loadUserData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Bienvenido a NutriFit</h2>
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
          ¡Hola, {currentUser.name}! 👋
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
                    {currentUser.kcal_target || 1400} kcal
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
                  <p className="text-2xl font-bold text-red-900">{Math.round(currentUser.weight_kg * 1.8)}g</p>
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
                  <p className="text-2xl font-bold text-yellow-900">{Math.round(currentUser.weight_kg * 0.7)}g</p>
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
                  <p className="text-2xl font-bold text-blue-900">{Math.round(((currentUser.kcal_target || 1400) * 0.45) / 4)}g</p>
                  <p className="text-xs text-blue-600">45% del total</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Acciones Rápidas
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700">
              📋 Generar Plan
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
              🏋️ Nueva Rutina
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700">
              🛒 Lista de Compras
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700">
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
              <p className="text-sm text-gray-900">{currentUser.age} años</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Altura</p>
              <p className="text-sm text-gray-900">{currentUser.height_cm} cm</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Peso</p>
              <p className="text-sm text-gray-900">{currentUser.weight_kg} kg</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Objetivo</p>
              <p className="text-sm text-gray-900">
                Perder peso saludablemente
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Nivel de Actividad</p>
              <p className="text-sm text-gray-900">
                Moderadamente activa
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;