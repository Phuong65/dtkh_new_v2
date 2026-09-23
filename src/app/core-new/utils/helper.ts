import { Signal, signal } from '@angular/core';

export const appendElementStyle = (element: HTMLElement, styles: Partial<CSSStyleDeclaration>): HTMLElement => {
    Object.assign(element.style, styles);
    return element;
};

export const linkStaticResource = (path: string): string => {
    return window.location.origin + '/' + path;
};

export const staticResource = (path: string): Signal<string> => {
    return signal<string>(linkStaticResource(path));
};

export const writeToClipboard = async (userText: string): Promise<boolean | any> => {
    try {
        await navigator.clipboard.writeText(userText);
        return true;
    } catch (error) {
        return error;
    }
};

export const readFromClipboard = async (): Promise<string | any> => {
    try {
        return await navigator.clipboard.readText();
    } catch (error) {
        return error;
    }
};

export function formatBytes(bytes: number, decimals: number = 2): string {
    if (!bytes || bytes === 0) {
        return '0 Bytes';
    }
    const k = 1024;
    const dm = decimals <= 0 ? 0 : decimals;
    const sizes: string[] = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
