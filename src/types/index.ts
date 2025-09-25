// ===== TIPOS DE USUARIO Y PERFIL =====
export interface User {
  id: string;
  name: string;
  email: string;
  authProvider?: 'google' | 'local';
  sex: 'male' | 'female';
  age: number;
  height_cm: number;
  weight_kg: number;
  goal_weight_kg: number;
  goal_date: string; // ISO date
  kcal_target: number;
  budget_level: 'low' | 'medium' | 'high';
  preferences: UserPreferences;
  health: HealthData;
  equipment: Equipment;
  timezone: string;
  locale: 'es' | 'en';
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  no_oil: boolean;
  no_sugar: boolean;
  no_fried: boolean;
  dislikes: string[];
  likes: string[];
  avocado_daily_g: number; // 15-30g recomendado
  nuts_weekly_servings: number; // 1-2 porciones semanales
  fish_weekly_servings: number; // 2 porciones recomendado
}

export interface HealthData {
  ldl?: number;
  hdl?: number;
  tg?: number; // triglicéridos
  allergies: string[];
  intolerances: string[];
  medical_notes?: string;
  doctor_approval?: boolean;
}

export interface Equipment {
  treadmill: boolean;
  dumbbells_kg?: number;
  rope: boolean;
  mat: boolean;
  resistance_bands: boolean;
}

// ===== MÉTRICAS Y CÁLCULOS =====
export interface Metrics {
  bmi: number;
  bmr_mifflin: number; // TMB
  tdee: number; // GET
  kcal_range: {
    min: number;
    max: number;
    target: number;
  };
  macros: {
    protein_g: number;
    fat_g: number;
    carbs_g: number;
  };
  activity_factor: number;
}

export interface Measurement {
  id: string;
  user_id: string;
  date: string; // ISO date
  weight_kg: number;
  bodyfat_pct?: number;
  water_pct?: number;
  waist_cm?: number;
  chest_cm?: number;
  hips_cm?: number;
  notes?: string;
}

// ===== ALIMENTOS Y RECETAS =====
export interface FoodItem {
  id: string;
  name: string;
  per_100g: {
    kcal: number;
    protein: number;
    fat: number;
    carbs: number;
    fiber: number;
    sodium: number;
  };
  cost_per_kg?: number;
  seasonal_months?: number[]; // 1-12
}

export interface Recipe {
  id: string;
  name: string;
  category: 'desayuno' | 'almuerzo' | 'colacion' | 'cena';
  tags: RecipeTag[];
  ingredients: RecipeIngredient[];
  steps: string[];
  per_portion: {
    kcal: number;
    protein: number;
    fat: number;
    carbs: number;
    fiber: number;
  };
  portions: number;
  prep_time_min: number;
  cooking_time_min: number;
  cost_estimate?: number;
  notes?: string;
}

export interface RecipeIngredient {
  food_id: string;
  grams: number;
  notes?: string; // "opcional", "al gusto", etc.
}

export type RecipeTag = 
  | 'sin_aceite'
  | 'sin_azucar'
  | 'budget'
  | 'alta_prote'
  | 'batch_cooking'
  | 'rapida'
  | 'social'
  | 'colesterol_friendly'
  | 'vegetal'
  | 'bajo_sodio';

// ===== PLANES DE ALIMENTACIÓN =====
export interface MealPlanDay {
  id: string;
  user_id: string;
  date: string; // ISO date
  meals: Meal[];
  totals: {
    kcal: number;
    protein: number;
    fat: number;
    carbs: number;
    fiber: number;
  };
  adherence?: number; // 0-1, calculado por comidas completadas
  notes?: string;
}

export interface Meal {
  type: 'desayuno' | 'almuerzo' | 'colacion' | 'cena' | 'post_entreno';
  recipe_id: string;
  portions: number;
  time_scheduled?: string; // HH:MM
  completed?: boolean;
  notes?: string;
}

// ===== ENTRENAMIENTOS =====
export interface WorkoutPlanDay {
  id: string;
  user_id: string;
  date: string; // ISO date
  blocks: WorkoutBlock[];
  duration_min: number;
  kcal_estimate: number;
  completed?: boolean;
  rpe?: number; // 1-10 Rate of Perceived Exertion
  notes?: string;
}

export interface WorkoutBlock {
  type: 'run' | 'hiit' | 'strength' | 'warmup' | 'cooldown';
  name: string;
  details: RunDetails | HIITDetails | StrengthDetails | BasicDetails;
  duration_min: number;
  kcal_estimate: number;
}

