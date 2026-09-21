import { Directive , ElementRef , Input , OnDestroy } from '@angular/core';

@Directive( {standalone: false, 
	selector : '[autoResizeTextarea]'
} )
export class AutoResizeTextareaDirective implements OnDestroy {

	@Input() minHeight? : number;

	private observer : MutationObserver;

	constructor ( private el : ElementRef<HTMLTextAreaElement> ) {
		const textarea : HTMLTextAreaElement = this.el.nativeElement;
		if ( ! this.minHeight && textarea.hasAttribute( 'rows' ) ) {
			const rows : number = parseInt( textarea.getAttribute( 'rows' ) || '0' , 10 );
			if ( rows > 0 ) {
				const lineHeight : number = this.getLineHeight( textarea );
				this.minHeight            = rows * lineHeight;
			}
		}

		textarea.addEventListener( 'input' , () : void => this.resize() );
		this.observer = new MutationObserver( () => this.resize() );
		this.observer.observe( textarea , { childList : true , characterData : true , subtree : true } );
		setTimeout( () : void => this.resize() );
	}

	private resize () : void {
		const textarea : HTMLTextAreaElement = this.el.nativeElement;
		textarea.style.height                = 'auto';
		const computed : CSSStyleDeclaration = window.getComputedStyle( textarea );
		const borderTop : number             = parseInt( computed.borderTopWidth , 10 ) || 0;
		const borderBottom : number          = parseInt( computed.borderBottomWidth , 10 ) || 0;
		let newHeight : number               = textarea.scrollHeight + borderTop + borderBottom;
		if ( this.minHeight ) {
			newHeight = Math.max( newHeight , this.minHeight );
		}
		textarea.style.height = `${ newHeight }px`;
	}

	private getLineHeight ( el : HTMLElement ) : number {
		const computedStyle : CSSStyleDeclaration = window.getComputedStyle( el );
		const lineHeight : number                 = parseInt( computedStyle.lineHeight , 10 );
		return isNaN( lineHeight ) ? 20 : lineHeight;
	}

	ngOnDestroy () {
		this.observer.disconnect();
	}

}
