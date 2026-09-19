import { NotificationService } from '@core/services/notification.service';
import { HelperService } from '@core/services/helper.service';
import { Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { OvicFile } from '@core/models/file';
import { APP_CONFIGS } from '@env';
import { OpenFileManagerService } from '@modules/shared/services/open-file-manager.service';
import { LARGE_MODAL_OPTIONS } from '@modules/shared/utils/syscat';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AbstractControl } from '@angular/forms';


export interface DocumentFileAndLink {
    ordering: number;
    type: 'link' | 'file';
    title: string;
    link?: string;
    file?: OvicFile;
}

@Component({
    selector: 'form-document-file-and-link',
    templateUrl: './form-document-file-and-link.component.html',
    styleUrls: ['./form-document-file-and-link.component.css']
})
export class FormDocumentFileAndLinkComponent implements OnInit, OnChanges {

    @Input() docDefault: DocumentFileAndLink[];

    @Input() formField: AbstractControl;

    @Input() acceptFileType = APP_CONFIGS.acceptList;

    @Input() ext = '';

    @Input() tag = '';

    @ViewChild('viewDocumentTempalte') viewDocumentTempalte: ElementRef<any>;

    list_document: DocumentFileAndLink[] = [];

    selectedFiles: OvicFile[];

    isMultipleMode: boolean = true;

    documentTypeLink: DocumentFileAndLink = {
        title: null,
        link: null,
        ordering: null,
        type: 'link',
    }

    fileView: OvicFile;

    constructor(
        private openFileManagerService: OpenFileManagerService,
        private helperService: HelperService,
        private modalService: NgbModal,
        private notificationService: NotificationService
    ) { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['docDefault']) {
            if (this.docDefault) {
                this.list_document = this.docDefault;
                this.selectedFiles = this.list_document.filter(i => i.type === 'file').map(m => m.file);
            }
        }
    }

    ngOnInit(): void {

    }

    async openFileManager() {
        try {
            const result = await this.openFileManagerService.openFileManagerNew({ filesDefault: this.selectedFiles, isMultipleMode: this.isMultipleMode, acceptFileType: this.acceptFileType, ext: this.ext, tag: this.tag });

            const data: DocumentFileAndLink[] = [];

            let i = this.list_document.length;

            result.forEach(f => {
                const index = this.list_document.findIndex(m => m.type === 'file' && f.id === m.file.id);
                if (index === -1) {
                    i = i + 1;
                    data.push({
                        ordering: i,
                        type: 'file',
                        title: f.title,
                        file: f
                    })
                }
            })

            this.list_document = this.helperService.sort(this.list_document.concat(data), 'ordering');

            this.selectedFiles = this.list_document.filter(i => i.type === 'file').map(m => m.file);

            if (this.formField)
                this.formField.setValue(this.list_document);
        } catch (e) {
            console.log(e);
        }
    }

    deleteFileChoosed(i: number) {
        if (this.list_document && this.list_document.length) {
            this.list_document.splice(i, 1);
            this.selectedFiles = this.list_document.filter(i => i.type === 'file').map(m => m.file);
            if (this.formField)
                this.formField.setValue(this.list_document);
        }
    }

    openFormAdd(op, event) {
        this.documentTypeLink = {
            title: null,
            link: null,
            ordering: null,
            type: 'link',
        }
        op.toggle(event)
    }

    openEditForm(op, event, document: DocumentFileAndLink) {
        this.documentTypeLink = document;
        op.toggle(event)
    }

    addLinkToList() {
        if (this.documentTypeLink.title) {
            this.documentTypeLink.ordering = this.list_document.length + 1;
            this.list_document.push(this.documentTypeLink);
            this.documentTypeLink = {
                title: null,
                link: null,
                ordering: null,
                type: 'link',
            }
            if (this.formField)
                this.formField.setValue(this.list_document);
        } else {
            this.notificationService.toastWarning("Vui lòng nhập title");
        }
    }

    openViewFile(item: OvicFile) {
        this.fileView = item;
        this.modalService.open(this.viewDocumentTempalte, LARGE_MODAL_OPTIONS);
    }

    actionDownload(i: number) {
        this.list_document[i].file['download'] = !this.list_document[i].file['download'];
    }
}
