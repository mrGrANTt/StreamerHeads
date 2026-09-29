const WebSocket = require("ws");
const axios = require("axios");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const http = require("http");

const PORT_HTTP = 8080;
const PORT_STREAMER = 8081;

const ROOT = __dirname;
const HEADS_DIR = path.join(ROOT, "heads");

if (!fs.existsSync(HEADS_DIR)) {
    fs.mkdirSync(HEADS_DIR);
}

/*
 * ------------------------------------------------------------
 * HTTP SERVER
 * ------------------------------------------------------------
 *
 * Теперь OBS сможет открывать:
 *
 * http://localhost:8080/
 *
 * вместо:
 *
 * file:///.../index.html
 */

const mimeTypes = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".mp4": "video/mp4"
};

const httpServer = http.createServer((req, res) => {
    let requestPath = decodeURIComponent(req.url.split("?")[0]);

    if (requestPath === "/") {
        requestPath = "/index.html";
    }

    let filePath;

    if (requestPath.startsWith("/heads/")) {
        filePath = path.join(ROOT, requestPath);
    } else {
        filePath = path.join(ROOT, requestPath);
    }

    // Защита от выхода из директории проекта
    const normalizedRoot = path.resolve(ROOT);
    const normalizedFile = path.resolve(filePath);

    if (!normalizedFile.startsWith(normalizedRoot)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end("Not found");
            return;
        }

        const ext = path.extname(filePath).toLowerCase();

        res.writeHead(200, {
            "Content-Type": mimeTypes[ext] || "application/octet-stream",
            "Cache-Control": "no-cache"
        });

        res.end(data);
    });
});

httpServer.listen(PORT_HTTP, () => {
    console.log(`🌐 OBS page: http://localhost:${PORT_HTTP}/`);
});


/*
 * ------------------------------------------------------------
 * OBS WEBSOCKET
 * ------------------------------------------------------------
 */

const browserSocket = new WebSocket.Server({
    server: httpServer
});

const clients = new Set();

browserSocket.on("connection", (ws) => {
    clients.add(ws);

    console.log("🔌 New browser connected");

    ws.on("close", () => {
        clients.delete(ws);
    });
});


/*
 * ------------------------------------------------------------
 * STREAMER.BOT WEBSOCKET
 * ------------------------------------------------------------
 */

const streamerSocket = new WebSocket.Server({
    port: PORT_STREAMER
});

streamerSocket.on("connection", (ws) => {

    console.log("🎙️ Streamer.bot connected");

    ws.on("message", async (data) => {

        try {

            const message = JSON.parse(data.toString());

            console.log("📨 From Streamer.bot:", message);

            if (message.command !== "skin") {
                console.log("⚠️ Unknown command:", message.command);
                return;
            }

            const user = message.user;

            if (!user) {
                console.log("❌ No user specified");
                return;
            }

            /*
             * Если target отсутствует:
             *
             * !скин
             *
             * Используем Minecraft-ник самого пользователя.
             */
  
        const headPath = path.join(
            HEADS_DIR,
            `${user}.png`
        );

        if (!message.target && fs.existsSync(headPath)) {
            // Голова уже существует — ничего не скачиваем.
            sendToBrowsers({
                type: "skin",
                user: user
            });

            return;
        }

            const target = message.target || user;

            let skinUrl;

            /*
             * Если передали прямую ссылку на PNG
             */
            if (isDirectImageUrl(target)) {

                skinUrl = target;

            /*
             * Если передали ссылку на NameMC
             */
            } else if (isNameMcUrl(target)) {

                skinUrl = await getSkinFromNameMC(target);

            /*
             * Иначе считаем target Minecraft-ником
             */
            } else {

                skinUrl = await getSkinFromMinecraftName(target);
            }

            if (!skinUrl) {
                console.log(`❌ Skin not found for "${target}"`);

                sendToStreamer({
                    type: "error",
                    user: user,
                    message: "Скин не найден"
                });

                return;
            }

            console.log(`🖼️ Skin for "${user}": ${skinUrl}`);

            await downloadAndExtract(skinUrl, user);

            /*
             * Очень важно:
             *
             * Мы отправляем сообщение OBS только ПОСЛЕ
             * того, как PNG действительно создан.
             *
             * Поэтому setTimeout в adder.js больше не нужен.
             */

            sendToBrowsers({
                type: "skin",
                user: user
            });

            sendToStreamer({
                type: "success",
                user: user
            });

            console.log(`✅ "${user}" updated`);

        } catch (error) {

            console.error("❌ Command error:", error);

            sendToStreamer({
                type: "error",
                message: error.message
            });
        }
    });
});


