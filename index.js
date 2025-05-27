var multiplyer = 0.5;
var interval = 1;
var paused = false;

class Head {
    posX;
    posY;
    velX;
    velY;

    static randomPosition(min, max) { return Number.parseInt(((Math.random()*1000) % (max-min)) + min); }
    static randomVelocity() { return Math.random() > 0.5 ? 1 : -1; }

    constructor() {
        this.posX = Head.randomPosition(200, 500);
        this.posY = Head.randomPosition(200, 500);
        this.velX = Head.randomVelocity();
        this.velY = Head.randomVelocity();
    }
}

var rendered = new Map();

rendered.set("mr_GrANTt", new Head())
rendered.set("PWGoood", new Head())
rendered.set("SecB", new Head())

function move() {
    if(paused != true) {
        var els = document.getElementsByClassName("player_heads");
            //console.log(els);
        for(var i = 0; i < els.length; i++) {
            var el = els[i];
            var name = el.firstElementChild.textContent;
            var head = rendered.get(name);

            var newY = head.posY + head.velY * multiplyer;
            if(newY >= 990 || newY <= 10) {
                head.velY = -head.velY;
                newY = head.posY + head.velY * multiplyer;
            }
            head.posY = newY;//-20 -> 1005

            var newX = head.posX + head.velX * multiplyer;
            if(newX >= 1245 || newX <= 10) {
                head.velX = -head.velX;
                newX = head.posX + head.velX * multiplyer;
            }
            head.posX = newX;//-10 -> 1245

            el.style.top = head.posY + "px";
            el.style.left = head.posX + "px";
        }
    }
}

setInterval(move,interval)