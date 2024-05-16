const logo = `
  ___ _                     _
 / __| |_  ___ _ _  __ _ __(_)
| (__| ' \\/ -_) ' \\/ _\` |_ / |
 \\___|_||_\\___|_||_\\__, /__|_|
                   |___/
`;


export const Header = () => {
    return (
        <header className="sticky top-0 bg-yellow-50 z-20 shadow-sm shadow-slate-600 ">
            <div className="flex justify-between items-center
            max-w-screen-md mx-auto px-8 text-sm pb-4"
                style={{
                    lineHeight: "1em"
                }}>
                <a href="/">
                    <pre>{logo}</pre>
                </a>
                <nav className="self-end text-lg font-bold pb-4">
                    <ul className="flex space-x-8">
                        <li><a href="/recents">/recents</a></li>
                        <li><a href="/posts">/posts</a></li>
                        <li><a href="/tags">/tags</a></li>
                        <li><a href="/archives">/archives</a></li>
                        {/* <li><a href="#">⚙️</a></li> */}
                    </ul>
                </nav>
            </div>
        </header>
    );
}

