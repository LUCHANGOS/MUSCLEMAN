import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { generateWorkoutPlan } from '../utils/workoutGenerator';
import { WorkoutPlanDay, PersonalRecords } from '../types';
import { PlayIcon, ClockIcon, FireIcon } from '@heroicons/react/24/outline';

const Workouts: React.FC = () => {
  const { currentUser, onboardingData } = useAuthStore();
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutPlanDay | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Crear datos de usuario temporales desde el onboarding
  const userData = {
    ...currentUser,
    ...onboardingData.personalInfo,
    sex: onboardingData.personalInfo?.sex || 'female',
    age: onboardingData.personalInfo?.age || 25,
    height_cm: onboardingData.personalInfo?.height_cm || 165,
    weight_kg: onboardingData.personalInfo?.weight_kg || 70,
    goal_weight_kg: onboardingData.personalInfo?.goal_weight_kg || 65,
    goal_date: onboardingData.personalInfo?.goal_date || new Date().toISOString().split('T')[0],
    kcal_target: onboardingData.personalInfo?.kcal_target || 1400,
    budget_level: 'medium' as const,
    preferences: {
      no_oil: true,
      no_sugar: true,
      no_fried: true,
      likes: [],
      dislikes: [],
      avocado_daily_g: 20,
      nuts_weekly_servings: 2,
      fish_weekly_servings: 2
    },
    health: {
      allergies: [],
      intolerances: [],
    },
    equipment: {
      treadmill: onboardingData.equipmentInfo?.treadmill || false,
      dumbbells_kg: onboardingData.equipmentInfo?.dumbbells_weight_kg || undefined,
      rope: onboardingData.equipmentInfo?.jump_rope || false,
      mat: onboardingData.equipmentInfo?.yoga_mat || false,
      resistance_bands: onboardingData.equipmentInfo?.resistance_bands || false,
    },
    timezone: 'America/Santiago',
    locale: 'es' as const,
    createdAt: currentUser?.created_at || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Marcas personales por defecto (principiante)
  const defaultPersonalRecords: PersonalRecords = {
    user_id: currentUser?.id || 'temp',
    pushups_max: 10,
    abs_max: 20,
    plank_sec: 30,
    run_speed_kmh: 6,
    run_duration_min: 15,
    updated_at: new Date().toISOString()
  };

  const generateWorkout = async (type: 'hiit' | 'cardio' | 'strength') => {
    if (!currentUser) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const preferences = {
        preferred_type: type === 'hiit' ? 'cardio' as const : 
                       type === 'cardio' ? 'cardio' as const : 
                       'strength' as const,
        preferred_duration: type === 'hiit' ? 25 : type === 'cardio' ? 35 : 23
      };
      
      const workout = generateWorkoutPlan(
        userData as any,
        defaultPersonalRecords,
        new Date().toISOString().split('T')[0],
        preferences
      );
      
      if (workout) {
        setSelectedWorkout(workout);
      } else {
        setError('No se pudo generar el entrenamiento. Verifica tu equipamiento disponible.');
      }
    } catch (err) {
      console.error('Error generating workout:', err);
      setError('Error al generar el entrenamiento');
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}:${remainingSeconds.toString().padStart(2, '0')}` : `${minutes} min`;
  };

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

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Botones de generación */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            🏋️ Rutinas Personalizadas
          </h3>
          <p className="text-gray-500 mb-6">
            Selecciona el tipo de entrenamiento que prefieres hoy
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <button 
              onClick={() => generateWorkout('hiit')}
              disabled={isGenerating}
              className="inline-flex items-center justify-center px-6 py-4 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FireIcon className="h-5 w-5 mr-2" />
              {isGenerating ? 'Generando...' : 'HIIT Corto'}
              <span className="block text-xs mt-1">20-25 min</span>
            </button>
            <button 
              onClick={() => generateWorkout('cardio')}
              disabled={isGenerating}
              className="inline-flex items-center justify-center px-6 py-4 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlayIcon className="h-5 w-5 mr-2" />
              {isGenerating ? 'Generando...' : 'Cardio Continuo'}
              <span className="block text-xs mt-1">30-40 min</span>
            </button>
            <button 
              onClick={() => generateWorkout('strength')}
              disabled={isGenerating}
              className="inline-flex items-center justify-center px-6 py-4 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ClockIcon className="h-5 w-5 mr-2" />
              {isGenerating ? 'Generando...' : 'Fuerza en Casa'}
              <span className="block text-xs mt-1">20-25 min</span>
            </button>
          </div>
        </div>
      </div>

      {/* Entrenamiento generado */}
      {selectedWorkout && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Entrenamiento del día - {new Date().toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <ClockIcon className="h-4 w-4 mr-1" />
              {selectedWorkout.duration_min} minutos
              <FireIcon className="h-4 w-4 ml-4 mr-1" />
              ~{selectedWorkout.kcal_estimate} kcal
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-6">
              {selectedWorkout.blocks.map((block, index) => (
                <div key={index} className="border-l-4 border-green-400 pl-4">
                  <h4 className="font-medium text-gray-900 mb-2">
                    {index + 1}. {block.name}
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Duración: {block.duration_min} minutos
                  </p>
                  
                  {block.type === 'strength' && 'exercises' in block.details && (
                    <div className="space-y-2">
                      {(block.details as any).exercises.map((exercise: any, exIndex: number) => (
                        <div key={exIndex} className="bg-gray-50 p-3 rounded">
                          <p className="font-medium text-sm">{exercise.name}</p>
                          <p className="text-xs text-gray-600">
                            {exercise.sets} series × {' '}
                            {exercise.reps === 'time' && exercise.duration_sec 
                              ? formatDuration(exercise.duration_sec)
                              : exercise.reps === 'AMRAP' 
                              ? 'Máximo posible'
                              : `${exercise.reps} repeticiones`
                            }
                            {exercise.rest_sec && ` - Descanso: ${exercise.rest_sec}s`}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {block.type === 'run' && 'speed_kmh' in block.details && (
                    <div className="bg-blue-50 p-3 rounded">
                      <p className="text-sm">
                        Velocidad: {block.details.speed_kmh} km/h
                        {block.details.type === 'intervals' && ' (intervalos)'}
                      </p>
                    </div>
                  )}
                  
                  {block.type === 'hiit' && 'work_sec' in block.details && (
                    <div className="bg-red-50 p-3 rounded">
                      <p className="text-sm">
                        {block.details.rounds} rondas de:
                        {block.details.work_sec}s trabajo + {block.details.rest_sec}s descanso
                      </p>
                      {block.details.exercises && (
                        <p className="text-xs text-gray-600 mt-1">
                          Ejercicios: {block.details.exercises.join(', ')}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {(block.type === 'warmup' || block.type === 'cooldown') && 'description' in block.details && (
                    <div className="bg-yellow-50 p-3 rounded">
                      <p className="text-sm">{block.details.description}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {selectedWorkout.notes && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> {selectedWorkout.notes}
                </p>
              </div>
            )}
            
            <div className="mt-6 flex justify-between">
              <button 
                onClick={() => setSelectedWorkout(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Generar otro entrenamiento
              </button>
              <button className="px-6 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700">
                Marcar como completado
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workouts;