'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a financial metrics dashboard,
 * displaying key metrics and suggesting follow-up investigations for financial projections.
 *
 * - generateFinancialMetricsDashboard - The main function to generate the financial metrics dashboard.
 * - FinancialMetricsDashboardInput - The input type for the generateFinancialMetricsDashboard function.
 * - FinancialMetricsDashboardOutput - The return type for the generateFinancialMetricsDashboard function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FinancialMetricsDashboardInputSchema = z.object({
  analysisText: z
    .string()
    .describe("The startup's analysis text, containing financial information and claims."),
});
export type FinancialMetricsDashboardInput = z.infer<typeof FinancialMetricsDashboardInputSchema>;

const FinancialMetricsDashboardOutputSchema = z.object({
  keyMetrics: z.object({
    arr: z.string().optional().describe('Annual Recurring Revenue.'),
    mrr: z.string().optional().describe('Monthly Recurring Revenue.'),
    burnRate: z.string().optional().describe('Monthly burn rate.'),
    runway: z.string().optional().describe('Runway in months.'),
  }).describe('Key financial metrics extracted from the analysis.'),
  financialProjections: z.string().optional().describe('Summary of financial projections.'),
  followUpSuggestions: z.array(z.string()).optional().describe('Suggestions for follow-up investigations regarding financial projections.'),
});
export type FinancialMetricsDashboardOutput = z.infer<typeof FinancialMetricsDashboardOutputSchema>;

export async function generateFinancialMetricsDashboard(input: FinancialMetricsDashboardInput): Promise<FinancialMetricsDashboardOutput> {
  return financialMetricsDashboardFlow(input);
}

const financialMetricsDashboardPrompt = ai.definePrompt({
  name: 'financialMetricsDashboardPrompt',
  input: {schema: FinancialMetricsDashboardInputSchema},
  output: {schema: FinancialMetricsDashboardOutputSchema},
  prompt: `You are an AI assistant designed to extract and summarize key financial metrics and projections from startup analysis text.

  Your goal is to provide a concise financial overview, highlighting key metrics like ARR, MRR, burn rate, and runway, and identifying potential areas for further investigation regarding financial projections.

  Instructions:
  1.  Extract ARR, MRR, burn rate, and runway from the analysis text. If a metric is not explicitly mentioned, leave it blank. Return the values as strings.
  2.  Summarize the financial projections mentioned in the analysis text.
  3.  Identify any financial projections that are not directly visible in the text but are referred to in other claims or statements. Suggest follow-up investigations to clarify these projections.

  Analysis Text: {{{analysisText}}}

  Output: {
    keyMetrics: {
      arr: string,
      mrr: string,
      burnRate: string,
      runway: string,
    },
    financialProjections: string,
    followUpSuggestions: string[]
  }`,
});

const financialMetricsDashboardFlow = ai.defineFlow(
  {
    name: 'financialMetricsDashboardFlow',
    inputSchema: FinancialMetricsDashboardInputSchema,
    outputSchema: FinancialMetricsDashboardOutputSchema,
  },
  async input => {
    const {output} = await financialMetricsDashboardPrompt(input);
    return output!;
  }
);
