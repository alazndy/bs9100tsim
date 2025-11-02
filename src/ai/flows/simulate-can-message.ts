'use server';

/**
 * @fileOverview Simulates a CAN message based on sensor data using GenAI.
 *
 * - simulateCanMessage - A function that simulates the CAN message.
 * - SimulateCanMessageInput - The input type for the simulateCanMessage function.
 * - SimulateCanMessageOutput - The return type for the simulateCanMessage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SimulateCanMessageInputSchema = z.object({
  distance: z.number().describe('The distance to the obstacle in meters.'),
  angle: z.number().describe('The angle to the obstacle in degrees.'),
});
export type SimulateCanMessageInput = z.infer<typeof SimulateCanMessageInputSchema>;

const SimulateCanMessageOutputSchema = z.object({
  canMessage: z.string().describe('The simulated 8-byte CAN message in hex format.'),
});
export type SimulateCanMessageOutput = z.infer<typeof SimulateCanMessageOutputSchema>;

export async function simulateCanMessage(input: SimulateCanMessageInput): Promise<SimulateCanMessageOutput> {
  return simulateCanMessageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'simulateCanMessagePrompt',
  input: {schema: SimulateCanMessageInputSchema},
  output: {schema: SimulateCanMessageOutputSchema},
  prompt: `You are a CAN bus expert specializing in Brigade BS-9100T sensor data.

You will receive the distance in meters and the angle in degrees to an obstacle.
Based on the Brigade BS-9100T manual, simulate an 8-byte CAN message in hex format.

Distance: {{{distance}}} meters
Angle: {{{angle}}} degrees

CAN Message:`,
});

const simulateCanMessageFlow = ai.defineFlow(
  {
    name: 'simulateCanMessageFlow',
    inputSchema: SimulateCanMessageInputSchema,
    outputSchema: SimulateCanMessageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
