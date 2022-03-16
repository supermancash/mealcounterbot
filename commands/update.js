import bot, {stage} from "../bot.js";
import CounterSchema from "../dao/models/Counter.js";
import ButtonArrayService from "../service/ButtonArrayService.js";

import {Markup, Scenes, session} from 'telegraf';

const update = async () => {
    let counters = await CounterSchema.find();

    const update = new Scenes.BaseScene('update');

    update.hears("cancel", (ctx) => {
        ctx.scene.leave();
        ctx.reply("Update process cancelled.")
    });
    update.leave(() => console.log("Left Update Process"));
    let userTextingWithBot;


    update.enter((ctx) => {
        ctx.replyWithMarkdown("The current list of active users are shown below📝\n" +
            "\n_(Please click the name of the user that lost a bet, or type cancel to terminate the update process.)_",
            {
                ...Markup.inlineKeyboard(
                    ButtonArrayService(counters, ["first_name"], "update1")
                )
            });
        userTextingWithBot = ctx.update.message.from.first_name;
    });

    let currentLoserSelected;


    for (let i = 0; i < counters.length; i++) {
        update.action(counters[i].first_name, async (ctx) => {
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
        update.action((counters[i].first_name + "2"), async (ctx) => {

            // check for user in list of meals owed
            currentLoserSelected.meals_owed.filter(object => object.meal_receiver === counters[i].first_name)
                .length > 0 ?
                // if the receiver of the meal already exists, update the amount of meals received
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

            await ctx.scene.leave();
        });
    }

    stage.register(update)
    bot.use(session());
    bot.use(stage.middleware());
    bot.command('update', (ctx) => ctx.scene.enter('update'));
}

export default update;