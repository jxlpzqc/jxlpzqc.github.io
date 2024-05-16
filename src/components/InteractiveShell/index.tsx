import ShellPrompt from "@components/ShellPrompt";
import { useEffect, useRef, useState, type ReactElement, type ReactNode } from "react";
import { executeCommand } from "./executor";
import ReadLine from "./ReadLine";
import LessApp from "@components/LessApp";
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

    const [fullScreenAppReq, setFullScreenAppReq] = useState<FullScreenAppRequest | undefined>();

    const sendFullScreenAppReq = (req: FullScreenAppRequest | undefined) => {
        setFullScreenAppReq(req);
    }

    const historyContainerRef = useRef<HTMLDivElement>(null);

    const scrollToLastHistory = () => {
        setTimeout(() => {
            const target = historyContainerRef.current
                ?.children[historyContainerRef.current.children.length - 1] as HTMLDivElement;

            // scroll to target's top
            if (target) {
                window.scrollTo({ top: target.offsetTop - 116, behavior: "smooth" });
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
        const path = window.location.pathname;
        submitCommand(`go ${path}`);
    }

    const handleLinkClick = (e: MouseEvent) => {
        if (e.target instanceof HTMLAnchorElement) {
            e.preventDefault();
            const path = e.target.getAttribute("href");
            if (path) {
                window.history.pushState({}, "", path);
                window.dispatchEvent(new PopStateEvent('popstate'));
            }
            // unfocus the link
            e.target.blur();
        }
    }

    useEffect(() => {
        window.addEventListener("popstate", handlePopState);
        document.body.addEventListener("click", handleLinkClick);
        return () => {
            window.removeEventListener("popstate", handlePopState);
            document.body.removeEventListener("click", handleLinkClick);
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
