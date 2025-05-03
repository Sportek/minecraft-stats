"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";

export function ModeToggle() {
  const { setTheme, theme } = useTheme();
  const isLight = theme === "light";

  return (
    <motion.button
      onClick={() => setTheme(isLight ? "dark" : "light")}
      whileHover={{ rotate: isLight ? -15 : 15, scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Toggle theme"
      className="p-2 text-zinc-900 dark:text-white focus:outline-none"
    >
      <motion.span
        key={isLight ? "moon" : "sun"}
        initial={{ opacity: 0, rotate: isLight ? -90 : 90, scale: 0.8 }}
        animate={{ opacity: 1, rotate: 0, scale: 1 }}
        exit={{ opacity: 0, rotate: isLight ? 90 : -90, scale: 0.8 }}
        transition={{ duration: 0.3 }}
      >
        {isLight ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
      </motion.span>
    </motion.button>
  );
}
