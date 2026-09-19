import { Injectable } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { OvicFileStore, OvicFileSever, OvicDriveFile, OvicFile } from '@core/models/file';
import { FULL_SIZE_MODAL_OPTIONS, LARGE_MODAL_OPTIONS } from '../utils/syscat';
import { OvicFileExplorerComponent } from '../components/ovic-file-explorer/ovic-file-explorer.component';
import { LatexHandleComponent } from '../components/latex-handle/latex-handle.component';
import { environment, getRoute } from 'src/environments/environment';
import { NotificationService } from '@core/services/notification.service';
import { NORMAL_MODAL_OPTIONS } from '@core/utils/syscat';

@Injectable({
    providedIn: 'root',
})
export class LatexHandleService {

    constructor(
        private modalService: NgbModal,
        private noitifi: NotificationService,
    ) { }

    openLatex(): Promise<any> {
        const modalOption = {
            scrollable: true,
            size: 'xl',
            windowClass: 'modal-xxl ovic-modal-class modal-latex',
            centered: true
        };

        const panel = this.modalService.open(LatexHandleComponent, modalOption);
        return panel.result;
    }
}
