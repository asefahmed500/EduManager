import { toast } from "@/components/ui/toast";

type ToastType = "success" | "error" | "info" | "warning";

function emit(type: ToastType, message: string, title?: string) {
  toast.add({ type, description: message, title });
}

export const notify = {
  success: (message: string, title?: string) => emit("success", message, title),
  error: (message: string, title?: string) => emit("error", message, title),
  info: (message: string, title?: string) => emit("info", message, title),
  warning: (message: string, title?: string) => emit("warning", message, title),
};

export { toast };
