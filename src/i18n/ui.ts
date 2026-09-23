export const languages = {
  id: 'Indonesia',
  en: 'English',
} as const;

export type SupportedLocale = keyof typeof languages;
export const defaultLocale: SupportedLocale = 'id';

export const ui = {
  id: {
    // Navigation
    'nav.home': 'Beranda',
    'nav.testimonials': 'Testimoni',
    'nav.about': 'Tentang Saya',
    'nav.projects': 'Proyek',
    'nav.posts': 'Tulisan / Artikel',
    'nav.tags': 'Topik & Tag',
    
    // Floating Lead Capture Modal
    'lead.buttonLabel': 'Hubungi Andre di Telegram',
    'lead.modalTitle': 'Mulai Obrolan dengan Andre',
    'lead.modalSubtitle': 'Isi formulir singkat di bawah untuk terhubung langsung ke Telegram & konsultasikan kebutuhan landing page Anda.',
    'lead.nameLabel': 'Nama Lengkap',
    'lead.namePlaceholder': 'Nama Anda',
    'lead.emailLabel': 'Alamat Email',
    'lead.emailPlaceholder': 'nama@email.com',
    'lead.whatsappLabel': 'Nomor WhatsApp',
    'lead.whatsappPlaceholder': '08123456789 atau 628...',
    'lead.privacy': 'Data Anda 100% aman dan dijaga kerahasiaannya.',
    'lead.submit': 'Lanjutkan ke Telegram',
    'lead.submitting': 'Menghubungkan ke Telegram...',
    
    // Common CTA & Badges
    'cta.allProducts': 'All Products',
    'cta.allProjects': 'All Projects',
    'cta.allTestimonials': 'Semua Testimoni',
    'cta.allPosts': 'Semua Artikel',
    'cta.livePreview': 'Live Preview',
    'cta.buyNow': 'Buy Now →',
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.testimonials': 'Testimonials',
    'nav.about': 'About Me',
    'nav.projects': 'Projects',
    'nav.posts': 'Articles & Blog',
    'nav.tags': 'Tags & Topics',
    
    // Floating Lead Capture Modal
    'lead.buttonLabel': 'Contact Andre on Telegram',
    'lead.modalTitle': 'Start a Conversation with Andre',
    'lead.modalSubtitle': 'Fill out this quick form to connect directly via Telegram & discuss your high-converting landing page needs.',
    'lead.nameLabel': 'Full Name',
    'lead.namePlaceholder': 'Your Name',
    'lead.emailLabel': 'Email Address',
    'lead.emailPlaceholder': 'you@example.com',
    'lead.whatsappLabel': 'WhatsApp Number',
    'lead.whatsappPlaceholder': '+1... or +62...',
    'lead.privacy': 'Your data is 100% safe and confidential.',
    'lead.submit': 'Continue to Telegram',
    'lead.submitting': 'Connecting to Telegram...',
    
    // Common CTA & Badges
    'cta.allProducts': 'All Products',
    'cta.allProjects': 'All Projects',
    'cta.allTestimonials': 'All Testimonials',
    'cta.allPosts': 'All Articles',
    'cta.livePreview': 'Live Preview',
    'cta.buyNow': 'Buy Now →',
  },
} as const;

export function useTranslations(lang: SupportedLocale = defaultLocale) {
  return function t(key: keyof typeof ui['id']) {
    return ui[lang]?.[key] || ui[defaultLocale][key];
  };
}

const SUPPORTED_EN_EXACT_ROUTES = new Set([
  '/',
  '/about',
  '/posts',
  '/projects',
  '/tags',
  '/testimonials',
]);

/**
 * Checks if a 1:1 localized alternate version exists for the given pathname.
 * Useful for omitting 404 hreflang tags on pages that only exist in Indonesian.
 */
export function hasAlternateLocale(currentPathname: string, targetLocale: SupportedLocale): boolean {
  if (targetLocale === 'id') {
    // Every English page has a direct counterpart in Indonesian
    return true;
  }
  
  // Normalize pathname: remove trailing slash
  const cleanPath = currentPathname.replace(/\/+$/, '') || '/';
  
  // If already on /en, it obviously has an English page
  if (cleanPath === '/en' || cleanPath.startsWith('/en/')) {
    return true;
  }

  return SUPPORTED_EN_EXACT_ROUTES.has(cleanPath);
}

/**
 * Returns the path for the requested target locale given the current pathname
 * e.g. /about/ -> /en/about/ (when target is 'en')
 * e.g. /en/about/ -> /about/ (when target is 'id')
 * With smart fallbacks for Indonesian-only pages (posts -> /en/posts/, etc.) to avoid 404s
 */
export function getSwitchLocaleUrl(currentPathname: string, targetLocale: SupportedLocale): string {
  // Normalize pathname: remove trailing slash for consistency during parse
  const cleanPath = currentPathname.replace(/\/+$/, '') || '/';
  const isEn = cleanPath === '/en' || cleanPath.startsWith('/en/');

  if (targetLocale === 'en') {
    if (isEn) {
      return currentPathname.endsWith('/') ? currentPathname : `${currentPathname}/`;
    }

    if (SUPPORTED_EN_EXACT_ROUTES.has(cleanPath)) {
      return cleanPath === '/' ? '/en/' : `/en${cleanPath}/`;
    }

    // Smart fallbacks for Indonesian-only pages to prevent 404 when clicking [EN]
    if (cleanPath.startsWith('/side-projects')) {
      return '/en/projects/';
    }
    if (cleanPath.startsWith('/tags')) {
      return '/en/tags/';
    }
    if (cleanPath === '/404' || cleanPath === '/404.html') {
      return '/en/';
    }
    // Individual blog posts (e.g. /2026-09-17-.../) fallback to English articles archive
    return '/en/posts/';
  } else {
    // targetLocale is 'id'
    if (!isEn) {
      if (cleanPath === '/404' || cleanPath === '/404.html') {
        return '/';
      }
      return currentPathname.endsWith('/') ? currentPathname : `${currentPathname}/`;
    }
    // Strip /en prefix
    const pathWithoutEn = cleanPath.replace(/^\/en(\/|$)/, '/');
    return pathWithoutEn.endsWith('/') ? pathWithoutEn : `${pathWithoutEn}/`;
  }
}

