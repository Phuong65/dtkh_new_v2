import { readImportFile } from '../../read-import-file';
import { ElnChuyenMucService } from '@shared/services/elearning-chuyen-muc.service';
import { DonViService } from '@modules/shared/services/don-vi.service';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HelperService } from '@core/services/helper.service';
import * as XLSX from 'xlsx';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { FileService } from '@core/services/file.service';
import { NotificationService } from '@core/services/notification.service';
import { RoleService } from '@core/services/role.service';
import { UserService } from '@core/services/user.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { SharedModule } from '@modules/shared/shared.module';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CheckboxModule } from 'primeng/checkbox';
import { ROLES } from '@modules/shared/utils/syscat';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { saveAs } from 'file-saver';
import { DonVi } from '@modules/shared/models/don-vi';
import { ElnChuyenMuc } from '@modules/shared/models/Elng';
import { catchError, forkJoin, mergeMap, Observable, of } from 'rxjs';
import { OvicQueryCondition } from '@core/models/dto';
import { data_sinhvienImport } from '../import-sinhvien/import-sinhvien.component';

@Component({
    selector: 'app-import-giangvien-tueba',
    standalone: true,
    imports: [CommonModule, SharedModule, DialogModule, TableModule, PaginatorModule, MatProgressBarModule, CheckboxModule],
    templateUrl: './import-giangvien.component.html',
    styleUrls: ['./import-giangvien.component.css']
})
export class ImportGiangvienComponent implements OnInit {
    @ViewChild('inputImport') inputImport: ElementRef;

    ghi_de: boolean = false;

    objectRoles = {};

    list_giangvien = [];

    list_donvi: DonVi[];

    list_nganh: ElnChuyenMuc[];

    waitting_title: string = "Đang đồng bộ dữ liệu, vui lòng chờ...";

    displayModal: boolean = false;

    progressValue: number = 0;

    search_giangvien: string;

    status_import_filter: number;

    pageImport: number = 0;

    status_object = {
        no_import: 0,
        import_done: 0,
        import_fail: 0,
        email_false: 0,
    }

    constructor(
        private router: Router,
        private auth: AuthService,
        private notificationService: NotificationService,
        private roleService: RoleService,
        private helperService: HelperService,
        private fileService: FileService,
        private userService: UserService,
        private elngUserProfileService: ElngUserProfileService,
        private donViService: DonViService,
        private elnChuyenMucService: ElnChuyenMucService
    ) {

    }

    ngOnInit(): void {
        this.auth.setFeatureSecondary("Đồng bộ dữ liệu - Giảng viên");
        this.initData();
    }

