const Discord = require("discord.js");
require("dotenv").config();
const token = "ODUwNjM5NDE2NjY5MTEwMjcy.YLspsQ.N3unby0Wv2dGjEn7nexxtvJadhk";
const intents = new Discord.Intents(32767);
const client = new Discord.Client({ intents });
const { getUsers, addUser, sendTick } = require("./db");
const { io } = require("../main");

io.on("connection", (socket) => {
    socket.on("sendTick", (data) => {
        sendTick(data);
    });
    socket.on("init", (data) => {
        addUser(data);
        console.log(data.username+" connected");
    })
});
/////////////////////////////////////////////////////////////////////////////////////////////
client.on("ready", async () => {
    console.log("Ready!");
    client.user.setActivity("I AINT DEAD YET");
});

client.on("messageCreate", async (message) => {
    if (message.content === "!users") {
        message.channel.send("Fetching data");
        const userList = await (
            await message.guild.members.fetch()
        ).map((member) => member.id);
        // console.log(userList);
        const leaderboard = await getUsers(userList);
        // message.channel.send(userList)
        console.log("In index file");
        str = ""
        for(let i = 0; i < leaderboard.length; i++){
            str += `${leaderboard[i].userName} has ${leaderboard[i].activityTime} points\n`;
        }
        message.channel.send(str);
    }
});

client.login(token);
