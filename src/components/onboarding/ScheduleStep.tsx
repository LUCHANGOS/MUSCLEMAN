import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { OnboardingData } from '../../types';

interface ScheduleStepProps {
  onPrev: () => void;
  onComplete: () => void;
  isLoading: boolean;
}

const ScheduleStep: React.FC<ScheduleStepProps> = ({ onPrev, onComplete, isLoading }) => {
  const { onboardingData, updateScheduleInfo } = useAuthStore();
  
  const [formData, setFormData] = useState<NonNullable<OnboardingData['scheduleInfo']>>({
    workout_time: '18:00',
    meal_times: {
      breakfast: '08:00',
      lunch: '13:00',
      snack: '16:00',
      dinner: '20:00',
    },
    fasting_days: [],
    weekly_workouts: 3,
  });

  useEffect(() => {
    if (onboardingData.scheduleInfo) {
      setFormData(onboardingData.scheduleInfo);
    }
  }, [onboardingData.scheduleInfo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    updateScheduleInfo(formData);
    
    // Pequeña pausa para guardar los datos
    setTimeout(() => {
      onComplete();
    }, 500);
  };

  const handleDayToggle = (day: number) => {
    setFormData(prev => ({
      ...prev,
      fasting_days: prev.fasting_days.includes(day)
        ? prev.fasting_days.filter(d => d !== day)
        : [...prev.fasting_days, day]
    }));
  };

  const daysOfWeek = [
    { value: 0, label: 'Dom' },
    { value: 1, label: 'Lun' },
    { value: 2, label: 'Mar' },
    { value: 3, label: 'Mié' },
    { value: 4, label: 'Jue' },
    { value: 5, label: 'Vie' },
    { value: 6, label: 'Sáb' }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Horarios y Objetivos
        </h2>
        <p className="text-gray-600">
          Configura tus horarios preferidos para optimizar tu plan diario.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Horarios de comidas */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Horarios de comidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Desayuno
              </label>
              <input
                type="time"
                value={formData.meal_times.breakfast || '08:00'}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  meal_times: { ...prev.meal_times, breakfast: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Almuerzo
              </label>
              <input
                type="time"
                value={formData.meal_times.lunch || '13:00'}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  meal_times: { ...prev.meal_times, lunch: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Colación
              </label>
              <input
                type="time"
                value={formData.meal_times.snack || '16:00'}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  meal_times: { ...prev.meal_times, snack: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cena
              </label>
              <input
                type="time"
                value={formData.meal_times.dinner || '20:00'}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  meal_times: { ...prev.meal_times, dinner: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
        </div>

        {/* Horario de entrenamiento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Horario preferido para entrenar
          </label>
          <input
            type="time"
            value={formData.workout_time || '18:00'}
            onChange={(e) => setFormData(prev => ({ ...prev, workout_time: e.target.value }))}
            className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        {/* Frecuencia de entrenamientos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Entrenamientos por semana
          </label>
          <select
            value={formData.weekly_workouts}
            onChange={(e) => setFormData(prev => ({ ...prev, weekly_workouts: parseInt(e.target.value) }))}
            className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value={1}>1 día por semana</option>
            <option value={2}>2 días por semana</option>
            <option value={3}>3 días por semana</option>
            <option value={4}>4 días por semana</option>
            <option value={5}>5 días por semana</option>
            <option value={6}>6 días por semana</option>
            <option value={7}>Todos los días</option>
          </select>
        </div>

        {/* Días de ayuno */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Días con ayuno intermitente (opcional)
          </label>
          <div className="flex flex-wrap gap-2">
            {daysOfWeek.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => handleDayToggle(day.value)}
                className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  formData.fasting_days.includes(day.value)
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            En los días seleccionados se ajustará tu plan para incluir solo almuerzo y cena
          </p>
        </div>

        {/* Resumen */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-medium text-green-800 mb-2">¡Ya casi terminamos! 🎉</h4>
          <p className="text-sm text-green-700">
            Con esta información crearemos tu plan personalizado de alimentación y entrenamiento.
            Podrás modificar cualquier aspecto más adelante desde tu perfil.
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
            disabled={isLoading}
            className="px-8 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin -ml-1 mr-3 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Creando tu perfil...
              </>
            ) : (
              '¡Crear mi plan personalizado!'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ScheduleStep;