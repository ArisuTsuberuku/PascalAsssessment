export interface BaseResolution {
  width: number;
  height: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MultipleChoiceOption {
  id: string;
  text: string;
  position?: { x: number; y: number }; // Relative to the canvas item body
}

export interface MultipleChoiceConfig {
  options: MultipleChoiceOption[];
  correctHash: string;
  correctHashes?: string[];
  points?: number;
  position?: { x: number; y: number };
  size?: { width: number | string; height: number | string };
}

export interface MathInputConfig {
  correctMathjs: string;
  tolerance?: number;
  points?: number;
  position?: { x: number; y: number };
  size?: { width: number | string; height: number | string };
}

export interface ShortInputConfig {
  correctAnswers: string[];
  correctAnswerText?: string;
  caseSensitive?: boolean;
  points?: number;
  position?: { x: number; y: number };
  size?: { width: number | string; height: number | string };
}

export interface DraggableItem {
  id: string;
  label: string;
}

export interface DropZone {
  id: string;
  label: string;
  targetDraggableId: string;
  relativeBox?: BoundingBox;
}

export interface DragDropZoneConfig {
  draggables: DraggableItem[];
  dropZones: DropZone[];
  points?: number;
  position?: { x: number; y: number };
  size?: { width: number | string; height: number | string };
}

export interface TrueFalseConfig {
  correctAnswer: boolean;
  points?: number;
  position?: { x: number; y: number };
  size?: { width: number | string; height: number | string };
}

export interface EssayConfig {
  maxLength?: number;
  gradingRubric?: string;
  points?: number;
  position?: { x: number; y: number };
  size?: { width: number | string; height: number | string };
}

export interface DropdownConfig {
  options: { id: string; text: string }[];
  correctHash: string;
  points?: number;
  position?: { x: number; y: number };
  size?: { width: number | string; height: number | string };
}

export interface MultipleSelectionConfig {
  options: MultipleChoiceOption[];
  correctHashes: string[];
  points?: number;
  position?: { x: number; y: number };
  size?: { width: number | string; height: number | string };
}

export interface BlankItem {
  id: string;
  position?: { x: number; y: number };
  size?: { width: number | string; height: number | string };
  correctAnswer: string;
}

export interface FillInBlanksConfig {
  blanks: BlankItem[];
  points?: number;
  position?: { x: number; y: number };
  size?: { width: number | string; height: number | string };
}

export interface DrawingConfig {
  points?: number;
  position?: { x: number; y: number };
  size?: { width: number | string; height: number | string };
}

export interface DragDropZoneItem {
  id: string;
  position?: { x: number; y: number };
  size?: { width: number | string; height: number | string };
  expectedWord: string;
}

export interface DragDropWordItem {
  id: string;
  text: string;
}

export interface DragDropConfig {
  dropZones: DragDropZoneItem[];
  wordBank: (DragDropWordItem | string)[];
  wordBankString?: string;
  points?: number;
  position?: { x: number; y: number };
  size?: { width: number | string; height: number | string };
}

export interface ResequenceItem {
  id: string;
  text: string;
  correctOrder: number;
}

export interface ResequenceConfig {
  items: ResequenceItem[];
  points?: number;
  position?: { x: number; y: number };
  size?: { width: number | string; height: number | string };
}

export interface ClassificationCategory {
  id: string;
  title: string;
  position?: { x: number; y: number };
}

export interface ClassificationItem {
  id: string;
  text: string;
  categoryId: string;
}

export interface ClassificationConfig {
  categories: ClassificationCategory[];
  items: ClassificationItem[];
  points?: number;
  position?: { x: number; y: number };
  size?: { width: number | string; height: number | string };
}

export interface MatchingNode {
  id: string;
  text: string;
  matchId: string;
  side: "left" | "right";
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export interface MatchingPair {
  id: string;
  leftText: string;
  rightText: string;
}

export interface MatchingConfig {
  nodes?: MatchingNode[];
  pairs?: MatchingPair[];
  correctConnections?: { leftId: string; rightId: string }[];
  points?: number;
  position?: { x: number; y: number };
  size?: { width: number | string; height: number | string };
}

export interface HighlightZone {
  id: string;
  position?: { x: number; y: number };
  size?: { width: number | string; height: number | string };
  isCorrectAnswer: boolean;
}

export interface HighlightTextConfig {
  highlightZones: HighlightZone[];
  points?: number;
  position?: { x: number; y: number };
  size?: { width: number | string; height: number | string };
}

export type ItemType =
  | "multiple-choice"
  | "math-input"
  | "short-input"
  | "drag-drop-zone"
  | "true-false"
  | "essay"
  | "drop-down"
  | "multiple-selection"
  | "fill-in-the-blanks"
  | "drawing"
  | "drag-and-drop"
  | "re-sequence"
  | "classification"
  | "matching"
  | "highlight-text";

export type ItemConfig =
  | MultipleChoiceConfig
  | MathInputConfig
  | ShortInputConfig
  | DragDropZoneConfig
  | TrueFalseConfig
  | EssayConfig
  | DropdownConfig
  | MultipleSelectionConfig
  | FillInBlanksConfig
  | DrawingConfig
  | DragDropConfig
  | ResequenceConfig
  | ClassificationConfig
  | MatchingConfig
  | HighlightTextConfig;

export interface BaseItem {
  id: string;
  name: string;
  type: ItemType;
  points: number;
  prompt?: string;
}

export interface SidebarMultipleChoiceItem extends BaseItem {
  placement: "sidebar";
  type: "multiple-choice";
  config: MultipleChoiceConfig;
}

export interface SidebarMathInputItem extends BaseItem {
  placement: "sidebar";
  type: "math-input";
  config: MathInputConfig;
}

export interface SidebarShortInputItem extends BaseItem {
  placement: "sidebar";
  type: "short-input";
  config: ShortInputConfig;
}

export interface SidebarDragDropItem extends BaseItem {
  placement: "sidebar";
  type: "drag-drop-zone";
  config: DragDropZoneConfig;
}

export interface SidebarTrueFalseItem extends BaseItem {
  placement: "sidebar";
  type: "true-false";
  config: TrueFalseConfig;
}

export interface SidebarEssayItem extends BaseItem {
  placement: "sidebar";
  type: "essay";
  config: EssayConfig;
}

export interface SidebarDropdownItem extends BaseItem {
  placement: "sidebar";
  type: "drop-down";
  config: DropdownConfig;
}

export interface SidebarMultipleSelectionItem extends BaseItem {
  placement: "sidebar";
  type: "multiple-selection";
  config: MultipleSelectionConfig;
}

export interface SidebarFillInBlanksItem extends BaseItem {
  placement: "sidebar";
  type: "fill-in-the-blanks";
  config: FillInBlanksConfig;
}

export interface SidebarDrawingItem extends BaseItem {
  placement: "sidebar";
  type: "drawing";
  config: DrawingConfig;
}

export type SidebarItem =
  | SidebarMultipleChoiceItem
  | SidebarMathInputItem
  | SidebarShortInputItem
  | SidebarDragDropItem
  | SidebarTrueFalseItem
  | SidebarEssayItem
  | SidebarDropdownItem
  | SidebarMultipleSelectionItem
  | SidebarFillInBlanksItem
  | SidebarDrawingItem;

export interface CanvasMultipleChoiceItem extends BaseItem {
  placement: "canvas";
  type: "multiple-choice";
  pageNumber: number;
  boundingBox: BoundingBox;
  config: MultipleChoiceConfig;
}

export interface CanvasMathInputItem extends BaseItem {
  placement: "canvas";
  type: "math-input";
  pageNumber: number;
  boundingBox: BoundingBox;
  config: MathInputConfig;
}

export interface CanvasShortInputItem extends BaseItem {
  placement: "canvas";
  type: "short-input";
  pageNumber: number;
  boundingBox: BoundingBox;
  config: ShortInputConfig;
}

export interface CanvasDragDropItem extends BaseItem {
  placement: "canvas";
  type: "drag-drop-zone";
  pageNumber: number;
  boundingBox: BoundingBox;
  config: DragDropZoneConfig;
}

export interface CanvasTrueFalseItem extends BaseItem {
  placement: "canvas";
  type: "true-false";
  pageNumber: number;
  boundingBox: BoundingBox;
  config: TrueFalseConfig;
}

export interface CanvasEssayItem extends BaseItem {
  placement: "canvas";
  type: "essay";
  pageNumber: number;
  boundingBox: BoundingBox;
  config: EssayConfig;
}

export interface CanvasDropdownItem extends BaseItem {
  placement: "canvas";
  type: "drop-down";
  pageNumber: number;
  boundingBox: BoundingBox;
  config: DropdownConfig;
}

export interface CanvasMultipleSelectionItem extends BaseItem {
  placement: "canvas";
  type: "multiple-selection";
  pageNumber: number;
  boundingBox: BoundingBox;
  config: MultipleSelectionConfig;
}

export interface CanvasFillInBlanksItem extends BaseItem {
  placement: "canvas";
  type: "fill-in-the-blanks";
  pageNumber: number;
  boundingBox: BoundingBox;
  config: FillInBlanksConfig;
}

export interface CanvasDrawingItem extends BaseItem {
  placement: "canvas";
  type: "drawing";
  pageNumber: number;
  boundingBox: BoundingBox;
  config: DrawingConfig;
}

export interface CanvasDragAndDropItem extends BaseItem {
  placement: "canvas";
  type: "drag-and-drop";
  pageNumber: number;
  boundingBox: BoundingBox;
  config: DragDropConfig;
}

export interface CanvasResequenceItem extends BaseItem {
  placement: "canvas";
  type: "re-sequence";
  pageNumber: number;
  boundingBox: BoundingBox;
  config: ResequenceConfig;
}

export interface CanvasClassificationItem extends BaseItem {
  placement: "canvas";
  type: "classification";
  pageNumber: number;
  boundingBox: BoundingBox;
  config: ClassificationConfig;
}

export interface CanvasMatchingItem extends BaseItem {
  placement: "canvas";
  type: "matching";
  pageNumber: number;
  boundingBox: BoundingBox;
  config: MatchingConfig;
}

export interface CanvasHighlightTextItem extends BaseItem {
  placement: "canvas";
  type: "highlight-text";
  pageNumber: number;
  boundingBox: BoundingBox;
  config: HighlightTextConfig;
}

export type CanvasItem =
  | CanvasMultipleChoiceItem
  | CanvasMathInputItem
  | CanvasShortInputItem
  | CanvasDragDropItem
  | CanvasTrueFalseItem
  | CanvasEssayItem
  | CanvasDropdownItem
  | CanvasMultipleSelectionItem
  | CanvasFillInBlanksItem
  | CanvasDrawingItem
  | CanvasDragAndDropItem
  | CanvasResequenceItem
  | CanvasClassificationItem
  | CanvasMatchingItem
  | CanvasHighlightTextItem;

export type Item = SidebarItem | CanvasItem;
export type AssessmentItem = Item;

export interface Section {
  sectionId: string;
  title: string;
  description?: string;
  order: number;
  items: Item[];
}

export interface Assignment {
  assignmentId: string;
  title: string;
  pdfUrl: string;
  baseResolution: BaseResolution;
  sections: Section[];
  teacherId?: string;
  updatedAt?: any;
  createdAt?: any;
}

export interface Annotation {
  id: string;
  type: "line" | "text" | "image";
  tool: string; // 'pen' | 'highlighter' | 'eraser' | 'line' | 'text' | 'image' | 'sticker'
  points?: number[];
  color?: string;
  strokeWidth?: number;
  pageNumber?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  imageUrl?: string;
  text?: string;
  fontSize?: number;
  canvasWidth?: number;
  canvasHeight?: number;
  owner?: "teacher" | "student";
  selectable?: boolean;
  evented?: boolean;
  hasControls?: boolean;
}

export type SessionStatus = "active" | "paused" | "closed" | "stopped";

export interface ClassSession {
  id: string;
  classCode: string;
  status: SessionStatus;
  createdAt?: any;
  updatedAt?: any;
}

