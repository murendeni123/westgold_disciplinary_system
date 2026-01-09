import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { GraduationCap, ArrowLeft, ArrowRight } from 'lucide-react';

interface SignupData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  work_phone: string;
  relationship_to_child: string;
  emergency_contact_1_name: string;
  emergency_contact_1_phone: string;
  emergency_contact_2_name: string;
  emergency_contact_2_phone: string;
  home_address: string;
  city: string;
  postal_code: string;
}

const SignupStep1: React.FC<{
  data: SignupData;
  onChange: (data: SignupData) => void;
  onNext: () => void;
  error: string;
}> = ({ data, onChange, onNext, error }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation for step 1
    if (!data.name.trim()) {
      return;
    }

    if (!data.email.trim()) {
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return;
    }

    if (data.password.length < 6) {
      return;
    }

    if (data.password !== data.confirmPassword) {
      return;
    }

    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <Input
        label="Full Name"
        value={data.name}
        onChange={(e) => onChange({ ...data, name: e.target.value })}
        required
        placeholder="Enter your full name"
      />

      <Input
        type="email"
        label="Email"
        value={data.email}
        onChange={(e) => onChange({ ...data, email: e.target.value })}
        required
        placeholder="Enter your email"
      />

      <Input
        type="password"
        label="Password"
        value={data.password}
        onChange={(e) => onChange({ ...data, password: e.target.value })}
        required
        minLength={6}
        placeholder="Enter password (min 6 characters)"
      />

      <Input
        type="password"
        label="Confirm Password"
        value={data.confirmPassword}
        onChange={(e) => onChange({ ...data, confirmPassword: e.target.value })}
        required
        minLength={6}
        placeholder="Confirm your password"
      />

      <Button
        type="submit"
        className="w-full"
      >
        Continue to Contact Details
        <ArrowRight className="ml-2" size={16} />
      </Button>
    </form>
  );
};

const SignupStep2: React.FC<{
  data: SignupData;
  onChange: (data: SignupData) => void;
  onBack: () => void;
  onSubmit: () => void;
  loading: boolean;
  error: string;
}> = ({ data, onChange, onBack, onSubmit, loading, error }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <Input
        type="tel"
        label="Phone"
        value={data.phone}
        onChange={(e) => onChange({ ...data, phone: e.target.value })}
        required
        placeholder="Enter your phone number"
      />

      <Input
        type="tel"
        label="Work Phone (Optional)"
        value={data.work_phone}
        onChange={(e) => onChange({ ...data, work_phone: e.target.value })}
        placeholder="Enter your work phone number"
      />

      <Input
        label="Relationship to Child"
        value={data.relationship_to_child}
        onChange={(e) => onChange({ ...data, relationship_to_child: e.target.value })}
        required
        placeholder="e.g., Mother, Father, Legal Guardian"
      />

      <Card title="Emergency Contacts">
        <Input
          label="Emergency Contact 1 Name"
          value={data.emergency_contact_1_name}
          onChange={(e) => onChange({ ...data, emergency_contact_1_name: e.target.value })}
          required
          placeholder="Enter emergency contact name"
        />

        <Input
          type="tel"
          label="Emergency Contact 1 Phone"
          value={data.emergency_contact_1_phone}
          onChange={(e) => onChange({ ...data, emergency_contact_1_phone: e.target.value })}
          required
          placeholder="Enter emergency contact phone"
        />

        <Input
          label="Emergency Contact 2 Name"
          value={data.emergency_contact_2_name}
          onChange={(e) => onChange({ ...data, emergency_contact_2_name: e.target.value })}
          required
          placeholder="Enter emergency contact name"
        />

        <Input
          type="tel"
          label="Emergency Contact 2 Phone"
          value={data.emergency_contact_2_phone}
          onChange={(e) => onChange({ ...data, emergency_contact_2_phone: e.target.value })}
          required
          placeholder="Enter emergency contact phone"
        />
      </Card>

      <Card title="Home Address">
        <Input
          label="Address"
          value={data.home_address}
          onChange={(e) => onChange({ ...data, home_address: e.target.value })}
          required
          placeholder="Street address"
        />

        <Input
          label="City (Optional)"
          value={data.city}
          onChange={(e) => onChange({ ...data, city: e.target.value })}
          placeholder="City"
        />

        <Input
          label="Postal Code (Optional)"
          value={data.postal_code}
          onChange={(e) => onChange({ ...data, postal_code: e.target.value })}
          placeholder="Postal code"
        />
      </Card>

      <div className="flex gap-4">
        <Button
          type="button"
          variant="secondary"
          className="flex-1"
          onClick={onBack}
        >
          <ArrowLeft className="mr-2" size={16} />
          Back
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Sign Up'}
        </Button>
      </div>
    </form>
  );
};

