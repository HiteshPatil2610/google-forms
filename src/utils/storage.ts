import { Form, FormResponse } from '../types';
import { INITIAL_FORMS, INITIAL_RESPONSES } from '../data/initialData';

const FORMS_KEY = 'gforms_clone_forms_v1';
const RESPONSES_KEY = 'gforms_clone_responses_v1';
const SUBMITTED_FORMS_KEY = 'gforms_clone_submitted_v1';
const LAST_VIEWED_KEY = 'gforms_clone_last_viewed_v1';
const DARK_MODE_KEY = 'gforms_clone_dark_mode_v1';

// ─── Forms ────────────────────────────────────────────────────────────────────

export function getStoredForms(): Form[] {
  try {
    const raw = localStorage.getItem(FORMS_KEY);
    if (!raw) {
      localStorage.setItem(FORMS_KEY, JSON.stringify(INITIAL_FORMS));
      return INITIAL_FORMS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading stored forms:', e);
    return INITIAL_FORMS;
  }
}

export function saveStoredForms(forms: Form[]) {
  try {
    localStorage.setItem(FORMS_KEY, JSON.stringify(forms));
  } catch (e) {
    console.error('Error saving forms:', e);
  }
}

// ─── Responses ────────────────────────────────────────────────────────────────

export function getStoredResponses(): FormResponse[] {
  try {
    const raw = localStorage.getItem(RESPONSES_KEY);
    if (!raw) {
      localStorage.setItem(RESPONSES_KEY, JSON.stringify(INITIAL_RESPONSES));
      return INITIAL_RESPONSES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading stored responses:', e);
    return INITIAL_RESPONSES;
  }
}

export function saveStoredResponses(responses: FormResponse[]) {
  try {
    localStorage.setItem(RESPONSES_KEY, JSON.stringify(responses));
  } catch (e) {
    console.error('Error saving responses:', e);
  }
}

export function addStoredResponse(response: FormResponse) {
  const current = getStoredResponses();
  const updated = [response, ...current];
  saveStoredResponses(updated);
}

export function deleteStoredResponse(responseId: string) {
  const current = getStoredResponses();
  const updated = current.filter((r) => r.id !== responseId);
  saveStoredResponses(updated);
}

export function clearFormResponses(formId: string) {
  const current = getStoredResponses();
  const updated = current.filter((r) => r.formId !== formId);
  saveStoredResponses(updated);
}

// ─── Limit-one-response: track which forms a device has already submitted ─────

export function getSubmittedFormIds(): string[] {
  try {
    const raw = localStorage.getItem(SUBMITTED_FORMS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markFormAsSubmitted(formId: string) {
  const current = getSubmittedFormIds();
  if (!current.includes(formId)) {
    localStorage.setItem(SUBMITTED_FORMS_KEY, JSON.stringify([...current, formId]));
  }
}

export function hasAlreadySubmitted(formId: string): boolean {
  return getSubmittedFormIds().includes(formId);
}

// ─── Last-viewed response counts (for new-response badge) ────────────────────

export function getLastViewedResponseCounts(): Record<string, number> {
  try {
    const raw = localStorage.getItem(LAST_VIEWED_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function setLastViewedResponseCount(formId: string, count: number) {
  const current = getLastViewedResponseCounts();
  localStorage.setItem(LAST_VIEWED_KEY, JSON.stringify({ ...current, [formId]: count }));
}

// ─── Dark mode preference ─────────────────────────────────────────────────────

export function getStoredDarkMode(): boolean {
  try {
    const raw = localStorage.getItem(DARK_MODE_KEY);
    return raw === 'true';
  } catch {
    return false;
  }
}

export function saveStoredDarkMode(enabled: boolean) {
  localStorage.setItem(DARK_MODE_KEY, String(enabled));
}
