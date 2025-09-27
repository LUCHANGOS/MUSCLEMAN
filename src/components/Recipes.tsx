import React, { useState, useMemo } from 'react';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';

// Datos de ejemplo de recetas (simulando el repositorio)
interface Recipe {
  id: string;
  name: string;
  category: 'desayunos' | 'almuerzos' | 'cenas';
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  prep_time: number;
  tags: string[];
  ingredients: string[];
  instructions: string[];
}

const sampleRecipes: Recipe[] = [
  {
    id: '1',
    name: 'Huevos revueltos con champiñones',
    category: 'desayunos',
    calories: 165,
    protein: 15,
    fat: 11,
    carbs: 3,
    prep_time: 10,
    tags: ['sin_aceite', 'alta_proteina', 'rapida'],
    ingredients: ['2 huevos (100g)', 'Champiñones (100g)', 'Sal y pimienta'],
    instructions: [
      'Cortar los champiñones en rodajas',
      'Cocinar champiñones en sartén antiadherente',
      'Batir huevos y agregar a la sartén',
      'Revolver hasta cuajar, condimentar'
    ]
  },
  {
    id: '2',
    name: 'Pollo a la plancha con verduras',
    category: 'almuerzos',
    calories: 340,
    protein: 46,
    fat: 8,
    carbs: 15,
    prep_time: 20,
    tags: ['sin_aceite', 'alta_proteina', 'sin_azucar'],
    ingredients: ['Pechuga pollo (150g)', 'Zapallo (150g)', 'Porotos verdes (100g)', 'Pepino (100g)'],
    instructions: [
      'Salpimentar el pollo',
      'Cocinar pollo a la plancha 6-7 min por lado',
      'Hervir verduras al vapor 8-10 min',
      'Cortar pepino en rodajas y servir'
    ]
  },
  {
    id: '3',
    name: 'Burger magra sin pan',
    category: 'cenas',
    calories: 310,
    protein: 28,
    fat: 18,
    carbs: 8,
    prep_time: 15,
    tags: ['sin_aceite', 'alta_proteina', 'budget'],
    ingredients: ['Carne molida magra (120g)', 'Huevo (50g)', 'Champiñones (100g)', 'Cebolla (50g)'],
    instructions: [
      'Mezclar carne con huevo y formar hamburguesa',
      'Cocinar a la plancha 4-5 min por lado',
      'Saltear champiñones y cebolla',
      'Servir hamburguesa sobre cama de verduras'
    ]
  },
  {
    id: '4',
    name: 'Tazón de avena ligera',
    category: 'desayunos',
    calories: 190,
    protein: 8,
    fat: 4,
    carbs: 32,
    prep_time: 5,
    tags: ['sin_azucar', 'rapida', 'budget'],
    ingredients: ['Avena (40g)', 'Agua (200ml)', 'Canela', '1/2 Mandarina (opcional)'],
    instructions: [
      'Hervir agua con canela',
      'Agregar avena y cocinar 3-5 min',
      'Servir con mandarina en rodajas si se desea'
    ]
  },
  {
    id: '5',
    name: 'Ceviche social',
    category: 'almuerzos',
    calories: 270,
    protein: 22,
    fat: 6,
    carbs: 12,
    prep_time: 30,
    tags: ['sin_aceite', 'social', 'colesterol_friendly'],
    ingredients: ['Pescado blanco (150g)', 'Limones (3 unidades)', 'Cebolla morada (50g)', 'Cilantro'],
    instructions: [
      'Cortar pescado en cubos pequeños',
      'Marinar en jugo de limón 20 min',
      'Picar cebolla y cilantro finamente',
      'Mezclar todo y servir frío'
    ]
  },
  {
    id: '6',
    name: 'Pollo cítrico sin aceite',
    category: 'cenas',
    calories: 285,
    protein: 40,
    fat: 5,
    carbs: 18,
    prep_time: 25,
    tags: ['sin_aceite', 'alta_proteina', 'colesterol_friendly'],
    ingredients: ['Pechuga pollo (150g)', 'Jugo de limón', 'Ajo en polvo', 'Orégano', 'Zapallo (150g)', 'Pepino (100g)'],
    instructions: [
      'Marinar pollo con limón, ajo y orégano 10 min',
      'Cocinar pollo en sartén teflón 6-7 min por lado',
      'Cocer zapallo al vapor',
      'Servir con pepino fresco'
    ]
  }
];

