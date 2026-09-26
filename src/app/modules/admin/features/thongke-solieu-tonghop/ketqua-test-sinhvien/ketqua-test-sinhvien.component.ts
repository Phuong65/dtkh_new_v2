import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, SimpleChanges } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { OvicQueryCondition } from '@core/models/dto';
import { AuthService } from '@core/services/auth.service';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { NotificationService } from '@core/services/notification.service';
import { ClassPlans } from '@modules/shared/models/class-plans';
import { Classes } from '@modules/shared/models/classes';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { CoursePlanActivities } from '@modules/shared/models/course-plan-activities';
import { DonVi } from '@modules/shared/models/don-vi';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { ElngUserProfile } from '@modules/shared/models/elng-user-profile';
import { ClassPlanActivitiesService } from '@modules/shared/services/class-plan-activities.service';
import { ClassPlanActivityStudentTestsService } from '@modules/shared/services/class-plan-activity-student-tests.service';
import { ClassPlansService } from '@modules/shared/services/class-plans.service';
import { ClassStudentService } from '@modules/shared/services/class-student.service';
import { ClassesService } from '@modules/shared/services/classes.service';
import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';
import { CourseQuestionsService } from '@modules/shared/services/course-questions.service';
import { DonViService } from '@modules/shared/services/don-vi.service';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { SharedModule } from '@modules/shared/shared.module';
import { ROLES } from '@modules/shared/utils/syscat';
import { DialogModule } from 'primeng/dialog';
import { PaginatorModule } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { forkJoin, mergeMap, Observable, of } from 'rxjs';

export interface objectFillter {
    category_id: number;
    namhoc: string;
    hocky: number;
    dot_capnhat?: string;
}

@Component({
    standalone: true,
    imports: [CommonModule, SharedModule, TableModule, PaginatorModule, DialogModule, MatProgressBarModule],
    selector: 'app-ketqua-test-sinhvien',
    templateUrl: './ketqua-test-sinhvien.component.html',
    styleUrls: ['./ketqua-test-sinhvien.component.css']
})

export class KetquaTestSinhvienComponent implements OnInit {

    private auth = inject(AuthService);
    private donViService = inject(DonViService);
    private elnKhoaHocService = inject(ElnKhoaHocService);
    private coursePlanActivitiesService = inject(CoursePlanActivitiesService);
    private courseQuestionsService = inject(CourseQuestionsService);
    private noitifi = inject(NotificationService);
    private classPlanActivityStudentTestsService = inject(ClassPlanActivityStudentTestsService);
    private classesService = inject(ClassesService);
    private classStudentService = inject(ClassStudentService);
    private classPlansService = inject(ClassPlansService);
    private classPlanActivitiesService = inject(ClassPlanActivitiesService);
    private sanitizer = inject(DomSanitizer);
    private httpHelper = inject(HttpParamsHeplerService);
    private elngUserProfileService = inject(ElngUserProfileService);

    __objectFillter: objectFillter;

    list_class: Classes[];
    limitClass = 20;
    totalClass = 0;
    donviId: number;
    isManager: boolean;
    dataAllContent: any[];
    dataWeekClass: ClassPlans[];

    list_donvi_chuyenmon: DonVi[] = [];
    listHocky = [];
    listNamhoc = [];

    objectFilter: objectFillter = {
        category_id: 0,
        hocky: 0,
        namhoc: '0',
    };
    user_profile: ElngUserProfile;
    userId: number;
    isLanhDaoKhoa: boolean = false;

    progressValue = 0;
    displayModal = false;
    waitting_title = 'Vui lòng không tắt trình duyệt';

