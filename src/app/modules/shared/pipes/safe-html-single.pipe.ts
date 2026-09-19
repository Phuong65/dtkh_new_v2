import { Pipe , PipeTransform } from '@angular/core';
import { DomSanitizer , SafeHtml } from '@angular/platform-browser';

@Pipe( {
	name       : 'safeHtmlSingle' ,
	standalone : true
} )
export class SafeHtmlSinglePipe implements PipeTransform {

	constructor( private domSanitizer : DomSanitizer ) {}

	transform( value : string ) : SafeHtml {
		return this.domSanitizer.bypassSecurityTrustHtml( value );
	}
}
