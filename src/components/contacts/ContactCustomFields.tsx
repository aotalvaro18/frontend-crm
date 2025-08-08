// src/components/contacts/ContactCustomFields.tsx
// Custom fields component especializado para el detalle de contacto

import React, { useState } from 'react';
import { Settings, Edit, Save, X, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// ============================================
// TYPES
// ============================================

interface ContactCustomFieldsProps {
  customFields: Record<string, any>;
  contactId: number;
  onUpdate?: (fields: Record<string, any>) => Promise<void>;
}

interface FieldEditorProps {
  fieldKey: string;
  fieldValue: any;
  onSave: (key: string, value: any) => void;
  onCancel: () => void;
  onDelete: (key: string) => void;
}

// ============================================
// FIELD TYPE DETECTOR
// ============================================

const getFieldType = (value: any): string => {
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'string') {
    // Check if it's a date
    if (value.match(/^\d{4}-\d{2}-\d{2}/) && !isNaN(Date.parse(value))) {
      return 'date';
    }
    // Check if it's an email
    if (value.includes('@') && value.includes('.')) {
      return 'email';
    }
    // Check if it's a URL
    if (value.startsWith('http') || value.startsWith('www.')) {
      return 'url';
    }
    return 'text';
  }
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  return 'text';
};

// ============================================
// FIELD VALUE RENDERER
// ============================================

