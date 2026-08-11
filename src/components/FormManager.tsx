import React, { useState } from 'react';
import { Form, SortMode } from '../types';
import {
  Plus, Sparkles, FileText, Star, Trash2, Copy, BarChart3,
  Grid, List, FolderKanban, Edit2, FileSpreadsheet,
  ArrowDownAZ, Clock, TrendingUp, CalendarDays, CheckSquare,
  Square, Trash, RotateCcw, AlertTriangle, ArrowLeft,
} from 'lucide-react';

interface FormManagerProps {
  forms: Form[];
  responseCounts: Record<string, number>;
  newResponseCounts: Record<string, number>;
  sortMode: SortMode;
  onChangeSortMode: (s: SortMode) => void;
  selectedFormIds: string[];
  onChangeSelectedFormIds: (ids: string[]) => void;
  onBulkDelete: () => void;
  onBulkDuplicate: () => void;
  onSelectForm: (formId: string, tab?: 'questions' | 'responses' | 'settings') => void;
  onCreateNewForm: (templateCategory?: string) => void;
  onDuplicateForm: (formId: string) => void;
  onToggleFavorite: (formId: string) => void;
  onTrashForm: (formId: string) => void;
  onRestoreForm?: (formId: string) => void;
  onPermanentDeleteForm?: (formId: string) => void;
  onEmptyTrash?: () => void;
  onOpenAiGenerator: () => void;
  onOpenExcelModal: () => void;
  onOpenTrash: () => void;
  onExitTrash?: () => void;
  searchQuery: string;
  darkMode?: boolean;
  isTrashView?: boolean;
}

