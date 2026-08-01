console.log("hello world");

const getDialog = async () => {
    try {
        const data = await fetch("./script1/dialog.txt");
        const text = await data.text();
        return text;
    } catch (e) {
        console.error(error);
        return null;
    }
}

const main = async () => {
    const dialogText = await getDialog();
    // console.log(dialogText);

    if (!dialogText) return;

    const body = document.getElementsByTagName("body")[0];
    if (!body) return;

    const dialogDiv = document.createElement("div");
    dialogDiv.setAttribute("data-test", "hi");

    const h1 = document.createElement("h1");
    dialogDiv.append(h1);

    const p = document.createElement("p");
    dialogDiv.append(p);
    body.append(dialogDiv);

    const lines = dialogText
        .split(/\n/gi)
        .map(line => line.trim())
        .filter(line => !!line);
    console.log(lines);

    let interval = null;
    function displayNextDialog(name, text) {
        if (!!interval) {
            clearInterval(interval);
            interval = null;
        }

        h1.innerText = name;
        p.innerHTML = "";

        let index = 0;
        interval = setInterval(() => {
            if (index >= text.length) {
                clearInterval(interval);
                interval = null;

                const endOfDialog = new CustomEvent("endOfDialog", {
                    detail: {test: "data"}
                });
                document.dispatchEvent(endOfDialog);
                return;
            }

            const character = text[index++];
            p.innerHTML += character;

            console.log(interval);
        }, 50)
    }

    const name = lines.shift().replace(":", "");
    const text = lines.shift();
    displayNextDialog(name, text);

    document.addEventListener("keydown", e => {
        if (e.key === 'Enter' && lines.length > 0) {
            const name = lines.shift().replace(":", "");
            const text = lines.shift();
            displayNextDialog(name, text);
        }
    })

    document.addEventListener("endOfDialog", e => {
        // console.log("end of dialog")
        console.log(e.detail.test)
    })

}

main();