import { 
  User, 
  WorkoutPlanDay, 
  WorkoutBlock, 
  RunDetails, 
  HIITDetails, 
  StrengthDetails, 
  BasicDetails,
  PersonalRecords,
  Equipment 
} from '@/types';
import { calculateExerciseCalories } from '@/utils/calculators';

/**
 * Nivel de fitness del usuario basado en sus marcas personales
 */
export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';

/**
 * Plantilla de rutina con progresión automática
 */
interface WorkoutTemplate {
  id: string;
  name: string;
  type: 'run' | 'hiit' | 'strength' | 'mixed';
  duration_min: number;
  required_equipment: (keyof Equipment)[];
  fitness_level: FitnessLevel[];
  blocks: Omit<WorkoutBlock, 'kcal_estimate'>[];
}

/**
 * Rutinas predefinidas según especificación
 */
const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  // RUTINAS DE CARDIO
  {
    id: 'hiit_short',
    name: 'HIIT corto (20-25 min)',
    type: 'hiit',
    duration_min: 23,
    required_equipment: ['treadmill'],
    fitness_level: ['beginner', 'intermediate', 'advanced'],
    blocks: [
      {
        type: 'warmup',
        name: 'Calentamiento',
        details: {
          description: 'Caminar 5 minutos a ritmo moderado',
          intensity: 'low'
        },
        duration_min: 5
      },
      {
        type: 'run',
        name: 'Base aeróbica',
        details: {
          speed_kmh: 6,
          type: 'continuous'
        },
        duration_min: 10
      },
      {
        type: 'hiit',
        name: 'Intervalos HIIT',
        details: {
          work_sec: 60,
          rest_sec: 240,
          rounds: 2,
          exercises: ['Correr 12 km/h']
        },
        duration_min: 8
      }
    ]
  },
  {
    id: 'run_continuous',
    name: 'Cardio continuo (30-40 min)',
    type: 'run',
    duration_min: 35,
    required_equipment: ['treadmill'],
    fitness_level: ['intermediate', 'advanced'],
    blocks: [
      {
        type: 'warmup',
        name: 'Calentamiento',
        details: {
          description: 'Caminar 5 minutos a ritmo lento',
          intensity: 'low'
        },
        duration_min: 5
      },
      {
        type: 'run',
        name: 'Carrera continua',
        details: {
          speed_kmh: 8,
          type: 'continuous'
        },
        duration_min: 25
      },
      {
        type: 'cooldown',
        name: 'Enfriamiento',
        details: {
          description: 'Caminar y estirar 5 minutos',
          intensity: 'low'
        },
        duration_min: 5
      }
    ]
  },
  // RUTINAS DE FUERZA
  {
    id: 'strength_bodyweight',
    name: 'Fuerza casa (20-25 min)',
    type: 'strength',
    duration_min: 23,
    required_equipment: ['mat'],
    fitness_level: ['beginner', 'intermediate', 'advanced'],
    blocks: [
      {
        type: 'warmup',
        name: 'Calentamiento dinámico',
        details: {
          description: 'Movilidad articular y activación',
          intensity: 'low'
        },
        duration_min: 3
      },
      {
        type: 'strength',
        name: 'Circuito principal',
        details: {
          exercises: [
            {
              name: 'Flexiones',
              sets: 3,
              reps: 'AMRAP',
              rest_sec: 90
            },
            {
              name: 'Abdominales',
              sets: 3,
              reps: 30,
              rest_sec: 60
            },
            {
              name: 'Plancha',
              sets: 3,
              reps: 'time',
              duration_sec: 45,
              rest_sec: 60
            }
          ]
        },
        duration_min: 15
      },
      {
        type: 'run',
        name: 'Cuerda (cardio)',
        details: {
          speed_kmh: 0,
          type: 'intervals'
        },
        duration_min: 5
      }
    ]
  },
  {
    id: 'strength_dumbbells',
    name: 'Fuerza con mancuernas',
    type: 'mixed',
    duration_min: 25,
    required_equipment: ['dumbbells_kg', 'treadmill'],
    fitness_level: ['intermediate', 'advanced'],
    blocks: [
      {
        type: 'warmup',
        name: 'Calentamiento',
        details: {
          description: 'Movilidad con peso corporal',
          intensity: 'low'
        },
        duration_min: 5
      },
      {
        type: 'strength',
        name: 'Shadow boxing',
        details: {
          exercises: [
            {
              name: 'Shadow boxing con mancuernas',
              sets: 3,
              reps: 'time',
              duration_sec: 120,
              rest_sec: 60
            }
          ]
        },
        duration_min: 10
      },
      {
        type: 'run',
        name: 'Farmer walk en trotadora',
        details: {
          speed_kmh: 5,
          type: 'continuous'
        },
        duration_min: 10
      }
    ]
  },
  // RUTINA BÁSICA PARA PRINCIPIANTES
  {
    id: 'beginner_basic',
    name: 'Rutina básica principiante',
    type: 'mixed',
    duration_min: 20,
    required_equipment: ['mat'],
    fitness_level: ['beginner'],
    blocks: [
      {
        type: 'warmup',
        name: 'Calentamiento suave',
        details: {
          description: 'Caminar en el lugar y estiramientos suaves',
          intensity: 'low'
        },
        duration_min: 5
      },
      {
        type: 'strength',
        name: 'Ejercicios básicos',
        details: {
          exercises: [
            {
              name: 'Flexiones (modificadas si es necesario)',
              sets: 2,
              reps: 10,
              rest_sec: 90
            },
            {
              name: 'Sentadillas',
              sets: 2,
              reps: 15,
              rest_sec: 60
            },
            {
              name: 'Plancha',
              sets: 2,
              reps: 'time',
              duration_sec: 20,
              rest_sec: 60
            }
          ]
        },
        duration_min: 12
      },
      {
        type: 'cooldown',
        name: 'Relajación',
        details: {
          description: 'Estiramientos y respiración',
          intensity: 'low'
        },
        duration_min: 3
      }
    ]
  }
];