    initData() {
        this.objectRoles = {};

        const condition: ConditionOption = {
            condition: [],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'include', value: ROLES.giangvien },
                { label: 'include_by', value: 'name' }
            ],
            page: null
        }

        const condition_donvi: ConditionOption = {
            condition: [
                { conditionName: 'status', condition: OvicQueryCondition.greaterThan, value: '0', orWhere: 'and' },
                { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: this.auth.user.donvi_id.toString(), orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' }
            ],
            page: null
        }

        const condition_nganh: ConditionOption = {
            condition: [
                { conditionName: 'status', condition: OvicQueryCondition.greaterThan, value: '0', orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '-1' }
            ],
            page: null
        }

        this.notificationService.isProcessing(true);

        forkJoin([
            this.roleService.getRolesByPageNew(condition),
            this.donViService.getDonviByPageNew(condition_donvi),
            this.elnChuyenMucService.getChuyemucByPageNew(condition_nganh)
        ]).subscribe({
            next: ([_role, _donvi, _nganh]) => {
                _role.data.forEach(f => {
                    this.objectRoles[f.name] = f;
                })

                this.list_donvi = _donvi.data;
                this.list_nganh = _nganh.data;
                this.notificationService.isProcessing(false);
            },
            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại, hoặc liên hệ với kỹ thuật viên nếu thử lại không thành công");
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
        this.list_giangvien = [];
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

                    console.log(data);

                    data.forEach(f => {
                        if (f[0] && f[2] && f[8] && f[10]) {
                            if (f[10]) {
                                if (!object_check_duplicate[f[10].trim()]) {
                                    object_check_duplicate[f[10].trim()] = true;
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

    downLoadFileGiangvienEx() {
        this.fileService.getFileContent('..\\assets\\files\\mau_file_import_tueba\\Mau_02_Tao_tai_khoan_giao_vien.xlsx').subscribe(res => {
            saveAs(res, 'Mau 02 - Tao tai khoan giao vien.xlsx');
        });
    }

    convertData(data) {
        const user_list: data_sinhvienImport[] = [];
        data.forEach((f, key) => {
            const user_name = f[8].toString().trim().replace(/\s/gi, '').toLowerCase();
            const key_email = f[10].trim().replace(/\s/gi, '').toLowerCase();
            const user_: data_sinhvienImport = {
                index_: key + 1,
                display_name: f[0].trim(),
                email: key_email, //this.helperService.convertToSqlServerTime ( f[ 4 ].split ( /.|-/ ).join ( '/' ) ) ,
                username: user_name,
                password: user_name.concat("@Tueba"),
                phone: f[2].toString().trim().replace(/\s/g, ''),
                donvi_id: this.auth.user.donvi_id,
                status: 1,
                role_ids: [this.objectRoles[ROLES.giangvien].id.toString()],
                user_id: this.auth.user.id,
                full_name: f[0].toString().trim(),
                full_name_slug: this.helperService.slugVietnamese(f[0].toString().trim()),
                name: f[0] ? f[0].toString().trim().split(' ')[f[0].toString().trim().split(' ').length - 1] : null,
                birthday: null,
                gender: null,
                student_code: user_name,
                tenlop_quanly: null,
                khoadaotao: null,
                category_name: null,
                teacher: 1,
                status_import: 0
            }

            const index_donvi = this.list_donvi.findIndex(m => f[4] && f[4].toString().trim() === m.code);
            if (index_donvi !== -1) {
                user_['donvi_chuyenmon_id'] = this.list_donvi[index_donvi].id;
            }

            const index_nganh = this.list_nganh.findIndex(m => f[5] && f[5].toString().trim() === m.code);
            if (index_nganh !== -1) {
                user_['bomon_id'] = this.list_nganh[index_nganh].id;
            }

            if (!key_email.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)) {
                user_['status_import'] = -2;
            }

            user_list.push(user_);
        })

        this.list_giangvien = user_list;
        this.getStatusObject();
    }

    startImportGiangvien() {
        const data_giangvien = this.list_giangvien.filter(m => m['status_import'] !== -2);
        if (data_giangvien && data_giangvien) {
            const request: Observable<any>[][] = [];
            let i = 0;
            request[i] = [];
            data_giangvien.forEach(f => {
                const user = {
                    display_name: f.display_name,
                    email: f.email,
                    username: f.username,
                    password: f.password,
                    phone: f.phone,
                    donvi_id: f.donvi_id,
                    status: f.status,
                    role_ids: f.role_ids
                };

                const userProfile = {
                    user_id: null,
                    full_name: f.full_name,
                    full_name_slug: f.full_name_slug,
                    name: f.name,
                    birthday: f.birthday,
                    gender: f.gender,
                    student_code: f.student_code,
                    tenlop_quanly: f.tenlop_quanly,
                    khoadaotao: f.khoadaotao,
                    category_name: f.category_name,
                    teacher: f.teacher,
                };

                if (request[i].length < 3) {
                    request[i].push(this.requestGiangvien(f, user, userProfile))
                } else {
                    i = i + 1;
                    request[i] = [];
                    request[i].push(this.requestGiangvien(f, user, userProfile))
                }
            })

            this.progressValue = 0;
            this.displayModal = true;
            this.waitting_title = 'Đang đồng bộ dữ liệu, vui lòng không tắt trình duyệt.';
            if (request.length) {
                this.loopAddGiangvien(0, request).subscribe(() => {
                    this.displayModal = false;
                    this.getStatusObject();
                    this.notificationService.toastSuccess("Đã hoàn thành quá trình import, vui lòng kiểm tra lại danh sách sinh viên đã import");
                })
            } else {
                this.notificationService.toastWarning("Không có sinh viên chưa import");
            }
        }
    }

    requestGiangvien(giangvien: data_sinhvienImport, user, userProfile): Observable<any> {
        const request = this.userService.getUserByCol('username', user.username).pipe(
            mergeMap(_user => {
                if (_user.length) {
                    userProfile.user_id = _user[0].id;
                    return this.elngUserProfileService.getElngUserProfileByItem(userProfile.user_id, "user_id").pipe(
                        mergeMap((_student) => {
                            if (_student.length) {
                                if (this.ghi_de) {
                                    delete user.email;
                                    delete user.username;
                                    delete user.phone;
                                    return forkJoin([
                                        this.elngUserProfileService.updateElngUserProfile(_student[0].id, userProfile),
                                        this.userService.updateUserS(userProfile.user_id, user)
                                    ]).pipe(
                                        mergeMap(() => {
                                            giangvien.status_import = 1;
                                            return of(null);
                                        }),
                                        catchError(() => {
                                            giangvien.status_import = -1;
                                            return of(null);
                                        })
                                    )
                                } else {
                                    giangvien.status_import = 1;
                                    return of(null);
                                }
                            } else {
                                return this.elngUserProfileService.addElngUserProfile(userProfile).pipe(
                                    mergeMap(() => {
                                        giangvien.status_import = 1;
                                        return of(null);
                                    }),
                                    catchError(() => {
                                        giangvien.status_import = -1;
                                        return of(null);
                                    }),
                                )
                            }
                        }),
                        catchError(() => {
                            giangvien.status_import = -1;
                            return of(null);
                        }),
                    )
                } else {
                    return this.userService.creatUser(user).pipe(
                        mergeMap(_user_created => {
                            if (_user_created) {
                                userProfile.user_id = _user_created;
                                return this.elngUserProfileService.addElngUserProfile(userProfile).pipe(
                                    mergeMap(() => {
                                        giangvien.status_import = 1;
                                        return of(null);
                                    }),
                                    catchError(() => {
                                        giangvien.status_import = -1;
                                        return of(null);
                                    })
                                )
                            } else {
                                giangvien.status_import = -1;
                                return of(null);
                            }
                        }),
                        catchError(() => {
                            giangvien.status_import = -1;
                            return of(null);
                        }),
                    )
                }
            }))
        return request;
    }

    loopAddGiangvien(key: number, group_obs: Observable<any>[][]): Observable<any> {
        this.progressValue = (key + 1) / group_obs.length * 100;
        return forkJoin(group_obs[key]).pipe(
            mergeMap(_res => {
                if (group_obs[key + 1] && group_obs[key + 1].length) {
                    return this.loopAddGiangvien(key + 1, group_obs);
                } else {
                    return of(null)
                }
            }))
    }

    onChangePageImport(event) {
        this.pageImport = event.page;
    }

    getStatusObject() {
        if (this.list_giangvien) {
            this.status_object = {
                no_import: this.list_giangvien.filter(m => m['status_import'] === 0).length,
                import_done: this.list_giangvien.filter(m => m['status_import'] === 1).length,
                import_fail: this.list_giangvien.filter(m => m['status_import'] === -1).length,
                email_false: this.list_giangvien.filter(m => m['status_import'] === -2).length,
            }
        }
    }
}
