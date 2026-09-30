import { OvicConditionParam, OvicQueryCondition } from '@core/models/dto';
import { CoursePlanActivitiesService } from '@shared/services/course-plan-activities.service';
import { UserService } from '@core/services/user.service';
import { ElnKhoaHocService } from '@shared/services/elearning-khoa-hoc.service';
import { CourseTesters } from '@shared/models/course-testers';
import { HelperService } from './../../../../../core/services/helper.service';
import { NotificationService } from '@core/services/notification.service';
import { Component, ElementRef, OnInit, inject, viewChild } from '@angular/core';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { CoursePlanActivities } from '@modules/shared/models/course-plan-activities';
import * as XLSX from 'xlsx';
import { CourseTesterDucService } from '@modules/shared/services/course-tester-duc.service';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { forkJoin, mergeMap, of, filter, Observable, catchError } from 'rxjs';
import { User } from '@core/models/user';
import { MatSelectionListChange } from '@angular/material/list';
import { ClassPlanActivities } from '@modules/shared/models/class-plan-activities';

import { SharedModule } from '@modules/shared/shared.module';
import { DialogModule } from 'primeng/dialog';
import { PaginatorModule } from 'primeng/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TableModule } from 'primeng/table';
import { saveAs } from 'file-saver';
import { FileService } from '@core/services/file.service';

export interface EXCEL_CB_THI {
    course_maso: string,
    email_user: string,
    week: number,
    course_plan_activity_id: number,
    status: number,
    user_id: number
}

@Component({
    standalone: true,
    imports: [SharedModule, DialogModule, PaginatorModule, MatProgressBarModule, TableModule],
    selector: 'app-import-canbothi',
    templateUrl: './import-canbothi.component.html',
    styleUrls: ['./import-canbothi.component.css']
})
export class ImportCanbothiComponent implements OnInit {
    private notificationService = inject(NotificationService);
    private helperService = inject(HelperService);
    private courseTesterDucService = inject(CourseTesterDucService);
    private elnKhoaHocService = inject(ElnKhoaHocService);
    private userService = inject(UserService);
    private coursePlanActivitiesService = inject(CoursePlanActivitiesService);
    private fileService = inject(FileService);


    readonly inputImport = viewChild<ElementRef>('inputImport');

    list_course: ElnKhoaHoc[] = [];

    search_course: string;

    selected_course: ElnKhoaHoc;

    list_kehoach: CoursePlanActivities[];

    list_user: User[] = [];

    list_cdr: CoursePlanActivities[] = [];

    selected_plan: CoursePlanActivities;

    data_for_import: any[] = [];

    displayModal: boolean = false;

    progressValue: number = 0;

    list_show_import: CourseTesters[] = [];

