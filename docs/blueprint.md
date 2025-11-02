# **App Name**: Brigade BS-9100T Simulator

## Core Features:

- Graphical Interface: Create a Pygame window with a black background to simulate the sensor environment.
- Sensor and Detection Area: Draw a blue rectangle representing the sensor and a grey arc showing the detection area.
- Obstacle Placement: Allow users to click to place a red circle, simulating an obstacle within the sensor's range.
- Coordinate Conversion: Convert pixel coordinates of the obstacle into meter-based coordinates relative to the sensor.
- Sensor Data Calculation: Calculate the polar radius (distance) and polar angle of the obstacle relative to the sensor.
- CAN Message Simulation: Simulate an 8-byte CAN message based on the calculated sensor data, following the Brigade BS-9100T manual.
- Data Display: Display the calculated X/Y coordinates, distance, angle, and CAN message on the Pygame window and console for debugging.

## Style Guidelines:

- Primary color: Dark blue (#003366) to represent the sensor and technology.
- Background color: Dark gray (#222222) to simulate a dark testing environment with low saturation (15%).
- Accent color: Cyan (#00FFFF) to highlight important data and interactive elements.
- Body and headline font: 'Inter' sans-serif for clean and modern data display.
- Code font: 'Source Code Pro' for displaying CAN message hex values.
- Simple geometric shapes to represent the sensor, detection area, and obstacles.
- Clear separation of the sensor simulation area and the data display section within the Pygame window.