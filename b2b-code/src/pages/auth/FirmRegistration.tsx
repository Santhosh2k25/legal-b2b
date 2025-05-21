import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Building, Phone, Mail, MapPin, Globe, Loader2, CheckCircle, User, Navigation, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { firmRegistrationSchema } from '../../utils/validations';
import { z } from 'zod';
import Background3D from '../../components/Background3D';

const BackgroundWrapper = () => (
  <div className="fixed inset-0 -z-10">
    <Background3D />
  </div>
);

function FirmRegistration() {
  const navigate = useNavigate();
  const { signup } = useAuth();

  // Organization Details
  const [firmName, setFirmName] = useState('');
  const [ceoName, setCeoName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [establishedYear, setEstablishedYear] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Contact Information
  const [phone, setPhone] = useState('');
  const [landline, setLandline] = useState('');
  const [address, setAddress] = useState('');
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [website, setWebsite] = useState('');
  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [mobileOtp, setMobileOtp] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [mobileVerified, setMobileVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [passwordStrength, setPasswordStrength] = useState(0);

  const validateField = (field: keyof typeof firmRegistrationSchema._def.schema.shape, value: string) => {
    try {
      const schema = z.object({ [field]: firmRegistrationSchema._def.schema.shape[field] });
      schema.parse({ [field]: value });
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        setValidationErrors(prev => ({
          ...prev,
          [field]: err.errors[0].message
        }));
        return false;
      }
    }
  };

  // Additional Details
  const [employeeCount, setEmployeeCount] = useState('');
  const [description, setDescription] = useState('');

  // Form State
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const detectCurrentLocation = () => {
    setDetectingLocation(true);
    setLocationError('');
    
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setDetectingLocation(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLatitude(latitude.toString());
        setLongitude(longitude.toString());
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await response.json();
          
          if (data && data.display_name) {
            setAddress(data.display_name);
          }
        } catch (error) {
          console.error('Error reverse geocoding:', error);
        }
        
        setDetectingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setLocationError(
          error.code === 1
            ? 'Permission denied. Please allow location access.'
            : 'Unable to retrieve your location'
        );
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const checkPasswordStrength = (password: string) => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }
    
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 1;
    
    // Contains number
    if (/\d/.test(password)) strength += 1;
    
    // Contains lowercase
    if (/[a-z]/.test(password)) strength += 1;
    
    // Contains uppercase
    if (/[A-Z]/.test(password)) strength += 1;
    
    // Contains special character
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    setPasswordStrength(strength);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    validateField('password', newPassword);
    checkPasswordStrength(newPassword);
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newConfirmPassword = e.target.value;
    setConfirmPassword(newConfirmPassword);
    validateField('confirmPassword', newConfirmPassword);
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 1) return 'bg-red-500';
    if (passwordStrength <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // OTP Functions
  const sendEmailOTP = () => {
    setEmailOtpSent(true);
    // Mock OTP for demo - auto-fill for testing
    const mockOtp = '123456';
    console.log("Email OTP:", mockOtp);
    setEmailOtp(mockOtp); // Auto-fill the OTP for testing
    
    // Auto-verify in development mode
    setTimeout(() => {
      if (process.env.NODE_ENV === 'development') {
        setEmailVerified(true);
        console.log('Auto-verified email OTP in development mode');
      }
    }, 500);
  };

  const sendMobileOTP = () => {
    setMobileOtpSent(true);
    // Mock OTP for demo - auto-fill for testing
    const mockOtp = '123456';
    console.log("Mobile OTP:", mockOtp);
    setMobileOtp(mockOtp); // Auto-fill the OTP for testing
    
    // Auto-verify in development mode
    setTimeout(() => {
      if (process.env.NODE_ENV === 'development') {
        setMobileVerified(true);
        console.log('Auto-verified mobile OTP in development mode');
      }
    }, 500);
  };

  const verifyEmailOTP = () => {
    if (emailOtp === '123456') {
      setEmailVerified(true);
      setError('');
    } else {
      setError('Invalid email OTP');
    }
  };

  const verifyMobileOTP = () => {
    if (mobileOtp === '123456') {
      setMobileVerified(true);
      setError('');
    } else {
      setError('Invalid mobile OTP');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate required fields manually
      if (!email || !password || !firmName || !ceoName || !phone) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }
      
      // Check password confirmation
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      // Validate that we have all required fields for MongoDB schema
      if (!mobileVerified || !emailVerified) {
        // In development mode, we can bypass verification
        if (process.env.NODE_ENV === 'development') {
          console.log('Development mode: Bypassing OTP verification');
        } else {
          setError('Please verify your mobile number and email before submitting.');
          setLoading(false);
          return;
        }
      }

      // Ensure description has a default value if empty
      const firmDescription = description || `${firmName} is a law firm established in ${establishedYear}, specializing in legal services.`;

      // Create a complete user data object with all required fields
      const userData = {
        email,
        password,
        firstName: ceoName.split(' ')[0] || 'Admin',
        lastName: ceoName.split(' ').slice(1).join(' ') || 'User',
        displayName: firmName,
        phone,
        address,
        website,
        userType: 'admin',
        // Additional firm-specific fields
        firmName,
        registrationNumber,
        establishedYear,
        landline,
        latitude,
        longitude,
        employeeCount,
        description: firmDescription
      };

      console.log('Submitting registration form with data:', {
        email: userData.email,
        firmName: userData.firmName,
        userType: userData.userType
      });

      // Pass the complete userData object to signup
      await signup(userData);
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900/80 via-gray-800/50 to-black/80 py-12 px-4 sm:px-6 lg:px-8 relative backdrop-blur-sm">
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
            Law Firm Registration
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
            <div>
              <label htmlFor="firmName" className="block text-sm font-medium text-gray-300">
                Firm Name
                <span className="text-red-500"> *</span>
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-gray-300" />
                </div>
                <input
                  type="text"
                  id="firmName"
                  value={firmName}
                  onChange={(e) => {
                    setFirmName(e.target.value);
                    validateField('firmName', e.target.value);
                  }}
                  required
                  placeholder='e.g., ABC Law Firm'
                  className={`block w-full pl-10 border ${
                    validationErrors.firmName ? 'border-red-500' : 'border-gray-700'
                  } bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                />
              </div>
              {validationErrors.firmName && (
                <p className="mt-1 text-sm text-red-400">{validationErrors.firmName}</p>
              )}
            </div>

            <div>
              <label htmlFor="ceoName" className="block text-sm font-medium text-gray-300">
                CEO/Managing Director Name
                <span className="text-red-500"> *</span>
                {validationErrors.ceoName && (
                  <span className="text-red-400 text-xs ml-2">{validationErrors.ceoName}</span>
                )}
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-300" />
                </div>
                <input
                  type="text"
                  id="ceoName"
                  value={ceoName}
                  onChange={(e) => {
                    setCeoName(e.target.value);
                    validateField('ceoName', e.target.value);
                  }}
                  required
                  className={`block w-full pl-10 border ${
                    validationErrors.ceoName ? 'border-red-500' : 'border-gray-700'
                  } bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                  placeholder="e.g., John Doe"
                />
              </div>
              {validationErrors.ceoName && (
                <p className="mt-1 text-sm text-red-400">{validationErrors.ceoName}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="registrationNumber" className="block text-sm font-medium text-gray-300">
                  Registration Number
                  <span className="text-red-500"> *</span>
                </label>
                <input
                  type="text"
                  id="registrationNumber"
                  value={registrationNumber}
                  onChange={(e) => {
                    setRegistrationNumber(e.target.value);
                    validateField('registrationNumber', e.target.value);
                  }}
                  required
                  placeholder='e.g., CH/1234/123456'
                  className={`block w-full border ${
                    validationErrors.registrationNumber ? 'border-red-500' : 'border-gray-700'
                  } bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                />
              </div>

              <div>
                <label htmlFor="establishedYear" className="block text-sm font-medium text-gray-300">
                  Year Established
                  <span className="text-red-500"> *</span>
                </label>
                <input
                  type="number"
                  id="establishedYear"
                  value={establishedYear}
                  onChange={(e) => {
                    setEstablishedYear(e.target.value);
                    validateField('establishedYear', e.target.value);
                  }}
                  required
                  placeholder='e.g., 2020'
                  min="1900"
                  max={new Date().getFullYear()}
                  className={`block w-full border ${
                    validationErrors.establishedYear ? 'border-red-500' : 'border-gray-700'
                  } bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email Address
                <span className="text-red-500"> *</span>
                {validationErrors.email && (
                  <span className="text-red-400 text-xs ml-2">{validationErrors.email}</span>
                )}
              </label>
              <div className="mt-1 flex">
                <div className="relative rounded-md shadow-sm flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    validateField('email', e.target.value);
                  }}
                  required
                  disabled={emailVerified}
                  placeholder='e.g., abc@example.com'
                  className={`block w-full pl-10 border ${
                    validationErrors.email ? 'border-red-500' : 'border-gray-700'
                  } bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                />
                </div>
                {!emailVerified && (
                  <button
                    type="button"
                    onClick={sendEmailOTP}
                    className="ml-2 px-3 py-2 border border-gray-700 rounded-md text-sm text-gray-300 bg-gray-800 hover:bg-gray-700"
                  >
                    Send OTP
                  </button>
                )}
              </div>
              {emailOtpSent && !emailVerified && (
                <div className="mt-2 flex">
                  <input
                    type="text"
                    placeholder="Enter OTP"
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value)}
                    className="block w-full border border-gray-700 bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={verifyEmailOTP}
                    className="ml-2 px-3 py-2 border border-gray-700 rounded-md text-sm text-gray-300 bg-gray-800 hover:bg-gray-700"
                  >
                    Verify
                  </button>
                </div>
              )}
              {emailVerified && (
                <div className="mt-1 flex items-center text-sm text-green-500">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Email verified
                </div>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-300">
                Phone Number
                <span className="text-red-500"> *</span>
                {validationErrors.phone && (
                  <span className="text-red-400 text-xs ml-2">{validationErrors.phone}</span>
                )}
              </label>
              <div className="mt-1 flex">
                <div className="relative rounded-md shadow-sm flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    validateField('phone', e.target.value);
                  }}
                  required
                  disabled={mobileVerified}
                  placeholder='e.g., +91 9876543210'
                  className={`block w-full pl-10 border ${
                    validationErrors.phone ? 'border-red-500' : 'border-gray-700'
                  } bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                />
                </div>
                {!mobileVerified && (
                  <button
                    type="button"
                    onClick={sendMobileOTP}
                    className="ml-2 px-3 py-2 border border-gray-700 rounded-md text-sm text-gray-300 bg-gray-800 hover:bg-gray-700"
                  >
                    Send OTP
                  </button>
                )}
              </div>
              {mobileOtpSent && !mobileVerified && (
                <div className="mt-2 flex">
                  <input
                    type="text"
                    placeholder="Enter OTP"
                    value={mobileOtp}
                    onChange={(e) => setMobileOtp(e.target.value)}
                    className="block w-full border border-gray-700 bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={verifyMobileOTP}
                    className="ml-2 px-3 py-2 border border-gray-700 rounded-md text-sm text-gray-300 bg-gray-800 hover:bg-gray-700"
                  >
                    Verify
                  </button>
                </div>
              )}
              {mobileVerified && (
                <div className="mt-1 flex items-center text-sm text-green-500">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Mobile verified
                </div>
              )}
            </div>
            
            <div>
              <label htmlFor="landline" className="block text-sm font-medium text-gray-300">
                Office Landline
                <span className="text-red-500"> *</span>
                {validationErrors.landline && (
                  <span className="text-red-400 text-xs ml-2">{validationErrors.landline}</span>
                )}
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-300" />
                </div>
                <input
                  type="tel"
                  id="landline"
                  value={landline}
                  onChange={(e) => {
                    setLandline(e.target.value);
                    validateField('landline', e.target.value);
                  }}
                  required
                  className={`block w-full pl-10 border ${
                    validationErrors.landline ? 'border-red-500' : 'border-gray-700'
                  } bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                  placeholder="e.g., 011-12345678"
                />
              </div>
              {validationErrors.landline && (
                <p className="mt-1 text-sm text-red-400">{validationErrors.landline}</p>
              )}
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-300">
                Office Address
                <span className="text-red-500"> *</span>
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-300" />
                </div>
                <div className="absolute right-0 top-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={detectCurrentLocation}
                    className="inline-flex items-center px-3 py-2 text-sm text-primary-400 hover:text-primary-300 focus:outline-none"
                  >
                    {detectingLocation ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Navigation className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <textarea
                  id="officeAddress"
                  name="officeAddress"
                  rows={3}
                  required
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    validateField('address', e.target.value);
                  }}
                  className={`block w-full pl-10 border ${
                    validationErrors.address ? 'border-red-500' : 'border-gray-700'
                  } bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                  placeholder="Enter complete address with pincode"
                />
              </div>
              {locationError && (
                <p className="mt-2 text-sm text-red-500">{locationError}</p>
              )}
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="latitude" className="block text-sm font-medium text-gray-300">
                    Latitude <span className="text-red-500"> *</span>
                  </label>
                  <input
                    type="text"
                    id="latitude"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="mt-1 block w-full border border-gray-700 bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="e.g., 28.6139"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="longitude" className="block text-sm font-medium text-gray-300">
                    Longitude <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="longitude"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="mt-1 block w-full border border-gray-700 bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="e.g., 77.2090"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-300">
                Website
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Globe className="h-5 w-5 text-gray-300" />
                </div>
                <input
                  type="url"
                  id="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="block w-full pl-10 border border-gray-700 bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="https://"
                />
              </div>
            </div>

            <div>
              <label htmlFor="employeeCount" className="block text-sm font-medium text-gray-300">
                Number of Employees
                <span className="text-red-500"> *</span>
              </label>
              <input
                type="number"
                id="employeeCount"
                value={employeeCount}
                onChange={(e) => setEmployeeCount(e.target.value)}
                required
                min="1"
                className="mt-1 block w-full border border-gray-700 bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300">
                Firm Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="mt-1 block w-full border border-gray-700 bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Tell us about your firm..."
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password
                <span className="text-red-500">*</span>
                {validationErrors.password && (
                  <span className="text-red-400 text-xs ml-2">{validationErrors.password}</span>
                )}
              </label>
              <div className="mt-1 relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => {
                    handlePasswordChange(e);
                  }}
                  required
                  className="block w-full pr-10 border border-gray-700 bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {password && (
                <div className="mt-2">
                  <div className="flex items-center">
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getPasswordStrengthColor()}`} 
                        style={{ width: `${passwordStrength * 20}%` }}
                      ></div>
                    </div>
                    <span className="ml-2 text-xs text-gray-400">
                      {passwordStrength <= 1 ? 'Weak' : passwordStrength <= 3 ? 'Medium' : 'Strong'}
                    </span>
                  </div>
                  <ul className="mt-2 text-xs text-gray-400 space-y-1">
                    <li className="flex items-center">
                      {password.length >= 8 ? (
                        <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                      ) : (
                        <span className="h-3 w-3 rounded-full bg-gray-600 mr-1"></span>
                      )}
                      At least 8 characters
                    </li>
                    <li className="flex items-center">
                      {/[A-Z]/.test(password) ? (
                        <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                      ) : (
                        <span className="h-3 w-3 rounded-full bg-gray-600 mr-1"></span>
                      )}
                      Contains uppercase letter
                    </li>
                    <li className="flex items-center">
                      {/[a-z]/.test(password) ? (
                        <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                      ) : (
                        <span className="h-3 w-3 rounded-full bg-gray-600 mr-1"></span>
                      )}
                      Contains lowercase letter
                    </li>
                    <li className="flex items-center">
                      {/\d/.test(password) ? (
                        <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                      ) : (
                        <span className="h-3 w-3 rounded-full bg-gray-600 mr-1"></span>
                      )}
                      Contains number
                    </li>
                    <li className="flex items-center">
                      {/[^A-Za-z0-9]/.test(password) ? (
                        <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                      ) : (
                        <span className="h-3 w-3 rounded-full bg-gray-600 mr-1"></span>
                      )}
                      Contains special character
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
                Confirm Password
                <span className="text-red-500">*</span>
                {validationErrors.confirmPassword && (
                  <span className="text-red-400 text-xs ml-2">{validationErrors.confirmPassword}</span>
                )}
              </label>
              <div className="mt-1 relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => {
                    handleConfirmPasswordChange(e);
                  }}
                  required
                  className="block w-full pr-10 border border-gray-700 bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-1 text-sm text-red-500">Passwords do not match</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default FirmRegistration;