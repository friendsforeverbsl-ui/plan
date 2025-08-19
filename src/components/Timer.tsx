import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Settings, Clock } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';

const Timer: React.FC = () => {
  const { timerSettings, updateTimerSettings } = useData();
  const { isDarkMode } = useTheme();
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timerSettings.workTime * 60);
  const [isBreak, setIsBreak] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [workTime, setWorkTime] = useState(timerSettings.workTime);
  const [breakTime, setBreakTime] = useState(timerSettings.breakTime);
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);

  // Request notification permission on component mount
  useEffect(() => {
    const requestNotificationPermission = async () => {
      if ('Notification' in window) {
        if (Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          setHasNotificationPermission(permission === 'granted');
        } else {
          setHasNotificationPermission(Notification.permission === 'granted');
        }
      }
    };
    
    requestNotificationPermission();
  }, []);

  // Load timer state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('timerState');
    if (savedState) {
      const { isRunning: savedIsRunning, timeLeft: savedTimeLeft, isBreak: savedIsBreak, lastUpdate } = JSON.parse(savedState);
      const now = Date.now();
      const elapsed = Math.floor((now - lastUpdate) / 1000);
      
      if (savedIsRunning && savedTimeLeft > elapsed) {
        setIsRunning(true);
        setTimeLeft(savedTimeLeft - elapsed);
        setIsBreak(savedIsBreak);
      } else if (savedIsRunning && savedTimeLeft <= elapsed) {
        // Timer finished while away
        setIsRunning(false);
        setIsBreak(!savedIsBreak);
        setTimeLeft(savedIsBreak ? timerSettings.workTime * 60 : timerSettings.breakTime * 60);
        playNotificationSound();
        showNotification(!savedIsBreak ? 'Break Time!' : 'Work Time!', !savedIsBreak ? 'Time for a break!' : 'Back to work!');
      } else {
        setTimeLeft(savedTimeLeft);
        setIsBreak(savedIsBreak);
      }
    }
  }, [timerSettings]);

  // Save timer state to localStorage
  useEffect(() => {
    const timerState = {
      isRunning,
      timeLeft,
      isBreak,
      lastUpdate: Date.now()
    };
    localStorage.setItem('timerState', JSON.stringify(timerState));
  }, [isRunning, timeLeft, isBreak]);

  const playNotificationSound = () => {
    // Create a simple beep sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1);
    } catch (error) {
      console.log('Could not play notification sound:', error);
    }
  };

  const showNotification = (title: string, body: string) => {
    if (hasNotificationPermission && 'Notification' in window) {
      new Notification(title, {
        body,
        icon: '/vite.svg',
        badge: '/vite.svg'
      });
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Time's up - switch mode
      playNotificationSound();
      
      if (isBreak) {
        // Break is over, start work session
        showNotification('Work Time!', 'Break is over. Time to get back to work!');
        setIsBreak(false);
        setTimeLeft(timerSettings.workTime * 60);
      } else {
        // Work session is over, start break
        showNotification('Break Time!', 'Great work! Time for a well-deserved break.');
        setIsBreak(true);
        setTimeLeft(timerSettings.breakTime * 60);
      }
      setIsRunning(false);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, isBreak, timerSettings]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(isBreak ? timerSettings.breakTime * 60 : timerSettings.workTime * 60);
    localStorage.removeItem('timerState');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSaveSettings = () => {
    updateTimerSettings({ workTime, breakTime });
    setShowSettings(false);
    // Reset timer with new settings if not running
    if (!isRunning) {
      setTimeLeft(isBreak ? breakTime * 60 : workTime * 60);
    }
  };

  const progress = isBreak 
    ? ((timerSettings.breakTime * 60 - timeLeft) / (timerSettings.breakTime * 60)) * 100
    : ((timerSettings.workTime * 60 - timeLeft) / (timerSettings.workTime * 60)) * 100;

  return (
    <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-lg p-6 border`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isBreak 
              ? isDarkMode ? 'bg-green-900 bg-opacity-20' : 'bg-green-100'
              : isDarkMode ? 'bg-blue-900 bg-opacity-20' : 'bg-blue-100'
          }`}>
            <Clock className={`w-5 h-5 ${isBreak ? 'text-green-600' : 'text-blue-600'}`} />
          </div>
          <div>
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
              {isBreak ? 'Break Time' : 'Focus Time'}
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Pomodoro Timer {hasNotificationPermission ? '🔔' : '🔕'}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setShowSettings(true)}
          className={`p-2 ${isDarkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'} rounded-lg transition-colors duration-200`}
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Timer Display */}
      <div className="text-center mb-6">
        <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-4 border-4 ${
          isBreak ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50'
        }`} style={{
          background: `conic-gradient(${isBreak ? '#10b981' : '#3b82f6'} ${progress * 3.6}deg, #f3f4f6 0deg)`
        }}>
          <div className={`w-24 h-24 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-full flex items-center justify-center shadow-lg`}>
            <span className={`text-2xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>

      {/* Timer Controls */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={toggleTimer}
          className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
            isRunning
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl'
              : `${isBreak ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'} text-white shadow-lg hover:shadow-xl`
          }`}
        >
          {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <span>{isRunning ? 'Pause' : 'Start'}</span>
        </button>

        <button
          onClick={resetTimer}
          className={`flex items-center space-x-2 px-4 py-3 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} rounded-xl font-semibold transition-all duration-200`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset</span>
        </button>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 w-96 max-w-[90vw]`}>
            <h3 className={`text-xl font-semibold mb-6 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Timer Settings</h3>
            
            {!hasNotificationPermission && (
              <div className={`mb-4 p-3 rounded-lg ${isDarkMode ? 'bg-yellow-900 bg-opacity-20 border-yellow-700 text-yellow-300' : 'bg-yellow-50 border-yellow-200 text-yellow-800'} border`}>
                <p className="text-sm">
                  🔔 Enable browser notifications to get alerts when timer finishes!
                </p>
                <button
                  onClick={async () => {
                    const permission = await Notification.requestPermission();
                    setHasNotificationPermission(permission === 'granted');
                  }}
                  className="mt-2 px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm transition-colors duration-200"
                >
                  Enable Notifications
                </button>
              </div>
            )}
            
            <div className="space-y-4 mb-6">
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Work Time (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={workTime}
                  onChange={(e) => setWorkTime(parseInt(e.target.value))}
                  className={`w-full px-3 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-300 bg-white text-gray-800'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Break Time (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={breakTime}
                  onChange={(e) => setBreakTime(parseInt(e.target.value))}
                  className={`w-full px-3 py-2 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-300 bg-white text-gray-800'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowSettings(false)}
                className={`px-4 py-2 ${isDarkMode ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600 hover:text-gray-800'} font-medium`}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timer;