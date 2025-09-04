// src/components/ui/Dropdown.tsx
// Dropdown enterprise component siguiendo tu guía arquitectónica
// Mobile-first + TypeScript strict + Headless UI integration + UX de Talla Mundial

import React, { Fragment, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { 
  ChevronDown, 
  Check, 
  ChevronRight,
  type LucideIcon 
} from 'lucide-react';
import { cn } from '@/utils/cn';

// ============================================
// DROPDOWN TYPES
// ============================================

export interface DropdownItem {
  id?: string;
  label: string;
  description?: string;
  icon?: LucideIcon | React.ReactNode;
  shortcut?: string;
  disabled?: boolean;
  destructive?: boolean;
  selected?: boolean;
  onClick?: () => void;
  href?: string;
  target?: string;
}

export interface DropdownItemSeparator {
  type: 'separator';
  id?: string;
}

export interface DropdownItemGroup {
  type: 'group';
  id?: string;
  label?: string;
  items: (DropdownItem | DropdownItemSeparator)[];
}

export type DropdownMenuItems = (DropdownItem | DropdownItemSeparator | DropdownItemGroup)[];

export interface DropdownProps {
  // Trigger element
  trigger: React.ReactNode;
  
  // Menu items
  items: DropdownMenuItems;
  
  // Positioning
  align?: 'start' | 'end';
  side?: 'top' | 'bottom';
  offset?: number;
  
  // Styling
  variant?: 'default' | 'bordered' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  
  // Behavior
  closeOnItemClick?: boolean;
  disabled?: boolean;
  
  // Events
  onOpenChange?: (open: boolean) => void;
  
  // Classes
  className?: string;
  menuClassName?: string;
  triggerClassName?: string;
}

// ============================================
// DROPDOWN VARIANTS - UX MEJORADA MOBILE-FIRST
// ============================================

const dropdownVariants = {
  variants: {
    variant: {
      default: {
        menu: 'bg-app-dark-800 border border-app-dark-600 shadow-xl ring-1 ring-black/5 backdrop-blur-sm',
        item: 'text-app-gray-200 hover:bg-app-dark-700 hover:text-white focus:bg-app-dark-700 focus:text-white',
        itemDestructive: 'text-red-400 hover:bg-red-500/15 hover:text-red-300 focus:bg-red-500/15 focus:text-red-300',
        itemDisabled: 'text-app-gray-500 cursor-not-allowed opacity-50',
        separator: 'bg-app-dark-600',
        groupLabel: 'text-app-gray-400 bg-app-dark-750',
      },
      bordered: {
        menu: 'bg-app-dark-800 border-2 border-app-dark-500 shadow-2xl ring-1 ring-black/10 backdrop-blur-sm',
        item: 'text-app-gray-200 hover:bg-app-dark-700 hover:text-white focus:bg-app-dark-700 focus:text-white',
        itemDestructive: 'text-red-400 hover:bg-red-500/15 hover:text-red-300 focus:bg-red-500/15 focus:text-red-300',
        itemDisabled: 'text-app-gray-500 cursor-not-allowed opacity-50',
        separator: 'bg-app-dark-500',
        groupLabel: 'text-app-gray-400 bg-app-dark-750',
      },
      minimal: {
        menu: 'bg-app-dark-900 border border-app-dark-700 shadow-lg backdrop-blur-sm',
        item: 'text-app-gray-300 hover:bg-app-dark-800 hover:text-white focus:bg-app-dark-800 focus:text-white',
        itemDestructive: 'text-red-400 hover:bg-red-500/15 hover:text-red-300 focus:bg-red-500/15 focus:text-red-300',
        itemDisabled: 'text-app-gray-600 cursor-not-allowed opacity-50',
        separator: 'bg-app-dark-700',
        groupLabel: 'text-app-gray-500 bg-app-dark-850',
      },
    },
    size: {
      sm: {
        menu: 'min-w-40 text-sm', // Aumentado para mejor mobile touch
        item: 'px-3 py-2.5', // Padding generoso para touch targets
        groupLabel: 'px-3 py-2 text-xs',
        icon: 'h-4 w-4',
      },
      md: {
        menu: 'min-w-48 text-sm', // Ancho generoso
        item: 'px-4 py-3', // Touch targets optimizados
        groupLabel: 'px-4 py-2.5 text-xs',
        icon: 'h-4 w-4',
      },
      lg: {
        menu: 'min-w-56 text-base', // Muy generoso para tablets
        item: 'px-5 py-4', // Touch targets premium
        groupLabel: 'px-5 py-3 text-sm',
        icon: 'h-5 w-5',
      },
    },
  },
};

// ============================================
// MENU ITEM COMPONENT - UX TALLA MUNDIAL
// ============================================

const DropdownMenuItem: React.FC<{
  item: DropdownItem;
  variant: 'default' | 'bordered' | 'minimal';
  size: 'sm' | 'md' | 'lg';
  closeMenu?: () => void;
  closeOnClick?: boolean;
}> = ({ 
  item, 
  variant, 
  size, 
  closeMenu,
  closeOnClick = true 
}) => {
  const variantStyles = dropdownVariants.variants.variant[variant];
  const sizeStyles = dropdownVariants.variants.size[size];

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (item.disabled) {
      return;
    }

    if (item.onClick) {
      try {
        item.onClick();
      } catch (error) {
        console.error('Error executing dropdown onClick:', error);
      }
    }

    if (closeOnClick && closeMenu) {
      closeMenu();
    }
  };

  const ItemContent = () => (
    <div className={cn(
      'flex items-center justify-between w-full group transition-all duration-200 ease-out',
      sizeStyles.item,
      'rounded-lg', // Bordes más redondeados para mejor aspecto móvil
      // Estados mejorados con focus rings
      item.disabled 
        ? variantStyles.itemDisabled
        : item.destructive 
          ? cn(variantStyles.itemDestructive, 'focus:ring-2 focus:ring-red-500/30 focus:ring-offset-2 focus:ring-offset-app-dark-800')
          : cn(variantStyles.item, 'focus:ring-2 focus:ring-primary-500/30 focus:ring-offset-2 focus:ring-offset-app-dark-800'),
      // Mejor feedback táctil
      !item.disabled && 'active:scale-[0.98] active:transition-transform active:duration-75',
      // Mejor estado de hover
      !item.disabled && 'hover:scale-[1.01] hover:transition-transform hover:duration-150'
    )}>
      <div className="flex items-center space-x-3 min-w-0 flex-1">
        {/* Icon con mejor contraste y animaciones */}
        {item.icon && (
          <div className={cn(
            "flex-shrink-0 transition-all duration-200",
            item.destructive 
              ? "text-red-400 group-hover:text-red-300 group-hover:scale-110" 
              : "text-app-gray-400 group-hover:text-white group-hover:scale-110"
          )}>
            {React.isValidElement(item.icon) ? (
              React.cloneElement(item.icon as React.ReactElement, {
                className: cn(sizeStyles.icon, (item.icon as any)?.props?.className)
              })
            ) : (
              React.createElement(item.icon as LucideIcon, {
                className: sizeStyles.icon
              })
            )}
          </div>
        )}
        
        {/* Label y description con tipografía mejorada */}
        <div className="min-w-0 flex-1">
          <div className={cn(
            "font-medium truncate leading-tight transition-colors duration-200",
            size === 'sm' ? 'text-sm' : size === 'md' ? 'text-sm' : 'text-base'
          )}>
            {item.label}
          </div>
          {item.description && (
            <div className={cn(
              "opacity-75 truncate mt-1 leading-tight transition-opacity duration-200 group-hover:opacity-90",
              size === 'sm' ? 'text-xs' : 'text-xs'
            )}>
              {item.description}
            </div>
          )}
        </div>
      </div>

      {/* Right side elements mejorados */}
      <div className="flex items-center space-x-2.5 flex-shrink-0 ml-4">
        {/* Selected indicator */}
        {item.selected && (
          <Check className={cn(
            sizeStyles.icon, 
            'text-primary-500 flex-shrink-0 animate-in fade-in-50 duration-200'
          )} />
        )}
        
        {/* Keyboard shortcut con mejor styling */}
        {item.shortcut && (
          <span className={cn(
            "opacity-60 font-mono flex-shrink-0 px-2 py-1 rounded-md text-xs",
            "bg-app-dark-600 group-hover:bg-app-dark-500 transition-colors duration-200",
            size === 'sm' ? 'text-xs' : 'text-xs'
          )}>
            {item.shortcut}
          </span>
        )}
      </div>
    </div>
  );

  // External link
  if (item.href) {
    return (
      <a
        href={item.href}
        target={item.target}
        className={cn(
          'block no-underline focus:outline-none',
          item.disabled && 'pointer-events-none'
        )}
        onClick={handleClick}
      >
        <ItemContent />
      </a>
    );
  }

  // Button con mejor touch target
  return (
    <button
      type="button"
      className={cn(
        'w-full text-left focus:outline-none',
        item.disabled && 'cursor-not-allowed'
      )}
      disabled={item.disabled}
      onClick={handleClick}
    >
      <ItemContent />
    </button>
  );
};

