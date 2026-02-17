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
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <AnimatePresence mode="wait">
        {mode === 'landing' ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.4 }}
            className="relative"
          >
            <ThemeToggle className="fixed top-6 right-6" />
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(99,102,241,0.1),transparent)] pointer-events-none" />
            <Landing onNavigate={handleNavigate} />
            <footer className="fixed bottom-8 w-full text-center text-xs text-muted-foreground/60 font-medium">
              &copy; {new Date().getFullYear()} PRISM GATEWAY &bull; SECURE WEB ACCESS
            </footer>
          </motion.div>
        ) : (
          <motion.div
            key="browser"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-screen w-full"
          >
            <BrowserShell initialUrl={activeUrl} onHome={handleGoHome} />
          </motion.div>
        )}
      </AnimatePresence>
      <Toaster position="top-center" richColors />
    </div>
  );
}