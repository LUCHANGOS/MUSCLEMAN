import { 
  User, 
  MealPlanDay, 
  WorkoutPlanDay, 
  Measurement, 
  Recipe, 
  ShoppingList, 
  Reminder,
  PersonalRecords,
  AppConfig 
} from '@/types';

/**
 * Versiones de esquema de datos para migraciones
 */
const SCHEMA_VERSION = 1;
const DB_NAME = 'NutriFitDB';
const DB_VERSION = 1;

/**
 * Nombres de stores para IndexedDB
 */
const STORES = {
  users: 'users',
  meal_plans: 'meal_plans',
  workouts: 'workouts',
  measurements: 'measurements',
  recipes: 'recipes',
  shopping_lists: 'shopping_lists',
  reminders: 'reminders',
  personal_records: 'personal_records',
  app_config: 'app_config'
} as const;

/**
 * Interface para operaciones de base de datos
 */
interface DatabaseOperation<T> {
  store: string;
  operation: 'get' | 'put' | 'delete' | 'getAll' | 'clear';
  key?: string | number;
  data?: T;
  index?: string;
  query?: any;
}

/**
 * Clase para manejar IndexedDB
 */
class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private initialized = false;

  /**
   * Inicializa la base de datos IndexedDB
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Error opening IndexedDB:', request.error);
        reject(false);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.initialized = true;
        console.log('IndexedDB initialized successfully');
        resolve(true);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.setupDatabase(db);
      };
    });
  }

  /**
   * Configura estructura de la base de datos
   */
  private setupDatabase(db: IDBDatabase): void {
    // Store de usuarios
    if (!db.objectStoreNames.contains(STORES.users)) {
      const userStore = db.createObjectStore(STORES.users, { keyPath: 'id' });
      userStore.createIndex('email', 'email', { unique: true });
    }

    // Store de planes alimentarios
    if (!db.objectStoreNames.contains(STORES.meal_plans)) {
      const mealPlanStore = db.createObjectStore(STORES.meal_plans, { keyPath: 'id' });
      mealPlanStore.createIndex('user_id', 'user_id', { unique: false });
      mealPlanStore.createIndex('date', 'date', { unique: false });
    }

    // Store de entrenamientos
    if (!db.objectStoreNames.contains(STORES.workouts)) {
      const workoutStore = db.createObjectStore(STORES.workouts, { keyPath: 'id' });
      workoutStore.createIndex('user_id', 'user_id', { unique: false });
      workoutStore.createIndex('date', 'date', { unique: false });
    }

    // Store de mediciones
    if (!db.objectStoreNames.contains(STORES.measurements)) {
      const measurementStore = db.createObjectStore(STORES.measurements, { keyPath: 'id' });
      measurementStore.createIndex('user_id', 'user_id', { unique: false });
      measurementStore.createIndex('date', 'date', { unique: false });
    }

    // Store de recetas
    if (!db.objectStoreNames.contains(STORES.recipes)) {
      const recipeStore = db.createObjectStore(STORES.recipes, { keyPath: 'id' });
      recipeStore.createIndex('category', 'category', { unique: false });
      recipeStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
    }

    // Store de listas de compras
    if (!db.objectStoreNames.contains(STORES.shopping_lists)) {
      const shoppingStore = db.createObjectStore(STORES.shopping_lists, { keyPath: 'id' });
      shoppingStore.createIndex('user_id', 'user_id', { unique: false });
      shoppingStore.createIndex('week_start', 'week_start', { unique: false });
    }

    // Store de recordatorios
    if (!db.objectStoreNames.contains(STORES.reminders)) {
      const reminderStore = db.createObjectStore(STORES.reminders, { keyPath: 'id' });
      reminderStore.createIndex('user_id', 'user_id', { unique: false });
      reminderStore.createIndex('type', 'type', { unique: false });
    }

    // Store de marcas personales
    if (!db.objectStoreNames.contains(STORES.personal_records)) {
      const recordsStore = db.createObjectStore(STORES.personal_records, { keyPath: 'user_id' });
    }

    // Store de configuración
    if (!db.objectStoreNames.contains(STORES.app_config)) {
      db.createObjectStore(STORES.app_config, { keyPath: 'id' });
    }
  }

  /**
   * Ejecuta una operación en IndexedDB
   */
  async execute<T>(operation: DatabaseOperation<T>): Promise<T | T[] | boolean> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([operation.store], 
        operation.operation === 'get' || operation.operation === 'getAll' ? 'readonly' : 'readwrite'
      );
      
      const store = transaction.objectStore(operation.store);

      let request: IDBRequest;

      switch (operation.operation) {
        case 'get':
          request = store.get(operation.key!);
          break;
        case 'put':
          request = store.put(operation.data!);
          break;
        case 'delete':
          request = store.delete(operation.key!);
          break;
        case 'getAll':
          if (operation.index && operation.query) {
            const index = store.index(operation.index);
            request = index.getAll(operation.query);
          } else {
            request = store.getAll();
          }
          break;
        case 'clear':
          request = store.clear();
          break;
        default:
          reject(new Error(`Unsupported operation: ${operation.operation}`));
          return;
      }

      request.onsuccess = () => {
        if (operation.operation === 'put' || operation.operation === 'delete' || operation.operation === 'clear') {
          resolve(true);
        } else {
          resolve(request.result);
        }
      };

      request.onerror = () => {
        console.error('IndexedDB operation failed:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Cierra la conexión con la base de datos
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initialized = false;
    }
  }
}

