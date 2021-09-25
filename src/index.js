const Discord = require("discord.js");
const intents = new Discord.Intents(32767);
console.log(process.env.TOKEN);
const client = new Discord.Client({ intents });
const { getUsers, addUser, sendTick, getGlobalUsers } = require("./db");
const { io } = require("../main");
const paginationEmbed = require('discordjs-button-pagination');

const paginated = (leaderboard, pageLength, isGlobal, message) => {
    const pages = [];
    const author = isGlobal
        ? "Global Leaderboards"
        : `Leaderboards for ${message.guild.name}`;
    const iconURL = message.guild.iconURL({ dynamic: true });
    const lblen = leaderboard.length;
    const pageCount = Math.ceil(lblen / pageLength);
    for (let i = 0; i < pageCount; i++) {
        let userNames = "";
        let time_spent = "";
        for (
            let j = pageLength * i;
            j < Math.min(pageLength, lblen - i * pageLength);
            j++
        ) {
            const data = leaderboard[i * pageLength + j];
            userNames += `\`${i * pageLength + j + 1}\` ${data.userName}\n`;
            time_spent += ` \`${(data.activityTime / 60000).toFixed(2)}\`\n`;
        }
        const pageEmbed = new Discord.MessageEmbed()
            .setAuthor(author, iconURL)
            .setColor(0xe1abfb)
            .addFields(
                { name: "Top users", value: userNames, inline: true },
                { name: "Minutes spent", value: time_spent, inline: true }
            );
        pages.push(pageEmbed);
    }
    return pages;
};

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
        const leaderboard = await getUsers(userList);

        leaderboard.sort((a, b) => {
            return b.activityTime - a.activityTime;
        });
        const button1 = new Discord.MessageButton()
            .setCustomId("previousbtn")
            .setLabel("Previous")
            .setStyle("DANGER");

        const button2 = new Discord.MessageButton()
            .setCustomId("nextbtn")
            .setLabel("Next")
            .setStyle("SUCCESS");
        let pages = paginated(leaderboard, 10, false, message);
        paginationEmbed(message, pages, [button1, button2], 10000)
        return;
    }

    if (message.content === "#vslb global") {
        const leaderboard = await getGlobalUsers();
        leaderboard.sort((a, b) => {
            return b.activityTime - a.activityTime;
        });
        let pages = paginated(leaderboard, 10, true, message);
        const button1 = new Discord.MessageButton()
            .setCustomId("previousbtn")
            .setLabel("Previous")
            .setStyle("DANGER");

        const button2 = new Discord.MessageButton()
            .setCustomId("nextbtn")
            .setLabel("Next")
            .setStyle("SUCCESS");
        paginationEmbed(message, pages, [button1, button2], 10000)
        return;
    }
});

client.login(process.env.TOKEN);
