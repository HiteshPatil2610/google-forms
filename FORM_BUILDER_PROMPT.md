# Master Specification & Prompt: Next-Gen Google Forms & Quiz Builder Platform

Copy and paste the prompt below into Claude, Antigravity, or any AI Agent to recreate this complete Form Builder application in any codebase.

---

````markdown
# Comprehensive Prompt: Build a Production-Grade Google Forms & Quiz Platform

Act as a Principal Full-Stack React & UI/UX Engineer. Your objective is to build a modern, high-performance, responsive Google Forms & Quiz Builder Web Application in React, TypeScript, and Tailwind CSS with Lucide Icons.

The application must support complete form lifecycle management: template library, Excel/CSV file upload & auto-question generator, visual drag-and-drop-style form editing, multi-section branching logic, 14+ question types, auto-grading quiz engine, real-time theme customization, scheduled response windows, passcode security gates, multi-channel distribution (links, QR codes, HTML iFrame embeds, email invites), interactive analytics dashboards with CSV export, and a polished respondent submission interface.

---

## 1. System Architecture & Core Data Models

Define standard TypeScript interfaces in a central `types.ts` file to model the entire app state:

```typescript
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
  goToSectionId?: string; // Logic branching: 'NEXT' | 'SUBMIT' | specific sectionId
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
  scaleMin?: number; // Default 1 (or 0 for NPS)
  scaleMax?: number; // Default 5 (or 10 for NPS)
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
  nextSectionAction?: 'NEXT' | 'SUBMIT' | string; // Default next section or jump to specific section ID
}

export interface FormTheme {
  primaryColor: string;
  backgroundColor: string;
  headerImage?: string;
  fontStyle: 'sans' | 'serif' | 'mono' | 'handwritten';
}

export interface FormSettings {
  isQuiz: boolean;
  releaseGradesImmediately: boolean;
  showProgressBar: boolean;
  shuffleQuestionOrder: boolean;
  limitOneResponse: boolean;
  allowResponseEditing: boolean;
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
  sections: Section[];
  questions: Question[];
  theme: FormTheme;
  settings: FormSettings;
  createdAt: string;
  updatedAt: string;
  isStarred?: boolean;
}

export interface QuestionAnswer {
  questionId: string;
  value: any;
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
```

---

## 2. Key UI Components & Design System

The app utilizes Tailwind CSS with a clean, light neutral aesthetic, smooth transitions, pill badges, and elevated card layouts.

### A. Navigation & Global Header
- **Top Header Bar**: Shows form title (editable inline), status indicator (e.g. "All changes saved"), preview button (opens respondent view in new modal/tab), theme customizer drawer trigger, Send/Share button, and main tab switchers:
  1. **Questions**: Form structure editor.
  2. **Responses**: Analytics charts, metrics, and individual submission viewer.
  3. **Settings**: Quiz rules, access gates, scheduling, presentation settings.

### B. Dashboard / Home View (`/`)
- **Header Banner**: Search input, template filter tags ("All", "Feedback", "Quizzes", "Registration", "Surveys").
- **Template Gallery**: Pre-built starter forms (e.g. Event Registration, Customer Feedback, Quiz Assessment, Job Application, NPS Survey).
- **Recent Forms Grid**: Card views displaying form title, total response count pill badge, last updated timestamp, quick actions menu (Preview, Duplicate, Rename, Delete, Star).

### C. Form Editor View (`/edit/:id`)
- **Sticky Side Action Toolbar**: Floating vertical toolbar with buttons for:
  - Add Question (`+`)
  - Add Section Break (`=`)
  - Customize Theme (`Sparkles`)
- **Card-Based Section & Question Blocks**:
  - Drag handle grip icon and Question counter tag.
  - Question Title input field with auto-height support.
  - Question Type selector dropdown with icons for all 14 types.
  - Helper/Description text toggle.
  - **Question Controls Footer**:
    - Duplicate Question.
    - Delete Question.
    - Response Validation button (for text/short answer/paragraph fields).
    - Required toggle switch.
- **Section Breaks & Multi-Section Navigation**:
  - Ability to group questions into Sections.
  - Section title & description inputs.
  - End-of-Section action selector: "Continue to next section", "Submit form", or "Go to Section X".

### D. Advanced Question Types & Working Logic
1. **Short Answer & Paragraph**: Text inputs with Response Validation (Email pattern, URL format, character min/max lengths, custom error messages).
2. **Multiple Choice & Dropdown**: Editable options list, option removal, "Add Other" option, and conditional branching ("Go to section based on answer").
3. **Checkboxes**: Select multiple options.
4. **Linear Scale & Net Promoter Score (NPS)**:
  - Linear Scale: Range selection from 1 to 3..10 with custom min/max labels (e.g. "Poor" to "Excellent").
  - NPS: Standard 0–10 rating bar with Detractor (0-6), Passive (7-8), and Promoter (9-10) color classifications.
