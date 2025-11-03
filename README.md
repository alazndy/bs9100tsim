
# Brigade BS-9100T Radar Sensor Simulator

This project is a web-based simulator for the Brigade BS-9100T radar sensor. It provides a visual interface to simulate object detection and generates corresponding CAN (Controller Area Network) bus messages based on the sensor's technical specifications. Additionally, it allows broadcasting these CAN messages to a physical serial port, enabling testing and integration with real-world hardware.

![Simulator Screenshot](https://i.imgur.com/example.png) *(Screenshot placeholder)*

---

## Features

- **Visual Sensor Simulation:** Interactively place an obstacle in the sensor's detection area by clicking.
- **Real-time Data Display:** View key metrics like distance, angle, and X/Y coordinates of the detected object.
- **Accurate CAN Message Generation:** Generates an 8-byte CAN message that conforms to the BS-9100T technical manual, accurately encoding polar and Cartesian coordinates, and status flags.
- **CAN Message Explanation:** Provides a byte-by-byte breakdown of the generated CAN message for easy understanding.
- **Serial Port Broadcasting:** Select an available COM port and broadcast the generated CAN messages at a rate of 20 messages per second (50ms interval) to interface with physical devices.

---

## Project Structure

Here is an overview of the key files and directories in the project:

```
/src
├── app/
│   └── page.tsx            # Main application page, contains the UI and simulation canvas.
├── components/
│   └── ui/                   # UI components (e.g., Card, Button) from shadcn/ui.
├── hooks/
│   └── use-toast.ts          # Hook for displaying toast notifications.
├── lib/
│   ├── can-simulation.ts   # Core logic for generating CAN messages from sensor data.
│   └── utils.ts              # Utility functions.
└── pages/
    └── api/
        └── serial.ts       # API endpoint for listing serial ports and writing data.
```

- **`src/app/page.tsx`**: The heart of the frontend. This file contains the main React component that renders the sensor visualization, data panels, and user controls. It manages the application state, including obstacle position, sensor data, and the generated CAN message.

- **`src/lib/can-simulation.ts`**: A server-side module responsible for the core logic of converting raw distance and angle data into a valid 8-byte CAN message string, following the detailed specifications of the BS-9100T sensor.

- **`src/pages/api/serial.ts`**: A Next.js API route that handles all serial port interactions. It has two main functions:
    - **GET**: Fetches and returns a list of available serial/COM ports on the server.
    - **POST**: Receives a CAN message and a target port, and writes the message to the specified serial port.

---

## Getting Started

Follow these steps to get the project running on your local machine.

### Prerequisites

- Node.js (v18.x or later)
- npm or yarn

### Installation & Running

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/alazndy/bs9100tsim.git
    cd bs9100tsim
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

4.  Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

---

## Available Scripts

- **`npm run dev`**: Starts the application in development mode.
- **`npm run build`**: Creates a production-ready build of the application.
- **`npm run start`**: Starts the production server (requires `build` to be run first).
- **`npm run lint`**: Lints the codebase for potential errors and style issues.

---

## Technical Details & Styling

- **Framework:** [Next.js](https://nextjs.org/) (React)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) with components from [shadcn/ui](https://ui.shadcn.com/).
- **CAN Message Logic:** The simulation adheres to the data definitions provided in the BS-9100T technical manual, including resolutions and offsets for polar/Cartesian coordinates.
- **Fonts:** `Inter` for body text and `Source Code Pro` for code/CAN messages.
- **Colors:** The UI uses a dark theme to create a focused, simulator-like environment.
  - **Primary:** `#003366` (Dark Blue)
  - **Accent:** `#00FFFF` (Cyan)
  - **Background:** `#222222` (Dark Gray)
