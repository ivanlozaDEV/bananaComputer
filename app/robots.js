export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/perfil/', '/api/'],
    },
    sitemap: 'https://bananacomputer.store/sitemap.xml',
  }
}
