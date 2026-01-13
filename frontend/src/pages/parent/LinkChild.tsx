import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { api } from '../../services/api';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Modal from '../../components/Modal';
import { 
  Link as LinkIcon, 
  CheckCircle, 
  AlertCircle, 
  QrCode,
  Copy,
  Info,
  Sparkles
} from 'lucide-react';

const LinkChild: React.FC = () => {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [linkCode, setLinkCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [linkedChild, setLinkedChild] = useState<any>(null);
  const [, ] = useState(false);

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const response = await api.linkChild(linkCode);
      // Refresh user data to get the newly linked child
      await refreshProfile();
      setLinkedChild(response.data.student);
      setSuccess(true);
      setLinkCode('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid link code. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = () => {
    // QR code scanning would be implemented here
    // For now, show a message that it's coming soon
    alert('QR code scanning coming soon! Please enter the link code manually.');
  };

  const handleCopyCode = () => {
    if (linkCode) {
      navigator.clipboard.writeText(linkCode);
      alert('Link code copied to clipboard!');
    }
  };

  const handleContinue = () => {
    setSuccess(false);
    setLinkedChild(null);
    navigate('/parent/children');
  };

  const handleLinkAnother = () => {
    setSuccess(false);
    setLinkedChild(null);
    setLinkCode('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Link Your Child</h1>
        <p className="text-gray-600 mt-2">Connect your account to your child's school record</p>
      </div>

      {/* Success Modal */}
      <Modal
        isOpen={success}
        onClose={handleContinue}
        title="Child Linked Successfully!"
        size="md"
      >
        <div className="text-center py-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="text-green-600" size={40} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Success!</h3>
          {linkedChild && (
            <p className="text-gray-600 mb-4">
              You've successfully linked <strong>{linkedChild.first_name} {linkedChild.last_name}</strong> to your account.
            </p>
          )}
          <div className="flex space-x-3 mt-6">
            <Button
              variant="secondary"
              onClick={handleLinkAnother}
              className="flex-1"
            >
              Link Another Child
            </Button>
            <Button
              onClick={handleContinue}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              View Children
            </Button>
          </div>
        </div>
      </Modal>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Link Form */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center space-x-2 mb-6">
              <div className="p-2 bg-purple-100 rounded-lg">
                <LinkIcon className="text-purple-600" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Enter Link Code</h2>
                <p className="text-sm text-gray-600">Use the code provided by your child's school</p>
              </div>
            </div>

            <form onSubmit={handleLink} className="space-y-4">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg flex items-start space-x-3">
                  <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Error</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Link Code
                </label>
                <div className="relative">
                  <Input
                    value={linkCode}
                    onChange={(e) => setLinkCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
                    required
                    placeholder="Enter link code (e.g., LINK0001)"
                    className="font-mono text-lg tracking-wider pr-20"
                    maxLength={20}
                  />
                  {linkCode && (
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700"
                      title="Copy code"
                    >
                      <Copy size={18} />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleQRScan}
                  className="flex-1"
                >
                  <QrCode size={20} className="mr-2" />
                  Scan QR Code
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !linkCode.trim()}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Linking...
                    </>
                  ) : (
                    <>
                      <LinkIcon size={20} className="mr-2" />
                      Link Child
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>

          {/* Instructions */}
          <Card className="mt-6">
            <div className="flex items-start space-x-3">
              <Info className="text-blue-600 flex-shrink-0 mt-1" size={20} />
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">How to Get Your Link Code</h3>
                <ol className="space-y-2 text-sm text-gray-600 list-decimal list-inside">
                  <li>Contact your child's school administrator</li>
                  <li>Request a parent link code for your child</li>
                  <li>Enter the code above to connect your account</li>
                  <li>Once linked, you'll see all your child's information</li>
                </ol>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Note:</strong> Each child has a unique link code. If you have multiple children, 
                    you'll need to link each one separately.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Help Sidebar */}
        <div className="space-y-6">
          <Card>
            <div className="flex items-center space-x-2 mb-4">
              <Sparkles className="text-yellow-600" size={20} />
              <h3 className="font-semibold text-gray-900">Quick Tips</h3>
            </div>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start space-x-2">
                <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                <span>Link codes are case-insensitive</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                <span>You can link multiple children</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                <span>Codes are unique to each child</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                <span>Contact school if code doesn't work</span>
              </li>
            </ul>
          </Card>

          <Card>
            <h3 className="font-semibold text-gray-900 mb-3">What Happens Next?</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-900">Link Your Child</p>
                  <p>Enter the code to connect</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-900">View Dashboard</p>
                  <p>See your child's overview</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium text-gray-900">Start Tracking</p>
                  <p>Monitor attendance and behavior</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LinkChild;

