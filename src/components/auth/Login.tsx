import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { LoginFormData } from '../../types';

interface LoginProps {
  onSuccess?: () => void;
}

const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const { login, isLoading, error, clearError } = useAuthStore();
  const [formData, setFormData] = useState<LoginFormData>({
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    // Validar teléfono
    if (!formData.phone.trim()) {
      return;
    }
    
    // Formatear teléfono (agregar +56 si no lo tiene)
    let phone = formData.phone.trim();
    if (!phone.startsWith('+56') && !phone.startsWith('56')) {
      phone = `+56${phone}`;
    } else if (phone.startsWith('56')) {
      phone = `+${phone}`;
    }
    
    const success = await login({ ...formData, phone });
    if (success && onSuccess) {
      onSuccess();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Solo números para teléfono
    if (name === 'phone') {
      const phoneValue = value.replace(/[^0-9]/g, '');
      setFormData(prev => ({ ...prev, [name]: phoneValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const formatPhoneDisplay = (phone: string) => {
    // Mostrar formato +56 9 XXXX XXXX
    const cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.length <= 8) {
      return cleaned;
    }
    return `+56 ${cleaned.slice(0, 1)} ${cleaned.slice(1, 5)} ${cleaned.slice(5, 9)}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 text-4xl flex items-center justify-center">
            🥗
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Ingresa a NutriFit
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Inicia sesión con tu número de teléfono
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Número de teléfono
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-400 text-sm">+56</span>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                className="appearance-none relative block w-full pl-12 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder="9 1234 5678"
                value={formData.phone}
                onChange={handleInputChange}
                maxLength={9}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Ingresa tu número sin el +56
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin -ml-1 mr-3 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Iniciando sesión...
                </div>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </div>

          <div className="text-center">
            <span className="text-sm text-gray-600">¿No tienes cuenta? </span>
            <Link 
              to="/register" 
              className="font-medium text-green-600 hover:text-green-500"
            >
              Regístrate aquí
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;