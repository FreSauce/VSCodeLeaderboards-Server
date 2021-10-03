const Discord = require("discord.js");
const intents = new Discord.Intents(32767);
console.log(process.env.TOKEN);
const client = new Discord.Client({ intents });
const { getUsers, addUser, sendTick, getGlobalUsers } = require("./db");
const { io } = require("../main");
const paginationEmbed = require("discordjs-button-pagination");

class PageEmbed {
    static embeds = [];

    static getEmbed(id) {
        return PageEmbed.embeds[id];
    }

    constructor(pages, message, actionRow) {
        this.id = PageEmbed.embeds.length;
        this.actionRow = new Discord.MessageActionRow().addComponents(
            new Discord.MessageButton()
                .setCustomId(`prev${this.id}`)
                .setLabel("Previous")
                .setStyle("DANGER"),
            new Discord.MessageButton()
                .setCustomId(`next${this.id}`)
                .setLabel("Next")
                .setStyle("SUCCESS")
        );
        console.log("hahaha id is")
        console.log(this.id)
        // this.prevButton = new Discord.MessageButton()
        //                         .setLabel("Previous")
        //                         .setStyle("red")
        //                         .setCustomId("prev")
        //                         .setDisabled(true);
        // this.nextButton = new Discord.MessageButton()
        //                         .setLabel("Next")
        //                         .setStyle("green")
        //                         .setCustomId("next");
        this.actionRow = actionRow;
        this.currentPage = 0;
        this.pages = pages;
        this.context = message;
        this.message = null;
    }

    async init() {
        this.message = await this.context.channel.send({
            embeds: [this.pages[this.currentPage]],
            components: [this.actionRow],
        });
        PageEmbed.embeds.push(this);
    }

    async nextPage() {
        if (this.currentPage < this.pages.length - 1) {
            this.currentPage++;
            await editEmbed();
        }
        // if (this.currentPage == this.pages.length - 1) {
        //     this.actionRow.components[1].setDisabled(true);
        //     this.actionRow.components[0].setDisabled(false);
        // } else {
        //     this.actionRow.components[1].setDisabled(false);
        //     this.actionRow.components[0].setDisabled(false);
        // }
    }

    async prevPage() {
        if (this.currentPage > 0) {
            this.currentPage--;
            await editEmbed();
        }
        // if (this.currentPage == 0) {
        //     this.actionRow.components[0].setDisabled(true);
        //     this.actionRow.components[1].setDisabled(false);
        // } else {
        //     this.actionRow.components[0].setDisabled(false);
        //     this.actionRow.components[1].setDisabled(false);
        // }
    }

    async editEmbed() {
        await this.message.edit(this.pages[this.currentPage]);
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
        const embed = new PageEmbed(pages, message);
        await embed.init();
        return;
    }

    if (message.content === "#vslb global") {
        const leaderboard = await getGlobalUsers();
        leaderboard.sort((a, b) => {
            return b.activityTime - a.activityTime;
        });
        let pages = paginated(leaderboard, 10, true, message);
        // paginationEmbed(message, pages, buttons, 100000)
        const embed = new PageEmbed(pages, message);
        await embed.init();
        return;
    }
});

client.on("interactionCreate", async (interaction) => {
    if (interaction.isButton()) {
        const id = int(interaction.customId.slice(4, interaction.customId.length));
        const embed = PageEmbed.getEmbed(id);
        console.log("interaction id is ")
        console.log(id)
        if (interaction.customId.slice(0,4) === "prev") {
            await embed.prevPage();
        }
        if (interaction.customId.slice(0,4) === "next") {
            await embed.nextPage();
        }
    }
});

client.login(process.env.TOKEN);
