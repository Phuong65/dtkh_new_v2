import { Component, Input, OnInit } from '@angular/core';
import { OvicFile } from "@core/models/file";
import { FileType, TYPE_FILE_LIST } from "@shared/utils/syscat";
import { NotificationService } from "@core/services/notification.service";
import { MediaService } from "@shared/services/media.service";
import { DownloadProcess } from "@shared/components/ovic-download-progress/ovic-download-progress.component";
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { SharedModule } from '@modules/shared/shared.module';
import {ButtonModule} from "primeng/button";
import {RippleModule} from "primeng/ripple";
import {TooltipModule} from "primeng/tooltip";

@Component({
    standalone: true,
    imports: [CommonModule, DialogModule, SharedModule, ButtonModule, RippleModule, TooltipModule],
    selector: 'app-hoi-dap-files',
    templateUrl: './hoi-dap-files.component.html',
    styleUrls: ['./hoi-dap-files.component.css']
})
export class HoiDapFilesComponent implements OnInit {

    @Input() set filesDefault(file: OvicFile[]) {
        this._fileParam = file.map(m => {
            m['file_size'] = this.formatBytes(m.size, 2);
            m['path'] = m.id;
            m['source'] = 'serverAws';
            const mapType = this.coventTypefile(m);
            console.log(mapType)
            m['type'] = mapType !== 'img' ? mapType : 'image';
            m['_icon'] = this.fileIcons.has(mapType) ? this.fileIcons.get(mapType) : 'ovic-file-icon fa fa-file-code-o';
            return m;
        });
        console.log(this._fileParam);
    }

    @Input() showDelete: boolean = false;

    _fileParam: OvicFile[];
    fileOpen: boolean = false;
    fileSelect: OvicFile;
    ngFileSelect: 1 | 0 | 2 = 0; // 0: Loadding, 1 : view , 2 dowload
    fileType = FileType;
    fileIcons = new Map([
        ['folder', 'ovic-file-icon fa fa-folder'],
        ['mpeg', 'ovic-file-icon fa fa-file-audio-o'],
        ['mp3', 'ovic-file-icon fa fa-file-audio-o'],
        ['x-aac', 'ovic-file-icon fa fa-file-audio-o'],
        ['zip', 'ovic-file-icon fa fa-file-archive-o'],
        ['rar', 'ovic-file-icon fa fa-file-archive-o'],
        ['docx', 'ovic-file-icon fa fa-file-word-o'],
        ['doc', 'ovic-file-icon fa fa-file-word-o'],
        ['pptx', 'ovic-file-icon fa fa-file-powerpoint-o'],
        ['ppt', 'ovic-file-icon fa fa-file-powerpoint-o'],
        ['xlsx', 'ovic-file-icon fa fa-file-excel-o'],
        ['xls', 'ovic-file-icon fa fa-file-excel-o'],
        ['pdf', 'ovic-file-icon fa fa-file-pdf-o'],
        ['video', 'ovic-file-icon fa fa-file-video-o'],
        ['mp4', 'ovic-file-icon fa fa-file-video-o'],
        ['img', 'ovic-file-icon fa fa-file-image-o'],
        ['text', 'ovic-file-icon fa fa-file-text-o'],
        ['default', 'ovic-file-icon fa fa-file-code-o'],
        ['pdf', 'ovic-file-icon fa fa-file-pdf-o'],
        ['audio', 'ovic-file-icon fa fa-file-audio-o'],
    ]);
    constructor(
        private notifi: NotificationService,
        // private fileService:FileService,
        private mediaService: MediaService,
    ) {
    }

    ngOnInit(): void {
    }

    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) {
            return '0 Bytes';
        }

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    selectFile(file: OvicFile) {
        this.fileSelect = { ...file };
        this.fileOpen = true;

    }


    btnExit() {
        this.fileOpen = false;

    }

    coventTypefile(file: OvicFile | File): string {
        let type = file['_ext'] || null;
        console.log(type);
        if (type === null) {
            let fileType = null;
            if (file.hasOwnProperty('mimeType')) {
                fileType = file['mimeType'];
            } else if (file.hasOwnProperty('type')) {
                fileType = file['type'];
            } else if (typeof file === 'string') {
                fileType = file;
            }
            // if (fileType === '') {
            //     this.fileIcons.get('folder');
            // }
            type = this.fileType.has(fileType) ? this.fileType.get(fileType) : fileType;
        }
        console.log(type);

        return type;
    }

    async dowloadFile(fileselect: OvicFile) {
        // const fileUrl = getLinkMedia_aws(file.id.toString());
        const file = fileselect;
        file['type'] = fileselect.type;
        file['source'] = fileselect.source;
        file['path'] = fileselect.path;
        file['fileName'] = fileselect.title;
        file['preview'] = true;
        file['download'] = true;

        const result = await this.mediaService.AwstplDownloadFile(file);

        switch (result) {
            case DownloadProcess.rejected:
                this.notifi.toastInfo('Chưa hỗ trợ tải xuống thư mục');
                break;
            case DownloadProcess.error:
                this.notifi.toastError('Tải xuống thất bại');
                break;
        }
    }

}
