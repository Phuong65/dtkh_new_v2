import { readImportFile } from '../../read-import-file';
import { CHUAN_DAU_RA } from './../../../../../shared/utils/syscat';
import { ElnChuyenMucService } from './../../../../../shared/services/elearning-chuyen-muc.service';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '@core/services/auth.service';
import { FileService } from '@core/services/file.service';
import { HelperService } from '@core/services/helper.service';
import { NotificationService } from '@core/services/notification.service';
import { RoleService } from '@core/services/role.service';
import { UserService } from '@core/services/user.service';
import { CourseQuestionsService } from '@modules/shared/services/course-questions.service';
import { DonViService } from '@modules/shared/services/don-vi.service';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import { CheckboxModule } from 'primeng/checkbox';
import * as XLSX from 'xlsx';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { OvicQueryCondition } from '@core/models/dto';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { ROLES } from '@modules/shared/utils/syscat';
import { catchError, forkJoin, mergeMap, Observable, of } from 'rxjs';
import { DonVi } from '@modules/shared/models/don-vi';
import { User } from '@core/models/user';
import { ElnChuyenMuc } from '@modules/shared/models/Elng';
import { SharedModule } from '@modules/shared/shared.module';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { DialogModule } from 'primeng/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { saveAs } from 'file-saver';

@Component({
    selector: 'app-import-monhoc-tueba',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, NgbTooltipModule, ButtonModule, NgbTooltipModule, CheckboxModule, SharedModule, TableModule, PaginatorModule, DialogModule, MatProgressBarModule],
    templateUrl: './import-monhoc.component.html',
    styleUrls: ['./import-monhoc.component.css']
})
export class ImportMonhocComponent implements OnInit {

    @ViewChild('inputImport') inputImport: ElementRef;

    displayModal: boolean = false;

    progressValue: number = 0;

    waitting_title: string;

    ghi_de: boolean = false;

    list_monhoc: ElnKhoaHoc[];

    list_donvi: DonVi[];

    list_teacher: User[];

    list_bomon: ElnChuyenMuc[];

    list_cdr = CHUAN_DAU_RA;

    HINHTHUCTHI = {
        THUCHANH: 'Thực hành',
        TRACNGHIEM: 'Trắc nghiệm',
        DOAN: 'Báo cáo đồ án',
        BAITAPLON: 'Bài tập lớn'
    }

    CAUTRUCDE = {
        0: 'Môn thường',
        1: 'Tiếng anh',
        2: 'Toán',
        3: 'Tiếng Trung',
        4: 'Tiếng Nhật'
    }

    status_import_filter: number;

    status_object = {
        no_import: 0,
        import_done: 0,
        import_fail: 0
    }

    search_monhoc: string;

    pageImport: number = 0;

    constructor(
        private auth: AuthService,
        private donViService: DonViService,
        private notificationService: NotificationService,
        private helperService: HelperService,
        private fileService: FileService,
        private elnKhoaHocService: ElnKhoaHocService,
        private userService: UserService,
        private roleService: RoleService,
        private courseQuestionsService: CourseQuestionsService,
        private router: Router,
        private elnChuyenMucService: ElnChuyenMucService
    ) { }

    ngOnInit(): void {
        this.auth.setFeatureSecondary("Đồng bộ dữ liệu - môn học");
        this.initLoad();
    }

    getRolesPromise(): Promise<any> {
        return new Promise((resolve, reject) => {
            const objectRoles = {};
            const roles_ = [ROLES.lanhdaokhoa, ROLES.lanhdaobomon, ROLES.manager, ROLES.chuyenvien_pdt, ROLES.phong_hssv, ROLES.giangvien];
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
                    condition: OvicQueryCondition.greaterThan,
                    value: '0',
                    orWhere: 'and',
                },
            ],

            set: [{ label: 'limit', value: '-1' }],
            page: null,
        };

