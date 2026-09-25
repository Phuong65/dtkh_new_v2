import { readImportFile } from '../../read-import-file';
import { request } from 'http';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DialogModule } from 'primeng/dialog';
import { SharedModule } from '@modules/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { Classes } from '@modules/shared/models/classes';
import { CheckboxModule } from 'primeng/checkbox';
import { Router } from '@angular/router';
import { NotificationService } from '@core/services/notification.service';
import * as XLSX from 'xlsx';
import { FileService } from '@core/services/file.service';
import { saveAs } from 'file-saver';
import { HelperService } from '@core/services/helper.service';
import { catchError, finalize, forkJoin, map, mergeMap, Observable, of, concat } from 'rxjs';
import { OvicQueryCondition } from '@core/models/dto';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { NORMAL_MODAL_OPTIONS, ROLES } from '@modules/shared/utils/syscat';
import { AuthService } from '@core/services/auth.service';
import { DonViService } from '@modules/shared/services/don-vi.service';
import { UserService } from '@core/services/user.service';
import { User } from '@core/models/user';
import { DonVi } from '@modules/shared/models/don-vi';
import { RoleService } from '@core/services/role.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BUTTON_YES, BUTTON_NO } from '@core/models/buttons';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { ClassesService } from '@modules/shared/services/classes.service';
import { error } from 'console';
import { MatMenuModule } from '@angular/material/menu';
import { InputMaskModule } from 'primeng/inputmask';
import { HvuApiDanhsachlophocphanService } from '@modules/shared/services/hvu-api-danhsachlophocphan.service';

type ImportClassStatus = 'success' | 'failed' | 'skipped';
type ImportDataSource = 'excel' | 'hvu-api';

interface ImportClassResult {
    status: ImportClassStatus;
    row: data_lophoc;
    reason?: string;
}

export interface data_lophoc {
    index_: number;
    name: string;
    mahp: string;
    kyhieu: string;
    sotinchi: string;
    slug: string;
    status: number;
    manager_ids: number[];
    manager_info: string;
    khoa: string;
    dothoc: number;
    sosv_dangky: number;
    image: any;
    hocky: string;
    namhoc: string;
    email: string;
    mahp_slug: string;
    name_giaovien: string;
    khoa_bomon: string;
    import?: boolean;
    import_label?: string;
    import_result_status?: ImportClassStatus;
    duplicate?: string;
    status_import: number;
}

@Component({
    selector: 'app-import-lophoc',
    standalone: true,
    imports: [
        CommonModule,
        MatProgressBarModule,
        DialogModule,
        SharedModule,
        ReactiveFormsModule,
        FormsModule,
        TableModule,
        PaginatorModule,
        CheckboxModule,
        MatMenuModule,
        InputMaskModule
    ],
    templateUrl: './import-lophoc.component.html',
    styleUrls: ['./import-lophoc.component.css']
})
export class ImportLophocComponent implements OnInit {
    @ViewChild('inputImport') inputImport: ElementRef;

    @ViewChild('templateChooseExcel') templateChooseExcel: ElementRef;

    ghi_de: boolean = false;

    waitting_title: string = "Đồng bộ dữ liệu";

    progressValue: number = 0;

    displayModal: boolean = false;

    list_lophoc: data_lophoc[] = [];

    filtered_lophoc: data_lophoc[] = [];

    search_lophoc: string;

    status_object = {
        no_import: 0,
        import_done: 0,
        import_fail: 0,
        import_skipped: 0
    }

    status_import_filter: number | 'skipped';

    pageImport: number = 0;

    list_donvi: DonVi[] = [];

    list_teacher: User[] = [];

    isInitializing: boolean = true;

    isReferenceDataReady: boolean = false;

    arrayYear = [];

    selectedYear: string;

    importDataSource: ImportDataSource = 'excel';

    hvuRequestedAcademicYear: string;

    show_return: boolean = false;

    import_return: number = 0;

    totalImportItems: number = 0;

    displaySyncClass: boolean = false;

    classFilter: { namhoc: number; hocky: number, nien_khoa: string } = {
        namhoc: null,
        hocky: null,
        nien_khoa: null
    }

