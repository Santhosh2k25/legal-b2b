import { motion } from 'framer-motion';
import { Calendar as CalendarComponent } from 'react-calendar';
import { Clock, MapPin, Users } from 'lucide-react';
import 'react-calendar/dist/Calendar.css';

// Add custom styles for calendar pointer
const calendarStyles = `
  .react-calendar__tile--active {
    background: #3b82f6 !important;
  }
  .react-calendar__tile--now {
    background: #3b82f6 !important;
  }
`;

const Calendar = () => {
  const events = [
    {
      id: 1,
      title: 'Smith vs. Johnson Hearing',
      time: '10:30 AM',
      location: 'Supreme Court, Room 302',
      attendees: ['John Smith', 'Defense Counsel', 'Judge Thompson'],
      type: 'hearing',
    },
    {
      id: 2,
      title: 'Client Meeting - Tech Corp',
      time: '2:00 PM',
      location: 'Conference Room A',
      attendees: ['Tech Corp Legal Team', 'Sarah Wilson'],
      type: 'meeting',
    },
    {
      id: 3,
      title: 'Document Review - Estate Planning',
      time: '4:30 PM',
      location: 'Office',
      attendees: ['Legal Team', 'Client Representative'],
      type: 'review',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Calendar</h1>
        <p className="mt-2 text-gray-400">Manage your schedule and appointments</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl border border-gray-800"
        >
          <CalendarComponent
            className="!bg-transparent !border-gray-700 text-white"
          />
          <style>{calendarStyles}</style>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl border border-gray-800"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Today's Schedule</h2>
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-white">{event.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs ${
                    event.type === 'hearing' ? 'bg-red-500/20 text-red-400' :
                    event.type === 'meeting' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                  </span>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center text-gray-400">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center text-gray-400">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center text-gray-400">
                    <Users className="w-4 h-4 mr-2" />
                    <span>{event.attendees.join(', ')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Calendar;