import { CourseFormDgService } from './../../../../shared/services/course-form-dg.service';
import { CoursePlanBankService } from '@modules/shared/services/course-plan-bank.service';
import { CourseBankService } from '@modules/shared/services/course-bank-service';
import { CourseQuestionsService } from '@modules/shared/services/course-questions.service';
import { request } from 'http';
import { CourseFormTx, CourseFormTxService } from '@shared/services/course-form-tx.service';
import { CourseFormCc, CourseFormCcService } from '@shared/services/course-form-cc.service';
import { Component, OnInit, TemplateRef, inject, viewChild, viewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabsModule } from 'primeng/tabs';
import { SharedModule } from '@modules/shared/shared.module';
import { TableModule } from 'primeng/table';
import { ElnKhoaHoc, EXAMFORMAT } from '@modules/shared/models/elng-khoa-hoc';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { HelperService } from '@core/services/helper.service';
import { NotificationService } from '@core/services/notification.service';
import { UserService } from '@core/services/user.service';
import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { APP_CONFIGS, key_server } from '@env';
import { OvicQueryCondition } from '@core/models/dto';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { forkJoin, mergeMap, Observable, of } from 'rxjs';
import { CHUAN_DAU_RA, ROLES } from '@modules/shared/utils/syscat';
import { PlanActivityCdr } from '../phanbo-cdr-cauhoi/phanbo-cdr-cauhoi.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DialogModule } from 'primeng/dialog';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { PanelModule } from 'primeng/panel';
import { ButtonModule } from 'primeng/button';
import { MatListModule } from '@angular/material/list';
import { CourseQuestions } from '@modules/shared/models/course-questions';
import { FormDeKthpComponent } from '../form-de-kthp/form-de-kthp.component';

@Component({
    selector: 'app-formde-tracnghiem-v2',
    standalone: true,
    imports: [
        CommonModule,
        TabsModule,
        SharedModule,
        TableModule,
        FormsModule,
        ReactiveFormsModule,
        MatProgressBarModule,
        DialogModule,
        NgbModule,
        PanelModule,
        ButtonModule,
        MatListModule,
        FormDeKthpComponent
    ],
    templateUrl: './formde-tracnghiem-v2.component.html',
    styleUrls: ['./formde-tracnghiem-v2.component.css']
})
export class FormdeTracnghiemV2Component implements OnInit {
    private coursePlanActivitiesService = inject(CoursePlanActivitiesService);
    private elnKhoaHocService = inject(ElnKhoaHocService);
    private notificationService = inject(NotificationService);
    private activatedRoute = inject(ActivatedRoute);
    private router = inject(Router);
    private auth = inject(AuthService);
    private userService = inject(UserService);
    private helperService = inject(HelperService);
    private courseFormCcService = inject(CourseFormCcService);
    private courseFormTxService = inject(CourseFormTxService);
    private courseQuestionsService = inject(CourseQuestionsService);
    private coursePlanBankService = inject(CoursePlanBankService);
    private courseFormDgService = inject(CourseFormDgService);


    readonly templateAddBaigiang = viewChild<TemplateRef<any>>('templateAddBaigiang');

    readonly inputNumberQuestion = viewChildren<any>('inputNumberQuestion');

    selectedKhoahoc: ElnKhoaHoc;

    selectedTestTx: PlanActivityCdr;

    label_week: string;

    isManager: boolean = false;

    isLanhDaoKhoa: boolean = false;

    closeLeft: boolean = false;

    EXAMFORMAT = EXAMFORMAT;

    chuandaura = CHUAN_DAU_RA;

    activeIndexTab: number = 0;

    list_cdr_cauhoi: PlanActivityCdr[];

    list_test_dg: PlanActivityCdr[];

    progressValue: number = 0;

    displayModal: boolean = false;

    waitingTitle: string = 'Đang lưu cấu trúc đề, vui lòng chờ';

    list_part: string[];

    list_test_tx: PlanActivityCdr[];

    list_course_plan: PlanActivityCdr[];

    list_week: PlanActivityCdr[];

    list_question_txt1: CourseQuestions[];

    list_question_txt2: CourseQuestions[];

    keyServer = key_server;

    isLanhDaoBomon: boolean = false;

    constructor() {
        const config = JSON.parse(localStorage.getItem('--app_configs-' + APP_CONFIGS.realm));

        const setting = config.find(m => m.config_key === 'SETTING')['params'];

        this.label_week = setting['plan']['prefix'];

        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin) || this.auth.userHasRole(ROLES.troly_pdt) || this.auth.userHasRole(ROLES.chuyenvien_pdt) ? true : false;

        this.isLanhDaoKhoa = this.auth.userHasRole(ROLES.lanhdaokhoa);

