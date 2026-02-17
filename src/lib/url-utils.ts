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
  const trimmed = url.trim();
  if (!trimmed) return "";
  // Check if it's already a full URL with protocol
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      return new URL(trimmed).toString();
    } catch {
      return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
    }
  }
  // Check for domain-like patterns (e.g., "google.com", "sub.domain.org/path")
  const domainPattern = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}(:\d+)?(\/.*)?$/i;
  if (domainPattern.test(trimmed)) {
    return `https://${trimmed}`;
  }
  // Fallback to search
  return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
}
export function getProxyUrl(targetUrl: string): string {
  if (!targetUrl) return "";
  const normalized = targetUrl.trim();
  return `/api/proxy?url=${encodeURIComponent(normalized)}`;
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
  if (!title || title === "undefined" || title.length === 0) {
    return getDisplayDomain(url);
  }
  return title.trim();
}