import React from 'react';
import { motion } from 'framer-motion';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { Brain } from 'lucide-react';
import Background3D from '../Background3D';
import Dashboard from '../../pages/dashboard/Dashboard';
import Cases from '../../pages/dashboard/Cases';
import Tasks from '../../pages/dashboard/Tasks';
import Clients from '../../pages/dashboard/Clients';
import Documents from '../../pages/dashboard/Documents';
import Calendar from '../../pages/dashboard/Calendar';
import Chat from '../../pages/dashboard/Chat';
import AIAssistant from '../../pages/dashboard/AIAssistant';
import Notifications from '../../pages/dashboard/Notifications';
import DigitalSignature from '../../pages/dashboard/DigitalSignature';
import Notary from '../../pages/dashboard/Notary';
import Settings from '../../pages/dashboard/Settings';

const DashboardLayout = () => {
  const navigate = useNavigate();

  const handleAIAssistantClick = () => {
    navigate('/ai-assistant');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900/80 via-gray-800/50 to-black/80 text-white relative backdrop-blur-sm overflow-hidden">
      <div className="fixed inset-0 -z-10">
        <Background3D />
      </div>
      <div className="flex flex-col min-h-screen relative z-10">
        <Navbar className="z-30" />
        <div className="flex-1 flex flex-col lg:flex-row relative z-20">
          <Sidebar />
          <main className="flex-1 p-4 lg:p-8 w-full pb-24 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary-400/20 rounded-full filter blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-primary-600/20 rounded-full filter blur-3xl pointer-events-none" />
            <div className="relative">
              <Routes>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="cases" element={<Cases />} />
                <Route path="tasks" element={<Tasks />} />
                <Route path="clients" element={<Clients />} />
                <Route path="documents" element={<Documents />} />
                <Route path="calendar" element={<Calendar />} />
                <Route path="chat" element={<Chat />} />
                <Route path="ai-assistant" element={<AIAssistant />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="signature" element={<DigitalSignature />} />
                <Route path="notary" element={<Notary />} />
                <Route path="settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </div>
          </motion.div>
          </main>
        </div>
      </div>
      <div className="fixed bottom-6 right-6 z-[100]">
        <motion.button
          onClick={handleAIAssistantClick}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: 1,
            scale: 1,
            y: [0, -8, 0],
          }}
          transition={{
            y: {
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="group flex items-center space-x-2 bg-primary-500/20 px-4 py-3 rounded-full backdrop-blur-xl border border-primary-500/30 shadow-[0_0_20px_rgba(0,151,167,0.2)] cursor-pointer hover:bg-primary-500/30 hover:shadow-[0_0_30px_rgba(0,151,167,0.4)] transition-all duration-300 ease-in-out hover:border-primary-400"
        >
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 15, -15, 0]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="relative"
          >
            <Brain className="w-6 h-6 text-primary-300 group-hover:text-primary-200 transition-colors" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.6)]" />
          </motion.div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-primary-300 group-hover:text-primary-200 transition-colors">AI Assistant Active</p>
            <p className="text-xs text-primary-200/80 group-hover:text-primary-100/80 transition-colors">Ready to help - Click to chat</p>
          </div>
        </motion.button>
      </div>
    </div>
  );
};

export default DashboardLayout;