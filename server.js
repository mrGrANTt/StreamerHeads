const WebSocket = require("ws");

// Blousers connecting
const server = new WebSocket.Server({ port: 8080 });
const clients = new Set();

server.on("connection", (ws) => {
    clients.add(ws);
    console.log("🔌 New browser connected");

    ws.on("close", () => {
        clients.delete(ws);
    });
});

// Streamer.bot conecting:
const streamerSocket = new WebSocket.Server({ port: 8081 });

streamerSocket.on("connection", (ws) => {
    console.log("🎙️ Streamer.bot connected");

    ws.on("message", (data) => {
        console.log("📨 From Streamer:", data.toString());

        // sending data
        for (let client of clients) {
            client.send(data.toString());
        }
    });
});
