import React, { useState, useEffect, useCallback } from 'react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Form, Question, QuestionType, Section, Option, QuestionValidation } from '../types';
import {
  Plus, Trash2, Copy, ChevronUp, ChevronDown, Image as ImageIcon,
  Type, AlignLeft, List, CheckSquare, ChevronDownSquare, Star,
  Calendar, Clock, Upload, SlidersHorizontal, Award, Layers,
  Sparkles, GripVertical, X, Grid, BarChart2, GitBranch,
  Sliders, CalendarDays, FileCheck,
} from 'lucide-react';

interface FormEditorProps {
  form: Form;
  onUpdateForm: (updatedForm: Form) => void;
  onOpenThemeCustomizer: () => void;
  darkMode?: boolean;
}

export const QUESTION_TYPES: { type: QuestionType; label: string; icon: React.ReactNode }[] = [
  { type: 'SHORT_ANSWER',        label: 'Short answer',            icon: <Type className="w-4 h-4 text-purple-600" /> },
  { type: 'PARAGRAPH',           label: 'Paragraph',               icon: <AlignLeft className="w-4 h-4 text-purple-600" /> },
  { type: 'MULTIPLE_CHOICE',     label: 'Multiple choice',         icon: <List className="w-4 h-4 text-purple-600" /> },
  { type: 'CHECKBOXES',          label: 'Checkboxes',              icon: <CheckSquare className="w-4 h-4 text-purple-600" /> },
  { type: 'DROPDOWN',            label: 'Dropdown',                icon: <ChevronDownSquare className="w-4 h-4 text-purple-600" /> },
  { type: 'LINEAR_SCALE',        label: 'Linear scale',            icon: <SlidersHorizontal className="w-4 h-4 text-purple-600" /> },
  { type: 'RATING',              label: 'Rating',                  icon: <Star className="w-4 h-4 text-amber-500" /> },
  { type: 'DATE',                label: 'Date',                    icon: <Calendar className="w-4 h-4 text-purple-600" /> },
  { type: 'TIME',                label: 'Time',                    icon: <Clock className="w-4 h-4 text-purple-600" /> },
  { type: 'DATE_TIME',           label: 'Date & Time',             icon: <CalendarDays className="w-4 h-4 text-purple-600" /> },
  { type: 'FILE_UPLOAD',         label: 'File upload',             icon: <Upload className="w-4 h-4 text-purple-600" /> },
  { type: 'NPS',                 label: 'Net Promoter Score (NPS)',icon: <BarChart2 className="w-4 h-4 text-indigo-600" /> },
  { type: 'MULTIPLE_CHOICE_GRID',label: 'Multiple choice grid',    icon: <Grid className="w-4 h-4 text-purple-600" /> },
  { type: 'CHECKBOX_GRID',       label: 'Checkbox grid',           icon: <Grid className="w-4 h-4 text-purple-600" /> },
];

// ─── Sortable question wrapper ────────────────────────────────────────────────
interface SortableQuestionProps {
  id: string;
  children: React.ReactNode;
}

const SortableQuestion: React.FC<SortableQuestionProps> = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {React.cloneElement(children as React.ReactElement, { dragHandleListeners: listeners })}
    </div>
  );
};

