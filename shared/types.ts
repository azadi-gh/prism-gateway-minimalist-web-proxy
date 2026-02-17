export interface DemoItem {
  id: string;
  name: string;
  value: number;
}
export interface HistoryItem {
  id: string;
  url: string;
  title: string;
  timestamp: number;
  faviconUrl?: string;
}
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}