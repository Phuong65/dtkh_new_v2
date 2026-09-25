
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '@core/services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { OvicQueryCondition } from '@core/models/dto';
import { NotificationService } from '@core/services/notification.service';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { ROLES, ROUTERS } from '@modules/shared/utils/syscat';
import { forkJoin, mergeMap, of, Observable } from 'rxjs';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { CourseFormDgService } from '@modules/shared/services/course-form-dg.service';
import { CourseFormTxService, SINHDETX } from '@modules/shared/services/course-form-tx.service';
import { CoursePlanBankService } from '@modules/shared/services/course-plan-bank.service';
import { CourseFormCcService, SINHDECC } from '@modules/shared/services/course-form-cc.service';
import { HelperService } from '@core/services/helper.service';
import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';
import { CourseQuestionsService } from '@modules/shared/services/course-questions.service';
import { CoursePlanActivities } from '@modules/shared/models/course-plan-activities';
import { SharedModule } from '@modules/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { APP_CONFIGS, key_server } from '@env';
import { BUTTON_YES, BUTTON_NO } from '@core/models/buttons';
import { TabViewModule } from 'primeng/tabview';
import { ClassPlanActivities } from '@modules/shared/models/class-plan-activities';
import { MatButtonModule } from '@angular/material/button';
import { ThuongxuyenTuluanV2Component } from "../thuongxuyen-tuluan-v2/thuongxuyen-tuluan-v2.component";
import { ThuongxuyenDuanComponent } from "../thuongxuyen-duan/thuongxuyen-duan.component";
import { CauhoiTuluan15pComponent } from "../cauhoi-tuluan-15p/cauhoi-tuluan-15p.component";

@Component({
    selector: 'app-monhoc-kiemtra-danhgia',
    standalone: true,
    imports: [
    CommonModule,
    SharedModule,
    ReactiveFormsModule,
    FormsModule,
    TableModule,
    TabViewModule,
    MatButtonModule,
    ThuongxuyenTuluanV2Component,
    ThuongxuyenDuanComponent,
    CauhoiTuluan15pComponent
],
    templateUrl: './monhoc-kiemtra-danhgia.component.html',
    styleUrls: ['./monhoc-kiemtra-danhgia.component.css']
})
export class MonhocKiemtraDanhgiaComponent implements OnInit {
    isManager: boolean = false;

    isLanhDaoKhoa: boolean = false;

    isLanhDaoBomon: boolean = false;

    routerAdmin: boolean = false;

    routerDaotao: boolean = false;

    routerLanhdaokhoa: boolean = false;

    routerGiangvien: boolean = false;

    routerLanhdaobomon: boolean = false;

    userId: number;

    selectedCourse: ElnKhoaHoc;

    canAdded: boolean = false;

    list_week: CoursePlanActivities[] = [];

    label_week: string = "Bài";

    key_server = key_server;

    number_test_config: any;

    tabIndex: number = 0;

    closeLeft: boolean = false;

    selectPlan: CoursePlanActivities;

    list_plan: CoursePlanActivities[];

    indexByKeyServerInSotinchi: number;

    list_test_thuongxuyen: CoursePlanActivities[];

    showTests: boolean = false;

    isDttx = APP_CONFIGS.isDttx;
    constructor(
        private elnKhoaHocService: ElnKhoaHocService,
        private notificationService: NotificationService,
        private elngUserProfileService: ElngUserProfileService,
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private auth: AuthService,
        private courseFormTxService: CourseFormTxService,
        private courseFormDgService: CourseFormDgService,
        private coursePlanBankService: CoursePlanBankService,
        private courseFormCcService: CourseFormCcService,
        private helperService: HelperService,
        private courseQuestionsService: CourseQuestionsService,
        private coursePlanActivitiesService: CoursePlanActivitiesService,
    ) {
        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin) || this.auth.userHasRole(ROLES.troly_pdt) || this.auth.userHasRole(ROLES.chuyenvien_pdt) ? true : false;

        this.isLanhDaoKhoa = this.auth.userHasRole(ROLES.lanhdaokhoa);

        this.isLanhDaoBomon = this.auth.userHasRole(ROLES.lanhdaobomon);

        this.routerAdmin = this.auth.hasRouter(ROUTERS.admin, '/monhoc-kiemtra-danhgia');

        this.routerDaotao = this.auth.hasRouter(ROUTERS.daotao, '/monhoc-kiemtra-danhgia');

        this.routerLanhdaokhoa = this.auth.hasRouter(ROUTERS.lanhdao_khoa, '/monhoc-kiemtra-danhgia');

