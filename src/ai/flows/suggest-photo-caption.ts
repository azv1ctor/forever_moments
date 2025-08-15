'use server';

/**
 * @fileOverview A photo caption suggestion AI agent.
 *
 * - suggestPhotoCaption - A function that suggests a photo caption.
 * - SuggestPhotoCaptionInput - The input type for the suggestPhotoCaption function.
 * - SuggestPhotoCaptionOutput - The return type for the suggestPhotoCaption function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestPhotoCaptionInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  topicKeywords: z.string().describe('Relevant keywords about this photo.'),
});
export type SuggestPhotoCaptionInput = z.infer<typeof SuggestPhotoCaptionInputSchema>;

const SuggestPhotoCaptionOutputSchema = z.object({
  suggestedCaption: z.string().describe('A suggested photo caption.'),
});
export type SuggestPhotoCaptionOutput = z.infer<typeof SuggestPhotoCaptionOutputSchema>;

export async function suggestPhotoCaption(
  input: SuggestPhotoCaptionInput
): Promise<SuggestPhotoCaptionOutput> {
  return suggestPhotoCaptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestPhotoCaptionPrompt',
  input: {schema: SuggestPhotoCaptionInputSchema},
  output: {schema: SuggestPhotoCaptionOutputSchema},
  prompt: `You are an expert in writing engaging social media captions.

  Based on the photo and keywords provided, suggest an appropriate caption.

  Photo: {{media url=photoDataUri}}
  Keywords: {{{topicKeywords}}}`,
});

const suggestPhotoCaptionFlow = ai.defineFlow(
  {
    name: 'suggestPhotoCaptionFlow',
    inputSchema: SuggestPhotoCaptionInputSchema,
    outputSchema: SuggestPhotoCaptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
