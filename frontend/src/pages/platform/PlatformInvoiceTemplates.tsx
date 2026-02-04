import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Upload, 
  FileText, 
  Trash2, 
  Edit, 
  Star,
  StarOff,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';

interface Template {
  id: number;
  name: string;
  description: string;
  template_file_url: string;
  template_type: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

const PlatformInvoiceTemplates: React.FC = () => {
  const { success, error, ToastContainer } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_default: false,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.getInvoiceTemplates();
      setTemplates(response.data.templates || []);
    } catch (err: any) {
      error(err.response?.data?.error || 'Error fetching templates');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = () => {
    setFormData({ name: '', description: '', is_default: false });
    setSelectedFile(null);
    setIsUploadModalOpen(true);
  };

  const handleEdit = (template: Template) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      is_default: template.is_default,
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (template: Template) => {
    setSelectedTemplate(template);
    setIsDeleteModalOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['application/pdf', 'text/html', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        error('Invalid file type. Only PDF, HTML, and DOCX are allowed.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        error('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      error('Please select a file');
      return;
    }

    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('template', selectedFile);
      uploadFormData.append('name', formData.name);
      uploadFormData.append('description', formData.description);
      uploadFormData.append('is_default', String(formData.is_default));

      await api.uploadInvoiceTemplate(uploadFormData);
      success('Template uploaded successfully');
      setIsUploadModalOpen(false);
      fetchTemplates();
    } catch (err: any) {
      error(err.response?.data?.error || 'Error uploading template');
    } finally {
      setUploading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    setUploading(true);
    try {
      await api.updateInvoiceTemplate(selectedTemplate.id, formData);
      success('Template updated successfully');
      setIsEditModalOpen(false);
      fetchTemplates();
    } catch (err: any) {
      error(err.response?.data?.error || 'Error updating template');
    } finally {
      setUploading(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedTemplate) return;

    try {
      await api.deleteInvoiceTemplate(selectedTemplate.id);
      success('Template deleted successfully');
      setIsDeleteModalOpen(false);
      fetchTemplates();
    } catch (err: any) {
      error(err.response?.data?.error || 'Error deleting template');
      setIsDeleteModalOpen(false);
    }
  };

  const handleSetDefault = async (templateId: number) => {
    try {
      await api.setDefaultInvoiceTemplate(templateId);
      success('Default template updated');
      fetchTemplates();
    } catch (err: any) {
      error(err.response?.data?.error || 'Error setting default template');
    }
  };

  const getFileIcon = (type: string) => {
    if (type === 'pdf') return '📄';
    if (type === 'html') return '🌐';
    if (type === 'docx') return '📝';
    return '📁';
  };

  return (
    <div className="space-y-8">
      <ToastContainer />
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Invoice Templates
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            Manage invoice templates for automated billing
          </p>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={handleUpload}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl"
          >
            <Upload size={20} className="mr-2" />
            Upload Template
          </Button>
        </motion.div>
      </motion.div>

      {/* Templates Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full"
          />
        </div>
      ) : templates.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-white shadow-xl border border-gray-100 p-12 text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
            <FileText size={40} className="text-indigo-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No templates yet</h3>
          <p className="text-gray-500 mb-6">Upload your first invoice template to get started</p>
          <Button
            onClick={handleUpload}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0"
          >
            <Upload size={20} className="mr-2" />
            Upload Template
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all"
            >
              {/* Header */}
              <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-b border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{getFileIcon(template.template_type)}</div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{template.name}</h3>
                      <p className="text-sm text-gray-500">{template.template_type.toUpperCase()}</p>
                    </div>
                  </div>
                  {template.is_default && (
                    <span className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full">
                      DEFAULT
                    </span>
                  )}
                </div>
                {template.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
                )}
              </div>

              {/* Status */}
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Status</span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    template.is_active 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {template.is_active ? (
                      <>
                        <CheckCircle size={12} />
                        Active
                      </>
                    ) : (
                      <>
                        <XCircle size={12} />
                        Inactive
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 bg-white">
                <div className="grid grid-cols-2 gap-2">
                  {!template.is_default && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSetDefault(template.id)}
                      className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors text-sm font-medium"
                    >
                      <Star size={14} />
                      Set Default
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleEdit(template)}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors text-sm font-medium"
                  >
                    <Edit size={14} />
                    Edit
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => window.open(template.template_file_url, '_blank')}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-sm font-medium"
                  >
                    <Eye size={14} />
                    View
                  </motion.button>
                  {!template.is_default && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleDelete(template)}
                      className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-sm font-medium"
                    >
                      <Trash2 size={14} />
                      Delete
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Uploaded {new Date(template.created_at).toLocaleDateString()}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <Modal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            title="Upload Invoice Template"
          >
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleUploadSubmit}
              className="space-y-6"
            >
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="text-sm text-blue-800 font-medium">Supported Formats</p>
                    <p className="text-xs text-blue-700 mt-1">
                      PDF, HTML, or DOCX files up to 10MB. Templates should include placeholders for dynamic data.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Monthly Invoice Template"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Brief description of this template"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template File *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-indigo-400 transition-colors">
                  <input
                    type="file"
                    accept=".pdf,.html,.docx"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="template-upload"
                  />
                  <label htmlFor="template-upload" className="cursor-pointer">
                    <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                    {selectedFile ? (
                      <p className="text-sm text-gray-700 font-medium">{selectedFile.name}</p>
                    ) : (
                      <>
                        <p className="text-sm text-gray-600">Click to upload template</p>
                        <p className="text-xs text-gray-400 mt-1">PDF, HTML, or DOCX (max 10MB)</p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <label htmlFor="is_default" className="text-sm text-gray-700">
                  Set as default template
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0 rounded-xl shadow-lg hover:shadow-xl"
                >
                  {uploading ? 'Uploading...' : 'Upload Template'}
                </Button>
              </div>
            </motion.form>
          </Modal>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditModalOpen && selectedTemplate && (
          <Modal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            title="Edit Template"
          >
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleEditSubmit}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all resize-none"
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <input
                  type="checkbox"
                  id="edit_is_default"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <label htmlFor="edit_is_default" className="text-sm text-gray-700">
                  Set as default template
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={uploading}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0 rounded-xl shadow-lg hover:shadow-xl"
                >
                  {uploading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </motion.form>
          </Modal>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && selectedTemplate && (
          <Modal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            title="Delete Template"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="text-sm text-red-800 font-medium">
                      Are you sure you want to delete this template?
                    </p>
                    <p className="text-xs text-red-700 mt-1">
                      This action cannot be undone. The template file will be permanently deleted.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-700">
                  <strong>Template:</strong> {selectedTemplate.name}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Type: {selectedTemplate.template_type.toUpperCase()}
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={confirmDelete}
                  className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 rounded-xl shadow-lg hover:shadow-xl"
                >
                  Delete Template
                </Button>
              </div>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlatformInvoiceTemplates;
