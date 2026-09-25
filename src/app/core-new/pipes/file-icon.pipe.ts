import { Pipe, PipeTransform } from '@angular/core';

export type FileIconType = 'image' | 'video' | 'audio' | 'pdf' | 'ppt' | 'word' | 'excel' | 'txt' | 'markdown' | 'zip' | 'unknown';

function getFileTypeFromExtension(extension?: string): FileIconType {
    if (!extension) return 'unknown';
    switch (extension.toLowerCase()) {
        case 'jpg': case 'jpeg': case 'png': case 'gif': case 'bmp': case 'webp': return 'image';
        case 'mp4': case 'webm': case 'ogg': case 'mov': case 'm3u8': case 'm3u': case 'ts': case 'avi': case 'wmv': case 'flv': case 'mkv': case '3gp': return 'video';
        case 'mp3': case 'wav': return 'audio';
        case 'pdf': return 'pdf';
        case 'ppt': case 'pptx': return 'ppt';
        case 'doc': case 'docx': return 'word';
        case 'xls': case 'xlsx': return 'excel';
        case 'txt': case 'json': return 'txt';
        case 'md': return 'markdown';
        case 'zip': case 'rar': case '7z': return 'zip';
        default: return 'unknown';
    }
}

export function getFileIcon(file: File | string | { ext?: string }): FileIconType {
    if (typeof File !== 'undefined' && file instanceof File) {
        return getFileTypeFromExtension(file.name.split('.').pop());
    }
    const ext: string | undefined = typeof file === 'string' ? file : ('ext' in file ? file.ext : undefined);
    return getFileTypeFromExtension(ext);
}

@Pipe({
    name: 'fileIcon',
    standalone: true
})
export class FileIconPipe implements PipeTransform {
    transform(fileOrName: File | string | { ext?: string }): string {
        return `<svg aria-hidden="true" class="fp-svg-icon" style="width: 40px; height: 40px;"><use xlink:href="#nfp-${getFileIcon(fileOrName)}"></use></svg>`;
    }
}