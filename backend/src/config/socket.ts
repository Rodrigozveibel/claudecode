import { Server as SocketIOServer } from "socket.io";
import type { Server as HttpServer } from "http";
import { env } from "./env";

let io: SocketIOServer | null = null;

export function initSocket(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.frontendUrl,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`[socket] client connected: ${socket.id}`);

    socket.on("join:conversation", (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on("leave:conversation", (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on("disconnect", () => {
      console.log(`[socket] client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error("Socket.io not initialized. Call initSocket() first.");
  }
  return io;
}

/** Safe emit that won't throw if socket isn't ready yet (e.g. during seed). */
export function emit(event: string, payload: unknown): void {
  if (io) {
    io.emit(event, payload);
  }
}

export function emitToConversation(
  conversationId: string,
  event: string,
  payload: unknown,
): void {
  if (io) {
    io.to(`conversation:${conversationId}`).emit(event, payload);
    io.emit(event, payload); // also broadcast to dashboard list views
  }
}
