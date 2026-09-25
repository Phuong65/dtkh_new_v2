import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import { CommonModule } from '@angular/common';
import {AbstractControl} from "@angular/forms";
import {OvicFile} from "@core/models/file";
import {FileService} from "@core/services/file.service";
import {NotificationService} from "@core/services/notification.service";
import {AvatarMakerSetting, MediaService} from "@shared/services/media.service";
import {map} from "rxjs/operators";
import {RippleModule} from "primeng/ripple";
import {getLinkDownload_aws} from "@env";
import {SafeHtmlPipe} from "@shared/pipes/safe-html.pipe";
export const TYPE_FILE_IMAGE:string[] = ['image/png', 'image/gif','image/jpeg', 'image/bmp',' image/x-icon'];
@Component({
  selector: 'app-ovic-avatar-by-hethong',
  standalone: true,
    imports: [CommonModule, RippleModule, SafeHtmlPipe],
  templateUrl: './ovic-avatar-by-hethong.component.html',
  styleUrls: ['./ovic-avatar-by-hethong.component.css']
})
export class OvicAvatarByHethongComponent implements OnInit,OnChanges {
    @Input() site:boolean = false;
    @Input() public:number = 0;//1 :09
    @Input() disabled:boolean = false;
    @Input() formField: AbstractControl;
    @Input() multiple = true;
    @Input() accept = []; // only file extension eg. .jpg, .png, .jpeg, .gif, .pdf
    @Input() aspectRatio:number;// 3 / 2, 2 / 3
    @Input() textView:string='Upload file';
    @Input() height:string;//300px;
    @Input() file_size:number= null;//50kb
    @Input() file_name:string;
    @Input() footage:string ='horizontal';//horizontal :ngang,vertical:dài

    characterAvatar: string = '';
    fileList:OvicFile[]=[];
    _accept = '';
    @Input()rotateShow : boolean =false;
  constructor(
      private fileService: FileService,
      private notificationService: NotificationService,
      private mediaService: MediaService
  ) { }
    ngOnChanges(changes: SimpleChanges): void {
        if (changes['accept']) {
            if (this.accept && this.accept.length) {
                this._accept = this.accept.join(',');
            }
        }
    }
  ngOnInit(): void {
      if (this.formField) {
          this.formField.valueChanges.pipe(map(t => (t && Array.isArray(t)) ? t : [])).subscribe((files: OvicFile[]) => {
              this.fileList = files.filter(Boolean).map(file => {
                  file['link_img'] = file ? getLinkDownload_aws(file.id.toString()): '';
                  return file;
              });
              this.characterAvatar = this.fileList[0]? this.fileList[0]['link_img'] :'';

          });
          if (this.formField.value && Array.isArray(this.formField.value)) {
              this.fileList = this.formField.value.filter(Boolean).map(file => {
                  file['link_img'] = file ? getLinkDownload_aws(file.id.toString()): '';
                  return file;
              });
              this.characterAvatar = this.fileList[0]? this.fileList[0]['link_img'] :'';
          }

      }
      if (this.accept && this.accept.length) {
          this._accept = this.accept.join(',');
      }
  }

    async makeCharacterAvatar(file: File, characterName: string): Promise<File> {
        try {
            const options: AvatarMakerSetting = {
                aspectRatio: this.aspectRatio ? this.aspectRatio : 2 / 3,
                resizeToWidth: 1024,
                format: 'jpeg',
                cropperMinWidth: 10,
                dirRectImage: {
                    enable: true,
                    dataUrl: URL.createObjectURL(file)
                },
                // rotateShow:this.rotateShow
            };
            const avatar = await this.mediaService.callAvatarMakerV2(options);
            if (avatar && !avatar.error && avatar.data) {
                return Promise.resolve(this.fileService.base64ToFile(avatar.data.base64, file.name));
            } else {
                return Promise.resolve(null);
            }
        } catch (e) {
            this.notificationService.isProcessing(false);
            return Promise.resolve(null);
        }
    }

    typeFileAdd = TYPE_FILE_IMAGE;
    btnClickinput(){
        const inputFile: HTMLInputElement = Object.assign(document.createElement('input'), {
            type: 'file',
            accept: this._accept,
            multiple: false,
            onchange: () => {
                // this.onDroppedFiles(inputFile.files);
                this.onInputAvatar(event,inputFile,0)

                setTimeout(() => inputFile.remove(), 1000)
            }
        });
        inputFile.click();
    }


    async onInputAvatar(event, fileChooser: HTMLInputElement,index:number) {
        event.preventDefault();
        event.stopPropagation();

        if (fileChooser.files && fileChooser.files.length) {
            if (this.typeFileAdd.includes(fileChooser.files[0].type)){
                if(fileChooser.files[0].size >= 21*1024){
                    let fileUser:File  = await this.makeCharacterAvatar(fileChooser.files[0],fileChooser.files[0].name );
                    this.fileService.uploadFileAwsV2(fileUser, '',this.public).subscribe({
                        next: fileUl => {
                            if (this.fileList[index]){
                                this.fileList[index] = fileUl;
                                this.formField.setValue( fileUl ? this.fileList : null)
                            }else{
                                this.fileList = this.fileList.concat(fileUl);
                                this.formField.setValue(this.fileList)
                            }
                        }, error: () => {
                            this.notificationService.toastError('Upload file không thành công');
                        }
                    })

                }else{
                    this.notificationService.toastError('dung lượng file nhỏ, vui lòng tải file khác.');
                }


            }else{
                this.notificationService.toastWarning("Định dạng file không phù hợp");
            }
        }
    }

}
