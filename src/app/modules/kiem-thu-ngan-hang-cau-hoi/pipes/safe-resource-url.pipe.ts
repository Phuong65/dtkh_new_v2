import { Pipe , PipeTransform } from '@angular/core';
import { DomSanitizer , SafeResourceUrl } from '@angular/platform-browser';

@Pipe( {
	name       : 'safeResourceUrl' ,
	standalone : true
} )
export class SafeResourceUrlPipe implements PipeTransform {

	constructor( private sanitized : DomSanitizer ) {}

	transform( value : string ) : SafeResourceUrl {
		return this.sanitized.bypassSecurityTrustResourceUrl( value );
	}

}
