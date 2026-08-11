import React, { useState } from 'react';
import { Sparkles, X, Loader2, Lightbulb } from 'lucide-react';
import { Form } from '../types';

interface AiFormGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFormGenerated: (newForm: Form) => void;
}

const SAMPLE_PROMPTS = [
  'Customer Satisfaction Survey for a Coffee Shop',
  'Python Programming Quiz with 5 questions & answers',
  'Employee Onboarding & Feedback Questionnaire',
  'Event RSVP & Workshop Preference Registration',
  'Hotel Stay & Room Service Feedback Form',
  'Student Course Evaluation Survey',
];

export const AiFormGeneratorModal: React.FC<AiFormGeneratorModalProps> = ({
  isOpen,
  onClose,
  onFormGenerated,
}) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (selectedPrompt?: string) => {
    const textPrompt = selectedPrompt || prompt;
    if (!textPrompt.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/generate-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textPrompt }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to generate form');
      }

      const data = await res.json();

      // Convert generated AI json into full Form object with IDs
      const formId = `form-ai-${Date.now()}`;
      const secId = `sec-ai-${Date.now()}`;

      const formattedForm: Form = {
        id: formId,
        title: data.title || 'AI Generated Form',
        description: data.description || 'Generated automatically using Google AI Studio Gemini API.',
        category: (data.category as any) || 'Custom',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        theme: {
          primaryColor: data.theme?.primaryColor || '#673ab7',
          backgroundColor: '#f0ebf8',
          fontStyle: 'Roboto',
        },
        settings: {
          isQuiz: !!data.isQuiz,
          releaseGradesImmediately: true,
          allowResponseEditing: true,
          limitOneResponse: false,
          showProgressBar: true,
          shuffleQuestionOrder: false,
          confirmationMessage: 'Your response has been recorded.',
          acceptingResponses: true,
          closedMessage: 'This form is closed.',
        },
        sections: [
          {
            id: secId,
            title: 'General Questions',
            description: '',
          },
        ],
        questions: (data.questions || []).map((q: any, idx: number) => ({
          id: `q-ai-${idx}-${Date.now()}`,
          sectionId: secId,
          type: q.type || 'MULTIPLE_CHOICE',
          title: q.title || `Question ${idx + 1}`,
          description: q.description || '',
          required: q.required ?? true,
          options: (q.options || ['Option 1', 'Option 2', 'Option 3']).map((optText: string, oIdx: number) => ({
            id: `opt-ai-${idx}-${oIdx}`,
            text: optText,
          })),
          scaleMin: q.scaleMin || 1,
          scaleMax: q.scaleMax || 5,
          scaleMinLabel: q.scaleMinLabel || 'Poor',
          scaleMaxLabel: q.scaleMaxLabel || 'Excellent',
          points: q.points || 10,
          correctAnswer: q.correctAnswer || '',
        })),
      };

      onFormGenerated(formattedForm);
      onClose();
      setPrompt('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while generating the form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative border border-purple-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">AI Form Generator</h3>
            <p className="text-xs text-gray-500">Powered by Gemini 3.6 Flash</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Describe the form or quiz you want to create, and AI will automatically build the questions, options, theme, and answers!
        </p>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., Create a 5-question customer satisfaction survey for a tech product with rating scale and feedback..."
          rows={3}
          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all mb-3 resize-none"
        />

        {error && (
          <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
            {error}
          </div>
        )}

        {/* Suggestion Chips */}
        <div className="mb-6">
          <div className="flex items-center space-x-1 text-xs font-semibold text-gray-500 mb-2">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>Try these prompts:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_PROMPTS.map((p, i) => (
              <button
                key={i}
                onClick={() => {
                  setPrompt(p);
                  handleGenerate(p);
                }}
                className="text-xs px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors border border-purple-200/60 cursor-pointer"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => handleGenerate()}
            disabled={loading || !prompt.trim()}
            className="flex items-center space-x-2 px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium text-sm rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-md cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating Form...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Form</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
