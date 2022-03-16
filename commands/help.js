import bot from "../bot.js";

const help = () => {
    bot.command('help', async (ctx) => {
        await ctx.replyWithMarkdown(
            "\n\n*Use these commands to control me:*" +
            "\n\n/show - show the current status of owed meals" +
            "\n/update - update the status of owed meals" +
            "\n/payup - record a new meal and decrement the list" +
            "\n/proof - show the list of pictures of past meals" +
            "\n/help - show the list of commands and their functions (or just type / to see them)"
        );
    });

}

export default help;