    constructor(
        private router: Router,
        private notificationService: NotificationService,
        private helperService: HelperService,
        private fileService: FileService,
        private donViService: DonViService,
        private auth: AuthService,
        private userService: UserService,
        private roleService: RoleService,
        private modalService: NgbModal,
        private elnKhoaHocService: ElnKhoaHocService,
        private classesService: ClassesService,
        private hvuApiDanhsachlophocphanService: HvuApiDanhsachlophocphanService,
    ) { }

    ngOnInit(): void {
        this.auth.setFeatureSecondary("Đồng bộ dữ liệu - Lớp học");
        this.initLoad();
    }

    getRolesPromise(): Promise<any> {
        return new Promise((resolve, reject) => {
            const objectRoles = {};
            const roles_ = [];
            Object.keys(ROLES).forEach(f => {
                if (f !== "student") {
                    roles_.push(ROLES[f]);
                }
            })
            const condition: ConditionOption = {
                condition: [],
                set: [
                    { label: 'limit', value: '-1' },
                    { label: 'include', value: roles_.toString() },
                    { label: 'include_by', value: 'name' },
                ],
                page: null,
            };

            this.roleService.getRolesByPageNew(condition).subscribe({
                next: (_role) => {
                    (_role.data || []).forEach((f) => {
                        objectRoles[f.name] = f;
                    });
                    resolve(objectRoles);
                },
                error: (error) => reject(error),
            });
        });
    }

    async initLoad() {
        const condition_donvi: ConditionOption = {
            condition: [
                {
                    conditionName: 'parent_id',
                    condition: OvicQueryCondition.equal,
                    value: this.auth.user.donvi_id.toString(),
                },
                {
                    conditionName: 'status',
                    condition: OvicQueryCondition.notEqual,
                    value: '-1',
                    orWhere: 'and',
                },
            ],

            set: [{ label: 'limit', value: '-1' }],
            page: null,
        };

        this.isInitializing = true;
        this.isReferenceDataReady = false;
        this.list_donvi = [];
        this.list_teacher = [];
        this.notificationService.isProcessing(true);

        try {
            const objectRoles = await this.getRolesPromise();
            const ids_roles = Object.keys(objectRoles).map(f => objectRoles[f].id);
            const roleATeacher = this.auth.roles.find((r) => r.name === ROLES.giangvien);

            const condition_teacher: ConditionOption = {
                condition: [
                    { conditionName: 'status', condition: OvicQueryCondition.equal, value: '1', orWhere: 'and' }
                ],

                set: [
                    { label: 'limit', value: '-1' },
                    { label: 'role_ids', value: roleATeacher ? roleATeacher['id'].toString() : ids_roles.toString(), }
                ],

                page: null
            }

            forkJoin([
                this.donViService.getDonviByPageNew(condition_donvi),
                this.userService.getUserByPageNew(condition_teacher)
            ]).subscribe({
                next: ([_donvi, _teacher]) => {
                    this.list_donvi = _donvi.data || [];
                    this.list_teacher = _teacher.data || [];
                    this.isReferenceDataReady = true;
                    this.isInitializing = false;
                    this.notificationService.isProcessing(false);
                },
                error: () => this.handleReferenceDataError()
            })
        } catch (error) {
            this.handleReferenceDataError();
        }
    }

    private handleReferenceDataError() {
        this.list_donvi = [];
        this.list_teacher = [];
        this.isReferenceDataReady = false;
        this.isInitializing = false;
        this.notificationService.isProcessing(false);
        this.notificationService.toastError(
            'Không thể tải dữ liệu role, đơn vị hoặc giảng viên. Vui lòng thử lại'
        );
    }

    private canUseReferenceData(): boolean {
        if (this.isReferenceDataReady) {
            return true;
        }

        this.notificationService.toastWarning(
            this.isInitializing
                ? 'Dữ liệu tham chiếu đang được tải, vui lòng chờ'
                : 'Dữ liệu tham chiếu chưa sẵn sàng, vui lòng tải lại trang'
        );
        return false;
    }

    getStatusObject() {
        this.status_object = {
            no_import: this.list_lophoc.filter(
                m => m.status_import === 0 && m.import_result_status !== 'skipped'
            ).length,
            import_done: this.list_lophoc.filter(m => m.status_import === 1).length,
            import_fail: this.list_lophoc.filter(m => m.status_import === -1).length,
            import_skipped: this.list_lophoc.filter(
                m => m.import_result_status === 'skipped'
            ).length
        }
        this.updateFilteredLophoc();
    }

