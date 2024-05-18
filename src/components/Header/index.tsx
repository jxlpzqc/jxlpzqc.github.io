import { useState } from "react";
import styles from "./index.module.css"
import { SITE } from "@config";

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
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="menu-icon"
        >
            <g opacity={!open ? 100 : 0} className="transition-opacity">
                <line x1="7" y1="12" x2="21" y2="12" className="line"></line>
                <line x1="3" y1="6" x2="21" y2="6" className="line"></line>
                <line x1="12" y1="18" x2="21" y2="18" className="line"></line>
            </g>
            <g opacity={open ? 100 : 0} className="transition-opacity">
                <line x1="18" y1="6" x2="6" y2="18" className="close"></line>
                <line x1="6" y1="6" x2="18" y2="18" className="close"></line>
            </g>
        </svg>
    </button>

}


export const Header = () => {
    const [open, setOpen] = useState(false);

    let logoEle = null;
    if (SITE.logoImg) {
        if (typeof (SITE.logoImg) === "string") {
            logoEle = (<img className="h-[60px]" src={SITE.logoImg} alt="logo" />);
        } else {
            logoEle = (<>
                <img className="h-[60px] dark:hidden" src={SITE.logoImg.light} alt="logo" />
                <img className="h-[60px] hidden dark:inline" src={SITE.logoImg.dark} alt="logo" />

            </>)
        }
    } else {
        logoEle = <pre>{SITE.logoText}</pre>;
    }


    return (
        <header className="sticky top-0 bg-term-bg z-20 shadow-md
            dark:bg-[#343434] dark:shadow-black">
            <div className={`sm:flex justify-between items-center
             max-w-screen-md px-8 mx-auto`}>
                <div className="w-full sm:w-fit flex justify-between items-center h-[80px]">
                    <a href="/" className="text-xs font-bold leading-3">
                        {logoEle}
                    </a>

                    <div className="self-center sm:hidden">
                        <MenuButton open={open} onClick={() => setOpen(!open)} />
                    </div>
                </div>
                <nav className={`${styles["main-nav"]} `}>
                    <ul className={`${open ? "h-fit" : "h-0 !py-0"}`}>
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

