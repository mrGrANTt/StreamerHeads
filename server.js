// for server
const WebSocket = require("ws");

// for images
const axios = require('axios');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Browsers connecting
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
        
        const [name, url] = data.toString().split("|");

        if ((url == "" && !fs.existsSync("heads/" + name + ".png")) || (url != "" && downloadAndExtract(url, name) == false)) {
            console.log("Creating default head...")
            copyAndRenameFile("heads/steve.png", "heads/" + name + ".png")
            copyAndRenameFile("heads/steve1.png", "heads/" + name + "1.png")
        }

        // sending data
        for (let client of clients) {
            client.send(name);
        }
    });
});

async function downloadAndExtract(url, name) {
    try {
        // Download
        const response = await axios.get(url,  { responseType: 'arraybuffer' })
        const buffer = Buffer.from(response.data, "utf-8")


        if (!fs.existsSync("heads")) fs.mkdirSync("heads");
        let image = sharp(buffer);
        //image.toFile(path.join("heads", `${name}0.png`))

        // Cut image
        await image.extract({ left: 8, top: 8, width: 8, height: 8 })
            .toFile(path.join("heads", `${name}.png`));

        image = sharp(buffer);
        await image.extract({ left: 40, top: 8, width: 8, height: 8 })
            .toFile(path.join("heads", `${name}1.png`));

        console.log(`✅ "${name}.png" and "${name}1.png" saved in "./heads"`);
        return true;
    } catch (err) {
        console.error(`❌ Ex with ${name}:`, err.message);
    }
        return false;
}

function copyAndRenameFile(sourcePath, destinationPath) {
  try {
    fs.copyFileSync(sourcePath, destinationPath);
    fs.renameSync(destinationPath, destinationPath);
  } catch (error) {
    console.error(`An error occurred: ${error}`);
  }
}
