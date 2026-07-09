import { create } from "zustand";

interface UserState {
  role: "teacher" | "student" | null;
  classCode: string | null;
  studentName: string | null;
  studentMode: "Individual" | "Group";
  setRole: (role: "teacher" | "student" | null) => void;
  setStudentInfo: (classCode: string, name: string, mode: "Individual" | "Group") => void;
}

export const useAppStore = create<UserState>((set) => ({
  role: null,
  classCode: null,
  studentName: null,
  studentMode: "Individual",
  setRole: (role) => set({ role }),
  setStudentInfo: (classCode, studentName, studentMode) =>
    set({ classCode, studentName, studentMode }),
}));
