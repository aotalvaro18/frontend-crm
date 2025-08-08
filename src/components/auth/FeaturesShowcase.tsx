// src/components/auth/FeaturesShowcase.tsx
// Showcase de características del CRM - Componente extraído
// ✅ ENTERPRISE: Separado para mejor organización y reutilización

import React from 'react';
import { Building, Users, Shield, Smartphone } from 'lucide-react';

// Utils
import { env } from '@/config/environment';

// ============================================
// FEATURES DATA
// ============================================

const FEATURES = [
  {
    icon: Users,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    title: 'Gestión Multi-Contexto',
    description: 'Organiza contactos, deals y pipelines adaptados a tu industria'
  },
  {
    icon: Shield,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    title: 'Seguridad Empresarial',
    description: 'Multi-tenancy nativo con control de acceso granular'
  },
  {
    icon: Smartphone,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    title: 'Mobile-First',
    description: 'Diseño responsivo optimizado para móviles y tablets'
  }
] as const;

// ============================================
// FEATURES SHOWCASE COMPONENT
// ============================================

const FeaturesShowcase: React.FC = () => (
  <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-12">
    <div className="mx-auto max-w-lg">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-blue-100 rounded-full">
            <Building className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          {env.appName}
        </h2>
        <p className="text-lg text-gray-600">
          Plataforma CRM empresarial para gestión inteligente de relaciones
        </p>
      </div>

      {/* Features List */}
      <div className="space-y-8">
        {FEATURES.map((feature, index) => {
          const Icon = feature.icon;
          
          return (
            <div key={index} className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className={`p-2 rounded-lg ${feature.iconBg}`}>
                  <Icon className={`h-6 w-6 ${feature.iconColor}`} />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Info */}
      {env.isDev && (
        <div className="mt-12 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 text-center">
            Modo desarrollo • Versión {env.appVersion}
            <br />
            API Gateway: {env.apiGatewayUrl ? '✅ Configurado' : '❌ No configurado'}
          </p>
        </div>
      )}
    </div>
  </div>
);

export default FeaturesShowcase;