interface Env {
  ASSETS: Fetcher;
}

const hasFileExtension = (path: string) => /\.[a-zA-Z0-9]+$/.test(path);

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const assetResponse = await env.ASSETS.fetch(request);

    const shouldServeSpaFallback =
      assetResponse.status === 404 &&
      request.method === 'GET' &&
      !hasFileExtension(url.pathname);

    if (!shouldServeSpaFallback) {
      return assetResponse;
    }

    const indexRequest = new Request(new URL('/index.html', url).toString(), request);
    const indexResponse = await env.ASSETS.fetch(indexRequest);

    // Ensure HTML isn't cached aggressively by end-users
    const headers = new Headers(indexResponse.headers);
    headers.set('cache-control', 'no-cache, no-store, must-revalidate');

    return new Response(indexResponse.body, {
      status: indexResponse.status,
      statusText: indexResponse.statusText,
      headers,
    });
  },
};
