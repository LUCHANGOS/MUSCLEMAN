import React from 'react';

const Progress: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl">
          Seguimiento de Progreso
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Análisis automático de tu evolución sin IA
        </p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            📊 Análisis de Progreso
          </h3>
          <p className="text-gray-500 mb-4">
            Sistema de tracking con reglas determinísticas para ajustes automáticos
          </p>
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700">
            Ver Análisis Semanal
          </button>
        </div>
      </div>
    </div>
  );
};

export default Progress;