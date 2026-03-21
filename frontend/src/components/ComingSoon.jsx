import React from 'react';
import { HiClock } from 'react-icons/hi';

const ComingSoon = ({ title, description }) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-yellow-400 rounded-full mb-6">
          <HiClock className="w-12 h-12 text-gray-900" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{title}</h1>
        <p className="text-lg text-gray-600 mb-8">{description}</p>
        <div className="inline-flex items-center space-x-2 px-6 py-3 bg-gray-100 rounded-lg">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <span className="text-sm text-gray-600 font-medium">Coming Soon</span>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;


