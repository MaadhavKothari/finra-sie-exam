export const SIE_SECTIONS = {
  'capital-markets': {
    name: 'Knowledge of Capital Markets',
    weight: 0.16,
    examItems: 12,
    sectionNumber: 1,
    subtopics: [
      'regulatory-entities-agencies',
      'market-structure',
      'economic-factors',
      'offerings',
    ],
  },
  'products-risks': {
    name: 'Understanding Products and Their Risks',
    weight: 0.44,
    examItems: 33,
    sectionNumber: 2,
    subtopics: [
      'equity-securities',
      'debt-instruments',
      'options',
      'packaged-products',
      'municipal-fund-securities',
      'direct-participation-programs',
      'reits',
      'hedge-funds',
      'exchange-traded-products',
      'investment-risks',
    ],
  },
  'trading-accounts': {
    name: 'Understanding Trading, Customer Accounts and Prohibited Activities',
    weight: 0.31,
    examItems: 23,
    sectionNumber: 3,
    subtopics: [
      'orders-and-strategies',
      'investment-returns',
      'trade-settlement',
      'corporate-actions',
      'account-types',
      'account-registrations',
      'anti-money-laundering',
      'books-records-privacy',
      'communications-suitability',
      'market-manipulation',
      'insider-trading',
      'other-prohibited-activities',
    ],
  },
  'regulatory-framework': {
    name: 'Overview of the Regulatory Framework',
    weight: 0.09,
    examItems: 7,
    sectionNumber: 4,
    subtopics: [
      'registration-continuing-education',
      'employee-conduct',
      'reportable-events',
    ],
  },
} as const;

export type SectionId = keyof typeof SIE_SECTIONS;
export type SubtopicSlug = typeof SIE_SECTIONS[SectionId]['subtopics'][number];
