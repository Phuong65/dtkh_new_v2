import { request } from 'http';
import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FileDto, OvicDocument, OvicFile, OvicFileStore, OvicFileUpload } from '@core/models/file';
import { AuthService } from '@core/services/auth.service';
import { FileService } from '@core/services/file.service';
import { NotificationService } from '@core/services/notification.service';
import { APP_CONFIGS, getLinkDownload_aws } from '../../../../../environments/environment';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FULL_SIZE_MODAL_OPTIONS, LARGE_MODAL_OPTIONS, TYPE_FILE_LIST } from '@modules/shared/utils/syscat';
import { Paginator } from 'primeng/paginator';
import { ContextMenuService, MenuItem } from 'primeng/api';
import { MediaService } from '@modules/shared/services/media.service';
import { DownloadProcess } from '../ovic-download-progress/ovic-download-progress.component';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { OvicQueryCondition } from '@core/models/dto';
import { Observable, forkJoin } from 'rxjs';
import { MediaFolderService } from '../../services/media-folder.service';
import { NORMAL_MODAL_OPTIONS } from '@core/utils/syscat';
import { MediaFolder } from '@modules/shared/models/media-folder';
import { HelperService } from '@core/services/helper.service';
import { TREE } from '../tree-custom/tree-custom.component';
import { OverlayPanel } from 'primeng/overlaypanel';
import { MatSelectionListChange } from '@angular/material/list';
import { BUTTON_CANCEL, BUTTON_CLOSED, BUTTON_NO, BUTTON_YES } from '@core/models/buttons';
import { ConfirmationService } from 'primeng/api';
import * as FileSaver from 'file-saver';
@Component({
    selector: 'files-management-new',
    templateUrl: './files-management-new.component.html',
    styleUrls: ['./files-management-new.component.css'],
    providers: [ContextMenuService, ConfirmationService]

})
export class FilesManagementNewComponent implements OnInit, OnChanges, AfterViewInit {
    @Input() filesDefault: OvicFile[] = [];

    @Input() donvi_id: number;

    @Input() defaultDonwload = true;

    @Input() isMultipleMode = true;

    @Input() oneResult = false;

    @Input() acceptFileType = APP_CONFIGS.acceptList;

    @Input() ext: string = '';

    @Input() tag: string = '';

    @Input() no_footer = false;

    @Input() global = false;

    file_list: OvicFile[] = [];

    total_file: number;

    selectedFiles: OvicFile[] | OvicDocument[] = [];

    selectedFile: OvicFile;

    _f_id = 100;

    maxFileSize = APP_CONFIGS.maxUploadSize;

    uploadedFiles = [];

    errorMaxFileUploading = true;

    acceptList: string;

    uploadingFiles: OvicFileUpload[] = [];

    maxUploadingFiles = APP_CONFIGS.maxFileUploading;

    displayPosition = false;

    display_fileManagement = false;

    minimize = false;

    contextMenuItems: MenuItem[];

    contextMenuRestoreItems: MenuItem[];

    contextMenuFolderItems: MenuItem[];

    firstPage = 0;

    formFolder: FormGroup;

    fileChooser: File | null = null;

    @ViewChild('userMenu') userMenu: TemplateRef<any>;

    @ViewChild('fileChooser') inputFileChooser: ElementRef<HTMLInputElement>;

    @ViewChild('templateFileManager') templateFileManager: ElementRef<any>;

    @ViewChild('paginator') paginator: Paginator;

    @ViewChild('paginatorTemplate') paginatorTemplate: Paginator;

    @ViewChild('viewDocumentTempalte') viewDocumentTempalte: ElementRef<any>;

    @ViewChild('createFolderTemplate') createFolderTemplate: ElementRef<any>;

    @ViewChild('formMoveFolder') formMoveFolder: TemplateRef<any>;

    @ViewChild('changeFileNameTemplate') changeFileNameTemplate: ElementRef<any>;

    startProgress = false;

    server = 'serverAws';

    filterName: string = '';

    select_tag: any;

    list_tag: any[] = [];

    slugIsValid = true;

    selectedFolder: TREE;

    isUpdate = false;

    treeFolder: TREE[];

    folder_show_move: MediaFolder;

    list_folder_show_move: MediaFolder[];

    searchFolder: string;

    selected_folder: MediaFolder;

    display_move_template = false;

    moveFolder = false;

    sortObject = { order: null, orderby: null };

    ext_convert = '';

    constructor(
        private noitifi: NotificationService,
        private fileService: FileService,
        private auth: AuthService,
        private modalService: NgbModal,
        private activeModal: NgbActiveModal,
        private mediaService: MediaService,
        private mediaFolderService: MediaFolderService,
        public formBuilder: FormBuilder,
        private helperService: HelperService,
        private confirmationService: ConfirmationService
    ) {
        this.formFolder = this.formBuilder.group(
            {
                name: ['', Validators.required],
                slug: [''],
                parent_id: ['']
            }
        );
    }

    ngAfterViewInit(): void {
        if (this.filesDefault && this.filesDefault.length) {

            this.selectedFiles = this.filesDefault;
        }
    }

