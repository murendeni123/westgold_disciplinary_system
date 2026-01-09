import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Modal from '../../components/Modal';
import { 
  Building2, 
  CheckCircle, 
  AlertCircle, 
  Info,
  Sparkles,
  Check,
  X
} from 'lucide-react';

const LinkSchool: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshUser, updateUser } = useAuth();
  const [schoolCode, setSchoolCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [linkedSchool, setLinkedSchool] = useState<any>(null);
  const [linkedSchools, setLinkedSchools] = useState<any[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [switchingSchool, setSwitchingSchool] = useState<number | null>(null);

  useEffect(() => {
    fetchLinkedSchools();
  }, [user]);

  const fetchLinkedSchools = async () => {
    try {
      setLoadingSchools(true);
      const response = await api.getLinkedSchools();
      setLinkedSchools(response.data);
    } catch (error) {
      console.error('Error fetching linked schools:', error);
      // If API doesn't exist yet, get schools from children
      if (user?.children && user.children.length > 0) {
        const uniqueSchools = new Map<number, any>();
        user.children.forEach((child: any) => {
          if (child.school_id && !uniqueSchools.has(child.school_id)) {
            uniqueSchools.set(child.school_id, {
              id: child.school_id,
              name: child.school_name || `School ${child.school_id}`,
            });
          }
        });
        setLinkedSchools(Array.from(uniqueSchools.values()));
      }
    } finally {
      setLoadingSchools(false);
    }
  };

  const handleLinkByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const response = await api.linkSchoolByCode(schoolCode);
      setLinkedSchool(response.data.school);
      setSuccess(true);
      setSchoolCode('');
      
      // Update auth user with new school_id so UI reacts immediately
      if (user && response.data?.school?.id) {
        const updatedUser = { ...(user as any), school_id: response.data.school.id } as any;
        updateUser(updatedUser);
      }

      // Refresh user data and linked schools from server
      await refreshUser();
      await fetchLinkedSchools();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid school code. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchSchool = async (schoolId: number) => {
    if (schoolId === user?.school_id) {
      return; // Already on this school
    }

    if (!user) {
      return;
    }

    setSwitchingSchool(schoolId);
    try {
      await api.switchSchool(schoolId);
      
      // Update user context
      const updatedUser = { ...user, school_id: schoolId };
      updateUser(updatedUser);
      
      // Refresh page data
      await refreshUser();
      window.location.reload();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error switching school');
    } finally {
      setSwitchingSchool(null);
    }
  };

  const handleContinue = () => {
    setSuccess(false);
    setLinkedSchool(null);
    fetchLinkedSchools();
  };

  const getCurrentSchool = () => {
    if (!user?.school_id) return null;
    return linkedSchools.find(s => s.id === user.school_id);
  };

  const currentSchool = getCurrentSchool();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Link to School</h1>
        <p className="text-gray-600 mt-2">Connect your account to your child's school using a school code</p>
      </div>

      {/* Success Modal */}
      <Modal
        isOpen={success}
        onClose={handleContinue}
        title="School Linked Successfully!"
        size="md"
      >
        <div className="text-center py-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="text-green-600" size={40} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Success!</h3>
          {linkedSchool && (
            <p className="text-gray-600 mb-4">
              You've successfully linked to <strong>{linkedSchool.name}</strong>.
            </p>
          )}
          <p className="text-sm text-gray-500 mb-6">
            You can now link your children using their link codes.
          </p>
          <Button
            onClick={handleContinue}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Continue
          </Button>
        </div>
      </Modal>

      {/* Link School Form */}
      <Card>
        <div className="flex items-center space-x-2 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Building2 className="text-blue-600" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Link to School</h2>
            <p className="text-sm text-gray-600">Enter the school code provided by the school administrator</p>
          </div>
        </div>

        <form onSubmit={handleLinkByCode} className="space-y-4">
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
              School Code
            </label>
            <Input
              value={schoolCode}
              onChange={(e) => setSchoolCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
              required
              placeholder="Enter school code (e.g., SCH001)"
              className="font-mono text-lg tracking-wider"
              maxLength={20}
            />
          </div>

          <Button
            type="submit"
            disabled={loading || !schoolCode.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Linking...
              </>
            ) : (
              <>
                <Building2 size={20} className="mr-2" />
                Link to School
              </>
            )}
          </Button>
        </form>
      </Card>

      {/* Linked Schools List */}
      {loadingSchools ? (
        <Card>
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </Card>
      ) : linkedSchools.length > 0 ? (
        <Card>
          <div className="flex items-center space-x-2 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Building2 className="text-purple-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Your Linked Schools</h2>
              <p className="text-sm text-gray-600">Switch between schools to view different information</p>
            </div>
          </div>

          <div className="space-y-3">
            {linkedSchools.map((school) => {
              const isCurrent = school.id === user?.school_id;
              const isSwitching = switchingSchool === school.id;

              return (
                <div
                  key={school.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isCurrent
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className={`p-2 rounded-lg ${
                        isCurrent ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <Building2 
                          className={isCurrent ? 'text-blue-600' : 'text-gray-600'} 
                          size={20} 
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{school.name}</h3>
                        {school.email && (
                          <p className="text-sm text-gray-600">{school.email}</p>
                        )}
                      </div>
                      {isCurrent && (
                        <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 rounded-full">
                          <Check size={16} className="text-blue-600" />
                          <span className="text-sm font-medium text-blue-700">Current</span>
                        </div>
                      )}
                    </div>
                    {!isCurrent && (
                      <Button
                        onClick={() => handleSwitchSchool(school.id)}
                        disabled={isSwitching}
                        variant="secondary"
                        className="ml-4"
                      >
                        {isSwitching ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                            Switching...
                          </>
                        ) : (
                          'Switch'
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {linkedSchools.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Building2 size={48} className="mx-auto mb-4 text-gray-400" />
              <p>No schools linked yet</p>
              <p className="text-sm mt-2">Link a school using the form above</p>
            </div>
          )}
        </Card>
      ) : (
        <Card>
          <div className="text-center py-12">
            <Building2 size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Schools Linked</h3>
            <p className="text-gray-600 mb-4">
              Link your first school using the form above to get started.
            </p>
          </div>
        </Card>
      )}

      {/* Help Section */}
      <Card>
        <div className="flex items-start space-x-3">
          <Info className="text-blue-600 flex-shrink-0 mt-1" size={20} />
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">How to Get Your School Code</h3>
            <ol className="space-y-2 text-sm text-gray-600 list-decimal list-inside">
              <li>Contact your child's school administrator</li>
              <li>Request the school code for your child's school</li>
              <li>Enter the code in the form above to link your account</li>
              <li>After linking, you can switch between schools if you have children in multiple schools</li>
              <li>You can then link your children using their individual link codes</li>
            </ol>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Note:</strong> Linking to a school allows you to access school-specific features. 
                You can link to multiple schools if your children attend different schools. 
                Use the "Switch" button to change which school you're currently viewing.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LinkSchool;