5. **Rating**: Interactive 5-star rating widget.
6. **Date, Time, & Date-Time**: Native pickers for dates, times, or timestamp combos.
7. **File Upload**: Configurable max file size (10MB–1GB), allowed file formats, and max files count.
8. **Multiple Choice Grid & Checkbox Grid**: Matrix grid builder with configurable Rows (Questions) and Columns (Choices).

### E. Auto-Grading Quiz Engine
- Toggle "Make this a quiz" in Form Settings.
- When enabled, each question card shows an **Answer Key** section:
  - Assign point value (e.g. 10 points).
  - Select correct answer option(s) or exact match text string.
  - Add answer feedback/explanation.
- Automatically calculates respondent's total earned score upon submission.

### F. Theme & Appearance Customizer Drawer
- Slide-over panel for custom styling:
  - **Header Image Banner**: Select from royalty-free banners or custom image URLs.
  - **Primary Color Palette**: Quick color swatches (Purple, Indigo, Blue, Emerald, Rose, Amber, Dark Slate) or hex picker.
  - **Background Color**: Light complementary tint generator.
  - **Typography**: Font family selector (Sans-Serif, Serif, Monospace, Handwritten).

### G. Sharing, Distribution & Scheduling Modal (`SendModal`)
- **Tab 1: Shareable Link**: Generates unique respondent URL, "Shorten URL" toggle, instant copy button.
- **Tab 2: QR Code Generator**: Renders live QR code canvas pointing to the form with "Download QR Code PNG" button using `qrcode`.
- **Tab 3: HTML iFrame Embed**: Generates copyable `<iframe>` embed code with custom width and height inputs.
- **Tab 4: Email Invites**: Form to send email invitations with custom subject line and message body.
- **Access & Scheduling Settings**:
  - **Passcode Protection**: Set custom password required to unlock the form.
  - **Schedule Open & Close Dates**: Automated datetime limits after which the form auto-closes.
  - **Max Submissions Cap**: Limit response submissions (e.g. stop after 100 responses).

### H. Respondent View (`FormRespondent`)
- Clean, focused form rendering using active theme colors, font style, and header banner.
- **Passcode Gate**: If passcode is active, prompts for password before showing questions.
- **Closed / Scheduled Banner**: Displays custom message if current time is outside open/close window or max response cap is hit.
- **Multi-Step Section Wizard**:
  - Renders active section's questions.
  - Live progress bar showing percentage completion.
  - "Back" and "Next Section" buttons enforcing response validation and section branching logic.
- **Submission Confirmation Screen**:
  - Displays custom confirmation message.
  - Quiz score breakdown card if auto-graded.
  - "Submit another response" button.

### I. Responses & Analytics Dashboard (`FormResponsesView`)
- **Metrics Summary Cards**: Total responses count, average quiz score, completion rate.
- **Visual Analytics Charts**:
  - Multiple Choice / Dropdown: Pie charts or horizontal bar charts showing breakdown.
  - Rating / Scale / NPS: Average score bar and distribution.
- **Individual Responses Viewer**:
  - Step through responses one by one (1 of N).
  - Display respondent email, timestamp, and precise answers.
  - Delete individual response.
- **Data Export**: "Export to CSV" button that generates downloadable `.csv` file of all submissions.

---

## 3. Core Implementation Checklist

1. **State Persistence**: Store forms and responses in `localStorage` or backend database so data survives reloads.
2. **Validation Logic**: Validate required fields and custom rules before allowing section advancement or form submission.
3. **Logic Branching Routing**: Compute target section dynamically based on selected option rules or section default routing.
4. **Responsive Layout**: Mobile-first grid layouts, full keyboard navigation, and high contrast WCAG-compliant styling.

---

## 4. UI & Component Specifications

### 1. Global Navigation Bar (`Navbar.tsx`)
- Displays app branding ("FormCraft / Google Forms Clone"), form title input (when editing), back to dashboard button, and tab view switcher:
  - **Questions**: Form editor canvas
  - **Responses**: Response analytics dashboard (with response count badge)
  - **Settings**: Configuration settings view
- **Header Actions**:
  - Theme Customizer Button (Palette icon) -> Opens theme panel drawer/modal
  - Preview Button (Eye icon) -> Opens live respondent view in a new window or modal
  - Send Form Button (Purple accent) -> Opens the Share & Export modal