/**
 * Instancia global de IndexedDB manager
 */
const dbManager = new IndexedDBManager();

/**
 * Clase para almacenamiento en localStorage (fallback y datos pequeños)
 */
class LocalStorageManager {
  private prefix = 'nutrifit_';

  /**
   * Guarda datos en localStorage
   */
  set<T>(key: string, data: T): boolean {
    try {
      const serialized = JSON.stringify({
        data,
        timestamp: Date.now(),
        version: SCHEMA_VERSION
      });
      localStorage.setItem(this.prefix + key, serialized);
      return true;
    } catch (error) {
      console.error('LocalStorage set error:', error);
      return false;
    }
  }

  /**
   * Obtiene datos de localStorage
   */
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.prefix + key);
      if (!item) return null;

      const parsed = JSON.parse(item);
      
      // Verificar versión del esquema
      if (parsed.version !== SCHEMA_VERSION) {
        console.warn(`Schema version mismatch for ${key}. Expected: ${SCHEMA_VERSION}, got: ${parsed.version}`);
        this.remove(key);
        return null;
      }

      return parsed.data;
    } catch (error) {
      console.error('LocalStorage get error:', error);
      return null;
    }
  }

  /**
   * Elimina datos de localStorage
   */
  remove(key: string): boolean {
    try {
      localStorage.removeItem(this.prefix + key);
      return true;
    } catch (error) {
      console.error('LocalStorage remove error:', error);
      return false;
    }
  }

  /**
   * Limpia todos los datos de NutriFit
   */
  clear(): boolean {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix));
      keys.forEach(key => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.error('LocalStorage clear error:', error);
      return false;
    }
  }

  /**
   * Obtiene todas las claves que empiezan con el prefijo
   */
  getAllKeys(): string[] {
    try {
      return Object.keys(localStorage)
        .filter(key => key.startsWith(this.prefix))
        .map(key => key.substring(this.prefix.length));
    } catch (error) {
      console.error('LocalStorage getAllKeys error:', error);
      return [];
    }
  }
}

/**
 * Instancia global de localStorage manager
 */
const localStorageManager = new LocalStorageManager();

/**
 * API unificada para persistencia de datos
 */
export class DataStorage {
  private useIndexedDB: boolean = true;

  constructor() {
    // Verificar soporte para IndexedDB
    this.useIndexedDB = 'indexedDB' in window;
    
    if (this.useIndexedDB) {
      dbManager.initialize().catch(() => {
        console.warn('IndexedDB initialization failed, falling back to localStorage');
        this.useIndexedDB = false;
      });
    }
  }

  // ===== OPERACIONES DE USUARIO =====

  async saveUser(user: User): Promise<boolean> {
    if (this.useIndexedDB) {
      try {
        await dbManager.execute({ store: STORES.users, operation: 'put', data: user });
        return true;
      } catch (error) {
        console.error('Error saving user to IndexedDB:', error);
      }
    }
    
    return localStorageManager.set(`user_${user.id}`, user);
  }

