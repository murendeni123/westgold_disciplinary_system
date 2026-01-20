import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import Button from '../../components/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, Download, FileSpreadsheet, CheckCircle, XCircle, AlertCircle, 
  ArrowLeft, Sparkles, RefreshCw, Plus, Edit, SkipForward, AlertTriangle,
  Layers, Settings, Eye, Play, FileDown, Users, GraduationCap, BookOpen, Calendar
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { useImportProgress } from '../../hooks/useImportProgress';

interface ValidationResult {
  valid: boolean;
  sheets?: Array<{
    name: string;
    rows: Array<any>;
    toCreate: number;
    toUpdate: number;
    toSkip: number;
    errors: number;
  }>;
  summary: {
    totalRows: number;
    toCreate: number;
    toUpdate: number;
    toSkip: number;
    errors: number;
    classesToCreate?: string[];
  };
  rows?: Array<any>;
  errors: Array<{ row: number; sheet?: string; studentId?: string; email?: string; className?: string; error?: string; errors?: string[] }>;
  warnings?: Array<any>;
}

interface ImportResult {
  success: boolean;
  message: string;
  summary: {
    totalProcessed: number;
    created: number;
    updated: number;
    skipped: number;
    failed: number;
    classesCreated?: number;
    batchesProcessed?: number;
  };
  details: Array<any>;
  errors: Array<{ row: number; sheet?: string; error: string }>;
  classesCreated?: string[];
}

type ImportMode = 'create' | 'update' | 'upsert';
type ImportType = 'students' | 'teachers' | 'classes';
type ImportStep = 'select' | 'validate' | 'review' | 'import' | 'complete';

