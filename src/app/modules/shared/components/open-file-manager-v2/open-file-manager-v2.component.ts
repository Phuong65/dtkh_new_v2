import { AfterViewInit, Component, ElementRef, forwardRef, Input, OnChanges, OnInit, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import { AbstractControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { OvicDocument, OvicFile, OvicFileStore, OvicFileUpload } from '@core/models/file';
import { AuthService } from '@core/services/auth.service';
import { FileService } from '@core/services/file.service';
import { NotificationService } from '@core/services/notification.service';
import { APP_CONFIGS } from '../../../../../environments/environment';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FULL_SIZE_MODAL_OPTIONS, LARGE_MODAL_OPTIONS } from '@modules/shared/utils/syscat';
import { Paginator } from 'primeng/paginator';
import { MenuItem } from 'primeng/api';
import { OpenFileManagerService } from '@modules/shared/services/open-file-manager.service';


@Component({standalone: true, 
    selector: 'open-file-manager-v2',
    templateUrl: './open-file-manager-v2.component.html',
    styleUrls: ['./open-file-manager-v2.component.css'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => OpenFileManagerV2Component),
            multi: true
        }
    ]
})
export class OpenFileManagerV2Component implements OnInit {
    @Input() filesDefault: OvicFile[] = [];

    @Input() donvi_id: number;

    @Input() defaultDonwload = true;

    @Input() isMultipleMode = true;

    @Input() formField: AbstractControl;

    @Input() oneResult = false;

    @Input() acceptFileType = APP_CONFIGS.acceptList;

    @Input() buttonLabel = 'Chọn tệp tin';

    @Input() ext = '';

    @Input() tag = '';

    @Input() showDelete: boolean = true;

    @ViewChild('filesLessonReview') filesLessonReview: ElementRef;

    selectedFiles: OvicFile[] = [];

    acceptList: string;

    selectedFileReview: OvicFile;

    constructor(
        private noitifi: NotificationService,
        private fileService: FileService,
        private auth: AuthService,
        private modalService: NgbModal,
        private openFileManagerService: OpenFileManagerService
    ) { }

    ngOnInit(): void {
        if (this.filesDefault && this.filesDefault.length) {
            this.selectedFiles = this.filesDefault;
            if (this.formField) {
                this.formField.setValue(this.selectedFiles);
            }
        }
        if (this.acceptFileType) {
            this.acceptList = this.acceptFileType.toString();
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['filesDefault']) {
            if (this.filesDefault && this.filesDefault.length) {
                this.selectedFiles = this.filesDefault;
            } else {
                this.selectedFiles = [];
            }
        }

        if (changes['acceptFileType']) {
            this.acceptList = this.acceptFileType.toString();
        }
    }

    async openFileManager() {
        try {
            const result = await this.openFileManagerService.openFileManagerNew({ filesDefault: this.selectedFiles, isMultipleMode: this.isMultipleMode, acceptFileType: this.acceptFileType, ext: this.ext, tag: this.tag });
            console.log(this.formField);
            this.formField.setValue(result);
        } catch (e) {
            console.log(e);
        }
    }

    deleteFileChoosed(i: number) {
        if (this.selectedFiles && this.selectedFiles.length) {
            this.selectedFiles.splice(i, 1);
            
            if (this.formField) {
                this.formField.setValue(this.selectedFiles);
            }
        }
    }

    actionDownload(i: number) {
        this.selectedFiles[i]['download'] = !this.selectedFiles[i]['download'];
    }

    onSelectFileReview(file: OvicFile) {
        this.selectedFileReview = null;
        this.selectedFileReview = file;
        this.modalService.open(this.filesLessonReview, LARGE_MODAL_OPTIONS);
    }

}