/**
 * Evalúa el nivel de fitness basado en marcas personales
 */
function evaluateFitnessLevel(
  personalRecords: PersonalRecords,
  user: User
): FitnessLevel {
  const { pushups_max, plank_sec, run_speed_kmh, run_duration_min } = personalRecords;
  
  let score = 0;
  
  // Criterios para hombres y mujeres (ajustados)
  const isMan = user.sex === 'male';
  
  // Flexiones
  if (isMan) {
    if (pushups_max >= 30) score += 2;
    else if (pushups_max >= 15) score += 1;
  } else {
    if (pushups_max >= 20) score += 2;
    else if (pushups_max >= 10) score += 1;
  }
  
  // Plancha
  if (plank_sec >= 90) score += 2;
  else if (plank_sec >= 45) score += 1;
  
  // Velocidad de carrera
  if (run_speed_kmh >= 10) score += 2;
  else if (run_speed_kmh >= 7) score += 1;
  
  // Duración de carrera
  if (run_duration_min >= 30) score += 2;
  else if (run_duration_min >= 15) score += 1;
  
  // Clasificar nivel
  if (score >= 6) return 'advanced';
  if (score >= 3) return 'intermediate';
  return 'beginner';
}

/**
 * Filtra rutinas por equipamiento disponible
 */
function filterWorkoutsByEquipment(
  templates: WorkoutTemplate[],
  equipment: Equipment
): WorkoutTemplate[] {
  return templates.filter(template => {
    return template.required_equipment.every(reqEquip => {
      switch (reqEquip) {
        case 'treadmill':
          return equipment.treadmill;
        case 'dumbbells_kg':
          return equipment.dumbbells_kg && equipment.dumbbells_kg > 0;
        case 'rope':
          return equipment.rope;
        case 'mat':
          return equipment.mat;
        case 'resistance_bands':
          return equipment.resistance_bands;
        default:
          return false;
      }
    });
  });
}

/**
 * Progresa una rutina basada en las marcas personales actuales
 */
function progressWorkout(
  template: WorkoutTemplate,
  personalRecords: PersonalRecords,
  fitnessLevel: FitnessLevel,
  sessionNumber: number = 1
): WorkoutBlock[] {
  return template.blocks.map(block => {
    const progressedBlock = { ...block };
    
    // Ajustar intensidad según nivel y progreso
    const intensityMultiplier = {
      beginner: 0.8,
      intermediate: 1.0,
      advanced: 1.2
    }[fitnessLevel];
    
    const sessionMultiplier = 1 + (sessionNumber - 1) * 0.05; // 5% más por sesión
    
    if (block.type === 'strength' && 'exercises' in block.details) {
      const strengthDetails = block.details as StrengthDetails;
      progressedBlock.details = {
        ...strengthDetails,
        exercises: strengthDetails.exercises.map(exercise => {
          const progressedExercise = { ...exercise };
          
          // Ajustar repeticiones/tiempo según las marcas personales
          if (exercise.name.toLowerCase().includes('flexion')) {
            const baseReps = personalRecords.pushups_max * 0.7; // 70% del máximo
            if (typeof progressedExercise.reps === 'number') {
              progressedExercise.reps = Math.max(5, Math.round(baseReps * intensityMultiplier));
            }
          }
          
          if (exercise.name.toLowerCase().includes('plancha')) {
            const baseTime = personalRecords.plank_sec * 0.8; // 80% del máximo
            if (progressedExercise.duration_sec) {
              progressedExercise.duration_sec = Math.max(15, Math.round(baseTime * intensityMultiplier));
            }
          }
          
          if (exercise.name.toLowerCase().includes('abdominal')) {
            const baseReps = personalRecords.abs_max * 0.7;
            if (typeof progressedExercise.reps === 'number') {
              progressedExercise.reps = Math.max(10, Math.round(baseReps * intensityMultiplier));
            }
          }
          
          return progressedExercise;
        })
      };
    }
    
    if (block.type === 'run' && 'speed_kmh' in block.details) {
      const runDetails = block.details as RunDetails;
      progressedBlock.details = {
        ...runDetails,
        speed_kmh: Math.max(5, runDetails.speed_kmh * intensityMultiplier)
      };
    }
    
    if (block.type === 'hiit' && 'work_sec' in block.details) {
      const hiitDetails = block.details as HIITDetails;
      // Para HIIT, ajustar trabajo/descanso según nivel
      progressedBlock.details = {
        ...hiitDetails,
        work_sec: Math.round(hiitDetails.work_sec * intensityMultiplier),
        rest_sec: Math.round(hiitDetails.rest_sec / intensityMultiplier)
      };
    }
    
    // Calcular calorías estimadas para este bloque
    const kcalEstimate = calculateExerciseCalories(
      block.type === 'strength' ? 'strength' : 
      block.type === 'hiit' ? 'hiit' : 
      block.type === 'run' ? 'run' : 'walk',
      block.duration_min,
      user.weight_kg,
      intensityMultiplier > 1 ? 'high' : intensityMultiplier < 1 ? 'low' : 'medium'
    );
    
    return {
      ...progressedBlock,
      kcal_estimate: kcalEstimate
    };
  });
}