    private updateFilteredLophoc(resetPage: boolean = false) {
        const search = (this.search_lophoc || '').toString().trim().toLowerCase();
        this.filtered_lophoc = this.list_lophoc.filter(lophoc => {
            const matchesSearch = !search || [
                lophoc.name,
                lophoc.kyhieu,
                lophoc.khoa,
                lophoc.name_giaovien
            ].some(value => String(value || '').toLowerCase().includes(search));
            const matchesStatus = this.status_import_filter === null ||
                this.status_import_filter === undefined ||
                (this.status_import_filter === 'skipped'
                    ? lophoc.import_result_status === 'skipped'
                    : lophoc.status_import === this.status_import_filter &&
                        !(this.status_import_filter === 0 && lophoc.import_result_status === 'skipped'));

            return matchesSearch && matchesStatus;
        });

        const lastPage = Math.max(Math.ceil(this.filtered_lophoc.length / 25) - 1, 0);
        this.pageImport = resetPage ? 0 : Math.min(this.pageImport, lastPage);
    }

    onSearchLophocChange() {
        this.updateFilteredLophoc(true);
    }

    setStatusImportFilter(status: number | 'skipped' | null) {
        this.status_import_filter = status;
        this.updateFilteredLophoc(true);
    }

    onChangePageImport(event) {
        this.pageImport = event.page;
    }

    backToDongbo() {
        const activeLink = this.router.url.substring(7).split('?')[0].replace('/admin/', '');
        const url = this.router.serializeUrl(
            this.router.createUrlTree(['admin/' + activeLink])
        );
        this.router.navigateByUrl(url);
    }

    downLoadExLophoc() {
        this.fileService.getFileContent('..\\assets\\files\\mau_file_import_hvu\\Mau 05 - Import danh sach lop hoc phan.xlsx').subscribe(res => {
            saveAs(res, 'Mau 05 - Import danh sach lop hoc phan.xlsx');
        });
    }

    triggerImport() {
        if (!this.canUseReferenceData()) {
            return;
        }

        this.inputImport.nativeElement.value = '';
        this.list_lophoc = [];
        this.search_lophoc = null;
        this.status_import_filter = null;
        this.pageImport = 0;
        this.getStatusObject();
        this.inputImport.nativeElement.click();
    }

    changeInputImport(event) {
        if (!this.canUseReferenceData()) {
            event.target.value = '';
            return;
        }

        if (event.target.files[0]) {
            const file = event.target.files[0];
            if (this.helperService.checkTypeFile(['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'], file.type)) {
                readImportFile(file, this.notificationService, 'arrayBuffer', (localUrl) => {
                    const wb: XLSX.WorkBook = XLSX.read(localUrl, { type: 'binary' });
                    const wsname: string = wb.SheetNames[0];
                    const ws: XLSX.WorkSheet = wb.Sheets[wsname];
                    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
                    const newData = data.filter(f => f[1] && f[2] && f[3] && f[4] && f[5] && f[6]);
                    // this.convertDataLophocphan(data);
                    // filterData.splice(0, 1);
                    this.convertData(newData);
                });
            } else {
                this.notificationService.toastWarning("Sai định dạng file, yêu cầu file .xlsx. Vui lòng tải file mẫu danh sách import lớp học");
            }
        }
    }

