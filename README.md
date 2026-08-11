<div align="center">

# 📋 Google Forms Clone

### A full-featured form builder powered by React, TypeScript & Gemini AI

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)

<br/>

> Create forms, collect responses, analyze results, and generate forms using AI — all in the browser. No database required.

<br/>

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🗂️ Form Management
- Dashboard with **grid and list view**
- Search, filter by category, sort by date / name / responses
- **Favorite**, duplicate, soft-delete forms
- **Trash view** — restore or permanently delete
- **Bulk select** — delete or duplicate multiple forms

</td>
<td width="50%">

### ✏️ Form Editor
- **14 question types** — Short Answer, Paragraph, Multiple Choice, Checkboxes, Dropdown, Linear Scale, Rating, Date/Time, File Upload, NPS, Grids & more
- **Drag-and-drop** question reordering
- **Logic branching** — jump to sections based on answers
- **Image attachment** per question
- **Response validation** rules
- **Undo / Redo** — up to 50 states

</td>
</tr>
<tr>
<td width="50%">

### 📊 Reports & Analytics
- **Summary charts** — Pie, Bar, Line charts
- **NPS breakdown** — Detractors / Passives / Promoters
- **Score trend chart** for quiz forms
- Browse **individual submissions**
- **Data table** with search filter
- **Export to CSV** in one click

</td>
<td width="50%">

### 🤖 AI Form Generator
- Describe a form in plain text
- **Gemini AI** builds questions, options, theme & quiz answers instantly
- 6 quick-start prompt suggestions included

</td>
</tr>
<tr>
<td width="50%">

### 📁 Excel / CSV Import
- Upload any `.xlsx`, `.xls`, or `.csv` file
- **Auto-detects question type** from column headers & sample values
- Fully editable field mapping before generating

</td>
<td width="50%">

### 🎨 Theme & Sharing
- **10 color palettes** + custom header images
- Share via **link**, **QR code**, **HTML embed**, or **email**
- **Dark mode** — full coverage, persisted to localStorage

</td>
</tr>
</table>

---

## 🖥️ Tech Stack

| Category | Technology |
|---|---|
| Frontend | React 19, TypeScript 5.8, Tailwind CSS v4 |
| Backend | Express 4 + Vite dev middleware |
| AI | Google Gemini API (`@google/genai`) |
| Charts | Recharts |
| Icons | Lucide React |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Excel Parsing | SheetJS (xlsx) |
| QR Codes | qrcode |
| Build | Vite 6 + esbuild |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18 or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/HiteshPatil2610/google-forms.git

# Move into the project folder
cd google-forms

# Install dependencies
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

> Get a free key at [Google AI Studio](https://aistudio.google.com/app/apikey).
> The app works fully without it — only the AI Form Generator requires the key.

### Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

---

## 📁 Project Structure

```
google-forms/
│
├── server.ts                        # Express server + Gemini AI endpoint
│
├── src/
│   ├── main.tsx                     # React entry point
│   ├── App.tsx                      # Root — state, routing, all handlers
│   ├── types.ts                     # TypeScript interfaces & types
│   ├── index.css                    # Tailwind + global styles
│   │
│   ├── data/
│   │   └── initialData.ts           # Seed forms and sample responses
│   │
│   ├── utils/
│   │   └── storage.ts               # localStorage helpers
│   │
│   └── components/
│       ├── Navbar.tsx               # Header, tabs, undo/redo, dark mode
│       ├── FormManager.tsx          # Dashboard — gallery, grid, list, trash
│       ├── FormEditor.tsx           # Question builder (14 types, DnD)
│       ├── FormRespondent.tsx       # Respondent / preview view
│       ├── FormReport.tsx           # Charts, table, CSV export
│       ├── FormSettingsView.tsx     # Quiz, scheduling, access settings
│       ├── ThemeCustomizer.tsx      # Colors, header image, font style
│       ├── SendModal.tsx            # Link, QR code, embed, email share
│       ├── AiFormGeneratorModal.tsx # Gemini AI form generation
│       └── ExcelImportModal.tsx     # Excel / CSV → form converter
│
├── CHANGELOG.md                     # History of all changes
├── .env.example                     # Environment variable reference
└── package.json
```

---

## 💾 Data Storage

All data is stored in the browser's **localStorage** — no database needed.

| Key | Contents |
|---|---|
| `gforms_clone_forms_v1` | All forms |
| `gforms_clone_responses_v1` | All responses |
| `gforms_clone_submitted_v1` | Per-device submitted form IDs |
| `gforms_clone_last_viewed_v1` | Last-viewed response counts |
| `gforms_clone_dark_mode_v1` | Dark mode preference |

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + Enter` | Add a new question after the active one |
| `Ctrl + Z` | Undo last form change |
| `Ctrl + Y` or `Ctrl + Shift + Z` | Redo |

---

## 📝 License

This project is licensed under the **MIT License**.

---

<div align="center">

Made with ❤️ by [Hitesh Patil](https://github.com/HiteshPatil2610)

</div>
