import { User, Metrics, MACRO_RATIOS, ACTIVITY_FACTORS } from '@/types';

/**
 * Calcula el IMC (Índice de Masa Corporal)
 * Fórmula: peso(kg) / [estatura(m)]²
 */
export function calculateBMI(weight_kg: number, height_cm: number): number {
  const height_m = height_cm / 100;
  return Math.round((weight_kg / (height_m * height_m)) * 10) / 10;
}

/**
 * Calcula TMB (Tasa Metabólica Basal) usando fórmula Mifflin-St Jeor
 * Hombres: 10×kg + 6.25×cm − 5×edad + 5
 * Mujeres: 10×kg + 6.25×cm − 5×edad − 161
 */
export function calculateBMR_Mifflin(
  sex: 'male' | 'female',
  weight_kg: number,
  height_cm: number,
  age: number
): number {
  const base = 10 * weight_kg + 6.25 * height_cm - 5 * age;
  const adjustment = sex === 'male' ? 5 : -161;
  return Math.round(base + adjustment);
}

/**
 * Calcula GET (Gasto Energético Total) = TMB × Factor de Actividad
 */
export function calculateTDEE(bmr: number, activity_factor: number): number {
  return Math.round(bmr * activity_factor);
}

/**
 * Calcula rango de calorías objetivo basado en la meta
 * Para pérdida de peso: déficit de 10-25%
 * Para ganancia: superávit de 5-15%
 * Para mantenimiento: ±5%
 */
export function calculateKcalRange(
  tdee: number,
  goal_weight_kg: number,
  current_weight_kg: number,
  sex: 'male' | 'female'
): { min: number; max: number; target: number } {
  const weight_diff = goal_weight_kg - current_weight_kg;
  
  // Pisos de seguridad según sexo
  const min_safe_kcal = sex === 'male' ? 1500 : 1200;
  
  let deficit_pct = 0;
  
  if (weight_diff < -5) {
    // Pérdida significativa: déficit 20-25%
    deficit_pct = 0.225;
  } else if (weight_diff < 0) {
    // Pérdida leve: déficit 10-15%
    deficit_pct = 0.15;
  } else if (weight_diff > 5) {
    // Ganancia significativa: superávit 10-15%
    deficit_pct = -0.125;
  } else if (weight_diff > 0) {
    // Ganancia leve: superávit 5-10%
    deficit_pct = -0.075;
  }
  // Si weight_diff ≈ 0, mantenimiento (deficit_pct = 0)
  
  const target = Math.round(tdee * (1 - deficit_pct));
  const safe_target = Math.max(target, min_safe_kcal);
  
  return {
    min: Math.max(Math.round(safe_target * 0.95), min_safe_kcal),
    max: Math.round(safe_target * 1.05),
    target: safe_target,
  };
}

/**
 * Calcula distribución de macronutrientes
 * Proteína: 1.6-2.2 g/kg peso objetivo
 * Grasa: 0.6-0.8 g/kg peso objetivo
 * Carbohidratos: el resto de calorías
 */
export function calculateMacros(
  kcal_target: number,
  goal_weight_kg: number,
  preference_protein: 'low' | 'medium' | 'high' = 'medium'
): { protein_g: number; fat_g: number; carbs_g: number } {
  // Ajustar proteína según preferencia
  let protein_ratio;
  switch (preference_protein) {
    case 'low':
      protein_ratio = MACRO_RATIOS.PROTEIN_G_PER_KG.min;
      break;
    case 'high':
      protein_ratio = MACRO_RATIOS.PROTEIN_G_PER_KG.max;
      break;
    default:
      protein_ratio = (MACRO_RATIOS.PROTEIN_G_PER_KG.min + MACRO_RATIOS.PROTEIN_G_PER_KG.max) / 2;
  }
  
  const protein_g = Math.round(goal_weight_kg * protein_ratio);
  const fat_g = Math.round(goal_weight_kg * MACRO_RATIOS.FAT_G_PER_KG.min);
  
  // Calorías restantes para carbohidratos
  const protein_kcal = protein_g * MACRO_RATIOS.KCAL_PER_G.protein;
  const fat_kcal = fat_g * MACRO_RATIOS.KCAL_PER_G.fat;
  const remaining_kcal = kcal_target - protein_kcal - fat_kcal;
  
  const carbs_g = Math.max(0, Math.round(remaining_kcal / MACRO_RATIOS.KCAL_PER_G.carbs));
  
  return { protein_g, fat_g, carbs_g };
}