  async getUser(userId: string): Promise<User | null> {
    if (this.useIndexedDB) {
      try {
        const user = await dbManager.execute<User>({ 
          store: STORES.users, 
          operation: 'get', 
          key: userId 
        });
        return user as User || null;
      } catch (error) {
        console.error('Error getting user from IndexedDB:', error);
      }
    }
    
    return localStorageManager.get<User>(`user_${userId}`);
  }

  // ===== OPERACIONES DE PLANES ALIMENTARIOS =====

  async saveMealPlan(mealPlan: MealPlanDay): Promise<boolean> {
    if (this.useIndexedDB) {
      try {
        await dbManager.execute({ store: STORES.meal_plans, operation: 'put', data: mealPlan });
        return true;
      } catch (error) {
        console.error('Error saving meal plan to IndexedDB:', error);
      }
    }
    
    return localStorageManager.set(`meal_plan_${mealPlan.id}`, mealPlan);
  }

  async getMealPlans(userId: string, startDate?: string, endDate?: string): Promise<MealPlanDay[]> {
    if (this.useIndexedDB) {
      try {
        const plans = await dbManager.execute<MealPlanDay[]>({ 
          store: STORES.meal_plans, 
          operation: 'getAll',
          index: 'user_id',
          query: userId
        });
        
        let filteredPlans = plans as MealPlanDay[];
        
        if (startDate && endDate) {
          filteredPlans = filteredPlans.filter(plan => 
            plan.date >= startDate && plan.date <= endDate
          );
        }
        
        return filteredPlans.sort((a, b) => a.date.localeCompare(b.date));
      } catch (error) {
        console.error('Error getting meal plans from IndexedDB:', error);
      }
    }
    
    // Fallback a localStorage
    const keys = localStorageManager.getAllKeys().filter(key => key.startsWith('meal_plan_'));
    const plans: MealPlanDay[] = [];
    
    for (const key of keys) {
      const plan = localStorageManager.get<MealPlanDay>(key);
      if (plan && plan.user_id === userId) {
        if (!startDate || !endDate || (plan.date >= startDate && plan.date <= endDate)) {
          plans.push(plan);
        }
      }
    }
    
    return plans.sort((a, b) => a.date.localeCompare(b.date));
  }

  // ===== OPERACIONES DE ENTRENAMIENTOS =====

  async saveWorkout(workout: WorkoutPlanDay): Promise<boolean> {
    if (this.useIndexedDB) {
      try {
        await dbManager.execute({ store: STORES.workouts, operation: 'put', data: workout });
        return true;
      } catch (error) {
        console.error('Error saving workout to IndexedDB:', error);
      }
    }
    
    return localStorageManager.set(`workout_${workout.id}`, workout);
  }

  async getWorkouts(userId: string, startDate?: string, endDate?: string): Promise<WorkoutPlanDay[]> {
    if (this.useIndexedDB) {
      try {
        const workouts = await dbManager.execute<WorkoutPlanDay[]>({ 
          store: STORES.workouts, 
          operation: 'getAll',
          index: 'user_id',
          query: userId
        });
        
        let filteredWorkouts = workouts as WorkoutPlanDay[];
        
        if (startDate && endDate) {
          filteredWorkouts = filteredWorkouts.filter(workout => 
            workout.date >= startDate && workout.date <= endDate
          );
        }
        
        return filteredWorkouts.sort((a, b) => a.date.localeCompare(b.date));
      } catch (error) {
        console.error('Error getting workouts from IndexedDB:', error);
      }
    }
    
    // Fallback a localStorage
    const keys = localStorageManager.getAllKeys().filter(key => key.startsWith('workout_'));
    const workouts: WorkoutPlanDay[] = [];
    
    for (const key of keys) {
      const workout = localStorageManager.get<WorkoutPlanDay>(key);
      if (workout && workout.user_id === userId) {
        if (!startDate || !endDate || (workout.date >= startDate && workout.date <= endDate)) {
          workouts.push(workout);
        }
      }
    }
    
    return workouts.sort((a, b) => a.date.localeCompare(b.date));
  }

