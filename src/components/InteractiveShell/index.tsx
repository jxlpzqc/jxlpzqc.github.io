import ShellPrompt from "@components/ShellPrompt";
import { useEffect, useRef, useState, type ReactElement, type ReactNode } from "react";
import { executeCommand } from "./executor";
import ReadLine from "./ReadLine";
import type { FullScreenAppRequest } from "./FullScreenApp";
import FullScreenApp from "./FullScreenApp";


export type CommandHistory = {
    id: number;
    path: string;
    command: string;
    runningStatusList?: {
        type: "running" | "success" | "fail";
        message: string;
    }[];
    resultElement?: HTMLElement;
}


function HistoryView({ history }: { history: CommandHistory }) {

    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (history.resultElement && containerRef.current) {
            containerRef.current.innerHTML = "";
            containerRef.current.appendChild(history.resultElement);
        }
    }, [history.resultElement]);


    return <div className="pb-4">
        <ShellPrompt currentPath={history.path} command={history.command} />
        {
            history.runningStatusList?.map((status, i) => (
                <div key={i} className="flex flex-row items-center">
                    {/* dot indicator */}
                    {status.type === "running" && <span className="flex w-2 h-2 me-3 rounded-full bg-blue-300 animate-pulse"></span>}
                    {status.type === "success" && <span className="flex w-2 h-2 me-3 rounded-full bg-green-500"></span>}
                    {status.type === "fail" && <span className="flex w-2 h-2 me-3 rounded-full bg-red-500"></span>}
                    <span>{status.message}</span>
                </div>
            ))
        }
        <div ref={containerRef}></div>
    </div>

}



export function InteractiveShell({ originPwd }: { originPwd: string }) {
    const [pwd, setPwd] = useState(originPwd);
    const [executing, setExecuting] = useState(false);
    const [history, setHistory] = useState<CommandHistory[]>([]);

    const [fullScreenAppReq, sendFullScreenAppReq] = useState<FullScreenAppRequest | undefined>();

    const historyContainerRef = useRef<HTMLDivElement>(null);

    const scrollToLastHistory = () => {
        setTimeout(() => {
            const target = historyContainerRef.current
                ?.children[historyContainerRef.current.children.length - 1] as HTMLDivElement;

            // scroll to target's top
            if (target) {
                window.scrollTo({ top: target.offsetTop - 96, behavior: "smooth" });
            }
        }, 0);
    }

    const submitCommand = async (command: string) => {
        const result = executeCommand(command, pwd, history, sendFullScreenAppReq);
        while (true) {
            const { value, done } = result.next();
            if (done) {
                break;
            }
            const { histories, pwd, executing } = await value;
            setHistory(histories);
            setPwd(pwd);
            setExecuting(executing || false);
        }
        scrollToLastHistory();
    }

    const handleAbortCommand = (command: string) => {
        setHistory([...history, {
            id: history.length,
            path: pwd,
            command: command,
            runningStatusList: []
        }]);
        scrollToLastHistory();
    }

    // catch browser history change event
    const handlePopState = (e: PopStateEvent) => {
        if (e.state === null && !!window.location.hash) return;
        sendGoCommand();
        e.preventDefault();
    }

    const sendGoCommand = (path: string | undefined = undefined) => {
        if (path === undefined) path = window.location.pathname;
        // close full screen app
        sendFullScreenAppReq(undefined);
        submitCommand(`go ${path}`);
    }

    const handleLinkClick = (e: MouseEvent) => {
        if (e.target instanceof HTMLAnchorElement) {
            // blur the link to accept input
            e.target.blur();

            const path = e.target.getAttribute("href");
            // if path is anchor, do default behavior
            if (path?.startsWith("#")) {
                return;
            }
            e.preventDefault();
            if (path) {
                try {
                    window.history.pushState({}, "", path);
                } catch (e) {
                    // external link
                    console.error(e);
                }
                sendGoCommand(path);
            }
        }
    }

    useEffect(() => {
        window.addEventListener("popstate", handlePopState);
        document.body.addEventListener("click", handleLinkClick);

        window.sendToLess = (content, filename) => {
            sendFullScreenAppReq({
                type: "less",
                props: { content, filename }
            });
        };

        return () => {
            window.removeEventListener("popstate", handlePopState);
            document.body.removeEventListener("click", handleLinkClick);
            window.sendToLess = undefined;
        }
    }, [submitCommand]);

    return <div>
        <div ref={historyContainerRef}>
            {history.map((h) => <HistoryView key={h.id} history={h} />)}
        </div>
        <ReadLine executing={executing} pwd={pwd} onSubmitCommand={submitCommand} onAbortCommand={handleAbortCommand} />
        <FullScreenApp req={fullScreenAppReq} />
    </div>
}
