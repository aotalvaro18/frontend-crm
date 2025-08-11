// src/components/auth/FeaturesShowcase.tsx
// Showcase de características del CRM - Componente extraído
// ✅ ENTERPRISE: Separado para mejor organización y reutilización

import React from 'react';
import { Users, Shield, Smartphone } from 'lucide-react';

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
  <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-12 bg-white">
    <div className="mx-auto max-w-md">
      {/* Logo y Header */}
      <div className="text-center mb-12">
        {/* ✅ FIX: Logo circular con ícono como en la imagen original */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center">
            <div className="text-white text-2xl font-bold">📱</div>
          </div>
        </div>
        
        {/* ✅ FIX: Título exacto como en la imagen */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Eklesa CRM
        </h1>
        
        {/* ✅ FIX: Descripción exacta como en la imagen */}
        <p className="text-xl text-gray-600 mb-12">
          Plataforma CRM empresarial para gestión inteligente de relaciones
        </p>
      </div>

      {/* ✅ FIX: Features List con espaciado como en la imagen */}
      <div className="space-y-6">
        {FEATURES.map((feature, index) => {
          const Icon = feature.icon;
          
          return (
            <div key={index} className="flex items-start space-x-4">
              {/* ✅ FIX: Iconos más grandes como en la imagen */}
              <div className="flex-shrink-0">
                <div className={`w-10 h-10 rounded-lg ${feature.iconBg} flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${feature.iconColor}`} />
                </div>
              </div>
              <div>
                {/* ✅ FIX: Títulos con el estilo correcto */}
                <h3 className="font-semibold text-gray-900 mb-1">
                  {feature.title}
                </h3>
                {/* ✅ FIX: Descripción más pequeña como en la imagen */}
                <p className="text-sm text-gray-600">
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