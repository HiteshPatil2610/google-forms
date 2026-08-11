import React, { useState } from 'react';
import { Form, FormResponse } from '../types';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, LineChart, Line, CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  Download, Trash2, Users, Award, BarChart3, Search,
  FileSpreadsheet, ChevronLeft, ChevronRight,
} from 'lucide-react';

interface FormReportProps {
  form: Form;
  responses: FormResponse[];
  onClearResponses: () => void;
  onDeleteSingleResponse: (responseId: string) => void;
  onToggleAcceptingResponses: (accepting: boolean) => void;
  darkMode?: boolean;
}

const CHART_COLORS = [
  '#673ab7','#3f51b5','#1a73e8','#009688','#2e7d32',
  '#e65100','#c62828','#ad1457','#0088FE','#00C49F','#FFBB28','#FF8042',
];

// NPS helper
function calcNPS(scores: number[]) {
  if (scores.length === 0) return { nps: 0, promoters: 0, passives: 0, detractors: 0, total: 0 };
  const promoters  = scores.filter((s) => s >= 9).length;
  const passives   = scores.filter((s) => s >= 7 && s <= 8).length;
  const detractors = scores.filter((s) => s <= 6).length;
  const total      = scores.length;
  const nps        = Math.round(((promoters - detractors) / total) * 100);
  return { nps, promoters, passives, detractors, total };
}

