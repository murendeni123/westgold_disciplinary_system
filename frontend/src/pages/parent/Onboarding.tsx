import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { useParentStudents } from '../../hooks/useParentStudents';
import Card from '../../components/Card';
import Button from '../../components/Button';
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
  Building2
} from 'lucide-react';

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { hasStudents, loading: studentsLoading } = useParentStudents();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [hasSchool, setHasSchool] = useState(false);
  const [hasChild, setHasChild] = useState(false);

  useEffect(() => {
    checkProgress();
  }, [profile, hasStudents, studentsLoading]);

  const checkProgress = async () => {
    // Check if user has linked a school
    if (profile?.school_id) {
      setHasSchool(true);
    }
    
    // Check if user has linked at least one child
    if (hasStudents) {
      setHasChild(true);
    }
  };

  const steps = [
    {
      id: 0,
      title: 'Welcome to PDS Parent Portal',
      icon: GraduationCap,
      description: 'Your one-stop portal to track your child\'s progress, attendance, and behavior at school.',
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
              <GraduationCap className="text-blue-600" size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome, {profile?.full_name || 'Parent'}!</h2>
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
            <div className="mt-4">
              <Button
                onClick={() => {
                  setCompletedSteps([...completedSteps, 1]);
                  navigate('/parent/link-school');
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Building2 size={20} className="mr-2" />
                Go to Link School
              </Button>
            </div>
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
            <div className="mt-4">
              <Button
                onClick={() => {
                  setCompletedSteps([...completedSteps, 2]);
                  navigate('/parent/link-child');
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <LinkIcon size={20} className="mr-2" />
                Go to Link Child
              </Button>
            </div>
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
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Welcome to PDS!</h3>
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
      // Complete onboarding
      localStorage.setItem('parent_onboarding_completed', 'true');
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
      localStorage.setItem('parent_onboarding_completed', 'true');
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
      </div>
    </div>
  );
};

export default Onboarding;
