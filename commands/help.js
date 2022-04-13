import bot from "../bot.js";

const help = () => {
    bot.command('help', async (ctx) => {
        await ctx.replyWithMarkdown(
            "\n\n*Use these commands to control me:*" +
            "\n\n/show - show the current status of owed meals" +
            "\n/won - record a new bet that was won" +
            "\n/lost - record a new bet that was lost" +
            "\n/payup - record a new meal eaten and decrement the list" +
            "\n/proof - show the list of pictures of past meals" +
            "\n/help - show the list of commands and their functions (or just type / to see them)"
        );
    });
}

export default help;