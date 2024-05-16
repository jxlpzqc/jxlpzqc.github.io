export function getHistories(): string[] {
    return JSON.parse(localStorage.getItem("history") || "[]");
}

export function appendHistories(history: string) {
    const histories = getHistories();
    if (histories[histories.length - 1] === history) return;
    histories.push(history);
    // save last 100 histories
    localStorage.setItem("history", JSON.stringify(histories.slice(-100)));
}