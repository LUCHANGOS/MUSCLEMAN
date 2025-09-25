import { 
  WorkoutPlanDay, 
  Reminder, 
  MealPlanDay 
} from '@/types';

/**
 * Configuración de Google Calendar API
 */
interface GoogleCalendarConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string[];
}

/**
 * Evento de Google Calendar
 */
interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  recurrence?: string[]; // RRULE
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
  colorId?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
}

/**
 * Estado de autenticación con Google
 */
interface GoogleAuthState {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  isAuthenticated: boolean;
}

/**
 * Configuración por defecto para Google Calendar
 */
const DEFAULT_CONFIG: GoogleCalendarConfig = {
  clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.REACT_APP_GOOGLE_CLIENT_SECRET || '',
  redirectUri: process.env.REACT_APP_GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/callback',
  scope: [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/calendar.readonly'
  ]
};

/**
 * Colores para diferentes tipos de eventos
 */
const EVENT_COLORS = {
  workout_strength: '11', // Rojo
  workout_cardio: '9',    // Azul
  workout_hiit: '6',      // Naranja
  meal_reminder: '2',     // Verde
  water_reminder: '7',    // Turquesa
  weigh_reminder: '5',    // Amarillo
  batch_cooking: '3',     // Morado
} as const;

/**
 * Cliente simplificado para Google Calendar API
 */
class GoogleCalendarClient {
  private config: GoogleCalendarConfig;
  private authState: GoogleAuthState;

  constructor(config: GoogleCalendarConfig = DEFAULT_CONFIG) {
    this.config = config;
    this.authState = this.loadAuthState();
  }

  /**
   * Carga estado de autenticación desde localStorage
   */
  private loadAuthState(): GoogleAuthState {
    try {
      const saved = localStorage.getItem('google_auth_state');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading auth state:', error);
    }

    return {
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      isAuthenticated: false
    };
  }

  /**
   * Guarda estado de autenticación en localStorage
   */
  private saveAuthState(): void {
    try {
      localStorage.setItem('google_auth_state', JSON.stringify(this.authState));
    } catch (error) {
      console.error('Error saving auth state:', error);
    }
  }

  /**
   * Genera URL de autorización de Google
   */
  public getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scope.join(' '),
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent'
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Intercambia código de autorización por tokens
   */
  public async exchangeCodeForTokens(code: string): Promise<boolean> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.config.redirectUri,
        }),
      });

      const data = await response.json();

      if (data.access_token) {
        this.authState = {
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresAt: Date.now() + (data.expires_in * 1000),
          isAuthenticated: true
        };
        this.saveAuthState();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      return false;
    }
  }

  /**
   * Verifica si el token de acceso es válido
   */
  private async ensureValidToken(): Promise<boolean> {
    if (!this.authState.accessToken) {
      return false;
    }

    // Si el token expira en menos de 5 minutos, renovarlo
    if (this.authState.expiresAt && Date.now() > (this.authState.expiresAt - 300000)) {
      return await this.refreshAccessToken();
    }

    return true;
  }

  /**
   * Renueva el token de acceso usando el refresh token
   */
  private async refreshAccessToken(): Promise<boolean> {
    if (!this.authState.refreshToken) {
      return false;
    }

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          refresh_token: this.authState.refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      const data = await response.json();

      if (data.access_token) {
        this.authState.accessToken = data.access_token;
        this.authState.expiresAt = Date.now() + (data.expires_in * 1000);
        if (data.refresh_token) {
          this.authState.refreshToken = data.refresh_token;
        }
        this.saveAuthState();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  }

  /**
   * Realiza llamada autenticada a la API de Google Calendar
   */
  private async apiCall(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', body?: any): Promise<any> {
    if (!(await this.ensureValidToken())) {
      throw new Error('No authenticated with Google Calendar');
    }

    const url = `https://www.googleapis.com/calendar/v3${endpoint}`;
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.authState.accessToken}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google Calendar API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Crea un evento en Google Calendar
   */
  public async createEvent(event: GoogleCalendarEvent, calendarId: string = 'primary'): Promise<string | null> {
    try {
      const result = await this.apiCall(`/calendars/${calendarId}/events`, 'POST', event);
      return result.id;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      return null;
    }
  }

  /**
   * Actualiza un evento existente
   */
  public async updateEvent(eventId: string, event: Partial<GoogleCalendarEvent>, calendarId: string = 'primary'): Promise<boolean> {
    try {
      await this.apiCall(`/calendars/${calendarId}/events/${eventId}`, 'PUT', event);
      return true;
    } catch (error) {
      console.error('Error updating calendar event:', error);
      return false;
    }
  }

  /**
   * Elimina un evento
   */
  public async deleteEvent(eventId: string, calendarId: string = 'primary'): Promise<boolean> {
    try {
      await this.apiCall(`/calendars/${calendarId}/events/${eventId}`, 'DELETE');
      return true;
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      return false;
    }
  }

  /**
   * Lista eventos en un rango de fechas
   */
  public async listEvents(
    startDate: string,
    endDate: string,
    calendarId: string = 'primary'
  ): Promise<GoogleCalendarEvent[]> {
    try {
      const params = new URLSearchParams({
        timeMin: new Date(startDate).toISOString(),
        timeMax: new Date(endDate).toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime'
      });

      const result = await this.apiCall(`/calendars/${calendarId}/events?${params.toString()}`);
      return result.items || [];
    } catch (error) {
      console.error('Error listing calendar events:', error);
      return [];
    }
  }

  /**
   * Verifica si está autenticado
   */
  public isAuthenticated(): boolean {
    return this.authState.isAuthenticated && !!this.authState.accessToken;
  }

  /**
   * Cierra sesión y limpia tokens
   */
  public logout(): void {
    this.authState = {
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      isAuthenticated: false
    };
    this.saveAuthState();
    localStorage.removeItem('google_auth_state');
  }
}

