 // src/components/layout/Layout.tsx
// Layout principal del CRM siguiendo la guía arquitectónica
// Mobile-first, enterprise-grade layout with responsive sidebar

import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, X, Search, Bell, Settings, User, LogOut, 
  Home, Users, Building2, Target, BarChart3, 
  Globe, ChevronLeft, ChevronRight
} from 'lucide-react';

// Components
import { Button, IconButton } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cn } from '@/utils/cn';

// Hooks y stores
import { useAuthStore } from '@/stores/authStore';

// ============================================
// TYPES
// ============================================

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: number;
  isActive?: boolean;
  children?: NavigationItem[];
}

interface LayoutProps {
  children?: React.ReactNode;
}

// ============================================
// NAVIGATION CONFIGURATION
// ============================================

const getNavigationItems = (currentPath: string): NavigationItem[] => [
  {
    name: 'Dashboard',
    href: '/',
    icon: Home,
    isActive: currentPath === '/',
  },
  {
    name: 'Contactos',
    href: '/contacts',
    icon: Users,
    isActive: currentPath.startsWith('/contacts'),
  },
  {
    name: 'Oportunidades',
    href: '/deals',
    icon: Target,
    isActive: currentPath.startsWith('/deals'),
    children: [
      { name: 'Lista', href: '/deals', icon: BarChart3 },
      { name: 'Pipeline', href: '/deals/kanban', icon: Target },
    ],
  },
  {
    name: 'Empresas',
    href: '/companies',
    icon: Building2,
    isActive: currentPath.startsWith('/companies'),
  },
  {
    name: 'Reportes',
    href: '/reports',
    icon: BarChart3,
    isActive: currentPath.startsWith('/reports'),
  },
  {
    name: 'Portal Digital',
    href: '/portal/stats',
    icon: Globe,
    isActive: currentPath.startsWith('/portal'),
  },
];

// ============================================
// MOBILE NAVIGATION COMPONENT
// ============================================

