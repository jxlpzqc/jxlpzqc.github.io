import { useState } from "react";
import styles from "./index.module.css"

const logo = `  ___ _                     _
 / __| |_  ___ _ _  __ _ __(_)
| (__| ' \\/ -_) ' \\/ _\` |_ / |
 \\___|_||_\\___|_||_\\__, /__|_|
                   |___/
`;

const MenuButton = ({ open, onClick }: {
    open: boolean;
    onClick: () => void;
}) => {
    return <button
        className="focus-outline"
        onClick={onClick}
        aria-label="Open Menu"
        aria-expanded="false"
        aria-controls="menu-items"
    >
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="menu-icon"
        >
            {
                !open ? <>
                    <line x1="7" y1="12" x2="21" y2="12" className="line"></line>
                    <line x1="3" y1="6" x2="21" y2="6" className="line"></line>
                    <line x1="12" y1="18" x2="21" y2="18" className="line"></line>
                </> : <>
                    <line x1="18" y1="6" x2="6" y2="18" className="close"></line>
                    <line x1="6" y1="6" x2="18" y2="18" className="close"></line>
                </>
            }
        </svg>
    </button>

}


export const Header = () => {
    const [open, setOpen] = useState(false);

    return (
        <header className="sticky top-0 bg-yellow-50 dark:bg-black z-20 shadow-md  dark:shadow-none dark:border-b-2 dark:border-gray-500">
            <div className={`flex flex-wrap justify-between items-center
             max-w-screen-md px-8 mx-auto sm:!h-[80px] ${open ? "h-fit" : "h-[80px]"}`}>
                <a href="/" className="text-xs font-bold leading-3">
                    <pre>{logo}</pre>
                </a>

                <div className="self-end sm:hidden">
                    <MenuButton open={open} onClick={() => setOpen(!open)} />
                </div>
                <div className="w-full sm:w-0"></div>
                <nav className={styles["main-nav"]}>
                    <ul className={`${open ? "block" : "hidden"}`}>
                        <li><a href="/recents">/recents</a></li>
                        <li><a href="/tags">/tags</a></li>
                        <li><a href="/archives">/archives</a></li>
                        {/* <li><a href="#">⚙️</a></li> */}
                    </ul>
                </nav>
            </div>
        </header>
    );
}

