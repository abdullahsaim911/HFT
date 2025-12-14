import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

type WsMessage = any;

type WsContextValue = {
  connected: boolean;
  lastSeen: number | null;
  addListener: (fn: (msg: WsMessage) => void) => () => void;
  wsUrl: string;
};

const WsContext = createContext<WsContextValue | null>(null);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [lastSeen, setLastSeen] = useState<number | null>(null);
  const listenersRef = useRef(new Set<(m: WsMessage) => void>());
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef(0);

  const wsProtocol = (location.protocol === 'https:' ? 'wss' : 'ws');
  const defaultUrl = (import.meta.env.VITE_WS_URL) || `${wsProtocol}://${location.hostname}:8000/ws/metrics`;
  const wsUrl = defaultUrl;

  useEffect(() => {
    let mounted = true;

    function connect() {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectRef.current = 0;
        if (!mounted) return;
        setConnected(true);
      };

      ws.onmessage = (ev) => {
        if (!mounted) return;
        setLastSeen(Date.now());
        try {
          const parsed = JSON.parse(ev.data);
          listenersRef.current.forEach(fn => {
            try { fn(parsed); } catch (e) { console.warn('ws listener error', e); }
          });
        } catch (err) {
          console.warn('ws parse error', err);
        }
      };

      ws.onclose = () => {
        if (!mounted) return;
        setConnected(false);
        // backoff reconnect
        reconnectRef.current = Math.min(30000, (reconnectRef.current || 1000) * 2 || 1000);
        setTimeout(() => connect(), reconnectRef.current || 1000);
      };

      ws.onerror = (e) => {
        console.error('WebSocket error', e);
        try { ws.close(); } catch (e) {}
      };
    }

    connect();

    return () => {
      mounted = false;
      try { wsRef.current?.close(); } catch (e) {}
      wsRef.current = null;
    };
  }, [wsUrl]);

  const addListener = (fn: (m: WsMessage) => void) => {
    listenersRef.current.add(fn);
    return () => listenersRef.current.delete(fn);
  };

  return (
    <WsContext.Provider value={{ connected, lastSeen, addListener, wsUrl }}>
      {children}
    </WsContext.Provider>
  );
}

export function useWsConnection() {
  const ctx = useContext(WsContext);
  if (!ctx) return { connected: false, lastSeen: null, addListener: () => () => {}, wsUrl: '' };
  return ctx;
}

export function useWsMessages(handler: (msg: WsMessage) => void) {
  const ctx = useContext(WsContext);
  useEffect(() => {
    if (!ctx) return;
    const unsub = ctx.addListener(handler);
    return unsub;
  }, [ctx, handler]);
}
