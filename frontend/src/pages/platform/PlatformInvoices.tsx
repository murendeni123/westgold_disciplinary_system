import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Select from '../../components/Select';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  FileText, 
  Send, 
  Download,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  Calendar,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Mail,
  CreditCard,
  X
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';

interface Invoice {
  id: number;
  invoice_number: string;
  school_id: number;
  school_name: string;
  school_email: string;
  template_id: number;
  template_name: string;
  amount: number;
  currency: string;
  billing_period_start: string;
  billing_period_end: string;
  issue_date: string;
  due_date: string;
  status: string;
  payment_status: string;
  pdf_url: string;
  notes: string;
  sent_at: string;
  paid_at: string;
  created_at: string;
  line_items?: LineItem[];
  payments?: Payment[];
}

interface LineItem {
  id: number;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Payment {
  id: number;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference_number: string;
  notes: string;
}

const PlatformInvoices: React.FC = () => {
  const { success, error, ToastContainer } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');
  const [formData, setFormData] = useState({
    school_id: '',
    template_id: '',
    amount: '',
    billing_period_start: '',
    billing_period_end: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    notes: '',
  });
  const [paymentData, setPaymentData] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer',
    reference_number: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, [statusFilter, schoolFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (schoolFilter) params.school_id = schoolFilter;

      const [invoicesRes, schoolsRes, templatesRes] = await Promise.all([
        api.getInvoices(params),
        api.getPlatformSchools(),
        api.getInvoiceTemplates(),
      ]);

      setInvoices(invoicesRes.data.invoices || []);
      setSchools(schoolsRes.data || []);
      setTemplates(templatesRes.data.templates || []);
    } catch (err: any) {
      error(err.response?.data?.error || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({
      school_id: '',
      template_id: '',
      amount: '',
      billing_period_start: '',
      billing_period_end: '',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: '',
      notes: '',
    });
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createInvoice({
        ...formData,
        school_id: Number(formData.school_id),
        template_id: formData.template_id ? Number(formData.template_id) : null,
        amount: Number(formData.amount),
      });
      success('Invoice created successfully');
      setIsCreateModalOpen(false);
      fetchData();
    } catch (err: any) {
      error(err.response?.data?.error || 'Error creating invoice');
    }
  };

  const handleViewDetails = async (invoice: Invoice) => {
    try {
      const response = await api.getInvoice(invoice.id);
      setSelectedInvoice(response.data.invoice);
      setIsDetailsModalOpen(true);
    } catch (err: any) {
      error(err.response?.data?.error || 'Error fetching invoice details');
    }
  };

  const handleGeneratePDF = async (invoiceId: number) => {
    setGenerating(true);
    try {
      await api.generateInvoicePDF(invoiceId);
      success('PDF generated successfully');
      fetchData();
    } catch (err: any) {
      error(err.response?.data?.error || 'Error generating PDF');
    } finally {
      setGenerating(false);
    }
  };

  const handleSendInvoice = async (invoiceId: number) => {
    setSending(true);
    try {
      await api.sendInvoice(invoiceId);
      success('Invoice sent successfully');
      fetchData();
    } catch (err: any) {
      error(err.response?.data?.error || 'Error sending invoice');
    } finally {
      setSending(false);
    }
  };

  const handleRecordPayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentData({
      amount: invoice.amount.toString(),
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'bank_transfer',
      reference_number: '',
      notes: '',
    });
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    try {
      await api.recordInvoicePayment(selectedInvoice.id, {
        ...paymentData,
        amount: Number(paymentData.amount),
      });
      success('Payment recorded successfully');
      setIsPaymentModalOpen(false);
      fetchData();
    } catch (err: any) {
      error(err.response?.data?.error || 'Error recording payment');
    }
  };

