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
const toastIdMap = new Map<string, string>();

const createToastInstanceId = (id: string) => `${id}-${Date.now()}-${toastCounter++}`;

const resolveToastId = (id: string) => toastIdMap.get(id) ?? id;

const normalizeOptions = (options: ToastOptions, id = options.id) => ({
  id,
  title: options.title,
  description: options.description,
  type: options.status ?? 'info',
  duration: options.duration === null ? undefined : options.duration,
  closable: options.isClosable,
});

export function useToast() {
  const create = useCallback((options: ToastOptions) => {
    const instanceId = createToastInstanceId(options.id);
    toastIdMap.set(options.id, instanceId);
    return (toaster as any).create(normalizeOptions(options, instanceId));
  }, []);
  const update = useCallback((id: string, options: ToastOptions) => {
    (toaster as any).update(resolveToastId(id), normalizeOptions(options, resolveToastId(id)));
  }, []);
  const close = useCallback((id: string) => {
    (toaster as any).dismiss(resolveToastId(id));
    toastIdMap.delete(id);
  }, []);
  const closeAll = useCallback(() => {
    (toaster as any).dismiss();
    toastIdMap.clear();
  }, []);
  const isActive = useCallback((id: string) => (toaster as any).isVisible(resolveToastId(id)), []);
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
