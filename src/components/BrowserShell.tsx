import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, RotateCw, ShieldCheck, Home, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getProxyUrl, normalizeUrl, getFaviconUrl } from '@/lib/url-utils';
import { v4 as uuidv4 } from 'uuid';
interface BrowserShellProps {
  initialUrl: string;
  onHome: () => void;
}
export function BrowserShell({ initialUrl, onHome }: BrowserShellProps) {
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [displayUrl, setDisplayUrl] = useState(initialUrl);
  const [isLoading, setIsLoading] = useState(false);
  // Navigation stack
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    if (initialUrl) {
      const normalized = normalizeUrl(initialUrl);
      setCurrentUrl(normalized);
      setDisplayUrl(normalized);
      setHistory([normalized]);
      setHistoryIndex(0);
      recordHistory(normalized);
    }
  }, [initialUrl]);
  const recordHistory = async (url: string) => {
    try {
      const domain = new URL(url).hostname;
      await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: uuidv4(),
          url: url,
          title: domain,
          timestamp: Date.now(),
          faviconUrl: getFaviconUrl(url)
        }),
      });
    } catch (e) {
      console.error("Failed to record history", e);
    }
  };
  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeUrl(displayUrl);
    if (normalized !== currentUrl) {
      setIsLoading(true);
      setCurrentUrl(normalized);
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(normalized);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      recordHistory(normalized);
    }
  };
  const goBack = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setCurrentUrl(prev);
      setDisplayUrl(prev);
      setIsLoading(true);
    }
  };
  const goForward = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setCurrentUrl(next);
      setDisplayUrl(next);
      setIsLoading(true);
    }
  };
  const reload = () => {
    if (iframeRef.current) {
      setIsLoading(true);
      const currentSrc = iframeRef.current.src;
      iframeRef.current.src = '';
      iframeRef.current.src = currentSrc;
    }
  };
  const handleIframeLoad = () => {
    setIsLoading(false);
  };
  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden">
      {/* Browser Header */}
      <header className="relative h-16 flex items-center px-4 gap-4 border-b bg-background/80 backdrop-blur-md z-30">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onHome} className="hover:bg-accent">
            <Home className="w-4 h-4" />
          </Button>
          <div className="flex gap-0.5 ml-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={goBack} 
              disabled={historyIndex <= 0}
              className="w-8 h-8"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={goForward} 
              disabled={historyIndex >= history.length - 1}
              className="w-8 h-8"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={reload} className="w-8 h-8">
              <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        <form onSubmit={handleNavigate} className="flex-grow max-w-3xl mx-auto">
          <div className="relative flex items-center group">
            <div className="absolute left-3 flex items-center pointer-events-none gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <img 
                src={getFaviconUrl(currentUrl)} 
                className="w-4 h-4 rounded-sm" 
                alt="" 
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            </div>
            <Input
              value={displayUrl}
              onChange={(e) => setDisplayUrl(e.target.value)}
              className="w-full h-10 pl-14 pr-10 bg-secondary/80 border-none focus-visible:ring-1 focus-visible:ring-indigo-500 rounded-full text-sm"
              spellCheck={false}
            />
            <div className="absolute right-3">
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
          </div>
        </form>
        <div className="w-24 flex justify-end">
          <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
            P
          </div>
        </div>
        {/* Loading Progress Bar */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute bottom-0 left-0 h-[2px] w-full bg-indigo-500 origin-left"
            />
          )}
        </AnimatePresence>
      </header>
      {/* Viewport */}
      <main className="flex-grow relative bg-white">
        <motion.iframe
          ref={iframeRef}
          key={currentUrl}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          src={getProxyUrl(currentUrl)}
          onLoad={handleIframeLoad}
          className="w-full h-full border-none"
          title="Prism Proxy Viewport"
        />
      </main>
    </div>
  );
}