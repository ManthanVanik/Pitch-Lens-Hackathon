'use server';

/**
 * @fileOverview An AI chatbot that asks deeper questions to analyze a startup.
 *
 * - interviewStartup - A function that handles the chatbot interaction.
 * - StartupInterviewerInput - The input type for the interviewStartup function.
 * - StartupInterviewerOutput - The return type for the interviewStartup function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const StartupInterviewerInputSchema = z.object({
  analysisData: z.string().describe('The JSON string of the full startup analysis data.'),
  history: z.array(ChatMessageSchema).describe('The conversation history.'),
});
export type StartupInterviewerInput = z.infer<typeof StartupInterviewerInputSchema>;

const StartupInterviewerOutputSchema = z.object({
  message: z.string().describe("The chatbot's response."),
});
export type StartupInterviewerOutput = z.infer<typeof StartupInterviewerOutputSchema>;

export async function interviewStartup(input: StartupInterviewerInput): Promise<StartupInterviewerOutput> {
  return startupInterviewerFlow(input);
}

const startupInterviewerPrompt = ai.definePrompt({
  name: 'startupInterviewerPrompt',
  input: {schema: StartupInterviewerInputSchema},
  output: {schema: StartupInterviewerOutputSchema},
  model: googleAI.model('gemini-1.5-pro'),
  prompt: `You are an expert startup analyst acting as a chatbot. Your goal is to ask deep, insightful questions to better understand a startup. You have been provided with an initial analysis of the company.

  Based on the provided analysis and the conversation history, ask the user a single, relevant follow-up question that would help you dig deeper into their business. Keep your questions concise and focused. Start the conversation with a greeting and your first question.

  Initial Analysis:
  {{{analysisData}}}

  Conversation History:
  {{#each history}}
  {{#if (eq role 'user')}}
  User: {{{content}}}
  {{/if}}
  {{#if (eq role 'model')}}
  Analyst: {{{content}}}
  {{/if}}
  {{/each}}
  `,
});

const startupInterviewerFlow = ai.defineFlow(
  {
    name: 'startupInterviewerFlow',
    inputSchema: StartupInterviewerInputSchema,
    outputSchema: StartupInterviewerOutputSchema,
  },
  async input => {
    const {output} = await startupInterviewerPrompt(input);
    return output!;
  }
);
