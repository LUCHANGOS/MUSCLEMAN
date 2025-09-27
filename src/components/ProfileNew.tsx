import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { PencilIcon, CheckIcon, XMarkIcon, UserIcon, HeartIcon, ClockIcon } from '@heroicons/react/24/outline';

const ProfileNew: React.FC = () => {
  const { 
    currentUser, 
    onboardingData, 
    updatePersonalInfo,
    updateHealthInfo,
    updatePreferencesInfo,
    updateScheduleInfo 
  } = useAuthStore();
  
  const [editing, setEditing] = useState({
    personal: false,
    health: false,
    preferences: false,
    schedule: false
  });
  
  const [formData, setFormData] = useState({
    personal: onboardingData.personalInfo || {
      sex: 'female' as const,
      age: 30,
      height_cm: 160,
      weight_kg: 70,
      goal_weight_kg: 65,
      goal_date: '',
      activity_level: 'moderate' as const,
      goal_type: 'lose_weight' as const
    },
    health: onboardingData.healthInfo || {
      medical_conditions: [],
      allergies: [],
      medications: [],
      cholesterol_concerns: false,
      ldl: undefined,
      hdl: undefined,
      triglycerides: undefined,
      blood_pressure: ''
    },
    preferences: onboardingData.preferencesInfo || {
      no_oil: true,
      no_sugar: true,
      no_fried: true,
      likes: [],
      dislikes: [],
      budget_level: 'medium' as const,
      baes_mode: false
    },
    schedule: onboardingData.scheduleInfo || {
      workout_time: '18:00',
      meal_times: {
        breakfast: '08:00',
        lunch: '13:00',
        snack: '16:00',
        dinner: '20:00'
      },
      fasting_days: [],
      weekly_workouts: 3
    }
  });
  
  useEffect(() => {
    setFormData({
      personal: onboardingData.personalInfo || formData.personal,
      health: onboardingData.healthInfo || formData.health,
      preferences: onboardingData.preferencesInfo || formData.preferences,
      schedule: onboardingData.scheduleInfo || formData.schedule
    });
  }, [onboardingData]);
  
  const handleEdit = (section: string) => {
    setEditing(prev => ({ ...prev, [section]: true }));
  };
  
  const handleCancel = (section: string) => {
    setEditing(prev => ({ ...prev, [section]: false }));
  };
  
  const handleSave = (section: string) => {
    switch (section) {
      case 'personal':
        updatePersonalInfo(formData.personal);
        break;
      case 'health':
        updateHealthInfo(formData.health);
        break;
      case 'preferences':
        updatePreferencesInfo(formData.preferences);
        break;
      case 'schedule':
        updateScheduleInfo(formData.schedule);
        break;
    }
    setEditing(prev => ({ ...prev, [section]: false }));
  };
  
  const handleInputChange = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl">
          Mi Perfil
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Administra tu información personal y preferencias de MUSCULOSO
        </p>
      </div>
      
      {/* Información de cuenta */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
            <UserIcon className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{currentUser?.name} {currentUser?.lastName}</h2>
            <p className="text-gray-500">{currentUser?.phone}</p>
            {currentUser?.email && <p className="text-gray-500">{currentUser.email}</p>}
            <p className="text-sm text-green-600">Perfil {currentUser?.profileCompleted ? 'completado' : 'incompleto'}</p>
          </div>
        </div>
      </div>

      {/* Información personal */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Información Personal</h3>
            </div>
            {editing.personal ? (
              <div className="space-x-2">
                <button
                  onClick={() => handleSave('personal')}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
                >
                  <CheckIcon className="h-4 w-4 mr-1" />
                  Guardar
                </button>
                <button
                  onClick={() => handleCancel('personal')}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                >
                  <XMarkIcon className="h-4 w-4 mr-1" />
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleEdit('personal')}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-green-600 bg-green-100 hover:bg-green-200"
              >
                <PencilIcon className="h-4 w-4 mr-1" />
                Editar
              </button>
            )}
          </div>
        </div>
        
        <div className="p-6">
          {editing.personal ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
                <select
                  value={formData.personal.sex}
                  onChange={(e) => handleInputChange('personal', 'sex', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="female">Femenino</option>
                  <option value="male">Masculino</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Edad</label>
                <input
                  type="number"
                  value={formData.personal.age}
                  onChange={(e) => handleInputChange('personal', 'age', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Altura (cm)</label>
                <input
                  type="number"
                  value={formData.personal.height_cm}
                  onChange={(e) => handleInputChange('personal', 'height_cm', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Peso actual (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.personal.weight_kg}
                  onChange={(e) => handleInputChange('personal', 'weight_kg', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><span className="text-sm font-medium text-gray-500">Sexo:</span> <span className="text-sm text-gray-900">{formData.personal.sex === 'female' ? 'Femenino' : 'Masculino'}</span></div>
              <div><span className="text-sm font-medium text-gray-500">Edad:</span> <span className="text-sm text-gray-900">{formData.personal.age} años</span></div>
              <div><span className="text-sm font-medium text-gray-500">Altura:</span> <span className="text-sm text-gray-900">{formData.personal.height_cm} cm</span></div>
              <div><span className="text-sm font-medium text-gray-500">Peso actual:</span> <span className="text-sm text-gray-900">{formData.personal.weight_kg} kg</span></div>
              <div><span className="text-sm font-medium text-gray-500">Peso objetivo:</span> <span className="text-sm text-gray-900">{formData.personal.goal_weight_kg} kg</span></div>
              <div><span className="text-sm font-medium text-gray-500">Objetivo:</span> <span className="text-sm text-gray-900">{
                formData.personal.goal_type === 'lose_weight' ? 'Perder peso' :
                formData.personal.goal_type === 'maintain' ? 'Mantener peso' :
                formData.personal.goal_type === 'gain_weight' ? 'Aumentar peso' : 'Ganar músculo'
              }</span></div>
            </div>
          )}
        </div>
      </div>

      {/* Información de salud */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <HeartIcon className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Información de Salud</h3>
            </div>
            {editing.health ? (
              <div className="space-x-2">
                <button
                  onClick={() => handleSave('health')}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
                >
                  <CheckIcon className="h-4 w-4 mr-1" />
                  Guardar
                </button>
                <button
                  onClick={() => handleCancel('health')}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                >
                  <XMarkIcon className="h-4 w-4 mr-1" />
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleEdit('health')}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-green-600 bg-green-100 hover:bg-green-200"
              >
                <PencilIcon className="h-4 w-4 mr-1" />
                Editar
              </button>
            )}
          </div>
        </div>
        
        <div className="p-6">
          {editing.health ? (
            <div className="space-y-4">
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.health.cholesterol_concerns}
                    onChange={(e) => handleInputChange('health', 'cholesterol_concerns', e.target.checked)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">Tengo problemas de colesterol</span>
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alergias (separadas por coma)</label>
                <input
                  type="text"
                  value={formData.health.allergies.join(', ')}
                  onChange={(e) => handleInputChange('health', 'allergies', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Ej: nueces, mariscos, lactosa"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Condiciones médicas (separadas por coma)</label>
                <input
                  type="text"
                  value={formData.health.medical_conditions.join(', ')}
                  onChange={(e) => handleInputChange('health', 'medical_conditions', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Ej: diabetes, hipertensión"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div><span className="text-sm font-medium text-gray-500">Colesterol:</span> <span className="text-sm text-gray-900">{formData.health.cholesterol_concerns ? 'Sí tiene problemas' : 'Sin problemas reportados'}</span></div>
              <div><span className="text-sm font-medium text-gray-500">Alergias:</span> <span className="text-sm text-gray-900">{formData.health.allergies.length > 0 ? formData.health.allergies.join(', ') : 'Ninguna'}</span></div>
              <div><span className="text-sm font-medium text-gray-500">Condiciones:</span> <span className="text-sm text-gray-900">{formData.health.medical_conditions.length > 0 ? formData.health.medical_conditions.join(', ') : 'Ninguna'}</span></div>
            </div>
          )}
        </div>
      </div>

      {/* Horarios simplificados */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Horarios y Rutina</h3>
            </div>
            {editing.schedule ? (
              <div className="space-x-2">
                <button
                  onClick={() => handleSave('schedule')}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
                >
                  <CheckIcon className="h-4 w-4 mr-1" />
                  Guardar
                </button>
                <button
                  onClick={() => handleCancel('schedule')}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                >
                  <XMarkIcon className="h-4 w-4 mr-1" />
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleEdit('schedule')}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-green-600 bg-green-100 hover:bg-green-200"
              >
                <PencilIcon className="h-4 w-4 mr-1" />
                Editar
              </button>
            )}
          </div>
        </div>
        
        <div className="p-6">
          {editing.schedule ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Entrenamientos por semana</label>
                <select
                  value={formData.schedule.weekly_workouts}
                  onChange={(e) => handleInputChange('schedule', 'weekly_workouts', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  {[1,2,3,4,5,6,7].map(num => (
                    <option key={num} value={num}>{num} día{num > 1 ? 's' : ''} por semana</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div><span className="text-sm font-medium text-gray-500">Entrenamientos:</span> <span className="text-sm text-gray-900">{formData.schedule.weekly_workouts} días por semana</span></div>
              <div><span className="text-sm font-medium text-gray-500">Días de ayuno:</span> <span className="text-sm text-gray-900">{formData.schedule.fasting_days.length > 0 ? `${formData.schedule.fasting_days.length} días configurados` : 'Sin ayuno intermitente'}</span></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileNew;