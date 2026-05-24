'use client';

import { useCallback, useMemo, type ReactNode } from 'react';
import { toaster } from '@components/ui/toaster';

type ToastStatus = 'success' | 'error' | 'warning' | 'info' | 'loading';

type ToastOptions = {
  id: string;
  title?: ReactNode;
  description?: ReactNode;
  status?: ToastStatus;
  duration?: number | null;
  isClosable?: boolean;
};

type PromiseToastOptions = {
  loading?: Omit<ToastOptions, 'status'>;
  success?: Omit<ToastOptions, 'status'>;
  error?: Omit<ToastOptions, 'status'>;
};

let toastCounter = 0;

const createToastInstanceId = (id: string) => `${id}-${Date.now()}-${toastCounter++}`;

const normalizeOptions = (options: ToastOptions, id = options.id) => ({
  id,
  title: options.title,
  description: options.description,
  type: options.status ?? 'info',
  duration: options.duration === null ? undefined : options.duration,
  closable: options.isClosable,
});

export function useToast() {
  const create = useCallback(
    (options: ToastOptions) =>
      (toaster as any).create(normalizeOptions(options, createToastInstanceId(options.id))),
    []
  );
  const update = useCallback((id: string, options: ToastOptions) => {
    (toaster as any).update(id, normalizeOptions(options));
  }, []);
  const close = useCallback((id: string) => {
    (toaster as any).dismiss(id);
  }, []);
  const closeAll = useCallback(() => {
    (toaster as any).dismiss();
  }, []);
  const isActive = useCallback((id: string) => (toaster as any).isVisible(id), []);
  const promise = useCallback(async <T>(value: Promise<T>, options: PromiseToastOptions) => {
    return (toaster as any).promise(value, {
      loading: options.loading
        ? normalizeOptions({ ...options.loading, status: 'loading' })
        : undefined,
      success: options.success
        ? normalizeOptions({ ...options.success, status: 'success' })
        : undefined,
      error: options.error ? normalizeOptions({ ...options.error, status: 'error' }) : undefined,
    });
  }, []);

  return useMemo(
    () =>
      Object.assign(create, {
        close,
        closeAll,
        isActive,
        promise,
        update,
      }),
    [close, closeAll, create, isActive, promise, update]
  );
}
