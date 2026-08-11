import React from 'react';
import { ViewMode, Form } from '../types';
import {
  FileText,
  ArrowLeft,
  Palette,
  Eye,
  Send,
  Sparkles,
  Search,
  FileSpreadsheet,
  Moon,
  Sun,
  Undo2,
  Redo2,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

interface NavbarProps {
  viewMode: ViewMode;
  setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>;
  currentForm?: Form;
  onUpdateFormTitle?: (title: string) => void;
  onOpenThemeCustomizer?: () => void;
  onOpenSendModal?: () => void;
  onOpenAiGenerator?: () => void;
  onOpenExcelModal?: () => void;
  responseCount?: number;
  newResponseCount?: number;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  lastSavedAt?: Date | null;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  viewMode,
  setViewMode,
  currentForm,
  onUpdateFormTitle,
  onOpenThemeCustomizer,
  onOpenSendModal,
  onOpenAiGenerator,
  onOpenExcelModal,
  responseCount = 0,
  newResponseCount = 0,
  searchQuery = '',
  setSearchQuery,
  darkMode = false,
  onToggleDarkMode,
  lastSavedAt,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
}) => {
  const isDashboard = viewMode.mode === 'MANAGEMENT' || viewMode.mode === 'TRASH';
  const isEditor = viewMode.mode === 'EDITOR';
  const isRespondent = viewMode.mode === 'RESPONDENT';

  // Auto-save label
  const savedLabel = lastSavedAt
    ? `Saved ${lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : null;

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-xs">
      {/* Upper Navigation Row */}
      <div className="flex items-center justify-between px-4 py-2.5 gap-2">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {!isDashboard && (
            <button
              onClick={() => setViewMode({ mode: 'MANAGEMENT' })}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
              title="Back to Forms Home"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {isDashboard ? (
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 bg-purple-600 rounded-lg flex items-center justify-center text-white shadow-xs">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-xl font-medium text-gray-800 dark:text-gray-100 tracking-tight">
                {viewMode.mode === 'TRASH' ? 'Trash' : 'Forms'}
              </span>
            </div>
          ) : isEditor && currentForm ? (
            <div className="flex items-center space-x-3 flex-1 max-w-xl">
              <input
                type="text"
                value={currentForm.title}
                onChange={(e) => onUpdateFormTitle && onUpdateFormTitle(e.target.value)}
                className="text-lg font-medium text-gray-800 dark:text-gray-100 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-white dark:focus:bg-gray-700 focus:outline-hidden focus:ring-2 focus:ring-purple-500 rounded-md px-2 py-0.5 truncate w-full transition-colors"
                placeholder="Untitled Form"
              />
              {/* Auto-save indicator */}
              {savedLabel && (
                <span className="hidden md:flex items-center space-x-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium whitespace-nowrap shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{savedLabel}</span>
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-gray-800 dark:text-gray-100 truncate">
                {currentForm?.title || 'Form Respondent View'}
              </span>
            </div>
          )}
        </div>

        {/* Search Bar in Dashboard */}
        {isDashboard && setSearchQuery && (
          <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search forms..."
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border border-transparent rounded-full text-sm text-gray-800 dark:text-gray-100 placeholder-gray-500 focus:outline-hidden focus:bg-white dark:focus:bg-gray-600 focus:border-purple-300 focus:ring-2 focus:ring-purple-200 transition-all"
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center space-x-1.5">
          {/* Undo / Redo (editor only) */}
          {isEditor && (
            <>
              <button
                onClick={onUndo}
                disabled={!canUndo}
                title="Undo (Ctrl+Z)"
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-30 transition-colors"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                onClick={onRedo}
                disabled={!canRedo}
                title="Redo (Ctrl+Y)"
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-30 transition-colors"
              >
                <Redo2 className="w-4 h-4" />
              </button>
            </>
          )}

          {isDashboard && (
            <>
              {onOpenExcelModal && (
                <button
                  onClick={onOpenExcelModal}
                  className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-medium text-xs rounded-full border border-emerald-200 dark:border-emerald-700 transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Import Excel / CSV</span>
                </button>
              )}

              {onOpenAiGenerator && (
                <button
                  onClick={onOpenAiGenerator}
                  className="flex items-center space-x-2 px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium text-sm rounded-full shadow-xs hover:from-purple-700 hover:to-indigo-700 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                  <span className="hidden sm:inline">AI Form Generator</span>
                </button>
              )}
            </>
          )}

          {isEditor && currentForm && (
            <>
              <button
                onClick={onOpenThemeCustomizer}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                title="Customize Theme"
              >
                <Palette className="w-5 h-5" />
              </button>

              <button
                onClick={() =>
                  setViewMode({ mode: 'RESPONDENT', formId: currentForm.id, isPreview: true })
                }
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                title="Preview Form"
              >
                <Eye className="w-5 h-5" />
              </button>

              <button
                onClick={onOpenSendModal}
                className="flex items-center space-x-2 px-5 py-2 bg-purple-600 text-white font-medium text-sm rounded-md shadow-xs hover:bg-purple-700 transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </button>
            </>
          )}

          {isRespondent && (
            <button
              onClick={() => setViewMode({ mode: 'MANAGEMENT' })}
              className="text-sm font-medium text-purple-700 dark:text-purple-400 hover:text-purple-900 px-3 py-1.5 rounded-md hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors"
            >
              Back to Dashboard
            </button>
          )}

          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-yellow-400 transition-colors"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Form Editor Tab Switcher */}
      {isEditor && (
        <div className="flex justify-center border-t border-gray-100 dark:border-gray-700">
          <nav className="flex space-x-8 px-4">
            {(['questions', 'responses', 'settings'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() =>
                  setViewMode((prev) =>
                    prev.mode === 'EDITOR' ? { ...prev, activeTab: tab } : prev
                  )
                }
                className={`py-3 px-1 text-sm font-medium border-b-2 flex items-center space-x-2 transition-colors cursor-pointer ${
                  viewMode.mode === 'EDITOR' && viewMode.activeTab === tab
                    ? 'border-purple-600 text-purple-700 dark:text-purple-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <span className="capitalize">{tab}</span>
                {tab === 'responses' && (
                  <span className="relative">
                    <span className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300 rounded-full font-semibold">
                      {responseCount}
                    </span>
                    {newResponseCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                        {newResponseCount > 9 ? '9+' : newResponseCount}
                      </span>
                    )}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};
