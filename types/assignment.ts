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
}

export interface MultipleChoiceConfig {
  options: MultipleChoiceOption[];
  correctHash: string;
}

export interface MathInputConfig {
  correctMathjs: string;
  tolerance?: number;
}

export interface ShortInputConfig {
  correctAnswers: string[];
  caseSensitive?: boolean;
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
}

export type ItemType =
  | "multiple-choice"
  | "math-input"
  | "short-input"
  | "drag-drop-zone";

export type ItemConfig =
  | MultipleChoiceConfig
  | MathInputConfig
  | ShortInputConfig
  | DragDropZoneConfig;

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

export type SidebarItem =
  | SidebarMultipleChoiceItem
  | SidebarMathInputItem
  | SidebarShortInputItem
  | SidebarDragDropItem;

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

export type CanvasItem =
  | CanvasMultipleChoiceItem
  | CanvasMathInputItem
  | CanvasShortInputItem
  | CanvasDragDropItem;

export type Item = SidebarItem | CanvasItem;

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
}