/**
 * Instancia global del cliente de Google Calendar
 */
const googleCalendarClient = new GoogleCalendarClient();

/**
 * Convierte un plan de entrenamiento a evento de Google Calendar
 */
function workoutToCalendarEvent(
  workout: WorkoutPlanDay,
  timezone: string = 'America/Santiago'
): GoogleCalendarEvent {
  const startDate = new Date(workout.date);
  // Asumir entrenamiento a las 18:00 si no se especifica
  startDate.setHours(18, 0, 0, 0);
  
  const endDate = new Date(startDate);
  endDate.setMinutes(endDate.getMinutes() + workout.duration_min);

  // Determinar tipo de entrenamiento principal
  const hasStrength = workout.blocks.some(b => b.type === 'strength');
  const hasCardio = workout.blocks.some(b => b.type === 'run');
  const hasHIIT = workout.blocks.some(b => b.type === 'hiit');
  
  let colorId = EVENT_COLORS.workout_strength;
  let workoutType = 'Fuerza';
  
  if (hasHIIT) {
    colorId = EVENT_COLORS.workout_hiit;
    workoutType = 'HIIT';
  } else if (hasCardio) {
    colorId = EVENT_COLORS.workout_cardio;
    workoutType = 'Cardio';
  }

  // Descripción detallada
  const description = [
    `🏋️ Entrenamiento de ${workoutType}`,
    `⏱️ Duración: ${workout.duration_min} minutos`,
    `🔥 Calorías estimadas: ${workout.kcal_estimate} kcal`,
    '',
    'Ejercicios:',
    ...workout.blocks.map(block => `• ${block.name} (${block.duration_min} min)`)
  ].join('\n');

  return {
    summary: `Entrenamiento - ${workoutType} (${workout.duration_min} min)`,
    description,
    start: {
      dateTime: startDate.toISOString(),
      timeZone: timezone
    },
    end: {
      dateTime: endDate.toISOString(),
      timeZone: timezone
    },
    colorId,
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 15 }, // Recordatorio 15 min antes
        { method: 'popup', minutes: 5 }   // Recordatorio 5 min antes
      ]
    }
  };
}

/**
 * Convierte un recordatorio a evento de Google Calendar
 */
