import { Directive , HostListener , Input } from '@angular/core';

@Directive( {
	selector : '[preventDoubleClick]'
} )
export class PreventDoubleClickDirective {

	@Input() delay : number = 500;

	private isDisabled : boolean = false;

	@HostListener( 'click' , [ '$event' ] ) handleClick ( event : Event ) : void {
		if ( this.isDisabled ) {
			event.stopImmediatePropagation();
			event.preventDefault();
			return;
		}
		this.isDisabled = true;
		setTimeout( () : void => {
			this.isDisabled = false;
		} , this.delay );
	}
}