// ============================================
// SEPARATOR COMPONENT
// ============================================

const DropdownSeparator: React.FC<{
  variant: 'default' | 'bordered' | 'minimal';
}> = ({ variant }) => {
  const variantStyles = dropdownVariants.variants.variant[variant];
  
  return (
    <div className={cn('my-2 h-px', variantStyles.separator)} />
  );
};

// ============================================
// GROUP COMPONENT
// ============================================

const DropdownGroup: React.FC<{
  group: DropdownItemGroup;
  variant: 'default' | 'bordered' | 'minimal';
  size: 'sm' | 'md' | 'lg';
  closeMenu?: () => void;
  closeOnClick?: boolean;
}> = ({ 
  group, 
  variant, 
  size, 
  closeMenu,
  closeOnClick 
}) => {
  const variantStyles = dropdownVariants.variants.variant[variant];
  const sizeStyles = dropdownVariants.variants.size[size];

  return (
    <div className="py-1">
      {/* Group label */}
      {group.label && (
        <div className={cn(
          'font-medium uppercase tracking-wider',
          sizeStyles.groupLabel,
          variantStyles.groupLabel
        )}>
          {group.label}
        </div>
      )}
      
      {/* Group items */}
      <div className="space-y-1">
        {group.items.map((item, index) => {
          const key = 'id' in item && item.id ? item.id : `${group.id}-item-${index}`;
          
          if ('type' in item && item.type === 'separator') {
            return <DropdownSeparator key={key} variant={variant} />;
          }
          
          return (
            <DropdownMenuItem
              key={key}
              item={item as DropdownItem}
              variant={variant}
              size={size}
              closeMenu={closeMenu}
              closeOnClick={closeOnClick}
            />
          );
        })}
      </div>
    </div>
  );
};