/**
 * Selecciona la rutina más apropiada para el usuario
 */
function selectBestWorkout(
  availableTemplates: WorkoutTemplate[],
  fitnessLevel: FitnessLevel,
  preferences: {
    preferred_duration?: number;
    preferred_type?: 'cardio' | 'strength' | 'mixed';
    avoid_high_impact?: boolean;
  }
): WorkoutTemplate | null {
  if (availableTemplates.length === 0) return null;
  
  // Filtrar por nivel de fitness
  const levelAppropriate = availableTemplates.filter(template =>
    template.fitness_level.includes(fitnessLevel)
  );
  
  if (levelAppropriate.length === 0) {
    // Si no hay rutinas para el nivel exacto, tomar las más cercanas
    return availableTemplates[0];
  }
  
  // Puntuar rutinas según preferencias
  const scored = levelAppropriate.map(template => {
    let score = 0;
    
    // Bonus por duración preferida
    if (preferences.preferred_duration) {
      const durationDiff = Math.abs(template.duration_min - preferences.preferred_duration);
      score += Math.max(0, 10 - durationDiff / 5); // Menos puntos por cada 5 min de diferencia
    }
    
    // Bonus por tipo preferido
    if (preferences.preferred_type) {
      if (
        (preferences.preferred_type === 'cardio' && (template.type === 'run' || template.type === 'hiit')) ||
        (preferences.preferred_type === 'strength' && template.type === 'strength') ||
        (preferences.preferred_type === 'mixed' && template.type === 'mixed')
      ) {
        score += 5;
      }
    }
    
    // Penalización por alto impacto si se quiere evitar
    if (preferences.avoid_high_impact && (template.type === 'hiit' || template.type === 'run')) {
      score -= 3;
    }
    
    return { template, score };
  });
  
  // Ordenar por puntaje y devolver el mejor
  scored.sort((a, b) => b.score - a.score);
  return scored[0].template;
}

/**
 * Genera una rutina de entrenamiento para un día específico
 */
export function generateWorkoutPlan(
  user: User,
  personalRecords: PersonalRecords,
  date: string,
  preferences?: {
    preferred_duration?: number;
    preferred_type?: 'cardio' | 'strength' | 'mixed';
    avoid_high_impact?: boolean;
  }
): WorkoutPlanDay | null {
  try {
    const fitnessLevel = evaluateFitnessLevel(personalRecords, user);
    const availableTemplates = filterWorkoutsByEquipment(WORKOUT_TEMPLATES, user.equipment);
    
    if (availableTemplates.length === 0) {
      console.warn('No hay rutinas disponibles con el equipamiento actual');
      return null;
    }
    
    const selectedTemplate = selectBestWorkout(availableTemplates, fitnessLevel, preferences || {});
    if (!selectedTemplate) return null;
    
    // Calcular número de sesión para progresión (simplificado)
    const startDate = new Date(user.createdAt);
    const currentDate = new Date(date);
    const daysDiff = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const sessionNumber = Math.floor(daysDiff / 2) + 1; // Una sesión cada 2 días aprox.
    
    const progressedBlocks = progressWorkout(selectedTemplate, personalRecords, fitnessLevel, sessionNumber);
    
    // Calcular calorías totales
    const totalKcalEstimate = progressedBlocks.reduce((sum, block) => sum + block.kcal_estimate, 0);
    
    const workoutPlan: WorkoutPlanDay = {
      id: `${user.id}_workout_${date}`,
      user_id: user.id,
      date,
      blocks: progressedBlocks,
      duration_min: selectedTemplate.duration_min,
      kcal_estimate: totalKcalEstimate,
      completed: false,
      notes: `Rutina generada para nivel: ${fitnessLevel}. Sesión #${sessionNumber}`
    };
    
    return workoutPlan;
    
  } catch (error) {
    console.error('Error generando plan de entrenamiento:', error);
    return null;
  }
}

