'use client';

import * as React from "react";
import { Radar, Info, Loader2, Usb, X, Power } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { simulateCanMessage } from "@/lib/can-simulation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";


// --- CONSTANTS ---
const SIMULATION_WIDTH = 800;
const SIMULATION_HEIGHT = 450;
const SENSOR_POSITION = { x: SIMULATION_WIDTH / 2, y: SIMULATION_HEIGHT - 20 };
const SENSOR_WIDTH = 80;
const SENSOR_HEIGHT = 20;

const DETECTION_RADIUS_METERS = 10;
const DETECTION_ANGLE_DEGREES = 140;
const PIXELS_PER_METER = (SIMULATION_WIDTH / 2) / (DETECTION_RADIUS_METERS * 1.2);
const DETECTION_RADIUS_PIXELS = DETECTION_RADIUS_METERS * PIXELS_PER_METER;

// --- TYPES ---
type ObstaclePixelPosition = { x: number; y: number } | null;
type SensorData = {
  x: number;
  y: number;
  distance: number;
  angle: number;
};

// --- MAIN PAGE COMPONENT ---
export default function SimulatorPage() {
  const [obstaclePixelPos, setObstaclePixelPos] = React.useState<ObstaclePixelPosition>(null);
  const [sensorData, setSensorData] = React.useState<SensorData | null>(null);
  const [canMessage, setCanMessage] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isClient, setIsClient] = React.useState(false);
  const svgRef = React.useRef<SVGSVGElement>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSimulation = async (data: SensorData) => {
    setIsLoading(true);
    try {
      const canResult = await simulateCanMessage({
        distance: data.distance,
        angle: data.angle,
      });

      if (!canResult || !canResult.canMessage) {
        throw new Error("Failed to simulate CAN message.");
      }
      setCanMessage(canResult.canMessage);

    } catch (error) {
      console.error("Simulation failed:", error);
      toast({
        variant: "destructive",
        title: "Simulation Error",
        description: "An error occurred during the simulation. Please try again.",
      });
      // Reset state on error
      setCanMessage(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  const getArcPath = () => {
    const angleRad = (DETECTION_ANGLE_DEGREES / 2) * (Math.PI / 180);
    const startX = SENSOR_POSITION.x - DETECTION_RADIUS_PIXELS * Math.sin(angleRad);
    const endX = SENSOR_POSITION.x + DETECTION_RADIUS_PIXELS * Math.sin(angleRad);
    const y = SENSOR_POSITION.y - DETECTION_RADIUS_PIXELS * Math.cos(angleRad);
    const largeArcFlag = DETECTION_ANGLE_DEGREES <= 180 ? "0" : "1";
    
    return `M ${startX},${y} A ${DETECTION_RADIUS_PIXELS},${DETECTION_RADIUS_PIXELS} 0 ${largeArcFlag} 1 ${endX},${y} L ${SENSOR_POSITION.x},${SENSOR_POSITION.y} Z`;
  };

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isLoading || !svgRef.current) return;

    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());

    const dx = svgP.x - SENSOR_POSITION.x;
    const dy = SENSOR_POSITION.y - svgP.y;
    const distPx = Math.sqrt(dx * dx + dy * dy);

    // Angle in degrees from Y-axis (0 = forward)
    const angleDeg = Math.atan2(dx, dy) * (180 / Math.PI);
    
    if (distPx <= DETECTION_RADIUS_PIXELS && Math.abs(angleDeg) <= DETECTION_ANGLE_DEGREES / 2 && svgP.y < SENSOR_POSITION.y) {
      setObstaclePixelPos({ x: svgP.x, y: svgP.y });
      
      const x_m = dx / PIXELS_PER_METER;
      const y_m = dy / PIXELS_PER_METER;
      const distance_m = distPx / PIXELS_PER_METER;
      
      const newSensorData = { x: x_m, y: y_m, distance: distance_m, angle: angleDeg };
      setSensorData(newSensorData);
      handleSimulation(newSensorData);
    } else {
      // Clicked outside detection area
      setObstaclePixelPos(null);
      setSensorData(null);
      setCanMessage(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center gap-3 border-b px-4 py-3 sm:px-6">
        <Radar className="h-7 w-7 text-primary" />
        <h1 className="font-headline text-xl font-semibold sm:text-2xl">
          Brigade BS-9100T Simulator
        </h1>
      </header>
      <main className="flex flex-1 flex-col items-start gap-8 p-4 sm:p-6 lg:flex-row">
        <div className="w-full flex-grow lg:w-2/3">
          <Card className="overflow-hidden">
            <CardHeader>
                <CardTitle>Sensor Simulation</CardTitle>
                <CardDescription>Click within the gray detection area to place an obstacle.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="relative aspect-[16/9] w-full cursor-crosshair overflow-hidden rounded-md border bg-card">
                {isClient && <svg
                    ref={svgRef}
                    viewBox={`0 0 ${SIMULATION_WIDTH} ${SIMULATION_HEIGHT}`}
                    onClick={handleClick}
                    className="h-full w-full"
                  >
                    {/* Detection Area */}
                    <path
                      d={getArcPath()}
                      className="fill-muted/50"
                    />
                    
                    {/* Grid lines */}
                    {[...Array(Math.floor(DETECTION_RADIUS_METERS / 2))].map((_, i) => {
                      const radius = (i + 1) * 2 * PIXELS_PER_METER;
                      const angleRad = (DETECTION_ANGLE_DEGREES / 2) * (Math.PI / 180);
                      const startX = SENSOR_POSITION.x - radius * Math.sin(angleRad);
                      const endX = SENSOR_POSITION.x + radius * Math.sin(angleRad);
                      const y = SENSOR_POSITION.y - radius * Math.cos(angleRad);
                      return (
                        <path
                          key={`ring-${i}`}
                          d={`M ${startX},${y} A ${radius},${radius} 0 0 1 ${endX},${y}`}
                          fill="none"
                          stroke="hsl(var(--border))"
                          strokeWidth="1"
                          strokeDasharray="4 4"
                          opacity="0.5"
                        />
                      )
                    })}
                     
                    {/* Sensor */}
                    <rect
                      x={SENSOR_POSITION.x - SENSOR_WIDTH / 2}
                      y={SENSOR_POSITION.y - SENSOR_HEIGHT}
                      width={SENSOR_WIDTH}
                      height={SENSOR_HEIGHT}
                      rx="4"
                      className="fill-primary"
                    />
                    <text x={SENSOR_POSITION.x} y={SENSOR_POSITION.y - 7} textAnchor="middle" fontSize="10" className="fill-primary-foreground font-sans">SENSOR</text>

                    {/* Obstacle */}
                    {obstaclePixelPos && (
                      <circle
                        cx={obstaclePixelPos.x}
                        cy={obstaclePixelPos.y}
                        r="8"
                        className="fill-destructive"
                      />
                    )}
                  </svg>}
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                      <Loader2 className="h-10 w-10 animate-spin text-accent" />
                    </div>
                  )}
                </div>
            </CardContent>
          </Card>
        </div>
        <aside className="w-full lg:w-1/3">
            <DataPanel
                isLoading={isLoading}
                sensorData={sensorData}
                canMessage={canMessage}
            />
        </aside>
      </main>
    </div>
  );
}


