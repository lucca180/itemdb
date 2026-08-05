'use client';

import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import styles from '@components/ui/fast-modal.module.css';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export type FastModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  initialFocusRef?: RefObject<HTMLElement | null>;
  compensateScrollbar?: boolean;
  'aria-labelledby'?: string;
};

/** Lightweight body scroll lock; scrollbar padding only when the modal isn't fullscreen. */
function lockBodyScroll(compensateScrollbar: boolean) {
  const { body } = document;
  const previousOverflow = body.style.overflow;
  const previousPadding = body.style.paddingRight;
  // Read layout before writing overflow to avoid forced synchronous reflow.
  const scrollbarWidth = compensateScrollbar
    ? window.innerWidth - document.documentElement.clientWidth
    : 0;

  body.style.overflow = 'hidden';
  if (scrollbarWidth > 0) {
    body.style.paddingRight = `${scrollbarWidth}px`;
  }

  return () => {
    body.style.overflow = previousOverflow;
    body.style.paddingRight = previousPadding;
  };
}

export function FastModal(props: FastModalProps) {
  const {
    open,
    onClose,
    children,
    initialFocusRef,
    compensateScrollbar = true,
    'aria-labelledby': ariaLabelledby,
  } = props;

  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    return lockBodyScroll(compensateScrollbar);
  }, [open, compensateScrollbar]);

  useEffect(() => {
    if (!open) return;

    const frame = requestAnimationFrame(() => {
      (initialFocusRef?.current ?? contentRef.current)?.focus({ preventScroll: true });
    });

    return () => cancelAnimationFrame(frame);
  }, [open, initialFocusRef]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !contentRef.current) return;

      const focusables = contentRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusables.length === 0) {
        event.preventDefault();
        contentRef.current.focus();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || !contentRef.current.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !contentRef.current.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [open, onClose]);

  return createPortal(
    <div
      className={styles.root}
      data-state={open ? 'open' : 'closed'}
      aria-hidden={open ? undefined : true}
      inert={open ? undefined : true}
    >
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.positioner}>
        <div
          ref={contentRef}
          className={styles.content}
          role="dialog"
          aria-modal="true"
          aria-labelledby={ariaLabelledby}
          tabIndex={-1}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

function FastModalBody({ children }: { children: ReactNode }) {
  return <div className={styles.body}>{children}</div>;
}

function FastModalFooter({ children }: { children: ReactNode }) {
  return <div className={styles.footer}>{children}</div>;
}

FastModal.Body = FastModalBody;
FastModal.Footer = FastModalFooter;
