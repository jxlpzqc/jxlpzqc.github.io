export type Action = {
    type: "clear" | "cd" | "go" | "view" | "list" | "empty" | "error" | "print";
    message?: string;
    path?: string;
    viewer?: 'less' | 'cat';
}

const HELP_MESSAGE = `
Available commands: cd, go, less, cat, ls, clear.

cd <path> - Change directory to <path>.
go <link> - Go to <link>.
less <file> - View file <file> with less.
cat <file> - View file <file> with cat.
ls [path] - List files in [path].
clear - Clear the screen.
`



function parseSingleCommand(command: string): Action {

    if (command === "clear") {
        return { type: "clear" };
    }
    if (command.startsWith("cd")) {
        const path = command.split(" ")[1];
        if (!path) {
            return { type: "error", message: "cd: no argument." };
        }
        return { type: "cd", path };
    }
    if (command.startsWith("less")) {
        const path = command.split(" ")[1];
        if (!path) {
            return { type: "error", message: "less: no argument." };
        }
        return { type: "view", path, viewer: "less" };
    }
    if (command.startsWith("cat")) {
        const path = command.split(" ")[1];
        if (!path) {
            return { type: "error", message: "cat: no argument." };
        }
        return { type: "view", path, viewer: "cat" };
    }
    if (command.startsWith("ls")) {
        return { type: "list", path: command.split(" ")[1] };
    }
    if (command.startsWith("go")) {
        const path = command.split(" ")[1];
        if (!path) {
            return { type: "error", message: "go: no argument." };
        }
        return { type: "go", path: command.split(" ")[1] };
    }
    if (command === "help") {
        return { type: "print", message: HELP_MESSAGE };
    }
    if (command === "") {
        return { type: "empty" };
    }
    return { type: "error", message: `sh: unknown command, type \`help\` to get help.` };
}

export function parseCommand(command: string): Action[] {
    const commands = command.split(";").map((c) => c.trim());

    return commands.map((c) => parseSingleCommand(c));
}