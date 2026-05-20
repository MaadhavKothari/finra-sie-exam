import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';

const choiceSchema = z.object({
  label: z.enum(['A', 'B', 'C', 'D']),
  text: z.string().min(1),
  explanation: z.string().min(10),
});

const questionSchema = z.object({
  id: z.string().regex(/^q-(cm|pr|ta|rf)-\d{3}$/),
  stem: z.string().min(10),
  choices: z.tuple([choiceSchema, choiceSchema, choiceSchema, choiceSchema]),
  correctAnswer: z.enum(['A', 'B', 'C', 'D']),
  explanation: z.string().min(20),
  topic: z.enum([
    'capital-markets',
    'products-risks',
    'trading-accounts',
    'regulatory-framework',
  ]),
  subtopic: z.string().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  source: z.string().min(1),
  regulatoryBasis: z.string().optional(),
  lastVerified: z.string().optional(),
});

const capitalMarkets = defineCollection({
  loader: file('src/content/questions/capital-markets.json'),
  schema: questionSchema,
});

const productsRisks = defineCollection({
  loader: file('src/content/questions/products-risks.json'),
  schema: questionSchema,
});

const tradingAccounts = defineCollection({
  loader: file('src/content/questions/trading-accounts.json'),
  schema: questionSchema,
});

const regulatoryFramework = defineCollection({
  loader: file('src/content/questions/regulatory-framework.json'),
  schema: questionSchema,
});

export const collections = {
  'capital-markets': capitalMarkets,
  'products-risks': productsRisks,
  'trading-accounts': tradingAccounts,
  'regulatory-framework': regulatoryFramework,
};
