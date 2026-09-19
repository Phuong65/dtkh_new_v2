import { ElementRef, Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
    name: 'checkInputHtml'
})
export class CheckInputHtmlPipe implements PipeTransform {

    constructor(private sanitized: DomSanitizer) { 
        
    }

    transform(value: string, elem: HTMLDivElement): string {       
        elem.innerHTML = value;
        return null;
    }
}
