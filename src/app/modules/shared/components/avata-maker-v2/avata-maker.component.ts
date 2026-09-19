import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormGroup } from '@angular/forms';
import { ImageCroppedEvent } from 'ngx-image-cropper';
import { FileService } from '@core/services/file.service';
import { HelperService } from '@core/services/helper.service';
import { AuthService } from '@core/services/auth.service';
import { OvicFileStore, OvicFileSever } from '../../models/file-store';

@Component({
    selector: 'avata-maker',
    templateUrl: './avata-maker.component.html',
    styleUrls: ['./avata-maker.component.css']
})

export class AvataMakerComponent implements OnInit {
    formEdit: FormGroup;
    imageChangedEvent: any;
    croppedImage: any;
    imgName: any;
    imageBase64: string;
    imgArray: any;
    resultHeight: any;
    fileStore = [];
    public isError = false;
    public fileErrorText: string;

    @Input()
    public validType: 'jpeg | jpg | png';

    @Input()
    public fileSize;

    @Input()
    public aspectRatio = 1;

    constructor(
        public actr: ActivatedRoute,
        public activeModal: NgbActiveModal,
        private fileService: FileService,
        private helperService: HelperService,
        private authService: AuthService,
    ) {
    }

    ngOnInit() {

    }

    fileChangeEvent(event: any): void {
        this.hideError();
        this.imageChangedEvent = event;
        this.imgName = event.target.files[0].title;
    }

    onChangeFile() {
    }

    imageCropped(event: ImageCroppedEvent) {
        this.croppedImage = event.base64;
    }

    imageLoaded() {
        // show cropper
    }

    cropperReady() {
        // cropper ready
    }

    loadImageFailed() {
        // show message
        this.isError = true;
    }

    /**
     * isValidFile
     */
    public isValidFile(files): boolean {
        if (!files) {
            return true;
        }
        if (this.fileSize > 0) {
            let validMaxSizeTmp = 0;
            if (typeof this.fileSize === 'string') {
                validMaxSizeTmp = parseInt(this.fileSize, 2);
            } else {
                validMaxSizeTmp = this.fileSize;
            }
        }
        return true;
    }

    public hideError() {
        this.isError = false;
    }

    getImageAndUpload(file: any): Promise<any> {
        if (file) {
            return new Promise((resolve, reject) => {
                this.fileService.uploadFileAwsWidthProgress(file).subscribe({
                    next: (result) => {
                        if (result.state === 'DONE') {
                            resolve(result.content['data'][0]);
                        }
                    },
                    error: () => {
                        resolve(null);
                    }
                });

            });
        } else {
            return null;
        }
    }

    async sendBackData() {
        const newFile = this.helperService.convertFileFromBase64(this.croppedImage, ''.concat('cropped - ').concat(this.imgName));
        this.fileStore.push(newFile);
        const img_resutl = await this.getImageAndUpload(newFile);
        this.activeModal.close({
            //name      : this.imgName ,
            //content   : this.croppedImage ,
            form: img_resutl,
        });
        // this.fileService.uploadFileOfDonvi(this.fileStore,1).subscribe(res=>{
        //   if(res){
        //     console.log(res)
        //         this.activeModal.close( {
        //         name      : this.imgName ,
        //         content   : this.croppedImage ,
        //         extention : 'png' ,
        //         type      : 'image/png'
        //       } );
        //   }
        // })

    }

    async sendBackCurrentData() {
        this.activeModal.close({
            form: this.imgArray,
        });
    }

    /**
     * showError
     * param str
     */
    private showError(str: string) {
        this.isError = true;
        this.fileErrorText = str;
    }
}
