import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import PersonalInfoStep from './PersonalInfoStep';
import HealthInfoStep from './HealthInfoStep';
import PreferencesStep from './PreferencesStep';
import EquipmentStep from './EquipmentStep';
import ScheduleStep from './ScheduleStep';

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { 
    onboardingData, 
    updateOnboardingStep, 
    completeProfile, 
    isLoading 
  } = useAuthStore();

  const { currentStep, totalSteps } = onboardingData;

  const nextStep = () => {
    if (currentStep < totalSteps) {
      updateOnboardingStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      updateOnboardingStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    const success = await completeProfile();
    if (success) {
      navigate('/dashboard');
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <PersonalInfoStep onNext={nextStep} />;
      case 2:
        return <HealthInfoStep onNext={nextStep} onPrev={prevStep} />;
      case 3:
        return <PreferencesStep onNext={nextStep} onPrev={prevStep} />;
      case 4:
        return <EquipmentStep onNext={nextStep} onPrev={prevStep} />;
      case 5:
        return <ScheduleStep onPrev={prevStep} onComplete={handleComplete} isLoading={isLoading} />;
      default:
        return <PersonalInfoStep onNext={nextStep} />;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return 'Información Personal';
      case 2:
        return 'Información de Salud';
      case 3:
        return 'Preferencias Alimentarias';
      case 4:
        return 'Equipamiento';
      case 5:
        return 'Horarios y Objetivos';
      default:
        return 'Configuración';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con progreso */}
      <div className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🥗 Configuración de Perfil
              </h1>
              <p className="text-sm text-gray-600">
                Paso {currentStep} de {totalSteps}: {getStepTitle()}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-green-600">
                {Math.round((currentStep / totalSteps) * 100)}% completado
              </div>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>

          {/* Indicadores de pasos */}
          <div className="flex justify-between mt-4">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i + 1}
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  i + 1 <= currentStep
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contenido del paso actual */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {renderCurrentStep()}
      </div>
    </div>
  );
};

export default Onboarding;