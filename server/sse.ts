import type { Response } from 'express';

interface Client {
  id: string;
  res: Response;
}

class SSEManager {
  private clients: Map<string, Client> = new Map();

  addClient(id: string, res: Response) {
    this.clients.set(id, { id, res });

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    res.write(`data: ${JSON.stringify({ type: 'connected', clientId: id, timestamp: new Date().toISOString() })}\n\n`);

    const heartbeat = setInterval(() => {
      try {
        res.write(`: heartbeat\n\n`);
      } catch {
        clearInterval(heartbeat);
        this.removeClient(id);
      }
    }, 20000);

    res.on('close', () => {
      clearInterval(heartbeat);
      this.removeClient(id);
    });
  }

  removeClient(id: string) {
    this.clients.delete(id);
  }

  broadcast(event: string, payload: unknown) {
    const data = JSON.stringify({ event, data: payload, timestamp: new Date().toISOString() });
    for (const [id, client] of this.clients.entries()) {
      try {
        client.res.write(`data: ${data}\n\n`);
      } catch {
        this.removeClient(id);
      }
    }
  }

  getClientCount() {
    return this.clients.size;
  }
}

export const sseManager = new SSEManager();
