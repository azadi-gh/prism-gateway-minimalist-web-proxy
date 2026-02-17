import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Globe, Shield, Zap, History, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getDisplayDomain } from '@/lib/url-utils';
import type { HistoryItem, ApiResponse } from '@shared/types';
interface LandingProps {
  onNavigate: (url: string) => void;
}
export function Landing({ onNavigate }: LandingProps) {
  const [url, setUrl] = useState('');
  const [recentVisits, setRecentVisits] = useState<HistoryItem[]>([]);
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/history');
        const json = await res.json() as ApiResponse<HistoryItem[]>;
        if (json.success && json.data) {
          setRecentVisits(json.data);
        }
      } catch (e) {
        console.error("Failed to fetch history", e);
      }
    };
    fetchHistory();
  }, []);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onNavigate(url);
    }
  };
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-4xl mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-8 w-full"
      >
        <div className="space-y-4">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="inline-block px-4 py-1.5 mb-4 text-xs font-medium tracking-wider uppercase bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-100 dark:border-indigo-800"
          >
            Privacy Focused Web Gateway
          </motion.div>
          <h1 className="text-6xl md:text-8xl font-display font-black tracking-tight">
            <span className="text-gradient">Prism</span>
            <span className="text-foreground">.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-lg mx-auto text-pretty">
            Experience the web without borders. A minimalist, secure, and lightning-fast proxy gateway.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto w-full group">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-muted-foreground group-focus-within:text-indigo-500 transition-colors" />
            <Input
              type="text"
              placeholder="Enter URL or search the web..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full h-16 pl-12 pr-32 text-lg bg-background border-2 border-input focus:border-indigo-500 rounded-2xl shadow-soft transition-all"
            />
            <Button
              type="submit"
              className="absolute right-2 h-12 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all"
            >
              Go
            </Button>
          </div>
        </form>
        {/* Recent Visits */}
        {recentVisits.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="w-full max-w-2xl mx-auto space-y-4"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground px-1">
              <Clock className="w-4 h-4" />
              <span>Recent Visits</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide no-scrollbar">
              {recentVisits.map((visit) => (
                <button
                  key={visit.id}
                  onClick={() => onNavigate(visit.url)}
                  className="flex-shrink-0 glass-card p-3 rounded-xl flex items-center gap-3 hover:scale-[1.02] transition-transform text-left min-w-[160px]"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center overflow-hidden">
                    {visit.faviconUrl ? (
                      <img src={visit.faviconUrl} alt="" className="w-5 h-5" onError={(e) => e.currentTarget.style.display = 'none'} />
                    ) : (
                      <Globe className="w-4 h-4 text-indigo-500" />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold truncate text-foreground">{getDisplayDomain(visit.url)}</p>
                    <p className="text-[10px] text-muted-foreground truncate opacity-70">
                      {new Date(visit.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
          {[
            { icon: Shield, title: "Private", desc: "No tracking, no logs" },
            { icon: Globe, title: "Unrestricted", desc: "Access global content" },
            { icon: Zap, title: "Fast", desc: "Optimized delivery" }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="p-6 rounded-2xl bg-secondary/50 border border-border/50 backdrop-blur-sm"
            >
              <feature.icon className="w-6 h-6 mb-3 text-indigo-500 mx-auto" />
              <h3 className="font-semibold text-foreground">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}