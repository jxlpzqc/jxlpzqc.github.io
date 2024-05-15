import ShellPrompt from "@components/ShellPrompt";
import { useEffect, useRef, useState } from "react";
import { executeCommand } from "./executor";
import ReadLine from "./ReadLine";


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


    return <div className="mb-4">
        <ShellPrompt currentPath={history.path} command={history.command} />
        {
            history.runningStatusList?.map((status) => (
                <div className="flex flex-row items-center">
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

    const submitCommand = async (command: string) => {
        const result = executeCommand(command, pwd, history);
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

        setTimeout(() => {
            window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
        }, 0);
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
        {history.map((h) => <HistoryView key={h.id} history={h} />)}
        <ReadLine executing={executing} pwd={pwd} onSubmitCommand={submitCommand} />
    </div>
}
