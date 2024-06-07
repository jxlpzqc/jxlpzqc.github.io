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
    let match: RegExpExecArray | null;
    if (match = /^cd(\s+(\S+?))?(\s+.+)?$/.exec(command)) {
        const path = match[2] || "/", other = match[3];
        if (other) return { type: 'error', message: "cd: too many arguments" };
        return { type: "cd", path };
    }
    if (match = /^less(\s+(\S+?))?(\s+.+)?$/.exec(command)) {
        const path = match[2], other = match[3];
        if (!path) return { type: "error", message: "less: no argument." };
        if (other) return { type: "error", message: "less: too many arguments" }
        return { type: "view", path, viewer: "less" };
    }
    if (match = /^less(\s+(\S+?))?(\s+.+)?$/.exec(command)) {
        const path = match[2], other = match[3];
        if (!path) return { type: "error", message: "less: no argument." };
        if (other) return { type: "error", message: "less: too many arguments" }
        return { type: "view", path, viewer: "less" };
    }
    if (match = /^cat(\s+(\S+?))?(\s+.+)?$/.exec(command)) {
        const path = match[2], other = match[3];
        if (!path) return { type: "error", message: "less: no argument." };
        if (other) return { type: "error", message: "less: too many arguments" }
        return { type: "view", path, viewer: "cat" };
    }
    if (match = /^ls(\s+(\S+?))?(\s+.+)?$/.exec(command)) {
        const path = match[2], other = match[3];
        if (other) return { type: "error", message: "ls: too many arguments" };
        return { type: "list", path };
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