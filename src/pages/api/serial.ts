import { NextApiRequest, NextApiResponse } from 'next';
import { SerialPort } from 'serialport';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const ports = await SerialPort.list();
      res.status(200).json(ports);
    } catch (error) {
      console.error('Error listing serial ports:', error);
      res.status(500).json({ message: 'Error listing serial ports' });
    }
  } else if (req.method === 'POST') {
    const { port, canMessage } = req.body;

    if (!port || !canMessage) {
      return res.status(400).json({ message: 'Missing port or canMessage' });
    }

    const serialPort = new SerialPort({ path: port, baudRate: 9600 });

    serialPort.write(canMessage, (err) => {
      if (err) {
        console.error('Error writing to serial port:', err);
        return res.status(500).json({ message: 'Error writing to serial port' });
      }
      res.status(200).json({ message: 'Message sent' });
    });
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
