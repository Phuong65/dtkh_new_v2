import { inject , Pipe , PipeTransform } from '@angular/core';
import { SafeHtml , DomSanitizer } from '@angular/platform-browser';

@Pipe( {
	name       : 'safeHtml' ,
	standalone : true
} )
export class SafeHtmlPipe implements PipeTransform {

	constructor( private domSanitizer : DomSanitizer ) {}

	transform( value : string ) : SafeHtml {
		return this.domSanitizer.bypassSecurityTrustHtml( value );
	}
}
