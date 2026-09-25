import { readImportFile } from '../../read-import-file';
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
import { HttpParams } from '@angular/common/http';
import { catchError, concatMap, finalize, forkJoin, from, map, mergeMap, Observable, of, Subject, takeUntil } from 'rxjs';
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
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { ClassesService, LOPHOCPHAN_ICTU } from '@modules/shared/services/classes.service';

export interface data_lophoc {
    index_: number;
    name: string;
    mahp: string;
    kyhieu: string;
    sotinchi: string;
    slug: string;
    status: number;
    manager_ids: string;
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
    duplicate?: string;
    sync_class_id?: string;
    course_id?: number;
    course_info?: { title: string } | any;
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
        CheckboxModule
    ],
    templateUrl: './import-lophoc.component.html',
    styleUrls: ['./import-lophoc.component.css']
})
export class ImportLophocComponent implements OnInit {
    @ViewChild('inputImport') inputImport: ElementRef;

    @ViewChild('templateChooseExcel') templateChooseExcel: ElementRef;

    @ViewChild('templateSyncIctu') templateSyncIctu: ElementRef;

    ghi_de: boolean = false;

    /** Đồng bộ từ API ICTU */
    syncYear: string;
    syncSemester: number;
    syncDot: string;
    syncYears: { label: string, value: string }[] = [];
    syncSemesters: number[] = [1, 2, 3];
    syncDots: number[] = [1, 2, 3];

    waitting_title: string = "Đồng bộ dữ liệu";

    progressValue: number = 0;

    displayModal: boolean = false;

    list_lophoc: data_lophoc[] = [];

    search_lophoc: string;

    status_object = {
        no_import: 0,
        import_done: 0,
        import_fail: 0
    }

    status_import_filter: number;

    pageImport: number = 0;

    list_donvi: DonVi[];

    list_teacher: User[];

    arrayYear = [];

    selectedYear: string;

    show_return: boolean = false;

    import_return: number;

    ictuSynced: boolean = false;

    /** Huỷ subscription lookup môn học khi chọn file Excel mới */
    private lookupDestroy$ = new Subject<void>();

    missingCourses: { stt: number; maMon: string; tenLop: string; hocky: string; namhoc: string; dot: number }[] = [];

