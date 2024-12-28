import { motion, useSpring, useTransform, useInView } from 'framer-motion';
import { useEffect, useRef } from 'react';

export function AnimatedNumber({ value }: { value: number }) {
  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) => Math.round(current).toLocaleString());
  const ref = useRef(null);
  const isInView = useInView(ref as any, { once: true });

  useEffect(() => {
    if (isInView) spring.set(value);
  }, [spring, value, isInView]);

  return <motion.span ref={ref}>{display}</motion.span>;
}