// ─── Main FormEditor component ────────────────────────────────────────────────
export const FormEditor: React.FC<FormEditorProps> = ({
  form, onUpdateForm, onOpenThemeCustomizer, darkMode = false,
}) => {
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(
    form.questions[0]?.id || null
  );
  const [showValidationFor, setShowValidationFor] = useState<string | null>(null);
  const [showImageFor, setShowImageFor] = useState<string | null>(null);

  const dm = darkMode;
  const primaryColor = form.theme.primaryColor || '#673ab7';
  const bgColor = form.theme.backgroundColor || '#f0ebf8';

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ─── Ctrl+Enter to add question ─────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        const sectionId = activeQuestionId
          ? form.questions.find((q) => q.id === activeQuestionId)?.sectionId || form.sections[0].id
          : form.sections[0].id;
        handleAddQuestion(sectionId, activeQuestionId || undefined);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  // ─── DnD reorder ────────────────────────────────────────────────────────────
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = form.questions.findIndex((q) => q.id === active.id);
    const newIdx = form.questions.findIndex((q) => q.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    onUpdateForm({
      ...form,
      questions: arrayMove(form.questions, oldIdx, newIdx),
      updatedAt: new Date().toISOString(),
    });
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const updateTitle = (title: string) =>
    onUpdateForm({ ...form, title, updatedAt: new Date().toISOString() });
  const updateDescription = (description: string) =>
    onUpdateForm({ ...form, description, updatedAt: new Date().toISOString() });

  const handleAddQuestion = (sectionId: string, afterQuestionId?: string) => {
    const newQuestion: Question = {
      id: `q-${Date.now()}`,
      sectionId,
      type: 'MULTIPLE_CHOICE',
      title: 'Untitled Question',
      required: false,
      options: [
        { id: `opt-${Date.now()}-1`, text: 'Option 1' },
        { id: `opt-${Date.now()}-2`, text: 'Option 2' },
      ],
      points: form.settings.isQuiz ? 10 : 0,
    };
    let updated = [...form.questions];
    if (afterQuestionId) {
      const idx = updated.findIndex((q) => q.id === afterQuestionId);
      updated.splice(idx + 1, 0, newQuestion);
    } else {
      updated.push(newQuestion);
    }
    onUpdateForm({ ...form, questions: updated, updatedAt: new Date().toISOString() });
    setActiveQuestionId(newQuestion.id);
  };

  const handleDuplicateQuestion = (qId: string) => {
    const idx = form.questions.findIndex((q) => q.id === qId);
    if (idx === -1) return;
    const target = form.questions[idx];
    const dup: Question = {
      ...target,
      id: `q-dup-${Date.now()}`,
      title: `${target.title} (Copy)`,
      options: target.options?.map((o, i) => ({ ...o, id: `opt-dup-${Date.now()}-${i}` })),
    };
    const updated = [...form.questions];
    updated.splice(idx + 1, 0, dup);
    onUpdateForm({ ...form, questions: updated, updatedAt: new Date().toISOString() });
    setActiveQuestionId(dup.id);
  };

  const handleDeleteQuestion = (qId: string) =>
    onUpdateForm({ ...form, questions: form.questions.filter((q) => q.id !== qId), updatedAt: new Date().toISOString() });

  const handleUpdateQuestion = (qId: string, patch: Partial<Question>) => {
    const updated = form.questions.map((q) => {
      if (q.id !== qId) return q;
      const next = { ...q, ...patch };
      if (patch.type === 'MULTIPLE_CHOICE_GRID' || patch.type === 'CHECKBOX_GRID') {
        if (!next.gridRows?.length) next.gridRows = ['Row 1', 'Row 2'];
        if (!next.gridColumns?.length) next.gridColumns = ['Column 1', 'Column 2', 'Column 3'];
      } else if (patch.type === 'NPS') {
        next.scaleMin = 0; next.scaleMax = 10;
        next.scaleMinLabel = 'Not at all likely'; next.scaleMaxLabel = 'Extremely likely';
      }
      return next;
    });
    onUpdateForm({ ...form, questions: updated, updatedAt: new Date().toISOString() });
  };

  const handleAddOption = (qId: string) => {
    const q = form.questions.find((i) => i.id === qId);
    if (!q) return;
    const opts = q.options || [];
    handleUpdateQuestion(qId, {
      options: [...opts, { id: `opt-${Date.now()}-${opts.length + 1}`, text: `Option ${opts.length + 1}` }],
    });
  };

  const handleAddSection = () => {
    const newSection: Section = {
      id: `sec-${Date.now()}`,
      title: `Section ${form.sections.length + 1}`,
      description: '',
      nextSectionAction: 'NEXT',
    };
    onUpdateForm({ ...form, sections: [...form.sections, newSection], updatedAt: new Date().toISOString() });
    handleAddQuestion(newSection.id);
  };

  const handleUpdateSection = (sectionId: string, patch: Partial<Section>) => {
    onUpdateForm({
      ...form,
      sections: form.sections.map((s) => (s.id === sectionId ? { ...s, ...patch } : s)),
      updatedAt: new Date().toISOString(),
    });
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen py-8 px-4 transition-colors`} style={{ backgroundColor: dm ? undefined : bgColor }}
      data-dm={dm ? 'true' : undefined}
    >
      <div className={`${dm ? 'bg-gray-900' : ''} min-h-screen`}>
      <div className="max-w-3xl mx-auto space-y-6 relative">
        {/* Floating Side Toolbar */}
        <aside className="fixed bottom-6 right-6 md:absolute md:top-2 md:-right-16 md:bottom-auto z-20 flex md:flex-col items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full md:rounded-xl shadow-lg p-1.5 space-x-1 md:space-x-0 md:space-y-2">
          <button onClick={() => handleAddQuestion(form.sections[0].id, activeQuestionId || undefined)}
            className="p-2.5 rounded-full hover:bg-purple-50 dark:hover:bg-purple-900/30 text-gray-700 dark:text-gray-300 hover:text-purple-700 transition-colors cursor-pointer" title="Add question (Ctrl+Enter)">
            <Plus className="w-5 h-5" />
          </button>
          <button onClick={handleAddSection}
            className="p-2.5 rounded-full hover:bg-purple-50 dark:hover:bg-purple-900/30 text-gray-700 dark:text-gray-300 hover:text-purple-700 transition-colors cursor-pointer" title="Add section break">
            <Layers className="w-5 h-5" />
          </button>
          <button onClick={onOpenThemeCustomizer}
            className="p-2.5 rounded-full hover:bg-purple-50 dark:hover:bg-purple-900/30 text-gray-700 dark:text-gray-300 hover:text-purple-700 transition-colors cursor-pointer" title="Customize theme">
            <Sparkles className="w-5 h-5 text-purple-600" />
          </button>
        </aside>

        {/* Header Card */}
        <div className={`rounded-2xl shadow-xs border overflow-hidden relative transition-all ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
          style={{ borderTop: `10px solid ${primaryColor}` }}>
          {form.theme.headerImage && (
            <div className="h-44 w-full overflow-hidden bg-gray-100 relative">
              <img src={form.theme.headerImage} alt="Header Banner" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="p-6 md:p-8 space-y-4">
            <input type="text" value={form.title} onChange={(e) => updateTitle(e.target.value)}
              className={`w-full text-2xl md:text-3xl font-bold border-b border-transparent focus:border-purple-500 focus:outline-hidden py-1 px-1 transition-colors bg-transparent ${dm ? 'text-gray-100 placeholder-gray-500' : 'text-gray-900'}`}
              placeholder="Form Title" />
            <textarea value={form.description} onChange={(e) => updateDescription(e.target.value)}
              rows={2}
              className={`w-full text-sm border-b border-transparent focus:border-purple-300 focus:outline-hidden py-1 px-1 resize-none transition-colors bg-transparent ${dm ? 'text-gray-300 placeholder-gray-500' : 'text-gray-600'}`}
              placeholder="Form description or instructions..." />
          </div>
        </div>

        {/* Questions by section */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={form.questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
            {form.sections.map((section, sIdx) => {
              const sectionQuestions = form.questions.filter((q) => q.sectionId === section.id);
              return (
                <div key={section.id} className="space-y-6">
                  {/* Section header */}
                  {form.sections.length > 1 && (
                    <div className={`p-4 rounded-xl shadow-xs space-y-2 ${dm ? 'bg-purple-900' : 'bg-purple-800'} text-white`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 space-y-1">
                          <input value={section.title}
                            onChange={(e) => handleUpdateSection(section.id, { title: e.target.value })}
                            className="w-full font-semibold text-base bg-transparent border-b border-purple-500 focus:outline-none text-white placeholder-purple-300 pb-0.5"
                            placeholder="Section title" />
                          <input value={section.description || ''}
                            onChange={(e) => handleUpdateSection(section.id, { description: e.target.value })}
                            className="w-full text-xs bg-transparent border-b border-purple-600/50 focus:outline-none text-purple-200 placeholder-purple-400 pb-0.5"
                            placeholder="Section description (optional)" />
                        </div>
                        {sIdx > 0 && (
                          <button onClick={() => onUpdateForm({ ...form, sections: form.sections.filter((s) => s.id !== section.id), updatedAt: new Date().toISOString() })}
                            className="p-1 hover:bg-purple-900 dark:hover:bg-purple-950 rounded-md text-purple-200 ml-3">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Questions */}
                  {sectionQuestions.map((q, qIdx) => {
                    const isActive = activeQuestionId === q.id;
                    return (
                      <SortableQuestion key={q.id} id={q.id}>
                        <QuestionCard
                          q={q} qIdx={qIdx} form={form} isActive={isActive} dm={dm}
                          showValidationFor={showValidationFor} showImageFor={showImageFor}
                          onActivate={() => setActiveQuestionId(q.id)}
                          onUpdate={(patch) => handleUpdateQuestion(q.id, patch)}
                          onDuplicate={() => handleDuplicateQuestion(q.id)}
                          onDelete={() => handleDeleteQuestion(q.id)}
                          onAddOption={() => handleAddOption(q.id)}
                          onToggleValidation={() => setShowValidationFor(showValidationFor === q.id ? null : q.id)}
                          onToggleImage={() => setShowImageFor(showImageFor === q.id ? null : q.id)}
                          onAddQuestionAfter={() => handleAddQuestion(q.sectionId, q.id)}
                          dragHandleListeners={undefined}
                        />
                      </SortableQuestion>
                    );
                  })}

                  {/* End-of-section nav */}
                  {form.sections.length > 1 && (
                    <div className={`border rounded-xl p-3 flex items-center justify-between text-xs ${dm ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-purple-50 border-purple-200 text-purple-900'}`}>
                      <span className="font-semibold">After Section {sIdx + 1}:</span>
                      <select value={section.nextSectionAction || 'NEXT'}
                        onChange={(e) => handleUpdateSection(section.id, { nextSectionAction: e.target.value })}
                        className={`border rounded-lg p-2 font-medium focus:outline-hidden cursor-pointer ${dm ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-purple-300'}`}>
                        <option value="NEXT">Continue to next section</option>
                        <option value="SUBMIT">Submit form</option>
                        {form.sections.map((s, i) => (
                          <option key={s.id} value={s.id}>Go to Section {i + 1} ({s.title})</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              );
            })}
          </SortableContext>
        </DndContext>
      </div>
      </div>
    </div>
  );
};

// ─── QuestionCard ─────────────────────────────────────────────────────────────
interface QuestionCardProps {
  q: Question;
  qIdx: number;
  form: Form;
  isActive: boolean;
  dm: boolean;
  showValidationFor: string | null;
  showImageFor: string | null;
  onActivate: () => void;
  onUpdate: (patch: Partial<Question>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAddOption: () => void;
  onToggleValidation: () => void;
  onToggleImage: () => void;
  onAddQuestionAfter: () => void;
  dragHandleListeners: any;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  q, qIdx, form, isActive, dm, showValidationFor, showImageFor,
  onActivate, onUpdate, onDuplicate, onDelete, onAddOption,
  onToggleValidation, onToggleImage, onAddQuestionAfter, dragHandleListeners,
}) => {
  const base = dm
    ? `bg-gray-800 border-gray-700 ${isActive ? 'border-purple-500 ring-2 ring-purple-900 shadow-md' : 'hover:border-gray-600'}`
    : `bg-white border-gray-200 ${isActive ? 'border-purple-600 ring-2 ring-purple-100 shadow-md' : 'hover:border-gray-300'}`;

  return (
    <div onClick={onActivate} className={`rounded-2xl border transition-all p-6 shadow-xs relative ${base}`}>
      {/* Drag handle + question number */}
      <div className={`flex items-center justify-between mb-4 pb-2 border-b ${dm ? 'border-gray-700' : 'border-gray-100'}`}>
        <div className="flex items-center space-x-2">
          <span {...dragHandleListeners} className="cursor-grab active:cursor-grabbing touch-none p-1">
            <GripVertical className={`w-4 h-4 ${dm ? 'text-gray-500' : 'text-gray-300'}`} />
          </span>
          <span className={`text-xs font-semibold uppercase ${dm ? 'text-gray-500' : 'text-gray-400'}`}>Question {qIdx + 1}</span>
        </div>
        {/* Quick-add button */}
        <button onClick={(e) => { e.stopPropagation(); onAddQuestionAfter(); }}
          title="Add question below (Ctrl+Enter)"
          className={`p-1 rounded-full text-xs font-medium transition-colors ${dm ? 'text-gray-400 hover:bg-gray-700 hover:text-purple-400' : 'text-gray-400 hover:bg-purple-50 hover:text-purple-600'}`}>
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Title + type */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <input type="text" value={q.title} onChange={(e) => onUpdate({ title: e.target.value })}
          className={`flex-1 text-base font-semibold p-3 rounded-xl border transition-colors focus:outline-hidden focus:ring-2 focus:ring-purple-200 ${dm ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500' : 'bg-gray-50/50 hover:bg-gray-100 focus:bg-white border-gray-200 text-gray-800'}`}
          placeholder="Question title" />
        <div className="w-full md:w-60 shrink-0">
          <select value={q.type} onChange={(e) => onUpdate({ type: e.target.value as QuestionType })}
            className={`w-full border rounded-xl p-3 text-xs font-medium focus:ring-2 focus:ring-purple-200 focus:outline-hidden cursor-pointer ${dm ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
            {QUESTION_TYPES.map((qt) => <option key={qt.type} value={qt.type}>{qt.label}</option>)}
          </select>
        </div>
      </div>

      {/* Description */}
      <input type="text" value={q.description || ''} onChange={(e) => onUpdate({ description: e.target.value })}
        placeholder="Add description or guidance text (optional)"
        className={`w-full text-xs border-b border-transparent focus:border-gray-300 focus:outline-hidden pb-1 mb-4 bg-transparent ${dm ? 'text-gray-400 placeholder-gray-600' : 'text-gray-500'}`} />

      {/* Image attachment */}
      {showImageFor === q.id && (
        <div className={`mb-4 p-3 rounded-xl border space-y-2 ${dm ? 'bg-gray-700 border-gray-600' : 'bg-blue-50 border-blue-200'}`}>
          <label className={`text-xs font-semibold flex items-center space-x-1.5 ${dm ? 'text-blue-300' : 'text-blue-800'}`}>
            <ImageIcon className="w-3.5 h-3.5" /><span>Question Image URL</span>
          </label>
          <div className="flex items-center space-x-2">
            <input type="text" value={q.imageUrl || ''} onChange={(e) => onUpdate({ imageUrl: e.target.value })}
              placeholder="https://images.unsplash.com/..."
              className={`flex-1 p-2 text-xs rounded-lg border focus:outline-none ${dm ? 'bg-gray-600 border-gray-500 text-gray-200' : 'bg-white border-blue-200 text-gray-800'}`} />
            {q.imageUrl && (
              <button onClick={() => onUpdate({ imageUrl: '' })} className="p-1 text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
            )}
          </div>
          {q.imageUrl && (
            <img src={q.imageUrl} alt="Question" className="max-h-40 rounded-lg object-cover w-full border" />
          )}
        </div>
      )}

      {/* Existing image preview (when panel closed) */}
      {q.imageUrl && showImageFor !== q.id && (
        <div className="mb-4">
          <img src={q.imageUrl} alt="Question" className="max-h-40 rounded-lg object-cover w-full border dark:border-gray-700" />
        </div>
      )}

      {/* Answer area */}
      <div className="mb-6 space-y-3">
        <QuestionAnswerArea q={q} form={form} dm={dm} onUpdate={onUpdate} onAddOption={onAddOption} />
      </div>

      {/* Validation panel */}
      {showValidationFor === q.id && ['SHORT_ANSWER', 'PARAGRAPH'].includes(q.type) && (
        <div className={`mb-4 p-3.5 rounded-xl border text-xs space-y-2 ${dm ? 'bg-amber-900/30 border-amber-700' : 'bg-amber-50/80 border-amber-200'}`}>
          <div className={`flex items-center justify-between font-bold ${dm ? 'text-amber-300' : 'text-amber-900'}`}>
            <span className="flex items-center space-x-1.5"><FileCheck className="w-4 h-4 text-amber-600" /><span>Response Validation Rules</span></span>
            <button onClick={() => {}}><X className="w-3.5 h-3.5" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <select value={q.validation?.rule || 'EMAIL'}
              onChange={(e) => onUpdate({ validation: { type: 'TEXT', rule: e.target.value as any, value: q.validation?.value, customErrorText: q.validation?.customErrorText } })}
              className={`border rounded-lg p-2 font-medium ${dm ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-amber-200'}`}>
              <option value="EMAIL">Must be valid Email address</option>
              <option value="URL">Must be valid URL (https://)</option>
              <option value="CONTAINS">Text contains substring</option>
              <option value="MIN_CHAR">Minimum character length</option>
              <option value="MAX_CHAR">Maximum character length</option>
            </select>
            {['CONTAINS', 'MIN_CHAR', 'MAX_CHAR'].includes(q.validation?.rule || '') && (
              <input type="text" placeholder="Rule value" value={q.validation?.value?.toString() || ''}
                onChange={(e) => onUpdate({ validation: { type: 'TEXT', rule: q.validation?.rule || 'EMAIL', value: e.target.value, customErrorText: q.validation?.customErrorText } })}
                className={`border rounded-lg p-2 ${dm ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-amber-200'}`} />
            )}
            <input type="text" placeholder="Custom error message" value={q.validation?.customErrorText || ''}
              onChange={(e) => onUpdate({ validation: { type: 'TEXT', rule: q.validation?.rule || 'EMAIL', value: q.validation?.value, customErrorText: e.target.value } })}
              className={`border rounded-lg p-2 ${dm ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-amber-200'}`} />
          </div>
        </div>
      )}

      {/* Quiz answer key */}
      {form.settings.isQuiz && (
        <div className={`mt-4 pt-3 border-t p-3 rounded-xl ${dm ? 'border-purple-800 bg-purple-900/30' : 'border-purple-100 bg-purple-50/60'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-bold flex items-center space-x-1.5 ${dm ? 'text-purple-300' : 'text-purple-900'}`}>
              <Award className="w-4 h-4 text-purple-600" /><span>Quiz Answer Key</span>
            </span>
            <div className="flex items-center space-x-2">
              <span className={`text-xs font-medium ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Points:</span>
              <input type="number" min={0} value={q.points || 0}
                onChange={(e) => onUpdate({ points: parseInt(e.target.value) || 0 })}
                className={`w-16 p-1 border rounded-md text-xs font-bold text-center ${dm ? 'bg-gray-700 border-purple-600 text-gray-200' : 'bg-white border-purple-300'}`} />
            </div>
          </div>
          {['MULTIPLE_CHOICE', 'DROPDOWN'].includes(q.type) && (
            <div className="text-xs">
              <span className={`font-semibold block mb-1 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Select Correct Option:</span>
              <select value={(q.correctAnswer as string) || ''} onChange={(e) => onUpdate({ correctAnswer: e.target.value })}
                className={`w-full border rounded-lg p-2 text-xs ${dm ? 'bg-gray-700 border-purple-600 text-gray-200' : 'bg-white border-purple-200'}`}>
                <option value="">-- Choose correct answer --</option>
                {(q.options || []).map((opt) => <option key={opt.id} value={opt.id}>{opt.text}</option>)}
              </select>
            </div>
          )}
          {q.type === 'SHORT_ANSWER' && (
            <div>
              <span className={`text-xs font-semibold block mb-1 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Exact Answer String:</span>
              <input type="text" value={(q.correctAnswer as string) || ''} onChange={(e) => onUpdate({ correctAnswer: e.target.value })}
                placeholder="e.g., Paris"
                className={`w-full border rounded-lg p-2 text-xs ${dm ? 'bg-gray-700 border-purple-600 text-gray-200' : 'bg-white border-purple-200'}`} />
            </div>
          )}
          {/* Explanation / feedback field */}
          <div className="mt-2">
            <span className={`text-xs font-semibold block mb-1 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Answer Explanation (shown after submit):</span>
            <input type="text" value={q.explanation || ''} onChange={(e) => onUpdate({ explanation: e.target.value })}
              placeholder="e.g., The capital of France is Paris."
              className={`w-full border rounded-lg p-2 text-xs ${dm ? 'bg-gray-700 border-purple-600 text-gray-200' : 'bg-white border-purple-200'}`} />
          </div>
        </div>
      )}

      {/* Footer controls */}
      <div className={`flex flex-wrap items-center justify-between pt-4 border-t gap-2 ${dm ? 'border-gray-700' : 'border-gray-100'}`}>
        <div className="flex items-center space-x-2">
          <button onClick={onDuplicate} className={`p-1.5 rounded-md transition-colors cursor-pointer ${dm ? 'text-gray-400 hover:text-purple-400 hover:bg-gray-700' : 'text-gray-500 hover:text-purple-700 hover:bg-gray-100'}`} title="Duplicate Question"><Copy className="w-4 h-4" /></button>
          <button onClick={onDelete} className={`p-1.5 rounded-md transition-colors cursor-pointer ${dm ? 'text-gray-500 hover:text-red-400 hover:bg-gray-700' : 'text-gray-400 hover:text-red-600 hover:bg-gray-100'}`} title="Delete Question"><Trash2 className="w-4 h-4" /></button>
          <button onClick={onToggleImage}
            className={`px-2 py-1 text-xs font-medium rounded-lg flex items-center space-x-1 cursor-pointer ${q.imageUrl ? (dm ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-800') : (dm ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100')}`}
            title="Attach image to question">
            <ImageIcon className="w-3.5 h-3.5" /><span>Image</span>
          </button>
          {['SHORT_ANSWER', 'PARAGRAPH'].includes(q.type) && (
            <button onClick={onToggleValidation}
              className={`px-2 py-1 text-xs font-medium rounded-lg flex items-center space-x-1 cursor-pointer ${q.validation ? (dm ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-100 text-amber-800') : (dm ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100')}`}
              title="Set response validation rules">
              <FileCheck className="w-3.5 h-3.5" /><span>Validation</span>
            </button>
          )}
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" checked={q.required} onChange={(e) => onUpdate({ required: e.target.checked })} className="sr-only peer" />
          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
          <span className={`ml-2 text-xs font-medium ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Required</span>
        </label>
      </div>
    </div>
  );
};

// ─── QuestionAnswerArea ───────────────────────────────────────────────────────
interface QAAProps {
  q: Question;
  form: Form;
  dm: boolean;
  onUpdate: (patch: Partial<Question>) => void;
  onAddOption: () => void;
}

const QuestionAnswerArea: React.FC<QAAProps> = ({ q, form, dm, onUpdate, onAddOption }) => {
  const inputBase = `p-2 border rounded-lg text-xs ${dm ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500' : 'bg-white border-gray-200'}`;

  if (['MULTIPLE_CHOICE', 'CHECKBOXES', 'DROPDOWN'].includes(q.type)) {
    return (
      <div className="space-y-2.5">
        {(q.options || []).map((opt, oIdx) => (
          <div key={opt.id} className="flex items-center space-x-3">
            {q.type === 'MULTIPLE_CHOICE' && <div className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0" />}
            {q.type === 'CHECKBOXES' && <div className="w-4 h-4 rounded-md border-2 border-gray-300 shrink-0" />}
            {q.type === 'DROPDOWN' && <span className={`text-xs font-semibold w-4 text-center shrink-0 ${dm ? 'text-gray-400' : 'text-gray-400'}`}>{oIdx + 1}.</span>}
            <input type="text" value={opt.text}
              onChange={(e) => onUpdate({ options: (q.options || []).map((o) => o.id === opt.id ? { ...o, text: e.target.value } : o) })}
              className={`flex-1 text-sm p-2 border-b focus:outline-hidden ${dm ? 'border-gray-600 bg-transparent text-gray-200 focus:border-purple-500' : 'border-gray-200 focus:border-purple-600'}`} />
            {/* Branching logic per option */}
            {q.enableLogicBranching && ['MULTIPLE_CHOICE', 'DROPDOWN'].includes(q.type) && (
              <div className={`flex items-center space-x-1.5 border rounded-lg p-1 text-xs ${dm ? 'bg-purple-900/30 border-purple-700' : 'bg-purple-50 border-purple-200'}`}>
                <GitBranch className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <select value={opt.goToSectionId || 'NEXT'}
                  onChange={(e) => onUpdate({ options: (q.options || []).map((o) => o.id === opt.id ? { ...o, goToSectionId: e.target.value } : o) })}
                  className={`bg-transparent font-medium text-[11px] focus:outline-hidden cursor-pointer ${dm ? 'text-purple-300' : 'text-purple-900'}`}>
                  <option value="NEXT">Continue to next section</option>
                  <option value="SUBMIT">Submit form</option>
                  {form.sections.map((sec, i) => <option key={sec.id} value={sec.id}>Go to Section {i + 1} ({sec.title})</option>)}
                </select>
              </div>
            )}
            {(q.options || []).length > 1 && (
              <button onClick={() => onUpdate({ options: (q.options || []).filter((o) => o.id !== opt.id) })}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
            )}
          </div>
        ))}

        {/* "Other" option */}
        {q.hasOtherOption && (
          <div className="flex items-center space-x-3">
            {q.type === 'MULTIPLE_CHOICE' && <div className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0" />}
            {q.type === 'CHECKBOXES' && <div className="w-4 h-4 rounded-md border-2 border-gray-300 shrink-0" />}
            <span className={`text-sm italic ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Other…</span>
            <button onClick={() => onUpdate({ hasOtherOption: false })} className="p-1 text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
          </div>
        )}

        <div className="flex items-center space-x-4 pt-2">
          <button onClick={onAddOption} className={`flex items-center space-x-2 text-xs font-semibold cursor-pointer ${dm ? 'text-purple-400 hover:text-purple-300' : 'text-purple-700 hover:text-purple-900'}`}>
            <Plus className="w-3.5 h-3.5" /><span>Add Option</span>
          </button>
          {['MULTIPLE_CHOICE', 'CHECKBOXES'].includes(q.type) && !q.hasOtherOption && (
            <button onClick={() => onUpdate({ hasOtherOption: true })}
              className={`text-xs font-semibold cursor-pointer ${dm ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-800'}`}>
              or add "Other"
            </button>
          )}
          {['MULTIPLE_CHOICE', 'DROPDOWN'].includes(q.type) && (
            <button onClick={() => onUpdate({ enableLogicBranching: !q.enableLogicBranching })}
              className={`flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${q.enableLogicBranching ? (dm ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-100 text-purple-800') : (dm ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100')}`}>
              <GitBranch className="w-3.5 h-3.5" /><span>Go to section based on answer</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  if (q.type === 'SHORT_ANSWER') return <div className={`p-3 border border-dashed rounded-xl text-xs ${dm ? 'bg-gray-700 border-gray-600 text-gray-500' : 'bg-gray-50 border-gray-300 text-gray-400'}`}>Short-answer text input preview</div>;
  if (q.type === 'PARAGRAPH') return <div className={`p-4 border border-dashed rounded-xl text-xs ${dm ? 'bg-gray-700 border-gray-600 text-gray-500' : 'bg-gray-50 border-gray-300 text-gray-400'}`}>Long-answer paragraph preview</div>;

  if (['DATE', 'TIME', 'DATE_TIME'].includes(q.type)) return (
    <div className={`p-3 border rounded-xl text-xs flex items-center space-x-2 ${dm ? 'bg-gray-700 border-gray-600 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
      <Calendar className="w-4 h-4 text-purple-600" />
      <span>{q.type === 'DATE' ? 'Date Picker' : q.type === 'TIME' ? 'Time Picker' : 'Date & Time Picker'}</span>
    </div>
  );

  if (q.type === 'RATING') return (
    <div className="flex items-center space-x-2 p-2">
      {[1,2,3,4,5].map((s) => <Star key={s} className="w-6 h-6 text-amber-400 fill-amber-100" />)}
    </div>
  );

  if (q.type === 'NPS') return (
    <div className={`space-y-3 p-4 rounded-xl border ${dm ? 'bg-indigo-900/20 border-indigo-800' : 'bg-indigo-50/50 border-indigo-100'}`}>
      <span className={`text-xs font-bold block ${dm ? 'text-indigo-300' : 'text-indigo-900'}`}>Net Promoter Score (0 - 10)</span>
      <div className="flex items-center space-x-1 overflow-x-auto pb-1">
        {Array.from({length:11},(_,i)=>i).map((n) => (
          <div key={n} className={`w-8 h-8 rounded-lg border flex items-center justify-center text-xs font-bold ${dm ? 'bg-gray-700 border-indigo-700 text-indigo-300' : 'bg-white border-indigo-200 text-indigo-800'}`}>{n}</div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <input type="text" value={q.scaleMinLabel || 'Not at all likely'} onChange={(e) => onUpdate({ scaleMinLabel: e.target.value })} className={inputBase} placeholder="Min Label (0)" />
        <input type="text" value={q.scaleMaxLabel || 'Extremely likely'} onChange={(e) => onUpdate({ scaleMaxLabel: e.target.value })} className={inputBase} placeholder="Max Label (10)" />
      </div>
    </div>
  );

  if (q.type === 'LINEAR_SCALE') return (
    <div className={`space-y-3 p-4 rounded-xl border text-xs ${dm ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
      <div className="flex items-center space-x-4">
        <span className={dm ? 'text-gray-300' : ''}>Scale from: <strong>{q.scaleMin || 1}</strong> to</span>
        <select value={q.scaleMax || 5} onChange={(e) => onUpdate({ scaleMax: parseInt(e.target.value) })}
          className={`border rounded-md px-2 py-1 ${dm ? 'bg-gray-600 border-gray-500 text-gray-200' : 'bg-white border-gray-200'}`}>
          {[3,4,5,6,7,8,9,10].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input type="text" value={q.scaleMinLabel || ''} onChange={(e) => onUpdate({ scaleMinLabel: e.target.value })} placeholder="Label for lowest (e.g. Poor)" className={inputBase} />
        <input type="text" value={q.scaleMaxLabel || ''} onChange={(e) => onUpdate({ scaleMaxLabel: e.target.value })} placeholder="Label for highest (e.g. Excellent)" className={inputBase} />
      </div>
    </div>
  );

  if (['MULTIPLE_CHOICE_GRID', 'CHECKBOX_GRID'].includes(q.type)) return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl border text-xs ${dm ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
      <div className="space-y-2">
        <span className={`font-bold block uppercase tracking-wider ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Rows</span>
        {(q.gridRows || []).map((row, rIdx) => (
          <div key={rIdx} className="flex items-center space-x-2">
            <span className={`font-medium w-4 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>{rIdx+1}.</span>
            <input type="text" value={row} onChange={(e) => { const r=[...(q.gridRows||[])]; r[rIdx]=e.target.value; onUpdate({gridRows:r}); }} className={`flex-1 p-1.5 rounded-lg border ${dm ? 'bg-gray-600 border-gray-500 text-gray-200' : 'bg-white border-gray-200'}`} />
            {(q.gridRows||[]).length>1 && <button onClick={() => onUpdate({gridRows:(q.gridRows||[]).filter((_,i)=>i!==rIdx)})} className="p-1 text-gray-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>}
          </div>
        ))}
        <button onClick={() => onUpdate({gridRows:[...(q.gridRows||[]),`Row ${(q.gridRows||[]).length+1}`]})} className={`text-xs font-semibold pt-1 flex items-center space-x-1 cursor-pointer ${dm ? 'text-purple-400' : 'text-purple-700'}`}><Plus className="w-3.5 h-3.5" /><span>Add Row</span></button>
      </div>
      <div className="space-y-2">
        <span className={`font-bold block uppercase tracking-wider ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Columns</span>
        {(q.gridColumns || []).map((col, cIdx) => (
          <div key={cIdx} className="flex items-center space-x-2">
            <span className={`font-medium w-4 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>{cIdx+1}.</span>
            <input type="text" value={col} onChange={(e) => { const c=[...(q.gridColumns||[])]; c[cIdx]=e.target.value; onUpdate({gridColumns:c}); }} className={`flex-1 p-1.5 rounded-lg border ${dm ? 'bg-gray-600 border-gray-500 text-gray-200' : 'bg-white border-gray-200'}`} />
            {(q.gridColumns||[]).length>1 && <button onClick={() => onUpdate({gridColumns:(q.gridColumns||[]).filter((_,i)=>i!==cIdx)})} className="p-1 text-gray-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>}
          </div>
        ))}
        <button onClick={() => onUpdate({gridColumns:[...(q.gridColumns||[]),`Column ${(q.gridColumns||[]).length+1}`]})} className={`text-xs font-semibold pt-1 flex items-center space-x-1 cursor-pointer ${dm ? 'text-purple-400' : 'text-purple-700'}`}><Plus className="w-3.5 h-3.5" /><span>Add Column</span></button>
      </div>
    </div>
  );

  if (q.type === 'FILE_UPLOAD') return (
    <div className={`p-4 rounded-xl border space-y-3 text-xs ${dm ? 'bg-purple-900/20 border-purple-800' : 'bg-purple-50/60 border-purple-200'}`}>
      <div className={`flex items-center space-x-2 font-bold ${dm ? 'text-purple-300' : 'text-purple-900'}`}><Upload className="w-4 h-4 text-purple-600" /><span>File Upload Settings</span></div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={`block font-medium mb-1 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Max File Size</label>
          <select value={q.maxFileSizeMb||10} onChange={(e) => onUpdate({maxFileSizeMb:parseInt(e.target.value)})} className={`w-full border p-2 rounded-lg ${dm ? 'bg-gray-700 border-purple-700 text-gray-200' : 'bg-white border-purple-200'}`}>
            <option value={10}>10 MB</option><option value={50}>50 MB</option><option value={100}>100 MB</option><option value={1000}>1 GB</option>
          </select>
        </div>
        <div>
          <label className={`block font-medium mb-1 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Max Files</label>
          <select value={q.maxFilesCount||1} onChange={(e) => onUpdate({maxFilesCount:parseInt(e.target.value)})} className={`w-full border p-2 rounded-lg ${dm ? 'bg-gray-700 border-purple-700 text-gray-200' : 'bg-white border-purple-200'}`}>
            <option value={1}>1 File</option><option value={5}>5 Files</option><option value={10}>10 Files</option>
          </select>
        </div>
      </div>
    </div>
  );

  return null;
};
