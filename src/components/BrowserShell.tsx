import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, RotateCw, ShieldCheck, Home,
  ExternalLink, Star, Copy, MoreVertical
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getProxyUrl, normalizeUrl, getFaviconUrl, cleanTitle } from '@/lib/url-utils';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import type { Bookmark, ApiResponse } from '@shared/types';
interface BrowserShellProps {
  initialUrl: string;
  onHome: () => void;
}
export function BrowserShell({ initialUrl, onHome }: BrowserShellProps) {
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [displayUrl, setDisplayUrl] = useState(initialUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [navHistory, setNavHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // Consolidated logic for recording history and checking bookmark status
  useEffect(() => {
    if (!currentUrl) return;
    const recordVisit = async () => {
      try {
        await fetch('/api/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: uuidv4(),
            url: currentUrl,
            title: new URL(currentUrl).hostname,
            timestamp: Date.now(),
            faviconUrl: getFaviconUrl(currentUrl)
          }),
        });
        const bRes = await fetch('/api/bookmarks');
        const bJson = await bRes.json() as ApiResponse<Bookmark[]>;
        if (bJson.success && bJson.data) {
          setIsBookmarked(bJson.data.some(b => b.url === currentUrl));
        }
      } catch (e) {
        // Silently handle background metadata failures
      }
    };
    recordVisit();
  }, [currentUrl]);
  // Initial setup
  useEffect(() => {
    if (initialUrl) {
      const normalized = normalizeUrl(initialUrl);
      setCurrentUrl(normalized);
      setDisplayUrl(normalized);
      setNavHistory([normalized]);
      setHistoryIndex(0);
    }
  }, [initialUrl]);
  // Listen for iframe navigation events
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PRISM_NAV') {
        const newUrl = event.data.url;
        // Only update if the URL actually changed to prevent loops
        if (newUrl && newUrl !== currentUrl) {
          setCurrentUrl(newUrl);
          setDisplayUrl(newUrl);
          const newHistory = navHistory.slice(0, historyIndex + 1);
          newHistory.push(newUrl);
          setNavHistory(newHistory);
          setHistoryIndex(newHistory.length - 1);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [currentUrl, navHistory, historyIndex]);
  const toggleBookmark = async () => {
    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: uuidv4(),
          url: currentUrl,
          title: cleanTitle("", currentUrl),
          faviconUrl: getFaviconUrl(currentUrl),
          createdAt: Date.now()
        }),
      });
      const json = await res.json() as ApiResponse<Bookmark[]>;
      if (json.success) {
        setIsBookmarked(!isBookmarked);
        toast.success(isBookmarked ? "Removed from bookmarks" : "Added to bookmarks");
      }
    } catch (e) {
      toast.error("Failed to update bookmarks");
    }
  };
  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeUrl(displayUrl);
    // Always trigger loading state
    setIsLoading(true);
    if (normalized === currentUrl) {
      reload();
    } else {
      setCurrentUrl(normalized);
      const newHistory = navHistory.slice(0, historyIndex + 1);
      newHistory.push(normalized);
      setNavHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  };
  const goBack = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const prevUrl = navHistory[prevIndex];
      setHistoryIndex(prevIndex);
      setCurrentUrl(prevUrl);
      setDisplayUrl(prevUrl);
      setIsLoading(true);
    }
  };
  const goForward = () => {
    if (historyIndex < navHistory.length - 1) {
      const nextIndex = historyIndex + 1;
      const nextUrl = navHistory[nextIndex];
      setHistoryIndex(nextIndex);
      setCurrentUrl(nextUrl);
      setDisplayUrl(nextUrl);
      setIsLoading(true);
    }
  };
  const reload = () => {
    if (iframeRef.current) {
      setIsLoading(true);
      const currentSrc = iframeRef.current.src;
      iframeRef.current.src = '';
      setTimeout(() => { 
        if(iframeRef.current) iframeRef.current.src = currentSrc; 
      }, 50);
    }
  };
  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden">
      <header className="relative h-16 flex items-center px-4 gap-4 border-b bg-background/80 backdrop-blur-md z-30">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onHome} className="hover:bg-accent rounded-full h-9 w-9">
            <Home className="w-4 h-4" />
          </Button>
          <div className="flex gap-0.5 ml-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={goBack} 
              disabled={historyIndex <= 0} 
              className="w-8 h-8 rounded-full"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={goForward} 
              disabled={historyIndex >= navHistory.length - 1} 
              className="w-8 h-8 rounded-full"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={reload} 
              className="w-8 h-8 rounded-full"
            >
              <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        <form onSubmit={handleNavigate} className="flex-grow max-w-4xl mx-auto">
          <div className="relative flex items-center group">
            <div className="absolute left-3 flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" className="hover:opacity-80 transition-opacity">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 text-sm p-4 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-600">
                    <ShieldCheck className="w-4 h-4" /> Secure Connection
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Prism Gateway encrypts your request and masks your origin. The target site sees our server, not you.
                  </p>
                </PopoverContent>
              </Popover>
              <img src={getFaviconUrl(currentUrl)} className="w-4 h-4 rounded-sm" alt="" onError={(e) => (e.currentTarget.style.display = 'none')} />
            </div>
            <Input
              value={displayUrl}
              onChange={(e) => setDisplayUrl(e.target.value)}
              className="w-full h-10 pl-14 pr-24 bg-secondary/60 border-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 rounded-xl text-sm font-medium"
              spellCheck={false}
              autoComplete="off"
            />
            <div className="absolute right-2 flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={toggleBookmark}
                className={`h-7 w-7 rounded-lg transition-colors ${isBookmarked ? 'text-yellow-500 hover:text-yellow-600' : 'text-muted-foreground'}`}
              >
                <Star className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground">
                    <MoreVertical className="w-3.5 h-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(currentUrl); toast.success("URL copied"); }}>
                    <Copy className="w-4 h-4 mr-2" /> Copy URL
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.open(currentUrl, '_blank')}>
                    <ExternalLink className="w-4 h-4 mr-2" /> Open Directly
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </form>
        <div className="w-32 flex justify-end gap-2 items-center">
          <div className="h-8 px-3 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Live</span>
          </div>
        </div>
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute bottom-0 left-0 h-[3px] w-full bg-gradient-to-r from-indigo-500 to-purple-500 origin-left"
            />
          )}
        </AnimatePresence>
      </header>
      <main className="flex-grow relative bg-white">
        <iframe
          ref={iframeRef}
          key={currentUrl}
          src={getProxyUrl(currentUrl)}
          onLoad={() => setIsLoading(false)}
          className="w-full h-full border-none bg-white"
          title="Prism Proxy Viewport"
          sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
        />
      </main>
    </div>
  );
}