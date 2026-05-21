import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';

const choiceSchema = z.object({
  label: z.enum(['A', 'B', 'C', 'D']),
  text: z.string().min(1),
  explanation: z.string().min(10),
});

// Schema for original SIE 4-collection structure
const sieQuestionSchema = z.object({
  id: z.string().regex(/^q-(cm|pr|ta|rf)-\d{3}$/),
  stem: z.string().min(10),
  choices: z.tuple([choiceSchema, choiceSchema, choiceSchema, choiceSchema]),
  correctAnswer: z.enum(['A', 'B', 'C', 'D']),
  explanation: z.string().min(20),
  topic: z.enum(['capital-markets', 'products-risks', 'trading-accounts', 'regulatory-framework']),
  subtopic: z.string().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  source: z.string().min(1),
  regulatoryBasis: z.string().optional(),
  lastVerified: z.string().optional(),
  relatedStories: z.array(z.string()).optional(),
});

// Schema for all other exams — single JSON file per exam, questions have a `section` field
const examQuestionSchema = z.object({
  id: z.string().min(1),
  section: z.string().min(1),
  stem: z.string().min(10),
  choices: z.tuple([choiceSchema, choiceSchema, choiceSchema, choiceSchema]),
  correctAnswer: z.enum(['A', 'B', 'C', 'D']),
  explanation: z.string().min(20),
  subtopic: z.string().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  source: z.string().min(1),
  regulatoryBasis: z.string().optional(),
  lastVerified: z.string().optional(),
  relatedStories: z.array(z.string()).optional(),
});

// Story cards — accurate, sourced real-world cases shown after a question is answered.
// sourceUrl is REQUIRED to enforce honest curation; verifiedOn tracks freshness.
const storySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  dateRange: z.string().min(1),
  summary: z.string().min(20),
  whyItMatters: z.string().min(20),
  ruleConnection: z.string().min(10),
  primarySource: z.object({
    name: z.string().min(1),
    url: z.string().url(),
  }),
  furtherReading: z.array(z.object({
    name: z.string().min(1),
    url: z.string().url(),
  })).optional(),
  tags: z.array(z.string()).optional(),
  verifiedOn: z.string().min(1),
});

// SIE — four separate collections (one per section)
const capitalMarkets = defineCollection({
  loader: file('src/content/questions/capital-markets.json'),
  schema: sieQuestionSchema,
});
const productsRisks = defineCollection({
  loader: file('src/content/questions/products-risks.json'),
  schema: sieQuestionSchema,
});
const tradingAccounts = defineCollection({
  loader: file('src/content/questions/trading-accounts.json'),
  schema: sieQuestionSchema,
});
const regulatoryFramework = defineCollection({
  loader: file('src/content/questions/regulatory-framework.json'),
  schema: sieQuestionSchema,
});

// Other exams — one collection per exam
const series6 = defineCollection({
  loader: file('src/content/questions/series-6.json'),
  schema: examQuestionSchema,
});
const series7 = defineCollection({
  loader: file('src/content/questions/series-7.json'),
  schema: examQuestionSchema,
});
const series63 = defineCollection({
  loader: file('src/content/questions/series-63.json'),
  schema: examQuestionSchema,
});
const series65 = defineCollection({
  loader: file('src/content/questions/series-65.json'),
  schema: examQuestionSchema,
});
const series66 = defineCollection({
  loader: file('src/content/questions/series-66.json'),
  schema: examQuestionSchema,
});
const series3 = defineCollection({
  loader: file('src/content/questions/series-3.json'),
  schema: examQuestionSchema,
});
const series24 = defineCollection({
  loader: file('src/content/questions/series-24.json'),
  schema: examQuestionSchema,
});
const series79 = defineCollection({
  loader: file('src/content/questions/series-79.json'),
  schema: examQuestionSchema,
});

const stories = defineCollection({
  loader: file('src/content/stories/stories.json'),
  schema: storySchema,
});

export const collections = {
  'capital-markets': capitalMarkets,
  'products-risks': productsRisks,
  'trading-accounts': tradingAccounts,
  'regulatory-framework': regulatoryFramework,
  'series-6': series6,
  'series-7': series7,
  'series-63': series63,
  'series-65': series65,
  'series-66': series66,
  'series-3': series3,
  'series-24': series24,
  'series-79': series79,
  'stories': stories,
};
 
