const socket = new WebSocket("ws://localhost:8080");

socket.addEventListener("message", (event) => {
    const data = event.data;
    const [name, url] = data.split("|");
    //console.log("'" + name + "' '" + url + "'")
    //alert(name);
    addHead(name, url);
});

function addHead(name, url) {
    const container = document.createElement("div");
    container.className = "player_heads";

    const p = document.createElement("p");
    p.className = "name";
    p.textContent = name;

    const headDiv = document.createElement("div");
    headDiv.className = "head";

    const imgEl0 = document.createElement("img");
    imgEl0.src = "heads/" + (url == "" ? "steve" : name) + ".png";
    imgEl0.className = "head0";

    const imgEl1 = document.createElement("img");
    imgEl1.src = "heads/" + (url == "" ? "steve" : name) + "1.png";
    imgEl1.className = "head1";

    headDiv.appendChild(imgEl0);
    headDiv.appendChild(imgEl1);

    container.appendChild(p);
    container.appendChild(headDiv);

    document.getElementById("main").appendChild(container);

    rendered.set(name, new Head());
}

function splitImage(name, url) {
    // spliting image to head and head1
}