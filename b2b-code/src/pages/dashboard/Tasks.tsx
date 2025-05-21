import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckSquare,  AlertCircle, Plus, Calendar, Users, Tag, MoreVertical, Trash2 } from 'lucide-react';
import { useMongoDB } from '../../hooks/useMongoDB';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';

const Tasks = () => {
  const { user } = useAuth();
  const { data: tasks = [], loading, error, addItem, deleteItem } = useMongoDB('tasks');
  const { t } = useTranslation();
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    status: 'Pending',
    dueDate: '',
    assignedTo: [],
    caseId: '',
    category: 'Legal Research'
  });

  // Debug authentication state
  useEffect(() => {
    console.log('Current User:', user);
    console.log('Auth State:', user ? 'Authenticated' : 'Not Authenticated');
    if (user) {
      console.log('User ID:', user.id);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!user) {
        throw new Error('You must be logged in to add a task');
      }
      
      if (!newTask.title.trim() || !newTask.dueDate) {
        throw new Error('Please fill in all required fields');
      }
      
      console.log('Adding task with user ID:', user.id);
      console.log('Task data:', {
        ...newTask,
        userId: user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await addItem({
        ...newTask,
        userId: user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      setIsAddingTask(false);
      setNewTask({
        title: '',
        description: '',
        priority: 'Medium',
        status: 'Pending',
        dueDate: '',
        assignedTo: [],
        caseId: '',
        category: 'Legal Research'
      });
    } catch (err) {
      console.error('Detailed error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to add task';
      alert(errorMessage);
    }
  };
// handle delete task 
  const handleDeleteTask = async (taskId: string) => {
    if (!deleteItem) return;
    
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteItem(taskId);
      } catch (err) {
        console.error('Error deleting task:', err);
      }
    }
  };

  // Debug loading and error states
  useEffect(() => {
    if (loading) {
      console.log('Loading tasks...');
    }
    if (error) {
      console.error('Tasks error:', error);
    }
  }, [loading, error]);

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-500/20 text-red-400';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'low':
        return 'bg-green-500/20 text-green-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-500/20 text-green-400';
      case 'in progress':
        return 'bg-blue-500/20 text-blue-400';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };
  

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Task Management</h1>
        <p className="mt-2 text-gray-300">Organize and track case-related tasks</p>
        <button
          onClick={() => setIsAddingTask(true)}
          className="mt-4 flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Task</span>
        </button>
      </div>

      {isAddingTask && (
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300">Task Title</label>
              <input
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Description</label>
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                rows={3}
                className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">Priority</label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
                >
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Due Date</label>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">Category</label>
                <select
                  value={newTask.category}
                  onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                  className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
                >
                  <option>Legal Research</option>
                  <option>Document Review</option>
                  <option>Court Filing</option>
                  <option>Client Meeting</option>
                  <option>Case Analysis</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Related Case</label>
                <input
                  type="text"
                  value={newTask.caseId}
                  onChange={(e) => setNewTask({ ...newTask, caseId: e.target.value })}
                  className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
                  placeholder="Select related case"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsAddingTask(false)}
                className="px-4 py-2 border border-gray-700 rounded-md text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
              >
                Add Task
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden">
        <div className="p-6">
          {loading && <p className="text-gray-400">Loading tasks...</p>}
          {error && <p className="text-red-400">Error: {error}</p>}
          <div className="flex flex-col space-y-4">
            {tasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-800/50 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-primary-500/20 rounded-lg">
                      <CheckSquare className="w-6 h-6 text-primary-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-white">{task.title}</h3>
                      <div className="flex items-center mt-1 space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                    <MoreVertical className="w-5 h-5 text-gray-400" />
                  </button>
                </div> 
                {/* delete task button */  }
                <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete Task"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                <p className="mt-2 text-gray-300">{task.description}</p>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2 text-gray-300">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Due: {task.dueDate}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-300">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">{task.assignedTo?.length || 0} Assigned</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-300">
                    <Tag className="w-4 h-4" />
                    <span className="text-sm">{task.category}</span>
                  </div>
                  {task.caseId && (
                    <div className="flex items-center space-x-2 text-gray-300">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">Case: {task.caseId}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tasks;