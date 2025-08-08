// src/components/contacts/ContactsStatsCards.tsx
// Stats cards component especializado para contactos

import React from 'react';
import { Users, CheckCircle, TrendingUp, Activity } from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface ContactStats {
  totalContacts: number;
  contactsWithPortal: number;
  averageEngagementScore: number;
  newContactsThisMonth: number;
  adoptionRate?: number;
  contactsWithoutPortal?: number;
}

interface ContactsStatsCardsProps {
  stats: ContactStats;
}

// ============================================
// STAT CARD COMPONENT
// ============================================

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  iconBgColor,
  iconColor,
  subtitle
}) => {
  return (
    <div className="bg-app-dark-800 p-4 sm:p-6 rounded-lg shadow-sm border border-app-dark-700">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg ${iconBgColor}`}>
          <div className={iconColor}>
            {icon}
          </div>
        </div>
        <div className="ml-3 sm:ml-4">
          <p className="text-xs sm:text-sm font-medium text-app-gray-400">
            {title}
          </p>
          <p className="text-lg sm:text-2xl font-bold text-app-gray-100">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-app-gray-500 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

const ContactsStatsCards: React.FC<ContactsStatsCardsProps> = ({ stats }) => {
  const adoptionRate = stats.adoptionRate || 
    (stats.totalContacts > 0 ? Math.round((stats.contactsWithPortal / stats.totalContacts) * 100) : 0);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <StatCard
        title="Total"
        value={stats.totalContacts.toLocaleString()}
        icon={<Users className="h-5 w-5 sm:h-6 sm:w-6" />}
        iconBgColor="bg-primary-900/20"
        iconColor="text-primary-400"
      />
      
      <StatCard
        title="Con Portal"
        value={stats.contactsWithPortal.toLocaleString()}
        icon={<CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />}
        iconBgColor="bg-green-900/20"
        iconColor="text-green-400"
        subtitle={`${adoptionRate}% adopción`}
      />
      
      <StatCard
        title="Engagement"
        value={`${Math.round(stats.averageEngagementScore)}%`}
        icon={<TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />}
        iconBgColor="bg-purple-900/20"
        iconColor="text-purple-400"
        subtitle="Promedio"
      />
      
      <StatCard
        title="Nuevos"
        value={stats.newContactsThisMonth.toLocaleString()}
        icon={<Activity className="h-5 w-5 sm:h-6 sm:w-6" />}
        iconBgColor="bg-yellow-900/20"
        iconColor="text-yellow-400"
        subtitle="Este mes"
      />
    </div>
  );
};

export default ContactsStatsCards;