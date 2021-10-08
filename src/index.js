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

    constructor(pages, message) {
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
        console.log("hahaha id is");
        console.log(this.id);
        this.currentPage = 0;
        this.pages = pages;
        this.context = message;
        this.message = null;
    }

    async init() {
        this.message = await this.context.reply({
            embeds: [this.pages[this.currentPage]],
            components: [this.actionRow],
        });
        PageEmbed.embeds.push(this);
    }

    nextPage() {
        if (this.currentPage < this.pages.length - 1) {
            this.currentPage++;
            // await this.editEmbed();
        }
        if (this.currentPage == this.pages.length - 1) {
            this.actionRow.components[1].setDisabled(true);
            this.actionRow.components[0].setDisabled(false);
        } else {
            this.actionRow.components[1].setDisabled(false);
            this.actionRow.components[0].setDisabled(false);
        }
    }

    prevPage() {
        if (this.currentPage > 0) {
            this.currentPage--;
            // await this.editEmbed();
        }
        if (this.currentPage == 0) {
            this.actionRow.components[0].setDisabled(true);
            this.actionRow.components[1].setDisabled(false);
        } else {
            this.actionRow.components[0].setDisabled(false);
            this.actionRow.components[1].setDisabled(false);
        }
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
    client.user.setActivity("I am watching you all, #help to beg for help...");
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

    if (message.content === "#help") {
        const embed = new Discord.MessageEmbed()
            .setColor(0xe1abfb)
            .setTitle("VSLB")
            .setDescription("VSLB is a bot that tracks how much time you spend in VSCode coding.\n\nUse #vslb to get your own leaderboard.\n\nUse #vslb global to get the global leaderboard.")
            .addFields(
                { name: "Commands", value: "#vslb\n#vslb global" },
                { name: "Help", value: "#help" }
            );
        await message.reply({ embeds: [embed] });
    }

    if (message.content === "#gestapo") {
        message.channel.send("Heil Hitler", {
            tts: true
        });
    }
});

client.on("interactionCreate", async (interaction) => {
    if (interaction.isButton()) {
        const id = parseInt(
            interaction.customId.slice(4, interaction.customId.length)
        );
        const embed = PageEmbed.getEmbed(id);
        console.log("interaction id is ");
        console.log(id);
        if (interaction.customId.slice(0, 4) === "prev") {
            console.log("prev");
            embed.prevPage();
            await interaction.update({
                embeds: [embed.pages[embed.currentPage]],
                components: [embed.actionRow],
            });
        }
        if (interaction.customId.slice(0, 4) === "next") {
            console.log("next");
            embed.nextPage();
            await interaction.update({
                embeds: [embed.pages[embed.currentPage]],
                components: [embed.actionRow],
            });
        }
    }
});

client.login(process.env.TOKEN);
