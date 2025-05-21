import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Stamp, Calendar, MapPin, Clock, CheckCircle, X, Upload, File, Search, Filter, Trash2, Eraser, PenTool, Settings, RotateCcw, Keyboard } from 'lucide-react';

interface Appointment {
  id: number;
  type: string;
  date: string;
  time: string;
  location: string;
  status: 'scheduled' | 'confirmed' | 'pending';
  documents: string[];
}

interface NewAppointmentForm {
  type: string;
  date: string;
  time: string;
  location: string;
  documents: string[];
}

interface UploadedDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: string;
  status: 'uploading' | 'completed' | 'failed' | 'verified' | 'pending_verification';
  witnessSignature?: string;
  witnessName?: string;
  witnessDate?: string;
  witnessType?: 'notary' | 'witness' | 'commissioner';
  witnessSignatureType?: 'draw' | 'type' | 'upload';
  url?: string;
}

interface NotarizedDocument {
  id: string;
  name: string;
  type: string;
  notarizationDate: string;
  notaryName: string;
  status: 'active' | 'expired' | 'pending';
  relatedAppointment: string;
}

interface SignatureStyle {
  color: string;
  thickness: number;
  fontFamily: string;
  fontSize: number;
}

interface SignatureData {
  signature: string;
  name: string;
  date: string;
  signatureType: 'draw' | 'type' | 'upload';
}

