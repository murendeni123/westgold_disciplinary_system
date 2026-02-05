import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { api, axiosInstance } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap, 
  Link as LinkIcon, 
  Users, 
  Bell, 
  Calendar, 
  Award,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Building2,
  Loader2,
  Sparkles
} from 'lucide-react';

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [hasSchool, setHasSchool] = useState(false);
  const [hasChild, setHasChild] = useState(false);
  
  // School linking state
  const [schoolCode, setSchoolCode] = useState('');
  const [linkingSchool, setLinkingSchool] = useState(false);
  const [schoolError, setSchoolError] = useState('');
  const [showSchoolSuccess, setShowSchoolSuccess] = useState(false);
  const [linkedSchoolName, setLinkedSchoolName] = useState('');
  
  // Child linking state
  const [childLinkCode, setChildLinkCode] = useState('');
  const [linkingChild, setLinkingChild] = useState(false);
  const [childError, setChildError] = useState('');
  const [showChildSuccess, setShowChildSuccess] = useState(false);
  const [linkedChildName, setLinkedChildName] = useState('');

  useEffect(() => {
    checkProgress();
  }, [user]);

  const checkProgress = async () => {
    // Check if user has linked a school
    if (user?.school_id) {
      setHasSchool(true);
    }
    
    // Check if user has linked at least one child
    if (user?.children && user.children.length > 0) {
      setHasChild(true);
    }
  };

  const handleLinkSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setSchoolError('');
    
    if (!schoolCode.trim()) {
      setSchoolError('Please enter a school code');
      return;
    }
    
    setLinkingSchool(true);
    
    try {
      const response = await api.linkSchoolByCode(schoolCode.trim().toUpperCase());
      
      // Update localStorage with school context
      if (response.data?.school) {
        localStorage.setItem('schoolId', response.data.school.id.toString());
        localStorage.setItem('schoolName', response.data.school.name);
        localStorage.setItem('schoolCode', response.data.school.code);
        localStorage.setItem('schemaName', response.data.school.schema_name);
      }
      
      // Refresh user data to get updated school info
      await refreshUser();
      
      // Force update localStorage to ensure user data is persisted
      const updatedUserResponse = await axiosInstance.get('/auth/me');
      if (updatedUserResponse.data.user) {
        localStorage.setItem('user', JSON.stringify(updatedUserResponse.data.user));
      }
      
      setHasSchool(true);
      setLinkedSchoolName(response.data?.school?.name || 'School');
      setSchoolCode('');
      setShowSchoolSuccess(true);
      setTimeout(() => setShowSchoolSuccess(false), 3000);
    } catch (err: any) {
      setSchoolError(err.response?.data?.error || 'Failed to link school. Please check the code and try again.');
    } finally {
      setLinkingSchool(false);
    }
  };

  const handleLinkChild = async () => {
    if (!childLinkCode.trim()) {
      setChildError('Please enter a link code');
      return;
    }
    
    setLinkingChild(true);
    
    try {
      const response = await api.linkChild(childLinkCode.trim().toUpperCase());
      
      // Refresh user data to get updated children list
      await refreshUser();
      
      // Force update localStorage to ensure user data is persisted
      const updatedUserResponse = await axiosInstance.get('/auth/me');
      if (updatedUserResponse.data.user) {
        localStorage.setItem('user', JSON.stringify(updatedUserResponse.data.user));
      }
      
      setHasChild(true);
      setLinkedChildName(response.data?.child?.name || 'Child');
      setChildLinkCode('');
      setShowChildSuccess(true);
      setTimeout(() => setShowChildSuccess(false), 3000);
    } catch (err: any) {
      setChildError(err.response?.data?.error || 'Failed to link child. Please check the code and try again.');
    } finally {
      setLinkingChild(false);
    }
  };

  const steps = [
    {
      id: 0,
      title: 'Welcome to DMS Parent Portal',
      icon: GraduationCap,
      description: 'Your one-stop portal to track your child\'s progress, attendance, and behavior at school.',
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
              <GraduationCap className="text-blue-600" size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome, {user?.name}!</h2>
            <p className="text-gray-600 text-lg mb-4">
              We're excited to have you join our parent portal. This quick setup will help you get started in just a few minutes.
            </p>
            <p className="text-gray-700 font-medium">
              Let's begin by linking your school, then your child, and we'll show you around!
            </p>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mt-6">
            <p className="text-sm font-semibold text-gray-900 mb-3">
              What you'll be able to do:
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center space-x-2">
                <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
                <span>View your child's attendance records in real-time</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
                <span>Track behavior incidents and merits</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
                <span>Receive instant notifications about important updates</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
                <span>Communicate directly with teachers and administrators</span>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 1,
      title: 'Link Your School',
      icon: Building2,
      description: 'Connect your account to your child\'s school using a school code.',
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full mb-4">
              <Building2 className="text-purple-600" size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Link Your School</h3>
            <p className="text-gray-600">
              First, we need to connect your account to your child's school. You'll need a school code from the school administrator.
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 space-y-3">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <p className="font-semibold text-gray-900">Get Your School Code</p>
                <p className="text-sm text-gray-600">Contact your child's school administrator to receive a unique school code.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <p className="font-semibold text-gray-900">Enter the Code</p>
                <p className="text-sm text-gray-600">Go to "Link School" and enter the school code provided.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <p className="font-semibold text-gray-900">Continue Setup</p>
                <p className="text-sm text-gray-600">Once linked, you'll be able to link your child in the next step.</p>
              </div>
            </div>
          </div>
          {!hasSchool && (
            <form onSubmit={handleLinkSchool} className="mt-4 space-y-3">
              {schoolError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {schoolError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter School Code
                </label>
                <input
                  type="text"
                  value={schoolCode}
                  onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                  placeholder="e.g., WS2025"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={linkingSchool}
                />
              </div>
              <Button
                type="submit"
                disabled={linkingSchool || !schoolCode.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {linkingSchool ? (
                  <>
                    <Loader2 size={20} className="mr-2 animate-spin" />
                    Linking School...
                  </>
                ) : (
                  <>
                    <Building2 size={20} className="mr-2" />
                    Link School
                  </>
                )}
              </Button>
            </form>
          )}
          {hasSchool && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="text-green-600" size={20} />
                <p className="text-sm font-medium text-green-800">School linked successfully! You can proceed to the next step.</p>
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 2,
      title: 'Link Your Child',
      icon: LinkIcon,
      description: 'Connect your account to your child\'s school record using a link code.',
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
              <LinkIcon className="text-blue-600" size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Link Your Child</h3>
            <p className="text-gray-600 mb-2">
              Now let's connect your account to your child. You'll need a link code from the school administrator.
            </p>
            <p className="text-sm text-gray-500 italic">
              During onboarding, you'll link one child. You can link additional children later from the dashboard.
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 space-y-3">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <p className="font-semibold text-gray-900">Get Your Child's Link Code</p>
                <p className="text-sm text-gray-600">Contact your child's school administrator to receive a unique link code for your child.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <p className="font-semibold text-gray-900">Enter the Code</p>
                <p className="text-sm text-gray-600">Go to "Link Child" and enter the code provided for your child.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <p className="font-semibold text-gray-900">Start Tracking</p>
                <p className="text-sm text-gray-600">Once linked, you'll see all your child's information on the dashboard.</p>
              </div>
            </div>
          </div>
          {!hasSchool && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> You must link a school first before you can link a child. Please complete the previous step.
              </p>
            </div>
          )}
          {hasSchool && !hasChild && (
            <form onSubmit={handleLinkChild} className="mt-4 space-y-3">
              {childError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {childError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Child Link Code
                </label>
                <input
                  type="text"
                  value={childLinkCode}
                  onChange={(e) => setChildLinkCode(e.target.value.toUpperCase())}
                  placeholder="e.g., ABC123XYZ"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={linkingChild}
                />
              </div>
              <Button
                type="submit"
                disabled={linkingChild || !childLinkCode.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {linkingChild ? (
                  <>
                    <Loader2 size={20} className="mr-2 animate-spin" />
                    Linking Child...
                  </>
                ) : (
                  <>
                    <LinkIcon size={20} className="mr-2" />
                    Link Child
                  </>
                )}
              </Button>
            </form>
          )}
          {hasChild && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="text-green-600" size={20} />
                <p className="text-sm font-medium text-green-800">Child linked successfully! You can proceed to explore features.</p>
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 3,
      title: 'Explore Features',
      icon: Users,
      description: 'Learn about the key features available in your parent portal.',
      content: (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <Users className="text-green-600" size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Key Features</h3>
            <p className="text-gray-600">
              Here's what you can do with your parent portal:
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3 mb-2">
                <Calendar className="text-blue-600" size={24} />
                <h4 className="font-semibold text-gray-900">Attendance</h4>
              </div>
              <p className="text-sm text-gray-600">
                View daily attendance records, track patterns, and see attendance history for all your children.
              </p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center space-x-3 mb-2">
                <Award className="text-red-600" size={24} />
                <h4 className="font-semibold text-gray-900">Behavior</h4>
              </div>
              <p className="text-sm text-gray-600">
                Monitor incidents, view merits and demerits, and track your child's behavior progress over time.
              </p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center space-x-3 mb-2">
                <Bell className="text-yellow-600" size={24} />
                <h4 className="font-semibold text-gray-900">Notifications</h4>
              </div>
              <p className="text-sm text-gray-600">
                Get real-time alerts about attendance, incidents, interventions, consequences, and important school updates.
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center space-x-3 mb-2">
                <Users className="text-purple-600" size={24} />
                <h4 className="font-semibold text-gray-900">Messages</h4>
              </div>
              <p className="text-sm text-gray-600">
                Communicate directly with teachers and school administrators about your child's progress and concerns.
              </p>
            </div>
          </div>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Tip:</strong> You can link additional children from the "Link Child" page after completing onboarding. 
              If your children attend different schools, you'll need to link each school first before linking children from that school.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 4,
      title: 'You\'re All Set!',
      icon: CheckCircle,
      description: 'Start exploring your parent portal.',
      content: (
        <div className="space-y-4 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="text-green-600" size={40} />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Welcome to DMS!</h3>
          <p className="text-gray-600 mb-6">
            You're all set up and ready to start tracking your child's progress. 
            {!hasChild && ' Don\'t forget to link your child if you haven\'t already!'}
          </p>
          <div className="bg-green-50 rounded-lg p-4 text-left">
            <p className="text-sm font-semibold text-gray-900 mb-2">Quick Tips:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Check your dashboard for an overview of your child's progress</li>
              <li>• Enable notifications for real-time updates</li>
              <li>• Visit "My Children" to see all linked children</li>
              <li>• Use the search bar to quickly find information</li>
              <li>• Link additional children from the "Link Child" page</li>
              <li>• Switch between schools if your children attend different schools</li>
            </ul>
          </div>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    // Check if we can proceed to next step
    if (currentStep === 1 && !hasSchool) {
      alert('Please link a school first before proceeding.');
      return;
    }
    
    if (currentStep === 2 && !hasChild) {
      alert('Please link at least one child before proceeding.');
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setCompletedSteps([...completedSteps, currentStep]);
    } else {
      // Complete onboarding - only mark as complete if school and child are linked
      if (hasSchool && hasChild) {
        localStorage.setItem('parent_onboarding_completed', 'true');
      }
      navigate('/parent');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (confirm('Are you sure you want to skip onboarding? You can always access it later from the settings.')) {
      // Only mark as complete if school and child are linked
      if (hasSchool && hasChild) {
        localStorage.setItem('parent_onboarding_completed', 'true');
      }
      navigate('/parent');
    }
  };

  const currentStepData = steps[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Card className="relative">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">
                Step {currentStep + 1} of {steps.length}
              </span>
              <button
                onClick={handleSkip}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Skip Tour
              </button>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Step Content */}
          <div className="min-h-[400px]">
            {currentStepData.content}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <Button
              variant="secondary"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ArrowLeft size={20} className="mr-2" />
              Previous
            </Button>

            <div className="flex space-x-2">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep
                      ? 'bg-blue-600'
                      : completedSteps.includes(index) || (index === 1 && hasSchool) || (index === 2 && hasChild)
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            <Button
              onClick={handleNext}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
              <ArrowRight size={20} className="ml-2" />
            </Button>
          </div>
        </Card>

        {/* School Link Success Popup */}
        <AnimatePresence>
          {showSchoolSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            >
              <motion.div
                initial={{ rotate: -5 }}
                animate={{ rotate: 0 }}
                className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative overflow-hidden"
              >
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-50" />
                
                {/* Sparkles animation */}
                <motion.div
                  className="absolute top-4 right-4"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="text-purple-500" size={24} />
                </motion.div>
                <motion.div
                  className="absolute bottom-4 left-4"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="text-blue-500" size={20} />
                </motion.div>

                <div className="relative text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full mb-4"
                  >
                    <CheckCircle className="text-white" size={40} />
                  </motion.div>
                  
                  <motion.h3
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl font-bold text-gray-900 mb-2"
                  >
                    School Linked! 🎉
                  </motion.h3>
                  
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-gray-600"
                  >
                    You've successfully linked <strong>{linkedSchoolName}</strong> to your account.
                  </motion.p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Child Link Success Popup */}
        <AnimatePresence>
          {showChildSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            >
              <motion.div
                initial={{ rotate: -5 }}
                animate={{ rotate: 0 }}
                className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative overflow-hidden"
              >
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 opacity-50" />
                
                {/* Sparkles animation */}
                <motion.div
                  className="absolute top-4 right-4"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="text-blue-500" size={24} />
                </motion.div>
                <motion.div
                  className="absolute bottom-4 left-4"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="text-purple-500" size={20} />
                </motion.div>

                <div className="relative text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mb-4"
                  >
                    <CheckCircle className="text-white" size={40} />
                  </motion.div>
                  
                  <motion.h3
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl font-bold text-gray-900 mb-2"
                  >
                    Child Linked! 🎊
                  </motion.h3>
                  
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-gray-600"
                  >
                    You've successfully linked <strong>{linkedChildName}</strong> to your account.
                  </motion.p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Onboarding;
