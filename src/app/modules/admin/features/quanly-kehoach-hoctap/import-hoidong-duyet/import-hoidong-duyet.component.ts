import { Component, ElementRef, OnDestroy, OnInit, inject, viewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { FileService } from '@core/services/file.service';
import { HelperService } from '@core/services/helper.service';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { NotificationService } from '@core/services/notification.service';
import { UserService } from '@core/services/user.service';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { CourseThanhvienService } from '@modules/shared/services/course-thanhvien.service';
import { DonViService } from '@modules/shared/services/don-vi.service';
import { ElnBaiHocService } from '@modules/shared/services/elearning-bai-hoc.service';
import { ElnChuyenMucService } from '@modules/shared/services/elearning-chuyen-muc.service';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable, catchError, mergeMap, forkJoin, of } from 'rxjs';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { OvicQueryCondition } from '@core/models/dto';

import { SharedModule } from '@modules/shared/shared.module';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { OvicGroupsRadioV2Component } from '@modules/shared/components/ovic-groups-radio-v2/ovic-groups-radio-v2.component';
import { ROUTERS } from '@modules/shared/utils/syscat';
import { key_server } from '@env';

@Component({
    standalone: true,
    imports: [SharedModule, TableModule, DialogModule, MatProgressBarModule, OvicGroupsRadioV2Component],
    selector: 'app-import-hoidong-duyet',
    templateUrl: './import-hoidong-duyet.component.html',
    styleUrls: ['./import-hoidong-duyet.component.css']
})
export class ImportHoidongDuyetComponent implements OnInit, OnDestroy {
    private helperService = inject(HelperService);
    private modalService = inject(NgbModal);
    private elnKhoaHocService = inject(ElnKhoaHocService);
    private userService = inject(UserService);
    formBuilder = inject(FormBuilder);
    private noitifi = inject(NotificationService);
    private courseThanhvienService = inject(CourseThanhvienService);
    private fileService = inject(FileService);
    private router = inject(Router);
    private auth = inject(AuthService);

    readonly inputImport = viewChild<ElementRef>('inputImport');

    displayModal = false;

    waitingTitle = 'Đang kiểm tra dữ liệu, vui lòng chờ...';

    progressValue: number = 0;

    data_import_check: any[] = [];

    caphoidong = [
        { value: 'cap_khoa', label: 'Hội đồng cấp khoa' },
        { value: 'cap_truong', label: 'Hội đồng cấp trường' }
    ]

    selectCaphoidong: string;

    routerLanhdaokhoa: boolean = false;

    routerDaotao: boolean = false;

    routerAdmin: boolean = false;

    key_server = key_server;
    constructor() {
        this.selectCaphoidong = 'cap_khoa';

        this.routerLanhdaokhoa = this.auth.hasRouter(ROUTERS.lanhdao_khoa);

        this.routerAdmin = this.auth.hasRouter(ROUTERS.admin);

        this.routerDaotao = this.auth.hasRouter(ROUTERS.daotao);

    }

    ngOnDestroy(): void {
        this.data_import_check = [];
    }

    ngOnInit(): void {

    }

    onGetFileImport() {
        const inputImport = this.inputImport();
        inputImport.nativeElement.value = null;
        inputImport.nativeElement.click();
    }

