import bot from "../bot.js";
import CounterSchema from "../dao/models/Counter.js";

import {Markup, Scenes, session} from 'telegraf';

const update = async () => {
    let counters = await CounterSchema.find();

    const update = new Scenes.BaseScene('update');

    const {leave} = Scenes.Stage;
    update.hears("cancel", leave());
    update.leave(() => console.log("Left Update Process"));


    update.enter((ctx) => {
        let buttons = [];
        for (let i = 0; i < counters.length; i++) {
            buttons.push(Markup.button.callback(counters[i].first_name, counters[i].first_name));
        }
        ctx.replyWithMarkdown("The current list of active users are shown below \n" +
            "\n_(Please click the name of the user you would like to change)_", {
            ...Markup.inlineKeyboard([
                buttons
            ])
        });
    });

    let currentUserSelected;

    for (let i = 0; i < counters.length; i++) {
        let buttonsv2 = [];
        for (let i = 0; i < counters.length; i++) {
            buttonsv2.push(Markup.button.callback(counters[i].first_name, counters[i].first_name + "2"));
        }
        update.action(counters[i].first_name, async (ctx) => {
            currentUserSelected = counters[i];
            await ctx.replyWithMarkdown("Ok, so " + counters[i].first_name + " lost a bet. " +
                "Who won the bet though? 🤔", {
                ...Markup.inlineKeyboard([
                    buttonsv2
                ])
            });
        })
    }

    for (let i = 0; i < counters.length; i++) {
        update.action((counters[i].first_name + "2"), async (ctx) => {
            try {
                let seeIfAlreadyExists;
                currentUserSelected.meals_owed != null ? seeIfAlreadyExists = currentUserSelected.meals_owed.filter(object =>
                    object.meal_receiver === counters[i].first_name
                ) : seeIfAlreadyExists = [];
                let mealsOwedArray = [];
                if (seeIfAlreadyExists.length > 0) {
                    currentUserSelected.meals_owed.map(obj => {
                        if (obj.meal_receiver === counters[i].first_name) obj.amount += 1;
                    });
                    mealsOwedArray = currentUserSelected.meals_owed;
                }
                if (seeIfAlreadyExists.length < 1) {
                    currentUserSelected.meals_owed.push(
                        {
                            "meal_receiver": counters[i].first_name,
                            "amount": 1
                        }
                    );
                    mealsOwedArray = currentUserSelected.meals_owed;
                }
                await CounterSchema.findOneAndUpdate(
                    {"first_name": currentUserSelected.first_name},
                    {"meals_owed": mealsOwedArray}
                );
                await ctx.replyWithMarkdown("Ok, duly noted 😉\n\n*" + currentUserSelected.first_name +
                    " now owes " + counters[i].first_name + " another meal.*");
                ctx.scene.leave();
            } catch (err) {
                console.log(err)
            }
        });
    }

    /*update.on('message', async (ctx) => {
        let counterFromUser = await CounterSchema.find(
            {"first_name": ctx.update.message.text.substring(0, ctx.update.message.text.indexOf(' '))});
        if (counterFromUser.length === 1) {
            let newValue;
            console.log(counterFromUser[0])
            ctx.update.message.text.substring(ctx.update.message.text.indexOf(' ') + 1) === "i" ?
                newValue = counterFromUser[0].meals_owed + 1 :
                newValue = counterFromUser[0].meals_owed - 1;
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
    });*/

    const stage = new Scenes.Stage();
    stage.register(update)
    bot.use(session());
    bot.use(stage.middleware());
    bot.command('update', (ctx) => ctx.scene.enter('update'));
}

export default update;