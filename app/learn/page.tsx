/* ────────────────────────────────────────────────
   app/learn/page.tsx
───────────────────────────────────────────────── */
'use client';

import FlexLayoutContainer from './components/FlexLayoutContainer';
import LayoutControls      from './components/LayoutControls';
import LayoutChat          from './components/LayoutChat';

const LearnPage = () => (
  <div className="h-screen w-full flex flex-col">
    {/* live layout */}
    <div className="flex-1">
      <FlexLayoutContainer />
    </div>

    {/* controls + agent chat */}
    <div className="h-[30vh] flex border-t">
      <div className="w-1/2 overflow-auto border-r">
        <LayoutControls />
      </div>
      <div className="w-1/2 overflow-auto">
        <LayoutChat />
      </div>
    </div>
  </div>
);

export default LearnPage;
