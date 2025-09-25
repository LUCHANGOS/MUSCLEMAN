import { 
  User, 
  Measurement, 
  MealPlanDay, 
  WorkoutPlanDay, 
  ProgressRule, 
  ProgressSuggestion,
  PersonalRecords 
} from '@/types';
import { calculateAllMetrics, calculateWeightProgress } from '@/utils/calculators';

/**
 * Motor de progresión basado en reglas determinísticas (sin IA)
 * Reglas especificadas:
 * - Si peso ↓ >1%/sem → subir kcal +5%
 * - Si peso ↓ <0.25%/sem por 2 semanas → bajar kcal −5%
 * - Si proteína diaria < objetivo 3 días/sem → alertar y proponer snack proteico
 * - Si RPE ≥8 sostenido → bajar volumen 10% 1 semana
 * - Si marcas (flexiones/plancha/km) mejoran → progresar series/tiempos 5–10%
 */

/**
 * Análisis de progreso semanal
 */
export interface WeeklyProgressAnalysis {
  weight_change_pct: number;
  weight_trend: 'fast_loss' | 'normal_loss' | 'slow_loss' | 'maintenance' | 'gain';
  adherence_score: number; // 0-100
  protein_compliance: number; // días que alcanzó objetivo
  avg_rpe: number;
  kcal_adjustment_needed: boolean;
  volume_adjustment_needed: boolean;
  suggestions: ProgressSuggestion[];
}

/**
 * Reglas de progresión predefinidas
 */
const PROGRESS_RULES: ProgressRule[] = [
  {
    id: 'weight_loss_too_fast',
    name: 'Pérdida de peso muy rápida',
    condition: 'Peso bajando >1% semanal',
    action: 'increase_kcal',
    adjustment_pct: 5,
    priority: 1
  },
  {
    id: 'weight_loss_too_slow',
    name: 'Pérdida de peso muy lenta',
    condition: 'Peso bajando <0.25% semanal por 2 semanas',
    action: 'decrease_kcal',
    adjustment_pct: 5,
    priority: 2
  },
  {
    id: 'protein_insufficient',
    name: 'Proteína insuficiente',
    condition: 'Proteína <objetivo 3+ días/semana',
    action: 'alert',
    adjustment_pct: 0,
    priority: 3
  },
  {
    id: 'rpe_too_high',
    name: 'RPE muy alto sostenido',
    condition: 'RPE ≥8 por 3+ entrenamientos',
    action: 'decrease_volume',
    adjustment_pct: 10,
    priority: 1
  },
  {
    id: 'performance_improved',
    name: 'Marcas personales mejoradas',
    condition: 'Flexiones/plancha/cardio mejorados',
    action: 'increase_volume',
    adjustment_pct: 7.5,
    priority: 4
  }
];

/**
 * Calcula el porcentaje de cambio de peso semanal
 */
function calculateWeeklyWeightChange(
  measurements: Measurement[],
  weeksBack: number = 1
): number {
  if (measurements.length < 2) return 0;
  
  // Ordenar mediciones por fecha
  const sortedMeasurements = [...measurements].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  const latestMeasurement = sortedMeasurements[sortedMeasurements.length - 1];
  
  // Buscar medición de hace 'weeksBack' semanas
  const targetDate = new Date(latestMeasurement.date);
  targetDate.setDate(targetDate.getDate() - (weeksBack * 7));
  
  // Encontrar la medición más cercana a la fecha objetivo
  let closestMeasurement = sortedMeasurements[0];
  let minDiff = Math.abs(new Date(closestMeasurement.date).getTime() - targetDate.getTime());
  
  for (const measurement of sortedMeasurements) {
    const diff = Math.abs(new Date(measurement.date).getTime() - targetDate.getTime());
    if (diff < minDiff) {
      minDiff = diff;
      closestMeasurement = measurement;
    }
  }
  
  if (closestMeasurement.weight_kg === latestMeasurement.weight_kg) return 0;
  
  const weightChange = ((latestMeasurement.weight_kg - closestMeasurement.weight_kg) / closestMeasurement.weight_kg) * 100;
  return Math.round(weightChange * 10) / 10; // Redondear a 1 decimal
}

/**
 * Calcula adherencia promedio de planes alimentarios
 */
function calculateMealPlanAdherence(mealPlans: MealPlanDay[]): number {
  if (mealPlans.length === 0) return 0;
  
  let totalAdherence = 0;
  let validPlans = 0;
  
  for (const plan of mealPlans) {
    const completedMeals = plan.meals.filter(meal => meal.completed).length;
    const totalMeals = plan.meals.length;
    
    if (totalMeals > 0) {
      const adherence = (completedMeals / totalMeals) * 100;
      totalAdherence += adherence;
      validPlans++;
    }
  }
  
  return validPlans > 0 ? Math.round(totalAdherence / validPlans) : 0;
}

