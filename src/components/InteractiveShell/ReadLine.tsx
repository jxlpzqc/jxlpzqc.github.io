import ShellPrompt from "@components/ShellPrompt";
import { useEffect, useState } from "react";

type Props = {
    // when executing, keyboard input will be saved, just hide the prompy
    executing: boolean;
    pwd: string;
    onSubmitCommand: (command: string) => void;
};


export default function ReadLine({ executing, pwd, onSubmitCommand }: Props) {

    const [command, setCommand] = useState("");
    const [cursorPosition, setCursorPosition] = useState(0);

    const handleKeyDown = async (e: KeyboardEvent) => {
        const ctrl = e.ctrlKey; // in mac, also use ctrl, not command
        let keyHandled = true;

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
            setCommand("");
            setCursorPosition(0);
        }

        const previousCommand = () => { };
        const nextCommand = () => { };

        // also use emacs key bindings
        if (e.key === "Backspace") backspace();
        else if (e.key === "ArrowLeft") left();
        else if (e.key === "ArrowRight") right();
        else if (e.key === "Enter") submit();
        else if (e.key === "Delete") del();
        else if (e.key === "Home") home();
        else if (e.key === "End") end();
        else if (e.key === "ArrowUp") previousCommand();
        else if (e.key === "ArrowDown") nextCommand();
        else if (ctrl) {
            // emacs key bindings
            if (e.key === "a") home(); // move to the beginning of the line
            else if (e.key === "e") end(); // move to the end of the line
            else if (e.key === "d") del(); // delete the character under the cursor
            else if (e.key === "b") left(); // move back one character
            else if (e.key === "f") right(); // move forward one character
            else if (e.key === "p") previousCommand(); // search history backward
            else if (e.key === "n") nextCommand(); // search history forward
            else if (e.key === "k") setCommand(command.slice(0, cursorPosition)); // delete from cursor to the end of the line
            else if (e.key === "u") {
                setCommand(command.slice(cursorPosition)); // delete from cursor to the beginning of the line
                setCursorPosition(0);
            }

            // ctrl + c, ctrl + d
            // TODO: handle ctrl + c, ctrl + d
        }
        // if not ctrl, insert the character
        else if (e.key.length == 1) {
            setCommand(command.slice(0, cursorPosition) + e.key + command.slice(cursorPosition));
            setCursorPosition(cursorPosition + 1);
        } else {
            keyHandled = false;
        }

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

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDownWrapper);
        return () => {
            window.removeEventListener("keydown", handleKeyDownWrapper);
        }
    });

    return !executing && <ShellPrompt currentPath={pwd} command={command}
        hasCursor={true} cursorPosition={cursorPosition} />


}