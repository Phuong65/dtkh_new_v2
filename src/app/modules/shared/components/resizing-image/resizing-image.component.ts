import { Component, OnInit, Input, ViewChild, ElementRef, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { HelperService } from '@core/services/helper.service';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute } from '@angular/router';
import { AvataMakerComponent } from '../avata-maker-v2/avata-maker.component';
import { AbstractControl } from '@angular/forms';
import { DEFAULT_MODAL_OPTIONS } from '../../utils/syscat';
import { OvicFileManagerComponent } from '../ovic-file-manager/ovic-file-manager.component';
import { FileService } from '@core/services/file.service';
import { NORMAL_MODAL_OPTIONS } from '../../utils/syscat';
import { AuthService } from '@core/services/auth.service';
import { OpenFileManagerService } from '@modules/shared/services/open-file-manager.service';
import { APP_CONFIGS } from '@env';

@Component({standalone: true, 
    selector: 'resizing-image',
    templateUrl: './resizing-image.component.html',
    styleUrls: ['./resizing-image.component.css']
})
export class ResizingImageComponent implements OnInit, OnChanges {

    @Input()
    default: any;

    @ViewChild('fileAvatar')
    file: ElementRef;

    @Input()
    formField: AbstractControl;

    @Input() aspectRatio = 1;

    @Input()
    public disabled: boolean;
    public fileName: string;
    lastModifiedDate = new Date();
    htmlId: 'fileitem';
    avatar: any;
    donviId: number;
    user_id: number;
    // validate
    @Input()
    private validMaxSize = -1;

    constructor(
        public actr: ActivatedRoute,
        private modalService: NgbModal,
        private helperService: HelperService,
        //private fileStorage: OvicFileStore
        private fileService: FileService,
        private auth: AuthService,
        private openFileManagerService: OpenFileManagerService
    ) {
        this.donviId = this.auth.user.donvi_id;
        this.user_id = this.auth.user.id;
    }

    ngOnInit() {
        if (this.default) {
            this.showImage(this.default.id);
        }

    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['default']) {
            if (this.default) {
                this.showImage(this.default.id);
            }
        }
    }

    showImage(imgName) {
        this.fileService.awsGetFileAsBlob(imgName).subscribe({
            next: (blob) => {
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = (a) => {
                    this.avatar = reader.result;
                };

            },
            error: () => {

            }
        });
    }

    async openFileManager() {
        try {
            const result = await this.openFileManagerService.openFileManagerNew({ filesDefault: [], isMultipleMode: false, acceptFileType: APP_CONFIGS.acceptList, ext: 'png,jpg'});
            this.resultHandle(result);
        } catch (e) {
            console.log(e);
        }
    }

    resultHandle(result) {
        if (result.length) {
            const modalRef = this.modalService.open(AvataMakerComponent, DEFAULT_MODAL_OPTIONS);
            modalRef.componentInstance.fileSize = 300;
            modalRef.componentInstance.aspectRatio = this.aspectRatio;

            let action = this.fileService.awsGetFileAsBlob(result[0].id);
            // if ( isNaN( result[ 0 ][ 'id' ] ) ) {
            //     console.log(isNaN( result[ 0 ][ 'id' ]));
            //     action = this.fileService.gdStreamMedia(result[ 0 ].id);
            // }
            action.subscribe(
                res => {

                    const reader = new FileReader();
                    reader.readAsDataURL(res);
                    reader.onloadend = (a) => {
                        const data = reader.result;
                        if (data) {
                            modalRef.componentInstance.fileSize = 300;
                            modalRef.componentInstance.imageBase64 = data;
                            modalRef.componentInstance.imgName = result[0].title;
                            modalRef.componentInstance.imgArray = result[0];
                        }
                        modalRef.result.then((modal) => {
                            if (!modal) {
                                return;
                            }
                            this.formField.setValue(modal.form);
                            this.showImage(this.formField.value.id);
                        });
                    };
                });
        }
    }

}
