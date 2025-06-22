# FlexLayout Management System - Developer Guide

## Overview

This project implements a **FlexLayout-based dynamic split-screen UI** for a multimodal AI tutor. The system allows AI agents to programmatically control layout while preserving native user interactions like drag/drop and tab switching.

## Architecture Decision

**Chosen Approach**: FlexLayout-Only (Single Source of Truth)
- **FlexLayout Model** = Complete state management
- **AI Tools** = Direct FlexLayout manipulation via Actions API
- **No Zustand** = Eliminates sync conflicts

### Why This Architecture?

**Previous Problem**: Dual state systems (FlexLayout + Zustand) caused sync conflicts that broke tab switching after user interactions.

**Solution**: FlexLayout owns ALL state, tools manipulate it directly, no bidirectional sync needed.

## Current Implementation Status

### ✅ Fully Working
- **2×2 Grid Layout** with placeholder content
- **Tab Switching** works perfectly after dragging tabs together
- **Core Tools**: `addTab`, `activateTab`, `closeTab`, `split`, `getEnv`
- **User Interactions**: Drag/drop, resize, tab management
- **Tool Testing Interface** with live ID detection
- **Persistence** to localStorage

### 🔧 Functional with Minor Issues
- **ID Display Mismatch**: Visual shows tab IDs as "Pane ID" but tools work correctly
- **ESLint Warnings**: `any` types in helper functions (doesn't affect functionality)

### ❌ Not Yet Implemented
- **AI Agent Integration**: Tools work but not connected to AI SDK
- **Advanced Tools**: `moveTab`, `remove`, `assign` verbs
- **Error Boundaries**: Better error handling throughout
- **Production Polish**: Accessibility, performance optimization

## Key Files & Architecture

```
app/learn/
├── page.tsx                           # Main layout page
├── components/
│   ├── FlexLayoutContainer.tsx        # Core FlexLayout integration
│   ├── LayoutControls.tsx            # Tool testing interface
│   └── ResizeObserver.tsx            # Size tracking (future use)

lib/agents/
├── flexLayoutTools.ts                # Core tool functions ⭐
├── layoutAgent.ts                    # Legacy Zustand (unused)
└── layoutConversion.ts               # Legacy conversion (unused)
```

### Core Component: `FlexLayoutContainer.tsx`

**Responsibilities**:
- Initializes FlexLayout model as single source of truth
- Provides `getCurrentFlexLayoutModel()` for tools to access
- Handles user interactions natively (no interference)
- Persists state to localStorage

**Key Features**:
```typescript
// Global model access for tools
export function getCurrentFlexLayoutModel(): Model | null

// Native user interaction handling
const onModelChange = (newModel: Model) => {
  // FlexLayout handles everything natively
  // Just update global reference and persist
}
```

### Core Tools: `flexLayoutTools.ts`

**Available Functions**:
```typescript
// Add new tab to existing pane
addTabToFlexLayout(model, paneId, title, contentId, makeActive)

// Switch active tab
activateTabInFlexLayout(model, paneId, tabId)

// Close tab (allows closing last tab = removes pane)
closeTabInFlexLayout(model, tabId)

// Split pane (creates new tabset)
splitPaneInFlexLayout(model, targetId, orientation, ratio)

// Get current layout state
getEnvironmentFromFlexLayout(model)

// Helper functions
getAvailablePaneIds(model)
getAvailableTabIds(model)
```

**Tool Result Format**:
```typescript
interface FlexLayoutToolResult {
  success: boolean;
  error?: string;
  message?: string;
  model?: Model;
}
```

## How Tools Work

### 1. Get Current Model
```typescript
const model = getCurrentFlexLayoutModel();
if (!model) return { success: false, error: 'MODEL_NOT_AVAILABLE' };
```

### 2. Execute FlexLayout Action
```typescript
const action = Actions.addNode(
  tabJson,
  paneId,
  DockLocation.CENTER,
  index,
  select
);
model.doAction(action);
```

### 3. Return Result
```typescript
return { 
  success: true, 
  message: `Added tab "${title}" to pane ${paneId}`,
  model 
};
```

## FlexLayout API Integration

**Key Imports**:
```typescript
import { Model, Actions, DockLocation } from 'flexlayout-react';
```

**Critical API Details**:
- `Actions.addNode(json, toNodeId, location, index, select?)` - 5 parameters required
- `DockLocation.CENTER` - Add to existing tabset
- `DockLocation.RIGHT/BOTTOM` - Split pane
- `model.doAction(action)` - Apply changes

## Testing the System

### Using the Test Interface

1. **Navigate to** `http://localhost:3001/learn`
2. **Click "Refresh IDs"** to get current pane/tab IDs
3. **Select a tool** (e.g., "Add Tab")
4. **Fill parameters** using dropdown selections
5. **Execute** and verify results

### Example Test Cases

**Add Tab**:
- paneId: Select from available panes
- title: "My New Tab"
- contentId: "summary"
- makeActive: ✓

**Split Pane**:
- targetId: Select existing pane
- orientation: "row" or "column"
- ratio: 0.5

**Close Tab**:
- tabId: Select from available tabs
- (Can close last tab - removes entire pane)

## AI Agent Integration (Next Steps)

### Current Tool Structure
Tools are ready for AI integration. They follow this pattern:

```typescript
// AI agent would call:
const result = await addTabToFlexLayout(
  getCurrentFlexLayoutModel(),
  paneId,
  title,
  contentId,
  makeActive
);

if (result.success) {
  // Tool succeeded
} else {
  // Handle error: result.error, result.message
}
```

### Recommended AI Integration

1. **Create AI SDK Tool Wrapper**:
```typescript
export const layoutTool = tool({
  description: 'Manage FlexLayout split-screen UI',
  parameters: z.object({
    action: z.enum(['addTab', 'activateTab', 'closeTab', 'split']),
    // ... other parameters
  }),
  execute: async ({ action, ...params }) => {
    const model = getCurrentFlexLayoutModel();
    switch (action) {
      case 'addTab':
        return addTabToFlexLayout(model, ...);
      // ... other cases
    }
  }
});
```

2. **Connect to Vercel AI SDK**:
```typescript
const result = await generateText({
  model: google('gemini-2.5-flash'),
  tools: { layout: layoutTool },
  // ...
});
```

## Known Issues & Solutions

### Issue: ID Mismatch in Visual Display
**Problem**: UI shows tab IDs as "Pane ID" but tools expect tabset IDs
**Impact**: None - tools work correctly, just visual confusion
**Solution**: Not needed since test interface will be replaced

### Issue: ESLint `any` Type Warnings
**Problem**: Helper functions use `any` for FlexLayout JSON parsing
**Impact**: None - functionality works perfectly
**Solution**: Could add proper types but not critical

## Development Guidelines

### Adding New Tools

1. **Create function** in `flexLayoutTools.ts`
2. **Follow pattern**: Get model → Validate → Execute Action → Return result
3. **Add to test interface** in `LayoutControls.tsx`
4. **Test thoroughly** with various scenarios

### Error Handling

Always wrap in try/catch:
```typescript
try {
  // FlexLayout operations
  model.doAction(action);
  return { success: true, message: '...' };
} catch (error) {
  return { 
    success: false, 
    error: 'EXECUTION_ERROR', 
    message: error instanceof Error ? error.message : 'Unknown error' 
  };
}
```

### Testing Strategy

1. **Manual Testing**: Use the test interface extensively
2. **Edge Cases**: Test with empty panes, single tabs, complex layouts
3. **User Interactions**: Verify tools work after user drag/drop
4. **Persistence**: Check localStorage saves/restores correctly

## Future Enhancements

### High Priority
1. **AI Agent Integration** - Connect tools to AI SDK
2. **Advanced Tools** - Implement remaining verbs
3. **Error Boundaries** - Better error handling

### Medium Priority
1. **Performance** - Debounce resize events
2. **Accessibility** - ARIA support, keyboard navigation
3. **Validation** - Stricter parameter validation

### Low Priority
1. **Visual Polish** - Better placeholder content
2. **Animation** - Smooth transitions
3. **Themes** - Dark mode support

## Troubleshooting

### Tools Not Working
1. Check `getCurrentFlexLayoutModel()` returns valid model
2. Verify FlexLayout Actions API parameters
3. Check browser console for FlexLayout errors

### Tab Switching Broken
1. Ensure no sync loops between state systems
2. Verify FlexLayout handles user interactions natively
3. Check for model recreation issues

### ID Confusion
1. Use "Refresh IDs" button to get current state
2. Remember: Pane IDs = tabset IDs, Tab IDs = individual tabs
3. Tools expect pane IDs for most operations

## Success Metrics

The system is working correctly when:
- ✅ Tools execute without errors
- ✅ Tab switching works after dragging tabs together
- ✅ Layout persists across page refreshes
- ✅ User interactions don't break tool functionality
- ✅ AI agents can control layout programmatically

## Contact & Context

This system was built to solve the specific problem of AI agents controlling a dynamic layout while preserving native user interactions. The FlexLayout-only architecture was chosen after failed attempts with dual state systems (Zustand + FlexLayout) that caused sync conflicts.

The current implementation is production-ready for the core use case and ready for AI agent integration.
