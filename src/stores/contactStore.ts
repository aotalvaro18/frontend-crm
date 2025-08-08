
// src/stores/contactStore.ts
// Contact store enterprise mobile-first con Zustand + optimistic updates

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import toast from 'react-hot-toast';

import { 
  contactApi, 
  buildMobileSearchCriteria, 
  buildMobilePagination,
  handleContactApiError 
} from '@/services/api/contactApi';
import { apiClient } from '@/services/api/baseApi';
import { APP_CONFIG, ERROR_CODES } from '@/utils/constants';

import type {
  ContactDTO,
  ContactEnrichedDTO,
  CreateContactRequest,
  UpdateContactRequest,
  ContactSearchCriteria,
  PageRequest,
  PageResponse,
  ContactStatsDTO,
  ImportFromTurnsRequest,
  ImportResult,
} from '@/types/contact.types';

// ============================================
// TYPES (Mobile-first state management)
// ============================================

interface ContactState {
  // ============================================
  // DATA STATE
  // ============================================
  contacts: ContactDTO[];
  selectedContact: ContactDTO | null;
  enrichedContacts: ContactEnrichedDTO[];
  selectedEnrichedContact: ContactEnrichedDTO | null;
  
  // Pagination & search
  totalContacts: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  searchCriteria: ContactSearchCriteria;
  
  // ============================================
  // UI STATE (Mobile-optimized)
  // ============================================
  loading: boolean;
  error: string | null;
  lastError: any; // Full error object for debugging
  
  // Mobile: Connection-aware loading
  isOffline: boolean;
  isSyncing: boolean;
  hasUnsyncedChanges: boolean;
  
  // Mobile: Operation states
  creating: boolean;
  updating: Set<number>; // Track which contacts are being updated
  deleting: Set<number>; // Track which contacts are being deleted
  
  // ============================================
  // SELECTION & BULK OPERATIONS
  // ============================================
  selectedContactIds: Set<number>;
  bulkOperationLoading: boolean;
  lastBulkOperation: string | null;
  
  // ============================================
  // STATS & ANALYTICS
  // ============================================
  stats: ContactStatsDTO | null;
  statsLoading: boolean;
  statsLastUpdated: number | null;
  
  // ============================================
  // OPTIMISTIC UPDATES (Mobile-critical)
  // ============================================
  optimisticUpdates: Map<number, Partial<ContactDTO>>;
  pendingOperations: Set<string>; // Track operations by ID
  
  // ============================================
  // ACTIONS - SEARCH & LIST
  // ============================================
  searchContacts: (criteria?: ContactSearchCriteria, page?: number) => Promise<void>;
  searchContactsEnriched: (criteria?: ContactSearchCriteria, page?: number) => Promise<void>;
  refreshContacts: () => Promise<void>;
  prefetchNextPage: () => Promise<void>;
  
  // ============================================
  // ACTIONS - INDIVIDUAL OPERATIONS
  // ============================================
  getContactById: (id: number, forceRefresh?: boolean) => Promise<void>;
  getContactByIdEnriched: (id: number) => Promise<void>;
  createContact: (request: CreateContactRequest) => Promise<ContactDTO>;
  updateContact: (id: number, request: UpdateContactRequest) => Promise<ContactDTO>;
  deleteContact: (id: number) => Promise<void>;
  
  // ============================================
  // ACTIONS - PORTAL OPERATIONS
  // ============================================
  generatePortalInvitation: (contactId: number) => Promise<string>;
  resendPortalInvitation: (contactId: number) => Promise<void>;
  revokePortalAccess: (contactId: number) => Promise<void>;
  
  // ============================================
  // ACTIONS - BULK OPERATIONS
  // ============================================
  selectContact: (id: number) => void;
  selectAllContacts: () => void;
  deselectContact: (id: number) => void;
  deselectAllContacts: () => void;
  bulkUpdateContacts: (updates: any) => Promise<void>;
  bulkDeleteContacts: () => Promise<void>;
  
  // ============================================
  // ACTIONS - IMPORT/EXPORT
  // ============================================
  importFromTurns: (request: ImportFromTurnsRequest) => Promise<ImportResult>;
  exportContacts: (format: 'csv' | 'excel', criteria?: ContactSearchCriteria) => Promise<void>;
  
  // ============================================
  // ACTIONS - STATS
  // ============================================
  loadStats: (forceRefresh?: boolean) => Promise<void>;
  
  // ============================================
  // ACTIONS - UTILITY
  // ============================================
  setSelectedContact: (contact: ContactDTO | null) => void;
  setSearchCriteria: (criteria: ContactSearchCriteria) => void;
  clearError: () => void;
  resetState: () => void;
  
  // Mobile-specific actions
  syncOfflineChanges: () => Promise<void>;
  clearOptimisticUpdates: () => void;
  getConnectionStatus: () => { isOnline: boolean; hasUnsyncedChanges: boolean };
}

// ============================================
// INITIAL STATE
// ============================================

