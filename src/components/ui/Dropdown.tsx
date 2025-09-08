// src/components/ui/Dropdown.tsx
// ✅ DROPDOWN UX TALLA MUNDIAL - Mobile-First + TypeScript strict + Headless UI
// 🔧 SOLUCIÓN QUIRÚRGICA: Solo agregar auto-detection de espacio para el lado

import React, { Fragment, useRef, useEffect, useState } from 'react';
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
  align?: 'start' | 'end' | 'center';
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
// 🔧 NUEVO HOOK: Auto-detect side basado en espacio disponible
// ============================================
const useAutoSide = (triggerRef: React.RefObject<HTMLElement>, isOpen: boolean, preferredSide?: 'top' | 'bottom') => {
  const [actualSide, setActualSide] = useState<'top' | 'bottom'>(preferredSide || 'bottom');

  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    const trigger = triggerRef.current;
    const triggerRect = trigger.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    
    // Estimar altura del menú (aproximadamente)
    const estimatedMenuHeight = 200; // Aproximadamente 5-6 items
    const buffer = 20; // Buffer de seguridad

    const spaceBelow = viewportHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;

    // Si el usuario especificó un side, respetarlo a menos que no haya espacio
    if (preferredSide) {
      if (preferredSide === 'bottom' && spaceBelow < estimatedMenuHeight + buffer && spaceAbove > estimatedMenuHeight + buffer) {
        setActualSide('top');
      } else if (preferredSide === 'top' && spaceAbove < estimatedMenuHeight + buffer && spaceBelow > estimatedMenuHeight + buffer) {
        setActualSide('bottom');
      } else {
        setActualSide(preferredSide);
      }
    } else {
      // Auto-detectar basado en espacio disponible
      if (spaceBelow < estimatedMenuHeight + buffer && spaceAbove > estimatedMenuHeight + buffer) {
        setActualSide('top');
      } else {
        setActualSide('bottom');
      }
    }
  }, [isOpen, preferredSide]);

  return actualSide;
};

// ============================================
// DROPDOWN VARIANTS - Sin cambios
// ============================================

const dropdownVariants = {
  variants: {
    variant: {
      default: {
        menu: 'bg-app-dark-800 border border-app-dark-600 shadow-xl ring-1 ring-black/5',
        item: 'text-app-gray-200 hover:bg-app-dark-700 hover:text-white',
        itemDestructive: 'text-red-400 hover:bg-red-500/15 hover:text-red-300',
        itemDisabled: 'text-app-gray-500 cursor-not-allowed opacity-50',
        separator: 'bg-app-dark-600',
        groupLabel: 'text-app-gray-400 bg-app-dark-750',
      },
      bordered: {
        menu: 'bg-app-dark-800 border-2 border-app-dark-500 shadow-2xl ring-1 ring-black/10',
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
        menu: 'min-w-40 text-sm',
        item: 'px-3 py-2.5',
        groupLabel: 'px-3 py-2 text-xs',
        icon: 'h-4 w-4',
      },
      md: {
        menu: 'min-w-48 text-sm',
        item: 'px-4 py-3',
        groupLabel: 'px-4 py-2.5 text-xs',
        icon: 'h-4 w-4',
      },
      lg: {
        menu: 'min-w-56 text-base',
        item: 'px-5 py-4',
        groupLabel: 'px-5 py-3 text-sm',
        icon: 'h-5 w-5',
      },
    },
  },
};