// --- SUB-COMPONENTS ---

interface DataPanelProps {
    isLoading: boolean;
    sensorData: SensorData | null;
    canMessage: string | null;
}

function DataPanel({ isLoading, sensorData, canMessage }: DataPanelProps) {
    const hasData = sensorData && canMessage;

    if (!hasData && !isLoading) {
        return (
            <Card className="flex h-full min-h-[400px] items-center justify-center border-dashed">
                <div className="text-center text-muted-foreground">
                    <Info className="mx-auto mb-2 h-8 w-8" />
                    <p className="font-semibold">Awaiting Input</p>
                    <p className="text-sm">Click in the simulation area to generate data.</p>
                </div>
            </Card>
        );
    }

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Sensor Readings</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <DataItem label="X Coordinate" value={sensorData?.x} unit="m" isLoading={isLoading} />
                        <DataItem label="Y Coordinate" value={sensorData?.y} unit="m"isLoading={isLoading} />
                        <DataItem label="Distance" value={sensorData?.distance} unit="m" isLoading={isLoading} />
                        <DataItem label="Angle" value={sensorData?.angle} unit="°" isLoading={isLoading} />
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>CAN Bus Message</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <Skeleton className="h-8 w-full" />
                    ) : (
                        <p className="font-code text-lg tracking-widest text-accent sm:text-xl">
                            {canMessage || "N/A"}
                        </p>
                    )}
                </CardContent>
            </Card>
            <SerialBroadcastPanel canMessage={canMessage} />
            {canMessage && <CanExplanationPanel canMessage={canMessage} />}
        </div>
    );
}

interface DataItemProps {
    label: string;
    value: number | undefined | null;
    unit: string;
    isLoading: boolean;
}

