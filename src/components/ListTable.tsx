import type { FileSystemItem } from "@utils/filesystem";
import "./ListTable.css"

export type Props = {
    file: FileSystemItem;
    page?: number;
};

function ItemView({ item }: { item: FileSystemItem }) {
    return <tr>
        <td>
            <a href={item.symlink || item.absPath} >
                {item.name + (item.type === "dir" ? "/" : "")}
            </a>
        </td>

        <td>
            <div className="text-gray-500">{item.collectionObject?.data?.title || item.desc || item.name}</div>
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

    return (<table className="table-auto w-full *:text-left posts-list">
        <thead>
            <tr>
                <th>Title / Desc</th>
                <th>File Name</th>
                <th>Tags</th>
            </tr>
        </thead>
        <tbody>
            {
                children.map((item) => (<ItemView item={item} key={item.absPath} />))
            }
        </tbody>
    </table>);

    //  <div className="border-t-2 border-black border-dashed mt-4 pt-4" >
    //             <div>There are total {collection.length} files, showing 1-10.</div>
    //             <div>Use `prev` or `next` command to navigate.</div>
    //             <div className="flex justify-between mt-4">
    //                 <a>⬅️ Go Prev</a>
    //                 <a>Go Next ➡️</a>
    //             </div>
    //         </div > 

}