    convertData(data: any[]) {
        const lophocphan = [];
        const objectDuplicate = {};
        data.forEach((f, key) => {
            if (key !== 0 && key !== 1) {
                f[7] = f[7] ? f[7].toString().trim() : null;
                const mahp = f[1];
                let kyhieu = null;
                let class_name = '';
                if (f[2].trim().indexOf('(') !== -1) {
                    kyhieu = f[2] ? f[2].trim().replace(/^([^(]+)/g, '').replace(/\(|\)/gi, "").replace(/\s+/g, '').toUpperCase() : null;
                    class_name = f[2] ? f[2].trim().replace(/\(([^)]+)\)/g, '').trim().concat("(", kyhieu, ")") : class_name;
                    const index = kyhieu.indexOf('TH');
                }

                const key_lop = this.helperService.slugVietnamese(f[2]);

                if (!objectDuplicate[key_lop]) {
                    objectDuplicate[key_lop] = { ...f };
                    const index_user = f[7] ? this.list_teacher.findIndex(m => m.username.toLowerCase() === f[7].trim().toLowerCase()) : -1
                    const object = {
                        index_: key + 1,
                        name: class_name,
                        mahp: mahp,
                        kyhieu: kyhieu,
                        sotinchi: f[4],
                        slug: this.helperService.slugVietnamese(f[2].trim()),
                        status: 1,
                        manager_ids: index_user !== -1 ? "|" + this.list_teacher[index_user].id.toString() + "|" : null,
                        manager_info: index_user !== -1 ? this.list_teacher[index_user].display_name.concat('*') : null,
                        khoa: f[3] ? f[3].trim().replace(/\D/gi, '') : '',
                        dothoc: f[5],
                        sosv_dangky: null,
                        image: null,
                        hocky: f[6],
                        namhoc: null,
                        email: index_user !== -1 ? this.list_teacher[index_user].email : null,
                        mahp_slug: mahp,
                        name_giaovien: index_user !== -1 ? this.list_teacher[index_user].display_name : null,
                        khoa_bomon: null,
                        status_import: 0
                    }

                    lophocphan.push(object);
                }
            }
        })

        this.list_lophoc = lophocphan;
        this.importDataSource = 'excel';
        this.hvuRequestedAcademicYear = null;
        this.search_lophoc = null;
        this.status_import_filter = null;
        this.pageImport = 0;
        this.getStatusObject();
    }

    startImportLophoc() {
        if (!this.canUseReferenceData()) {
            return;
        }

        if (!this.list_lophoc.length) {
            this.notificationService.toastWarning("Không có bản ghi nào cần import");
            return;
        }

        if (this.importDataSource === 'hvu-api') {
            const academicYears = [...new Set(
                this.list_lophoc.map(
                    lophoc => lophoc.namhoc ? lophoc.namhoc.toString() : ''
                )
            )];

            if (academicYears.length !== 1 || academicYears[0] !== this.hvuRequestedAcademicYear) {
                this.notificationService.toastWarning(
                    "Dữ liệu HVU không đồng nhất với năm học đã tải, không thể import"
                );
                return;
            }

        }

        const today = new Date();
        const year = today.getFullYear();
        this.arrayYear = [
            { value: Number(year - 1).toString().concat('_', year.toString()) },
            { value: year.toString().concat('_', Number(year + 1).toString()) }
        ];

        this.selectedYear = null;
        this.modalService.open(this.templateChooseExcel, NORMAL_MODAL_OPTIONS);
    }

    clearDataImport() {
        this.selectedYear = null;
    }

    close(d) {
        this.clearDataImport();
        d(true);
    }

    openImportClass(year: string, d) {
        this.selectedYear = year;
        this.notificationService.confirm('Bạn có chắc chắn bắt đầu '.concat(!this.ghi_de ? 'Import?' : 'Ghi đè?'), 'Xác nhận', [BUTTON_YES, BUTTON_NO]).then(a => {
            if (a.name === 'yes') {
                const classRequests: Observable<ImportClassResult>[] = [];

                this.list_lophoc.forEach(f => {
                    const data_class: Classes = {
                        name: f.name,
                        slug: f.slug,
                        course_id: f['course_id'] ? f['course_id'] : 0,
                        course_info: null,
                        user_id: 0,
                        manager_ids: f.manager_ids,
                        manager_info: f.manager_info,
                        status: f.status,
                        hocky: f.hocky,
                        namhoc: this.selectedYear,
                        kyhieu: f.kyhieu,
                        sotinchi: f.sotinchi,
                        category_id: f['category_id'] ? f['category_id'] : 0,
                        khoa: f.khoa ? f.khoa : '0',
                        nganh_bomon_id: 0,
                        sync_class_id: f['sync_class_id'] ? f['sync_class_id'] : 0
                    }

                    if (data_class.kyhieu && f.mahp_slug) {
                        classRequests.push(this.requestLopHoc(data_class, f));
                    }
                })

                const totalQualified = classRequests.length;
                d(true);

                if (totalQualified === 0) {
                    this.show_return = false;
                    this.progressValue = 0;
                    this.displayModal = false;
                    this.import_return = 0;
                    this.totalImportItems = 0;
                    this.notificationService.toastWarning("Không có lớp học đủ điều kiện để import");
                    return;
                }

                const request: Observable<ImportClassResult>[][] = [];
                for (let i = 0; i < totalQualified; i += 2) {
                    request.push(classRequests.slice(i, i + 2));
                }

                this.show_return = true;
                this.progressValue = 0;
                this.displayModal = true;
                this.import_return = 0;
                this.totalImportItems = totalQualified;
                this.waitting_title = "Đang đồng bộ lớp học, vui lòng không tắt trình duyệt";

                this.loopAddLopHoc(0, request).pipe(
                    finalize(() => {
                        this.displayModal = false;
                        this.getStatusObject();
                    })
                ).subscribe({
                    next: (results) => this.showImportResult(results),
                    error: () => this.notificationService.toastError(
                        "Quá trình import bị gián đoạn, vui lòng thử lại"
                    )
                })
            }
        })
    }

