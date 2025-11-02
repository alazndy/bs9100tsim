'use server';

import {z} from 'zod';

const SimulateCanMessageInputSchema = z.object({
  distance: z.number().describe('The distance to the obstacle in meters.'),
  angle: z.number().describe('The angle to the obstacle in degrees.'),
});
export type SimulateCanMessageInput = z.infer<typeof SimulateCanMessageInputSchema>;

const SimulateCanMessageOutputSchema = z.object({
  canMessage: z.string().describe('The simulated 8-byte CAN message in hex format.'),
});
export type SimulateCanMessageOutput = z.infer<typeof SimulateCanMessageOutputSchema>;

// Helper to convert a number to a 2-character hex string, ensuring it's a byte.
function toHex(value: number): string {
  const byte = Math.max(0, Math.min(255, Math.round(value)));
  return byte.toString(16).padStart(2, '0').toUpperCase();
}

/**
 * Simulates a CAN message directly from sensor data based on the Brigade BS-9100T manual.
 * @param input The sensor data (distance and angle).
 * @returns A promise that resolves to the simulated CAN message.
 */
export async function simulateCanMessage(
  input: SimulateCanMessageInput
): Promise<SimulateCanMessageOutput> {
  const {distance, angle} = input;

  // Convert angle to radians for trigonometric functions
  const angleRad = (angle * Math.PI) / 180;

  // Calculations are based on the Brigade BS-9100T manual, section 5.7.

  // Byte 0: Polar Radius (Line of sight distance)
  // Resolution: 0.25m, Offset: 0. Byte = Value / Resolution.
  const polarRadiusByte = distance / 0.25;

  // Byte 1: Polar Angle
  // Physical Value = (Byte Value - 128). So, Byte Value = Physical Value + 128.
  const polarAngleByte = angle + 128;

  // Byte 2: Co-ordinates X (Forward distance)
  // Resolution: 0.25m, Offset: 0. X = distance * cos(angle).
  const xPhys = distance * Math.cos(angleRad);
  const xCoordByte = xPhys / 0.25;

  // Byte 3: Co-ordinates Y (Lateral distance)
  // Resolution: 0.25m, Offset: -128. Y = distance * sin(angle).
  // Byte = (Physical Value / Resolution) + 128.
  const yPhys = distance * Math.sin(angleRad);
  const yCoordByte = (yPhys / 0.25) + 128;

  // Byte 4: Relative Speed.
  // For this simulation, a constant value is used.
  const relativeSpeed = 0x8a;

  // Byte 5: Signal Power (dB).
  // For this simulation, a constant value is used.
  const signalPower = 0x32;

  // Byte 6: Object ID, Appearance Status, and Trigger Event.
  // For this simulation, constant values are used.
  const objectInfo = 0x0a;

  // Byte 7: Sensor Errors, Identification Flag, and Detection Flag.
  // For this simulation, constant values are used.
  const statusFlags = 0x02;

  const canMessage = [
    toHex(polarRadiusByte),
    toHex(polarAngleByte),
    toHex(xCoordByte),
    toHex(yCoordByte),
    toHex(relativeSpeed),
    toHex(signalPower),
    toHex(objectInfo),
    toHex(statusFlags),
  ].join(' ');

  return {canMessage};
}
