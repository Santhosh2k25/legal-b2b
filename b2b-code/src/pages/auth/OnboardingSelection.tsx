import { Link } from 'react-router-dom';
import { User, Building } from 'lucide-react';
import { motion } from 'framer-motion';
import Background3D from '../../components/Background3D';

const BackgroundWrapper = () => (
  <div className="fixed inset-0 -z-10">
    <Background3D />
  </div>
);

export default function OnboardingSelection() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900/80 via-gray-800/50 to-black/80 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative backdrop-blur-sm">
      <BackgroundWrapper />
      <motion.div className="relative z-20 pointer-events-auto sm:mx-auto sm:w-full sm:max-w-md"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-center">
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
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
          Join OCTOGENIE Legal
        </h2>
        <p className="mt-2 text-center text-sm text-gray-200">
          Select the registration path that best suits your needs
        </p>
      </motion.div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-20">
        <div className="bg-gray-900/50 backdrop-blur-xl py-8 px-4 shadow-xl ring-1 ring-gray-800 sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-primary-500/10 rounded-lg p-6 hover:bg-primary-500/20 transition-colors"
            >
              <Link to="/register/lawyer" className="block">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-r from-primary-400 to-primary-600 rounded-xl flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-white">Individual Lawyer Registration</h3>
                    <p className="mt-1 text-sm text-gray-200">
                      Register as an individual legal professional to access our platform
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-primary-500/20 text-primary-300">
                    For independent lawyers
                  </span>
                </div>
                <div className="mt-4 text-sm text-primary-400 flex items-center">
                  Register as Individual
                  <svg className="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </Link>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-primary-500/10 rounded-lg p-6 hover:bg-primary-500/20 transition-colors"
            >
              <Link to="/register/firm" className="block">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-r from-primary-400 to-primary-600 rounded-xl flex items-center justify-center">
                    <Building className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-white">Law Firm Registration</h3>
                    <p className="mt-1 text-sm text-gray-200">
                      Register your law firm to manage your entire practice efficiently
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-primary-500/20 text-primary-300">
                    For law firms
                  </span>
                </div>
                <div className="mt-4 text-sm text-primary-400 flex items-center">
                  Register as Firm
                  <svg className="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </Link>
            </motion.div>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-800"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-900 text-gray-200">
                    Already have an account?
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  to="/login"
                  className="w-full flex justify-center py-2 px-4 border border-gray-700 rounded-md shadow-sm text-sm font-medium text-primary-400 bg-transparent hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                >
                  Sign in instead
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}