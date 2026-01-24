import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class StompService {
    constructor() {
        this.client = null;
        this.subscriptions = new Map();
        this.onConnectCallbacks = [];
        this.isConnected = false;
    }

    connect(token) {
        if (this.client && this.client.active) return;

        // Note: Backend endpoint is /ws as per WebSocketConfig.java
        // Using SockJS factory for better compatibility
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
        const rootUrl = baseUrl.endsWith('/api') ? baseUrl.slice(0, -4) : baseUrl;
        this.client = new Client({
            webSocketFactory: () => new SockJS(`${rootUrl}/ws`),
            connectHeaders: {
                Authorization: `Bearer ${token}`,
            },
            onConnect: () => {
                console.log('STOMP: Connected successfully');
                this.isConnected = true;
                this.onConnectCallbacks.forEach(cb => cb());
                this.onConnectCallbacks = []; // Clear queue
            },
            onDisconnect: () => {
                console.log('STOMP: Disconnected');
                this.isConnected = false;
            },
            onStompError: (frame) => {
                console.error('STOMP: Broker error', frame.headers['message']);
                console.error('STOMP: Additional details', frame.body);
            },
        });

        this.client.activate();
    }

    subscribe(destination, callback) {
        if (this.isConnected) {
            const sub = this.client.subscribe(destination, (message) => {
                try {
                    const body = JSON.parse(message.body);
                    callback(body);
                } catch (e) {
                    console.error('STOMP: Failed to parse message body', e);
                    callback(message.body);
                }
            });
            this.subscriptions.set(destination, sub);
            return sub;
        } else {
            console.log(`STOMP: Queueing subscription for ${destination}`);
            this.onConnectCallbacks.push(() => {
                const sub = this.client.subscribe(destination, (message) => {
                    try {
                        const body = JSON.parse(message.body);
                        callback(body);
                    } catch (e) {
                        console.error('STOMP: Failed to parse message body', e);
                        callback(message.body);
                    }
                });
                this.subscriptions.set(destination, sub);
            });
        }
    }

    unsubscribe(destination) {
        const sub = this.subscriptions.get(destination);
        if (sub) {
            sub.unsubscribe();
            this.subscriptions.delete(destination);
        }
    }

    disconnect() {
        if (this.client) {
            this.client.deactivate();
            this.client = null;
            this.isConnected = false;
            this.subscriptions.clear();
        }
    }
}

export const stompService = new StompService();
export default stompService;