/**
 * Genera rutinas para una semana completa
 */
export function generateWeeklyWorkoutPlan(
  user: User,
  personalRecords: PersonalRecords,
  startDate: string,
  daysPerWeek: number = 3
): WorkoutPlanDay[] {
  const weekPlan: WorkoutPlanDay[] = [];
  const workoutTypes = ['strength', 'cardio', 'mixed'] as const;
  
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + i);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    // Distribuir entrenamientos según días por semana
    const shouldWorkout = i % Math.floor(7 / daysPerWeek) === 0 && weekPlan.length < daysPerWeek;
    
    if (shouldWorkout) {
      const typeIndex = weekPlan.length % workoutTypes.length;
      const preferences = {
        preferred_type: workoutTypes[typeIndex],
        preferred_duration: 25
      };
      
      const workout = generateWorkoutPlan(user, personalRecords, dateStr, preferences);
      if (workout) {
        weekPlan.push(workout);
      }
    }
  }
  
  return weekPlan;
}

/**
 * Sugiere progresión basada en el rendimiento
 */
export function suggestProgression(
  currentWorkout: WorkoutPlanDay,
  personalRecords: PersonalRecords,
  rpe: number // Rate of Perceived Exertion 1-10
): string[] {
  const suggestions: string[] = [];
  
  // Si RPE ≤ 7, sugerir progresión
  if (rpe <= 7) {
    suggestions.push('El entrenamiento parece cómodo. Considera aumentar la intensidad la próxima vez.');
    
    // Sugerencias específicas por tipo de bloque
    currentWorkout.blocks.forEach(block => {
      if (block.type === 'strength' && 'exercises' in block.details) {
        suggestions.push('Fuerza: Agrega 1 serie o +5% repeticiones en ejercicios básicos.');
      }
      
      if (block.type === 'run') {
        suggestions.push('Cardio: Aumenta velocidad en 0.5 km/h o duración en 2-3 minutos.');
      }
      
      if (block.type === 'hiit') {
        suggestions.push('HIIT: Reduce descansos en 10-15 segundos o agrega 1 ronda extra.');
      }
    });
  }
  
  // Si RPE ≥ 8, sugerir reducir volumen
  if (rpe >= 8) {
    suggestions.push('El entrenamiento fue muy intenso. Considera reducir volumen 10% la próxima semana.');
    suggestions.push('Asegúrate de descansar adecuadamente entre sesiones.');
  }
  
  // Sugerencias basadas en marcas personales
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  if (personalRecords.updated_at && new Date(personalRecords.updated_at) > oneWeekAgo) {
    // Si las marcas mejoraron recientemente
    suggestions.push('¡Felicitaciones por mejorar tus marcas! Mantén la progresión gradual.');
  }
  
  return suggestions;
}

/**
 * Calcula el volumen de entrenamiento semanal
 */
export function calculateWeeklyVolume(workouts: WorkoutPlanDay[]): {
  total_duration_min: number;
  total_kcal_estimate: number;
  strength_sessions: number;
  cardio_sessions: number;
  avg_rpe?: number;
} {
  const completedWorkouts = workouts.filter(w => w.completed);
  
  const total_duration_min = completedWorkouts.reduce((sum, w) => sum + w.duration_min, 0);
  const total_kcal_estimate = completedWorkouts.reduce((sum, w) => sum + w.kcal_estimate, 0);
  
  let strength_sessions = 0;
  let cardio_sessions = 0;
  
  completedWorkouts.forEach(workout => {
    const hasStrength = workout.blocks.some(b => b.type === 'strength');
    const hasCardio = workout.blocks.some(b => b.type === 'run' || b.type === 'hiit');
    
    if (hasStrength) strength_sessions++;
    if (hasCardio) cardio_sessions++;
  });
  
  const rpeWorkouts = completedWorkouts.filter(w => w.rpe);
  const avg_rpe = rpeWorkouts.length > 0 
    ? rpeWorkouts.reduce((sum, w) => sum + (w.rpe || 0), 0) / rpeWorkouts.length 
    : undefined;
  
  return {
    total_duration_min,
    total_kcal_estimate,
    strength_sessions,
    cardio_sessions,
    avg_rpe
  };
}