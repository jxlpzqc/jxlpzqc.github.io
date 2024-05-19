import ShellPrompt, { type ShellPromptImperativeHandle } from "@components/ShellPrompt";
import { useCallback, useEffect, useRef, useState } from "react";
import { appendHistories, getHistories } from "./historyStorage";
import { getSuggestionList } from "./fetchContent";

type Props = {
    // when executing, keyboard input will be saved, just hide the prompy
    executing: boolean;
    pwd: string;
    onSubmitCommand: (command: string) => void;
    onAbortCommand?: (command: string) => void;
};

type SuggestionListProps = {
    word: string;
    pwd: string;
    onSelected?: (v: string) => void;
    onClose?: () => void;
};

function SuggestionList({ word, pwd, onSelected, onClose }: SuggestionListProps) {

    // calculate row and column

    // get current actual width

    const [selected, _setSelected] = useState(-1);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let diposed = false;
        getSuggestionList(word, pwd)
            .then((suggestions) => {
                if (diposed) return;
                setSuggestions(suggestions);
            })
            .catch((e) => {
                console.error(e);
                if (diposed) return;
                onClose?.();
            })
            .finally(() => {
                if (diposed) return;
                setLoading(false);
                setTimeout(() => {
                    window.scrollTo({ top: document.body.scrollHeight });
                }, 0);
            });

        return () => {
            diposed = true;
        }
    }, []);

    const setSelected = (v: number) => {
        if (suggestions.length === 0) return;
        let res = v % suggestions.length;
        res = res < 0 ? res + suggestions.length : res;
        _setSelected(res);
        onSelected?.(suggestions[res]);
    }

    const [cols, setCols] = useState(-1);

    const listRef = useRef<HTMLDivElement>(null);

    // auto focus
    useEffect(() => {
        listRef.current?.focus();
    }, [listRef.current]);

    // get cols
    useEffect(() => {
        const ele = listRef.current;
        if (!ele) return;
        const width = ele.clientWidth;

        if (suggestions.length <= 1) {
            setCols(1);
            return;
        }

        // get em width
        const pxPerEm = parseFloat(getComputedStyle(ele).fontSize)

        const chWidth = pxPerEm * 0.7;

        const GAP = chWidth * 2;

        // first use 1 col to layout, and increase cols until the width is enough
        let col = 2;
        while (true) {
            let cw = 0; // count width
            let success = true;

            const linesPerCol = Math.ceil(suggestions.length / col);

            for (let i = 0; i < col; ++i) {
                // get max width of current column
                const currentColumnWidth = (suggestions.slice(i * linesPerCol, (i + 1) * linesPerCol)
                    .reduce((max, v) => Math.max(max, v.length), 0)) * chWidth;
                cw += currentColumnWidth;
                cw += GAP;
                if (cw > width) {
                    success = false;
                    break;
                }
            }

            if (col === suggestions.length) {
                break;
            }

            if (!success) {
                col--;
                break;
            }
            col++;
        }
        setCols(col);
    }, [suggestions]);

    const rows = Math.ceil(suggestions.length / cols);
    const handleKeyDown = (e: React.KeyboardEvent) => {
        let keyHandled = true;

        if (e.key === "ArrowUp" || (e.shiftKey && e.key == "Tab")) {
            setSelected((selected - 1));
        } else if (e.key === "ArrowDown" || (!e.shiftKey && e.key == "Tab")) {
            setSelected((selected + 1));
        } else if (e.key === "ArrowLeft") {
            setSelected((selected - rows));
        } else if (e.key === "ArrowRight") {
            setSelected((selected + rows));
        } else if (e.key === "Enter") {
            onClose?.();
        } else {
            keyHandled = false;
            onClose?.();
        }

        if (keyHandled) {
            e.stopPropagation();
            e.preventDefault();
        }
    }

    useEffect(() => {

        if (!loading && suggestions.length === 0) onClose?.();
        if (suggestions.length === 1) {
            onSelected?.(suggestions[0]);
            onClose?.();
        }
    }, [suggestions]);

    return <div ref={listRef} onBlur={() => { onClose?.(); }} tabIndex={-1} onKeyDown={handleKeyDown}
        className="focus:outline-none" // remove when debugging
    >
        {
            loading ? <div>Loading suggestions...</div> : (
                suggestions.length !== 0 &&
                <div
                    className="w-full grid" style={{
                        gridTemplateRows: `repeat(${rows}, auto)`,
                        gridTemplateColumns: `repeat(${cols}, auto)`,
                        gridAutoFlow: "column",
                        gap: "0 0.5em",
                    }}>
                    {
                        suggestions.map((s, i) => (
                            <span key={s} className={`cursor-pointer ${selected === i ? "bg-term-normal text-term-bg" : ""}`}
                                onClick={() => onSelected?.(s)}>{s}</span>
                        ))
                    }
                </div>
            )
        }
    </div>
}


