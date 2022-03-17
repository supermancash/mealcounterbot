import bot, {stage} from "../bot.js";
import {Markup, Scenes} from "telegraf";
import ProofSchema from "../dao/models/Proof.js";
import ButtonArrayService from "../service/ButtonArrayService.js";

const proof = async () => {
    //TODO: add code annotations and clean up
    // TODO: authentication message with yes no buttons if proof to user that payed is adequate

    const proofScene = new Scenes.BaseScene('proof');

    proofScene.action("cancel", async (ctx) => {
        await ctx.scene.leave();
        await ctx.reply("proof process cancelled.")
    });
    proofScene.leave(() => console.log("Left Proof Process"));

    proofScene.enter(async (ctx) => {
        const proofList = await ProofSchema.find();
        if (proofList.length < 1) {
            await ctx.reply("Sorry, looks like no meals have been recorded🙁");
            await ctx.scene.leave();
        }
        if (proofList.length > 0) {
            proofList.reverse();
            await ctx.replyWithMarkdown("The list below shows the most recent meals eaten😋\n" +
                "\n_(Please click the date of the image you would like to see, " +
                "or type cancel to terminate the lost process.)_",
                {
                    ...Markup.inlineKeyboard(ButtonArrayService(
                        proofList,
                        ["trade.meal_ower", "trade.meal_receiver" ,"createdAt"],
                        "proof"
                    ))
                }
            );
            for (let i = 0; i < proofList.length; i++) {
                proofScene.action(JSON.stringify(proofList[i].createdAt), async (ctx) => {
                    await ctx.replyWithPhoto({url: proofList[i].proof_img_url});
                    await ctx.reply("To see another picture, please restart the proof process.\n(/proof)")
                    await ctx.scene.leave();
                })
            }
        }
    });
    stage.register(proofScene)
    bot.command('proof', (ctx) => ctx.scene.enter('proof'));
}

export default proof;