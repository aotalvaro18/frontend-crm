// src/pages/auth/LoginPage.tsx
// VERSIÓN HÍBRIDA DEFINITIVA Y REFACTORIZADA

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, WifiOff } from 'lucide-react';

// Components
import { Button } from '@/components/ui/Button';
import { Input, EmailInput } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import Page from '@/components/layout/Page';
import ForgotPasswordModal from '@/components/auth/ForgotPasswordModal';
import FeaturesShowcase from '@/components/auth/FeaturesShowcase';

// Hooks y context
import { useAuth } from '@/context/AuthContext';

// Utils
//import { cn } from '@/utils/cn';
import { env } from '@/config/environment';

// ============================================
// VALIDATION SCHEMA
// ============================================

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Ingresa un email válido')
    .max(100, 'El email es demasiado largo'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(128, 'La contraseña es demasiado larga'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ============================================
// MAIN LOGIN PAGE COMPONENT
// ============================================

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // ✅ CORRECCIÓN 1: Traemos la función 'resetPassword' del contexto de autenticación.
  const { signIn, resetPassword, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setFocus,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  // --- EFFECTS ---
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      const state = location.state as { from?: { pathname?: string } } | null;
      const from = state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, location.state]);

  useEffect(() => {
    const timer = setTimeout(() => setFocus('email'), 100);
    return () => clearTimeout(timer);
  }, [setFocus]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // --- HANDLERS ---
  const onLoginSubmit = async (data: LoginFormData) => {
    if (isOffline) {
      setLoginError('No hay conexión a internet. Verifica y reintenta.');
      return;
    }
    setLoginError('');
    
    try {
      await signIn({ email: data.email, password: data.password });
    } catch (error: any) {
      const COGNITO_ERROR_MAP: Record<string, string> = {
        'User does not exist': 'Usuario no encontrado. Verifica tu email.',
        'Incorrect username or password': 'Email o contraseña incorrectos.',
        'User is not confirmed': 'Debes confirmar tu cuenta antes de iniciar sesión.',
        'Too many failed attempts': 'Demasiados intentos fallidos. Intenta más tarde.',
        'Network error': 'Error de conexión. Verifica tu internet.',
      };
      
      const rawMessage = error.message || 'unknown';
      let finalMessage = 'Error al iniciar sesión. Intenta nuevamente.';
      for (const key in COGNITO_ERROR_MAP) {
        if (rawMessage.includes(key)) {
          finalMessage = COGNITO_ERROR_MAP[key];
          break;
        }
      }
      setLoginError(finalMessage);
    }
  };

  // ✅ CORRECCIÓN 2: Creamos la función que manejará la lógica de "onSubmit" del modal.
  // Esta función es la que realmente llama al método 'resetPassword' del contexto.
  const handleForgotPasswordSubmit = async (email: string) => {
    // La lógica de 'try/catch' y el estado de carga ya están manejados dentro del modal,
    // pero esta función debe lanzar un error si 'resetPassword' falla para que el modal lo capture.
    await resetPassword({ email });
  };


  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app-dark-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Page 
      title="Iniciar Sesión" 
      className="bg-app-dark-900"
      showHeader={false}
    >
      <div className="min-h-screen flex">
        <FeaturesShowcase />
        
        <div className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8 bg-app-dark-900">
          <div className="mx-auto w-full max-w-sm">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white">Iniciar Sesión</h2>
              <p className="mt-2 text-sm text-app-gray-400">Accede a tu cuenta de {env.appName}</p>
            </div>
            
            {isOffline && (
              <div className="mb-4 flex items-center justify-center space-x-2 text-yellow-400 p-3 bg-yellow-900/50 rounded-lg">
                <WifiOff className="h-4 w-4" />
                <span className="text-sm font-medium">Estás sin conexión</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onLoginSubmit)} className="space-y-6">
              <Controller name="email" control={control} render={({ field }) => (
                <EmailInput {...field} id="login-email" label="Email empresarial" placeholder="tu@empresa.com" error={errors.email?.message} leftIcon={<Mail className="h-4 w-4 text-app-gray-400" />} autoComplete="email" required />
              )} />
              
              <Controller name="password" control={control} render={({ field }) => (
                <Input {...field} id="login-password" label="Contraseña" type={showPassword ? 'text' : 'password'} placeholder="Tu contraseña segura" error={errors.password?.message} leftIcon={<Lock className="h-4 w-4 text-app-gray-400" />}
                  rightIcon={
                    <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} className="text-gray-400 hover:text-white">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                  autoComplete="current-password" required
                />
              )} />

              <div className="flex items-center justify-between">
                <Controller name="rememberMe" control={control} render={({ field: { value, onChange } }) => (
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" checked={value} onChange={onChange} className="h-4 w-4 text-blue-600 bg-app-dark-700 border-app-dark-600 rounded focus:ring-blue-500" />
                    <span className="text-sm text-app-gray-300">Recordarme</span>
                  </label>
                )} />
                <button type="button" onClick={() => setShowForgotPassword(true)} className="text-sm text-blue-500 hover:text-blue-400 font-medium">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {loginError && <ErrorMessage message={loginError} />}

              <Button type="submit" loading={isSubmitting} disabled={isOffline || isSubmitting} className="w-full" size="lg">
                Iniciar Sesión
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-xs text-app-gray-500">
                © 2025 {env.appName}. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ CORRECCIÓN 3: Pasamos la nueva función 'handleForgotPasswordSubmit' como la prop 'onSubmit'. */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onSubmit={handleForgotPasswordSubmit}
      />
    </Page>
  );
};

export default LoginPage;