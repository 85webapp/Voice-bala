export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

type ToastListener = (toasts: ToastMessage[]) => void;

let toasts: ToastMessage[] = [];
const listeners = new Set<ToastListener>();

function notify() {
  listeners.forEach((listener) => {
    try {
      listener([...toasts]);
    } catch (e) {
      console.warn('Toast listener error:', e);
    }
  });
}

export function subscribeToasts(listener: ToastListener): () => void {
  listeners.add(listener);
  listener([...toasts]);
  return () => {
    listeners.delete(listener);
  };
}

export function showToast(message: string, type: ToastType = 'warning', duration = 4000) {
  const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newToast: ToastMessage = { id, message, type, duration };

  toasts = [newToast, ...toasts.slice(0, 4)];
  notify();

  if (duration > 0) {
    setTimeout(() => {
      dismissToast(id);
    }, duration);
  }
}

export function dismissToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  notify();
}

// Expose on window for emergency debugging
if (typeof window !== 'undefined') {
  (window as any).showToast = showToast;
}
