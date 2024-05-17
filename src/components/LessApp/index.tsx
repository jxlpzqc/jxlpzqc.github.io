import { useEffect, useRef, useState } from "react";

type Props = {
    filename: string;
    content?: HTMLElement;
    onExit?: () => void;
};

export type LessAppProps = Props;

const PERLINE_HEIGHT = 24;

export default function LessApp(props: Props) {
    const contentRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<HTMLDivElement>(null);

    const [scrollPercentage, setScrollPercentage] = useState<string>("");
    const [message, setMessage] = useState<string>("");

    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.innerHTML = "";
            if (props.content) contentRef.current.appendChild(props.content);
        }
    }, [props.content]);

    useEffect(() => {
        appRef?.current?.focus();
    }); // focus on every render

    const scrollToBottom = () => {
        if (appRef.current) appRef.current.scrollTop = appRef.current.scrollHeight;
    }

    const scrollToTop = () => {
        if (appRef.current) appRef.current.scrollTop = 0;
    }

    const scrollDown = () => {
        if (appRef.current) appRef.current.scrollTop += PERLINE_HEIGHT;
    }

    const scrollUp = () => {
        if (appRef.current) appRef.current.scrollTop -= PERLINE_HEIGHT;
    }

    const scrollPageDown = (half: boolean = false) => {
        if (appRef.current) appRef.current.scrollTop += (half ? appRef.current.clientHeight / 2 : appRef.current.clientHeight);
    }

    const scrollPageUp = (half: boolean = false) => {
        if (appRef.current) appRef.current.scrollTop -= (half ? appRef.current.clientHeight / 2 : appRef.current.clientHeight);
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        let keyHandled = true;

        if (e.key === "q") {
            props.onExit?.(); // exit
            e.stopPropagation();
        }
        else if (e.key === "j" || e.key === "e" || e.key === "ArrowDown") scrollDown(); // scroll down
        else if (e.key === "k" || e.key === "y" || e.key === "ArrowUp") scrollUp(); // scroll up
        else if (e.key === "g" || e.key === "Home") scrollToTop(); // go to top
        else if (e.key === "G" || e.key === "End") scrollToBottom(); // go to bottom
        else if ((!e.ctrlKey && e.key === "f") || e.key === "PageDown") scrollPageDown(); // page down
        else if (e.key === "b" || e.key === "PageUp") scrollPageUp(); // page up
        else if (e.key === "d") scrollPageDown(true); // half page down
        else if (e.key === "u") scrollPageUp(true); // half page up
        else if (e.key === "/") {
            setMessage("Search is not supported, use <C-f> instead.");
        }
        else keyHandled = false;

        if (keyHandled) {
            e.preventDefault();
        } else {
            if (e.key === "f" && e.ctrlKey) {
                setMessage("<C-f> is mapped as browser's search, use f instead.");
            }
        }


    };

    const handleScroll = (e: React.UIEvent) => {
        const element = appRef.current;
        if (!element) return;

        // get scroll percentage
        const scrollTop = element.scrollTop;
        const scrollHeight = element.scrollHeight - element.clientHeight;
        const percentage = Math.round(scrollTop / scrollHeight * 100);
        setMessage("");
        if (isNaN(percentage)) setScrollPercentage("");
        else if (percentage == 0) setScrollPercentage("");
        else setScrollPercentage(`${percentage}%`);
    }


    let bottomLeftElement = null;

    if (message || !scrollPercentage || scrollPercentage === "100%") {
        const msg = message || (scrollPercentage === "100%" ? "END" : props.filename);
        bottomLeftElement = <span className="bg-black text-white dark:bg-white dark:text-black  px-2">{msg}</span>;
    } else if (scrollPercentage !== "" && scrollPercentage !== "100%") {
        bottomLeftElement = <>
            <span className="px-1 font-extrabold">:</span>
            <span
                className="bg-black dark:bg-white align-bottom inline-block w-3"
                style={{ height: '24px' }}></span>
        </>;
    }

    return (<div ref={appRef} className="w-full h-full overflow-auto bg-yellow-50 dark:bg-black focus:outline-none"
        tabIndex={-1} onKeyDown={handleKeyDown}
        onScroll={handleScroll}
    >
        <div className="p-8 max-w-screen-md m-auto less-app-content" ref={contentRef}></div>
        {/* close button */}
        <div className="fixed top-0 left-0">
            <button className="hover:bg-red-400 opacity-30 hover:opacity-100 transition-all p-4 *:stroke-black dark:*:stroke-white" onClick={props.onExit}>
                {/* X SVG */}
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                >
                    <line x1="18" y1="6" x2="6" y2="18" className="close"></line>
                    <line x1="6" y1="6" x2="18" y2="18" className="close"></line>
                </svg>
            </button>
        </div>

        {/* status bar */}
        <div className="fixed bg-yellow-50 dark:bg-black bottom-0 flex text-lg justify-between" style={{
            width: 'calc(100% - 20px)',
        }}>
            <div>{bottomLeftElement}</div>
            <div className="mr-8">
                <span>{scrollPercentage}</span>
            </div>
        </div>
    </div>);
}
