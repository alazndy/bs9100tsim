'use server';

/**
 * @fileOverview Generates an explanation of the sensor data and CAN message using GenAI.
 *
 * - generateSensorDataExplanation - A function that generates the explanation.
 * - GenerateSensorDataExplanationInput - The input type for the generateSensorDataExplanation function.
 * - GenerateSensorDataExplanationOutput - The return type for the generateSensorDataExplanation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSensorDataExplanationInputSchema = z.object({
  x: z.number().describe('X coordinate of the obstacle in meters.'),
  y: z.number().describe('Y coordinate of the obstacle in meters.'),
  distance: z.number().describe('Distance of the obstacle from the sensor in meters.'),
  angle: z.number().describe('Angle of the obstacle relative to the sensor in degrees.'),
  canMessage: z.string().describe('The simulated CAN message.'),
});

export type GenerateSensorDataExplanationInput = z.infer<
  typeof GenerateSensorDataExplanationInputSchema
>;

const GenerateSensorDataExplanationOutputSchema = z.object({
  explanation: z.string().describe('Explanation of the sensor data and CAN message.'),
});

export type GenerateSensorDataExplanationOutput = z.infer<
  typeof GenerateSensorDataExplanationOutputSchema
>;

export async function generateSensorDataExplanation(
  input: GenerateSensorDataExplanationInput
): Promise<GenerateSensorDataExplanationOutput> {
  return generateSensorDataExplanationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSensorDataExplanationPrompt',
  input: {schema: GenerateSensorDataExplanationInputSchema},
  output: {schema: GenerateSensorDataExplanationOutputSchema},
  prompt: `You are an AI expert in interpreting sensor data from the Brigade BS-9100T sensor.

  Based on the following sensor data and the generated CAN message, provide a concise explanation of what the data means in terms of object detection and proximity.

  X Coordinate: {{x}} meters
  Y Coordinate: {{y}} meters
  Distance: {{distance}} meters
  Angle: {{angle}} degrees
  CAN Message: {{canMessage}}

  Explanation:`,
});

const generateSensorDataExplanationFlow = ai.defineFlow(
  {
    name: 'generateSensorDataExplanationFlow',
    inputSchema: GenerateSensorDataExplanationInputSchema,
    outputSchema: GenerateSensorDataExplanationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
