import bot, {stage} from "../bot.js";
import CounterSchema from "../dao/models/Counter.js";
import ButtonArrayService from "../service/ButtonArrayService.js";

import {Markup, Scenes, session} from 'telegraf';

const won = async () => {

    const wonScene = new Scenes.WizardScene(
        'won',
        (ctx) => wonEntry(ctx),
        (ctx) => wonLvl1(ctx),
        (ctx) => wonLvl2(ctx),
    );

    const wonEntry = async (ctx) => {
        ctx.session.wonData = {};

        ctx.session.wonData.counters = await CounterSchema.find();

        ctx.session.wonData.betWinner =
            ctx.session.wonData.counters.filter(obj => obj.id === JSON.stringify(ctx.message.chat.id))[0];
        await ctx.replyWithMarkdown("Ok, so you won a bet. " +
            "Who lost the bet though? 🤔", {
            ...Markup.inlineKeyboard(
                ButtonArrayService(
                    ctx.session.wonData.counters.filter(obj => obj !== ctx.session.wonData.betWinner),
                    ["first_name"],
                    "update",
                    false
                )
            )
        });
        return ctx.wizard.next();
    }

    const wonLvl1 = async (ctx) => {
        ctx.session.wonData.betLoser =
            ctx.session.wonData.counters.filter((obj) => obj.first_name === ctx.update.callback_query.data)[0];
        await ctx.replyWithMarkdown(
            "Ok, to proceed please *briefly* describe the bet that _" +
            ctx.session.wonData.betWinner.first_name +
            "_ won against _" +
            ctx.session.wonData.betLoser.first_name +
            "_ or click cancel to terminate the update process.", {
                ...Markup.inlineKeyboard(
                    [Markup.button.callback("❌ cancel ❌", "cancel")]
                )
            }
        );
        return ctx.wizard.next();
    }

    const wonLvl2 = async (ctx) => {
// check for user in list of meals owed of the loser
        ctx.session.wonData.betLoser.meals_owed.filter(
            object => object.meal_receiver === ctx.session.wonData.betWinner.first_name
        ).length > 0 ?
            // if the receiver of the meal already exists, add another meal owed
            ctx.session.wonData.betLoser.meals_owed.map(obj => {
                if (obj.meal_receiver === ctx.session.wonData.betWinner.first_name) {
                    obj.amount += 1;
                    obj.bets.push(ctx.message.text);
                }
            })
            :
            // if the receiver doesn't exist add them to the list of meals owed
            ctx.session.wonData.betLoser.meals_owed.push(
                {
                    "meal_receiver": ctx.session.wonData.betWinner.first_name,
                    "amount": 1,
                    "bets": [ctx.message.text]
                }
            );

        // update the array in the database
        await CounterSchema.findOneAndUpdate(
            {"first_name": ctx.session.wonData.betLoser.first_name},
            {"meals_owed": ctx.session.wonData.betLoser.meals_owed}
        );

        // reply to user
        await ctx.replyWithMarkdown("Ok, duly noted 😉\n\n*" + ctx.session.wonData.betLoser.first_name +
            " now owes " + ctx.session.wonData.betWinner.first_name + " another meal.🍔*");

        const userTextingWithBot = ctx.update.message ?
            ctx.update.message.from.first_name :
            ctx.update.callback_query.from.first_name;


        // text the loser of the bet that they now owe another meal to the specified other user
        await bot.telegram.sendMessage(
            ctx.session.wonData.betLoser.id,
            userTextingWithBot +
            " updated the meals owed list:\n\n" +
            "--> Looks like you lost a bet! You now owe " +
            ctx.session.wonData.betWinner.first_name +
            " another meal"
        );

        // text the winner of the bet that they now get another meal from the specified other user
        await bot.telegram.sendMessage(
            ctx.session.wonData.betWinner.id,
            userTextingWithBot + " updated the meals owed list:\n\n" +
            "--> Looks like you won a bet! " +
            ctx.session.wonData.betLoser.first_name +
            " now owes you another meal"
        );
        await ctx.scene.leave();
    }

    wonScene.action("cancel", (ctx) => {
        ctx.scene.leave();
    });
    wonScene.leave(
        (ctx) =>
            ctx.replyWithMarkdown("`(left won process)`")
    );

// connecting scene with rest of bot
    stage.register(wonScene)
    bot.use(session());
    bot.use(stage.middleware());
    bot.command('won', (ctx) => ctx.scene.enter('won'));
}

export default won;