const BulkImportV2: React.FC = () => {
  const navigate = useNavigate();
  const { success, error: showError, ToastContainer } = useToast();
  const { progress, resetProgress } = useImportProgress();
  
  // State
  const [activeTab, setActiveTab] = useState<ImportType>('students');
  const [step, setStep] = useState<ImportStep>('select');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mode, setMode] = useState<ImportMode>('upsert');
  const [autoCreateClasses, setAutoCreateClasses] = useState(true);
  const [useSheetNames, setUseSheetNames] = useState(true);
  const [academicYear, setAcademicYear] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    return month >= 6 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  });
  
  // Generate academic year options
  const academicYearOptions = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => {
      const year = currentYear - 2 + i;
      return `${year}-${year + 1}`;
    });
  }, []);
  
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string>('');

  const resetState = () => {
    setSelectedFile(null);
    setStep('select');
    setValidation(null);
    setResult(null);
    setError('');
    resetProgress();
  };

  const handleTabChange = (tab: ImportType) => {
    setActiveTab(tab);
    resetState();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validExtensions = ['.xlsx', '.xls'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (!validExtensions.includes(fileExtension)) {
        setError('Invalid file type. Please select an Excel file (.xlsx or .xls)');
        setSelectedFile(null);
        return;
      }
      
      setSelectedFile(file);
      setError('');
      setValidation(null);
      setResult(null);
      setStep('validate');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      let response;
      if (activeTab === 'students') {
        response = await api.downloadStudentsTemplateV2();
      } else if (activeTab === 'teachers') {
        response = await api.downloadTeachersTemplateV2();
      } else {
        response = await api.downloadClassesTemplateV2();
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${activeTab}_template.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      success('Template downloaded!');
    } catch (err: any) {
      console.error('Error downloading template:', err);
      showError('Error downloading template');
    }
  };

  const handleValidate = async () => {
    if (!selectedFile) return;

    setValidating(true);
    setError('');

    try {
      let response;
      if (activeTab === 'students') {
        response = await api.validateStudentsImport(selectedFile);
      } else if (activeTab === 'teachers') {
        response = await api.validateTeachersImport(selectedFile);
      } else {
        response = await api.validateClassesImport(selectedFile);
      }

      setValidation(response.data);
      setStep('review');
    } catch (err: any) {
      console.error('Validation error:', err);
      setError(err.response?.data?.error || 'Validation failed');
      showError('Validation failed');
    } finally {
      setValidating(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setImporting(true);
    setError('');
    setStep('import');

    try {
      let response;
      if (activeTab === 'students') {
        response = await api.importStudentsV2(selectedFile, { mode, autoCreateClasses, useSheetNames, academicYear });
      } else if (activeTab === 'teachers') {
        response = await api.importTeachersV2(selectedFile, { mode });
      } else {
        response = await api.importClassesV2(selectedFile, { mode, academicYear });
      }

      setResult(response.data);
      setStep('complete');
      
      if (response.data.summary.created > 0 || response.data.summary.updated > 0) {
        success(response.data.message);
      }
    } catch (err: any) {
      console.error('Import error:', err);
      setError(err.response?.data?.error || 'Import failed');
      showError('Import failed');
      setStep('review');
    } finally {
      setImporting(false);
    }
  };

  const handleExportErrors = async () => {
    if (!result?.errors || result.errors.length === 0) return;

    try {
      const response = await api.exportImportErrors(result.errors, activeTab);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `import_errors_${activeTab}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      success('Error report downloaded!');
    } catch (err: any) {
      showError('Failed to export errors');
    }
  };

  const getTabIcon = (tab: ImportType) => {
    switch (tab) {
      case 'students': return <Users size={18} />;
      case 'teachers': return <GraduationCap size={18} />;
      case 'classes': return <BookOpen size={18} />;
    }
  };

  const getModeDescription = (m: ImportMode) => {
    switch (m) {
      case 'create': return 'Only add new records, skip existing';
      case 'update': return 'Only update existing records, skip new';
      case 'upsert': return 'Add new AND update existing (recommended)';
    }
  };

  return (
    <div className="space-y-6">
      <ToastContainer />
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center space-x-4">
          <Button variant="secondary" onClick={() => navigate(-1)} className="rounded-xl">
            <ArrowLeft size={20} className="mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Smart Import
            </h1>
            <p className="text-gray-600 mt-1">Import with validation, upsert, and auto-create</p>
          </div>
        </div>
        
        {/* Step Indicator */}
        <div className="hidden md:flex items-center space-x-2">
          {['select', 'validate', 'review', 'import', 'complete'].map((s, idx) => (
            <React.Fragment key={s}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                step === s ? 'bg-indigo-600 text-white' :
                ['select', 'validate', 'review', 'import', 'complete'].indexOf(step) > idx 
                  ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {['select', 'validate', 'review', 'import', 'complete'].indexOf(step) > idx ? (
                  <CheckCircle size={16} />
                ) : idx + 1}
              </div>
              {idx < 4 && <div className={`w-8 h-0.5 ${
                ['select', 'validate', 'review', 'import', 'complete'].indexOf(step) > idx 
                  ? 'bg-green-500' : 'bg-gray-200'
              }`} />}
            </React.Fragment>
          ))}
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex space-x-2 bg-gray-100 p-1 rounded-xl w-fit"
      >
        {(['students', 'teachers', 'classes'] as ImportType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === tab
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {getTabIcon(tab)}
            <span className="capitalize">{tab}</span>
          </button>
        ))}
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - File & Options */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-1 space-y-4"
        >
          {/* File Upload Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Upload File</h3>
              <FileSpreadsheet className="text-indigo-600" size={20} />
            </div>

            <div className="space-y-4">
              <div 
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 ${
                  selectedFile ? 'border-green-400 bg-green-50' : 'border-gray-300'
                }`}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <input
                  id="file-upload"
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                {selectedFile ? (
                  <div className="space-y-2">
                    <CheckCircle className="mx-auto h-10 w-10 text-green-500" />
                    <p className="font-medium text-green-700">{selectedFile.name}</p>
                    <p className="text-sm text-green-600">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="mx-auto h-10 w-10 text-gray-400" />
                    <p className="text-sm text-gray-600">Click to select Excel file</p>
                    <p className="text-xs text-gray-400">.xlsx or .xls (max 10MB)</p>
                  </div>
                )}
              </div>

              <Button
                variant="secondary"
                onClick={handleDownloadTemplate}
                className="w-full"
              >
                <Download size={16} className="mr-2" />
                Download Template
              </Button>
            </div>
          </div>

          {/* Import Options Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Import Options</h3>
              <Settings className="text-indigo-600" size={20} />
            </div>

            <div className="space-y-4">
              {/* Mode Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Import Mode</label>
                <div className="space-y-2">
                  {(['upsert', 'create', 'update'] as ImportMode[]).map((m) => (
                    <label
                      key={m}
                      className={`flex items-start p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        mode === m ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="mode"
                        value={m}
                        checked={mode === m}
                        onChange={() => setMode(m)}
                        className="mt-0.5 text-indigo-600"
                      />
                      <div className="ml-3">
                        <div className="flex items-center space-x-2">
                          {m === 'create' && <Plus size={14} className="text-green-600" />}
                          {m === 'update' && <Edit size={14} className="text-blue-600" />}
                          {m === 'upsert' && <RefreshCw size={14} className="text-purple-600" />}
                          <span className="font-medium capitalize">{m}</span>
                          {m === 'upsert' && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Recommended</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{getModeDescription(m)}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Student-specific options */}
              {activeTab === 'students' && (
                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoCreateClasses}
                      onChange={(e) => setAutoCreateClasses(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Auto-create classes</span>
                      <p className="text-xs text-gray-500">Create missing classes automatically</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useSheetNames}
                      onChange={(e) => setUseSheetNames(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Use sheet names as classes</span>
                      <p className="text-xs text-gray-500">Assign students to class based on sheet name</p>
                    </div>
                  </label>
                </div>
              )}

              {/* Academic Year Selector - for students and classes */}
              {(activeTab === 'students' || activeTab === 'classes') && (
                <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-center space-x-2 mb-3">
                    <Calendar size={18} className="text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Academic Year</span>
                  </div>
                  <select
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full px-3 py-2 border border-blue-200 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {academicYearOptions.map(yr => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                  <p className="text-xs text-blue-600 mt-2">
                    Classes will be created/linked for this academic year
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            {step === 'validate' && (
              <Button
                onClick={handleValidate}
                disabled={!selectedFile || validating}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-0"
              >
                {validating ? (
                  <>
                    <RefreshCw size={16} className="mr-2 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <Eye size={16} className="mr-2" />
                    Validate File
                  </>
                )}
              </Button>
            )}

            {step === 'review' && validation && (
              <>
                <Button
                  onClick={handleImport}
                  disabled={importing || (validation.summary.errors > 0 && validation.summary.toCreate === 0 && validation.summary.toUpdate === 0)}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0"
                >
                  <Play size={16} className="mr-2" />
                  Start Import
                </Button>
                <Button
                  variant="secondary"
                  onClick={resetState}
                  className="w-full"
                >
                  Cancel
                </Button>
              </>
            )}

            {step === 'complete' && (
              <>
                <Button
                  onClick={() => navigate(`/admin/${activeTab}`)}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-0"
                >
                  View {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </Button>
                <Button
                  variant="secondary"
                  onClick={resetState}
                  className="w-full"
                >
                  Import More
                </Button>
              </>
            )}
          </div>
        </motion.div>

        {/* Right Panel - Preview/Results */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <AnimatePresence mode="wait">
            {/* Initial State */}
            {step === 'select' && (
              <motion.div
                key="select"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center"
              >
                <Layers className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Select a File to Begin</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Upload an Excel file with your {activeTab} data. Use the template for the correct format.
                </p>
                
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                  <div className="p-4 bg-green-50 rounded-xl">
                    <Plus className="h-8 w-8 text-green-600 mb-2" />
                    <h4 className="font-medium text-green-800">Create New</h4>
                    <p className="text-sm text-green-600">Add records that don't exist</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <Edit className="h-8 w-8 text-blue-600 mb-2" />
                    <h4 className="font-medium text-blue-800">Update Existing</h4>
                    <p className="text-sm text-blue-600">Modify existing records</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-xl">
                    <RefreshCw className="h-8 w-8 text-purple-600 mb-2" />
                    <h4 className="font-medium text-purple-800">Upsert (Sync)</h4>
                    <p className="text-sm text-purple-600">Create + Update combined</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Validate State */}
            {step === 'validate' && (
              <motion.div
                key="validate"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center"
              >
                <FileSpreadsheet className="mx-auto h-16 w-16 text-indigo-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">File Ready</h3>
                <p className="text-gray-500 mb-6">
                  Click "Validate File" to preview what will be imported
                </p>
                
                <div className="bg-gray-50 rounded-xl p-4 inline-block">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">{selectedFile?.name}</span>
                    <span className="text-gray-400 ml-2">({(selectedFile?.size || 0 / 1024).toFixed(1)} KB)</span>
                  </p>
                </div>
              </motion.div>
            )}

            {/* Review State */}
            {step === 'review' && validation && (
              <motion.div
                key="review"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
              >
                {/* Summary Header */}
                <div className="p-6 bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                  <h3 className="text-xl font-semibold mb-4">Validation Preview</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-white/20 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold">{validation.summary.totalRows}</p>
                      <p className="text-xs opacity-80">Total Rows</p>
                    </div>
                    <div className="bg-white/20 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-green-200">{validation.summary.toCreate}</p>
                      <p className="text-xs opacity-80">To Create</p>
                    </div>
                    <div className="bg-white/20 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-blue-200">{validation.summary.toUpdate}</p>
                      <p className="text-xs opacity-80">To Update</p>
                    </div>
                    <div className="bg-white/20 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-yellow-200">{validation.summary.toSkip || 0}</p>
                      <p className="text-xs opacity-80">To Skip</p>
                    </div>
                    <div className="bg-white/20 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-red-200">{validation.summary.errors}</p>
                      <p className="text-xs opacity-80">Errors</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {/* Classes to Create */}
                  {validation.summary.classesToCreate && validation.summary.classesToCreate.length > 0 && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                        <span className="font-medium text-amber-800">Classes to Auto-Create</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {validation.summary.classesToCreate.map((cls, idx) => (
                          <span key={idx} className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-sm">
                            {cls}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Errors */}
                  {validation.errors.length > 0 && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <XCircle className="h-5 w-5 text-red-600" />
                          <span className="font-medium text-red-800">Errors ({validation.errors.length})</span>
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {validation.errors.slice(0, 10).map((err, idx) => (
                          <div key={idx} className="flex items-start space-x-2 text-sm">
                            <span className="text-red-600 font-mono">Row {err.row}:</span>
                            <span className="text-red-700">
                              {Array.isArray(err.errors) ? err.errors.join(', ') : err.error}
                            </span>
                          </div>
                        ))}
                        {validation.errors.length > 10 && (
                          <p className="text-sm text-red-600 italic">
                            ...and {validation.errors.length - 10} more errors
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Ready to Import */}
                  {validation.valid && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-800">Ready to import!</span>
                      </div>
                      <p className="text-sm text-green-600 mt-1">
                        All validations passed. Click "Start Import" to proceed.
                      </p>
                    </div>
                  )}

                  {/* Partial Import Warning */}
                  {!validation.valid && (validation.summary.toCreate > 0 || validation.summary.toUpdate > 0) && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        <span className="font-medium text-yellow-800">Partial import available</span>
                      </div>
                      <p className="text-sm text-yellow-600 mt-1">
                        Some rows have errors, but {validation.summary.toCreate + validation.summary.toUpdate} valid rows can still be imported.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Importing State with Real-time Progress */}
            {step === 'import' && (
              <motion.div
                key="import"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8"
              >
                <div className="text-center mb-6">
                  <RefreshCw className="mx-auto h-16 w-16 text-indigo-500 animate-spin mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    {progress?.status === 'processing' ? 'Processing...' : 'Starting Import...'}
                  </h3>
                  <p className="text-gray-500">
                    {progress?.message || 'Please wait while we process your data'}
                  </p>
                </div>

                {/* Progress Bar */}
                {progress && progress.status === 'processing' && (
                  <div className="space-y-4">
                    <div className="relative pt-1">
                      <div className="flex mb-2 items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-100">
                            Batch {progress.currentBatch} of {progress.totalBatches}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold inline-block text-indigo-600">
                            {progress.percent}%
                          </span>
                        </div>
                      </div>
                      <div className="overflow-hidden h-3 text-xs flex rounded-full bg-indigo-100">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress.percent}%` }}
                          transition={{ duration: 0.3 }}
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-indigo-500 to-purple-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-2xl font-bold text-gray-700">{progress.processed || 0}</p>
                        <p className="text-xs text-gray-500">Rows Processed</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-2xl font-bold text-gray-700">{progress.total || 0}</p>
                        <p className="text-xs text-gray-500">Total Rows</p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Complete State */}
            {step === 'complete' && result && (
              <motion.div
                key="complete"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
              >
                {/* Success Header */}
                <div className={`p-6 ${result.summary.failed > 0 ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-green-500 to-emerald-500'} text-white`}>
                  <div className="flex items-center space-x-3 mb-4">
                    {result.summary.failed > 0 ? (
                      <AlertTriangle className="h-8 w-8" />
                    ) : (
                      <CheckCircle className="h-8 w-8" />
                    )}
                    <h3 className="text-xl font-semibold">Import Complete</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-white/20 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold">{result.summary.totalProcessed}</p>
                      <p className="text-xs opacity-80">Processed</p>
                    </div>
                    <div className="bg-white/20 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold">{result.summary.created}</p>
                      <p className="text-xs opacity-80">Created</p>
                    </div>
                    <div className="bg-white/20 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold">{result.summary.updated}</p>
                      <p className="text-xs opacity-80">Updated</p>
                    </div>
                    <div className="bg-white/20 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold">{result.summary.skipped}</p>
                      <p className="text-xs opacity-80">Skipped</p>
                    </div>
                    <div className="bg-white/20 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold">{result.summary.failed}</p>
                      <p className="text-xs opacity-80">Failed</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {/* Classes Created */}
                  {result.classesCreated && result.classesCreated.length > 0 && (
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                      <div className="flex items-center space-x-2 mb-2">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                        <span className="font-medium text-purple-800">Classes Auto-Created</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {result.classesCreated.map((cls, idx) => (
                          <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm">
                            {cls}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Success Message */}
                  {(result.summary.created > 0 || result.summary.updated > 0) && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-800">{result.message}</span>
                      </div>
                    </div>
                  )}

                  {/* Errors with Export */}
                  {result.errors.length > 0 && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <XCircle className="h-5 w-5 text-red-600" />
                          <span className="font-medium text-red-800">Failed Rows ({result.errors.length})</span>
                        </div>
                        <Button
                          variant="secondary"
                          onClick={handleExportErrors}
                          className="text-sm py-1 px-3"
                        >
                          <FileDown size={14} className="mr-1" />
                          Export Errors
                        </Button>
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {result.errors.slice(0, 5).map((err, idx) => (
                          <div key={idx} className="flex items-start space-x-2 text-sm">
                            <span className="text-red-600 font-mono">Row {err.row}:</span>
                            <span className="text-red-700">{err.error}</span>
                          </div>
                        ))}
                        {result.errors.length > 5 && (
                          <p className="text-sm text-red-600 italic">
                            ...and {result.errors.length - 5} more. Download error report for full list.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl"
            >
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-800">{error}</span>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default BulkImportV2;
