import { Pipe , PipeTransform } from '@angular/core';
import { DomSanitizer , SafeHtml } from '@angular/platform-browser';

@Pipe( {standalone: true,  name : 'ovicSafeHtml' } )
export class OvicSafeHtmlPipe implements PipeTransform {
	constructor( private sanitized : DomSanitizer ) {}

	transform( value : string ) : SafeHtml {
		return this.sanitized.bypassSecurityTrustHtml( value );
	}

}
