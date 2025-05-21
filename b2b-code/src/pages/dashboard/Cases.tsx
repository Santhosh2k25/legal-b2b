import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Scale, User, FileText, Plus, X, Link as LinkIcon, Trash2 } from 'lucide-react';
import { useMongoDB } from '../../hooks/useMongoDB';

interface Case {
  id: string;
  title: string;
  type: string;
  description: string;
  status: string;
  clients: any[];
  documents: any[];
  nextHearing: string;
  createdAt: string;
  updatedAt: string;
  client: string;
}

const initialCaseState: Omit<Case, 'id' | 'createdAt' | 'updatedAt'> = {
  title: '',
  type: 'Civil',
  description: '',
  status: 'active',
  clients: [],
  documents: [],
  nextHearing: '',
  client: ''
};

const Cases = () => {
  const { data: cases = [], loading, error, addItem, updateItem, deleteItem } = useMongoDB('cases');
  const { data: allClients = [] } = useMongoDB('clients');
  const [isAddingCase, setIsAddingCase] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isLinkingClient, setIsLinkingClient] = useState(false);
  const [isAddingDocument, setIsAddingDocument] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newCase, setNewCase] = useState(initialCaseState);

  const openDetailsModal = (case_: any) => {
    setSelectedCase(case_);
    setIsDetailsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addItem(newCase);
      setIsAddingCase(false);
      setNewCase(initialCaseState);
    } catch (err) {
      console.error('Error adding case:', err);
    }
  };

  const handleUpdateCase = async (caseId: string, updates: any) => {
    try {
      if (!updateItem) return;
      await updateItem(caseId, updates);
      if (selectedCase) {
        setSelectedCase({ ...selectedCase, ...updates });
      }
    } catch (err) {
      console.error('Error updating case:', err);
    }
  };

  const handleLinkClient = async (clientId: string) => {
    if (!selectedCase) return;
    
    try {
      const client = allClients.find(c => c.id === clientId);
      if (!client) return;

      const updatedClients = [...(selectedCase.clients || []), client];
      await handleUpdateCase(selectedCase.id, { clients: updatedClients });
      setSelectedCase({ ...selectedCase, clients: updatedClients });
      setIsLinkingClient(false);
    } catch (err) {
      console.error('Error linking client:', err);
    }
  };

  const handleRemoveClient = async (clientId: string) => {
    if (!selectedCase) return;

    try {
      const updatedClients = selectedCase.clients.filter((c: any) => c.id !== clientId);
      await handleUpdateCase(selectedCase.id, { clients: updatedClients });
      setSelectedCase({ ...selectedCase, clients: updatedClients });
    } catch (err) {
      console.error('Error removing client:', err);
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !selectedFile) return;

    try {
      // Create a URL for the file
      const fileUrl = URL.createObjectURL(selectedFile);
      
      const newDocument = {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
        url: fileUrl,
        uploadedAt: new Date().toISOString()
      };

      const updatedDocuments = [...(selectedCase.documents || []), newDocument];
      await handleUpdateCase(selectedCase.id, { documents: updatedDocuments });
      setSelectedCase({ ...selectedCase, documents: updatedDocuments });
      setIsAddingDocument(false);
      setSelectedFile(null);
    } catch (err) {
      console.error('Error adding document:', err);
    }
  };

  const handleRemoveDocument = async (docIndex: number) => {
    if (!selectedCase) return;

    try {
      const updatedDocuments = selectedCase.documents.filter((_: any, i: number) => i !== docIndex);
      await handleUpdateCase(selectedCase.id, { documents: updatedDocuments });
      setSelectedCase({ ...selectedCase, documents: updatedDocuments });
    } catch (err) {
      console.error('Error removing document:', err);
    }
  };

  const handleDownloadDocument = async (doc: any) => {
    try {
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = doc.url; // Assuming the document has a URL property
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading document:', err);
    }
  };

  const handleDeleteCase = async (caseId: string) => {
    if (!deleteItem) return;
    try {
      const confirmDelete = window.confirm('Are you sure you want to delete this case?');
      if (confirmDelete) {
        await deleteItem(caseId);
        setIsDetailsModalOpen(false);
      }
    } catch (err) {
      console.error('Error deleting case:', err);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Cases</h1>
        <p className="mt-2 text-gray-300">Manage and track all your legal cases</p>
        <button
          onClick={() => setIsAddingCase(true)}
          className="mt-4 flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Case</span>
        </button>
      </div>

      {isAddingCase && (
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300">Case Title</label>
              <input
                type="text"
                value={newCase.title}
                onChange={(e) => setNewCase({ ...newCase, title: e.target.value })}
                className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
                required
              />
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">Type</label>
                <select
                  value={newCase.type}
                  onChange={(e) => setNewCase({ ...newCase, type: e.target.value })}
                  className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
                >
                  <option>Civil</option>
                  <option>Criminal</option>
                  <option>Corporate</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300">Status</label>
                <select
                  value={newCase.status}
                  onChange={(e) => setNewCase({ ...newCase, status: e.target.value })}
                  className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="closed">Closed</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300">Client</label>
                <select
                  value={newCase.client}
                  onChange={(e) => setNewCase({ ...newCase, client: e.target.value })}
                  className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
                  required
                >
                  <option value="">Select a client</option>
                  {allClients.map((client: any) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
                {allClients.length === 0 && (
                  <p className="mt-1 text-sm text-yellow-500">
                    No clients available. Please add a client first.
                  </p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Description</label>
              <textarea
                value={newCase.description}
                onChange={(e) => setNewCase({ ...newCase, description: e.target.value })}
                rows={3}
                  className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsAddingCase(false)}
                className="px-4 py-2 border border-gray-700 rounded-md text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
              >
                Add Case
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden">
        <div className="p-6">
          {loading && <p className="text-gray-300">Loading cases...</p>}
          {error && <p className="text-red-400">Error: {error}</p>}
          <div className="flex flex-col space-y-4">
            {cases.map((case_, index) => (
              <motion.div
                key={case_.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-800/50 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-primary-500/20 rounded-lg">
                      <Scale className="w-6 h-6 text-primary-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-white">{case_.title}</h3>
                      <div className="flex items-center mt-1 space-x-4 text-sm">
                        <span className="text-gray-400">Type: {case_.type}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          case_.status === 'Active' ? 'bg-green-500/20 text-green-400' : case_.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {case_.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => openDetailsModal(case_)}
                    className="px-4 py-2 bg-primary-500/10 text-primary-400 rounded-lg hover:bg-primary-500/20 transition-colors"
                  >
                    View Details
                  </button>
                </div>
                <div className="mt-4 text-gray-300">
                  <p className="text-sm">{case_.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Case Details Modal */}
      {isDetailsModalOpen && selectedCase && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gray-900/90 rounded-xl border border-gray-800 p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">{selectedCase.title}</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDeleteCase(selectedCase.id)}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500 rounded-lg"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {/* Basic Details */}
              <div>
                <h3 className="text-lg font-medium text-white mb-4">Case Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Type</label>
                    <select
                      value={selectedCase.type}
                      onChange={(e) => handleUpdateCase(selectedCase.id, { type: e.target.value })}
                      className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
                    >
                      <option>Civil</option>
                      <option>Criminal</option>
                      <option>Corporate</option>
                    </select>
                  </div>
                  <div>
                    
                    <label className="block text-sm font-medium text-gray-300">Status</label>
                    <select
                      value={selectedCase.status}
                      onChange={(e) => handleUpdateCase(selectedCase.id, { status: e.target.value })}
                      className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
                    >
                      <option>Active</option>
                      <option>Pending</option>
                      <option>Closed </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Next Hearing</label>
                    <input
                      type="date"
                      value={selectedCase.nextHearing || ''}
                      onChange={(e) => handleUpdateCase(selectedCase.id, { nextHearing: e.target.value })}
                      className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Clients Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-white">Linked Clients</h3>
                  <button 
                    onClick={() => setIsLinkingClient(true)}
                    className="flex items-center space-x-2 px-3 py-1 bg-primary-500/10 text-primary-400 rounded-lg hover:bg-primary-500/20"
                  >
                    <LinkIcon className="w-4 h-4" />
                    <span>Link Client</span>
                  </button>
                </div>
                <div className="space-y-2">
                  {selectedCase.clients?.length > 0 ? (
                    selectedCase.clients.map((client: any, index: number) => (
                      <div key={index} className="flex items-center justify-between bg-gray-800/50 p-3 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <User className="w-5 h-5 text-gray-400" />
                          <span className="text-white">{client.name}</span>
                        </div>
                        <button 
                          onClick={() => handleRemoveClient(client.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-sm">No clients linked to this case</p>
                  )}
                </div>
              {isLinkingClient && (
                <div className="mt-4 border-t border-gray-700 pt-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Select Client to Link</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {allClients
                      .filter((client: any) => !selectedCase.clients?.some((c: any) => c.id === client.id))
                      .map((client: any) => (
                        <button
                          key={client.id}
                          onClick={() => handleLinkClient(client.id)}
                          className="w-full flex items-center justify-between p-2 bg-gray-800/50 rounded-lg hover:bg-gray-700/50"
                        >
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-white">{client.name}</span>
                          </div>
                          <Plus className="w-4 h-4 text-primary-400" />
                        </button>
                      ))}
                  </div>
                </div>
              )}
              </div>

              {/* Documents Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-white">Case Documents</h3>
                  <button
                    onClick={() => setIsAddingDocument(true)}
                    className="flex items-center space-x-2 px-3 py-1 bg-primary-500/10 text-primary-400 rounded-lg hover:bg-primary-500/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Document</span>
                  </button>
                </div>
                <div className="space-y-2">
                  {selectedCase.documents?.length > 0 ? (
                    selectedCase.documents.map((doc: any, index: number) => (
                      <div key={index} className="flex items-center justify-between bg-gray-800/50 p-3 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-gray-400" />
                          <span className="text-white">{doc.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => handleDownloadDocument(doc)}
                            className="text-primary-400 hover:text-primary-300"
                          >
                            Download
                          </button>
                          <button 
                            onClick={() => handleRemoveDocument(index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-sm">No documents added to this case</p>
                  )}
                </div>
                {isAddingDocument && (
                  <div className="mt-4 border-t border-gray-700 pt-4">
                    <form onSubmit={handleAddDocument}>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300">Select Document</label>
                          <input
                            type="file"
                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            className="mt-1 block w-full text-sm text-gray-400
                              file:mr-4 file:py-2 file:px-4
                              file:rounded-full file:border-0
                              file:text-sm file:font-semibold
                              file:bg-primary-500/10 file:text-primary-400
                              hover:file:bg-primary-500/20"
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingDocument(false);
                              setSelectedFile(null);
                            }}
                            className="px-3 py-1 text-gray-400 hover:text-gray-300"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={!selectedFile}
                            className="px-3 py-1 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
                          >
                            Upload
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cases;