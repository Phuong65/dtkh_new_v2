import { AfterViewInit, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { OvicMedia, OvicMediaSources, OvicMediaSourceTypes } from '@core/models/file';
import { APP_CONFIGS } from 'src/environments/environment';
import * as Plyr from 'plyr';
import { interval, of, Subject, Subscription } from 'rxjs';
import { PlyrComponent } from 'ngx-plyr';
import { ClassStudentTracking } from '../../../shared/models/class-student-tracking';
import { debounceTime, map, mergeMap } from 'rxjs/operators';
import { LessonVideoLogEvent, VideoBaiHoc } from '../../../shared/models/elng-bai-hoc';
import { PlaylistYoutubeService } from '../../services/playlist-youtube.service';
import { FileService } from '@core/services/file.service';
import { waitForAsync as async } from '@angular/core/testing';
import { OvicPlyrDirective } from '@modules/shared/directives/ovic-plyr.directive';
import { ProgressBar } from 'primeng/progressbar';

// export interface OvicVideosEventLog {
//     tracking? : ClassStudentsTracking;
//     duration : number;
//     time_play_video : number;
//     completed : number;
//     currentPoint : number; // thời gian tại vị trí lấy mẫu
//     time : number;
// }
export interface OvicVideosEventLog {
    tracking?: ClassStudentTracking;
    log: LessonVideoLogEvent;
}

@Component({standalone: true, 
    selector: 'ovic-video-player-new',
    templateUrl: './ovic-video-player-new.component.html',
    styleUrls: ['./ovic-video-player-new.component.css'],
    imports: [OvicPlyrDirective, ProgressBar]
})
export class OvicVideoPlayerNewComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {

    @Input() data: OvicMedia | VideoBaiHoc; /* local | serverFile | googleDrive */

    @Input() tracking: ClassStudentTracking;

    @Input() initTime = 0;

    @Input() reportAfter: number; // unit seconds

    @Input() can_jump_forward = true; // user can fast_forward

    @Output() reportWatchedTime = new EventEmitter<OvicVideosEventLog>();

    ready: boolean;

    _tracking: ClassStudentTracking;

    player: Plyr;

    videoSources: Plyr.Source[];

    options: Plyr.Options;

    counter: Subscription;

    private __time_counter = 0;

    _videoDuration: number;

    private _awakeTime: number;

    @ViewChild(PlyrComponent) plyr: PlyrComponent;

    isPlaying: boolean;
    progressValue = 0;

    settimeout: any;
    _source: string;
    public_src: string;
    constructor(
        private playlistYoutubeService: PlaylistYoutubeService,
        private fileService: FileService
    ) {
        this.ready = false;
    }

    ngOnInit(): void {
        // this.initVideo();
        this._awakeTime = this.reportAfter || APP_CONFIGS.pingTime;
    }

    ngAfterViewInit(): void {
        return;
        this.plyr.plyrReady.subscribe(res => this._videoDuration = res.detail.plyr.duration);
        this.plyr.plyrSeeking.pipe(debounceTime(100)).subscribe(res => {
            const player = res.detail.plyr;
            if (!this.can_jump_forward && player.currentTime > this._tracking.max_stopped_time) {
                player.currentTime = this._tracking.max_stopped_time - 1;
                if (player.playing) {
                    player.play();
                }
            }
        });
    }

    ngOnChanges(changes: SimpleChanges) {
        const currentTime = this.plyr && this.isPlaying ? Math.round(this.plyr.player.currentTime) : 0;
        if (currentTime) {
            this.report(Math.round(currentTime));
        }
        if (changes['data']) {
            this.initVideo();
        }
    }

    ngOnDestroy(): void {
        const currentTime = this.plyr && this.isPlaying ? Math.round(this.plyr.player.currentTime) : 0;
        if (currentTime) {
            this.report(Math.round(currentTime));
        }

        if (this.counter) {
            this.counter.unsubscribe();
        }
    }

    initVideo() {
        // const settings = [ 'captions' , 'quality' , 'speed' , 'loop' ];
        clearInterval(this.settimeout);
        this.progressValue = 0;
        const settings = this.can_jump_forward ? ['quality', 'speed', 'loop'] : ['quality'];
        this.options = {
            disableContextMenu: true,
            invertTime: false,
            youtube: {
                start: 0,
                fs: 1,
                playsinline: 1,
                modestbranding: 1,
                disablekb: 0,
                controls: 0,
                rel: 0,
                showinfo: 0
            },
            settings
        };
        if (this.tracking) {
            try {
                this._tracking = JSON.parse(JSON.stringify(this.tracking));
                if (this._tracking) {
                    this.options.youtube['start'] = this._tracking.last_stopped;
                }
            } catch {

            }
        }
        this.ready = true;
        if (this.data) {
            this.validateDatasource(this.data);
        }


    }

    async validateDatasource(media: OvicMedia | VideoBaiHoc) {
        this._source = media.source;
        this.public_src = media.path;
        let source: Plyr.Source = null;

        if (media) {
            if (isNaN(Number(media.path))) {
                if (media.source === OvicMediaSourceTypes.encrypted && media['public']) {
                    this._source = OvicMediaSourceTypes.youtube;
                    this.public_src = media && media['public'] ? media['public'] : null;
                }
                if (media.source === OvicMediaSourceTypes.serverFile) {
                    this._source = OvicMediaSourceTypes.googleDrive;
                }
            }

            if (media.path && media.source) {
                switch (this._source) {
                    case OvicMediaSources.vimeo:
                        source = { provider: 'vimeo', src: media.path };
                        break;
                    case OvicMediaSources.youtube:
                        source = { provider: 'youtube', src: this.public_src };
                        break;
                    case OvicMediaSources.local:
                        source = { provider: 'html5', src: media.path };
                        break;
                    case OvicMediaSources.encrypted:
                        source = await this.getVideoUpload(media);
                        break;
                    case OvicMediaSources.serverFile:
                        source = await this.getVideoGoogleDrive(media);
                        break;
                    default:
                        source = null;
                        break;
                }
            }

            if (source) {
                this.progressValue = 100;
                this.videoSources = [source];
            }
        }
    }

    getRandomInt(max) {
        return Math.floor(Math.random() * max);
    }

    getVideoUpload(video): Promise<any> {
        if (video) {
            return new Promise((resolve, reject) => {
                const fileUploadRes = this.playlistYoutubeService.getVideoId(video.id)
                fileUploadRes.subscribe((_resVideo: any) => {
                    const index = _resVideo.findIndex(m => m['qualityLabel'] === "720p" && m['mimeType'].indexOf("video/mp4") !== -1);
                    let source = null;
                    if (index !== -1) {
                        source = { src: _resVideo[index]['url'], provider: "html5" };
                    }
                    resolve(source);
                });
            });
        }
        return null;
    }

    getVideoGoogleDrive(video): Promise<any> {
        if (video) {
            return new Promise((resolve, reject) => {
                const fileUploadRes = this.fileService.gdDownloadWithProgress(video.id.toString())
                fileUploadRes.subscribe((_resVideo: any) => {
                    if (_resVideo.state === "DONE") {
                        const src = URL.createObjectURL(_resVideo.content);
                        const source = { src: src, provider: "html5" };
                        resolve(source);
                    }
                });
            });
        }

        return null;
    }


    videoWaiting(event: Plyr.PlyrEvent) {
        if (this.counter) {
            this.counter.unsubscribe();
        }
    }

    videoPlying(event: Plyr.PlyrEvent) {
        const currentTime = event.detail.plyr.currentTime;
        this.counter = interval(1000).subscribe(() => this.calculateTime(currentTime));
        this.isPlaying = true;
    }

    videoPaused(event: Plyr.PlyrEvent) {
        if (this.counter) {
            this.counter.unsubscribe();
        }
        this.report(event.detail.plyr.currentTime);
        this.isPlaying = false;
    }

    calculateTime(currentPoint: number) {
        if (isNaN(this.initTime)) {
            this.initTime = 0;
        }
        this.initTime++;
        if (++this.__time_counter >= this._awakeTime) {
            this.report(currentPoint);
        }
    }

    report(last_stopped: number) {
        // this.__time_counter = 0;
        // const max_stopped_time = Math.max(this._tracking.max_stopped_time, last_stopped);
        // this._tracking.max_stopped_time = max_stopped_time;
        // const time_play_video = this._tracking.time_play_video + this.initTime;
        // const video_duration = this._videoDuration;
        // const tracking = this._tracking;
        // // const time                      = this.initTime;
        // const completed = !!(video_duration && max_stopped_time && (((time_play_video / video_duration) * 100) > 90 && ((max_stopped_time / video_duration) * 100) > 90));
        // const log = { video_duration, time_play_video, completed, max_stopped_time, last_stopped };
        // this.reportWatchedTime.emit({ tracking, log });
    }
}
