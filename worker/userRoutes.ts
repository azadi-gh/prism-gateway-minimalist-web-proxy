import { Hono } from "hono";
import { Env } from './core-utils';
export function userRoutes(app: Hono<{ Bindings: Env }>) {
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
            // Prepare the rewriter
            const proxyBase = `${new URL(c.req.url).origin}/api/proxy?url=`;
            const rewriter = new HTMLRewriter()
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
            // Security header cleanup to allow iframe display and cross-origin content
            headers.delete('X-Frame-Options');
            headers.delete('Content-Security-Policy');
            headers.set('Access-Control-Allow-Origin', '*');
            return new Response(transformedResponse.body, {
                status: transformedResponse.status,
                headers
            });
        } catch (error) {
            console.error('[PROXY ERROR]', error);
            return c.json({ success: false, error: 'Failed to fetch the requested URL' }, 500);
        }
    });
    app.get('/api/test', (c) => c.json({ success: true, data: { name: 'Prism Gateway API' }}));
}