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
  // Strip common prefixes that are not valid in URLs but users often enter
  trimmed = trimmed.replace(/^(http:\/\/|https:\/\/)+/i, 'https://');
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = 'https://' + trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.hostname.includes('.') && !parsed.hostname.includes(' ')) {
      return parsed.toString();
    }
    return `https://www.google.com/search?q=${encodeURIComponent(url.trim())}`;
  } catch {
    return `https://www.google.com/search?q=${encodeURIComponent(url.trim())}`;
  }
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
    if (!title || title === "undefined" || title.length === 0) return getDisplayDomain(url);
    return title.trim();
}