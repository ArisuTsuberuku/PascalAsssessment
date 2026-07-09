import { create } from "zustand";
import {
  Assignment,
  AssessmentItem,
  ItemType,
  SidebarItem,
  CanvasItem,
  BoundingBox,
} from "@/types/assignment";

interface AssignmentEditorState {
  draft: Assignment | null;
  pendingPdfFile: File | null;
  pdfPreviewUrl: string | null;
  isPdfChanged: boolean;
  isLoading: boolean;
  isSaving: boolean;
  isPreviewMode: boolean;
  error: string | null;

  togglePreviewMode: () => void;
  initBlankDraft: () => void;
  loadDraft: (assignment: Assignment) => void;
  setLocalPdf: (file: File) => void;
  updateTitle: (newTitle: string) => void;
  setSaving: (saving: boolean) => void;
  setError: (err: string | null) => void;
  clearDraft: () => void;
  clearPendingPdf: () => void;

  activePdfPage: number;
  setActivePdfPage: (page: number) => void;
  duplicateCanvasItem: (itemId: string) => void;

  // Item Management Actions
  addSidebarItem: (type: ItemType) => void;
  addCanvasItem: (type: ItemType, pageNumber?: number) => void;
  updateCanvasItemBounds: (
    itemId: string,
    newBounds: Partial<BoundingBox>
  ) => void;
  updateCanvasItemConfig: (
    itemId: string,
    newConfig: Record<string, any>
  ) => void;
  removeCanvasItem: (itemId: string) => void;
  updateItem: (itemId: string, updates: Record<string, any>) => void;
  deleteItem: (itemId: string) => void;
}

