import type { CommandHistory } from ".";
import { parseCommand } from "./parser";

export async function fetchItem(dir: string): Promise<{
    success: boolean;
    failMessage?: string;
    type?: string;
    element?: HTMLElement;
}> {
    const url = dir;
    try {
        const res = await fetch(url);
        if (res.status === 404) {
            return { success: false, failMessage: "No such file or directory." };
        } else if (res.status < 200 || res.status >= 400) {
            return { success: false, failMessage: "Failed to fetch item." };
        }
        const text = await res.text();
        const dom = new DOMParser().parseFromString(text, "text/html");
        const element = dom.getElementById("init-content");
        const type = element?.dataset?.initType;
        if (element && type) {
            return { success: true, type, element: element };
        }
        return { success: false, failMessage: "Failed to fetch item." };
    }
    catch (e) {
        return { success: false, failMessage: "Unknown error." };
    }
}

export function getAbsoluteDir(dir: string, pwd: string): string {
    if (dir.startsWith("/") || dir.startsWith("~")) {
        return dir;
    }
    // handle '..' and '.'
    const dirList = dir.split("/");
    const pwdList = pwd.split("/");
    if (pwdList[pwdList.length - 1] === "") {
        pwdList.pop();
    }
    for (const d of dirList) {
        if (d === "..") {
            pwdList.pop();
        } else if (d !== ".") {
            pwdList.push(d);
        }
    }
    const result = pwdList.join("/");
    return result.startsWith("/") ? result : "/" + result;
}

type CommandExecResult = {
    histories: CommandHistory[];
    pwd: string;
    executing?: boolean;
    currentDirItems?: string[];
}

export function* executeCommand(command: string, pwd: string, history: CommandHistory[] = [])
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

    const getRemoteCommandResult = async (path: string, type: 'cd' | 'ls' | 'cat' | 'go') => {
        // newCommandHistory.runningStatusList?.push({
        //     type: "running",
        //     message: "Fetching content from remote... "
        // });
        try {
            const result = await fetchItem(path);
            if (result.success) {
                if (type === 'cd') {
                    if (result.type === "list") {
                        newCommandHistory.runningStatusList = [];
                        newPwd = path;
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
                } else if (type === 'go') {
                    newCommandHistory.runningStatusList = [];
                    newCommandHistory.resultElement = result.element;
                }
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
        if (action.type === "list" || action.type === 'viewPost'
            || action.type === 'changeDir' || action.type === 'go') {
            newCommandHistory.runningStatusList?.push({ type: "running", message: "Fetching content... " });
            yield result;
        }


        if (action.type === "clear") {
            document.getElementById("init-history")?.remove();
            newHistory.length = 0;
            yield { histories: newHistory, pwd: newPwd };
        } else if (action.type === "changeDir") {
            let inputDir = action.path!;
            if (!inputDir) {
                newCommandHistory.runningStatusList = [{ type: "fail", message: "cd: no argument." }];
                continue;
            }
            // TODO: change history
            inputDir = getAbsoluteDir(inputDir, pwd);
            yield getRemoteCommandResult(inputDir, 'cd');
        } else if (action.type === "viewPost") {
            let path = action.path!;
            path = getAbsoluteDir(path, pwd);
            yield getRemoteCommandResult(path, 'cat');
        } else if (action.type === "list") {
            let path = action.path!;
            path = path ? getAbsoluteDir(path, pwd) : pwd;
            yield getRemoteCommandResult(path, 'ls');
        } else if (action.type === 'go') {
            let path = action.path!;
            path = getAbsoluteDir(path, pwd);
            yield getRemoteCommandResult(path, 'go');
        } else if (action.type === "empty") {
        } else if (action.type === "unknown") {
            newCommandHistory.runningStatusList = [{
                type: "fail",
                message: "sh: unknown command. "
            }];
        } else if (action.type === "error") {
            newCommandHistory.runningStatusList = [{
                type: "fail",
                message: action.message!
            }];
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