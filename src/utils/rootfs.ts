import { getCollection, type CollectionEntry } from "astro:content";
import type { FileSystemItem } from "./filesystem";
import { SITE } from "@config";
import fsPromise from "fs/promises";
import fs from "fs";
import yaml from "yaml"

const postExt = SITE.postExt;

async function getPosts(blogs: CollectionEntry<'blog'>[]): Promise<FileSystemItem[]> {

    let ret: FileSystemItem[] = [];

    for (const blog of blogs) {
        const slugs = blog.slug.split("/");

        let current = ret;
        for (let i = 0; i < slugs.length; i++) {
            const slug = slugs[i];
            if (i === slugs.length - 1) {
                current.push({
                    name: slug + postExt,
                    type: "file",
                    tag: blog.data.tags || [],
                    collectionObject: blog,
                });
            } else {
                let schild = current.find((child) => child.name === slug);
                if (schild === undefined) {
                    const realPath = "src/content/blog/" + slugs.slice(0, i + 1).join("/");
                    const dirStat = await fsPromise.stat(realPath);

                    const ymlPath = realPath + "/.directory";
                    let desc;
                    if (fs.existsSync(ymlPath)) {
                        const d = await fsPromise.readFile(ymlPath, "utf-8");
                        const meta = yaml.parse(d);
                        desc = meta?.desc;
                    }

                    const newChild: FileSystemItem = {
                        name: slug,
                        type: "dir",
                        desc,
                        tag: [],
                        date: dirStat.mtime,
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
            name: noDupFilenameWithoutExt + postExt,
            type: "symlink",
            symlink: "/posts/" + blog.slug + postExt,
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
                name: noDupFilenameWithoutExt + postExt,
                type: "symlink",
                symlink: "/posts/" + blog.slug + postExt,
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
                date: new Date(year, 0, 1),
                desc: year.toString() + " 合集",
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
            name: noDupFilenameWithoutExt + postExt,
            type: "symlink",
            symlink: "/posts/" + blog.slug + postExt,
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

const links: FileSystemItem = {
    name: "links",
    type: "dir",
    desc: "链接",
    children: [
        {
            name: "friends",
            type: "dir",
            desc: "友情链接",
            children: [
                {
                    name: "wjk.lnk",
                    type: "symlink",
                    desc: "wjk的博客",
                    symlink: "https://wjk.moe"
                },
                {
                    name: "ihopenot.lnk",
                    type: "symlink",
                    desc: "ihopenot的博客",
                    symlink: "https://blog.ihopenot.men"
                },
                {
                    name: "earthc.lnk",
                    type: "symlink",
                    desc: "earthc的博客",
                    symlink: "https://b.earthc.moe"
                }
            ]
        },
        {
            name: "github.lnk",
            desc: "我的GitHub",
            type: "symlink",
            symlink: "https://github.com/jxlpzqc"
        }
    ]
}

export async function getRootFs(): Promise<FileSystemItem> {

    if (_root !== null) {
        return _root;
    }

    const rootChildren: FileSystemItem[] = [
        {
            name: "posts",
            type: "dir",
            desc: "全部博文",
            children: await getPosts(await getCollection('blog')),
        },
        {
            name: "tags",
            type: "dir",
            desc: "按标签分组",
            children: getTags(await getCollection('blog')),
        },
        {
            name: "recents",
            type: "dir",
            desc: "按时间倒序",
            children: getRecents(await getCollection('blog')),
        },
        {
            name: "archives",
            type: "dir",
            desc: "按年份分组",
            children: getArchives(await getCollection('blog')),
        },
        links,
        {
            // if you want to change ext, change about.md.md file name,
            // and change ignore list in[...slug].astro
            name: "about.md",
            type: "file",
            desc: "关于我",
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
