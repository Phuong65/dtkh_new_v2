import { Directive, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Observable, of } from 'rxjs';
import { getLinkDownload, getLinkDownload_aws } from '@env';
import { AuthService } from '@core/services/auth.service';

type MediaHostName = 'serverFile' | 'googleDrive' | 'serverAws';

@Directive({
	selector: '[appLoadMediaOnText]',
	standalone: true
})
export class LoadMediaOnTextDirective implements OnChanges {

	@Input('appLoadMediaOnText') check: any; // trigger event change don't move

	private _resourceGetter: Record<MediaHostName, (id: string) => Observable<string>> = {
		googleDrive: (id: string): Observable<string> => {
			return of(id);
		},
		serverAws: (id: string): Observable<string> => {
			const urlObject: URL = new URL(getLinkDownload_aws(id));
			urlObject.searchParams.append('token', this.auth.accessToken);
			return of(urlObject.toString());
		},
		serverFile: (id: string): Observable<string> => {
			const urlObject: URL = new URL(getLinkDownload(id));
			urlObject.searchParams.append('token', this.auth.accessToken);
			return of(urlObject.toString());
		}
	};

	constructor(
		private auth: AuthService,
		private tagElement: ElementRef
	) { }

	loading() {
		const serverFileImages: NodeList = this.tagElement.nativeElement.querySelectorAll('img[data-org="serverFile"]:not(.ictu-img-lazy),img[alt$="serverFile"]:not(.ictu-img-lazy)');
		const driverImages: NodeList = this.tagElement.nativeElement.querySelectorAll('img[data-org="googleDrive"]:not(.ictu-img-lazy)');
		const awsImages: NodeList = this.tagElement.nativeElement.querySelectorAll('img[data-org="serverAws"]:not(.ictu-img-lazy),img[alt$="serverAws"]:not(.ictu-img-lazy)');
		const oembed: NodeList = this.tagElement.nativeElement.querySelectorAll('oembed:not(.ictu-oembed--done)');
		const imgLoading: string = 'assets/images/svg/loading.svg';
		const imgError: string = 'assets/images/load-image-failed.jpg';
		if (serverFileImages.length || driverImages.length || awsImages.length) {
			this.tagElement.nativeElement.classList.add('ictu-element--contain-images');
			const ulTag = this.tagElement.nativeElement.closest('ul');
			if (ulTag) {
				ulTag.classList.add('ictu-list--contain-images');
			}
			if (serverFileImages.length) {
				serverFileImages.forEach((node: Node) => {
					const img: HTMLImageElement = node as HTMLImageElement;
					const id: number = img.getAttribute('src') ? parseInt(img.getAttribute('src') as string, 10) : NaN;
					if (!Number.isNaN(id)) {
						img.classList.add('ictu-img-lazy');
						img.setAttribute('data-src', id.toString(10));

						img.src = getLinkDownload(id.toString().concat('?token=', this.auth.accessToken));

						// this._resourceGetter.serverFile( id.toString( 10 ) ).subscribe( {
						// 	next  : src => {
						// 		img.src = src;
						// 		img.classList.add( 'img-loaded--success' );
						// 	} ,
						// 	error : () => {
						// 		img.classList.add( 'img-load--failed' );
						// 		img.src = imgError;
						// 	}
						// } );
					}
				});
			}
			if (driverImages.length) {
				driverImages.forEach((node: Node) => {
					const img: HTMLImageElement = node as HTMLImageElement;
					if (img.getAttribute('src') && !img.classList.contains('img-loaded--success')) {
						img.classList.add('ictu-img-lazy');
						const imgId: string = img.getAttribute('src') as string;
						img.setAttribute('data-src', img.getAttribute('src') as string);
						img.src = imgLoading;
						this._resourceGetter.googleDrive(imgId).subscribe({
							next: (src) => {
								img.src = src;
								img.classList.add('img-loaded--success');
							},
							error: () => {
								img.classList.add('img-load--failed');
								img.src = imgError;
							}
						});
					}
				});
			}
			if (awsImages.length) {
				awsImages.forEach((node: Node) => {

					const img = node as HTMLImageElement;

					const id = img.getAttribute('src') ?? '';

					const isBase64 = id.includes('base64');

					const isValidId = /^[0-9]+$/.test(id);

					if (!isBase64 && isValidId) {
						img.classList.add('ictu-img-lazy');

						img.setAttribute('data-id', id);

						img.src = imgLoading;

						this.tryLoadImageWithRetry(img, id, this.auth.accessToken, imgError, imgLoading);
					} else {
						img.classList.add('img-src--error');
					}
				});
			}
		}
		if (oembed.length) {
			oembed.forEach((oembedTag: Node) => {
				const htmlEmbedElement: HTMLEmbedElement = (oembedTag as HTMLEmbedElement);
				const url: string = htmlEmbedElement.getAttribute('url') as string;
				if (url) {
					// oembedTag.parentNode.insertBefore( this.buildIframeTags( url ) , oembedTag.nextSibling );
					htmlEmbedElement.parentNode?.insertBefore(this.buildIframeTags(url), oembedTag.nextSibling);
					htmlEmbedElement.classList.add('ictu-oembed--done');
					htmlEmbedElement.classList.add('d-none');
				}
			});
		}
		const newImages: NodeList = this.tagElement.nativeElement.querySelectorAll('img[alt*=serverFile]:not(.ictu-img-lazy) , img[alt*=googleDrive]:not(.ictu-img-lazy),img[alt*=serverAws]:not(.ictu-img-lazy)');
		if (newImages.length) {
			newImages.forEach((node: Node) => {
				const img: HTMLImageElement = node as HTMLImageElement;
				let id: number = img.getAttribute('src') ? parseInt(img.getAttribute('src') as string, 10) : NaN;
				let host: MediaHostName = null;
				const altSplit = img.alt ? img.alt.trim().split('|') : [];
				if (altSplit.length > 1 && !Number.isNaN(parseInt(altSplit[0], 10))) {
					id = Number.isNaN(id) ? parseInt(altSplit[0], 10) : id;
					host = altSplit[1] as MediaHostName;
				}
				if (id && !Number.isNaN(id) && host in this._resourceGetter) {
					img.classList.add('ictu-img-lazy');
					if (host === 'serverAws') {
						const urlObject: URL = new URL(getLinkDownload(id.toString(10)));
						urlObject.searchParams.append('token', this.auth.accessToken);
						img.src = urlObject.toString();
						img.addEventListener('error', function () {
							this.src = imgError;
							this.classList.add('img-load--failed');
						});
					} else {
						this._resourceGetter[host](id.toString(10)).subscribe({
							next: (src) => {
								img.src = src;
								img.classList.add('img-loaded--success');
							},
							error: () => {
								img.classList.add('img-load--failed');
								img.src = imgError;
							}
						});
					}
				}

			});
		}
	}

