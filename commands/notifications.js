import bot from "../bot.js";

import {Markup} from "telegraf";
import CounterSchema from "../dao/models/Counter.js   ";

const notifications = () => {
    bot.command('notifications', async (ctx) => {
        const users = await CounterSchema.find();
        ctx.reply(JSON.stringify(users))
    });

}

export default notifications;