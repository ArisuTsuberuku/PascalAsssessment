import { Assignment } from "@/types/assignment";

export const mockAssignment: Assignment = {
  assignmentId: "phys-hw-dynamics-101",
  title: "Physics Homework 101: Newton's Laws & Mechanical Dynamics",
  pdfUrl: "/pdfs/physics_dynamics_practice.pdf",
  baseResolution: {
    width: 1000,
    height: 1414,
  },
  sections: [
    {
      sectionId: "sec-sidebar-theory",
      title: "Phần 1: Lý thuyết & Động lực học cơ bản (Sidebar Questions)",
      description:
        "Trả lời các câu hỏi trắc nghiệm và biểu thức toán học trực tiếp trên bảng điều khiển bên phải.",
      order: 1,
      items: [
        {
          id: "item-mc-01",
          name: "Câu hỏi 1: Định luật II Newton",
          type: "multiple-choice",
          placement: "sidebar",
          points: 10,
          prompt:
            "Một vật có khối lượng m = 2 kg chịu tác dụng của lực F = 10 N không đổi theo phương ngang (bỏ qua ma sát). Gia tốc a của vật là bao nhiêu?",
          config: {
            options: [
              { id: "opt-a", text: "2.5 m/s²" },
              { id: "opt-b", text: "5.0 m/s²" },
              { id: "opt-c", text: "10.0 m/s²" },
              { id: "opt-d", text: "20.0 m/s²" },
            ],
            correctHash: "hash_opt_b_5_0_ms2",
          },
        },
        {
          id: "item-math-02",
          name: "Câu hỏi 2: Biểu thức thế năng trọng trường",
          type: "math-input",
          placement: "sidebar",
          points: 15,
          prompt:
            "Viết công thức tính thế năng trọng trường Wt của một vật khối lượng m ở độ cao h trong trường trọng lực g.",
          config: {
            correctMathjs: "m * g * h",
            tolerance: 0,
          },
        },
      ],
    },
    {
      sectionId: "sec-canvas-interactive",
      title: "Phần 2: Bài tập tương tác trực tiếp trên Đề PDF (Canvas Interactive)",
      description:
        "Điền đáp án ngắn và kéo thả chú thích trực tiếp vào các vùng khoanh trên trang PDF.",
      order: 2,
      items: [
        {
          id: "item-short-page1",
          name: "Câu hỏi 3: Tính lực căng dây (Trang 1)",
          type: "short-input",
          placement: "canvas",
          points: 20,
          pageNumber: 1,
          prompt:
            "Quan sát hình vẽ hệ ròng rọc trên trang 1 và điền giá trị lực căng dây T (Đơn vị: N).",
          boundingBox: {
            x: 580,
            y: 720,
            width: 320,
            height: 90,
          },
          config: {
            correctAnswers: ["49", "49 N", "49N", "49.0"],
            caseSensitive: false,
          },
        },
        {
          id: "item-dragdrop-page2",
          name: "Câu hỏi 4: Kéo thả vectơ lực trên sơ đồ vật thể tự do (Trang 2)",
          type: "drag-drop-zone",
          placement: "canvas",
          points: 25,
          pageNumber: 2,
          prompt:
            "Kéo thả đúng nhãn các vectơ lực vào sơ đồ mặt phẳng nghiêng trên trang 2.",
          boundingBox: {
            x: 150,
            y: 410,
            width: 700,
            height: 480,
          },
          config: {
            draggables: [
              { id: "drag-p", label: "Trọng lực P = m.g" },
              { id: "drag-n", label: "Phản lực pháp tuyến N" },
              { id: "drag-fms", label: "Lực ma sát Fms" },
            ],
            dropZones: [
              {
                id: "zone-bottom",
                label: "Hướng thẳng đứng xuống dưới",
                targetDraggableId: "drag-p",
                relativeBox: { x: 300, y: 320, width: 140, height: 60 },
              },
              {
                id: "zone-normal",
                label: "Vuông góc mặt phẳng nghiêng",
                targetDraggableId: "drag-n",
                relativeBox: { x: 300, y: 80, width: 140, height: 60 },
              },
              {
                id: "zone-friction",
                label: "Ngược chiều chuyển động",
                targetDraggableId: "drag-fms",
                relativeBox: { x: 100, y: 220, width: 140, height: 60 },
              },
            ],
          },
        },
      ],
    },
  ],
};
