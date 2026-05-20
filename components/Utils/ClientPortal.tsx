'use client';

import { Portal, type PortalProps } from '@chakra-ui/react';
import { type ReactNode, useSyncExternalStore } from 'react';

type ClientPortalProps = PortalProps & {
  children: ReactNode;
};

export default function ClientPortal({ children, ...props }: ClientPortalProps) {
  const hasMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!hasMounted) {
    return null;
  }

  return <Portal {...props}>{children}</Portal>;
}
