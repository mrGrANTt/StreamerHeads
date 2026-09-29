const socket = new WebSocket("ws://localhost:8080");

socket.addEventListener("open", () => {
    console.log("🔌 Connected to StreamerHeads");
});

socket.addEventListener("message", (event) => {

    try {

        const data = JSON.parse(event.data);

        if (data.type !== "skin") {
            return;
        }

        addHead(data.user);

    } catch (error) {

        console.error(
            "❌ Invalid server message:",
            error
        );
    }
});


function addHead(name) {

    let imgEl0 = null;
    let imgEl1 = null;

    if (!rendered.has(name)) {

        console.log(
            name + ": load new html"
        );

        const container =
            document.createElement("div");

        container.className = "player_heads";
        container.id = name;

        const p =
            document.createElement("p");

        p.className = "name";
        p.textContent = name;

        const headDiv =
            document.createElement("div");

        headDiv.className = "head";

        imgEl0 =
            document.createElement("img");

        imgEl0.src = "heads/steve.png";
        imgEl0.className = "head0";

        imgEl1 =
            document.createElement("img");

        imgEl1.src = "heads/steve1.png";
        imgEl1.className = "head1";

        headDiv.appendChild(imgEl0);
        headDiv.appendChild(imgEl1);

        container.appendChild(p);
        container.appendChild(headDiv);

        document
            .getElementById("main")
            .appendChild(container);
    }

    if (
        imgEl0 === null ||
        imgEl1 === null
    ) {

        const headDiv =
            document
                .getElementById(name)
                .lastElementChild;

        imgEl0 =
            headDiv.firstElementChild;

        imgEl1 =
            headDiv.lastElementChild;
    }

    /*
     * Сервер уже гарантирует, что файлы существуют.
     *
     * Поэтому никакой setTimeout больше не нужен.
     */

    const cacheBust = Date.now();

    imgEl0.src =
        `heads/${encodeURIComponent(name)}.png?nocache=${cacheBust}`;

    imgEl1.src =
        `heads/${encodeURIComponent(name)}1.png?nocache=${cacheBust}`;

    rendered.set(name, new Head());

    console.log(
        name + " was updated!"
    );
}