import { Component, OnInit, Output, Input, ViewChild, ElementRef, EventEmitter, SimpleChanges, OnChanges } from '@angular/core';
import { FileService } from '@core/services/file.service';
import { HelperService } from '@core/services/helper.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { DomSanitizer } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
// import { TnBankQuestionService } from '../../../shared/services/tn-bank-question.service';
import {
    NORMAL_MODAL_OPTIONS,
    OvicVideoSourceObject,
    DEFAULT_MODAL_OPTIONS,
    VIDEO_SOURCE,
    OFFICE_SUPORT_FILE,
} from '@shared/utils/syscat';
import { getLinkDownload_aws, getLinkMedia_aws } from '@env';
import { AuthService } from '@core/services/auth.service';
import { OvicDocument } from '@core/models/file';
import { NgxDocViewerComponent } from 'ngx-doc-viewer';
import { GeneralModule } from '@modules/kiem-thu-ngan-hang-cau-hoi/general/general.module';
import { Dialog } from 'primeng/dialog';
import { Image } from 'primeng/image';
import { OvicFileIconPipe } from '../../pipes/ovic-file-icon.pipe';

@Component({standalone: true, 
    selector: 'file-list-chat',
    templateUrl: './file-list-chat.component.html',
    styleUrls: ['./file-list-chat.component.css'],
    imports: [NgxDocViewerComponent, GeneralModule, Dialog, CommonModule, Image, OvicFileIconPipe]
})
export class FileListChatComponent implements OnInit, OnChanges {

    @Input() file: OvicDocument;

    @Input() width: number;

    @Input() height: number;

    hasMedia = false;

    currentPath: string;

    src: any;

    VideoSource = OvicVideoSourceObject;

    fileView: OvicDocument;

    display = false;

    src_view: any;

    startProgress = false;

    progressValue = 0;

    download = false;
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
        if (this.file) {
            this.file['open'] = false;
            this.fileView = this.file
        }

        this.loadFile(this.fileView);
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['file']) {
            this.fileView = this.file;
            this.loadFile(this.fileView);
        }
    }

    loadFile(file: OvicDocument) {
        if (file) {
            switch (file['source']) {
                case 'serverAws':
                    setTimeout(() => {
                        this.setSrc(getLinkDownload_aws(this.file.path.toString().concat('?token=', this.auth.accessToken)))
                    }, 500)
                    break;
                default:
                    break;
            }
        }

    }

    getSrc(file: OvicDocument) {
        if (file) {
            switch (file['type']) {
                case 'video':
                    this.setSrc(getLinkDownload_aws(this.file.path.toString().concat('?token=', this.auth.accessToken)))
                    break;
                case 'audio':
                    this.setSrc(getLinkDownload_aws(this.file.path.toString().concat('?token=', this.auth.accessToken)))
                    break;
                case 'image':
                    this.setSrc(getLinkDownload_aws(this.file.path.toString().concat('?token=', this.auth.accessToken)))
                    break;
                default:
                    break;
            }
        }
    }

    setSrc(src: any) {
        this.src = this.sanitizer.bypassSecurityTrustUrl(src);
        this.hasMedia = true;
    }

    setVideoSrc(src: any) {
        this.src = this.sanitizer.bypassSecurityTrustResourceUrl(src);
        this.hasMedia = true;
    }

    selectFile() {
        this.display = true;
        this.startProgress = true;
        this.download = false;
        this.src_view = null;
        if (this.fileView && !this.src_view) {
            if (OFFICE_SUPORT_FILE[this.fileView['type']]) {
                switch (this.fileView['type']) {
                    case 'pdf':
                        this.fileService.AwsDownloadWithProgress(Number(this.fileView['path'])).subscribe({
                            next: (_file) => {
                                this.progressValue = _file.progress;
                                if (_file.state === 'DONE') {
                                    this.startProgress = false;
                                    this.src_view = this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(_file.content));
                                }
                            },
                        })
                        break;
                    default:
                        this.progressValue = 90;
                        this.fileService.getAwsPublicUrl(this.fileView['path'].toString()).subscribe({
                            next: (_res) => {
                                this.startProgress = false;
                                this.src_view = _res;
                            }
                        })
                        break;
                }
            } else {
                this.startProgress = false;
                this.download = true;
                this.src_view = this.sanitizer.bypassSecurityTrustUrl(getLinkDownload_aws(this.file.path.toString().concat('?token=', this.auth.accessToken)));
            }
        } else {
            this.startProgress = false;
        }
    }


}
