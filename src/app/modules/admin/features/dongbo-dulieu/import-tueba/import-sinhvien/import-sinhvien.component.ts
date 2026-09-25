import { readImportFile } from '../../read-import-file';
import { request } from 'http';
import { NotificationService } from '@core/services/notification.service';
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SharedModule } from '@modules/shared/shared.module';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { ROLES } from '@modules/shared/utils/syscat';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { RoleService } from '@core/services/role.service';
import { HelperService } from '@core/services/helper.service';
import * as XLSX from 'xlsx';
import { FileService } from '@core/services/file.service';
import { saveAs } from 'file-saver';
import { PaginatorModule } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { catchError, forkJoin, mergeMap, Observable, of } from 'rxjs';
import { UserService } from '@core/services/user.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { DialogModule } from 'primeng/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';

export interface data_sinhvienImport {
    index_: number;
    display_name: string;
    email: string;
    username: string;
    password: string;
    phone: string;
    donvi_id: number;
    status: number;
    role_ids: string[];
    user_id: number;
    full_name: string;
    full_name_slug: string;
    name: string;
    birthday: string;
    gender: string;
    student_code: string;
    tenlop_quanly: string;
    khoadaotao: string;
    category_name: string;
    import?: boolean;
    import_label?: 'Thành công' | 'Thất bại' | 'Đã có' | 'Trùng lặp' | 'Chưa import';
    duplicate?: string;
    teacher: number;
    status_import: number;
}


@Component({
    selector: 'app-import-sinhvien-tueba',
    standalone: true,
    imports: [CommonModule, SharedModule, CheckboxModule, ReactiveFormsModule, FormsModule, PaginatorModule, TableModule, DialogModule, MatProgressBarModule],
    templateUrl: './import-sinhvien.component.html',
    styleUrls: ['./import-sinhvien.component.css']
})
export class ImportSinhvienComponent implements OnInit {
    @Input() hide_back: boolean = false;
    
    @ViewChild('inputImport') inputImport: ElementRef;

    ghi_de: boolean = false;

    objectRoles = {};

    list_student = [];

    pageImport: number = 0;

    status_label = {
        "-1": "Thất bại",
        "0": "Chưa import",
        "1": "Thành công",
    }

    search_student: string;

    status_import_filter: number;

    displayModal: boolean = false;

    progressValue: number = 0;

    waitting_title: string;

    status_object = {
        no_import: 0,
        import_done: 0,
        import_fail: 0
    }


    constructor(
        private router: Router,
        private auth: AuthService,
        private notificationService: NotificationService,
        private roleService: RoleService,
        private helperService: HelperService,
        private fileService: FileService,
        private userService: UserService,
        private elngUserProfileService: ElngUserProfileService
    ) { }

    ngOnInit(): void {
        this.auth.setFeatureSecondary("Đồng bộ dữ liệu - Sinh viên");
        this.initData();
    }

    backToDongbo() {
        const activeLink = this.router.url.substring(7).split('?')[0].replace('/admin/', '');
        const url = this.router.serializeUrl(
            this.router.createUrlTree(['admin/' + activeLink])
        );
        this.router.navigateByUrl(url);
    }