    requestLopHoc(data_class, f: data_lophoc): Observable<ImportClassResult> {
        f.import_label = null;

        return this.elnKhoaHocService.getElnKhoaHocByColCondition('maso', f.mahp_slug.toString().trim().toUpperCase()).pipe(
            mergeMap(_course => {
                if (!_course[0]) {
                    return of(this.createImportResult(f, 'failed', "Không tìm thấy môn học tương ứng"));
                }

                data_class.course_id = _course[0].id;
                data_class.nganh_bomon_id = _course[0].nganh_bomon_id;
                data_class.category_id = _course[0].category_ids;

                return this.classesService.getDataClassesByCol('slug', data_class.slug).pipe(
                    mergeMap(_class => {
                        if (_class.length) {
                            if (!this.ghi_de) {
                                return of(this.createImportResult(f, 'skipped', "Lớp học đã tồn tại, không chọn ghi đè"));
                            }

                            return this.classesService.updateDataClasses(_class[0].id, data_class).pipe(
                                map(() => this.createImportResult(f, 'success')),
                                catchError(() => of(this.createImportResult(f, 'failed', "Cập nhật lớp học thất bại")))
                            )
                        }

                        return this.classesService.createDataClasses(data_class).pipe(
                            map(() => this.createImportResult(f, 'success')),
                            catchError(() => of(this.createImportResult(f, 'failed', "Tạo lớp học thất bại")))
                        )
                    }),
                    catchError(() => of(this.createImportResult(f, 'failed', "Kiểm tra lớp học tồn tại thất bại")))
                )
            }),
            catchError(() => of(this.createImportResult(f, 'failed', "Tra cứu môn học thất bại")))
        )
    }

    private createImportResult(
        row: data_lophoc,
        status: ImportClassStatus,
        reason?: string
    ): ImportClassResult {
        row.status_import = status === 'success' ? 1 : status === 'failed' ? -1 : 0;
        row.import_result_status = status;
        row.import_label = reason || null;
        return { status, row, reason };
    }

    private showImportResult(results: ImportClassResult[]) {
        const success = results.filter(result => result.status === 'success').length;
        const failed = results.filter(result => result.status === 'failed').length;
        const skipped = results.filter(result => result.status === 'skipped').length;
        const summary = `Thành công: ${success}, thất bại: ${failed}, bỏ qua: ${skipped}`;

        if (failed === 0 && skipped === 0) {
            this.notificationService.toastSuccess(`Đã hoàn thành import. ${summary}`);
            return;
        }

        this.notificationService.toastWarning(`Đã hoàn thành import. ${summary}`);
    }

    returnValueWaiting(): string {
        return this.import_return.toString().concat("/", this.totalImportItems.toString());
    }

    loopAddLopHoc(
        key: number,
        group_obs: Observable<ImportClassResult>[][],
        results: ImportClassResult[] = []
    ): Observable<ImportClassResult[]> {
        if (!group_obs[key] || !group_obs[key].length) {
            return of(results);
        }

        return forkJoin(group_obs[key]).pipe(
            mergeMap(groupResults => {
                const allResults = results.concat(groupResults);
                this.import_return = Math.min(
                    this.import_return + groupResults.length,
                    this.totalImportItems
                );
                this.progressValue = this.totalImportItems
                    ? Math.min(this.import_return / this.totalImportItems * 100, 100)
                    : 0;

                if (group_obs[key + 1] && group_obs[key + 1].length) {
                    return this.loopAddLopHoc(key + 1, group_obs, allResults);
                }

                this.progressValue = 100;
                return of(allResults);
            })
        )
    }


