import bot, {stage} from "../bot.js";

import {Markup, Scenes, session} from "telegraf";
import CounterSchema from "../dao/models/Counter.js";
import ProofSchema from "../dao/models/Proof.js";
import buttonArrayMaker from "../service/ButtonArrayService.js";

const payup = async () => {
    const payupScene = new Scenes.BaseScene('payup');

    // make sure that the user can cancel the process and the cancellation is logged
    payupScene.hears("cancel", (ctx) => {
        ctx.scene.leave();
        ctx.reply("payup process cancelled.")
    });
    payupScene.leave(() => console.log("Left Payup Process"));

    let userTextingWithBot;
    let counters = [], owers = [];

    payupScene.enter(async (ctx) => {
        // get counters from db and filter out only counters that actually owe meals
        counters = await CounterSchema.find();
        owers = counters.filter(obj => {
            if (obj.meals_owed.length > 0) return obj;
        });

        // if nobody owes anything, tell the user and cancel the process
        if (owers.length < 1) {
            await ctx.reply("Looks like no meals are owed, no one has to pay up if nothing is owed🙈");
            await ctx.scene.leave();
        }

        // if somebody owes something run the process
        if (owers.length > 0) {
            await ctx.replyWithMarkdown("The current list of users that owe meals are shown below📝\n" +
                "\n_(Please click the name of the user that will be paying for the meal, " +
                "or type cancel to terminate the update process.)_", {
                ...Markup.inlineKeyboard(buttonArrayMaker(owers, ["first_name"], "update1"))
            });
            userTextingWithBot = ctx.update.message.from.first_name;

            let currentPayerSelected;

            for (let i = 0; i < owers.length; i++) {
                payupScene.action(owers[i].first_name, async (ctx) => {
                    currentPayerSelected = owers[i];
                    await ctx.replyWithMarkdown("Ok, so " + owers[i].first_name + " will be paying. " +
                        "Who is cashing in their meal? 🤑", {
                        ...Markup.inlineKeyboard(
                            buttonArrayMaker(
                                currentPayerSelected.meals_owed,
                                ["meal_receiver"],
                                "update2"
                            )
                        )
                    });

                    let currentReceiverSelected;
                    for (let k = 0; k < currentPayerSelected.meals_owed.length; k++) {
                        payupScene.action((currentPayerSelected.meals_owed[k].meal_receiver + "2"), async (ctx) => {
                            currentReceiverSelected = currentPayerSelected.meals_owed[k].meal_receiver;
                            currentPayerSelected.meals_owed[k].amount === 1 ?
                                currentPayerSelected.meals_owed.splice(k, 1) :
                                currentPayerSelected.meals_owed[k].amount -= 1;

                            await ctx.replyWithMarkdown(
                                "Ok, almost done :)\n" +
                                "To proceed, please provide proof of the meal in the form of a picture📸"
                            );
                        });

                        payupScene.on("photo", (ctx) => {
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

                                    // update the array in the database
                                    await CounterSchema.findOneAndUpdate(
                                        {"first_name": currentPayerSelected.first_name},
                                        {"meals_owed": currentPayerSelected.meals_owed}
                                    );
                                    // reply to user
                                    await ctx.replyWithMarkdown("Ok, duly noted 😉\n\n*" +
                                        currentPayerSelected.first_name + " payed for " +
                                        currentReceiverSelected + "'s meal.*\n\n" +
                                        "PS: Your picture has been uploaded as evidence. 🖼");

                                    // text the loser of the bet that they now owe another meal to the specified other user
                                    let textForMessage =
                                        userTextingWithBot +
                                        " updated the meals owed list:\n\n" +
                                        "--> Looks like you payed up your ";
                                    if (currentPayerSelected.meals_owed.length > 0) {
                                        textForMessage += "bet!" + "\n\nRemaining meals owed:\n";
                                        for (let j = 0; j < currentPayerSelected.meals_owed.length; j++) {
                                            textForMessage +=
                                                currentPayerSelected.meals_owed[j].meal_receiver + " " +
                                                currentPayerSelected.meals_owed[j].amount;
                                            textForMessage +=
                                                currentPayerSelected.meals_owed[j].amount > 1 ? " meals" : " meal";
                                            textForMessage += "\n";
                                        }
                                    }
                                    if (currentPayerSelected.meals_owed.length < 1) {
                                        textForMessage += "last bet!" + "\nNow you don't owe nobody nothin'"
                                    }

                                    await bot.telegram.sendMessage(
                                        currentPayerSelected.id,
                                        textForMessage
                                    );

                                    await ctx.scene.leave();

                                });
                        });
                    }
                });
            }
        }
    });
    stage.register(payupScene)
    bot.use(session());
    bot.use(stage.middleware());
    bot.command('payup', (ctx) => ctx.scene.enter('payup'));
}

export default payup;