/*
 * ------------------------------------------------------------
 * MINECRAFT API
 * ------------------------------------------------------------
 */

async function getSkinFromMinecraftName(username) {

    try {

        console.log(`🔎 Looking up Minecraft player "${username}"`);

        const uuidResponse = await axios.get(
            `https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username)}`
        );

        const uuid = uuidResponse.data.id;

        const profileResponse = await axios.get(
            `https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`
        );

        const properties = profileResponse.data.properties;

        const texturesProperty = properties.find(
            property => property.name === "textures"
        );

        if (!texturesProperty) {
            return null;
        }

        const textures = JSON.parse(
            Buffer.from(
                texturesProperty.value,
                "base64"
            ).toString("utf8")
        );

        return textures?.textures?.SKIN?.url || null;

    } catch (error) {

        if (error.response?.status === 404) {
            console.log(`❌ Minecraft player "${username}" not found`);
        } else {
            console.error("❌ Minecraft API error:", error.message);
        }

        return null;
    }
}


/*
 * ------------------------------------------------------------
 * NAMEMC
 * ------------------------------------------------------------
 */

async function getSkinFromNameMC(url) {

    try {

        const parsedUrl = new URL(url);

        const match = parsedUrl.pathname.match(
            /^\/skin\/([a-f0-9]+)$/i
        );

        if (!match) {
            console.log("❌ Invalid NameMC skin URL");
            return null;
        }

        const skinId = match[1];

        console.log(
            `🔎 NameMC skin ID: ${skinId}`
        );

        /*
         * NameMC хранит изображения скинов
         * на отдельном домене s.namemc.com.
         *
         * /i/<id>.png — изображение текстуры.
         */

        return `https://s.namemc.com/i/${skinId}.png`;

    } catch (error) {

        console.error(
            "❌ NameMC URL error:",
            error.message
        );

        return null;
    }
}


/*
 * ------------------------------------------------------------
 * IMAGE
 * ------------------------------------------------------------
 */

async function downloadAndExtract(url, name) {

    try {

        const response = await axios.get(url, {
            responseType: "arraybuffer"
        });

        const buffer = Buffer.from(response.data);

        const headPath = path.join(
            HEADS_DIR,
            `${name}.png`
        );

        const headPath2 = path.join(
            HEADS_DIR,
            `${name}1.png`
        );

        /*
         * Передняя часть головы
         */
        await sharp(buffer)
            .extract({
                left: 8,
                top: 8,
                width: 8,
                height: 8
            })
            .png()
            .toFile(headPath);

        /*
         * Верхняя/боковая часть для текущей анимации
         */
        await sharp(buffer)
            .extract({
                left: 40,
                top: 8,
                width: 8,
                height: 8
            })
            .png()
            .toFile(headPath2);

        console.log(
            `✅ "${name}.png" and "${name}1.png" saved`
        );

        return true;

    } catch (error) {

        console.error(
            `❌ Error downloading skin for "${name}":`,
            error.message
        );

        return false;
    }
}


/*
 * ------------------------------------------------------------
 * HELPERS
 * ------------------------------------------------------------
 */

function isNameMcUrl(value) {

    try {

        const url = new URL(value);

        return (
            url.hostname === "namemc.com" ||
            url.hostname.endsWith(".namemc.com")
        );

    } catch {

        return false;
    }
}


function isDirectImageUrl(value) {

    try {

        const url = new URL(value);

        return (
            url.hostname === "s.namemc.com" ||
            /\.(png|jpg|jpeg)$/i.test(url.pathname)
        );

    } catch {

        return false;
    }
}


function sendToBrowsers(message) {

    const data = JSON.stringify(message);

    for (const client of clients) {

        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    }
}


function sendToStreamer(message) {

    // Пока оставляем эту функцию пустой.
    //
    // Позже можно сделать нормальные ответы
    // Streamer.bot и Twitch.

}