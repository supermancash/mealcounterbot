import bot, {stage} from "../bot.js";
import {Markup, Scenes} from "telegraf";
import ProofSchema from "../dao/models/Proof.js";
import ButtonArrayService from "../service/ButtonArrayService.js";

const proof = () => {
    // TODO: authentication message with yes no buttons if proof to user that payed is correct, maybe in payup?

    const proofScene = new Scenes.WizardScene(
        'proof',
        (ctx) => proofEntry(ctx),
        (ctx) => proofLvl1(ctx),
    );

    proofScene.action("cancel", async (ctx) => {
        return await ctx.scene.leave();
    });
    proofScene.leave(
        (ctx) =>
            ctx.replyWithMarkdown("`(left proof process)`")
    );

    const proofEntry = async (ctx) => {
        ctx.session.proofData = {};
        ctx.session.proofData.prooflist = await ProofSchema.find();

        if (ctx.session.proofData.prooflist.length < 1) {
            await ctx.reply("Sorry, looks like no meals have been recorded🙁");
            return await ctx.scene.leave();
        }
        if (ctx.session.proofData.prooflist.length > 0) {
            ctx.session.proofData.prooflist.reverse();
            await ctx.replyWithMarkdown("The list below shows the most recent meals eaten😋\n" +
                "\n_(Please click the date of the image you would like to see, " +
                "or type cancel to terminate the lost process.)_",
                {
                    ...Markup.inlineKeyboard(ButtonArrayService(
                        ctx.session.proofData.prooflist,
                        ["trade.meal_ower", "trade.meal_receiver", "createdAt"],
                        "proof"
                    ))
                }
            );
            return ctx.wizard.next();
        }
    }

    const proofLvl1 = async (ctx) => {
        if (!ctx.update.callback_query) await ctx.replyWithMarkdown("Please click one of the *buttons* :)");
        if (ctx.update.callback_query) {
            ctx.session.proofData.proofSelected = ctx.session.proofData.prooflist.filter(
                (obj) => JSON.stringify(obj.createdAt) === ctx.update.callback_query.data
            )[0];

            await ctx.replyWithPhoto(
                {source: Buffer.from(ctx.session.proofData.proofSelected.proof_img.data, 'base64')},
                {
                    caption:
                        "This meal was cashed in regarding the following bet: \n" +
                        ctx.session.proofData.proofSelected.trade.bet
                }
            )
                .then(() => {
                    ctx.reply("To see another picture, please restart the proof process.\n(/proof)");
                })
                .catch(err => {
                    console.log(err);
                    ctx.reply("I encountered an error fetching the specified proof. " +
                        "Please try again at a later time. (/proof)");
                });
            return await ctx.scene.leave();
        }
    }

    stage.register(proofScene)
    bot.command('proof', (ctx) => ctx.scene.enter('proof'));
}

export default proof;