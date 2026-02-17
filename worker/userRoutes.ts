import { Hono } from "hono";
import { Env } from './core-utils';
import type { HistoryItem, ApiResponse } from '@shared/types';
export function userRoutes(app: Hono<{ Bindings: Env }>) {
    app.get('/api/history', async (c) => {
        const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const history = await stub.getHistory();
        return c.json({ success: true, data: history } satisfies ApiResponse<HistoryItem[]>);
    });
    app.post('/api/history', async (c) => {
        const item = await c.req.json() as HistoryItem;
        const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const updated = await stub.addHistoryItem(item);
        return c.json({ success: true, data: updated } satisfies ApiResponse<HistoryItem[]>);
    });
    app.get('/api/proxy', async (c) => {
        const targetUrl = c.req.query('url');
        if (!targetUrl) {
            return c.json({ success: false, error: 'URL parameter is required' }, 400);
        }
        try {
            const url = new URL(targetUrl);
            const response = await fetch(url.toString(), {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                }
            });
            const proxyBase = `${new URL(c.req.url).origin}/api/proxy?url=`;
            const rewriter = new HTMLRewriter()
                .on('a', {
                    element(el) {
                        const href = el.getAttribute('href');
                        if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
                            try {
                                const absolute = new URL(href, url.origin).toString();
                                el.setAttribute('href', proxyBase + encodeURIComponent(absolute));
                            } catch (e) { /* Invalid URL segments ignored */ }
                        }
                    }
                })
                .on('img', {
                    element(el) {
                        const src = el.getAttribute('src');
                        const srcset = el.getAttribute('srcset');
                        if (src) {
                            try {
                                const absolute = new URL(src, url.origin).toString();
                                el.setAttribute('src', proxyBase + encodeURIComponent(absolute));
                            } catch (e) { /* Invalid URL segments ignored */ }
                        }
                        if (srcset) {
                            // Basic srcset rewriting: replace URLs between commas
                            const parts = srcset.split(',').map(part => {
                                const [u, size] = part.trim().split(/\s+/);
                                try {
                                    const abs = new URL(u, url.origin).toString();
                                    return `${proxyBase}${encodeURIComponent(abs)}${size ? ' ' + size : ''}`;
                                } catch { return part; }
                            });
                            el.setAttribute('srcset', parts.join(', '));
                        }
                    }
                })
                .on('link', {
                    element(el) {
                        const href = el.getAttribute('href');
                        if (href) {
                            try {
                                const absolute = new URL(href, url.origin).toString();
                                el.setAttribute('href', proxyBase + encodeURIComponent(absolute));
                            } catch (e) { /* Invalid URL segments ignored */ }
                        }
                    }
                })
                .on('script', {
                    element(el) {
                        const src = el.getAttribute('src');
                        if (src) {
                            try {
                                const absolute = new URL(src, url.origin).toString();
                                el.setAttribute('src', proxyBase + encodeURIComponent(absolute));
                            } catch (e) { /* Invalid URL segments ignored */ }
                        }
                    }
                })
                .on('video', {
                    element(el) {
                        const poster = el.getAttribute('poster');
                        if (poster) {
                            try {
                                const absolute = new URL(poster, url.origin).toString();
                                el.setAttribute('poster', proxyBase + encodeURIComponent(absolute));
                            } catch (e) { /* Invalid URL segments ignored */ }
                        }
                    }
                });
            const transformedResponse = rewriter.transform(response);
            const headers = new Headers(transformedResponse.headers);
            // Refined security header cleanup
            headers.delete('X-Frame-Options');
            headers.delete('Content-Security-Policy');
            headers.delete('Content-Security-Policy-Report-Only');
            headers.delete('X-Content-Type-Options');
            headers.set('Access-Control-Allow-Origin', '*');
            // Handle CSS @import rewriting if content-type is CSS
            const contentType = headers.get('Content-Type') || '';
            if (contentType.includes('text/css')) {
                let cssText = await transformedResponse.text();
                cssText = cssText.replace(/@import\s+url\((['"]?)(.*?)\1\)/g, (match, quote, subUrl) => {
                    try {
                        const abs = new URL(subUrl, url.origin).toString();
                        return `@import url(${quote}${proxyBase}${encodeURIComponent(abs)}${quote})`;
                    } catch { return match; }
                });
                return new Response(cssText, { status: 200, headers });
            }
            return new Response(transformedResponse.body, {
                status: transformedResponse.status,
                headers
            });
        } catch (error) {
            console.error('[PROXY ERROR]', error);
            return c.json({ success: false, error: 'Failed to fetch the requested URL' }, 500);
        }
    });
}