const getDialog = async () => {
    try {
        const data = await fetch("./script2/dialog.json");
        const text = await data.text();
        const json = JSON.parse(text);
        return json;
    } catch (e) {
        console.error(error);
        return null;
    }
}

const main = async () => {
    const dialogJson = await getDialog();

    const body = document.getElementsByTagName("body")[0];
    if (!body) return;

    const dialogDiv = document.createElement("div");
    dialogDiv.setAttribute("data-test", "hi");

    const h1 = document.createElement("h1");
    dialogDiv.append(h1);

    const p = document.createElement("p");
    dialogDiv.append(p);
    body.append(dialogDiv);



    const flags = {
        "bold" : false,
        "wave": false,
    };
    const dialogChoices = { }


    let interval = null;
    let nextDialog = null;
    let choiceNextDialog = null;
    function evaluateDialog() {
        const dialogLength = dialogJson.dialog.length;
        if (dialogLength === 0) return;

        if (!!interval) {
            clearInterval(interval);
            interval = null;
        }

        const existingSelect = document.querySelectorAll(".choice-options");
        if (existingSelect && existingSelect.length > 0) {
            Array.from(existingSelect).forEach(element => {
                const varName = element.getAttribute("data-name");
                dialogChoices[varName] = element.value;

                const selected = Array.from(element.children).find(e => e.value === element.value);
                if (selected.hasAttribute("data-nxtid")) {
                    choiceNextDialog = selected.getAttribute("data-nxtid");
                }

                element.remove();
            });
        }

        if (!nextDialog) {
            nextDialog = dialogJson.dialog[0];
        } else {
            let nextDialogId = nextDialog.nextDialog;
            if (choiceNextDialog) {
                nextDialogId = choiceNextDialog;
                choiceNextDialog = null;
            }

            if (!nextDialogId || nextDialogId === "END") {
                return;
            }

            const findNextDialog = Array.from(dialogJson.dialog).find(d => d.id === nextDialogId);
            if (!findNextDialog) {
                return;
            } else {
                nextDialog = findNextDialog;
            }
        }

        h1.innerText = nextDialog.title;
        p.innerHTML = "";

        let characterIndex = 0;
        let text = nextDialog.text;

        const choiceKeys = Object.keys(dialogChoices);
        if (choiceKeys && choiceKeys.length > 0) {
            choiceKeys.forEach(key => {
                text = text.replace(`{${key}}`, dialogChoices[key]);
            })
        }

        interval = setInterval(() => {
            if (characterIndex >= text.length) {
                clearInterval(interval);
                interval = null;

                const choice = nextDialog.choice;
                if (choice) {
                    const select = document.createElement("select");
                    select.classList.add("choice-options");
                    select.setAttribute("data-name", nextDialog.choice.name);
                    Array.from(nextDialog.choice.options).forEach(element => {
                        const option = document.createElement("option");
                        option.innerHTML = element.title;
                        option.value=element.value

                        if (element.nextDialog) {
                            option.setAttribute("data-nxtid", element.nextDialog);
                        }
                        
                        select.append(option);
                    });
                    dialogDiv.append(select);
                    select.focus();
                }

                // const endOfDialog = new CustomEvent("endOfDialog", {
                //     detail: {test: "data"}
                // });
                // document.dispatchEvent(endOfDialog);
            } else {
                // const character = text[characterIndex++];
                const {character, nextIndex} = parseText(text, characterIndex);
                // p.innerHTML += character;
                if (character) {
                    p.appendChild(character);
                }
                characterIndex = nextIndex;
            }
        }, 50)
    }
    evaluateDialog();

    document.addEventListener("keydown", e => {
        if (e.key === "Enter") {
            evaluateDialog();
        }
    })

    function parseText(text, index) {
        const textStr = text.toString();
        const character = textStr[index];

        if (character === '[') {
            const substr = (textStr + "").substring(index);
            const tags = substr.match(/\[.*?\]/);   // non-greedy search for a single tag. Greedy search would be .*

            const currentTag = tags[0];
            const bbCodeObj = parseBBCode(currentTag);
            // console.log({bbCodeObj})

            const tagName = currentTag.replace("[", "").replace("]", "");
            if (tagName === 'b') {
                flags.bold = true;
            } else if (tagName === '/b') {
                flags.bold = false;
            } if (tagName === 'wave') {
                flags.wave = true;
            } else if (tagName === '/wave') {
                flags.wave = false;
            }

            return { character: null, nextIndex: index + currentTag.length }
        } else {
            const span = document.createElement("span");
            span.innerHTML = character;

            if (flags.bold) {
                span.setAttribute("style", "font-weight:bold");
            }

            if (flags.wave) {
                span.setAttribute("style", "color:red");
            }

            return { character: span, nextIndex: index + 1 }
        }
    }

    function parseBBCode(text) {
        if (!text) return null;

        const textStr = text.toString() + "";
        if (textStr.length === 0) return null;

        if (textStr[0] !== '[') return null;

        const tags = textStr.match(/\[.*?\]/);   // non-greedy search for a single tag. Greedy search would be .*
        const currentTag = tags[0].replace("[", "").replace("]", "");

        let name = null, properties = null;
        if (currentTag.includes(" ")) {
            name = currentTag.slice(0, currentTag.indexOf(" "));
            properties = currentTag.slice(currentTag.indexOf(" ")).trim();
        } else {
            name = currentTag;
        }

        // REGEX provided by cursor
        // const propertiesList = textStr.match(/[a-zA-Z\_]+\=["'].+?["']/);
        const propertiesList = textStr.match(/[\w-]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s\]]+)/g);
        // const propertiesList = textStr.match(/([\w-]+)\s*=\s*(?:'([^']*)'|"([^"]*)"|([^\s\]]+))/g);

        const attributes = [];
        if (propertiesList && propertiesList.length > 0) {
            propertiesList.forEach(prop => {
                const propName = prop.slice(0, prop.indexOf("="));
                const value = prop.slice(prop.indexOf("="));
                attributes.push({
                    "name": propName,
                    "value": value
                });
            })
        }

        return {
            "name": name,
            "attributes": attributes.length !== 0 ? attributes : null
        }
    }
}

main();