// src/components/ui/Dropdown.tsx
// ✅ DROPDOWN UX TALLA MUNDIAL - Mobile-First + TypeScript strict + Headless UI
// MEJORADO: Spacing generoso, touch targets, mejor contraste, transiciones suaves

import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { 
  ChevronDown, 
  Check, 
  ChevronRight,
  type LucideIcon 
} from 'lucide-react';
import { cn } from '@/utils/cn';

// ============================================
// DROPDOWN TYPES - Sin cambios
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
// DROPDOWN VARIANTS - ✅ MEJORADO PARA UX TALLA MUNDIAL
// ============================================

const dropdownVariants = {
  variants: {
    variant: {
      default: {
        menu: 'bg-app-dark-800 border border-app-dark-600 shadow-xl ring-1 ring-black/5', // ✅ MEJORADO: shadow-xl, ring
        item: 'text-app-gray-200 hover:bg-app-dark-700 hover:text-white',
        itemDestructive: 'text-red-400 hover:bg-red-500/15 hover:text-red-300', // ✅ MEJORADO: bg más sutil
        itemDisabled: 'text-app-gray-500 cursor-not-allowed opacity-50',
        separator: 'bg-app-dark-600',
        groupLabel: 'text-app-gray-400 bg-app-dark-750',
      },
      bordered: {
        menu: 'bg-app-dark-800 border-2 border-app-dark-500 shadow-2xl ring-1 ring-black/10', // ✅ MEJORADO
        item: 'text-app-gray-200 hover:bg-app-dark-700 hover:text-white',
        itemDestructive: 'text-red-400 hover:bg-red-500/15 hover:text-red-300',
        itemDisabled: 'text-app-gray-500 cursor-not-allowed opacity-50',
        separator: 'bg-app-dark-500',
        groupLabel: 'text-app-gray-400 bg-app-dark-750',
      },
      minimal: {
        menu: 'bg-app-dark-900 border border-app-dark-700 shadow-lg',
        item: 'text-app-gray-300 hover:bg-app-dark-800 hover:text-white',
        itemDestructive: 'text-red-400 hover:bg-red-500/15 hover:text-red-300',
        itemDisabled: 'text-app-gray-600 cursor-not-allowed opacity-50',
        separator: 'bg-app-dark-700',
        groupLabel: 'text-app-gray-500 bg-app-dark-850',
      },
    },
    size: {
      sm: {
        menu: 'min-w-40 text-sm', // ✅ MEJORADO: 32 → 40 para mobile
        item: 'px-3 py-2.5', // ✅ MEJORADO: py-1.5 → py-2.5 para touch targets
        groupLabel: 'px-3 py-2 text-xs',
        icon: 'h-4 w-4',
      },
      md: {
        menu: 'min-w-48 text-sm', // ✅ MEJORADO: 40 → 48
        item: 'px-4 py-3', // ✅ MEJORADO: py-2 → py-3 más generoso
        groupLabel: 'px-4 py-2.5 text-xs',
        icon: 'h-4 w-4',
      },
      lg: {
        menu: 'min-w-56 text-base', // ✅ MEJORADO: 48 → 56
        item: 'px-5 py-4', // ✅ MEJORADO: py-3 → py-4 para tablets
        groupLabel: 'px-5 py-3 text-sm',
        icon: 'h-5 w-5',
      },
    },
  },
};

