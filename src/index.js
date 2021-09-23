const Discord = require("discord.js");
const intents = new Discord.Intents(32767);
console.log(process.env.TOKEN);
const client = new Discord.Client({ intents });
const { getUsers, addUser, sendTick } = require("./db");
const { io } = require("../main");
io.on("connection", (socket) => {
    socket.on("sendTick", (data) => {
        sendTick(data);
    });
    socket.on("init", (data) => {
        addUser(data);
        console.log(data.username + " connected");
    });
});

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
        // console.log("In index file");
        // str = "";
        // for (let i = 0; i < leaderboard.length; i++) {
        //     str += `${leaderboard[i].userName} has  spent ${
        //         leaderboard[i].activityTime / 1000
        //     } seconds\n`;
        // }
        // message.channel.send(str);

        let userNames = "";
        let time_spent = "";
        for (let i = 0; i < leaderboard.length; i++) {
            const data = leaderboard[i];
            const user = data.userName;

            userNames += `\`${i + 1}\` ${user}\n`;
            time_spent += `\`${data.activityTime}\`\n`;
        }

        const embed = new MessageEmbed()
            .setAuthor(
                `Leaderboard for ${message.guild.name}`,
                message.guild.iconURL({ dynamic: true })
            )
            .setColor(0x51267)
            .addFields(
                { name: "Top users", value: userNames, inline: true },
                { name: "Minutes spent", value: time_spent, inline: true }
            );
        message.channel.send(embed);
        return;
    }
});

client.login(process.env.TOKEN);
