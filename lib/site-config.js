/**
 * Single source of truth for Elite Media Solutions (EMS) brand facts.
 *
 * Anything that states the company name, the logo path, the public URL or the
 * contact details reads from here. Do not restate these inline elsewhere — a
 * rebrand should only ever touch this file plus the asset in /public.
 */

export const site = {
  /** Full legal/marketing name. Use on first mention and in metadata. */
  name: 'Elite Media Solutions',
  /** Abbreviation. Use for compact UI, Telegram subjects, chart labels. */
  shortName: 'EMS',
  /** Name + abbreviation, for the first mention on a page. */
  fullName: 'Elite Media Solutions (EMS)',

  tagline: 'We Build Digital Experiences That Actually Work',
  description:
    'Elite Media Solutions (EMS) builds high-performance websites, AI automation, branding and digital campaigns for businesses in Qatar and across the GCC.',

  /**
   * Canonical production origin. Overridable per environment so preview
   * deployments generate correct canonicals and sitemap URLs.
   */
  url: (process.env.NEXT_PUBLIC_SITE_URL || 'https://elitemedia.qa').replace(/\/$/, ''),

  /**
   * Logo lives at a brand-neutral path so replacing the image is a one-file
   * swap with no code change.
   *
   * NOTE: public/ems-logo.png and public/ems-icon.png are TEMPORARY
   * placeholders generated to carry the correct EMS name. Replace both files
   * with the official artwork — no code change is needed.
   */
  logo: {
    src: '/ems-logo.png',
    alt: 'Elite Media Solutions (EMS)',
  },
  icon: '/ems-icon.png',

  /** Open Graph fallback image, used when an article has no image of its own. */
  ogImage: '/og-image.png',

  contact: {
    email: 'hello@elitemedia.qa',
    locations: ['Doha, Qatar', 'Dubai, UAE', 'Algiers, Algeria'],
  },

  social: {
    instagram: 'https://instagram.com/elitemedia.qa',
  },

  /**
   * Service pages. These back both the /services/[slug] routes and the blog's
   * automatic internal linking — `keywords` drive the anchor matching.
   */
  services: [
    {
      slug: 'web-development',
      title: 'Web Development',
      summary:
        'Websites and web applications built to perform — fast, accessible, and owned outright.',
      description:
        'We build robust, full-stack websites and web applications on modern frameworks like Next.js and React. One-time investment, lifetime ownership — no vendor lock-in and no recurring platform fees. Every build is measured on the things that matter commercially: load speed, conversion path, and how easily your team can keep it up to date.',
      offerings: [
        'Marketing sites and high-converting landing pages',
        'Enterprise-grade full-stack web applications',
        'E-commerce storefronts, custom or platform-based',
        'Performance, accessibility and technical SEO work',
      ],
      keywords: ['website', 'web development', 'web design', 'landing page', 'web app'],
    },
    {
      slug: 'ai-automation',
      title: 'AI & Automation',
      summary:
        'Practical automation that removes repetitive work without removing the human touch.',
      description:
        'We design and deploy AI agents, chatbots and workflow automation around the processes that actually cost your team time — enquiry handling, qualification, quoting, follow-up and reporting. The aim is not novelty; it is fewer manual steps between a customer reaching out and someone useful responding.',
      offerings: [
        'Custom chatbots and AI assistants',
        'Lead capture, routing and follow-up automation',
        'Document, quoting and reporting workflows',
        'Integration with your existing tools and CRM',
      ],
      keywords: ['ai automation', 'ai agent', 'automation', 'chatbot', 'workflow automation'],
    },
    {
      slug: 'social-media',
      title: 'Social Media Marketing',
      summary: 'Content and campaigns that turn an audience into enquiries.',
      description:
        'We plan, produce and run social content for brands that need the channel to do more than look busy. That means a content system your team can sustain, creative built for the platform it runs on, and a clear line between what gets posted and what gets booked.',
      offerings: [
        'Content strategy and monthly planning',
        'Short-form video and static creative production',
        'Community management and response handling',
        'Performance reporting tied to enquiries, not just reach',
      ],
      keywords: ['social media', 'instagram', 'content marketing', 'social media marketing'],
    },
    {
      slug: 'branding',
      title: 'Branding & Design',
      summary: 'Brand systems that stay consistent as the business grows.',
      description:
        'We craft brand identities that hold up beyond the logo file — naming, tone of voice, visual identity and the design system that lets a small team apply it consistently across every touchpoint, from a pitch deck to a shopfront.',
      offerings: [
        'Brand identity and visual systems',
        'Logo, typography and colour direction',
        'Brand guidelines your team can actually follow',
        'UI/UX and design systems for digital products',
      ],
      keywords: ['branding', 'brand identity', 'logo design', 'visual identity'],
    },
    {
      slug: 'paid-advertising',
      title: 'Paid Advertising',
      summary: 'Ad spend pointed at the offers and audiences that convert.',
      description:
        'We build and manage paid campaigns across Google and Meta with the measurement in place first. Most underperforming ad accounts are not a creative problem — they are a tracking, targeting or landing-page-match problem, and that is where we start.',
      offerings: [
        'Google Ads and Meta Ads campaign management',
        'Conversion tracking and measurement setup',
        'Landing page and message-match optimisation',
        'Budget planning and ongoing performance review',
      ],
      keywords: ['paid ads', 'google ads', 'meta ads', 'ppc', 'paid advertising'],
    },
    {
      slug: 'seo',
      title: 'SEO & Lead Generation',
      summary: 'Organic visibility that compounds, and a pipeline that follows from it.',
      description:
        'We work on the technical foundations, the content, and the conversion path together — because ranking for a term you cannot convert is not a result. Our focus is specific, high-intent search demand rather than broad vanity keywords.',
      offerings: [
        'Technical SEO audits and fixes',
        'Keyword and search-intent research',
        'Content strategy and ongoing publishing',
        'Local search visibility for Qatar and the GCC',
      ],
      keywords: ['seo', 'search engine optimization', 'lead generation', 'organic traffic'],
    },
  ],
};

export default site;
