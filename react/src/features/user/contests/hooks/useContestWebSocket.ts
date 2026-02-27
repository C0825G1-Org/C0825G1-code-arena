import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
// Vite can pick a Node-targeted entry for sockjs-client (uses `global`).
// Import the browser bundle explicitly to avoid "global is not defined".
import SockJS from 'sockjs-client/dist/sockjs';

export const useContestWebSocket = (onContestUpdate: (contestId: number, status: string) => void) => {
    const callbackRef = useRef(onContestUpdate);

    // Update ref when callback changes
    useEffect(() => {
        callbackRef.current = onContestUpdate;
    }, [onContestUpdate]);

    useEffect(() => {
        // Init STOMP Client
        const stompClient = new Client({
            // Backend registers SockJS endpoint at /ws (withSockJS), so use SockJS client.
            webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                console.log('Connected to WS!');
                stompClient.subscribe('/topic/contests', (message) => {
                    if (message.body) {
                        try {
                            const data = JSON.parse(message.body);
                            if (data.contestId && data.status) {
                                // Always call the latest callback via ref
                                callbackRef.current(data.contestId, data.status);
                            }
                        } catch (err) {
                            console.error("Error parsing WS message: ", err);
                        }
                    }
                });
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
            },
        });

        stompClient.activate();

        return () => {
            if (stompClient.active) {
                stompClient.deactivate();
            }
        };
    }, []); // Establish connection only once per component mount
};
