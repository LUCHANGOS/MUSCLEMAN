import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { OnboardingData } from '../../types';

interface PersonalInfoStepProps {
  onNext: () => void;
}

const PersonalInfoStep: React.FC<PersonalInfoStepProps> = ({ onNext }) => {
  const { onboardingData, updatePersonalInfo } = useAuthStore();
  
  const [formData, setFormData] = useState<NonNullable<OnboardingData['personalInfo']>>({
    sex: 'female',
    age: 30,
    height_cm: 160,
    weight_kg: 70,
    goal_weight_kg: 60,
    goal_date: '',
    activity_level: 'moderate',
    goal_type: 'lose_weight',
  });

  // Cargar datos existentes si los hay
  useEffect(() => {
    if (onboardingData.personalInfo) {
      setFormData(onboardingData.personalInfo);
    } else {
      // Establecer fecha por defecto a 3 meses
      const defaultDate = new Date();
      defaultDate.setMonth(defaultDate.getMonth() + 3);
      setFormData(prev => ({
        ...prev,
        goal_date: defaultDate.toISOString().split('T')[0]
      }));
    }
  }, [onboardingData.personalInfo]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'age' || name === 'height_cm' || name === 'weight_kg' || name === 'goal_weight_kg'
        ? parseFloat(value) || 0
        : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (formData.age < 18 || formData.age > 99) {
      alert('Por favor ingresa una edad válida (18-99 años)');
      return;
    }
    
    if (formData.height_cm < 100 || formData.height_cm > 250) {
      alert('Por favor ingresa una altura válida (100-250 cm)');
      return;
    }
    
    if (formData.weight_kg < 30 || formData.weight_kg > 300) {
      alert('Por favor ingresa un peso válido (30-300 kg)');
      return;
    }

    if (formData.goal_weight_kg < 30 || formData.goal_weight_kg > 300) {
      alert('Por favor ingresa un peso objetivo válido (30-300 kg)');
      return;
    }

    if (!formData.goal_date) {
      alert('Por favor selecciona una fecha objetivo');
      return;
    }

    updatePersonalInfo(formData);
    onNext();
  };

  // Calcular IMC actual
  const calculateBMI = (weight: number, height: number) => {
    const heightInM = height / 100;
    return (weight / (heightInM * heightInM)).toFixed(1);
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { text: 'Bajo peso', color: 'text-blue-600' };
    if (bmi < 25) return { text: 'Normal', color: 'text-green-600' };
    if (bmi < 30) return { text: 'Sobrepeso', color: 'text-yellow-600' };
    return { text: 'Obesidad', color: 'text-red-600' };
  };

  const currentBMI = parseFloat(calculateBMI(formData.weight_kg, formData.height_cm));
  const bmiCategory = getBMICategory(currentBMI);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Información Personal
        </h2>
        <p className="text-gray-600">
          Esta información nos ayuda a calcular tus necesidades nutricionales y crear un plan personalizado.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sexo biológico */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sexo al nacer *
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="sex"
                value="female"
                checked={formData.sex === 'female'}
                onChange={handleInputChange}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
              />
              <span className="ml-3 text-sm font-medium">👩 Femenino</span>
            </label>
            <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="sex"
                value="male"
                checked={formData.sex === 'male'}
                onChange={handleInputChange}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
              />
              <span className="ml-3 text-sm font-medium">👨 Masculino</span>
            </label>
          </div>
        </div>

        {/* Edad */}
        <div>
          <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
            Edad *
          </label>
          <input
            type="number"
            id="age"
            name="age"
            min="18"
            max="99"
            required
            value={formData.age}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        {/* Altura y peso actuales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="height_cm" className="block text-sm font-medium text-gray-700 mb-2">
              Altura (cm) *
            </label>
            <input
              type="number"
              id="height_cm"
              name="height_cm"
              min="100"
              max="250"
              required
              value={formData.height_cm}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div>
            <label htmlFor="weight_kg" className="block text-sm font-medium text-gray-700 mb-2">
              Peso actual (kg) *
            </label>
            <input
              type="number"
              id="weight_kg"
              name="weight_kg"
              min="30"
              max="300"
              step="0.1"
              required
              value={formData.weight_kg}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>

        {/* IMC calculado */}
        {formData.height_cm > 0 && formData.weight_kg > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Tu IMC actual:</span>
              <div className="text-right">
                <span className="text-lg font-bold text-gray-900">{currentBMI}</span>
                <span className={`block text-sm ${bmiCategory.color} font-medium`}>
                  {bmiCategory.text}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Objetivo */}
        <div>
          <label htmlFor="goal_type" className="block text-sm font-medium text-gray-700 mb-2">
            Objetivo principal *
          </label>
          <select
            id="goal_type"
            name="goal_type"
            required
            value={formData.goal_type}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="lose_weight">Perder peso</option>
            <option value="maintain">Mantener peso</option>
            <option value="gain_weight">Aumentar peso</option>
            <option value="gain_muscle">Ganar masa muscular</option>
          </select>
        </div>

        {/* Peso objetivo y fecha */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="goal_weight_kg" className="block text-sm font-medium text-gray-700 mb-2">
              Peso objetivo (kg) *
            </label>
            <input
              type="number"
              id="goal_weight_kg"
              name="goal_weight_kg"
              min="30"
              max="300"
              step="0.1"
              required
              value={formData.goal_weight_kg}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div>
            <label htmlFor="goal_date" className="block text-sm font-medium text-gray-700 mb-2">
              Fecha objetivo *
            </label>
            <input
              type="date"
              id="goal_date"
              name="goal_date"
              required
              value={formData.goal_date}
              onChange={handleInputChange}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>

        {/* Nivel de actividad */}
        <div>
          <label htmlFor="activity_level" className="block text-sm font-medium text-gray-700 mb-2">
            Nivel de actividad física *
          </label>
          <select
            id="activity_level"
            name="activity_level"
            required
            value={formData.activity_level}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="sedentary">Sedentario (poco o ningún ejercicio)</option>
            <option value="light">Ligero (ejercicio ligero 1-3 días/semana)</option>
            <option value="moderate">Moderado (ejercicio moderado 3-5 días/semana)</option>
            <option value="active">Activo (ejercicio intenso 6-7 días/semana)</option>
            <option value="very_active">Muy activo (trabajo físico + ejercicio intenso)</option>
          </select>
        </div>

        {/* Botón siguiente */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Siguiente: Información de Salud
          </button>
        </div>
      </form>
    </div>
  );
};

export default PersonalInfoStep;