// ============================================
// MAIN DROPDOWN COMPONENT - CORREGIDO Y MEJORADO
// ============================================

const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  align = 'start',
  side = 'bottom',
  offset = 8, // Aumentado para mejor separación móvil
  variant = 'default',
  size = 'md',
  fullWidth = false,
  closeOnItemClick = true,
  disabled = false,
  onOpenChange,
  className,
  menuClassName,
  triggerClassName,
}) => {
  const variantStyles = dropdownVariants.variants.variant[variant];
  const sizeStyles = dropdownVariants.variants.size[size];

  return (
    <Menu as="div" className={cn('relative inline-block text-left', className)}>
      {({ open }) => (
        <>
          {/* Trigger - Mejorado para mobile */}
          <Menu.Button 
            className={cn(
              'cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2 focus:ring-offset-transparent rounded-lg transition-all duration-150',
              disabled && 'cursor-not-allowed opacity-50 pointer-events-none',
              'active:scale-95 hover:scale-105', // Mejor feedback táctil
              triggerClassName
            )}
            disabled={disabled}
            onClick={() => {
              onOpenChange?.(!open);
            }}
          >
            {trigger}
          </Menu.Button>

          {/* Menu - Mejorado con animaciones y posicionamiento */}
          <Transition
            as={Fragment}
            show={open}
            enter="transition ease-out duration-200"
            enterFrom="transform opacity-0 scale-95 translate-y-1"
            enterTo="transform opacity-100 scale-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="transform opacity-100 scale-100 translate-y-0"
            leaveTo="transform opacity-0 scale-95 translate-y-1"
            afterEnter={() => onOpenChange?.(true)}
            afterLeave={() => onOpenChange?.(false)}
          >
            <Menu.Items
              className={cn(
                // Base styles mejorados
                'absolute z-50 rounded-xl focus:outline-none',
                'animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200',
                
                // Size
                sizeStyles.menu,
                fullWidth && 'w-full',
                
                // Variant
                variantStyles.menu,
                
                // Positioning mejorado para mobile
                align === 'end' ? 'right-0' : 'left-0',
                side === 'top' 
                  ? `bottom-full mb-${offset / 4}` 
                  : `mt-${offset / 4}`,
                
                // Responsive adjustments
                'max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl',
                
                // Custom classes
                menuClassName
              )}
              style={{
                marginTop: side === 'bottom' ? offset : undefined,
                marginBottom: side === 'top' ? offset : undefined,
              }}
            >
              <div className="py-2"> {/* Padding aumentado para mejor spacing */}
                {items.map((item, index) => {
                  const key = 'id' in item && item.id ? item.id : `item-${index}`;
                  
                  // Separator
                  if ('type' in item && item.type === 'separator') {
                    return <DropdownSeparator key={key} variant={variant} />;
                  }
                  
                  // Group
                  if ('type' in item && item.type === 'group') {
                    return (
                      <DropdownGroup
                        key={key}
                        group={item as DropdownItemGroup}
                        variant={variant}
                        size={size}
                        closeMenu={() => {}} // Headless UI maneja esto automáticamente
                        closeOnClick={closeOnItemClick}
                      />
                    );
                  }
                  
                  // Regular item
                  return (
                    <Menu.Item key={key}>
                      {({ close }) => (
                        <DropdownMenuItem
                          item={item as DropdownItem}
                          variant={variant}
                          size={size}
                          closeMenu={closeOnItemClick ? close : undefined}
                          closeOnClick={closeOnItemClick}
                        />
                      )}
                    </Menu.Item>
                  );
                })}
              </div>
            </Menu.Items>
          </Transition>
        </>
      )}
    </Menu>
  );
};

