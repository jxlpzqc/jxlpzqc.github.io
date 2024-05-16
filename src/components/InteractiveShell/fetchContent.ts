
export async function fetchContent(dir: string): Promise<{
    success: boolean;
    failMessage?: string;
    type?: string;
    element?: HTMLElement;
}> {
    let url = dir;
    try {
        let type: string = "";
        let element: HTMLElement | null;
        do {
            const res = await fetch(url);
            if (res.status === 404) {
                return { success: false, failMessage: "No such file or directory." };
            } else if (res.status < 200 || res.status >= 400) {
                return { success: false, failMessage: "Failed to fetch item." };
            }
            const text = await res.text();
            const dom = new DOMParser().parseFromString(text, "text/html");
            element = dom.getElementById("init-content");

            type = element?.dataset?.initType || "";
            if (!type) throw new Error("No type.");
            if (type === "symlink") {
                const linkUrl = element?.dataset?.linkUrl;
                if (!linkUrl) throw new Error("No linkUrl.");
                url = linkUrl;
            }
        } while (type === "symlink");
        if (element && type) {
            return { success: true, type, element: element };
        }
        return { success: false, failMessage: "Failed to fetch item." };
    }
    catch (e) {
        return { success: false, failMessage: "Unknown error." };
    }
}

export function getAbsoluteDir(dir: string, pwd: string): string {
    if (dir.startsWith("/") || dir.startsWith("~")) {
        return dir;
    }
    // handle '..' and '.'
    const dirList = dir.split("/");
    const pwdList = pwd.split("/");
    if (pwdList[pwdList.length - 1] === "") {
        pwdList.pop();
    }
    for (const d of dirList) {
        if (d === "..") {
            pwdList.pop();
        } else if (d !== ".") {
            pwdList.push(d);
        }
    }
    const result = pwdList.join("/");
    return result.startsWith("/") ? result : "/" + result;
}

function contentToList(element: HTMLElement): string[] {
    const filenames = element.querySelectorAll("a.file-name");
    const ret: string[] = [];
    for (const filename of filenames) {
        if (filename.textContent !== null) {
            ret.push(filename.textContent);
        }
    }
    return ret;
}

export async function getSuggestionList(path: string, pwd: string): Promise<string[]> {
    const absPath = getAbsoluteDir(path, pwd);
    let dir = absPath.substring(0, absPath.lastIndexOf("/"));

    if (dir === "") dir = "/";
    const content = await fetchContent(dir);
    if (!content.element || !content.success || content.type !== "list") {
        return [];
    }
    const filenameList = contentToList(content.element);

    const pathDir = path.substring(0, path.lastIndexOf("/") + 1);

    return filenameList
        .filter((filename) => filename.toLowerCase().startsWith(path.split("/").pop()?.toLowerCase() || ""))
        .map((filename) => pathDir + filename);
}