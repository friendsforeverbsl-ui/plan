import React, { useState } from 'react';
import { X, Heart } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface DonatorFormProps {
  onClose: () => void;
  onSubmit: (name: string) => Promise<boolean>;
}

const DonatorForm: React.FC<DonatorFormProps> = ({ onClose, onSubmit }) => {
  const { isDarkMode } = useTheme();
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const success = await onSubmit(name.trim());
      if (success) {
        alert('Thank you for your support! Your name has been added to our supporters list.');
        onClose();
      } else {
        setError('Failed to add your name. Please try again.');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 w-full max-w-md shadow-2xl`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-pink-600" />
            </div>
            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
              Add Your Name
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 ${isDarkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'} rounded-lg transition-colors duration-200`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className={`${isDarkMode ? 'bg-red-900 bg-opacity-20 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700'} px-4 py-3 rounded-lg border mb-4`}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-4 py-3 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-500'} border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200`}
              placeholder="Enter your name to be added to supporters list"
              required
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 ${isDarkMode ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600 hover:text-gray-800'} font-medium transition-colors duration-200`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-6 py-2 bg-gradient-to-r from-pink-600 to-red-600 text-white rounded-lg font-medium hover:from-pink-700 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? 'Adding...' : 'Add My Name'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DonatorForm;