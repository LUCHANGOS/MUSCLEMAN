import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import MealPlans from './components/MealPlans';
import Recipes from './components/Recipes';
import Workouts from './components/Workouts';
import Progress from './components/Progress';
import Shopping from './components/Shopping';
import Calendar from './components/Calendar';
import Profile from './components/Profile';
import { useUserStore } from './stores/userStore';

// Configurar React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const { currentUser, isAuthenticated } = useUserStore();

  // Componente para rutas protegidas
  const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/onboarding" replace />;
    }
    return <>{children}</>;
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Ruta de onboarding para nuevos usuarios */}
            <Route 
              path="/onboarding" 
              element={
                isAuthenticated ? 
                <Navigate to="/" replace /> : 
                <div className="flex items-center justify-center min-h-screen">
                  <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
                    <div className="text-center">
                      <h1 className="text-3xl font-bold text-primary-600 mb-4">
                        🥗 NutriFit
                      </h1>
                      <p className="text-gray-600 mb-8">
                        Tu coach personal para alimentación saludable y entrenamientos sin IA
                      </p>
                      <div className="space-y-4">
                        <button className="btn-primary w-full">
                          Comenzar
                        </button>
                        <p className="text-xs text-gray-500">
                          Planes determinísticos • Sin aceite ni azúcar • Con Google Calendar
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              } 
            />

            {/* Rutas principales protegidas */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="planes" element={<MealPlans />} />
              <Route path="recetas" element={<Recipes />} />
              <Route path="entrenamientos" element={<Workouts />} />
              <Route path="progreso" element={<Progress />} />
              <Route path="compras" element={<Shopping />} />
              <Route path="calendario" element={<Calendar />} />
              <Route path="perfil" element={<Profile />} />
            </Route>

            {/* Callback para Google Calendar OAuth */}
            <Route 
              path="/auth/callback" 
              element={
                <div className="flex items-center justify-center min-h-screen">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Conectando con Google Calendar...</p>
                  </div>
                </div>
              } 
            />

            {/* Ruta de fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;