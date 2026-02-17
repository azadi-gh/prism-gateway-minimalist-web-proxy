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
  if (!/^https?:\/\//i.test(trimmed)) {
    if (trimmed.includes('.') && !trimmed.includes(' ')) {
      return `https://${trimmed}`;
    }
    return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
  }
  return trimmed;
}
export function getProxyUrl(targetUrl: string): string {
  if (!targetUrl) return "";
  return `/api/proxy?url=${encodeURIComponent(normalizeUrl(targetUrl))}`;
}
export function extractTargetUrl(proxyUrl: string): string {
  try {
    const url = new URL(proxyUrl, window.location.origin);
    return url.searchParams.get('url') || proxyUrl;
  } catch {
    return proxyUrl;
  }
}
export function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
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
export function cleanTitle(title: string, url: string): string {
    if (!title || title === "undefined") return getDisplayDomain(url);
    return title.trim();
}