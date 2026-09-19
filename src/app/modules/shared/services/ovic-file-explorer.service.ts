import { Injectable } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { OvicFileStore, OvicFileSever, OvicDriveFile } from '@core/models/file';
import { FULL_SIZE_MODAL_OPTIONS } from '../utils/syscat';
import { OvicFileExplorerComponent } from '../components/ovic-file-explorer/ovic-file-explorer.component';
import { OvicPersonalFileExplorerComponent } from '../components/ovic-personal-file-explorer/ovic-personal-file-explorer.component';
import { environment, getRoute } from 'src/environments/environment';
import { NotificationService } from '@core/services/notification.service';

@Injectable({
    providedIn: 'root',
})
export class OvicFileExplorerService {

    constructor(
        private modalService: NgbModal,
        private noitifi: NotificationService,
    ) { }

    openFileManager(multipleMode = true): Promise<OvicFileStore[]> {
        const panel = this.modalService.open(OvicFileExplorerComponent, FULL_SIZE_MODAL_OPTIONS);
        panel.componentInstance.multipleMode = multipleMode;
        return panel.result;
    }

    openPersonalFileManager(settings?: { gridMode?: boolean, multipleMode?: boolean, storeLabel?: string[], acceptFileType?: string[], driveFolder?: string, customDrive?: string, isCustom?: boolean, customName?: string, returnDriveId?: any, customIdCourse?: number, extList?: string }): Promise<OvicFileStore[]> {

        const modalOption = {
            scrollable: true,
            size: 'xl',
            windowClass: 'modal-xxl ovic-modal-class ovic-modal-full-size ovic-modal-full-size--no-padding',
            centered: true
        };

        const panel = this.modalService.open(OvicPersonalFileExplorerComponent, modalOption);
        panel.componentInstance.multipleMode = settings.multipleMode;
        panel.componentInstance.gridMode = settings.gridMode || false;
        panel.componentInstance.storeLabel = settings.storeLabel || [];
        panel.componentInstance.acceptFileType = settings.acceptFileType || [];
        panel.componentInstance.driveFolder = settings.driveFolder || environment.driveFolders.appData.id;
        panel.componentInstance.customDrive = settings.customDrive;
        panel.componentInstance.isCustom = settings.isCustom;
        panel.componentInstance.customName = settings.customName;
        panel.componentInstance.customIdCourse = settings.customIdCourse;
        panel.componentInstance.extList = settings.extList;
        // this.noitifi.openSideNavigationMenu({ template: this.personalFileExplorerComponent.templateFileManager, size: window.innerWidth })
        // this.personalFileExplorerComponent.multipleMode = settings.multipleMode;
        // this.personalFileExplorerComponent.gridMode = settings.gridMode || false;
        // this.personalFileExplorerComponent.storeLabel = settings.storeLabel || [];
        // this.personalFileExplorerComponent.acceptFileType = settings.acceptFileType || [];
        // this.personalFileExplorerComponent.driveFolder = settings.driveFolder || environment.driveFolders.appData.id;
        // this.personalFileExplorerComponent.customDrive = settings.customDrive;
        // this.personalFileExplorerComponent.isCustom = settings.isCustom;
        // this.personalFileExplorerComponent.customName = settings.customName;
        // this.personalFileExplorerComponent.customIdCourse = settings.customIdCourse;
        // this.personalFileExplorerComponent.extList = settings.extList;
        return panel.result;
    }

}
