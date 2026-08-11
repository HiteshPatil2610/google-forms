import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ViewMode, Form, FormResponse, SortMode } from './types';
import {
  getStoredForms,
  saveStoredForms,
  getStoredResponses,
  addStoredResponse,
  deleteStoredResponse,
  clearFormResponses,
  markFormAsSubmitted,
  getLastViewedResponseCounts,
  setLastViewedResponseCount,
  getStoredDarkMode,
  saveStoredDarkMode,
} from './utils/storage';
import { Navbar } from './components/Navbar';
import { FormManager } from './components/FormManager';
import { FormEditor } from './components/FormEditor';
import { FormSettingsView } from './components/FormSettingsView';
import { FormRespondent } from './components/FormRespondent';
import { FormReport } from './components/FormReport';
import { ThemeCustomizer } from './components/ThemeCustomizer';
import { SendModal } from './components/SendModal';
import { AiFormGeneratorModal } from './components/AiFormGeneratorModal';
import { ExcelImportModal } from './components/ExcelImportModal';

// ─── Undo/Redo stack size limit ───────────────────────────────────────────────
const MAX_HISTORY = 50;

export default function App() {
  // ─── Core state ─────────────────────────────────────────────────────────────
  const [forms, setForms] = useState<Form[]>(() => getStoredForms());
  const [responses, setResponses] = useState<FormResponse[]>(() => getStoredResponses());
  const [viewMode, setViewMode] = useState<ViewMode>({ mode: 'MANAGEMENT' });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('updatedAt');

  // ─── Dark mode ──────────────────────────────────────────────────────────────
  const [darkMode, setDarkMode] = useState<boolean>(() => getStoredDarkMode());

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    saveStoredDarkMode(darkMode);
  }, [darkMode]);

  // ─── Auto-save indicator ─────────────────────────────────────────────────────
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Undo / Redo stacks ──────────────────────────────────────────────────────
  const [undoStack, setUndoStack] = useState<Form[][]>([]);
  const [redoStack, setRedoStack] = useState<Form[][]>([]);

  // ─── Bulk selection ──────────────────────────────────────────────────────────
  const [selectedFormIds, setSelectedFormIds] = useState<string[]>([]);

  // ─── Last-viewed response counts (for new-response badge) ───────────────────
  const [lastViewedCounts, setLastViewedCounts] = useState<Record<string, number>>(
    () => getLastViewedResponseCounts()
  );

  // ─── Modals ──────────────────────────────────────────────────────────────────
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);

  // ─── URL deep-link: ?respondent=<formId> ────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const respFormId = params.get('respondent');
    if (respFormId) {
      setViewMode({ mode: 'RESPONDENT', formId: respFormId });
    }
  }, []);

  // ─── Keyboard shortcuts ──────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // ─── Save forms with undo-stack support ──────────────────────────────────────
  const updateFormsState = useCallback(
    (newForms: Form[], pushToUndo = true) => {
      if (pushToUndo) {
        setUndoStack((prev) => {
          const next = [...prev, forms];
          return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
        });
        setRedoStack([]);
      }
      setForms(newForms);
      saveStoredForms(newForms);

      // Debounced auto-save indicator
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => setLastSavedAt(new Date()), 600);
    },
    [forms]
  );

  const handleUndo = useCallback(() => {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      const previous = prev[prev.length - 1];
      const next = prev.slice(0, prev.length - 1);
      setRedoStack((r) => [...r, forms]);
      setForms(previous);
      saveStoredForms(previous);
      return next;
    });
  }, [forms]);

  const handleRedo = useCallback(() => {
    setRedoStack((prev) => {
      if (prev.length === 0) return prev;
      const next = prev[prev.length - 1];
      const remaining = prev.slice(0, prev.length - 1);
      setUndoStack((u) => [...u, forms]);
      setForms(next);
      saveStoredForms(next);
      return remaining;
    });
  }, [forms]);

  // ─── Derived helpers ─────────────────────────────────────────────────────────
  const currentFormId =
    viewMode.mode === 'EDITOR' || viewMode.mode === 'RESPONDENT' ? viewMode.formId : null;
  const currentForm = forms.find((f) => f.id === currentFormId);

  const responseCounts: Record<string, number> = {};
  responses.forEach((r) => {
    responseCounts[r.formId] = (responseCounts[r.formId] || 0) + 1;
  });

  // New-response badge: responses since last viewed
  const newResponseCounts: Record<string, number> = {};
  Object.entries(responseCounts).forEach(([formId, count]) => {
    const lastViewed = lastViewedCounts[formId] || 0;
    newResponseCounts[formId] = Math.max(0, count - lastViewed);
  });

  // Mark responses viewed when switching to Responses tab
  useEffect(() => {
    if (viewMode.mode === 'EDITOR' && viewMode.activeTab === 'responses' && currentFormId) {
      const count = responseCounts[currentFormId] || 0;
      setLastViewedResponseCount(currentFormId, count);
      setLastViewedCounts((prev) => ({ ...prev, [currentFormId]: count }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  // ─── CRUD: Forms ─────────────────────────────────────────────────────────────

  const handleCreateNewForm = (category: string = 'Blank') => {
    const formId = `form-${Date.now()}`;
    const secId = `sec-${Date.now()}`;

    const newForm: Form = {
      id: formId,
      title: category === 'Blank' ? 'Untitled Form' : `${category} Form`,
      description: 'Form description',
      category: category as any,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      theme: {
        primaryColor: '#673ab7',
        backgroundColor: '#f0ebf8',
        fontStyle: 'Roboto',
      },
      settings: {
        isQuiz: category === 'Quiz',
        releaseGradesImmediately: true,
        allowResponseEditing: true,
        limitOneResponse: false,
        showProgressBar: true,
        shuffleQuestionOrder: false,
        confirmationMessage: 'Your response has been recorded.',
        acceptingResponses: true,
        closedMessage: 'This form is no longer accepting responses.',
      },
      sections: [{ id: secId, title: 'Section 1', description: '' }],
      questions: [
        {
          id: `q-${Date.now()}`,
          sectionId: secId,
          type: 'MULTIPLE_CHOICE',
          title: 'Untitled Question',
          required: false,
          options: [
            { id: `opt-${Date.now()}-1`, text: 'Option 1' },
            { id: `opt-${Date.now()}-2`, text: 'Option 2' },
          ],
        },
      ],
    };

    updateFormsState([newForm, ...forms]);
    setViewMode({ mode: 'EDITOR', formId: newForm.id, activeTab: 'questions' });
  };

  const handleDuplicateForm = (formId: string) => {
    const target = forms.find((f) => f.id === formId);
    if (!target) return;

    const newFormId = `form-copy-${Date.now()}`;
    const duplicated: Form = {
      ...target,
      id: newFormId,
      title: `${target.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isTrashed: false,
      questions: target.questions.map((q) => ({
        ...q,
        id: `q-copy-${Math.random().toString(36).substring(2, 7)}`,
      })),
    };

    updateFormsState([duplicated, ...forms]);
  };

  const handleToggleFavorite = (formId: string) => {
    const updated = forms.map((f) =>
      f.id === formId ? { ...f, isFavorite: !f.isFavorite } : f
    );
    updateFormsState(updated);
  };

  const handleTrashForm = (formId: string) => {
    if (confirm('Move form to trash?')) {
      const updated = forms.map((f) => (f.id === formId ? { ...f, isTrashed: true } : f));
      updateFormsState(updated);
    }
  };

  const handleRestoreForm = (formId: string) => {
    const updated = forms.map((f) => (f.id === formId ? { ...f, isTrashed: false } : f));
    updateFormsState(updated);
  };

  const handlePermanentDeleteForm = (formId: string) => {
    if (confirm('Permanently delete this form? This cannot be undone.')) {
      updateFormsState(forms.filter((f) => f.id !== formId));
      clearFormResponses(formId);
      setResponses(getStoredResponses());
    }
  };

  const handleEmptyTrash = () => {
    if (confirm('Permanently delete all trashed forms? This cannot be undone.')) {
      const trashed = forms.filter((f) => f.isTrashed).map((f) => f.id);
      trashed.forEach((id) => clearFormResponses(id));
      updateFormsState(forms.filter((f) => !f.isTrashed));
      setResponses(getStoredResponses());
    }
  };

  const handleUpdateCurrentForm = (updatedForm: Form) => {
    const updatedForms = forms.map((f) => (f.id === updatedForm.id ? updatedForm : f));
    updateFormsState(updatedForms);
  };

  // ─── Bulk actions ─────────────────────────────────────────────────────────────

  const handleBulkDelete = () => {
    if (selectedFormIds.length === 0) return;
    if (confirm(`Move ${selectedFormIds.length} form(s) to trash?`)) {
      const updated = forms.map((f) =>
        selectedFormIds.includes(f.id) ? { ...f, isTrashed: true } : f
      );
      updateFormsState(updated);
      setSelectedFormIds([]);
    }
  };

  const handleBulkDuplicate = () => {
    if (selectedFormIds.length === 0) return;
    const duplicates: Form[] = selectedFormIds.flatMap((id) => {
      const target = forms.find((f) => f.id === id);
      if (!target) return [];
      return [
        {
          ...target,
          id: `form-copy-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          title: `${target.title} (Copy)`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isTrashed: false,
        },
      ];
    });
    updateFormsState([...duplicates, ...forms]);
    setSelectedFormIds([]);
  };

  // ─── Responses ───────────────────────────────────────────────────────────────

  const handleSubmitResponse = (response: FormResponse) => {
    addStoredResponse(response);
    markFormAsSubmitted(response.formId);
    setResponses(getStoredResponses());
  };

  const handleDeleteSingleResponse = (responseId: string) => {
    deleteStoredResponse(responseId);
    setResponses(getStoredResponses());
  };

  const handleClearResponses = (formId: string) => {
    if (confirm('Are you sure you want to clear all responses for this form?')) {
      clearFormResponses(formId);
      setResponses(getStoredResponses());
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col font-sans text-gray-900 dark:text-gray-100 antialiased selection:bg-purple-200 dark:selection:bg-purple-800">
      <Navbar
        viewMode={viewMode}
        setViewMode={setViewMode}
        currentForm={currentForm}
        onUpdateFormTitle={(title) =>
          currentForm && handleUpdateCurrentForm({ ...currentForm, title })
        }
        onOpenThemeCustomizer={() => setIsThemeOpen(true)}
        onOpenSendModal={() => setIsSendOpen(true)}
        onOpenAiGenerator={() => setIsAiModalOpen(true)}
        onOpenExcelModal={() => setIsExcelModalOpen(true)}
        responseCount={currentFormId ? responseCounts[currentFormId] || 0 : 0}
        newResponseCount={currentFormId ? newResponseCounts[currentFormId] || 0 : 0}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((d) => !d)}
        lastSavedAt={lastSavedAt}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      {/* VIEW ROUTING */}
      {viewMode.mode === 'MANAGEMENT' && (
        <FormManager
          forms={forms}
          responseCounts={responseCounts}
          newResponseCounts={newResponseCounts}
          sortMode={sortMode}
          onChangeSortMode={setSortMode}
          selectedFormIds={selectedFormIds}
          onChangeSelectedFormIds={setSelectedFormIds}
          onBulkDelete={handleBulkDelete}
          onBulkDuplicate={handleBulkDuplicate}
          onSelectForm={(formId, tab = 'questions') =>
            setViewMode({ mode: 'EDITOR', formId, activeTab: tab })
          }
          onCreateNewForm={handleCreateNewForm}
          onDuplicateForm={handleDuplicateForm}
          onToggleFavorite={handleToggleFavorite}
          onTrashForm={handleTrashForm}
          onOpenAiGenerator={() => setIsAiModalOpen(true)}
          onOpenExcelModal={() => setIsExcelModalOpen(true)}
          onOpenTrash={() => setViewMode({ mode: 'TRASH' })}
          searchQuery={searchQuery}
          darkMode={darkMode}
        />
      )}

      {viewMode.mode === 'TRASH' && (
        <FormManager
          forms={forms}
          responseCounts={responseCounts}
          newResponseCounts={newResponseCounts}
          sortMode={sortMode}
          onChangeSortMode={setSortMode}
          selectedFormIds={selectedFormIds}
          onChangeSelectedFormIds={setSelectedFormIds}
          onBulkDelete={handleBulkDelete}
          onBulkDuplicate={handleBulkDuplicate}
          onSelectForm={(formId, tab = 'questions') =>
            setViewMode({ mode: 'EDITOR', formId, activeTab: tab })
          }
          onCreateNewForm={handleCreateNewForm}
          onDuplicateForm={handleDuplicateForm}
          onToggleFavorite={handleToggleFavorite}
          onTrashForm={handleTrashForm}
          onRestoreForm={handleRestoreForm}
          onPermanentDeleteForm={handlePermanentDeleteForm}
          onEmptyTrash={handleEmptyTrash}
          onOpenAiGenerator={() => setIsAiModalOpen(true)}
          onOpenExcelModal={() => setIsExcelModalOpen(true)}
          onOpenTrash={() => setViewMode({ mode: 'TRASH' })}
          onExitTrash={() => setViewMode({ mode: 'MANAGEMENT' })}
          searchQuery={searchQuery}
          darkMode={darkMode}
          isTrashView
        />
      )}

      {viewMode.mode === 'EDITOR' && currentForm && (
        <>
          {viewMode.activeTab === 'questions' && (
            <FormEditor
              form={currentForm}
              onUpdateForm={handleUpdateCurrentForm}
              onOpenThemeCustomizer={() => setIsThemeOpen(true)}
              darkMode={darkMode}
            />
          )}

          {viewMode.activeTab === 'responses' && (
            <FormReport
              form={currentForm}
              responses={responses}
              onClearResponses={() => handleClearResponses(currentForm.id)}
              onDeleteSingleResponse={handleDeleteSingleResponse}
              onToggleAcceptingResponses={(accepting) =>
                handleUpdateCurrentForm({
                  ...currentForm,
                  settings: { ...currentForm.settings, acceptingResponses: accepting },
                })
              }
              darkMode={darkMode}
            />
          )}

          {viewMode.activeTab === 'settings' && (
            <FormSettingsView
              form={currentForm}
              onUpdateSettings={(patchSettings) =>
                handleUpdateCurrentForm({
                  ...currentForm,
                  settings: { ...currentForm.settings, ...patchSettings },
                })
              }
              darkMode={darkMode}
            />
          )}
        </>
      )}

      {viewMode.mode === 'RESPONDENT' && currentForm && (
        <FormRespondent
          form={currentForm}
          onSubmitResponse={handleSubmitResponse}
          onBackToEditor={() =>
            setViewMode({ mode: 'EDITOR', formId: currentForm.id, activeTab: 'questions' })
          }
          isPreview={viewMode.isPreview}
          existingResponsesCount={responseCounts[currentForm.id] || 0}
          darkMode={darkMode}
        />
      )}

      {/* DRAWERS & MODALS */}
      {currentForm && (
        <>
          <ThemeCustomizer
            isOpen={isThemeOpen}
            onClose={() => setIsThemeOpen(false)}
            theme={currentForm.theme}
            onUpdateTheme={(themePatch) =>
              handleUpdateCurrentForm({
                ...currentForm,
                theme: { ...currentForm.theme, ...themePatch },
              })
            }
            darkMode={darkMode}
          />

          <SendModal
            isOpen={isSendOpen}
            onClose={() => setIsSendOpen(false)}
            form={currentForm}
            onOpenRespondentView={() =>
              setViewMode({ mode: 'RESPONDENT', formId: currentForm.id })
            }
          />
        </>
      )}

      <AiFormGeneratorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onFormGenerated={(generatedForm) => {
          updateFormsState([generatedForm, ...forms]);
          setViewMode({ mode: 'EDITOR', formId: generatedForm.id, activeTab: 'questions' });
        }}
      />

      <ExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onFormGenerated={(generatedForm) => {
          updateFormsState([generatedForm, ...forms]);
          setViewMode({ mode: 'EDITOR', formId: generatedForm.id, activeTab: 'questions' });
        }}
      />
    </div>
  );
}
