import {Component, Input, OnInit, SimpleChanges} from '@angular/core';
import { CommonModule } from '@angular/common';
import {OvicDocument, OvicFile} from "@core/models/file";
import {AbstractControl, FormsModule} from "@angular/forms";
import {APP_CONFIGS} from "@env";
import {NotificationService} from "@core/services/notification.service";
import {FileService} from "@core/services/file.service";
import {AuthService} from "@core/services/auth.service";
import {NgbModal, NgbTooltipModule} from "@ng-bootstrap/ng-bootstrap";
import {OpenFileManagerService} from "@shared/services/open-file-manager.service";
import {SharedModule} from "@shared/shared.module";
import {DragDropModule, moveItemInArray, transferArrayItem} from "@angular/cdk/drag-drop";

export interface FileDraDrop {
    ordering:number,
    title:string,
    file:OvicFile
}
@Component({
  selector: 'open-file-manager-dra-drop',
  standalone: true,
    imports: [CommonModule, SharedModule, NgbTooltipModule, FormsModule, DragDropModule],
  templateUrl: './open-file-manager-dra-drop.component.html',
  styleUrls: ['./open-file-manager-dra-drop.component.css']
})
export class OpenFileManagerDraDropComponent implements OnInit {

    @Input() filesDefault: FileDraDrop[] = [];

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

    selectedFiles: FileDraDrop[] = [];

    acceptList: string;

    constructor (
        private noitifi: NotificationService,
        private fileService: FileService,
        private auth: AuthService,
        private modalService: NgbModal,
        private openFileManagerService: OpenFileManagerService
    ) { }

    ngOnInit (): void {
        if ( this.filesDefault && this.filesDefault.length ) {
            this.selectedFiles = this.filesDefault;
            if ( this.formField ) {
                this.formField.setValue( this.selectedFiles );
            }
        }
        if ( this.acceptFileType ) {
            this.acceptList = this.acceptFileType.toString();
        }
    }

    ngOnChanges ( changes: SimpleChanges ) {
        if ( changes[ 'filesDefault' ] ) {
            if ( this.filesDefault && this.filesDefault.length ) {
                this.selectedFiles = this.filesDefault;
            } else {
                this.selectedFiles = [];
            }
        }

        if ( changes[ 'acceptFileType' ] ) {
            this.acceptList = this.acceptFileType.toString();
        }
    }

    async openFileManager () {
        try {
            const files: OvicFile[] = [].concat(...this.selectedFiles.map(m=>m.file));
            const result = await this.openFileManagerService.openFileManagerNew( { filesDefault:files, isMultipleMode: this.isMultipleMode, acceptFileType: this.acceptFileType, ext: this.ext, tag: this.tag } );
            this.selectedFiles = this.convertFileToResult(result,this.selectedFiles)
            this.formField.setValue( this.convertFileToResult(result,this.selectedFiles) );
        } catch ( e ) {
            console.log( e );
        }
    }

    deleteFileChoosed ( i:number ) {
        if ( this.selectedFiles && this.selectedFiles.length ) {
            this.selectedFiles.splice( i, 1 );
            this.selectedFiles = this.selectedFiles.map((m, index) => {
                m.ordering = index + 1;
                return m;
            });
            if ( this.formField ) {
                this.formField.setValue( this.selectedFiles.length > 0 ? this.selectedFiles : null  );
            }
        }
    }

    actionDownload ( i: number ) {
        this.selectedFiles[i].file['download'] = !this.selectedFiles[i].file['download'];
    }

    convertFileToResult(arr:OvicFile[], arrOld:FileDraDrop[]){
        if(arrOld && arrOld.length == 0){
            return arr.map((m,index)=>{
                return {
                    ordering:index + 1,
                    title : '',
                    file :m
                };
            })
        }else{

            const fileUserIds = arrOld.map(m=>m.file.id);

            const filesAdd = arr.filter(f=> !fileUserIds.includes(f.id) ) ? arr.filter(f=> !fileUserIds.includes(f.id) ).map((m,index)=>{
                return {
                    ordering:arrOld.length + 1 + index,
                    title : '',
                    file :m
                }
            }) : [];
            return [].concat(...arrOld,...filesAdd);
        }
    }

    isChangeOrdering :boolean =false;

    onDragStartParent(event){

        if (event.previousContainer === event.container) {
            let currentIndex = event.currentIndex === event.container.data.length - 1 ? event.currentIndex - 1 : event.currentIndex;
            moveItemInArray(event.container.data, event.previousIndex, currentIndex);
            this.isChangeOrdering = true;
        } else {
            let currentIndex = event.currentIndex === event.previousContainer.data.length ? event.currentIndex - 1 : event.currentIndex;
            transferArrayItem(
                event.previousContainer.data,
                event.container.data,
                event.previousIndex,
                currentIndex,
            );
        }
        this.selectedFiles.map((m,index)=>{
            m.ordering = index+ 1;
            return m;
        })
    }
}