function reminderToCalendarEvent(
  reminder: Reminder,
  timezone: string = 'America/Santiago'
): GoogleCalendarEvent {
  const today = new Date();
  const [hours, minutes] = reminder.time.split(':').map(Number);
  
  const startDate = new Date(today);
  startDate.setHours(hours, minutes, 0, 0);
  
  const endDate = new Date(startDate);
  endDate.setMinutes(endDate.getMinutes() + 5); // Recordatorio de 5 minutos

  let colorId = EVENT_COLORS.water_reminder;
  let icon = '💧';
  
  switch (reminder.type) {
    case 'agua':
      colorId = EVENT_COLORS.water_reminder;
      icon = '💧';
      break;
    case 'pesaje':
      colorId = EVENT_COLORS.weigh_reminder;
      icon = '⚖️';
      break;
    case 'batch_cooking':
      colorId = EVENT_COLORS.batch_cooking;
      icon = '👨‍🍳';
      break;
    case 'entreno':
      colorId = EVENT_COLORS.workout_strength;
      icon = '💪';
      break;
  }

  // Generar RRULE si tiene días específicos
  let recurrence: string[] | undefined;
  if (reminder.days.length > 0) {
    const dayNames = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
    const byDay = reminder.days.map(day => dayNames[day]).join(',');
    recurrence = [`RRULE:FREQ=WEEKLY;BYDAY=${byDay}`];
  }

  return {
    summary: `${icon} ${reminder.title}`,
    description: `Recordatorio automático de NutriFit\nTipo: ${reminder.type}`,
    start: {
      dateTime: startDate.toISOString(),
      timeZone: timezone
    },
    end: {
      dateTime: endDate.toISOString(),
      timeZone: timezone
    },
    recurrence,
    colorId,
    reminders: {
      useDefault: true
    }
  };
}

/**
 * Exporta un plan de entrenamiento a Google Calendar
 */
export async function exportWorkoutToCalendar(
  workout: WorkoutPlanDay,
  timezone: string = 'America/Santiago'
): Promise<string | null> {
  if (!googleCalendarClient.isAuthenticated()) {
    throw new Error('Usuario no autenticado con Google Calendar');
  }

  const event = workoutToCalendarEvent(workout, timezone);
  const eventId = await googleCalendarClient.createEvent(event);
  
  return eventId;
}

/**
 * Exporta múltiples entrenamientos a Google Calendar
 */
export async function exportWorkoutsToCalendar(
  workouts: WorkoutPlanDay[],
  timezone: string = 'America/Santiago'
): Promise<{ success: number; failed: number; eventIds: string[] }> {
  const results = {
    success: 0,
    failed: 0,
    eventIds: [] as string[]
  };

  for (const workout of workouts) {
    try {
      const eventId = await exportWorkoutToCalendar(workout, timezone);
      if (eventId) {
        results.success++;
        results.eventIds.push(eventId);
      } else {
        results.failed++;
      }
    } catch (error) {
      console.error('Error exporting workout:', error);
      results.failed++;
    }
  }

  return results;
}

/**
 * Exporta recordatorios a Google Calendar
 */
export async function exportRemindersToCalendar(
  reminders: Reminder[],
  timezone: string = 'America/Santiago'
): Promise<{ success: number; failed: number; eventIds: string[] }> {
  const results = {
    success: 0,
    failed: 0,
    eventIds: [] as string[]
  };

  for (const reminder of reminders) {
    try {
      const event = reminderToCalendarEvent(reminder, timezone);
      const eventId = await googleCalendarClient.createEvent(event);
      
      if (eventId) {
        results.success++;
        results.eventIds.push(eventId);
        
        // Actualizar recordatorio con ID del evento
        reminder.google_calendar_event_id = eventId;
      } else {
        results.failed++;
      }
    } catch (error) {
      console.error('Error exporting reminder:', error);
      results.failed++;
    }
  }

  return results;
}

/**
 * Crea evento de batch cooking basado en lista de compras
 */
