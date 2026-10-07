import http from "http";
import mongoose from "mongoose";
import { Server } from "socket.io";
import { app } from "./app";
import { env, allowedOrigins } from "./config/env";

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: allowedOrigins, credentials: true } });
app.set("io", io);
io.on("connection", (socket) => {
  // Rooms carry only aggregate counts, never phone numbers.
  socket.on("session:watch", (id: unknown) => { if (typeof id === "string" && id.length <= 20) socket.join(`session:${id}`); });
});
mongoose.connect(env.MONGODB_URI).then(() => server.listen(env.PORT, () => console.log(`API on :${env.PORT}`)))
  .catch((e) => { console.error(e); process.exit(1); });
