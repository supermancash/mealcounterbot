import bot, {stage} from "../bot.js";
import CounterSchema from "../dao/models/Counter.js";
import ButtonArrayService from "../service/ButtonArrayService.js";

import {Markup, Scenes, session} from 'telegraf';

const won = async () => {
    //TODO: add code annotations and clean up
    let counters

    const won = new Scenes.BaseScene('won');

    won.action("cancel", (ctx) => {
        ctx.scene.leave();
        ctx.reply("Won process cancelled.")
    });
    won.leave(() => console.log("Left Won Process"));
    let userTextingWithBot;


    won.enter(async (ctx) => {
        won.action("back", async (ctx) => {
            await ctx.scene.enter('lost');
        });

        counters = await CounterSchema.find();
        await ctx.replyWithMarkdown("The current list of active users are shown below📝\n" +
            "\n_(Please click the name of the user that won a bet, or click cancel to terminate the won process.)_",
            {
                ...Markup.inlineKeyboard(
                    ButtonArrayService(counters, ["first_name"], "update1")
                )
            });

        ctx.update.message === undefined ?
            userTextingWithBot = ctx.update.callback_query.from.first_name :
            userTextingWithBot = ctx.update.message.from.first_name;
        let currentWinnerSelected;

        for (let i = 0; i < counters.length; i++) {
            won.action(counters[i].first_name, async (ctx) => {
                currentWinnerSelected = counters[i];
                await ctx.replyWithMarkdown("Ok, so " + counters[i].first_name + " won a bet. " +
                    "Who lost the bet though? 🤔", {
                    ...Markup.inlineKeyboard(
                        ButtonArrayService(
                            counters.filter(obj => obj !== currentWinnerSelected),
                            ["first_name"],
                            "update2"
                        )
                    )
                });
            });
        }

        for (let i = 0; i < counters.length; i++) {
            won.action((counters[i].first_name + "2"), async (ctx) => {
                // check for user in list of meals owed of the loser
                counters[i].meals_owed.filter(object => object.meal_receiver === currentWinnerSelected.first_name)
                    .length > 0 ?
                    // if the receiver of the meal already exists, add another meal owed
                    counters[i].meals_owed.map(obj => {
                        if (obj.meal_receiver === currentWinnerSelected.first_name) obj.amount += 1;
                    })
                    :
                    // if the receiver doesn't exits add him to the list of meals owed
                    counters[i].meals_owed.push(
                        {
                            "meal_receiver": currentWinnerSelected.first_name,
                            "amount": 1
                        }
                    );

                // update the array in the database
                await CounterSchema.findOneAndUpdate(
                    {"first_name": counters[i].first_name},
                    {"meals_owed": counters[i].meals_owed}
                );

                // reply to user
                await ctx.replyWithMarkdown("Ok, duly noted 😉\n\n*" + counters[i].first_name +
                    " now owes " + currentWinnerSelected.first_name + " another meal. 🍔*");

                // text the loser of the bet that they now owe another meal to the specified other user
                await bot.telegram.sendMessage(
                    counters[i].id,
                    userTextingWithBot + " updated the meals owed list:\n\n" +
                    "--> Looks like you lost a bet! You now owe " + currentWinnerSelected.first_name + " another meal");

                // text the winner of the bet that they now get another meal from the specified other user
                await bot.telegram.sendMessage(
                    currentWinnerSelected.id,
                    userTextingWithBot + " updated the meals owed list:\n\n" +
                    "--> Looks like you won a bet! " + counters[i].first_name + " now owes you another meal");
                // TODO: check wrong name bug
                await ctx.scene.leave();
            });
        }

    });


    stage.register(won)
    bot.use(session());
    bot.use(stage.middleware());
    bot.command('won', (ctx) => ctx.scene.enter('won'));
}

export default won;