/**
 * Cuenta días que alcanzaron el objetivo de proteína
 */
function calculateProteinCompliance(
  mealPlans: MealPlanDay[],
  user: User,
  activityFactor: number = 1.55
): number {
  if (mealPlans.length === 0) return 0;
  
  const metrics = calculateAllMetrics(user, activityFactor);
  const proteinTarget = metrics.macros.protein_g;
  
  let compliantDays = 0;
  
  for (const plan of mealPlans) {
    // Solo contar días completados (con adherencia > 70%)
    const adherence = plan.adherence || calculateMealPlanAdherence([plan]);
    if (adherence >= 70 && plan.totals.protein >= proteinTarget * 0.9) { // 90% del objetivo
      compliantDays++;
    }
  }
  
  return compliantDays;
}

/**
 * Calcula RPE promedio de entrenamientos
 */
function calculateAverageRPE(workouts: WorkoutPlanDay[]): number {
  const completedWorkouts = workouts.filter(w => w.completed && w.rpe);
  
  if (completedWorkouts.length === 0) return 0;
  
  const totalRPE = completedWorkouts.reduce((sum, w) => sum + (w.rpe || 0), 0);
  return Math.round((totalRPE / completedWorkouts.length) * 10) / 10;
}

/**
 * Detecta si hubo mejoras en marcas personales
 */
function detectPerformanceImprovements(
  currentRecords: PersonalRecords,
  previousRecords?: PersonalRecords
): boolean {
  if (!previousRecords) return false;
  
  const improvements = [
    currentRecords.pushups_max > previousRecords.pushups_max,
    currentRecords.abs_max > previousRecords.abs_max,
    currentRecords.plank_sec > previousRecords.plank_sec,
    currentRecords.run_speed_kmh > previousRecords.run_speed_kmh,
    currentRecords.run_duration_min > previousRecords.run_duration_min
  ];
  
  // Si al menos 2 marcas mejoraron, considerarlo una mejora
  return improvements.filter(Boolean).length >= 2;
}

/**
 * Analiza progreso semanal y genera sugerencias
 */
