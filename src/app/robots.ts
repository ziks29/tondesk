import type { MetadataRoute } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tondesk.n9xo.xyz';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/web',
        disallow: ['/api/', '/settings/', '/interactions/', '/ton-connect/'],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
