import { Pipe , PipeTransform } from '@angular/core';
import { DomSanitizer , SafeResourceUrl , SafeUrl } from '@angular/platform-browser';

@Pipe( {
	name       : 'safeUrl' ,
	standalone : true
} )
export class SafeUrlPipe implements PipeTransform {

	constructor( private sanitized : DomSanitizer ) {}

	transform( value : string ) : SafeUrl {
		return this.sanitized.bypassSecurityTrustUrl( value );
	}
}
