import bot, {stage} from "../bot.js";
import {Markup, Scenes} from "telegraf";
import ProofSchema from "../dao/models/Proof.js";
import ButtonArrayService from "../service/ButtonArrayService.js";

const proof = () => {
    // TODO: authentication message with yes no buttons if proof to user that payed is adequate

    const proofScene = new Scenes.BaseScene('proof');

    proofScene.action("cancel", async (ctx) => {
        return await ctx.scene.leave();
    });
    proofScene.leave((ctx) => ctx.replyWithMarkdown("`(left proof process)`"));

    proofScene.enter(async (ctx) => {
        const proofList = await ProofSchema.find();
        if (proofList.length < 1) {
            await ctx.reply("Sorry, looks like no meals have been recorded🙁");
            return await ctx.scene.leave();
        }
        if (proofList.length > 0) {
            proofList.reverse();
            await ctx.replyWithMarkdown("The list below shows the most recent meals eaten😋\n" +
                "\n_(Please click the date of the image you would like to see, " +
                "or type cancel to terminate the lost process.)_",
                {
                    ...Markup.inlineKeyboard(ButtonArrayService(
                        proofList,
                        ["trade.meal_ower", "trade.meal_receiver", "createdAt"],
                        "proof"
                    ))
                }
            );

            for (let i = 0; i < proofList.length; i++) {
                proofScene.action(JSON.stringify(proofList[i].createdAt), async (ctx) => {
                    await ctx.replyWithPhoto(
                        {source: Buffer.from(proofList[i].proof_img.data, 'base64')},
                        {caption: "This meal was cashed in regarding the following bet: \n" + proofList[i].trade.bet})
                        .then(() => {
                            ctx.reply("To see another picture, please restart the proof process.\n(/proof)");
                        })
                        .catch(err => {
                            console.log(err);
                            ctx.reply("I encountered an error fetching the specified proof. " +
                                "Please try again at a later time. (/proof)");
                        });
                    return await ctx.scene.leave();
                })
            }
        }
    });
    stage.register(proofScene)
    bot.command('proof', (ctx) => ctx.scene.enter('proof'));
}

export default proof;