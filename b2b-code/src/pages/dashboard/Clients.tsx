import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Plus, X, Trash2 } from 'lucide-react';
import { useMongoDB } from '../../hooks/useMongoDB';
import { useTranslation } from 'react-i18next';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  type: 'Individual' | 'Corporate';
  activeCases?: number;
  cases?: Array<{
    title: string;
    status: string;
  }>;
}

const Clients = () => {
  const { data: clients = [], loading, error, addItem, deleteItem } = useMongoDB('clients');
  const {t} = useTranslation()
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    type: 'Individual',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addItem(newClient);
      setIsAddingClient(false);
      setNewClient({ name: '', email: '', phone: '', address: '', type: 'Individual' });
    } catch (err) {
      console.error('Error adding client:', err);
    }
  };

  const handleViewProfile = (client: Client) => {
    setSelectedClient(client);
    setShowClientModal(true);
  };

  const closeClientModal = () => {
    setSelectedClient(null);
    setShowClientModal(false);
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!deleteItem) return;
    
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        await deleteItem(clientId);
      } catch (err) {
        console.error('Error deleting client:', err);
      }
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Clients</h1>
        <p className="mt-2 text-gray-300">Manage your client relationships</p>
        <button
          onClick={() => setIsAddingClient(true)}
          className="mt-4 flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Client</span>
        </button>
      </div>

      {isAddingClient && (
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
          <form onSubmit={handleSubmit} className="space-y-2">
            <div>
              <label className="block text-sm font-medium text-gray-300">Name</label>
              <input
                type="text"
                value={newClient.name}
                onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">Email</label>
                <input
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Phone</label>
                <input
                  type="tel"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                  className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Address</label>
              <textarea
                value={newClient.address}
                onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
                rows={2}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Type</label>
              <select
                value={newClient.type}
                onChange={(e) => setNewClient({ ...newClient, type: e.target.value })}
                className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
              >
                <option>Individual</option>
                <option>Corporate</option>
              </select>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setIsAddingClient(false)}
                className="px-4 py-2 border border-gray-700 rounded-md text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
              >
                Add Client
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden">
        <div className="p-6">
          {loading && <p className="text-gray-300">Loading clients...</p>}
          {error && <p className="text-red-400">Error: {error}</p>}
          <div className="flex flex-col space-y-4">
            {clients.map((client, index) => (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-800/50 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <User className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-white">{client.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        client.type === 'Corporate' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
                      }`}>
                        {client.type}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => handleViewProfile(client)}
                      className="px-4 py-2 bg-primary-500/10 text-primary-400 rounded-lg hover:bg-primary-500/20 transition-colors"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => handleDeleteClient(client.id)}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete Client"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-gray-300">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{client.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-400">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">{client.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-400">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{client.address}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <span className="text-sm text-gray-400">
                    Active Cases: <span className="text-primary-400">{client.activeCases}</span>
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Client Profile Modal */}
      {showClientModal && selectedClient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gray-900/90 rounded-xl border border-gray-800 p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <User className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedClient.name}</h2>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    selectedClient.type === 'Corporate' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
                  }`}>
                    {selectedClient.type}
                  </span>
                </div>
              </div>
              <button
                onClick={closeClientModal}
                className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-700/50 rounded-lg p-3">
                  <div className="flex items-center space-x-3 mb-4">
                    <Mail className="w-5 h-5 text-primary-400" />
                    <h3 className="text-lg font-medium text-white">Contact Information</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-400">Email</label>
                      <p className="text-white mt-1 bg-gray-700/50 rounded-lg p-2">{selectedClient.email}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Phone</label>
                      <p className="text-white mt-1 bg-gray-700/50 rounded-lg p-2">{selectedClient.phone}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-700/50 rounded-lg p-3">
                  <div className="flex items-center space-x-3 mb-4">
                    <MapPin className="w-5 h-5 text-primary-400" />
                    <h3 className="text-lg font-medium text-white">Address</h3>
                  </div>
                  <div>
                    <p className="text-white mt-1 bg-gray-700/50 rounded-lg p-2">{selectedClient.address}</p>
                  </div>
                </div>
              </div>

              {selectedClient.cases && selectedClient.cases.length > 0 && (
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-primary-500/20 rounded-lg">
                      <span className="text-primary-400 font-medium">{selectedClient.activeCases}</span>
                    </div>
                    <h3 className="text-lg font-medium text-white">Active Cases</h3>
                  </div>
                  <div className="space-y-3">
                    {selectedClient.cases.map((case_, index) => (
                      <div key={index} className="bg-gray-900/50 p-3 rounded-lg">
                        <p className="text-white font-medium">{case_.title}</p>
                        <p className="text-sm text-gray-400 mt-1">{case_.status}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;