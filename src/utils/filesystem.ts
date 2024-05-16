import { getCollection, type CollectionEntry } from "astro:content";
import { getRootFs } from "./rootfs";

export type FileSystemItem = {
    name: string;
    type: "file" | "dir" | "symlink";
    symlink?: string;
    tag?: string[];
    desc?: string;
    absPath?: string;
    collectionObject?: CollectionEntry<'blog'>;
    children?: FileSystemItem[];
}

export async function getFsItem(absPath: string): Promise<FileSystemItem> {
    const paths = absPath.split("/");
    if (paths[paths.length - 1] === "") {
        paths.pop();
    }

    let current = await getRootFs();

    for (let i = 1; i < paths.length; i++) {
        if (i != paths.length - 1 && current.type !== "dir") {
            throw new Error("Is not a directory.");
        }
        const children = current.children;
        const next = children?.find((child) => child.name === paths[i]);
        if (!next) {
            throw new Error("No such file or directory.");
        }
        current = next;
    }
    return current;
}

function _getAllFsItems(current: FileSystemItem): FileSystemItem[] {
    let res: FileSystemItem[] = [current];
    const children = current.children;
    if (!children) {
        return res;
    }
    for (const child of children) {
        res = [
            ...res,
            ...(_getAllFsItems(child))
        ];
    }
    return res;
}

export async function getAllFsItems(): Promise<FileSystemItem[]> {
    const rootChildren = await getRootFs();
    return _getAllFsItems(rootChildren);
}