import bot, {stage} from "../bot.js";
import CounterSchema from "../dao/models/Counter.js";
import ProofSchema from "../dao/models/Proof.js";
import ButtonArrayService from "../service/ButtonArrayService.js";

import {Markup, Scenes} from "telegraf";
import fetch from "node-fetch";

const payup = () => {
    const payupScene = new Scenes.WizardScene(
        'payup',
        (ctx) =>
            payupEntry(ctx),
        (ctx) =>
            payupLvl1(ctx),
        (ctx) =>
            payupLvl2(ctx),
        (ctx) =>
            payupLvl3(ctx),
        (ctx) =>
            photoCallback(ctx)
    );

    const payupEntry = async (ctx) => {
        ctx.session.payupData = {};

        // get counters from db and filter out only counters that actually owe meals
        ctx.session.payupData.owers = await CounterSchema.find({"meals_owed.0": {"$exists": true}});

        // if nobody owes anything, tell the user and cancel the process
        if (ctx.session.payupData.owers.length === 0) {
            await ctx.reply("Looks like no meals are owed, no one has to pay up if nothing is owed🙈");
            return ctx.scene.leave();
        }

        // owers.length > 0

        // let the user select the person that will payup the meal
        await ctx.replyWithMarkdown("The current list of users that owe meals are shown below📝\n" +
            "\n_(Please click the name of the user that will be paying for the meal, " +
            "or type cancel to terminate the lost process.)_", {
            ...Markup.inlineKeyboard(ButtonArrayService(
                ctx.session.payupData.owers,
                ["first_name", "id"],
                "update",
                false))
        });
        return ctx.wizard.next();
    }

    const payupLvl1 = async (ctx) => {
        console.log("Shouldnt be reachable")
        if (!ctx.update.callback_query) await ctx.replyWithMarkdown("Please click one of the *buttons* :)");
        if (ctx.update.callback_query) {
            if (ctx.update.callback_query.data === 'back') return ctx.wizard.steps[0](ctx);
            ctx.session.payupData.mealPayer =
                ctx.session.payupData.owers.filter((obj) => obj.id === ctx.update.callback_query.data)[0];
            await ctx.replyWithMarkdown(
                "Ok, so " + ctx.session.payupData.mealPayer.first_name +
                " will be paying. " +
                "Who is cashing in their meal?🤑",
                {
                    ...Markup.inlineKeyboard(
                        ButtonArrayService(
                            ctx.session.payupData.mealPayer.meals_owed,
                            ["meal_receiver", "_id"],
                            "update",
                            true
                        )
                    )
                }
            );
            return ctx.wizard.next();
        }
    }

    const payupLvl2 = async (ctx) => {
        if (!ctx.update.callback_query) await ctx.replyWithMarkdown("Please click one of the *buttons* :)");
        if (ctx.update.callback_query) {
            if (ctx.update.callback_query.data === 'back') return ctx.wizard.steps[0](ctx);
            ctx.session.payupData.mealReceiver =
                ctx.session.payupData.mealPayer.meals_owed.filter(
                    (obj) => obj._id.toString() === ctx.update.callback_query.data)[0];
            await ctx.replyWithMarkdown(
                "Please select the bet that " +
                ctx.session.payupData.mealReceiver.meal_receiver +
                " is cashing in with " + ctx.session.payupData.mealPayer.first_name, {
                    ...Markup.inlineKeyboard(
                        ButtonArrayService(
                            ctx.session.payupData.mealReceiver.bets,
                            [""],
                            "payup",
                            true
                        )
                    )
                }
            );
            return ctx.wizard.next();
        }
    }

    const payupLvl3 = async (ctx) => {
        if (!ctx.update.callback_query) await ctx.replyWithMarkdown("Please click one of the *buttons* :)");
        if (ctx.update.callback_query) {
            if (ctx.update.callback_query.data === 'back') return ctx.wizard.steps[0](ctx);
            ctx.session.payupData.mealBet = ctx.session.payupData.mealReceiver.bets.filter((bet) => {
                if (bet === ctx.update.callback_query.data) return bet;
            })[0];
            await ctx.replyWithMarkdown(
                "Ok, almost done :)\n" +
                "To finish the payup process, " +
                "please provide proof of the meal in the form of a picture📸"
            );
            return ctx.wizard.next();
        }
    }

    const photoCallback = async (ctx) => {
        if (!ctx.update.message || !ctx.update.message.photo) {
            await ctx.replyWithMarkdown("Please send a *picture* (jpeg, jpg, png etc.)");
            return ctx.wizard.steps[0](ctx);
        }
        if (ctx.update.message.photo) {
            // get the image from the telegram api
            await ctx.telegram.getFileLink(
                ctx.update.message.photo[ctx.update.message.photo.length - 1].file_id
            ).then(async (imageObj) => {
                // change the image into a base64 string
                const response = await fetch(imageObj.href);
                const data = await response.buffer();
                const b64 = data.toString('base64');

                // create object to be saved to the db
                const proof = new ProofSchema({
                    trade: {
                        meal_ower: ctx.session.payupData.mealPayer.first_name,
                        meal_receiver: ctx.session.payupData.mealReceiver.meal_receiver,
                        bet: ctx.session.payupData.mealBet
                    },
                    proof_img: {
                        data: b64
                    }
                });
                // saving the proof obj to db
                await proof.save().catch(err => console.error(err));
            });
            // update the counters in the database,
            // because the user has payed up their owed meal

            ctx.session.payupData.mealPayer.meals_owed = ctx.session.payupData.mealReceiver.amount === 1 ?
                ctx.session.payupData.mealPayer.meals_owed.filter((obj) => {
                        if (obj !== ctx.session.payupData.mealReceiver) return obj;
                    }
                )
                :
                ctx.session.payupData.mealPayer.meals_owed.filter((obj) => {
                        if (obj === ctx.session.payupData.mealReceiver) {
                            obj.bets = obj.bets.filter((bet) => {
                                if (bet !== ctx.session.payupData.mealBet) return bet
                            });
                            obj.amount -= 1;
                        }
                        return obj;
                    }
                );
            await CounterSchema.findOneAndUpdate(
                {"id": ctx.session.payupData.mealPayer.id},
                {"meals_owed": ctx.session.payupData.mealPayer.meals_owed}
            );

            // tell user they're done and that the img was uploaded
            await ctx.replyWithMarkdown("Ok, duly noted 😉\n\n*" +
                ctx.session.payupData.mealPayer.first_name + " payed for " +
                ctx.session.payupData.mealReceiver.meal_receiver + "'s meal.*\n\n" +
                "PS: Your picture has been uploaded as evidence.🖼");

            // defining the userTextingWithBot variable
            const userTextingWithBot = ctx.update.message ?
                ctx.update.message.from.first_name :
                ctx.update.callback_query.from.first_name;

            // remotely text the ower that the payoff of their meal has been recorded
            let textForMessage =
                userTextingWithBot +
                " updated the meals owed list:\n\n" +
                "--> Looks like you payed up your ";
            if (ctx.session.payupData.mealPayer.meals_owed.length > 0) {
                textForMessage += "bet!" + "\n\nRemaining meals owed:\n";
                for (let h = 0; h < ctx.session.payupData.mealPayer.meals_owed.length; h++) {
                    textForMessage +=
                        ctx.session.payupData.mealReceiver.meal_receiver + " " +
                        ctx.session.payupData.mealReceiver.amount;
                    textForMessage +=
                        ctx.session.payupData.mealReceiver.amount > 1 ?
                            " meals" :
                            " meal";
                    textForMessage += "\n";
                }
            }
            if (ctx.session.payupData.mealPayer.meals_owed.length < 1) {
                textForMessage += "last bet!" + "\nNow you don't owe nobody nothin'"
            }
            await bot.telegram.sendMessage(
                ctx.session.payupData.mealPayer.id,
                textForMessage
            );
            return await ctx.scene.leave();
        }
    }

    // adding listener for cancellation and that the cancellation is shown to the user
    payupScene.action("cancel", async (ctx) => {
        return await ctx.scene.leave();
    });
    payupScene.leave(
        (ctx) => {
            ctx.scene.options.defaultSession = {};
            ctx.replyWithMarkdown("`(left payup process)`")
        }
    );

    // connecting scene with rest of bot
    stage.register(payupScene)
    bot.command('payup', (ctx) => ctx.scene.enter('payup'));
}

export default payup;