  // ===== OPERACIONES DE MEDICIONES =====

  async saveMeasurement(measurement: Measurement): Promise<boolean> {
    if (this.useIndexedDB) {
      try {
        await dbManager.execute({ store: STORES.measurements, operation: 'put', data: measurement });
        return true;
      } catch (error) {
        console.error('Error saving measurement to IndexedDB:', error);
      }
    }
    
    return localStorageManager.set(`measurement_${measurement.id}`, measurement);
  }

  async getMeasurements(userId: string, limit: number = 50): Promise<Measurement[]> {
    if (this.useIndexedDB) {
      try {
        const measurements = await dbManager.execute<Measurement[]>({ 
          store: STORES.measurements, 
          operation: 'getAll',
          index: 'user_id',
          query: userId
        });
        
        return (measurements as Measurement[])
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, limit);
      } catch (error) {
        console.error('Error getting measurements from IndexedDB:', error);
      }
    }
    
    // Fallback a localStorage
    const keys = localStorageManager.getAllKeys().filter(key => key.startsWith('measurement_'));
    const measurements: Measurement[] = [];
    
    for (const key of keys) {
      const measurement = localStorageManager.get<Measurement>(key);
      if (measurement && measurement.user_id === userId) {
        measurements.push(measurement);
      }
    }
    
