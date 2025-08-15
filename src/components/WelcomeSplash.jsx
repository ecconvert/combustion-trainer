import React from 'react';

const WelcomeSplash = ({ onStartTour, onSkip }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full mx-4 p-8 text-center">
        {/* Logo/Icon */}
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0112.12 15.12z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome to
        </h1>
        <h2 className="text-2xl font-semibold text-orange-600 dark:text-orange-400 mb-6">
          Combustion Trainer
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">(Beta)</span>
        </h2>

        {/* Description */}
        <div className="text-gray-600 dark:text-gray-300 mb-8 space-y-3">
          <p className="text-sm leading-relaxed">
            Master boiler combustion tuning with our interactive training simulator. 
            Learn proper air-fuel ratios, optimize efficiency, and troubleshoot common issues.
          </p>
          <div className="flex items-center justify-center space-x-4 text-xs">
            <div className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Real-time Analysis
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              Interactive Scenarios
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={onStartTour}
            className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            🎯 Start Guided Tour
          </button>
          <button
            onClick={onSkip}
            className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2 px-6 rounded-lg transition-colors duration-200"
          >
            Skip & Explore
          </button>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-6">
          💡 New to combustion? We recommend taking the guided tour first.
        </p>
      </div>
    </div>
  );
};

export default WelcomeSplash;