### 2. Dashboard View (`FormDashboard.tsx`)
- Header with search bar and template cards: Blank Form, Import Spreadsheet (Excel / CSV), AI Form Builder, and pre-built templates (Contact Info, Event Registration, Course Feedback, Quiz, RSVP).
- Grid layout listing user's forms with status badges (Accepting Responses vs Closed), total response count, last modified date, duplicate button, and delete confirmation modal.

### 3. Excel / CSV Import & Auto-Generator Modal (`ExcelImportModal.tsx`)
- **Step 1: Choice & Drag-and-Drop Upload**:
  - Asks creators if they have an Excel (`.xlsx`, `.xls`) or CSV (`.csv`) spreadsheet file where they want to structure/store data.
  - Dropzone for spreadsheet upload or file browser selection.
- **Step 2: Smart Column Parsing & Type Inference**:
  - Automatically parses column headers and inspects sample rows.
  - Smart field inference engine:
    - Headers containing "email" -> Short Answer with Email validation.
    - Headers containing "url/website" -> Short Answer with URL validation.
    - Headers containing "date/dob/joined" -> Date field.
    - Headers containing "time" -> Time field.
    - Headers containing "feedback/comment/description/notes" -> Paragraph.
    - Column data with 2-6 distinct values -> Multiple Choice with auto-generated options.
    - Column data with 7-12 distinct values -> Dropdown with options.
    - Numeric values 1-5 or 1-10 -> Rating or Linear Scale.
- **Step 3: Interactive Field Mapping & Review**:
  - Auto-generated Form Title & Description from file name.
  - List of detected column fields with include/exclude checkboxes, editable question titles, question type dropdown overrides, required field toggles, and sample value previews.
  - "Generate Form" button builds the form and opens it directly in the Form Editor Canvas, granting creators full rights to edit, reorder, or customize all questions afterwards.

### 4. Form Editor Canvas (`FormEditor.tsx`)
- **Canvas Container**: Styled with customizable background color (`theme.backgroundColor`) and a max-width centered layout (768px).
- **Header Card**: Accent top border matching `theme.primaryColor` (10px height). Banner header image preview if present. Editable title and description fields.
- **Floating Side Action Bar**: Fixed floating toolbar on desktop containing:
  - `+` Add Question
  - `Layers` Add Section Break
  - `Sparkles` Open Theme Customizer
- **Section Dividers**:
  - Each section header displays "Section X of Y: Title" with description and "After section X" routing selector (Continue to next section, Submit form, Go to section N).
- **Question Card Item**:
  - Drag handle grip and Move Up / Move Down buttons.
  - Editable Question Title input and Question Type selector dropdown supporting 14 types:
    - Short Answer
    - Paragraph
    - Multiple Choice (Radio)
    - Checkboxes
    - Dropdown
    - Linear Scale (1-5, 1-10 with custom min/max labels)
    - Rating (Star rating system)
    - Date Picker
    - Time Picker
    - Date & Time Picker
    - File Upload (with max size and file count config)
    - Net Promoter Score (NPS 0-10 scale)
    - Multiple Choice Grid (Rows x Columns with radio selection)
    - Checkbox Grid (Rows x Columns with checkbox selection)
  - **Option Management for Choice Types**:
    - Add option / Add "Other"
    - Inline delete option
    - Logic Branching Toggle: When enabled, adds a dropdown next to each choice option: Go to section based on answer (Next section, Submit form, or jump to Section N).
  - **Response Validation Panel**: Expandable bottom panel allowing rule setup (e.g., Email format, URL format, Contains text, Min/Max character limits) with custom error message input.
  - **Quiz Mode Answer Key**: Shown when `settings.isQuiz` is true:
    - Points input field.
    - Correct answer selector dropdown or text matcher.
  - **Bottom Card Actions**: Duplicate, Delete, Response Validation toggle, and Required toggle switch.

### 4. Theme Customizer Panel (`ThemeCustomizerModal.tsx`)
- Slide-over or modal containing:
  - Header Image URL input with preset template images (Header banners).
  - Primary Theme Color palette selector (Purple, Indigo, Blue, Teal, Green, Amber, Rose, Slate).
  - Canvas background tint picker.
  - Font family selector (Sans, Serif, Mono).

### 5. Form Settings View (`FormSettingsView.tsx`)
- **Section 1: Quiz Settings**
  - "Make this a quiz" toggle.
  - Grade release timing (Immediately after submission vs Later after manual review).
- **Section 2: Form Scheduling & Auto-Close Limits**
  - Schedule Open Date & Time picker.
  - Schedule Close Date & Time picker.
  - Max Submissions Auto-Close Limit number input.
  - Custom closed message text area.
- **Section 3: Access Control & Security**
  - Passcode Protection toggle + Access Passcode string input.
  - Limit to 1 response toggle.
  - Allow response editing toggle.
