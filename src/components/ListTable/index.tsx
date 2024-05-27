import type { FileSystemItem } from "@utils/filesystem";
import { SITE } from "@config"
import { formatDate } from "@utils/date";

export type Props = {
    file: FileSystemItem;
    page?: number;
};

function ItemView({ item }: { item: FileSystemItem }) {
    return <li className="pb-2 last:pb-0 ">
        <div className="flex justify-between break-all gap-2">
            <a className="file-name">
                {item.name + (item.type === "dir" ? "/" : "")}
            </a>
            <div>{formatDate(item.date) || formatDate(item.collectionObject?.data?.pubDate)}</div>
        </div>
        <div className="flex flex-wrap justify-between">
            <a href={item.symlink || item.absPath} className="text-term-blue hover:underline">
                {item.collectionObject?.data?.title || item.desc || item.name}
            </a>
            <div className="text-gray-500">{item.tag?.join(", ")}</div>
        </div>

    </li>

}

export default function (props: Props) {

    const children = props.file.children;
    if (!children || children.length === 0) {
        return <div>This directory is empty.</div>;
    }

    return (
        <div className="command-result">
            {children.length > SITE.listLimitSize && <div className="my-4 hidden-in-less">
                The directory contains too many files, you may
                <a href="" className="text-term-blue" data-command="less"> pipe to less (C-h)</a>.
            </div>}
            <ul>
                {
                    children.map((item) => (<ItemView item={item} key={item.absPath} />))
                }

            </ul>
        </div>);
}