const MobileNavigation: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  navigationItems: NavigationItem[];
  user: any;
  onLogout: () => void;
}> = ({ isOpen, onClose, navigationItems, user, onLogout }) => {
  const navigate = useNavigate();

  const handleNavigation = (href: string) => {
    navigate(href);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Mobile Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-app-dark-800 border-r border-app-dark-600 lg:hidden',
          'transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-app-dark-600">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-app-accent-500 rounded-lg flex items-center justify-center">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-white">Eklesa CRM</span>
          </div>
          <IconButton
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-app-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </IconButton>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-app-dark-600">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-app-accent-500 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.nombre || user?.email}
              </p>
              <p className="text-xs text-app-gray-400 truncate">
                {user?.roles?.join(', ') || 'Usuario'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => (
            <div key={item.name}>
              <button
                onClick={() => handleNavigation(item.href)}
                className={cn(
                  'w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200',
                  item.isActive
                    ? 'bg-app-accent-500 text-white'
                    : 'text-app-gray-300 hover:bg-app-dark-700 hover:text-white'
                )}
              >
                <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
                {item.badge && (
                  <span className="ml-auto bg-app-accent-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                    {item.badge}
                  </span>
                )}
              </button>

              {/* Submenu */}
              {item.children && item.isActive && (
                <div className="ml-8 mt-2 space-y-1">
                  {item.children.map((child) => (
                    <button
                      key={child.name}
                      onClick={() => handleNavigation(child.href)}
                      className="w-full flex items-center px-3 py-2 text-sm text-app-gray-400 hover:text-white hover:bg-app-dark-700 rounded-lg transition-colors duration-200"
                    >
                      <child.icon className="h-4 w-4 mr-3" />
                      {child.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-app-dark-600 space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleNavigation('/settings')}
            className="w-full justify-start text-app-gray-300 hover:text-white"
          >
            <Settings className="h-4 w-4 mr-3" />
            Configuración
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="w-full justify-start text-app-gray-300 hover:text-white"
          >
            <LogOut className="h-4 w-4 mr-3" />
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </>
  );
};

// ============================================
// DESKTOP SIDEBAR COMPONENT
// ============================================

const DesktopSidebar: React.FC<{
  isCollapsed: boolean;
  navigationItems: NavigationItem[];
  onToggleCollapse: () => void;
}> = ({ isCollapsed, navigationItems, onToggleCollapse }) => {
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        'hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 bg-app-dark-800 border-r border-app-dark-600 transition-all duration-300',
        isCollapsed ? 'lg:w-16' : 'lg:w-64'
      )}
    >
      {/* Header */}
      <div className={cn(
        'flex items-center justify-between p-4 border-b border-app-dark-600',
        isCollapsed && 'justify-center'
      )}>
        {!isCollapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-app-accent-500 rounded-lg flex items-center justify-center">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-white">Eklesa CRM</span>
          </div>
        )}
        
        <IconButton
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="text-app-gray-400 hover:text-white"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </IconButton>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigationItems.map((item) => (
          <div key={item.name}>
            <button
              onClick={() => navigate(item.href)}
              className={cn(
                'w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 group',
                item.isActive
                  ? 'bg-app-accent-500 text-white'
                  : 'text-app-gray-300 hover:bg-app-dark-700 hover:text-white',
                isCollapsed && 'justify-center'
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon className={cn(
                'h-5 w-5 flex-shrink-0',
                !isCollapsed && 'mr-3'
              )} />
              {!isCollapsed && (
                <>
                  <span className="truncate">{item.name}</span>
                  {item.badge && (
                    <span className="ml-auto bg-app-accent-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>

            {/* Submenu */}
            {item.children && item.isActive && !isCollapsed && (
              <div className="ml-8 mt-2 space-y-1">
                {item.children.map((child) => (
                  <button
                    key={child.name}
                    onClick={() => navigate(child.href)}
                    className="w-full flex items-center px-3 py-2 text-sm text-app-gray-400 hover:text-white hover:bg-app-dark-700 rounded-lg transition-colors duration-200"
                  >
                    <child.icon className="h-4 w-4 mr-3" />
                    {child.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
};

// ============================================
// HEADER COMPONENT
// ============================================

const Header: React.FC<{
  onMobileMenuToggle: () => void;
  isSidebarCollapsed: boolean;
  user: any;
  onLogout: () => void;
}> = ({ onMobileMenuToggle, isSidebarCollapsed, user, onLogout }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  return (
    <header className={cn(
      'bg-app-dark-800 border-b border-app-dark-600 px-4 py-3 transition-all duration-300',
      'lg:pl-4', // Desktop base padding
      !isSidebarCollapsed && 'lg:ml-64', // Account for expanded sidebar
      isSidebarCollapsed && 'lg:ml-16' // Account for collapsed sidebar
    )}>
      <div className="flex items-center justify-between">
        {/* Left: Mobile menu + Search */}
        <div className="flex items-center space-x-4 flex-1">
          {/* Mobile Menu Button */}
          <IconButton
            variant="ghost"
            size="sm"
            onClick={onMobileMenuToggle}
            className="lg:hidden text-app-gray-400 hover:text-white"
          >
            <Menu className="h-5 w-5" />
          </IconButton>

          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-app-gray-400" />
              <input
                type="text"
                placeholder="Buscar contactos, empresas..."
                className="w-full pl-10 pr-4 py-2 bg-app-dark-700 border border-app-dark-600 rounded-lg text-white placeholder-app-gray-400 focus:ring-2 focus:ring-app-accent-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>

        {/* Right: Notifications + User Menu */}
        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <IconButton
            variant="ghost"
            size="sm"
            className="text-app-gray-400 hover:text-white relative"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-app-accent-500 rounded-full"></span>
          </IconButton>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 text-app-gray-300 hover:text-white transition-colors duration-200 p-2 rounded-lg hover:bg-app-dark-700"
            >
              <div className="w-8 h-8 bg-app-accent-500 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <span className="hidden sm:block text-sm font-medium">
                {/* ✅ CORRECCIÓN: Comprobar que 'user' existe antes de usarlo */}
                {user ? (user.nombre || user.email) : (
                  // Mostrar un esqueleto de carga mientras el perfil del usuario carga
                  <span className="h-4 bg-app-dark-600 rounded w-24 animate-pulse inline-block" />
                )}
              </span>
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-app-dark-800 border border-app-dark-600 rounded-lg shadow-lg z-50">
                <div className="p-3 border-b border-app-dark-600">
                  {user ? (
                    <>
                      <p className="text-sm font-medium text-white truncate">
                        {user.nombre || user.email}
                      </p>
                      <p className="text-xs text-app-gray-400">
                        {user.roles?.join(', ') || 'Usuario'}
                      </p>
                    </>
                  ) : (
                    <div className="space-y-1.5 animate-pulse">
                      <div className="h-4 bg-app-dark-600 rounded w-3/4" />
                      <div className="h-3 bg-app-dark-600 rounded w-1/2" />
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <button
                    onClick={() => {
                      navigate('/profile');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center px-3 py-2 text-sm text-app-gray-300 hover:text-white hover:bg-app-dark-700 rounded-lg transition-colors duration-200"
                  >
                    <User className="h-4 w-4 mr-3" />
                    Mi Perfil
                  </button>
                  <button
                    onClick={() => {
                      navigate('/settings');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center px-3 py-2 text-sm text-app-gray-300 hover:text-white hover:bg-app-dark-700 rounded-lg transition-colors duration-200"
                  >
                    <Settings className="h-4 w-4 mr-3" />
                    Configuración
                  </button>
                  <hr className="my-2 border-app-dark-600" />
                  <button
                    onClick={() => {
                      onLogout();
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center px-3 py-2 text-sm text-app-gray-300 hover:text-white hover:bg-app-dark-700 rounded-lg transition-colors duration-200"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

// ============================================
// MAIN LAYOUT COMPONENT
// ============================================

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { user, logout, isLoading } = useAuthStore();
  
  // UI state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Navigation items based on current path
  const navigationItems = getNavigationItems(location.pathname);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-app-dark-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-dark-900">
      {/* Desktop Sidebar */}
      <DesktopSidebar
        isCollapsed={isSidebarCollapsed}
        navigationItems={navigationItems}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Mobile Navigation */}
      <MobileNavigation
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        navigationItems={navigationItems}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className={cn(
        'lg:pl-0 transition-all duration-300',
        !isSidebarCollapsed && 'lg:pl-64',
        isSidebarCollapsed && 'lg:pl-16'
      )}>
        {/* Header */}
        <Header
          onMobileMenuToggle={() => setIsMobileMenuOpen(true)}
          isSidebarCollapsed={isSidebarCollapsed}
          user={user}
          onLogout={handleLogout}
        />

        {/* Page Content */}
        <main className="min-h-[calc(100vh-4rem)]">
          <div className="p-4 sm:p-6 lg:p-8">
            {children || <Outlet />}
          </div>
        </main>
      </div>

      {/* Mobile overlay close area */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