export async function createBatchCookingEvent(
  date: string,
  duration_min: number = 90,
  recipes: string[] = [],
  timezone: string = 'America/Santiago'
): Promise<string | null> {
  const startDate = new Date(date);
  startDate.setHours(10, 0, 0, 0); // 10:00 AM por defecto
  
  const endDate = new Date(startDate);
  endDate.setMinutes(endDate.getMinutes() + duration_min);

  const description = [
    '👨‍🍳 Sesión de preparación masiva de comidas',
    `⏱️ Duración estimada: ${duration_min} minutos`,
    '',
    'Recetas a preparar:',
    ...recipes.map(recipe => `• ${recipe}`),
    '',
    'Recordatorios:',
    '• Preparar contenedores herméticos',
    '• Etiquetar con fechas',
    '• Organizar refrigerador/congelador'
  ].join('\n');

  const event: GoogleCalendarEvent = {
    summary: `👨‍🍳 Batch Cooking (${duration_min} min)`,
    description,
    start: {
      dateTime: startDate.toISOString(),
      timeZone: timezone
    },
    end: {
      dateTime: endDate.toISOString(),
      timeZone: timezone
    },
    colorId: EVENT_COLORS.batch_cooking,
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 30 }
      ]
    }
  };

  return await googleCalendarClient.createEvent(event);
}

/**
 * Genera archivo ICS para importar en otros calendarios
 */
export function generateICSFile(
  workouts: WorkoutPlanDay[],
  reminders: Reminder[] = [],
  timezone: string = 'America/Santiago'
): string {
  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NutriFit//Workout Calendar//ES',
    'CALSCALE:GREGORIAN',
    `X-WR-TIMEZONE:${timezone}`
  ];

  // Agregar entrenamientos
  for (const workout of workouts) {
    const startDate = new Date(workout.date);
    startDate.setHours(18, 0, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + workout.duration_min);

    const hasStrength = workout.blocks.some(b => b.type === 'strength');
    const hasCardio = workout.blocks.some(b => b.type === 'run');
    const hasHIIT = workout.blocks.some(b => b.type === 'hiit');
    
    let workoutType = 'Fuerza';
    if (hasHIIT) workoutType = 'HIIT';
    else if (hasCardio) workoutType = 'Cardio';

    lines.push(
      'BEGIN:VEVENT',
      `UID:workout_${workout.id}@nutrifit.app`,
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `SUMMARY:Entrenamiento - ${workoutType} (${workout.duration_min} min)`,
      `DESCRIPTION:Calorías estimadas: ${workout.kcal_estimate} kcal\\nBloques: ${workout.blocks.map(b => b.name).join(', ')}`,
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'END:VEVENT'
    );
  }

  // Agregar recordatorios
  for (const reminder of reminders) {
    const today = new Date();
    const [hours, minutes] = reminder.time.split(':').map(Number);
    
    const startDate = new Date(today);
    startDate.setHours(hours, minutes, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + 5);

    let rrule = '';
    if (reminder.days.length > 0) {
      const dayNames = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
      const byDay = reminder.days.map(day => dayNames[day]).join(',');
      rrule = `RRULE:FREQ=WEEKLY;BYDAY=${byDay}`;
    }

    lines.push(
      'BEGIN:VEVENT',
      `UID:reminder_${reminder.id}@nutrifit.app`,
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `SUMMARY:${reminder.title}`,
      `DESCRIPTION:Recordatorio automático de NutriFit`,
      'STATUS:CONFIRMED',
      'TRANSP:TRANSPARENT'
    );

    if (rrule) {
      lines.push(rrule);
    }

    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  
  return lines.join('\r\n');
}

/**
 * Funciones de utilidad para exportar
 */
export const GoogleCalendarUtils = {
  client: googleCalendarClient,
  
  getAuthUrl: () => googleCalendarClient.getAuthUrl(),
  
  authenticate: (code: string) => googleCalendarClient.exchangeCodeForTokens(code),
  
  isAuthenticated: () => googleCalendarClient.isAuthenticated(),
  
  logout: () => googleCalendarClient.logout(),
  
  exportWorkout: exportWorkoutToCalendar,
  
  exportWorkouts: exportWorkoutsToCalendar,
  
  exportReminders: exportRemindersToCalendar,
  
  createBatchCookingEvent,
  
  generateICS: generateICSFile
};