'use server';

/**
 * @fileOverview A risk assessment summary AI agent.
 *
 * - getRiskAssessmentSummary - A function that handles the risk assessment summary process.
 * - RiskAssessmentSummaryInput - The input type for the getRiskAssessmentSummary function.
 * - RiskAssessmentSummaryOutput - The return type for the getRiskAssessmentSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RiskAssessmentSummaryInputSchema = z.object({
  companyOverview: z
    .string()
    .describe('A detailed overview of the company being analyzed.'),
  marketAnalysis: z.string().describe('An analysis of the market the company operates in.'),
  businessModel: z.string().describe('A description of the company business model.'),
  financials: z.string().describe('Financial data for the company.'),
  claimsAnalysis: z.string().describe('An analysis of the claims made by the company.'),
  riskMetrics: z.string().describe('Risk metrics for the company.'),
  conclusion: z.string().describe('Overall conclusion about the company.'),
  weights: z.object({
    teamStrength: z.number().optional(),
    marketOpportunity: z.number().optional(),
    traction: z.number().optional(),
    claimCredibility: z.number().optional(),
    financialHealth: z.number().optional(),
  }).optional().describe('Investor-defined weights for calculating the composite score.'),
});
export type RiskAssessmentSummaryInput = z.infer<typeof RiskAssessmentSummaryInputSchema>;

const RiskAssessmentSummaryOutputSchema = z.object({
  composite_investment_safety_score: z
    .string()
    .describe('The composite investment safety score for the company.'),
  narrative_justification: z
    .string()
    .describe('The narrative justification for the composite investment safety score.'),
});
export type RiskAssessmentSummaryOutput = z.infer<typeof RiskAssessmentSummaryOutputSchema>;

export async function getRiskAssessmentSummary(input: RiskAssessmentSummaryInput): Promise<RiskAssessmentSummaryOutput> {
  return riskAssessmentSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'riskAssessmentSummaryPrompt',
  input: {schema: RiskAssessmentSummaryInputSchema},
  output: {schema: RiskAssessmentSummaryOutputSchema},
  prompt: `You are an expert risk assessment analyst.

  Based on the provided information about the company, generate a risk assessment summary.
  
  {{#if weights}}
  You MUST recalculate the 'composite_investment_safety_score' and 'narrative_justification' based on the new weights provided.
  The original weights were: Team Strength (20%), Market Opportunity (20%), Traction (20%), Claim Credibility (25%), and Financial Health (15%).
  The new weights are:
  - Team Strength: {{{weights.teamStrength}}}
  - Market Opportunity: {{{weights.marketOpportunity}}}
  - Traction: {{{weights.traction}}}
  - Claim Credibility: {{{weights.claimCredibility}}}
  - Financial Health: {{{weights.financialHealth}}}
  
  Analyze the provided data and determine a score (0-100) for each of the five factors. Then, calculate the new weighted average to get the composite score.
  The new narrative justification should reflect how the change in weights impacted the score.
  For example, if the investor increased the weight on "Team Strength" and the team is very strong, the score should increase, and the justification should mention this.
  Return the score as a percentage string (e.g., "75.2%").
  {{else}}
  You should calculate the composite investment safety score, narrative justification, and identified key risks.
  The default weights are: Team Strength (20%), Market Opportunity (20%), Traction (20%), Claim Credibility (25%), and Financial Health (15%).
  {{/if}}

  Company Overview: {{{companyOverview}}}
  Market Analysis: {{{marketAnalysis}}}
  Business Model: {{{businessModel}}}
  Financials: {{{financials}}}
  Claims Analysis: {{{claimsAnalysis}}}
  Risk Metrics: {{{riskMetrics}}}
  Conclusion: {{{conclusion}}}

  Provide a summary of the risk assessment, including the composite investment safety score and narrative justification.
`,
});

const riskAssessmentSummaryFlow = ai.defineFlow(
  {
    name: 'riskAssessmentSummaryFlow',
    inputSchema: RiskAssessmentSummaryInputSchema,
    outputSchema: RiskAssessmentSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
