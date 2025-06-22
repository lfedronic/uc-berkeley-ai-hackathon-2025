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
  </div>
);

export default LearnPage;
