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
        else if (e.key === "f" || e.key === "PageDown") scrollPageDown(); // page down
        else if (e.key === "b" || e.key === "PageUp") scrollPageUp(); // page up
        else if (e.key === "d") scrollPageDown(true); // half page down
        else if (e.key === "u") scrollPageUp(true); // half page up
        else keyHandled = false;

        if (keyHandled) {
            e.preventDefault();
        }
    };

    const handleScroll = (e: React.UIEvent) => {
        const element = appRef.current;
        if (!element) return;

        // get scroll percentage
        const scrollTop = element.scrollTop;
        const scrollHeight = element.scrollHeight - element.clientHeight;
        const percentage = Math.round(scrollTop / scrollHeight * 100);
        if (isNaN(percentage)) setScrollPercentage("");
        else if (percentage == 0) setScrollPercentage("");
        else setScrollPercentage(`${percentage}%`);
    }

    return (<div ref={appRef} className="w-full h-full overflow-auto bg-yellow-50 focus:outline-none"
        tabIndex={-1} onKeyDown={handleKeyDown}
        onScroll={handleScroll}
    >
        <div className="p-8  max-w-screen-md m-auto" ref={contentRef}></div>
        {/* status bar */}
        <div className="fixed bg-yellow-50 bottom-0 flex text-lg justify-between" style={{
            width: 'calc(100% - 20px)',
        }}>
            <div>
                {
                    !scrollPercentage && <span className="bg-black text-white px-2">{props.filename}</span>
                }
                {
                    scrollPercentage === "100%" && <span className="bg-black text-white px-2">(END)</span>
                }
                {
                    scrollPercentage !== "" && scrollPercentage !== "100%" && <>
                        <span className="px-1 font-extrabold">:</span>
                        <span
                            className="animate-cursor-blink bg-black align-bottom inline-block w-3"
                            style={{ height: '24px' }}></span>
                    </>
                }


            </div>
            <div className="mr-8">
                <span>{scrollPercentage}</span>
            </div>

        </div>
    </div>);
}
