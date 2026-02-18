import { toast } from 'react-toastify';

export function notifySuccess(message: string) {
  toast.success(message, { position: 'top-right', autoClose: 3000 });
}

export function notifyError(message: string) {
  toast.error(message, { position: 'top-right', autoClose: 5000 });
}

export function notifyInfo(message: string) {
  toast.info(message, { position: 'top-right', autoClose: 4000 });
}