export default function ReadLine({ executing, pwd, onSubmitCommand, onAbortCommand }: Props) {

    const [command, setCommand] = useState("");
    const [cursorPosition, setCursorPosition] = useState(0);

    const hisPos = useRef<number>(-1);
    const promptRef = useRef<ShellPromptImperativeHandle>(null);

    const currentWord = command.slice(0, cursorPosition).split(/\s+/).pop() || "";
    const isCursorWordEnd = cursorPosition === command.length || command[cursorPosition] === " ";
    const [showSuggestion, setShowSuggestion] = useState(false);

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

    const replaceCurrentWord = (str: string) => {
        setCommand(
            command.slice(0, cursorPosition - currentWord.length) +
            str + command.slice(cursorPosition));
        setCursorPosition(cursorPosition - currentWord.length + str.length);
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

    const openOrNextSuggestion = () => {
        if (isCursorWordEnd) setShowSuggestion(true);
    }
    const openAndpreviousSuggestion = () => {
        if (isCursorWordEnd) setShowSuggestion(true);
    }

    //#endregion

    const scrollToBottom = () => {
        setTimeout(() => {
            window.scrollTo({ top: document.body.scrollHeight });
        }, 0);
    };


    const handleInput = (input: string) => {
        insert(input);
        scrollToBottom();
    }

    const handleKeyDown = async (e: React.KeyboardEvent) => {
        const ctrl = e.ctrlKey; // in mac, also use ctrl, not command
        const shift = e.shiftKey;
        const alt = e.altKey;
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
        // if not ctrl, insert the character
        // else if (!ctrl && e.key.length == 1) insert(e.key);
        else if (e.key === "Enter") submit();
        else if (ctrl && e.key === "c") abort();
        else if (ctrl && e.key === "l") { setCommand(""); setCursorPosition(0); onSubmitCommand("clear"); }
        else if (!alt && !shift && e.key === "Tab") openOrNextSuggestion();
        else if (!alt && shift && e.key === "Tab") openAndpreviousSuggestion();
        else keyHandled = false;

        if (keyHandled) {
            e.preventDefault();
            scrollToBottom();
        }
    }

    const focusPrompt = () => {
        promptRef.current?.focus();
    }

    const handleDocumentKeyDown = useCallback((e: KeyboardEvent) => {
        const isBodyFocus = document.activeElement === document.body || document.activeElement === null
        const isInterstingKey =
            (!e.ctrlKey && !e.altKey && e.key === "Tab") ||
            (!e.ctrlKey && e.key.length === 1) ||
            (e.key === "Enter") ||
            (e.ctrlKey && e.key === "v");

        if (isBodyFocus && isInterstingKey)
            focusPrompt();

        if (e.key === "Enter") {
            // prevent keydown pass to focused element
            e.preventDefault();
        }
    }, []);

    useEffect(() => {
        // focus not bubble, so add event listener to body
        document.body.addEventListener("keydown", handleDocumentKeyDown);
        return () => {
            document.body.removeEventListener("keydown", handleDocumentKeyDown);
        }
    }, []);

    useEffect(() => {
        if (!executing) focusPrompt();
    }, [executing]);

    return !executing &&
        <>
            <ShellPrompt ref={promptRef} currentPath={pwd} command={command}
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                hasCursor={true} cursorPosition={cursorPosition} />
            {showSuggestion && <SuggestionList word={currentWord}
                pwd={pwd}
                onSelected={(v) => { replaceCurrentWord(v); }}
                onClose={() => { setShowSuggestion(false); focusPrompt(); }} />
            }
        </>


}