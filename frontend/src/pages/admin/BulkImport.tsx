import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  ArrowLeft, 
  Users,
  GraduationCap,
  BookOpen,
  FileUp,
  Info,
  Trash2,
  RefreshCw,
  ChevronRight
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';

interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
  created: Array<any>;
}

const BulkImport: React.FC = () => {
  const navigate = useNavigate();
  const { success, error: showError, ToastContainer } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'students' | 'teachers' | 'classes'>('students');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

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
      setResult(null);
    }
  };

  const handleDownloadTemplate = async (type: 'students' | 'teachers' | 'classes') => {
    try {
      let response;
      if (type === 'students') {
        response = await api.downloadStudentsTemplate();
      } else if (type === 'teachers') {
        response = await api.downloadTeachersTemplate();
      } else {
        response = await api.downloadClassesTemplate();
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_template.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error downloading template:', error);
      showError('Error downloading template: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      showError('Please select a file first');
      return;
    }

    setUploading(true);
    setError('');
    setResult(null);

    try {
      let response;
      if (activeTab === 'students') {
        response = await api.bulkImportStudents(selectedFile);
      } else if (activeTab === 'teachers') {
        response = await api.bulkImportTeachers(selectedFile);
      } else {
        response = await api.bulkImportClasses(selectedFile);
      }

      setResult(response.data.results);
      
      if (response.data.results.successful > 0) {
        success(`Successfully imported ${response.data.results.successful} ${activeTab}!`);
        setTimeout(() => {
          if (activeTab === 'students') {
            navigate('/admin/students');
          } else if (activeTab === 'teachers') {
            navigate('/admin/teachers');
          } else {
            navigate('/admin/classes');
          }
        }, 3000);
      } else {
        showError('No records were imported. Please check your file format.');
      }
    } catch (err: any) {
      console.error('Error uploading file:', err);
      const errorMsg = err.response?.data?.error || 'Error uploading file. Please check the file format and try again.';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const getExpectedColumns = () => {
    if (activeTab === 'students') {
      return [
        { name: 'Student ID', required: true },
        { name: 'First Name', required: true },
        { name: 'Last Name', required: true },
        { name: 'Date of Birth', required: false },
        { name: 'Grade Level', required: false },
        { name: 'Class Name', required: false }
      ];
    } else if (activeTab === 'teachers') {
      return [
        { name: 'Email', required: true },
        { name: 'Name', required: true },
        { name: 'Password', required: true },
        { name: 'Employee ID', required: false },
        { name: 'Phone', required: false }
      ];
    } else {
      return [
        { name: 'Class Name', required: true },
        { name: 'Grade Level', required: false },
        { name: 'Teacher Email', required: false },
        { name: 'Academic Year', required: false }
      ];
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
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
      setResult(null);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setError('');
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const tabs = [
    { id: 'students', label: 'Students', icon: GraduationCap, color: 'blue' },
    { id: 'teachers', label: 'Teachers', icon: Users, color: 'emerald' },
    { id: 'classes', label: 'Classes', icon: BookOpen, color: 'purple' }
  ];

  const getTabColor = () => {
    switch (activeTab) {
      case 'students': return { bg: 'from-blue-500 to-indigo-600', light: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-500', ring: 'ring-blue-500' };
      case 'teachers': return { bg: 'from-emerald-500 to-teal-600', light: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-500', ring: 'ring-emerald-500' };
      case 'classes': return { bg: 'from-purple-500 to-indigo-600', light: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-500', ring: 'ring-purple-500' };
      default: return { bg: 'from-blue-500 to-indigo-600', light: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-500', ring: 'ring-blue-500' };
    }
  };

  const colors = getTabColor();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6 lg:p-8">
      <ToastContainer />
      
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              className="p-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 bg-gradient-to-br ${colors.bg} rounded-xl shadow-lg`}>
                  <FileUp className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
                  Bulk Import
                </h1>
              </div>
              <p className="text-gray-500">
                Import multiple records from Excel spreadsheets
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tab Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-4 mb-8"
      >
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setActiveTab(tab.id as any);
                setSelectedFile(null);
                setResult(null);
                setError('');
              }}
              className={`relative p-5 rounded-2xl border-2 transition-all ${
                isActive 
                  ? `bg-white shadow-lg ${tab.color === 'blue' ? 'border-blue-500' : tab.color === 'emerald' ? 'border-emerald-500' : 'border-purple-500'}` 
                  : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${
                  isActive 
                    ? tab.color === 'blue' ? 'bg-blue-50' : tab.color === 'emerald' ? 'bg-emerald-50' : 'bg-purple-50'
                    : 'bg-gray-50'
                }`}>
                  <Icon className={`w-5 h-5 ${
                    isActive 
                      ? tab.color === 'blue' ? 'text-blue-600' : tab.color === 'emerald' ? 'text-emerald-600' : 'text-purple-600'
                      : 'text-gray-400'
                  }`} />
                </div>
                <span className={`font-semibold ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                  {tab.label}
                </span>
              </div>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full ${
                    tab.color === 'blue' ? 'bg-blue-500' : tab.color === 'emerald' ? 'bg-emerald-500' : 'bg-purple-500'
                  }`}
                />
              )}
            </motion.button>
          );
        })}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Instructions Panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className={`bg-gradient-to-r ${colors.bg} px-6 py-4`}>
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-white" />
              <h2 className="text-lg font-bold text-white">How to Import {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
            </div>
          </div>
          <div className="p-6 space-y-6">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full ${colors.light} ${colors.text} flex items-center justify-center font-bold text-sm`}>
                1
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">Download Template</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Get the Excel template with the correct column structure.
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleDownloadTemplate(activeTab)}
                  className={`flex items-center gap-2 px-4 py-2.5 ${colors.light} ${colors.text} rounded-xl font-medium hover:opacity-80 transition-all`}
                >
                  <Download size={18} />
                  Download Template
                </motion.button>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full ${colors.light} ${colors.text} flex items-center justify-center font-bold text-sm`}>
                2
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">Fill in Your Data</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Add your data to the template following these guidelines:
                </p>
                <ul className="text-sm text-gray-600 space-y-1.5">
                  <li className="flex items-start gap-2">
                    <CheckCircle size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                    Keep the header row unchanged
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                    Fill all required columns
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                    Optional columns can be left empty
                  </li>
                </ul>
              </div>
            </div>

            {/* Required Columns */}
            <div className="flex gap-4">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full ${colors.light} ${colors.text} flex items-center justify-center font-bold text-sm`}>
                <FileSpreadsheet size={16} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">Column Reference</h3>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="space-y-2">
                    {getExpectedColumns().map((col, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className={col.required ? 'font-medium text-gray-900' : 'text-gray-500'}>
                          {col.name}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          col.required 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {col.required ? 'Required' : 'Optional'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full ${colors.light} ${colors.text} flex items-center justify-center font-bold text-sm`}>
                3
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">Upload & Import</h3>
                <p className="text-sm text-gray-600">
                  Select your filled Excel file and click upload to import all records.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Upload Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className={`bg-gradient-to-r ${colors.bg} px-6 py-4`}>
            <div className="flex items-center gap-3">
              <Upload className="w-5 h-5 text-white" />
              <h2 className="text-lg font-bold text-white">Upload Excel File</h2>
            </div>
          </div>
          <div className="p-6 space-y-6">
            {/* Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                isDragging 
                  ? `${colors.border} ${colors.light}` 
                  : selectedFile 
                    ? 'border-emerald-300 bg-emerald-50' 
                    : 'border-gray-200 hover:border-gray-300 bg-gray-50'
              }`}
            >
              <input
                ref={fileInputRef}
                id="file-upload"
                type="file"
                accept=".xlsx,.xls"
                className="sr-only"
                onChange={handleFileSelect}
              />
              
              {selectedFile ? (
                <div className="space-y-3">
                  <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-2xl flex items-center justify-center">
                    <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={clearFile}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 text-sm font-medium"
                  >
                    <Trash2 size={14} />
                    Remove File
                  </motion.button>
                </div>
              ) : (
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="space-y-3">
                    <div className={`w-16 h-16 mx-auto ${colors.light} rounded-2xl flex items-center justify-center`}>
                      <Upload className={`w-8 h-8 ${colors.text}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        Drop your file here, or <span className={colors.text}>browse</span>
                      </p>
                      <p className="text-sm text-gray-500 mt-1">Supports .xlsx and .xls files</p>
                    </div>
                  </div>
                </label>
              )}
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 bg-red-50 border border-red-200 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Upload Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-white font-semibold transition-all ${
                !selectedFile || uploading
                  ? 'bg-gray-300 cursor-not-allowed'
                  : `bg-gradient-to-r ${colors.bg} shadow-lg hover:shadow-xl`
              }`}
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Upload and Import {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Results Section */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          >
            <div className={`bg-gradient-to-r ${result.successful > 0 ? 'from-emerald-500 to-teal-600' : 'from-red-500 to-rose-600'} px-6 py-4`}>
              <div className="flex items-center gap-3">
                {result.successful > 0 ? (
                  <CheckCircle className="w-5 h-5 text-white" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-white" />
                )}
                <h2 className="text-lg font-bold text-white">Import Results</h2>
              </div>
            </div>
            <div className="p-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Rows</p>
                      <p className="text-2xl font-bold text-gray-900">{result.total}</p>
                    </div>
                    <FileSpreadsheet className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Successful</p>
                      <p className="text-2xl font-bold text-emerald-600">{result.successful}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                  </div>
                </div>
                <div className="bg-red-50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Failed</p>
                      <p className="text-2xl font-bold text-red-600">{result.failed}</p>
                    </div>
                    <XCircle className="w-8 h-8 text-red-600" />
                  </div>
                </div>
              </div>

              {/* Success Message */}
              {result.successful > 0 && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl mb-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="font-medium text-emerald-800">
                        Successfully imported {result.successful} {activeTab}!
                      </p>
                      <p className="text-sm text-emerald-600 mt-1">
                        Redirecting to {activeTab} page in 3 seconds...
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate(`/admin/${activeTab}`)}
                      className="ml-auto flex items-center gap-1 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
                    >
                      Go Now
                      <ChevronRight size={16} />
                    </motion.button>
                  </div>
                </div>
              )}

              {/* Errors Table */}
              {result.errors.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <h4 className="font-semibold text-gray-900">
                      Errors ({result.errors.length})
                    </h4>
                  </div>
                  <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-xl">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                            Row
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                            Error Message
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {result.errors.map((err, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{err.row}</td>
                            <td className="px-4 py-3 text-sm text-red-600">{err.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BulkImport;

