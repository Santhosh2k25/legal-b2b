import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { z } from 'zod';
import Background3D from '../../components/Background3D';

const baseSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .transform(email => email.toLowerCase().trim()),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
    .refine(password => !/(.)\1{2,}/.test(password), {
      message: 'Password cannot contain repeated characters'
    }),
  confirmPassword: z.string(),
  firstName: z.string()
    .min(1, 'First name is required')
    .transform(name => name.trim().replace(/[<>]/g, '')),
  lastName: z.string()
    .min(1, 'Last name is required')
    .transform(name => name.trim().replace(/[<>]/g, '')),
  gender: z.string().min(1, 'Gender is required'),
  practiceType: z.string().min(1, 'Practice type is required'),
  barCouncilNumber: z.string()
    .min(1, 'Bar Council Number is required')
    .transform(num => num.trim().replace(/[^A-Za-z0-9]/g, '')),
  aadhaarNumber: z.string()
    .length(12, 'Aadhaar number must be 12 digits')
    .regex(/^\d+$/, 'Aadhaar number must contain only digits')
});

const formSchema = baseSchema.refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

const BackgroundWrapper = () => (
  <div className="fixed inset-0 -z-10">
    <Background3D />
  </div>
);

function LawyerRegistration() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aadhaarVerified, setAadhaarVerified] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: '',
    practiceType: '',
    barCouncilNumber: '',
    aadhaarNumber: '',
    profilePhoto: null as File | null,
  });

  const handleStepNavigation = () => {
    let isValid = true;
    setValidationErrors({});

    switch (currentStep) {
      case 1:
        if (!formData.email.trim()) {
          setValidationErrors(prev => ({ ...prev, email: 'Email is required' }));
          isValid = false;
        }
        if (!formData.password) {
          setValidationErrors(prev => ({ ...prev, password: 'Password is required' }));
          isValid = false;
        }
        if (!formData.confirmPassword) {
          setValidationErrors(prev => ({ ...prev, confirmPassword: 'Confirm password is required' }));
          isValid = false;
        }
        break;
      case 2:
        if (!formData.firstName.trim()) {
          setValidationErrors(prev => ({ ...prev, firstName: 'First name is required' }));
          isValid = false;
        }
        if (!formData.lastName.trim()) {
          setValidationErrors(prev => ({ ...prev, lastName: 'Last name is required' }));
          isValid = false;
        }
        if (!formData.gender) {
          setValidationErrors(prev => ({ ...prev, gender: 'Gender is required' }));
          isValid = false;
        }
        if (!formData.practiceType) {
          setValidationErrors(prev => ({ ...prev, practiceType: 'Practice type is required' }));
          isValid = false;
        }
        break;
      case 3:
        if (!formData.barCouncilNumber.trim()) {
          setValidationErrors(prev => ({ ...prev, barCouncilNumber: 'Bar Council Number is required' }));
          isValid = false;
        }
        if (!formData.aadhaarNumber.trim()) {
          setValidationErrors(prev => ({ ...prev, aadhaarNumber: 'Aadhaar Number is required' }));
          isValid = false;
        }
        break;
    }

    if (!isValid) {
      return;
    }

    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const verifyAadhaar = () => {
    // Mock verification
    setAadhaarVerified(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate all fields using formSchema
      formSchema.parse(formData);

      // Additional validation for Aadhaar verification
      if (!aadhaarVerified) {
        throw new Error('Please verify your Aadhaar number before proceeding');
      }

      try {
        await signup({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          displayName: `${formData.firstName} ${formData.lastName}`,
          userType: 'lawyer',
          barCouncilNumber: formData.barCouncilNumber,
          phone: '',
          gender: formData.gender,
        });
        navigate('/dashboard');
      } catch (error: any) {
        // Handle authentication errors
        if (error.message.includes('Email already registered')) {
          setError('This email is already registered. Please use a different email or try to login.');
        } else if (error.message.includes('password')) {
          setError('Password is too weak. Please choose a stronger password.');
        } else if (error.message.includes('email')) {
          setError('Please enter a valid email address.');
        } else {
          setError(error.message || 'An error occurred during registration. Please try again.');
        }
        
        console.error('Registration error:', error);
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors = err.errors.reduce((acc, curr) => {
          acc[curr.path[0]] = curr.message;
          return acc;
        }, {} as Record<string, string>);
        setValidationErrors(errors);
        setError('Please fix the validation errors before submitting.');
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred during registration');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900/80 via-gray-800/50 to-black/80 py-12 px-4 
    sm:px-6 lg:px-8 relative backdrop-blur-sm">
      <BackgroundWrapper />
      <div className="max-w-2xl mx-auto relative z-20">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center"
          >
            <motion.div
              className="bg-white p-4 rounded-xl shadow-lg"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <img 
                src="https://i.postimg.cc/tC44YgWz/logo-new.png"
                alt="LegalAI ERP Logo"
                className="w-16 h-16 object-contain"
              />
            </motion.div>
          </motion.div>
          <h2 className="mt-6 text-3xl font-extrabold text-white">
            Lawyer Registration
          </h2>
        </div>

        <div className="mt-8 bg-gray-900/50 backdrop-blur-xl py-8 px-4 shadow-xl ring-1 ring-gray-800 sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-500/10 border-l-4 border-red-500 p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <p className="ml-3 text-sm text-red-400">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {currentStep === 1 && (
              <div>
                <h3 className="text-lg font-medium text-white mb-4">Authentication Details</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                      Email Address
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        setValidationErrors(prev => ({ ...prev, email: '' }));
                      }}
                      required
                      className={`mt-1 block w-full border ${
                        validationErrors.email ? 'border-red-500' : 'border-gray-700'
                      } bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                    />
                    {validationErrors.email && (
                      <p className="mt-1 text-sm text-red-400">{validationErrors.email}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                      Password
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1 relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        value={formData.password}
                        onChange={(e) => {
                          setFormData({ ...formData, password: e.target.value });
                          setValidationErrors(prev => ({ ...prev, password: '' }));
                        }}
                        required
                        className={`block w-full border ${
                          validationErrors.password ? 'border-red-500' : 'border-gray-700'
                        } bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {validationErrors.password && (
                      <p className="mt-1 text-sm text-red-400">{validationErrors.password}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
                      Confirm Password
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1 relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={(e) => {
                          setFormData({ ...formData, confirmPassword: e.target.value });
                          setValidationErrors(prev => ({ ...prev, confirmPassword: '' }));
                        }}
                        required
                        className={`block w-full border ${
                          validationErrors.confirmPassword ? 'border-red-500' : 'border-gray-700'
                        } bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {validationErrors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-400">{validationErrors.confirmPassword}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <h3 className="text-lg font-medium text-white mb-4">Personal Information</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-300">
                        First Name
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        required
                        className="mt-1 block w-full border border-gray-700 bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                      {validationErrors.firstName && (
                        <p className="mt-1 text-sm text-red-400">{validationErrors.firstName}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-300">
                        Last Name
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        required
                        className="mt-1 block w-full border border-gray-700 bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                      {validationErrors.lastName && (
                        <p className="mt-1 text-sm text-red-400">{validationErrors.lastName}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-300">
                      Gender
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="gender"
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      required
                      className="mt-1 block w-full border border-gray-700 bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    {validationErrors.gender && (
                      <p className="mt-1 text-sm text-red-400">{validationErrors.gender}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="practiceType" className="block text-sm font-medium text-gray-300">
                      Practice Type
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="practiceType"
                      value={formData.practiceType}
                      onChange={(e) => setFormData({ ...formData, practiceType: e.target.value })}
                      required
                      className="mt-1 block w-full border border-gray-700 bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    >
                      <option value="">Select Practice Type</option>
                      <option value="civil">Civil Law</option>
                      <option value="criminal">Criminal Law</option>
                      <option value="corporate">Corporate Law</option>
                      <option value="family">Family Law</option>
                      <option value="tax">Tax Law</option>
                      <option value="intellectual">Intellectual Property</option>
                      <option value="other">Other</option>
                    </select>
                    {validationErrors.practiceType && (
                      <p className="mt-1 text-sm text-red-400">{validationErrors.practiceType}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div>
                <h3 className="text-lg font-medium text-white mb-4">Professional Information</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="barCouncilNumber" className="block text-sm font-medium text-gray-300">
                      Bar Council Number
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="barCouncilNumber"
                      value={formData.barCouncilNumber}
                      onChange={(e) => setFormData({ ...formData, barCouncilNumber: e.target.value })}
                      required
                      className="mt-1 block w-full border border-gray-700 bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                    {validationErrors.barCouncilNumber && (
                      <p className="mt-1 text-sm text-red-400">{validationErrors.barCouncilNumber}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="aadhaarNumber" className="block text-sm font-medium text-gray-300">
                      Aadhaar Number
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1 flex">
                      <input
                        type="text"
                        id="aadhaarNumber"
                        value={formData.aadhaarNumber}
                        onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value })}
                        required
                        className="block w-full border border-gray-700 bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                      <button
                        type="button"
                        onClick={verifyAadhaar}
                        className="ml-2 px-3 py-2 border border-gray-700 rounded-md text-sm text-gray-300 bg-gray-800 hover:bg-gray-700"
                      >
                        Verify
                      </button>
                    </div>
                    {validationErrors.aadhaarNumber && (
                      <p className="mt-1 text-sm text-red-400">{validationErrors.aadhaarNumber}</p>
                    )}
                    {aadhaarVerified && (
                      <div className="mt-1 flex items-center text-sm text-green-500">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Aadhaar verified
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-between">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-4 py-2 border border-gray-700 rounded-md text-sm text-gray-300 bg-gray-800 hover:bg-gray-700"
                >
                  Previous
                </button>
              )}
              {currentStep === 3 ? (
                <button
                  type="submit"
                  disabled={loading || !aadhaarVerified}
                  className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStepNavigation}
                  className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
                >
                  Next
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LawyerRegistration;