import { Hono } from "hono";
import { Env } from './core-utils';
import type { HistoryItem, Bookmark, ApiResponse } from '@shared/types';
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
    app.delete('/api/history', async (c) => {
        const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        await stub.clearHistory();
        return c.json({ success: true } satisfies ApiResponse);
    });
    app.get('/api/bookmarks', async (c) => {
        const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const bookmarks = await stub.getBookmarks();
        return c.json({ success: true, data: bookmarks } satisfies ApiResponse<Bookmark[]>);
    });
    app.post('/api/bookmarks', async (c) => {
        const item = await c.req.json() as Bookmark;
        const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const updated = await stub.toggleBookmark(item);
        return c.json({ success: true, data: updated } satisfies ApiResponse<Bookmark[]>);
    });
    app.get('/api/proxy', async (c) => {
        const targetUrl = c.req.query('url');
        if (!targetUrl) return c.json({ success: false, error: 'URL parameter is required' }, 400);
        try {
            const url = new URL(targetUrl);
            const clientHeaders = new Headers(c.req.header());
            // Filter headers to pass to target
            const headersToSend = new Headers();
            const allowedHeaders = ['user-agent', 'accept', 'accept-language', 'cookie', 'referer'];
            allowedHeaders.forEach(h => {
                const val = clientHeaders.get(h);
                if (val) headersToSend.set(h, val);
            });
            const response = await fetch(url.toString(), { headers: headersToSend });
            const proxyBase = `${new URL(c.req.url).origin}/api/proxy?url=`;
            // Script for navigation sync
            const injectionScript = `
                <script>
                    (function() {
                        const targetUrl = new URL(window.location.href).searchParams.get('url');
                        if (window.parent !== window) {
                            window.parent.postMessage({ type: 'PRISM_NAV', url: targetUrl, title: document.title }, '*');
                        }
                        // Intercept clicks for internal links that might not be rewritten
                        document.addEventListener('click', e => {
                            const link = e.target.closest('a');
                            if (link && link.href && !link.href.startsWith('mailto:') && !link.href.startsWith('tel:')) {
                                // If it's not already proxied, we might want to handle it, 
                                // but HTMLRewriter usually catches these.
                            }
                        }, true);
                    })();
                </script>
            `;
            const rewriter = new HTMLRewriter()
                .on('head', {
                    element(el) { el.append(injectionScript, { html: true }); }
                })
                .on('a', {
                    element(el) {
                        const href = el.getAttribute('href');
                        if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
                            try {
                                const absolute = new URL(href, url.origin).toString();
                                el.setAttribute('href', proxyBase + encodeURIComponent(absolute));
                            } catch (e) {}
                        }
                    }
                })
                .on('img', {
                    element(el) {
                        const src = el.getAttribute('src');
                        if (src) {
                            try {
                                const absolute = new URL(src, url.origin).toString();
                                el.setAttribute('src', proxyBase + encodeURIComponent(absolute));
                            } catch (e) {}
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
                            } catch (e) {}
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
                            } catch (e) {}
                        }
                    }
                });
            const transformedResponse = rewriter.transform(response);
            const headers = new Headers(transformedResponse.headers);
            headers.delete('X-Frame-Options');
            headers.delete('Content-Security-Policy');
            headers.set('Access-Control-Allow-Origin', '*');
            // Set-Cookie handling: map to proxy domain
            const setCookie = response.headers.get('set-cookie');
            if (setCookie) {
                headers.set('Set-Cookie', setCookie); 
            }
            return new Response(transformedResponse.body, {
                status: transformedResponse.status,
                headers
            });
        } catch (error) {
            return c.json({ success: false, error: 'Failed to fetch the requested URL' }, 500);
        }
    });
}