import React from 'react';
import { Form, FormSettings } from '../types';
import { Award, Lock, Eye, Calendar, ShieldCheck, KeyRound, Clock, Users } from 'lucide-react';

interface FormSettingsViewProps {
  form: Form;
  onUpdateSettings: (patchSettings: Partial<FormSettings>) => void;
  darkMode?: boolean;
}

export const FormSettingsView: React.FC<FormSettingsViewProps> = ({ form, onUpdateSettings, darkMode = false }) => {
  const settings = form.settings;
  const dm = darkMode;
  const card = `bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-2xs space-y-4`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Quiz Settings */}
        <div className={card}>
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Make this a quiz</h3>
                <p className="text-xs text-gray-500">
                  Assign point values, set answers, and automatically provide feedback.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.isQuiz}
                onChange={(e) => onUpdateSettings({ isQuiz: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {settings.isQuiz && (
            <div className="pl-12 space-y-3 pt-2">
              <label className="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="releaseGrades"
                  checked={settings.releaseGradesImmediately}
                  onChange={() => onUpdateSettings({ releaseGradesImmediately: true })}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <span>Release grades immediately after each submission</span>
              </label>

              <label className="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="releaseGrades"
                  checked={!settings.releaseGradesImmediately}
                  onChange={() => onUpdateSettings({ releaseGradesImmediately: false })}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <span>Later, after manual review</span>
              </label>
            </div>
          )}
        </div>

        {/* Scheduling & Auto-Close */}
        <div className={card}>
          <div className="flex items-center space-x-3 pb-3 border-b border-gray-100">
            <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Form Scheduling & Limits</h3>
              <p className="text-xs text-gray-500">Set start/close dates and maximum submission limits.</p>
            </div>
          </div>

          <div className="space-y-4 pt-1 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-1 flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Schedule Open Date/Time</span>
                </label>
                <input
                  type="datetime-local"
                  value={settings.scheduleOpenDate || ''}
                  onChange={(e) => onUpdateSettings({ scheduleOpenDate: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-purple-200 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1 flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Schedule Close Date/Time</span>
                </label>
                <input
                  type="datetime-local"
                  value={settings.scheduleCloseDate || ''}
                  onChange={(e) => onUpdateSettings({ scheduleCloseDate: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-purple-200 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1 flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-amber-600" />
                <span>Max Submissions Auto-Close Limit</span>
              </label>
              <input
                type="number"
                placeholder="Unset (Unlimited submissions)"
                min={1}
                value={settings.maxSubmissions || ''}
                onChange={(e) =>
                  onUpdateSettings({
                    maxSubmissions: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-purple-200 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">
                Custom Closed / Scheduled Message
              </label>
              <input
                type="text"
                value={settings.closedMessage || ''}
                onChange={(e) => onUpdateSettings({ closedMessage: e.target.value })}
                placeholder="This form is no longer accepting responses."
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-purple-200 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Access Control & Security */}
        <div className={card}>
          <div className="flex items-center space-x-3 pb-3 border-b border-gray-100">
            <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Access Control & Security</h3>
              <p className="text-xs text-gray-500">Password protection and respondent identification.</p>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-gray-800 block">
                  Passcode Protection
                </span>
                <span className="text-[11px] text-gray-500">
                  Require respondents to enter a passcode before opening the form.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!settings.passcodeProtected}
                  onChange={(e) => onUpdateSettings({ passcodeProtected: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {settings.passcodeProtected && (
              <div className="pl-4 pt-1">
                <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center space-x-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Access Passcode</span>
                </label>
                <input
                  type="text"
                  value={settings.passcode || ''}
                  onChange={(e) => onUpdateSettings({ passcode: e.target.value })}
                  placeholder="e.g. SECRET123"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:ring-2 focus:ring-purple-200 focus:outline-hidden font-mono"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-gray-800 block">
                  Limit to 1 response
                </span>
                <span className="text-[11px] text-gray-500">
                  Respondents will be required to identify once per submission.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.limitOneResponse}
                  onChange={(e) => onUpdateSettings({ limitOneResponse: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-gray-800 block">
                  Allow response editing
                </span>
                <span className="text-[11px] text-gray-500">
                  Responses can be changed after being submitted.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.allowResponseEditing}
                  onChange={(e) => onUpdateSettings({ allowResponseEditing: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Presentation Settings */}
        <div className={card}>
          <div className="flex items-center space-x-3 pb-3 border-b border-gray-100">
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Presentation</h3>
              <p className="text-xs text-gray-500">
                Manage how the form is rendered for respondents.
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-800">Show progress bar</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showProgressBar}
                  onChange={(e) => onUpdateSettings({ showProgressBar: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1">
                Confirmation Message
              </label>
              <textarea
                value={settings.confirmationMessage}
                onChange={(e) => onUpdateSettings({ confirmationMessage: e.target.value })}
                rows={2}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-purple-200"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