// ============================================
// MENU ITEM COMPONENT - ✅ COMPLETAMENTE MEJORADO
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
    if (item.disabled) {
      e.preventDefault();
      return;
    }

    if (item.onClick) {
      e.preventDefault();
      item.onClick();
    }

    if (closeOnClick && closeMenu) {
      closeMenu();
    }
  };

  const ItemContent = () => (
    <div className={cn(
      'flex items-center justify-between w-full group', // ✅ AGREGADO: group para hover states
      sizeStyles.item,
      'rounded-md transition-all duration-150 ease-out', // ✅ MEJORADO: transition-all, ease-out
      // ✅ MEJORADOS: Estados de hover y focus
      item.disabled 
        ? variantStyles.itemDisabled
        : item.destructive 
          ? cn(variantStyles.itemDestructive, 'focus:ring-2 focus:ring-red-500/20') // ✅ AGREGADO: focus ring
          : cn(variantStyles.item, 'focus:ring-2 focus:ring-primary-500/20'),
      // ✅ AGREGADO: Touch feedback para mobile
      !item.disabled && 'active:scale-[0.98] active:transition-transform active:duration-75'
    )}>
      <div className="flex items-center space-x-3 min-w-0 flex-1"> {/* ✅ MEJORADO: space-x-2 → space-x-3 */}
        {/* Icon con mejor contraste */}
        {item.icon && (
          <div className={cn(
            "flex-shrink-0 transition-colors duration-150", // ✅ AGREGADO: transition
            item.destructive ? "text-red-400 group-hover:text-red-300" : "text-app-gray-400 group-hover:text-white" // ✅ MEJORADO: group-hover
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
        
        {/* ✅ MEJORADO: Label y description con mejor tipografía */}
        <div className="min-w-0 flex-1">
          <div className={cn(
            "font-medium truncate leading-tight", // ✅ AGREGADO: leading-tight
            size === 'sm' ? 'text-sm' : size === 'md' ? 'text-sm' : 'text-base'
          )}>
            {item.label}
          </div>
          {item.description && (
            <div className={cn(
              "opacity-75 truncate mt-1 leading-tight", // ✅ AGREGADO: leading-tight
              size === 'sm' ? 'text-xs' : 'text-xs'
            )}>
              {item.description}
            </div>
          )}
        </div>
      </div>

      {/* ✅ MEJORADO: Right side elements */}
      <div className="flex items-center space-x-2 flex-shrink-0 ml-4"> {/* ✅ MEJORADO: ml-3 → ml-4 */}
        {/* Selected indicator */}
        {item.selected && (
          <Check className={cn(sizeStyles.icon, 'text-primary-500 flex-shrink-0')} />
        )}
        
        {/* ✅ MEJORADO: Keyboard shortcut con mejor styling */}
        {item.shortcut && (
          <span className={cn(
            "opacity-60 font-mono flex-shrink-0 px-1.5 py-0.5 rounded text-xs bg-app-dark-600", // ✅ AGREGADO: padding y bg
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
          'block no-underline focus:outline-none', // ✅ AGREGADO: focus:outline-none
          item.disabled && 'pointer-events-none'
        )}
        onClick={handleClick}
      >
        <ItemContent />
      </a>
    );
  }

  // ✅ MEJORADO: Button con mejor touch target y focus
  return (
    <button
      type="button"
      className={cn(
        'w-full text-left focus:outline-none', // ✅ AGREGADO: focus:outline-none
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
// SEPARATOR COMPONENT - Sin cambios importantes
// ============================================

const DropdownSeparator: React.FC<{
  variant: 'default' | 'bordered' | 'minimal';
}> = ({ variant }) => {
  const variantStyles = dropdownVariants.variants.variant[variant];
  
  return (
    <div className={cn('my-1 h-px', variantStyles.separator)} />
  );
};

// ============================================
// GROUP COMPONENT - Sin cambios importantes
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
      <div className="space-y-0.5">
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
// MAIN DROPDOWN COMPONENT - ✅ CORREGIDO COMPLETAMENTE
// ============================================

const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  align = 'start',
  side = 'bottom',
  offset = 4,
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
  // ✅ ELIMINADO: useState manual - Headless UI maneja su propio estado
  const variantStyles = dropdownVariants.variants.variant[variant];
  const sizeStyles = dropdownVariants.variants.size[size];

  return (
    <Menu as="div" className={cn('relative inline-block text-left', className)}>
      {({ open }) => ( // ✅ CORREGIDO: Usar el estado de Headless UI
        <>
          {/* ✅ CORREGIDO: Trigger mejorado */}
          <Menu.Button 
            className={cn(
              'cursor-pointer focus:outline-none', // ✅ AGREGADO: focus:outline-none
              disabled && 'cursor-not-allowed opacity-50 pointer-events-none',
              triggerClassName
            )}
            disabled={disabled}
            onClick={() => { // ✅ AGREGADO: onClick handler para debugging
              onOpenChange?.(!open);
            }}
          >
            {trigger}
          </Menu.Button>

          {/* ✅ CORREGIDO: Menu con estado de Headless UI */}
          <Transition
            as={Fragment}
            show={open} // ✅ CORREGIDO: usar el estado de Headless UI
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
            afterEnter={() => onOpenChange?.(true)} // ✅ CORREGIDO: afterEnter en lugar de beforeEnter
            afterLeave={() => onOpenChange?.(false)}
          >
            <Menu.Items
              className={cn(
                // ✅ MEJORADO: Base styles
                'absolute z-50 mt-2 rounded-xl focus:outline-none backdrop-blur-sm', // ✅ MEJORADO: mt-1→mt-2, rounded-lg→rounded-xl
                
                // Size
                sizeStyles.menu,
                fullWidth && 'w-full',
                
                // Variant
                variantStyles.menu,
                
                // ✅ MEJORADO: Positioning para mobile
                align === 'end' ? 'right-0' : 'left-0',
                side === 'top' && 'bottom-full mb-2 mt-0', // ✅ MEJORADO: mb-1→mb-2
                
                // Custom classes
                menuClassName
              )}
              style={{
                marginTop: side === 'bottom' ? offset : undefined,
                marginBottom: side === 'top' ? offset : undefined,
              }}
            >
              <div className="py-2"> {/* ✅ MEJORADO: py-1→py-2 para mejor spacing */}
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
                        closeMenu={() => {}} // ✅ NO NECESARIO con Headless UI
                        closeOnClick={closeOnItemClick}
                      />
                    );
                  }
                  
                  // Regular item
                  return (
                    <Menu.Item key={key}>
                      {({ close }) => ( // ✅ CORREGIDO: usar close de Headless UI
                        <DropdownMenuItem
                          item={item as DropdownItem}
                          variant={variant}
                          size={size}
                          closeMenu={closeOnItemClick ? close : undefined} // ✅ CORREGIDO: pasar close
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
// SPECIALIZED DROPDOWN COMPONENTS - ✅ MEJORADOS
// ============================================

/**
 * Action Dropdown - Para actions buttons
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
          'inline-flex items-center justify-center w-8 h-8', // ✅ MANTENIDO: touch target adecuado
          'text-app-gray-400 hover:text-white',
          'hover:bg-app-dark-700 rounded-md',
          'transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-app-accent-500', // ✅ AGREGADO: focus states
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
    size="md" // ✅ MEJORADO: sm→md para mejor UX
    disabled={disabled}
    className={className}
  />
);

/**
 * Select Dropdown - Para selección de opciones
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
          'px-3 py-2 text-sm',
          'bg-app-dark-700 border border-app-dark-600',
          'rounded-lg transition-colors',
          'hover:border-app-dark-500',
          'focus-within:ring-2 focus-within:ring-app-accent-500',
          disabled && 'opacity-50 cursor-not-allowed',
          fullWidth && 'w-full',
          className
        )}>
          <span className={cn(
            selectedOption ? 'text-app-gray-200' : 'text-app-gray-400'
          )}>
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDown className="h-4 w-4 text-app-gray-400" />
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
 * Context Menu - Para click derecho
 */
export const ContextMenu: React.FC<{
  children: React.ReactNode;
  items: DropdownMenuItems;
  disabled?: boolean;
}> = ({ children, items, disabled = false }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });

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
              'fixed z-50 min-w-40 text-sm',
              'bg-app-dark-800 border border-app-dark-600',
              'rounded-lg shadow-lg py-1'
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
                    className="my-1 h-px bg-app-dark-600" 
                  />
                );
              }
              
              const menuItem = item as DropdownItem;
              return (
                <button
                  key={index}
                  type="button"
                  className={cn(
                    'w-full text-left px-3 py-2',
                    'text-app-gray-200 hover:bg-app-dark-700',
                    'transition-colors duration-150',
                    menuItem.destructive && 'text-red-400 hover:bg-red-500/10',
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
                  <div className="flex items-center space-x-2">
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