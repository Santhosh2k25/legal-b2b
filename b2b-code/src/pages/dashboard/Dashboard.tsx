import { motion } from 'framer-motion';
import { 
  Users, 
  Scale, 
  FileText, 
  Calendar as CalendarIcon,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

const StatCard = ({ icon: Icon, title, value, trend, color }: {
  icon: any;
  title: string;
  value: string;
  trend?: string;
  color: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl border border-gray-800`}
  >
    <div className="flex items-center">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="ml-4 flex-1">
        <h3 className="text-lg font-medium text-gray-200">{title}</h3>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
      </div>
      {trend && (
        <div className="flex items-center text-green-400">
          <TrendingUp className="w-4 h-4 mr-1" />
          <span className="text-sm">{trend}</span>
        </div>
      )}
    </div>
  </motion.div>
);

const Dashboard = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="mt-2 text-gray-300">Welcome back! Here's an overview of your practice.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          icon={Scale}
          title="Active Cases"
          value="48"
          trend="+12% this month"
          color="bg-primary-500"
        />
        <StatCard
          icon={Users}
          title="Total Clients"
          value="156"
          trend="+8% this month"
          color="bg-purple-500"
        />
        <StatCard
          icon={FileText}
          title="Documents"
          value="284"
          trend="+15% this month"
          color="bg-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl border border-gray-800"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Upcoming Hearings</h2>
          <div className="space-y-4">
            {[
              { title: 'Smith vs. Johnson', date: 'March 15, 2024', time: '10:30 AM', court: 'Supreme Court' },
              { title: 'Corporate Merger Review', date: 'March 18, 2024', time: '2:00 PM', court: 'High Court' },
              { title: 'Estate Planning Meeting', date: 'March 20, 2024', time: '11:00 AM', court: 'Chamber' },
            ].map((hearing, index) => (
              <div key={index} className="flex items-center p-3 bg-gray-800/50 rounded-lg">
                <CalendarIcon className="w-5 h-5 text-primary-400 mr-3" />
                <div>
                  <h3 className="text-white font-medium">{hearing.title}</h3>
                  <p className="text-sm text-gray-300">{hearing.date} at {hearing.time}</p>
                  <p className="text-xs text-primary-400">{hearing.court}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl border border-gray-800"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Recent Notifications</h2>
          <div className="space-y-4">
            {[
              { type: 'deadline', message: 'Case filing deadline approaching for Johnson case', time: '2 hours ago' },
              { type: 'update', message: 'New document uploaded in Smith vs. Johnson', time: '4 hours ago' },
              { type: 'alert', message: 'Court date rescheduled for Corporate Merger case', time: '1 day ago' },
            ].map((notification, index) => (
              <div key={index} className="flex items-start p-3 bg-gray-800/50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-500 mr-3 mt-0.5" />
                <div>
                  <p className="text-white">{notification.message}</p>
                  <p className="text-xs text-gray-300 mt-1">{notification.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Dashboard;