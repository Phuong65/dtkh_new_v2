import {
	AfterViewInit,
	Directive,
	ElementRef,
	EventEmitter,
	Input,
	NgZone,
	OnDestroy,
	Output,
	Renderer2
} from '@angular/core';
import * as Plyr from 'plyr';

@Directive({ selector: 'plyr' })
export class OvicPlyrDirective implements AfterViewInit, OnDestroy {
	@Input() plyrTitle = '';
	@Input() plyrPlaysInline = false;
	@Input() plyrCrossOrigin = false;
	@Input() plyrOptions: Plyr.Options = {};
	@Input() plyrSources: Plyr.Source[] = [];
	@Input() plyrTracks: Plyr.Track[] = [];
	@Input() plyrPoster = '';
	@Input() plyrType: Plyr.MediaType = 'video';

	@Output() plyrInit = new EventEmitter<Plyr>();
	@Output() plyrReady = new EventEmitter<Plyr.PlyrEvent>();
	@Output() plyrPlay = new EventEmitter<Plyr.PlyrEvent>();
	@Output() plyrPause = new EventEmitter<Plyr.PlyrEvent>();
	@Output() plyrPlaying = new EventEmitter<Plyr.PlyrEvent>();
	@Output() plyrWaiting = new EventEmitter<Plyr.PlyrEvent>();
	@Output() plyrSeeking = new EventEmitter<Plyr.PlyrEvent>();
	@Output() plyrSeeked = new EventEmitter<Plyr.PlyrEvent>();
	@Output() plyrEnded = new EventEmitter<Plyr.PlyrEvent>();
	@Output() plyrTimeUpdate = new EventEmitter<Plyr.PlyrEvent>();
	@Output() plyrProgress = new EventEmitter<Plyr.PlyrEvent>();
	@Output() plyrVolumeChange = new EventEmitter<Plyr.PlyrEvent>();
	@Output() plyrRateChange = new EventEmitter<Plyr.PlyrEvent>();
	@Output() plyrLoadStart = new EventEmitter<Plyr.PlyrEvent>();
	@Output() plyrLoadedData = new EventEmitter<Plyr.PlyrEvent>();
	@Output() plyrLoadedMetadata = new EventEmitter<Plyr.PlyrEvent>();
	@Output() plyrCanPlay = new EventEmitter<Plyr.PlyrEvent>();
	@Output() plyrCanPlayThrough = new EventEmitter<Plyr.PlyrEvent>();
	@Output() plyrStalled = new EventEmitter<Plyr.PlyrEvent>();
	@Output() plyrError = new EventEmitter<Plyr.PlyrEvent>();

	private player: Plyr | null = null;
	private readonly handlers = new Map<string, (event: any) => void>();

	constructor(
		private readonly elementRef: ElementRef<HTMLElement>,
		private readonly ngZone: NgZone,
		private readonly renderer: Renderer2
	) {}

	ngAfterViewInit(): void {
		const host = this.elementRef.nativeElement;
		const media = this.renderer.createElement(this.plyrType);
		this.renderer.setAttribute(media, 'controls', 'true');
		if (this.plyrPlaysInline) this.renderer.setAttribute(media, 'playsinline', '');
		if (this.plyrCrossOrigin) this.renderer.setAttribute(media, 'crossorigin', '');
		this.renderer.appendChild(host, media);

		this.player = new Plyr(media, this.plyrOptions);
		this.player.source = {
			type: this.plyrType,
			title: this.plyrTitle,
			sources: this.plyrSources,
			poster: this.plyrPoster,
			tracks: this.plyrTracks
		};
		this.plyrInit.emit(this.player);

		const outputs: Record<string, EventEmitter<any>> = {
			ready: this.plyrReady,
			play: this.plyrPlay,
			pause: this.plyrPause,
			playing: this.plyrPlaying,
			waiting: this.plyrWaiting,
			seeking: this.plyrSeeking,
			seeked: this.plyrSeeked,
			ended: this.plyrEnded,
			timeupdate: this.plyrTimeUpdate,
			progress: this.plyrProgress,
			volumechange: this.plyrVolumeChange,
			ratechange: this.plyrRateChange,
			loadstart: this.plyrLoadStart,
			loadeddata: this.plyrLoadedData,
			loadedmetadata: this.plyrLoadedMetadata,
			canplay: this.plyrCanPlay,
			canplaythrough: this.plyrCanPlayThrough,
			stalled: this.plyrStalled,
			error: this.plyrError
		};

		Object.entries(outputs).forEach(([name, output]) => {
			const handler = (event: any): void => this.ngZone.run(() => output.emit(event));
			this.handlers.set(name, handler);
			this.player?.on(name as any, handler);
		});
	}

	ngOnDestroy(): void {
		if (!this.player) return;
		this.handlers.forEach((handler, name) => this.player?.off(name as any, handler));
		this.player.destroy();
		this.player = null;
	}
}