export const FormReport: React.FC<FormReportProps> = ({
  form, responses, onClearResponses, onDeleteSingleResponse,
  onToggleAcceptingResponses, darkMode = false,
}) => {
  const [reportTab, setReportTab] = useState<'summary' | 'question' | 'individual' | 'table'>('summary');
  const [individualIndex, setIndividualIndex] = useState(0);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>(form.questions[0]?.id || '');
  const [tableSearch, setTableSearch] = useState('');

  const dm = darkMode;
  const formResponses = responses.filter((r) => r.formId === form.id);
  const totalResponses = formResponses.length;

  // Quiz avg score
  let avgQuizScore = 0;
  if (form.settings.isQuiz && totalResponses > 0) {
    const totalEarned = formResponses.reduce((acc, r) => acc + (r.quizScore?.earnedPoints || 0), 0);
    const totalPossible = formResponses[0]?.quizScore?.totalPoints || 1;
    avgQuizScore = Math.round((totalEarned / (totalResponses * totalPossible)) * 100);
  }

  // ─── CSV Export ──────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (totalResponses === 0) return;
    let csv = 'data:text/csv;charset=utf-8,';
    csv += ['Timestamp', 'Respondent Email', ...form.questions.map((q) => `"${q.title}"`)].join(',') + '\r\n';
    formResponses.forEach((r) => {
      const row = [
        `"${new Date(r.submittedAt).toLocaleString()}"`,
        `"${r.respondentEmail || 'Anonymous'}"`,
        ...form.questions.map((q) => {
          const ans = r.answers.find((a) => a.questionId === q.id);
          if (!ans) return '""';
          let val: any = ans.value;
          if (['MULTIPLE_CHOICE', 'DROPDOWN'].includes(q.type) && q.options)
            val = q.options.find((o) => o.id === val)?.text || val;
          else if (q.type === 'CHECKBOXES' && Array.isArray(val) && q.options)
            val = (val as string[]).map((id) => q.options?.find((o) => o.id === id)?.text || id).join('; ');
          return `"${String(val || '').replace(/"/g, '""')}"`;
        }),
      ].join(',');
      csv += row + '\r\n';
    });
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', `${form.title.replace(/\s+/g, '_')}_Responses.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ─── Shared dark-mode styles ─────────────────────────────────────────────────
  const card   = `rounded-2xl border shadow-2xs ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`;
  const txt    = dm ? 'text-gray-100' : 'text-gray-900';
  const subtxt = dm ? 'text-gray-400' : 'text-gray-500';
  const axisStyle = { fontSize: 11, fill: dm ? '#9ca3af' : '#6b7280' };

  return (
    <div className={`min-h-screen py-8 px-4 pb-20 ${dm ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── Top Stats Card ─────────────────────────────────────────────────── */}
        <div className={card + ' p-6'}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b gap-4"
            style={{ borderColor: dm ? '#374151' : '#f3f4f6' }}>
            <div>
              <h2 className={`text-2xl font-bold ${txt}`}>{totalResponses} {totalResponses === 1 ? 'Response' : 'Responses'}</h2>
              <p className={`text-xs mt-0.5 ${subtxt}`}>
                Last submission:{' '}
                {totalResponses > 0 ? new Date(formResponses[0].submittedAt).toLocaleString() : 'No responses yet'}
              </p>
            </div>
            <div className="flex items-center space-x-3 self-end sm:self-auto">
              {/* Accepting toggle */}
              <div className={`flex items-center space-x-2 border rounded-xl px-3 py-1.5 ${dm ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <span className={`text-xs font-semibold ${dm ? 'text-gray-300' : 'text-gray-700'}`}>
                  {form.settings.acceptingResponses ? 'Accepting' : 'Not accepting'}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={form.settings.acceptingResponses}
                    onChange={(e) => onToggleAcceptingResponses(e.target.checked)} className="sr-only peer" />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
              <button onClick={handleExportCSV} disabled={totalResponses === 0}
                className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 text-white font-medium text-xs rounded-xl hover:bg-emerald-700 disabled:opacity-40 transition-colors cursor-pointer shrink-0">
                <FileSpreadsheet className="w-4 h-4" /><span>Export CSV</span>
              </button>
              <button onClick={onClearResponses} disabled={totalResponses === 0}
                className="flex items-center space-x-1.5 px-3 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium text-xs rounded-xl hover:bg-red-100 disabled:opacity-40 transition-colors cursor-pointer shrink-0 border border-red-200 dark:border-red-800">
                <Trash2 className="w-4 h-4" /><span>Clear All</span>
              </button>
            </div>
          </div>

          {/* Metric tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
            <div className={`p-4 rounded-xl border ${dm ? 'bg-purple-900/30 border-purple-800' : 'bg-purple-50 border-purple-100'}`}>
              <span className={`text-xs font-semibold uppercase tracking-wider block ${dm ? 'text-purple-300' : 'text-purple-700'}`}>Total Submissions</span>
              <span className={`text-2xl font-black mt-1 block ${dm ? 'text-purple-100' : 'text-purple-900'}`}>{totalResponses}</span>
            </div>
            {form.settings.isQuiz && (
              <div className={`p-4 rounded-xl border ${dm ? 'bg-amber-900/30 border-amber-800' : 'bg-amber-50 border-amber-100'}`}>
                <span className={`text-xs font-semibold uppercase tracking-wider block ${dm ? 'text-amber-300' : 'text-amber-700'}`}>Avg Quiz Score</span>
                <span className={`text-2xl font-black mt-1 block ${dm ? 'text-amber-100' : 'text-amber-900'}`}>{avgQuizScore}%</span>
              </div>
            )}
            <div className={`p-4 rounded-xl border ${dm ? 'bg-blue-900/30 border-blue-800' : 'bg-blue-50 border-blue-100'}`}>
              <span className={`text-xs font-semibold uppercase tracking-wider block ${dm ? 'text-blue-300' : 'text-blue-700'}`}>Form Questions</span>
              <span className={`text-2xl font-black mt-1 block ${dm ? 'text-blue-100' : 'text-blue-900'}`}>{form.questions.length}</span>
            </div>
            <div className={`p-4 rounded-xl border ${dm ? 'bg-emerald-900/30 border-emerald-800' : 'bg-emerald-50 border-emerald-100'}`}>
              <span className={`text-xs font-semibold uppercase tracking-wider block ${dm ? 'text-emerald-300' : 'text-emerald-700'}`}>Completion Rate</span>
              <span className={`text-2xl font-black mt-1 block ${dm ? 'text-emerald-100' : 'text-emerald-900'}`}>{totalResponses > 0 ? '100%' : '0%'}</span>
            </div>
          </div>
        </div>

        {/* ── Tab bar ────────────────────────────────────────────────────────── */}
        <div className={`flex border rounded-xl p-1 shadow-2xs ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          {(['summary','question','individual','table'] as const).map((tab) => (
            <button key={tab} onClick={() => setReportTab(tab)}
              className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer capitalize ${reportTab === tab ? 'bg-purple-600 text-white shadow-xs' : dm ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`}>
              {tab === 'summary' ? 'Summary Charts' : tab === 'question' ? 'By Question' : tab === 'individual' ? 'Individual' : 'Data Table'}
            </button>
          ))}
        </div>

        {/* ── SUMMARY TAB ────────────────────────────────────────────────────── */}
        {reportTab === 'summary' && (
          <div className="space-y-6">
            {totalResponses === 0 ? (
              <div className={`${card} p-12 text-center`}>
                <BarChart3 className={`w-10 h-10 mx-auto mb-2 ${dm ? 'text-gray-600' : 'text-gray-300'}`} />
                <h3 className={`font-semibold ${dm ? 'text-gray-300' : 'text-gray-800'}`}>No responses recorded yet</h3>
                <p className={`text-xs mt-1 ${subtxt}`}>Share the form link to collect responses.</p>
              </div>
            ) : (
              <>
                {/* Avg score trend (quiz only) */}
                {form.settings.isQuiz && totalResponses > 1 && (
                  <div className={`${card} p-6 space-y-4`}>
                    <h3 className={`font-semibold text-base border-b pb-2 ${txt} ${dm ? 'border-gray-700' : 'border-gray-100'}`}>Score Trend Over Time</h3>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={[...formResponses].reverse().map((r, i) => ({
                          idx: i + 1,
                          score: r.quizScore ? Math.round((r.quizScore.earnedPoints / Math.max(r.quizScore.totalPoints, 1)) * 100) : 0,
                          label: new Date(r.submittedAt).toLocaleDateString(),
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke={dm ? '#374151' : '#f0f0f0'} />
                          <XAxis dataKey="label" tick={axisStyle} />
                          <YAxis domain={[0, 100]} tick={axisStyle} unit="%" />
                          <Tooltip formatter={(v: any) => [`${v}%`, 'Score']} contentStyle={{ backgroundColor: dm ? '#1f2937' : '#fff', border: dm ? '1px solid #374151' : '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }} />
                          <ReferenceLine y={avgQuizScore} stroke="#673ab7" strokeDasharray="4 4" label={{ value: `Avg ${avgQuizScore}%`, fill: '#673ab7', fontSize: 10 }} />
                          <Line type="monotone" dataKey="score" stroke="#673ab7" strokeWidth={2} dot={{ fill: '#673ab7', r: 3 }} activeDot={{ r: 5 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {form.questions.map((q, idx) => {
                  // ── NPS chart ────────────────────────────────────────────────
                  if (q.type === 'NPS') {
                    const scores = formResponses
                      .map((r) => r.answers.find((a) => a.questionId === q.id)?.value)
                      .filter((v): v is number => typeof v === 'number');
                    const { nps, promoters, passives, detractors, total } = calcNPS(scores);
                    const barData = [
                      { label: 'Detractors (0-6)', count: detractors, fill: '#ef4444' },
                      { label: 'Passives (7-8)',   count: passives,   fill: '#f59e0b' },
                      { label: 'Promoters (9-10)', count: promoters,  fill: '#22c55e' },
                    ];
                    return (
                      <div key={q.id} className={`${card} p-6 space-y-4`}>
                        <div className={`flex items-center justify-between border-b pb-3 ${dm ? 'border-gray-700' : 'border-gray-100'}`}>
                          <h3 className={`font-semibold text-base ${txt}`}>{idx + 1}. {q.title}</h3>
                          <span className={`text-xs font-medium ${subtxt}`}>{total} responses</span>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-center">
                            <span className={`text-4xl font-black ${nps >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{nps > 0 ? '+' : ''}{nps}</span>
                            <span className={`text-xs block font-semibold mt-1 ${subtxt}`}>NPS Score</span>
                          </div>
                          <div className="flex-1 h-36">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={barData} layout="vertical">
                                <XAxis type="number" allowDecimals={false} tick={axisStyle} />
                                <YAxis type="category" dataKey="label" width={130} tick={axisStyle} />
                                <Tooltip contentStyle={{ backgroundColor: dm ? '#1f2937' : '#fff', border: dm ? '1px solid #374151' : undefined, borderRadius: 8, fontSize: 12 }} />
                                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                                  {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-center text-xs">
                          {[{label:'Detractors',count:detractors,color:'text-red-500'},{label:'Passives',count:passives,color:'text-amber-500'},{label:'Promoters',count:promoters,color:'text-emerald-500'}].map((g) => (
                            <div key={g.label} className={`p-2 rounded-lg ${dm ? 'bg-gray-700' : 'bg-gray-50'}`}>
                              <span className={`font-black text-lg ${g.color}`}>{g.count}</span>
                              <span className={`block ${subtxt}`}>{g.label}</span>
                              <span className={`block ${subtxt}`}>{total > 0 ? Math.round((g.count/total)*100) : 0}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  // ── MC / Dropdown pie ────────────────────────────────────────
                  if (['MULTIPLE_CHOICE','DROPDOWN'].includes(q.type) && q.options) {
                    const counts: Record<string,number> = {};
                    q.options.forEach((o) => (counts[o.text] = 0));
                    formResponses.forEach((r) => {
                      const ans = r.answers.find((a) => a.questionId === q.id);
                      if (ans?.value) {
                        const opt = q.options?.find((o) => o.id === ans.value);
                        if (opt) counts[opt.text] = (counts[opt.text] || 0) + 1;
                      }
                    });
                    const chartData = Object.entries(counts).map(([name, value]) => ({ name, value }));
                    return (
                      <div key={q.id} className={`${card} p-6 space-y-4`}>
                        <div className={`flex items-center justify-between border-b pb-3 ${dm ? 'border-gray-700' : 'border-gray-100'}`}>
                          <h3 className={`font-semibold text-base ${txt}`}>{idx + 1}. {q.title}</h3>
                          <span className={`text-xs font-medium ${subtxt}`}>{totalResponses} responses</span>
                        </div>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                                label={({ name, percent }) => `${name}: ${(percent*100).toFixed(0)}%`}>
                                {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                              </Pie>
                              <Tooltip contentStyle={{ backgroundColor: dm ? '#1f2937' : '#fff', border: dm ? '1px solid #374151' : undefined, borderRadius: 8, fontSize: 12 }} />
                              <Legend wrapperStyle={{ fontSize: 12, color: dm ? '#9ca3af' : undefined }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    );
                  }

                  // ── Checkboxes bar ───────────────────────────────────────────
                  if (q.type === 'CHECKBOXES' && q.options) {
                    const counts: Record<string,number> = {};
                    q.options.forEach((o) => (counts[o.text] = 0));
                    formResponses.forEach((r) => {
                      const ans = r.answers.find((a) => a.questionId === q.id);
                      if (ans && Array.isArray(ans.value))
                        (ans.value as string[]).forEach((id) => {
                          const opt = q.options?.find((o) => o.id === id);
                          if (opt) counts[opt.text] = (counts[opt.text] || 0) + 1;
                        });
                    });
                    const chartData = Object.entries(counts).map(([name, count]) => ({ name, count }));
                    return (
                      <div key={q.id} className={`${card} p-6 space-y-4`}>
                        <div className={`flex items-center justify-between border-b pb-3 ${dm ? 'border-gray-700' : 'border-gray-100'}`}>
                          <h3 className={`font-semibold text-base ${txt}`}>{idx + 1}. {q.title}</h3>
                          <span className={`text-xs font-medium ${subtxt}`}>{totalResponses} responses</span>
                        </div>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke={dm ? '#374151' : '#f0f0f0'} />
                              <XAxis dataKey="name" tick={axisStyle} />
                              <YAxis allowDecimals={false} tick={axisStyle} />
                              <Tooltip contentStyle={{ backgroundColor: dm ? '#1f2937' : '#fff', border: dm ? '1px solid #374151' : undefined, borderRadius: 8, fontSize: 12 }} />
                              <Bar dataKey="count" fill="#673ab7" radius={[6,6,0,0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    );
                  }

                  // ── Rating / Linear Scale bar ────────────────────────────────
                  if (['LINEAR_SCALE','RATING'].includes(q.type)) {
                    const scaleMax = q.scaleMax || 5;
                    const counts: Record<number,number> = {};
                    for (let i = 1; i <= scaleMax; i++) counts[i] = 0;
                    formResponses.forEach((r) => {
                      const ans = r.answers.find((a) => a.questionId === q.id);
                      if (ans && typeof ans.value === 'number') counts[ans.value] = (counts[ans.value] || 0) + 1;
                    });
                    const chartData = Object.entries(counts).map(([score, count]) => ({ score: `${score}`, count }));
                    return (
                      <div key={q.id} className={`${card} p-6 space-y-4`}>
                        <div className={`flex items-center justify-between border-b pb-3 ${dm ? 'border-gray-700' : 'border-gray-100'}`}>
                          <h3 className={`font-semibold text-base ${txt}`}>{idx + 1}. {q.title}</h3>
                          <span className={`text-xs font-medium ${subtxt}`}>{totalResponses} responses</span>
                        </div>
                        <div className="h-56">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke={dm ? '#374151' : '#f0f0f0'} />
                              <XAxis dataKey="score" tick={axisStyle} />
                              <YAxis allowDecimals={false} tick={axisStyle} />
                              <Tooltip contentStyle={{ backgroundColor: dm ? '#1f2937' : '#fff', border: dm ? '1px solid #374151' : undefined, borderRadius: 8, fontSize: 12 }} />
                              <Bar dataKey="count" fill="#1a73e8" radius={[6,6,0,0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    );
                  }

                  // ── Text responses ───────────────────────────────────────────
                  const textResponses = formResponses
                    .map((r) => r.answers.find((a) => a.questionId === q.id)?.value)
                    .filter(Boolean);
                  return (
                    <div key={q.id} className={`${card} p-6 space-y-3`}>
                      <div className={`flex items-center justify-between border-b pb-2 ${dm ? 'border-gray-700' : 'border-gray-100'}`}>
                        <h3 className={`font-semibold text-base ${txt}`}>{idx + 1}. {q.title}</h3>
                        <span className={`text-xs font-medium ${subtxt}`}>{textResponses.length} answers</span>
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto pt-1">
                        {textResponses.map((t, tIdx) => (
                          <div key={tIdx} className={`p-3 rounded-xl text-xs border ${dm ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-50 border-gray-100 text-gray-800'}`}>"{String(t)}"</div>
                        ))}
                        {textResponses.length === 0 && <span className={`text-xs ${subtxt}`}>No answers yet.</span>}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* ── BY QUESTION TAB ────────────────────────────────────────────────── */}
        {reportTab === 'question' && (
          <div className={`${card} p-6 space-y-4`}>
            <div className="mb-4">
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${subtxt}`}>Select Question:</label>
              <select value={selectedQuestionId} onChange={(e) => setSelectedQuestionId(e.target.value)}
                className={`w-full p-3 border rounded-xl text-sm font-medium ${dm ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-gray-50 border-gray-200 text-gray-800'}`}>
                {form.questions.map((q, i) => <option key={q.id} value={q.id}>{i+1}. {q.title}</option>)}
              </select>
            </div>
            {selectedQuestionId && (
              <div className="space-y-3 pt-2">
                {formResponses.length === 0 && <span className={`text-xs ${subtxt}`}>No responses yet.</span>}
                {formResponses.map((r, rIdx) => {
                  const ans = r.answers.find((a) => a.questionId === selectedQuestionId);
                  const q = form.questions.find((q) => q.id === selectedQuestionId);
                  let displayVal = String(ans?.value ?? '—');
                  if (q && Array.isArray(ans?.value)) {
                    displayVal = (ans!.value as string[]).map((v) => q.options?.find((o) => o.id === v)?.text || v).join(', ');
                  } else if (q && ans?.value && q.options) {
                    displayVal = q.options.find((o) => o.id === ans!.value)?.text || displayVal;
                  }
                  return (
                    <div key={r.id} className={`p-3 rounded-xl text-xs flex justify-between items-center border ${dm ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100'}`}>
                      <span className={`font-medium ${subtxt}`}>{r.respondentEmail || `Response ${rIdx+1}`}</span>
                      <span className={`font-bold ${dm ? 'text-purple-300' : 'text-purple-800'}`}>{displayVal}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── INDIVIDUAL TAB ─────────────────────────────────────────────────── */}
        {reportTab === 'individual' && (
          <div className="space-y-4">
            {totalResponses === 0 ? (
              <div className={`${card} p-12 text-center`}>
                <Users className={`w-10 h-10 mx-auto mb-2 ${dm ? 'text-gray-600' : 'text-gray-300'}`} />
                <p className={`text-xs ${subtxt}`}>No individual responses recorded.</p>
              </div>
            ) : (() => {
              const currentResp = formResponses[individualIndex] || formResponses[0];
              return (
                <div className={`${card} p-6 space-y-6`}>
                  <div className={`flex items-center justify-between pb-4 border-b ${dm ? 'border-gray-700' : 'border-gray-100'}`}>
                    <div className="flex items-center space-x-3">
                      <button disabled={individualIndex === 0} onClick={() => setIndividualIndex((p) => p-1)}
                        className={`p-1.5 rounded-lg border disabled:opacity-30 ${dm ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-100'}`}>
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className={`text-xs font-semibold ${txt}`}>{individualIndex+1} of {totalResponses}</span>
                      <button disabled={individualIndex === totalResponses-1} onClick={() => setIndividualIndex((p) => p+1)}
                        className={`p-1.5 rounded-lg border disabled:opacity-30 ${dm ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-100'}`}>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center space-x-3">
                      {form.settings.isQuiz && currentResp.quizScore && (
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${dm ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-100 text-purple-800'}`}>
                          <Award className="w-3 h-3 inline mr-1" />{currentResp.quizScore.earnedPoints}/{currentResp.quizScore.totalPoints} pts
                        </span>
                      )}
                      <span className={`text-xs ${subtxt}`}>{new Date(currentResp.submittedAt).toLocaleString()}</span>
                      <button onClick={() => { if (confirm('Delete this response?')) { onDeleteSingleResponse(currentResp.id); if (individualIndex > 0) setIndividualIndex((p) => p-1); } }}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="Delete response">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {form.questions.map((q, i) => {
                      const ans = currentResp.answers.find((a) => a.questionId === q.id);
                      let displayVal = String(ans?.value ?? '—');
                      if (Array.isArray(ans?.value)) {
                        displayVal = (ans!.value as string[]).map((v) => q.options?.find((o) => o.id === v)?.text || v).join(', ');
                      } else if (ans?.value && q.options) {
                        displayVal = q.options.find((o) => o.id === ans!.value)?.text || displayVal;
                      }
                      return (
                        <div key={q.id} className={`p-4 rounded-xl border ${dm ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100'}`}>
                          <span className={`text-xs font-semibold block mb-1 ${subtxt}`}>{i+1}. {q.title}</span>
                          <span className={`text-sm font-bold block ${txt}`}>{displayVal}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── DATA TABLE TAB ─────────────────────────────────────────────────── */}
        {reportTab === 'table' && (
          <div className={`${card} overflow-hidden`}>
            <div className={`p-4 border-b flex items-center justify-between ${dm ? 'border-gray-700' : 'border-gray-100'}`}>
              <div className="relative max-w-xs w-full">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={tableSearch} onChange={(e) => setTableSearch(e.target.value)}
                  placeholder="Filter table responses..."
                  className={`w-full pl-8 pr-3 py-1.5 border rounded-lg text-xs ${dm ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500' : 'bg-gray-50 border-gray-200'}`} />
              </div>
              <button onClick={handleExportCSV}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 cursor-pointer">
                <Download className="w-3.5 h-3.5" /><span>Export CSV</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className={`w-full text-left text-xs ${dm ? 'text-gray-300' : 'text-gray-700'}`}>
                <thead className={`border-b uppercase text-[10px] font-bold ${dm ? 'bg-gray-700 border-gray-600 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Respondent</th>
                    {form.questions.map((q) => <th key={q.id} className="p-3 max-w-xs truncate">{q.title}</th>)}
                  </tr>
                </thead>
                <tbody className={`divide-y ${dm ? 'divide-gray-700' : 'divide-gray-100'}`}>
                  {formResponses
                    .filter((r) =>
                      !tableSearch ||
                      (r.respondentEmail || '').toLowerCase().includes(tableSearch.toLowerCase()) ||
                      r.answers.some((a) => String(a.value).toLowerCase().includes(tableSearch.toLowerCase()))
                    )
                    .map((r) => (
                      <tr key={r.id} className={dm ? 'hover:bg-gray-700/50' : 'hover:bg-purple-50/30'}>
                        <td className={`p-3 whitespace-nowrap ${subtxt}`}>{new Date(r.submittedAt).toLocaleDateString()}</td>
                        <td className={`p-3 font-medium whitespace-nowrap ${txt}`}>{r.respondentEmail || 'Anonymous'}</td>
                        {form.questions.map((q) => {
                          const ans = r.answers.find((a) => a.questionId === q.id);
                          let displayVal = String(ans?.value ?? '—');
                          if (Array.isArray(ans?.value)) {
                            displayVal = (ans!.value as string[]).map((v) => q.options?.find((o) => o.id === v)?.text || v).join(', ');
                          } else if (ans?.value && q.options) {
                            displayVal = q.options.find((o) => o.id === ans!.value)?.text || displayVal;
                          }
                          return <td key={q.id} className={`p-3 max-w-xs truncate ${dm ? 'text-gray-300' : 'text-gray-800'}`}>{displayVal}</td>;
                        })}
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
