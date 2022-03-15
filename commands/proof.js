import bot, {stage} from "../bot.js";
import {Markup, Scenes} from "telegraf";
import ProofSchema from "../dao/models/Proof.js";

const proof = async () => {
    const proofScene = new Scenes.BaseScene('proof');

    proofScene.hears("cancel", (ctx) => {
        ctx.scene.leave();
        ctx.reply("proof process cancelled.")
    });
    proofScene.leave(() => console.log("Left Proof Process"));

    proofScene.enter(async (ctx) => {
        const proofList = await ProofSchema.find();
        if (proofList.length < 1) {
            await ctx.reply("Sorry, looks like no meals have been recorded🙁");
            await ctx.scene.leave();
        }
        if (proofList.length > 0) {
            let buttons = [];
            let seperatedButtons = [];
            for (let i = 0; i < proofList.length; i++) {
                buttons.push(Markup.button.callback(
                    proofList[i].trade.meal_ower  + " payed " +
                    proofList[i].trade.meal_receiver + " (" +
                    proofList[i].createdAt.getUTCDate() + "." +
                    proofList[i].createdAt.getUTCMonth() + "." +
                    proofList[i].createdAt.getUTCFullYear() + ")",
                    JSON.stringify(proofList[i].createdAt)));
            }
            for (let i = 0; i < buttons.length; i++) {
                seperatedButtons.push([buttons[i]],);
            }
            await ctx.replyWithMarkdown("The list below shows the most recent meals eaten😋\n" +
                "\n_(Please click the date of the image you would like to see, " +
                "or type cancel to terminate the update process.)_",
                {
                    ...Markup.inlineKeyboard(seperatedButtons)
                }
            );
            for (let i = 0; i < proofList.length; i++) {
                proofScene.action(JSON.stringify(proofList[i].createdAt), async (ctx) => {
                    await ctx.replyWithPhoto({url: proofList[i].proof_img_url});
                })
            }
            await ctx.scene.leave();
        }
    });
    stage.register(proofScene)
    bot.command('proof', (ctx) => ctx.scene.enter('proof'));
}

export default proof;