	buildIframeTags(url: string): HTMLDivElement {
		const div: HTMLDivElement = document.createElement('div');
		div.style.position = 'relative';
		div.style.display = 'none';
		// div.style [ 'padding-bottom' ] = '100%';
		div.style['height'] = '0';
		div.style['width'] = '100%';
		div.style.paddingBottom = '56.2493%';
		if (url.includes('youtube.com')) {
			const iFrame: HTMLIFrameElement = document.createElement('iframe');
			iFrame.src = 'https://www.youtube.com/embed/' + this.getYoutubeIdFromUrl(url);
			iFrame.style['position'] = 'absolute';
			iFrame.style['width'] = '100%';
			iFrame.style['height'] = '100%';
			iFrame.style['top'] = '0';
			iFrame.style['left'] = '0';
			iFrame.setAttribute('frameborder', '0');
			iFrame.setAttribute('allow', 'autoplay; encrypted-media');
			iFrame.setAttribute('allowfullscreen', '');
			div.append(iFrame);
			div.style.display = 'block';
		} else if (url.includes('vimeo.com')) {
			const _pathVideoId: string = url.split('/').pop() as string;
			const _strVideoId: string = _pathVideoId ? _pathVideoId.split('?').shift() as string : '';
			const _videoId: number = _strVideoId ? parseInt(_strVideoId, 10) : NaN;
			if (!Number.isNaN(_videoId)) {
				const iFrame: HTMLIFrameElement = document.createElement('iframe');
				iFrame.src = 'https://player.vimeo.com/video/' + _strVideoId;
				iFrame.style['position'] = 'absolute';
				iFrame.style['width'] = '100%';
				iFrame.style['height'] = '100%';
				iFrame.style['top'] = '0';
				iFrame.style['left'] = '0';
				iFrame.setAttribute('frameborder', '0');
				iFrame.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
				iFrame.setAttribute('allowfullscreen', '');
				div.append(iFrame);
				div.style.display = 'block';
			}
			// <iframe src="https://player.vimeo.com/video/858765708?h=c9f008bd6e" width="640" height="360" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>
		} else if (url.includes('dailymotion.com')) {
			const videoId: string = this.getDailyMotionId(url);
			if (videoId) {
				const iFrame: HTMLIFrameElement = document.createElement('iframe');
				iFrame.src = 'https://www.dailymotion.com/embed/video/x8nseh8' + videoId + '?autoplay=1';
				iFrame.style['position'] = 'absolute';
				iFrame.style['width'] = '100%';
				iFrame.style['height'] = '100%';
				iFrame.style['top'] = '0';
				iFrame.style['left'] = '0';
				iFrame.style['overflow'] = 'hidden';
				iFrame.style['left'] = '0';
				iFrame.setAttribute('frameborder', '0');
				iFrame.setAttribute('type', 'text/html');
				iFrame.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
				iFrame.setAttribute('allowfullscreen', '');
				iFrame.setAttribute('width', '100');
				iFrame.setAttribute('height', '100');
				div.append(iFrame);
				div.style.overflow = 'hidden';
				div.style.display = 'block';
			}
		}
		return div;
	}

	ngOnChanges(changes: SimpleChanges): void {
		this.loading();
	}

	getDailyMotionId(url: string): string {
		const m: RegExpMatchArray | null = url.match(/^.+dailymotion.com\/(video|hub)\/([^_]+)[^#]*(#video=([^_&]+))?/);
		if (m !== null) {
			if (m[4] !== undefined) {
				return m[4];
			}
			return m[2];
		}
		return '';
	}

	getYoutubeIdFromUrl(url: string): string {
		if (!url) {
			return '';
		}
		const regex = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
		return url.match(regex) ? RegExp.$2 : url;
	}

	tryLoadImageWithRetry(
		img: HTMLImageElement,
		id: string,
		token: string,
		imgError,
		imgLoading,
		maxRetry = 5,
		delay = 2000,
	) {
		let attempts = 0;

		const tryLoad = () => {
			const url = new URL(getLinkDownload_aws(id));

			url.searchParams.append('token', token);

			const testImg = new Image();

			testImg.onload = () => {
				img.src = url.toString();
				img.setAttribute('data-src', url.toString());
				img.classList.remove('img-load--failed');
			};

			testImg.onerror = () => {
				attempts++;
				if (attempts < maxRetry) {
					setTimeout(tryLoad, delay);
				} else {
					img.src = imgError;
					img.classList.add('img-load--failed');
				}
			};

			testImg.src = url.toString();
		};

		if (img.src !== imgLoading) {
			img.src = imgLoading;
		}

		tryLoad();
	}
}
