import bot from "../bot.js";

const update = () => {
    bot.command('update', (ctx) => {
        ctx.reply(JSON.stringify(ctx.update));
    });
}

export default update;