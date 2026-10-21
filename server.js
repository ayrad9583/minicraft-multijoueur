/**
 * Mini Craft Multiplayer Server
 * - Serve the static game
 * - WebSocket (Socket.io) for real-time sync: players, chat, block edits
 * - Shared world seed + authoritative block changes
 */
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const PORT = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
  maxHttpBufferSize: 1e6,
});

app.use(express.static(path.join(__dirname, "public")));

// ---------- World state (in-memory; resets on server restart) ----------
const WORLD_SEED = Math.floor(Math.random() * 1e9);
const rooms = new Map(); // roomId -> { players: Map, blocks: Map, seed }

function getRoom(id) {
  if (!rooms.has(id)) {
    rooms.set(id, {
      players: new Map(),
      blocks: new Map(), // key "x,y,z" -> blockId
      seed: WORLD_SEED,
      chat: [],
    });
  }
  return rooms.get(id);
}

function blockKey(x, y, z) {
  return x + "," + y + "," + z;
}

io.on("connection", (socket) => {
  let roomId = null;
  let playerId = socket.id;
  let playerName = "Joueur";

  socket.on("join", (data) => {
    roomId = (data && data.room) || "default";
    playerName = (data && data.name && String(data.name).slice(0, 20)) || "Joueur";
    const room = getRoom(roomId);
    socket.join(roomId);

    room.players.set(playerId, {
      id: playerId,
      name: playerName,
      x: 0,
      y: 80,
      z: 0,
      yaw: 0,
      pitch: 0,
      dim: "overworld",
      mode: "creatif",
    });

    // Send world seed + existing block overrides + current players
    const players = [];
    room.players.forEach((p) => {
      if (p.id !== playerId) players.push(p);
    });
    const blockList = [];
    room.blocks.forEach((id, k) => {
      const [x, y, z] = k.split(",").map(Number);
      blockList.push({ x, y, z, id });
    });

    socket.emit("welcome", {
      id: playerId,
      seed: room.seed,
      blocks: blockList,
      players,
      name: playerName,
    });

    socket.to(roomId).emit("player_join", {
      id: playerId,
      name: playerName,
      x: 0,
      y: 80,
      z: 0,
      yaw: 0,
      pitch: 0,
      dim: "overworld",
    });

    console.log(`[${roomId}] ${playerName} (${playerId}) joined`);
  });

  socket.on("move", (data) => {
    if (!roomId) return;
    const room = getRoom(roomId);
    const p = room.players.get(playerId);
    if (!p || !data) return;
    p.x = data.x;
    p.y = data.y;
    p.z = data.z;
    p.yaw = data.yaw;
    p.pitch = data.pitch;
    p.dim = data.dim || p.dim;
    socket.to(roomId).emit("player_move", {
      id: playerId,
      x: p.x,
      y: p.y,
      z: p.z,
      yaw: p.yaw,
      pitch: p.pitch,
      dim: p.dim,
    });
  });

  socket.on("set_block", (data) => {
    if (!roomId || !data) return;
    const room = getRoom(roomId);
    const k = blockKey(data.x, data.y, data.z);
    if (data.id === 0) room.blocks.delete(k);
    else room.blocks.set(k, data.id);
    io.to(roomId).emit("set_block", {
      x: data.x,
      y: data.y,
      z: data.z,
      id: data.id,
      by: playerId,
    });
  });

  socket.on("chat", (msg) => {
    if (!roomId || !msg) return;
    const text = String(msg).slice(0, 120);
    const payload = { name: playerName, text, t: Date.now() };
    io.to(roomId).emit("chat", payload);
  });

  socket.on("disconnect", () => {
    if (!roomId) return;
    const room = getRoom(roomId);
    room.players.delete(playerId);
    socket.to(roomId).emit("player_leave", { id: playerId });
    console.log(`[${roomId}] ${playerName} left`);
    if (room.players.size === 0) {
      // keep room for a while or clear — keep seed/blocks for rejoins
    }
  });
});

server.listen(PORT, () => {
  console.log(`Mini Craft Multiplayer on port ${PORT}`);
  console.log(`World seed: ${WORLD_SEED}`);
});
