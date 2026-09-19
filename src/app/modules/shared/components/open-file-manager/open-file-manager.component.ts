import { Component, OnInit, Output, Input, ViewChild, ElementRef, EventEmitter, SimpleChanges, OnChanges } from '@angular/core';
import { OvicFileExplorerService } from '../../../shared/services/ovic-file-explorer.service';
import { OvicFileSever, OvicFileStore, OvicTree, OvicDriveFile, OvicFileUpload } from '@core/models/file';
import { AbstractControl } from '@angular/forms';
import { APP_CONFIGS, environment } from 'src/environments/environment';
import { FileService } from '@core/services/file.service';
@Component({
    selector: 'open-file-manager',
    templateUrl: './open-file-manager.component.html',
    styleUrls: ['./open-file-manager.component.css']
})
export class OpenFileManagerComponent implements OnInit, OnChanges {
    @Input() filesDefault: OvicFileStore[] = [];

    @Input() donvi_id: number;

    @Input() defaultDonwload = true;

    @Input() user_id: number;

    @Input() viewOnly = true;

    @Input() isMultipleMode = true;

    @Input() buttonLabel = 'Click vào đây để thêm files';

    @Input() formField: AbstractControl;

    @Input() oneResult = false;

    @Input() acceptFileType = null;

    @Input() customDrive: string;

    @Input() isCustom = false;

    @Input() driveFolder = environment.driveFolders.appData.children.lectureData.id;

    @Input() customName: string;

    @Input() customIdCourse: number;

    @Input() downloadShow = true;

    @Input() extList = ".pdf";

    @Input() source: string;

    @Input() isShare = false;

    @Output() onResult = new EventEmitter<OvicFileStore[]>();

    @Output() onReload = new EventEmitter<any>();



    fileChooser: OvicFileStore[] = [];

    download: boolean;

    driveCustom: string;

    reOpen = false;
    constructor(
        private ovicFileExplorerService: OvicFileExplorerService,
        private fileService: FileService,
    ) {

    }

    ngOnInit(): void {
        this.download = this.defaultDonwload;
        // this.acceptFileType = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        this.driveCustom = this.customDrive;
        if (this.filesDefault && this.filesDefault.length) {
            this.fileChooser = this.filesDefault;
            if (this.formField) {
                this.formField.setValue(this.fileChooser);
            }
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['filesDefault']) {
            this.fileChooser = this.filesDefault;
            if (this.formField) {
                this.formField.setValue(this.fileChooser);
            }
        }
        if (changes['defaultDonwload']) {
            this.download = this.defaultDonwload;
        }

        if (changes['customDrive']) {
            this.driveCustom = this.customDrive;
        }
    }

    async openFileManager() {
        try {
            const deleteCol = ['createdTime', 'imageMediaMetadata', 'modifiedTime', 'originalFilename', 'is_folder', 'upload_at', 'webContentLink', 'webViewLink', 'parents', 'spaces', 'fullFileExtension', 'capabilities', 'copyRequiresWriterPermission', 'explicitlyTrashed', 'lastModifyingUser', 'linkShareMetadata', 'modifiedByMe', 'modifiedByMeTime', 'ownedByMe', 'owners', 'permissionIds', 'permissions', 'thumbnailVersion', 'trashed', 'viewersCanCopyContent', 'writersCanShare', 'quotaBytesUsed', 'isAppAuthorized', 'iconLink', 'headRevisionId', 'starred', 'viewedByMe', 'hasThumbnail', 'kind', 'md5Checksum',];
            const result = await this.ovicFileExplorerService.openPersonalFileManager({ multipleMode: this.isMultipleMode, driveFolder: this.driveFolder, isCustom: this.isCustom, customDrive: this.driveCustom, customName: this.customName, customIdCourse: this.customIdCourse, extList: this.extList, acceptFileType: this.acceptFileType });
            const res = result['data'];
            this.driveCustom = result['playlist_id'];
            this.onReload.emit(result['playlist_id']);
            if (res && res.length) {
                const ids = [];
                const acceptList = {
                    'audio/mpeg': 'audio',
                    'image/jpeg': 'image',
                    'image/png': 'image',
                    'video/mp4': 'video',
                    'text/plain': 'text'
                };
                if (this.isMultipleMode) {
                    if (!this.fileChooser || !this.fileChooser.length) {
                        this.fileChooser = [];
                    }
                    res.forEach((f, key) => {
                        const index = this.fileChooser.findIndex(m => m.id === f.id);

                        if (!isNaN(f.id) || this.isCustom) {
                            f['type'] = f['ext'];
                            f['source'] = this.source ? this.source : 'serverFile';
                            f['path'] = f['id'];
                            f['fileName'] = f['title'];
                            f['preview'] = true;
                            f['download'] = true;
                        } else {
                            if (acceptList[f['mimeType']]) {
                                f['type'] = acceptList[f['mimeType']];
                            } else {
                                f['type'] = f['fileExtension'];
                            }
                            f['path'] = f['id'];
                            f['source'] = this.source ? this.source : 'googleDrive';
                            f['fileName'] = f['title'];
                            f['preview'] = true;
                            f['download'] = this.download;
                        }
                        
                        deleteCol.forEach(del => {
                            delete f[del];
                        })
                        
                        if (index === -1) {
                            ids.push(f.id);
                            this.fileChooser.push(f);
                        }
                    });
                } else {
                    if (!isNaN(res[0].id) || this.isCustom) {
                        res[0]['type'] = res[0]['ext'];
                        res[0]['source'] = this.source ? this.source : 'serverFile';
                        res[0]['path'] = res[0]['id'];
                        res[0]['fileName'] = res[0]['title'];
                        res[0]['preview'] = true;
                        res[0]['download'] = this.defaultDonwload;
                    } else {
                        if (acceptList[res['mimeType']]) {
                            res[0]['type'] = acceptList[res['mimeType']];
                        } else {
                            res[0]['type'] = res[0]['fileExtension'];
                        }
                        res[0]['path'] = res[0]['id'];
                        res[0]['source'] = this.source ? this.source : 'googleDrive';
                        res[0]['fileName'] = res[0]['title'];
                        res[0]['preview'] = true;
                        res[0]['download'] = this.download;
                    }
                    deleteCol.forEach(del => {
                        delete res[0][del];
                    })
                    
                    ids.push(res[0].id);
                    this.fileChooser = res;
                }

                if (this.oneResult) {
                    this.onResult.emit(this.fileChooser);
                } else {
                    if (this.formField) {
                        this.formField.setValue(this.fileChooser);
                    }
                }
            }

        } catch (e) {
            console.log(e);
        }
    }

    deleteFileChoosed(i: number) {
        if (this.fileChooser && this.fileChooser.length) {
            this.fileChooser.splice(i, 1);
            if (this.formField) {
                this.formField.setValue(this.fileChooser);
            }
        }
    }

    actionDownload(i: number) {
        this.fileChooser[i]['download'] = !this.fileChooser[i]['download'];
    }
}
