import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Globe, Shield, Zap, History, Clock, Star, Trash2, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { getDisplayDomain } from '@/lib/url-utils';
import { toast } from 'sonner';
import type { HistoryItem, Bookmark, ApiResponse } from '@shared/types';
interface LandingProps {
  onNavigate: (url: string) => void;
}
export function Landing({ onNavigate }: LandingProps) {
  const [url, setUrl] = useState('');
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [activeTab, setActiveTab] = useState('bookmarks');
  const fetchData = async () => {
    try {
      const [hRes, bRes] = await Promise.all([fetch('/api/history'), fetch('/api/bookmarks')]);
      const hJson = await hRes.json() as ApiResponse<HistoryItem[]>;
      const bJson = await bRes.json() as ApiResponse<Bookmark[]>;
      if (hJson.success) setHistoryItems(hJson.data || []);
      if (bJson.success) setBookmarks(bJson.data || []);
      if (bJson.data?.length === 0 && hJson.data?.length !== 0) setActiveTab('history');
    } catch (e) {}
  };
  useEffect(() => { fetchData(); }, []);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) onNavigate(url);
  };
  const clearHistory = async () => {
    try {
      await fetch('/api/history', { method: 'DELETE' });
      setHistoryItems([]);
      toast.success("History cleared");
    } catch (e) { toast.error("Failed to clear history"); }
  };
  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-12 w-full max-w-4xl">
        <div className="space-y-4">
          <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 4 }} className="inline-block px-4 py-1.5 mb-2 text-xs font-bold tracking-[0.2em] uppercase bg-primary/10 text-primary rounded-full border border-primary/20">
            Prism Gateway v2.0
          </motion.div>
          <h1 className="text-7xl md:text-9xl font-display font-black tracking-tighter">
            <span className="text-gradient">Prism</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground/80 max-w-xl mx-auto font-medium leading-relaxed">
            The minimalist gateway to the decentralized web. Secure, anonymous, and borderless.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto w-full group">
          <div className="relative flex items-center p-1.5 bg-background border-2 border-input group-focus-within:border-indigo-500 rounded-2xl shadow-xl transition-all">
            <Search className="ml-4 w-5 h-5 text-muted-foreground group-focus-within:text-indigo-500" />
            <Input
              type="text"
              placeholder="Enter URL or search freely..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-grow h-14 border-none bg-transparent text-lg focus-visible:ring-0"
            />
            <Button type="submit" className="h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-200 dark:shadow-none">
              Launch <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </form>
        <div className="w-full max-w-3xl mx-auto space-y-6 pt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between mb-4 px-2">
              <TabsList className="bg-secondary/50 p-1 rounded-xl border border-border/50">
                <TabsTrigger value="bookmarks" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Star className="w-3.5 h-3.5 mr-2" /> Bookmarks
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Clock className="w-3.5 h-3.5 mr-2" /> History
                </TabsTrigger>
              </TabsList>
              {activeTab === 'history' && historyItems.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" /> Clear All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear History?</AlertDialogTitle>
                      <AlertDialogDescription>This will permanently delete all your recent visits.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={clearHistory} className="bg-destructive text-destructive-foreground">Clear Everything</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            <TabsContent value="bookmarks" className="mt-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <AnimatePresence mode="popLayout">
                  {bookmarks.length > 0 ? bookmarks.map((b) => (
                    <motion.button key={b.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} onClick={() => onNavigate(b.url)}
                      className="group flex flex-col items-center p-4 rounded-2xl glass-card hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all text-center border-dashed border-2 border-border/40 hover:border-indigo-500/30"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 shadow-md flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <img src={b.faviconUrl} className="w-6 h-6" alt="" onError={(e) => (e.currentTarget.src = 'https://www.google.com/favicon.ico')} />
                      </div>
                      <span className="text-xs font-bold truncate w-full text-foreground">{getDisplayDomain(b.url)}</span>
                    </motion.button>
                  )) : (
                    <div className="col-span-full py-12 flex flex-col items-center text-muted-foreground/40 italic">
                      <Star className="w-12 h-12 mb-2 opacity-10" />
                      <p className="text-sm">No bookmarks yet</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </TabsContent>
            <TabsContent value="history" className="mt-0 space-y-2">
              {historyItems.length > 0 ? historyItems.map((h) => (
                <button key={h.id} onClick={() => onNavigate(h.url)} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 transition-colors group">
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shrink-0 border">
                      <img src={h.faviconUrl} className="w-4 h-4" alt="" />
                    </div>
                    <div className="text-left overflow-hidden">
                      <p className="text-sm font-bold truncate text-foreground group-hover:text-indigo-600 transition-colors">{h.title}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{getDisplayDomain(h.url)}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground px-4 uppercase tracking-tighter shrink-0">{new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </button>
              )) : (
                <div className="py-12 flex flex-col items-center text-muted-foreground/40 italic">
                  <History className="w-12 h-12 mb-2 opacity-10" />
                  <p className="text-sm">History is clear</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
          {[
            { icon: Shield, title: "Anonymity", desc: "No cookies, no fingerprinting" },
            { icon: Globe, title: "Borderless", desc: "Access the entire internet" },
            { icon: Zap, title: "Turbo", desc: "Distributed proxy architecture" }
          ].map((f, i) => (
            <div key={i} className="p-8 rounded-3xl bg-secondary/30 border border-border/40 backdrop-blur-sm hover:border-indigo-500/20 transition-colors">
              <f.icon className="w-8 h-8 mb-4 text-indigo-500 mx-auto" />
              <h3 className="font-bold text-foreground text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground/80 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}