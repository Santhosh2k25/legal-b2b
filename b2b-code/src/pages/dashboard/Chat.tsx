import { motion } from 'framer-motion';
import { Send, User, Phone, Video } from 'lucide-react';

const Chat = () => {
  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col">
      <div>
        <h1 className="text-3xl font-bold text-white">Chat</h1>
        <p className="mt-2 text-gray-400">Communicate with team members and clients</p>
      </div>

      <div className="mt-8 flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1 bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-4"
        >
          <div className="space-y-4">
            {['John Smith', 'Sarah Wilson', 'Tech Corp Team', 'Legal Team'].map((contact, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-800/50 cursor-pointer transition-colors"
              >
                <div className="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-medium">{contact}</h3>
                  <p className="text-sm text-gray-400">Online</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3 bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 flex flex-col"
        >
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <h3 className="text-white font-medium">John Smith</h3>
                <p className="text-sm text-gray-400">Online</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
                <Phone className="w-5 h-5 text-gray-400" />
              </button>
              <button className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
                <Video className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            <div className="flex justify-start">
              <div className="bg-gray-800 rounded-lg p-3 max-w-md">
                <p className="text-white">Hello! How can I help you today?</p>
                <span className="text-xs text-gray-400 mt-1">10:30 AM</span>
              </div>
            </div>
            <div className="flex justify-end">
              <div className="bg-primary-500/20 rounded-lg p-3 max-w-md">
                <p className="text-white">I'd like to discuss the case updates.</p>
                <span className="text-xs text-gray-400 mt-1">10:32 AM</span>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-gray-800">
            <div className="relative">
              <input
                type="text"
                placeholder="Type your message..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-4 pr-12 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors">
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Chat;