import { Server } from "socket.io";
import dotenv from "dotenv";
dotenv.config();
 
export const createSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.VITE_FRONTEND_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });
 
  // Track active users per workspace: Map<workspaceId, Map<socketId, userInfo>>
  const workspaceUsers = new Map();
 
  io.on("connection", (socket) => {
    const { workspaceId, userId, userName, userType } = socket.handshake.query;
 
    if (!workspaceId || !userId) {
      socket.disconnect();
      return;
    }
 
    // ── Join room
    socket.join(workspaceId);
 
    // Register user in the workspace map
    if (!workspaceUsers.has(workspaceId)) {
      workspaceUsers.set(workspaceId, new Map());
    }
    workspaceUsers.get(workspaceId).set(socket.id, {
      socketId: socket.id,
      userId,
      userName,
      userType,
    });
 
    // Broadcast updated user list to everyone in the room
    const broadcastUsers = () => {
      const users = Array.from(
        workspaceUsers.get(workspaceId)?.values() ?? []
      );
      io.to(workspaceId).emit("active-users", users);
    };
 
    broadcastUsers();
    console.log(`[Socket] ${userName} (${userType}) joined workspace ${workspaceId}`);
 
    // ── Canvas updates
    // Client emits this whenever Excalidraw's onChange fires
    socket.on("canvas-update", (data) => {
      // Broadcast to everyone ELSE in the room (not back to sender)
      socket.to(workspaceId).emit("canvas-update", {
        userId: data.userId,
        userName,
        userType,
        elements: data.elements,
        appState: data.appState,
      });
    });
 
    // ── Cursor position (optional live cursors)
    socket.on("cursor-move", (data) => {
      socket.to(workspaceId).emit("cursor-move", {
        userId: data.userId,
        userName,
        userType,
        x: data.x,
        y: data.y,
      });
    });
 
    // ── Disconnect
    socket.on("disconnect", () => {
      workspaceUsers.get(workspaceId)?.delete(socket.id);
      if (workspaceUsers.get(workspaceId)?.size === 0) {
        workspaceUsers.delete(workspaceId);
      }
      broadcastUsers();
      console.log(`[Socket] ${userName} left workspace ${workspaceId}`);
    });
  });
 
  return io;
};