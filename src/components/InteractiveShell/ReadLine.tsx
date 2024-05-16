import ShellPrompt from "@components/ShellPrompt";
import { useEffect, useRef, useState } from "react";
import { appendHistories, getHistories } from "./historyStorage";

type Props = {
    // when executing, keyboard input will be saved, just hide the prompy
    executing: boolean;
    pwd: string;
    onSubmitCommand: (command: string) => void;
    onAbortCommand?: (command: string) => void;
};


export default function ReadLine({ executing, pwd, onSubmitCommand, onAbortCommand }: Props) {

    const [command, setCommand] = useState("");
    const [cursorPosition, setCursorPosition] = useState(0);

    const hisPos = useRef<number>(-1);

    //#region cursor movement and line edit

    const backspace = () => {
        if (cursorPosition === 0) {
            return;
        }
        setCommand(command.slice(0, cursorPosition - 1) + command.slice(cursorPosition));
        setCursorPosition(cursorPosition - 1);
    };

    const del = () => {
        if (cursorPosition === command.length) {
            return;
        }
        setCommand(command.slice(0, cursorPosition) + command.slice(cursorPosition + 1));
    }

    const left = () => {
        setCursorPosition(Math.max(0, cursorPosition - 1));
    }

    const right = () => {
        setCursorPosition(Math.min(command.length, cursorPosition + 1));
    }

    const home = () => {
        setCursorPosition(0);
    }

    const end = () => {
        setCursorPosition(command.length);
    }

    const submit = () => {
        onSubmitCommand(command);
        appendHistories(command);
        setCommand("");
        setCursorPosition(0);
        hisPos.current = -1;
    }

    const abort = () => {
        onAbortCommand?.(command);
        setCommand("");
        setCursorPosition(0);
        hisPos.current = -1;
    }

    const insert = (str: string) => {
        setCommand(command.slice(0, cursorPosition) + str + command.slice(cursorPosition));
        setCursorPosition(cursorPosition + str.length);
    }

    const previousCommand = () => {
        const his = getHistories();
        if (hisPos.current === -1) hisPos.current = his.length - 1;
        else hisPos.current = Math.max(0, hisPos.current - 1);

        if (hisPos.current === -1) return;
        setCommand(his[hisPos.current]);
        setCursorPosition(his[hisPos.current].length);
    };
    const nextCommand = () => {
        const his = getHistories();
        if (hisPos.current === -1) return;
        hisPos.current = Math.min(his.length - 1, hisPos.current + 1);
        if (hisPos.current === his.length) {
            hisPos.current = -1;
            setCommand("");
            setCursorPosition(0);

        } else {
            setCommand(his[hisPos.current]);
            setCursorPosition(his[hisPos.current].length);
        }
    };

    //#endregion

    const handleKeyDown = async (e: KeyboardEvent) => {
        const ctrl = e.ctrlKey; // in mac, also use ctrl, not command
        let keyHandled = true;

        // also use emacs key bindings
        if (e.key === "Backspace") backspace();
        else if (e.key === "ArrowLeft") left();
        else if (e.key === "ArrowRight") right();
        else if (e.key === "Delete") del();
        else if (e.key === "Home") home();
        else if (e.key === "End") end();
        else if (e.key === "ArrowUp") previousCommand();
        else if (e.key === "ArrowDown") nextCommand();
        else if (ctrl && e.key === "a") home(); // move to the beginning of the line
        else if (ctrl && e.key === "e") end(); // move to the end of the line
        else if (ctrl && e.key === "d") del(); // delete the character under the cursor
        else if (ctrl && e.key === "b") left(); // move back one character 
        else if (ctrl && e.key === "f") right(); // move forward one character
        else if (ctrl && e.key === "p") previousCommand(); // search history backward
        else if (ctrl && e.key === "n") nextCommand(); // search history forward
        else if (ctrl && e.key === "k") setCommand(command.slice(0, cursorPosition)); // delete from cursor to the end of the line
        else if (ctrl && e.key === "u") { setCommand(command.slice(cursorPosition)); setCursorPosition(0); } // delete from cursor to the beginning of the line
        // ctrl + c, ctrl + d
        // TODO: handle ctrl + c, ctrl + d
        // if not ctrl, insert the character
        else if (!ctrl && e.key.length == 1) insert(e.key);
        else if (e.key === "Enter") submit();
        else if (ctrl && e.key === "c") abort();
        else if (ctrl && e.key === "l") { setCommand(""); setCursorPosition(0); onSubmitCommand("clear"); }
        else keyHandled = false;

        if (keyHandled) {
            e.preventDefault();
        }

        setTimeout(() => {
            window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
        }, 0);
    }

    const handleKeyDownWrapper = (e: KeyboardEvent) => {
        // if no element is focused, then we can handle the key event
        if (document.activeElement === document.body) {
            handleKeyDown(e);
        }
    };

    const handlePasteWrapper = (e: ClipboardEvent) => {
        // if no element is focused, then we can handle the paste event
        if (document.activeElement === document.body) {
            e.preventDefault();
            const text = e.clipboardData?.getData("text");
            insert(text || "");
        }
    }

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDownWrapper);
        document.body.addEventListener("paste", handlePasteWrapper);
        return () => {
            window.removeEventListener("keydown", handleKeyDownWrapper);
            document.body.removeEventListener("paste", handlePasteWrapper);
        }
    });

    return !executing && <ShellPrompt currentPath={pwd} command={command}
        hasCursor={true} cursorPosition={cursorPosition} />


}