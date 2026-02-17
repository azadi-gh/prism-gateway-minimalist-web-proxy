import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Landing } from '@/components/Landing';
import { BrowserShell } from '@/components/BrowserShell';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Toaster } from '@/components/ui/sonner';
type ViewMode = 'landing' | 'browser';
export function HomePage() {
  const [mode, setMode] = useState<ViewMode>('landing');
  const [activeUrl, setActiveUrl] = useState('');
  const handleNavigate = (url: string) => {
    setActiveUrl(url);
    setMode('browser');
  };
  const handleGoHome = () => {
    setMode('landing');
    setActiveUrl('');
  };
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
      {/* Mesh Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />
      </div>
      <AnimatePresence mode="wait">
        {mode === 'landing' ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="relative z-10"
          >
            <ThemeToggle className="fixed top-6 right-6" />
            <Landing onNavigate={handleNavigate} />
            <footer className="w-full text-center py-12 text-[10px] text-muted-foreground/40 font-bold tracking-[0.4em] uppercase">
              PRISM GATEWAY &bull; SECURE NODES ACTIVE &bull; EST. 2024
            </footer>
          </motion.div>
        ) : (
          <motion.div
            key="browser"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="h-screen w-full relative z-20"
          >
            <BrowserShell initialUrl={activeUrl} onHome={handleGoHome} />
          </motion.div>
        )}
      </AnimatePresence>
      <Toaster position="bottom-right" richColors />
    </div>
  );
}