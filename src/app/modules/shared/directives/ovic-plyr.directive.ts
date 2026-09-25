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
import Plyr, * as PlyrTypes from 'plyr';

@Directive({ standalone: true, selector: 'plyr' })
export class OvicPlyrDirective implements AfterViewInit, OnDestroy {
	@Input() plyrTitle = '';
	@Input() plyrPlaysInline = false;
	@Input() plyrCrossOrigin = false;
	@Input() plyrOptions: PlyrTypes.Options = {};
	@Input() plyrSources: PlyrTypes.Source[] = [];
	@Input() plyrTracks: PlyrTypes.Track[] = [];
	@Input() plyrPoster = '';
	@Input() plyrType: PlyrTypes.MediaType = 'video';

	@Output() plyrInit = new EventEmitter<Plyr>();
	@Output() plyrReady = new EventEmitter<PlyrTypes.PlyrEvent>();
	@Output() plyrPlay = new EventEmitter<PlyrTypes.PlyrEvent>();
	@Output() plyrPause = new EventEmitter<PlyrTypes.PlyrEvent>();
	@Output() plyrPlaying = new EventEmitter<PlyrTypes.PlyrEvent>();
	@Output() plyrWaiting = new EventEmitter<PlyrTypes.PlyrEvent>();
	@Output() plyrSeeking = new EventEmitter<PlyrTypes.PlyrEvent>();
	@Output() plyrSeeked = new EventEmitter<PlyrTypes.PlyrEvent>();
	@Output() plyrEnded = new EventEmitter<PlyrTypes.PlyrEvent>();
	@Output() plyrTimeUpdate = new EventEmitter<PlyrTypes.PlyrEvent>();
	@Output() plyrProgress = new EventEmitter<PlyrTypes.PlyrEvent>();
	@Output() plyrVolumeChange = new EventEmitter<PlyrTypes.PlyrEvent>();
	@Output() plyrRateChange = new EventEmitter<PlyrTypes.PlyrEvent>();
	@Output() plyrLoadStart = new EventEmitter<PlyrTypes.PlyrEvent>();
	@Output() plyrLoadedData = new EventEmitter<PlyrTypes.PlyrEvent>();
	@Output() plyrLoadedMetadata = new EventEmitter<PlyrTypes.PlyrEvent>();
	@Output() plyrCanPlay = new EventEmitter<PlyrTypes.PlyrEvent>();
	@Output() plyrCanPlayThrough = new EventEmitter<PlyrTypes.PlyrEvent>();
	@Output() plyrStalled = new EventEmitter<PlyrTypes.PlyrEvent>();
	@Output() plyrError = new EventEmitter<PlyrTypes.PlyrEvent>();

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

		const outputs: Record<string, EventEmitter<Event>> = {
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
			const handler = (event: Event): void => this.ngZone.run(() => output.emit(event));
			this.handlers.set(name, handler);
			this.player?.on(name as keyof PlyrTypes.PlyrEventMap, handler as any);
		});
	}

	ngOnDestroy(): void {
		if (!this.player) return;
		this.handlers.forEach((handler, name) => this.player?.off(name as keyof PlyrTypes.PlyrEventMap, handler));
		this.player.destroy();
		this.player = null;
	}
}
