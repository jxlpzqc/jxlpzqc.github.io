import { SITE } from "@config";
import classes from "./index.module.css";

type Props = {
    currentPath: string;
    command?: string;
    hasCursor?: boolean;
    cursorPosition?: number;
};

function ShellPrompt({ currentPath, command, hasCursor, cursorPosition }: Props) {
    const strBeforeCursor = command?.slice(0, cursorPosition === undefined ? -1 : cursorPosition) || "";
    const strAfterCursor = command?.slice(cursorPosition === undefined ? -1 : cursorPosition) || "";

    return <div className="*:break-words *:whitespace-pre-wrap *:break-all">
        <span className="text-term-green">{SITE.shUsername}@{SITE.shHostname}</span><span>:</span><span
            className="text-term-blue">{currentPath}$ </span>
        <span>{strBeforeCursor}</span>
        {hasCursor && <span className={classes.cursor} />}
        <span>{strAfterCursor}</span>

    </div>
}

export default ShellPrompt;