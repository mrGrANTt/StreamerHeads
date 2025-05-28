const socket = new WebSocket("ws://localhost:8080");

socket.addEventListener("message", (event) => {
    const data = event.data;
    const name = data.toString();
    //console.log("'" + name + "' '" + url + "'")
    //alert(name);
    addHead(name);
});

function addHead(name) {
    let imgEl0 = null
    let imgEl1 = null

    if(!rendered.has(name)) {
        console.log(name + ": load new html")
        const container = document.createElement("div");
        container.className = "player_heads";
        container.id = name;

        const p = document.createElement("p");
        p.className = "name";
        p.textContent = name;

        headDiv = document.createElement("div");
        headDiv.className = "head";

        imgEl0 = document.createElement("img");
        imgEl0.src = "heads/steve.png";
        imgEl0.className = "head0";

        imgEl1 = document.createElement("img");
        imgEl1.src = "heads/steve1.png";
        imgEl1.className = "head1";

        headDiv.appendChild(imgEl0);
        headDiv.appendChild(imgEl1);

        container.appendChild(p);
        container.appendChild(headDiv);

        document.getElementById("main").appendChild(container);
    }

    if (imgEl0 == null || imgEl1 == null) {
        let headDiv = document.getElementById(name).lastElementChild;
        imgEl0 = headDiv.firstElementChild;
        imgEl1 = headDiv.lastElementChild;
    }

    setTimeout(() => {
        console.log(name + " set skin")
        imgEl0.src = `heads/${name}.png?nocache=${Date.now()}`;
        imgEl1.src = `heads/${name}1.png?nocache=${Date.now()}`;
    }, 1000)

    rendered.set(name, new Head());
    console.log(name + " was updatd!")
}