  const handleDelete = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedInvoice) return;

    try {
      await api.deleteInvoice(selectedInvoice.id);
      success('Invoice deleted successfully');
      setIsDeleteModalOpen(false);
      fetchData();
    } catch (err: any) {
      error(err.response?.data?.error || 'Error deleting invoice');
      setIsDeleteModalOpen(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: any = {
      draft: { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: Clock, label: 'Draft' },
      sent: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Mail, label: 'Sent' },
      paid: { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle, label: 'Paid' },
      overdue: { color: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle, label: 'Overdue' },
      cancelled: { color: 'bg-gray-100 text-gray-600 border-gray-200', icon: XCircle, label: 'Cancelled' },
    };
    return configs[status] || configs.draft;
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = !searchQuery || 
      invoice.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.school_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Invoices
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            Manage and track all school invoices
          </p>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={handleCreate}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0 shadow-lg hover:shadow-xl"
          >
            <Plus size={20} className="mr-2" />
            Create Invoice
          </Button>
        </motion.div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-white shadow-xl border border-gray-100 p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 bg-white"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={schoolFilter}
            onChange={(e) => setSchoolFilter(e.target.value)}
            className="px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 bg-white"
          >
            <option value="">All Schools</option>
            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>
          <Button
            onClick={fetchData}
            variant="secondary"
            className="rounded-xl"
          >
            <Filter size={18} className="mr-2" />
            Apply Filters
          </Button>
        </div>
      </motion.div>

      {/* Invoices Table */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full"
          />
        </div>
      ) : filteredInvoices.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-white shadow-xl border border-gray-100 p-12 text-center"
        >
          <FileText size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No invoices found</h3>
          <p className="text-gray-500 mb-6">
            {searchQuery || statusFilter || schoolFilter ? 'Try adjusting your filters' : 'Create your first invoice to get started'}
          </p>
          <Button
            onClick={handleCreate}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0"
          >
            <Plus size={20} className="mr-2" />
            Create Invoice
          </Button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Invoice #</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">School</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Issue Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Due Date</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInvoices.map((invoice, index) => {
                  const statusConfig = getStatusBadge(invoice.status);
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <motion.tr
                      key={invoice.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-medium text-gray-900">
                          {invoice.invoice_number}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-700">{invoice.school_name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900">R{invoice.amount}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                          <StatusIcon size={12} />
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(invoice.issue_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(invoice.due_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleViewDetails(invoice)}
                            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </motion.button>
                          {!invoice.pdf_url && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleGeneratePDF(invoice.id)}
                              disabled={generating}
                              className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                              title="Generate PDF"
                            >
                              <FileText size={16} />
                            </motion.button>
                          )}
                          {invoice.pdf_url && invoice.status === 'draft' && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleSendInvoice(invoice.id)}
                              disabled={sending}
                              className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                              title="Send Invoice"
                            >
                              <Send size={16} />
                            </motion.button>
                          )}
                          {invoice.payment_status !== 'paid' && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleRecordPayment(invoice)}
                              className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100"
                              title="Record Payment"
                            >
                              <CreditCard size={16} />
                            </motion.button>
                          )}
                          {invoice.status === 'draft' && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleDelete(invoice)}
                              className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </motion.button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Create Invoice Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <Modal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            title="Create Invoice"
          >
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleCreateSubmit}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    School *
                  </label>
                  <select
                    value={formData.school_id}
                    onChange={(e) => setFormData({ ...formData, school_id: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  >
                    <option value="">Select School</option>
                    {schools.map((school) => (
                      <option key={school.id} value={school.id}>
                        {school.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template (Optional)
                  </label>
                  <select
                    value={formData.template_id}
                    onChange={(e) => setFormData({ ...formData, template_id: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  >
                    <option value="">No Template</option>
                    {templates.filter(t => t.is_active).map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (ZAR) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    placeholder="0.00"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Issue Date *
                  </label>
                  <input
                    type="date"
                    value={formData.issue_date}
                    onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Billing Period Start
                  </label>
                  <input
                    type="date"
                    value={formData.billing_period_start}
                    onChange={(e) => setFormData({ ...formData, billing_period_start: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Billing Period End
                  </label>
                  <input
                    type="date"
                    value={formData.billing_period_end}
                    onChange={(e) => setFormData({ ...formData, billing_period_end: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0 rounded-xl shadow-lg hover:shadow-xl"
                >
                  Create Invoice
                </Button>
              </div>
            </motion.form>
          </Modal>
        )}
      </AnimatePresence>

      {/* Invoice Details Modal */}
      <AnimatePresence>
        {isDetailsModalOpen && selectedInvoice && (
          <Modal
            isOpen={isDetailsModalOpen}
            onClose={() => setIsDetailsModalOpen(false)}
            title="Invoice Details"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Invoice Number</p>
                  <p className="font-mono font-semibold text-gray-900">{selectedInvoice.invoice_number}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">School</p>
                  <p className="font-semibold text-gray-900">{selectedInvoice.school_name}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Amount</p>
                  <p className="text-xl font-bold text-gray-900">R{selectedInvoice.amount}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  {(() => {
                    const config = getStatusBadge(selectedInvoice.status);
                    const StatusIcon = config.icon;
                    return (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
                        <StatusIcon size={12} />
                        {config.label}
                      </span>
                    );
                  })()}
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Issue Date</p>
                  <p className="font-semibold text-gray-900">{new Date(selectedInvoice.issue_date).toLocaleDateString()}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Due Date</p>
                  <p className="font-semibold text-gray-900">{new Date(selectedInvoice.due_date).toLocaleDateString()}</p>
                </div>
              </div>

              {selectedInvoice.notes && (
                <div className="p-4 bg-blue-50 rounded-xl">
                  <p className="text-xs text-blue-600 font-medium mb-1">Notes</p>
                  <p className="text-sm text-gray-700">{selectedInvoice.notes}</p>
                </div>
              )}

              {selectedInvoice.pdf_url && (
                <div className="flex gap-3">
                  <Button
                    onClick={() => window.open(selectedInvoice.pdf_url, '_blank')}
                    className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 border-0"
                  >
                    <Download size={16} className="mr-2" />
                    Download PDF
                  </Button>
                </div>
              )}
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Record Payment Modal */}
      <AnimatePresence>
        {isPaymentModalOpen && selectedInvoice && (
          <Modal
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            title="Record Payment"
          >
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handlePaymentSubmit}
              className="space-y-6"
            >
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600">Invoice: <span className="font-mono font-semibold">{selectedInvoice.invoice_number}</span></p>
                <p className="text-sm text-gray-600">Amount Due: <span className="font-bold text-gray-900">R{selectedInvoice.amount}</span></p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount Paid *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    value={paymentData.payment_date}
                    onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method *
                  </label>
                  <select
                    value={paymentData.payment_method}
                    onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="cash">Cash</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reference Number
                  </label>
                  <input
                    type="text"
                    value={paymentData.reference_number}
                    onChange={(e) => setPaymentData({ ...paymentData, reference_number: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0 rounded-xl shadow-lg hover:shadow-xl"
                >
                  Record Payment
                </Button>
              </div>
            </motion.form>
          </Modal>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && selectedInvoice && (
          <Modal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            title="Delete Invoice"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-800">
                  Are you sure you want to delete invoice <strong>{selectedInvoice.invoice_number}</strong>?
                </p>
                <p className="text-xs text-red-700 mt-1">
                  This action cannot be undone.
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
                  Delete Invoice
                </Button>
              </div>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlatformInvoices;
