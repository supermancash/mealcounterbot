import UserSchema from "./dao/models/User.js";

import {Scenes, Telegraf} from "telegraf";
import CounterSchema from "./dao/models/Counter.js";

const bot = new Telegraf("5206027815:AAHzEI2LNVOavq-c8ScWb76AUfPUjka8xtI");

bot.start(async (ctx) => {
        const user = new UserSchema(ctx.update.message.from);
        user.save().catch(err => console.log(err));
        const counter = new CounterSchema(
            {
                id: ctx.update.message.from.id,
                first_name: ctx.update.message.from.first_name,
                meals_owed: []
            }
        );
        counter.save().catch(err => console.log(err));
        await ctx.replyWithMarkdown("Hi " + ctx.update.message.from.first_name +
            "! \n\nWelcome to the `mealcounterbot`, I'll be happy to assist with counting how many meals are owed by " +
            "colleagues in your team :)" +
            "\n\n*Use these commands to control me:*" +
            "\n\n/show - show the current status of owed meals" +
            "\n/update - update the status of owed meals" +
            "\n/payup - record a new meal and decrement the list" +
            "\n/proof - show the list of pictures of past meals" +
            "\n/help - show the list of commands and their functions (or just type / to see them)"
        );
    }
);

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

export default bot;

export const stage = new Scenes.Stage();