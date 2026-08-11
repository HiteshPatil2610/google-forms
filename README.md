# Google Forms Clone

A full-featured Google Forms clone built with React, TypeScript, and Tailwind CSS. Create forms, collect responses, analyze results, and generate forms using AI — all in the browser.

---

## Features

### Form Management
- Create forms from blank, templates, or AI prompt
- Dashboard with grid and list view
- Search, filter by category, sort by date / alphabetical / most responses
- Favorite, duplicate, and soft-delete forms
- Trash view with restore and permanent delete
- Bulk select — duplicate or delete multiple forms at once

### Form Editor
- 14 question types — Short Answer, Paragraph, Multiple Choice, Checkboxes, Dropdown, Linear Scale, Rating, Date, Time, Date & Time, File Upload, NPS, Multiple Choice Grid, Checkbox Grid
- Drag-and-drop question reordering
- Add sections with inline title and description editing
- Logic branching — jump to a section based on answer
- Image attachment per question
- Response validation rules (email, URL, min/max length, contains)
- "Other" option for Multiple Choice and Checkboxes
- Quiz mode — set point values and correct answers per question
- `Ctrl+Enter` to add a new question, `Ctrl+Z` / `Ctrl+Y` for undo/redo
- Auto-save indicator in the navbar

### Form Respondent View
- Progress bar for multi-section forms
- Passcode-protected access
- Schedule open and close dates
- Max submissions limit
- One-response-per-device enforcement
- Quiz score display + per-question answer feedback with explanations

### Reports & Analytics
- Summary charts — Pie for Multiple Choice, Bar for Checkboxes and Ratings
- NPS breakdown — Detractors / Passives / Promoters chart + NPS score
- Score trend chart for quiz forms
- Browse individual submissions
- Data table with search filter
- Export all responses to CSV

### AI Form Generator
- Describe a form in plain text and Gemini AI builds it instantly
- Generates questions, options, theme colors, and quiz answers automatically
- Powered by Google Gemini (`gemini-2.0-flash`)

### Excel / CSV Import
- Upload any `.xlsx`, `.xls`, or `.csv` file
- Column headers become form questions automatically
- Auto-detects question type from header name and sample values
- Fully editable before generating the form

### Theme & Sharing
- 10 preset color palettes + custom header images
- Font style selector
- Share via link, QR code, HTML embed, or email invite

### Dark Mode
- Full dark mode across every view and modal
- Toggle with the ☾/☀ button in the navbar
- Preference saved to localStorage

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Tailwind CSS v4 |
| Backend | Express 4 + Vite dev middleware |
| AI | Google Gemini API (`@google/genai`) |
| Charts | Recharts |
| Icons | Lucide React |
| Drag & Drop | @dnd-kit/core, @dnd-kit/sortable |
| Excel Parsing | SheetJS (xlsx) |
| QR Codes | qrcode |
| Build | Vite 6 + esbuild |

---

## Getting Started

### Prerequisites
- Node.js 18+

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/google-forms.git
cd google-forms

# Install dependencies
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Get a free API key at [Google AI Studio](https://aistudio.google.com/app/apikey).

> The app works fully without the API key — only the AI Form Generator feature requires it.

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

---

## Project Structure

```
google-forms/
├── server.ts                  # Express server + Gemini AI endpoint
├── src/
│   ├── main.tsx               # React entry point
│   ├── App.tsx                # Root component — state, routing, handlers
│   ├── types.ts               # All TypeScript interfaces and types
│   ├── index.css              # Tailwind imports + global styles
│   ├── data/
│   │   └── initialData.ts     # Seed forms and responses
│   ├── utils/
│   │   └── storage.ts         # localStorage read/write helpers
│   └── components/
│       ├── Navbar.tsx              # Sticky header, tabs, undo/redo, dark mode
│       ├── FormManager.tsx         # Dashboard — template gallery, forms grid/list
│       ├── FormEditor.tsx          # Question builder with all 14 question types
│       ├── FormRespondent.tsx      # Respondent/preview view
│       ├── FormReport.tsx          # Analytics — charts, table, individual responses
│       ├── FormSettingsView.tsx    # Quiz, scheduling, access control settings
│       ├── ThemeCustomizer.tsx     # Color palette, header image, font style drawer
│       ├── SendModal.tsx           # Share via link, QR code, embed, email
│       ├── AiFormGeneratorModal.tsx # Gemini AI form generation
│       └── ExcelImportModal.tsx    # Excel/CSV to form converter
├── CHANGELOG.md               # History of all changes made to the project
├── .env.example               # Environment variable reference
└── package.json
```

---

## Data Storage

All form data and responses are stored in the browser's **localStorage** — no database required. On first load, three example forms with sample responses are seeded automatically.

| Key | Contents |
|---|---|
| `gforms_clone_forms_v1` | All forms |
| `gforms_clone_responses_v1` | All responses |
| `gforms_clone_submitted_v1` | Submitted form IDs (for limitOneResponse) |
| `gforms_clone_last_viewed_v1` | Last-viewed response counts (for new badges) |
| `gforms_clone_dark_mode_v1` | Dark mode preference |

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Enter` | Add a new question after the active one |
| `Ctrl+Z` | Undo last form change |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Redo |

---

## License

MIT