export function analyzeWeeklyProgress(
  user: User,
  measurements: Measurement[],
  mealPlans: MealPlanDay[],
  workouts: WorkoutPlanDay[],
  currentRecords: PersonalRecords,
  previousRecords?: PersonalRecords,
  activityFactor: number = 1.55
): WeeklyProgressAnalysis {
  
  // Análisis básico
  const weight_change_pct = calculateWeeklyWeightChange(measurements);
  const adherence_score = calculateMealPlanAdherence(mealPlans);
  const protein_compliance = calculateProteinCompliance(mealPlans, user, activityFactor);
  const avg_rpe = calculateAverageRPE(workouts);
  const performance_improved = detectPerformanceImprovements(currentRecords, previousRecords);
  
  // Determinar tendencia de peso
  let weight_trend: WeeklyProgressAnalysis['weight_trend'] = 'maintenance';
  if (weight_change_pct < -1) weight_trend = 'fast_loss';
  else if (weight_change_pct < -0.25) weight_trend = 'normal_loss';
  else if (weight_change_pct < 0.25) weight_trend = 'maintenance';
  else if (weight_change_pct >= 0.25) weight_trend = 'gain';
  
  // Para pérdida lenta, verificar tendencia de 2 semanas
  if (weight_change_pct >= -0.25 && weight_change_pct < 0) {
    const twoWeekChange = calculateWeeklyWeightChange(measurements, 2);
    if (twoWeekChange >= -0.5) { // <0.25% promedio semanal en 2 semanas
      weight_trend = 'slow_loss';
    }
  }
  
  // Generar sugerencias basadas en reglas
  const suggestions: ProgressSuggestion[] = [];
  let kcal_adjustment_needed = false;
  let volume_adjustment_needed = false;
  
  // Regla 1: Pérdida muy rápida
  if (weight_trend === 'fast_loss' && user.goal_weight_kg < user.weight_kg) {
    suggestions.push({
      rule_id: 'weight_loss_too_fast',
      message: `Estás perdiendo peso muy rápido (${Math.abs(weight_change_pct)}%/semana). Considera aumentar calorías en 5% para una pérdida más sostenible.`,
      action_required: true,
      auto_applied: false,
      created_at: new Date().toISOString()
    });
    kcal_adjustment_needed = true;
  }
  
  // Regla 2: Pérdida muy lenta
  if (weight_trend === 'slow_loss' && user.goal_weight_kg < user.weight_kg) {
    suggestions.push({
      rule_id: 'weight_loss_too_slow',
      message: `La pérdida de peso es muy lenta (${Math.abs(weight_change_pct)}%/semana). Considera reducir calorías en 5% o aumentar actividad física.`,
      action_required: true,
      auto_applied: false,
      created_at: new Date().toISOString()
    });
    kcal_adjustment_needed = true;
  }
  
  // Regla 3: Proteína insuficiente
  if (protein_compliance < (mealPlans.length - 3)) { // Menos de (total-3) días compliant
    suggestions.push({
      rule_id: 'protein_insufficient',
      message: `Solo alcanzaste el objetivo de proteína ${protein_compliance} de ${mealPlans.length} días. Considera agregar un snack proteico (batido o yogurt griego).`,
      action_required: true,
      auto_applied: false,
      created_at: new Date().toISOString()
    });
  }
  
  // Regla 4: RPE muy alto
  if (avg_rpe >= 8) {
    const highRPEWorkouts = workouts.filter(w => w.completed && (w.rpe || 0) >= 8).length;
    if (highRPEWorkouts >= 3) {
      suggestions.push({
        rule_id: 'rpe_too_high',
        message: `Tu RPE promedio es alto (${avg_rpe}/10). Considera reducir el volumen de entrenamiento en 10% para evitar sobreentrenamiento.`,
        action_required: true,
        auto_applied: false,
        created_at: new Date().toISOString()
      });
      volume_adjustment_needed = true;
    }
  }
  
  // Regla 5: Mejoras en rendimiento
  if (performance_improved) {
    suggestions.push({
      rule_id: 'performance_improved',
      message: '¡Excelente! Has mejorado tus marcas personales. Es momento de progresar: agrega 1 serie o aumenta intensidad 5-10%.',
      action_required: false,
      auto_applied: true,
      created_at: new Date().toISOString()
    });
    volume_adjustment_needed = true;
  }
  
  // Sugerencias adicionales basadas en adherencia
  if (adherence_score < 70) {
    suggestions.push({
      rule_id: 'low_adherence',
      message: `Tu adherencia es de ${adherence_score}%. Considera simplificar el plan o ajustar horarios de comidas para mejorar la constancia.`,
      action_required: true,
      auto_applied: false,
      created_at: new Date().toISOString()
    });
  } else if (adherence_score >= 90) {
    suggestions.push({
      rule_id: 'excellent_adherence',
      message: `¡Excelente adherencia (${adherence_score}%)! Mantén este ritmo para alcanzar tus objetivos.`,
      action_required: false,
      auto_applied: false,
      created_at: new Date().toISOString()
    });
  }
  
  return {
    weight_change_pct,
    weight_trend,
    adherence_score,
    protein_compliance,
    avg_rpe,
    kcal_adjustment_needed,
    volume_adjustment_needed,
    suggestions
  };
}

/**
 * Aplica ajustes automáticos basados en el análisis
 */
export function applyAutomaticAdjustments(
  user: User,
  analysis: WeeklyProgressAnalysis,
  activityFactor: number = 1.55
): {
  new_kcal_target?: number;
  volume_multiplier?: number;
  applied_rules: string[];
} {
  const metrics = calculateAllMetrics(user, activityFactor);
  const adjustments: {
    new_kcal_target?: number;
    volume_multiplier?: number;
    applied_rules: string[];
  } = {
    applied_rules: []
  };
  
  // Ajuste de calorías
  if (analysis.kcal_adjustment_needed) {
    const currentKcal = metrics.kcal_range.target;
    
    if (analysis.weight_trend === 'fast_loss') {
      // Aumentar 5%
      adjustments.new_kcal_target = Math.round(currentKcal * 1.05);
      adjustments.applied_rules.push('weight_loss_too_fast');
    } else if (analysis.weight_trend === 'slow_loss') {
      // Disminuir 5%
      adjustments.new_kcal_target = Math.round(currentKcal * 0.95);
      // Verificar pisos de seguridad
      const minSafe = user.sex === 'male' ? 1500 : 1200;
      adjustments.new_kcal_target = Math.max(adjustments.new_kcal_target, minSafe);
      adjustments.applied_rules.push('weight_loss_too_slow');
    }
  }
  
  // Ajuste de volumen
  if (analysis.volume_adjustment_needed) {
    if (analysis.avg_rpe >= 8) {
      // Reducir volumen 10%
      adjustments.volume_multiplier = 0.9;
      adjustments.applied_rules.push('rpe_too_high');
    } else {
      // Aumentar volumen 7.5% (por mejoras en rendimiento)
      adjustments.volume_multiplier = 1.075;
      adjustments.applied_rules.push('performance_improved');
    }
  }
  
  return adjustments;
}

