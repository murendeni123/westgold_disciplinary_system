import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import Button from '../../components/Button';
import { motion } from 'framer-motion';
import { Upload, Download, FileSpreadsheet, CheckCircle, XCircle, AlertCircle, ArrowLeft, Sparkles } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'students' | 'teachers' | 'classes'>('students');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string>('');

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
      return ['Student ID', 'First Name', 'Last Name', 'Date of Birth (optional)', 'Grade Level (optional)', 'Class Name (optional)'];
    } else if (activeTab === 'teachers') {
      return ['Email', 'Name', 'Password', 'Employee ID (optional)', 'Phone (optional)'];
    } else {
      return ['Class Name', 'Grade Level (optional)', 'Teacher Email (optional)', 'Academic Year (optional)'];
    }
  };

  return (
    <div className="space-y-8">
      <ToastContainer />
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center space-x-4"
      >
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="secondary"
            onClick={() => navigate(-1)}
            className="rounded-xl"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back
          </Button>
        </motion.div>
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            Bulk Import
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Import multiple records from Excel spreadsheet</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
      >
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {['students', 'teachers', 'classes'].map((tab) => (
              <motion.button
                key={tab}
                onClick={() => {
                  setActiveTab(tab as any);
                  setSelectedFile(null);
                  setResult(null);
                  setError('');
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </motion.button>
            ))}
          </nav>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Instructions */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Instructions</h2>
              <FileSpreadsheet className="text-amber-600" size={24} />
            </div>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Step 1: Download Template</h3>
              <p className="text-sm text-gray-600 mb-3">
                Download the Excel template to see the required format and column structure.
              </p>
              <Button
                variant="secondary"
                onClick={() => handleDownloadTemplate(activeTab)}
                className="w-full"
              >
                <Download size={18} className="mr-2" />
                Download {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Template
              </Button>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Step 2: Fill in Data</h3>
              <p className="text-sm text-gray-600 mb-2">
                Fill in the template with your data. Make sure to:
              </p>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                <li>Keep the header row (first row) as is</li>
                <li>Fill in all required columns</li>
                <li>Optional columns can be left empty</li>
                <li>Do not delete or modify the header row</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Required Columns</h3>
              <div className="bg-gray-50 p-3 rounded-lg">
                <ul className="text-sm text-gray-700 space-y-1">
                  {getExpectedColumns().map((col, idx) => (
                    <li key={idx} className={col.includes('(optional)') ? 'text-gray-500' : 'font-medium'}>
                      {col}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Step 3: Upload File</h3>
              <p className="text-sm text-gray-600">
                Select your filled Excel file and click "Upload" to import the data.
              </p>
            </div>
          </div>
          </motion.div>

          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Upload File</h2>
              <Upload className="text-amber-600" size={24} />
            </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Excel File (.xlsx or .xls)
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition-colors">
                <div className="space-y-1 text-center">
                  <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span>Select a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        accept=".xlsx,.xls"
                        className="sr-only"
                        onChange={handleFileSelect}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">Excel files only (max 10MB)</p>
                </div>
              </div>
              {selectedFile && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <FileSpreadsheet className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-green-800">{selectedFile.name}</span>
                    <span className="ml-auto text-xs text-green-600">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </span>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <XCircle className="h-5 w-5 text-red-600 mr-2" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-lg hover:shadow-xl"
              >
                <Upload size={18} className="mr-2" />
                {uploading ? 'Uploading...' : 'Upload and Import'}
              </Button>
            </motion.div>
          </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Results */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Import Results</h2>
            <Sparkles className="text-amber-600" size={24} />
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Rows</p>
                    <p className="text-2xl font-bold text-gray-900">{result.total}</p>
                  </div>
                  <FileSpreadsheet className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Successful</p>
                    <p className="text-2xl font-bold text-green-600">{result.successful}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Failed</p>
                    <p className="text-2xl font-bold text-red-600">{result.failed}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
              </div>
            </div>

            {result.successful > 0 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      Successfully imported {result.successful} {activeTab}
                    </p>
                    {result.successful > 0 && (
                      <p className="text-xs text-green-600 mt-1">
                        Redirecting to {activeTab} page in 3 seconds...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {result.errors.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                  Errors ({result.errors.length})
                </h4>
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Row
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Error
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {result.errors.map((err, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 text-sm text-gray-900">{err.row}</td>
                          <td className="px-4 py-2 text-sm text-red-600">{err.error}</td>
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
    </div>
  );
};

export default BulkImport;

