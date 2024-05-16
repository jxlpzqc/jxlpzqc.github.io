import { getCollection, type CollectionEntry } from "astro:content";
import type { FileSystemItem } from "./filesystem";

function getPosts(blogs: CollectionEntry<'blog'>[]): FileSystemItem[] {

    let ret: FileSystemItem[] = [];

    for (const blog of blogs) {
        const slugs = blog.slug.split("/");

        let current = ret;
        for (let i = 0; i < slugs.length; i++) {
            const slug = slugs[i];
            if (i === slugs.length - 1) {
                current.push({
                    name: slug + ".md",
                    type: "file",
                    tag: blog.data.tags || [],
                    collectionObject: blog,
                });
            } else {
                let schild = current.find((child) => child.name === slug);
                if (schild === undefined) {
                    const newChild: FileSystemItem = {
                        name: slug,
                        type: "dir",
                        tag: [],
                        children: []
                    };
                    current.push(newChild);
                    schild = newChild;
                }
                current = schild.children!;
            }
        }
    }

    return ret;
}

function getRecents(blogs: CollectionEntry<'blog'>[]): FileSystemItem[] {
    blogs.sort((a, b) => {
        return new Date(b.data.pubDate).getTime() - new Date(a.data.pubDate).getTime();
    });
    const ret: FileSystemItem[] = [];
    const names: Set<string> = new Set();
    for (const blog of blogs) {
        let noDupFilenameWithoutExt = blog.slug.split("/").pop();
        if (!noDupFilenameWithoutExt) {
            continue;
        }

        if (names.has(noDupFilenameWithoutExt)) {
            let n = 2;
            while (names.has(noDupFilenameWithoutExt + "-" + n)) {
                n++;
            }
            noDupFilenameWithoutExt = noDupFilenameWithoutExt + "-" + n;
        }

        names.add(noDupFilenameWithoutExt);
        ret.push({
            name: noDupFilenameWithoutExt + ".md",
            type: "symlink",
            symlink: "/posts/" + blog.slug + ".md",
            tag: blog.data.tags || [],
            collectionObject: blog,
        });
    }
    return ret;
}

function getTags(blogs: CollectionEntry<'blog'>[]): FileSystemItem[] {
    const ret: FileSystemItem[] = [];
    const tagMap: Map<string, FileSystemItem> = new Map();

    for (const blog of blogs) {
        const tags = blog.data.tags || [];
        for (const tag of tags) {
            let current = tagMap.get(tag);
            if (current === undefined) {
                current = {
                    name: tag,
                    type: "dir",
                    tag: [],
                    children: []
                };
                tagMap.set(tag, current);
                ret.push(current);
            }

            let noDupFilenameWithoutExt = blog.slug.split("/").pop();
            if (!noDupFilenameWithoutExt) {
                continue;
            }

            current.children!.push({
                name: noDupFilenameWithoutExt + ".md",
                type: "symlink",
                symlink: "/posts/" + blog.slug + ".md",
                tag: blog.data.tags || [],
                collectionObject: blog,
            });
        }
    }

    return ret;
}

function getArchives(blogs: CollectionEntry<'blog'>[]): FileSystemItem[] {
    const ret: FileSystemItem[] = [];
    const yearMap: Map<number, FileSystemItem> = new Map();

    for (const blog of blogs) {
        const pubDate = new Date(blog.data.pubDate);
        const year = pubDate.getFullYear();

        let current = yearMap.get(year);
        if (current === undefined) {
            current = {
                name: year.toString(),
                type: "dir",
                tag: [],
                children: []
            };
            yearMap.set(year, current);
            ret.push(current);
        }

        let noDupFilenameWithoutExt = blog.slug.split("/").pop();
        if (!noDupFilenameWithoutExt) {
            continue;
        }

        current.children!.push({
            name: noDupFilenameWithoutExt + ".md",
            type: "symlink",
            symlink: "/posts/" + blog.slug + ".md",
            tag: blog.data.tags || [],
            collectionObject: blog,
        });
    }
    return ret;
}


function _treeAddAbsPath(current: FileSystemItem, absPath: string = ""): FileSystemItem {
    return {
        ...current,
        absPath: absPath === "" ? "/" : absPath,
        children: current.children?.map((child) => _treeAddAbsPath(child, absPath + "/" + child.name))
    };
}

let _root: FileSystemItem | null = null;

export async function getRootFs(): Promise<FileSystemItem> {

    if (_root !== null) {
        return _root;
    }

    const rootChildren: FileSystemItem[] = [
        {
            name: "posts",
            type: "dir",
            desc: "All posts",
            children: getPosts(await getCollection('blog')),
        },
        {
            name: "tags",
            type: "dir",
            desc: "Posts group by tags",
            children: getTags(await getCollection('blog')),
        },
        {
            name: "recents",
            type: "dir",
            desc: "Posts ordered by time",
            children: getRecents(await getCollection('blog')),
        },
        {
            name: "archives",
            type: "dir",
            desc: "Posts group by year",
            children: getArchives(await getCollection('blog')),
        },
        {
            name: "about.md",
            type: "file",
            desc: "About me",
            tag: [],
        }
    ];


    const root: FileSystemItem = {
        name: "",
        type: "dir",
        desc: "Root directory",
        tag: [],
        children: rootChildren
    };

    _root = _treeAddAbsPath(root);
    return _root;
}
