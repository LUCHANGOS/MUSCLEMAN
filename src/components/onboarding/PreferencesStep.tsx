import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { OnboardingData } from '../../types';

interface PreferencesStepProps {
  onNext: () => void;
  onPrev: () => void;
}

const PreferencesStep: React.FC<PreferencesStepProps> = ({ onNext, onPrev }) => {
  const { onboardingData, updatePreferencesInfo } = useAuthStore();
  
  const [formData, setFormData] = useState<NonNullable<OnboardingData['preferencesInfo']>>({
    no_oil: true,
    no_sugar: true,
    no_fried: true,
    likes: [],
    dislikes: [],
    budget_level: 'medium',
    baes_mode: false,
  });

  useEffect(() => {
    if (onboardingData.preferencesInfo) {
      setFormData(onboardingData.preferencesInfo);
    }
  }, [onboardingData.preferencesInfo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePreferencesInfo(formData);
    onNext();
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Preferencias Alimentarias
        </h2>
        <p className="text-gray-600">
          Configura tus preferencias para recibir recomendaciones personalizadas.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Restricciones alimentarias</h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.no_oil}
                onChange={(e) => handleCheckboxChange('no_oil', e.target.checked)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm text-gray-700">
                Sin aceite añadido (recomendado)
              </span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.no_sugar}
                onChange={(e) => handleCheckboxChange('no_sugar', e.target.checked)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm text-gray-700">
                Sin azúcar añadida (recomendado)
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.no_fried}
                onChange={(e) => handleCheckboxChange('no_fried', e.target.checked)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm text-gray-700">
                Sin frituras (recomendado)
              </span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nivel de presupuesto
          </label>
          <select
            value={formData.budget_level}
            onChange={(e) => setFormData(prev => ({ ...prev, budget_level: e.target.value as 'low' | 'medium' | 'high' }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="low">Económico</option>
            <option value="medium">Moderado</option>
            <option value="high">Sin restricción</option>
          </select>
        </div>

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.baes_mode}
              onChange={(e) => handleCheckboxChange('baes_mode', e.target.checked)}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <span className="ml-3 text-sm text-gray-700">
              Activar modo BAES (descuentos especiales)
            </span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Alimentos que me gustan (separados por coma)
          </label>
          <input
            type="text"
            value={formData.likes.join(', ')}
            onChange={(e) => setFormData(prev => ({ ...prev, likes: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            placeholder="Ej: pollo, pescado, verduras, frutos rojos"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Alimentos que no me gustan (separados por coma)
          </label>
          <input
            type="text"
            value={formData.dislikes.join(', ')}
            onChange={(e) => setFormData(prev => ({ ...prev, dislikes: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            placeholder="Ej: brócoli, pescado, lentejas"
          />
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={onPrev}
            className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Anterior
          </button>
          <button
            type="submit"
            className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Siguiente: Equipamiento
          </button>
        </div>
      </form>
    </div>
  );
};

export default PreferencesStep;