export const useAssignmentEditorStore = create<AssignmentEditorState>(
  (set, get) => ({
    draft: null,
    pendingPdfFile: null,
    pdfPreviewUrl: null,
    isPdfChanged: false,
    isLoading: true,
    isSaving: false,
    isPreviewMode: false,
    activePdfPage: 1,
    error: null,

    setActivePdfPage: (page: number) => set({ activePdfPage: page }),

    togglePreviewMode: () =>
      set((state) => ({ isPreviewMode: !state.isPreviewMode })),

    initBlankDraft: () => {
      // Cleanup previous blob url if any
      const currentUrl = get().pdfPreviewUrl;
      if (currentUrl && currentUrl.startsWith("blob:")) {
        URL.revokeObjectURL(currentUrl);
      }

      const blankAssignment: Assignment = {
        assignmentId: "new",
        title: "Bài tập mới chưa đặt tên",
        pdfUrl: "",
        baseResolution: {
          width: 1000,
          height: 1414,
        },
        sections: [
          {
            sectionId: "sec-sidebar",
            title: "Câu hỏi Sidebar",
            description: "Danh sách các câu hỏi trả lời bên bảng điều khiển",
            order: 1,
            items: [],
          },
          {
            sectionId: "sec-canvas",
            title: "Vùng tương tác Canvas",
            description: "Các vùng tương tác trực tiếp trên PDF",
            order: 2,
            items: [],
          },
        ],
      };

      set({
        draft: blankAssignment,
        pendingPdfFile: null,
        pdfPreviewUrl: null,
        isPdfChanged: false,
        isLoading: false,
        error: null,
      });
    },

    loadDraft: (assignment: Assignment) => {
      const currentUrl = get().pdfPreviewUrl;
      if (currentUrl && currentUrl.startsWith("blob:")) {
        URL.revokeObjectURL(currentUrl);
      }

      set({
        draft: assignment,
        pendingPdfFile: null,
        pdfPreviewUrl: assignment.pdfUrl || null,
        isPdfChanged: false,
        isLoading: false,
        error: null,
      });
    },

    setLocalPdf: (file: File) => {
      const currentUrl = get().pdfPreviewUrl;
      if (currentUrl && currentUrl.startsWith("blob:")) {
        URL.revokeObjectURL(currentUrl);
      }

      const objectUrl = URL.createObjectURL(file);
      set({
        pendingPdfFile: file,
        pdfPreviewUrl: objectUrl,
        isPdfChanged: true,
      });
    },

    updateTitle: (newTitle: string) => {
      set((state) => {
        if (!state.draft) return state;
        return {
          draft: {
            ...state.draft,
            title: newTitle,
          },
        };
      });
    },

    setSaving: (saving: boolean) => {
      set({ isSaving: saving });
    },

    setError: (err: string | null) => {
      set({ error: err });
    },

    clearDraft: () => {
      const currentUrl = get().pdfPreviewUrl;
      if (currentUrl && currentUrl.startsWith("blob:")) {
        URL.revokeObjectURL(currentUrl);
      }
      set({
        draft: null,
        pendingPdfFile: null,
        pdfPreviewUrl: null,
        isPdfChanged: false,
        isLoading: false,
        isSaving: false,
        error: null,
      });
    },

    clearPendingPdf: () => {
      const currentUrl = get().pdfPreviewUrl;
      if (currentUrl && currentUrl.startsWith("blob:")) {
        URL.revokeObjectURL(currentUrl);
      }
      set({
        pendingPdfFile: null,
      });
    },

    addSidebarItem: (type: ItemType) => {
      set((state) => {
        if (!state.draft) return state;
        const count =
          state.draft.sections.reduce(
            (acc, sec) => acc + sec.items.length,
            0
          ) + 1;
        const newItemId = `item-sidebar-${Date.now()}`;

        let newItem: SidebarItem;
        switch (type) {
          case "multiple-choice":
            newItem = {
              id: newItemId,
              name: `Câu hỏi ${count}`,
              type: "multiple-choice",
              placement: "sidebar",
              points: 0,
              prompt: "Nhập nội dung câu hỏi trắc nghiệm...",
              config: {
                options: [
                  { id: "opt-a", text: "Lựa chọn A" },
                  { id: "opt-b", text: "Lựa chọn B" },
                  { id: "opt-c", text: "Lựa chọn C" },
                  { id: "opt-d", text: "Lựa chọn D" },
                ],
                correctHash: "opt-a",
              },
            };
            break;
          case "math-input":
            newItem = {
              id: newItemId,
              name: `Câu hỏi ${count}`,
              type: "math-input",
              placement: "sidebar",
              points: 0,
              prompt: "Nhập biểu thức hoặc công thức cần tính...",
              config: {
                correctMathjs: "2*x + 1",
              },
            };
            break;
          case "short-input":
            newItem = {
              id: newItemId,
              name: `Câu hỏi ${count}`,
              type: "short-input",
              placement: "sidebar",
              points: 0,
              prompt: "Nhập câu trả lời ngắn...",
              config: {
                correctAnswers: ["đáp án"],
                caseSensitive: false,
              },
            };
            break;
          case "true-false":
            newItem = {
              id: newItemId,
              name: `Câu hỏi ${count}`,
              type: "true-false",
              placement: "sidebar",
              points: 0,
              prompt: "Nhập phát biểu Đúng/Sai...",
              config: {
                correctAnswer: true,
              },
            };
            break;
          case "essay":
            newItem = {
              id: newItemId,
              name: `Câu hỏi ${count}`,
              type: "essay",
              placement: "sidebar",
              points: 0,
              prompt: "Nhập đề bài tự luận...",
              config: {
                maxLength: 500,
              },
            };
            break;
          case "drop-down":
            newItem = {
              id: newItemId,
              name: `Câu hỏi ${count}`,
              type: "drop-down",
              placement: "sidebar",
              points: 0,
              prompt: "Chọn đáp án từ danh sách thả xuống...",
              config: {
                options: [
                  { id: "opt1", text: "Option 1" },
                  { id: "opt2", text: "Option 2" },
                ],
                correctHash: "",
              },
            };
            break;
          case "multiple-selection":
            newItem = {
              id: newItemId,
              name: `Câu hỏi ${count}`,
              type: "multiple-selection",
              placement: "sidebar",
              points: 0,
              prompt: "Chọn nhiều đáp án đúng...",
              config: {
                options: [
                  { id: "opt-a", text: "A" },
                  { id: "opt-b", text: "B" },
                  { id: "opt-c", text: "C" },
                  { id: "opt-d", text: "D" },
                ],
                correctHashes: ["opt-a"],
              },
            };
            break;
          case "fill-in-the-blanks":
            newItem = {
              id: newItemId,
              name: `Câu hỏi ${count}`,
              type: "fill-in-the-blanks",
              placement: "sidebar",
              points: 0,
              prompt: "Điền vào chỗ trống...",
              config: {
                blanks: [{ id: "blank-1", correctAnswer: "" }],
              },
            };
            break;
          case "drawing":
            newItem = {
              id: newItemId,
              name: `Câu hỏi ${count}`,
              type: "drawing",
              placement: "sidebar",
              points: 0,
              prompt: "Vẽ hoặc làm bài tự luận trên giấy...",
              config: {},
            };
            break;
          case "drag-drop-zone":
          default:
            newItem = {
              id: newItemId,
              name: `Câu hỏi ${count}`,
              type: "drag-drop-zone",
              placement: "sidebar",
              points: 0,
              prompt: "Câu hỏi kéo thả...",
              config: {
                draggables: [{ id: "d1", label: "Mục 1" }],
                dropZones: [
                  { id: "z1", label: "Vùng 1", targetDraggableId: "d1" },
                ],
              },
            };
            break;
        }

        const updatedSections = state.draft.sections.map((sec) => {
          if (sec.sectionId === "sec-sidebar" || sec.order === 1) {
            return {
              ...sec,
              items: [...sec.items, newItem],
            };
          }
          return sec;
        });

        return {
          draft: {
            ...state.draft,
            sections: updatedSections,
          },
        };
      });
    },

    addCanvasItem: (type: ItemType, pageNumber?: number) => {
      set((state) => {
        if (!state.draft) return state;
        const targetPage = pageNumber ?? state.activePdfPage ?? 1;
        const count =
          state.draft.sections.reduce(
            (acc, sec) => acc + sec.items.length,
            0
          ) + 1;
        const newItemId = `item-canvas-${Date.now()}`;
        const defaultBox = { x: 100, y: 100, width: 300, height: 150 };

        let newItem: CanvasItem;
        switch (type) {
          case "multiple-choice":
            newItem = {
              id: newItemId,
              name: `Trắc nghiệm ${count}`,
              type: "multiple-choice",
              placement: "canvas",
              pageNumber: targetPage,
              boundingBox: defaultBox,
              points: 0,
              prompt: "Chọn đáp án đúng trên PDF",
              config: {
                options: [
                  { id: "opt-a", text: "A" },
                  { id: "opt-b", text: "B" },
                  { id: "opt-c", text: "C" },
                  { id: "opt-d", text: "D" },
                ],
                correctHash: "opt-a",
              },
            };
            break;
          case "short-input":
            newItem = {
              id: newItemId,
              name: `Trả lời ngắn ${count}`,
              type: "short-input",
              placement: "canvas",
              pageNumber: targetPage,
              boundingBox: defaultBox,
              points: 0,
              prompt: "Điền đáp án vào ô",
              config: {
                correctAnswers: [""],
                caseSensitive: false,
              },
            };
            break;
          case "math-input":
            newItem = {
              id: newItemId,
              name: `Công thức ${count}`,
              type: "math-input",
              placement: "canvas",
              pageNumber: targetPage,
              boundingBox: defaultBox,
              points: 0,
              prompt: "Nhập công thức toán học",
              config: {
                correctMathjs: "",
              },
            };
            break;
          case "true-false":
            newItem = {
              id: newItemId,
              name: `Đúng / Sai ${count}`,
              type: "true-false",
              placement: "canvas",
              pageNumber: targetPage,
              boundingBox: defaultBox,
              points: 0,
              prompt: "Chọn Đúng hoặc Sai",
              config: {
                correctAnswer: true,
              },
            };
            break;
          case "essay":
            newItem = {
              id: newItemId,
              name: `Tự luận ${count}`,
              type: "essay",
              placement: "canvas",
              pageNumber: targetPage,
              boundingBox: defaultBox,
              points: 0,
              prompt: "Nhập bài làm tự luận",
              config: {
                maxLength: 500,
              },
            };
            break;
          case "drop-down":
            newItem = {
              id: newItemId,
              name: `Danh sách ${count}`,
              type: "drop-down",
              placement: "canvas",
              pageNumber: targetPage,
              boundingBox: defaultBox,
              points: 0,
              prompt: "Chọn từ danh sách",
              config: {
                options: [
                  { id: "opt1", text: "Option 1" },
                  { id: "opt2", text: "Option 2" },
                ],
                correctHash: "",
              },
            };
            break;
          case "multiple-selection":
            newItem = {
              id: newItemId,
              name: `Chọn nhiều ${count}`,
              type: "multiple-selection",
              placement: "canvas",
              pageNumber: targetPage,
              boundingBox: defaultBox,
              points: 0,
              prompt: "Chọn nhiều đáp án đúng trên PDF",
              config: {
                options: [
                  { id: "opt-a", text: "A" },
                  { id: "opt-b", text: "B" },
                  { id: "opt-c", text: "C" },
                  { id: "opt-d", text: "D" },
                ],
                correctHashes: ["opt-a"],
              },
            };
            break;
          case "fill-in-the-blanks":
            newItem = {
              id: newItemId,
              name: `Điền từ ${count}`,
              type: "fill-in-the-blanks",
              placement: "canvas",
              pageNumber: targetPage,
              boundingBox: defaultBox,
              points: 0,
              prompt: "Điền vào chỗ trống",
              config: {
                blanks: [{ id: "blank-1", correctAnswer: "" }],
              },
            };
            break;
          case "drawing":
            newItem = {
              id: newItemId,
              name: `Vẽ tay ${count}`,
              type: "drawing",
              placement: "canvas",
              pageNumber: targetPage,
              boundingBox: defaultBox,
              points: 0,
              prompt: "Vùng vẽ tay",
              config: {},
            };
            break;
          case "drag-and-drop":
            newItem = {
              id: newItemId,
              name: `Kéo thả ${count}`,
              type: "drag-and-drop",
              placement: "canvas",
              pageNumber: targetPage,
              boundingBox: defaultBox,
              points: 0,
              prompt: "Kéo thả từ vào vùng",
              config: {
                dropZones: [
                  {
                    id: "dz-1",
                    expectedWord: "Từ 1",
                    position: { x: 10, y: 10 },
                    size: { width: 110, height: 32 },
                  },
                ],
                wordBank: ["Từ 1", "Từ 2"],
                wordBankString: "Từ 1, Từ 2",
                points: 0,
              },
            };
            break;
          case "re-sequence":
            newItem = {
              id: newItemId,
              name: `Sắp xếp ${count}`,
              type: "re-sequence",
              placement: "canvas",
              pageNumber: targetPage,
              boundingBox: defaultBox,
              points: 0,
              prompt: "Sắp xếp theo thứ tự",
              config: {
                items: [
                  { id: "seq-1", text: "Bước 1", correctOrder: 1 },
                  { id: "seq-2", text: "Bước 2", correctOrder: 2 },
                ],
              },
            };
            break;
          case "classification":
            newItem = {
              id: newItemId,
              name: `Phân loại ${count}`,
              type: "classification",
              placement: "canvas",
              pageNumber: targetPage,
              boundingBox: defaultBox,
              points: 0,
              prompt: "Phân loại các mục",
              config: {
                categories: [
                  { id: "cat-1", title: "Nhóm A" },
                  { id: "cat-2", title: "Nhóm B" },
                ],
                items: [
                  { id: "item-1", text: "Mục 1", categoryId: "cat-1" },
                  { id: "item-2", text: "Mục 2", categoryId: "cat-2" },
                ],
              },
            };
            break;
          case "matching":
            newItem = {
              id: newItemId,
              name: `Nối cột ${count}`,
              type: "matching",
              placement: "canvas",
              pageNumber: targetPage,
              boundingBox: defaultBox,
              points: 0,
              prompt: "Nối cặp tương ứng",
              config: {
                nodes: [
                  {
                    id: "node-1",
                    text: "Vế trái 1",
                    matchId: "pair-1",
                    side: "left",
                    position: { x: 10, y: 20 },
                    size: { width: 140, height: 40 },
                  },
                  {
                    id: "node-2",
                    text: "Vế phải 1",
                    matchId: "pair-1",
                    side: "right",
                    position: { x: 220, y: 20 },
                    size: { width: 140, height: 40 },
                  },
                  {
                    id: "node-3",
                    text: "Vế trái 2",
                    matchId: "pair-2",
                    side: "left",
                    position: { x: 10, y: 90 },
                    size: { width: 140, height: 40 },
                  },
                  {
                    id: "node-4",
                    text: "Vế phải 2",
                    matchId: "pair-2",
                    side: "right",
                    position: { x: 220, y: 90 },
                    size: { width: 140, height: 40 },
                  },
                ],
                pairs: [
                  { id: "pair-1", leftText: "Vế trái 1", rightText: "Vế phải 1" },
                  { id: "pair-2", leftText: "Vế trái 2", rightText: "Vế phải 2" },
                ],
              },
            };
            break;
          case "highlight-text":
            newItem = {
              id: newItemId,
              name: `Đánh dấu ${count}`,
              type: "highlight-text",
              placement: "canvas",
              pageNumber: targetPage,
              boundingBox: defaultBox,
              points: 0,
              prompt: "Đánh dấu từ/vùng đúng",
              config: {
                highlightZones: [
                  {
                    id: "hl-1",
                    position: { x: 10, y: 10 },
                    size: { width: 130, height: 26 },
                    isCorrectAnswer: true,
                  },
                ],
              },
            };
            break;
          default:
            newItem = {
              id: newItemId,
              name: `Vùng tương tác ${count}`,
              type,
              placement: "canvas",
              pageNumber: targetPage,
              boundingBox: defaultBox,
              points: 0,
              prompt: "Vùng tương tác Canvas",
              config: {
                correctAnswers: [""],
              } as any,
            };
            break;
        }

        const updatedSections = state.draft.sections.map((sec) => {
          if (sec.sectionId === "sec-canvas" || sec.order === 2) {
            return {
              ...sec,
              items: [...sec.items, newItem],
            };
          }
          return sec;
        });

        return {
          draft: {
            ...state.draft,
            sections: updatedSections,
          },
        };
      });
    },

    duplicateCanvasItem: (itemId: string) => {
      set((state) => {
        if (!state.draft) return state;

        let targetItem: CanvasItem | null = null;
        for (const sec of state.draft.sections) {
          const found = sec.items.find((item) => item.id === itemId);
          if (found) {
            targetItem = found as CanvasItem;
            break;
          }
        }
        if (!targetItem) return state;

        const oldName = targetItem.name || "";
        const match = oldName.match(/(.*?)(\d+)$/);
        let newName = oldName + " 2";
        if (match) {
          newName = `${match[1]}${parseInt(match[2], 10) + 1}`;
        }

        const clonedItem: CanvasItem = JSON.parse(JSON.stringify(targetItem));
        const newId = `item-canvas-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 6)}`;
        clonedItem.id = newId;
        clonedItem.name = newName;

        clonedItem.boundingBox = {
          ...clonedItem.boundingBox,
          x: (clonedItem.boundingBox.x || 100) + 20,
          y: (clonedItem.boundingBox.y || 100) + 20,
        };

        if (clonedItem.config && (clonedItem.config as any).position) {
          (clonedItem.config as any).position = {
            x: ((clonedItem.config as any).position.x || 0) + 20,
            y: ((clonedItem.config as any).position.y || 0) + 20,
          };
        }

        const updatedSections = state.draft.sections.map((sec) => {
          if (sec.items.some((item) => item.id === itemId)) {
            return {
              ...sec,
              items: [...sec.items, clonedItem],
            };
          }
          return sec;
        });

        return {
          draft: {
            ...state.draft,
            sections: updatedSections,
          },
        };
      });
    },

    updateCanvasItemBounds: (
      itemId: string,
      newBounds: Partial<BoundingBox>
    ) => {
      set((state) => {
        if (!state.draft) return state;
        const updatedSections = state.draft.sections.map((sec) => ({
          ...sec,
          items: sec.items.map((item) => {
            if (item.id !== itemId || item.placement !== "canvas") return item;
            const canvasItem = item as CanvasItem;
            return {
              ...canvasItem,
              boundingBox: {
                ...canvasItem.boundingBox,
                ...newBounds,
              },
            };
          }),
        }));
        return {
          draft: {
            ...state.draft,
            sections: updatedSections,
          },
        };
      });
    },

    updateItem: (itemId: string, updates: Record<string, any>) => {
      set((state) => {
        if (!state.draft) return state;
        const updatedSections = state.draft.sections.map((sec) => ({
          ...sec,
          items: sec.items.map((item) =>
            item.id === itemId ? ({ ...item, ...updates } as AssessmentItem) : item
          ),
        }));
        return {
          draft: {
            ...state.draft,
            sections: updatedSections,
          },
        };
      });
    },

    updateCanvasItemConfig: (itemId: string, newConfig: Record<string, any>) => {
      set((state) => {
        if (!state.draft) return state;
        const updatedSections = state.draft.sections.map((sec) => ({
          ...sec,
          items: sec.items.map((item) => {
            if (item.id !== itemId || item.placement !== "canvas") return item;
            return {
              ...item,
              config: {
                ...item.config,
                ...newConfig,
              },
            } as AssessmentItem;
          }),
        }));
        return {
          draft: {
            ...state.draft,
            sections: updatedSections,
          },
        };
      });
    },

    removeCanvasItem: (itemId: string) => {
      get().deleteItem(itemId);
    },

    deleteItem: (itemId: string) => {
      set((state) => {
        if (!state.draft) return state;
        const updatedSections = state.draft.sections.map((sec) => ({
          ...sec,
          items: sec.items.filter((item) => item.id !== itemId),
        }));
        return {
          draft: {
            ...state.draft,
            sections: updatedSections,
          },
        };
      });
    },
  })
);
