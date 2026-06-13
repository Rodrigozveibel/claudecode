"use client";

import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

let sharedSocket: Socket | null = null;
let refCount = 0;

function getSocket(): Socket {
  if (!sharedSocket) {
    sharedSocket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });
  }
  return sharedSocket;
}

/**
 * Returns the single shared Socket.io connection.
 * Components subscribe to events via their own useEffect.
 */
export function useSocket(): Socket {
  const [socket] = useState<Socket>(() => getSocket());

  useEffect(() => {
    refCount += 1;
    if (!socket.connected) socket.connect();

    return () => {
      refCount -= 1;
      // Keep the connection alive while any component still uses it.
      if (refCount <= 0 && sharedSocket) {
        sharedSocket.disconnect();
        sharedSocket = null;
        refCount = 0;
      }
    };
  }, [socket]);

  return socket;
}