const Signup: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<SignupData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    work_phone: '',
    relationship_to_child: '',
    emergency_contact_1_name: '',
    emergency_contact_1_phone: '',
    emergency_contact_2_name: '',
    emergency_contact_2_phone: '',
    home_address: '',
    city: '',
    postal_code: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const validateStep1 = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }

    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    setError('');
    return true;
  };

  const validateStep2 = () => {
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return false;
    }

    if (!formData.relationship_to_child.trim()) {
      setError('Relationship to child is required');
      return false;
    }

    if (!formData.emergency_contact_1_name.trim() || !formData.emergency_contact_1_phone.trim()) {
      setError('Emergency contact 1 name and phone are required');
      return false;
    }

    if (!formData.emergency_contact_2_name.trim() || !formData.emergency_contact_2_phone.trim()) {
      setError('Emergency contact 2 name and phone are required');
      return false;
    }

    if (!formData.home_address.trim()) {
      setError('Home address is required');
      return false;
    }

    setError('');
    return true;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
    setError('');
  };

  const handleSubmit = async () => {
    if (!validateStep2()) {
      return;
    }

    setLoading(true);

    try {
      await api.signup({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone.trim(),
        work_phone: formData.work_phone.trim() || undefined,
        relationship_to_child: formData.relationship_to_child.trim(),
        emergency_contact_1_name: formData.emergency_contact_1_name.trim(),
        emergency_contact_1_phone: formData.emergency_contact_1_phone.trim(),
        emergency_contact_2_name: formData.emergency_contact_2_name.trim(),
        emergency_contact_2_phone: formData.emergency_contact_2_phone.trim(),
        home_address: formData.home_address.trim(),
        city: formData.city.trim() || undefined,
        postal_code: formData.postal_code.trim() || undefined,
      });

      // Auto-login after successful signup
      try {
        await login(formData.email.trim().toLowerCase(), formData.password);
        navigate('/parent');
      } catch (loginError: any) {
        // If auto-login fails, redirect to login page
        navigate('/login', { state: { message: 'Account created successfully. Please login.' } });
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
              <GraduationCap className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Parent Signup</h1>
            <p className="text-gray-600 mt-2">
              {currentStep === 1 ? 'Create your parent account' : 'Add your contact details'}
            </p>
            
            {/* Progress indicator */}
            <div className="flex justify-center mt-6 space-x-2">
              <div className={`h-2 w-8 rounded-full ${
                currentStep >= 1 ? 'bg-blue-600' : 'bg-gray-300'
              }`} />
              <div className={`h-2 w-8 rounded-full ${
                currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'
              }`} />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Step {currentStep} of 2
            </p>
          </div>

          {currentStep === 1 ? (
            <SignupStep1
              data={formData}
              onChange={setFormData}
              onNext={handleNext}
              error={error}
            />
          ) : (
            <SignupStep2
              data={formData}
              onChange={setFormData}
              onBack={handleBack}
              onSubmit={handleSubmit}
              loading={loading}
              error={error}
            />
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;

