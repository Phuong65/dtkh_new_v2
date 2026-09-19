import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe( {
    name: 'stringToArrayPipe'
} )
export class StringToArrayPipe implements PipeTransform {

    constructor ( private sanitized: DomSanitizer ) { }

    transform ( string: string, separator = ',' ): any[] {
        return string.split( separator ).filter( m => m && m !== '');
    }
}
