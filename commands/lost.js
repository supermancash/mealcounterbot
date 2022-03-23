import bot, {stage} from "../bot.js";
import CounterSchema from "../dao/models/Counter.js";
import ButtonArrayService from "../service/ButtonArrayService.js";

import {Markup, Scenes, session} from 'telegraf';

const lost = async () => {
    //TODO: add code annotations and clean up
    let counters

    const lost = new Scenes.BaseScene('lost');

    lost.action("cancel", (ctx) => {
        ctx.scene.leave();
        ctx.reply("Lost process cancelled.")
    });
    lost.leave(() => console.log("Left lost Process"));
    let userTextingWithBot;


    lost.enter(async (ctx) => {
        lost.action("back", async (ctx) => {
            await ctx.scene.enter('lost');
        });

        counters = await CounterSchema.find();
        await ctx.replyWithMarkdown("The current list of active users are shown below📝\n" +
            "\n_(Please click the name of the user that lost a bet, or click cancel to terminate the lost process.)_",
            {
                ...Markup.inlineKeyboard(
                    ButtonArrayService(counters, ["first_name"], "update1")
                )
            });


        ctx.update.message === undefined ?
            userTextingWithBot = ctx.update.callback_query.from.first_name :
            userTextingWithBot = ctx.update.message.from.first_name;
        let currentLoserSelected;


        for (let i = 0; i < counters.length; i++) {
            lost.action(counters[i].first_name, async (ctx) => {
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
            lost.action((counters[i].first_name + "2"), async (ctx) => {

                // check for user in list of meals owed
                currentLoserSelected.meals_owed.filter(object => object.meal_receiver === counters[i].first_name)
                    .length > 0 ?
                    // if the receiver of the meal already exists, lost the amount of meals received
                    currentLoserSelected.meals_owed.map(obj => {
                        if (obj.meal_receiver === counters[i].first_name) obj.amount += 1;
                    })
                    :
                    // if the receiver doesn't exits add him to the list of meals owed
                    currentLoserSelected.meals_owed.push(
                        {
                            "meal_receiver": counters[i].first_name,
                            "amount": 1
                        }
                    );

                // lost the array in the database
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
        }

    });


    stage.register(lost)
    bot.use(session());
    bot.use(stage.middleware());
    bot.command('lost', (ctx) => ctx.scene.enter('lost'));
}

export default lost;