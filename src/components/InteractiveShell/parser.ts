export type Action = {
    type: "clear" | "changeDir" | "go" | "viewPost" | "list" | "unknown" | "empty" | "error";
    message?: string;
    path?: string;
    viewer?: 'less' | 'cat';
}



function parseSingleCommand(command: string): Action {

    if (command === "clear") {
        return { type: "clear" };
    }
    if (command.startsWith("cd")) {
        const path = command.split(" ")[1];
        if (!path) {
            return { type: "error", message: "cd: no argument." };
        }
        return { type: "changeDir", path };
    }
    if (command.startsWith("less")) {
        const path = command.split(" ")[1];
        if (!path) {
            return { type: "error", message: "less: no argument." };
        }
        return { type: "viewPost", path, viewer: "less" };
    }
    if (command.startsWith("cat")) {
        const path = command.split(" ")[1];
        if (!path) {
            return { type: "error", message: "cat: no argument." };
        }
        return { type: "viewPost", path, viewer: "cat" };
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
    if (command === "") {
        return { type: "empty" };
    }
    return { type: "unknown" };
}

export function parseCommand(command: string): Action[] {
    const commands = command.split(";").map((c) => c.trim());

    return commands.map((c) => parseSingleCommand(c));
}