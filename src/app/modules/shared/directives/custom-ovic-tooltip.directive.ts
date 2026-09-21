import { Directive , ElementRef , HostBinding , HostListener } from '@angular/core';

@Directive( {standalone: false, 
	selector : '[appCustomOvicTooltip]'
} )
export class CustomOvicTooltipDirective {

	constructor( private host : ElementRef<HTMLElement> ) { }

	@HostBinding( 'class.mouseover' ) isMouseover : boolean;

	// Dragover listener
	// @HostListener( 'mouseover' , [ '$event' ] ) mouseOver( event : MouseEvent ) {
	// 	console.log( 'onmouseover' );
	// 	this.isMouseover = true;
	// 	// this.host.nativeElement.style.setProperty( '--ovic-tooltip--x' , event.clientX.toString( 10 ) );
	// 	// this.host.nativeElement.style.setProperty( '--ovic-tooltip--Y' , event.clientY.toString( 10 ) );
	// 	// this.host.nativeElement.style.setProperty( '--ovic-tooltip--display' , 'block' );
	// }

	@HostListener( 'mouseleave' , [ '$event' ] ) mouseLeave( event : MouseEvent ) {
		console.log( 'onmouseleave' );
		this.isMouseover = false;
		this.host.nativeElement.style.setProperty( '--ovic-tooltip--display' , 'none' );
	}

	@HostListener( 'mouseenter' , [ '$event' ] ) mouseEnter( event : MouseEvent ) {
		console.log( 'onmouseenter' );
		this.isMouseover = false;
		const clientRect = this.host.nativeElement.getBoundingClientRect();
		this.host.nativeElement.style.setProperty( '--ovic-tooltip--x' , clientRect.left.toString( 10 ) + 'px' );
		this.host.nativeElement.style.setProperty( '--ovic-tooltip--Y' , clientRect.top.toString( 10 ) + 'px' );
		this.host.nativeElement.style.setProperty( '--ovic-tooltip--display' , 'block' );
		console.log( clientRect );
	}

}