        const condition_nganh_bomon: ConditionOption = {
            condition: [
                {
                    conditionName: 'status',
                    condition: OvicQueryCondition.notEqual,
                    value: '-1',
                    orWhere: 'and',
                },
            ],

            set: [{ label: 'limit', value: '-1' }],

            page: null,
        }

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

        this.notificationService.isProcessing(true);

        forkJoin([
            this.donViService.getDonviByPageNew(condition_donvi),
            this.userService.getUserByPageNew(condition_teacher),
            this.elnChuyenMucService.getChuyemucByPageNew(condition_nganh_bomon)
        ]).subscribe({
            next: ([_donvi, _teacher, _bomon]) => {
                this.list_donvi = _donvi.data;
                this.list_teacher = _teacher.data;
                this.list_bomon = _bomon.data;
                this.notificationService.isProcessing(false);
            },
            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
            }
        })
    }

    backToDongbo() {
        const activeLink = this.router.url.substring(7).split('?')[0].replace('/admin/', '');
        const url = this.router.serializeUrl(
            this.router.createUrlTree(['admin/' + activeLink])
        );
        this.router.navigateByUrl(url);
    }

    triggerImport() {
        this.inputImport.nativeElement.value = '';
        this.list_monhoc = [];
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
                    const filterData = [];
                    const object_check_duplicate = {};
                    data.forEach(f => {
                        if (f[0] && f[1] && f[2] && f[3] && f[4] && f[5]) {
                            if (f[0]) {
                                if (!object_check_duplicate[f[0].trim()]) {
                                    object_check_duplicate[f[0].trim()] = true;
                                    filterData.push(f);
                                }
                            }
                        }
                    })

                    filterData.splice(0, 1);

                    this.convertData(filterData);
                });
            } else {
                this.notificationService.toastWarning("Sai định dạng file, yêu cầu file .xlsx. Vui lòng tải file mẫu danh sách import sinh viên");
            }
        }
    }

    convertData(data) {

        const dataImport = [];

        data.forEach(f => {

            const index_donvi = f[3] && f[3].trim() ? this.list_donvi.findIndex(m => m['code'] && m.code.toLowerCase() === f[3].trim().toLowerCase().replace(/\s/g, '')) : -1;

            const index_nganh_bomon = f[4] && f[4].trim() ? this.list_bomon.findIndex(m => m['code'] && m['code'].toLowerCase() === f[4].trim().toLowerCase().replace(/\s/g, '')) : -1;

            const index_user = f[9] && f[9].toString().trim() ? this.list_teacher.findIndex(m => m.username.toString() === f[9].toString().trim()) : -1;

            const monhoc = {
                category_ids: index_donvi !== -1 ? this.list_donvi[index_donvi].id : 0,
                slug: f[1] && f[1].trim() ? this.helperService.slugVietnamese(f[1].trim()) : null,
                title: f[1] && f[1].trim() ? f[1].trim() : null,
                status: 1,
                maso: f[0] && f[0].trim() ? f[0].trim().toUpperCase().replace(/\s/g, '') : null,
                nganh_bomon_id: index_nganh_bomon !== -1 ? this.list_bomon[index_nganh_bomon].id : 0,
                av: f[8] && f[8].toString().trim() ? f[8].toString().trim() : 0,
                params: {
                    "sotinchi": f[5] && f[5].toString().trim() ? Number(f[5].toString().trim().replace(/\D/g, '')) : 0,
                    "exam_format": f[2] && f[2].toString().trim() ? this.helperService.slugVietnamese(f[2].toString().trim().replace(/\s/g, '')).replace(/W+/, '').toUpperCase() : null,
                    "cdr": f[7] && f[7].toString().trim() ? Number(f[7].toString().trim()) : null,
                    "sotinchi_th": 0,
                    "sobaikttx": f[11] && f[11].toString().trim() ? f[11].toString().trim() : 0
                },
                creator_plan_id: index_user !== -1 ? this.list_teacher[index_user].id : 0,
                dot_capnhat: f[10] && f[10].toString().trim() && Number(f[10].toString().trim()) ? f[10].toString().trim() : null,
                status_import: 0
            }
            dataImport.push(monhoc);
        })

        this.list_monhoc = dataImport;
        this.getStatusObject();
    }

    onChangePageImport(event) {
        this.pageImport = event.page;
    }

    startImportMonHoc() {
        if (this.list_monhoc && this.list_monhoc.length) {
            const request: Observable<any>[][] = [];
            let i = 0;
            request[i] = [];
            this.list_monhoc.forEach(f => {
                const data_import = {
                    title: f.title,
                    maso: f.maso,
                    slug: f.slug,
                    category_ids: f.category_ids,
                    params: f.params,
                    av: f.av,
                    status: f.status,
                    creator_plan_id: f.creator_plan_id,
                    dot_capnhat: f.dot_capnhat,
                    nganh_bomon_id: f.nganh_bomon_id
                }

                if (request[i].length < 3) {
                    request[i].push(this.requestMonhoc(f, data_import))
                } else {
                    i = i + 1;
                    request[i] = [];
                    request[i].push(this.requestMonhoc(f, data_import))
                }
            })

            this.progressValue = 0;
            this.displayModal = true;
            this.waitting_title = 'Đang đồng bộ dữ liệu, vui lòng không tắt trình duyệt.';
            if (request.length) {
                this.loopAddMonHoc(0, request).subscribe(() => {
                    this.displayModal = false;
                    this.getStatusObject();
                    this.notificationService.toastSuccess("Đã hoàn thành quá trình import, vui lòng kiểm tra lại danh sách môn học đã import");
                })
            } else {
                this.notificationService.toastWarning("Không có môn học chưa import");
            }
        }
    }

    requestMonhoc(monhoc, data_import): Observable<any> {
        return this.elnKhoaHocService.getElnKhoaHocByCol('maso', data_import.maso).pipe(mergeMap(a => {
            if (a[0]) {
                if (this.ghi_de) {
                    return this.elnKhoaHocService.updateElnKhoaHoc(a[0].id, data_import).pipe(
                        catchError(e => {
                            monhoc['status_import'] = -1;
                            return of(null)
                        }),
                        mergeMap((res) => {
                            if (res)
                                monhoc['status_import'] = 1;
                            return of(null)
                        }))
                }
                monhoc['status_import'] = 1;
                return of(null);
            } else {
                return this.elnKhoaHocService.addElnKhoaHoc(data_import).pipe(
                    catchError(e => {
                        monhoc['status_import'] = -1;
                        return of(null)
                    }),
                    mergeMap((res) => {
                        if (res)
                            monhoc['status_import'] = 1;
                        return of(null)
                    }))
            }
        }))
    }

    loopAddMonHoc(key: number, group_obs: Observable<any>[][]) {
        this.progressValue = (key + 1) / group_obs.length * 100;
        return forkJoin(group_obs[key]).pipe(
            mergeMap(_res => {
                if (group_obs[key + 1] && group_obs[key + 1].length) {
                    return this.loopAddMonHoc(key + 1, group_obs);
                } else {
                    return of(null)
                }
            }))
    }

    getStatusObject() {
        if (this.list_monhoc) {
            this.status_object = {
                no_import: this.list_monhoc.filter(m => m['status_import'] === 0).length,
                import_done: this.list_monhoc.filter(m => m['status_import'] === 1).length,
                import_fail: this.list_monhoc.filter(m => m['status_import'] === -1).length
            }
        }
    }

    downLoadFileMonhocEx() {
        this.fileService.getFileContent('..\\assets\\files\\mau_file_import_tueba\\Mau_03_Import_danh_muc_mon_hoc.xlsx').subscribe(res => {
            saveAs(res, 'Mau_03_Import_danh_muc_mon_hoc.xlsx');
        });
    }
}