export interface RunDetails {
  distance_km?: number;
  speed_kmh: number;
  incline?: number;
  type: 'continuous' | 'intervals';
}

export interface HIITDetails {
  work_sec: number;
  rest_sec: number;
  rounds: number;
  exercises: string[];
}

export interface StrengthDetails {
  exercises: StrengthExercise[];
}

export interface StrengthExercise {
  name: string;
  sets: number;
  reps: number | 'AMRAP' | 'time'; // AMRAP = As Many Reps As Possible
  weight_kg?: number;
  duration_sec?: number; // para plancha, por ejemplo
  rest_sec: number;
}

export interface BasicDetails {
  description: string;
  intensity?: 'low' | 'medium' | 'high';
}

// ===== MARCAS PERSONALES =====
export interface PersonalRecords {
  user_id: string;
  pushups_max: number;
  abs_max: number;
  plank_sec: number;
  run_speed_kmh: number;
  run_duration_min: number;
  weight_lifted?: Record<string, number>; // ejercicio -> peso máximo
  updated_at: string;
}

// ===== LISTA DE COMPRAS =====
export interface ShoppingList {
  id: string;
  user_id: string;
  week_start: string; // ISO date
  items: ShoppingItem[];
  total_cost_estimate?: number;
  store_mode: 'mixed' | 'supermarket' | 'market' | 'baes';
}

export interface ShoppingItem {
  food_id: string;
  grams_total: number;
  store_hint: 'market' | 'supermarket' | 'baes';
  priority: 'high' | 'medium' | 'low';
  cost_estimate?: number;
  purchased?: boolean;
}

// ===== RECORDATORIOS =====
export interface Reminder {
  id: string;
  user_id: string;
  type: 'agua' | 'pesaje' | 'entreno' | 'batch_cooking';
  title: string;
  schedule_cron?: string; // para repeticiones
  time: string; // HH:MM
  days: number[]; // 0-6 (domingo-sábado)
  active: boolean;
  google_calendar_event_id?: string;
}

// ===== PROGRESIÓN Y AJUSTES =====
export interface ProgressRule {
  id: string;
  name: string;
  condition: string; // descripción de la regla
  action: 'increase_kcal' | 'decrease_kcal' | 'increase_volume' | 'decrease_volume' | 'alert';
  adjustment_pct: number;
  priority: number;
}

export interface ProgressSuggestion {
  rule_id: string;
  message: string;
  action_required: boolean;
  auto_applied?: boolean;
  created_at: string;
}

// ===== UI Y FILTROS =====
export interface RecipeFilter {
  category?: 'desayuno' | 'almuerzo' | 'colacion' | 'cena';
  tags?: RecipeTag[];
  max_kcal?: number;
  min_protein?: number;
  max_prep_time?: number;
  search_text?: string;
}

export interface WorkoutFilter {
  type?: 'run' | 'hiit' | 'strength';
  max_duration?: number;
  equipment_required?: (keyof Equipment)[];
}

// ===== CONFIGURACIÓN DE LA APP =====
export interface AppConfig {
  theme: 'light' | 'dark';
  units: {
    weight: 'kg' | 'lbs';
    distance: 'km' | 'miles';
    temperature: 'celsius' | 'fahrenheit';
  };
  notifications_enabled: boolean;
  google_calendar_connected: boolean;
  data_export_format: 'json' | 'csv';
}

// ===== ACTIVIDAD =====
export type ActivityFactor = {
  value: number;
  label: string;
  description: string;
};

export const ACTIVITY_FACTORS: ActivityFactor[] = [
  { value: 1.2, label: 'Sedentario', description: 'Poco o ningún ejercicio' },
  { value: 1.375, label: 'Ligero', description: 'Ejercicio ligero 1-3 días/semana' },
  { value: 1.55, label: 'Moderado', description: 'Ejercicio moderado 3-5 días/semana' },
  { value: 1.725, label: 'Alto', description: 'Ejercicio intenso 6-7 días/semana' },
  { value: 1.9, label: 'Muy Alto', description: 'Trabajo físico + ejercicio intenso' },
];

// ===== CONSTANTES DE MACROS =====
export const MACRO_RATIOS = {
  PROTEIN_G_PER_KG: { min: 1.6, max: 2.2 },
  FAT_G_PER_KG: { min: 0.6, max: 0.8 },
  KCAL_PER_G: {
    protein: 4,
    fat: 9,
    carbs: 4,
    fiber: 2,
  },
};