/**
 * Calcula métricas de adherencia detalladas
 */
export function calculateDetailedAdherence(
  mealPlans: MealPlanDay[],
  workouts: WorkoutPlanDay[],
  waterIntakeRecords: Array<{ date: string; liters: number; target: number }>
): {
  meal_adherence: number;
  workout_adherence: number;
  water_adherence: number;
  overall_adherence: number;
} {
  // Adherencia de comidas
  const meal_adherence = calculateMealPlanAdherence(mealPlans);
  
  // Adherencia de entrenamientos
  const completedWorkouts = workouts.filter(w => w.completed).length;
  const workout_adherence = workouts.length > 0 ? 
    Math.round((completedWorkouts / workouts.length) * 100) : 0;
  
  // Adherencia de agua
  let water_adherence = 0;
  if (waterIntakeRecords.length > 0) {
    const compliantDays = waterIntakeRecords.filter(record => 
      record.liters >= record.target * 0.8 // 80% del objetivo
    ).length;
    water_adherence = Math.round((compliantDays / waterIntakeRecords.length) * 100);
  }
  
  // Adherencia general (promedio ponderado)
  const overall_adherence = Math.round(
    (meal_adherence * 0.5) + (workout_adherence * 0.3) + (water_adherence * 0.2)
  );
  
  return {
    meal_adherence,
    workout_adherence,
    water_adherence,
    overall_adherence
  };
}

/**
 * Genera reporte de progreso semanal
 */
export function generateWeeklyProgressReport(
  user: User,
  analysis: WeeklyProgressAnalysis,
  measurements: Measurement[],
  startWeight: number
): {
  summary: string;
  metrics: Record<string, number | string>;
  recommendations: string[];
  achievements: string[];
} {
  const currentWeight = measurements[measurements.length - 1]?.weight_kg || user.weight_kg;
  const totalProgress = calculateWeightProgress(currentWeight, startWeight, user.goal_weight_kg);
  
  // Resumen ejecutivo
  let summary = '';
  if (analysis.weight_trend === 'normal_loss') {
    summary = '📈 ¡Buen progreso! Estás perdiendo peso de forma saludable y sostenible.';
  } else if (analysis.weight_trend === 'fast_loss') {
    summary = '⚠️ Pérdida muy rápida. Considera aumentar calorías para mantener masa muscular.';
  } else if (analysis.weight_trend === 'slow_loss') {
    summary = '🐌 Progreso lento. Revisa calorías y actividad física.';
  } else if (analysis.weight_trend === 'maintenance') {
    summary = '⚖️ Manteniendo peso actual. Perfecto si es tu objetivo.';
  } else {
    summary = '⬆️ Ganando peso. Revisa tu plan si tu meta es perder peso.';
  }
  
  // Métricas clave
  const metrics = {
    'Cambio de peso semanal': `${analysis.weight_change_pct > 0 ? '+' : ''}${analysis.weight_change_pct}%`,
    'Progreso hacia meta': `${totalProgress}%`,
    'Adherencia general': `${analysis.adherence_score}%`,
    'Días con proteína suficiente': `${analysis.protein_compliance}`,
    'RPE promedio': analysis.avg_rpe > 0 ? `${analysis.avg_rpe}/10` : 'N/A'
  };
  
  // Recomendaciones
  const recommendations = analysis.suggestions
    .filter(s => s.action_required)
    .map(s => s.message);
  
  // Logros
  const achievements: string[] = [];
  if (analysis.adherence_score >= 90) {
    achievements.push('🏆 Excelente adherencia al plan');
  }
  if (analysis.avg_rpe > 0 && analysis.avg_rpe <= 7) {
    achievements.push('💪 Entrenamiento en intensidad óptima');
  }
  if (analysis.protein_compliance >= Math.floor(analysis.protein_compliance * 0.8)) {
    achievements.push('🥩 Objetivos de proteína alcanzados');
  }
  if (analysis.weight_trend === 'normal_loss' && user.goal_weight_kg < user.weight_kg) {
    achievements.push('📉 Pérdida de peso saludable');
  }
  
  return {
    summary,
    metrics,
    recommendations,
    achievements
  };
}