    changeInputImport(event) {
        if (event.target.files[0]) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.readAsArrayBuffer(file);
            reader.onloadend = (event) => {
                const localUrl = reader.result;
                const wb: XLSX.WorkBook = XLSX.read(localUrl, { type: 'buffer' });
                const wsname: string = wb.SheetNames[0];
                const ws: XLSX.WorkSheet = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
                this.convertSqlToImportHoidong(data.filter(m => m[1] && m[10]))
            };
        }
    }

    convertSqlToImportHoidong(data) {
        data.splice(0, 1);
        const user_create_plan = [];
        const hoidongduyet = [];
        const emails = [];
        const maso = [];
        const objectMaso = {};
        data.forEach(f => {
            if (!objectMaso[f[1].trim()]) {

                objectMaso[f[1].trim()] = true;

                maso.push(f[1].trim());

                const create_plan = {
                    maso: f[1].trim(),
                    email_user: f[9] ? f[9].toLowerCase() : null,
                    thuockhoa: f[7]
                }

                for (let i = 10; i < f.length; i++) {
                    if (f[i]) {
                        const data_duyet = {
                            maso: f[1].trim(),
                            email_user: f[i].toLowerCase().trim(),
                            vaitro: i === 10 ? 'CHUTICH' : 'UYVIEN'
                        }
                        emails.push(f[i].toLowerCase().trim());
                        hoidongduyet.push(data_duyet);
                    }
                }

                user_create_plan.push(create_plan);

                if (f[9]) {
                    emails.push(f[9].toLowerCase().trim());
                }

            }
        })

        let last_emails = [... new Set(emails)];

        let last_maso = [... new Set(maso)];


        let i = 0;
        const get_emails = [];
        const get_monhoc = [];

        last_emails.forEach(f => {
            if (!get_emails[i]) {
                get_emails[i] = [];
                get_emails[i].push(f);
            } else if (get_emails[i] && get_emails[i].length < 20) {
                get_emails[i].push(f);
            } else if (get_emails[i].length === 20) {
                i = i + 1;
                get_emails[i] = [];
                get_emails[i].push(f);
            }
        })

        let j = 0;
        last_maso.forEach(f => {
            if (!get_monhoc[j]) {
                get_monhoc[j] = [];
                get_monhoc[j].push(f);
            } else if (get_monhoc[j] && get_monhoc[j].length < 20) {
                get_monhoc[j].push(f);
            } else if (get_monhoc[j].length === 20) {
                j = j + 1;
                get_monhoc[j] = [];
                get_monhoc[j].push(f);
            }
        })

        this.displayModal = true;
        this.progressValue = 0;

        let data_show_import = [];
        this.waitingTitle = 'Đang tải dữ liệu khóa học, vui lòng chờ...';
        this.loopGetCourse(0, get_monhoc[0], get_monhoc, hoidongduyet, user_create_plan, data_show_import, get_emails);
    }

    loopGetCourse(key, data_maso, data_masos, hoidongduyet, user_create_plan, data_show_import, data_emails) {
        if (key < data_masos.length) {
            this.progressValue = (key + 1) / data_masos.length * 100;
            const condition: ConditionOption = {
                condition: [],
                set: [
                    { label: 'limit', value: '-1' },
                    { label: 'include', value: data_maso.toString() },
                    { label: 'include_by', value: 'maso' }
                ],
                page: null
            }

            this.elnKhoaHocService.getKhoaHocByPageNew_2(condition).subscribe({
                next: (_res_course) => {
                    data_show_import = data_show_import.concat(_res_course.data);
                    this.loopGetCourse(key + 1, data_masos[key + 1], data_masos, hoidongduyet, user_create_plan, data_show_import, data_emails);
                },
                error: () => {
                    this.noitifi.toastError("Lỗi kết nối, vui lòng thử lại");
                    this.displayModal = false;
                }
            })
        } else {
            this.progressValue = 0;
            this.displayModal = false;
            this.waitingTitle = 'Đang tải dữ liệu giảng viên, vui lòng chờ...';
            let giangviens = [];
            this.loopGetGiangVienByEmail(0, data_emails[0], data_emails, hoidongduyet, user_create_plan, data_show_import, giangviens)
        }
    }

    loopGetGiangVienByEmail(key, data_email, data_emails, hoidongduyet, user_create_plan, data_show_import, giangviens) {
        if (key < data_emails.length) {
            this.progressValue = (key + 1) / data_emails.length * 100;
            const condition: ConditionOption = {
                condition: [],
                set: [
                    { label: 'limit', value: '-1' },
                    { label: 'include', value: data_email.toString() },
                    { label: 'include_by', value: 'email' }
                ],
                page: null
            }

            this.userService.getUserByPageNew(condition).subscribe({
                next: (_res) => {
                    giangviens = giangviens.concat(_res.data);
                    this.loopGetGiangVienByEmail(key + 1, data_emails[key + 1], data_emails, hoidongduyet, user_create_plan, data_show_import, giangviens);
                    // data_show_import.push(_res.data);
                },
                error: () => {
                    this.noitifi.toastError("Lỗi kết nối, vui lòng thử lại");
                    this.displayModal = false;
                }
            })
        } else {

            hoidongduyet.forEach(f => {
                const index = giangviens.findIndex(m => m.email === f.email_user);
                if (index !== -1) {
                    f['user_id'] = giangviens[index].id;
                    f['user_name'] = giangviens[index].display_name;
                }
            })


            user_create_plan.forEach(f => {
                const index = giangviens.findIndex(m => m.email === f.email_user);
                if (index !== -1) {
                    f['user_edit_id'] = giangviens[index].id;
                    f['user_edit_name'] = giangviens[index].display_name;
                }

                const index_course = data_show_import.findIndex(m => m.maso === f.maso);
                if (index_course !== -1) {
                    f['course_name'] = data_show_import[index_course].title;
                    f['course_id'] = data_show_import[index_course].id;
                }

                const hoidong = hoidongduyet.filter(m => m.maso === f.maso);
                f['hoidong'] = hoidong;
                f['trangthai'] = 'Chưa import';
            })

            this.data_import_check = user_create_plan;
        }
    }

    startImportHoidong() {
        this.displayModal = true;
        this.progressValue = 0;
        this.waitingTitle = 'Đang đồng bộ dữ liệu, vui lòng chờ';
        this.loopAddHoidong(0, this.data_import_check[0], this.data_import_check);
    }

    loopAddHoidong(key, course, courses) {
        if (key < courses.length) {
            this.progressValue = (key + 1) / courses.length * 100;
            if (course['course_id']) {

                const data_edit = {
                    creator_plan_id: course['user_edit_id']
                }

                const request: Observable<any>[] = [];

                if (course['user_edit_id'] && this.routerAdmin && this.routerDaotao) {
                    request.push(this.elnKhoaHocService.updateElnKhoaHoc(course['course_id'], data_edit));
                }

                if (course['hoidong']) {
                    course['hoidong'].forEach(f => {
                        if (f['user_id']) {
                            const data_hoidong = {
                                course_id: course['course_id'],
                                user_id: f['user_id'],
                                vaitro: f['vaitro'],
                                cap_hoidong: this.selectCaphoidong
                            }
                            request.push(this.courseThanhvienService.addCourseThanhvien(data_hoidong));
                        }

                    })
                }

                const condition_getthanhvien: ConditionOption = {
                    condition: [
                        { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: course['course_id'], orWhere: 'and' },
                        { conditionName: 'cap_hoidong', condition: OvicQueryCondition.equal, value: this.selectCaphoidong, orWhere: 'and' }
                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'select', value: 'id' }
                    ],
                    page: null
                }
                this.courseThanhvienService.getCourseThanhvienByPageNew(condition_getthanhvien).pipe(
                    mergeMap(_thanhvien => {
                        const _thanhvien_ids = _thanhvien.data.map(m => m.id);
                        if (_thanhvien_ids.length) {
                            return this.courseThanhvienService.deleteCourseThanhvien(_thanhvien_ids.toString()).pipe(
                                catchError(() => {
                                    course['trangthai'] = "Thất bại";
                                    return of(null)
                                }),
                                mergeMap(() => {
                                    return forkJoin(request).pipe(mergeMap(() => {
                                        return of(null);
                                    }))
                                }))
                        } else {
                            return forkJoin(request).pipe(mergeMap(() => {

                                return of(null);
                            }))
                        }
                    })).subscribe({
                        next: () => {
                            course['trangthai'] = "Thành công";
                            this.loopAddHoidong(key + 1, courses[key + 1], courses);
                        },
                        error: () => {
                            this.loopAddHoidong(key + 1, courses[key + 1], courses);
                        }
                    })
            } else {
                course['trangthai'] = 'Chưa tạo môn học';
                this.loopAddHoidong(key + 1, courses[key + 1], courses);
            }
        } else {
            this.displayModal = false;
            this.noitifi.toastSuccess('Đã hoàn thành cập nhật, vui lòng kiểm tra lại');
        }
    }

    downLoadEx() {
        this.fileService.getFileContent('..\\assets\\files\\mau_file_import_LMS-LCMS\\mau_import_hoidongduyet.xlsx').subscribe(res => {
            saveAs(res, 'Mẫu import hội đồng duyệt.xlsx');
        });
    }

    onChangeCapHoiDong(event) {
        this.selectCaphoidong = event;
    }
}