    ngOnInit(): void {
        // const condition: ConditionOption = {
        //     condition: [
        //         { conditionName: 'week', condition: OvicQueryCondition.equal, value: '100' },
        //     ],
        //     set: [
        //         { label: 'limit', value: '-1' },
        //         { label: 'order', value: 'DESC' },
        //         { label: 'orderby', value: 'created_at' }
        //     ],
        //     page: null
        // }

        // this.courseTesterDucService.getCourseTesterByPageNew(condition).subscribe(() => { })
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
                this.getCourseAndClassPlanAndEmail(data.filter(m => m[1] && m[2] && m[3]))
            };
        }
    }


    getCourseAndClassPlanAndEmail(data_excel: any[]) {
        data_excel.splice(0, 1);
        const maso_courses = [];
        const emails = [];
        const data_sql: EXCEL_CB_THI[] = [];
        const object_week = {};
        const data_show_import: any[] = [];
        data_excel.forEach(f => {
            const maso = f[1].toString().trim().toUpperCase();
            const email = f[2].toString().trim().toLowerCase();
            const week = f[3].toString().trim();
            maso_courses.push(maso);
            emails.push(email);
            const weeks_ar = week.replace(/\D/g, '|').split('|');
            data_show_import.push({
                course_maso: maso,
                email_user: email,
                weeks: weeks_ar.join(', '),
            });
            if (weeks_ar.length) {
                weeks_ar.forEach(w => {
                    data_sql.push({
                        course_maso: maso,
                        email_user: email,
                        week: Number(w),
                        course_plan_activity_id: 0,
                        status: 1,
                        user_id: 0
                    })

                })
            }
        })



        const condition_course: ConditionOption = {
            condition: [],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'include', value: [...new Set(maso_courses)].toString() },
                { label: 'include_by', value: 'maso' }
            ],
            page: null
        }

        const condition_email: ConditionOption = {
            condition: [],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'include', value: [...new Set(emails)].toString() },
                { label: 'include_by', value: 'email' }
            ],
            page: null
        }

        this.notificationService.isProcessing(true);
        forkJoin([
            this.elnKhoaHocService.getKhoaHocByPageNew_2(condition_course).pipe(mergeMap(_khoahoc => {
                const course_ids = [];
                _khoahoc.data.forEach(f => {
                    course_ids.push(f.id);
                })
                if (course_ids.length) {
                    const condition_plan_cdr: ConditionOption = {
                        condition: [
                            { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: '0' }
                        ],
                        set: [
                            { label: 'limit', value: '-1' },
                            { label: 'include', value: [...new Set(course_ids)].toString() },
                            { label: 'include_by', value: 'course_id' }
                        ],
                        page: null
                    }

                    return this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_plan_cdr).pipe(mergeMap(_cdr => {
                        _khoahoc.data.forEach(f => {
                            f['plan_activities'] = _cdr.data.filter(m => m.course_id === f.id);
                        })
                        return of(_khoahoc);
                    }))
                }

                return of(null);
            })),
            this.userService.getUserByPageNew(condition_email)
        ]).subscribe({
            next: ([_khoahoc, _user]) => {
                if (!_khoahoc) {
                    this.notificationService.isProcessing(false);
                    return this.notificationService.toastWarning("Không tìm thấy dữ liệu môn học, vui lòng kiểm tra lại");
                }

                if (!_user) {
                    this.notificationService.isProcessing(false);
                    return this.notificationService.toastWarning("Không tìm thấy dữ liệu cán bộ, vui lòng kiểm tra lại");
                }

                this.list_course = _khoahoc.data;
                this.list_user = _user.data;
                this.list_show_import = data_show_import;
                this.convertDataToImport(data_sql, _khoahoc.data, _user.data);
                this.notificationService.isProcessing(false);
            },
            error: () => {
                this.notificationService.isProcessing(false)
                this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
            }
        })
    }

    convertDataToImport(data_sql: EXCEL_CB_THI[], _khoahoc: ElnKhoaHoc[], _user: User[]) {
        const data_import: any[] = [];

        data_sql.forEach((s, key) => {
            const index_course = _khoahoc.findIndex(m => m.maso.toLowerCase() === s.course_maso.toLowerCase());
            const index_user = _user.findIndex(m => m.email === s.email_user);
            data_import[key] = [];
            if (index_course !== -1 && index_user !== -1) {
                const course_id = _khoahoc[index_course].id;
                const user_id = _user[index_user].id;
                const index_week = _khoahoc[index_course]['plan_activities'].findIndex(m => m.week === s.week);
                if (index_week !== -1) {
                    const import_data: CourseTesters = {
                        user_id: user_id,
                        course_plan_activity_id: _khoahoc[index_course]['plan_activities'][index_week].id,
                        course_id: course_id,
                        week: s.week,
                        status: 1
                    }
                    data_import[key].push(import_data);
                }
            }
        })




        this.data_for_import = data_import;

    }

    startImportHoidong() {
        if (this.data_for_import.length) {
            this.displayModal = true;
            this.progressValue = 0;
            this.loopToImportCourseTester(this.data_for_import[0], this.data_for_import, 0);
        } else {
            this.notificationService.toastWarning("Không có dữ liệu để import, vui lòng kiểm tra lại");
        }

    }

    loopToImportCourseTester(data, data_import: any[], key) {
        if (key < data_import.length) {
            this.progressValue = (key + 1) / data_import.length * 100;
            if (data.length) {
                const request: Observable<any>[] = [];
                data.forEach(f => {
                    const condition_course_test: ConditionOption = {
                        condition: [
                            { conditionName: 'user_id', condition: OvicQueryCondition.equal, value: f.user_id },
                            { conditionName: 'course_plan_activity_id', condition: OvicQueryCondition.equal, value: f.course_plan_activity_id, orWhere: 'and' },
                            { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: f.course_id, orWhere: 'and' }
                        ],
                        set: [],
                        page: null
                    }
                    request.push(this.courseTesterDucService.getCourseTesterByPageNew(condition_course_test).pipe(catchError(() => {
                        // f['trangthai'] = "Thất bại"
                        return of(null);
                    }), mergeMap(_tester => {
                        if (_tester.recordsFiltered) {
                            // f['trangthai'] = "Đã có"
                            return of(null);
                        } else {
                            return this.courseTesterDucService.addCourseTester(f).pipe(catchError(() => {
                                // f['trangthai'] = "Thất bại";
                                return of(null);
                            }), mergeMap(() => {
                                // f['trangthai'] = "Thành công";
                                return of(null);
                            }))
                        }
                    })));
                })

                forkJoin(request).subscribe({
                    next: () => {
                        this.loopToImportCourseTester(data_import[key + 1], data_import, key + 1);
                    },
                    error: () => {
                        this.displayModal = false;
                        this.notificationService.toastError('Lỗi kết nối, vui lòng thử lại');
                    }
                })
            } else {
                this.loopToImportCourseTester(data_import[key + 1], data_import, key + 1);
            }
        } else {
            this.progressValue = 0;
            this.displayModal = false;
            this.notificationService.toastSuccess("Kết thúc import")
        }
    }

    onSelectCourse(event: MatSelectionListChange) {
        this.selected_course = event.options[0].value;
        // this.onLoadPlan( this.courseSelected );
    }

    downLoadEx() {
        this.fileService.getFileContent('..\\assets\\files\\mau_file_import_LMS-LCMS\\mau_import_cb_thi.xlsx').subscribe(res => {
            saveAs(res, 'Mẫu giảng viên test.xlsx');
        });
    }
}
