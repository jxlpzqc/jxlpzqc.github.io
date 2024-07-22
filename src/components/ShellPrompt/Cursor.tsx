import { forwardRef, useRef, useState } from 'react';
import styles from './styles.module.css'
import clsx from 'clsx';

type Props = {
    onInput?: (input: string) => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
};

export default forwardRef<HTMLTextAreaElement, Props>((props, ref) => {
    const [active, setActive] = useState(false);

    const isComposing = useRef(false);
    const [compositionStr, setCompositionStr] = useState('');

    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
        if (isComposing.current) return;
        props.onInput?.(e.currentTarget.value);
        e.currentTarget.value = '';
    }

    const handleComposition = (e: React.CompositionEvent<HTMLTextAreaElement>) => {
        if (e.type === 'compositionstart') {
            isComposing.current = true;
        } else if (e.type === 'compositionupdate') {
            setCompositionStr(e.data);
        } else if (e.type === 'compositionend') {
            isComposing.current = false;
            props.onInput?.(e.currentTarget.value);
            e.currentTarget.value = '';
            setCompositionStr('');
        }
    }

    return (
        <>
            <span className={clsx(styles.cursor, !active && styles['cursor-inactive'])} />
            <span className="underline absolute">{compositionStr}</span>
            <textarea onInput={handleInput} onKeyDown={props.onKeyDown}
                onCompositionStart={handleComposition}
                onCompositionUpdate={handleComposition}
                onCompositionEnd={handleComposition}
                ref={ref} onFocus={() => setActive(true)} onBlur={() => setActive(false)}
                className="bg-transparent border-none text-transparent cursor-text 
                outline-none overflow-hidden resize-none p-0 w-[1px] h-[1em] m-0 absolute"
                aria-label="shell prompt"
                aria-description="Input shell command here"
            />
        </>
    )
});