        this.isLanhDaoBomon = this.auth.userHasRole(ROLES.lanhdaobomon);
    }

    ngOnInit(): void {
        this.initActivity();
    }


    initActivity() {
        this.activatedRoute.queryParams.subscribe((params) => {
            if (params && params['code']) {

                const courseId = params['code'];

                const condition_course: ConditionOption = {
                    condition: [
                        {
                            conditionName: 'id',
                            condition: OvicQueryCondition.equal,
                            value: courseId,
                        },
                    ],
                    set: [],
                    page: null,
                };

                this.notificationService.isProcessing(true);

                this.elnKhoaHocService.getKhoaHocByPageNew_2(condition_course).pipe(mergeMap((_course) => {
                    if (_course.recordsFiltered && _course.data[0].creator_plan_id) {
                        return this.userService.getUserByItem(_course.data[0].creator_plan_id.toString(), 'id').pipe(mergeMap(_user => {
                            if (_user.length) {
                                _course.data[0]['user_label'] = _user[0].display_name;
                            }
                            return of(_course);
                        }))
                    }
                    return of(_course);
                })).subscribe({
                    next: (_course) => {
                        this.notificationService.isProcessing(false);
                        if (_course.recordsFiltered) {
                            if (this.auth.user.id === _course.data[0].creator_plan_id || this.isManager || this.isLanhDaoKhoa || this.isLanhDaoBomon) {
                                this.selectedKhoahoc = _course.data[0];
                                this.notificationService.setCloseLeftMenu(true);
                                this.auth.setFeatureSecondary(''.concat('[', this.selectedKhoahoc.maso, '] - ', this.selectedKhoahoc.title));
                                this.loadFormCcCauhoi();
                            } else {
                                this.notificationService.toastError('Khóa học không tồn tại');
                                this.router.navigate(['/admin/kehoach-hoctap']);
                            }
                        } else {
                            this.notificationService.toastError('Khóa học không tồn tại');
                            this.router.navigate(['/admin/kehoach-hoctap']);
                        }
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError('Lỗi kết nối, vui lòng thử lại');
                        this.router.navigate(['/admin/kehoach-hoctap']);
                    }
                })
            } else {
                this.router.navigate(['/admin/content-none']);
            }
        });
    }

    changeTabView() {
        this.list_cdr_cauhoi = [];
        this.list_part = [];
        this.list_test_tx = [];
        switch (this.activeIndexTab) {
            case 0:
                this.loadFormCcCauhoi();
                break;
            case 1:
                if (this.keyServer == 'hvu') {
                    this.loadFormTxCauhoi();

                } else {
                    this.loadFormDgCauhoi();
                }
                break;
            case 2:
                this.loadFormTxCauhoi();

                break;
            default:
                break;
        }
    }

    pointQuestionKeyDown(event, inputPoint_quest) {
        if (event) {

            if (event.key === 'Tab') {
                this.nextInput(inputPoint_quest)
            }

            if (/[0-9]/.test(event.key) || event.key === 'Backspace') {
                if ((inputPoint_quest.value.replace(/\d/gi, '').length > 0 && event.key === '.')) {
                    event.preventDefault();
                }

            } else {
                event.preventDefault();
            }
        }
    }

    //** load form cc */

    loadFormCcCauhoi() {
        switch (this.selectedKhoahoc.av) {
            case 0:
                this.loadFormCcCauhoiType0();
                break;
            case 1:
                this.loadFormCcCauhoiType1();
                break;
            case 2:
                this.loadFormCcCauhoiType0();
                break;
            default:
                break;
        }
    }


    closeLeftBody() {
        this.closeLeft = !this.closeLeft;
    }



    saveFormCc() {
        // this.loadAllCourseType0();
        switch (this.selectedKhoahoc.av) {
            case 0:
                this.saveFormCcType0();
                break;
            case 1:
                this.saveFormCcType1();
                break;
            case 2:
                this.saveFormCcType0();
                break;
            default:
                break;
        }
    }


    loopAddForm(request: Observable<any>[], key: number): Observable<any> {
        return request[key].pipe(mergeMap(a => {
            this.progressValue = (key + 1) / request.length * 100;
            if (request[key + 1]) {
                return this.loopAddForm(request, key + 1);
            } else {
                return of(null);
            }
        }))
    }

    closeForm() {
        this.notificationService.closeSideNavigationMenu();
    }
    //** môn thường */
    loadFormCcCauhoiType0() {
        const condition_lesson: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedKhoahoc.id.toString(), orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.notEqual, value: '0', orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.lessThan, value: '100', orWhere: 'and' },
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'include', value: 'ACTIVITY_CDR,PLAN' },
                { label: 'include_by', value: 'type' },
                { label: 'orderby', value: 'ordering' },
                { label: 'order', value: 'ASC' }
            ],

            page: null
        }

        const condition_form_cc: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedKhoahoc.id.toString(), orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' }
            ],
            page: null
        }

        const condition_plan_bank: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedKhoahoc.id.toString(), orWhere: 'and' },
                { conditionName: 'bank_type', condition: OvicQueryCondition.equal, value: 'CC', orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'groupby', value: 'week' }
            ],
            page: null
        }

        const condition_question: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedKhoahoc.id.toString(), orWhere: 'and' },
                { conditionName: 'reference', condition: OvicQueryCondition.equal, value: 'course_plan_activities', orWhere: 'and' },
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
                { conditionName: 'private', condition: OvicQueryCondition.equal, value: '0', orWhere: 'and' },
                { conditionName: 'group_id', condition: OvicQueryCondition.equal, value: '0', orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'code,reference_id,week,id,group_id,cdr' }
            ],
            page: null
        }

        this.notificationService.isProcessing(true);

        forkJoin([
            this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_lesson),
            this.courseFormCcService.getCourseFormCcByPage(condition_form_cc),
            this.coursePlanBankService.getCoursePlanBankByPageNew(condition_plan_bank),
            this.courseQuestionsService.getCourseQuestionsByPageNew(condition_question)
        ]).subscribe({
            next: ([_plan_activity, _form_cc, _plan_bank, _question]) => {

                this.notificationService.isProcessing(false);

                const parent = _plan_activity.data.filter(m => m.parent_id === 0);

                parent.forEach(f => {

                    const children = _plan_activity.data.filter(m => m.parent_id === f.id);

                    f['total_question'] = 0;

                    f['question_take_total'] = 0;

                    const index_week_bank = _plan_bank.data.findIndex(m => m.week === f.week);

                    f['canEdit'] = this.isManager || index_week_bank === -1 ? true : false;

                    f['has_test'] = index_week_bank !== -1 ? true : false;

                    children.forEach(c => {
                        const question_week = _question.data.filter(m => m['week'] === f.week && m.reference_id === c.id);

                        if (c.cdr_cauhoi)
                            Object.keys(c.cdr_cauhoi).forEach(o => {
                                if (!isNaN(parseFloat(o))) {
                                    c.cdr_cauhoi[o] = question_week.filter(m => Number(m.cdr) === Number(o)).length;
                                }
                            })

                        c['kyhieu_stt'] = parseFloat(c.kyhieu.replace(/\D/gi, ''));

                        c['total_question_cdr'] = 0;

                        c['question_take'] = {};

                        c['question_take_total'] = 0;

                        const form_cc_take = _form_cc.data.filter(m => m.course_plan_activity_id === c.id);

                        form_cc_take.forEach(fr => {
                            if (c.cdr_cauhoi[fr.cdr])
                                c['question_take'][fr.cdr] = fr.question_take;
                        })

                        if (c.params && c.params.cdr && c.params.cdr.cdr_info) {
                            const index = c.params.cdr.cdr_info.findIndex(m => m.id === 'level_require');
                            if (index !== -1) {
                                c['cdr_name'] = c.params.cdr.cdr_info[index].value;
                                c['cdr_level'] = c.params.cdr.cdr_info[index].key;
                            }
                        }

                        if (c.cdr_cauhoi) {
                            Object.keys(c.cdr_cauhoi).forEach(cdrc => {
                                if (!isNaN(parseFloat(cdrc))) {
                                    f['total_question'] = f['total_question'] + c.cdr_cauhoi[cdrc];
                                    c['total_question_cdr'] = c['total_question_cdr'] + c.cdr_cauhoi[cdrc];
                                }
                            })
                        }

                        this.setNumberCdrCauhoi(f, c, false);

                        f['question_take_total'] = f['question_take_total'] + c['question_take_total'];

                    })

                    f['children'] = this.helperService.sort(children, 'kyhieu_stt');
                })

                this.list_cdr_cauhoi = parent;
            },

            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
            }
        })
    }

    setNumberCdrCauhoi(parent: PlanActivityCdr, child: PlanActivityCdr, reRun: boolean = true) {

        let require = false;

        let s = 0;

        let pri = 0;

        Object.keys(child['question_take']).forEach(c => {
            if (child['question_take'][c] > child.cdr_cauhoi[c]) {
                require = true;
            }
            s = child['question_take'][c] + s;
        })

        if (child['question_take_private']) {
            Object.keys(child['question_take_private']).forEach(c => {
                if (child['question_take_private'][c] > child['cdr_cauhoi_private'][c]) {
                    require = true;
                }
                pri = child['question_take_private'][c] + pri;
            })
        }

        child['question_take_total_private'] = pri;

        child['question_take_total'] = s;

        child['require_cdr'] = require;

        if (reRun) {
            let s_parent = 0;
            let s_parent_private = 0;
            if (parent.children) {
                parent.children.forEach(p => {
                    s_parent = p['question_take_total'] + s_parent;
                    s_parent_private = p['question_take_total_private'] + s_parent_private;
                })
                parent['question_take_total'] = s_parent;
                parent['question_take_total_private'] = s_parent_private;
            }
        }
    }

    saveFormCcType0() {
        let check = false;
        const request: Observable<any>[] = [
            this.courseFormCcService.deleteCourseFormCcByCol(this.selectedKhoahoc.id.toString(), 'course_id')
        ];
        this.list_cdr_cauhoi.forEach(f => {
            if (f.children) {
                f.children.forEach(c => {
                    if (c['require_cdr']) {
                        check = true;
                    }

                    if (c['question_take']) {
                        Object.keys(c['question_take']).forEach(q => {
                            if (c['question_take'][q]) {
                                const data = {
                                    course_id: this.selectedKhoahoc.id,
                                    course_plan_activity_id: c.id,
                                    week: c.week,
                                    cdr: parseFloat(q),
                                    question_take: c['question_take'][q],
                                    av: this.selectedKhoahoc.av
                                }
                                request.push(this.courseFormCcService.addCourseFormCc(data))
                            }
                        })
                    }
                })
            }
        })

        if (check) {
            return this.notificationService.toastWarning("Vui lòng kiểm tra lại số lượng câu hỏi lấy");
        } else {
            if (request.length > 1) {
                this.progressValue = 0;
                this.displayModal = true;
                this.loopAddForm(request, 0).subscribe({
                    next: () => {
                        this.displayModal = false;
                        this.notificationService.toastSuccess("Lưu thành công")
                        this.loadFormCcCauhoi();
                    },
                    error: () => {
                        this.displayModal = false;
                        this.notificationService.toastError("Lưu thất bại, vui lòng thử lại")
                    }
                })
            }
        }
    }

    //** môn tiếng anh */
    loadFormCcCauhoiType1() {
        const condition_lesson: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedKhoahoc.id.toString(), orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.notEqual, value: '0', orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.lessThan, value: '100', orWhere: 'and' },
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'include', value: 'ACTIVITY_CDR,PLAN' },
                { label: 'include_by', value: 'type' },
                { label: 'orderby', value: 'ordering' },
                { label: 'order', value: 'ASC' }
            ],

            page: null
        }

        const condition_form_cc: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedKhoahoc.id.toString(), orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' }
            ],
            page: null
        }

        const condition_question: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedKhoahoc.id.toString(), orWhere: 'and' },
                { conditionName: 'reference', condition: OvicQueryCondition.equal, value: 'course_plan_activities', orWhere: 'and' },
                // { conditionName: 'group_id', condition: OvicQueryCondition.equal, value: '0', orWhere: 'and' },
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
                { conditionName: 'private', condition: OvicQueryCondition.equal, value: '0', orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'code,reference_id,week,id,group_id,private' }
            ],
            page: null
        }

        const condition_plan_bank: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedKhoahoc.id.toString(), orWhere: 'and' },
                { conditionName: 'bank_type', condition: OvicQueryCondition.equal, value: 'CC', orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'groupby', value: 'week' }
            ],
            page: null
        }

        this.notificationService.isProcessing(true);

        forkJoin([
            this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_lesson),
            this.courseFormCcService.getCourseFormCcByPage(condition_form_cc),
            this.courseQuestionsService.getCourseQuestionsByPageNew(condition_question),
            this.coursePlanBankService.getCoursePlanBankByPageNew(condition_plan_bank)
        ]).subscribe({
            next: ([_plan_activity, _form_cc, _question, _plan_bank]) => {

                this.notificationService.isProcessing(false);

                const parent = _plan_activity.data.filter(m => m.parent_id === 0);

                _question.data.forEach(c => {
                    c['stt_code'] = parseFloat(c.code.replace(/\D/gi, ''));
                })

                const parent_question = _question.data.filter(m => m.group_id === 0);

                let child_question = [];

                parent_question.forEach(f => {
                    const child = _question.data.filter(m => m.group_id === f.id);
                    child.forEach(c => {
                        c.code = f.code;
                    })

                    child_question = child_question.concat(child);
                })

                const part_list = this.helperService.sort(parent_question, 'stt_code').map(m => m.code);

                this.list_part = [... new Set(part_list)];

                parent.forEach(f => {

                    const children = _plan_activity.data.filter(m => m.parent_id === f.id);

                    f['total_question'] = 0;

                    f['question_take_total'] = 0;

                    const index_week_bank = _plan_bank.data.findIndex(m => m.week === f.week);

                    f['canEdit'] = this.isManager || index_week_bank === -1 ? true : false;

                    f['has_test'] = index_week_bank !== -1 ? true : false;

                    children.forEach(c => {

                        c['kyhieu_stt'] = parseFloat(c.kyhieu.replace(/\D/gi, ''));

                        c['total_question_cdr'] = 0;

                        c['question_take_total'] = 0;

                        c['parts'] = {};

                        if (c.params && c.params.cdr && c.params.cdr.cdr_info) {
                            const index = c.params.cdr.cdr_info.findIndex(m => m.id === 'level_require');
                            if (index !== -1) {
                                c['cdr_name'] = c.params.cdr.cdr_info[index].value;
                                c['cdr_level'] = c.params.cdr.cdr_info[index].key;
                            }
                        }

                        // if (c.cdr_cauhoi) {
                        //     Object.keys(c.cdr_cauhoi).forEach(cdrc => {
                        //         if (!isNaN(parseFloat(cdrc))) {
                        //             f['total_question'] = f['total_question'] + c.cdr_cauhoi[cdrc];
                        //             c['total_question_cdr'] = c['total_question_cdr'] + c.cdr_cauhoi[cdrc];
                        //         }
                        //     })
                        // }



                        const part_child = parent_question.filter(m => m.reference_id === c.id);

                        part_child.forEach(p => {

                            const _question_take = _form_cc.data.filter(m => m.part === p.code && m.week === f.week && m.course_plan_activity_id === c.id);

                            let s_take = 0;

                            _question_take.forEach(c => {
                                s_take = c.question_take + s_take;
                            })

                            c['parts'][p.code] = {
                                max_question: child_question.filter(m => m.group_id !== 0 && m.code === p.code && m.reference_id === c.id).length,
                                question_take: s_take !== 0 ? s_take : null
                            }
                        })

                        Object.keys(c['parts']).forEach(p => {
                            f['total_question'] = f['total_question'] + c['parts'][p]['max_question'];
                            c['total_question_cdr'] = c['total_question_cdr'] + c['parts'][p]['max_question'];
                        })

                        this.setNumberPartQuestionType1(f, c);

                        f['question_take_total'] = f['question_take_total'] + c['question_take_total'];

                    })

                    f['children'] = this.helperService.sort(children, 'kyhieu_stt');

                });

                this.list_cdr_cauhoi = parent;
            },

            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
            }
        })
    }

    setNumberPartQuestionType1(parent: PlanActivityCdr, child: PlanActivityCdr, reRun: boolean = true) {
        let require = false;

        let s = 0;

        let s_private = 0;

        Object.keys(child['parts']).forEach(f => {
            if (child['parts'][f]['question_take'] > child['parts'][f]['max_question']) {
                require = true;
            }

            if (child['parts'][f]['question_take']) {
                s = child['parts'][f]['question_take'] + s;
            }
        })

        if (child['parts_private'])
            Object.keys(child['parts_private']).forEach(f => {
                if (child['parts_private'][f]['question_take'] > child['parts_private'][f]['max_question']) {
                    require = true;
                }

                if (child['parts_private'][f]['question_take']) {
                    s_private = child['parts_private'][f]['question_take'] + s_private;
                }
            })

        child['question_take_total'] = s;

        child['question_take_total_private'] = s_private;

        child['require_part'] = require;

        if (reRun) {
            let s_parent = 0;
            let s_parent_private = 0;
            if (parent.children) {
                parent.children.forEach(p => {
                    s_parent = p['question_take_total'] + s_parent;
                    s_parent_private = p['question_take_total_private'] + s_parent_private;
                })
                parent['question_take_total'] = s_parent;
                parent['question_take_total_private'] = s_parent_private;
            }
        }
    }

    saveFormCcType1() {

        let check = false;

        const request: Observable<any>[] = [
            this.courseFormCcService.deleteCourseFormCcByCol(this.selectedKhoahoc.id.toString(), 'course_id')
        ];

        this.list_cdr_cauhoi.forEach(f => {
            if (f.children) {
                f.children.forEach(c => {
                    if (c['require_part']) {
                        check = true;
                    }

                    if (c['parts']) {
                        Object.keys(c['parts']).forEach(q => {
                            if (c['parts'][q]['question_take']) {
                                const data = {
                                    course_id: this.selectedKhoahoc.id,
                                    course_plan_activity_id: c.id,
                                    child_question_take: 1,
                                    week: c.week,
                                    part: q,
                                    question_take: c['parts'][q]['question_take'],
                                    av: this.selectedKhoahoc.av
                                }
                                request.push(this.courseFormCcService.addCourseFormCc(data))
                            }
                        })
                    }
                })
            }
        })

        if (check) {
            return this.notificationService.toastWarning("Vui lòng kiểm tra lại số lượng câu hỏi lấy");
        } else {
            if (request.length > 1) {
                this.progressValue = 0;
                this.displayModal = true;
                this.loopAddForm(request, 0).subscribe({
                    next: () => {
                        this.displayModal = false;
                        this.notificationService.toastSuccess("Lưu thành công")
                        this.loadFormCcCauhoi();
                    },
                    error: () => {
                        this.displayModal = false;
                        this.notificationService.toastError("Lưu thất bại, vui lòng thử lại")
                    }
                })
            }
        }
    }

    //** bai kiem tra thuong xuyen

    loadFormTxCauhoi() {
        switch (this.selectedKhoahoc.av) {
            case 0:
                this.loadFormtxCauhoiType0();
                break;
            case 1:
                this.loadFormtxCauhoiType1();
                break;
            case 2:
                this.loadFormtxCauhoiType2();
                break;
            default:
                break;
        }
    }

    //** thường xuyên môn thường */
    loadFormtxCauhoiType0() {
        const condition_lesson: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedKhoahoc.id.toString(), orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.notEqual, value: '0', orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.notEqual, value: '100', orWhere: 'and' },
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'include', value: 'ACTIVITY_CDR,PLAN,THUONGXUYEN_TRACNGHIEM' },
                { label: 'include_by', value: 'type' },
                { label: 'orderby', value: 'ordering' },
                { label: 'order', value: 'ASC' },
            ],

            page: null
        }

        const condition_form_Tx: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedKhoahoc.id.toString(), orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' }
            ],
            page: null
        }

        const condition_plan_bank: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedKhoahoc.id.toString(), orWhere: 'and' },
                { conditionName: 'bank_type', condition: OvicQueryCondition.equal, value: 'TX', orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'groupby', value: 'ordering' }
            ],
            page: null
        }

        const condition_question: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedKhoahoc.id.toString(), orWhere: 'and' },
                { conditionName: 'reference', condition: OvicQueryCondition.equal, value: 'course_plan_activities', orWhere: 'and' },
                { conditionName: 'group_id', condition: OvicQueryCondition.equal, value: '0', orWhere: 'and' },
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'code,reference_id,week,id,group_id,private' }
            ],
            page: null
        }

        this.notificationService.isProcessing(true);

        forkJoin([
            this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_lesson),
            this.courseFormTxService.getCoursePlansByPageNew(condition_form_Tx),
            this.coursePlanBankService.getCoursePlanBankByPageNew(condition_plan_bank),
            this.courseQuestionsService.getCourseQuestionsByPageNew(condition_question)
        ]).subscribe({
            next: ([_course_plan, _form_tx, _plan_bank, _course_question]) => {

                this.list_course_plan = _course_plan.data;

                const test_tx = _course_plan.data.filter(m => m.type === 'THUONGXUYEN_TRACNGHIEM');

                const plan = _course_plan.data.filter(m => m.type === 'PLAN' && m.ordering !== 1000);

                plan.forEach(f => {
                    f.children = _course_plan.data.filter(m => m.parent_id === f.id);
                    f['total_question'] = 0;
                    f['total_question_private'] = 0;
                    f.children.forEach(c => {
                        f['total_question'] = f['total_question'] + _course_question.data.filter(m => m.week === f.week && m.reference_id === c.id && !m.private).length
                        f['total_question_private'] = f['total_question_private'] + _course_question.data.filter(m => m.week === f.week && m.reference_id === c.id && m.private === 1).length

                    })
                })

                const ordering_take = {};
                _form_tx.data.forEach(f => {
                    if (!ordering_take[f.ordering]) {
                        ordering_take[f.ordering] = {};
                        if (!ordering_take[f.ordering][f.week])
                            ordering_take[f.ordering][f.week] = true;
                    } else {
                        if (!ordering_take[f.ordering][f.week])
                            ordering_take[f.ordering][f.week] = true;
                    }
                })

                test_tx.forEach(f => {

                    if (this.selectedKhoahoc.params) {

                        const index_ordering = _plan_bank.data.findIndex(m => m['ordering'] === f.ordering);

                        f['canEdit'] = this.isManager || index_ordering === -1 ? true : false;

                        f['has_test'] = index_ordering !== -1 ? true : false;

                        f['weeks_test'] = [];

                        if (ordering_take[f.ordering]) {
                            this.helperService.sort(plan.filter(m => ordering_take[f.ordering][m.week]), 'week').forEach(t => {
                                f['weeks_test'].push({ ...t });
                            });
                        }

                        f['total_question'] = 0;

                        f['total_question_take'] = 0;

                        f['total_question_take_private'] = 0;

                        if (f['weeks_test']) {
                            f['weeks_test'].forEach(w => {

                                f['total_question'] = w['total_question'] + f['total_question'];

                                w['total_question_take'] = 0;

                                w['total_question_take_private'] = 0;

                                const index = _form_tx.data.findIndex(m => m.ordering === f.ordering && m.week === w.week && m.private === 0);

                                if (index !== -1) {
                                    w['total_question_take'] = _form_tx.data[index].question_take;
                                    w['_form_tx_id'] = _form_tx.data[index].id;
                                }

                                const index_private = _form_tx.data.findIndex(m => m.ordering === f.ordering && m.week === w.week && m.private === 1);

                                if (index_private !== -1) {
                                    w['total_question_take_private'] = _form_tx.data[index_private].question_take;
                                    w['_form_tx_id'] = _form_tx.data[index_private].id;
                                }

                            })
                        }

                        f['form_tx_ids'] = _form_tx.data.filter(m => m.ordering === f.ordering).map(m => m.id);

                        this.setQuestiontakeFormTxType0(f);
                    }
                })

                this.list_test_tx = this.helperService.sort(test_tx, 'ordering');

                console.log(this.list_test_tx);

                this.notificationService.isProcessing(false);
            },
            error: () => {

            }
        })
    }

    setQuestiontakeFormTxType0(test_tx: PlanActivityCdr) {

        let s = 0;

        let s_private = 0;
        if (test_tx.weeks_test) {
            test_tx.weeks_test.forEach(f => {
                if (f['total_question_take']) {

                    if (f['total_question_take'] > f['total_question']) {
                        f['require_question'] = true;
                    } else {
                        f['require_question'] = false;
                    }

                    s = s + f['total_question_take'];
                }

                if (f['total_question_take_private']) {
                    if (f['total_question_take_private'] > f['total_question_private']) {
                        f['require_question'] = true;
                    } else {
                        f['require_question'] = false;
                    }

                    s_private = s_private + f['total_question_take_private'];
                }
            })

            if (s !== 0)
                test_tx['total_question_take'] = s;

            if (s_private !== 0) {
                test_tx['total_question_take_private'] = s_private;
            }
        }
    }

    saveFormTx(test: PlanActivityCdr = null) {
        switch (this.selectedKhoahoc.av) {
            case 0:
                this.saveFormTxType0(test);
                break;
            case 1:
                this.saveFormTxType1(test);
                break;
            case 2:
                this.saveFormTxType2(test);
                break;
            default:
                break;
        }
    }

    saveFormTxType0(test: PlanActivityCdr) {
        let check = false;

        const request: Observable<any>[] = [];

        if (test['form_tx_ids'] && test['form_tx_ids'].length) {
            request.push(this.courseFormTxService.deleteCourseFormTx(test['form_tx_ids'].toString()))
        }

        if (test.weeks_test) {
            test.weeks_test.forEach(c => {

                if (c['require_question']) {
                    check = true;
                }

                const course_plan_activity_ids = c.children.map(m => m.id);

                if (c['total_question_take']) {
                    const data = {
                        course_id: this.selectedKhoahoc.id,
                        course_plan_activity_id: course_plan_activity_ids.toString(),
                        week: c.week,
                        question_take: c['total_question_take'],
                        ordering: test.ordering,
                        av: this.selectedKhoahoc.av,
                    }
                    request.push(this.courseFormTxService.addCourseFormTx(data))
                }

                if (c['total_question_take_private']) {
                    const data = {
                        course_id: this.selectedKhoahoc.id,
                        course_plan_activity_id: course_plan_activity_ids.toString(),
                        week: c.week,
                        question_take: c['total_question_take_private'],
                        ordering: test.ordering,
                        av: this.selectedKhoahoc.av,
                        private: 1
                    }
                    request.push(this.courseFormTxService.addCourseFormTx(data))
                }
            })
        }

        if (check) {
            return this.notificationService.toastWarning("Vui lòng kiểm tra lại số lượng câu hỏi lấy");
        } else {
            if (request.length > 1) {
                this.progressValue = 0;
                this.displayModal = true;
                this.loopAddForm(request, 0).subscribe({
                    next: () => {
                        this.displayModal = false;
                        this.notificationService.toastSuccess("Lưu thành công")
                        this.loadFormTxCauhoi();
                    },
                    error: () => {
                        this.displayModal = false;
                        this.notificationService.toastError("Lưu thất bại, vui lòng thử lại")
                    }
                })
            }
        }
    }

    //** thường xuyên tiếng anh */

    loadFormtxCauhoiType1() {
        const condition_lesson: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedKhoahoc.id.toString(), orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.notEqual, value: '0', orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.notEqual, value: '100', orWhere: 'and' },
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'include', value: 'ACTIVITY_CDR,PLAN,THUONGXUYEN_TRACNGHIEM' },
                { label: 'include_by', value: 'type' },
                { label: 'orderby', value: 'ordering' },
                { label: 'order', value: 'ASC' },
            ],

            page: null
        }

        const condition_form_Tx: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedKhoahoc.id.toString(), orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' }
            ],
            page: null
        }

        const condition_question: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedKhoahoc.id.toString(), orWhere: 'and' },
                { conditionName: 'reference', condition: OvicQueryCondition.equal, value: 'course_plan_activities', orWhere: 'and' },
                // { conditionName: 'group_id', condition: OvicQueryCondition.equal, value: '0', orWhere: 'and' },
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'code,reference_id,week,id,group_id,private' }
            ],
            page: null
        }

        const condition_plan_bank: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedKhoahoc.id.toString(), orWhere: 'and' },
                { conditionName: 'bank_type', condition: OvicQueryCondition.equal, value: 'TX', orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'groupby', value: 'ordering' }
            ],
            page: null
        }

        this.notificationService.isProcessing(true);

        forkJoin([
            this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_lesson),
            this.courseFormTxService.getCoursePlansByPageNew(condition_form_Tx),
            this.courseQuestionsService.getCourseQuestionsByPageNew(condition_question),
            this.coursePlanBankService.getCoursePlanBankByPageNew(condition_plan_bank)
        ]).subscribe({
            next: ([_course_plan, _form_tx, _question, _plan_bank]) => {

                // this.list_question_txt1 = _question.data;

                _question.data.forEach(c => {
                    c['stt_code'] = parseFloat(c.code.replace(/\D/gi, ''));
                })

                const parent_question = _question.data.filter(m => m.group_id === 0);

                let question_child = [];

                parent_question.forEach(f => {

                    const child = _question.data.filter(m => m.group_id === f.id);

                    child.forEach(c => {
                        c.code = f.code;
                    })

                    question_child = question_child.concat(child);
                })

                this.list_question_txt1 = question_child.concat(parent_question);

                const part_list = this.helperService.sort(parent_question, 'stt_code').map(m => m.code);

                this.list_part = [... new Set(part_list)];

                const test_tx = _course_plan.data.filter(m => m.type === 'THUONGXUYEN_TRACNGHIEM');

                const plan = _course_plan.data.filter(m => m.type === 'PLAN' && m.ordering !== 1000);

                const ordering_take = {};

                _form_tx.data.forEach(f => {
                    if (!ordering_take[f.ordering]) {
                        ordering_take[f.ordering] = {};
                        if (!ordering_take[f.ordering][f.week])
                            ordering_take[f.ordering][f.week] = true;
                    } else {
                        if (!ordering_take[f.ordering][f.week])
                            ordering_take[f.ordering][f.week] = true;
                    }
                })

                this.list_course_plan = _course_plan.data;

                test_tx.forEach(f => {

                    if (this.selectedKhoahoc.params) {

                        const index_ordering = _plan_bank.data.findIndex(m => m['ordering'] === f.ordering);

                        f['canEdit'] = this.isManager || index_ordering === -1 ? true : false;

                        f['has_test'] = index_ordering !== -1 ? true : false;

                        f['weeks_test'] = [];

                        if (ordering_take[f.ordering]) {
                            this.helperService.sort(plan.filter(m => ordering_take[f.ordering][m.week]), 'week').forEach(t => {
                                f['weeks_test'].push({ ...t });
                            });
                        }

                        f['weeks_test'].forEach(w => {
                            const children = [];
                            _course_plan.data.forEach(c => {
                                if (c.parent_id === w.id) {
                                    const ct = {};
                                    Object.keys(c).forEach(o => {
                                        ct[o] = c[o];
                                    })
                                    children.push(ct);
                                }
                            })

                            w['total_question'] = 0;

                            w['question_take_total'] = 0;

                            w['question_take_total_private'] = 0;

                            w['_form_tx_ids'] = _form_tx.data.filter(m => m.week === w.week && m.ordering === f.ordering).map(m => m.id);

                            w['_form_tx_ids'] = [... new Set(w['_form_tx_ids'])];

                            children.forEach(c => {

                                c['kyhieu_stt'] = parseFloat(c.kyhieu.replace(/\D/gi, ''));

                                c['total_question_cdr'] = this.list_question_txt1.filter(m => m.group_id !== 0 && m.reference_id === c.id && m.private === 0).length;

                                c['total_question_cdr_private'] = this.list_question_txt1.filter(m => m.group_id !== 0 && m.reference_id === c.id && m.private === 1).length

                                w['total_question'] = w['total_question'] + c['total_question_cdr'] + c['total_question_cdr_private'];

                                c['question_take_total'] = 0;

                                c['question_take_total_private'] = 0;

                                c['parts'] = {};

                                c['parts_private'] = {};

                                if (c.params && c.params.cdr && c.params.cdr.cdr_info) {
                                    const index = c.params.cdr.cdr_info.findIndex(m => m.id === 'level_require');
                                    if (index !== -1) {
                                        c['cdr_name'] = c.params.cdr.cdr_info[index].value;
                                        c['cdr_level'] = c.params.cdr.cdr_info[index].key;
                                    }
                                }

                                // if (c.cdr_cauhoi) {
                                //     Object.keys(c.cdr_cauhoi).forEach(cdrc => {
                                //         if (!isNaN(parseFloat(cdrc))) {
                                //             w['total_question'] = w['total_question'] + c.cdr_cauhoi[cdrc];
                                //             c['total_question_cdr'] = c['total_question_cdr'] + c.cdr_cauhoi[cdrc];
                                //         }
                                //     })
                                // }

                                const part_child = parent_question.filter(m => m.reference_id === c.id);

                                part_child.forEach(p => {

                                    const _question_take = _form_tx.data.filter(m => m.ordering === f.ordering && m.part === p.code && m.week === w.week && m.course_plan_activity_id.toString() === c.id.toString() && m.private === 0);

                                    let s_take = 0;

                                    _question_take.forEach(c => {
                                        s_take = c.question_take + s_take;
                                    })

                                    c['parts'][p.code] = {
                                        max_question: this.list_question_txt1.filter(m => m.group_id !== 0 && m.code === p.code && m.reference_id === c.id && m.private === 0).length,
                                        question_take: s_take !== 0 ? s_take : null
                                    }

                                    /** private */

                                    const _question_take_private = _form_tx.data.filter(m => m.ordering === f.ordering && m.part === p.code && m.week === w.week && m.course_plan_activity_id.toString() === c.id.toString() && m.private === 1);

                                    let s_take_private = 0;

                                    _question_take_private.forEach(c => {
                                        s_take_private = c.question_take + s_take_private;
                                    })

                                    c['parts_private'][p.code] = {
                                        max_question: this.list_question_txt1.filter(m => m.group_id !== 0 && m.code === p.code && m.reference_id === c.id && m.private === 1).length,
                                        question_take: s_take_private !== 0 ? s_take_private : null
                                    }
                                })

                                this.setNumberPartQuestionType1(f, c);

                                w['question_take_total'] = w['question_take_total'] + c['question_take_total'];

                                w['question_take_total_private'] = w['question_take_total_private'] + c['question_take_total_private']

                            })

                            f['form_tx_ids'] = _form_tx.data.filter(m => m.ordering === f.ordering).map(m => m.id);

                            f['form_tx_ids'] = [... new Set(f['form_tx_ids'])];

                            w['children'] = this.helperService.sort(children, 'kyhieu_stt');
                        })
                    }
                })



                this.list_test_tx = this.helperService.sort(test_tx, 'ordering');

                this.notificationService.isProcessing(false);
            },
            error: () => {

            }
        })
    }

    setQuestiontakeFormTxType1(_test: PlanActivityCdr, _row: string) {
        if (_test['weeks_test']) {
            let s = 0;

            let check_require = false;

            _test['weeks_test'].forEach(f => {
                if (f['parts'][_row]['question_take']) {
                    s = s + f['parts'][_row]['question_take'];
                    if (f['parts'][_row]['question_take'] > f['parts'][_row]['max_question']) {
                        check_require = true;
                    }
                }
            })

            _test['require_part'][_row] = check_require;

            _test['total_question_take'][_row] = s !== 0 ? s : null;

        }
    }

    saveFormTxType1(test: PlanActivityCdr) {

        if (test) {

            let check = false;

            const request: Observable<any>[] = [];

            if (test['form_tx_ids'] && test['form_tx_ids'].length) {
                request.push(this.courseFormTxService.deleteCourseFormTx(test['form_tx_ids'].toString()))
            }

            test['weeks_test'].forEach(f => {
                if (f.children) {
                    f.children.forEach(c => {
                        if (c['require_part']) {
                            check = true;
                        }

                        if (c['parts']) {
                            Object.keys(c['parts']).forEach(q => {
                                if (c['parts'][q]['question_take']) {
                                    const data = {
                                        course_id: this.selectedKhoahoc.id,
                                        course_plan_activity_id: c.id,
                                        child_question_take: 1,
                                        week: c.week,
                                        part: q,
                                        question_take: c['parts'][q]['question_take'],
                                        av: this.selectedKhoahoc.av,
                                        ordering: test.ordering
                                    }
                                    request.push(this.courseFormTxService.addCourseFormTx(data))
                                }
                            })
                        }

                        if (c['parts_private']) {
                            Object.keys(c['parts_private']).forEach(q => {
                                if (c['parts_private'][q]['question_take']) {
                                    const data = {
                                        course_id: this.selectedKhoahoc.id,
                                        course_plan_activity_id: c.id,
                                        child_question_take: 1,
                                        week: c.week,
                                        part: q,
                                        question_take: c['parts_private'][q]['question_take'],
                                        av: this.selectedKhoahoc.av,
                                        ordering: test.ordering,
                                        private: 1
                                    }
                                    request.push(this.courseFormTxService.addCourseFormTx(data))
                                }
                            })
                        }
                    })
                }
            })

            if (check) {
                return this.notificationService.toastWarning("Vui lòng kiểm tra lại số lượng câu hỏi lấy");
            } else {
                if (request.length > 1) {
                    this.progressValue = 0;
                    this.displayModal = true;
                    this.loopAddForm(request, 0).subscribe({
                        next: () => {
                            this.displayModal = false;
                            this.notificationService.toastSuccess("Lưu thành công")
                            this.loadFormTxCauhoi();
                        },
                        error: () => {
                            this.displayModal = false;
                            this.notificationService.toastError("Lưu thất bại, vui lòng thử lại")
                        }
                    })
                }
            }

            // const request: Observable<any>[] = [];

            // if (test['form_tx_ids'] && test['form_tx_ids'].length) {
            //     request.push(this.courseFormTxService.deleteCourseFormTx(test['form_tx_ids'].toString()))
            // }

            // this.list_part.forEach(p => {
            //     if (test['require_part'][p] === true) {
            //         check_require = true;
            //     }
            // })

            // if (test['weeks_test']) {
            //     test['weeks_test'].forEach(w => {
            //         const course_plan_activity_ids = w.children.map(m => m.id);
            //         if (w['parts']) {
            //             Object.keys(w['parts']).forEach(c => {
            //                 if (w['parts'][c]['question_take']) {
            //                     const data = {
            //                         course_id: this.selectedKhoahoc.id,
            //                         course_plan_activity_id: course_plan_activity_ids.toString(),
            //                         week: w.week,
            //                         question_take: w['parts'][c]['question_take'],
            //                         ordering: test.ordering,
            //                         av: this.selectedKhoahoc.av,
            //                         child_question_take: 1,
            //                         part: c
            //                     }
            //                     request.push(this.courseFormTxService.addCourseFormTx(data))
            //                 }
            //             })
            //         }
            //     })
            // }


            // if (check_require) {
            //     return this.notificationService.toastWarning("Vui lòng kiểm tra lại số lượng câu hỏi lấy");
            // } else {
            //     if (request.length > 1) {
            //         this.progressValue = 0;
            //         this.displayModal = true;
            //         this.loopAddForm(request, 0).subscribe({
            //             next: () => {
            //                 this.displayModal = false;
            //                 this.notificationService.toastSuccess("Lưu thành công")
            //                 this.loadFormTxCauhoi();
            //             },
            //             error: () => {
            //                 this.displayModal = false;
            //                 this.notificationService.toastError("Lưu thất bại, vui lòng thử lại")
            //             }
            //         })
            //     }
            // }
        }
    }

    //** form tx toan  */

    loadFormtxCauhoiType2() {
        const condition_lesson: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedKhoahoc.id.toString(), orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.notEqual, value: '0', orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.notEqual, value: '100', orWhere: 'and' },
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'include', value: 'ACTIVITY_CDR,PLAN,THUONGXUYEN_TRACNGHIEM' },
                { label: 'include_by', value: 'type' },
                { label: 'orderby', value: 'ordering' },
                { label: 'order', value: 'ASC' },
            ],

            page: null
        }

        const condition_form_Tx: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedKhoahoc.id.toString(), orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' }
            ],
            page: null
        }

        const condition_plan_bank: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedKhoahoc.id.toString(), orWhere: 'and' },
                { conditionName: 'bank_type', condition: OvicQueryCondition.equal, value: 'TX', orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'groupby', value: 'ordering' }
            ],
            page: null
        }

        const condition_question: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedKhoahoc.id.toString(), orWhere: 'and' },
                { conditionName: 'reference', condition: OvicQueryCondition.equal, value: 'course_plan_activities', orWhere: 'and' },
                { conditionName: 'group_id', condition: OvicQueryCondition.equal, value: '0', orWhere: 'and' },
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'code,reference_id,week,id,group_id,private,cdr' }
            ],
            page: null
        }

        this.notificationService.isProcessing(true);
        forkJoin([
            this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_lesson),
            this.courseFormTxService.getCoursePlansByPageNew(condition_form_Tx),
            this.coursePlanBankService.getCoursePlanBankByPageNew(condition_plan_bank),
            this.courseQuestionsService.getCourseQuestionsByPageNew(condition_question)
        ]).subscribe({
            next: ([_course_plan, _form_tx, _plan_bank, _course_question]) => {

                const test_tx = _course_plan.data.filter(m => m.type === 'THUONGXUYEN_TRACNGHIEM');

                const plan = _course_plan.data.filter(m => m.type === 'PLAN' && m.ordering !== 1000);

                this.list_course_plan = _course_plan.data;

                this.list_question_txt2 = _course_question.data;

                const ordering_take = {};
                _form_tx.data.forEach(f => {
                    if (!ordering_take[f.ordering]) {
                        ordering_take[f.ordering] = {};
                        if (!ordering_take[f.ordering][f.week])
                            ordering_take[f.ordering][f.week] = true;
                    } else {
                        if (!ordering_take[f.ordering][f.week])
                            ordering_take[f.ordering][f.week] = true;
                    }
                })

                test_tx.forEach(f => {
                    if (this.selectedKhoahoc.params) {

                        const index_ordering = _plan_bank.data.findIndex(m => m['ordering'] === f.ordering);

                        f['canEdit'] = this.isManager || index_ordering === -1 ? true : false;

                        f['has_test'] = index_ordering !== -1 ? true : false;

                        f['weeks_test'] = [];

                        if (ordering_take[f.ordering]) {
                            this.helperService.sort(plan.filter(m => ordering_take[f.ordering][m.week]), 'week').forEach(t => {
                                f['weeks_test'].push({ ...t });
                            });
                        }

                        f['weeks_test'].forEach(w => {

                            w.children = [];

                            w['question_take_total'] = 0;

                            w['question_take_total_private'] = 0;

                            const children = _course_plan.data.filter(m => m.parent_id === w.id);

                            w['total_question'] = 0;

                            children.forEach(c => {

                                const question_week = _course_question.data.filter(m => m['week'] === w.week && m.reference_id === c.id);

                                c['cdr_cauhoi_private'] = {};

                                if (c.cdr_cauhoi)
                                    Object.keys(c.cdr_cauhoi).forEach(o => {
                                        if (!isNaN(parseFloat(o))) {
                                            c.cdr_cauhoi[o] = question_week.filter(m => Number(m.cdr) === Number(o) && (m.private === 0 || !m.private)).length;
                                            c['cdr_cauhoi_private'][o] = 0;
                                            c['cdr_cauhoi_private'][o] = question_week.filter(m => Number(m.cdr) === Number(o) && m.private === 1).length;
                                        }
                                    })

                                c['total_question_cdr'] = 0;

                                c['total_question_cdr_private'] = 0;

                                c['stt_code'] = parseFloat(c.kyhieu.replace(/\D/gi, ''));

                                if (c.params && c.params.cdr && c.params.cdr.cdr_info) {
                                    const index = c.params.cdr.cdr_info.findIndex(m => m.id === 'level_require');
                                    if (index !== -1) {
                                        c['cdr_name'] = c.params.cdr.cdr_info[index].value;
                                        c['cdr_level'] = c.params.cdr.cdr_info[index].key;
                                    }
                                }

                                c['total_question_cdr'] = _course_question.data.filter(m => m.week === w.week && m.reference_id === c.id && m.private === 0).length;

                                c['total_question_cdr_private'] = _course_question.data.filter(m => m.week === w.week && m.reference_id === c.id && m.private === 1).length;

                                w['total_question'] = w['total_question'] + c['total_question_cdr'] + c['total_question_cdr_private'];

                            })

                            this.helperService.sort(children, 'stt_code').forEach(c => {
                                w.children.push({ ...c });
                            });

                            if (w.children) {

                                w['_form_tx_ids'] = [];

                                w.children.forEach(c => {
                                    c['question_take'] = {};

                                    c['question_take_total'] = 0;

                                    const form_tx_take = _form_tx.data.filter(m => m.course_plan_activity_id.toString() === c.id.toString() && m.ordering === f.ordering && m.week === w.week && (!m.private || m.private === 0));

                                    form_tx_take.forEach(fr => {
                                        c['question_take'][fr.cdr] = fr.question_take;
                                        w['_form_tx_ids'].push(fr.id);
                                    })

                                    /** private */
                                    c['question_take_private'] = {};

                                    c['question_take_total_private'] = 0;

                                    const form_tx_take_private = _form_tx.data.filter(m => m.course_plan_activity_id.toString() === c.id.toString() && m.ordering === f.ordering && m.week === w.week && m.private === 1);

                                    form_tx_take_private.forEach(fr => {
                                        c['question_take_private'][fr.cdr] = fr.question_take;
                                        w['_form_tx_ids'].push(fr.id);
                                    })

                                    this.setNumberCdrCauhoi(w, c, false);

                                    w['question_take_total'] = w['question_take_total'] + c['question_take_total'];

                                    w['question_take_total_private'] = w['question_take_total_private'] + c['question_take_total_private']
                                })

                                w['_form_tx_ids'] = [... new Set(w['_form_tx_ids'])]
                            }
                        })

                        f['form_tx_ids'] = _form_tx.data.filter(m => m.ordering === f.ordering).map(m => m.id);
                        f['form_tx_ids'] = [... new Set(f['form_tx_ids'])];

                    }
                })

                console.log(test_tx);


                this.list_test_tx = this.helperService.sort(test_tx, 'ordering');

                this.notificationService.isProcessing(false);

            },
            error: () => {

            }
        })
    }

    saveFormTxType2(test: PlanActivityCdr) {

        if (test) {
            let check_require = false;

            const request: Observable<any>[] = [];

            if (test['form_tx_ids'] && test['form_tx_ids'].length) {
                request.push(this.courseFormTxService.deleteCourseFormTx(test['form_tx_ids'].toString()))
            }

            if (test['weeks_test']) {
                test['weeks_test'].forEach(w => {
                    if (w['children']) {
                        w['children'].forEach(c => {
                            if (c['require_cdr']) {
                                check_require = true;
                            }

                            if (c['question_take']) {
                                Object.keys(c['question_take']).forEach(q => {
                                    if (c['question_take'][q]) {
                                        const data = {
                                            course_id: this.selectedKhoahoc.id,
                                            course_plan_activity_id: c.id,
                                            week: c.week,
                                            cdr: parseFloat(q),
                                            question_take: c['question_take'][q],
                                            av: this.selectedKhoahoc.av,
                                            ordering: test.ordering,
                                        }
                                        request.push(this.courseFormTxService.addCourseFormTx(data))
                                    }
                                })
                            }

                            if (c['question_take_private']) {
                                Object.keys(c['question_take_private']).forEach(q => {
                                    if (c['question_take_private'][q]) {
                                        const data = {
                                            course_id: this.selectedKhoahoc.id,
                                            course_plan_activity_id: c.id,
                                            week: c.week,
                                            cdr: parseFloat(q),
                                            question_take: c['question_take_private'][q],
                                            av: this.selectedKhoahoc.av,
                                            ordering: test.ordering,
                                            private: 1
                                        }
                                        request.push(this.courseFormTxService.addCourseFormTx(data))
                                    }
                                })
                            }

                        })
                    }
                })
            }


            if (check_require) {
                return this.notificationService.toastWarning("Vui lòng kiểm tra lại số lượng câu hỏi lấy");
            } else {
                if (request.length > 1) {
                    this.progressValue = 0;
                    this.displayModal = true;
                    this.loopAddForm(request, 0).subscribe({
                        next: () => {
                            this.displayModal = false;
                            this.notificationService.toastSuccess("Lưu thành công")
                            this.loadFormTxCauhoi();
                        },
                        error: () => {
                            this.displayModal = false;
                            this.notificationService.toastError("Lưu thất bại, vui lòng thử lại")
                        }
                    })
                }
            }
        }
    }

    addBaiGiangToTest(test: PlanActivityCdr) {
        this.notificationService.openSideNavigationMenu({ template: this.templateAddBaigiang(), size: 500, offsetTop: '0px' });

        this.selectedTestTx = test;

        const week = [];

        this.list_course_plan.forEach(c => {
            if (c.type === 'PLAN' && c.ordering < 100)
                week.push({ ...c });
        })

        if (test['weeks_test']) {
            test['weeks_test'].forEach(c => {
                const index = week.findIndex(m => m.week === c.week);
                if (index !== -1) {
                    week[index]['checked'] = true;
                }
            })
        }

        this.list_week = week;
    }

    onSelectWeek(week: PlanActivityCdr) {
        week['checked'] = !week['checked'];

        if (week['checked']) {

            switch (this.selectedKhoahoc.av) {
                case 0:
                    const t0: any = { total_question_take: null };

                    Object.keys(week).forEach(w => {
                        t0[w] = week[w];
                    })

                    if (!this.selectedTestTx['weeks_test']) {
                        this.selectedTestTx['weeks_test'] = [];
                    }

                    this.selectedTestTx['weeks_test'].push(t0);

                    this.selectedTestTx['weeks_test'] = this.helperService.sort(this.selectedTestTx['weeks_test'], 'week');
                    break;
                case 1:
                    const t1: any = { total_question: 0, question_take_total: 0 };

                    Object.keys(week).forEach(w => {
                        t1[w] = week[w];
                    })

                    t1['children'] = [];

                    this.list_course_plan.forEach(c => {
                        if (c.parent_id === t1.id) {

                            const c2: any = { question_take: {}, question_take_total: 0 };

                            Object.keys(c).forEach(o => {
                                c2[o] = c[o];
                            })

                            t1['children'].push(c2);

                        }
                    })

                    this.selectedTestTx['weeks_test'].push(t1);

                    this.selectedTestTx['weeks_test'].forEach(w => {
                        if (w.week === t1.week) {
                            w['total_question'] = 0;

                            w['children'].forEach(c => {

                                c['kyhieu_stt'] = parseFloat(c.kyhieu.replace(/\D/gi, ''));

                                c['total_question_cdr'] = this.list_question_txt1.filter(m => m.group_id !== 0 && m.reference_id === c.id && m.private === 0).length;

                                c['total_question_cdr_private'] = this.list_question_txt1.filter(m => m.group_id !== 0 && m.reference_id === c.id && m.private === 1).length

                                w['total_question'] = w['total_question'] + c['total_question_cdr'] + c['total_question_cdr_private'];

                                c['question_take_total'] = 0;

                                c['parts'] = {};

                                c['parts_private'] = {};

                                if (c.params && c.params.cdr && c.params.cdr.cdr_info) {
                                    const index = c.params.cdr.cdr_info.findIndex(m => m.id === 'level_require');
                                    if (index !== -1) {
                                        c['cdr_name'] = c.params.cdr.cdr_info[index].value;
                                        c['cdr_level'] = c.params.cdr.cdr_info[index].key;
                                    }
                                }

                                // if (c.cdr_cauhoi) {
                                //     Object.keys(c.cdr_cauhoi).forEach(cdrc => {
                                //         if (!isNaN(parseFloat(cdrc))) {
                                //             w['total_question'] = w['total_question'] + c.cdr_cauhoi[cdrc];
                                //             c['total_question_cdr'] = c['total_question_cdr'] + c.cdr_cauhoi[cdrc];
                                //         }
                                //     })
                                // }

                                this.list_part.forEach(p => {
                                    const index = this.list_question_txt1.findIndex(m => m.group_id === 0 && m.code === p && m.reference_id === c.id);
                                    if (index !== -1) {
                                        c['parts'][p] = {
                                            max_question: this.list_question_txt1.filter(m => m.group_id !== 0 && m.code === p && m.reference_id === c.id && m.private === 0).length,
                                            question_take: null,
                                        }

                                        c['parts_private'][p] = {
                                            max_question: this.list_question_txt1.filter(m => m.group_id !== 0 && m.code === p && m.reference_id === c.id && m.private === 1).length,
                                            question_take: null,
                                        }
                                    }
                                })

                                this.setNumberPartQuestionType1(w, c);

                            })
                        }
                        w['children'] = this.helperService.sort(w['children'], 'kyhieu_stt');

                    })

                    this.selectedTestTx['weeks_test'] = this.helperService.sort(this.selectedTestTx['weeks_test'], 'week');

                    break;
                case 2:
                    const t2: any = { question_take_total: 0, total_question: 0 };

                    Object.keys(week).forEach(w => {
                        t2[w] = week[w];
                    })

                    t2['children'] = [];

                    this.list_course_plan.forEach(c => {
                        if (c.parent_id === t2.id) {

                            const c2: any = { question_take: {}, question_take_total: 0 };

                            Object.keys(c).forEach(o => {
                                c2[o] = c[o];
                            })

                            t2['children'].push(c2);

                        }
                    })

                    if (!this.selectedTestTx['weeks_test']) {
                        this.selectedTestTx['weeks_test'] = [];
                    }

                    this.selectedTestTx['weeks_test'].push(t2);

                    this.selectedTestTx['weeks_test'].forEach(w => {

                        w['total_question'] = 0;

                        w['question_take_total'] = 0;

                        w['question_take_total_private'] = 0;

                        w.children.forEach(c => {
                            c['question_take_private'] = {};

                            c['question_take'] = {};

                            const question_week = this.list_question_txt2.filter(m => m['week'] === w.week && m.reference_id === c.id);

                            c['cdr_cauhoi_private'] = {};

                            if (c.cdr_cauhoi)
                                Object.keys(c.cdr_cauhoi).forEach(o => {
                                    if (!isNaN(parseFloat(o))) {
                                        c.cdr_cauhoi[o] = question_week.filter(m => Number(m.cdr) === Number(o) && (m.private === 0 || !m.private)).length;
                                        c['cdr_cauhoi_private'][o] = 0;
                                        c['cdr_cauhoi_private'][o] = question_week.filter(m => Number(m.cdr) === Number(o) && m.private === 1).length;
                                    }
                                })

                            c['total_question_cdr'] = 0;

                            c['total_question_cdr_private'] = 0;

                            c['stt_code'] = parseFloat(c.kyhieu.replace(/\D/gi, ''));

                            if (c.params && c.params.cdr && c.params.cdr.cdr_info) {
                                const index = c.params.cdr.cdr_info.findIndex(m => m.id === 'level_require');
                                if (index !== -1) {
                                    c['cdr_name'] = c.params.cdr.cdr_info[index].value;
                                    c['cdr_level'] = c.params.cdr.cdr_info[index].key;
                                }
                            }

                            c['total_question_cdr'] = this.list_question_txt2.filter(m => m.week === w.week && m.reference_id === c.id && m.private === 0).length;

                            c['total_question_cdr_private'] = this.list_question_txt2.filter(m => m.week === w.week && m.reference_id === c.id && m.private === 1).length;

                            w['total_question'] = w['total_question'] + c['total_question_cdr'] + c['total_question_cdr_private'];

                        })


                        if (w.children) {
                            w.children.forEach(c => {

                                this.setNumberCdrCauhoi(w, c, false);

                                w['question_take_total'] = w['question_take_total'] + c['question_take_total'];

                                w['question_take_total_private'] = w['question_take_total_private'] + c['question_take_total_private'];
                            })
                        }

                        w.children = this.helperService.sort(w.children, 'stt_code')
                    })


                    this.selectedTestTx['weeks_test'] = this.helperService.sort(this.selectedTestTx['weeks_test'], 'week');
                    break;
                default:
                    break;
            }


        } else {
            const index = this.selectedTestTx['weeks_test'].findIndex(m => m.week === week.week);
            if (index !== -1) {
                this.selectedTestTx['weeks_test'].splice(index, 1);
            }
        }

        console.log(this.selectedTestTx);
    }

    deleteWeek(week: PlanActivityCdr, test: PlanActivityCdr) {
        this.selectedTestTx = test;
        switch (this.selectedKhoahoc.av) {
            case 0:
                if (!week['_form_tx_id']) {
                    const index = this.selectedTestTx['weeks_test'].findIndex(m => m.week === week.week);
                    if (index !== -1) {
                        this.selectedTestTx['weeks_test'].splice(index, 1);
                    }
                } else {
                    this.notificationService.confirmDelete().then(a => {
                        if (a) {
                            this.notificationService.isProcessing(true);
                            this.courseFormTxService.deleteCourseFormTx(week['_form_tx_id']).subscribe({
                                next: () => {
                                    this.loadFormTxCauhoi();
                                    this.notificationService.toastSuccess("Xoá thành công");
                                    this.notificationService.isProcessing(false);
                                },
                                error: () => {
                                    this.notificationService.toastSuccess("Xoá thất bại, vui lòng thử lại");
                                }
                            })
                        }
                    })
                }
                break;
            case 1:
                if (week['_form_tx_ids'] && week['_form_tx_ids'].length) {
                    this.notificationService.confirmDelete().then(a => {
                        if (a) {
                            this.notificationService.isProcessing(true);
                            this.courseFormTxService.deleteCourseFormTx(week['_form_tx_ids'].toString()).subscribe({
                                next: () => {
                                    this.loadFormTxCauhoi();
                                    this.notificationService.toastSuccess("Xoá thành công");
                                    this.notificationService.isProcessing(false);
                                },
                                error: () => {
                                    this.notificationService.toastSuccess("Xoá thất bại, vui lòng thử lại");
                                }
                            })
                        }
                    })
                } else {
                    const index = this.selectedTestTx['weeks_test'].findIndex(m => m.week === week.week);
                    if (index !== -1) {
                        this.selectedTestTx['weeks_test'].splice(index, 1);
                    }
                }
                break;
            case 2:
                if (week['_form_tx_ids'] && week['_form_tx_ids'].length) {
                    this.notificationService.confirmDelete().then(a => {
                        if (a) {
                            this.notificationService.isProcessing(true);
                            this.courseFormTxService.deleteCourseFormTx(week['_form_tx_ids'].toString()).subscribe({
                                next: () => {
                                    this.loadFormTxCauhoi();
                                    this.notificationService.toastSuccess("Xoá thành công");
                                    this.notificationService.isProcessing(false);
                                },
                                error: () => {
                                    this.notificationService.toastSuccess("Xoá thất bại, vui lòng thử lại");
                                }
                            })
                        }
                    })
                } else {
                    const index = this.selectedTestTx['weeks_test'].findIndex(m => m.week === week.week);
                    if (index !== -1) {
                        this.selectedTestTx['weeks_test'].splice(index, 1);
                    }
                }
                break;
            default:
                break;
        }
    }

    //** reupdate form cc  */

    loadAllCourseType0() {
        const condition_course: ConditionOption = {
            condition: [
                { conditionName: 'av', condition: OvicQueryCondition.equal, value: '0', orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' }
            ],
            page: null
        }

        this.elnKhoaHocService.getKhoaHocByPageNew_2(condition_course).pipe(mergeMap(_course => {
            const course_ids = _course.data.map(m => m.id);
            if (course_ids.length) {
                const condition_plan: ConditionOption = {
                    condition: [
                        { conditionName: 'week', condition: OvicQueryCondition.notEqual, value: '0', orWhere: 'and' },
                        { conditionName: 'week', condition: OvicQueryCondition.lessThan, value: '100', orWhere: 'and' },
                        { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'include', value: course_ids.toString() },
                        { label: 'include_by', value: 'course_id' }
                    ],
                    page: null
                }

                return this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_plan).pipe(mergeMap(_plan => {
                    return of(_plan)
                }))
            }
            return of(null)
        })).subscribe({
            next: (_plan) => {
                if (_plan) {

                    const request: Observable<any>[][] = [];
                    request[0] = [this.courseFormCcService.deleteCourseFormCcByCol('0', 'av')];
                    let i = 1;
                    request[i] = [];


                    const parent = _plan.data.filter(m => m.parent_id === 0 && m.type === 'PLAN');

                    parent.forEach(p => {
                        const children = _plan.data.filter(m => m.parent_id === p.id && m.type === 'ACTIVITY_CDR');
                        let t = 0;
                        if (children.length) {
                            children.forEach(c => {
                                c['cdr_take'] = {};
                                if (c.cdr_cauhoi) {
                                    Object.keys(c.cdr_cauhoi).forEach(cdr => {
                                        if (c.cdr_cauhoi[cdr] && !isNaN(Number(cdr))) {
                                            if (c.cdr_cauhoi[cdr] % 2 !== 0) {
                                                t = t === 0 ? 1 : 0
                                                c['cdr_take'][cdr] = Math.floor(c.cdr_cauhoi[cdr] / 2) + t;
                                            } else {
                                                c['cdr_take'][cdr] = c.cdr_cauhoi[cdr] / 2;
                                            }
                                        }
                                    })
                                }

                                Object.keys(c['cdr_take']).forEach(take => {
                                    if (c['cdr_take'][take] && c['cdr_take'][take] !== 0) {
                                        const data = {
                                            course_id: p.course_id,
                                            course_plan_activity_id: c.id,
                                            week: c.week,
                                            cdr: parseFloat(take),
                                            question_take: c['cdr_take'][take],
                                            av: this.selectedKhoahoc.av
                                        }

                                        if (request[i].length < 6) {
                                            request[i].push(this.courseFormCcService.addCourseFormCc(data));
                                        } else {
                                            i = i + 1;
                                            request[i] = [];
                                            request[i].push(this.courseFormCcService.addCourseFormCc(data));
                                        }
                                    }
                                })
                            })
                        }
                        p['children'] = children;
                    })

                    if (request.length > 1) {
                        this.progressValue = 0;
                        this.displayModal = true;
                        this.loopAddReupdateForm(request, 0).subscribe({
                            next: () => {
                                this.displayModal = false;
                                this.notificationService.toastSuccess("Lưu thành công")
                                this.loadFormCcCauhoi();
                            },
                            error: () => {
                                this.displayModal = false;
                                this.notificationService.toastError("Lưu thất bại, vui lòng thử lại");
                            }
                        })
                    }
                }
            }
        })
    }

    loopAddReupdateForm(request: Observable<any>[][], key: number): Observable<any> {
        return forkJoin(request[key]).pipe(mergeMap(a => {
            this.progressValue = (key + 1) / request.length * 100;
            if (request[key + 1]) {
                return this.loopAddReupdateForm(request, key + 1);
            } else {
                return of(null);
            }
        }))
    }

    nextInput(input_question) {
        const inputNumberQuestion = this.inputNumberQuestion();
        if (inputNumberQuestion && input_question) {
            const input_arrays = inputNumberQuestion
            const index = input_arrays.findIndex(m => m.nativeElement['__ngContext__'] === input_question['__ngContext__']);
            if (index !== -1) {
                if (index + 1 >= input_arrays.length) {
                    input_arrays[0].nativeElement.focus();
                } else {
                    input_arrays[index + 1].nativeElement.focus();
                }
            }
        }
    }

    /** Kiểm tra đầu giờ type 0 */

    loadFormDgCauhoi() {
        switch (this.selectedKhoahoc.av) {
            case 0:
                this.loadFormDgCauhoiType0();
                break;
            case 1:
                this.loadFormDgCauhoiType1();
                break;
            case 2:
                this.loadFormDgCauhoiType0();
                break;
            default:
                break;
        }
    }

    loadFormDgCauhoiType0() {
        this.list_test_dg = [];

        const condition_lesson: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedKhoahoc.id.toString(), orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.notEqual, value: '0', orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.lessThan, value: '100', orWhere: 'and' },
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'include', value: 'ACTIVITY_CDR,PLAN' },
                { label: 'include_by', value: 'type' },
                { label: 'orderby', value: 'ordering' },
                { label: 'order', value: 'ASC' }
            ],

            page: null
        }

        const condition_form_cc: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedKhoahoc.id.toString(), orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' }
            ],
            page: null
        }

        const condition_plan_bank: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedKhoahoc.id.toString(), orWhere: 'and' },
                { conditionName: 'bank_type', condition: OvicQueryCondition.equal, value: 'DG', orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'groupby', value: 'week' }
            ],
            page: null
        }

        const condition_question: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedKhoahoc.id.toString(), orWhere: 'and' },
                { conditionName: 'reference', condition: OvicQueryCondition.equal, value: 'course_plan_activities', orWhere: 'and' },
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
                { conditionName: 'group_id', condition: OvicQueryCondition.equal, value: '0', orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'code,reference_id,week,id,group_id,cdr,private' }
            ],
            page: null
        }

        this.notificationService.isProcessing(true);

        forkJoin([
            this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_lesson),
            this.courseFormDgService.getCourseFormDgByPage(condition_form_cc),
            this.coursePlanBankService.getCoursePlanBankByPageNew(condition_plan_bank),
            this.courseQuestionsService.getCourseQuestionsByPageNew(condition_question)
        ]).subscribe({
            next: ([_plan_activity, _form_cc, _plan_bank, _question]) => {

                this.notificationService.isProcessing(false);

                const parent = _plan_activity.data.filter(m => m.parent_id === 0);

                parent.forEach(f => {

                    const children = _plan_activity.data.filter(m => m.parent_id === f.id);

                    f['total_question'] = 0;

                    f['question_take_total'] = 0;

                    f['question_take_total_private'] = 0;

                    const index_week_bank = _plan_bank.data.findIndex(m => m.week === f.week);

                    f['canEdit'] = this.isManager || index_week_bank === -1 ? true : false;

                    f['has_test'] = index_week_bank !== -1 ? true : false;

                    children.forEach(c => {
                        const question_week = _question.data.filter(m => m['week'] === f.week && m.reference_id === c.id);

                        c['cdr_cauhoi_private'] = {};

                        if (c.cdr_cauhoi)
                            Object.keys(c.cdr_cauhoi).forEach(o => {
                                if (!isNaN(parseFloat(o))) {
                                    c.cdr_cauhoi[o] = question_week.filter(m => Number(m.cdr) === Number(o) && m.private === 0).length;
                                    c['cdr_cauhoi_private'][o] = 0;
                                    c['cdr_cauhoi_private'][o] = question_week.filter(m => Number(m.cdr) === Number(o) && m.private === 1).length;
                                }
                            })

                        c['kyhieu_stt'] = parseFloat(c.kyhieu.replace(/\D/gi, ''));

                        c['total_question_cdr'] = 0;

                        c['total_question_cdr_private'] = 0;

                        c['question_take'] = {};

                        c['question_take_private'] = {};

                        c['question_take_total'] = 0;

                        c['question_take_total_private'] = 0;

                        const form_cc_take = _form_cc.data.filter(m => m.course_plan_activity_id === c.id && !m.private);

                        const form_cc_take_private = _form_cc.data.filter(m => m.course_plan_activity_id === c.id && m.private === 1);

                        form_cc_take.forEach(fr => {
                            if (c.cdr_cauhoi[fr.cdr])
                                c['question_take'][fr.cdr] = fr.question_take;
                        })

                        form_cc_take_private.forEach(fr => {
                            if (c['cdr_cauhoi_private'][fr.cdr])
                                c['question_take_private'][fr.cdr] = fr.question_take;
                        })

                        if (c.params && c.params.cdr && c.params.cdr.cdr_info) {
                            const index = c.params.cdr.cdr_info.findIndex(m => m.id === 'level_require');
                            if (index !== -1) {
                                c['cdr_name'] = c.params.cdr.cdr_info[index].value;
                                c['cdr_level'] = c.params.cdr.cdr_info[index].key;
                            }
                        }

                        if (c.cdr_cauhoi) {
                            Object.keys(c.cdr_cauhoi).forEach(cdrc => {
                                if (!isNaN(parseFloat(cdrc))) {
                                    f['total_question'] = f['total_question'] + c.cdr_cauhoi[cdrc];
                                    c['total_question_cdr'] = c['total_question_cdr'] + c.cdr_cauhoi[cdrc];
                                }
                            })
                        }

                        if (c['cdr_cauhoi_private']) {
                            Object.keys(c['cdr_cauhoi_private']).forEach(cdrc => {
                                if (!isNaN(parseFloat(cdrc))) {
                                    f['total_question'] = f['total_question'] + c['cdr_cauhoi_private'][cdrc];
                                    c['total_question_cdr_private'] = c['total_question_cdr_private'] + c['cdr_cauhoi_private'][cdrc];
                                }
                            })
                        }

                        this.setNumberCdrCauhoi(f, c, false);

                        f['question_take_total'] = f['question_take_total'] + c['question_take_total'];

                        f['question_take_total_private'] = f['question_take_total_private'] + c['question_take_total_private'];

                    })

                    f['children'] = this.helperService.sort(children, 'kyhieu_stt');
                })

                this.list_test_dg = parent;
            },

            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
            }
        })
    }

    saveFormDg() {
        switch (this.selectedKhoahoc.av) {
            case 0:
                this.saveFormDgType0();
                break;
            case 1:
                this.saveFormDgType1();
                break;
            case 2:
                this.saveFormDgType0();
                break;
            default:
                break;
        }
    }

    saveFormDgType0() {

        let check = false;

        const request: Observable<any>[] = [
            this.courseFormDgService.deleteCourseFormDgByCol(this.selectedKhoahoc.id.toString(), 'course_id')
        ];

        this.list_test_dg.forEach(f => {
            if (f.children) {
                f.children.forEach(c => {
                    if (c['require_cdr']) {
                        check = true;
                    }

                    if (c['question_take']) {
                        Object.keys(c['question_take']).forEach(q => {
                            if (c['question_take'][q]) {
                                const data = {
                                    course_id: this.selectedKhoahoc.id,
                                    course_plan_activity_id: c.id,
                                    week: c.week,
                                    cdr: parseFloat(q),
                                    question_take: c['question_take'][q],
                                    av: this.selectedKhoahoc.av
                                }
                                request.push(this.courseFormDgService.addCourseFormDg(data))
                            }
                        })
                    }

                    if (c['question_take_private']) {
                        Object.keys(c['question_take_private']).forEach(q => {
                            if (c['question_take_private'][q]) {
                                const data = {
                                    course_id: this.selectedKhoahoc.id,
                                    course_plan_activity_id: c.id,
                                    week: c.week,
                                    cdr: parseFloat(q),
                                    question_take: c['question_take_private'][q],
                                    av: this.selectedKhoahoc.av,
                                    private: 1
                                }
                                request.push(this.courseFormDgService.addCourseFormDg(data))
                            }
                        })
                    }
                })
            }
        })

        if (check) {
            return this.notificationService.toastWarning("Vui lòng kiểm tra lại số lượng câu hỏi lấy");
        } else {
            if (request.length > 1) {
                this.progressValue = 0;
                this.displayModal = true;
                this.loopAddForm(request, 0).subscribe({
                    next: () => {
                        this.displayModal = false;
                        this.notificationService.toastSuccess("Lưu thành công")
                        this.loadFormDgCauhoi();
                    },
                    error: () => {
                        this.displayModal = false;
                        this.notificationService.toastError("Lưu thất bại, vui lòng thử lại")
                    }
                })
            }
        }
    }

    /** Kiểm tra đầu giờ type 1 */

    loadFormDgCauhoiType1() {
        this.list_test_dg = [];
        const condition_lesson: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedKhoahoc.id.toString(), orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.notEqual, value: '0', orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.lessThan, value: '100', orWhere: 'and' },
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'include', value: 'ACTIVITY_CDR,PLAN' },
                { label: 'include_by', value: 'type' },
                { label: 'orderby', value: 'ordering' },
                { label: 'order', value: 'ASC' }
            ],

            page: null
        }

        const condition_form_cc: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedKhoahoc.id.toString(), orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' }
            ],
            page: null
        }

        const condition_question: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedKhoahoc.id.toString(), orWhere: 'and' },
                { conditionName: 'reference', condition: OvicQueryCondition.equal, value: 'course_plan_activities', orWhere: 'and' },
                // { conditionName: 'group_id', condition: OvicQueryCondition.equal, value: '0', orWhere: 'and' },
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'code,reference_id,week,id,group_id,private' }
            ],
            page: null
        }

        const condition_plan_bank: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedKhoahoc.id.toString(), orWhere: 'and' },
                { conditionName: 'bank_type', condition: OvicQueryCondition.equal, value: 'DG', orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'groupby', value: 'week' }
            ],
            page: null
        }

        this.notificationService.isProcessing(true);

        forkJoin([
            this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_lesson),
            this.courseFormDgService.getCoursePlansByPageNew(condition_form_cc),
            this.courseQuestionsService.getCourseQuestionsByPageNew(condition_question),
            this.coursePlanBankService.getCoursePlanBankByPageNew(condition_plan_bank)
        ]).subscribe({
            next: ([_plan_activity, _form_cc, _question, _plan_bank]) => {

                this.notificationService.isProcessing(false);

                const parent = _plan_activity.data.filter(m => m.parent_id === 0);

                _question.data.forEach(c => {
                    c['stt_code'] = parseFloat(c.code.replace(/\D/gi, ''));
                })

                const parent_question = _question.data.filter(m => m.group_id === 0);

                let question_avai = [];

                parent_question.forEach(f => {
                    const child = _question.data.filter(m => m.group_id === f.id);
                    child.forEach(c => {
                        c.code = f.code;
                    })
                    question_avai = question_avai.concat(child);
                })

                const part_list = this.helperService.sort(parent_question, 'stt_code').map(m => m.code);

                this.list_part = [... new Set(part_list)];

                parent.forEach(f => {

                    const children = _plan_activity.data.filter(m => m.parent_id === f.id);

                    f['total_question'] = 0;

                    f['question_take_total'] = 0;

                    f['question_take_total_private'] = 0;

                    const index_week_bank = _plan_bank.data.findIndex(m => m.week === f.week);

                    f['canEdit'] = this.isManager || index_week_bank === -1 ? true : false;

                    f['has_test'] = index_week_bank !== -1 ? true : false;

                    children.forEach(c => {

                        c['kyhieu_stt'] = parseFloat(c.kyhieu.replace(/\D/gi, ''));

                        c['total_question_cdr'] = 0;

                        c['total_question_cdr_private'] = 0;

                        c['question_take_total'] = 0;

                        c['question_take_total_private'] = 0;

                        c['parts'] = {};

                        c['parts_private'] = {};

                        if (c.params && c.params.cdr && c.params.cdr.cdr_info) {
                            const index = c.params.cdr.cdr_info.findIndex(m => m.id === 'level_require');
                            if (index !== -1) {
                                c['cdr_name'] = c.params.cdr.cdr_info[index].value;
                                c['cdr_level'] = c.params.cdr.cdr_info[index].key;
                            }
                        }

                        // if (c.cdr_cauhoi) {
                        //     Object.keys(c.cdr_cauhoi).forEach(cdrc => {
                        //         if (!isNaN(parseFloat(cdrc))) {
                        //             f['total_question'] = f['total_question'] + c.cdr_cauhoi[cdrc];
                        //             c['total_question_cdr'] = c['total_question_cdr'] + c.cdr_cauhoi[cdrc];
                        //         }
                        //     })
                        // }



                        const part_child = parent_question.filter(m => m.reference_id === c.id);

                        part_child.forEach(p => {

                            const _question_take = _form_cc.data.filter(m => m.part === p.code && m.week === f.week && m.course_plan_activity_id === c.id && !m.private);

                            let s_take = 0;

                            _question_take.forEach(c => {
                                s_take = c.question_take + s_take;
                            })

                            c['parts'][p.code] = {
                                max_question: question_avai.filter(m => m.group_id !== 0 && m.code === p.code && m.reference_id === c.id && !m.private).length,
                                question_take: s_take !== 0 ? s_take : null
                            }

                            // for private

                            const _question_take_private = _form_cc.data.filter(m => m.part === p.code && m.week === f.week && m.course_plan_activity_id === c.id && m.private === 1);

                            let s_take_private = 0;

                            _question_take_private.forEach(c => {
                                s_take_private = c.question_take + s_take_private;
                            })

                            c['parts_private'][p.code] = {
                                max_question: question_avai.filter(m => m.group_id !== 0 && m.code === p.code && m.reference_id === c.id && m.private === 1).length,
                                question_take: s_take_private !== 0 ? s_take_private : null
                            }
                        })

                        Object.keys(c['parts']).forEach(p => {
                            f['total_question'] = f['total_question'] + c['parts'][p]['max_question'];
                            c['total_question_cdr'] = c['total_question_cdr'] + c['parts'][p]['max_question'];
                        })

                        Object.keys(c['parts_private']).forEach(p => {
                            f['total_question'] = f['total_question'] + c['parts_private'][p]['max_question'];
                            c['total_question_cdr_private'] = c['total_question_cdr_private'] + c['parts_private'][p]['max_question'];
                        })

                        this.setNumberPartQuestionType1(f, c);

                        f['question_take_total'] = f['question_take_total'] + c['question_take_total'];

                        f['question_take_total_private'] = f['question_take_total_private'] + c['question_take_total_private'];

                    })

                    f['children'] = this.helperService.sort(children, 'kyhieu_stt');

                });

                this.list_test_dg = parent;
            },

            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
            }
        })
    }

    saveFormDgType1() {

        let check = false;

        const request: Observable<any>[] = [
            this.courseFormDgService.deleteCourseFormDgByCol(this.selectedKhoahoc.id.toString(), 'course_id')
        ];

        this.list_test_dg.forEach(f => {
            if (f.children) {
                f.children.forEach(c => {
                    if (c['require_part']) {
                        check = true;
                    }

                    if (c['parts']) {
                        Object.keys(c['parts']).forEach(q => {
                            if (c['parts'][q]['question_take']) {
                                const data = {
                                    course_id: this.selectedKhoahoc.id,
                                    course_plan_activity_id: c.id,
                                    child_question_take: 1,
                                    week: c.week,
                                    part: q,
                                    question_take: c['parts'][q]['question_take'],
                                    av: this.selectedKhoahoc.av
                                }
                                request.push(this.courseFormDgService.addCourseFormDg(data))
                            }
                        })
                    }

                    if (c['parts_private']) {
                        Object.keys(c['parts_private']).forEach(q => {
                            if (c['parts_private'][q]['question_take']) {
                                const data = {
                                    course_id: this.selectedKhoahoc.id,
                                    course_plan_activity_id: c.id,
                                    child_question_take: 1,
                                    week: c.week,
                                    part: q,
                                    question_take: c['parts_private'][q]['question_take'],
                                    av: this.selectedKhoahoc.av,
                                    private: 1
                                }
                                request.push(this.courseFormDgService.addCourseFormDg(data))
                            }
                        })
                    }
                })
            }
        })

        if (check) {
            return this.notificationService.toastWarning("Vui lòng kiểm tra lại số lượng câu hỏi lấy");
        } else {
            if (request.length > 1) {
                this.progressValue = 0;
                this.displayModal = true;
                this.loopAddForm(request, 0).subscribe({
                    next: () => {
                        this.displayModal = false;
                        this.notificationService.toastSuccess("Lưu thành công")
                        this.loadFormDgCauhoiType1();
                    },
                    error: () => {
                        this.displayModal = false;
                        this.notificationService.toastError("Lưu thất bại, vui lòng thử lại")
                    }
                })
            }
        }
    }
}
