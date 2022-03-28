import bot, {stage} from "../bot.js";
import CounterSchema from "../dao/models/Counter.js";
import ButtonArrayService from "../service/ButtonArrayService.js";

import {Markup, Scenes, session} from 'telegraf';

const lost = async () => {

    const lostScene = new Scenes.BaseScene('lost');

// adding listener for cancellation and that the cancellation is shown to the user
    lostScene.action("cancel", (ctx) => {
        ctx.scene.leave();
    });
    lostScene.leave((ctx) => ctx.replyWithMarkdown("`(left lost process)`"));

    lostScene.action("back", async (ctx) => {
        await ctx.scene.enter('lost');
    });


    lostScene.enter(async (ctx) => {
        let counters, userTextingWithBot, currentLoserSelected;

    // get counters from db and let the user choose who lost the bet
        counters = await CounterSchema.find();
        await ctx.replyWithMarkdown("The current list of active users are shown below📝\n" +
            "\n_(Please click the name of the user that lost a bet, or click cancel to terminate the lost process.)_",
            {
                ...Markup.inlineKeyboard(
                    ButtonArrayService(counters, ["first_name"], "update1")
                )
            });

    // define userTextingWithBot variable
        ctx.update.message === undefined ?
            userTextingWithBot = ctx.update.callback_query.from.first_name :
            userTextingWithBot = ctx.update.message.from.first_name;


        for (let i = 0; i < counters.length; i++) {
            lostScene.action(counters[i].first_name, async (ctx) => {
                currentLoserSelected = counters[i];
                await ctx.replyWithMarkdown("Ok, so " + counters[i].first_name + " lost a bet. " +
                    "Who won the bet though? 🤔", {
                    ...Markup.inlineKeyboard(
                        ButtonArrayService(
                            counters.filter(obj => obj !== currentLoserSelected),
                            ["first_name"],
                            "update2"
                        )
                    )
                });
            });
        }

        for (let i = 0; i < counters.length; i++) {
            lostScene.action((counters[i].first_name + "2"), async (ctx) => {
                await ctx.replyWithMarkdown(
                    "Ok, to proceed please *briefly* describe the bet that _" +
                    currentLoserSelected.first_name +
                    "_ lost against _" +
                    counters[i].first_name +
                    "_ or click cancel to terminate the update process.", {
                        ...Markup.inlineKeyboard(
                            [Markup.button.callback("❌ cancel ❌", "cancel")]
                        )
                    }
                );

                lostScene.hears(/.*/, async (ctx) => {

                // check for user in list of meals owed
                    currentLoserSelected.meals_owed.filter(object => object.meal_receiver === counters[i].first_name)
                        .length > 0 ?
                    // if the receiver of the meal already exists, lost the amount of meals received
                        currentLoserSelected.meals_owed.map(obj => {
                            if (obj.meal_receiver === counters[i].first_name) obj.amount += 1;
                            obj.bets.push(ctx.message.text)
                        })
                        :
                    // if the receiver doesn't exits add him to the list of meals owed
                        currentLoserSelected.meals_owed.push(
                            {
                                "meal_receiver": counters[i].first_name,
                                "amount": 1,
                                "bets": [ctx.message.text]
                            }
                        );

                // update the array in the database
                    await CounterSchema.findOneAndUpdate(
                        {"first_name": currentLoserSelected.first_name},
                        {"meals_owed": currentLoserSelected.meals_owed}
                    );

                // reply to user
                    await ctx.replyWithMarkdown("Ok, duly noted 😉\n\n*" + currentLoserSelected.first_name +
                        " now owes " + counters[i].first_name + " another meal. 🍔*");

                // text the loser of the bet that they now owe another meal to the specified other user
                    await bot.telegram.sendMessage(
                        currentLoserSelected.id,
                        userTextingWithBot + " updated the meals owed list:\n\n" +
                        "--> Looks like you lost a bet! You now owe " + counters[i].first_name + " another meal");

                // text the winner of the bet that they now get another meal from the specified other user
                    await bot.telegram.sendMessage(
                        counters[i].id,
                        userTextingWithBot + " updated the meals owed list:\n\n" +
                        "--> Looks like you won a bet! " + counters[i].first_name + " now owes you another meal");

                    await ctx.scene.leave();
                });
            });
        }
    });

// connecting scene with rest of bot
    stage.register(lostScene)
    bot.use(session());
    bot.use(stage.middleware());
    bot.command('lost', (ctx) => ctx.scene.enter('lost'));
}

export default lost;