        this.routerGiangvien = this.auth.hasRouter(ROUTERS.giangvien, '/monhoc-kiemtra-danhgia');

        this.routerLanhdaobomon = this.auth.hasRouter(ROUTERS.lanhdao_bomon, '/monhoc-kiemtra-danhgia');

        this.userId = this.auth.user.id;
    }

    ngOnInit(): void {

        const config = JSON.parse(localStorage.getItem('--app_configs-' + APP_CONFIGS.realm));

        this.number_test_config = config.find(m => m.config_key === 'NUMOF_TEST_CCTX')['params']

        this.activatedRoute.queryParams.subscribe((params) => {
            if (params && params['code']) {
                this.notificationService.isProcessing(true);

                const course_id = params['code'];

                const contition_course: ConditionOption = {
                    condition: [
                        { conditionName: 'id', condition: OvicQueryCondition.equal, value: course_id.toString(), orWhere: 'and' },
                    ],
                    set: [
                        { label: 'limit', value: '1' }
                    ],
                    page: null
                }

                if (this.routerGiangvien) {
                    contition_course.condition.push({ conditionName: 'creator_plan_id', condition: OvicQueryCondition.equal, value: this.userId.toString(), orWhere: 'and' })
                }

                const condition_user: ConditionOption = {
                    condition: [
                        { conditionName: 'user_id', condition: OvicQueryCondition.equal, value: this.userId.toString(), orWhere: 'and' }
                    ],
                    set: [
                        { label: 'limit', value: '1' }
                    ],
                    page: null
                }

                forkJoin([
                    this.elnKhoaHocService.getKhoaHocByPageNew_2(contition_course),
                    this.elngUserProfileService.getUserProfileByPageNewV2(condition_user),
                ]).subscribe({
                    next: ([_course, _user_profile]) => {
                        if (_course.recordsFiltered) {

                            this.selectedCourse = _course.data[0];

                            if (this.routerLanhdaokhoa) {
                                if (_user_profile.recordsFiltered === 0 || this.selectedCourse.category_ids !== _user_profile.data[0].donvi_chuyenmon_id) {
                                    this.notificationService.toastError("Không tìm thấy môn học");
                                    this.router.navigate(['/admin/content-none']);
                                }
                            }

                            if (this.routerLanhdaobomon) {
                                if (_user_profile.recordsFiltered === 0 || this.selectedCourse.nganh_bomon_id !== _user_profile.data[0].bomon_id) {
                                    this.notificationService.toastError("Không tìm thấy môn học");
                                    this.router.navigate(['/admin/content-none']);
                                }
                            }

                            if (this.routerDaotao || this.routerLanhdaobomon || this.routerLanhdaokhoa || this.userId === this.selectedCourse.creator_plan_id) {
                                this.canAdded = true;
                            } else {
                                this.canAdded = false;
                            }

                            this.indexByKeyServerInSotinchi = key_server == 'hvu' ? (this.selectedCourse.params.sotinchi == 2 ? 1 : ([3, 4].includes(this.selectedCourse.params.sotinchi) ? 2 : null)) : this.selectedCourse.params.sotinchi;

                            this.loadTest();
                        } else {
                            this.notificationService.toastError("Không tìm thấy môn học");
                            this.router.navigate(['/admin/content-none']);
                        }
                    },
                    error: () => {
                        this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
                    }
                })
            } else {
                this.router.navigate(['/admin/content-none']);
            }
        })
    }

    loadTest() {
        const courseId = this.selectedCourse.id.toString();

        const condition_lesson: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: courseId, orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.notEqual, value: '0', orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.lessThan, value: '100', orWhere: 'and' },
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'include', value: 'ACTIVITY_CDR,PLAN' },
                { label: 'include_by', value: 'type' },
                { label: 'orderby', value: 'week' },
                { label: 'order', value: 'ASC' }
            ],
            page: null
        };

        const condition_plan_bank: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: courseId, orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'week,id,bank_type' },
                { label: 'include', value: 'CC,DG' },
                { label: 'include_by', value: 'bank_type' }
            ],
            page: null
        };

        const condition_form_week: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: courseId, orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'week,id' },
                { label: 'groupby', value: 'week' }
            ],
            page: null
        };

        this.notificationService.isProcessing(true);

        forkJoin({
            plan_activity: this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_lesson),
            bank: this.coursePlanBankService.getCoursePlanBankByPageNew(condition_plan_bank),
            form_cc: this.courseFormCcService.getCourseFormCcByPage(condition_form_week),
            form_dg: this.courseFormDgService.getCourseFormDgByPage(condition_form_week),
            question: this.loadQuestions(courseId),
        }).subscribe({
            next: ({ plan_activity, bank, form_cc, form_dg, question }: any) => {
                const bankDgWeeks = new Set(bank.data.filter(i => i.bank_type === 'DG').map(m => m.week));
                const bankCcWeeks = new Set(bank.data.filter(i => i.bank_type === 'CC').map(m => m.week));
                const formCcWeeks = new Set(form_cc.data.map(m => m.week));
                const formDgWeeks = new Set(form_dg.data.map(m => m.week));

                const parent = plan_activity.data.filter(m => m.parent_id === 0);
                parent.forEach(f => {
                    f['datuyet_question'] = question.data.filter(m => m['week'] === f.week).length;
                    f['children'] = this.helperService.sort(plan_activity.data.filter(m => m.parent_id === f.id), 'stt_cdr');
                    f['has_form_cc'] = formCcWeeks.has(f.week);
                    f['has_form_dg'] = formDgWeeks.has(f.week);
                    f['has_test_cc'] = bankCcWeeks.has(f.week);
                    f['has_test_dg'] = bankDgWeeks.has(f.week);
                });

                this.list_week = parent;
                this.notificationService.isProcessing(false);
            },
            error: () => {
                this.notificationService.isProcessing(false);
            }
        });
    }

    private loadQuestions(courseId: string): Observable<any> {
        const condition_parent: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: courseId, orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.lessThan, value: '100', orWhere: 'and' },
                { conditionName: 'reference', condition: OvicQueryCondition.equal, value: 'course_plan_activities', orWhere: 'and' },
                { conditionName: 'status', condition: OvicQueryCondition.equal, value: '1', orWhere: 'and' },
                { conditionName: 'group_id', condition: OvicQueryCondition.equal, value: '0', orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'status,id,cdr,reference_id,week,created_at' }
            ],
            page: null
        };

        return this.courseQuestionsService.getCourseQuestionsByPageNew(condition_parent).pipe(
            mergeMap(res => {
                if (this.selectedCourse.av !== 1 || !res.data?.length) return of(res);

                const group_ids = [...res.data.map(m => m.id), -1];
                const condition_child: ConditionOption = {
                    condition: [
                        { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: courseId, orWhere: 'and' },
                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'include', value: group_ids.toString() },
                        { label: 'include_by', value: 'group_id' },
                        { label: 'select', value: 'status,id,cdr,reference_id,week' }
                    ],
                    page: null
                };
                return this.courseQuestionsService.getCourseQuestionsByPageNew(condition_child);
            })
        );
    }

    sinhDeByWeek(row: CoursePlanActivities) {
        this.notificationService.confirm('Thầy/Cô có chắc chắn muốn sinh đề trắc nghiệm tuần '.concat(this.label_week, ' ', row.week.toString()), 'Xác nhận hành động', [BUTTON_YES, BUTTON_NO]).then(a => {
            if (a.name === 'yes') {
                const data: SINHDECC = {
                    course_id: this.selectedCourse.id,
                    week: row.week,
                    limit: this.number_test_config['CC_TEST']
                }
                this.notificationService.isProcessing(true);
                this.courseFormCcService.sinhde(data).subscribe({
                    next: (a) => {
                        this.loadTest();
                        this.notificationService.toastInfo("Đã sinh đề xong, vui lòng kiểm tra ")
                        this.notificationService.isProcessing(false);
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError("Sinh đề thất bại, vui lòng thử lại");
                    }
                })
            }
        })
    }

    deleteDeWeek(row: CoursePlanActivities) {
        this.notificationService.confirmDelete().then(a => {
            if (a) {
                this.notificationService.isProcessing(true);
                const condition_plan_bank: ConditionOption = {
                    condition: [
                        { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse.id.toString(), orWhere: 'and' },
                        { conditionName: 'bank_type', condition: OvicQueryCondition.equal, value: 'CC', orWhere: 'and' },
                        { conditionName: 'week', condition: OvicQueryCondition.equal, value: row.week.toString(), orWhere: 'and' },
                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'select', value: 'id' },
                    ],
                    page: null
                }
                this.coursePlanBankService.getCoursePlanBankByPageNew(condition_plan_bank).pipe(mergeMap(_test => {
                    const ids = _test.data.map(m => m.id);
                    if (ids.length) {
                        return this.coursePlanBankService.deleteCoursePlanBank(ids.toString()).pipe(mergeMap(() => {
                            return of(null)
                        }))
                    }
                    return of(null);
                })).subscribe({
                    next: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastSuccess("Xóa thành công");
                        this.loadTest();
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError("Xóa thất bại");
                    }
                })
            }
        })
    }

    sinhDe15pByWeek(row: CoursePlanActivities) {
        this.notificationService.confirm('Thầy/Cô có chắc chắn muốn sinh đề trắc nghiệm 15p '.concat(this.label_week, ' ', row.week.toString()), 'Xác nhận hành động', [BUTTON_YES, BUTTON_NO]).then(a => {
            if (a.name === 'yes') {
                const data: SINHDECC = {
                    course_id: this.selectedCourse.id,
                    week: row.week,
                    limit: this.number_test_config['CC_TEST']
                }
                this.notificationService.isProcessing(true);
                this.courseFormDgService.sinhde(data).subscribe({
                    next: (a) => {
                        this.loadTest();
                        this.notificationService.toastInfo("Đã sinh đề xong, vui lòng kiểm tra ")
                        this.notificationService.isProcessing(false);
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError("Sinh đề thất bại, vui lòng thử lại");
                    }
                })
            }
        })
    }

    delete15pDeByWeek(row: CoursePlanActivities) {
        this.notificationService.confirmDelete().then(a => {
            if (a) {
                this.notificationService.isProcessing(true);
                const condition_plan_bank: ConditionOption = {
                    condition: [
                        { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse.id.toString(), orWhere: 'and' },
                        { conditionName: 'bank_type', condition: OvicQueryCondition.equal, value: 'DG', orWhere: 'and' },
                        { conditionName: 'week', condition: OvicQueryCondition.equal, value: row.week.toString(), orWhere: 'and' },
                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'select', value: 'id' },
                    ],
                    page: null
                }
                this.coursePlanBankService.getCoursePlanBankByPageNew(condition_plan_bank).pipe(mergeMap(_test => {
                    const ids = _test.data.map(m => m.id);
                    if (ids.length) {
                        return this.coursePlanBankService.deleteCoursePlanBank(ids.toString()).pipe(mergeMap(() => {
                            return of(null)
                        }))
                    }
                    return of(null);
                })).subscribe({
                    next: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastSuccess("Xóa thành công");
                        this.loadTest();
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError("Xóa thất bại");
                    }
                })
            }
        })
    }

    changeTabView(event) {
        switch (this.tabIndex) {
            case 0:
                this.loadTest();
                break;
            case 1:
                this.loadThuongxuyen();
                break;
            default:
                break;
        }
    }

    loadThuongxuyen() {
        this.notificationService.isProcessing(true);
        const condition_test: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse.id.toString(), orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.equal, value: '1000', orWhere: 'and' },
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'orderby', value: 'ordering' },
                { label: 'order', value: 'ASC' }
            ],
            page: null
        }

        forkJoin([
            this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_test)
        ]).subscribe({
            next: ([_test]) => {

                const parent = _test.data.filter(m => m.parent_id === 0);

                parent.forEach(f => {
                    f['children'] = _test.data.filter(m => m.parent_id === f.id);

                    f['children'].forEach((c) => {
                        switch (c['type']) {
                            case 'THUONGXUYEN_TRACNGHIEM':
                                c['icon'] = 'fa fa-clock-o';
                                break;
                            case 'THUONGXUYEN_TULUAN':
                                c['icon'] = 'fa fa-pencil-square-o';
                                break;
                            case 'THUONGXUYEN_DUAN':
                                c['icon'] = 'fa fa-book';
                                break;
                            default:
                                break;
                        }
                    });

                    if (f['children'] && f['children'].length) {
                        this.showTests = true;
                    }
                })

                this.list_plan = parent;

                this.notificationService.isProcessing(false);
            },
            error: () => {

            }
        })
    }

    closeLeftBody() {
        this.closeLeft = !this.closeLeft;
    }

    onChangePlan(plan: CoursePlanActivities) {
        this.selectPlan = plan;
        if (this.selectPlan.type === 'THUONGXUYEN_TRACNGHIEM') {
            this.loadTestTracnghiem();
        }
    }

    loadTestTracnghiem() {
        this.notificationService.isProcessing(true);

        let total_question_need = 0;

        const condtion_form_test: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse.id.toString(), orWhere: 'and' },
                { conditionName: 'ordering', condition: OvicQueryCondition.equal, value: this.selectPlan.ordering.toString(), orWhere: 'and' },
                { conditionName: 'av', condition: OvicQueryCondition.equal, value: this.selectedCourse.av.toString(), orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '-1' }
            ],
            page: null
        }

        const condition_form_bank: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse.id.toString(), orWhere: 'and' },
                { conditionName: 'bank_type', condition: OvicQueryCondition.equal, value: 'TX', orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.equal, value: '100', orWhere: 'and' },
                { conditionName: 'ordering', condition: OvicQueryCondition.equal, value: this.selectPlan.ordering.toString(), orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '1' },
            ],
            page: null
        }

        forkJoin([
            this.courseFormTxService.getCoursePlansByPageNew(condtion_form_test).pipe(mergeMap(a => {

                let reference_ids = [];

                a.data.forEach(f => {
                    reference_ids = reference_ids.concat(f.course_plan_activity_id.split(","));
                })

                const condtion_question: ConditionOption = {
                    condition: [
                        { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse.id.toString(), orWhere: 'and' },
                        { conditionName: 'reference', condition: OvicQueryCondition.equal, value: 'course_plan_activities', orWhere: 'and' },
                        { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'include', value: reference_ids.toString() },
                        { label: 'include_by', value: 'reference_id' },
                        { label: 'select', value: 'id,status,group_id' }
                    ],
                    page: null
                }

                if (reference_ids.length) {
                    return this.courseQuestionsService.getCourseQuestionsByPageNew(condtion_question).pipe(
                        mergeMap(questionsResult => {
                            if (this.selectedCourse.av === 1) {
                                const parentStatusMap = {};
                                const childs = [];
                                questionsResult.data.forEach(q => {
                                    if (+q.group_id === 0) {
                                        parentStatusMap[q.id] = q.status;
                                    } else {
                                        childs.push(q);
                                    }
                                });
                                childs.forEach(c => {
                                    if (parentStatusMap[c.group_id] !== undefined) {
                                        c.status = parentStatusMap[c.group_id];
                                    }
                                });
                                questionsResult.data = childs;
                            }
                            return of(questionsResult);
                        })
                    );
                }

                return of(null);
            })),
            this.coursePlanBankService.getCoursePlanBankByPageNew(condition_form_bank)
        ]).subscribe({
            next: ([_question, _plan]) => {
                this.notificationService.isProcessing(false);
                if (_question) {
                    this.selectPlan['has_form_test'] = true;
                    this.selectPlan['has_question'] = _question.data.filter(m => m.status === 1).length.toString().concat("/", _question.data.length.toString());
                    this.selectPlan['_question_dat'] = _question.data.filter(m => m.status === 1).length;
                } else {
                    this.selectPlan['has_form_test'] = false;
                }

                this.selectPlan['has_test'] = _plan.data.length ? true : false;
            },
            error: () => {

            }
        })
    }

    sinhDeByKynang(row: CoursePlanActivities) {
        this.notificationService.confirm('Thầy/Cô có chắc chắn muốn sinh đề '.concat(row.title.toString()), 'Xác nhận hành động', [BUTTON_YES, BUTTON_NO]).then(a => {
            if (a.name === 'yes') {
                const data: SINHDETX = {
                    course_id: this.selectedCourse.id,
                    ordering: row.ordering,
                    limit: this.number_test_config['TX_TEST']
                }

                this.notificationService.isProcessing(true);

                this.courseFormTxService.sinhde(data).subscribe({
                    next: (a) => {
                        this.loadTestTracnghiem();
                        this.notificationService.toastInfo("Đã sinh đề xong, vui lòng kiểm tra ")
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError("Sinh đề thất bại, vui lòng thử lại");
                    }
                })
            }
        })
    }

    deleteDeKynang(row: CoursePlanActivities) {
        this.notificationService.confirmDelete().then(a => {
            if (a) {
                this.notificationService.isProcessing(true);
                const condition_plan_bank: ConditionOption = {
                    condition: [
                        { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse.id.toString(), orWhere: 'and' },
                        { conditionName: 'bank_type', condition: OvicQueryCondition.equal, value: 'TX', orWhere: 'and' },
                        { conditionName: 'week', condition: OvicQueryCondition.equal, value: '100', orWhere: 'and' },
                        { conditionName: 'ordering', condition: OvicQueryCondition.equal, value: row.ordering.toString(), orWhere: 'and' },
                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'select', value: 'id' },
                    ],
                    page: null
                }
                this.coursePlanBankService.getCoursePlanBankByPageNew(condition_plan_bank).pipe(mergeMap(_test => {
                    const ids = _test.data.map(m => m.id);
                    if (ids.length) {
                        return this.coursePlanBankService.deleteCoursePlanBank(ids.toString()).pipe(mergeMap(() => {
                            return of(null)
                        }))
                    }
                    return of(null);
                })).subscribe({
                    next: () => {
                        this.notificationService.toastSuccess("Xóa thành công");
                        this.loadTestTracnghiem();
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError("Xóa thất bại");
                    }
                })
            }
        })
    }
}
