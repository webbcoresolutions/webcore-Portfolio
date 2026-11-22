export type Project = {
  slug: string;
  name: string;
  url: string;
  domain: string;
  sector: string;
  location: string;
  description: string;
  tags: string[];
  /** Brand accent sampled from the live site — gives each case study its own identity. */
  accent: string;
  /** Soft background tint used behind the preview composition. */
  tint: string;
};

/**
 * Screenshots live in /public/projects/<slug>-{1280,720,full,mobile}.webp
 * and are produced by `npm run screenshots`. To replace one manually, drop in
 * files with the same names.
 */
export const projects: Project[] = [
  {
    slug: 'webcore',
    name: 'Webcore Solutions',
    url: 'https://webcoreuae.com/',
    domain: 'webcoreuae.com',
    sector: 'Digital Agency',
    location: 'Dubai, UAE',
    description:
      'Our own flagship platform: a full-service web, software, SEO and CMS agency site built to convert enquiries from UAE brands and global teams.',
    tags: ['Web Development', 'SEO', 'Brand Platform'],
    accent: '#2563EB',
    tint: '#E8F0FE',
  },
  {
    slug: 'sapling',
    name: 'Sapling Consultancy',
    url: 'https://www.saplinguae.com/',
    domain: 'saplinguae.com',
    sector: 'IT & Automation Consulting',
    location: 'UAE',
    description:
      'A corporate presence for a global consultancy delivering IT consulting, industrial automation expertise and international workforce solutions.',
    tags: ['Corporate Website', 'UI/UX', 'Content Architecture'],
    accent: '#4E9F2A',
    tint: '#ECF5E6',
  },
  {
    slug: 'vedant',
    name: 'Vedant Group',
    url: 'https://www.vedantsgroups.com/',
    domain: 'vedantsgroups.com',
    sector: 'Enterprise Technology',
    location: 'Global · 25+ countries',
    description:
      'Enterprise consulting across cloud, AI, automation, Salesforce, SAP and talent solutions, presented as one confident global brand.',
    tags: ['Enterprise Web', 'Multi-service IA', 'Performance'],
    accent: '#2F6FEA',
    tint: '#E9EFFD',
  },
  {
    slug: 'lemos',
    name: 'Lemos International',
    url: 'https://lemosinternational.ae/',
    domain: 'lemosinternational.ae',
    sector: 'Oil & Gas Engineering',
    location: 'UAE',
    description:
      'An engineering and contracting firm for the oil and gas sector, with a site that communicates technical capability and trust.',
    tags: ['Industrial Brand', 'Web Design', 'Development'],
    accent: '#E8731F',
    tint: '#FDF0E6',
  },
  {
    slug: 'mrz',
    name: 'MRZ Management Services',
    url: 'https://www.mrzuae.com/',
    domain: 'mrzuae.com',
    sector: 'Business Services',
    location: 'UAE · FZE LLC',
    description:
      'Commercial brokerage, general trading, IT consultancy, cyber security architecture and HR consultancy, organised into a clear, credible digital front door.',
    tags: ['Corporate Website', 'Service Architecture', 'SEO'],
    accent: '#3156D3',
    tint: '#E9EEFB',
  },
  {
    slug: 'gulfnext',
    name: 'Gulf Next Oil & Gas',
    url: 'https://www.gulfnext.ae/',
    domain: 'gulfnext.ae',
    sector: 'Energy & Petrochemicals',
    location: 'UAE',
    description:
      'Integrated engineering, construction and operations support for the oil, gas and petrochemical sector, presented through an immersive, technical visual narrative.',
    tags: ['Industrial Web', 'Illustration', 'Interaction'],
    accent: '#1E6FD9',
    tint: '#E6ECF4',
  },
  {
    slug: 'securevault',
    name: 'SecureVault Pro',
    url: 'https://password-manager-mauve-rho.vercel.app/',
    domain: 'securevault · web app',
    sector: 'Custom Software · SaaS',
    location: 'Web Application',
    description:
      'An enterprise password vault and expense management platform with AES-256-GCM encryption, expense analytics and role-based access control.',
    tags: ['Custom Software', 'Security', 'Dashboard UX'],
    accent: '#2563EB',
    tint: '#E8EEFD',
  },
  {
    slug: 'zillay',
    name: 'Zillay Seeds',
    url: 'https://www.zillayseeds.pk/',
    domain: 'zillayseeds.pk',
    sector: 'Agriculture · E-commerce',
    location: 'Gujranwala, Pakistan',
    description:
      'Hybrid F1 and OPV vegetable seeds for Pakistani growers, from tomato and hot pepper to watermelon and cauliflower, delivered nationwide.',
    tags: ['E-commerce', 'Product Catalogue', 'SEO'],
    accent: '#7B9B01',
    tint: '#F1F5E3',
  },
  {
    slug: 'wisemart',
    name: 'Wise Mart',
    url: 'https://www.wisemart2.com/',
    domain: 'wisemart2.com',
    sector: 'Food & Hospitality',
    location: 'Maryland, USA',
    description:
      'Fresh pizza, famous fried chicken, hearty subs and crisp salads across three Maryland locations: "Come hungry. Leave happy."',
    tags: ['Restaurant Website', 'Menu UX', 'Local SEO'],
    accent: '#E8711A',
    tint: '#F8EEE5',
  },
  {
    slug: 'muslimexplorers',
    name: 'Muslim Explorers Academy',
    url: 'https://www.muslimexplorers.com/',
    domain: 'muslimexplorers.com',
    sector: 'Education',
    location: 'Online Academy',
    description:
      'Expert-led programs exploring the harmony between Islamic scholarship and modern science for learners of all ages. Ponder. Learn. Glorify.',
    tags: ['Education Platform', 'Brand Storytelling', 'CMS'],
    accent: '#B8902A',
    tint: '#F6F1E3',
  },
];
