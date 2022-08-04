// The server mainly manages the physics world
// It adds and removes players from physics world
// It sets the rules
// It responds to input and influences the physics world accordingly
// It extracts and broadcasts the gamestate

const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const { Engine, Runner, Bodies, Events,
  Composite, Vertices, Body } = require('matter-js');
const port = process.env.PORT || 3000;

app.use(express.static('public')); // serve client

const engine = Engine.create(); // create an engine
engine.gravity.scale *= 0.5;

// create walls
Composite.add(engine.world, [
  Bodies.rectangle(400, 0 - 25, 800, 50, { isStatic: true }),
  Bodies.rectangle(400, 600 + 25, 800, 50, { isStatic: true }),
  Bodies.rectangle(800 + 25, 300, 50, 600, { isStatic: true }),
  Bodies.rectangle(0 - 25, 300, 50, 600, { isStatic: true })
]);

// create ball
const options = { mass: 0.1, restitution: 0.9 };
const ball = Bodies.circle(100, 100, 50, options);
Composite.add(engine.world, [ball]);

var runner = Runner.create(); // create runner

setTimeout(() => (
  Runner.run(runner, engine)
), 1000);

let playerCount = 0;

// listen for connection
io.on('connection', (socket) => {
  console.log(`User connected! Total: ${++playerCount}`);

  const arrow = Vertices.fromPath('0 80 30 0 60 80');
  const body = Bodies.fromVertices(500, 100, arrow, { friction: 0.01 });
  Composite.add(engine.world, [body]);

  let translate = false;
  let rotate = false;

  Events.on(engine, 'beforeUpdate', () => {
    body.torque = rotate ? 0.1 : 0;
    if (!translate) return;
    const pos = body.position;
    Body.applyForce(body, pos, {
      x: 0.005 * Math.sin(body.angle),
      y: -0.005 * Math.cos(body.angle),
    });
  });

  socket.on('input', code => {
    switch (code) {
      case 't': translate = true; break;
      case 'T': translate = false; break;
      case 'r': rotate = true; break;
      case 'R': rotate = false; break;
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected! Total: ${--playerCount}`);
    Composite.remove(engine.world, [body]);
  });

  socket.on('ping', callback => callback());
});

// emit regular updates to all clients 
setInterval(() => {
  const players = engine.world.bodies.slice(4); // exclude 4 walls
  const gamestate = players.map(body => {
    return {
      x: Math.round(body.position.x),
      y: Math.round(body.position.y),
      r: Math.round(body.angle * 100) / 100,
    };
  })
  io.volatile.emit('update', gamestate);
}, 1000 / 30);

http.listen(port, () => console.log('listening on port ' + port));