    constructor(
    ) {
        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin) ? true : false;
        if (this.isManager) {
            this.donviId = 105;
        }
        else {
            this.donviId = this.auth.user.donvi_id;
        }
    }


    ngOnInit() {
        this.userId = this.auth.user.id;
        this.donviId = this.auth.user.donvi_id;
        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin);
        this.isLanhDaoKhoa = this.auth.userHasRole(ROLES.lanhdaokhoa);
        // this.noitifi.isProcessing(true);
        this.initData();
    }

    initData() {
        const condition_group_namhoc = this.httpHelper.paramsConditionBuilder(
            [
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' },
            ]).set('order', 'DESC').set('orderby', 'namhoc').set("groupby", "namhoc").set("limit", -1);

        const condition_group_hocky = this.httpHelper.paramsConditionBuilder(
            [
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' },
            ]).set('order', 'DESC').set('orderby', 'hocky').set("groupby", "hocky").set("limit", -1);

        const condition_donvi = this.httpHelper.paramsConditionBuilder([
            { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' },
            { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: this.auth.user.donvi_id.toString(), orWhere: 'and' },
        ]).set("limit", -1)


        const arr_condition = [
            { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' },
            { conditionName: 'donvi_id', condition: OvicQueryCondition.equal, value: this.donviId.toString(), orWhere: 'and' },
        ];

        const condition_nganh = this.httpHelper.paramsConditionBuilder(arr_condition).set('limit', '-1');


        forkJoin([
            this.classesService.getClassesByCols(condition_group_namhoc),
            this.classesService.getClassesByCols(condition_group_hocky),
            this.donViService.getDonViByCols(condition_donvi),
            this.elngUserProfileService.getElngUserProfileByItem(this.userId.toString(), "user_id"),
            // this.elnChuyenMucService.getElnChuyenMucByCols(condition_nganh)
        ]).subscribe({
            next: ([_resNamhoc, _resHocky, _resCategory, _userProfile]) => {


                const tmpNamHoc = [];
                const tmpHocky = [];
                _resNamhoc.forEach(f => {
                    if (f['namhoc'])
                        tmpNamHoc.push({ value: f['namhoc'], label: 'Năm học '.concat(f['namhoc']) });
                })
                _resHocky.forEach(f => {
                    if (f['hocky'])
                        tmpHocky.push({ value: f['hocky'], label: 'HK '.concat(f['hocky']) });
                })
                this.listNamhoc = tmpNamHoc;
                this.listHocky = tmpHocky;
                this.user_profile = _userProfile[0];
                this.list_donvi_chuyenmon = _resCategory;
                // this.list_bomon = _chuyenmuc;
                if (this.list_donvi_chuyenmon.length) {
                    if (this.user_profile.donvi_chuyenmon_id) {
                        this.objectFilter.category_id = this.user_profile.donvi_chuyenmon_id;
                    } else {
                        this.objectFilter.category_id = this.list_donvi_chuyenmon[0].id;
                    }
                }

                // this.objectFilter['category_id']
                const condition_group_hocky_end = this.httpHelper.paramsConditionBuilder(
                    [
                        { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1' },
                        { conditionName: 'namhoc', condition: OvicQueryCondition.equal, value: this.listNamhoc[0]['value'], orWhere: 'and' }
                    ]).set('order', 'DESC').set('orderby', 'hocky').set("groupby", "hocky");
                this.classesService.getClassesByCols(condition_group_hocky_end).subscribe(_res => {
                    this.objectFilter.namhoc = this.listNamhoc[0]['value'];
                    this.objectFilter.hocky = _res.length && _res[0] && _res[0]['hocky'] ? _res[0]['hocky'] : this.listHocky[0]['value'];
                    this.loadClass(1);
                })
                this.noitifi.isProcessing(false);


            },
            error: () => { this.noitifi.isProcessing(false); this.noitifi.toastError("Lỗi kết nối"); }
        })
    }

    changePage(event) {
        this.loadClass(event.page + 1);
    }


    loadClass(page: number) {
        // this.noitifi.isProcessing(true);
        this.displayModal = true;
        this.waitting_title = "Đang tải dữ liệu, vui lòng không tắt trình duyệt";

        if (this.donviId || this.donviId === 0) {
            const condition_classes: ConditionOption = {
                condition: [
                    { conditionName: 'category_id', condition: OvicQueryCondition.equal, value: this.objectFilter.category_id.toString() },
                    { conditionName: 'course_id', condition: OvicQueryCondition.greaterThan, value: '0' },
                    { conditionName: 'namhoc', condition: OvicQueryCondition.equal, value: this.objectFilter.namhoc },
                    { conditionName: 'hocky', condition: OvicQueryCondition.equal, value: this.objectFilter.hocky.toString() },
                ],
                set: [
                    { label: 'select', value: 'id,name' },
                    { label: 'limit', value: this.limitClass.toString() }
                ],
                page: page.toString(),
            }

            //Load số lượng tuần học của lớp
            const condition_week: ConditionOption = {
                condition: [
                    {
                        conditionName: 'week',
                        condition: OvicQueryCondition.notEqual,
                        value: '1000'
                    }
                ],
                set: [
                    { label: 'groupby', value: 'week' },
                    { label: 'limit', value: '-1' },
                ],
                page: null
            }

            forkJoin([
                this.classesService.getClassesByPageNew(condition_classes),
                this.classPlansService.getClassPlansByPageNew(condition_week)
            ]).subscribe({
                next: ([dataClasses, dtweekClass]) => {

                    this.totalClass = dataClasses.recordsFiltered;

                    this.dataWeekClass = dtweekClass.data.filter(dt => dt.week > 0);
                    const request_main = [];
                    if (dataClasses.data.length > 0) {
                        dataClasses.data.forEach(f => {
                            const reuqest_: Observable<any>[] = [];
                            const condition_class_studen: ConditionOption = {
                                condition: [
                                    { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: f.id.toString() }
                                ],
                                set: [
                                    { label: 'limit', value: '1' }
                                ],
                                page: null
                            }

                            const condtion_plan: ConditionOption = {
                                condition: [
                                    { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: f.id.toString() },
                                    { conditionName: 'week', condition: OvicQueryCondition.notEqual, value: '0', orWhere: 'and' },
                                    { conditionName: 'week', condition: OvicQueryCondition.notEqual, value: '1000', orWhere: 'and' }
                                ],
                                set: [
                                    { label: 'limit', value: '-1' }
                                ],
                                page: null
                            }

                            const condtion_plan_activity: ConditionOption = {
                                condition: [
                                    { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: f.id.toString() },
                                    { conditionName: 'type', condition: OvicQueryCondition.equal, value: 'TESTING_TRACNGHIEM', orWhere: 'and' }
                                ],
                                set: [
                                    { label: 'limit', value: '-1' }
                                ],
                                page: null
                            }

                            reuqest_.push(this.classStudentService.getClassStudentByPageNew(condition_class_studen).pipe(mergeMap(_student => {
                                f['total_student'] = _student.recordsFiltered;
                                return of(null)
                            })));
                            reuqest_.push(this.classPlansService.getClassPlansByPageNew(condtion_plan).pipe(mergeMap(_plan => {
                                f['class_plan'] = _plan.data;
                                return of(null)
                            })));
                            reuqest_.push(this.classPlanActivitiesService.getClassPlanActivitiesByPageNew(condtion_plan_activity).pipe(mergeMap(_activty => {
                                f['class_plan_activity'] = _activty.data;
                                return of(null)
                            })));
                            request_main.push(forkJoin(reuqest_));
                        })
                        this.loopGetStudenAndPlan(0, request_main, dataClasses.data);
                    }
                    else {
                        this.list_class = [];
                        this.displayModal = false;
                        this.noitifi.isProcessing(false);

                    }
                }

            })
        }
        else {
            this.list_class = [];
            this.displayModal = false;
            this.noitifi.isProcessing(false);

        }
    }

    loopGetStudenAndPlan(key, request: Observable<any>[], dataClasses: Classes[]) {
        if (key < request.length) {
            this.progressValue = key / request.length * 100;
            request[key].subscribe({
                next: () => {
                    this.loopGetStudenAndPlan(key + 1, request, dataClasses);
                },
                error: () => {

                }
            })
        } else {
            const request_student_test = [];
            request_student_test[0] = [];
            let i = 0;
            dataClasses.forEach(f => {
                if (f['class_plan_activity'] && f['class_plan_activity'].length > 0) {
                    f['class_plan_activity'].forEach(p => {

                        const condition_student_test_passed: ConditionOption = {
                            condition: [
                                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: f.id.toString() },
                                { conditionName: 'class_plan_activity_id', condition: OvicQueryCondition.equal, value: p.id.toString(), orWhere: 'and' },
                                { conditionName: 'passed', condition: OvicQueryCondition.equal, value: '1', orWhere: 'and' }
                            ],
                            set: [
                                { label: 'limit', value: '1' },
                                { label: 'groupby', value: 'student_id' }
                            ],
                            page: null
                        }

                        const condition_student_test: ConditionOption = {
                            condition: [
                                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: f.id.toString() },
                                { conditionName: 'class_plan_activity_id', condition: OvicQueryCondition.equal, value: p.id.toString(), orWhere: 'and' },
                            ],
                            set: [
                                { label: 'limit', value: '1' },
                                { label: 'groupby', value: 'student_id' }
                            ],
                            page: null
                        }

                        if (request_student_test[i].length < 6) {
                            request_student_test[i].push(this.classPlanActivityStudentTestsService.getClassPlanActivityStudentTestsByPageNew(condition_student_test_passed).pipe(mergeMap(_passed => {
                                p['passed'] = _passed.recordsFiltered;
                                return of(null)
                            })))
                            request_student_test[i].push(this.classPlanActivityStudentTestsService.getClassPlanActivityStudentTestsByPageNew(condition_student_test).pipe(mergeMap(_student_test => {
                                p['student_tests'] = _student_test.recordsFiltered;
                                return of(null)
                            })))

                        } else {
                            i++;
                            request_student_test[i] = [];
                            request_student_test[i].push(this.classPlanActivityStudentTestsService.getClassPlanActivityStudentTestsByPageNew(condition_student_test_passed).pipe(mergeMap(_passed => {
                                p['passed'] = _passed.recordsFiltered;
                                return of(null)
                            })))
                            request_student_test[i].push(this.classPlanActivityStudentTestsService.getClassPlanActivityStudentTestsByPageNew(condition_student_test).pipe(mergeMap(_student_test => {
                                p['student_tests'] = _student_test.recordsFiltered;
                                return of(null)
                            })));
                        }

                    })
                }
            })
            this.loopGetStudentTests(0, request_student_test, dataClasses);
        }
    }

    loopGetStudentTests(key, request, dataClasses) {
        if (key < request? request.length :0) {
            this.progressValue = key / request.length * 100;
            forkJoin(request[key]).subscribe({
                next: () => {
                    this.loopGetStudentTests(key + 1, request, dataClasses);
                },
                error: () => {
                }
            })
        } else {
            this.list_class = dataClasses.map(m => {
                m['__textShow'] = this.dataWeekClass.map(week => {
                    let text_show_result = '-';
                    const index_tuan = m['class_plan'].findIndex(plan => plan.week === week.week);
                    if (index_tuan !== -1) {
                        const index = m['class_plan_activity'].findIndex(activity => activity.plan_id === m['class_plan'][index_tuan].id);
                        if (index !== -1) {
                            const passed = m['class_plan_activity'][index].passed;
                            const failed = m['class_plan_activity'][index].student_tests - passed;
                            const notTested = m['total_student'] - m['class_plan_activity'][index].student_tests;
                            text_show_result = `${passed} - ${failed} | ${notTested}`;
                        }
                    }

                    return text_show_result;
                });
                return m;
            });
            this.noitifi.isProcessing(false);
            this.displayModal = false;
        }
    }

    onChangeDonviCM(event) {
        if (event) {
            this.objectFilter.category_id = event['id'];
        } else {
            this.objectFilter.category_id = null;
        }
        this.loadClass(1);
    }


    onChangeFilter(event, keyName: string) {
        if (event) {
            this.objectFilter[keyName] = event['value'];
        } else {
            this.objectFilter[keyName] = null;
        }

        this.loadClass(1);

    }

}
