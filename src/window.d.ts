// extend window
interface Window {
    sendToLess?: (content: HTMLElement, filename: string) => void;
}