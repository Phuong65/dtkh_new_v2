import { ElementRef, Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
    standalone: true,
    name: 'rawHtmlPipe'
})
export class RawHtmlPipe implements PipeTransform {

    constructor(private sanitized: DomSanitizer) { }

    transform(value: string, elem: HTMLDivElement, showInput: boolean = false): string {
        let result = value;
        if (showInput) {
            result = value.replace(/\{\_input\_\}/gi, '..............')
        }
        elem.innerHTML = result;
        return null;
    }
}
