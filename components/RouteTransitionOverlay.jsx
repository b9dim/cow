"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

export default function RouteTransitionOverlay() {
  const pathname = usePathname();
  const [key, setKey] = useState(0);

  useEffect(() => {
    setKey((k) => k + 1);
  }, [pathname]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={key}
        className="fixed inset-0 z-20 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.6), rgba(0,0,0,0.2))" }}
      />
    </AnimatePresence>
  );
}


