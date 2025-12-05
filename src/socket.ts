
import { Server as IOServer } from "socket.io";

let io: IOServer | null = null;

export function initSocket(server: any) {
  io = new IOServer(server, {
    cors: { origin: "*" }, 
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("join_ride_room", (rideId: string) => {
      const room = `ride_${rideId}`;
      socket.join(room);
      console.log(`Socket ${socket.id} joined room ${room}`);
    });

    socket.on("driver_location", (payload: { rideId: string; lat: number; lng: number }) => {
      const { rideId, lat, lng } = payload;
      const room = `ride_${rideId}`;
      console.log(`Received location for ${room}:`, lat, lng);

    
      io?.to(room).emit("driver_location_update", { lat, lng, ts: Date.now() });
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}
