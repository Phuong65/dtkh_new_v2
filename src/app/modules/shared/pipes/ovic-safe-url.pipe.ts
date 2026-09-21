import { Pipe , PipeTransform } from '@angular/core';
import { DomSanitizer , SafeUrl } from '@angular/platform-browser';

@Pipe( {standalone: false, 
	name : 'ovicSafeUrl'
} )
export class OvicSafeUrlPipe implements PipeTransform {

	constructor( private sanitized : DomSanitizer ) {}

	transform( value : string ) : SafeUrl {
		return this.sanitized.bypassSecurityTrustUrl( value );
	}

}