// ============================================
// MENU ITEM COMPONENT - Sin cambios
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
      'flex items-center justify-between w-full group',
      sizeStyles.item,
      'rounded-md transition-all duration-150 ease-out',
      item.disabled 
        ? variantStyles.itemDisabled
        : item.destructive 
          ? cn(variantStyles.itemDestructive, 'focus:ring-2 focus:ring-red-500/20')
          : cn(variantStyles.item, 'focus:ring-2 focus:ring-primary-500/20'),
      !item.disabled && 'active:scale-[0.98] active:transition-transform active:duration-75'
    )}>
      <div className="flex items-center space-x-3 min-w-0 flex-1">
        {item.icon && (
          <div className={cn(
            "flex-shrink-0 transition-colors duration-150",
            item.destructive ? "text-red-400 group-hover:text-red-300" : "text-app-gray-400 group-hover:text-white"
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
        
        <div className="min-w-0 flex-1">
          <div className={cn(
            "font-medium truncate leading-tight",
            size === 'sm' ? 'text-sm' : size === 'md' ? 'text-sm' : 'text-base'
          )}>
            {item.label}
          </div>
          {item.description && (
            <div className={cn(
              "opacity-75 truncate mt-1 leading-tight",
              size === 'sm' ? 'text-xs' : 'text-xs'
            )}>
              {item.description}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
        {item.selected && (
          <Check className={cn(sizeStyles.icon, 'text-primary-500 flex-shrink-0')} />
        )}
        
        {item.shortcut && (
          <span className={cn(
            "opacity-60 font-mono flex-shrink-0 px-1.5 py-0.5 rounded text-xs bg-app-dark-600",
            size === 'sm' ? 'text-xs' : 'text-xs'
          )}>
            {item.shortcut}
          </span>
        )}
      </div>
    </div>
  );

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
// SEPARATOR COMPONENT - Sin cambios
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
// GROUP COMPONENT - Sin cambios
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
      {group.label && (
        <div className={cn(
          'font-medium uppercase tracking-wider',
          sizeStyles.groupLabel,
          variantStyles.groupLabel
        )}>
          {group.label}
        </div>
      )}
      
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
// MAIN DROPDOWN COMPONENT - 🔧 SOLO CAMBIOS MÍNIMOS
// ============================================

const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  align = 'end',
  side = 'bottom',
  offset = 8,
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
  
  // 🔧 NUEVO: Referencias y estado para auto-detection
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  
  // 🔧 NUEVO: Auto-detectar el lado óptimo
  const actualSide = useAutoSide(triggerRef, isOpen, side);

  return (
    <Menu as="div" className={cn('relative inline-block text-left', className)}>
      {({ open }) => {
        // 🔧 SINCRONIZAR estado interno
        if (open !== isOpen) {
          setIsOpen(open);
        }

        return (
          <>
            <Menu.Button 
              ref={triggerRef} // 🔧 NUEVO: Ref para medición
              className={cn(
                'cursor-pointer focus:outline-none',
                disabled && 'cursor-not-allowed opacity-50 pointer-events-none',
                triggerClassName
              )}
              disabled={disabled}
              onClick={() => {
                onOpenChange?.(!open);
              }}
            >
              {trigger}
            </Menu.Button>

            <Transition
              as={Fragment}
              show={open}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
              afterEnter={() => onOpenChange?.(true)}
              afterLeave={() => onOpenChange?.(false)}
            >
              <Menu.Items
                static
                className={cn(
                  'absolute z-50 rounded-xl focus:outline-none backdrop-blur-sm',
                  'max-w-[calc(100vw-2rem)] md:max-w-none',
                  'overflow-hidden',
                  
                  // Size
                  sizeStyles.menu,
                  fullWidth && 'w-full',
                  
                  // Variant
                  variantStyles.menu,
                  
                  // 🔧 POSITIONING CON AUTO-DETECTION
                  align === 'end' ? 'right-0' : align === 'start' ? 'left-0' : 'left-1/2 -translate-x-1/2',
                  actualSide === 'top' ? 'bottom-full' : 'top-full', // 🔧 USAR actualSide en lugar de side
                  
                  // Custom classes
                  menuClassName
                )}
                style={{
                  // 🔧 USAR actualSide para margins
                  marginTop: actualSide === 'bottom' ? offset : undefined,
                  marginBottom: actualSide === 'top' ? offset : undefined,
                }}
              >
                <div className="py-2">
                  {items.map((item, index) => {
                    const key = 'id' in item && item.id ? item.id : `item-${index}`;
                    
                    if ('type' in item && item.type === 'separator') {
                      return <DropdownSeparator key={key} variant={variant} />;
                    }
                    
                    if ('type' in item && item.type === 'group') {
                      return (
                        <DropdownGroup
                          key={key}
                          group={item as DropdownItemGroup}
                          variant={variant}
                          size={size}
                          closeMenu={closeOnItemClick ? () => {} : undefined}
                          closeOnClick={closeOnItemClick}
                        />
                      );
                    }
                    
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
        );
      }}
    </Menu>
  );
};

// ============================================
// SPECIALIZED DROPDOWN COMPONENTS - Sin cambios
// ============================================

/**
 * Action Dropdown - Para actions buttons
 */
export const ActionDropdown: React.FC<{
  trigger?: React.ReactNode;
  items: DropdownMenuItems;
  disabled?: boolean;
  className?: string;
  align?: 'start' | 'end' | 'center';
}> = ({ 
  trigger, 
  items, 
  disabled = false, 
  className,
  align = 'end'
}) => (
  <Dropdown
    trigger={trigger || (
      <button
        type="button"
        className={cn(
          'inline-flex items-center justify-center w-8 h-8',
          'text-app-gray-400 hover:text-white',
          'hover:bg-app-dark-700 rounded-md',
          'transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-app-accent-500',
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
    align={align}
    size="md"
    disabled={disabled}
    className={className}
    offset={8}
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
  align?: 'start' | 'end' | 'center';
}> = ({ 
  value, 
  placeholder = 'Seleccionar...', 
  options, 
  onChange, 
  disabled = false,
  fullWidth = true,
  className,
  align = 'start'
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
      align={align}
      offset={8}
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
    const menuWidth = 160;
    const menuHeight = items.length * 40;
    
    let newX = e.pageX;
    let newY = e.pageY;

    if (newX + menuWidth > window.innerWidth) {
      newX = window.innerWidth - menuWidth - 10;
    }
    if (newY + menuHeight > window.innerHeight) {
      newY = window.innerHeight - menuHeight - 10;
    }

    setPosition({ x: newX, y: newY });
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
              'rounded-xl shadow-lg py-2',
              'max-h-[calc(100vh-2rem)] overflow-y-auto'
            )}
            style={{
              left: position.x,
              top: position.y,
            }}
          >
            {items.map((item, index) => {
              if ('type' in item && item.type === 'separator') {
                return (
                  <DropdownSeparator 
                    key={index} 
                    variant="default"
                  />
                );
              }
              
              if ('type' in item && item.type === 'group') {
                return (
                  <DropdownGroup
                    key={index}
                    group={item as DropdownItemGroup}
                    variant="default"
                    size="md"
                    closeMenu={() => setIsOpen(false)}
                    closeOnClick={true}
                  />
                );
              }
              
              return (
                <DropdownMenuItem
                  key={index}
                  item={item as DropdownItem}
                  variant="default"
                  size="md"
                  closeMenu={() => setIsOpen(false)}
                  closeOnClick={true}
                />
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

export default Dropdown;