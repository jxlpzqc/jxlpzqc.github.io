document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (target.dataset.command === "less") {
        if (window.sendToLess) {
            const initContent = target.closest(".command-result") as HTMLElement | null;
            if (!initContent) {
                console.error("No init-content found.");
                return;
            }
            // clone the dom element
            const content = initContent.cloneNode(true) as HTMLElement;
            if (initContent) window.sendToLess(content, "<stdin>");
        } else {
            console.error(
                "sendToLess is not defined, interactive shell is not loaded.",
            );
        }
    }
    if (target.dataset.command === "copylink") {
        const plink = target.dataset.link;
        if (plink === undefined) return;
        // convert link to link which starts with http(s)://
        const link = plink.startsWith("/") ?
            location.origin + plink : plink;
        
        // write link to clipboard
        navigator.clipboard.writeText(link).then(() => {
            target.textContent = "Copied!";
        }).catch((e) => {
            console.error("Failed to copy link to clipboard.", e);
        });
    }
});

document.addEventListener("keydown", (e) => {
    // find last .command-result and send to less
    if (e.ctrlKey && e.key === "h") {
        e.preventDefault();

        if (!window.sendToLess) {
            console.error(
                "sendToLess is not defined, interactive shell is not loaded.",
            );
            return;
        }
        const items = document.querySelectorAll(".command-result:last-child");
        if (items.length === 0) {
            console.error("No command-result found.");
            return;
        }
        const last = items[items.length - 1] as HTMLElement;
        window.sendToLess(last.cloneNode(true) as HTMLElement, "<stdin>");
    }
});