const Notary = () => {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewAppointmentModalOpen, setIsNewAppointmentModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isNotarizedDocsModalOpen, setIsNotarizedDocsModalOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<UploadedDocument | null>(null);
  const [witnessName, setWitnessName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired' | 'pending'>('all');
  const [verificationType, setVerificationType] = useState<'identity' | 'document' | 'signature' | 'other'>('document');
  const [signatureType, setSignatureType] = useState<'draw' | 'type' | 'upload'>('draw');
  const [signatureData, setSignatureData] = useState<string>('');
  const [uploadedSignature, setUploadedSignature] = useState<string | null>(null);
  const [uploadSignatureError, setUploadSignatureError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const signatureUploadRef = useRef<HTMLInputElement>(null);
  const [typedSignature, setTypedSignature] = useState('');
  const [signatureStyle, setSignatureStyle] = useState<SignatureStyle>({
    color: '#000000',
    thickness: 2,
    fontFamily: 'Dancing Script',
    fontSize: 24
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [signaturePosition, setSignaturePosition] = useState({ x: 0, y: 0 });
  const [showStyleOptions, setShowStyleOptions] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // local storage for upload documents
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>(() => {
    const savedDocuments = localStorage.getItem('notaryUploadedDocuments');
    if (savedDocuments) {
      return JSON.parse(savedDocuments);
    }
    return [];
  });
  
  const [appointmentSuccess, setAppointmentSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newAppointment, setNewAppointment] = useState<NewAppointmentForm>({
    type: '',
    date: '',
    time: '',
    location: '',
    documents: [],
  });

  // Load appointments from localStorage on component mount
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const savedAppointments = localStorage.getItem('notaryAppointments');
    if (savedAppointments) {
      return JSON.parse(savedAppointments);
    }
    // Default appointments if none exist in localStorage
    return [
      {
        id: 1,
        type: 'Document Notarization',
        date: '2024-03-20',
        time: '10:30 AM',
        location: 'Main Office',
        status: 'scheduled',
        documents: ['Power of Attorney', 'Affidavit'],
      },
      {
        id: 2,
        type: 'Witness Signature',
        date: '2024-03-22',
        time: '2:00 PM',
        location: 'Client Office',
        status: 'confirmed',
        documents: ['Contract Agreement'],
      },
      {
        id: 3,
        type: 'Document Authentication',
        date: '2024-03-25',
        time: '11:00 AM',
        location: 'Virtual Meeting',
        status: 'pending',
        documents: ['Legal Declaration', 'Certificate'],
      },
    ];
  });

  // Save appointments to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('notaryAppointments', JSON.stringify(appointments));
  }, [appointments]);

  // Save uploaded documents to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('notaryUploadedDocuments', JSON.stringify(uploadedDocuments));
  }, [uploadedDocuments]);

  // Sample notarized documents data
  const [notarizedDocuments] = useState<NotarizedDocument[]>([
    {
      id: '1',
      name: 'Power of Attorney',
      type: 'Legal Document',
      notarizationDate: '2024-03-15',
      notaryName: 'John Smith',
      status: 'active',
      relatedAppointment: 'Document Notarization - March 20',
    },
    {
      id: '2',
      name: 'Contract Agreement',
      type: 'Business Document',
      notarizationDate: '2024-03-10',
      notaryName: 'Sarah Johnson',
      status: 'active',
      relatedAppointment: 'Witness Signature - March 22',
    },
    {
      id: '3',
      name: 'Legal Declaration',
      type: 'Legal Document',
      notarizationDate: '2024-03-05',
      notaryName: 'Michael Brown',
      status: 'expired',
      relatedAppointment: 'Document Authentication - March 25',
    },
  ]);

  useEffect(() => {
    // Ensure canvas is properly sized and scaled for device pixel ratio
    const canvas = canvasRef.current;
    if (canvas) {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      // Set canvas width/height to match display size * dpr
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
        ctx.scale(dpr, dpr);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = signatureStyle.color;
        ctx.lineWidth = signatureStyle.thickness;
        ctx.font = `${signatureStyle.fontSize}px ${signatureStyle.fontFamily}`;
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(0, 0, rect.width, rect.height);
      }
    }
  }, [isVerificationModalOpen, signatureStyle]);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left),
        y: (e.touches[0].clientY - rect.top)
      };
    } else {
      return {
        x: (e.clientX - rect.left),
        y: (e.clientY - rect.top)
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
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
    e.preventDefault();
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

  const handleMouseDown = (e: React.MouseEvent<HTMLImageElement>) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - signaturePosition.x,
      y: e.clientY - signaturePosition.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
    if (isDragging) {
      setSignaturePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetSignaturePosition = () => {
    setSignaturePosition({ x: 0, y: 0 });
  };

  const clearUploadedSignature = () => {
    setUploadedSignature(null);
    setUploadedFileName(null);
    if (signatureUploadRef.current) {
      signatureUploadRef.current.value = '';
    }
  };

  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  const handleScheduleNewAppointment = () => {
    setIsNewAppointmentModalOpen(true);
  };

  const handleSubmitNewAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    const newAppointmentWithId: Appointment = {
      ...newAppointment,
      id: appointments.length + 1,
      status: 'scheduled',
    };
    setAppointments([...appointments, newAppointmentWithId]);
    setIsNewAppointmentModalOpen(false);
    setNewAppointment({
      type: '',
      date: '',
      time: '',
      location: '',
      documents: [],
    });
    setAppointmentSuccess(true);
    setTimeout(() => setAppointmentSuccess(false), 3000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'documents') {
      setNewAppointment(prev => ({
        ...prev,
        documents: value.split(',').map(doc => doc.trim()),
      }));
    } else {
      setNewAppointment(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleUploadDocuments = () => {
    setIsUploadModalOpen(true);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newDocs: UploadedDocument[] = Array.from(files).map(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64Data = e.target?.result as string;
          setUploadedDocuments(prev => 
            prev.map(doc => 
              doc.id === file.name 
                ? { ...doc, url: base64Data }
                : doc
            )
          );
        };
        reader.readAsDataURL(file);
        
        return {
          id: file.name,
          name: file.name,
          size: file.size,
          type: file.type,
          uploadDate: new Date().toISOString(),
          status: 'uploading' as const,
          url: ''
        };
      });

      setUploadedDocuments(prev => [...prev, ...newDocs]);
      
      // Simulate upload process
      newDocs.forEach(doc => {
        setTimeout(() => {
          setUploadedDocuments(prev => 
            prev.map(d => d.id === doc.id ? { ...d, status: 'completed' as const } : d)
          );
        }, 1500);
      });
    }
  };

  const handleRemoveDocument = (id: string) => {
    setUploadedDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  const handleVerifyDocument = (doc: UploadedDocument) => {
    setSelectedDocument(doc);
    setVerificationStep('view');
    setIsDocumentVerified(false);
    setIsVerificationModalOpen(true);
  };

  const handleNextStep = () => {
    if (verificationStep === 'view' && isDocumentVerified) {
      setVerificationStep('signature');
    }
  };

  const handlePreviousStep = () => {
    if (verificationStep === 'signature') {
      setVerificationStep('view');
    }
  };

  const handleSubmitVerification = () => {
    if (selectedDocument && witnessName && (signatureData || uploadedSignature || typedSignature)) {
      const signature = signatureData || uploadedSignature || typedSignature;
      setUploadedDocuments(prev => 
        prev.map(doc => 
          doc.id === selectedDocument.id 
            ? { 
                ...doc, 
                status: 'verified',
                verificationStatus: 'verified',
                verificationDate: new Date().toISOString(),
                verificationType,
                witnessSignatureType: signatureType,
                witnessSignature: signature,
                witnessName,
                witnessDate: new Date().toISOString()
              }
            : doc
        )
      );

      setIsVerificationModalOpen(false);
      setVerificationType('document');
    
     

      const savedSignatures = localStorage.getItem('witnessSignatures');
      const signatures = savedSignatures ? JSON.parse(savedSignatures) : {};
      signatures[selectedDocument.id] = { name: witnessName, signature, signatureType, date: new Date().toISOString() };
      localStorage.setItem('witnessSignatures', JSON.stringify(signatures));
      
      setSelectedDocument(null);
      setWitnessName('');
      setSignatureData('');
      setSignatureType('draw');
      setUploadedSignature(null);
      setTypedSignature('');
    }
  };
  
  const handleViewNotarizedDocuments = () => {
    setIsNotarizedDocsModalOpen(true);
  };

  const filteredNotarizedDocuments = notarizedDocuments.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.notaryName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || doc.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Load signatures from local storage on component mount
  useEffect(() => {
    const savedSignatures = localStorage.getItem('witnessSignatures');
    if (savedSignatures) {
      const parsedSignatures: Record<string, SignatureData> = JSON.parse(savedSignatures);
      setUploadedDocuments(prev => 
        prev.map(doc => {
          const savedSignature = parsedSignatures[doc.id];
          if (savedSignature) {
            return {
              ...doc,
              witnessSignature: savedSignature.signature,
              witnessName: savedSignature.name,
              witnessSignatureType: savedSignature.signatureType,
              witnessDate: savedSignature.date
            };
          }
          return doc;
        })
      );
    }
  }, []);

  const [verificationStep, setVerificationStep] = useState<'view' | 'signature'>('view');
  const [isDocumentVerified, setIsDocumentVerified] = useState(false);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Notary Services</h1>
        <p className="mt-2 text-gray-400">Schedule and manage notary appointments</p>
      </div>

      <AnimatePresence>
        {appointmentSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-green-500/20 text-green-400 rounded-lg flex items-center space-x-2"
          >
            <CheckCircle className="w-5 h-5" />
            <span>Appointment scheduled successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6"
        >
          <h2 className="text-xl font-semibold text-white mb-6">Upcoming Appointments</h2>
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-primary-500/20 rounded-lg">
                      <Stamp className="w-6 h-6 text-primary-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-white">{appointment.type}</h3>
                      <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs ${
                        appointment.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                        appointment.status === 'scheduled' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleViewDetails(appointment)}
                    className="px-4 py-2 bg-primary-500/10 text-primary-400 rounded-lg hover:bg-primary-500/20 transition-colors"
                  >
                    View Details
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2 text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>{appointment.date}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>{appointment.time}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-400">
                    <MapPin className="w-4 h-4" />
                    <span>{appointment.location}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Documents</h4>
                  <div className="flex flex-wrap gap-2">
                    {appointment.documents.map((doc, index) => (
                      <div key={index} className="px-2 py-1 bg-gray-700/50 rounded-lg text-sm text-gray-300">
                        {doc}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6"
        >
          <h2 className="text-xl font-semibold text-white mb-6">Quick Actions</h2>
          <div className="space-y-4">
            <button 
              onClick={handleScheduleNewAppointment}
              className="w-full flex items-center justify-between p-4 bg-primary-500/10 rounded-lg hover:bg-primary-500/20 transition-colors"
            >
              <span className="text-primary-400">Schedule New Appointment</span>
              <Calendar className="w-5 h-5 text-primary-400" />
            </button>
            <button 
              onClick={handleUploadDocuments}
              className="w-full flex items-center justify-between p-4 bg-primary-500/10 rounded-lg hover:bg-primary-500/20 transition-colors"
            >
              <span className="text-primary-400">Upload Documents</span>
              <Upload className="w-5 h-5 text-primary-400" />
            </button>
            <button 
              onClick={handleViewNotarizedDocuments}
              className="w-full flex items-center justify-between p-4 bg-primary-500/10 rounded-lg hover:bg-primary-500/20 transition-colors"
            >
              <span className="text-primary-400">View Notarized Documents</span>
              <CheckCircle className="w-5 h-5 text-primary-400" />
            </button>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-900 rounded-xl border border-gray-800 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-white">Appointment Details</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              {selectedAppointment && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-primary-500/20 rounded-lg">
                      <Stamp className="w-8 h-8 text-primary-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">{selectedAppointment.type}</h3>
                      <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm ${
                        selectedAppointment.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                        selectedAppointment.status === 'scheduled' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3 text-gray-300">
                      <Calendar className="w-5 h-5 text-primary-400" />
                      <span>{selectedAppointment.date}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-gray-300">
                      <Clock className="w-5 h-5 text-primary-400" />
                      <span>{selectedAppointment.time}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-gray-300">
                      <MapPin className="w-5 h-5 text-primary-400" />
                      <span>{selectedAppointment.location}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-800">
                    <h4 className="text-lg font-medium text-white mb-3">Documents</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedAppointment.documents.map((doc, index) => (
                        <div key={index} className="px-3 py-2 bg-gray-800 rounded-lg text-gray-300">
                          {doc}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {isNewAppointmentModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsNewAppointmentModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-900 rounded-xl border border-gray-800 p-6 max-w-2xl w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-white">Schedule New Appointment</h2>
                <button
                  onClick={() => setIsNewAppointmentModalOpen(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmitNewAppointment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Appointment Type</label>
                  <select
                    name="type"
                    value={newAppointment.type}
                    onChange={handleInputChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="Document Notarization">Document Notarization</option>
                    <option value="Witness Signature">Witness Signature</option>
                    <option value="Document Authentication">Document Authentication</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
                    <input
                      type="date"
                      name="date"
                      value={newAppointment.date}
                      onChange={handleInputChange}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Time</label>
                    <input
                      type="time"
                      name="time"
                      value={newAppointment.time}
                      onChange={handleInputChange}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={newAppointment.location}
                    onChange={handleInputChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Documents (comma-separated)</label>
                  <textarea
                    name="documents"
                    value={newAppointment.documents.join(', ')}
                    onChange={handleInputChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., Power of Attorney, Affidavit"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setIsNewAppointmentModalOpen(false)}
                    className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    Schedule Appointment
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {isUploadModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsUploadModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-900 rounded-xl border border-gray-800 p-6 max-w-2xl w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-white">Upload Documents</h2>
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    multiple
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center space-y-2 text-gray-400 hover:text-primary-400 transition-colors"
                  >
                    <Upload className="w-12 h-12" />
                    <span>Click to upload or drag and drop</span>
                    <span className="text-sm">PDF, DOC, DOCX, TXT (max 10MB)</span>
                  </button>
                </div>

                {uploadedDocuments.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white">Uploaded Documents</h3>
                    <div className="space-y-2">
                      {uploadedDocuments.map(doc => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <File className="w-5 h-5 text-primary-400" />
                            <div>
                              <p className="text-white">{doc.name}</p>
                              <p className="text-sm text-gray-400">{formatFileSize(doc.size)}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              doc.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                              doc.status === 'uploading' ? 'bg-blue-500/20 text-blue-400' :
                              doc.status === 'verified' ? 'bg-purple-500/20 text-purple-400' :
                              doc.status === 'pending_verification' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                            </span>
                            {doc.status === 'completed' && (
                              <button
                                onClick={() => handleVerifyDocument(doc)}
                                className="px-3 py-1 bg-primary-500/10 text-primary-400 rounded-lg hover:bg-primary-500/20 transition-colors"
                              >
                                Verify
                              </button>
                            )}
                            
                            <button
                              onClick={() => handleRemoveDocument(doc.id)}
                              className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4 text-gray-400" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setIsUploadModalOpen(false)}
                    className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {isNotarizedDocsModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsNotarizedDocsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-900 rounded-xl border border-gray-800 p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-white">Notarized Documents</h2>
                <button
                  onClick={() => setIsNotarizedDocsModalOpen(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search documents..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Filter className="w-5 h-5 text-gray-400" />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as any)}
                      className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="expired">Expired</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredNotarizedDocuments.map(doc => (
                    <div
                      key={doc.id}
                      className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="p-2 bg-primary-500/20 rounded-lg">
                            <File className="w-6 h-6 text-primary-400" />
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-white">{doc.name}</h3>
                            <p className="text-sm text-gray-400">{doc.type}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          doc.status === 'active' ? 'bg-green-500/20 text-green-400' :
                          doc.status === 'expired' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                        </span>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-400">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>Notarized: {new Date(doc.notarizationDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Stamp className="w-4 h-4" />
                          <span>Notary: {doc.notaryName}</span>
                        </div>
                        <div className="col-span-2 flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>Related Appointment: {doc.relatedAppointment}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setIsNotarizedDocsModalOpen(false)}
                    className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Verification Modal */}
        {isVerificationModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsVerificationModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-900 rounded-xl border border-gray-800 p-6 max-w-4xl w-full max-h-full overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Document Verification</h2>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className={`flex items-center ${verificationStep === 'view' ? 'text-primary-400' : 'text-gray-400'}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${verificationStep === 'view' ? 'bg-primary-500' : 'bg-gray-700'}`}>
                        1
                      </div>
                      <span className="ml-2">View Document</span>
                    </div>
                    <div className={`flex items-center ${verificationStep === 'signature' ? 'text-primary-400' : 'text-gray-400'}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${verificationStep === 'signature' ? 'bg-primary-500' : 'bg-gray-700'}`}>
                        2
                      </div>
                      <span className="ml-2">Witness Signature</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsVerificationModalOpen(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              {verificationStep === 'view' && (
                <div className="space-y-6">
                  <div className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-xl font-medium text-white mb-6">Document Preview</h3>
                    <div className="aspect-[4/3] bg-gray-700 rounded-lg overflow-hidden">
                      {selectedDocument?.type.startsWith('image/') ? (
                        <img 
                          src={selectedDocument.url} 
                          alt="Document preview" 
                          className="w-full h-full object-contain"
                        />
                      ) : selectedDocument?.type === 'application/pdf' ? (
                        <iframe 
                          src={selectedDocument.url} 
                          className="w-full h-full"
                          title="PDF document"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <File className="w-16 h-16 text-gray-400" />
                          <span className="ml-4 text-xl text-gray-300">{selectedDocument?.name}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 text-base text-gray-400">
                      {selectedDocument?.name} ({formatFileSize(selectedDocument?.size || 0)})
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 mt-6">
                    <input
                      type="checkbox"
                      id="documentVerified"
                      checked={isDocumentVerified}
                      onChange={(e) => setIsDocumentVerified(e.target.checked)}
                      className="w-5 h-5 text-primary-500 bg-gray-800 border-gray-700 rounded focus:ring-primary-500"
                    />
                    <label htmlFor="documentVerified" className="text-lg text-gray-300">
                      I have reviewed and verified this document
                    </label>
                  </div>
                  <div className="flex justify-end space-x-4 mt-8">
                    <button
                      onClick={() => setIsVerificationModalOpen(false)}
                      className="px-6 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors text-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleNextStep}
                      disabled={!isDocumentVerified}
                      className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 text-lg"
                    >
                      Sign Now
                    </button>
                  </div>
                </div>
              )}

              {verificationStep === 'signature' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Witness Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={witnessName}
                      onChange={(e) => setWitnessName(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Enter witness name..."
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <div className="flex space-x-4 mb-4">
                      <button
                        onClick={() => setSignatureType('draw')}
                        className={`flex-1 py-2 rounded-lg transition-colors ${
                          signatureType === 'draw'
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
                        onClick={() => setSignatureType('type')}
                        className={`flex-1 py-2 rounded-lg transition-colors ${
                          signatureType === 'type'
                            ? 'bg-primary-500/20 text-primary-400'
                            : 'bg-gray-800/50 text-gray-300 hover:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <Keyboard className="w-4 h-4" />
                          <span>Type</span>
                        </div>
                      </button>
                      <button
                        onClick={() => setSignatureType('upload')}
                        className={`flex-1 py-2 rounded-lg transition-colors ${
                          signatureType === 'upload'
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
                     
                    <div className="relative">
                      {signatureType === 'draw' ? (
                        <div className="relative">
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
                              onClick={clearSignature}
                              className="p-2 bg-gray-700/50 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                              title="Clear signature"
                            >
                              <Eraser className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setShowStyleOptions(!showStyleOptions)}
                              className="p-2 bg-gray-700/50 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                              title="Style options"
                            >
                              <Settings className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : signatureType === 'type' ? (
                        <div className="space-y-4">
                          <input
                            type="text"
                            value={typedSignature}
                            onChange={(e) => setTypedSignature(e.target.value)}
                            placeholder="Type & select your signature"
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            style={{
                              fontFamily: signatureStyle.fontFamily,
                              fontSize: signatureStyle.fontSize,
                              color: signatureStyle.color
                            }}
                            required
                          />
                          <div className="flex items-center space-x-4">
                            <select
                              value={signatureStyle.fontFamily}
                              onChange={(e) => setSignatureStyle({ ...signatureStyle, fontFamily: e.target.value })}
                              className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-lg text-white"
                            >
                              <option value="Montserrat">Montserrat</option>
                              <option value="Exo 2">Exo 2</option>
                              <option value="Brush Script MT">Brush Script MT</option>
                              <option value="Georgia">Georgia</option>
                              <option value="Caveat">Caveat</option>
                            </select>
                            
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center">
                            <input
                              type="file"
                              ref={signatureUploadRef}
                              onChange={handleSignatureUpload}
                              accept=".png,.jpg,.jpeg,.pdf"
                              className="hidden"
                              required
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
                                    style={{
                                      cursor: 'move',
                                      transform: `translate(${signaturePosition.x}px, ${signaturePosition.y}px)`
                                    }}
                                    onMouseDown={handleMouseDown}
                                    onMouseMove={handleMouseMove}
                                    onMouseUp={handleMouseUp}
                                  />
                                ) : (
                                  <div className="flex items-center justify-center space-x-2 text-gray-300">
                                    <File className="w-6 h-6" />
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
                    </div>

                    {showStyleOptions && signatureType === 'draw' && (
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
                          <button
                            onClick={resetSignaturePosition}
                            className="p-2 bg-gray-700/50 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                            title="Reset position"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={handlePreviousStep}
                      className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={handleSubmitVerification}
                      disabled={!witnessName || (!signatureData && !uploadedSignature && !typedSignature)}
                      className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                    >
                      Complete Verification
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Notary;