import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, AlertCircle, CheckCircle, Clock, FileText } from 'lucide-react';

const Notifications = () => {
  const [readNotifications, setReadNotifications] = useState<number[]>([]);

  const notifications = [
    {
      id: 1,
      type: 'deadline',
      title: 'Case Filing Deadline',
      message: 'Deadline approaching for Smith vs. Johnson case filing',
      time: '2 hours ago',
      priority: 'high',
    },
    {
      id: 2,
      type: 'update',
      title: 'Document Update',
      message: 'New document uploaded in Tech Corp merger case',
      time: '4 hours ago',
      priority: 'medium',
    },
    {
      id: 3,
      type: 'reminder',
      title: 'Meeting Reminder',
      message: 'Client meeting scheduled for tomorrow at 10:30 AM',
      time: '6 hours ago',
      priority: 'low',
    },
  ];

  const handleMarkAsRead = (notificationId: number) => {
    setReadNotifications(prev => [...prev, notificationId]);
  };

  const isNotificationRead = (notificationId: number) => {
    return readNotifications.includes(notificationId);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-400';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400';
      default:
        return 'bg-green-500/20 text-green-400';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'deadline':
        return <Clock className="w-6 h-6" />;
      case 'update':
        return <FileText className="w-6 h-6" />;
      case 'reminder':
        return <Bell className="w-6 h-6" />;
      default:
        return <AlertCircle className="w-6 h-6" />;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Notifications</h1>
        <p className="mt-2 text-gray-400">Stay updated with important alerts and reminders</p>
      </div>

      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col space-y-4">
            {notifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-800/50 rounded-lg p-4"
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-lg ${getPriorityColor(notification.priority)}`}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-white">{notification.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(notification.priority)}`}>
                        {notification.priority.charAt(0).toUpperCase() + notification.priority.slice(1)} Priority
                      </span>
                    </div>
                    <p className="mt-1 text-gray-400">{notification.message}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm text-gray-500">{notification.time}</span>
                      {!isNotificationRead(notification.id) ? (
                        <button 
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="text-primary-400 hover:text-primary-300 transition-colors animate-pulse hover:animate-none flex items-center gap-2"
                        >
                          <span>Mark as read</span>
                        </button>
                      ) : (
                        <span className="text-green-400 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          <span>Read</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;