    initData() {
        this.objectRoles = {};
        const condition: ConditionOption = {
            condition: [],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'include', value: ROLES.student },
                { label: 'include_by', value: 'name' }
            ],
            page: null
        }

        this.notificationService.isProcessing(true);

        this.roleService.getRolesByPageNew(condition).subscribe({
            next: (_role) => {
                _role.data.forEach(f => {
                    this.objectRoles[f.name] = f;
                })
                this.notificationService.isProcessing(false);
            },
            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại, hoặc liên hệ với kỹ thuật viên nếu thử lại không thành công");
            }
        })
    }

    triggerImport() {
        this.inputImport.nativeElement.value = '';
        this.list_student = [];
        this.inputImport.nativeElement.click();
    }

    downLoadFileSinhVienEx() {
        this.fileService.getFileContent('..\\assets\\files\\mau_file_import_LMS-LCMS\\Mau 04 - Import tao tai khoan cho sinh vien moi.xlsx').subscribe(res => {
            saveAs(res, 'Mau 04 - Import tao tai khoan cho sinh vien moi.xlsx');
        });
    }

    onChangePageImport(event) {
        this.pageImport = event.page;
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
                        if (f[1] && f[2] && f[4] && f[5] && f[6] && f[7] && f[11]) {
                            if (f[5]) {
                                if (!object_check_duplicate[f[5].trim()]) {
                                    object_check_duplicate[f[5].trim()] = true;
                                    filterData.push(f);
                                }
                            }
                        }
                    })

                    filterData.splice(0, 1);

                    this.convertData(filterData.filter(m => m[1] && m[2] && m[4] && m[5] && m[6] && m[7] && m[11]));
                });
            } else {
                this.notificationService.toastWarning("Sai định dạng file, yêu cầu file .xlsx. Vui lòng tải file mẫu danh sách import sinh viên");
            }
        }
    }

    convertData(data) {
        this.fileService.getFileLocalAsBlob("..\\assets\\json\\config.json").subscribe({
            next: (_res) => {
                const reader = new FileReader();
                reader.readAsText(_res);
                reader.onloadend = (event) => {
                    const localUrl = reader.result;
                    const json = JSON.parse(localUrl.toString());
                    const pass = json['password_after_@'];
                    const user_list: data_sinhvienImport[] = [];
                    data.forEach((f, key) => {
                        user_list.push(
                            {
                                index_: key + 1,
                                display_name: f[1] ? f[1] : null,
                                email: f[6] ? f[6].toLowerCase() : null, //this.helperService.convertToSqlServerTime ( f[ 4 ].split ( /.|-/ ).join ( '/' ) ) ,
                                username: f[5].toLowerCase() ? f[5].toLowerCase() : f[6].toLowerCase(),
                                password: f[2] ? f[2].trim().replace(/\D/g, '').concat('@', pass) : null,
                                phone: f[4] ? f[4] : f[5],
                                donvi_id: this.auth.user.donvi_id,
                                status: 1,
                                role_ids: [this.objectRoles[ROLES.student].id.toString()],
                                user_id: null,
                                full_name: f[1].trim(),
                                full_name_slug: this.helperService.slugVietnamese(f[1].trim()),
                                name: f[1] ? f[1].trim().split(' ')[f[1].trim().split(' ').length - 1] : null,
                                birthday: f[2] ? f[2].trim().replace(/\D/g, '/') : null,
                                gender: f[3] ? f[3] : null,
                                student_code: f[5] ? f[5].toLowerCase() : null,
                                tenlop_quanly: f[7] ? f[7] : null,
                                khoadaotao: f[11] ? f[11] : null,
                                category_name: f[9] ? f[9] : null,
                                status_import: 0,
                                teacher: 0,
                            }
                        )
                    });
                    this.list_student = user_list;
                    this.getStatusObject();
                }
            },
            error: () => {

            }
        })
    }

    startImportSinhvien() {
        if (this.list_student && this.list_student.length) {
            const request: Observable<any>[][] = [];
            let i = 0;
            request[i] = [];
            this.list_student.forEach(f => {
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
                    is_deleted: 0
                };

                if (request[i].length < 3) {
                    request[i].push(this.requestSinhvien(f, user, userProfile))
                } else {
                    i = i + 1;
                    request[i] = [];
                    request[i].push(this.requestSinhvien(f, user, userProfile))
                }
            })

            this.progressValue = 0;
            this.displayModal = true;
            this.waitting_title = 'Đang đồng bộ dữ liệu, vui lòng không tắt trình duyệt.';
            if (request.length) {
                this.loopAddSinhvien(0, request).subscribe(() => {
                    this.displayModal = false;
                    this.getStatusObject();
                    this.notificationService.toastSuccess("Đã hoàn thành quá trình import, vui lòng kiểm tra lại danh sách sinh viên đã import");
                })
            } else {
                this.notificationService.toastWarning("Không có sinh viên chưa import");
            }
        }
    }

    requestSinhvien(sinhvien: data_sinhvienImport, user, userProfile): Observable<any> {
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
                                            sinhvien.status_import = 1;
                                            return of(null);
                                        }),
                                        catchError(() => {
                                            sinhvien.status_import = -1;
                                            return of(null);
                                        })
                                    )
                                } else {
                                    sinhvien.status_import = 1;
                                    return of(null);
                                }
                            } else {
                                return this.elngUserProfileService.addElngUserProfile(userProfile).pipe(
                                    mergeMap(() => {
                                        sinhvien.status_import = 1;
                                        return of(null);
                                    }),
                                    catchError(() => {
                                        sinhvien.status_import = -1;
                                        return of(null);
                                    }),
                                )
                            }
                        }),
                        catchError(() => {
                            sinhvien.status_import = -1;
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
                                        sinhvien.status_import = 1;
                                        return of(null);
                                    }),
                                    catchError(() => {
                                        sinhvien.status_import = -1;
                                        return of(null);
                                    })
                                )
                            } else {
                                sinhvien.status_import = -1;
                                return of(null);
                            }
                        }),
                        catchError(() => {
                            sinhvien.status_import = -1;
                            return of(null);
                        }),
                    )
                }
            }))
        return request;
    }

    loopAddSinhvien(key: number, group_obs: Observable<any>[][]): Observable<any> {
        this.progressValue = (key + 1) / group_obs.length * 100;
        return forkJoin(group_obs[key]).pipe(
            mergeMap(_res => {
                if (group_obs[key + 1] && group_obs[key + 1].length) {
                    return this.loopAddSinhvien(key + 1, group_obs);
                } else {
                    return of(null)
                }
            }))
    }

    getStatusObject() {
        if (this.list_student) {
            this.status_object = {
                no_import: this.list_student.filter(m => m['status_import'] === 0).length,
                import_done: this.list_student.filter(m => m['status_import'] === 1).length,
                import_fail: this.list_student.filter(m => m['status_import'] === -1).length
            }
        }
    }
}
