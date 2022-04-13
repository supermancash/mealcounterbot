import bot, {stage} from "../bot.js";
import CounterSchema from "../dao/models/Counter.js";
import ButtonArrayService from "../service/ButtonArrayService.js";

import {Markup, Scenes, session} from 'telegraf';

const lost = async () => {

    const lostScene = new Scenes.WizardScene(
        'lost',
        (ctx) => lostEntry(ctx),
        (ctx) => lostLvl1(ctx),
        (ctx) => lostLvl2(ctx),
    );

    const lostEntry = async (ctx) => {
        ctx.session.lostData = {};
        // get counters from db and let the user choose who lost the bet
        ctx.session.lostData.counters = await CounterSchema.find();

        ctx.session.lostData.betLoser =
            ctx.session.lostData.counters.filter(obj => obj.id === JSON.stringify(ctx.message.chat.id))[0];
        await ctx.replyWithMarkdown("Ok, so you lost a bet. " +
            "Who won the bet though? 🤔", {
            ...Markup.inlineKeyboard(
                ButtonArrayService(
                    ctx.session.lostData.counters.filter(obj => obj !== ctx.session.lostData.betLoser),
                    ["first_name", "id"],
                    "update",
                    false
                )
            )
        });
        return ctx.wizard.next();
    }

    const lostLvl1 = async (ctx) => {
        ctx.session.lostData.betWinner =
            ctx.session.lostData.counters.filter((obj) => obj.id === ctx.update.callback_query.data)[0];
        await ctx.replyWithMarkdown(
            "Ok, to proceed please *briefly* describe the bet that _" +
            ctx.session.lostData.betLoser.first_name +
            "_ lost against _" +
            ctx.session.lostData.betWinner.first_name +
            "_ or click cancel to terminate the update process.", {
                ...Markup.inlineKeyboard(
                    [Markup.button.callback("❌ cancel ❌", "cancel")]
                )
            }
        );
        return ctx.wizard.next();
    }

    const lostLvl2 = async (ctx) => {
        // check for user in list of meals owed
        ctx.session.lostData.betLoser.meals_owed.filter(
            object => object.meal_receiver === ctx.session.lostData.betWinner.first_name
        ).length > 0 ?
            // if the receiver of the meal already exists, lost the amount of meals received
            ctx.session.lostData.betLoser.meals_owed.map(obj => {
                if (obj.meal_receiver === ctx.session.lostData.betWinner.first_name) {
                    obj.amount += 1;
                    obj.bets.push(ctx.message.text);
                }
            })
            :
            // if the receiver doesn't exits add him to the list of meals owed
            ctx.session.lostData.betLoser.meals_owed.push(
                {
                    "meal_receiver": ctx.session.lostData.betWinner.first_name,
                    "amount": 1,
                    "bets": [ctx.message.text]
                }
            );

        // update the array in the database
        await CounterSchema.findOneAndUpdate(
            {"first_name": ctx.session.lostData.betLoser.first_name},
            {"meals_owed": ctx.session.lostData.betLoser.meals_owed}
        );

        // reply to user
        await ctx.replyWithMarkdown(
            "Ok, duly noted 😉\n\n*" +
            "You now owe " +
            ctx.session.lostData.betWinner.first_name +
            " another meal. 🍔*"
        );

        const userTextingWithBot = ctx.update.message ?
            ctx.update.message.from.first_name :
            ctx.update.callback_query.from.first_name;

        // text the winner of the bet that they now get another meal from the specified other user
        await bot.telegram.sendMessage(
            ctx.session.lostData.betWinner.id,
            userTextingWithBot +
            " updated the meals owed list:\n\n" +
            "--> Looks like you won a bet! " +
            ctx.session.lostData.betLoser.first_name +
            " now owes you another meal"
        );

        return ctx.scene.leave();
    }

    // adding listener for cancellation and that the cancellation is shown to the user
    lostScene.action("cancel", (ctx) => {
        ctx.scene.leave();
    });
    lostScene.leave((ctx) => ctx.replyWithMarkdown("`(left lost process)`"));

// connecting scene with rest of bot
    stage.register(lostScene)
    bot.use(session());
    bot.use(stage.middleware());
    bot.command('lost', (ctx) => ctx.scene.enter('lost'));
}

export default lost;