const TEMPLATES = [
  { id: 'feedback', title: 'Customer Feedback', category: 'Customer Feedback', bg: 'bg-purple-50 dark:bg-purple-900/30', iconColor: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200 hover:border-purple-500 dark:border-purple-700' },
  { id: 'quiz', title: 'Blank Quiz', category: 'Quiz', bg: 'bg-blue-50 dark:bg-blue-900/30', iconColor: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 hover:border-blue-500 dark:border-blue-700' },
  { id: 'event', title: 'Event Registration', category: 'Event Registration', bg: 'bg-emerald-50 dark:bg-emerald-900/30', iconColor: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 hover:border-emerald-500 dark:border-emerald-700' },
  { id: 'contact', title: 'Contact Information', category: 'Work', bg: 'bg-amber-50 dark:bg-amber-900/30', iconColor: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 hover:border-amber-500 dark:border-amber-700' },
];

const SORT_OPTIONS: { value: SortMode; label: string; icon: React.ReactNode }[] = [
  { value: 'updatedAt', label: 'Last Modified', icon: <Clock className="w-3.5 h-3.5" /> },
  { value: 'createdAt', label: 'Date Created', icon: <CalendarDays className="w-3.5 h-3.5" /> },
  { value: 'title', label: 'Alphabetical', icon: <ArrowDownAZ className="w-3.5 h-3.5" /> },
  { value: 'responses', label: 'Most Responses', icon: <TrendingUp className="w-3.5 h-3.5" /> },
];

function sortForms(forms: Form[], mode: SortMode, responseCounts: Record<string, number>): Form[] {
  return [...forms].sort((a, b) => {
    if (mode === 'title') return a.title.localeCompare(b.title);
    if (mode === 'createdAt') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (mode === 'responses') return (responseCounts[b.id] || 0) - (responseCounts[a.id] || 0);
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export const FormManager: React.FC<FormManagerProps> = ({
  forms, responseCounts, newResponseCounts, sortMode, onChangeSortMode,
  selectedFormIds, onChangeSelectedFormIds, onBulkDelete, onBulkDuplicate,
  onSelectForm, onCreateNewForm, onDuplicateForm, onToggleFavorite, onTrashForm,
  onRestoreForm, onPermanentDeleteForm, onEmptyTrash,
  onOpenAiGenerator, onOpenExcelModal, onOpenTrash, onExitTrash,
  searchQuery, darkMode, isTrashView = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');

  const sourceForms = isTrashView
    ? forms.filter((f) => f.isTrashed)
    : forms.filter((f) => !f.isTrashed);

  const filteredForms = sortForms(
    sourceForms.filter((f) => {
      const matchesSearch =
        f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.description.toLowerCase().includes(searchQuery.toLowerCase());
      if (isTrashView) return matchesSearch;
      if (selectedCategory === 'All') return matchesSearch;
      if (selectedCategory === 'Favorites') return matchesSearch && f.isFavorite;
      return matchesSearch && f.category === selectedCategory;
    }),
    sortMode,
    responseCounts
  );

  const allVisibleSelected =
    filteredForms.length > 0 && filteredForms.every((f) => selectedFormIds.includes(f.id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      onChangeSelectedFormIds(selectedFormIds.filter((id) => !filteredForms.find((f) => f.id === id)));
    } else {
      const newIds = filteredForms.map((f) => f.id);
      onChangeSelectedFormIds([...new Set([...selectedFormIds, ...newIds])]);
    }
  };

  const toggleSelectForm = (formId: string) => {
    onChangeSelectedFormIds(
      selectedFormIds.includes(formId)
        ? selectedFormIds.filter((id) => id !== formId)
        : [...selectedFormIds, formId]
    );
  };

  const dm = darkMode;

  return (
    <div className={`min-h-[calc(100vh-60px)] pb-16 ${dm ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Template gallery — only shown in normal view */}
      {!isTrashView && (
        <section className={`border-b pt-6 pb-8 px-6 ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-sm font-semibold uppercase tracking-wider ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Start a new form</h2>
              <div className="flex items-center space-x-2">
                <button onClick={onOpenExcelModal} className={`flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors cursor-pointer border ${dm ? 'text-emerald-300 bg-emerald-900/30 border-emerald-700 hover:bg-emerald-900/50' : 'text-emerald-800 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'}`}>
                  <FileSpreadsheet className="w-3.5 h-3.5" /><span>Import Excel / CSV</span>
                </button>
                <button onClick={onOpenAiGenerator} className={`flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors cursor-pointer border ${dm ? 'text-purple-300 bg-purple-900/30 border-purple-700 hover:bg-purple-900/50' : 'text-purple-700 bg-purple-50 border-purple-200 hover:bg-purple-100'}`}>
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" /><span>Generate with AI</span>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-3.5">
              {/* Blank form */}
              <div onClick={() => onCreateNewForm()} className="group flex flex-col items-center cursor-pointer">
                <div className={`w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all shadow-2xs ${dm ? 'bg-gray-700 border-gray-600 group-hover:border-purple-500 group-hover:bg-gray-600' : 'bg-white border-purple-300 group-hover:border-purple-600 group-hover:bg-purple-50/50'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform ${dm ? 'bg-gray-600 text-purple-400' : 'bg-purple-100 text-purple-700'}`}>
                    <Plus className="w-6 h-6" />
                  </div>
                </div>
                <span className={`text-xs font-medium mt-2 text-center group-hover:text-purple-700 dark:group-hover:text-purple-400 ${dm ? 'text-gray-300' : 'text-gray-800'}`}>Blank Form</span>
              </div>
              {/* Excel import */}
              <div onClick={onOpenExcelModal} className="group flex flex-col items-center cursor-pointer">
                <div className="w-full h-32 bg-emerald-600 text-white rounded-xl flex flex-col items-center justify-center p-3 text-center shadow-xs group-hover:bg-emerald-700 transition-all">
                  <FileSpreadsheet className="w-7 h-7 text-emerald-200 mb-1.5" />
                  <span className="text-xs font-bold">Import Spreadsheet</span>
                  <span className="text-[10px] text-emerald-100 mt-0.5">Excel / CSV to Form</span>
                </div>
                <span className={`text-xs font-medium mt-2 text-center group-hover:text-emerald-700 ${dm ? 'text-gray-300' : 'text-gray-800'}`}>From Excel / CSV</span>
              </div>
              {/* AI generator */}
              <div onClick={onOpenAiGenerator} className="group flex flex-col items-center cursor-pointer">
                <div className="w-full h-32 bg-gradient-to-br from-purple-600 to-indigo-700 text-white rounded-xl flex flex-col items-center justify-center p-3 text-center shadow-xs group-hover:shadow-md transition-all">
                  <Sparkles className="w-7 h-7 text-amber-300 mb-1.5 animate-bounce" />
                  <span className="text-xs font-bold">AI Form Builder</span>
                  <span className="text-[10px] text-purple-200 mt-0.5">Instant Prompts</span>
                </div>
                <span className={`text-xs font-medium mt-2 text-center group-hover:text-purple-700 ${dm ? 'text-gray-300' : 'text-gray-800'}`}>AI Assistant</span>
              </div>
              {TEMPLATES.map((tmpl) => (
                <div key={tmpl.id} onClick={() => onCreateNewForm(tmpl.category)} className="group flex flex-col items-center cursor-pointer">
                  <div className={`w-full h-32 ${tmpl.bg} border ${tmpl.border} rounded-xl p-3 flex flex-col justify-between transition-all shadow-2xs group-hover:shadow-xs`}>
                    <div className="flex items-center justify-between">
                      <FileText className={`w-5 h-5 ${tmpl.iconColor}`} />
                      <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Template</span>
                    </div>
                    <div className="space-y-1">
                      <div className="h-2 w-3/4 bg-gray-200 dark:bg-gray-600 rounded-xs"></div>
                      <div className="h-1.5 w-1/2 bg-gray-200 dark:bg-gray-600 rounded-xs"></div>
                    </div>
                  </div>
                  <span className={`text-xs font-medium mt-2 text-center group-hover:text-purple-700 line-clamp-1 ${dm ? 'text-gray-300' : 'text-gray-800'}`}>{tmpl.title}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trash header */}
      {isTrashView && (
        <div className={`border-b px-6 py-4 ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                <Trash className="w-5 h-5" />
              </div>
              <div>
                <h2 className={`text-lg font-bold ${dm ? 'text-gray-100' : 'text-gray-900'}`}>Trash</h2>
                <p className={`text-xs ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{sourceForms.length} form{sourceForms.length !== 1 ? 's' : ''} in trash</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {onExitTrash && (
                <button onClick={onExitTrash}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${dm ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'}`}>
                  <ArrowLeft className="w-3.5 h-3.5" /><span>Back to Forms</span>
                </button>
              )}
              {sourceForms.length > 0 && onEmptyTrash && (
                <button onClick={onEmptyTrash}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer">
                  <AlertTriangle className="w-3.5 h-3.5" /><span>Empty Trash</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-6 pt-8">
        {/* Controls bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          {/* Category filters (non-trash only) */}
          {!isTrashView && (
            <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto pb-1">
              {['All', 'Favorites', 'Customer Feedback', 'Quiz', 'Event Registration', 'Work'].map((cat) => (
                <button key={cat} onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors cursor-pointer ${selectedCategory === cat ? 'bg-purple-600 text-white shadow-xs' : dm ? 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}>
                  {cat}
                </button>
              ))}
              <button onClick={onOpenTrash} className={`px-3.5 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors cursor-pointer flex items-center space-x-1 ${dm ? 'bg-gray-700 text-gray-400 border border-gray-600 hover:bg-gray-600' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100'}`}>
                <Trash className="w-3 h-3" /><span>Trash</span>
              </button>
            </div>
          )}

          <div className="flex items-center space-x-2 self-end sm:self-auto flex-wrap gap-2">
            {/* Sort dropdown */}
            <div className="relative">
              <select value={sortMode} onChange={(e) => onChangeSortMode(e.target.value as SortMode)}
                className={`text-xs font-medium pr-7 pl-3 py-1.5 rounded-lg border appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-300 ${dm ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-white border-gray-200 text-gray-700'}`}>
                {SORT_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>

            {/* Bulk actions */}
            {selectedFormIds.length > 0 && (
              <div className="flex items-center space-x-1.5">
                <span className={`text-xs font-semibold ${dm ? 'text-gray-300' : 'text-gray-600'}`}>{selectedFormIds.length} selected</span>
                <button onClick={onBulkDuplicate} className="flex items-center space-x-1 px-2.5 py-1.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-semibold rounded-lg hover:bg-purple-200 cursor-pointer">
                  <Copy className="w-3.5 h-3.5" /><span>Duplicate</span>
                </button>
                <button onClick={onBulkDelete} className="flex items-center space-x-1 px-2.5 py-1.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-xs font-semibold rounded-lg hover:bg-red-200 cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5" /><span>Delete</span>
                </button>
                <button onClick={() => onChangeSelectedFormIds([])} className={`text-xs font-medium px-2 py-1.5 rounded-lg ${dm ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}>Clear</button>
              </div>
            )}

            <span className={`text-xs font-medium ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{filteredForms.length} {filteredForms.length === 1 ? 'form' : 'forms'}</span>

            {/* Select all toggle */}
            {filteredForms.length > 0 && (
              <button onClick={toggleSelectAll} title="Select all" className={`p-1.5 rounded-md ${dm ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}>
                {allVisibleSelected ? <CheckSquare className="w-4 h-4 text-purple-600" /> : <Square className="w-4 h-4" />}
              </button>
            )}

            {/* Grid / List toggle */}
            <div className={`flex items-center border rounded-lg p-0.5 shadow-2xs ${dm ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
              <button onClick={() => setViewLayout('grid')} className={`p-1.5 rounded-md transition-colors ${viewLayout === 'grid' ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300' : dm ? 'text-gray-400' : 'text-gray-500 hover:text-gray-800'}`} title="Grid view"><Grid className="w-4 h-4" /></button>
              <button onClick={() => setViewLayout('list')} className={`p-1.5 rounded-md transition-colors ${viewLayout === 'list' ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300' : dm ? 'text-gray-400' : 'text-gray-500 hover:text-gray-800'}`} title="List view"><List className="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        {/* Empty state */}
        {filteredForms.length === 0 && (
          <div className={`rounded-2xl p-12 border text-center max-w-md mx-auto my-8 ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${dm ? 'bg-gray-700 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>
              {isTrashView ? <Trash className="w-6 h-6" /> : <FolderKanban className="w-6 h-6" />}
            </div>
            <h3 className={`text-base font-semibold mb-1 ${dm ? 'text-gray-200' : 'text-gray-800'}`}>{isTrashView ? 'Trash is empty' : 'No forms found'}</h3>
            <p className={`text-xs mb-4 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{isTrashView ? 'Deleted forms will appear here.' : 'Try searching for something else or create a new form.'}</p>
            {!isTrashView && (
              <button onClick={() => onCreateNewForm()} className="px-4 py-2 bg-purple-600 text-white font-medium text-xs rounded-lg hover:bg-purple-700 transition-colors">Create Blank Form</button>
            )}
          </div>
        )}

        {/* Grid view */}
        {viewLayout === 'grid' && filteredForms.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredForms.map((form) => {
              const count = responseCounts[form.id] || 0;
              const newCount = newResponseCounts[form.id] || 0;
              const isSelected = selectedFormIds.includes(form.id);
              return (
                <div key={form.id} className={`group rounded-xl border transition-all flex flex-col justify-between overflow-hidden relative ${isSelected ? 'ring-2 ring-purple-500' : ''} ${dm ? 'bg-gray-800 border-gray-700 hover:border-purple-500' : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-md'}`}>
                  {/* Color bar */}
                  <div className="h-2.5 w-full" style={{ backgroundColor: form.theme.primaryColor || '#673ab7' }} />
                  {/* Selection checkbox */}
                  <button onClick={() => toggleSelectForm(form.id)} className="absolute top-4 left-3 p-0.5 rounded z-10">
                    {isSelected ? <CheckSquare className="w-4 h-4 text-purple-600" /> : <Square className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${dm ? 'text-gray-400' : 'text-gray-400'}`} />}
                  </button>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2 pl-5">
                        <span onClick={() => !isTrashView && onSelectForm(form.id, 'questions')}
                          className={`font-semibold text-sm line-clamp-2 leading-snug ${isTrashView ? 'cursor-default' : 'cursor-pointer hover:text-purple-700 dark:hover:text-purple-400'} ${dm ? 'text-gray-100' : 'text-gray-900'}`}>
                          {form.title}
                        </span>
                        {!isTrashView && (
                          <button onClick={() => onToggleFavorite(form.id)} className="p-1 text-gray-300 hover:text-amber-400 transition-colors shrink-0">
                            <Star className={`w-4 h-4 ${form.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                          </button>
                        )}
                      </div>
                      <p className={`text-xs line-clamp-2 mb-4 leading-relaxed pl-5 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{form.description || 'No description provided.'}</p>
                    </div>
                    <div className={`flex items-center justify-between text-[11px] pt-3 border-t ${dm ? 'border-gray-700 text-gray-400' : 'border-gray-100 text-gray-500'}`}>
                      <div className="flex items-center space-x-1.5">
                        <FileText className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span>{form.questions.length} questions</span>
                      </div>
                      {!isTrashView && (
                        <button onClick={() => onSelectForm(form.id, 'responses')}
                          className="relative flex items-center space-x-1 px-2 py-0.5 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 text-purple-700 dark:text-purple-300 font-medium rounded-full transition-colors cursor-pointer">
                          <BarChart3 className="w-3 h-3" />
                          <span>{count} responses</span>
                          {newCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                              {newCount > 9 ? '9+' : newCount}
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className={`px-4 py-2.5 border-t flex items-center justify-between ${dm ? 'bg-gray-700/50 border-gray-700' : 'bg-gray-50/80 border-gray-100'}`}>
                    <span className={`text-[10px] ${dm ? 'text-gray-500' : 'text-gray-400'}`}>{new Date(form.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    <div className="flex items-center space-x-1">
                      {isTrashView ? (
                        <>
                          {onRestoreForm && <button onClick={() => onRestoreForm(form.id)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-md transition-colors" title="Restore"><RotateCcw className="w-3.5 h-3.5" /></button>}
                          {onPermanentDeleteForm && <button onClick={() => onPermanentDeleteForm(form.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors" title="Delete permanently"><Trash2 className="w-3.5 h-3.5" /></button>}
                        </>
                      ) : (
                        <>
                          <button onClick={() => onSelectForm(form.id, 'questions')} className={`p-1.5 rounded-md transition-colors ${dm ? 'text-gray-400 hover:text-purple-400 hover:bg-gray-700' : 'text-gray-600 hover:text-purple-700 hover:bg-white'}`} title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => onDuplicateForm(form.id)} className={`p-1.5 rounded-md transition-colors ${dm ? 'text-gray-400 hover:text-purple-400 hover:bg-gray-700' : 'text-gray-600 hover:text-purple-700 hover:bg-white'}`} title="Duplicate"><Copy className="w-3.5 h-3.5" /></button>
                          <button onClick={() => onTrashForm(form.id)} className={`p-1.5 rounded-md transition-colors ${dm ? 'text-gray-500 hover:text-red-400 hover:bg-gray-700' : 'text-gray-400 hover:text-red-600 hover:bg-white'}`} title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* List view */}
        {viewLayout === 'list' && filteredForms.length > 0 && (
          <div className={`rounded-xl border overflow-hidden shadow-2xs divide-y ${dm ? 'bg-gray-800 border-gray-700 divide-gray-700' : 'bg-white border-gray-200 divide-gray-100'}`}>
            {filteredForms.map((form) => {
              const count = responseCounts[form.id] || 0;
              const newCount = newResponseCounts[form.id] || 0;
              const isSelected = selectedFormIds.includes(form.id);
              return (
                <div key={form.id} className={`flex items-center justify-between px-5 py-3 transition-colors ${isSelected ? 'bg-purple-50 dark:bg-purple-900/20' : dm ? 'hover:bg-gray-700' : 'hover:bg-purple-50/40'}`}>
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <button onClick={() => toggleSelectForm(form.id)} className="shrink-0">
                      {isSelected ? <CheckSquare className="w-4 h-4 text-purple-600" /> : <Square className={`w-4 h-4 ${dm ? 'text-gray-500' : 'text-gray-400'}`} />}
                    </button>
                    <div className="w-3 h-10 rounded-full shrink-0" style={{ backgroundColor: form.theme.primaryColor || '#673ab7' }} />
                    <div className="min-w-0 flex-1">
                      <span onClick={() => !isTrashView && onSelectForm(form.id, 'questions')}
                        className={`font-medium text-sm truncate block ${isTrashView ? 'cursor-default' : 'cursor-pointer hover:text-purple-700 dark:hover:text-purple-400'} ${dm ? 'text-gray-100' : 'text-gray-900'}`}>
                        {form.title}
                      </span>
                      <span className={`text-xs truncate block ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{form.description || 'No description'}</span>
                    </div>
                  </div>
                  <div className={`flex items-center space-x-6 text-xs ${dm ? 'text-gray-400' : 'text-gray-500'}`}>
                    <span className="hidden md:inline">{form.questions.length} questions</span>
                    {!isTrashView && (
                      <button onClick={() => onSelectForm(form.id, 'responses')}
                        className="relative flex items-center space-x-1 px-2.5 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-semibold rounded-full hover:bg-purple-100 cursor-pointer">
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>{count} responses</span>
                        {newCount > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                            {newCount > 9 ? '9+' : newCount}
                          </span>
                        )}
                      </button>
                    )}
                    <div className="flex items-center space-x-1">
                      {isTrashView ? (
                        <>
                          {onRestoreForm && <button onClick={() => onRestoreForm(form.id)} className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-md text-emerald-600" title="Restore"><RotateCcw className="w-4 h-4" /></button>}
                          {onPermanentDeleteForm && <button onClick={() => onPermanentDeleteForm(form.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md text-red-500" title="Delete permanently"><Trash2 className="w-4 h-4" /></button>}
                        </>
                      ) : (
                        <>
                          <button onClick={() => onSelectForm(form.id, 'questions')} className={`p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md ${dm ? 'text-gray-400' : 'text-gray-600'}`} title="Edit"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => onDuplicateForm(form.id)} className={`p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md ${dm ? 'text-gray-400' : 'text-gray-600'}`} title="Duplicate"><Copy className="w-4 h-4" /></button>
                          <button onClick={() => onTrashForm(form.id)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-red-500" title="Delete"><Trash2 className="w-4 h-4" /></button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
