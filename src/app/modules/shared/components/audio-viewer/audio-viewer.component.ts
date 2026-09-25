import { Component, OnInit, Output, Input, ViewChild, ElementRef, EventEmitter, SimpleChanges, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileService } from '@core/services/file.service';
import { HelperService } from '@core/services/helper.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { DomSanitizer } from '@angular/platform-browser';
// import { TnBankQuestionService } from '../../../shared/services/tn-bank-question.service';
import {
    NORMAL_MODAL_OPTIONS,
    OvicVideoSourceObject,
    DEFAULT_MODAL_OPTIONS,
    VIDEO_SOURCE,
} from '@shared/utils/syscat';
import { getLinkDownload_aws, getLinkMedia_aws } from '@env';
import { AuthService } from '@core/services/auth.service';

@Component({standalone: true, 
    selector: 'audio-viewer',
    templateUrl: './audio-viewer.component.html',
    styleUrls: ['./audio-viewer.component.css'],
    imports: [CommonModule]
})
export class AudioViewerComponent implements OnInit, OnChanges {
    hasMedia = false;

    @Input() path: string | number;

    @Input() source: string;

    @Input() type: string;

    @Input() width: number;

    @Input() height: number;

    @Output() onSeeking = new EventEmitter<any>();

    @ViewChild('audioRef') audioRef!: ElementRef<HTMLAudioElement>;

    currentPath: string;

    src: any;

    VideoSource = OvicVideoSourceObject;

    currentTime: any;

    constructor(
        public fileService: FileService,
        private helperService: HelperService,
        private modalService: NgbModal,
        protected sanitizer: DomSanitizer,
        private auth: AuthService
        // private tnBankQuestionService : TnBankQuestionService ,
    ) {
    }

    ngOnInit(): void {
        if (this.type === 'audio') {
            this.loadAudioSrc();
        } else if (this.type === 'video') {
            this.loadVideoSrc();
        }

    }

    ngOnChanges(changes: SimpleChanges) {
        this.src = null;
        this.hasMedia = false;
        if (changes['path']) {
            if (this.type === 'audio') {
                this.loadAudioSrc();
            } else if (this.type === 'video') {
                this.loadVideoSrc();
            }
        }
    }

    loadAudioSrc() {
        if (this.source === this.VideoSource.googleDrive) {
            this.setSrc('https://docs.google.com/uc?export=download&id='.concat(this.path.toString()));
        } else if (this.source === this.VideoSource.local) {
            // this.tnBankQuestionService.getFileLocal ( this.path ).subscribe ( res => {
            // 	this.setSrc ( res );
            // } );
        } else if (this.source === this.VideoSource.serverFile) {
            this.fileService.getFileAsBlob(this.path.toString()).subscribe(res => {
                this.setSrc(res);
            });
        } else if (this.source === this.VideoSource.serverAws) {
            this.setSrc(getLinkDownload_aws(this.path.toString().concat('?token=', this.auth.accessToken)))
        }
    }

    loadVideoSrc() {
        if (this.source === this.VideoSource.googleDrive) {
            this.setVideoSrc('https://drive.google.com/file/d/'.concat(this.path.toString(), '/preview'));
        } else if (this.source === this.VideoSource.youtube) {
            this.setVideoSrc('https://www.youtube.com/embed/'.concat(this.path.toString()));
        } else if (this.source === this.VideoSource.vimeo) {
            this.setVideoSrc('https://player.vimeo.com/video/'.concat(this.path.toString()));
        } else if (this.source === this.VideoSource.local) {
            // this.tnBankQuestionService.getFileLocal ( this.path ).subscribe ( res => {
            // 	this.setVideoSrc ( res );
            // } );
        } else if (this.source === this.VideoSource.serverFile) {
            this.fileService.getFileAsBlob(this.path.toString()).subscribe(res => {
                this.setVideoSrc(res);
            });
        } else if (this.source === this.VideoSource.serverAws) {
            this.setSrc(getLinkDownload_aws(this.path.toString().concat('?token=', this.auth.accessToken)))
        }

    }

    setSrc(src: any) {
        this.src = this.sanitizer.bypassSecurityTrustUrl(src);
        this.hasMedia = true;
        if (this.audioRef) {
            this.audioRef.nativeElement.load();
        }
    }

    setVideoSrc(src: any) {
        this.src = this.sanitizer.bypassSecurityTrustResourceUrl(src);
        this.hasMedia = true;
    }

    seeking(event) {
        // console.log(event.currentTime);
        // console.log(this.currentTime);
        if (event) {
            this.onSeeking.emit(event.currentTime);
        }
    }
}
