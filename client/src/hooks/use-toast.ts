import { useState, useCallback } from "react";

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

const useToastStore = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
};

// Global toast store
let globalToastStore: ReturnType<typeof useToastStore>;

export const useToast = () => {
  if (!globalToastStore) {
    globalToastStore = useToastStore();
  }
  
  return {
    toast: globalToastStore.addToast,
    toasts: globalToastStore.toasts,
    dismiss: globalToastStore.removeToast,
  };
};