
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";
  import { WebSocketProvider } from './hooks/useWebSocketManager';

  createRoot(document.getElementById("root")!).render(
    <WebSocketProvider>
      <App />
    </WebSocketProvider>
  );
  