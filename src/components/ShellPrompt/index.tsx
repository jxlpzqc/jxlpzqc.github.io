import { SITE } from "@config";
import Cursor from "./Cursor";
import { forwardRef, useImperativeHandle, useRef } from "react";

type Props = {
    currentPath: string;
    command?: string;
    hasCursor?: boolean;
    cursorPosition?: number;
    onInput?: (input: string) => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
};

export type ShellPromptImperativeHandle = {
    focus: () => void;
};

const ShellPrompt = forwardRef<ShellPromptImperativeHandle, Props>(
    ({ currentPath, command, hasCursor, cursorPosition, onInput, onKeyDown }, ref) => {
        const strBeforeCursor = command?.slice(0, cursorPosition === undefined ? -1 : cursorPosition) || "";
        const strAfterCursor = command?.slice(cursorPosition === undefined ? -1 : cursorPosition) || "";

        const textAreaRef = useRef<HTMLTextAreaElement>(null);

        useImperativeHandle(ref, () => ({
            focus: () => {
                textAreaRef.current?.focus({ preventScroll: true });
            }
        }));

        const handleClick = () => {
            if (!hasCursor) return;
            textAreaRef.current?.focus({ preventScroll: true });
        };

        return <div className="*:break-words *:whitespace-pre-wrap *:break-all" onClick={handleClick}>
            <span className="text-term-green">{SITE.shUsername}@{SITE.shHostname}</span><span>:</span><span
                className="text-term-blue">{currentPath}$ </span>
            <span>{strBeforeCursor}</span>
            {hasCursor && <Cursor onInput={onInput} onKeyDown={onKeyDown} ref={textAreaRef} />}
            <span>{strAfterCursor}</span>

        </div>
    });

export default ShellPrompt;