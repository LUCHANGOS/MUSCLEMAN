import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { OnboardingData } from '../../types';

interface HealthInfoStepProps {
  onNext: () => void;
  onPrev: () => void;
}

const HealthInfoStep: React.FC<HealthInfoStepProps> = ({ onNext, onPrev }) => {
  const { onboardingData, updateHealthInfo } = useAuthStore();
  
  const [formData, setFormData] = useState<NonNullable<OnboardingData['healthInfo']>>({
    medical_conditions: [],
    allergies: [],
    medications: [],
    cholesterol_concerns: false,
    ldl: undefined,
    hdl: undefined,
    triglycerides: undefined,
    blood_pressure: '',
  });

  useEffect(() => {
    if (onboardingData.healthInfo) {
      setFormData(onboardingData.healthInfo);
    }
  }, [onboardingData.healthInfo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateHealthInfo(formData);
    onNext();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Información de Salud
        </h2>
        <p className="text-gray-600">
          Esta información es opcional pero nos ayuda a personalizar mejor tus recomendaciones.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="cholesterol_concerns"
              checked={formData.cholesterol_concerns}
              onChange={handleInputChange}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <span className="ml-3 text-sm font-medium text-gray-700">
              Tengo problemas de colesterol
            </span>
          </label>
        </div>

        {formData.cholesterol_concerns && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                LDL (Colesterol malo)
              </label>
              <input
                type="number"
                name="ldl"
                value={formData.ldl || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, ldl: parseFloat(e.target.value) || undefined }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="mg/dL"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                HDL (Colesterol bueno)
              </label>
              <input
                type="number"
                name="hdl"
                value={formData.hdl || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, hdl: parseFloat(e.target.value) || undefined }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="mg/dL"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Alergias alimentarias (separadas por coma)
          </label>
          <input
            type="text"
            value={formData.allergies.join(', ')}
            onChange={(e) => setFormData(prev => ({ ...prev, allergies: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            placeholder="Ej: nueces, mariscos, lactosa"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Condiciones médicas (separadas por coma)
          </label>
          <input
            type="text"
            value={formData.medical_conditions.join(', ')}
            onChange={(e) => setFormData(prev => ({ ...prev, medical_conditions: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            placeholder="Ej: diabetes, hipertensión"
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
            Siguiente: Preferencias
          </button>
        </div>
      </form>
    </div>
  );
};

export default HealthInfoStep;