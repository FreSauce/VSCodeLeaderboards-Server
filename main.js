const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const port = process.env.PORT || 3000;
const { addUser, sendTick } = require("./src/db");

io.on("connection", (socket) => {
  socket.on("sendTick", (data) => {
    sendTick(data);
  });
  socket.on("init", (data) => {
    addUser(data);
    console.log(data.username + " connected");
  });
});

app.get("/", (req, res) => {
  res.send({ port: port });
});

server.listen(port, () => {
  console.log("listening on *:" + port);
});

module.exports = { io };