const initialState = {
  // Data
  contacts: [],
  selectedContact: null,
  enrichedContacts: [],
  selectedEnrichedContact: null,
  totalContacts: 0,
  currentPage: 0,
  pageSize: APP_CONFIG.DEFAULT_PAGE_SIZE,
  totalPages: 0,
  searchCriteria: {},
  
  // UI State
  loading: false,
  error: null,
  lastError: null,
  isOffline: !navigator.onLine,
  isSyncing: false,
  hasUnsyncedChanges: false,
  creating: false,
  updating: new Set<number>(),
  deleting: new Set<number>(),
  
  // Selection
  selectedContactIds: new Set<number>(),
  bulkOperationLoading: false,
  lastBulkOperation: null,
  
  // Stats
  stats: null,
  statsLoading: false,
  statsLastUpdated: null,
  
  // Optimistic updates
  optimisticUpdates: new Map<number, Partial<ContactDTO>>(),
  pendingOperations: new Set<string>(),
};

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const useContactStore = create<ContactState>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        ...initialState,

        // ============================================
        // SEARCH & LIST OPERATIONS
        // ============================================

        searchContacts: async (criteria = {}, page = 0) => {
          const operationId = `search-${Date.now()}`;
          
          set(state => {
            state.loading = true;
            state.error = null;
            state.pendingOperations.add(operationId);
          });
          
          try {
            const currentCriteria = { ...get().searchCriteria, ...criteria };
            const optimalPageSize = contactApi.getOptimalPageSize();
            
            const pagination: PageRequest = {
              page,
              size: optimalPageSize,
              sort: ['lastName,asc', 'firstName,asc'],
            };

            const response = await contactApi.searchContacts(currentCriteria, pagination);
            
            set(state => {
              state.contacts = response.content;
              state.totalContacts = response.totalElements;
              state.currentPage = response.number;
              state.totalPages = response.totalPages;
              state.pageSize = response.size;
              state.searchCriteria = currentCriteria;
              state.loading = false;
              state.pendingOperations.delete(operationId);
              
              // Mobile: Apply optimistic updates
              state.contacts.forEach(contact => {
                const optimisticUpdate = state.optimisticUpdates.get(contact.id);
                if (optimisticUpdate) {
                  Object.assign(contact, optimisticUpdate);
                }
              });
            });

            // Mobile: Prefetch next page on fast connections
            if (response.number < response.totalPages - 1) {
              get().prefetchNextPage();
            }
            
          } catch (error: any) {
            const errorInfo = handleContactApiError(error);
            
            set(state => {
              state.error = errorInfo.message;
              state.lastError = error;
              state.loading = false;
              state.pendingOperations.delete(operationId);
              
              // Mobile: Set offline state if network error
              if (errorInfo.type === 'network_error') {
                state.isOffline = true;
              }
            });
            
            // Mobile: Don't show toast for network errors (handled by UI)
            if (errorInfo.type !== 'network_error') {
              toast.error(errorInfo.message);
            }
            
            throw error;
          }
        },

        searchContactsEnriched: async (criteria = {}, page = 0) => {
          set(state => {
            state.loading = true;
            state.error = null;
          });
          
          try {
            const currentCriteria = { ...get().searchCriteria, ...criteria };
            const pagination: PageRequest = {
              page,
              size: get().pageSize,
              sort: ['lastName,asc', 'firstName,asc'],
            };

            const response = await contactApi.searchContactsEnriched(currentCriteria, pagination);
            
            set(state => {
              state.enrichedContacts = response.content;
              state.totalContacts = response.totalElements;
              state.currentPage = response.number;
              state.totalPages = response.totalPages;
              state.searchCriteria = currentCriteria;
              state.loading = false;
            });
            
          } catch (error: any) {
            const errorInfo = handleContactApiError(error);
            set(state => {
              state.error = errorInfo.message;
              state.lastError = error;
              state.loading = false;
            });
            toast.error(errorInfo.message);
            throw error;
          }
        },

        refreshContacts: async () => {
          const { searchCriteria, currentPage } = get();
          await get().searchContacts(searchCriteria, currentPage);
        },

        prefetchNextPage: async () => {
          const { searchCriteria, currentPage, pageSize, totalPages } = get();
          
          if (currentPage < totalPages - 1) {
            try {
              await contactApi.prefetchNextPage(searchCriteria, currentPage, pageSize);
            } catch {
              // Ignore prefetch errors
            }
          }
        },

        // ============================================
        // INDIVIDUAL CONTACT OPERATIONS
        // ============================================

        getContactById: async (id: number, forceRefresh = false) => {
          set(state => {
            state.loading = true;
            state.error = null;
          });
          
          try {
            const contact = await contactApi.getContactById(id, { skipCache: forceRefresh });
            
            set(state => {
              state.selectedContact = contact;
              state.loading = false;
              
              // Mobile: Update contact in list if present
              const index = state.contacts.findIndex(c => c.id === id);
              if (index !== -1) {
                state.contacts[index] = contact;
              }
            });
          } catch (error: any) {
            const errorInfo = handleContactApiError(error);
            set(state => {
              state.error = errorInfo.message;
              state.lastError = error;
              state.loading = false;
            });
            
            if (errorInfo.type !== 'not_found') {
              toast.error(errorInfo.message);
            }
            throw error;
          }
        },

        getContactByIdEnriched: async (id: number) => {
          set(state => {
            state.loading = true;
            state.error = null;
          });
          
          try {
            const contact = await contactApi.getContactByIdEnriched(id);
            set(state => {
              state.selectedEnrichedContact = contact;
              state.loading = false;
            });
          } catch (error: any) {
            const errorInfo = handleContactApiError(error);
            set(state => {
              state.error = errorInfo.message;
              state.loading = false;
            });
            toast.error(errorInfo.message);
            throw error;
          }
        },

        createContact: async (request: CreateContactRequest) => {
          const tempId = Date.now(); // Temporary ID for optimistic update
          const operationId = `create-${tempId}`;
          
          set(state => {
            state.creating = true;
            state.error = null;
            state.pendingOperations.add(operationId);
            
            // Mobile: Optimistic update - add temporary contact to list
            const tempContact: ContactDTO = {
              id: tempId,
              version: 0,
              organizationId: 0,
              churchId: 0,
              firstName: request.firstName,
              lastName: request.lastName,
              email: request.email,
              phone: request.phone,
              cognitoSub: request.cognitoSub,
              companyId: request.companyId,
              birthDate: request.birthDate,
              gender: request.gender,
              address: request.address,
              source: request.source,
              sourceDetails: request.sourceDetails,
              ownerCognitoSub: '', // Will be set by backend
              status: 'ACTIVE',
              engagementScore: 0,
              tags: [],
              customFields: request.customFields || {},
              communicationPreferences: request.communicationPreferences || {},
              hasDigitalPortal: false,
              createdBy: '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            
            state.contacts.unshift(tempContact);
            state.totalContacts += 1;
          });
          
          try {
            const newContact = await contactApi.createContact(request);
            
            set(state => {
              // Replace temporary contact with real one
              const tempIndex = state.contacts.findIndex(c => c.id === tempId);
              if (tempIndex !== -1) {
                state.contacts[tempIndex] = newContact;
              }
              
              state.creating = false;
              state.pendingOperations.delete(operationId);
            });
            
            // Mobile: Success feedback
            toast.success(`鉁?${newContact.firstName} ${newContact.lastName} creado`);
            
            return newContact;
          } catch (error: any) {
            const errorInfo = handleContactApiError(error);
            
            set(state => {
              // Remove temporary contact on error
              state.contacts = state.contacts.filter(c => c.id !== tempId);
              state.totalContacts = Math.max(0, state.totalContacts - 1);
              
              state.error = errorInfo.message;
              state.lastError = error;
              state.creating = false;
              state.pendingOperations.delete(operationId);
              
              // Mobile: Track offline changes
              if (errorInfo.type === 'network_error') {
                state.hasUnsyncedChanges = true;
                state.isOffline = true;
              }
            });
            
            // Mobile: Different handling for network vs validation errors
            if (errorInfo.type === 'network_error') {
              toast.error('馃摫 Sin conexi贸n. Se reintentar谩 autom谩ticamente.');
            } else {
              toast.error(errorInfo.message);
            }
            
            throw error;
          }
        },

        updateContact: async (id: number, request: UpdateContactRequest) => {
          const operationId = `update-${id}`;
          
          set(state => {
            state.updating.add(id);
            state.error = null;
            state.pendingOperations.add(operationId);
            
            // Mobile: Optimistic update
            const contactIndex = state.contacts.findIndex(c => c.id === id);
            if (contactIndex !== -1) {
              const optimisticUpdate = {
                firstName: request.firstName,
                lastName: request.lastName,
                email: request.email,
                phone: request.phone,
                status: request.status,
                updatedAt: new Date().toISOString(),
              };
              
              state.optimisticUpdates.set(id, optimisticUpdate);
              Object.assign(state.contacts[contactIndex], optimisticUpdate);
            }
            
            // Update selected contact if it's the same
            if (state.selectedContact?.id === id) {
              Object.assign(state.selectedContact, {
                firstName: request.firstName,
                lastName: request.lastName,
                email: request.email,
                phone: request.phone,
                status: request.status,
              });
            }
          });
          
          try {
            const updatedContact = await contactApi.updateContact(id, request);
            
            set(state => {
              // Remove optimistic update and apply real data
              state.optimisticUpdates.delete(id);
              
              const contactIndex = state.contacts.findIndex(c => c.id === id);
              if (contactIndex !== -1) {
                state.contacts[contactIndex] = updatedContact;
              }
              
              if (state.selectedContact?.id === id) {
                state.selectedContact = updatedContact;
              }
              
              state.updating.delete(id);
              state.pendingOperations.delete(operationId);
            });
            
            // Mobile: Success feedback with name
            toast.success(`鉁?${updatedContact.firstName} ${updatedContact.lastName} actualizado`);
            
            return updatedContact;
          } catch (error: any) {
            const errorInfo = handleContactApiError(error);
            
            set(state => {
              // Revert optimistic update on error
              state.optimisticUpdates.delete(id);
              
              const contactIndex = state.contacts.findIndex(c => c.id === id);
              if (contactIndex !== -1) {
                // Restore original data - we need to fetch it
                get().getContactById(id, true).catch(() => {
                  // If fetch fails, remove from list
                  state.contacts.splice(contactIndex, 1);
                });
              }
              
              state.error = errorInfo.message;
              state.lastError = error;
              state.updating.delete(id);
              state.pendingOperations.delete(operationId);
              
              if (errorInfo.type === 'network_error') {
                state.hasUnsyncedChanges = true;
                state.isOffline = true;
              }
            });
            
            // Mobile: Specific error handling
            if (errorInfo.type === 'concurrency_conflict') {
              toast.error(`鈿狅笍 Contacto modificado por otro usuario. Versi贸n actual: ${errorInfo.currentVersion}`);
            } else if (errorInfo.type === 'network_error') {
              toast.error('馃摫 Sin conexi贸n. Cambios guardados localmente.');
            } else {
              toast.error(errorInfo.message);
            }
            
            throw error;
          }
        },

        deleteContact: async (id: number) => {
          const operationId = `delete-${id}`;
          
          set(state => {
            state.deleting.add(id);
            state.error = null;
            state.pendingOperations.add(operationId);
          });
          
          // Mobile: Store original contact for rollback
          const originalContact = get().contacts.find(c => c.id === id);
          const originalIndex = get().contacts.findIndex(c => c.id === id);
          
          // Optimistic delete
          set(state => {
            state.contacts = state.contacts.filter(c => c.id !== id);
            state.totalContacts = Math.max(0, state.totalContacts - 1);
            
            if (state.selectedContact?.id === id) {
              state.selectedContact = null;
            }
            if (state.selectedEnrichedContact?.id === id) {
              state.selectedEnrichedContact = null;
            }
            
            state.selectedContactIds.delete(id);
          });
          
          try {
            await contactApi.deleteContact(id);
            
            set(state => {
              state.deleting.delete(id);
              state.pendingOperations.delete(operationId);
            });
            
            // Mobile: Success feedback
            if (originalContact) {
              toast.success(`馃棏锔?${originalContact.firstName} ${originalContact.lastName} eliminado`);
            }
            
          } catch (error: any) {
            const errorInfo = handleContactApiError(error);
            
            set(state => {
              // Rollback optimistic delete
              if (originalContact && originalIndex !== -1) {
                state.contacts.splice(originalIndex, 0, originalContact);
                state.totalContacts += 1;
              }
              
              state.error = errorInfo.message;
              state.lastError = error;
              state.deleting.delete(id);
              state.pendingOperations.delete(operationId);
              
              if (errorInfo.type === 'network_error') {
                state.hasUnsyncedChanges = true;
                state.isOffline = true;
              }
            });
            
            if (errorInfo.type === 'network_error') {
              toast.error('馃摫 Sin conexi贸n. Eliminaci贸n pendiente.');
            } else {
              toast.error(errorInfo.message);
            }
            
            throw error;
          }
        },

        // ============================================
        // PORTAL OPERATIONS
        // ============================================

        generatePortalInvitation: async (contactId: number) => {
          set(state => {
            state.loading = true;
            state.error = null;
          });
          
          try {
            const response = await contactApi.generateMemberPortalInvitation(contactId);
            
            set(state => {
              // Update contact to show invitation sent
              const contactIndex = state.contacts.findIndex(c => c.id === contactId);
              if (contactIndex !== -1) {
                state.contacts[contactIndex].portalInvitationSent = new Date().toISOString();
              }
              
              if (state.selectedContact?.id === contactId) {
                state.selectedContact.portalInvitationSent = new Date().toISOString();
              }
              
              state.loading = false;
            });
            
            // Mobile: Success feedback
            toast.success('馃摟 Invitaci贸n de portal enviada');
            
            return response.invitationToken;
          } catch (error: any) {
            const errorInfo = handleContactApiError(error);
            set(state => {
              state.error = errorInfo.message;
              state.loading = false;
            });
            toast.error(errorInfo.message);
            throw error;
          }
        },

        resendPortalInvitation: async (contactId: number) => {
          try {
            await contactApi.resendPortalInvitation(contactId);
            
            set(state => {
              const contactIndex = state.contacts.findIndex(c => c.id === contactId);
              if (contactIndex !== -1) {
                state.contacts[contactIndex].portalInvitationSent = new Date().toISOString();
              }
            });
            
            toast.success('馃摟 Invitaci贸n reenviada');
          } catch (error: any) {
            const errorInfo = handleContactApiError(error);
            toast.error(errorInfo.message);
            throw error;
          }
        },

        revokePortalAccess: async (contactId: number) => {
          try {
            await contactApi.revokePortalAccess(contactId);
            
            set(state => {
              const contactIndex = state.contacts.findIndex(c => c.id === contactId);
              if (contactIndex !== -1) {
                state.contacts[contactIndex].hasDigitalPortal = false;
                state.contacts[contactIndex].portalInvitationSent = undefined;
                state.contacts[contactIndex].digitalEngagementScore = undefined;
              }
            });
            
            toast.success('馃毇 Acceso al portal revocado');
          } catch (error: any) {
            const errorInfo = handleContactApiError(error);
            toast.error(errorInfo.message);
            throw error;
          }
        },

        // ============================================
        // BULK OPERATIONS
        // ============================================

        selectContact: (id: number) => {
          set(state => {
            state.selectedContactIds.add(id);
          });
        },

        selectAllContacts: () => {
          set(state => {
            state.contacts.forEach(contact => {
              state.selectedContactIds.add(contact.id);
            });
          });
        },

        deselectContact: (id: number) => {
          set(state => {
            state.selectedContactIds.delete(id);
          });
        },

        deselectAllContacts: () => {
          set(state => {
            state.selectedContactIds.clear();
          });
        },

        bulkUpdateContacts: async (updates: any) => {
          const { selectedContactIds } = get();
          const contactIdsArray = Array.from(selectedContactIds);
          
          if (contactIdsArray.length === 0) return;

          set(state => {
            state.bulkOperationLoading = true;
            state.error = null;
            state.lastBulkOperation = 'update';
          });
          
          try {
            const result = await contactApi.bulkUpdateContacts(contactIdsArray, updates);
            
            // Refresh contacts to get updated data
            await get().refreshContacts();
            
            set(state => {
              state.bulkOperationLoading = false;
              state.selectedContactIds.clear();
            });
            
            toast.success(`鉁?${result.updated} contactos actualizados`);
            if (result.failed > 0) {
              toast.warning(`鈿狅笍 ${result.failed} contactos fallaron`);
            }
            
          } catch (error: any) {
            const errorInfo = handleContactApiError(error);
            set(state => {
              state.error = errorInfo.message;
              state.bulkOperationLoading = false;
            });
            toast.error(errorInfo.message);
            throw error;
          }
        },

        bulkDeleteContacts: async () => {
          const { selectedContactIds } = get();
          const contactIdsArray = Array.from(selectedContactIds);
          
          if (contactIdsArray.length === 0) return;

          set(state => {
            state.bulkOperationLoading = true;
            state.error = null;
            state.lastBulkOperation = 'delete';
          });
          
          try {
            const result = await contactApi.bulkDeleteContacts(contactIdsArray);
            
            set(state => {
              // Remove deleted contacts from list
              state.contacts = state.contacts.filter(c => !contactIdsArray.includes(c.id));
              state.totalContacts = Math.max(0, state.totalContacts - result.deleted);
              state.bulkOperationLoading = false;
              state.selectedContactIds.clear();
            });
            
            toast.success(`馃棏锔?${result.deleted} contactos eliminados`);
            if (result.failed > 0) {
              toast.warning(`鈿狅笍 ${result.failed} contactos fallaron`);
            }
            
          } catch (error: any) {
            const errorInfo = handleContactApiError(error);
            set(state => {
              state.error = errorInfo.message;
              state.bulkOperationLoading = false;
            });
            toast.error(errorInfo.message);
            throw error;
          }
        },

        // ============================================
        // IMPORT/EXPORT
        // ============================================

        importFromTurns: async (request: ImportFromTurnsRequest) => {
          set(state => {
            state.loading = true;
            state.error = null;
          });
          
          try {
            const result = await contactApi.importFromTurnsService(request);
            
            if (result.successCount > 0) {
              await get().refreshContacts();
            }
            
            set(state => {
              state.loading = false;
            });
            
            // Mobile: Detailed import feedback
            toast.success(`馃摜 ${result.successCount} contactos importados`);
            if (result.skippedCount > 0) {
              toast.warning(`鈴笍 ${result.skippedCount} contactos omitidos`);
            }
            if (result.errorCount > 0) {
              toast.error(`鉂?${result.errorCount} errores de importaci贸n`);
            }
            
            return result;
          } catch (error: any) {
            const errorInfo = handleContactApiError(error);
            set(state => {
              state.error = errorInfo.message;
              state.loading = false;
            });
            toast.error(errorInfo.message);
            throw error;
          }
        },

        exportContacts: async (format: 'csv' | 'excel', criteria = {}) => {
          try {
            const connection = apiClient.getConnectionInfo();
            
            // Mobile: Warn on slow connections
            if (connection.isSlowConnection) {
              toast.loading('馃摫 Exportando... puede tardar en conexi贸n lenta', { duration: 5000 });
            } else {
              toast.loading('馃搫 Exportando contactos...');
            }
            
            const blob = format === 'csv' 
              ? await contactApi.exportContactsCSV(criteria)
              : await contactApi.exportContactsExcel(criteria);
            
            // Mobile: Download file
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `contactos-${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            toast.dismiss();
            toast.success(`馃搧 Archivo ${format.toUpperCase()} descargado`);
            
          } catch (error: any) {
            toast.dismiss();
            const errorInfo = handleContactApiError(error);
            toast.error(errorInfo.message);
            throw error;
          }
        },

        // ============================================
        // STATS
        // ============================================

        loadStats: async (forceRefresh = false) => {
          const now = Date.now();
          const { statsLastUpdated } = get();
          
          // Mobile: Don't reload stats too frequently
          if (!forceRefresh && statsLastUpdated && (now - statsLastUpdated < 5 * 60 * 1000)) {
            return;
          }
          
          set(state => {
            state.statsLoading = true;
          });
          
          try {
            const stats = await contactApi.getContactStats();
            set(state => {
              state.stats = stats;
              state.statsLoading = false;
              state.statsLastUpdated = now;
            });
          } catch (error: any) {
            console.error('Error loading contact stats:', error);
            set(state => {
              state.statsLoading = false;
             });
         }
       },

       // ============================================
       // UTILITY ACTIONS
       // ============================================

       setSelectedContact: (contact) => {
         set(state => {
           state.selectedContact = contact;
         });
       },
       
       setSearchCriteria: (criteria) => {
         set(state => {
           state.searchCriteria = criteria;
         });
       },
       
       clearError: () => {
         set(state => {
           state.error = null;
           state.lastError = null;
         });
       },
       
       resetState: () => {
         set(state => {
           Object.assign(state, initialState);
           // Preserve connection state
           state.isOffline = !navigator.onLine;
         });
       },

       // ============================================
       // MOBILE-SPECIFIC ACTIONS
       // ============================================

       syncOfflineChanges: async () => {
         const { hasUnsyncedChanges, isOffline } = get();
         
         if (!hasUnsyncedChanges || isOffline) {
           return;
         }
         
         set(state => {
           state.isSyncing = true;
         });
         
         try {
           // Force sync offline queue
           await apiClient.forceSyncOfflineQueue();
           
           // Refresh contacts to get latest data
           await get().refreshContacts();
           
           set(state => {
             state.isSyncing = false;
             state.hasUnsyncedChanges = false;
           });
           
           toast.success('馃攧 Cambios sincronizados');
           
         } catch (error) {
           set(state => {
             state.isSyncing = false;
           });
           console.error('Error syncing offline changes:', error);
         }
       },

       clearOptimisticUpdates: () => {
         set(state => {
           state.optimisticUpdates.clear();
           state.pendingOperations.clear();
         });
       },

       getConnectionStatus: () => {
         const { isOffline, hasUnsyncedChanges } = get();
         return { isOnline: !isOffline, hasUnsyncedChanges };
       },
     }))
   ),
   {
     name: 'contact-store',
     // Mobile: Optimize devtools for performance
     partialize: (state) => ({
       contacts: state.contacts.slice(0, 10), // Only first 10 for debug
       selectedContact: state.selectedContact,
       loading: state.loading,
       error: state.error,
       totalContacts: state.totalContacts,
       currentPage: state.currentPage,
       isOffline: state.isOffline,
       hasUnsyncedChanges: state.hasUnsyncedChanges,
       selectedContactIds: Array.from(state.selectedContactIds).slice(0, 5),
     }),
   }
 )
);

// ============================================
// NETWORK CONNECTION LISTENER (Mobile-critical)
// ============================================

// Listen to network changes
window.addEventListener('online', () => {
 useContactStore.setState(state => {
   state.isOffline = false;
 });
 
 // Auto-sync when connection is restored
 const store = useContactStore.getState();
 if (store.hasUnsyncedChanges) {
   store.syncOfflineChanges();
 }
});

window.addEventListener('offline', () => {
 useContactStore.setState(state => {
   state.isOffline = true;
 });
});

// ============================================
// SUBSCRIPTION HELPERS (Mobile-optimized)
// ============================================

// Mobile: Subscribe to connection status changes
export const useConnectionStatus = () => {
 return useContactStore(state => ({
   isOnline: !state.isOffline,
   isSyncing: state.isSyncing,
   hasUnsyncedChanges: state.hasUnsyncedChanges,
   syncOfflineChanges: state.syncOfflineChanges,
 }));
};

// Mobile: Subscribe to operation states
export const useOperationStates = () => {
 return useContactStore(state => ({
   loading: state.loading,
   creating: state.creating,
   updating: state.updating,
   deleting: state.deleting,
   bulkOperationLoading: state.bulkOperationLoading,
   pendingOperations: state.pendingOperations,
 }));
};

// ============================================
// SELECTORS (Performance-optimized)
// ============================================

/**
* Hook para obtener contactos con loading state
*/
export const useContacts = () => {
 return useContactStore(state => ({
   contacts: state.contacts,
   enrichedContacts: state.enrichedContacts,
   loading: state.loading,
   error: state.error,
   totalContacts: state.totalContacts,
   currentPage: state.currentPage,
   totalPages: state.totalPages,
   pageSize: state.pageSize,
   searchContacts: state.searchContacts,
   searchContactsEnriched: state.searchContactsEnriched,
   refreshContacts: state.refreshContacts,
   prefetchNextPage: state.prefetchNextPage,
 }));
};

/**
* Hook para contacto seleccionado
*/
export const useSelectedContact = () => {
 return useContactStore(state => ({
   selectedContact: state.selectedContact,
   selectedEnrichedContact: state.selectedEnrichedContact,
   getContactById: state.getContactById,
   getContactByIdEnriched: state.getContactByIdEnriched,
   setSelectedContact: state.setSelectedContact,
   // Mobile: Include update state for selected contact
   isUpdating: state.selectedContact ? state.updating.has(state.selectedContact.id) : false,
   isDeleting: state.selectedContact ? state.deleting.has(state.selectedContact.id) : false,
 }));
};

/**
* Hook para operaciones CRUD
*/
export const useContactOperations = () => {
 return useContactStore(state => ({
   createContact: state.createContact,
   updateContact: state.updateContact,
   deleteContact: state.deleteContact,
   loading: state.loading,
   creating: state.creating,
   error: state.error,
   // Mobile: Clear error function
   clearError: state.clearError,
 }));
};

/**
* Hook para operaciones de portal
*/
export const usePortalOperations = () => {
 return useContactStore(state => ({
   generatePortalInvitation: state.generatePortalInvitation,
   resendPortalInvitation: state.resendPortalInvitation,
   revokePortalAccess: state.revokePortalAccess,
   loading: state.loading,
   error: state.error,
 }));
};

/**
* Hook para operaciones bulk (Mobile-optimized)
*/
export const useBulkOperations = () => {
 return useContactStore(state => ({
   selectedContactIds: state.selectedContactIds,
   bulkOperationLoading: state.bulkOperationLoading,
   lastBulkOperation: state.lastBulkOperation,
   selectContact: state.selectContact,
   selectAllContacts: state.selectAllContacts,
   deselectContact: state.deselectContact,
   deselectAllContacts: state.deselectAllContacts,
   bulkUpdateContacts: state.bulkUpdateContacts,
   bulkDeleteContacts: state.bulkDeleteContacts,
   // Mobile: Computed values
   hasSelection: state.selectedContactIds.size > 0,
   selectionCount: state.selectedContactIds.size,
   canBulkUpdate: state.selectedContactIds.size > 0 && state.selectedContactIds.size <= 100,
   canBulkDelete: state.selectedContactIds.size > 0 && state.selectedContactIds.size <= 50,
 }));
};

/**
* Hook para estad铆sticas
*/
export const useContactStats = () => {
 return useContactStore(state => ({
   stats: state.stats,
   statsLoading: state.statsLoading,
   statsLastUpdated: state.statsLastUpdated,
   loadStats: state.loadStats,
   // Mobile: Computed stats
   hasStats: !!state.stats,
   isStatsStale: state.statsLastUpdated ? (Date.now() - state.statsLastUpdated > 10 * 60 * 1000) : true,
 }));
};

/**
* Hook para import/export
*/
export const useImportExport = () => {
 return useContactStore(state => ({
   importFromTurns: state.importFromTurns,
   exportContacts: state.exportContacts,
   loading: state.loading,
   error: state.error,
 }));
};

/**
* Hook para estado de b煤squeda y filtros
*/
export const useContactSearch = () => {
 return useContactStore(state => ({
   searchCriteria: state.searchCriteria,
   setSearchCriteria: state.setSearchCriteria,
   totalContacts: state.totalContacts,
   currentPage: state.currentPage,
   totalPages: state.totalPages,
   pageSize: state.pageSize,
   // Mobile: Search helpers
   hasActiveFilters: Object.keys(state.searchCriteria).length > 0,
   isFirstPage: state.currentPage === 0,
   isLastPage: state.currentPage >= state.totalPages - 1,
   hasResults: state.totalContacts > 0,
 }));
};

// ============================================
// ADVANCED SELECTORS (Mobile-optimized)
// ============================================

/**
* Selector para obtener contacto por ID sin re-renders innecesarios
*/
export const selectContactById = (id: number) => (state: any) =>
 state.contacts.find((contact: ContactDTO) => contact.id === id);

/**
* Selector para obtener contactos filtrados por estado
*/
export const selectContactsByStatus = (status: string) => (state: any) =>
 state.contacts.filter((contact: ContactDTO) => contact.status === status);

/**
* Selector para obtener contactos con portal digital
*/
export const selectContactsWithPortal = (state: any) =>
 state.contacts.filter((contact: ContactDTO) => contact.hasDigitalPortal);

/**
* Selector para obtener contactos sin portal digital
*/
export const selectContactsWithoutPortal = (state: any) =>
 state.contacts.filter((contact: ContactDTO) => 
   !contact.hasDigitalPortal && !contact.portalInvitationSent
 );

/**
* Selector para obtener contactos con invitaciones pendientes
*/
export const selectContactsWithPendingInvitations = (state: any) =>
 state.contacts.filter((contact: ContactDTO) => 
   contact.portalInvitationSent && !contact.hasDigitalPortal
 );

// ============================================
// UTILITY HOOKS (Mobile-specific)
// ============================================

/**
* Hook para limpiar filtros
*/
export const useClearFilters = () => {
 const { setSearchCriteria, searchContacts } = useContactStore();
 
 return async () => {
   setSearchCriteria({});
   await searchContacts({}, 0);
 };
};

/**
* Hook para refrescar datos
*/
export const useRefreshContacts = () => {
 const { searchCriteria, currentPage, searchContacts } = useContactStore();
 
 return () => searchContacts(searchCriteria, currentPage);
};

/**
* Hook para manejar errores de forma consistente
*/
export const useContactErrorHandler = () => {
 const { clearError, lastError } = useContactStore();
 
 return {
   clearError,
   lastError,
   handleError: (error: any) => {
     console.error('Contact operation error:', error);
     
     // Mobile: Log additional context in development
     if (import.meta.env.DEV) {
       console.group('馃悰 Contact Error Details');
       console.log('Error:', error);
       console.log('Type:', typeof error);
       console.log('Stack:', error.stack);
       console.log('API Client Stats:', apiClient.getCacheStats());
       console.log('Offline Queue:', apiClient.getOfflineQueueStats());
       console.groupEnd();
     }
   },
 };
};

/**
* Hook para obtener m茅tricas de performance (Mobile-specific)
*/
export const useContactPerformanceMetrics = () => {
 return useContactStore(state => ({
   // UI Performance
   loadingOperations: state.pendingOperations.size,
   optimisticUpdatesCount: state.optimisticUpdates.size,
   selectedItemsCount: state.selectedContactIds.size,
   
   // Connection status
   isOffline: state.isOffline,
   hasUnsyncedChanges: state.hasUnsyncedChanges,
   isSyncing: state.isSyncing,
   
   // Data metrics
   contactsInMemory: state.contacts.length,
   enrichedContactsInMemory: state.enrichedContacts.length,
   
   // Cache metrics (from API client)
   getCacheStats: () => apiClient.getCacheStats(),
   getOfflineQueueStats: () => apiClient.getOfflineQueueStats(),
   getConnectionInfo: () => apiClient.getConnectionInfo(),
 }));
};

/**
* Hook para operaciones autom谩ticas (Mobile background tasks)
*/
export const useContactBackgroundSync = () => {
 const { syncOfflineChanges, hasUnsyncedChanges, isOffline, loadStats } = useContactStore();
 
 React.useEffect(() => {
   // Auto-sync when app becomes visible
   const handleVisibilityChange = () => {
     if (!document.hidden && !isOffline && hasUnsyncedChanges) {
       syncOfflineChanges();
     }
   };
   
   document.addEventListener('visibilitychange', handleVisibilityChange);
   return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
 }, [syncOfflineChanges, hasUnsyncedChanges, isOffline]);
 
 React.useEffect(() => {
   // Periodic stats refresh (every 10 minutes)
   const interval = setInterval(() => {
     if (!isOffline) {
       loadStats(false); // Don't force refresh
     }
   }, 10 * 60 * 1000);
   
   return () => clearInterval(interval);
 }, [loadStats, isOffline]);
 
 return {
   syncOfflineChanges,
   hasUnsyncedChanges,
   isOffline,
 };
};

// ============================================
// PERFORMANCE OPTIMIZATION (Mobile-critical)
// ============================================

// Subscribe to store changes for debugging (development only)
if (import.meta.env.DEV) {
 let lastLogTime = 0;
 
 useContactStore.subscribe((state, prevState) => {
   const now = Date.now();
   
   // Throttle logging to prevent spam
   if (now - lastLogTime > 1000) {
     const changes = [];
     
     if (state.contacts.length !== prevState.contacts.length) {
       changes.push(`contacts: ${prevState.contacts.length} 鈫?${state.contacts.length}`);
     }
     
     if (state.loading !== prevState.loading) {
       changes.push(`loading: ${prevState.loading} 鈫?${state.loading}`);
     }
     
     if (state.selectedContactIds.size !== prevState.selectedContactIds.size) {
       changes.push(`selection: ${prevState.selectedContactIds.size} 鈫?${state.selectedContactIds.size}`);
     }
     
     if (changes.length > 0) {
       console.log('馃搳 Contact Store Changes:', changes.join(', '));
       lastLogTime = now;
     }
   }
 });
}

export default useContactStore; 
