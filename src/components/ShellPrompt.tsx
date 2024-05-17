import classes from "./ShellPrompt.module.css";

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
        <span className="text-green-700 dark:text-green-300">chengzi@blog</span><span>:</span><span
            className="text-blue-700 dark:text-blue-300">{currentPath}$ </span>
        <span>{strBeforeCursor}</span>
        {hasCursor && <span className={classes.cursor} />}
        <span>{strAfterCursor}</span>

    </div>
}

export default ShellPrompt;