function DataItem({ label, value, unit, isLoading }: DataItemProps) {
    return (
        <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            {isLoading ? <Skeleton className="h-6 w-20"/> : (
                <p className="text-lg font-semibold">
                    {value != null ? value.toFixed(2) : '---'}
                    <span className="text-sm font-normal text-muted-foreground"> {unit}</span>
                </p>
            )}
        </div>
    )
}

const byteExplanations = [
    { title: "Polar Radius", description: "Line of sight distance. Resolution: 0.25m, Offset: 0." },
    { title: "Polar Angle", description: "Angle to obstacle. Offset: -128 degrees." },
    { title: "X-Coordinate", description: "Forward distance. Resolution: 0.25m, Offset: 0." },
    { title: "Y-Coordinate", description: "Lateral distance. Resolution: 0.25m, Offset: -128." },
    { title: "Relative Speed", description: "Constant value for simulation." },
    { title: "Signal Power", description: "Signal strength (dB). Constant value for simulation." },
    { title: "Object Info", description: "Object ID, Status, Trigger. Constant value for simulation." },
    { title: "Status Flags", description: "Sensor errors and flags. Constant value for simulation." },
];

interface CanExplanationPanelProps {
    canMessage: string;
}

function CanExplanationPanel({ canMessage }: CanExplanationPanelProps) {
    const bytes = canMessage.split(' ');

    return (
        <Card>
            <CardHeader>
                <CardTitle>CAN Message Explanation</CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-3">
                    {bytes.map((byte, index) => (
                        <li key={index} className="flex items-start gap-3">
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-muted font-code text-sm font-semibold">{byte}</div>
                            <div>
                                <p className="font-semibold">Byte {index}: <span className="font-normal">{byteExplanations[index].title}</span></p>
                                <p className="text-xs text-muted-foreground">{byteExplanations[index].description}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}


interface SerialBroadcastPanelProps {
  canMessage: string | null;
}

function SerialBroadcastPanel({ canMessage }: SerialBroadcastPanelProps) {
  const [comPorts, setComPorts] = React.useState<any[]>([]);
  const [selectedPort, setSelectedPort] = React.useState<string | null>(null);
  const [isBroadcasting, setIsBroadcasting] = React.useState(false);
  const [intervalId, setIntervalId] = React.useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    async function fetchComPorts() {
      try {
        const response = await fetch('/api/serial');
        if (!response.ok) {
          throw new Error('Failed to fetch COM ports');
        }
        const ports = await response.json();
        setComPorts(ports);
      } catch (error) {
        console.error(error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not fetch COM ports. Make sure the server is running.",
        });
      }
    }
    fetchComPorts();
  }, [toast]);

  const startBroadcasting = () => {
    if (!selectedPort || !canMessage) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a COM port and ensure a CAN message is generated.",
      });
      return;
    }

    setIsBroadcasting(true);
    const id = setInterval(async () => {
      try {
        await fetch('/api/serial', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ port: selectedPort, canMessage }),
        });
      } catch (error) {
        console.error("Error broadcasting CAN message:", error);
        toast({
          variant: "destructive",
          title: "Broadcast Error",
          description: "Failed to send CAN message. Check the console for details.",
        });
        stopBroadcasting(); 
      }
    }, 50); // 20 times per second
    setIntervalId(id);
  };

  const stopBroadcasting = () => {
    if (intervalId) {
      clearInterval(intervalId);
    }
    setIsBroadcasting(false);
    setIntervalId(null);
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Serial Port Broadcast</CardTitle>
        <CardDescription>Transmit CAN messages to a physical device.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
            <Usb className="h-5 w-5 text-muted-foreground"/>
            <Select onValueChange={setSelectedPort} disabled={isBroadcasting}>
                <SelectTrigger>
                    <SelectValue placeholder="Select a COM port..." />
                </SelectTrigger>
                <SelectContent>
                    {comPorts.map((port) => (
                        <SelectItem key={port.path} value={port.path}>
                            {port.path} {port.manufacturer && `(${port.manufacturer})`}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        
        <div className="flex items-center justify-between">
            {isBroadcasting ? (
                <Button onClick={stopBroadcasting} variant="destructive" className="w-full">
                    <X className="mr-2 h-4 w-4" /> Stop Broadcasting
                </Button>
            ) : (
                <Button onClick={startBroadcasting} disabled={!selectedPort || !canMessage} className="w-full">
                    <Power className="mr-2 h-4 w-4" /> Start Broadcasting
                </Button>
            )}
        </div>
         {isBroadcasting && selectedPort && (
            <div className="flex items-center gap-2 text-sm text-green-500">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                Broadcasting to {selectedPort}
            </div>
        )}
      </CardContent>
    </Card>
  );
}
