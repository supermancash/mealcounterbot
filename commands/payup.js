import bot, {stage} from "../bot.js";

import {Markup, Scenes, session} from "telegraf";
import fetch from "node-fetch";

import CounterSchema from "../dao/models/Counter.js";
import buttonArrayMaker from "../service/ButtonArrayService.js";
import ProofSchema from "../dao/models/Proof.js";

const payup = async () => {
    const payupScene = new Scenes.BaseScene('payup');

// adding listener for cancellation and that the cancellation is shown to the user
    payupScene.action("cancel", (ctx) => {
        ctx.scene.leave();
    });
    payupScene.leave((ctx) => ctx.replyWithMarkdown("`(left payup process)`"));

// creating listener for when user clicks the back button while in the scene
    payupScene.action("back", async (ctx) => {
        await ctx.scene.enter('payup');
    });

    payupScene.enter(async (ctx) => {
        let userTextingWithBot, counters, owers;

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

    // if anyone owes something run the process
        if (owers.length > 0) {
        // let the user select the person that will payup the meal
            await ctx.replyWithMarkdown("The current list of users that owe meals are shown below📝\n" +
                "\n_(Please click the name of the user that will be paying for the meal, " +
                "or type cancel to terminate the lost process.)_", {
                ...Markup.inlineKeyboard(buttonArrayMaker(owers, ["first_name"], "update1"))
            });

        // defining the userTextingWithBot variable
            ctx.update.message === undefined ?
                userTextingWithBot = ctx.update.callback_query.from.first_name :
                userTextingWithBot = ctx.update.message.from.first_name;

            let currentPayerSelected;

        // adding action listeners for all possible owers, then asking the user who's meal the ower is paying
            for (let i = 0; i < owers.length; i++) {
                payupScene.action(owers[i].first_name, async (ctx) => {
                    currentPayerSelected = owers[i];
                    await ctx.replyWithMarkdown("Ok, so " + owers[i].first_name + " will be paying. " +
                        "Who is cashing in their meal?🤑", {
                        ...Markup.inlineKeyboard(
                            buttonArrayMaker(
                                currentPayerSelected.meals_owed,
                                ["meal_receiver"],
                                "update2"
                            )
                        )
                    });

                    let currentReceiverSelected;
                // adding action listeners for all possible receivers, after the ower has been selected
                    for (let k = 0; k < currentPayerSelected.meals_owed.length; k++) {
                        payupScene.action((currentPayerSelected.meals_owed[k].meal_receiver + "2"), async (ctx) => {
                            currentReceiverSelected = currentPayerSelected.meals_owed[k].meal_receiver;
                            await ctx.replyWithMarkdown(
                                "Please select the bet that " +
                                currentReceiverSelected +
                                " is cashing in.", {
                                    ...Markup.inlineKeyboard(
                                        buttonArrayMaker(
                                            currentPayerSelected.meals_owed[k].bets,
                                            [""],
                                            "payup"
                                        )
                                    )
                                }
                            );

                        // lastly add listeners for the selected receiver and
                        // ask the user for an image as proof for the meal being paid
                            for (let j = 0; j < currentPayerSelected.meals_owed[k].bets.length; j++) {
                                payupScene.action(currentPayerSelected.meals_owed[k].bets[j], async (ctx) => {
                                    await ctx.replyWithMarkdown(
                                        "Ok, almost done :)\n" +
                                        "To finish the payup process, " +
                                        "please provide proof of the meal in the form of a picture📸"
                                    );

                                // add listener for the proof picture
                                    payupScene.on("photo", (ctx) => {
                                    // get the image from the telegram api
                                        ctx.telegram.getFileLink(
                                            ctx.update.message.photo[ctx.update.message.photo.length - 1].file_id
                                        ).then(async (imageObj) => {
                                        // change the image into a base64 string
                                            const response = await fetch(imageObj.href);
                                            const data = await response.buffer();
                                            const b64 = data.toString('base64');

                                        // create object to be saved to the db
                                            const proof = new ProofSchema({
                                                trade: {
                                                    meal_ower: currentPayerSelected.first_name,
                                                    meal_receiver: currentReceiverSelected,
                                                    bet: currentPayerSelected.meals_owed[k].bets[j]
                                                },
                                                proof_img: {
                                                    data: b64
                                                }
                                            });
                                        // saving the proof obj to db
                                            await proof.save().catch(err => console.log(err));

                                        // update the counters in the database,
                                        // because the user has payed up their owed meal
                                            currentPayerSelected.meals_owed[k].bets.splice(j, 1);
                                            currentPayerSelected.meals_owed[k].amount === 1 ?
                                                currentPayerSelected.meals_owed.splice(k, 1) :
                                                currentPayerSelected.meals_owed[k].amount -= 1;
                                            await CounterSchema.findOneAndUpdate(
                                                {"first_name": currentPayerSelected.first_name},
                                                {"meals_owed": currentPayerSelected.meals_owed}
                                            );

                                        // tell user they're done and that the img was uploaded
                                            await ctx.replyWithMarkdown("Ok, duly noted 😉\n\n*" +
                                                currentPayerSelected.first_name + " payed for " +
                                                currentReceiverSelected + "'s meal.*\n\n" +
                                                "PS: Your picture has been uploaded as evidence.🖼");

                                        // remotely text the ower that the payoff of their meal has been recorded
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
                                })
                            }
                        });
                    }
                });
            }
        }
    });

// connecting scene with rest of bot
    stage.register(payupScene)
    bot.use(session());
    bot.use(stage.middleware());
    bot.command('payup', (ctx) => ctx.scene.enter('payup'));
}

export default payup;