// ============================================
// SPECIALIZED DROPDOWN COMPONENTS
// ============================================

/**
 * Action Dropdown - Para actions buttons con UX mejorada
 */
export const ActionDropdown: React.FC<{
  trigger?: React.ReactNode;
  items: DropdownMenuItems;
  disabled?: boolean;
  className?: string;
}> = ({ 
  trigger, 
  items, 
  disabled = false, 
  className 
}) => (
  <Dropdown
    trigger={trigger || (
      <button
        type="button"
        className={cn(
          'inline-flex items-center justify-center w-9 h-9', // Aumentado para mejor touch
          'text-app-gray-400 hover:text-white',
          'hover:bg-app-dark-700 rounded-lg', // rounded-md -> rounded-lg
          'transition-all duration-150',
          'focus:outline-none focus:ring-2 focus:ring-primary-500/50',
          'active:scale-95', // Feedback táctil
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        disabled={disabled}
      >
        <span className="sr-only">Abrir menú</span>
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>
    )}
    items={items}
    align="end"
    size="md" // Cambiado de sm a md para mejor UX móvil
    disabled={disabled}
    className={className}
  />
);

/**
 * Select Dropdown - Para selección de opciones con UX mejorada
 */
export const SelectDropdown: React.FC<{
  value?: string;
  placeholder?: string;
  options: Array<{
    value: string;
    label: string;
    description?: string;
    icon?: LucideIcon;
  }>;
  onChange?: (value: string) => void;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
}> = ({ 
  value, 
  placeholder = 'Seleccionar...', 
  options, 
  onChange, 
  disabled = false,
  fullWidth = true,
  className 
}) => {
  const selectedOption = options.find(opt => opt.value === value);
  
  const items: DropdownMenuItems = options.map(option => ({
    id: option.value,
    label: option.label,
    description: option.description,
    icon: option.icon,
    selected: option.value === value,
    onClick: () => onChange?.(option.value),
  }));

  return (
    <Dropdown
      trigger={
        <div className={cn(
          'flex items-center justify-between',
          'px-4 py-3', // Padding aumentado para mobile
          'bg-app-dark-700 border border-app-dark-600',
          'rounded-lg transition-all duration-150',
          'hover:border-app-dark-500',
          'focus-within:ring-2 focus-within:ring-primary-500/50',
          'focus-within:border-primary-500/50',
          disabled && 'opacity-50 cursor-not-allowed',
          fullWidth && 'w-full',
          className
        )}>
          <span className={cn(
            'transition-colors duration-150',
            selectedOption ? 'text-app-gray-200' : 'text-app-gray-400'
          )}>
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDown className={cn(
            'h-4 w-4 text-app-gray-400 transition-transform duration-150',
            'group-data-[state=open]:rotate-180'
          )} />
        </div>
      }
      items={items}
      fullWidth={fullWidth}
      disabled={disabled}
      variant="default"
      size="md"
    />
  );
};

/**
 * Context Menu - Para click derecho con UX mejorada
 */
export const ContextMenu: React.FC<{
  children: React.ReactNode;
  items: DropdownMenuItems;
  disabled?: boolean;
}> = ({ children, items, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleContextMenu = (e: React.MouseEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    setPosition({ x: e.pageX, y: e.pageY });
    setIsOpen(true);
  };

  const handleClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      <div onContextMenu={handleContextMenu} onClick={handleClick}>
        {children}
      </div>
      
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        >
          <div
            className={cn(
              'fixed z-50 min-w-48 text-sm', // Ancho aumentado
              'bg-app-dark-800 border border-app-dark-600',
              'rounded-xl shadow-xl backdrop-blur-sm py-2' // Mejor styling
            )}
            style={{
              left: position.x,
              top: position.y,
            }}
          >
            {items.map((item, index) => {
              if ('type' in item && item.type === 'separator') {
                return (
                  <div 
                    key={index} 
                    className="my-2 h-px bg-app-dark-600" 
                  />
                );
              }
              
              const menuItem = item as DropdownItem;
              return (
                <button
                  key={index}
                  type="button"
                  className={cn(
                    'w-full text-left px-4 py-3', // Padding aumentado
                    'text-app-gray-200 hover:bg-app-dark-700 rounded-lg mx-1',
                    'transition-all duration-150',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500/50',
                    menuItem.destructive && 'text-red-400 hover:bg-red-500/15',
                    menuItem.disabled && 'opacity-50 cursor-not-allowed'
                  )}
                  disabled={menuItem.disabled}
                  onClick={() => {
                    if (!menuItem.disabled && menuItem.onClick) {
                      menuItem.onClick();
                      setIsOpen(false);
                    }
                  }}
                >
                  <div className="flex items-center space-x-3">
                    {menuItem.icon && React.createElement(menuItem.icon as LucideIcon, {
                      className: 'h-4 w-4'
                    })}
                    <span>{menuItem.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

export default Dropdown;