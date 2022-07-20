import {Markup} from "telegraf";


const buttonArrayMaker = (buttonContent, attributeList, type) => {
    let buttons = [];
    let seperatedButtons = [];

    if (type === "proof") {
        for (let i = 0; i < buttonContent.length; i++) {
            buttons.push(Markup.button.callback(
                    (
                        buttonContent[i].get(attributeList[0]) +
                        " payed for " +
                        buttonContent[i].get(attributeList[1]) + " (" +
                        buttonContent[i].get(attributeList[2]).getUTCDate() + "." +
                        (buttonContent[i].get(attributeList[2]).getUTCMonth() + 1) + "." +
                        buttonContent[i].get(attributeList[2]).getUTCFullYear() +
                        ")"
                    ),
                    JSON.stringify(buttonContent[i].get(attributeList[2]))
                )
            );
        }
        for (let i = 0; i < buttons.length; i++) {
            seperatedButtons.push([buttons[i]],);
        }
    }
    if (type === "update") {
        for (let i = 0; i < buttonContent.length; i++) {
            buttons.push(Markup.button.callback(
                    buttonContent[i].get(attributeList[0]),
                    buttonContent[i].get(attributeList[1])
                )
            );
        }
        for (let i = 0; i < buttons.length; i++) {
            seperatedButtons.push([buttons[i]],);
        }
    }

    if (type === "payup") {
        for (let i = 0; i < buttonContent.length; i++) {
            buttons.push(Markup.button.callback(
                    buttonContent[i].substring(0, 50) + "...",
                    buttonContent[i].substring(0, 50) + "..."
                )
            );
        }
        for (let i = 0; i < buttons.length; i++) {
            seperatedButtons.push([buttons[i]],);
        }
    }
    seperatedButtons.push([Markup.button.callback("❌ cancel ❌", "cancel")],);

    return seperatedButtons;
}

export default buttonArrayMaker;