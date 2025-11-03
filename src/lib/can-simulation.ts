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

  // Calculations are based on the Brigade BS-9100T manual.

  // Byte 0: Polar Radius (Line of sight distance)
  // Resolution: 0.25m, Offset: 0. Byte = Value / Resolution.
  const polarRadiusByte = distance / 0.25;

  // Byte 1: Polar Angle
  // Range: -70 to +70 degrees. Byte Value = Physical Value + 128.
  const polarAngleByte = angle + 128;

  // Byte 2: Co-ordinates X (Forward distance)
  // Resolution: 0.25m, Offset: 0. X = distance * cos(angle).
  const xPhys = distance * Math.cos(angleRad);
  const xCoordByte = xPhys / 0.25;

  // Byte 3: Co-ordinates Y (Lateral distance)
  // Range: -8m to +8m. Resolution: 0.25m. Byte = (Value / Res) + 128.
  const yPhys = distance * Math.sin(angleRad);
  const yCoordByte = (yPhys / 0.25) + 128;

  // Byte 4: Relative Speed.
  // Simulating a stationary object, so speed is 0. Byte = (0 / 0.5) + 128 = 128 (0x80).
  const relativeSpeed = 0x80;

  // Byte 5: Reflected Signal Level (dB).
  // Using a constant realistic value of 80dB.
  const signalPower = 0x50;

  // Byte 6: Object Info
  // Bits 7-5: Trigger Event (1 = Object detection) -> 001
  // Bit 4: Appearance Status (1 = New object) -> 1
  // Bits 3-0: Object ID (0 = Closest object) -> 0000
  // Result: 0011 0000 = 0x30
  const objectInfo = 0x30;

  // Byte 7: Status Flags
  // Bit 1: Detection Flag (0 for detection)
  // Other bits are for sensor errors (all 0 for this simulation).
  // 0x02 indicates a valid detection.
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
