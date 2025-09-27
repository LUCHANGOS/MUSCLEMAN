import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { OnboardingData } from '../../types';

interface EquipmentStepProps {
  onNext: () => void;
  onPrev: () => void;
}

const EquipmentStep: React.FC<EquipmentStepProps> = ({ onNext, onPrev }) => {
  const { onboardingData, updateEquipmentInfo } = useAuthStore();
  
  const [formData, setFormData] = useState<NonNullable<OnboardingData['equipmentInfo']>>({
    treadmill: false,
    dumbbells: false,
    dumbbells_weight_kg: undefined,
    jump_rope: false,
    yoga_mat: false,
    resistance_bands: false,
  });

  useEffect(() => {
    if (onboardingData.equipmentInfo) {
      setFormData(onboardingData.equipmentInfo);
    }
  }, [onboardingData.equipmentInfo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateEquipmentInfo(formData);
    onNext();
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Equipamiento Disponible
        </h2>
        <p className="text-gray-600">
          Selecciona el equipamiento que tienes disponible para personalizar tus rutinas.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={formData.treadmill}
              onChange={(e) => handleCheckboxChange('treadmill', e.target.checked)}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <span className="ml-3 text-sm font-medium">🏃‍♀️ Trotadora/Cinta</span>
          </label>

          <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={formData.jump_rope}
              onChange={(e) => handleCheckboxChange('jump_rope', e.target.checked)}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <span className="ml-3 text-sm font-medium">🪢 Cuerda para saltar</span>
          </label>

          <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={formData.yoga_mat}
              onChange={(e) => handleCheckboxChange('yoga_mat', e.target.checked)}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <span className="ml-3 text-sm font-medium">🧘‍♀️ Colchoneta/Mat</span>
          </label>

          <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={formData.resistance_bands}
              onChange={(e) => handleCheckboxChange('resistance_bands', e.target.checked)}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <span className="ml-3 text-sm font-medium">🏋️‍♀️ Bandas elásticas</span>
          </label>
        </div>

        <div className="border rounded-lg p-4">
          <label className="flex items-center mb-3">
            <input
              type="checkbox"
              checked={formData.dumbbells}
              onChange={(e) => handleCheckboxChange('dumbbells', e.target.checked)}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <span className="ml-3 text-sm font-medium">🏋️ Mancuernas/Pesas</span>
          </label>
          
          {formData.dumbbells && (
            <div className="ml-7">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Peso máximo disponible (kg)
              </label>
              <input
                type="number"
                min="0.5"
                max="50"
                step="0.5"
                value={formData.dumbbells_weight_kg || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, dumbbells_weight_kg: parseFloat(e.target.value) || undefined }))}
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="3"
              />
            </div>
          )}
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>No te preocupes:</strong> También crearemos rutinas que no requieren equipamiento especial, 
            usando solo el peso corporal y objetos caseros.
          </p>
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
            Siguiente: Horarios
          </button>
        </div>
      </form>
    </div>
  );
};

export default EquipmentStep;