    missingTeachers: { stt: number; email: string; maGV: string; tenLop: string; hocky: string; namhoc: string; dot: number }[] = [];

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
        private classesService: ClassesService
    ) { }

    ngOnInit(): void {
        this.auth.setFeatureSecondary("Đồng bộ dữ liệu - Lớp học");
        this.initLoad();
        this.generateSyncYears();
    }

    private generateSyncYears() {
        const y = new Date().getFullYear();
        this.syncYears = [];
        for (let i = y - 3; i <= y + 1; i++) {
            const label = `${i}-${i + 1}`;
            this.syncYears.push({ label, value: label });
        }
        this.syncYear = this.syncYears[this.syncYears.length - 2]?.value; // mặc định năm hiện tại
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
                    _role.data.forEach((f) => {
                        objectRoles[f.name] = f;
                    });

                    this.notificationService.isProcessing(false);

                    resolve(objectRoles);
                },
                error: () => {
                    this.notificationService.isProcessing(false);
                    this.notificationService.toastError(
                        'Lỗi kết nối, vui lòng thử lại, hoặc liên hệ với kỹ thuật viên nếu thử lại không thành công'
                    );
                    resolve(null);
                },
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

        this.notificationService.isProcessing(true);

        const objectRoles = await this.getRolesPromise();

        const ids_roles = [];

        Object.keys(objectRoles).forEach((f) => {
            ids_roles.push(objectRoles[f].id);
        });

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
        ]).pipe(
            finalize(() => this.notificationService.isProcessing(false))
        ).subscribe({
            next: ([_donvi, _teacher]) => {
                this.list_donvi = _donvi.data;
                this.list_teacher = _teacher.data;
            },
            error: () => {

            }
        })
    }

    getStatusObject() {
        this.status_object = {
            no_import: this.list_lophoc.filter(m => m['status_import'] === 0).length,
            import_done: this.list_lophoc.filter(m => m['status_import'] === 1).length,
            import_fail: this.list_lophoc.filter(m => m['status_import'] === -1).length
        }
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
        this.fileService.getFileContent('..\\assets\\files\\mau_file_import_LMS-LCMS\\Mau 05 - Import danh sach lop hoc phan.xlsx').subscribe(res => {
            saveAs(res, 'Mau 05 - Import danh sach lop hoc phan.xlsx');
        });
    }

    exportErrorExcel() {
        if (!this.missingCourses.length && !this.missingTeachers.length) {
            this.notificationService.toastWarning("Không có dữ liệu lỗi để xuất");
            return;
        }
        const wb = XLSX.utils.book_new();

        // Sheet 1: Môn học không có trên hệ thống
        const ws1Data: any[][] = [
            ['STT', 'Mã môn', 'Tên lớp', 'Học kỳ', 'Năm học', 'Đợt']
        ];
        this.missingCourses.forEach(c => {
            ws1Data.push([c.stt, c.maMon, c.tenLop, c.hocky, c.namhoc, c.dot]);
        });
        const ws1 = XLSX.utils.aoa_to_sheet(ws1Data);
        XLSX.utils.book_append_sheet(wb, ws1, 'Môn học không có trên HT');

        // Sheet 2: Giảng viên không có trên hệ thống
        const ws2Data: any[][] = [
            ['STT', 'Email GV', 'Mã GV', 'Tên lớp', 'Học kỳ', 'Năm học', 'Đợt']
        ];
        this.missingTeachers.forEach(t => {
            ws2Data.push([t.stt, t.email, `'${t.maGV || ''}`, t.tenLop, t.hocky, t.namhoc, t.dot]);
        });
        const ws2 = XLSX.utils.aoa_to_sheet(ws2Data);
        XLSX.utils.book_append_sheet(wb, ws2, 'GV không có trên HT');

        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/octet-stream' });
        saveAs(blob, `Loi_dong_bo_ICTU_${this.syncYear}_HK${this.syncSemester}.xlsx`);
    }

    triggerImport() {
        this.inputImport.nativeElement.value = '';
        this.list_lophoc = [];
        // Huỷ lookup cũ (nếu đang chạy) trước khi chọn file mới
        this.lookupDestroy$.next();
        this.inputImport.nativeElement.click();
    }

    changeInputImport(event) {
        if (event.target.files[0]) {
            const file = event.target.files[0];
            if (this.helperService.checkTypeFile(['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'], file.type)) {
                readImportFile(file, this.notificationService, 'arrayBuffer', (localUrl) => {
                    const wb: XLSX.WorkBook = XLSX.read(localUrl, { type: 'binary' });
                    const wsname: string = wb.SheetNames[0];
                    const ws: XLSX.WorkSheet = wb.Sheets[wsname];
                    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
                    const newData = data.filter(f => f[1] && f[2] && f[5] && f[6] && f[7] && f[8] && f[9]);

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
        const mahpSet = new Set<string>();

        data.forEach((f, key) => {
            if (key !== 0 && key !== 1) {
                f[15] = f[15] ? f[15].toLowerCase() : null;
                const mahp = f[1];
                let kyhieu = null;
                if (f[2].trim().indexOf('(') !== -1) {
                    kyhieu = f[2] ? f[2].trim().split("(")[1].replace(")", "") : null;
                    const index = kyhieu.indexOf('TH');
                }
                if (f[10].trim().toLowerCase() === 'lt') {
                    const key_lop = this.helperService.slugVietnamese(f[2]);
                    if (!objectDuplicate[key_lop]) {
                        objectDuplicate[key_lop] = { ...f };

                        const index_user = f[15] ? this.list_teacher.findIndex(m => m.email.toLowerCase() === f[15].trim().toLowerCase()) : -1

                        const object = {
                            index_: key + 1,
                            name: f[2] ? f[2].trim() : null,
                            mahp: mahp,
                            kyhieu: kyhieu,
                            sotinchi: f[6],
                            slug: this.helperService.slugVietnamese(f[2].trim()),
                            status: 1,
                            manager_ids: index_user !== -1 ? "|" + this.list_teacher[index_user].id.toString() + "|" : null,
                            manager_info: index_user !== -1 ? this.list_teacher[index_user].display_name.concat('*') : null,
                            khoa: f[5] ? f[5].trim().replace(/\D/gi, '') : '',
                            dothoc: f[7],
                            sosv_dangky: f[9],
                            image: null,
                            hocky: f[8],
                            namhoc: null,
                            email: f[15] ? f[15].trim().toLowerCase() : null,
                            mahp_slug: mahp,
                            name_giaovien: f[3],
                            khoa_bomon: f[4] ? f[4].trim() : null,
                            course_id: 0,
                            course_info: null,
                            status_import: 0
                        }

                        if (mahp) mahpSet.add(mahp.toString().trim().toUpperCase());
                        lophocphan.push(object);
                    }
                }
            }
        })

        this.list_lophoc = lophocphan;
        this.getStatusObject();

        const maMonArr = Array.from(mahpSet);
        if (!maMonArr.length) {
            this.notificationService.isProcessing(false);
            return;
        }

        // Tra cứu môn học theo mã (giống luồng ICTU) để gán course_id
        this.waitting_title = "Đang tải thông tin môn học...";
        this.progressValue = 0;
        this.displayModal = true;
        this.show_return = false;
        this.lookupCoursesForExcel(maMonArr);
    }

    private lookupCoursesForExcel(maMonArr: string[]) {
        const batchSize = 20;
        const batches: string[][] = [];
        for (let i = 0; i < maMonArr.length; i += batchSize) {
            batches.push(maMonArr.slice(i, i + batchSize));
        }

        const courseMap = new Map<string, ElnKhoaHoc>();
        let batchIdx = 0;

        from(batches).pipe(
            takeUntil(this.lookupDestroy$),
            concatMap((batch: string[]) => {
                const params = new HttpParams()
                    .set('include', batch.toString())
                    .set('include_by', 'maso')
                    .set('limit', '-1');
                return this.elnKhoaHocService.getElnKhoaHocByCols(params).pipe(
                    catchError(() => of([] as ElnKhoaHoc[])),
                    map((results: ElnKhoaHoc[]) => {
                        if (results) {
                            results.forEach((c: ElnKhoaHoc) => {
                                if (c.maso) courseMap.set(c.maso.toUpperCase(), c);
                            });
                        }
                        batchIdx++;
                        this.progressValue = Math.min(batchIdx / batches.length * 100, 100);
                        return courseMap;
                    })
                );
            })
        ).subscribe({
            complete: () => {
                this.displayModal = false;
                this.notificationService.isProcessing(false);

                let missingCount = 0;
                this.list_lophoc.forEach(l => {
                    const course = l.mahp ? courseMap.get(l.mahp.toString().trim().toUpperCase()) : null;
                    if (course) {
                        l.course_id = course.id;
                        l.course_info = { title: course.title });
            } else {
                        l.course_id = 0;
                        l.course_info = null;
                        l.status_import = -1;
                        missingCount++;
                    }
                });

                this.getStatusObject();
                if (missingCount > 0) {
                    this.notificationService.toastWarning(`Có ${missingCount} lớp không tìm thấy môn học trên hệ thống`);
                }
            },
            error: () => {
                this.displayModal = false;
                this.notificationService.isProcessing(false);
                this.notificationService.toastError("Lỗi tra cứu môn học, vui lòng thử lại");
            }
        });
    }

    openSyncModal() {
        this.syncYear = null;
        this.syncSemester = null;
        this.syncDot = null;
        this.modalService.open(this.templateSyncIctu, NORMAL_MODAL_OPTIONS);
    }

    syncFromIctu(d: any) {
        if (!this.syncYear || !this.syncSemester) {
            this.notificationService.toastWarning("Vui lòng nhập năm học và học kỳ");
            return;
        }
        d(true);
        this.notificationService.isProcessing(true);
        this.classesService.getClassesByIctu(this.syncYear, this.syncSemester, this.syncDot || '').subscribe({
            next: (ictuData) => {
                if (ictuData && ictuData.length) {
                    // Lọc LT, dedup, lấy danh sách mã môn học unique
                    const uniqueMap = new Map<string, LOPHOCPHAN_ICTU>();
                    ictuData.forEach(f => {
                        if (f.LopTH !== 'LT') return;
                        const key_lop = this.helperService.slugVietnamese(f.TenHP);
                        if (!uniqueMap.has(key_lop)) uniqueMap.set(key_lop, f);
                    });
                    const filtered = Array.from(uniqueMap.values());

                    // Gom mã môn học để tra cứu
                    const maMonSet = new Set<string>();
                    filtered.forEach(f => { if (f.MaMonhoc) maMonSet.add(f.MaMonhoc.trim().toUpperCase()); });
                    const maMonArr = Array.from(maMonSet);

                    if (!maMonArr.length) {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastWarning("Không có lớp lý thuyết để đồng bộ");
                        return;
                    }

                    // Tra cứu thông tin môn học — batch 6 cái cùng lúc
                    this.notificationService.isProcessing(false);
                    this.waitting_title = "Đang tải thông tin môn học...";
                    this.progressValue = 0;
                    this.displayModal = true;
                    this.show_return = false;
                    this.syncCourseInBatches(maMonArr, filtered);
                } else {
                    this.notificationService.isProcessing(false);
                    this.notificationService.toastWarning("Không có dữ liệu từ ICTU");
                }
            },
            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError("Lỗi kết nối ICTU, vui lòng thử lại");
            }
        });
    }

    private syncCourseInBatches(
        maMonArr: string[],
        filtered: LOPHOCPHAN_ICTU[]
    ) {
        const batchSize = 20;
        const batches: string[][] = [];
        for (let i = 0; i < maMonArr.length; i += batchSize) {
            batches.push(maMonArr.slice(i, i + batchSize));
        }

        const courseMap = new Map<string, ElnKhoaHoc>();

        from(batches).pipe(
            takeUntil(this.lookupDestroy$),
            concatMap((batch: string[]) => {
                const params = new HttpParams()
                    .set('include', batch.toString())
                    .set('include_by', 'maso')
                    .set('limit', '-1');
                return this.elnKhoaHocService.getElnKhoaHocByCols(params).pipe(
                    catchError(() => of([] as ElnKhoaHoc[])),
                    map((results: ElnKhoaHoc[]) => {
                        if (results) {
                            results.forEach((c: ElnKhoaHoc) => {
                                if (c.maso) courseMap.set(c.maso.toUpperCase(), c);
                            });
                        }
                        this.progressValue = Math.min((batches.indexOf(batch) + 1) / batches.length * 100, 100);
                        return courseMap;
                    })
                );
            })
        ).subscribe({
            complete: () => {
                this.displayModal = false;
                this.convertIctuData(filtered, courseMap);
                this.notificationService.toastSuccess(`Đã tải ${filtered.length} lớp học từ ICTU`);
            }
        });
    }

    private convertIctuData(data: LOPHOCPHAN_ICTU[], courseMap: Map<string, ElnKhoaHoc>) {
        const lophocphan: data_lophoc[] = [];
        this.missingCourses = [];
        this.missingTeachers = [];
        this.ictuSynced = true;

        const hocky = data[0]?.Hocky?.toString() || '';
        const namhoc = data[0]?.Namhoc ? data[0].Namhoc.replace('-', '_') : (this.syncYear || '');
        const dothoc = data[0]?.Dot || 0;

        data.forEach((f, key) => {
            // Tra thông tin môn học
            const course = f.MaMonhoc ? courseMap.get(f.MaMonhoc.toUpperCase()) : null;
            let khoa_bomon = '';
            if (course) {
                // Tìm khoa/bộ môn từ category_ids
                if (course.category_ids && this.list_donvi) {
                    const dv = this.list_donvi.find(d => d.id === course.category_ids);
                    khoa_bomon = dv ? dv.title : '';
                }
            } else {
                khoa_bomon = 'Không tìm thấy môn học này trên hệ thống (' + f.MaMonhoc + ')';
                if (f.MaMonhoc) {
                    this.missingCourses.push({
                        stt: this.missingCourses.length + 1,
                        maMon: f.MaMonhoc,
                        tenLop: f.TenHP?.trim() || '',
                        hocky: hocky,
                        namhoc: namhoc,
                        dot: dothoc
                    });
                }
            }

            // Parse ký hiệu từ MaLopHP: lấy phần trong ngoặc đơn (nếu có)
            let kyhieu: string = null;
            const openIdx = f.MaLopHP?.indexOf('(');
            if (openIdx !== -1 && openIdx !== undefined) {
                kyhieu = f.MaLopHP.substring(openIdx + 1).replace(')', '').trim();
            }

            // Parse giảng viên từ MaGV + MaTG: "email1_magv1;email2_magv2"
            const manager_ids_arr: number[] = [];
            const manager_names_arr: string[] = [];
            let hasTeacherData = false;
            const rawTeacherNames: string[] = [];

            const findTeacher = (email: string): { id: number; name: string } | null => {
                const idx = this.list_teacher.findIndex(t => t.email.toLowerCase() === email.trim().toLowerCase());
                return idx !== -1 ? { id: this.list_teacher[idx].id, name: this.list_teacher[idx].display_name } : null;
            };

            const collectMissingTeacher = (email: string, rawName: string, fullPart: string) => {
                if (!email) return;
                const exists = this.list_teacher.some(t => t.email.toLowerCase() === email.trim().toLowerCase());
                if (!exists) {
                    this.missingTeachers.push({
                        stt: this.missingTeachers.length + 1,
                        email: email,
                        maGV: rawName,
                        tenLop: f.TenHP?.trim() || '',
                        hocky: hocky,
                        namhoc: namhoc,
                        dot: dothoc
                    });
                }
            };

            // GV chính từ MaGV — GV đầu tiên đánh dấu *
            if (f.MaGV) {
                const gvParts = f.MaGV.split(';').filter(Boolean);
                hasTeacherData = hasTeacherData || gvParts.length > 0;
                gvParts.forEach((part, i) => {
                    const email = part.split('_')[0];
                    const rawName = part.split('_')[1] || email;
                    rawTeacherNames.push(rawName);
                    collectMissingTeacher(email, rawName, part);
                    if (email) {
                        const teacher = findTeacher(email);
                        if (teacher) {
                            manager_ids_arr.push(teacher.id);
                            manager_names_arr.push(i === 0 ? `${teacher.name}*` : teacher.name);
                        }
                    }
                });
            }

            // Trợ giảng từ MaTG
            if (f.MaTG) {
                const tgParts = f.MaTG.split(';').filter(Boolean);
                hasTeacherData = hasTeacherData || tgParts.length > 0;
                tgParts.forEach(part => {
                    const email = part.split('_')[0];
                    const rawName = part.split('_')[1] || email;
                    rawTeacherNames.push(rawName);
                    collectMissingTeacher(email, rawName, part);
                    if (email) {
                        const teacher = findTeacher(email);
                        if (teacher) {
                            manager_ids_arr.push(teacher.id);
                            manager_names_arr.push(teacher.name);
                        }
                    }
                });
            }

            let name_giaovien: string;
            if (!hasTeacherData) {
                name_giaovien = 'Chưa có giảng viên';
            } else if (!manager_names_arr.length) {
                name_giaovien = 'GV không có trên hệ thống (' + rawTeacherNames.filter((v, i, a) => a.indexOf(v) === i).join(', ') + ')';
            } else {
                name_giaovien = manager_names_arr.join(', ');
            }

            const object: data_lophoc = {
                index_: key + 1,
                name: f.TenHP?.trim() || null,
                mahp: f.MaMonhoc,
                kyhieu: kyhieu,
                sotinchi: f.SOTC?.toString() || '',
                slug: this.helperService.slugVietnamese(f.TenHP?.trim() || ''),
                status: 1,
                manager_ids: manager_ids_arr.length ? '|' + manager_ids_arr.join('|') + '|' : null,
                manager_info: manager_names_arr.length ? manager_names_arr.join(', ') : null,
                khoa: f.Khoa_hoc || '',
                dothoc: f.Dot || 0,
                sosv_dangky: 0,
                image: null,
                hocky: f.Hocky?.toString() || '',
                namhoc: f.Namhoc ? f.Namhoc.replace('-', '_') : this.syncYear,
                email: null,
                mahp_slug: f.MaMonhoc,
                name_giaovien: name_giaovien,
                khoa_bomon: khoa_bomon,
                sync_class_id: f.ID_LopHP?.toString(),
                course_id: course?.id || 0,
                course_info: course ? { title: course.title } : null,
                status_import: 0
            };
            lophocphan.push(object);
        });

        this.list_lophoc = lophocphan;
        this.getStatusObject();
    }

    startImportLophoc() {
        if (this.list_lophoc) {
            // Nếu dữ liệu từ ICTU → bỏ qua chọn năm + confirm
            if (this.list_lophoc.some(l => l.sync_class_id && l.sync_class_id !== '0')) {
                this.selectedYear = this.list_lophoc[0].namhoc;
                this.runImport(this.selectedYear);
                return;
            }
            const today = new Date();
            const year = today.getFullYear();
            const dataYear = [
                { value: Number(year - 1).toString().concat('_', year.toString()) },
                { value: year.toString().concat('_', Number(year + 1).toString()) }
            ]
            this.arrayYear = dataYear;
            this.selectedYear = null;
            this.modalService.open(this.templateChooseExcel, NORMAL_MODAL_OPTIONS);
        } else {
            this.notificationService.toastWarning("Không có bản ghi nào cần import");
        }
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
                d(true);
                this.runImport(year);
            }
        })
    }

    private runImport(year: string) {
        const request: Observable<any>[][] = [];
        let i = 0;
        request[i] = [];
        let totalQualified = 0;
        this.list_lophoc.forEach(f => {
            const data_class: Classes = {
                name: f.name,
                slug: f.slug,
                course_id: f.course_id || 0,
                course_info: f.course_info ? JSON.stringify(f.course_info) : null,
                user_id: 0,
                manager_ids: f.manager_ids,
                manager_info: f.manager_info,
                status: f.status,
                hocky: f.hocky,
                namhoc: this.selectedYear,
                kyhieu: f.kyhieu,
                sotinchi: f.sotinchi,
                category_id: 0,
                khoa: f.khoa,
                dothoc: f.dothoc,
                nganh_bomon_id: 0,
                sync_class_id: f.sync_class_id || '0'
            }

            if (data_class.kyhieu && f.course_id && f.manager_ids) {
                totalQualified++;
                if (request[i].length < 2) {
                    request[i].push(this.requestLopHoc(data_class, f));
                } else {
                    i = i + 1;
                    request[i] = [];
                    request[i].push(this.requestLopHoc(data_class, f))
                }
            }
        })
        this.totalImportItems = totalQualified;

        if (totalQualified === 0) {
            this.show_return = false;
            this.progressValue = 0;
            this.import_return = 0;
            this.displayModal = false;
            this.getStatusObject();
            this.notificationService.toastWarning("Không có lớp học đủ điều kiện để import");
            return;
        }

        this.show_return = true;
        this.progressValue = 0;
        this.displayModal = true;
        this.import_return = 0;
        this.waitting_title = "Đang đồng bộ lớp học, vui lòng không tắt trình duyệt";

        if (request.length) {
            this.loopAddLopHoc(0, request).subscribe(() => {
                this.displayModal = false;
                this.getStatusObject();
                const total = this.list_lophoc.length;
                const imported = this.list_lophoc.filter(l => l.status_import === 1).length;
                const failed = this.list_lophoc.filter(l => l.status_import === -1).length;
                const skipped = this.list_lophoc.filter(l => l.status_import === 0).length;
                setTimeout(() => {
                    this.notificationService.popup(
                        '<div style="font-size:16px;line-height:1.8">'
                        + '<p style="color:#c62828;font-weight:700;font-size:18px">⚠️ KẾT QUẢ IMPORT</p>'
                        + '<hr>'
                        + '<p>✅ Đã import thành công: <b>' + imported + '</b> / ' + total + ' lớp</p>'
                        + '<p>❌ Thất bại: <b style="color:#c62828">' + failed + '</b> lớp</p>'
                        + '<p>⏸️ Chưa import: <b style="color:#e65100">' + skipped + '</b> lớp</p>'
                        + '<hr>'
                        + '<p style="color:#c62828;font-weight:600">👉 VUI LÒNG KIỂM TRA LẠI DANH SÁCH BÊN DƯỚI</p>'
                        + '<p>Các lớp thất bại hoặc chưa import thường do <b>thiếu thông tin môn học</b> hoặc <b>giảng viên chưa có trên hệ thống</b>.</p>'
                        + '<p>Hãy bổ sung dữ liệu và import lại các lớp này.</p>'
                        + '</div>',
                        'THÔNG BÁO KẾT QUẢ IMPORT'
                    );
                }, 500);
            })
        } else {
            this.notificationService.toastWarning("Không có lớp học chưa import");
        }
    }

    requestLopHoc(data_class, f): Observable<any> {
        return this.elnKhoaHocService.getElnKhoaHocByColCondition('maso', f.mahp_slug.toString().trim().toUpperCase()).pipe(
            mergeMap(_course => {
                if (_course[0]) {
                    data_class.course_id = _course[0].id;
                    data_class.nganh_bomon_id = _course[0].nganh_bomon_id;
                    data_class.category_id = _course[0].category_ids;
                } else {
                    // Không tìm thấy môn học → bỏ qua, không import
                    f.status_import = -1;
                    return of(null);
                }
                return this.classesService.getDataClassesByCol('slug', data_class.slug).pipe(mergeMap(_class => {
                    if (_class.length) {
                        if (this.ghi_de) {
                            return this.classesService.updateDataClasses(_class[0].id, data_class).pipe(
                                mergeMap(() => {
                                    f.status_import = 1;
                                    return of(null)
                                }),
                                catchError(() => {
                                    f.status_import = -1;
                                    return of(null)
                                })
                            )
                        }
                        f.status_import = 1;
                        return of(null);
                    } else {
                        return this.classesService.createDataClasses(data_class).pipe(
                            mergeMap(() => {
                                f.status_import = 1;
                                return of(null)
                            }),
                            catchError(() => {
                                f.status_import = -1;
                                return of(null)
                            })
                        )
                    }
                }))
            }),
            catchError((e) => {
                f.status_import = -1;
                return of(null)
            })
        )
    }

    returnValueWaiting(): string {
        let current_value = this.import_return;
        let total_value = this.totalImportItems || this.list_lophoc.length;
        return current_value.toString().concat("/", total_value.toString());
    }

    totalImportItems: number = 0;

    loopAddLopHoc(key: number, group_obs: Observable<any>[][]) {
        this.progressValue = (key + 1) / group_obs.length * 100;
        this.import_return = this.import_return + group_obs[key].length;
        return forkJoin(group_obs[key]).pipe(
            mergeMap(_res => {
                if (group_obs[key + 1] && group_obs[key + 1].length) {
                    return this.loopAddLopHoc(key + 1, group_obs);
                } else {
                    return of(null)
                }
            }))
    }
}
