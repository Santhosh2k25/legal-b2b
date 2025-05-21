import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Eye, Calendar, Plus, X, Trash2, AlertTriangle } from 'lucide-react';
import { useMongoDB } from '../../hooks/useMongoDB';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';

interface Document {
  id: string;
  title: string;
  fileType: string;
  fileUrl: string;
  fileSize?: number;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  caseId?: string;
  case?: string;
  tags: string[];
}

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return 'Unknown size';
  
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'Unknown date';
  try {
    return format(new Date(dateString), 'MMM dd, yyyy');
  } catch (e) {
    return dateString;
  }
};

const Documents = () => {
  const { data: documents = [], loading, error, addItem, deleteItem } = useMongoDB('documents');
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isAddingDocument, setIsAddingDocument] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [newDocument, setNewDocument] = useState({
    title: '',
    type: 'Legal Brief',
    case: '',
  });

  // Extract case names from documents for the dropdown
  const [cases, setCases] = useState<string[]>([]);
  
  useEffect(() => {
    // Extract unique case values from documents
    const uniqueCases = Array.from(new Set(
      documents
        .map(doc => doc.case || (doc.tags?.find((tag: string) => tag.startsWith('case:'))?.substring(5)))
        .filter(Boolean)
    ));
    setCases(['Unassigned', ...uniqueCases]);
  }, [documents]);

  const handleFileUpload = useCallback(async (file: File) => {
    try {
      setUploadError(null);
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File is too large. Maximum size is 10MB.');
      }
      
      // Read the file as Base64 for storage
      const base64File = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
      });
      
      const newDoc = {
        title: newDocument.title || file.name,
        fileType: file.type,
        fileSize: file.size,
        fileUrl: base64File, // Store the file content as a Base64 string
        userId: user?.id, // Add the current user's ID
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        case: newDocument.case || 'Unassigned',
        tags: newDocument.case ? [`case:${newDocument.case}`] : ['case:Unassigned']
      };

      const result = await addItem(newDoc);
      
      // Reset form
      setNewDocument({
        title: '',
        type: 'Legal Brief',
        case: ''
      });
      
      return result;
    } catch (err) {
      console.error('Error uploading document:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload document';
      setUploadError(errorMessage);
      throw err;
    }
  }, [addItem, newDocument, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);
    
    try {
      const fileInput = e.currentTarget.querySelector<HTMLInputElement>('input[type="file"]');
      const file = fileInput?.files?.[0];

      if (!file) {
        throw new Error('Please select a file to upload');
      }

      await handleFileUpload(file);
      setIsAddingDocument(false);
    } catch (err) {
      console.error('Error adding document:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to add document';
      setUploadError(errorMessage);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      if (!doc.fileUrl) {
        throw new Error('Document URL not found');
      }
      
      // Create a link and click it to trigger download
      const a = document.createElement('a');
      a.href = doc.fileUrl;
      a.download = doc.title;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading document:', err);
      alert('Failed to download document. Please try again.');
    }
  };

  const handlePreview = (doc: Document) => {
    setSelectedDocument(doc);
    setShowPreview(true);
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!deleteItem) return;

    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await deleteItem(docId);
      } catch (err) {
        console.error('Error deleting document:', err);
      }
    }
  };

  const getDocumentIcon = (fileType: string) => {
    // Default to FileText
    return <FileText className="w-6 h-6 text-blue-400" />;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Documents</h1>
        <p className="mt-2 text-gray-300">Manage your legal documents and files</p>
        <button
          onClick={() => setIsAddingDocument(true)}
          className="mt-4 flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Document</span>
        </button>
      </div>

      {isAddingDocument && (
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {uploadError && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-md p-3 flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm">{uploadError}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-300">Document File</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Document Title</label>
              <input
                type="text"
                value={newDocument.title}
                onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                placeholder="Enter document title (or leave blank to use filename)"
                className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">Type</label>
                <select
                  value={newDocument.type}
                  onChange={(e) => setNewDocument({ ...newDocument, type: e.target.value })}
                  className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
                >
                  <option>Legal Brief</option>
                  <option>Contract</option>
                  <option>Court Filing</option>
                  <option>Correspondence</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Related Case</label>
                <select
                  value={newDocument.case}
                  onChange={(e) => setNewDocument({ ...newDocument, case: e.target.value })}
                  className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
                >
                  <option value="">Select a case</option>
                  {cases.map((caseName, index) => (
                    <option key={index} value={caseName}>{caseName}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsAddingDocument(false)}
                className="px-4 py-2 border border-gray-700 rounded-md text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
              >
                Add Document
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden">
        <div className="p-6">
          {loading && <p className="text-gray-400">Loading documents...</p>}
          {error && <p className="text-red-400">Error: {error}</p>}
          {!loading && documents.length === 0 && (
            <div className="py-8 text-center text-gray-400">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>No documents found</p>
              <p className="text-sm mt-1">Upload your first document by clicking "Add New Document"</p>
            </div>
          )}
          <div className="flex flex-col space-y-4">
            {documents.map((document, index) => (
              <motion.div
                key={document.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-800/50 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      {getDocumentIcon(document.fileType)}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-white">{document.title}</h3>
                      <div className="flex items-center mt-1 space-x-4">
                        <span className="text-sm text-gray-300">{document.fileType}</span>
                        <span className="text-sm text-gray-300">{formatFileSize(document.fileSize)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePreview(document)}
                      className="p-2 bg-gray-700/50 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                      title="Preview Document"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDownload(document)}
                      className="p-2 bg-primary-500/10 text-primary-400 rounded-lg hover:bg-primary-500/20 transition-colors"
                      title="Download Document"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteDocument(document.id)}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete Document"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="flex items-center space-x-2 text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Last Modified: {formatDate(document.updatedAt)}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-400">
                    <FileText className="w-4 h-4" />
                    <span className="text-sm">
                      Related Case: {document.case || document.tags?.find((tag: string) => tag.startsWith('case:'))?.substring(5) || 'Unassigned'}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Document Preview Modal */}
      {showPreview && selectedDocument && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gray-900/90 rounded-xl border border-gray-800 p-6 w-full max-w-4xl h-[80vh]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">{selectedDocument.title}</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="h-[calc(100%-4rem)] bg-white rounded-lg overflow-hidden">
              {selectedDocument.fileUrl ? (
                (() => {
                  const srcUrl = selectedDocument.fileUrl;
                  // Show different preview based on file type
                  if (selectedDocument.fileType.includes('pdf')) {
                    return (
                      <iframe
                        src={srcUrl}
                        className="w-full h-full"
                        title={selectedDocument.title}
                      />
                    );
                  } else if (selectedDocument.fileType.includes('image')) {
                    return (
                      <img 
                        src={srcUrl} 
                        alt={selectedDocument.title}
                        className="max-w-full max-h-full object-contain mx-auto"
                      />
                    );
                  } else {
                    // For other file types
                    return (
                      <div className="flex flex-col items-center justify-center h-full text-gray-800 space-y-4">
                        <FileText className="w-12 h-12" />
                        <p>File type: {selectedDocument.fileType}</p>
                        <p>File size: {formatFileSize(selectedDocument.fileSize)}</p>
                        <button
                          onClick={() => handleDownload(selectedDocument)}
                          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      </div>
                    );
                  }
                })()
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
                  <FileText className="w-12 h-12" />
                  <p>No preview available</p>
                  <p className="text-sm">This document cannot be previewed in the browser</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
