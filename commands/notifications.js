import bot from "../bot.js";

const notifications = () => {
    bot.command('notifications', (ctx) => {
        ctx.reply(JSON.stringify(ctx.update));
    });
}

export default notifications;