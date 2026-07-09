# 🏗️ Pascal Assessment — Sprint Architectural Audit

## Phase 1: Deep System Audit

---

### 1. State Management (`useAssignmentEditorStore.ts` — 861 lines)

| Finding | Severity | Details |
|---|---|---|
| **Monolithic store** | ⚠️ Medium | Every selector (`updateItem`, `addCanvasItem`, `updateCanvasItemBounds`, etc.) triggers a full `set()` that replaces the entire `draft` object. Any component subscribing to `draft` will re-render on *every* state change — even unrelated ones. |
| **No selector granularity** | ⚠️ Medium | `QuestionSidebar.tsx` line 23 destructures the entire store: `const { draft, addSidebarItem, updateItem, deleteItem, isPreviewMode } = useAssignmentEditorStore();`. This means the sidebar re-renders when *any* canvas item moves. |
| **`studentState` is local** | ✅ Good | Each `CanvasItemRenderer` and `MatchingQuestionRenderer` owns its own `useState<any>({})` for student answers. This correctly decouples student interaction from the teacher's draft store. |
| **`points: 0` default** | ✅ Good | All `addSidebarItem` and `addCanvasItem` branches already initialize `points: 0`. |
| **`min="0.25"` in header** | 🐛 Bug | `InteractiveCanvasItem.tsx` line 96 still has `min="0.25"` — contradicts the store default of `0`. |

> [!IMPORTANT]
> **Re-render risk**: The `QuestionSidebar` re-renders on every canvas drag operation because it subscribes to `draft` directly. This is invisible on small assignments but will cause jank on large ones (20+ items).

---

### 2. UI/UX Consistency (`CanvasItemRenderer.tsx` — 1540 lines)

| Finding | Severity | Details |
|---|---|---|
| **Two frosted glass constants** | ⚠️ Medium | `FROSTED_GLASS_CLASS` and `FROSTED_GLASS_INPUT` are defined as identical copies (line 22-25). This is confusing — one should be deleted. |
| **Inline class duplication** | ⚠️ Medium | The seamless drag handle pattern (`flex flex-row items-stretch bg-white/80 backdrop-blur-md border border-indigo-300 rounded-md...`) is copy-pasted ~8 times across short-input, math-input, drop-down, essay, blanks, and drop zones. If the design system changes, all 8 must be updated. |
| **Preview mode z-index** | ✅ Stable | `InteractiveCanvasItem.tsx` conditionally hides the `.drag-header` via `{!isPreviewMode && (...)}` with absolute positioning (`absolute bottom-full`), so toggling preview mode causes no layout shift. |
| **`CanvasItemRenderer` is a 1540-line God Component** | 🔴 High | A single switch statement handles 14+ item types. This is maintainable *now* but will become a bottleneck. Each `case` block averages 80-120 lines. |

> [!WARNING]
> **`FROSTED_GLASS_CLASS` is exported** but `CanvasItemRenderer` also uses inline class strings for the seamless drag handle wrappers. The two are not the same classes. This creates a false sense of consistency.

---

### 3. Mathematical Rendering (SVG & Rnd)

| Finding | Severity | Details |
|---|---|---|
| **Matching Bezier engine** | ✅ Excellent | The `useDotPositions` hook (lines 29-91 of `MatchingQuestionRenderer.tsx`) uses `getBoundingClientRect` relative to a container ref, with a `ResizeObserver` + `requestAnimationFrame` pipeline. This is the gold standard for responsive SVG connectors. |
| **Bezier curve math** | ✅ Excellent | `curveFactor = dx * 0.45` with horizontal-start/horizontal-end control points produces a clean PowerPoint-style S-curve. |
| **`onDrag` triggers measure** | ⚠️ Low | `onDrag={() => triggerRemeasure()}` fires on every mouse pixel during drag. This calls `getBoundingClientRect` on every frame. Performance is fine for 4-8 nodes but could stutter at 20+. Should be debounced or throttled. |
| **Rnd `size="auto"`** | ⚠️ Low | Several Rnd wrappers pass `size={{ width: "auto", height: "auto" }}`. `react-rnd` treats `"auto"` as a string size which works but may cause unexpected behavior on resize-stop since `parseInt("auto")` returns `NaN`. Currently guarded by `\|\| 140` fallbacks. |
| **`data-matching-node` attribute** | ✅ Good | Used as a selector for the ResizeObserver to observe individual node wrappers. Clean approach. |

---

### 4. Third-Party Integrations

#### MathLive (`MathLiveInput.tsx` — 82 lines)

| Finding | Severity | Details |
|---|---|---|
| **CDN font path** | ✅ Fixed | `fontsDirectory` is set to `https://unpkg.com/mathlive/dist/fonts` on both `window.mathVirtualKeyboard` and `MathfieldElement`. |
| **Dynamic import** | ✅ Good | `import("mathlive")` is lazy-loaded in `useEffect`, preventing SSR crashes. |
| **Value sync race** | ⚠️ Low | The `useEffect` that sets `mf.value = value` depends on `[value]`, but the `input` event listener depends on `[onChange]`. If `onChange` identity changes (e.g., inline arrow in parent), the old listener is removed and re-attached, potentially missing an event. |
| **Sidebar math-input** | 🐛 Bug | `QuestionSidebar.tsx` line 217-221: The preview-mode math input is a plain `<input type="text">` — it should use `<MathLiveInput>` or at least `<math-field>` for consistency. |