    /**Chỉnh lại mã lớp, đang không dùng đến*/

    convertDataLophocphan(data) {
        const condition: ConditionOption = {
            condition: [],
            set: [
                { label: 'limit', value: '-1' },
            ],
            page: null
        }
        forkJoin([
            this.classesService.getClassesByPageNew(condition),
            this.elnKhoaHocService.getKhoaHocByPageNew_2(condition),
        ]).subscribe({
            next: ([_class, _course]) => {
                _class.data.forEach(f => {
                    const index_course = _course.data.findIndex(m => m.id === f.course_id);
                    if (index_course !== -1) {
                        f["ma_course"] = _course.data[index_course].maso;
                    }
                })

                const request: Observable<any>[][] = [];

                const data_class = [];

                const no_filter = [];

                let j = 0;

                request[j] = [];

                data.forEach(f => {
                    if (f[9] && f[11] && f[10]) {
                        const class_name = f[10].trim().concat("(251-", f[11].trim().replace(/\s+/g, ''), ")");
                        const ma_lop = f[11].trim();
                        const slug_class = this.helperService.slugVietnamese(class_name);
                        const index = _class.data.findIndex(m => m.kyhieu.toLowerCase() === ma_lop.toLowerCase());
                        if (index !== -1) {
                            if (request[j].length < 6) {
                                request[j].push(this.classesService.updateDataClasses(_class.data[index].id, { kyhieu: '251-'.concat(f[11].trim().replace(/\s+/g, '')), slug: this.helperService.slugVietnamese(class_name), name: class_name }));
                            } else {
                                j = j + 1;
                                request[j] = [];
                                request[j].push(this.classesService.updateDataClasses(_class.data[index].id, { kyhieu: '251-'.concat(f[11].trim().replace(/\s+/g, '')), slug: this.helperService.slugVietnamese(class_name), name: class_name }));
                            }
                            data_class.push({ id: _class.data[index].id, name: class_name, kyhieu: '251-'.concat(f[11].trim().replace(/\s+/g, '')), slug: this.helperService.slugVietnamese(class_name) })
                        } else {
                            no_filter.push({ lop: f[9] });
                        }
                    }
                })

                no_filter.splice(0, 1);

                if (request.length) {
                    this.displayModal = true;
                    this.progressValue = 0;
                    this.import_return = 0;
                    this.totalImportItems = request.reduce((total, group) => total + group.length, 0);
                    this.loopAddLopHoc(0, request).subscribe({
                        next: () => {
                            this.displayModal = false;
                        },
                        error: () => {

                        }
                    })
                }
            },
            error: () => {

            }
        })
    }

    //*** */

