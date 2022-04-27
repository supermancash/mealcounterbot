import UserSchema from "./dao/models/User.js";
import CounterSchema from "./dao/models/Counter.js";

import {Scenes, session, Telegraf} from "telegraf";


// bot initialisation
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.start(async (ctx) => {
    // saving user info to users table
    const user = new UserSchema(ctx.update.message.from);
    user.save().catch(err => console.log(err));

    // saving user info to counters table
    const counter = new CounterSchema(
        {
            id: ctx.update.message.from.id,
            first_name: ctx.update.message.from.first_name,
            meals_owed: []
        }
    );
    counter.save().catch(err => console.log(err));

    // welcome message
    await ctx.replyWithMarkdown("Hi " + ctx.update.message.from.first_name +
        "! \n\nWelcome to the `mealcounterbot`, I'll be happy to assist with counting how many meals are owed by " +
        "colleagues in your team :)" +
        "\n\n*Use these commands to control me:*" +
        "\n\n/show - show the current status of owed meals" +
        "\n/won - record a new bet that was won" +
        "\n/lost - record a new bet that was lost" +
        "\n/payup - record a new meal and decrement the list" +
        "\n/proof - show the list of pictures of past meals" +
        "\n/help - show the list of commands and their functions (or just type / to see them)"
    );
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// provide for scenes (telegram commands that need a dialogue)
export const stage = new Scenes.Stage();

bot.use(session());
bot.use(stage.middleware());

export default bot;