/**
 * Función principal que calcula todas las métricas de una vez
 */
export function calculateAllMetrics(user: User, activity_factor: number): Metrics {
  const bmi = calculateBMI(user.weight_kg, user.height_cm);
  const bmr_mifflin = calculateBMR_Mifflin(user.sex, user.weight_kg, user.height_cm, user.age);
  const tdee = calculateTDEE(bmr_mifflin, activity_factor);
  const kcal_range = calculateKcalRange(tdee, user.goal_weight_kg, user.weight_kg, user.sex);
  const macros = calculateMacros(kcal_range.target, user.goal_weight_kg);
  
  return {
    bmi,
    bmr_mifflin,
    tdee,
    kcal_range,
    macros,
    activity_factor,
  };
}

/**
 * Determina la categoría de IMC
 */
export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return 'Bajo peso';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Sobrepeso';
  return 'Obesidad';
}

/**
 * Calcula calorías quemadas estimadas por ejercicio
 */
export function calculateExerciseCalories(
  type: 'run' | 'hiit' | 'strength' | 'walk',
  duration_min: number,
  weight_kg: number,
  intensity: 'low' | 'medium' | 'high' = 'medium'
): number {
  // METs (Metabolic Equivalent of Task) por tipo y intensidad
  const mets: Record<string, Record<string, number>> = {
    run: { low: 6, medium: 8, high: 10 },
    hiit: { low: 8, medium: 10, high: 12 },
    strength: { low: 3, medium: 5, high: 6 },
    walk: { low: 2.5, medium: 3.5, high: 4.5 },
  };
  
  const met_value = mets[type]?.[intensity] || 5;
  
  // Fórmula: METs × peso(kg) × tiempo(horas)
  return Math.round(met_value * weight_kg * (duration_min / 60));
}

/**
 * Calcula pérdida de peso estimada por semana
 * 1 kg de grasa ≈ 7700 kcal
 */
export function calculateWeightLossRate(daily_deficit_kcal: number): number {
  const weekly_deficit = daily_deficit_kcal * 7;
  return Math.round((weekly_deficit / 7700) * 100) / 100; // kg por semana
}

/**
 * Valida si el déficit calórico es seguro
 */
export function validateDeficit(
  current_kcal: number,
  target_kcal: number,
  sex: 'male' | 'female'
): { safe: boolean; message?: string } {
  const min_safe = sex === 'male' ? 1500 : 1200;
  const max_deficit_pct = 0.25; // máximo 25% de déficit
  
  if (target_kcal < min_safe) {
    return {
      safe: false,
      message: `El objetivo calórico está por debajo del mínimo seguro (${min_safe} kcal)`,
    };
  }
  
  const deficit_pct = (current_kcal - target_kcal) / current_kcal;
  if (deficit_pct > max_deficit_pct) {
    return {
      safe: false,
      message: `El déficit calórico es demasiado agresivo (>${Math.round(max_deficit_pct * 100)}%)`,
    };
  }
  
  return { safe: true };
}

/**
 * Obtiene el factor de actividad por etiqueta
 */
export function getActivityFactorByLabel(label: string): number {
  const factor = ACTIVITY_FACTORS.find(af => af.label === label);
  return factor?.value || 1.55; // default moderado
}

/**
 * Calcula el porcentaje de progreso hacia la meta de peso
 */
export function calculateWeightProgress(
  current_kg: number,
  start_kg: number,
  goal_kg: number
): number {
  if (start_kg === goal_kg) return 100;
  
  const total_diff = goal_kg - start_kg;
  const current_diff = current_kg - start_kg;
  const progress = (current_diff / total_diff) * 100;
  
  return Math.max(0, Math.min(100, Math.round(progress * 10) / 10));
}