#### HTML5 Drag & Drop (Re-sequence / Classification)

| Finding | Severity | Details |
|---|---|---|
| **Re-sequence DnD** | ✅ Working | Uses `dataTransfer.setData("text/plain", String(index))` for index-based reorder. Simple and correct. |
| **Drag-and-drop word bank** | ✅ Working | Drop zones use `onDragOver` + `onDrop` with `dataTransfer.getData("text/plain")`. |
| **No touch support** | ⚠️ Medium | HTML5 DnD has no native mobile/touch support. Students on iPads won't be able to use re-sequence or drag-and-drop items. |

---

## Phase 2: Prioritized Action Plan

### Priority 1: Fix `InteractiveCanvasItem` Point Minimum 🐛
**Effort: 1 minute** — Change `min="0.25"` → `min="0"` on line 96 of `InteractiveCanvasItem.tsx`.

### Priority 2: Extract Frosted Glass into a Shared Wrapper Component
**Effort: 30 minutes** — Create a `<FrostedGlassWrapper>` component that encapsulates the drag handle + frosted container pattern. Reduces the 8 copy-pasted blocks in `CanvasItemRenderer.tsx` to a single reusable component. Eliminates `FROSTED_GLASS_CLASS` / `FROSTED_GLASS_INPUT` confusion.

### Priority 3: Zustand Selector Optimization
**Effort: 15 minutes** — In `QuestionSidebar.tsx`, replace the destructured store access with granular selectors:
```ts
const draft = useAssignmentEditorStore((s) => s.draft);
const isPreviewMode = useAssignmentEditorStore((s) => s.isPreviewMode);
// etc.
```
This prevents re-renders when unrelated state changes (e.g., canvas item positions). For even better performance, use `useShallow` from `zustand/react/shallow`.

### Priority 4: Throttle Matching `onDrag` Remeasure
**Effort: 10 minutes** — Wrap `triggerRemeasure()` in the `onDrag` callback with a `requestAnimationFrame` guard or a 16ms throttle to avoid excessive `getBoundingClientRect` calls during drag.

### Priority 5: Sidebar MathLive Integration
**Effort: 10 minutes** — Replace the plain `<input>` in `QuestionSidebar.tsx` preview-mode math-input (line 217) with the existing `<MathLiveInput>` component, binding it to a local `studentState.math` value.

---

## Phase 3: Git Commit Message

```
feat: Interactive PDF Canvas with 14+ question types, Preview Mode, and MathLive

FEATURES:
- Implement full Interactive PDF Canvas with drag-resize (react-rnd) support
  for 14 question types: multiple-choice, multiple-selection, short-input,
  math-input, true-false, essay, drop-down, fill-in-the-blanks, drawing,
  drag-and-drop, re-sequence, classification, matching, and highlight-text
- Add Preview Mode (Student View toggle) for all canvas and sidebar items
- Integrate MathLive virtual keyboard with CDN font loading for math-input
- Add auto-expanding text areas via react-textarea-autosize for short-input,
  drop-down options, fill-in-the-blanks, and matching nodes
- Implement Sidebar Question panel (Pear Assessment-inspired) with 6 types:
  multiple-choice, short-input, drop-down, math-input, true-false, essay
- Add smart item duplication with auto-incrementing names
- Synchronize Canvas/Sidebar data structures through Zustand store

REFACTOR:
- Overhaul Matching (Nối cột) engine: replace hardcoded Y_OFFSET math with
  dynamic DOM measurement via useDotPositions hook (getBoundingClientRect +
  ResizeObserver + requestAnimationFrame pipeline)
- Replace straight SVG <line> connectors with cubic Bezier <path> curves
  (PowerPoint-style S-curves with dynamic curveFactor = dx * 0.45)
- Implement Seamless Integrated Drag Handle pattern across all input types
  (GripVertical inside frosted glass wrapper, replacing detached bg-slate-700)
- Unify Frosted Glass UI (bg-white/80 backdrop-blur-md border-indigo-300)
  across all canvas input components
- Extract MatchingQuestionRenderer into dedicated component with self-contained
  SVG layer, node management, and connection state

FIX:
- Fix layout shift on Preview Mode toggle by positioning .drag-header with
  absolute bottom-full (outside bounding box flow)
- Fix MathLive 404 font errors by setting fontsDirectory to unpkg CDN
- Fix MathLive crash: replace mf.setValue() with mf.value property assignment
- Fix opaque backgrounds on re-sequence and matching containers (bg-transparent)
- Fix pagination: canvas items now correctly associate with activePdfPage
- Fix duplicate <div> syntax error in drag-and-drop drop zone rendering
- Fix missing closing bracket on Rnd tag in fill-in-the-blanks
- Fix Z-index stacking for SVG connector layer, drag handles, and connector dots
- Set default points to 0 for all new items (was 1 in some paths)

DEPENDENCIES:
- Add react-textarea-autosize for auto-expanding input fields
- Add mathlive for mathematical formula input with virtual keyboard
```

---

> [!NOTE]
> The commit message above covers the **entire sprint** across all sessions. It is ready to use as-is with `git commit -m "..."` or as a commit body.

Do you want me to implement any of the proposed optimizations now (Priority 1 is a 1-minute fix I can do immediately), or will you commit and push the code as-is?
