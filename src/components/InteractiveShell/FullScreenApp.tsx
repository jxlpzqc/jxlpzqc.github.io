import type { LessAppProps } from "@components/LessApp";
import LessApp from '@components/LessApp';
import { useEffect, useState, type PropsWithChildren } from "react";
import ReactDOM from "react-dom";

export type FullScreenAppRequest = {
    type: "less";
    props?: Omit<LessAppProps, 'onExit'>;
};

type Props = {
    req?: FullScreenAppRequest;
}

function FullScreenInnerAppWrapper(props: PropsWithChildren<{}>) {
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "auto";
        };
    });

    // create portal
    return ReactDOM.createPortal(
        <div className="w-screen h-screen fixed top-0 left-0">
            {props.children}
        </div>,
        document.body);
}

export default function FullScreenApp({ req }: Props) {
    if (!req) return null;
    const { type, props: appProps } = req;
    const [visible, setVisible] = useState(false);
    const onExit = () => {
        setVisible(false);
    }
    // when req change, show the app
    useEffect(() => {
        setVisible(true);
    }, [req]);

    if (!visible) return null;

    if (type === "less") {
        return <FullScreenInnerAppWrapper >
            <LessApp {...appProps!} onExit={onExit} />
        </FullScreenInnerAppWrapper>;
    }
    return null;
}