import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';

/**
 * HTTP transport that sends JSON-RPC requests and parses SSE-formatted responses.
 * Used by MCP servers that return Server-Sent Events format from regular HTTP POST requests.
 */
export class HTTPSSETransport implements Transport {
    private url: string;
    private headers: Record<string, string>;
    private nextId = 1;
    private messageHandler: ((message: JSONRPCMessage) => void) | null = null;
    private errorHandler: ((error: Error) => void) | null = null;
    private closeHandler: (() => void) | null = null;

    constructor(url: string, headers: Record<string, string> = {}) {
        this.url = url;
        this.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream',
            ...headers
        };
    }

    async start(): Promise<void> {
        // Initialize connection with a simple request
        const response = await fetch(this.url, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'initialize',
                params: {
                    protocolVersion: '2024-11-05',
                    capabilities: {
                        tools: {}
                    },
                    clientInfo: {
                        name: 'kit-mcp-client',
                        version: '1.0.0'
                    }
                },
                id: this.nextId++
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Parse SSE-formatted response
        const text = await response.text();
        const message = this.parseSSEResponse(text);
        if (this.messageHandler && message) {
            this.messageHandler(message);
        }
    }

    async send(message: JSONRPCMessage): Promise<void> {
        const response = await fetch(this.url, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(message)
        });

        if (!response.ok) {
            const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
            if (this.errorHandler) {
                this.errorHandler(error);
            }
            throw error;
        }

        // Parse SSE-formatted response
        const text = await response.text();
        const parsedMessage = this.parseSSEResponse(text);
        if (this.messageHandler && parsedMessage) {
            this.messageHandler(parsedMessage);
        }
    }

    private parseSSEResponse(text: string): JSONRPCMessage | null {
        // Extract JSON from SSE format
        const lines = text.trim().split('\n');
        for (const line of lines) {
            if (line.startsWith('data: ')) {
                try {
                    return JSON.parse(line.slice(6));
                } catch (e) {
                    console.error('Failed to parse SSE data:', e);
                }
            }
        }
        return null;
    }

    async close(): Promise<void> {
        if (this.closeHandler) {
            this.closeHandler();
        }
    }

    set onmessage(handler: (message: JSONRPCMessage) => void) {
        this.messageHandler = handler;
    }

    set onerror(handler: (error: Error) => void) {
        this.errorHandler = handler;
    }

    set onclose(handler: () => void) {
        this.closeHandler = handler;
    }
}