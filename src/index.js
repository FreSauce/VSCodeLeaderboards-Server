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
    client.user.setActivity("I am watching you all");
});

client.on("messageCreate", async (message) => {
    if (message.content === "#vslb") {
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
        leaderboard.sort((a, b) => {
            return a.activityTime - b.activityTime;
        });
        
        let userNames = "";
        let time_spent = "";
        for (let i = 0; i < leaderboard.length; i++) {
            const data = leaderboard[i];
            userNames += `\`${i + 1}\` ${data.userName}\n`;
            time_spent += ` \`${(data.activityTime/60000).toFixed(2)}\`\n`;
        }

        const embed = new Discord.MessageEmbed()
            .setAuthor(
                `Leaderboard for ${message.guild.name}`,
                message.guild.iconURL({ dynamic: true })
            )
            .setColor(0xE1ABFB)
            .addFields(
                { name: "Top users", value: userNames, inline: true },
                { name: "Minutes spent", value: time_spent, inline: true }
            );
        message.reply({ embeds: [embed] });
        return;
    }
});

client.login(process.env.TOKEN);
