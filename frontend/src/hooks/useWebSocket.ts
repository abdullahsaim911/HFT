import { useEffect, useRef } from 'react';

type MessageHandler = (data: any) => void;

export function useWebSocket(url: string, onMessage: MessageHandler) {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!url) return;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.debug('WebSocket connected', url);
    };

    ws.onmessage = (ev) => {
      try {
        const parsed = JSON.parse(ev.data);
        onMessage(parsed);
      } catch (err) {
        console.warn('ws parse error', err);
      }
    };

    ws.onclose = () => {
      console.debug('WebSocket closed', url);
      // automatic reconnect after delay
      setTimeout(() => {
        if (wsRef.current === ws) {
          wsRef.current = null;
        }
      }, 1000);
    };

    ws.onerror = (e) => {
      console.error('WebSocket error', e);
    };

    return () => {
      try { ws.close(); } catch (e) {}
      wsRef.current = null;
    };
  }, [url, onMessage]);

  return wsRef;
}
