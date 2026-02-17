/**
 * Utility functions for URL validation and normalization in Prism Gateway
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(normalizeUrl(url));
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
export function normalizeUrl(url: string): string {
  let trimmed = url.trim();
  if (!trimmed) return "";
  // If it doesn't start with a protocol, assume https
  if (!/^https?:\/\//i.test(trimmed)) {
    // Check if it's a domain-like string
    if (trimmed.includes('.') && !trimmed.includes(' ')) {
      return `https://${trimmed}`;
    }
    // Otherwise it's likely a search query
    return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
  }
  return trimmed;
}
export function getProxyUrl(targetUrl: string): string {
  if (!targetUrl) return "";
  return `/api/proxy?url=${encodeURIComponent(normalizeUrl(targetUrl))}`;
}
export function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).hostname;
    // Using a proxied version of Google's Favicon API
    const googleFavicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    return getProxyUrl(googleFavicon);
  } catch {
    return "";
  }
}
export function getDisplayDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}