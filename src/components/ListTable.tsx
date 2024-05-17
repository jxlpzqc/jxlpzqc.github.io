import type { FileSystemItem } from "@utils/filesystem";
import classes from "./ListTable.module.css"
import { SITE } from "@config"

export type Props = {
    file: FileSystemItem;
    page?: number;
};

function ItemView({ item }: { item: FileSystemItem }) {
    return <tr>
        <td>
            <a href={item.symlink || item.absPath} className="file-name">
                {item.name + (item.type === "dir" ? "/" : "")}
            </a>
        </td>

        <td>
            <a href={item.symlink || item.absPath} className={`${classes['mobile-a']}`}>
                {item.collectionObject?.data?.title || item.desc || item.name}
            </a>
        </td>

        <td>
            <div className="text-gray-500">{item.tag?.join(",")}</div>
        </td>
    </tr>
}

export default function (props: Props) {

    const path = props.file.absPath || "/";
    const children = props.file.children;
    if (!children || children.length === 0) {
        return <div>This directory is empty.</div>;
    }

    return (
        <div className="command-result">
            {children.length > SITE.listLimitSize && <div className="my-4">
                The directory contains too many files, you may
                <a href="" className="text-blue-700" data-command="less"> pipe to less (C-h)</a>.
            </div>}
            <table className={`table-auto w-full *:text-left ${classes['posts-list']}`}>
                <thead>
                    <tr>
                        <th>File Name</th>
                        <th>Title / Desc</th>
                        <th>Tags</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        children.map((item) => (<ItemView item={item} key={item.absPath} />))
                    }
                </tbody>
            </table>
        </div>);
}