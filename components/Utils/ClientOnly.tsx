/* eslint-disable react-you-might-not-need-an-effect/you-might-not-need-an-effect */
import { useState, useEffect } from 'react';

function ClientOnly({ children, ...delegated }: any) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  return <div {...delegated}>{children}</div>;
}

export default ClientOnly;
