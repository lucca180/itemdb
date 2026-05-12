import { useEffect } from 'react';

type KeyboardShortcutOptions = {
  enabled?: boolean;
  preventDefault?: boolean;
  ignoreInputTargets?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
};

const defaultOptions = {
  enabled: true,
  preventDefault: true,
  ignoreInputTargets: true,
};

export const isKeyboardShortcutInputTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;

  const tagName = target.tagName.toLowerCase();
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    target.isContentEditable
  );
};

export const useKeyboardShortcut = (
  keys: string | string[],
  callback: (event: KeyboardEvent) => void,
  options: KeyboardShortcutOptions = {}
) => {
  useEffect(() => {
    const shortcutOptions = { ...defaultOptions, ...options };
    const shortcutKeys = Array.isArray(keys) ? keys : [keys];

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!shortcutOptions.enabled) return;
      if (shortcutOptions.ignoreInputTargets && isKeyboardShortcutInputTarget(event.target)) return;

      const isTargetKey = shortcutKeys.some((key) => key.toLowerCase() === event.key.toLowerCase());

      if (!isTargetKey) return;
      if (shortcutOptions.ctrlKey !== undefined && event.ctrlKey !== shortcutOptions.ctrlKey)
        return;
      if (shortcutOptions.metaKey !== undefined && event.metaKey !== shortcutOptions.metaKey)
        return;
      if (shortcutOptions.altKey !== undefined && event.altKey !== shortcutOptions.altKey) return;
      if (shortcutOptions.shiftKey !== undefined && event.shiftKey !== shortcutOptions.shiftKey)
        return;

      if (shortcutOptions.preventDefault) event.preventDefault();
      callback(event);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    options.altKey,
    options.ctrlKey,
    options.enabled,
    options.ignoreInputTargets,
    options.metaKey,
    options.preventDefault,
    options.shiftKey,
    keys,
    callback,
  ]);
};
