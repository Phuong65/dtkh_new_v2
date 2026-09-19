import { Injectable } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { OvicFileStore, OvicFileSever, OvicDriveFile, OvicFile } from '@core/models/file';
import { FULL_SIZE_MODAL_OPTIONS } from '../utils/syscat';
import { OvicFileExplorerComponent } from '../components/ovic-file-explorer/ovic-file-explorer.component';
import { FilesManagementNewComponent } from '../components/files-management-new/files-management-new.component';
import { environment, getRoute } from 'src/environments/environment';
import { NotificationService } from '@core/services/notification.service';

@Injectable({
    providedIn: 'root',
})
export class OpenFileManagerService {

    constructor(
        private modalService: NgbModal,
        private noitifi: NotificationService,
    ) { }

    openFileManager(multipleMode = true): Promise<OvicFileStore[]> {
        const panel = this.modalService.open(OvicFileExplorerComponent, FULL_SIZE_MODAL_OPTIONS);
        panel.componentInstance.multipleMode = multipleMode;
        return panel.result;
    }
    openFileManagerNew(settings?: { filesDefault?: OvicFile[], isMultipleMode?: boolean, acceptFileType?: string[], ext?: string, oneResult?: boolean, donvi_id?: boolean, tag?: string }): Promise<OvicFile[]> {

        const modalOption = {
            scrollable: true,
            size: 'xl',
            windowClass: 'modal-xxl ovic-modal-class ovic-modal-full-size ovic-modal-full-size--no-padding',
            centered: true
        };

        const panel = this.modalService.open(FilesManagementNewComponent, FULL_SIZE_MODAL_OPTIONS);
        panel.componentInstance.isMultipleMode = settings.isMultipleMode;
        panel.componentInstance.filesDefault = settings.filesDefault || [];
        panel.componentInstance.oneResult = settings.oneResult;
        panel.componentInstance.acceptFileType = settings.acceptFileType || [];
        panel.componentInstance.donvi_id = settings.donvi_id || [];
        panel.componentInstance.ext = settings.ext;
        panel.componentInstance.tag = settings.tag;
        return panel.result;
    }

}
