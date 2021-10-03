const Discord = require("discord.js");
const intents = new Discord.Intents(32767);
console.log(process.env.TOKEN);
const client = new Discord.Client({ intents });
const { getUsers, addUser, sendTick, getGlobalUsers } = require("./db");
const { io } = require("../main");
const paginationEmbed = require("discordjs-button-pagination");

class pageEmbed {
    static embeds = [];

    static getEmbed(id) {
        return pageEmbed.embeds.find((embed) => embed.id == id);
    }

    constructor(pages, message, buttons) {
        this.id = message.id;
        // this.prevButton = new Discord.MessageButton()
        //                         .setLabel("Previous")
        //                         .setStyle("red")
        //                         .setCustomId("prev")
        //                         .setDisabled(true);
        // this.nextButton = new Discord.MessageButton()
        //                         .setLabel("Next")
        //                         .setStyle("green")
        //                         .setCustomId("next");
        this.buttons = buttons;
        console.log("INSIDE THE CLASS");
        console.log(buttons);
        console.log(this.buttons);
        this.currentPage = 0;
        this.pages = pages;
        this.context = message;
        this.message = null;
    }

    async init() {
        console.log("Inside init")
        console.log(this.buttons);
        this.message = await this.context.channel.send({
            embeds: [this.pages[this.currentPage]],
            buttons: [this.buttons[0], this.buttons[1]],
        });
        pageEmbed.embeds.push(this);
    }

    async nextPage() {
        if (this.currentPage < this.pages.length - 1) {
            this.currentPage++;
            await editEmbed(this.pages[this.currentPage]);
        }
        if (this.currentPage == this.pages.length - 1) {
            this.buttons[1].setDisabled(true);
            this.buttons[0].setDisabled(false);
        } else {
            this.buttons[1].setDisabled(false);
            this.buttons[0].setDisabled(false);
        }
    }

    async prevPage() {
        if (this.currentPage > 0) {
            this.currentPage--;
            await editEmbed(this.pages[this.currentPage]);
        }
        if (this.currentPage == 0) {
            this.buttons[0].setDisabled(true);
            this.buttons[1].setDisabled(false);
        } else {
            this.buttons[0].setDisabled(false);
            this.buttons[1].setDisabled(false);
        }
    }

    async editEmbed(page) {
        await this.message.edit(page);
    }
}

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
            j < Math.min((i + 1) * pageLength, lblen);
            j++
        ) {
            const data = leaderboard[j];
            userNames += `\`${j + 1}\` ${data.userName}\n`;
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

const buttons = [
    new Discord.MessageButton()
        .setCustomId("previousbtn")
        .setLabel("Previous")
        .setStyle("DANGER"),
    new Discord.MessageButton()
        .setCustomId("nextbtn")
        .setLabel("Next")
        .setStyle("SUCCESS"),
];

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
        let pages = paginated(leaderboard, 10, false, message);
        // paginationEmbed(message, pages, buttons, 100000)
        console.log(buttons);
        const embed = new pageEmbed(pages, message, buttons);
        await embed.init();
        return;
    }

    if (message.content === "#vslb global") {
        const leaderboard = await getGlobalUsers();
        leaderboard.sort((a, b) => {
            return b.activityTime - a.activityTime;
        });
        let pages = paginated(leaderboard, 10, true, message);
        console.log(pages);
        // paginationEmbed(message, pages, buttons, 100000)
        const embed = new pageEmbed(pages, message, buttons);
        await embed.init();
        return;
    }
});

client.on("clickButton", async (button) => {
    const embed = pageEmbed.getEmbed(button.message.id);
    if (button.id === "previousbtn") {
        await button.reply.defer();
        await embed.prevPage();
    }
    if (button.id === "nextbtn") {
        await button.reply.defer();
        await embed.nextPage();
    }
});

client.login(process.env.TOKEN);
