import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { languages } from '../../i18n/config';
import { User as UserIcon, Lock, Bell, Globe, Palette, HelpCircle, LogOut, Eye, EyeOff, Camera,
  Briefcase, CreditCard, CheckCircle } from 'lucide-react';


interface ExtendedUser {
  displayName: string | null;
  email: string | null;
  phone?: string;
  address?: string;
  website?: string;
  barCouncilNumber?: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  specialization?: string;
  experience?: string;
  aadharNumber?: string;
  aadharVerified?: boolean;
}

interface SettingOption {
  name: string;
  description: string;
  action: () => void;
}

interface SettingSection {
  title: string;
  icon: any;
  options: SettingOption[];
}

interface PasswordChangeFormProps {
  onClose: () => void;
}

interface ProfileSettingsProps {
  userDetails: ExtendedUser;
  onClose: () => void;
  onSave: (data: ExtendedUser) => Promise<void>;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ userDetails, onClose, onSave }) => {
  const [formData, setFormData] = useState<ExtendedUser>(userDetails);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(userDetails.profileImage || null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [showOTPInput, setShowOTPInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Validation for first name and last name (only letters and spaces)
    if (name === 'firstName' || name === 'lastName'||name === 'barcouncilNumber') {
      if (!/^[A-Za-z\s]*$/.test(value)) {
        return;
      }
    }
    
    // Validation for phone number (only numbers)
    if (name === 'phone') {
      if (!/^\d*$/.test(value)) {
        return;
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setIsEditing(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
        setFormData(prev => ({
          ...prev,
          profileImage: reader.result as string
        }));
        setIsEditing(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await onSave(formData);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError('Failed to update profile. Please try again.');
      console.error('Error updating profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAadharVerification = async () => {
    try {
      setIsVerifying(true);
      setVerificationError(null);
      
      // Validate Aadhar number format (12 digits)
      if (!/^\d{12}$/.test(formData.aadharNumber || '')) {
        setVerificationError('Please enter a valid 12-digit Aadhar number');
        return;
      }

      // Mock API call to send OTP
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setOtpSent(true);
      setShowOTPInput(true);
      setVerificationError(null);
      setResendTimer(30); // Start 30 second countdown
      
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationError('Failed to send OTP. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setIsResending(true);
      setVerificationError(null);
      
      // Mock API call to resend OTP
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setResendTimer(30); // Reset timer to 30 seconds
      setVerificationError(null);
      
    } catch (error) {
      console.error('Resend error:', error);
      setVerificationError('Failed to resend OTP. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyOTP = async () => {
    try {
      setIsVerifying(true);
      setVerificationError(null);
      
      if (!/^\d{6}$/.test(otp)) {
        setVerificationError('Please enter a valid 6-digit OTP');
        return;
      }

      // Mock API call to verify OTP
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock successful verification
      setVerificationError(null);
      setOtpSent(false);
      setShowOTPInput(false);
      setOtp('');
      
      // Update form data to mark Aadhar as verified
      setFormData(prev => ({
        ...prev,
        aadharVerified: true
      }));
      
    } catch (error) {
      console.error('OTP verification error:', error);
      setVerificationError('Failed to verify OTP. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Countdown timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resendTimer]);

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: UserIcon },
    { id: 'professional', label: 'Professional', icon: Briefcase },
    { id: 'aadhar', label: 'Aadhar', icon: CreditCard },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return (
          <div className="space-y-4">
            <div className="flex flex-col items-center space-y-4 mb-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-800 border-2 border-gray-700">
                  {profileImagePreview ? (
                    <img 
                      src={profileImagePreview} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <UserIcon className="w-12 h-12 text-gray-500" />
                    </div>
                  )}
                </div>
                <label 
                  htmlFor="profile-image" 
                  className="absolute bottom-0 right-0 bg-primary-500 p-1.5 rounded-full cursor-pointer hover:bg-primary-600 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5 text-white" />
                </label>
                <input 
                  id="profile-image" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageUpload}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  required
                  value={formData.firstName || ''}
                  
                  onChange={handleInputChange}
                  className={`mt-1 block w-full bg-gray-800 border ${
                    verificationError ? 'border-red-500' : 'border-gray-700'
                  } rounded-md shadow-sm py-2 px-3 text-white`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Email</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Address</label>
              <textarea
                name="address"
                value={formData.address || ''}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
                placeholder="Enter your office address"
              />
            </div>
          </div>
        );
      
      case 'professional':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300">Bar Council Number</label>
              <input
                type="text"
                name="barCouncilNumber"
                value={formData.barCouncilNumber || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
                placeholder="Enter your Bar Council Number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Website</label>
              <input
                type="url"
                name="website"
                value={formData.website || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
                placeholder="https://your-website.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Specialization</label>
              <input
                type="text"
                name="specialization"
                value={formData.specialization || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
                placeholder="e.g., Corporate Law, Criminal Law"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Experience</label>
              <textarea
                name="experience"
                value={formData.experience || ''}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
                placeholder="Your professional experience"
              />
            </div>
          </div>
        );
      case 'aadhar':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300">Aadhar Number</label>
              <input
                type="text" 
                name="aadharNumber"
                required
                maxLength={12}
                value={formData.aadharNumber || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
                placeholder="Enter your Aadhar Number"
                disabled={formData.aadharVerified}
              />
              {formData.aadharVerified && (
                <div className="mt-2 text-sm text-green-400 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Aadhar Number Verified
                </div>
              )}
            </div>
            
            {verificationError && (
              <div className="text-red-400 text-sm">{verificationError}</div>
            )}
            
            {!formData.aadharVerified && !otpSent && (
              <button
                type="button"
                onClick={handleAadharVerification}
                disabled={isVerifying || !formData.aadharNumber || formData.aadharNumber.length !== 12}
                className="w-full px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifying ? 'Verifying...' : 'Verify Aadhar Number'}
              </button>
            )}
            
            {otpSent && showOTPInput && (
              <div className="mt-4 p-4 bg-gray-800 rounded-md">
                <p className="text-sm text-gray-300 mb-2">OTP has been sent to your registered mobile number.</p>
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  maxLength={6}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"
                  disabled={!otpSent}
                />
                <div className="mt-2 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={handleVerifyOTP}
                    disabled={isVerifying || otp.length !== 6}
                    className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isVerifying ? 'Verifying...' : 'Verify OTP'}
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={isResending || resendTimer > 0}
                    className="text-sm text-primary-400 hover:text-primary-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-900/50 border border-green-700 text-green-200 px-4 py-3 rounded-md">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col items-center space-y-2 mb-4">
          <div className="text-center">
            <h3 className="text-lg font-medium text-white">
              {formData.firstName} {formData.lastName}
            </h3>
            <p className="text-sm text-gray-400">{formData.email}</p>
          </div>
        </div>

        <div className="border-b border-gray-700">
          <div className="flex overflow-x-auto hide-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-primary-400 border-b-2 border-primary-500'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="py-4">
          {renderTabContent()}
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-700 rounded-md text-gray-300 hover:bg-gray-800"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading || !isEditing}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

const Settings = () => {
  const navigate = useNavigate();
  const {currentUser, logout, updateProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const { i18n } = useTranslation();
  const [activeSection, setActiveSection] = useState('Account');
  const [showModal, setShowModal] = useState(false);
  
  
  const [modalContent, setModalContent] = useState<{
    title: string;
    component: React.ReactNode;
  } | null>(null);
  const [userDetails, setUserDetails] = useState<ExtendedUser>({
    displayName: '',
    email: '',
    phone: '',
    address: '',
    barCouncilNumber: '',
  });

  const handleCloseModal = () => {
    setShowModal(false);
   
    
  };

  // Update userDetails when currentUser changes
  useEffect(() => {
    if (currentUser) {
      const user = currentUser as ExtendedUser;
      const firstName = user.firstName || '';
      const lastName = user.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim();
      
      setUserDetails({
        displayName: fullName,
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        website: user.website || '',
        barCouncilNumber: user.barCouncilNumber || '',
        firstName,
        lastName,
      });
    }
  }, [currentUser]);

  const handleUpdateProfile = useCallback(async (data: any) => {
    try {
      await updateProfile(data);
      // Update the currentUser data after successful update
      if (currentUser) {
        Object.assign(currentUser, data);
      }
      setShowModal(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  }, [updateProfile, currentUser]);

  const handle2FAToggle = useCallback(async () => {
    try {
      // Implement 2FA toggle logic
      setShowModal(false);
    } catch (error) {
      console.error('Error toggling 2FA:', error);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const settingsSections: SettingSection[] = [
    {
      title: 'Account',
      icon: UserIcon,
      options: [
        {
          name: 'Profile Settings',
          description: 'Update your personal and professional details',
          action: () => {
            setModalContent({
              title: 'Profile Settings',
              component: (
                <ProfileSettings 
                  userDetails={userDetails} 
                  onClose={handleCloseModal} 
                  onSave={handleUpdateProfile} 
                />
              ),
            });
            setShowModal(true);
          },
        },
      ]
    },
    {
      title: 'Security',
      icon: Lock,
      options: [
        {
          name: 'Change Password',
          description: 'Update your password',
          action: () => {
            setModalContent({
              title: 'Change Password',
              component: <PasswordChangeForm onClose={handleCloseModal} />
            });
            setShowModal(true);
          },
        },
        {
          name: 'Two-Factor Authentication',
          description: 'Enable additional security',
          action: () => {
            setModalContent({
              title: 'Two-Factor Authentication',
              component: (
                <div className="space-y-4">
                  <p className="text-gray-300">
                    Two-factor authentication adds an extra layer of security to your account.
                  </p>
                  <button
                    onClick={handle2FAToggle}
                    className="w-full px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
                  >
                    Enable 2FA
                  </button>
                </div>
              ),
            });
            setShowModal(true);
          },
        },
        {
          name: 'Login History',
          description: 'View your recent login activity',
          action: () => {
            setModalContent({
              title: 'Login History',
              component: (
                <div className="space-y-4">
                  <div className="max-h-96 overflow-y-auto">
                    {[
                      { date: '2024-03-15 10:30', device: 'Chrome on Windows', location: 'New Delhi, India' },
                      { date: '2024-03-14 15:45', device: 'Safari on iPhone', location: 'Mumbai, India' },
                      { date: '2024-03-13 09:15', device: 'Firefox on MacOS', location: 'Bangalore, India' },
                    ].map((login, index) => (
                      <div key={index} className="p-4 bg-gray-800 rounded-lg mb-2">
                        <p className="text-white font-medium">{login.date}</p>
                        <p className="text-gray-400">{login.device}</p>
                        <p className="text-gray-400">{login.location}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ),
            });
            setShowModal(true);
          },
        },
      ]
    },
    {
      title: 'Notifications',
      icon: Bell,
      options: [
        {
          name: 'Email Notifications',
          description: 'Manage email alerts',
          action: () => {
            setModalContent({
              title: 'Email Notification Settings',
              component: (
                <form className="space-y-4">
                  {[
                    { label: 'Case Updates', key: 'caseUpdates' },
                    { label: 'Task Reminders', key: 'taskReminders' },
                    { label: 'Document Changes', key: 'documentChanges' },
                    { label: 'Client Messages', key: 'clientMessages' },
                  ].map((setting) => (
                    <div key={setting.key} className="flex items-center justify-between">
                      <label className="text-gray-300">{setting.label}</label>
                      <input
                        type="checkbox"
                        defaultChecked
                        className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-gray-700 rounded bg-gray-800"
                      />
                    </div>
                  ))}
                  <div className="flex justify-end space-x-2 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 border border-gray-700 rounded-md text-gray-300 hover:bg-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              ),
            });
            setShowModal(true);
          },
        },
        {
          name: 'Push Notifications',
          description: 'Configure push notifications',
          action: () => {
            setModalContent({
              title: 'Push Notification Settings',
              component: (
                <form className="space-y-4">
                  {[
                    { label: 'New Messages', key: 'newMessages' },
                    { label: 'Hearing Reminders', key: 'hearingReminders' },
                    { label: 'Deadline Alerts', key: 'deadlineAlerts' },
                    { label: 'System Updates', key: 'systemUpdates' },
                  ].map((setting) => (
                    <div key={setting.key} className="flex items-center justify-between">
                      <label className="text-gray-300">{setting.label}</label>
                      <input
                        type="checkbox"
                        defaultChecked
                        className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-gray-700 rounded bg-gray-800"
                      />
                    </div>
                  ))}
                  <div className="flex justify-end space-x-2 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 border border-gray-700 rounded-md text-gray-300 hover:bg-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              ),
            });
            setShowModal(true);
          },
        },
        {
          name: 'In-App Notifications',
          description: 'Customize in-app alerts',
          action: () => {
            setModalContent({
              title: 'In-App Notification Settings',
              component: (
                <form className="space-y-4">
                  {[
                    { label: 'Sound Effects', key: 'soundEffects' },
                    { label: 'Desktop Notifications', key: 'desktopNotifications' },
                    { label: 'Badge Indicators', key: 'badgeIndicators' },
                  ].map((setting) => (
                    <div key={setting.key} className="flex items-center justify-between">
                      <label className="text-gray-300">{setting.label}</label>
                      <input
                        type="checkbox"
                        defaultChecked
                        className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-gray-700 rounded bg-gray-800"
                      />
                    </div>
                  ))}
                  <div className="flex justify-end space-x-2 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 border border-gray-700 rounded-md text-gray-300 hover:bg-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              ),
            });
            setShowModal(true);
          },
        },
      ]
    },
  ];

  const handleSectionClick = (label: string) => {
    setActiveSection(label);
    
    switch (label) {
      case 'Language':
        setModalContent({
          title: 'Language Settings',
          component: (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">Select Language</label>
                <select
                  value={i18n.language}
                  onChange={(e) => {
                    i18n.changeLanguage(e.target.value);
                    setShowModal(false);
                  }}
                  className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.nativeName} ({lang.name})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
                >
                  Close
                </button>
              </div>
            </div>
          ),
        });
        setShowModal(true);
        // Language settings are handled by the LanguageSelector component
        break;
      case 'Appearance':
        setModalContent({
          title: 'Appearance Settings',
          component: (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">Theme</label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
                  className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
                >
                  Close
                </button>
              </div>
            </div>
          ),
        });
        setShowModal(true);
        break;
      case 'Help & Support':
        setModalContent({
          title: 'Help & Support',
          component: (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-white">Documentation</h3>
                <a
                  href="https://docs.octogenie.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  View Documentation
                </a>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-white">Support</h3>
                <a
                  href="mailto:support@octogenie.com"
                  className="block p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Contact Support
                </a>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-white">FAQ</h3>
                <a
                  href="https://octogenie.com/faq"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  View FAQ
                </a>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
                >
                  Close
                </button>
              </div>
            </div>
          ),
        });
        setShowModal(true);
        break;
      case 'Logout':
        handleLogout();
        break;
      default:
        // For other sections, we'll just activate them
        break;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="mt-2 text-gray-400">Manage your account preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1 space-y-4"
        >
          {[
            { icon: UserIcon, label: 'Account' },
            { icon: Lock, label: 'Security' },
            { icon: Bell, label: 'Notifications' },
            { icon: Globe, label: 'Language' },
            { icon: Palette, label: 'Appearance' },
            { icon: HelpCircle, label: 'Help & Support' },
            { icon: LogOut, label: 'Logout' },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => handleSectionClick(item.label)}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors text-left
                ${activeSection === item.label ? 'bg-primary-500/20 text-primary-400' : 'hover:bg-gray-800/50 text-gray-200'}`}
            >
              <item.icon className={`w-5 h-5 ${activeSection === item.label ? 'text-primary-400' : 'text-gray-400'}`} />
              <span>{item.label}</span>
            </button>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 space-y-6 min-h-[400px]"
        >
          {settingsSections.filter((section: SettingSection) => 
            section.title === activeSection
          ).map((section: SettingSection, sectionIndex: number) => (
            <div
              key={sectionIndex}
              className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6"
            >
              <div className="flex items-center space-x-3 mb-6">
                <section.icon className="w-6 h-6 text-primary-400" />
                <h2 className="text-xl font-semibold text-white">{section.title}</h2>
              </div>
              <div className="space-y-4">
                {section.options.map((option: SettingOption, optionIndex: number) => (
                  <div
                    key={optionIndex}
                    className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors cursor-pointer"
                  >
                    <div>
                      <h3 className="text-white font-medium group-hover:text-primary-400">{option.name}</h3>
                      <p className="text-sm text-gray-400">{option.description}</p>
                    </div>
                    <button
                      onClick={option.action}
                      className="px-4 py-2 bg-primary-500/10 text-primary-400 rounded-lg hover:bg-primary-500/20 transition-colors"
                    >
                      open
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
      
      {/* Settings Modal */}
      {showModal && modalContent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gray-900/90 rounded-xl border border-gray-800 p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-white mb-4">{modalContent.title}</h2>
            {modalContent.component}
          </div>
        </div>
      )}
    </div>
  );
};

const PasswordChangeForm: React.FC<PasswordChangeFormProps> = ({ onClose }) => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handlePasswordChange = async () => {
    try {
      if (newPassword !== confirmPassword) {
        alert('New passwords do not match');
        return;
      }
      // Implement password change logic here
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (error) {
      console.error('Error changing password:', error);
    }
  };

  return (
    <form className="space-y-4" onSubmit={(e) => {
      e.preventDefault();
      handlePasswordChange();
    }}>
      <div>
        <label className="block text-sm font-medium text-gray-300">Current Password</label>
        <div className="relative">
          <input
            type={showCurrentPassword ? "text" : "password"}
            name="currentPassword"
            value={currentPassword}
            required
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white pr-10"
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center mt-1"
          >
            {showCurrentPassword ? (
              <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300" />
            ) : (
              <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300" />
            )}
          </button>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300">New Password</label>
        <div className="relative">
          <input
            type={showNewPassword ? "text" : "password"}
            name="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white pr-10"
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center mt-1"
          >
            {showNewPassword ? (
              <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300" />
            ) : (
              <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300" />
            )}
          </button>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300">Confirm New Password</label>
        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center mt-1"
          >
            {showConfirmPassword ? (
              <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300" />
            ) : (
              <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300" />
            )}
          </button>
        </div>
      </div>
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-gray-700 rounded-md text-gray-300 hover:bg-gray-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
        >
          Change Password
        </button>
      </div>
    </form>
  );
};

export default Settings;