    startGetClassFromDkSys() {
        if (!this.canUseReferenceData()) {
            return;
        }

        if (this.classFilter.namhoc && this.classFilter.hocky && this.classFilter.nien_khoa && this.classFilter.nien_khoa !== '') {
            const hvuStartYear = Number(this.classFilter.namhoc);
            const requestedAcademicYear = hvuStartYear.toString().concat('_', (hvuStartYear + 1).toString());
            const data = {
                nien_khoa: this.classFilter.nien_khoa,
                nhhk: parseInt(this.classFilter.namhoc.toString().concat(this.classFilter.hocky.toString()))
            }

            this.notificationService.isProcessing(true);
            this.hvuApiDanhsachlophocphanService.getHvuApiDanhsachlophocphanBybody(data).pipe(mergeMap(_res_class => {
                const ma_mon_hocs = _res_class.map(m => m.ma_mon_hoc);
                const ma_gv = _res_class.map(m => m.ma_gv).filter(m => m);
                const ma_tg = _res_class.map(m => m.ma_tg).filter(m => m);

                const user_names = ma_gv.concat(ma_tg).join(";").split(";");

                const condition_monhoc: ConditionOption = {
                    condition: [],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'include', value: [... new Set(ma_mon_hocs)].toString() },
                        { label: 'include_by', value: 'maso' }
                    ],
                    page: null
                }

                const condition_teacher: ConditionOption = {
                    condition: [],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'include', value: [... new Set(user_names)].toString() },
                        { label: 'include_by', value: 'username' }
                    ],
                    page: null
                }

                return forkJoin([
                    this.elnKhoaHocService.getKhoaHocByPageNew_2(condition_monhoc),
                    this.userService.getUserByPageNew(condition_teacher)
                ]).pipe(mergeMap(([_monhoc, _teacher]) => {
                    _res_class.forEach(f => {

                        f['course_id'] = 0;

                        f['category_id'] = 0;

                        f['mahp'] = null;
                        const index_monhoc = _monhoc.data.findIndex(m => m.maso === f.ma_mon_hoc);
                        if (index_monhoc !== -1) {
                            f['course_id'] = _monhoc.data[index_monhoc].id;
                            f['category_id'] = _monhoc.data[index_monhoc].category_ids;
                            f['mahp'] = _monhoc.data[index_monhoc].maso;
                        }

                        const manager_keys = [
                            ...(f.ma_gv || '').split(';'),
                            ...(f.ma_tg || '').split(';')
                        ].map(m => m.trim()).filter(m => m);

                        const manager_ids = [];
                        const manager_names = [];

                        manager_keys.forEach(c => {
                            const teacher = _teacher.data.find(m => m.username === c);
                            if (teacher && !manager_ids.includes(teacher.id)) {
                                manager_ids.push(teacher.id);
                                manager_names.push(teacher.display_name);
                            }
                        })

                        f['manager_ids'] = manager_ids.length ? "|".concat(manager_ids.join("|"), "|") : null;
                        f['name_giaovien'] = manager_names.length ? manager_names[0] : null;
                        f['manager_info'] = manager_names.length
                            ? manager_names.map((name, key) => key === 0 ? name.concat('*') : name).join(',')
                            : null;
                    })
                    return of(_res_class)
                }))
            })).subscribe({
                next: (_class_api) => {

                    const data = [];

                    _class_api.forEach((f, key) => {
                        const hvuAcademicYearStart = Number(f.nam_hoc);
                        const academicYear = Number.isFinite(hvuAcademicYearStart)
                            ? hvuAcademicYearStart.toString().concat('_', (hvuAcademicYearStart + 1).toString())
                            : '';
                        const kyhieu = f.nam_hoc.toString().slice(2).concat(f.hoc_ky.toString(), "-", f.ma_mon_hoc, "-", f.nhom_to);
                        const className = f.ten_mon_hoc.concat(" - Nhóm ", f.nhom_to, "(", kyhieu, ")")
                        const object = {
                            index_: key + 1,
                            sync_class_id: f.id_lop,
                            name: className,
                            mahp: f['mahp'],
                            kyhieu: kyhieu,
                            sotinchi: f.so_tin_chi,
                            slug: this.helperService.slugVietnamese(className),
                            mahp_slug: f['mahp'],
                            status: 1,
                            manager_ids: f['manager_ids'],
                            manager_info: f['manager_info'],
                            dothoc: 0,
                            hocky: f.hoc_ky,
                            namhoc: academicYear,
                            name_giaovien: f['name_giaovien'],
                            status_import: 0,
                            nganh_bomon_id: 0,
                            category_id: f['category_id'],
                            course_id: f['course_id'],
                            khoa: f.khoa ? f.khoa.trim().replace(/\D/gi, '') : ''
                        }
                        data.push(object);
                    })

                    this.list_lophoc = data;
                    this.importDataSource = 'hvu-api';
                    this.hvuRequestedAcademicYear = requestedAcademicYear;
                    this.search_lophoc = null;
                    this.status_import_filter = null;
                    this.pageImport = 0;
                    this.getStatusObject();

                    this.notificationService.isProcessing(false);

                    this.displaySyncClass = false;
                },
                error: (error) => {
                    console.log(error);
                    this.notificationService.isProcessing(false);
                    this.notificationService.toastError("Lấy dữ liệu thất bại, vui lòng thử lại");
                }
            })
        } else {
            this.notificationService.toastWarning("Vui lòng điền đầy đủ thông tin có dấu *")
        }
    }
}
