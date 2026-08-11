export type QuestionType =
  | 'SHORT_ANSWER'
  | 'PARAGRAPH'
  | 'MULTIPLE_CHOICE'
  | 'CHECKBOXES'
  | 'DROPDOWN'
  | 'LINEAR_SCALE'
  | 'RATING'
  | 'DATE'
  | 'TIME'
  | 'DATE_TIME'
  | 'FILE_UPLOAD'
  | 'NPS'
  | 'MULTIPLE_CHOICE_GRID'
  | 'CHECKBOX_GRID';

export interface Option {
  id: string;
  text: string;
  goToSectionId?: string; // 'NEXT' | 'SUBMIT' | sectionId
}

export interface QuestionValidation {
  type: 'NUMBER' | 'TEXT' | 'LENGTH' | 'REGEX' | 'FILE_SIZE' | 'FILE_TYPE';
  rule:
    | 'GREATER_THAN'
    | 'LESS_THAN'
    | 'BETWEEN'
    | 'CONTAINS'
    | 'DOES_NOT_CONTAIN'
    | 'EMAIL'
    | 'URL'
    | 'MAX_CHAR'
    | 'MIN_CHAR'
    | 'REGEX_MATCH'
    | 'MAX_FILE_SIZE'
    | 'ALLOWED_FILE_TYPES';
  value?: string | number;
  secondaryValue?: string | number;
  customErrorText?: string;
}

export interface Question {
  id: string;
  sectionId: string;
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  options?: Option[];
  hasOtherOption?: boolean;

  // Logic Branching toggle
  enableLogicBranching?: boolean;

  // Validation rules
  validation?: QuestionValidation;

  // Linear scale & NPS config
  scaleMin?: number;
  scaleMax?: number;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;

  // Grid config (Multiple Choice Grid / Checkbox Grid)
  gridRows?: string[];
  gridColumns?: string[];

  // File upload config
  allowedFileTypes?: ('document' | 'spreadsheet' | 'presentation' | 'pdf' | 'image' | 'audio' | 'video')[];
  maxFileSizeMb?: number;
  maxFilesCount?: number;

  // Quiz config
  points?: number;
  correctAnswer?: string | string[] | Record<string, string | string[]>;
  explanation?: string;

  // Image attachment
  imageUrl?: string;
}

export interface Section {
  id: string;
  title: string;
  description?: string;
  nextSectionAction?: 'NEXT' | 'SUBMIT' | string;
}

export interface FormTheme {
  primaryColor: string;
  backgroundColor: string;
  headerImage?: string;
  fontStyle: 'Roboto' | 'Decorative' | 'Formal' | 'Playful';
}

export interface FormSettings {
  isQuiz: boolean;
  releaseGradesImmediately: boolean;
  allowResponseEditing: boolean;
  limitOneResponse: boolean;
  showProgressBar: boolean;
  shuffleQuestionOrder: boolean;
  confirmationMessage: string;
  acceptingResponses: boolean;
  closedMessage: string;

  // Scheduling
  scheduleOpenDate?: string;
  scheduleCloseDate?: string;
  maxSubmissions?: number;

  // Access & Security
  passcodeProtected?: boolean;
  passcode?: string;
  requireEmailIdentifier?: boolean;
}

export interface Form {
  id: string;
  title: string;
  description: string;
  category: 'Blank' | 'Customer Feedback' | 'Event Registration' | 'Quiz' | 'Work' | 'Education' | 'Personal';
  sections: Section[];
  questions: Question[];
  theme: FormTheme;
  settings: FormSettings;
  createdAt: string;
  updatedAt: string;
  isFavorite?: boolean;
  isTrashed?: boolean;
}

export interface QuestionAnswer {
  questionId: string;
  value: string | string[] | number;
}

export interface FormResponse {
  id: string;
  formId: string;
  submittedAt: string;
  respondentEmail?: string;
  answers: QuestionAnswer[];
  quizScore?: {
    totalPoints: number;
    earnedPoints: number;
  };
}

export type SortMode = 'updatedAt' | 'createdAt' | 'title' | 'responses';

export type ViewMode =
  | { mode: 'MANAGEMENT' }
  | { mode: 'EDITOR'; formId: string; activeTab: 'questions' | 'responses' | 'settings' }
  | { mode: 'RESPONDENT'; formId: string; isPreview?: boolean }
  | { mode: 'TRASH' };
