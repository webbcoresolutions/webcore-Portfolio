export type Service = { name: string; description: string; tags: string[] };

export const services: Service[] = [
  {
    name: 'Web Development',
    description:
      'High-performance websites and web applications engineered for speed, security and conversion, and built to scale with your business.',
    tags: ['Corporate sites', 'Web apps', 'Performance'],
  },
  {
    name: 'Custom Software Development',
    description:
      'Tailored platforms, portals and internal tools designed around the way your business actually works, not the other way round.',
    tags: ['SaaS platforms', 'Dashboards', 'APIs & integrations'],
  },
  {
    name: 'E-commerce Development',
    description:
      'Online stores that make buying effortless, from product catalogue and checkout to payments, shipping and order management.',
    tags: ['Online stores', 'Payments', 'Catalogues'],
  },
  {
    name: 'WordPress & CMS Development',
    description:
      'Flexible, secure content platforms your team can update with confidence, with custom themes, structured content and clean editing.',
    tags: ['WordPress', 'Headless CMS', 'Custom themes'],
  },
  {
    name: 'UI/UX & Graphic Design',
    description:
      'Interfaces and brand visuals that are clear, distinctive and designed around real users, from wireframes to polished design systems.',
    tags: ['Product design', 'Brand identity', 'Prototyping'],
  },
  {
    name: 'SEO & GEO',
    description:
      'Search and generative-engine optimisation so customers, and the AI assistants they ask, find your business first.',
    tags: ['Technical SEO', 'Content strategy', 'AI visibility'],
  },
  {
    name: 'IT Consultation',
    description:
      'Clear, practical guidance on architecture, tooling and digital transformation, from the first roadmap to a confident rollout.',
    tags: ['Strategy', 'Architecture', 'Digital transformation'],
  },
  {
    name: 'Business Automation',
    description:
      'Workflows, integrations and AI-assisted processes that remove repetitive work, reduce errors and let your operations scale.',
    tags: ['Workflows', 'Integrations', 'AI automation'],
  },
];
