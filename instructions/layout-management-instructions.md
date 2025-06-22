**Internal Memo — Spec for “FlexLayout-based Layout Management System”**

---

### 1  ▪  Purpose

Give a multimodal AI tutor full programmatic control over a **dynamic, tab-aware split-screen UI** while still letting the learner drag/resize panes.  The system must:

* obey a strict **depth-2 split rule** (max 4 visual regions),
* support **tabs** inside any region (scrollable tab strip),
* feed the agent real-time **screen & component sizing** so it makes sensible layout decisions,
* expose all mutations through **Vercel AI-SDK tools**,
* survive user edits, preserve accessibility, and persist state.

---

### 2  ▪  Core Stack

| Layer            | Choice                                                   | Notes                                              |
| ---------------- | -------------------------------------------------------- | -------------------------------------------------- |
| View engine      | **FlexLayout** (react-flexlayout)                        | Built-in tabsets, drag-drop, json model            |
| State            | Zustand (or Redux Toolkit)                               | Single source of truth: `layout`, `history`, `env` |
| Cross-pane bus   | `mitt` emitter                                           | Loose coupling for sync events                     |
| Resize telemetry | native `ResizeObserver`                                  | Updates `env.panes[*].box`                         |
| Agent I/O        | **Vercel AI-SDK** `generateText()` with structured tools | `maxSteps` loop handles multi-step layouts         |

---

### 3  ▪  Data Models

#### 3.1  Layout JSON (FlexLayout-compatible, depth-guarded)

```ts
type Node =
  | { id:string; type:'row'|'column'; ratio:number; children:[Node,Node] }   // split node
  | { id:string; type:'tabset'; tabs:Tab[]; activeTabId:string };           // leaf

interface Tab { id:string; title:string; contentId:string; }
```

*Depth limit*: no split node may sit below depth 2 from root.

#### 3.2  Env snapshot (sent to LLM in `context`)

```json
{
  "viewport": { "w": 1440, "h": 900, "dpr": 2 },
  "panes": [
    { "id": "pane-A", "box": { "w": 720, "h": 450 },
      "widget": "pdf-lec3", "minW": 480, "minH": 320 }
  ]
}
```

Widgets expose static **`sizing = {minW,minH,prefW,prefH}`** or a function for dynamic prefs; reducer merges this.

---

### 4  ▪  Tool API (agent ⇄ LMS)

All verbs bundled into one AI-SDK `tool({ name:'layout', … })`.

| Verb            | Payload                                           | Guards / Effects                  |                    |
| --------------- | ------------------------------------------------- | --------------------------------- | ------------------ |
| **split**       | \`{targetId, orientation:'row'                    | 'col', ratio}\`                   | depth & size guard |
| **resize**      | `{paneId, ratio}`                                 | `minW/minH` guard                 |                    |
| **remove**      | `{paneId}`                                        | sibling expands                   |                    |
| **assign**      | `{paneId, contentId}`                             | replaces active tab content       |                    |
| **addTab**      | `{paneId, tabId?, title, contentId, makeActive?}` | autogen `tabId` if missing        |                    |
| **activateTab** | `{paneId, tabId}`                                 | —                                 |                    |
| **closeTab**    | `{paneId, tabId}`                                 | remove tab / pane cleanup         |                    |
| **moveTab**     | `{fromPane, toPane, tabId, position?}`            | drag-across panes                 |                    |
| **setLayout**   | `{layout}`                                        | wholesale replace (use sparingly) |                    |
| **getEnv**      | `∅`                                               | returns latest env snapshot       |                    |

Errors return e.g. `{error:'DEPTH_LIMIT'}` or `'PANE_TOO_SMALL'`.

---

### 5  ▪  Reducer Responsibilities

1. **Validate & apply** tool verbs.
2. Enforce *depth-2* and *size* rules.
3. Maintain **undo/redo** (`past / present / future`).
4. Persist `layout` & `activeTabs` to `localStorage` (or server).
5. Emit **`layoutChanged`** for agent visibility.

---

### 6  ▪  User-initiated Edits

* FlexLayout `onModelChange(json)` → diff vs store → dispatch equivalent verbs (`moveTab`, `resize`, …).
* Agent’s next `generateText` call includes the new layout/env, preventing conflicts (“last writer wins”).

---

### 7  ▪  Cross-Pane Sync

```ts
paneBus.emit('slideChanged', {slideIdx, fromPane:'pane-X'});
paneBus.on('slideChanged', fn);
```

Use for transcript ⇆ slide, diagram pointers, etc.

---

### 8  ▪  Accessibility & UX

* Resize gives `transition: width .2s ease, height .2s ease`.
* Before mutation capture `document.activeElement`; refocus afterwards.
* Polite ARIA live-region messages, e.g. *“New tab ‘Homework 4’ opened in top-right pane.”*
* Scrollable tab strip when overflow (FlexLayout prop `tabSetTabStripStyle: 'scroll'`).

---

### 9  ▪  Tele-metrics to Agent

* On `getEnv` or every call via `context`, supply:

  * viewport (w, h, dpr),
  * each pane’s `box`,
  * each widget’s `min / pref` dims,
  * whether size guard blocked last request.

---

### 10  ▪  Initial Dev Milestones

\| M-0 | FlexLayout demo, hard-coded 2×2 grid |
\| M-1 | Zustand reducer + verbs `split/resize/remove`, depth guard |
\| M-2 | Tab verbs & scrollable strip |
\| M-3 | ResizeObserver env feed + `getEnv` |
\| M-4 | User drag diff → verbs; persistence; undo/redo |
\| M-5 | Expose tool via AI-SDK, prove agent auto-layouts on 13-in vs 27-in |

---

Deliverables are now unambiguous; the coding agent can implement against this spec.