    ngOnInit(): void {

        if (this.filesDefault && this.filesDefault.length) {
            this.selectedFiles = this.filesDefault;
        }

        if (this.acceptFileType) {
            this.acceptList = this.acceptFileType.toString();
        }


        this.contextMenuItems = [
            { label: 'Xem', icon: 'pi pi-fw pi-search', command: () => { this.openViewFile() } },
            { label: 'Đổi tên', icon: 'pi pi-fw pi-pencil', command: () => { this.renameFile() } },
            { label: 'Di chuyển', icon: 'pi pi-fw pi-arrows-alt', command: () => { this.moveFolder = false; this.openMoveFolder() } },
            { label: 'Tải xuống', icon: 'pi pi-fw pi-download', command: () => { this.downloadFile() } },
            { label: 'Copy code', icon: 'pi pi-fw pi-copy', command: () => { this.handleCopyAudioCode() } },
            { label: 'Xóa', icon: 'pi pi-fw pi-trash', command: () => this.deleteFile() }
        ];

        this.contextMenuRestoreItems = [
            { label: 'Khôi phục', icon: 'pi pi-fw pi-undo', command: () => { this.restoreFile() } },
        ]

        this.contextMenuFolderItems = [
            { label: 'Đổi tên', icon: 'pi pi-fw pi-pencil', command: (e) => { this.changeNameFolder() } },
            { label: 'Di chuyển', icon: 'pi pi-fw pi-arrows-alt', command: () => { this.moveFolder = true; this.openMoveFolder() } },
            { label: 'Xóa', icon: 'pi pi-fw pi-trash', command: () => { this.deleteFolder() } }
        ];

        this.list_tag = [{ label: 'Tất cả', value: 0 }];

        if (this.ext) {
            this.ext_convert = '.'.concat(this.ext).replace(/\,/gi, ',.');
        }

        this.onLoadFolder();
        // this.loadFileList(1);

    }

    get f() {
        return this.formFolder.controls;
    }


    ngOnChanges(changes: SimpleChanges) {
        if (changes['filesDefault']) {
            this.selectedFiles = this.filesDefault;
        }

        if (changes['acceptFileType']) {
            this.acceptList = this.acceptFileType.toString();
        }

        if (changes['ext']) {
            if (this.ext) {
                this.ext_convert = '.'.concat(this.ext).replace(/\,/gi, ',.');
            }
        }
    }

    openFileManager() {
        this.modalService.open(this.templateFileManager, FULL_SIZE_MODAL_OPTIONS);
    }

    onLoadFolder() {
        const condition: ConditionOption = {
            condition: [
                { conditionName: 'created_by', condition: OvicQueryCondition.equal, value: this.auth.user.id.toString(), orWhere: 'and' },
                { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: '0', orWhere: 'and' },
            ],
            set: [{ label: "limit", value: "-1" }],
            page: null
        }

        this.mediaFolderService.getMediaFolderByPageNew(condition).subscribe({
            next: (_resFolder) => {
                const tmp = [];
                _resFolder.data.forEach(f => {
                    const folder_: TREE = {
                        collapsedIcon: 'fa fa-folder icon-folder-media',
                        data: '',
                        expandedIcon: 'fa fa-folder-open icon-folder-media',
                        id: f.id,
                        key: f.id.toString(),
                        label: f.name,
                        parent_id: 0,
                        styleClass: "tree-node-parent file_explorer_tree",
                        expanded: false,
                        children: [],
                        icon: '',
                        parent_folder: '0',
                        breadCrumb: [],
                        upload: true,
                    }
                    tmp.push(folder_);
                })

                const folder_parent: TREE = {
                    collapsedIcon: 'fa fa-database icon-folder-media',
                    data: '',
                    expandedIcon: 'fa fa-database icon-folder-media',
                    id: 0,
                    key: '0',
                    label: 'Thư mục của tôi',
                    parent_id: null,
                    styleClass: "tree-node-parent file_explorer_tree",
                    expanded: true,
                    children: tmp,
                    icon: '',
                    parent_folder: '0',
                    breadCrumb: [],
                    upload: true,
                }

                const trash_folder: TREE = {
                    collapsedIcon: 'fa fa-trash icon-folder-media',
                    data: '',
                    expandedIcon: 'fa fa-trash icon-folder-media',
                    id: -100,
                    key: '-100',
                    label: 'Thùng rác',
                    parent_id: null,
                    styleClass: "tree-node-parent file_explorer_tree",
                    expanded: true,
                    children: [],
                    icon: '',
                    parent_folder: '0',
                    breadCrumb: [],
                    upload: true,
                }

                folder_parent.children.forEach(f => {
                    f['parent'] = folder_parent;
                })

                this.treeFolder = [folder_parent];
                this.treeFolder.push(trash_folder);
                if (!this.auth.currentFolder || this.auth.currentFolder.id === 0) {
                    this.nodeSelect(folder_parent);
                } else {
                    const parent = this.loopGetPreParent(this.auth.currentFolder);
                    const index = tmp.findIndex(m => m.id === parent.id);
                    if (index !== -1) {
                        folder_parent.children[index] = parent;
                        this.nodeSelect(this.auth.currentFolder);
                    } else {
                        this.nodeSelect(folder_parent);
                    }
                }

            },
            error: () => {
                this.noitifi.toastError("Tải thư mục thất bại");
            }
        })
    }

