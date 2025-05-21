import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Send, Mic, StopCircle } from 'lucide-react';
import { useSpeechRecognition } from 'react-speech-recognition';
import { mistralClient } from '../../config/mistral';
import { useTranslation } from 'react-i18next';
import SpeechRecognition from 'react-speech-recognition';

const AIAssistant = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I\'m your AI legal assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);
    setError(null);

    try {
      const response = await mistralClient.chat([...messages, userMessage]);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (err) {
      console.error('Error getting AI response:', err);
      setError('Failed to get response from AI assistant. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleListening = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true });
    }
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col">
      <div>
        <h1 className="text-3xl font-bold text-white">AI Legal Assistant</h1>
        <p className="mt-2 text-gray-300">Get instant help with legal research and analysis</p>
      </div>

      <div className="mt-8 flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1 bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-4"
        >
          <h2 className="text-lg font-semibold text-white mb-4">Capabilities</h2>
          <div className="space-y-4">
            {[
              'Legal Research',
              'Document Analysis',
              'Case Law Search',
              'Contract Review',
              'Legal Writing Assistance',
            ].map((capability, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-3 bg-gray-800/50 rounded-lg"
              >
                <Brain className="w-5 h-5 text-primary-400" />
                <span className="text-gray-300">{capability}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {error && (
          <div className="p-4 mb-4 bg-red-500/10 border-l-4 border-red-500 text-red-400">
            {error}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3 bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 flex flex-col h-[calc(100vh-16rem)]"
        >
          <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`rounded-lg p-3 max-w-md ${
                  message.role === 'user' ? 'bg-primary-500/20' : 'bg-gray-800'
                }`}>
                  <p className="text-white">{message.content}</p>
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-800">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask me anything..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-4 pr-24 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-2">
                {browserSupportsSpeechRecognition && (
                  <button
                    onClick={toggleListening}
                    className={`p-2 rounded-lg transition-colors ${
                      listening ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    {listening ? (
                      <StopCircle className="w-4 h-4 text-white" />
                    ) : (
                      <Mic className="w-4 h-4 text-white" />
                    )}
                  </button>
                )}
                <button
                  onClick={handleSend}
                  className="p-2 bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AIAssistant;