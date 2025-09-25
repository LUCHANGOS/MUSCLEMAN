import React from 'react';

const Workouts: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl">
          Rutinas de Entrenamiento
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Rutinas personalizadas según tu equipamiento y nivel
        </p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            🏋️ Rutinas Personalizadas
          </h3>
          <p className="text-gray-500 mb-4">
            Próximamente: 5 plantillas de entrenamiento con progresión automática
          </p>
          <div className="space-x-2">
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700">
              HIIT Corto
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
              Cardio Continuo
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700">
              Fuerza en Casa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Workouts;