    loopGetPreParent(folder: TREE): TREE {
        if (folder.parent && folder.parent.id) {
            return this.loopGetPreParent(folder.parent);
        }
        return folder;
    }

    loadFileList(page) {
        const condtion: ConditionOption = {
            condition: [],
            set: [],
            page: page.toString()
        }

        if (this.filterName) {
            condtion.condition.push({ conditionName: 'title', condition: OvicQueryCondition.like, value: '%' + this.filterName + '%', orWhere: 'and' },)
        }

        if (this.sortObject.orderby) {
            condtion.set.push({ label: 'orderby', value: this.sortObject.orderby });
            condtion.set.push({ label: 'order', value: this.sortObject.order });
        } else {
            condtion.set.push({ label: 'orderby', value: 'created_at' });
            condtion.set.push({ label: 'order', value: 'desc' });
        }

        if (this.selectedFolder && this.selectedFolder.id !== -100) {
            condtion.condition.push({
                conditionName: 'tag', condition: OvicQueryCondition.equal, value: this.selectedFolder.id.toString(), orWhere: 'and'
            },)
        }

        if (this.ext && this.ext !== '') {
            condtion.set.push({ label: 'include_by', value: 'ext' });
            condtion.set.push({ label: 'include', value: this.ext });
        }

        // const condtion_: ConditionOption = {
        //     condition: [],
        //     set: [
        //         { label: 'orderby', value: 'created_at' },
        //         { label: 'order', value: 'desc' },
        //         { label: 'groupby', value: 'tag' }
        //     ],
        //     page: '-1'
        // }

        // if (this.ext && this.ext !== '') {
        //     condtion_.set.push({ label: 'include_by', value: 'ext' });
        //     condtion_.set.push({ label: 'include', value: this.ext });
        // }

        const request: Observable<FileDto> = this.selectedFolder.id !== -100 ? this.fileService.getLibraryAws(condtion) : this.fileService.getTrashFileAws(condtion);
        this.noitifi.isProcessing(true);
        forkJoin([
            request,
        ]).subscribe({
            next: ([files]) => {
                this.noitifi.isProcessing(false);
                const data_files = [];
                const start = (page - 1) * 20;
                files.data.forEach((f, key) => {
                    f['index_'] = start + 1 + key;
                    f['upload_at'] = this.fileService.getUploadDate(f);
                    f['file_size'] = this.fileService.getFileSize(f);
                    data_files.push(f);
                })
                this.file_list = files.data;
                this.total_file = files.recordsFiltered;
                this.select_tag = this.list_tag[0];
            },

            error: () => { this.noitifi.toastError("Lỗi kết nối") }
        })
    }


    loadTrashFile() {

    }

    /*******************************************************
     * onFileInput functions
     * *****************************************************/

    openUploadFile() {
        this.inputFileChooser.nativeElement.value = '';
        this.inputFileChooser.nativeElement.click();
    }

