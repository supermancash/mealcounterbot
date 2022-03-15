import bot, {stage} from "../bot.js";

import {Markup, Scenes, session} from "telegraf";
import CounterSchema from "../dao/models/Counter.js";
import ProofSchema from "../dao/models/Proof.js";

const payup = async () => {
    const payup = new Scenes.BaseScene('payup');

    payup.hears("cancel", (ctx) => {
        ctx.scene.leave();
        ctx.reply("payup process cancelled.")
    });
    payup.leave(() => console.log("Left Payup Process"));

    let userTextingWithBot;
    let counters, owers;

    payup.enter(async (ctx) => {
        let counters = await CounterSchema.find();
        let owers = counters.filter(obj => {
            if (obj.meals_owed.length > 0) return obj;
        });
        if (owers.length < 1) {
            await ctx.reply("Looks like no meals are owed, nobody has to pay up if nobody owes anything 🙈");
            await ctx.scene.leave();
        }
        if (owers.length > 0) {
            let buttons = [];
            for (let i = 0; i < owers.length; i++) {
                buttons.push(Markup.button.callback(owers[i].first_name, owers[i].first_name));
            }
            ctx.replyWithMarkdown("The current list of users that owe meals are shown below \n" +
                "\n_(Please click the name of the user that will be paying for the meal, " +
                "or type cancel to terminate the update process.)_", {
                ...Markup.inlineKeyboard([
                    buttons
                ])
            });
            userTextingWithBot = ctx.update.message.from.first_name;

            let currentPayerSelected;

            for (let i = 0; i < owers.length; i++) {
                currentPayerSelected = owers[i];
                let buttonsv2 = [];
                for (let j = 0; j < currentPayerSelected.meals_owed.length; j++) {
                    buttonsv2.push(
                        Markup.button.callback(
                            currentPayerSelected.meals_owed[j].meal_receiver,
                            currentPayerSelected.meals_owed[j].meal_receiver + "2"
                        )
                    );
                }
                payup.action(owers[i].first_name, async (ctx) => {
                    await ctx.replyWithMarkdown("Ok, so " + owers[i].first_name + " will be paying. " +
                        "Who is cashing in their meal? 🤑", {
                        ...Markup.inlineKeyboard([
                            buttonsv2
                        ])
                    });
                });
            }

            let currentReceiverSelected;

            for (let i = 0; i < currentPayerSelected.meals_owed.length; i++) {
                currentReceiverSelected = currentPayerSelected.meals_owed[i].meal_receiver;
                payup.action((currentPayerSelected.meals_owed[i].meal_receiver + "2"), async (ctx) => {
                    await ctx.replyWithMarkdown(
                        "Alright. To proceed, please provide proof of the meal in the form of a picture"
                    );
                });

                payup.on("photo", (ctx) => {
                    ctx.telegram.getFileLink(ctx.update.message.photo[ctx.update.message.photo.length - 1].file_id)
                        .then(async (url) => {
                            const proof = new ProofSchema({
                                trade: {
                                    meal_ower: currentPayerSelected.first_name,
                                    meal_receiver: currentReceiverSelected
                                },
                                proof_img_url: url.href
                            });
                            await proof.save().catch(err => console.log(err));

                            try {
                                // reply to user
                                await ctx.replyWithMarkdown("Ok, duly noted 😉\n\n*" + currentPayerSelected.first_name +
                                    " payed for " + currentReceiverSelected + "'s meal.*");

                                currentPayerSelected.meals_owed[i].amount === 1 ?
                                    currentPayerSelected.meals_owed.splice(i, 1) :
                                    currentPayerSelected.meals_owed[i].amount -= 1;

                                // text the loser of the bet that they now owe another meal to the specified other user
                                let textForMessage =
                                    userTextingWithBot +
                                    " updated the meals owed list:\n\n" +
                                    "--> Looks like you payed up your ";
                                if (currentPayerSelected.meals_owed.length > 0) {
                                    textForMessage += "bet!" + "\nRemaining meals owed:\n";
                                    for (let j = 0; j < currentPayerSelected.meals_owed.length; j++) {
                                        textForMessage +=
                                            currentPayerSelected.meals_owed[j].meal_receiver + " " +
                                            currentPayerSelected.meals_owed[j].amount;
                                        textForMessage += currentPayerSelected.meals_owed[j].amount > 1 ? " meals" : " meal"
                                    }
                                }
                                if (currentPayerSelected.meals_owed.length < 1) {
                                    textForMessage += "last bet!" + "\nNow you don't owe nobody nothin'"
                                }

                                await bot.telegram.sendMessage(
                                    currentPayerSelected.id,
                                    textForMessage);

                                // update the array in the database
                                await CounterSchema.findOneAndUpdate(
                                    {"first_name": currentPayerSelected.first_name},
                                    {"meals_owed": currentPayerSelected.meals_owed}
                                );

                                await ctx.scene.leave();
                            } catch (err) {
                                console.log(err)
                            }
                        });
                });
            }
        }
    });
    stage.register(payup)
    bot.use(session());
    bot.use(stage.middleware());
    bot.command('payup', (ctx) => ctx.scene.enter('payup'));
}

export default payup;