import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, RotateCw, ShieldCheck, Home, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getProxyUrl, normalizeUrl } from '@/lib/url-utils';
interface BrowserShellProps {
  initialUrl: string;
  onHome: () => void;
}
export function BrowserShell({ initialUrl, onHome }: BrowserShellProps) {
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [displayUrl, setDisplayUrl] = useState(initialUrl);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeUrl(displayUrl);
    setCurrentUrl(normalized);
  };
  const reload = () => {
    if (iframeRef.current) {
      const currentSrc = iframeRef.current.src;
      iframeRef.current.src = '';
      iframeRef.current.src = currentSrc;
    }
  };
  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden">
      {/* Browser Header */}
      <header className="h-16 flex items-center px-4 gap-4 border-b bg-background/80 backdrop-blur-md z-30">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onHome} className="hover:bg-accent">
            <Home className="w-4 h-4" />
          </Button>
          <div className="flex gap-0.5 ml-2">
            <Button variant="ghost" size="icon" className="w-8 h-8 opacity-50"><ArrowLeft className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" className="w-8 h-8 opacity-50"><ArrowRight className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" onClick={reload} className="w-8 h-8"><RotateCw className="w-4 h-4" /></Button>
          </div>
        </div>
        <form onSubmit={handleNavigate} className="flex-grow max-w-3xl mx-auto">
          <div className="relative flex items-center group">
            <div className="absolute left-3 flex items-center pointer-events-none">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <Input
              value={displayUrl}
              onChange={(e) => setDisplayUrl(e.target.value)}
              className="w-full h-10 pl-10 pr-10 bg-secondary/80 border-none focus-visible:ring-1 focus-visible:ring-indigo-500 rounded-full text-sm"
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
          className="w-full h-full border-none"
          title="Prism Proxy Viewport"
        />
      </main>
    </div>
  );
}