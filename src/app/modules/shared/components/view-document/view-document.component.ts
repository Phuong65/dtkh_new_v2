import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { HelperService } from 'src/app/core/services/helper.service';
import { OvicDocument } from '../../../../core/models/file';
import { FileService } from '../../../../core/services/file.service';
import { environment, getLinkDownload_aws } from 'src/environments/environment';
import { file } from 'jszip';
import { NotificationService } from '@core/services/notification.service';
import { AuthService } from '@core/services/auth.service';
import { OvicFile } from '@core/models/file';
import { map, mergeMap } from 'rxjs';
import { getLinkMedia_aws } from 'src/environments/environment.prod';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { OFFICE_SUPORT_FILE, OvicVideoSourceObject, TYPE_FILE_LIST } from '@modules/shared/utils/syscat';

@Component({
    selector: 'view-document',
    templateUrl: './view-document.component.html',
    styleUrls: ['./view-document.component.css']
})
export class ViewDocumentComponent implements OnInit, OnChanges {

    @Input() file: OvicDocument | OvicFile;

    @Input() width: number;

    @Input() height: number;

    @Input() server: string = 'serverAws';

    hasMedia = false;

    currentPath: string;

    src: any;

    VideoSource = OvicVideoSourceObject;

    fileView: OvicDocument | OvicFile;

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

    loadFile(file: OvicDocument | OvicFile) {
        if (file) {
            if (!file['path']) {
                let type = '';
                Object.keys(TYPE_FILE_LIST).forEach(t => {
                    if (file.type) {
                        const index = file.type.indexOf(t);
                        if (index !== -1) {
                            type = TYPE_FILE_LIST[t];
                        }
                    }
                })
                file['type'] = type ? type.toLowerCase() : file['ext'].toLowerCase();
                file['path'] = file['id'];
            }
            this.fileView = file;
            this.download = false;
            this.src = null;
            switch (file['source']) {
                case 'serverAws':
                    setTimeout(() => {
                        this.getSrc(file);
                    }, 500)
                    break;
                default:
                    break;
            }

        }

    }

    getSrc(file: OvicDocument | OvicFile) {
        if (file) {
            if (OFFICE_SUPORT_FILE[file['type']]) {
                switch (file['type']) {
                    case 'video':
                        this.setSrc(getLinkDownload_aws(file.path.toString().concat('?token=', this.auth.accessToken)))
                        break;
                    case 'image':
                        this.setSrc(getLinkDownload_aws(file.path.toString().concat('?token=', this.auth.accessToken)))
                        break;
                    case 'audio':
                        this.setSrc(getLinkDownload_aws(file.path.toString().concat('?token=', this.auth.accessToken)))
                        break;
                    case 'pdf':
                        this.startProgress = true;
                        this.progressValue = 0;
                        this.fileService.AwsDownloadWithProgress(Number(file['path'])).subscribe({
                            next: (_file) => {
                                this.progressValue = _file.progress;
                                if (_file.state === 'DONE') {
                                    this.startProgress = false;
                                    this.src = this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(_file.content));
                                }
                            },
                        })
                        break;
                    default:
                        this.startProgress = true;
                        this.progressValue = 90;
                        this.fileService.getAwsPublicUrl(file['path'].toString()).subscribe({
                            next: (_res) => {
                                this.startProgress = false;
                                this.src = _res;
                            }
                        })
                        break;
                }
            } else {
                this.download = true;
                this.setSrc(getLinkDownload_aws(file.path.toString().concat('?token=', this.auth.accessToken)))
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
    // getDuration('/path/to/audio/file', function (duration) {
    //     console.log(duration);
    // });
}
