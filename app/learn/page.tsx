'use client';

import React from 'react';
import FlexLayoutContainer from './components/FlexLayoutContainer';
import LayoutControls from './components/LayoutControls';

const LearnPage = () => {
  return (
    <div className="h-screen w-full">
      <div style={{ height: '70vh' }} className="w-full">
  <FlexLayoutContainer />
</div>
<div style={{ height: '30vh' }} className="w-full">
  <LayoutControls />
</div>
    </div>
  );
};

export default LearnPage;
