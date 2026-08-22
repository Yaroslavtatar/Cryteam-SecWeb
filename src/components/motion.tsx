"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

// Лёгкие переиспользуемые обёртки для «плавного» появления блоков.

export function FadeIn({
  delay = 0,
  y = 16,
  className,
  children,
  ...props
}: HTMLMotionProps<"div"> & { delay?: number; y?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
