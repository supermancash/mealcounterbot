import bot from "../bot.js";
import UserSchema from "../dao/models/User.js";
import CounterSchema from "../dao/models/Counter.js";

import {Scenes, session} from 'telegraf';

const update = async () => {
    let counters = await CounterSchema.find();
    const update = new Scenes.BaseScene('update');
    const {leave} = Scenes.Stage;
    update.enter((ctx) => {
        ctx.replyWithMarkdown("Here is the current list of meals owed: ");
        for (let i = 0; i < counters.length; i++) {
            ctx.replyWithMarkdown("\n*" + counters[i].first_name + ": " + counters[i].meals_owed + "*"
            );
        }
        ctx.replyWithMarkdown("\nPlease enter the name of the user you would like to change" +
            "followed by _i_ for increment or _d_ for decrement _e.g. John i_, or type 'cancel'")
    });
    update.leave((ctx) => ctx.reply('Update proccess canceled'));
    update.hears("cancel", leave())
    update.on('message', async (ctx) => {
        let sentCounter = await CounterSchema.find(
            {"first_name": ctx.update.message.text.substring(0, ctx.update.message.text.indexOf(' '))});
        if (sentCounter.length === 1) {
            let newValue;
            console.log(sentCounter[0])
            ctx.update.message.text.substring(ctx.update.message.text.indexOf(' ') + 1) === "i" ?
                newValue = sentCounter[0].meals_owed + 1 :
                newValue = sentCounter[0].meals_owed - 1;
            await CounterSchema.findOneAndUpdate(
                {"first_name": ctx.update.message.text.substring(0, ctx.update.message.text.indexOf(' '))},
                {"meals_owed": newValue}
            );
        }
        const users = await UserSchema.find();
        for (let i = 0; i < users.length; i++) {
            const newCounters = await CounterSchema.find();
            let response = "";
            for (let i = 0; i < newCounters.length; i++) {
                response += "\n" + newCounters[i].first_name + ": " + newCounters[i].meals_owed;
            }
            await bot.telegram.sendMessage(users[i].id, "The list of meals has been updated: " + response)
        }
        leave();
    });

    const stage = new Scenes.Stage();
    stage.register(update)
    bot.use(session());
    bot.use(stage.middleware());
    bot.command('update', (ctx) => ctx.scene.enter('update'));
}

export default update;