const Recipes: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Obtener todos los tags únicos
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    sampleRecipes.forEach(recipe => {
      recipe.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  }, []);
  
  // Filtrar recetas
  const filteredRecipes = useMemo(() => {
    return sampleRecipes.filter(recipe => {
      const matchesCategory = selectedCategory === 'all' || recipe.category === selectedCategory;
      const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          recipe.ingredients.some(ing => ing.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesTags = selectedTags.length === 0 || 
                         selectedTags.every(tag => recipe.tags.includes(tag));
      
      return matchesCategory && matchesSearch && matchesTags;
    });
  }, [selectedCategory, searchTerm, selectedTags]);
  
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };
  
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'desayunos': return 'Desayunos';
      case 'almuerzos': return 'Almuerzos';
      case 'cenas': return 'Cenas';
      default: return 'Todas las categorías';
    }
  };
  
  const getTagLabel = (tag: string) => {
    const labels: Record<string, string> = {
      sin_aceite: 'Sin aceite',
      sin_azucar: 'Sin azúcar',
      alta_proteina: 'Alta proteína',
      rapida: 'Rápida',
      budget: 'Económica',
      social: 'Social',
      colesterol_friendly: 'Friendly colesterol'
    };
    return labels[tag] || tag;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl">
          Recetas Saludables
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Explora recetas sin aceite ni azúcar añadida, con gramajes exactos
        </p>
      </div>

      {/* Búsqueda y filtros */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col space-y-4">
          {/* Búsqueda */}
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar recetas o ingredientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          
          {/* Categorías */}
          <div className="flex flex-wrap gap-2">
            {['all', 'desayunos', 'almuerzos', 'cenas'].map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {getCategoryLabel(category)}
              </button>
            ))}
          </div>
          
          {/* Botón de filtros */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filtros avanzados
            </button>
            <div className="text-sm text-gray-500">
              {filteredRecipes.length} receta{filteredRecipes.length !== 1 ? 's' : ''} encontrada{filteredRecipes.length !== 1 ? 's' : ''}
            </div>
          </div>
          
          {/* Filtros avanzados */}
          {showFilters && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Filtrar por características:</h4>
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {getTagLabel(tag)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lista de recetas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecipes.map(recipe => (
          <div key={recipe.id} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
            <div className="p-6">
              {/* Header de la receta */}
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 flex-1">{recipe.name}</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  recipe.category === 'desayunos' ? 'bg-blue-100 text-blue-800' :
                  recipe.category === 'almuerzos' ? 'bg-green-100 text-green-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  {getCategoryLabel(recipe.category)}
                </span>
              </div>
              
              {/* Información nutricional */}
              <div className="grid grid-cols-4 gap-3 mb-4 text-center">
                <div>
                  <div className="text-lg font-bold text-green-600">{recipe.calories}</div>
                  <div className="text-xs text-gray-500">kcal</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-red-600">{recipe.protein}g</div>
                  <div className="text-xs text-gray-500">proteína</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-yellow-600">{recipe.fat}g</div>
                  <div className="text-xs text-gray-500">grasas</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-600">{recipe.carbs}g</div>
                  <div className="text-xs text-gray-500">carbs</div>
                </div>
              </div>
              
              {/* Tags */}
              <div className="flex flex-wrap gap-1 mb-4">
                {recipe.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                    {getTagLabel(tag)}
                  </span>
                ))}
                {recipe.tags.length > 3 && (
                  <span className="px-2 py-1 text-xs text-gray-500">+{recipe.tags.length - 3}</span>
                )}
              </div>
              
              {/* Tiempo de prep */}
              <div className="flex items-center text-sm text-gray-500 mb-4">
                <span>⏱️ {recipe.prep_time} min</span>
              </div>
              
              {/* Ingredientes */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Ingredientes:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {recipe.ingredients.slice(0, 3).map((ingredient, idx) => (
                    <li key={idx}>• {ingredient}</li>
                  ))}
                  {recipe.ingredients.length > 3 && (
                    <li className="text-gray-400">• y {recipe.ingredients.length - 3} más...</li>
                  )}
                </ul>
              </div>
              
              {/* Botón ver receta completa */}
              <button className="w-full mt-4 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                Ver receta completa
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Estado vacío */}
      {filteredRecipes.length === 0 && (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron recetas</h3>
          <p className="text-gray-500 mb-4">
            Intenta con otros términos de búsqueda o ajusta los filtros
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
              setSelectedTags([]);
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
};

export default Recipes;