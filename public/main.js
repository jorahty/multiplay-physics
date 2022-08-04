const socket = io();

let gamestate;

socket.on('update', gs => gamestate = gs);

// const shrink = 800 / window.innerWidth / 2;
// const shrink = 4;
const shrink = 1;
const canvas = document.createElement('canvas');
document.body.appendChild(canvas);
canvas.width = 800 / shrink;
canvas.height = 600 / shrink;


const ctx = canvas.getContext('2d');

const img = new Image();
img.src = 'player.svg';

function animate() {
  requestAnimationFrame(animate);

  if (!gamestate) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#bbb";
  ctx.lineWidth = 4;

  let ball = true;
  for (const body of gamestate) {
    let { x, y, r } = body;
    x /= shrink;
    y /= shrink;
    if (ball) {
      ctx.beginPath();
      ctx.arc(x, y, 50 / shrink, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      ball = false;
      continue;
    }
    // draw player based on x, y, r
    let w = 60;
    let h = 80;
    w /= shrink;
    h /= shrink;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(r);
    ctx.translate(-w / 2, -h / 1.5);
    ctx.drawImage(img, 0, 0, w, h);
    ctx.restore();
  }
}

animate();

// controls

const rotate = document.createElement('button');
const translate = document.createElement('button');

rotate.textContent = 'rotate';
translate.textContent = 'translate';

document.body.appendChild(rotate);
document.body.appendChild(translate);

translate.onpointerdown = rotate.onpointerdown = (e) => input(e, true);
translate.onpointerup = rotate.onpointerup = (e) => input(e, false);

function input(e, down) {
  e.target.style.opacity = down ? 0.5 : 1;
  let code = e.target.textContent === 'translate' ? 't' : 'r';
  if (!down) code = code.toUpperCase();
  socket.volatile.emit('input', code);
}

// ping

const ping = document.createElement('h1');
document.body.appendChild(ping);

setInterval(() => {
  const start = Date.now();

  socket.volatile.emit("ping", () => {
    const duration = Date.now() - start;
    const hue = Math.max(-2.6 * duration + 180, 0);
    const color = `hsl(${hue} 100% 50%)`;
    ping.style.color = color;
    ping.textContent = `Ping: ${duration}`;
  });
}, 1000);
