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
import ProfileNew from './components/ProfileNew';
import GoogleCallback from './components/GoogleCallback';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuthStore } from './stores/authStore';

// Configurar React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const { currentUser } = useAuthStore();

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Rutas públicas de autenticación */}
            <Route 
              path="/login" 
              element={
                currentUser?.isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Login />
                )
              } 
            />
            <Route 
              path="/register" 
              element={
                currentUser?.isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Register />
                )
              } 
            />

            {/* Rutas principales protegidas con Layout */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="planes" element={<MealPlans />} />
              <Route path="recetas" element={<Recipes />} />
              <Route path="entrenamientos" element={<Workouts />} />
              <Route path="progreso" element={<Progress />} />
              <Route path="compras" element={<Shopping />} />
              <Route path="calendario" element={<Calendar />} />
              <Route path="perfil" element={<ProfileNew />} />
            </Route>

            {/* Callback para Google Calendar OAuth */}
            <Route path="/auth/callback" element={<GoogleCallback />} />

            {/* Ruta de fallback */}
            <Route 
              path="*" 
              element={
                currentUser?.isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
