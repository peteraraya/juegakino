import { create } from "zustand";

export type ToastKind = "success" | "info" | "error";

export interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
}

interface UiState {
  toasts: Toast[];
  pushToast: (message: string, kind?: ToastKind) => void;
  dismissToast: (id: number) => void;
}

let nextId = 1;

export const useUiStore = create<UiState>((set) => ({
  toasts: [],
  pushToast: (message, kind = "info") => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, message, kind }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));