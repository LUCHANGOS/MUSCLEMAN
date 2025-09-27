import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { RegisterFormData } from '../../types';

interface RegisterProps {
  onSuccess?: () => void;
}

const Register: React.FC<RegisterProps> = ({ onSuccess }) => {
  const { register, isLoading, error, clearError } = useAuthStore();
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    lastName: '',
    phone: '',
    email: '',
    acceptTerms: false,
  });

  const [showTerms, setShowTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    // Validaciones básicas
    if (!formData.name.trim() || !formData.lastName.trim() || !formData.phone.trim()) {
      return;
    }
    
    if (!formData.acceptTerms) {
      return;
    }
    
    // Formatear teléfono
    let phone = formData.phone.trim();
    if (!phone.startsWith('+56') && !phone.startsWith('56')) {
      phone = `+56${phone}`;
    } else if (phone.startsWith('56')) {
      phone = `+${phone}`;
    }
    
    const success = await register({ 
      ...formData, 
      phone,
      name: formData.name.trim(),
      lastName: formData.lastName.trim() 
    });
    
    if (success && onSuccess) {
      onSuccess();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'phone') {
      // Solo números para teléfono
      const phoneValue = value.replace(/[^0-9]/g, '');
      setFormData(prev => ({ ...prev, [name]: phoneValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 text-4xl flex items-center justify-center">
            🥗
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Únete a MUSCULOSO
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Comienza tu viaje hacia una alimentación saludable
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="Tu nombre"
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                Apellido *
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="Tu apellido"
                value={formData.lastName}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Número de teléfono *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400 text-sm">+56</span>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  className="appearance-none relative block w-full pl-12 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="9 1234 5678"
                  value={formData.phone}
                  onChange={handleInputChange}
                  maxLength={9}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Este será tu identificador único para iniciar sesión
              </p>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email (opcional)
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="acceptTerms"
                name="acceptTerms"
                type="checkbox"
                required
                className="focus:ring-green-500 h-4 w-4 text-green-600 border-gray-300 rounded"
                checked={formData.acceptTerms}
                onChange={handleInputChange}
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="acceptTerms" className="text-gray-700">
                Acepto los{' '}
                <button
                  type="button"
                  onClick={() => setShowTerms(true)}
                  className="font-medium text-green-600 hover:text-green-500"
                >
                  términos y condiciones
                </button>{' '}
                de uso de NutriFit
              </label>
            </div>
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
              disabled={isLoading || !formData.acceptTerms}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin -ml-1 mr-3 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Registrando...
                </div>
              ) : (
                'Crear Cuenta'
              )}
            </button>
          </div>

          <div className="text-center">
            <span className="text-sm text-gray-600">¿Ya tienes cuenta? </span>
            <Link 
              to="/login" 
              className="font-medium text-green-600 hover:text-green-500"
            >
              Inicia sesión aquí
            </Link>
          </div>
        </form>
      </div>

      {/* Modal de términos y condiciones */}
      {showTerms && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Términos y Condiciones
                </h3>
                <div className="text-sm text-gray-700 space-y-3 max-h-96 overflow-y-auto">
                  <p>Al usar NutriFit, aceptas:</p>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Proporcionar información precisa sobre tu salud</li>
                    <li>Que las recomendaciones son orientativas y no reemplazan consulta médica</li>
                    <li>El uso de tus datos para personalizar tu experiencia</li>
                    <li>Que puedes eliminar tu cuenta y datos en cualquier momento</li>
                    <li>Usar la aplicación de forma responsable</li>
                  </ul>
                  <p className="text-xs text-gray-600 mt-4">
                    Última actualización: {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowTerms(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;