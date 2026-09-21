import { OnInit , ElementRef , Input , Directive } from '@angular/core';

@Directive ( {standalone: false,  selector : '[focusMe]' } )
export class AutoFocusDirective implements OnInit {

	@Input ( 'focusMe' ) isFocused : boolean;

	constructor ( private hostElement : ElementRef ) {
	}

	ngOnInit () {
		if ( this.isFocused ) {
			this.hostElement.nativeElement.focus();
		}
	}
}
