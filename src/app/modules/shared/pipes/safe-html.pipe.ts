import { Pipe , PipeTransform } from '@angular/core';
import { DomSanitizer , SafeHtml } from '@angular/platform-browser';

@Pipe( {standalone: false, 
	name : 'safeHtml'
} )
export class SafeHtmlPipe implements PipeTransform {

	constructor( private sanitized : DomSanitizer ) {}

    transform(html: string): SafeHtml {
        const result = html ? this.sanitized.bypassSecurityTrustHtml(html) : 'Chưa có dữ liệu';
        return result;
	}
}
