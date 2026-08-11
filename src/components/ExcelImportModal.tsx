import React, { useState, useRef } from 'react';
import { FileSpreadsheet, X, Upload, Check, AlertCircle, ArrowRight, Table, Layers, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Form, Question, QuestionType, Option } from '../types';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFormGenerated: (newForm: Form) => void;
}

interface ParsedColumn {
  id: string;
  originalHeader: string;
  questionTitle: string;
  type: QuestionType;
  options: string[];
  required: boolean;
  included: boolean;
  sampleValues: string[];
  validationType?: 'EMAIL' | 'URL' | 'NUMBER';
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onFormGenerated,
}) => {
  const [step, setStep] = useState<'CHOICE' | 'MAPPING'>('CHOICE');
  const [file, setFile] = useState<File | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [parsedColumns, setParsedColumns] = useState<ParsedColumn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setStep('CHOICE');
    setFile(null);
    setFormTitle('');
    setFormDescription('');
    setParsedColumns([]);
    setLoading(false);
    setError(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  // Helper to infer question type from header name and sample data values
  const inferColumnType = (header: string, sampleVals: string[]): { type: QuestionType; options: string[]; validationType?: 'EMAIL' | 'URL' | 'NUMBER' } => {
    const lowerHeader = header.toLowerCase();

    // Specific keyword checks
    if (lowerHeader.includes('email') || lowerHeader.includes('e-mail')) {
      return { type: 'SHORT_ANSWER', options: [], validationType: 'EMAIL' };
    }
    if (lowerHeader.includes('url') || lowerHeader.includes('website') || lowerHeader.includes('link')) {
      return { type: 'SHORT_ANSWER', options: [], validationType: 'URL' };
    }
    if (lowerHeader.includes('date') || lowerHeader.includes('dob') || lowerHeader.includes('birthday') || lowerHeader.includes('joined')) {
      return { type: 'DATE', options: [] };
    }
    if (lowerHeader.includes('time')) {
      return { type: 'TIME', options: [] };
    }
    if (
      lowerHeader.includes('feedback') ||
      lowerHeader.includes('comment') ||
      lowerHeader.includes('description') ||
      lowerHeader.includes('address') ||
      lowerHeader.includes('notes') ||
      lowerHeader.includes('review')
    ) {
      return { type: 'PARAGRAPH', options: [] };
    }
    if (lowerHeader.includes('rating') || lowerHeader.includes('star')) {
      return { type: 'RATING', options: [] };
    }
    if (lowerHeader.includes('nps') || lowerHeader.includes('recommend')) {
      return { type: 'NPS', options: [] };
    }

    // Inspect sample values
    const cleanSamples = sampleVals.map((v) => String(v).trim()).filter(Boolean);
    if (cleanSamples.length === 0) {
      return { type: 'SHORT_ANSWER', options: [] };
    }

    // Check if values look like paragraphs
    const avgLength = cleanSamples.reduce((acc, curr) => acc + curr.length, 0) / cleanSamples.length;
    if (avgLength > 50) {
      return { type: 'PARAGRAPH', options: [] };
    }

    // Check for distinct options (Multiple Choice or Dropdown)
    const uniqueVals = Array.from(new Set(cleanSamples));
    
    // Check if boolean / binary choice
    if (uniqueVals.length >= 2 && uniqueVals.length <= 6) {
      return {
        type: 'MULTIPLE_CHOICE',
        options: uniqueVals,
      };
    }

    if (uniqueVals.length > 6 && uniqueVals.length <= 12) {
      return {
        type: 'DROPDOWN',
        options: uniqueVals,
      };
    }

    // Check numeric
    const isAllNumeric = cleanSamples.every((v) => !isNaN(Number(v)));
    if (isAllNumeric) {
      const numVals = cleanSamples.map(Number);
      const min = Math.min(...numVals);
      const max = Math.max(...numVals);
      if (min >= 1 && max <= 5 && uniqueVals.length <= 5) {
        return { type: 'RATING', options: [] };
      }
      if (min >= 1 && max <= 10 && uniqueVals.length <= 10) {
        return { type: 'LINEAR_SCALE', options: [] };
      }
      return { type: 'SHORT_ANSWER', options: [], validationType: 'NUMBER' };
    }

    return { type: 'SHORT_ANSWER', options: [] };
  };

  // Process selected file
  const processFile = async (uploadedFile: File) => {
    if (!uploadedFile) return;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];
    
    const isSpreadsheet = validTypes.includes(uploadedFile.type) ||
      uploadedFile.name.endsWith('.xlsx') ||
      uploadedFile.name.endsWith('.xls') ||
      uploadedFile.name.endsWith('.csv');

    if (!isSpreadsheet) {
      setError('Please upload a valid Excel (.xlsx, .xls) or CSV (.csv) file.');
      return;
    }

    setLoading(true);
    setError(null);
    setFile(uploadedFile);

    // Auto-generate Form Title from file name
    const rawName = uploadedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    const cleanedTitle = rawName.charAt(0).toUpperCase() + rawName.slice(1) + ' Form';
    setFormTitle(cleanedTitle);
    setFormDescription(`Auto-generated form based on fields from ${uploadedFile.name}`);

    try {
      const buffer = await uploadedFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('No sheets found in the uploaded workbook.');
      }

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // Convert sheet to array of arrays
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (rows.length === 0 || !rows[0] || rows[0].length === 0) {
        throw new Error('The uploaded file appears to be empty or has no header row.');
      }

      const headers: string[] = rows[0].map((h, i) => (h ? String(h).trim() : `Column ${i + 1}`));
      const dataRows = rows.slice(1, 20); // sample up to 20 rows

      const columns: ParsedColumn[] = headers.map((headerText, colIdx) => {
        const sampleVals = dataRows
          .map((row) => (row[colIdx] !== undefined && row[colIdx] !== null ? String(row[colIdx]) : ''))
          .filter(Boolean);

        const inferred = inferColumnType(headerText, sampleVals);

        return {
          id: `col-${colIdx}-${Date.now()}`,
          originalHeader: headerText,
          questionTitle: headerText,
          type: inferred.type,
          options: inferred.options.length > 0 ? inferred.options : ['Option 1', 'Option 2'],
          required: false,
          included: true,
          sampleValues: sampleVals.slice(0, 3),
          validationType: inferred.validationType,
        };
      });

      setParsedColumns(columns);
      setStep('MAPPING');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to parse Excel file. Please check file format.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Generate Form
  const handleGenerateForm = () => {
    const includedCols = parsedColumns.filter((c) => c.included && c.questionTitle.trim());

    if (includedCols.length === 0) {
      setError('Please select at least one column/field to include in your form.');
      return;
    }

    const formId = `form-excel-${Date.now()}`;
    const secId = `sec-excel-${Date.now()}`;

    const questions: Question[] = includedCols.map((col, idx) => {
      const qId = `q-excel-${idx}-${Date.now()}`;
      const question: Question = {
        id: qId,
        sectionId: secId,
        type: col.type,
        title: col.questionTitle,
        description: `Imported from spreadsheet field: "${col.originalHeader}"`,
        required: col.required,
      };

      if (['MULTIPLE_CHOICE', 'CHECKBOXES', 'DROPDOWN'].includes(col.type)) {
        question.options = col.options.map((opt, oIdx) => ({
          id: `opt-${qId}-${oIdx}`,
          text: opt,
        }));
      }

      if (col.type === 'LINEAR_SCALE') {
        question.scaleMin = 1;
        question.scaleMax = 10;
        question.scaleMinLabel = 'Low';
        question.scaleMaxLabel = 'High';
      }

      if (col.type === 'RATING') {
        question.scaleMin = 1;
        question.scaleMax = 5;
      }

      if (col.type === 'NPS') {
        question.scaleMin = 0;
        question.scaleMax = 10;
        question.scaleMinLabel = 'Not likely';
        question.scaleMaxLabel = 'Extremely likely';
      }

      if (col.validationType === 'EMAIL') {
        question.validation = {
          type: 'TEXT',
          rule: 'EMAIL',
          customErrorText: 'Please enter a valid email address',
        };
      } else if (col.validationType === 'URL') {
        question.validation = {
          type: 'TEXT',
          rule: 'URL',
          customErrorText: 'Please enter a valid URL',
        };
      }

      return question;
    });

    const newForm: Form = {
      id: formId,
      title: formTitle || 'Imported Excel Form',
      description: formDescription || 'Form automatically structured from uploaded Excel spreadsheet.',
      category: 'Work',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      theme: {
        primaryColor: '#0284c7', // Sky / Emerald theme for data
        backgroundColor: '#f0f9ff',
        fontStyle: 'Roboto',
      },
      settings: {
        isQuiz: false,
        releaseGradesImmediately: true,
        allowResponseEditing: true,
        limitOneResponse: false,
        showProgressBar: true,
        shuffleQuestionOrder: false,
        confirmationMessage: 'Thank you! Your response has been recorded.',
        acceptingResponses: true,
        closedMessage: 'This form is no longer accepting responses.',
      },
      sections: [
        {
          id: secId,
          title: 'Imported Data Fields',
          description: 'Questions generated from your Excel spreadsheet columns.',
        },
      ],
      questions,
    };

    onFormGenerated(newForm);
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col relative border border-emerald-100 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-emerald-600 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Import Form from Excel / CSV</h3>
              <p className="text-xs text-emerald-100">
                Automatically generate questions based on your spreadsheet columns
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {step === 'CHOICE' ? (
            <div className="space-y-6">
              <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-4 text-xs text-emerald-900 leading-relaxed">
                <strong>How it works:</strong> Do you have an Excel or CSV file where you want to store or organize your form data? Upload your file here, and we will automatically convert its column headers into matching form questions!
              </div>

              {/* Upload Zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-emerald-300 hover:border-emerald-600 bg-emerald-50/30 hover:bg-emerald-50 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv"
                  className="hidden"
                />
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-semibold text-gray-800 mb-1">
                  Click to upload or drag & drop Excel / CSV file
                </h4>
                <p className="text-xs text-gray-500 mb-3">
                  Supports .xlsx, .xls, and .csv formats
                </p>
                <span className="text-xs font-semibold px-3 py-1 bg-emerald-600 text-white rounded-full">
                  Browse Files
                </span>
              </div>

              {loading && (
                <div className="flex items-center justify-center space-x-2 text-sm text-emerald-700 font-medium py-4">
                  <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  <span>Parsing Excel file and detecting columns...</span>
                </div>
              )}
            </div>
          ) : (
            /* STEP 2: FIELD MAPPING & PREVIEW */
            <div className="space-y-5">
              <div className="flex items-center justify-between bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-900">
                  <Table className="w-4 h-4 text-emerald-600" />
                  <span>File Loaded: {file?.name}</span>
                </div>
                <button
                  onClick={handleReset}
                  className="text-xs font-medium text-emerald-700 hover:text-emerald-900 underline"
                >
                  Change File
                </button>
              </div>

              {/* Form Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Form Title
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  />
                </div>
              </div>

              {/* Column Mapping List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Detected Questions ({parsedColumns.filter((c) => c.included).length} of {parsedColumns.length} selected)
                  </h4>
                  <div className="space-x-2 text-xs">
                    <button
                      onClick={() =>
                        setParsedColumns(parsedColumns.map((c) => ({ ...c, included: true })))
                      }
                      className="text-emerald-700 hover:underline"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() =>
                        setParsedColumns(parsedColumns.map((c) => ({ ...c, included: false })))
                      }
                      className="text-gray-500 hover:underline"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {parsedColumns.map((col, idx) => (
                    <div
                      key={col.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        col.included
                          ? 'bg-white border-emerald-200 shadow-2xs'
                          : 'bg-gray-50 border-gray-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={col.included}
                          onChange={(e) => {
                            const updated = [...parsedColumns];
                            updated[idx].included = e.target.checked;
                            setParsedColumns(updated);
                          }}
                          className="mt-1 h-4 w-4 text-emerald-600 rounded-xs border-gray-300 focus:ring-emerald-500"
                        />

                        <div className="flex-1 space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <input
                              type="text"
                              value={col.questionTitle}
                              onChange={(e) => {
                                const updated = [...parsedColumns];
                                updated[idx].questionTitle = e.target.value;
                                setParsedColumns(updated);
                              }}
                              placeholder="Question title"
                              className="font-medium text-xs text-gray-900 border border-gray-200 rounded-md px-2 py-1 w-full sm:w-2/3 focus:border-emerald-500"
                            />

                            <select
                              value={col.type}
                              onChange={(e) => {
                                const updated = [...parsedColumns];
                                updated[idx].type = e.target.value as QuestionType;
                                setParsedColumns(updated);
                              }}
                              className="text-xs bg-gray-50 border border-gray-200 rounded-md px-2 py-1 font-semibold text-gray-700 focus:border-emerald-500"
                            >
                              <option value="SHORT_ANSWER">Short Answer</option>
                              <option value="PARAGRAPH">Paragraph</option>
                              <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                              <option value="CHECKBOXES">Checkboxes</option>
                              <option value="DROPDOWN">Dropdown</option>
                              <option value="RATING">Rating (Stars)</option>
                              <option value="LINEAR_SCALE">Linear Scale</option>
                              <option value="NPS">NPS (0-10)</option>
                              <option value="DATE">Date</option>
                              <option value="TIME">Time</option>
                            </select>
                          </div>

                          {/* Extra info / sample values */}
                          <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                            <span className="truncate max-w-xs">
                              Original Excel Col: <code className="bg-gray-100 px-1 py-0.5 rounded text-emerald-800">{col.originalHeader}</code>
                            </span>

                            <label className="flex items-center space-x-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={col.required}
                                onChange={(e) => {
                                  const updated = [...parsedColumns];
                                  updated[idx].required = e.target.checked;
                                  setParsedColumns(updated);
                                }}
                                className="h-3 w-3 text-emerald-600 rounded-xs"
                              />
                              <span className="text-[10px] text-gray-600 font-medium">Required</span>
                            </label>
                          </div>

                          {col.sampleValues.length > 0 && (
                            <div className="text-[10px] text-gray-400 bg-gray-50 p-1.5 rounded-md border border-gray-100 truncate">
                              Sample values: {col.sampleValues.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 p-4 border-t border-gray-200 flex items-center justify-between shrink-0">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-200/60 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>

          {step === 'MAPPING' && (
            <button
              onClick={handleGenerateForm}
              className="flex items-center space-x-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              <span>Generate Form ({parsedColumns.filter((c) => c.included).length} Questions)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
