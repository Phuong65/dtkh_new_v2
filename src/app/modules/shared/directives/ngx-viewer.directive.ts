import { Directive, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import Viewer from 'viewerjs';

@Directive({ selector: '[ngxViewer]', standalone: true })
export class NgxViewerDirective implements OnInit, OnDestroy {
	@Input() viewerOptions: Viewer.Options = {};

	@Output() viewerReady = new EventEmitter<CustomEvent>();
	@Output() viewerShow = new EventEmitter<CustomEvent>();
	@Output() viewerShown = new EventEmitter<CustomEvent>();
	@Output() viewerHide = new EventEmitter<CustomEvent>();
	@Output() viewerHidden = new EventEmitter<CustomEvent>();
	@Output() viewerView = new EventEmitter<CustomEvent>();
	@Output() viewerViewed = new EventEmitter<CustomEvent>();
	@Output() viewerZoom = new EventEmitter<CustomEvent>();
	@Output() viewerZoomed = new EventEmitter<CustomEvent>();

	private instance: Viewer | null = null;
	private readonly nativeElement: HTMLElement;

	constructor(private readonly elementRef: ElementRef<HTMLElement>) {
		this.nativeElement = elementRef.nativeElement;
	}

	ngOnInit(): void {
		this.instance = new Viewer(this.nativeElement, {
			transition: false,
			...this.viewerOptions
		});
	}

	ngOnDestroy(): void {
		this.instance?.destroy();
		this.instance = null;
	}
}
