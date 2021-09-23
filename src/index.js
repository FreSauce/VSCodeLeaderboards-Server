const Discord = require("discord.js");
const intents = new Discord.Intents(32767);
console.log(process.env.TOKEN);
const client = new Discord.Client({ intents });
const { getUsers, addUser, sendTick, getGlobalUsers } = require("./db");
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
    client.user.setActivity("I am watching you all");
});

client.on("messageCreate", async (message) => {
    if (message.content.startsWith("#vslb")) {
        const leaderboard = await getGlobalUsers();
        const msg = message.content.split(" ");
        if (msg.length === 1) {
            const userList = await (
                await message.guild.members.fetch()
            ).map((member) => member.id);
            const leaderboard = await getUsers(userList);
        } else if (msg.length === 2 && msg[1] === "global") {
            const leaderboard = await getGlobalUsers();
        }

        leaderboard.sort((a, b) => {
            return b.activityTime - a.activityTime;
        });
        let userNames = "";
        let time_spent = "";
        for (let i = 0; i < leaderboard.length; i++) {
            const data = leaderboard[i];
            userNames += `\`${i + 1}\` ${data.userName}\n`;
            time_spent += ` \`${(data.activityTime / 60000).toFixed(2)}\`\n`;
        }

        const embed = new Discord.MessageEmbed()
            .setAuthor(
                `Leaderboard for ${message.guild.name}`,
                message.guild.iconURL({ dynamic: true })
            )
            .setColor(0xe1abfb)
            .addFields(
                { name: "Top users", value: userNames, inline: true },
                { name: "Minutes spent", value: time_spent, inline: true }
            );
        message.reply({ embeds: [embed] });
        return;
    }
});

client.login(process.env.TOKEN);
