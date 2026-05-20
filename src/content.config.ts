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
};
