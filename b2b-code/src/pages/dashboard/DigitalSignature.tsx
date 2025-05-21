import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  FileSignature, Upload, Download,CheckCircle, X, AlertCircle, Trash2, Eraser, FileText, PenTool, 
  Settings } from 'lucide-react';
import { Document } from 'react-pdf';

interface Signer {
  id: string;
  name: string;
  email: string;
  status: 'pending' | 'signed' | 'rejected';
  signatureType?: 'virtual' | 'aadhar';
  signatureData?: string;
  aadharVerified?: boolean;
  virtualVerified?: boolean;
  signedAt?: string;
}

interface Recipient {
  id: string;
  name: string;
  email: string;
  verificationStatus: 'pending' | 'verified';
  verificationToken?: string;
  signedAt?: string;
  signatureData?: string;
}

interface Document {
  id: string;
  name: string;
  status: 'pending' | 'completed' | 'in_progress';
  signers: Signer[];
  deadline: string;
  recipients: Recipient[];
  url?: string;
  signatureFields?: {
    x: number;
    y: number;
    width: number;
    height: number;
    required: boolean;
    signerId: string;
  }[];
  type?: string;
}

interface SignatureStyle {
  color: string;
  thickness: number;
  fontFamily?: string;
  fontSize?: number;
}

const DigitalSignature = () => {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isSigningModalOpen, setIsSigningModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [signingError, setSigningError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [canvasError, setCanvasError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [signatureType, setSignatureType] = useState<'virtual' | 'aadhar' | null>(null);
  const [currentSigner, setCurrentSigner] = useState<Signer | null>(null);
  const [uploadedSignature, setUploadedSignature] = useState<string | null>(null);
  const [uploadSignatureError, setUploadSignatureError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const signatureUploadRef = useRef<HTMLInputElement>(null);
  const [typedSignature, setTypedSignature] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [signaturePosition, setSignaturePosition] = useState({ x: 0, y: 0 });
  const [showStyleOptions, setShowStyleOptions] = useState(false);
  const [isAadharModalOpen, setIsAadharModalOpen] = useState(false);
  const [aadharNumber, setAadharNumber] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [showOTPInput, setShowOTPInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [isSignerInfoModalOpen, setIsSignerInfoModalOpen] = useState(false);
  const [signatureData, setSignatureData] = useState<string>('');
  const [signatureStyle, setSignatureStyle] = useState<SignatureStyle>({
    color: '#000000',
    thickness: 2,
    fontFamily: 'Dancing Script',
    fontSize: 24
  });
  const [signatureMode, setSignatureMode] = useState<'draw' | 'select' | 'upload' | null>(null);
  const [isSharingModalOpen, setIsSharingModalOpen] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [sharingError, setSharingError] = useState<string | null>(null);
  const [sharingSuccess, setSharingSuccess] = useState(false);
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [emailVerificationError, setEmailVerificationError] = useState<string | null>(null);
  const [urlToken, setUrlToken] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  

  // Extract token from URL on component mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setUrlToken(token);
      handleUrlSignature(token);
    }
  }, []);

  const handleUrlSignature = async (token: string) => {
    try {
      const params = new URLSearchParams(window.location.search);
      const docId = params.get('docId');
      
      if (!docId) {
        setSigningError('Invalid document ID');
        return;
      }

      // Find document and recipient matching the token
      const doc = documents.find(d => d.id === docId && d.recipients.some(r => r.verificationToken === token));
      if (!doc) {
        setSigningError('Invalid signature link');
        return;
      }

      const recipient = doc.recipients.find(r => r.verificationToken === token);
      if (!recipient) {
        setSigningError('Invalid or unverified recipient');
        return;
      }

      // Set the document and recipient information
      setSelectedDoc(doc);
      setSignerName(recipient.name);
      setSignerEmail(recipient.email);
      setSignatureType('virtual');
      
      // Instead of automatically opening the signing modal,
      // we'll just set the document as selected and let the user click Sign Now
      setSelectedDoc(doc);
    } catch (error) {
      console.error('Error processing signature URL:', error);
      setSigningError('Failed to process signature link');
    }
  };

  const handleRecipientSign = async (docId: string, verificationToken: string, signatureData: string) => {
    try {
      const doc = documents.find(d => d.id === docId);
      if (!doc) {
        throw new Error('Document not found');
      }

      const recipient = doc.recipients.find(r => r.verificationToken === verificationToken);
      if (!recipient || recipient.verificationStatus !== 'verified') {
        throw new Error('Invalid or unverified recipient');
      }

      // Update recipient signature
      const updatedRecipients = doc.recipients.map(r => {
        if (r.verificationToken === verificationToken) {
          return {
            ...r,
            signatureData,
            signedAt: new Date().toISOString()
          };
        }
        return r;
      });

      // Update document status
      const updatedDoc = {
        ...doc,
        recipients: updatedRecipients,
        status: 'completed' as const
      };

      // Update documents list
      setDocuments(prevDocs => 
        prevDocs.map(d => d.id === docId ? updatedDoc : d)
      );

      return true;
    } catch (error) {
      console.error('Error processing recipient signature:', error);
      return false;
    }
  };

  // demo documents
  const [documents, setDocuments] = useState<Document[]>(() => {
    try {
      const savedDocs = localStorage.getItem('digitalSignatureDocuments');
      if (savedDocs) {
        return JSON.parse(savedDocs);
      }
    } catch (error) {
      console.error('Error loading saved documents:', error);
    }
    return [
      {
        id: '1',
        name: 'Contract Agreement.pdf',
        status: 'pending',
        signers: [
          {
            id: 'doc-1',
            name: 'John Smith',
            email: 'john@example.com',
            status: 'pending'
          },
          {
            id: 'doc-2',
            name: 'Sarah Wilson',
            email: 'sarah@example.com',
            status: 'pending'
          }
        ],
        recipients: [],
        deadline: '2024-03-20',
        url: '/documents/contract-agreement.pdf'
      },
      {
        id: 2,
        name: 'NDA Document.pdf',
        status: 'completed',
        signers: [
          {
            id: 'doc-3',
            name: 'Tech Corp',
            email: 'legal@techcorp.com',
            status: 'signed',
            signatureType: 'virtual',
            signedAt: '2024-03-15T10:00:00Z'
          },
          {
            id: 'doc-4',
            name: 'Legal Team',
            email: 'legal@example.com',
            status: 'signed',
            signatureType: 'aadhar',
            aadharVerified: true,
            signedAt: '2024-03-15T11:00:00Z'
          }
        ],
        recipients: [],
        deadline: '2024-03-15',
        url: '/documents/nda-document.pdf'
      },
      {
        id: 'doc-5',
        name: 'Partnership Agreement.pdf',
        status: 'in_progress',
        signers: [
          {
            id: '5',
            name: 'Partner A',
            email: 'partnera@example.com',
            status: 'signed',
            signatureType: 'virtual',
            signedAt: '2024-03-20T09:00:00Z'
          },
          {
            id: '6',
            name: 'Partner B',
            email: 'partnerb@example.com',
            status: 'pending'
          },
          {
            id: '7',
            name: 'Legal Team',
            email: 'legal@example.com',
            status: 'pending'
          }
        ],
        recipients: [],
        deadline: '2024-03-25',
        url: '/documents/partnership-agreement.pdf'
      },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('digitalSignatureDocuments', JSON.stringify(documents));
    } catch (error) {
      console.error('Error saving documents:', error);
    }
  }, [documents]);

  // Initialize canvas when modal opens
  useEffect(() => {
    if (isSigningModalOpen && canvasRef.current) {
      try {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.error('Could not get canvas context');
          setCanvasError('Failed to initialize signature pad');
          return;
        }

        // Set canvas size
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        // Set initial canvas style
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#ffffff';
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setCanvasError(null);
      } catch (error) {
        console.error('Error initializing canvas:', error);
        setCanvasError('Failed to initialize signature pad');
      }
    }
  }, [isSigningModalOpen]);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) / dpr,
        y: (e.touches[0].clientY - rect.top) / dpr
      };
    } else {
      return {
        x: (e.clientX - rect.left) / dpr,
        y: (e.clientY - rect.top) / dpr
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureData(canvas.toDataURL());
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const dpr = window.devicePixelRatio || 1;
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        setSignatureData('');
      }
    }
  };

  const validateFile = (file: File): string | null => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    if (file.size > maxSize) {
      return 'File size should be less than 10MB';
    }

    if (!allowedTypes.includes(file.type)) {
      return 'Only PDF and Word documents are allowed';
    }

    return null;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const error = validateFile(file);
      if (error) {
        setUploadError(error);
        setTimeout(() => setUploadError(null), 3000);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Data = e.target?.result as string;
        const newDoc: Document = {
          id: `doc-${documents.length + 1}`,
          name: file.name,
          status: 'pending',
          signers: [],
          recipients: [],
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          url: base64Data,
          type: file.type
        };

        setDocuments(prevDocs => [...prevDocs, newDoc]);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = async (docName: string) => {
    try {
      setDownloadError(null);
      // Here you would typically make an API call to get the document
      // For now, we'll simulate a download with a timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = `#`; // Replace with actual document URL from your API
      link.download = docName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
      setDownloadError('Failed to download document. Please try again.');
      // Clear error message after 3 seconds
      setTimeout(() => setDownloadError(null), 3000);
    }
  };

  const handleSignNow = async (doc: Document) => {
    const signedSignersCount = doc.signers.filter(signer => signer.status === 'signed').length;
    if (signedSignersCount >= 3) {
      setSigningError('Maximum number of signed signers (3) reached for this document');
      return;
    }
    setSelectedDoc(doc);
    setIsPreviewModalOpen(true);
  };

  const handleSignerInfoSubmit = () => {
    if (!signerName || !signerEmail) return;

    if (selectedDoc) {
      const signedSignersCount = selectedDoc.signers.filter(signer => signer.status === 'signed').length;
      if (signedSignersCount >= 3) {
        setSigningError('Maximum number of signed signers (3) reached for this document');
        setIsSignerInfoModalOpen(false);
        return;
      }
    }

    const newSigner: Signer = {
      id: Date.now().toString(),
      name: signerName,
      email: signerEmail,
      status: 'pending',
      signatureType: undefined,
      signatureData: undefined,
      aadharVerified: false,
      virtualVerified: false
    };

    if (selectedDoc) {
      const updatedDoc = {
        ...selectedDoc,
        signers: [...selectedDoc.signers, newSigner]
      };
      setDocuments(prevDocs => 
        prevDocs.map(doc => doc.id === selectedDoc.id ? updatedDoc : doc)
      );
      setCurrentSigner(newSigner);
      setIsSignerInfoModalOpen(false);
      setIsAadharModalOpen(true); // Open Aadhar verification modal directly
    }
  };

  const handleSignatureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setUploadSignatureError('Please upload a valid image (PNG, JPEG) or PDF file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadSignatureError('File size should be less than 5MB');
      return;
    }

    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedSignature(e.target?.result as string);
      setUploadSignatureError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - signaturePosition.x,
      y: e.clientY - signaturePosition.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setSignaturePosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetSignaturePosition = () => {
    setSignaturePosition({ x: 0, y: 0 });
  };

  const validateRequiredFields = () => {
    if (!selectedDoc?.signatureFields) return true;
    
    return selectedDoc.signatureFields.every(field => {
      const signature = signatureData || uploadedSignature || typedSignature;
      if (!signature) return false;
      
      // Check if signature overlaps with required field
      return (
        signaturePosition.x <= field.x + field.width &&
        signaturePosition.x + 200 >= field.x && // Assuming signature width is 200px
        signaturePosition.y <= field.y + field.height &&
        signaturePosition.y + 100 >= field.y // Assuming signature height is 100px
      );
    });
  };

  const validateName = (name: string) => {
    if (!name.trim()) {
      setNameError('Name is required');
      return false;
    }
    setNameError(null);
    return true;
  };

  const validateEmail = (email: string) => {
    if (!email.trim()) {
      setEmailError('Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError(null);
    return true;
  };

  // Add a function to check if signature is valid for current mode
  const isSignatureValid = () => {
    if (!signatureMode) return false;
    
    switch (signatureMode) {
      case 'draw':
        return !!signatureData;
      case 'select':
        return !!typedSignature;
      case 'upload':
        return !!uploadedSignature;
      default:
        return false;
    }
  };

  const handleSignatureSubmit = async () => {
    try {
      setSigningError(null);
      
      // Check if we have either a current signer or a URL token
      if (!currentSigner && !urlToken) {
        setSigningError('No signer information available');
        return;
      }

      // Check if signature mode is selected and valid
      if (!signatureMode) {
        setSigningError('Please select a signature mode');
        return;
      }

      // Check if signature is valid for current mode
      if (!isSignatureValid()) {
        setSigningError('Please add your signature');
        return;
      }

      if (!validateRequiredFields()) {
        setSigningError('Please place your signature in the required field');
        return;
      }

      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // If this is a recipient signing via URL
      if (urlToken && selectedDoc) {
        const success = await handleRecipientSign(
          selectedDoc.id,
          urlToken,
          signatureData || typedSignature || ''
        );
        if (!success) {
          setSigningError('Failed to process recipient signature');
          return;
        }
        
        // Show success message
        setSharingSuccess(true);
        setTimeout(() => {
          setSharingSuccess(false);
          setIsSigningModalOpen(false);
          // Clear URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);
        }, 3000);
      }
      
      // Update document status
      const updatedDocs = documents.map((doc) => {
        if (selectedDoc && doc.id === selectedDoc.id) {
          // If current signer exists, update their status
          if (currentSigner) {
            const updatedSigner: Signer = {
              ...currentSigner,
              name: signerName,
              email: signerEmail,
              status: 'signed',
              signatureType: 'virtual',
              signatureData: signatureData || typedSignature || uploadedSignature || '',
              aadharVerified: true,
              virtualVerified: true,
              signedAt: new Date().toISOString()
            };

            // Check if signer already exists in the document
            const existingSignerIndex = doc.signers.findIndex(s => s.id === currentSigner.id);
            let updatedSigners;
            
            if (existingSignerIndex !== -1) {
              // Update existing signer
              updatedSigners = doc.signers.map(s => 
                s.id === currentSigner.id ? updatedSigner : s
              );
            } else {
              // Add new signer
              updatedSigners = [...doc.signers, updatedSigner];
            }

            const signedSignersCount = updatedSigners.filter(signer => signer.status === 'signed').length;
            const isCompleted = signedSignersCount >= 3;
            
            return {
              ...doc,
              status: (isCompleted ? 'completed' : 'in_progress') as 'completed' | 'in_progress',
              signers: updatedSigners
            };
          }
        }
        return doc;
      });
      setDocuments(updatedDocs);
      
      // Close modal and reset states
      setIsSigningModalOpen(false);
      setSignatureData('');
      setTypedSignature('');
      setCurrentSigner(null);
      setSignatureType(null);
      setSignatureMode(null);
      resetSignaturePosition();
      
      console.log('Signature submitted successfully');
    } catch (error) {
      console.error('Error submitting signature:', error);
      setSigningError('Failed to sign document. Please try again.');
    }
  };

  const handleDeleteDocument = (docId: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      setDocuments((prevDocs: Document[]) => prevDocs.filter((doc: Document) => doc.id !== docId));
    }
  };

  const clearUploadedSignature = () => {
    setUploadedSignature(null);
    setUploadedFileName(null);
    if (signatureUploadRef.current) {
      signatureUploadRef.current.value = '';
    }
  };

  const handleAadharVerification = async () => {
    try {
      setIsVerifying(true);
      setVerificationError(null);
      
      // Validate Aadhar number format (12 digits)
      if (!/^\d{12}$/.test(aadharNumber)) {
        setVerificationError('Please enter a valid 12-digit Aadhar number');
        return;
      }

      // Mock API call to send OTP
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setOtpSent(true);
      setShowOTPInput(true);
      setVerificationError(null);
      
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationError('Failed to send OTP. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleOTPVerification = async () => {
    try {
      setIsVerifying(true);
      setOtpError(null);
      
      // Validate OTP format (6 digits)
      if (!/^\d{6}$/.test(otp)) {
        setOtpError('Please enter a valid 6-digit OTP');
        return;
      }

      // Mock OTP validation - check if OTP is 123456
      if (otp !== '123456') {
        setOtpError('Invalid OTP. Please try again. (Hint: Use 123456)');
        return;
      }

      // Mock API call to verify OTP
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create new signer after Aadhar verification
      const newSigner: Signer = {
        id: Date.now().toString(),
        name: signerName,
        email: signerEmail,
        status: 'pending',
        signatureType: 'virtual',
        signatureData: undefined,
        aadharVerified: true,
        virtualVerified: false
      };

      setCurrentSigner(newSigner);
      
      // After successful Aadhar verification, open signing modal
      setOtpVerified(true);
      setTimeout(() => {
        setIsAadharModalOpen(false);
        setIsSigningModalOpen(true);
        setSignatureType('virtual');
        setOtpVerified(false);
        // Reset states
        setAadharNumber('');
        setOtp('');
        setShowOTPInput(false);
        setOtpSent(false);
      }, 1500);
      
    } catch (error) {
      console.error('OTP verification error:', error);
      setOtpError('Invalid OTP. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setIsVerifying(true);
      setOtpError(null);
      
      // Mock API call to resend OTP
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setOtpSent(true);
      setOtp('');
      setOtpError(null);
      
    } catch (error) {
      console.error('Resend OTP error:', error);
      setOtpError('Failed to resend OTP. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleShareDocument = (doc: Document) => {
    setSelectedDoc(doc);
    setIsSharingModalOpen(true);
  };

  const handleAddRecipient = () => {
    const newRecipient: Recipient = {
      id: `recipient-${recipients.length + 1}`,
      name: '',
      email: '',
      verificationStatus: 'pending'
    };
    setRecipients([...recipients, newRecipient]);
  };

  const handleRemoveRecipient = (id: string) => {
    setRecipients(recipients.filter(r => r.id !== id));
  };

  const handleRecipientChange = (id: string, field: keyof Recipient, value: string) => {
    setRecipients(recipients.map(r => 
      r.id === id ? { ...r, [field]: value } : r
    ));
    
    // Add email verification when email field changes
    if (field === 'email') {
      setIsVerifyingEmail(true);
      // Simulate email verification
      setTimeout(() => {
        setIsVerifyingEmail(false);
        setEmailVerificationError(value.includes('@') ? null : 'Invalid email format');
      }, 1000);
    }
  };

  const validateRecipients = () => {
    return recipients.every(r => r.name && r.email);
  };

  const sendVerificationEmail = async (recipient: Recipient, docId: string) => {
    // In production, this would call your email service
    const token = Math.random().toString(36).substring(2, 15);
    const signUrl = `${window.location.origin}/dashboard/digital-signature?token=${token}&docId=${docId}`;
    
    // Mock email sending
    console.log(`Sending verification email to ${recipient.email} with link: ${signUrl}`);
    
    // In production, you would send an actual email with the link
    // Example using a service like SendGrid:
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    console.log('Email would be sent with:', {
      to: recipient.email,
      from: 'noreply@yourdomain.com',
      subject: 'Document Signing Request',
      html: `
        <p>Hello ${recipient.name},</p>
        <p>You have been requested to sign a document. Please click the link below to sign:</p>
        <p><a href="${signUrl}">Sign Document</a></p>
        <p>Document Details:</p>
        <ul>
          <li>Document ID: ${docId}</li>
          <li>Expires in: 24 hours</li>
        </ul>
        <p>If you did not request this, please ignore this email.</p>
        <p>Best regards,<br>Your Company Name</p>
      `
    });
    
    return token;
  };

  const handleSendForSigning = async () => {
    if (!selectedDoc) return;

    // Add validation for recipients
    if (recipients.length === 0) {
      setSharingError('Please add at least one recipient before sending for signing');
      return;
    }

    if (!validateRecipients()) {
      setSharingError('Please fill in all recipient details');
      return;
    }

    try {
      setIsSendingEmails(true);
      setSharingError(null);

      // Send verification emails to all recipients
      const updatedRecipients: Recipient[] = await Promise.all(
        recipients.map(async (recipient) => {
          const token = await sendVerificationEmail(recipient, selectedDoc.id);
          return {
            ...recipient,
            verificationToken: token,
            verificationStatus: 'pending' as const
          };
        })
      );

      // Update document with recipients
      const updatedDoc: Document = {
        ...selectedDoc,
        recipients: updatedRecipients,
        status: 'in_progress' as const
      };

      // Update documents list
      setDocuments(prevDocs => 
        prevDocs.map(doc => doc.id === selectedDoc.id ? updatedDoc : doc)
      );

      setSharingSuccess(true);
      setTimeout(() => {
        setSharingSuccess(false);
        setIsSharingModalOpen(false);
        setRecipients([]);
      }, 3000);

    } catch (error) {
      console.error('Error sharing document:', error);
      setSharingError('Failed to share document. Please try again.');
    } finally {
      setIsSendingEmails(false);
    }
  };

  // Add cleanup for file URLs when component unmounts
  useEffect(() => {
    return () => {
      documents.forEach(doc => {
        if (doc.url && doc.url.startsWith('blob:')) {
          URL.revokeObjectURL(doc.url);
        }
      });
    };
  }, [documents]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900/80 via-gray-800/50 to-black/80 p-8 relative backdrop-blur-sm">
      <div className="max-w-7xl mx-auto">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Digital Signature</h1>
            <p className="mt-2 text-gray-300">Securely sign and manage legal documents</p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl border border-gray-800"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Documents for Signature</h2>
              <div className="relative">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Upload New</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Upload Status Messages */}
            <AnimatePresence>
              {uploadError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 p-3 bg-red-500/20 text-red-400 rounded-lg flex items-center space-x-2"
                >
                  <AlertCircle className="w-5 h-5" />
                  <span>{uploadError}</span>
                </motion.div>
              )}
              {uploadSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 p-3 bg-green-500/20 text-green-400 rounded-lg flex items-center space-x-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>Document uploaded successfully!</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              {documents?.map((doc) => {
                const signedSignersCount = doc.signers.filter(signer => signer.status === 'signed').length;
                const isRecipient = doc.recipients.some(r => r.verificationToken === urlToken);
                
                return (
                  <div key={doc.id} className="bg-gray-800/50 rounded-lg p-4">
                    {downloadError && doc.id === selectedDoc?.id && (
                      <div className="mb-4 p-3 bg-red-500/20 text-red-400 rounded-lg text-sm">
                        {downloadError}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                          <FileSignature className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-white">{doc.name}</h3>
                          <div className="flex items-center mt-1 space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              doc.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                              doc.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {doc.status.charAt(0).toUpperCase() + doc.status.slice(1).replace('_', ' ')}
                            </span>
                            <span className="text-sm text-gray-300">
                              Deadline: {doc.deadline}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {(doc.status !== 'completed' && signedSignersCount < 3 && (isRecipient || !urlToken)) && (
                          <button 
                            onClick={() => handleSignNow(doc)}
                            className="px-4 py-2 text-primary-400 rounded-lg hover:bg-primary-500/20 transition-colors"
                          >
                            Sign Now
                          </button>
                        )}
                        <button 
                          onClick={() => handleDownload(doc.name)}
                          className="p-2 bg-gray-700/50 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleShareDocument(doc)}
                          className="p-2 bg-gray-700/50 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          <FileSignature className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-300">Signers ({signedSignersCount}/3)</h4>
                      </div>
                      {signedSignersCount > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {doc.signers.map((signer) => (
                            signer.status === 'signed' && (
                              <div key={signer.id} className="flex items-center space-x-1 px-2 py-1 bg-gray-700/50 rounded-lg">
                                <CheckCircle className="w-4 h-4 text-green-400" />
                                {/* {signer.aadharVerified && <div className="text-xs text-green-400">(Aadhar)</div>}
                                {signer.virtualVerified && <div className="text-xs text-green-400">(Virtual)</div>} */}
                                <span className="text-sm text-gray-300">{signer.name}</span>
                                {signer.signedAt && (
                                  <span className="text-xs text-gray-400">
                                    ({new Date(signer.signedAt).toLocaleDateString()})
                                  </span>
                                )}
                              </div>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Signing Modal */}
          <AnimatePresence>
            {isSigningModalOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-gray-900/90 rounded-xl p-6 w-full max-w-2xl border border-gray-800"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-white">Sign Document</h3>
                    <button
                      onClick={() => setIsSigningModalOpen(false)}
                      className="text-gray-300 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-gray-300">Document: {selectedDoc?.name}</p>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Signer Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={signerName}
                          onChange={(e) => {
                            setSignerName(e.target.value);
                            validateName(e.target.value);
                          }}
                          onBlur={(e) => validateName(e.target.value)}
                          className={`w-full bg-gray-800 border ${
                            nameError ? 'border-red-500' : 'border-gray-700'
                          } rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500`}
                          placeholder="Enter signer name..."
                          required
                        />
                        {nameError && (
                          <p className="mt-1 text-sm text-red-500">{nameError}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={signerEmail}
                          onChange={(e) => {
                            setSignerEmail(e.target.value);
                            validateEmail(e.target.value);
                          }}
                          onBlur={(e) => validateEmail(e.target.value)}
                          className={`w-full bg-gray-800 border ${
                            emailError ? 'border-red-500' : 'border-gray-700'
                          } rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500`}
                          placeholder="Enter email..."
                          required
                        />
                        {emailError && (
                          <p className="mt-1 text-sm text-red-500">{emailError}</p>
                        )}
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex space-x-4 mb-4">
                      </div>

                      <div className="relative">
                        {signatureType === 'virtual' ? (
                          <div className="relative">
                            {canvasError ? (
                              <div className="bg-red-500/20 text-red-400 p-4 rounded-lg">
                                {canvasError}
                              </div>
                            ) : (
                              <>
                                <div className="mb-4 flex space-x-4">
                                  <button
                                    onClick={() => {
                                      setSignatureMode('draw');
                                      setSignatureData('');
                                      setTypedSignature('');
                                      setUploadedSignature(null);
                                    }}
                                    className={`flex-1 py-2 rounded-lg transition-colors ${
                                      signatureMode === 'draw'
                                        ? 'bg-primary-500/20 text-primary-400'
                                        : 'bg-gray-800/50 text-gray-300 hover:bg-gray-800'
                                    }`}
                                  >
                                    <div className="flex items-center justify-center space-x-2">
                                      <PenTool className="w-4 h-4" />
                                      <span>Draw</span>
                                    </div>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSignatureMode('select');
                                      setSignatureData('');
                                      setTypedSignature('');
                                      setUploadedSignature(null);
                                    }}
                                    className={`flex-1 py-2 rounded-lg transition-colors ${
                                      signatureMode === 'select'
                                        ? 'bg-primary-500/20 text-primary-400'
                                        : 'bg-gray-800/50 text-gray-300 hover:bg-gray-800'
                                    }`}
                                  >
                                    <div className="flex items-center justify-center space-x-2">
                                      <FileSignature className="w-4 h-4" />
                                      <span>Select</span>
                                    </div>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSignatureMode('upload');
                                      setSignatureData('');
                                      setTypedSignature('');
                                      setUploadedSignature(null);
                                    }}
                                    className={`flex-1 py-2 rounded-lg transition-colors ${
                                      signatureMode === 'upload'
                                        ? 'bg-primary-500/20 text-primary-400'
                                        : 'bg-gray-800/50 text-gray-300 hover:bg-gray-800'
                                    }`}
                                  >
                                    <div className="flex items-center justify-center space-x-2">
                                      <Upload className="w-4 h-4" />
                                      <span>Upload</span>
                                    </div>
                                  </button>
                                </div>

                                {signatureMode === 'draw' && (
                                  <>
                                    <div 
                                      className="relative"
                                      onMouseDown={handleMouseDown}
                                      onMouseMove={handleMouseMove}
                                      onMouseUp={handleMouseUp}
                                      onMouseLeave={handleMouseUp}
                                    >
                                      <canvas
                                        ref={canvasRef}
                                        className="w-full h-48 bg-gray-800 rounded-lg border border-gray-700 cursor-crosshair touch-none"
                                        onMouseDown={startDrawing}
                                        onMouseMove={draw}
                                        onMouseUp={stopDrawing}
                                        onMouseLeave={stopDrawing}
                                        onTouchStart={startDrawing}
                                        onTouchMove={draw}
                                        onTouchEnd={stopDrawing}
                                        style={{ touchAction: 'none' }}
                                      />
                                      <div className="absolute top-2 right-2 flex space-x-2">
                                        <button
                                          onClick={() => setShowStyleOptions(!showStyleOptions)}
                                          className="p-2 bg-gray-700/50 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                                          title="Style options"
                                        >
                                          <Settings className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={clearSignature}
                                          className="p-2 bg-gray-700/50 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                                          title="Clear signature"
                                        >
                                          <Eraser className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                    {showStyleOptions && (
                                      <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
                                        <div className="flex items-center space-x-4">
                                          <input
                                            type="color"
                                            value={signatureStyle.color}
                                            onChange={(e) => setSignatureStyle({ ...signatureStyle, color: e.target.value })}
                                            className="w-8 h-8 rounded cursor-pointer"
                                          />
                                          <input
                                            type="range"
                                            min="1"
                                            max="10"
                                            value={signatureStyle.thickness}
                                            onChange={(e) => setSignatureStyle({ ...signatureStyle, thickness: parseInt(e.target.value) })}
                                            className="w-32"
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </>
                                )}

                                {signatureMode === 'select' && (
                                  <div className="space-y-3">
                                    <div className="grid grid-cols-3 gap-4">
                                      <button
                                        onClick={() => {
                                          setSignatureStyle({ ...signatureStyle, fontFamily: 'Times New Roman' });
                                          setTypedSignature(signerName);
                                        }}
                                        className="p-2 bg-gray-800/50 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors"
                                      >
                                        <div className="text-center text-white font-medium" style={{ fontFamily: 'Times New Roman', fontSize: '20px' }}>
                                          {signerName}
                                        </div>
                                      </button>
                                      <button
                                        onClick={() => {
                                          setSignatureStyle({ ...signatureStyle, fontFamily: 'Brush Script MT' });
                                          setTypedSignature(signerName);
                                        }}
                                        className="p-2 bg-gray-800/50 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors"
                                      >
                                        <div className="text-center text-white font-medium" style={{ fontFamily: 'Brush Script MT', fontSize: '24px' }}>
                                          {signerName}
                                        </div>
                                      </button>
                                      <button
                                        onClick={() => {
                                          setSignatureStyle({ ...signatureStyle, fontFamily: 'Monotype Corsiva' });
                                          setTypedSignature(signerName);
                                        }}
                                        className="p-2 bg-gray-800/50 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors"
                                      >
                                        <div className="text-center text-white font-medium" style={{ fontFamily: 'Monotype Corsiva', fontSize: '22px' }}>
                                          {signerName}
                                        </div>
                                      </button>
                                    </div>
                                    {typedSignature && (
                                      <div className="p-2 bg-gray-800/50 rounded-lg border border-gray-700">
                                        <div className="text-center text-white font-medium" style={{ fontFamily: signatureStyle.fontFamily, fontSize: '24px' }}>
                                          {typedSignature}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {signatureMode === 'upload' && (
                                  <div className="space-y-4">
                                    <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center">
                                      <input
                                        type="file"
                                        ref={signatureUploadRef}
                                        onChange={handleSignatureUpload}
                                        accept=".png,.jpg,.jpeg,.pdf"
                                        className="hidden"
                                      />
                                      <button
                                        onClick={() => signatureUploadRef.current?.click()}
                                        className="flex flex-col items-center space-y-2 w-full"
                                      >
                                        <div className="p-3 bg-gray-800/50 rounded-lg">
                                          <Upload className="w-6 h-6 text-gray-400" />
                                        </div>
                                        <span className="text-sm text-gray-300">Click to upload signature</span>
                                        <span className="text-xs text-gray-400">PNG, JPG, or PDF (max 5MB)</span>
                                      </button>
                                    </div>
                                    {uploadSignatureError && (
                                      <div className="p-3 bg-red-500/20 text-red-400 rounded-lg text-sm">
                                        {uploadSignatureError}
                                      </div>
                                    )}
                                    {uploadedSignature && (
                                      <div className="relative">
                                        <div className="bg-gray-800 rounded-lg p-4">
                                          {uploadedSignature.startsWith('data:image') ? (
                                            <img
                                              src={uploadedSignature}
                                              alt="Uploaded signature"
                                              className="max-h-32 mx-auto"
                                            />
                                          ) : (
                                            <div className="flex items-center justify-center space-x-2 text-gray-300">
                                              <FileText className="w-6 h-6" />
                                              <span>{uploadedFileName}</span>
                                            </div>
                                          )}
                                        </div>
                                        <button
                                          onClick={clearUploadedSignature}
                                          className="absolute top-2 right-2 p-2 bg-gray-700/50 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        ) : signatureType === 'aadhar' ? (
                          <div className="space-y-4">
                            <input
                              type="text"
                              value={typedSignature}
                              onChange={(e) => setTypedSignature(e.target.value)}
                              placeholder="Type your signature"
                              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                              style={{
                                fontFamily: signatureStyle.fontFamily,
                                fontSize: signatureStyle.fontSize,
                                color: '#ffffff'
                              }}
                            />
                          </div>
                        ) : null}
                      </div>

                    </div>

                    {signingError && (
                      <div className="mb-4 p-3 bg-red-500/20 text-red-400 rounded-lg text-sm">
                        {signingError}
                      </div>
                    )}

                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => setIsSigningModalOpen(false)}
                        className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSignatureSubmit}
                        disabled={
                          !signerName || 
                          !signerEmail || 
                          nameError !== null || 
                          emailError !== null || 
                          !signatureMode ||
                          !isSignatureValid()
                        }
                        className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Submit Signature
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Aadhar Verification Modal */}
          <AnimatePresence>
            {isAadharModalOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-gray-900/90 rounded-xl p-6 w-full max-w-md border border-gray-800"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-white">
                      {showOTPInput ? 'Verify OTP' : 'Aadhar Verification'}
                    </h3>
                    <button
                      onClick={() => {
                        setIsAadharModalOpen(false);
                        setAadharNumber('');
                        setOtp('');
                        setShowOTPInput(false);
                        setOtpSent(false);
                      }}
                      className="text-gray-300 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {!showOTPInput ? (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Aadhar Number
                          </label>
                          <input
                            type="text"
                            value={aadharNumber}
                            onChange={(e) => setAadharNumber(e.target.value)}
                            placeholder="Enter 12-digit Aadhar number"
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            maxLength={12}
                          />
                        </div>

                        {verificationError && (
                          <div className="p-3 bg-red-500/20 text-red-400 rounded-lg text-sm">
                            {verificationError}
                          </div>
                        )}

                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={() => setIsAadharModalOpen(false)}
                            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleAadharVerification}
                            disabled={isVerifying || !aadharNumber}
                            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                          >
                            {isVerifying ? (
                              <div className="flex items-center space-x-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                <span>Sending OTP...</span>
                              </div>
                            ) : (
                              'Send OTP'
                            )}
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-sm text-gray-300">
                          OTP has been sent to your registered aadhar number ending with {aadharNumber.slice(-4)}
                        </div>
                        <div className="text-sm text-primary-400">
                          For testing, use OTP: 123456
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Enter OTP
                          </label>
                          <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder={otpSent ? "Enter 6-digit OTP" : "Waiting for OTP..."}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            maxLength={6}
                            disabled={!otpSent}
                          />
                        </div>

                        {otpError && (
                          <div className="p-3 bg-red-500/20 text-red-400 rounded-lg text-sm">
                            {otpError}
                          </div>
                        )}

                        {otpVerified && (
                          <div className="p-3 bg-green-500/20 text-green-400 rounded-lg text-sm flex items-center space-x-2">
                            <CheckCircle className="w-5 h-5" />
                            <span>Aadhar verified successfully!</span>
                          </div>
                        )}

                        <div className="flex justify-between items-center">
                          <button
                            onClick={handleResendOTP}
                            disabled={isVerifying}
                            className="text-sm text-primary-400 hover:text-primary-300"
                          >
                            {isVerifying ? 'Resending...' : 'Resend OTP'}
                          </button>
                          <div className="flex space-x-3">
                            <button
                              onClick={() => {
                                setShowOTPInput(false);
                                setOtp('');
                                setOtpError(null);
                              }}
                              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                            >
                              Back
                            </button>
                            <button
                              onClick={handleOTPVerification}
                              disabled={isVerifying || !otp}
                              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                            >
                              {isVerifying ? (
                                <div className="flex items-center space-x-2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                  <span>Verifying...</span>
                                </div>
                              ) : (
                                'Verify OTP'
                              )}
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Signer Info Modal */}
          <AnimatePresence>
            {isSignerInfoModalOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-gray-900/90 rounded-xl p-6 w-full max-w-md border border-gray-800"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-white">Add Signer</h3>
                    <button
                      onClick={() => setIsSignerInfoModalOpen(false)}
                      className="text-gray-300 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                       Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={signerName}
                        onChange={(e) => setSignerName(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Enter Name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={signerEmail}
                        onChange={(e) => setSignerEmail(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Enter email address"
                        disabled={isVerifyingEmail}
                      />
                      {isVerifyingEmail && (
                        <div className="mt-2 text-sm text-primary-400">
                          Verifying email...
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => setIsSignerInfoModalOpen(false)}
                        className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSignerInfoSubmit}
                        disabled={!signerName || !signerEmail}
                        className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                      >
                        Sign Document
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sharing Modal */}
          <AnimatePresence>
            {isSharingModalOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-gray-900/90 rounded-xl p-6 w-full max-w-2xl border border-gray-800"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-white">Share Document</h3>
                    <button
                      onClick={() => setIsSharingModalOpen(false)}
                      className="text-gray-300 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Recipients
                      </label>
                      <button
                        onClick={handleAddRecipient}
                        className="mb-4 px-4 py-2 bg-primary-500/20 text-primary-400 rounded-lg hover:bg-primary-500/30 transition-colors"
                      >
                        Add Recipient
                      </button>
                      {recipients.map((recipient) => (
                        <div key={recipient.id} className="flex items-center space-x-4 mt-2">
                          <input
                            type="text"
                            value={recipient.name}
                            onChange={(e) => handleRecipientChange(recipient.id, 'name', e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Name"
                          />
                          <input
                            type="email"
                            value={recipient.email}
                            onChange={(e) => handleRecipientChange(recipient.id, 'email', e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Email"
                          />
                          {isVerifyingEmail && (
                            <div className="text-sm text-primary-400">Verifying email...</div>
                          )}
                          {emailVerificationError && (
                            <div className="text-sm text-red-400">{emailVerificationError}</div>
                          )}
                          <button
                            onClick={() => handleRemoveRecipient(recipient.id)}
                            className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>

                    {sharingError && (
                      <div className="p-3 bg-red-500/20 text-red-400 rounded-lg text-sm">
                        {sharingError}
                      </div>
                    )}

                    {sharingSuccess && (
                      <div className="p-3 bg-green-500/20 text-green-400 rounded-lg text-sm">
                        Document shared successfully!
                      </div>
                    )}

                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => setIsSharingModalOpen(false)}
                        className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSendForSigning}
                        disabled={!validateRecipients() || isSendingEmails}
                        className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                      >
                        {isSendingEmails ? 'Sending...' : 'Send for Signing'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Document Preview Modal */}
          <AnimatePresence>
            {isPreviewModalOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-gray-900/90 rounded-xl p-6 w-full max-w-4xl h-full border border-gray-800 flex flex-col"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-white">Document Preview - {selectedDoc?.name}</h3>
                    <button
                      onClick={() => {
                        setIsPreviewModalOpen(false);
                      }}
                      className="px-4 py-2 bg-red-500 rounded-lg  text-gray-300 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setIsPreviewModalOpen(false);
                        setIsAadharModalOpen(true);
                      }}
                      className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                    >
                      Continue to Sign
                    </button>
                  </div>

                  <div className="flex-1 bg-white rounded-lg overflow-hidden">
                    {selectedDoc?.url ? (
                      selectedDoc.type?.startsWith('image/') ? (
                        <img 
                          src={selectedDoc.url} 
                          alt="Document preview" 
                          className="w-full h-full object-contain"
                        />
                      ) : selectedDoc.type === 'application/pdf' ? (
                        <iframe 
                          src={selectedDoc.url} 
                          className="w-full h-full"
                          title="PDF document"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileText className="w-16 h-16 text-gray-400" />
                          <span className="ml-4 text-xl text-gray-300">{selectedDoc.name}</span>
                        </div>
                      )
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
                        <FileText className="w-12 h-12" />
                        <p>No preview available</p>
                        <p className="text-sm">This document cannot be previewed in the browser</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default DigitalSignature;