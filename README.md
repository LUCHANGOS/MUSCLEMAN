# 🥗 NutriFit - Web App de Alimentación y Entrenamiento Saludable

Una aplicación web **sin IA** que genera planes personalizados de alimentación y entrenamiento basados en reglas determinísticas. Diseñada para usuarios que buscan:

- ✅ Planes de alimentación **sin aceite ni azúcar añadida**
- ✅ Recetas con **gramajes precisos** y costos optimizados
- ✅ Rutinas de ejercicio adaptadas a equipamiento disponible
- ✅ **Tracking automático** con progresión sin IA
- ✅ Integración con **Google Calendar**
- ✅ **Modo BAES** para optimización de costos

## 🎯 Características Principales

### Calculadoras Nutricionales
- **IMC** (Índice de Masa Corporal)
- **TMB** usando fórmula Mifflin-St Jeor
- **GET** (Gasto Energético Total) con factores de actividad
- **Macros** personalizados: 1.6-2.2g/kg proteína, 0.6-0.8g/kg grasa
- **Validación de déficit calórico** con pisos de seguridad

### Generador de Planes Alimentarios
- Motor de reglas determinístico (sin IA)
- **3 plantillas de día**: Normal, Ayuno mañanero, 3 comidas simples
- Filtrado automático por preferencias (sin aceite/azúcar)
- Ajuste de gramajes para cumplir objetivos calóricos
- **Sustituciones** inteligentes de recetas

### Banco de Recetas Saludables
- **150 recetas** categorizadas (Desayunos, Almuerzos, Cenas)
- Sistema de **tags**: `sin_aceite`, `alta_prote`, `budget`, `colesterol_friendly`
- Carga desde archivos `.txt` del Recetario_Saludable
- **Costos estimados** por receta
- Filtros por calorías, proteína, tiempo de preparación

### Rutinas de Entrenamiento
- **5 plantillas**: HIIT corto, Cardio continuo, Fuerza casa, Con mancuernas, Principiante
- Progresión automática basada en **marcas personales**
- Adaptación según **equipamiento disponible**
- Cálculo de calorías quemadas (METs)
- **RPE** (Rate of Perceived Exertion) para ajustar intensidad

### Sistema de Progresión (Sin IA)
Reglas determinísticas:
- **Peso ↓ >1%/sem** → Subir kcal +5%
- **Peso ↓ <0.25%/sem por 2 semanas** → Bajar kcal -5%
- **Proteína <objetivo 3+ días/sem** → Alertar y sugerir snack proteico
- **RPE ≥8 sostenido** → Reducir volumen 10%
- **Marcas mejoradas** → Progresar series/intensidad 5-10%

### Lista de Compras Inteligente
- **Consolidación automática** de ingredientes semanales
- **Optimización por tienda**: Supermercado, Feria, Almacén BAES
- **Descuentos calculados**: BAES (25%), Temporada (20%), Volumen (15%)
- **Sugerencias de batch cooking** para proteínas >1kg
- Agrupación por tienda con notas útiles

### Integración Google Calendar
- **OAuth 2.0** con alcance `calendar.events`
- Exportar entrenamientos con recordatorios (15 min, 5 min antes)
- **Recordatorios automáticos**: Agua, Pesaje, Batch cooking
- Códigos de color por tipo de evento
- **Exportación ICS** para otros calendarios

## 🏗️ Arquitectura Técnica

### Frontend
- **React 18** + **TypeScript**
- **Zustand** para estado global
- **Tailwind CSS** para estilos
- **React Router** para navegación
- **React Query** para manejo de datos

### Almacenamiento
- **IndexedDB** (preferido) + **localStorage** (fallback)
- Esquemas versionados para migraciones
- Exportación/Importación JSON completa

### Calculadoras y Reglas
- Fórmulas validadas científicamente
- Motor de reglas completamente determinístico
- Sin dependencias de IA o APIs externas

## 🚀 Instalación y Desarrollo

### Prerrequisitos
- Node.js 18+ 
- npm o yarn

### Configuración

1. **Clonar e instalar dependencias:**
```bash
cd NutriFit_App
npm install
```

2. **Configurar variables de entorno:**
```bash
# .env.local
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_GOOGLE_CLIENT_SECRET=your_google_client_secret
REACT_APP_GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback
```