    return measurements
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, limit);
  }

  // ===== OPERACIONES DE RECETAS =====

  async saveRecipe(recipe: Recipe): Promise<boolean> {
    if (this.useIndexedDB) {
      try {
        await dbManager.execute({ store: STORES.recipes, operation: 'put', data: recipe });
        return true;
      } catch (error) {
        console.error('Error saving recipe to IndexedDB:', error);
      }
    }
    
    return localStorageManager.set(`recipe_${recipe.id}`, recipe);
  }

  async getRecipes(category?: string): Promise<Recipe[]> {
    if (this.useIndexedDB) {
      try {
        let recipes: Recipe[];
        
        if (category) {
          recipes = await dbManager.execute<Recipe[]>({ 
            store: STORES.recipes, 
            operation: 'getAll',
            index: 'category',
            query: category
          });
        } else {
          recipes = await dbManager.execute<Recipe[]>({ 
            store: STORES.recipes, 
            operation: 'getAll'
          });
        }
        
        return recipes as Recipe[];
      } catch (error) {
        console.error('Error getting recipes from IndexedDB:', error);
      }
    }
    
    // Fallback a localStorage
    const keys = localStorageManager.getAllKeys().filter(key => key.startsWith('recipe_'));
    const recipes: Recipe[] = [];
    
    for (const key of keys) {
      const recipe = localStorageManager.get<Recipe>(key);
      if (recipe) {
        if (!category || recipe.category === category) {
          recipes.push(recipe);
        }
      }
    }
    
    return recipes;
  }

  // ===== OPERACIONES DE CONFIGURACIÓN =====

  async saveAppConfig(config: AppConfig): Promise<boolean> {
    if (this.useIndexedDB) {
      try {
        await dbManager.execute({ 
          store: STORES.app_config, 
          operation: 'put', 
          data: { id: 'main', ...config }
        });
        return true;
      } catch (error) {
        console.error('Error saving config to IndexedDB:', error);
      }
    }
    
    return localStorageManager.set('app_config', config);
  }

  async getAppConfig(): Promise<AppConfig | null> {
    if (this.useIndexedDB) {
      try {
        const config = await dbManager.execute<AppConfig & { id: string }>({ 
          store: STORES.app_config, 
          operation: 'get', 
          key: 'main' 
        });
        
        if (config) {
          const { id, ...appConfig } = config as AppConfig & { id: string };
          return appConfig;
        }
        
        return null;
      } catch (error) {
        console.error('Error getting config from IndexedDB:', error);
      }
    }
    
    return localStorageManager.get<AppConfig>('app_config');
  }

  // ===== OPERACIONES DE LIMPIEZA =====

  async clearUserData(userId: string): Promise<boolean> {
    try {
      if (this.useIndexedDB) {
        // Limpiar cada store por user_id
        const stores = [STORES.meal_plans, STORES.workouts, STORES.measurements, STORES.shopping_lists, STORES.reminders];
        
        for (const store of stores) {
          const items = await dbManager.execute<any[]>({ 
            store, 
            operation: 'getAll',
            index: 'user_id',
            query: userId
          });
          
          for (const item of items as any[]) {
            await dbManager.execute({ store, operation: 'delete', key: item.id });
          }
        }
        
        // Eliminar usuario
        await dbManager.execute({ store: STORES.users, operation: 'delete', key: userId });
        
        // Eliminar marcas personales
        await dbManager.execute({ store: STORES.personal_records, operation: 'delete', key: userId });
      }
      
      // Limpiar localStorage
      const keys = localStorageManager.getAllKeys();
      for (const key of keys) {
        if (key.includes(userId) || key.startsWith('user_' + userId)) {
          localStorageManager.remove(key);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error clearing user data:', error);
      return false;
    }
  }

  async clearAllData(): Promise<boolean> {
    try {
      if (this.useIndexedDB) {
        for (const store of Object.values(STORES)) {
          await dbManager.execute({ store, operation: 'clear' });
        }
      }
      
      localStorageManager.clear();
      
      return true;
    } catch (error) {
      console.error('Error clearing all data:', error);
      return false;
    }
  }

  // ===== OPERACIONES DE EXPORTACIÓN/IMPORTACIÓN =====

  async exportUserData(userId: string): Promise<object> {
    const userData: any = {
      user: await this.getUser(userId),
      meal_plans: await this.getMealPlans(userId),
      workouts: await this.getWorkouts(userId),
      measurements: await this.getMeasurements(userId, 1000),
      exported_at: new Date().toISOString(),
      schema_version: SCHEMA_VERSION
    };

    return userData;
  }

  async importUserData(userData: any): Promise<boolean> {
    try {
      // Validar versión del esquema
      if (userData.schema_version !== SCHEMA_VERSION) {
        console.warn('Schema version mismatch during import');
        // Aquí podrías implementar migraciones de datos
      }

      // Importar usuario
      if (userData.user) {
        await this.saveUser(userData.user);
      }

      // Importar planes alimentarios
      if (userData.meal_plans) {
        for (const mealPlan of userData.meal_plans) {
          await this.saveMealPlan(mealPlan);
        }
      }

      // Importar entrenamientos
      if (userData.workouts) {
        for (const workout of userData.workouts) {
          await this.saveWorkout(workout);
        }
      }

      // Importar mediciones
      if (userData.measurements) {
        for (const measurement of userData.measurements) {
          await this.saveMeasurement(measurement);
        }
      }

      return true;
    } catch (error) {
      console.error('Error importing user data:', error);
      return false;
    }
  }
}

/**
 * Instancia global del sistema de almacenamiento
 */
export const dataStorage = new DataStorage();

/**
 * Utilidades para trabajar con el almacenamiento
 */
export const StorageUtils = {
  /**
   * Genera un ID único para nuevos registros
   */
  generateId: (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  /**
   * Calcula el tamaño aproximado de los datos almacenados
   */
  calculateStorageSize: (): { localStorage: number; indexedDB: string } => {
    let localStorageSize = 0;
    
    try {
      for (const key in localStorage) {
        if (key.startsWith('nutrifit_')) {
          localStorageSize += localStorage[key].length + key.length;
        }
      }
    } catch (error) {
      console.error('Error calculating localStorage size:', error);
    }

    return {
      localStorage: Math.round(localStorageSize / 1024), // KB
      indexedDB: 'No disponible' // IndexedDB no tiene API simple para calcular tamaño
    };
  },

  /**
   * Verifica disponibilidad de almacenamiento
   */
  checkStorageAvailability: (): { localStorage: boolean; indexedDB: boolean } => {
    const hasLocalStorage = (() => {
      try {
        const test = '__storage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
      } catch {
        return false;
      }
    })();

    const hasIndexedDB = (() => {
      try {
        return 'indexedDB' in window && indexedDB != null;
      } catch {
        return false;
      }
    })();

    return { localStorage: hasLocalStorage, indexedDB: hasIndexedDB };
  }
};