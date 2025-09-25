import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const GoogleCallback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Aquí se procesaría el callback de Google OAuth
    const handleCallback = async () => {
      try {
        // Simular procesamiento del callback
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Redirigir al dashboard
        navigate('/dashboard');
      } catch (error) {
        console.error('Error procesando callback de Google:', error);
        navigate('/dashboard');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
        <h2 className="mt-4 text-xl font-semibold text-gray-900">
          Conectando con Google Calendar...
        </h2>
        <p className="mt-2 text-gray-600">
          Por favor espera mientras procesamos tu autorización
        </p>
      </div>
    </div>
  );
};

export default GoogleCallback;