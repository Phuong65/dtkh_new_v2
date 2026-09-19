import { ElementRef, Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe( {
    name: 'duplicateArray'
} )
export class DuplicateArrayPipe implements PipeTransform {

    constructor ( private sanitized: DomSanitizer ) {

    }

    transform ( data: string[] ): string[] {
        const result = [];
        if ( data && data.length ) {
            data.forEach( f => {
                result.push( f );
                result.push( f );
            } )
        }
        return result;
    }
}
