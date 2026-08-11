# Changelog

---

## 2026-08-11 — Exit Button for Trash View

**Exit trash button** Added a "← Back to Forms" button in the trash page header so users can return to the main dashboard without using the navbar arrow.

---

## 2026-08-11 — 15 Frontend Enhancements

**Trash / Recycle Bin** Full trash view accessible from the dashboard filter bar. Soft-delete moves forms to trash; restore brings them back; permanent delete removes them with their responses. "Empty Trash" button clears everything at once.

**Form sorting** Dropdown in the dashboard controls bar — sort by Last Modified, Date Created, Alphabetical, or Most Responses.

**Bulk actions** Checkbox on each card to select forms. Select-all toggle. Bulk Duplicate and Bulk Delete buttons appear when any forms are selected.

**Drag-and-drop question reordering** Powered by @dnd-kit. Grab the grip handle on any question card and drag it to a new position within the form.

**"Other" option** MC and Checkboxes questions get an "or add 'Other'" button in the editor. Respondents see an "Other" radio/checkbox + a free-text input that appears when selected.

**Image attachment per question** "Image" button in each question footer opens a URL input with a live preview. Stored on the imageUrl field and rendered above the question in respondent view.

**Section inline editing** Section title and description are now editable inputs directly in the purple section header, no separate panel needed.

**Undo / Redo** Up to 50 editor states tracked. Ctrl+Z / Ctrl+Y (or Ctrl+Shift+Z) works globally. Undo/Redo buttons in the navbar are disabled-aware.

**Auto-save indicator** "Saved HH:MM" with a green checkmark appears in the navbar ~600ms after any form change.

**Ctrl+Enter to add question** Works anywhere in the editor — inserts a new question directly after the currently active one.

**Quiz answer feedback** After submitting a quiz, each question shows ✓/✗, points earned, the correct answer if wrong, and the explanation text.

**limitOneResponse enforcement** Uses localStorage to track submitted form IDs per device. Blocked respondents see a "You've already submitted" screen.

**NPS breakdown chart** Dedicated NPS chart with Detractors / Passives / Promoters horizontal bar chart + numeric NPS score + percentage breakdown tiles.

**Avg score trend chart** Quiz forms with >1 response show a LineChart of score % over time with a dashed average reference line.

**Dark mode** Full dark mode across every view and modal. Toggle button (☾/☀) in the navbar. Preference persists to localStorage.
