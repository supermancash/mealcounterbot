import bot from "../bot.js";

const show = () => {
    bot.command('show', (ctx) => {
        ctx.reply(JSON.stringify(ctx.update));
    });
}

export default show;