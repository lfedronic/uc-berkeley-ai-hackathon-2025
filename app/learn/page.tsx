'use client';

import React from 'react';
import FlexLayoutContainer from './components/FlexLayoutContainer';
import LayoutControls from './components/LayoutControls';
import AILayoutChat from './components/AILayoutChat';

const LearnPage = () => {
  return (
    <div className="h-screen w-full">
      <div style={{ height: '60vh' }} className="w-full">
        <FlexLayoutContainer />
      </div>
      <div style={{ height: '40vh' }} className="w-full flex">
        <div className="w-1/2 border-r border-gray-200">
          <AILayoutChat />
        </div>
        <div className="w-1/2">
          <LayoutControls />
        </div>
      </div>
    </div>
  );
};

export default LearnPage;