const FieldValueRenderer: React.FC<{ value: any; type: string }> = ({ value, type }) => {
  switch (type) {
    case 'boolean':
      return (
        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
          value 
            ? 'bg-green-900/20 text-green-400 border border-green-500/30' 
            : 'bg-red-900/20 text-red-400 border border-red-500/30'
        }`}>
          {value ? 'Sí' : 'No'}
        </span>
      );
      
    case 'date':
      return (
        <span className="text-app-gray-100">
          {new Date(value).toLocaleDateString()}
        </span>
      );
      
    case 'email':
      return (
        <a 
          href={`mailto:${value}`}
          className="text-primary-400 hover:text-primary-300 transition-colors"
        >
          {value}
        </a>
      );
      
    case 'url':
      return (
        <a 
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-400 hover:text-primary-300 transition-colors"
        >
          {value}
        </a>
      );
      
    case 'array':
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((item: any, index: number) => (
            <span 
              key={index}
              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-app-dark-600 text-app-gray-300"
            >
              {String(item)}
            </span>
          ))}
        </div>
      );
      
    case 'object':
      return (
        <details className="cursor-pointer">
          <summary className="text-app-gray-300 hover:text-app-gray-100">
            Ver objeto...
          </summary>
          <pre className="mt-2 p-2 bg-app-dark-700 rounded text-xs text-app-gray-300 overflow-auto">
            {JSON.stringify(value, null, 2)}
          </pre>
        </details>
      );
      
    default:
      return <span className="text-app-gray-100">{String(value)}</span>;
  }
};

// ============================================
// FIELD EDITOR COMPONENT
// ============================================

const FieldEditor: React.FC<FieldEditorProps> = ({
  fieldKey,
  fieldValue,
  onSave,
  onCancel,
  onDelete
}) => {
  const [editKey, setEditKey] = useState(fieldKey);
  const [editValue, setEditValue] = useState(String(fieldValue));
  const [editType, setEditType] = useState(getFieldType(fieldValue));

  const handleSave = () => {
    let processedValue: any = editValue;

    switch (editType) {
      case 'boolean':
        processedValue = editValue === 'true';
        break;
      case 'number':
        processedValue = Number(editValue);
        break;
      case 'array':
        try {
          processedValue = editValue.split(',').map(v => v.trim());
        } catch {
          processedValue = [editValue];
        }
        break;
      case 'object':
        try {
          processedValue = JSON.parse(editValue);
        } catch {
          processedValue = editValue;
        }
        break;
      default:
        processedValue = editValue;
    }

    onSave(editKey, processedValue);
  };

  return (
    <div className="p-4 bg-app-dark-700 rounded-lg border border-app-dark-600 space-y-3">
      {/* Field Key */}
      <div>
        <label className="block text-xs font-medium text-app-gray-300 mb-1">
          Nombre del campo
        </label>
        <input
          type="text"
          value={editKey}
          onChange={(e) => setEditKey(e.target.value)}
          className="w-full px-3 py-2 bg-app-dark-800 border border-app-dark-600 rounded text-app-gray-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* Field Type */}
      <div>
        <label className="block text-xs font-medium text-app-gray-300 mb-1">
          Tipo
        </label>
        <select
          value={editType}
          onChange={(e) => setEditType(e.target.value)}
          className="w-full px-3 py-2 bg-app-dark-800 border border-app-dark-600 rounded text-app-gray-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="text">Texto</option>
          <option value="number">Número</option>
          <option value="boolean">Booleano</option>
          <option value="date">Fecha</option>
          <option value="email">Email</option>
          <option value="url">URL</option>
          <option value="array">Array</option>
          <option value="object">Objeto</option>
        </select>
      </div>

      {/* Field Value */}
      <div>
        <label className="block text-xs font-medium text-app-gray-300 mb-1">
          Valor
        </label>
        {editType === 'boolean' ? (
          <select
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full px-3 py-2 bg-app-dark-800 border border-app-dark-600 rounded text-app-gray-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="true">Verdadero</option>
            <option value="false">Falso</option>
          </select>
        ) : editType === 'object' || editType === 'array' ? (
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-app-dark-800 border border-app-dark-600 rounded text-app-gray-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder={editType === 'array' ? 'valor1, valor2, valor3' : '{"key": "value"}'}
          />
        ) : (
          <input
            type={editType === 'number' ? 'number' : editType === 'date' ? 'date' : editType === 'email' ? 'email' : 'text'}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full px-3 py-2 bg-app-dark-800 border border-app-dark-600 rounded text-app-gray-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(fieldKey)}
          className="text-red-400 border-red-500/30 hover:bg-red-900/20"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Eliminar
        </Button>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
          >
            <X className="h-4 w-4 mr-1" />
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!editKey.trim() || !editValue.trim()}
          >
            <Save className="h-4 w-4 mr-1" />
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// NEW FIELD FORM COMPONENT
// ============================================

const NewFieldForm: React.FC<{
  onSave: (key: string, value: any) => void;
  onCancel: () => void;
}> = ({ onSave, onCancel }) => {
  const [fieldKey, setFieldKey] = useState('');
  const [fieldValue, setFieldValue] = useState('');
  const [fieldType, setFieldType] = useState('text');

  const handleSave = () => {
    if (!fieldKey.trim() || !fieldValue.trim()) return;

    let processedValue: any = fieldValue;

    switch (fieldType) {
      case 'boolean':
        processedValue = fieldValue === 'true';
        break;
      case 'number':
        processedValue = Number(fieldValue);
        break;
      case 'array':
        processedValue = fieldValue.split(',').map(v => v.trim());
        break;
      case 'object':
        try {
          processedValue = JSON.parse(fieldValue);
        } catch {
          processedValue = { value: fieldValue };
        }
        break;
    }

    onSave(fieldKey, processedValue);
  };

  return (
    <div className="p-4 bg-app-dark-700 rounded-lg border border-app-dark-600 space-y-3">
      <h4 className="text-sm font-medium text-app-gray-200">Nuevo Campo</h4>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-app-gray-300 mb-1">
            Nombre
          </label>
          <input
            type="text"
            value={fieldKey}
            onChange={(e) => setFieldKey(e.target.value)}
            placeholder="nombre_campo"
            className="w-full px-3 py-2 bg-app-dark-800 border border-app-dark-600 rounded text-app-gray-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-app-gray-300 mb-1">
            Tipo
          </label>
          <select
            value={fieldType}
            onChange={(e) => setFieldType(e.target.value)}
            className="w-full px-3 py-2 bg-app-dark-800 border border-app-dark-600 rounded text-app-gray-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="text">Texto</option>
            <option value="number">Número</option>
            <option value="boolean">Booleano</option>
            <option value="date">Fecha</option>
            <option value="email">Email</option>
            <option value="url">URL</option>
            <option value="array">Array</option>
            <option value="object">Objeto</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-app-gray-300 mb-1">
          Valor
        </label>
        {fieldType === 'boolean' ? (
          <select
            value={fieldValue}
            onChange={(e) => setFieldValue(e.target.value)}
            className="w-full px-3 py-2 bg-app-dark-800 border border-app-dark-600 rounded text-app-gray-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Seleccionar...</option>
            <option value="true">Verdadero</option>
            <option value="false">Falso</option>
          </select>
        ) : (
          <input
            type={fieldType === 'number' ? 'number' : fieldType === 'date' ? 'date' : fieldType === 'email' ? 'email' : 'text'}
            value={fieldValue}
            onChange={(e) => setFieldValue(e.target.value)}
            placeholder={
              fieldType === 'array' ? 'valor1, valor2, valor3' :
              fieldType === 'object' ? '{"key": "value"}' :
              'Ingresa el valor...'
            }
            className="w-full px-3 py-2 bg-app-dark-800 border border-app-dark-600 rounded text-app-gray-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        )}
      </div>

      <div className="flex items-center justify-end space-x-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!fieldKey.trim() || !fieldValue.trim()}
        >
          <Plus className="h-4 w-4 mr-1" />
          Añadir Campo
        </Button>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

const ContactCustomFields: React.FC<ContactCustomFieldsProps> = ({
  customFields,
  //contactId,
  onUpdate
}) => {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [showNewField, setShowNewField] = useState(false);
  const [localFields, setLocalFields] = useState(customFields);
  const [saving, setSaving] = useState(false);

  const handleSaveField = async (key: string, value: any) => {
    const updatedFields = { ...localFields };
    
    // If key changed, remove old key
    if (editingField && editingField !== key) {
      delete updatedFields[editingField];
    }
    
    updatedFields[key] = value;
    
    setSaving(true);
    try {
      if (onUpdate) {
        await onUpdate(updatedFields);
      }
      setLocalFields(updatedFields);
      setEditingField(null);
    } catch (error) {
      console.error('Error updating custom fields:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteField = async (key: string) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar el campo "${key}"?`)) {
      return;
    }

    const updatedFields = { ...localFields };
    delete updatedFields[key];
    
    setSaving(true);
    try {
      if (onUpdate) {
        await onUpdate(updatedFields);
      }
      setLocalFields(updatedFields);
      setEditingField(null);
    } catch (error) {
      console.error('Error deleting custom field:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddField = async (key: string, value: any) => {
    const updatedFields = { ...localFields, [key]: value };
    
    setSaving(true);
    try {
      if (onUpdate) {
        await onUpdate(updatedFields);
      }
      setLocalFields(updatedFields);
      setShowNewField(false);
    } catch (error) {
      console.error('Error adding custom field:', error);
    } finally {
      setSaving(false);
    }
  };

  const fieldEntries = Object.entries(localFields);

  return (
    <div className="bg-app-dark-800 shadow-sm rounded-lg border border-app-dark-700">
      <div className="px-6 py-4 border-b border-app-dark-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-app-gray-400" />
            <h3 className="text-lg font-medium text-app-gray-100">
              Campos Personalizados
            </h3>
          </div>
          
          {!showNewField && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNewField(true)}
              disabled={saving}
            >
              <Plus className="h-4 w-4 mr-1" />
              Añadir Campo
            </Button>
          )}
        </div>
      </div>
      
      <div className="px-6 py-6">
        {saving && (
          <div className="mb-4 flex items-center justify-center">
            <LoadingSpinner size="sm" className="mr-2" />
            <span className="text-sm text-app-gray-400">Guardando...</span>
          </div>
        )}

        <div className="space-y-4">
          {fieldEntries.length === 0 && !showNewField ? (
            <div className="text-center py-8">
              <Settings className="h-12 w-12 text-app-gray-500 mx-auto mb-4" />
              <h3 className="text-sm font-medium text-app-gray-300 mb-2">
                Sin campos personalizados
              </h3>
              <p className="text-xs text-app-gray-500 mb-4">
                Añade campos personalizados para almacenar información específica de este contacto.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewField(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Añadir Primer Campo
              </Button>
            </div>
          ) : (
            <>
              {fieldEntries.map(([key, value]) => {
                const fieldType = getFieldType(value);
                const isEditing = editingField === key;

                return (
                  <div key={key}>
                    {isEditing ? (
                      <FieldEditor
                        fieldKey={key}
                        fieldValue={value}
                        onSave={handleSaveField}
                        onCancel={() => setEditingField(null)}
                        onDelete={handleDeleteField}
                      />
                    ) : (
                      <div className="flex items-start justify-between p-4 bg-app-dark-700 rounded-lg border border-app-dark-600">
                        <div className="flex-1 min-w-0">
                          <dt className="text-sm font-medium text-app-gray-300 mb-1">
                            {key}
                          </dt>
                          <dd className="text-sm">
                            <FieldValueRenderer value={value} type={fieldType} />
                          </dd>
                          <div className="mt-1 text-xs text-app-gray-500">
                            Tipo: {fieldType}
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingField(key)}
                          disabled={saving}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}

              {showNewField && (
                <NewFieldForm
                  onSave={handleAddField}
                  onCancel={() => setShowNewField(false)}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactCustomFields;