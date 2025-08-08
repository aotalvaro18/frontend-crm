// src/components/contacts/ContactNotes.tsx
// Notes component especializado para el detalle de contacto

import React, { useState, useEffect } from 'react';
import { 
  FileText, Plus, Edit, Trash2, Save, X, 
  MoreVertical, Pin, PinOff, RefreshCw 
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatDate } from '@/utils/formatters';

// ============================================
// TYPES
// ============================================

interface Note {
  id: number;
  content: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt?: string;
  createdBy: string;
}

interface ContactNotesProps {
  contactId: number;
}

// ============================================
// NOTE ITEM COMPONENT
// ============================================

interface NoteItemProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (noteId: number) => void;
  onTogglePin: (noteId: number) => void;
  isDeleting: boolean;
}

const NoteItem: React.FC<NoteItemProps> = ({
  note,
  onEdit,
  onDelete,
  onTogglePin,
  isDeleting
}) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className={`relative p-4 rounded-lg border transition-all ${
      note.isPinned 
        ? 'bg-yellow-900/10 border-yellow-500/30' 
        : 'bg-app-dark-700 border-app-dark-600'
    } ${isDeleting ? 'opacity-50' : ''}`}>
      {/* Pin indicator */}
      {note.isPinned && (
        <div className="absolute top-2 right-2">
          <Pin className="h-3 w-3 text-yellow-400" />
        </div>
      )}

      {/* Content */}
      <div className="pr-8">
        <p className="text-sm text-app-gray-100 whitespace-pre-wrap mb-3">
          {note.content}
        </p>
        
        <div className="flex items-center justify-between text-xs text-app-gray-500">
          <div>
            <span>Por {note.createdBy}</span>
            <span className="mx-2">•</span>
            <span>{formatDate(note.createdAt)}</span>
            {note.updatedAt && note.updatedAt !== note.createdAt && (
              <>
                <span className="mx-2">•</span>
                <span>Editado {formatDate(note.updatedAt)}</span>
              </>
            )}
          </div>
          
          {isDeleting && (
            <div className="flex items-center">
              <LoadingSpinner size="xs" className="mr-1" />
              <span>Eliminando...</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions menu */}
      <div className="absolute top-2 right-2">
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMenu(!showMenu)}
            className="p-1"
            disabled={isDeleting}
          >
            <MoreVertical className="h-3 w-3" />
          </Button>
          
          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 mt-1 w-32 bg-app-dark-800 border border-app-dark-600 rounded-lg shadow-lg z-20">
                <div className="py-1">
                  <button
                    onClick={() => {
                      onEdit(note);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-app-gray-300 hover:bg-app-dark-700 flex items-center"
                  >
                    <Edit className="h-3 w-3 mr-2" />
                    Editar
                  </button>
                  
                  <button
                    onClick={() => {
                      onTogglePin(note.id);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-app-gray-300 hover:bg-app-dark-700 flex items-center"
                  >
                    {note.isPinned ? (
                      <>
                        <PinOff className="h-3 w-3 mr-2" />
                        Desanclar
                      </>
                    ) : (
                      <>
                        <Pin className="h-3 w-3 mr-2" />
                        Anclar
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => {
                      onDelete(note.id);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-900/20 flex items-center"
                  >
                    <Trash2 className="h-3 w-3 mr-2" />
                    Eliminar
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// NOTE EDITOR COMPONENT
// ============================================

interface NoteEditorProps {
  note?: Note;
  onSave: (content: string) => void;
  onCancel: () => void;
  saving: boolean;
}

const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  onSave,
  onCancel,
  saving
}) => {
  const [content, setContent] = useState(note?.content || '');

  const handleSave = () => {
    if (content.trim()) {
      onSave(content.trim());
    }
  };

  const isEditMode = !!note;

  return (
    <div className="p-4 bg-app-dark-700 rounded-lg border border-app-dark-600">
      <div className="mb-3">
        <label className="block text-sm font-medium text-app-gray-300 mb-2">
          {isEditMode ? 'Editar nota' : 'Nueva nota'}
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escribe tu nota aquí..."
          rows={4}
          className="w-full px-3 py-2 bg-app-dark-800 border border-app-dark-600 rounded text-app-gray-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
          disabled={saving}
        />
      </div>
      
      <div className="flex items-center justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={saving}
        >
          <X className="h-3 w-3 mr-1" />
          Cancelar
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!content.trim() || saving}
        >
          {saving ? (
            <LoadingSpinner size="xs" className="mr-1" />
          ) : (
            <Save className="h-3 w-3 mr-1" />
          )}
          {isEditMode ? 'Actualizar' : 'Guardar'}
        </Button>
      </div>
    </div>
  );
};

// ============================================
// EMPTY STATE COMPONENT
// ============================================

const EmptyNotes: React.FC<{ onAddNote: () => void }> = ({ onAddNote }) => (
  <div className="text-center py-8">
    <FileText className="h-12 w-12 text-app-gray-500 mx-auto mb-4" />
    <h3 className="text-sm font-medium text-app-gray-300 mb-2">
      Sin notas
    </h3>
    <p className="text-xs text-app-gray-500 mb-4">
      Las notas te ayudan a mantener un registro de información importante sobre este contacto.
    </p>
    <Button
      variant="outline"
      size="sm"
      onClick={onAddNote}
    >
      <Plus className="h-4 w-4 mr-1" />
      Añadir primera nota
    </Button>
  </div>
);

// ============================================
// MOCK DATA (En producción vendrá del API)
// ============================================

const getMockNotes = (contactId: number): Note[] => [
  {
    id: 1,
    content: "Contacto muy interesado en nuestros servicios premium. Mencionó que está buscando una solución integral para su organización.",
    isPinned: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: "admin@eklesa.com"
  },
  {
    id: 2,
    content: "Llamó para preguntar sobre precios. Le envié el catálogo por email.",
    isPinned: false,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: "john.doe@eklesa.com"
  },
  {
    id: 3,
    content: "Recordar: Tiene reunión programada para el próximo viernes a las 3 PM.",
    isPinned: false,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: "jane.smith@eklesa.com"
  }
];

// ============================================
// MAIN COMPONENT
// ============================================

const ContactNotes: React.FC<ContactNotesProps> = ({ contactId }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<number | null>(null);

  // Mock data loading
  useEffect(() => {
    const loadNotes = async () => {
      setLoading(true);
      // Simular llamada al API
      await new Promise(resolve => setTimeout(resolve, 300));
      setNotes(getMockNotes(contactId));
      setLoading(false);
    };

    loadNotes();
  }, [contactId]);

  const handleAddNote = async (content: string) => {
    setSaving(true);
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newNote: Note = {
        id: Date.now(),
        content,
        isPinned: false,
        createdAt: new Date().toISOString(),
        createdBy: "current.user@eklesa.com"
      };
      
      setNotes(prev => [newNote, ...prev]);
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleEditNote = async (content: string) => {
    if (!editingNote) return;
    
    setSaving(true);
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setNotes(prev => prev.map(note => 
        note.id === editingNote.id 
          ? { ...note, content, updatedAt: new Date().toISOString() }
          : note
      ));
      setEditingNote(null);
    } catch (error) {
      console.error('Error updating note:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta nota?')) {
      return;
    }

    setDeletingNoteId(noteId);
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setNotes(prev => prev.filter(note => note.id !== noteId));
    } catch (error) {
      console.error('Error deleting note:', error);
    } finally {
      setDeletingNoteId(null);
    }
  };

  const handleTogglePin = async (noteId: number) => {
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 200));
      
      setNotes(prev => prev.map(note => 
        note.id === noteId 
          ? { ...note, isPinned: !note.isPinned }
          : note
      ));
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    setNotes(getMockNotes(contactId));
    setLoading(false);
  };

  // Sort notes: pinned first, then by creation date
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="bg-app-dark-800 shadow-sm rounded-lg border border-app-dark-700">
      <div className="px-6 py-4 border-b border-app-dark-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-app-gray-400" />
            <h3 className="text-lg font-medium text-app-gray-100">
              Notas
            </h3>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={loading || saving}
            >
              {loading ? (
                <LoadingSpinner size="xs" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddForm(true)}
              disabled={showAddForm || !!editingNote}
            >
              <Plus className="h-4 w-4 mr-1" />
              Añadir
            </Button>
          </div>
        </div>
      </div>
      
      <div className="px-6 py-6">
        <div className="space-y-4">
          {/* Add note form */}
          {showAddForm && (
            <NoteEditor
              onSave={handleAddNote}
              onCancel={() => setShowAddForm(false)}
              saving={saving}
            />
          )}

          {/* Edit note form */}
          {editingNote && (
            <NoteEditor
              note={editingNote}
              onSave={handleEditNote}
              onCancel={() => setEditingNote(null)}
              saving={saving}
            />
          )}

          {/* Notes list */}
          {loading && notes.length === 0 ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : sortedNotes.length === 0 && !showAddForm ? (
            <EmptyNotes onAddNote={() => setShowAddForm(true)} />
          ) : (
            sortedNotes.map(note => (
              <NoteItem
                key={note.id}
                note={note}
                onEdit={setEditingNote}
                onDelete={handleDeleteNote}
                onTogglePin={handleTogglePin}
                isDeleting={deletingNoteId === note.id}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactNotes;