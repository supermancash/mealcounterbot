import bot, {stage} from "../bot.js";
import CounterSchema from "../dao/models/Counter.js";
import ButtonArrayService from "../service/ButtonArrayService.js";

import {Markup, Scenes, session} from 'telegraf';

const won = async () => {

    const wonScene = new Scenes.BaseScene('won');

    wonScene.action("cancel", (ctx) => {
        ctx.scene.leave();
    });
    wonScene.leave((ctx) => ctx.replyWithMarkdown("`(left won process)`"));

    wonScene.action("back", async (ctx) => {
        await ctx.scene.enter('lost');
    });

    wonScene.enter(async (ctx) => {
        let counters, userTextingWithBot, currentWinnerSelected, currentLoserSelected;

        counters = await CounterSchema.find();

        ctx.update.message === undefined ?
            userTextingWithBot = ctx.update.callback_query.from.first_name :
            userTextingWithBot = ctx.update.message.from.first_name;

        currentWinnerSelected = counters.filter(obj => obj.id === JSON.stringify(ctx.message.chat.id))[0];
        await ctx.replyWithMarkdown("Ok, so you won a bet. " +
            "Who lost the bet though? 🤔", {
            ...Markup.inlineKeyboard(
                ButtonArrayService(
                    counters.filter(obj => obj !== currentWinnerSelected),
                    ["first_name"],
                    "update1"
                )
            )
        });
        for (let j = 0; j < counters.length; j++) {
            wonScene.action(counters[j].first_name, async (ctx) => {
                currentLoserSelected = counters[j];
                await ctx.replyWithMarkdown(
                    "Ok, to proceed please *briefly* describe the bet that _" +
                    currentWinnerSelected.first_name +
                    "_ won against _" +
                    currentLoserSelected.first_name +
                    "_ or click cancel to terminate the update process.", {
                        ...Markup.inlineKeyboard(
                            [Markup.button.callback("❌ cancel ❌", "cancel")]
                        )
                    }
                );
                wonScene.hears(/.*/, async (ctx) => {
                    // check for user in list of meals owed of the loser
                    currentLoserSelected.meals_owed.filter(
                        object => object.meal_receiver === currentWinnerSelected.first_name
                    ).length > 0 ?
                        // if the receiver of the meal already exists, add another meal owed
                        currentLoserSelected.meals_owed.map(obj => {
                            if (obj.meal_receiver === currentWinnerSelected.first_name) {
                                obj.amount += 1;
                                obj.bets.push(ctx.message.text);
                            }
                        })
                        :
                        // if the receiver doesn't exist add them to the list of meals owed
                        currentLoserSelected.meals_owed.push(
                            {
                                "meal_receiver": currentWinnerSelected.first_name,
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
                        " now owes " + currentWinnerSelected.first_name + " another meal.🍔*");

                    // text the loser of the bet that they now owe another meal to the specified other user
                    await bot.telegram.sendMessage(
                        currentLoserSelected.id,
                        userTextingWithBot +
                        " updated the meals owed list:\n\n" +
                        "--> Looks like you lost a bet! You now owe " +
                        currentWinnerSelected.first_name +
                        " another meal"
                    );

                    // text the winner of the bet that they now get another meal from the specified other user
                    // TODO: check wrong name bug
                    await bot.telegram.sendMessage(
                        currentWinnerSelected.id,
                        userTextingWithBot + " updated the meals owed list:\n\n" +
                        "--> Looks like you won a bet! " +
                        currentLoserSelected.first_name +
                        " now owes you another meal"
                    );
                    await ctx.scene.leave();
                })
            });
        }

    });

// connecting scene with rest of bot
    stage.register(wonScene)
    bot.use(session());
    bot.use(stage.middleware());
    bot.command('won', (ctx) => ctx.scene.enter('won'));
}

export default won;