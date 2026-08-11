import React, { useState } from 'react';
import { Form, FormResponse, Question, QuestionAnswer } from '../types';
import {
  CheckCircle2, Star, Award, ArrowRight, ArrowLeft, Upload,
  AlertCircle, FileText, Lock, Clock, X, Check, XCircle,
} from 'lucide-react';
import { hasAlreadySubmitted } from '../utils/storage';

interface FormRespondentProps {
  form: Form;
  onSubmitResponse: (response: FormResponse) => void;
  onBackToEditor?: () => void;
  isPreview?: boolean;
  existingResponsesCount?: number;
  darkMode?: boolean;
}

export const FormRespondent: React.FC<FormRespondentProps> = ({
  form, onSubmitResponse, onBackToEditor, isPreview = false,
  existingResponsesCount = 0, darkMode = false,
}) => {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [otherText, setOtherText] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [submittedResponse, setSubmittedResponse] = useState<FormResponse | null>(null);
  const [passcodeEntered, setPasscodeEntered] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(!form.settings.passcodeProtected);
  const [passcodeError, setPasscodeError] = useState('');

  const dm = darkMode;
  const currentSection = form.sections[currentSectionIndex] || form.sections[0];
  const sectionQuestions = form.questions.filter((q) => q.sectionId === currentSection.id);
  const totalSections = form.sections.length;
  const primaryColor = form.theme.primaryColor || '#673ab7';
  const bgColor = form.theme.backgroundColor || '#f0ebf8';

  const now = new Date();
  const isBeforeOpen = form.settings.scheduleOpenDate && new Date(form.settings.scheduleOpenDate) > now;
  const isPastClose = form.settings.scheduleCloseDate && new Date(form.settings.scheduleCloseDate) < now;
  const isMaxSubmissionsReached =
    form.settings.maxSubmissions !== undefined &&
    form.settings.maxSubmissions > 0 &&
    existingResponsesCount >= form.settings.maxSubmissions;
  const alreadySubmittedThisDevice = !isPreview && form.settings.limitOneResponse && hasAlreadySubmitted(form.id);

  // ─── Passcode unlock ────────────────────────────────────────────────────────
  const handleUnlockPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcodeEntered.trim() === (form.settings.passcode || '').trim()) {
      setIsUnlocked(true);
      setPasscodeError('');
    } else {
      setPasscodeError('Invalid passcode. Please try again.');
    }
  };

  // ─── Answer change ──────────────────────────────────────────────────────────
  const handleAnswerChange = (questionId: string, val: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: val }));
    setValidationErrors((prev) => { const c = { ...prev }; delete c[questionId]; return c; });
  };

  // ─── Validation ─────────────────────────────────────────────────────────────
  const validateCurrentSection = () => {
    const errors: Record<string, string> = {};
    for (const q of sectionQuestions) {
      const val = answers[q.id];
      if (q.required) {
        if (val === undefined || val === null || val === '' ||
          (Array.isArray(val) && val.length === 0) ||
          (typeof val === 'object' && !Array.isArray(val) && Object.keys(val).length === 0)) {
          errors[q.id] = 'This question is required';
          continue;
        }
      }
      if (val && q.validation && ['SHORT_ANSWER', 'PARAGRAPH'].includes(q.type)) {
        const rule = q.validation.rule;
        const ruleVal = q.validation.value;
        const strVal = String(val).trim();
        if (rule === 'EMAIL' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strVal))
          errors[q.id] = q.validation.customErrorText || 'Must be a valid email address';
        else if (rule === 'URL' && !/^https?:\/\/.+/.test(strVal))
          errors[q.id] = q.validation.customErrorText || 'Must be a valid URL starting with http:// or https://';
        else if (rule === 'CONTAINS' && ruleVal && !strVal.includes(String(ruleVal)))
          errors[q.id] = q.validation.customErrorText || `Must contain "${ruleVal}"`;
        else if (rule === 'MIN_CHAR' && ruleVal && strVal.length < Number(ruleVal))
          errors[q.id] = q.validation.customErrorText || `Minimum ${ruleVal} characters required`;
        else if (rule === 'MAX_CHAR' && ruleVal && strVal.length > Number(ruleVal))
          errors[q.id] = q.validation.customErrorText || `Maximum ${ruleVal} characters allowed`;
      }
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ─── Section branching ──────────────────────────────────────────────────────
  const getNextTargetSectionIndex = (): number | 'SUBMIT' => {
    for (const q of sectionQuestions) {
      if (q.enableLogicBranching && ['MULTIPLE_CHOICE', 'DROPDOWN'].includes(q.type) && answers[q.id]) {
        const selectedOpt = q.options?.find((o) => o.id === answers[q.id]);
        if (selectedOpt?.goToSectionId) {
          if (selectedOpt.goToSectionId === 'SUBMIT') return 'SUBMIT';
          if (selectedOpt.goToSectionId !== 'NEXT') {
            const idx = form.sections.findIndex((s) => s.id === selectedOpt.goToSectionId);
            if (idx !== -1) return idx;
          }
        }
      }
    }
    if (currentSection.nextSectionAction === 'SUBMIT') return 'SUBMIT';
    if (currentSection.nextSectionAction && currentSection.nextSectionAction !== 'NEXT') {
      const idx = form.sections.findIndex((s) => s.id === currentSection.nextSectionAction);
      if (idx !== -1) return idx;
    }
    return currentSectionIndex + 1;
  };

  const handleNextSection = () => {
    if (!validateCurrentSection()) return;
    const next = getNextTargetSectionIndex();
    if (next === 'SUBMIT') { handleFinalSubmit(); return; }
    if (typeof next === 'number' && next < totalSections) {
      setCurrentSectionIndex(next);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex((p) => p - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ─── Quiz scoring ────────────────────────────────────────────────────────────
  const calculateQuizScore = () => {
    if (!form.settings.isQuiz) return undefined;
    let earned = 0, total = 0;
    for (const q of form.questions) {
      const pts = q.points || 0;
      total += pts;
      const ans = answers[q.id];
      if (ans !== undefined && q.correctAnswer) {
        if (Array.isArray(q.correctAnswer)) {
          if (Array.isArray(ans) && ans.length === q.correctAnswer.length &&
            ans.every((v) => (q.correctAnswer as string[]).includes(v))) earned += pts;
        } else if (String(ans).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase()) {
          earned += pts;
        }
      }
    }
    return { totalPoints: total, earnedPoints: earned };
  };

  const handleFinalSubmit = () => {
    const questionAnswers: QuestionAnswer[] = Object.entries(answers).map(([qId, val]) => ({
      questionId: qId,
      value: val as string | string[] | number,
    }));
    const quizResult = calculateQuizScore();
    const responseObj: FormResponse = {
      id: `resp-${Date.now()}`,
      formId: form.id,
      submittedAt: new Date().toISOString(),
      respondentEmail: 'anonymous@respondent.com',
      answers: questionAnswers,
      quizScore: quizResult,
    };
    setSubmittedResponse(responseObj);
    onSubmitResponse(responseObj);
    setSubmitted(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCurrentSection()) return;
    handleFinalSubmit();
  };

  const handleClearForm = () => {
    if (confirm('Clear all answers?')) {
      setAnswers({});
      setOtherText({});
      setValidationErrors({});
      setCurrentSectionIndex(0);
    }
  };

  const cardBase = `rounded-2xl shadow-xs border ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`;
  const containerBg = dm ? 'bg-gray-900' : undefined;

  // ─── PASSCODE LOCK ──────────────────────────────────────────────────────────
  if (!isUnlocked && form.settings.passcodeProtected) {
    return (
      <div className={`min-h-screen py-16 px-4 flex items-center justify-center ${dm ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`p-8 rounded-2xl shadow-md border text-center max-w-md w-full space-y-4 ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className={`text-xl font-bold ${dm ? 'text-gray-100' : 'text-gray-900'}`}>{form.title}</h2>
          <p className={`text-xs ${dm ? 'text-gray-400' : 'text-gray-500'}`}>This form is password protected.</p>
          <form onSubmit={handleUnlockPasscode} className="space-y-3 pt-2">
            <input type="password" placeholder="Enter access passcode" value={passcodeEntered}
              onChange={(e) => setPasscodeEntered(e.target.value)}
              className={`w-full p-3 border rounded-xl text-sm font-mono text-center focus:ring-2 focus:ring-purple-200 focus:outline-hidden ${dm ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-200'}`} />
            {passcodeError && <p className="text-xs text-red-500 font-medium flex items-center justify-center space-x-1"><AlertCircle className="w-3.5 h-3.5" /><span>{passcodeError}</span></p>}
            <button type="submit" className="w-full py-2.5 bg-purple-600 text-white font-medium text-xs rounded-xl hover:bg-purple-700 transition-colors cursor-pointer">Unlock Form</button>
          </form>
        </div>
      </div>
    );
  }

  // ─── ALREADY SUBMITTED (limitOneResponse) ───────────────────────────────────
  if (alreadySubmittedThisDevice) {
    return (
      <div className={`min-h-screen py-16 px-4 flex items-center justify-center ${dm ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`p-8 rounded-2xl shadow-md border text-center max-w-md w-full space-y-4 ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h2 className={`text-xl font-bold ${dm ? 'text-gray-100' : 'text-gray-900'}`}>{form.title}</h2>
          <p className={`text-sm ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
            You have already submitted a response to this form. Only one response per device is allowed.
          </p>
          {isPreview && onBackToEditor && (
            <button onClick={onBackToEditor} className="px-5 py-2.5 bg-purple-600 text-white font-medium text-xs rounded-xl cursor-pointer hover:bg-purple-700">Back to Form Editor</button>
          )}
        </div>
      </div>
    );
  }

  // ─── CLOSED / SCHEDULED ─────────────────────────────────────────────────────
  if (!form.settings.acceptingResponses || isBeforeOpen || isPastClose || isMaxSubmissionsReached) {
    let msg = form.settings.closedMessage || 'This form is no longer accepting responses.';
    if (isBeforeOpen) msg = `This form opens on ${new Date(form.settings.scheduleOpenDate!).toLocaleString()}.`;
    else if (isPastClose) msg = `This form closed on ${new Date(form.settings.scheduleCloseDate!).toLocaleString()}.`;
    else if (isMaxSubmissionsReached) msg = 'This form has reached its maximum submission limit.';
    return (
      <div className={`min-h-screen py-16 px-4 flex items-center justify-center ${dm ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`p-8 rounded-2xl shadow-md border text-center max-w-md w-full ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className={`text-xl font-bold mb-2 ${dm ? 'text-gray-100' : 'text-gray-900'}`}>{form.title}</h2>
          <p className={`text-sm mb-6 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>{msg}</p>
          {isPreview && onBackToEditor && (
            <button onClick={onBackToEditor} className="px-5 py-2.5 bg-purple-600 text-white font-medium text-xs rounded-xl cursor-pointer">Back to Form Editor</button>
          )}
        </div>
      </div>
    );
  }

  // ─── POST SUBMISSION ────────────────────────────────────────────────────────
  if (submitted && submittedResponse) {
    const isQuiz = form.settings.isQuiz;
    const score = submittedResponse.quizScore;
    return (
      <div className={`min-h-screen py-12 px-4 ${dm ? 'bg-gray-900' : ''}`} style={!dm ? { backgroundColor: bgColor } : undefined}>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className={`${cardBase} overflow-hidden`} style={{ borderTop: `10px solid ${primaryColor}` }}>
            <div className="p-8 space-y-4">
              <div className="flex items-center space-x-3 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
                <h2 className={`text-2xl font-bold ${dm ? 'text-gray-100' : 'text-gray-900'}`}>{form.title}</h2>
              </div>
              <p className={`text-sm leading-relaxed ${dm ? 'text-gray-300' : 'text-gray-700'}`}>{form.settings.confirmationMessage || 'Your response has been recorded.'}</p>

              {/* Quiz score card */}
              {isQuiz && score && (
                <div className={`p-5 border rounded-2xl mt-4 ${dm ? 'bg-purple-900/30 border-purple-700' : 'bg-purple-50 border-purple-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Award className="w-8 h-8 text-purple-600" />
                      <div>
                        <span className={`text-xs font-bold uppercase tracking-wider block ${dm ? 'text-purple-300' : 'text-purple-900'}`}>Quiz Results</span>
                        <span className={`text-2xl font-black ${dm ? 'text-purple-200' : 'text-purple-800'}`}>{score.earnedPoints} / {score.totalPoints} points</span>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${dm ? 'bg-purple-800 text-purple-200' : 'bg-purple-200 text-purple-900'}`}>
                      {Math.round((score.earnedPoints / Math.max(score.totalPoints, 1)) * 100)}%
                    </span>
                  </div>
                </div>
              )}

              {/* Per-question feedback for quiz */}
              {isQuiz && form.settings.releaseGradesImmediately && (
                <div className="space-y-3 pt-2">
                  <h3 className={`text-sm font-bold ${dm ? 'text-gray-200' : 'text-gray-800'}`}>Answer Feedback</h3>
                  {form.questions.map((q) => {
                    const userAns = submittedResponse.answers.find((a) => a.questionId === q.id)?.value;
                    const correctAns = q.correctAnswer;
                    if (!q.points) return null;

                    let isCorrect = false;
                    if (correctAns !== undefined && userAns !== undefined) {
                      if (Array.isArray(correctAns)) {
                        isCorrect = Array.isArray(userAns) && userAns.length === correctAns.length &&
                          userAns.every((v) => (correctAns as string[]).includes(v as string));
                      } else {
                        isCorrect = String(userAns).trim().toLowerCase() === String(correctAns).trim().toLowerCase();
                      }
                    }

                    // Resolve option text for display
                    const displayAns = (() => {
                      if (Array.isArray(userAns)) {
                        return userAns.map((v) => q.options?.find((o) => o.id === v)?.text || String(v)).join(', ');
                      }
                      return q.options?.find((o) => o.id === userAns)?.text || String(userAns ?? '—');
                    })();

                    return (
                      <div key={q.id} className={`p-3.5 rounded-xl border text-xs ${isCorrect ? (dm ? 'bg-emerald-900/20 border-emerald-700' : 'bg-emerald-50 border-emerald-200') : (dm ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200')}`}>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className={`font-semibold ${dm ? 'text-gray-200' : 'text-gray-800'}`}>{q.title}</span>
                          <div className="flex items-center space-x-1 shrink-0">
                            {isCorrect ? <Check className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-red-500" />}
                            <span className={`font-bold ${isCorrect ? 'text-emerald-600' : 'text-red-500'}`}>{isCorrect ? '+' : '0'}{q.points} pts</span>
                          </div>
                        </div>
                        <p className={`mb-0.5 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Your answer: <strong>{displayAns}</strong></p>
                        {!isCorrect && correctAns && (
                          <p className={`${dm ? 'text-emerald-400' : 'text-emerald-700'}`}>
                            Correct: <strong>{Array.isArray(correctAns) ? (correctAns as string[]).map((v) => q.options?.find((o) => o.id === v)?.text || v).join(', ') : q.options?.find((o) => o.id === correctAns)?.text || String(correctAns)}</strong>
                          </p>
                        )}
                        {q.explanation && <p className={`mt-1 italic ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{q.explanation}</p>}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="pt-4 flex flex-wrap gap-3">
                {!form.settings.limitOneResponse && (
                  <button onClick={() => { setSubmitted(false); setAnswers({}); setOtherText({}); setCurrentSectionIndex(0); }}
                    className={`text-xs font-semibold hover:underline cursor-pointer ${dm ? 'text-purple-400' : 'text-purple-700 hover:text-purple-900'}`}>
                    Submit another response
                  </button>
                )}
                {isPreview && onBackToEditor && (
                  <button onClick={onBackToEditor} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-semibold hover:bg-purple-700 transition-colors cursor-pointer">Return to Form Editor</button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── MAIN FORM ──────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen py-8 px-4 ${dm ? 'bg-gray-900' : ''}`} style={!dm ? { backgroundColor: bgColor } : undefined}>
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className={`${cardBase} overflow-hidden relative`} style={{ borderTop: `10px solid ${primaryColor}` }}>
          {form.theme.headerImage && (
            <div className="h-44 w-full overflow-hidden bg-gray-100"><img src={form.theme.headerImage} alt="Form Banner" className="w-full h-full object-cover" /></div>
          )}
          <div className="p-6 md:p-8 space-y-3">
            <h1 className={`text-2xl md:text-3xl font-bold ${dm ? 'text-gray-100' : 'text-gray-900'}`}>{form.title}</h1>
            <p className={`text-sm leading-relaxed ${dm ? 'text-gray-400' : 'text-gray-600'}`}>{form.description}</p>
            <div className={`pt-3 border-t flex items-center justify-between text-xs font-medium ${dm ? 'border-gray-700 text-red-400' : 'border-gray-100 text-red-500'}`}>
              <span>* Indicates required question</span>
              {totalSections > 1 && <span className={`font-semibold ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Page {currentSectionIndex + 1} of {totalSections}</span>}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {form.settings.showProgressBar && totalSections > 1 && (
          <div className={`rounded-xl p-3 border shadow-2xs ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className={`flex items-center justify-between text-xs mb-1 font-medium ${dm ? 'text-gray-400' : 'text-gray-500'}`}>
              <span>Progress</span>
              <span>{Math.round(((currentSectionIndex + 1) / totalSections) * 100)}% Complete</span>
            </div>
            <div className={`w-full h-2 rounded-full overflow-hidden ${dm ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <div className="h-full transition-all duration-300 rounded-full" style={{ width: `${((currentSectionIndex + 1) / totalSections) * 100}%`, backgroundColor: primaryColor }} />
            </div>
          </div>
        )}

        {/* Section title */}
        {totalSections > 1 && (
          <div className={`p-5 rounded-xl border shadow-2xs ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h2 className={`text-lg font-bold ${dm ? 'text-gray-100' : 'text-gray-800'}`}>{currentSection.title}</h2>
            {currentSection.description && <p className={`text-xs mt-1 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{currentSection.description}</p>}
          </div>
        )}

        {/* Questions */}
        <div className="space-y-5">
          {sectionQuestions.map((q) => {
            const hasError = !!validationErrors[q.id];
            const val = answers[q.id];
            return (
              <div key={q.id} className={`${cardBase} p-6 shadow-2xs transition-all ${hasError ? 'border-red-500 ring-2 ring-red-100' : ''}`}>
                <div className="mb-4">
                  {/* Image */}
                  {q.imageUrl && <img src={q.imageUrl} alt="" className="max-h-48 w-full object-cover rounded-xl mb-3 border dark:border-gray-700" />}
                  <div className="flex items-start justify-between">
                    <label className={`font-semibold text-base block ${dm ? 'text-gray-100' : 'text-gray-900'}`}>
                      {q.title}{q.required && <span className="text-red-500 font-bold ml-0.5">*</span>}
                    </label>
                    {form.settings.isQuiz && q.points && (
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0 ml-2 ${dm ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-50 text-purple-700'}`}>{q.points} pts</span>
                    )}
                  </div>
                  {q.description && <p className={`text-xs mt-1 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{q.description}</p>}
                </div>

                {/* Input widgets */}
                <QuestionInput q={q} val={val} otherText={otherText} dm={dm}
                  onAnswer={handleAnswerChange}
                  onOtherText={(qId, txt) => setOtherText((p) => ({ ...p, [qId]: txt }))} />

                {hasError && (
                  <p className="text-xs text-red-500 font-medium mt-3 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /><span>{validationErrors[q.id]}</span>
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 pb-12">
          <div className="flex items-center space-x-3">
            {currentSectionIndex > 0 && (
              <button type="button" onClick={handlePrevSection}
                className={`flex items-center space-x-2 px-5 py-2.5 border font-medium text-xs rounded-xl transition-colors cursor-pointer ${dm ? 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700' : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'}`}>
                <ArrowLeft className="w-4 h-4" /><span>Back</span>
              </button>
            )}
            {currentSectionIndex < totalSections - 1 ? (
              <button type="button" onClick={handleNextSection}
                className="flex items-center space-x-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs rounded-xl shadow-xs transition-colors cursor-pointer">
                <span>Next Section</span><ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button type="submit" className="px-7 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer">Submit Form</button>
            )}
          </div>
          <button type="button" onClick={handleClearForm}
            className={`text-xs font-medium cursor-pointer hover:underline ${dm ? 'text-purple-400 hover:text-purple-300' : 'text-purple-700 hover:text-purple-900'}`}>
            Clear form
          </button>
        </div>
      </form>
    </div>
  );
};

// ─── QuestionInput widget ─────────────────────────────────────────────────────
interface QInputProps {
  q: Question;
  val: any;
  otherText: Record<string, string>;
  dm: boolean;
  onAnswer: (qId: string, val: any) => void;
  onOtherText: (qId: string, txt: string) => void;
}

const QuestionInput: React.FC<QInputProps> = ({ q, val, otherText, dm, onAnswer, onOtherText }) => {
  const inputCls = `w-full md:w-3/4 p-3 border rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:outline-hidden transition-all ${dm ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500 focus:bg-gray-600' : 'bg-gray-50/50 border-gray-200 focus:bg-white'}`;

  if (q.type === 'SHORT_ANSWER') return <input type="text" value={val || ''} onChange={(e) => onAnswer(q.id, e.target.value)} placeholder="Your answer" className={inputCls} />;
  if (q.type === 'PARAGRAPH') return <textarea value={val || ''} onChange={(e) => onAnswer(q.id, e.target.value)} placeholder="Your answer" rows={3} className={`${inputCls} w-full resize-y`} />;
  if (q.type === 'DATE') return <input type="date" value={val || ''} onChange={(e) => onAnswer(q.id, e.target.value)} className={`${inputCls} w-full md:w-1/2`} />;
  if (q.type === 'TIME') return <input type="time" value={val || ''} onChange={(e) => onAnswer(q.id, e.target.value)} className={`${inputCls} w-full md:w-1/2`} />;
  if (q.type === 'DATE_TIME') return <input type="datetime-local" value={val || ''} onChange={(e) => onAnswer(q.id, e.target.value)} className={`${inputCls} w-full md:w-2/3`} />;

  if (q.type === 'RATING') return (
    <div className="flex items-center space-x-2 py-2">
      {[1,2,3,4,5].map((sv) => (
        <button type="button" key={sv} onClick={() => onAnswer(q.id, sv)} className="p-1 hover:scale-110 transition-transform cursor-pointer">
          <Star className={`w-8 h-8 ${(val||0) >= sv ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
        </button>
      ))}
    </div>
  );

  if (q.type === 'NPS') return (
    <div className="space-y-3 pt-1">
      <div className={`flex items-center justify-between text-xs font-semibold ${dm ? 'text-gray-400' : 'text-gray-500'}`}>
        <span>{q.scaleMinLabel || 'Not at all likely'}</span>
        <span>{q.scaleMaxLabel || 'Extremely likely'}</span>
      </div>
      <div className="flex items-center justify-between overflow-x-auto gap-1 pb-1">
        {Array.from({length:11},(_,i)=>i).map((score) => (
          <button type="button" key={score} onClick={() => onAnswer(q.id, score)}
            className={`w-10 h-11 rounded-xl font-bold text-sm border transition-all cursor-pointer shrink-0 ${val === score ? 'bg-purple-600 text-white border-purple-600 shadow-md scale-105' : dm ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}`}>
            {score}
          </button>
        ))}
      </div>
    </div>
  );

  if (q.type === 'LINEAR_SCALE') return (
    <div className="space-y-3 pt-2">
      <div className={`flex items-center justify-between text-xs px-1 font-medium ${dm ? 'text-gray-400' : 'text-gray-500'}`}>
        <span>{q.scaleMinLabel || String(q.scaleMin ?? 1)}</span>
        <span>{q.scaleMaxLabel || String(q.scaleMax ?? 5)}</span>
      </div>
      <div className="flex items-center justify-between overflow-x-auto pb-1">
        {Array.from({length:(q.scaleMax||5)-(q.scaleMin||1)+1},(_,i)=>(q.scaleMin||1)+i).map((num) => (
          <button type="button" key={num} onClick={() => onAnswer(q.id, num)}
            className={`w-10 h-10 rounded-xl font-bold text-sm border transition-all cursor-pointer ${val === num ? 'bg-purple-600 text-white border-purple-600 shadow-xs' : dm ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}`}>
            {num}
          </button>
        ))}
      </div>
    </div>
  );

  if (q.type === 'DROPDOWN') return (
    <select value={val || ''} onChange={(e) => onAnswer(q.id, e.target.value)}
      className={`w-full md:w-3/4 p-3 border rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:outline-hidden cursor-pointer ${dm ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-gray-50 border-gray-200 text-gray-800 focus:bg-white'}`}>
      <option value="">Choose an option</option>
      {(q.options || []).map((opt) => <option key={opt.id} value={opt.id}>{opt.text}</option>)}
    </select>
  );

  if (q.type === 'MULTIPLE_CHOICE') return (
    <div className="space-y-2.5">
      {(q.options || []).map((opt) => (
        <label key={opt.id} className={`flex items-center space-x-3 p-2.5 rounded-xl cursor-pointer transition-colors ${dm ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
          <input type="radio" name={`q-${q.id}`} checked={val === opt.id} onChange={() => onAnswer(q.id, opt.id)} className="w-4 h-4 text-purple-600 focus:ring-purple-500" />
          <span className={`text-sm ${dm ? 'text-gray-200' : 'text-gray-800'}`}>{opt.text}</span>
        </label>
      ))}
      {/* Other option */}
      {q.hasOtherOption && (
        <label className={`flex items-center space-x-3 p-2.5 rounded-xl cursor-pointer transition-colors ${dm ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
          <input type="radio" name={`q-${q.id}`} checked={val === '__other__'} onChange={() => onAnswer(q.id, '__other__')} className="w-4 h-4 text-purple-600 focus:ring-purple-500" />
          <span className={`text-sm italic ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Other</span>
          {val === '__other__' && (
            <input type="text" value={otherText[q.id] || ''} onChange={(e) => onOtherText(q.id, e.target.value)}
              placeholder="Please specify..." autoFocus
              className={`flex-1 text-sm p-1 border-b focus:outline-none ${dm ? 'bg-transparent border-gray-600 text-gray-200' : 'border-gray-300'}`} />
          )}
        </label>
      )}
    </div>
  );

  if (q.type === 'CHECKBOXES') {
    const currentArr: string[] = Array.isArray(val) ? val : [];
    return (
      <div className="space-y-2.5">
        {(q.options || []).map((opt) => (
          <label key={opt.id} className={`flex items-center space-x-3 p-2.5 rounded-xl cursor-pointer transition-colors ${dm ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
            <input type="checkbox" checked={currentArr.includes(opt.id)}
              onChange={(e) => onAnswer(q.id, e.target.checked ? [...currentArr, opt.id] : currentArr.filter((id) => id !== opt.id))}
              className="w-4 h-4 text-purple-600 rounded-xs focus:ring-purple-500" />
            <span className={`text-sm ${dm ? 'text-gray-200' : 'text-gray-800'}`}>{opt.text}</span>
          </label>
        ))}
        {/* Other option for checkboxes */}
        {q.hasOtherOption && (
          <label className={`flex items-center space-x-3 p-2.5 rounded-xl cursor-pointer transition-colors ${dm ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
            <input type="checkbox" checked={currentArr.includes('__other__')}
              onChange={(e) => onAnswer(q.id, e.target.checked ? [...currentArr, '__other__'] : currentArr.filter((id) => id !== '__other__'))}
              className="w-4 h-4 text-purple-600 rounded-xs focus:ring-purple-500" />
            <span className={`text-sm italic ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Other</span>
            {currentArr.includes('__other__') && (
              <input type="text" value={otherText[q.id] || ''} onChange={(e) => onOtherText(q.id, e.target.value)}
                placeholder="Please specify..." autoFocus
                className={`flex-1 text-sm p-1 border-b focus:outline-none ${dm ? 'bg-transparent border-gray-600 text-gray-200' : 'border-gray-300'}`} />
            )}
          </label>
        )}
      </div>
    );
  }

  if (q.type === 'FILE_UPLOAD') return (
    <div className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors ${dm ? 'border-gray-600 bg-gray-700/30 hover:border-purple-500' : 'border-gray-300 bg-gray-50/50 hover:border-purple-400'}`}>
      {val ? (
        <div className={`flex items-center justify-between p-3 rounded-xl border ${dm ? 'bg-gray-700 border-purple-700' : 'bg-white border-purple-200'}`}>
          <div className="flex items-center space-x-3 truncate">
            <FileText className="w-6 h-6 text-purple-600 shrink-0" />
            <div className="text-left truncate">
              <span className={`text-xs font-bold block truncate ${dm ? 'text-gray-200' : 'text-gray-800'}`}>{val.fileName || 'Attached Document'}</span>
              <span className={`text-[10px] ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{val.fileSize || '1.2 MB'}</span>
            </div>
          </div>
          <button type="button" onClick={() => onAnswer(q.id, null)} className="p-1 text-gray-400 hover:text-red-500 cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
      ) : (
        <label className="cursor-pointer space-y-2 block">
          <Upload className="w-8 h-8 text-purple-600 mx-auto" />
          <span className="text-xs font-semibold text-purple-700 dark:text-purple-400 block">Click or drag file to attach</span>
          <span className={`text-[10px] block ${dm ? 'text-gray-500' : 'text-gray-400'}`}>Max size: {q.maxFileSizeMb || 10} MB</span>
          <input type="file" className="hidden" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onAnswer(q.id, { fileName: file.name, fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB` });
          }} />
        </label>
      )}
    </div>
  );

  if (['MULTIPLE_CHOICE_GRID', 'CHECKBOX_GRID'].includes(q.type)) return (
    <div className="overflow-x-auto pt-2">
      <table className={`w-full text-xs text-left border-collapse ${dm ? 'text-gray-300' : 'text-gray-700'}`}>
        <thead>
          <tr className={`border-b ${dm ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
            <th className="p-3 font-bold"></th>
            {(q.gridColumns || []).map((col, cIdx) => <th key={cIdx} className={`p-3 font-semibold text-center ${dm ? 'text-gray-300' : 'text-gray-700'}`}>{col}</th>)}
          </tr>
        </thead>
        <tbody>
          {(q.gridRows || []).map((row, rIdx) => {
            const gridAnswers = val || {};
            return (
              <tr key={rIdx} className={`border-b ${dm ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-100 hover:bg-gray-50/50'}`}>
                <td className={`p-3 font-medium ${dm ? 'text-gray-200' : 'text-gray-900'}`}>{row}</td>
                {(q.gridColumns || []).map((_, cIdx) => {
                  if (q.type === 'MULTIPLE_CHOICE_GRID') {
                    return <td key={cIdx} className="p-3 text-center"><input type="radio" name={`grid-${q.id}-row-${rIdx}`} checked={gridAnswers[rIdx] === cIdx} onChange={() => onAnswer(q.id, { ...gridAnswers, [rIdx]: cIdx })} className="w-4 h-4 text-purple-600 focus:ring-purple-500 cursor-pointer" /></td>;
                  } else {
                    const rowArr: number[] = gridAnswers[rIdx] || [];
                    return <td key={cIdx} className="p-3 text-center"><input type="checkbox" checked={rowArr.includes(cIdx)} onChange={(e) => onAnswer(q.id, { ...gridAnswers, [rIdx]: e.target.checked ? [...rowArr, cIdx] : rowArr.filter((i) => i !== cIdx) })} className="w-4 h-4 text-purple-600 rounded-xs focus:ring-purple-500 cursor-pointer" /></td>;
                  }
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return null;
};
