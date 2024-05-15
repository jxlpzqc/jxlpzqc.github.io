
type Props = {
    currentPath: string;
    command?: string;
    hasCursor?: boolean;
    cursorPosition?: number;
};

function ShellPrompt({ currentPath, command, hasCursor, cursorPosition }: Props) {
    const fakeCommandStr = (command + "_")?.slice(0, cursorPosition === undefined ? -1 : cursorPosition);
    return <div>
        <span className="text-green-700">chengzi@blog</span><span>:</span><span
            className="text-blue-700 whitespace-pre">{currentPath}$ </span>
        <span className="relative">
            <span>{command || ""}</span>
            <span className="absolute left-0" style={{
                width: 'calc(100% + 30px)',
            }}>
                <span className="opacity-0">{fakeCommandStr}</span>
                {hasCursor && <span
                    className="animate-cursor-blink bg-black align-top inline-block w-3"
                    style={{ height: '24px' }}></span>}

            </span>

        </span>
    </div>
}

export default ShellPrompt;