import type { CommandHistory } from ".";
import type { FullScreenAppRequest } from "./FullScreenApp";
import { fetchContent, getAbsoluteDir } from "./fetchContent";
import { parseCommand } from "./parser";

type CommandExecResult = {
    histories: CommandHistory[];
    pwd: string;
    executing?: boolean;
}

export function* executeCommand(command: string, pwd: string, history: CommandHistory[] = [],
    sendFullScreenAppReq: ((req: FullScreenAppRequest | undefined) => void) | undefined = undefined
)
    : Generator<CommandExecResult | Promise<CommandExecResult>> {
    const actions = parseCommand(command);

    const newCommandHistory: CommandHistory = {
        id: history.length,
        path: pwd,
        runningStatusList: [],
        command: command,
    };
    const newHistory: CommandHistory[] = [...history, newCommandHistory];

    let newPwd = pwd;

    const getRemoteCommandResult = async (path: string, type: 'cd' | 'ls' | 'cat' | 'go' | 'less') => {
        try {
            const result = await fetchContent(path);
            if (result.success) {
                if (type === 'cd') {
                    if (result.type === "list") {
                        newCommandHistory.runningStatusList = [];
                        newPwd = path;
                        window.history.pushState({}, "", newPwd);
                    } else {
                        newCommandHistory.runningStatusList?.push({
                            type: "fail",
                            message: "Not a directory."
                        });
                    }
                } else if (type === 'ls') {
                    if (result.type === "list") {
                        newCommandHistory.runningStatusList = [];
                        newCommandHistory.resultElement = result.element;
                    } else {
                        newCommandHistory.runningStatusList?.push({
                            type: "fail",
                            message: "Not a directory."
                        });
                    }
                } else if (type === 'cat') {
                    if (result.type === "file") {
                        newCommandHistory.runningStatusList = [];
                        newCommandHistory.resultElement = result.element;
                    } else {
                        newCommandHistory.runningStatusList?.push({
                            type: "fail",
                            message: "Not a file."
                        });
                    }
                } else if (type === 'less') {
                    if (result.type === "file") {
                        newCommandHistory.runningStatusList = [];
                        sendFullScreenAppReq?.({
                            type: "less",
                            props: {
                                content: result.element,
                                filename: path.split("/").pop() || "",
                            },
                        });
                    } else {
                        newCommandHistory.runningStatusList?.push({
                            type: "fail",
                            message: "Not a file."
                        });
                    }

                } else if (type === 'go') {
                    newCommandHistory.runningStatusList = [];
                    newCommandHistory.resultElement = result.element;
                    if (result.type === "list") {
                        newPwd = path;
                    }
                }
            } else if (result.externalLink && type === "go") {
                window.location.href = result.externalLink;
                newCommandHistory.runningStatusList?.push({
                    type: "success",
                    message: "External link, redirecting..."
                });
            } else {
                newCommandHistory.runningStatusList?.push({
                    type: "fail",
                    message: result.failMessage || "Unknown error."
                });
            }


            return { histories: newHistory, pwd: newPwd }
        } catch (e) {
            console.error(e);
            return { histories: newHistory, pwd: newPwd };
        }
    };


    const result = {
        histories: newHistory,
        pwd: newPwd,
        executing: true
    };

    yield result;

    for (const action of actions) {
        if (action.type === "list" || action.type === 'view'
            || action.type === 'cd' || action.type === 'go') {
            newCommandHistory.runningStatusList?.push({ type: "running", message: "Fetching content... " });
            yield result;
        }


        if (action.type === "clear") {
            document.getElementById("init-history")?.remove();
            newHistory.length = 0;
            yield { histories: newHistory, pwd: newPwd };
        } else if (action.type === "cd") {
            let inputDir = action.path!;
            if (!inputDir) {
                newCommandHistory.runningStatusList = [{ type: "fail", message: "cd: no argument." }];
                continue;
            }
            inputDir = getAbsoluteDir(inputDir, pwd);
            yield getRemoteCommandResult(inputDir, 'cd');
        } else if (action.type === "view") {
            let path = action.path!;
            path = getAbsoluteDir(path, pwd);
            yield getRemoteCommandResult(path, action.viewer === 'less' ? 'less' : 'cat');
        } else if (action.type === "list") {
            let path = action.path!;
            path = path ? getAbsoluteDir(path, pwd) : pwd;
            yield getRemoteCommandResult(path, 'ls');
        } else if (action.type === 'go') {
            let path = action.path!;
            if (path.startsWith("http://") || path.startsWith("https://")
                || path.startsWith("//")) {
                newCommandHistory.runningStatusList?.push({
                    type: "success",
                    message: "External link, redirecting..."
                });

                window.location.href = path;
                yield { histories: newHistory, pwd: newPwd };
            }
            path = getAbsoluteDir(path, pwd);
            yield getRemoteCommandResult(path, 'go');
        } else if (action.type === "empty") {
        } else if (action.type === "error") {
            newCommandHistory.runningStatusList = [{
                type: "fail",
                message: action.message!
            }];
        } else if (action.type === "print") {
            const ele = document.createElement("pre");
            if (action.message) {
                ele.textContent = action.message;
                newCommandHistory.resultElement = ele;
            }
        } else {
            newCommandHistory.runningStatusList = [{
                type: "fail",
                message: "Internal error."
            }];
        }
    }

    yield new Promise((resolve) => resolve({
        histories: newHistory,
        pwd: newPwd,
        executing: false
    }));
}