- **Section 4: Presentation Settings**
  - Show progress bar toggle.
  - Custom confirmation message text input.

### 6. Sharing & Export Modal (`SendModal.tsx`)
- **Tab 1: Shareable Link**
  - Input field with full respondent URL, "Shorten URL" checkbox, 1-click "Copy Link" button, and "Open Respondent View" button.
- **Tab 2: QR Code**
  - Live generated QR code canvas using `qrcode` library.
  - "Download QR Code Image" button.
- **Tab 3: HTML Embed Code**
  - Width and Height inputs.
  - Auto-generated `<iframe src="...">` code snippet with 1-click copy button.
- **Tab 4: Email Invitation**
  - Recipient email list input, custom subject, message body, and "Send Invitations" button.

### 7. Responses & Analytics View (`FormResponsesView.tsx`)
- **Header Summary Stats**: Total Responses, Average Quiz Score (if quiz), Submission Rate.
- **Tab 1: Summary Visual Analytics**:
  - Bar charts and breakdown graphs for each question type.
  - NPS score breakdown (Promoters, Passives, Detractors with gauge/percentages).
  - Choice frequency distribution charts.
- **Tab 2: Individual Responses**:
  - Respondent selector pagination (Response 1 of N).
  - Full read-only response sheet with timestamps, respondent email, and score breakdown.
- **Global Actions**: "Export to CSV" download trigger, "Delete All Responses" button.

### 8. Respondent Public View (`FormRespondent.tsx`)
- **Passcode Gate Screen**: If form is passcode protected, presents a clean lock screen requiring the passcode before unlocking questions.
- **Scheduled / Closed Screen**: If form is closed or outside scheduled date range or max submissions reached, displays the custom closed banner.
- **Multi-Section Wizard Layout**:
  - Displays Header Banner Image and Title/Description.
  - Live Progress Bar (X% Complete).
  - Evaluates Logic Branching: When clicking "Next Section", dynamically evaluates the selected option's target section or skips sections according to rules.
  - Client-Side Validation: Checks required fields and custom validation rules (Email, URL, Min/Max length) in real-time, highlighting errors in red.
  - Auto-Grading Engine: On final submission, if `isQuiz` is enabled, calculates points earned vs total points and displays the instant grade report card alongside the custom confirmation message.

---

## 5. Working Logic & Utilities

### 1. Section Branching Evaluator
When a user clicks "Next Section", scan answers in the current section. If an answered question has `enableLogicBranching = true`, grab the selected option's `goToSectionId`:
- If `'SUBMIT'` -> submit form directly.
- If a valid `sectionId` -> jump directly to that section index.
- Otherwise -> advance to the next sequential section.

### 2. Quiz Auto-Grading Evaluator
Iterate through all questions:
- For Multiple Choice / Dropdown: Compare selected option ID against `question.correctAnswer`.
- For Short Answer: Case-insensitive string match.
- For Checkboxes: Check array equality with correct options list.
- Calculate total points and earned points, saving `quizScore` inside the `FormResponse` object.

### 3. CSV Export Utility
Convert all responses into a standard CSV table where columns are Question Titles and rows are individual submission answers. Trigger browser file download (`form_responses.csv`).

---

## 6. Design System & Aesthetics
- Build with a clean, high-contrast, card-based interface inspired by Google Forms & Material Design.
- Use soft rounded corners (`rounded-2xl`), subtle drop shadows (`shadow-xs` / `shadow-md`), and a dominant primary color theme applied to top card borders, buttons, progress bars, and active states.
- Ensure all inputs have clear hover/focus ring states (`focus:ring-2 focus:ring-purple-200`).

---

## 7. Summary of Included Features
1. **Complete Data Schemas**: Full TypeScript interfaces for Forms, Questions, Options, Sections, Settings, Themes, and Responses.
2. **Detailed Component Breakdown**: Complete specification for Navbar, Dashboard, Form Editor, Theme Customizer, Settings View, Send/Share Modal, Response Analytics, and Public Respondent View.
3. **All 14 Question Types**: Detailed requirements for Short Answer, Paragraph, Multiple Choice, Checkboxes, Dropdown, Linear Scale, Rating, Date, Time, Date/Time, File Upload, NPS, Multiple Choice Grid, and Checkbox Grid.
4. **All Advanced Features**:
   - Option-level Logic Branching & Navigation Routing.
   - Response Validation Rules (Email, URL, Contains, Min/Max Length).
   - Quiz Mode Auto-Grading & Points System.
   - Form Scheduling, Auto-Close Date/Time & Max Submissions Limit.
   - Passcode Lock Screen Access Control.
   - QR Code, Short URL, HTML iFrame Embed, & Email Invites.
   - Response Visual Analytics & CSV Export.

````