3. **Iniciar en desarrollo:**
```bash
npm run dev
```

4. **Construir para producción:**
```bash
npm run build
```

## 📁 Estructura del Proyecto

```
NutriFit_App/
├── src/
│   ├── components/          # Componentes React
│   ├── stores/             # Estados Zustand
│   ├── types/              # Tipos TypeScript
│   ├── utils/              # Lógica de negocio
│   │   ├── calculators.ts       # Fórmulas nutricionales
│   │   ├── mealPlanGenerator.ts # Motor de planes
│   │   ├── workoutGenerator.ts  # Motor de rutinas
│   │   ├── progressTracking.ts  # Sistema progresión
│   │   ├── shoppingListGenerator.ts # Lista compras
│   │   ├── googleCalendar.ts    # Integración calendario
│   │   ├── recipeLoader.ts      # Carga recetas .txt
│   │   └── dataStorage.ts       # Persistencia datos
│   └── hooks/              # Custom hooks
├── data/
│   ├── food_items.json     # Base de datos alimentos
│   ├── sample_recipes.json # Recetas de ejemplo
│   └── recipes/            # Recetas .txt adicionales
├── public/                 # Archivos estáticos
└── docs/                  # Documentación
```

## 🎨 Personalización

### Agregar Nuevas Recetas
1. Crear archivo `.txt` en `Recetario_Saludable/[categoria]/`
2. Seguir formato:
```
Nombre: [nombre de la receta]

Ingredientes:
[listado con gramajes]

Preparación:
[pasos breves]

Información Nutricional (por porción):
- Calorías: [kcal] kcal
- Proteína: [g] g
- Grasas: [g] g
- Carbohidratos: [g] g
```

### Modificar Reglas de Progresión
Editar `src/utils/progressTracking.ts`:
```typescript
const PROGRESS_RULES: ProgressRule[] = [
  {
    id: 'custom_rule',
    condition: 'Tu condición',
    action: 'increase_kcal|decrease_kcal|alert',
    adjustment_pct: 5,
    priority: 1
  }
];
```

### Agregar Nuevos Tipos de Entrenamiento
Modificar `src/utils/workoutGenerator.ts` agregando plantillas:
```typescript
const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 'new_workout',
    name: 'Mi Rutina Custom',
    type: 'mixed',
    duration_min: 30,
    required_equipment: ['mat'],
    fitness_level: ['beginner', 'intermediate'],
    blocks: [/* bloques de ejercicio */]
  }
];
```

## 🧪 Testing y Validación

### Ejecutar tests
```bash
npm run test
```

### Validar calculadoras
```bash
npm run test:calculators
```

### Verificar generación de planes
```bash
npm run test:meal-plans
```

## 📊 Datos de Ejemplo

La aplicación incluye:
- **Usuario demo** con perfil realista
- **16 alimentos básicos** con información nutricional
- **7 recetas validadas** según especificaciones
- **5 plantillas de entrenamiento** 
- **Configuración BAES** con descuentos reales

## 🔄 Roadmap

### MVP Completado ✅
- [x] Calculadoras nutricionales
- [x] Generador de planes alimentarios
- [x] Sistema de recetas
- [x] Rutinas de entrenamiento
- [x] Motor de progresión
- [x] Lista de compras con BAES
- [x] Integración Google Calendar
- [x] Persistencia de datos

### V1 (Próximo)
- [ ] Precios por supermercado específico
- [ ] Macros editables por el usuario
- [ ] Motor de sustituciones avanzado
- [ ] Más opciones de equipamiento

### V2 (Futuro)
- [ ] PWA (Progressive Web App)
- [ ] Recordatorios push
- [ ] Analytics de adherencia
- [ ] Exportación avanzada de reportes

## 🤝 Contribuir

1. Fork del proyecto
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

MIT License - ver archivo `LICENSE` para detalles.

## ⚠️ Disclaimer

Esta aplicación está diseñada para fines educativos y de bienestar general. **No reemplaza el consejo médico profesional**. Consulta con un médico o nutricionista antes de iniciar cualquier plan de alimentación o ejercicio.

---

**Desarrollado con ❤️ para promover hábitos saludables sin aceite ni azúcar añadida** 🥗💪