import type { FileSystemItem } from "@utils/filesystem";
import "./ListTable.css"

export type Props = {
    file: FileSystemItem;
    page?: number;
};

export default function (props: Props) {

    const path = props.file.absPath || "/";
    const children = props.file.children;
    if (!children || children.length === 0) {
        return <div>This directory is empty.</div>;
    }

    return (<table className="table-auto w-full *:text-left posts-list">
        <thead>
            <tr>
                <th className="w-2/3">File</th>
                <th>Tag</th>
            </tr>
        </thead>
        <tbody>
            {
                children.map((item) => (
                    <tr>
                        <td>
                            <a
                                href={
                                    item.symlink ||
                                    (path == "/" ? "" : path) + "/" + item.name
                                }
                            >
                                {item.name + (item.type === "dir" ? "/" : "")}
                            </a>
                        </td>
                    </tr>
                ))
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