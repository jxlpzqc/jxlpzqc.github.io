import { getCollection, type CollectionEntry } from "astro:content";

type FileSystemItem = {
    name: string;
    type: "file" | "dir" | "symlink";
    symlink?: string;
    tag?: string[];
    desc?: string;
    absPath?: string;
    collectionObject?: CollectionEntry<'blog'>;
    getChildren?: () => Promise<FileSystemItem[]>;
}

const rootfs: FileSystemItem[] = [
    {
        name: "posts",
        type: "dir",
        tag: ["recents"],
        async getChildren() {
            const blogs = await getCollection("blog");
            return [
                ...blogs.sort((x, y) => x.data.pubDate.getTime() - y.data.pubDate.getTime()).map((blog) => (<FileSystemItem>{
                    name: blog.slug + ".md",
                    type: "file",
                    desc: "",
                    collectionObject: blog,
                    tag: [],
                }))
            ]
        },
    },
    {
        name: "tags",
        type: "dir",
        tag: [],
    },
    {
        name: "recents",
        type: "dir",
        tag: [],
    },
    {
        name: "archives",
        type: "dir",
        tag: [],
    },
    {
        name: "about.md",
        type: "file",
        tag: [],
    }
];


const root: FileSystemItem = {
    name: "",
    type: "dir",
    tag: [],
    async getChildren() {
        return rootfs;
    }
}

export async function getFsItem(absPath: string): Promise<FileSystemItem> {
    const paths = absPath.split("/");
    if (paths[paths.length - 1] === "") {
        paths.pop();
    }

    let current = root;

    for (let i = 1; i < paths.length; i++) {
        if (i != paths.length - 1 && current.type !== "dir") {
            throw new Error("No such file or directory.");
        }
        const children = await current.getChildren?.();
        const next = children?.find((child) => child.name === paths[i]);
        if (!next) {
            throw new Error("No such file or directory.");
        }
        current = next;
    }

    return current;
}

async function _getAllFsItems(current: FileSystemItem, absPath: string): Promise<FileSystemItem[]> {
    let res: FileSystemItem[] = [{
        ...current,
        absPath: absPath === "" ? "/" : absPath,
    }];
    const children = await current.getChildren?.();
    if (!children) {
        return res;
    }
    for (const child of children) {
        res = [
            ...res,
            ...(await _getAllFsItems(child, absPath + "/" + child.name))
        ];
    }
    return res;
}

export async function getAllFsItems(): Promise<FileSystemItem[]> {
    const rootChildren = await getFsItem("/");
    return await _getAllFsItems(rootChildren, "");
}