const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

server.get("/", (req, res)=> {
  res.send({port: process.env.PORT})
})


server.listen(process.env.PORT, () => {
  console.log('listening on *:'+ process.env.PORT);
});

module.exports = {io};