    setFileVideoInfo(file) {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.src = URL.createObjectURL(file);
            video.onloadedmetadata = function () {
                window.URL.revokeObjectURL(video.src);
                const duration = video.duration;
                file.duration = duration;
                video.remove();
                resolve(duration);
            }
        })
    }

    async onFileInput(event) {
        this.errorMaxFileUploading = false;
        this.uploadingFiles = [].concat(this.uploadingFiles, this.validateFiles(event));
        this.displayPosition = true;
        const index = this.uploadingFiles.findIndex(f => f.validate && !f.uploaded && (f['progressValue'] > 0 && f['progressValue'] < 100));
        if (index === -1)
            this.loopUpLoadFile();
    }

    async loopUpLoadFile() {
        const index = this.uploadingFiles.findIndex(f => f.validate && !f.uploaded && !f['progressValue']);
        if (index !== -1) {
            const file = this.uploadingFiles[index];
            const index_type = file.type.toLowerCase().indexOf("video");
            if (index_type !== -1) {
                const duration = await this.setFileVideoInfo(file.file);
                if (duration.toString().toLowerCase() === 'infinity') {
                    this.noitifi.confirm("<div class='warning-video-type'><i class='fa fa-exclamation-triangle'></i><span>Trình duyệt không hỗ trợ video dạng nén, vui lòng kiểm tra lại video hoặc liên hệ với kỹ thuật viên</span></div>", "Thông báo", [BUTTON_CLOSED]).then(() => {
                        file.validate = false;
                        file.message = 'Trình duyệt không hỗ trợ video dạng nén';
                        this.loopUpLoadFile();
                    })
                } else {
                    this.uploadFileFunc(file);
                }
            } else {
                this.uploadFileFunc(file);
            }

        } else {
            this.loadFirstPage();
        }
    }


    uploadFileFunc(file) {
        this.fileService.uploadFileAwsWidthProgress(file.file, this.selectedFolder ? this.selectedFolder.id.toString() : 0).subscribe({
            next: (_file_uploading) => {
                file['progressValue'] = _file_uploading.progress;
                if (_file_uploading.state === 'DONE') {
                    file.uploaded = true;
                    this.loopUpLoadFile();
                    file.message = 'Upload thành công';
                }
            },
            error: () => {
                file.validate = false;
                file.message = 'Upload thất bại';
                this.loopUpLoadFile();
            }
        });
    }

    /**************************************************
     * Validate files input
     * ************************************************/
    validateFiles(files: FileList): OvicFileUpload[] {
        const result: OvicFileUpload[] = [];
        for (let i = 0; i < files.length; i++) {
            const file = {
                id: ++this._f_id,
                name: files[i].name,
                title: files[i].name,
                type: files[i].type,
                size: files[i].size,
                _size: this.fileService.formatBytes(files[i].size),
                uploaded: false,
                validate: true,
                message: '',
                file: files[i],
            };
            file['progressValue'] = 0;
            if (APP_CONFIGS.limitFileType) {
                const isFileRar = (file.type === '' && file.name.slice(file.name.lastIndexOf('.rar')) !== 'rar');
                if (!isFileRar && !this.acceptFileType[file.type]) {
                    file.validate = false;
                    file.message = 'Định dạng file chưa được hỗ trợ';
                    // setTimeout(() => this.removeFileFromUploadingList(null, file.id), 5000 + (i * 100));
                }
            }
            if (file.size > APP_CONFIGS.maxUploadSize) {
                file.validate = false;
                file.message = 'Dung lượng file vượt quá giới hạn';
                // setTimeout(() => this.removeFileFromUploadingList(null, file.id), 5000 + (i * 100));
            }
            result.push(file);
        }
        return result;
    }

    /**************************************************
    * removeFileFromUploadingList ( remove file in uploading file list)
    * ************************************************/
    removeFileFromUploadingList(event: Event, fileId: number) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        this.uploadingFiles = this.uploadingFiles.filter(f => f.id !== fileId);
    }

    onClose() {
        this.noitifi.closeSideNavigationMenu();
    }

    onSelectedFile(save?: boolean) {
        if (save) {
            if (!this.selectedFiles || !this.selectedFiles.length) {
                this.noitifi.toastWarning("Vui lòng chọn file");
                return;
            }
        }
        const data = [];
        if (this.selectedFiles && this.selectedFiles.length) {
            this.selectedFiles.forEach(f => {
                let type = null;
                Object.keys(TYPE_FILE_LIST).forEach(t => {
                    if (f.type) {
                        const index = f.type.indexOf(t);
                        if (index !== -1) {
                            type = TYPE_FILE_LIST[t];
                        }
                    }
                })


                if (!f['source']) {
                    f['type'] = type ? type : f['ext'];
                    f['source'] = this.server;
                    f['path'] = f['id'];
                    f['fileName'] = f['title'];
                    f['preview'] = true;
                    f['download'] = true;
                }

                data.push({
                    id: f.id,
                    name: f.name,
                    title: f.title,
                    ext: f.ext,
                    type: type ? type : f['ext'],
                    file_size: f['file_size'],
                    size:f.size,
                    source: this.server,
                    fileName: f.title,
                    path: f['id'],
                    preview: true,
                    download: true
                })
            })
        }
        this.activeModal.close(data);
    }

    closeDialogUpload() {
        this.displayPosition = false;
        this.uploadingFiles = [];
    }

    changePage(event) {
        this.loadFileList(event.page + 1);
    }

    loadFirstPage() {
        if (!this.paginator.empty()) {
            this.paginator.changePage(0);
        } else {
            this.loadFileList(1);
        }
    }


    /** Thao tác với folder */
    openCreateFormFolder() {
        this.formFolder.reset();
        this.f['parent_id'].setValue(this.selectedFolder ? this.selectedFolder.id : 0);
        this.isUpdate = false;
        this.modalService.open(this.createFolderTemplate, NORMAL_MODAL_OPTIONS);
    }

    startSaveFolder(d) {
        if (this.formFolder.valid) {
            const option: ConditionOption = {
                condition: [
                    { conditionName: 'slug', condition: OvicQueryCondition.equal, value: this.helperService.slugVietnamese(this.formFolder.getRawValue()['name'].concat('_', this.auth.user.id)), orWhere: 'and' },
                    { conditionName: 'created_by', condition: OvicQueryCondition.equal, value: this.auth.user.id.toString(), orWhere: 'and' },

                ],
                set: [],
                page: null
            }

            if (this.isUpdate) {
                option.condition.push({ conditionName: 'id', condition: OvicQueryCondition.notEqual, value: this.selectedFolder.id.toString(), orWhere: 'and' })
                option.condition.push({ conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: this.selectedFolder.parent_id.toString(), orWhere: 'and' })
            } else {
                option.condition.push({ conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: this.selectedFolder.id.toString(), orWhere: 'and' })
            }
            this.noitifi.isProcessing(true);
            this.mediaFolderService.getMediaFolderByPageNew(option).subscribe({
                next: (_res) => {
                    if (_res.data.length) {
                        this.slugIsValid = false;

                    } else {
                        this.slugIsValid = true;
                    }
                    this.noitifi.isProcessing(false)
                    this.saveFolder(d);
                },
                error: () => {
                    this.noitifi.isProcessing(false);
                }
            })
        } else {
            this.noitifi.toastWarning("Vui lòng nhập tên thư mục");
        }
    }

    saveFolder(d) {
        if (this.formFolder.valid && this.slugIsValid) {
            this.noitifi.isProcessing(true);
            this.f['slug'].setValue(this.helperService.slugVietnamese(this.formFolder.getRawValue()['name'].concat('_', this.auth.user.id)));
            if (this.isUpdate) {
                this.mediaFolderService.updateMediaFolder(this.selectedFolder.id, this.formFolder.value).subscribe({
                    next: () => {
                        this.selectedFolder.label = this.formFolder.getRawValue()['name'];
                        this.noitifi.isProcessing(false);
                        d(true);
                    },
                    error: () => {
                        d(true);
                        this.noitifi.isProcessing(false);
                        this.noitifi.toastError("Sửa thất bại");
                    }
                })
            } else {
                this.mediaFolderService.addMediaFolder(this.formFolder.value).subscribe({
                    next: () => {
                        this.closeAndOpenNode(this.selectedFolder);
                        this.noitifi.isProcessing(false);
                        d(true);
                    },
                    error: () => {
                        this.noitifi.isProcessing(false);
                        d(true);
                        this.noitifi.toastError("Tạo thư mục thất bại");
                    }
                })
            }
        } else {
            this.noitifi.toastWarning("Vui lòng nhập tên thư mục");
        }
    }

    nodeSelect(event: TREE) {
        if (!this.selectedFolder || this.selectedFolder.id !== event.id) {
            this.selectedFolder = event;
            this.auth.currentFolder = event;
            this.loadFileList(1);
        }
    }

    closeAndOpenNode(event: TREE) {
        if (event.parent_folder && event.parent_folder !== '') {
            if (event.expanded === true) {
                const condition = { parents: event.id };
                condition['limit'] = '500';
                condition['folder'] = 1;
                // this.directoriesLoading = true;

                const option: ConditionOption = {
                    condition: [
                        { conditionName: 'created_by', condition: OvicQueryCondition.equal, value: this.auth.user.id.toString(), orWhere: 'and' },
                        { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: event.id, orWhere: 'and' },
                    ],
                    set: [{ label: "limit", value: "-1" }],
                    page: null
                }

                this.noitifi.isProcessing(true);
                this.mediaFolderService.getMediaFolderByPageNew(option).subscribe({
                    next: (_resRoot) => {
                        const folder_ = [];
                        _resRoot.data.forEach((fol) => {
                            // const breadCrumb_ = this.setNewBreadCrum(event.breadCrumb);
                            // breadCrumb_.push({ id: file.id, label: file.name, parents: file.parents[0] })
                            const folder: TREE = {
                                collapsedIcon: 'fa fa-folder icon-folder-media',
                                data: '',
                                expandedIcon: 'fa fa-folder-open icon-folder-media',
                                id: fol.id,
                                key: fol.id.toString(),
                                label: fol.name,
                                parent_id: fol.parent_id,
                                styleClass: "tree-node-parent file_explorer_tree",
                                expanded: false,
                                children: [],
                                icon: '',
                                parent_folder: fol.id.toString(),
                                breadCrumb: [],
                                upload: event.upload,
                                parent: event
                            }


                            // folder.breadCrumb[folder.breadCrumb.length - 1]['folder'] = folder;
                            folder_.push(folder);
                        })

                        event.children = folder_;
                        this.noitifi.isProcessing(false);
                    },
                    error: () => {
                        this.noitifi.toastError("Lỗi kết nối")
                    }
                })
            }
        }
    }

    closeMoveFolder() {
        this.display_move_template = false;
    }

    openMoveFolder() {
        this.display_move_template = true;
        // this.selected_file = file;
        this.getFolderMove();
    }

    getFolderMove() {
        this.selected_folder = null;
        this.searchFolder = null;
        this.folder_show_move = { name: this.selectedFolder.label, id: this.selectedFolder.id, parent_id: this.selectedFolder.parent_id, slug: '' };
        const option: ConditionOption = {
            condition: [
                { conditionName: 'created_by', condition: OvicQueryCondition.equal, value: this.auth.user.id.toString(), orWhere: 'and' },
                { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: this.selectedFolder.id, orWhere: 'and' },
            ],
            set: [{ label: "limit", value: "-1" }],
            page: null
        }

        this.mediaFolderService.getMediaFolderByPageNew(option).subscribe({
            next: (_resRoot) => {
                this.list_folder_show_move = _resRoot.data;
            },
            error: () => {
                this.noitifi.toastError("Lỗi kết nối");
            }
        })
    }

    backspaceFolder() {
        if (this.folder_show_move && this.folder_show_move.parent_id) {
            const option: ConditionOption = {
                condition: [
                    { conditionName: 'created_by', condition: OvicQueryCondition.equal, value: this.auth.user.id.toString(), orWhere: 'and' },
                    { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: this.folder_show_move.parent_id.toString(), orWhere: 'and' },
                ],
                set: [{ label: "limit", value: "-1" }],
                page: null
            }

            const option_parent: ConditionOption = {
                condition: [
                    { conditionName: 'created_by', condition: OvicQueryCondition.equal, value: this.auth.user.id.toString(), orWhere: 'and' },
                    { conditionName: 'id', condition: OvicQueryCondition.equal, value: this.folder_show_move.parent_id.toString(), orWhere: 'and' },
                ],
                set: [{ label: "limit", value: "-1" }],
                page: null
            }
            forkJoin([
                this.mediaFolderService.getMediaFolderByPageNew(option),
                this.mediaFolderService.getMediaFolderByPageNew(option_parent)
            ]).subscribe({
                next: ([_resRoot, _resParent]) => {
                    this.folder_show_move = _resParent.data[0];
                    this.list_folder_show_move = _resRoot.data;
                },
                error: () => {
                    this.noitifi.toastError("Lỗi kết nối");
                }
            })
        } else {
            if (this.folder_show_move.parent_id === 0) {
                const option: ConditionOption = {
                    condition: [
                        { conditionName: 'created_by', condition: OvicQueryCondition.equal, value: this.auth.user.id.toString(), orWhere: 'and' },
                        { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: this.folder_show_move.parent_id.toString(), orWhere: 'and' },
                    ],
                    set: [{ label: "limit", value: "-1" }],
                    page: null
                }
                this.folder_show_move = { name: 'Thư mục của tôi', id: 0, parent_id: null, slug: '' };
                this.mediaFolderService.getMediaFolderByPageNew(option).subscribe({
                    next: (_resRoot) => {
                        this.list_folder_show_move = _resRoot.data;
                    },
                    error: () => {
                        this.noitifi.toastError("Lỗi kết nối");
                    }
                })
            } else {
                this.noitifi.toastWarning("Bạn đã ở thư mục gốc")
            }
        }
    }

    changeFolder(event: MatSelectionListChange) {
        this.selected_folder = event.options[0].value;
    }

    showThisFolder(folder: MediaFolder) {
        this.folder_show_move = folder;
        const option: ConditionOption = {
            condition: [
                { conditionName: 'created_by', condition: OvicQueryCondition.equal, value: this.auth.user.id.toString(), orWhere: 'and' },
                { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: folder.id.toString(), orWhere: 'and' },
            ],
            set: [{ label: "limit", value: "-1" }],
            page: null
        }
        this.mediaFolderService.getMediaFolderByPageNew(option).subscribe({
            next: (_resRoot) => {
                this.list_folder_show_move = _resRoot.data;
            },
            error: () => {
                this.noitifi.toastError("Lỗi kết nối");
            }
        })
    }

    changeNameFolder() {
        if (this.selectedFolder) {
            this.formFolder.reset();
            this.isUpdate = true;
            this.f['name'].setValue(this.selectedFolder.label);
            this.f['parent_id'].setValue(this.selectedFolder.parent_id);
            this.modalService.open(this.createFolderTemplate, NORMAL_MODAL_OPTIONS);
        } else {
            this.noitifi.toastWarning("Vui lòng trọn thư mục");
        }
    }

    deleteFolder() {
        if (this.selectedFolder) {
            const condtion: ConditionOption = {
                condition: [],
                set: [
                    { label: 'orderby', value: 'created_at' },
                    { label: 'order', value: 'desc' }
                ],
                page: '1'
            }

            if (this.selectedFolder) {
                condtion.condition.push({
                    conditionName: 'tag', condition: OvicQueryCondition.equal, value: this.selectedFolder.id.toString(), orWhere: 'and'
                },)
            }

            const option: ConditionOption = {
                condition: [
                    { conditionName: 'created_by', condition: OvicQueryCondition.equal, value: this.auth.user.id.toString(), orWhere: 'and' },
                    { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: this.selectedFolder.id, orWhere: 'and' },
                ],
                set: [{ label: "limit", value: "1" }],
                page: null
            }

            forkJoin([
                this.fileService.getLibraryAws(condtion),
                this.mediaFolderService.getMediaFolderByPageNew(option)
            ]).subscribe({
                next: ([files, _folder]) => {
                    if (!files.data.length && !_folder.data.length) {
                        this.noitifi.confirmDelete().then(a => {
                            if (a) {
                                this.mediaFolderService.deleteMediaFolder(this.selectedFolder.id).subscribe({
                                    next: () => {
                                        this.onLoadFolder();
                                    },
                                    error: () => {
                                        this.noitifi.toastError("Lỗi kết nối")
                                    }
                                })
                            }
                        })
                    } else {
                        this.noitifi.toastWarning("Vui lòng xóa file hoặc thư mục con trước khi thực hiện thao tác này")
                    }
                },
                error: () => { this.noitifi.toastError("Lỗi kết nối") }
            })
        } else {
            this.noitifi.toastWarning("Vui lòng trọn thư mục");
        }
    }

    /** thao tác với file */

    onChangeCheckAllInPage(event) {
        let tmpdata = [];
        if (event['checked']) {
            if (this.selectedFiles) {
                tmpdata = [...this.selectedFiles];
                this.file_list.forEach(f => {
                    const index = this.selectedFiles.findIndex(m => m.id === f.id);
                    if (index === -1) {
                        tmpdata.push(f);
                    }
                })
            } else {
                this.selectedFiles = this.file_list;
            }
        } else {
            if (this.selectedFiles) {
                this.selectedFiles.forEach(f => {
                    const index = this.file_list.findIndex(m => m.id === f.id);
                    if (index === -1) {
                        tmpdata.push(f);
                    }
                })

            }
        }
        this.selectedFiles = tmpdata;
    }

    deleteFile() {
        if (!this.global) {
            if (this.selectedFile) {
                this.noitifi.confirmDelete().then((a) => {
                    if (a) {
                        this.fileService.deleteFileAwsNormal([this.selectedFile.id]).subscribe({
                            next: () => {
                                this.noitifi.toastSuccess("Xóa thành công");
                                this.loadFirstPage();
                            },
                            error: () => {
                                this.noitifi.toastError("Xóa thất bại");
                            }
                        })
                    }
                }, () => null)
            }
        } else {
            if (this.selectedFiles && this.selectedFiles.length) {
                const ids = [];
                this.selectedFiles.forEach(f => {
                    ids.push(f.id);
                })
                this.noitifi.confirmDelete().then((a) => {
                    if (a) {
                        this.fileService.deleteFileAwsNormal(ids).subscribe({
                            next: () => {
                                this.noitifi.toastSuccess("Xóa thành công");
                                this.loadFirstPage();
                            },
                            error: () => {
                                this.noitifi.toastError("Xóa thất bại");
                            }
                        })
                    }
                }, () => null)
            } else {
                if (this.selectedFile) {
                    this.noitifi.confirmDelete().then((a) => {
                        if (a) {
                            this.fileService.deleteFileAwsNormal([this.selectedFile.id]).subscribe({
                                next: () => {
                                    this.noitifi.toastSuccess("Xóa thành công");
                                    this.loadFirstPage();
                                },
                                error: () => {
                                    this.noitifi.toastError("Xóa thất bại");
                                }
                            })
                        }
                    }, () => null)
                }
            }
        }
    }

    async handleCopyAudioCode() {
        if (this.selectedFile) {
            const file = this.selectedFile;
            let type = 'audio';
            const index = this.selectedFile.type.indexOf("audio");
            if (index === -1) {
                type = 'video'
            }
            const clipboard = `@@[ ${type} ${this.server} ${file.id.toString()} 1 ]`;
            navigator.clipboard.writeText(clipboard).then(() => {
                this.noitifi.toastSuccess("Sao chép thành công");
            }).catch(() => {
                this.noitifi.toastWarning("Sao chép thất bại")
            });
        } else {
            this.noitifi.toastWarning("Sao chép thất bại")
        }
    }

    async downloadFile() {
        if (this.selectedFile) {
            const file = this.selectedFile;
            let type = this.selectedFile['ext'];
            Object.keys(TYPE_FILE_LIST).forEach(t => {
                if (this.selectedFile.type) {
                    const index = this.selectedFile.type.indexOf(t);
                    if (index !== -1) {
                        type = TYPE_FILE_LIST[t];
                    }
                }
            })
            file['type'] = type;
            file['source'] = this.server;
            file['path'] = this.selectedFile['id'];
            file['fileName'] = this.selectedFile['title'];
            file['preview'] = true;
            file['download'] = true;
            const result = await this.mediaService.AwstplDownloadFile(file);
            switch (result) {
                case DownloadProcess.rejected:
                    this.noitifi.toastInfo('Chưa hỗ trợ tải xuống thư mục');
                    break;
                case DownloadProcess.error:
                    this.noitifi.toastError('Tải xuống thất bại');
                    break;
            }
        } else {
            this.noitifi.toastWarning("Tải thất bại")
        }
    }

    filterBynameFile(event) {
        if (event) {
            this.loadFirstPage();
        } else {
            this.loadFirstPage();
        }
    }

    onChangeCheck(event, file) {
        // if()
        // const vidEle = document.createElement('video');
        // vidEle.setAttribute()
        if (event.checked.length && !this.isMultipleMode) {
            this.selectedFiles = [file];
        }
    }

    openViewFile() {
        if (this.selectedFile) {
            this.selectedFile['source'] = "serverAws";
            this.modalService.open(this.viewDocumentTempalte, LARGE_MODAL_OPTIONS);
        }
    }

    moveToFolder(event) {
        if (this.selected_folder) {
            this.confirmationService.confirm({
                target: event.target,
                message: "Bạn có chắc chắn muốn di chuyển tệp tin đến thư mục: ".concat(this.selected_folder.name),
                icon: 'pi pi-exclamation-triangle',
                acceptLabel: "Có",
                rejectLabel: "Không",
                accept: () => {
                    if (this.moveFolder) {
                        this.mediaFolderService.updateMediaFolder(this.selectedFolder.id, { parent_id: this.selected_folder.id }).subscribe({
                            next: () => {
                                this.display_move_template = false;
                                this.noitifi.toastSuccess("Di chuyển thành công");
                                this.onLoadFolder();
                            },
                            error: () => {
                                this.noitifi.toastError("Lỗi kết nối, di chuyển thất bại");
                            }
                        })
                    } else {
                        if (!this.global) {
                            this.fileService.updateAwsFileInfo(this.selectedFile.id, { tag: this.selected_folder.id }).subscribe({
                                next: () => {
                                    this.display_move_template = false;
                                    this.noitifi.toastSuccess("Di chuyển thành công");
                                    this.loadFirstPage();
                                },
                                error: () => {
                                    this.noitifi.toastError("Lỗi kết nối, di chuyển thất bại");
                                }
                            })
                        } else {
                            if (this.selectedFiles && this.selectedFiles.length) {
                                this.noitifi.isProcessing(true);
                                const request: Observable<any>[] = [];
                                this.selectedFiles.forEach(f => {
                                    request.push(this.fileService.updateAwsFileInfo(f.id, { tag: this.selected_folder.id }))
                                })
                                if (request.length) {
                                    forkJoin(request).subscribe({
                                        next: () => {
                                            this.display_move_template = false;
                                            this.noitifi.toastSuccess("Di chuyển thành công");
                                            this.noitifi.isProcessing(false);
                                            this.loadFirstPage();
                                        },
                                        error: () => {
                                            this.noitifi.isProcessing(false);
                                            this.noitifi.toastError("Lỗi kết nối, di chuyển thất bại");
                                        }
                                    })
                                } else {
                                    this.noitifi.isProcessing(false);
                                }
                            } else {
                                this.fileService.updateAwsFileInfo(this.selectedFile.id, { tag: this.selected_folder.id }).subscribe({
                                    next: () => {
                                        this.display_move_template = false;
                                        this.noitifi.toastSuccess("Di chuyển thành công");
                                        this.loadFirstPage();
                                    },
                                    error: () => {
                                        this.noitifi.toastError("Lỗi kết nối, di chuyển thất bại");
                                    }
                                })
                            }
                        }
                    }
                },
                reject: () => {

                }
            });
        } else {
            this.noitifi.toastWarning("Chưa chọn thư mục")
        }
    }



    // loopMoveFiles(id, key, datas) {
    //     if (key < datas.length) {

    //     } else {
    //         this.display_move_template = false;
    //         this.loadFirstPage();
    //     }
    // }

    renameFile() {
        this.formFolder.reset();
        this.f['name'].setValue(this.selectedFile.title);
        this.modalService.open(this.changeFileNameTemplate, NORMAL_MODAL_OPTIONS);
    }

    saveRenameFile(d) {
        if (this.formFolder.valid) {
            this.fileService.updateAwsFileInfo(this.selectedFile.id, { title: this.formFolder.getRawValue()['name'] }).subscribe({
                next: () => {
                    this.loadFirstPage();
                    d(true);
                },
                error: () => {
                    this.noitifi.toastError("Lỗi kết nối, di chuyển thất bại");
                }
            })
        } else {
            this.noitifi.toastWarning("Vui lòng nhập tên file")
        }
    }

    sortFiles(name) {
        if (!this.sortObject.order || this.sortObject.order === 'DESC') {
            this.sortObject.order = 'ASC';
        } else if (this.sortObject.order === 'ASC') {
            this.sortObject.order = 'DESC'
        }
        this.sortObject.orderby = name;
        this.loadFirstPage();
    }

    loopCloseAndOpenNode(event: TREE, root_node) {
        if (event.id !== root_node.id) {
            if (event.expanded === true) {
                const condition = { parents: event.id };
                condition['limit'] = '500';
                condition['folder'] = 1;
                // this.directoriesLoading = true;

                const option: ConditionOption = {
                    condition: [
                        { conditionName: 'created_by', condition: OvicQueryCondition.equal, value: this.auth.user.id.toString(), orWhere: 'and' },
                        { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: event.id, orWhere: 'and' },
                    ],
                    set: [{ label: "limit", value: "-1" }],
                    page: null
                }
                this.mediaFolderService.getMediaFolderByPageNew(option).subscribe({
                    next: (_resRoot) => {
                        const folder_ = [];
                        _resRoot.data.forEach((fol) => {
                            // const breadCrumb_ = this.setNewBreadCrum(event.breadCrumb);
                            // breadCrumb_.push({ id: file.id, label: file.name, parents: file.parents[0] })
                            const folder: TREE = {
                                collapsedIcon: 'fa fa-folder icon-folder-media',
                                data: '',
                                expandedIcon: 'fa fa-folder-open icon-folder-media',
                                id: fol.id,
                                key: fol.id.toString(),
                                label: fol.name,
                                parent_id: fol.parent_id,
                                styleClass: "tree-node-parent file_explorer_tree",
                                expanded: true,
                                children: [],
                                icon: '',
                                parent_folder: fol.id.toString(),
                                // breadCrumb: breadCrumb_,
                                upload: event.upload,
                                parent: event
                            }

                            // folder.breadCrumb[folder.breadCrumb.length - 1]['folder'] = folder;
                            folder_.push(folder);
                        })

                        event.children = folder_;
                    },
                    error: () => {
                        this.noitifi.toastError("Lỗi kết nối")
                    }
                })
            }
        }
    }

    restoreFile() {
        this.noitifi.confirm("Bạn có chắc chắn muốn khôi phục lại tệp tin này?", "Khôi phục tệp tin", [BUTTON_YES, BUTTON_NO]).then(a => {
            if (a.name === 'yes') {
                this.fileService.restoreTrashFile(this.selectedFile.id).subscribe({
                    next: () => {
                        this.loadFirstPage();
                    }
                })
            }
        })
    }
}
