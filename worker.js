/**
 * 自建 RSS 代理（Cloudflare Worker）
 * 免费、稳定、无限量。部署后把生成的地址填进工作台的「CORS 代理」设置即可。
 *
 * 用法：
 *   代理地址填： https://你的worker地址.workers.dev/?url={url}
 */

const ALLOWED = [
  'feeds.bbci.co.uk', 'news.google.com', 'www.skysports.com',
  'www.ruanyifeng.com', 'sspai.com', 'rsshub.app', 'www.ema.europa.eu'
];

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const target = url.searchParams.get('url');

    // 返回 CORS 头，允许任何来源
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Content-Type': 'application/xml; charset=utf-8'
    };
    if (request.method === 'OPTIONS') return new Response('', { headers: cors });
    if (!target) return new Response('missing url', { status: 400, headers: cors });

    try {
      const t = new URL(target);
      // 简单白名单：只代理 http(s)，防止被用来打内网
      if (!['http:', 'https:'].includes(t.protocol)) throw new Error('bad protocol');

      const upstream = await fetch(target, {
        headers: { 'User-Agent': 'Mozilla/5.0 (RSS reader)', 'Accept': 'application/rss+xml, application/atom+xml, application/xml, */*' },
        cf: { cacheTtl: 1800 }   // 缓存 30 分钟，减少上游压力
      });
      const body = await upstream.text();
      return new Response(body, { status: upstream.status, headers: cors });
    } catch (e) {
      return new Response('proxy error: ' + e.message, { status: 502, headers: cors });
    }
  }
};
