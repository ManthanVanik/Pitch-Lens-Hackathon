'use server';

/**
 * @fileOverview A flow that generates insights about the startup's business model
 * visualization regarding revenue streams, pricing strategy, and scalability factors.
 *
 * - businessModelVisualization - A function that handles the business model visualization process.
 * - BusinessModelVisualizationInput - The input type for the businessModelVisualization function.
 * - BusinessModelVisualizationOutput - The return type for the businessModelVisualization function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BusinessModelVisualizationInputSchema = z.object({
  fileId: z.string().describe('The unique ID of the uploaded file (PDF or PPT).'),
});
export type BusinessModelVisualizationInput = z.infer<typeof BusinessModelVisualizationInputSchema>;

const BusinessModelVisualizationOutputSchema = z.object({
  insights: z.string().describe('Insights regarding the startup\'s revenue streams, pricing strategy, and scalability factors.'),
});
export type BusinessModelVisualizationOutput = z.infer<typeof BusinessModelVisualizationOutputSchema>;

export async function businessModelVisualization(input: BusinessModelVisualizationInput): Promise<BusinessModelVisualizationOutput> {
  return businessModelVisualizationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'businessModelVisualizationPrompt',
  input: {schema: BusinessModelVisualizationInputSchema},
  output: {schema: BusinessModelVisualizationOutputSchema},
  prompt: `You are an expert business analyst providing insights based on uploaded documents.

  Analyze the provided document (identified by file ID: {{{fileId}}}) and extract insights regarding the startup's:
  - Revenue streams
  - Pricing strategy
  - Scalability factors
  Provide a concise summary of your findings.
  `,
});

const businessModelVisualizationFlow = ai.defineFlow(
  {
    name: 'businessModelVisualizationFlow',
    inputSchema: BusinessModelVisualizationInputSchema,
    outputSchema: BusinessModelVisualizationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
