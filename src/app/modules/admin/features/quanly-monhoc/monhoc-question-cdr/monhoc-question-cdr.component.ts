import { Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CHUAN_DAU_RA, NORMAL_MODAL_OPTIONS, ROLES, ROUTERS } from '@modules/shared/utils/syscat';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { ActivatedRoute, Router } from '@angular/router';
import { OvicQueryCondition } from '@core/models/dto';
import { key_server } from '@env';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { forkJoin, mergeMap, Observable, of } from 'rxjs';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';
import { ElnKhoaHoc, EXAMFORMAT } from '@modules/shared/models/elng-khoa-hoc';
import { CoursePlanActivities } from '@modules/shared/models/course-plan-activities';
import { SharedModule } from '@modules/shared/shared.module';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NgbModal, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { BUTTON_YES, BUTTON_NO } from '@core/models/buttons';
import { CourseQuestionsService } from '@modules/shared/services/course-questions.service';
import { HelperService } from '@core/services/helper.service';

export interface PlanActivityCdr extends CoursePlanActivities {
    total_question?: number;
    cdr_percent?: {};
    cdr_name?: string;
    cdr_level?: number;
    require_cdr?: boolean;
    cdr_cauhoi_total?: {};
    question_take_total?: number;
    question_take?: {};
    weeks_test?: CoursePlanActivities[];
    canEdit?: boolean;
    require_question?: boolean;
    question_parts?: QuestionPart[];
    min_cdr_question?: {};
    total_question_cdr_private?: {};
}

export interface QuestionPart {
    part: string;
    stt_part: number;
    cdr_cauhoi: {};
    cdr_cauhoi_private?: {};
    question_take: {};
    question_take_private?: {};
    require_question?: boolean;
}

export interface CDRcoursePercent {
    label: string;
    value_percent: number;
    number_question: number;
}

export interface CoursesCdr extends ElnKhoaHoc {
    total_question?: number;
    require_cdr?: boolean;
    cdr_percent?: {};
    cdr_question?: {};
}

@Component({
    selector: 'app-monhoc-question-cdr',
    standalone: true,
    imports: [
        CommonModule,
        TableModule,
        ReactiveFormsModule,
        FormsModule,
        SharedModule,
        DialogModule,
        MatProgressBarModule,
        NgbTooltipModule,
        TooltipModule
    ],
    templateUrl: './monhoc-question-cdr.component.html',
    styleUrls: ['./monhoc-question-cdr.component.css']
})
export class MonhocQuestionCdrComponent implements OnInit {
    @ViewChildren('inputNumberQuestion') inputNumberQuestion: QueryList<any>;

    @ViewChild("autoCdrQuestion") autoCdrQuestion: ElementRef;

    isManager: boolean = false;

    isLanhDaoKhoa: boolean = false;

    isLanhDaoBomon: boolean = false;

    routerAdmin: boolean = false;

    routerDaotao: boolean = false;

    routerLanhdaokhoa: boolean = false;

    routerGiangvien: boolean = false;

    routerLanhdaobomon: boolean = false;

    userId: number;

    selectedCourse: CoursesCdr;

    canAdded: boolean = false;

    chuandaura = CHUAN_DAU_RA;

    list_cdr_cauhoi: PlanActivityCdr[];

    list_cdr_cauhoi_clone: PlanActivityCdr[];

    displayModal: boolean = false;

    progressValue: number = 0;

    closeLeft: boolean = false;

    selectedCdr: PlanActivityCdr;

    khuyennghi: any[] = [];

    totalCdrCauhoi: number;

    EXAMFORMAT = EXAMFORMAT;

    label_week = "Bài";

    waitingTitle: string = "Đang cập nhật dữ liệu, vui lòng chờ";

    constructor(
        private auth: AuthService,
        private notificationService: NotificationService,
        private activatedRoute: ActivatedRoute,
        private elnKhoaHocService: ElnKhoaHocService,
        private elngUserProfileService: ElngUserProfileService,
        private coursePlanActivitiesService: CoursePlanActivitiesService,
        private router: Router,
        private courseQuestionsService: CourseQuestionsService,
        private helperService: HelperService,
        private modalService: NgbModal
    ) {
        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin) || this.auth.userHasRole(ROLES.troly_pdt) || this.auth.userHasRole(ROLES.chuyenvien_pdt) ? true : false;

        this.isLanhDaoKhoa = this.auth.userHasRole(ROLES.lanhdaokhoa);

        this.isLanhDaoBomon = this.auth.userHasRole(ROLES.lanhdaobomon);

        this.routerAdmin = this.auth.hasRouter(ROUTERS.admin, '/monhoc-question-cdr');

        this.routerDaotao = this.auth.hasRouter(ROUTERS.daotao, '/monhoc-question-cdr');

        this.routerLanhdaokhoa = this.auth.hasRouter(ROUTERS.lanhdao_khoa, '/monhoc-question-cdr');

        this.routerGiangvien = this.auth.hasRouter(ROUTERS.giangvien, '/monhoc-question-cdr');

        this.routerLanhdaobomon = this.auth.hasRouter(ROUTERS.lanhdao_bomon, '/monhoc-question-cdr');

        this.userId = this.auth.user.id;
    }

    ngOnInit(): void {
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

                            this.loadCDRCauhoi()

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

    pointQuestionKeyDown(event, inputPoint_quest) {
        if (event) {
            if (event.key === 'Tab') {
                this.nextInput(inputPoint_quest)
            }

            if (/[0-9]/.test(event.key) || event.key === 'Backspace') {
                if (inputPoint_quest.value.replace(/\d/gi, '').length > 0 && event.key === '.') {
                    event.preventDefault();
                }
            } else {
                event.preventDefault();
            }
        }
    }

    loadCDRCauhoi() {
        const condition_lesson: ConditionOption = {
            condition: [
                {
                    conditionName: 'course_id',
                    condition: OvicQueryCondition.equal,
                    value: this.selectedCourse.id.toString(),
                    orWhere: 'and'
                },
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
        }

        const condition_question: ConditionOption = {
            condition: [
                {
                    conditionName: 'course_id',
                    condition: OvicQueryCondition.equal,
                    value: this.selectedCourse.id.toString(),
                    orWhere: 'and'
                },
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
                {
                    conditionName: 'reference',
                    condition: OvicQueryCondition.equal,
                    value: 'course_plan_activities',
                    orWhere: 'and'
                },
                { conditionName: 'group_id', condition: OvicQueryCondition.equal, value: '0', orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'week,group_id,cdr,reference_id,id' }
            ],
            page: null
        }

        this.notificationService.isProcessing(true);

        forkJoin([
            this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_lesson),
            this.courseQuestionsService.getCourseQuestionsByPageNew(condition_question).pipe(mergeMap(_question => {
                const ids = _question.data.map(m => m.id);
                if (ids.length) {
                    const condition_question_child: ConditionOption = {
                        condition: [
                            {
                                conditionName: 'course_id',
                                condition: OvicQueryCondition.equal,
                                value: this.selectedCourse.id.toString(),
                                orWhere: 'and'
                            },
                            {
                                conditionName: 'status',
                                condition: OvicQueryCondition.notEqual,
                                value: '-3',
                                orWhere: 'and'
                            },
                        ],
                        set: [
                            { label: 'limit', value: '-1' },
                            { label: 'include', value: ids.toString() },
                            { label: 'include_by', value: 'group_id' },
                            { label: 'select', value: 'week,group_id,cdr,reference_id,id' }
                        ],
                        page: null
                    }

                    return this.courseQuestionsService.getCourseQuestionsByPageNew(condition_question_child).pipe(mergeMap(_child_question => {
                        _question.data = _question.data.concat(_child_question.data);
                        _question.recordsFiltered = _question.recordsFiltered + _child_question.recordsFiltered;
                        return of(_question);
                    }))
                }
                return of(_question);
            }))
        ]).subscribe({
            next: ([_plan_activity, _question]) => {
                this.notificationService.isProcessing(false);
                const parent = _plan_activity.data.filter(m => m.parent_id === 0);
                parent.forEach(f => {
                    const children = _plan_activity.data.filter(m => m.parent_id === f.id);

                    children.forEach(c => {

                        c['min_cdr_question'] = {};
                        this.chuandaura.forEach(cdr => {
                            if (!cdr.disabled) {
                                if (this.selectedCourse.av === 1) {
                                    c['min_cdr_question'][cdr.id] = _question.data.filter(m => m.group_id !== 0 && m.reference_id === c.id && m.cdr === cdr.id).length;
                                } else {
                                    c['min_cdr_question'][cdr.id] = _question.data.filter(m => m.group_id === 0 && m.reference_id === c.id && m.cdr === cdr.id).length;
                                }
                            }
                        })

                        c['kyhieu_stt'] = c.kyhieu.replace(/\D/gi, '');

                        if (c.params && c.params.cdr && c.params.cdr.cdr_info) {
                            const index = c.params.cdr.cdr_info.findIndex(m => m.id === 'level_require');
                            if (index !== -1) {
                                c['cdr_name'] = c.params.cdr.cdr_info[index].value;
                                c['cdr_level'] = c.params.cdr.cdr_info[index].key;
                            }
                        }

                        c['cdr_percent'] = {};

                        c['total_question'] = 0;

                        if (!c.cdr_cauhoi) {
                            c.cdr_cauhoi = { status: 1 };
                            this.chuandaura.forEach(cdr => {
                                if (!cdr.disabled && c.cdr_cauhoi[cdr.id]) {
                                    c.cdr_cauhoi[cdr.id] = 0;
                                    c['cdr_percent'][cdr.id] = 0;
                                }
                            })
                        } else {
                            this.setNumberCdrCauhoi(c)
                        }
                    })

                    f['children'] = this.helperService.sort(children, 'kyhieu_stt');
                })

                this.list_cdr_cauhoi = parent;

                this.list_cdr_cauhoi_clone = [...parent];

                this.checkCdrCourse();
            },

            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
            }
        })
    }

    convertRoundNumber(num: Number): Number {
        return parseFloat(num.toFixed(1))
    }

    setNumberCdrCauhoi(activity_cdr: PlanActivityCdr, check: boolean = false) {
        if (this.selectedCourse.params && this.selectedCourse.params.cdr) {

            let s = 0;

            this.chuandaura.forEach(cdr => {
                if (activity_cdr.cdr_cauhoi[cdr.id] && !cdr.disabled) {
                    s = s + activity_cdr.cdr_cauhoi[cdr.id];
                }
            })

            activity_cdr['total_question'] = s;

            let total_percent_less = 0;

            let total_percent_greater = 0;

            let check_min_cdr = false;

            this.chuandaura.forEach(cdr => {
                if ((activity_cdr.cdr_cauhoi[cdr.id] || activity_cdr.cdr_cauhoi[cdr.id] === 0) && !cdr.disabled) {
                    if (activity_cdr.cdr_cauhoi[cdr.id] !== 0) {
                        activity_cdr['cdr_percent'][cdr.id] = this.convertRoundNumber(activity_cdr.cdr_cauhoi[cdr.id] / activity_cdr['total_question'] * 100);
                    } else {
                        activity_cdr['cdr_percent'][cdr.id] = 0;
                    }

                    if (cdr.id < activity_cdr.cdr_level) {
                        total_percent_less = total_percent_less + activity_cdr['cdr_percent'][cdr.id];
                    } else if (cdr.id > activity_cdr.cdr_level) {
                        total_percent_greater = total_percent_greater + activity_cdr['cdr_percent'][cdr.id];
                    }

                    if (activity_cdr.cdr_cauhoi[cdr.id] < activity_cdr.min_cdr_question[cdr.id]) {
                        check_min_cdr = true;
                    }
                }
            })


            // switch (activity_cdr.cdr_level) {
            //     case 1:
            //         if (activity_cdr['cdr_percent'][activity_cdr.cdr_level] < 70 || total_percent_greater < 10 || total_percent_greater > 30 || check_min_cdr) {
            //             activity_cdr.require_cdr = true;
            //         } else {
            //             activity_cdr.require_cdr = false;
            //         }
            //         break;
            //     case 2:
            //         if (activity_cdr['cdr_percent'][activity_cdr.cdr_level] < 50 || total_percent_less > 40 || total_percent_less < 10 || total_percent_greater > 10 || check_min_cdr) {
            //             activity_cdr.require_cdr = true;
            //         } else {
            //             activity_cdr.require_cdr = false;
            //         }
            //         break;
            //     case 3:
            //         if (activity_cdr['cdr_percent'][activity_cdr.cdr_level] < 50 || total_percent_less > 40 || total_percent_less < 10 || total_percent_greater > 10 || check_min_cdr) {
            //             activity_cdr.require_cdr = true;
            //         } else {
            //             activity_cdr.require_cdr = false;
            //         }
            //         break;
            //     case 4:
            //         if (activity_cdr['cdr_percent'][activity_cdr.cdr_level] < 50 || total_percent_greater > 10 || check_min_cdr) {
            //             activity_cdr.require_cdr = true;
            //         } else {
            //             activity_cdr.require_cdr = false;
            //         }
            //         break;
            //     default:
            //         break;
            // }
            switch (this.selectedCourse.params.cdr) {
                case 1:
                    switch (activity_cdr.cdr_level) {
                        case 1:
                            if (activity_cdr['cdr_percent'][1] < 70 || check_min_cdr) {
                                activity_cdr.require_cdr = true;
                            } else {
                                activity_cdr.require_cdr = false;
                            }
                            break;
                        case 2:
                            if (activity_cdr['cdr_percent'][1] < 10 || activity_cdr['cdr_percent'][1] >= 40 || check_min_cdr) {
                                activity_cdr.require_cdr = true;
                            } else {
                                activity_cdr.require_cdr = false;
                            }
                            break;
                        case 3:
                            const a_1_3 = activity_cdr['cdr_percent'][1] + activity_cdr['cdr_percent'][2];
                            if (a_1_3 < 20 || a_1_3 >= 40 || check_min_cdr) {
                                activity_cdr.require_cdr = true;
                            } else {
                                activity_cdr.require_cdr = false;
                            }
                            break;
                        default:
                            break;
                    }
                    break;
                case 2:
                    switch (activity_cdr.cdr_level) {
                        case 1:
                            const a_2_1 = activity_cdr['cdr_percent'][2] + activity_cdr['cdr_percent'][3] + activity_cdr['cdr_percent'][4];
                            if (a_2_1 < 10 || a_2_1 > 30 || check_min_cdr) {
                                activity_cdr.require_cdr = true;
                            } else {
                                activity_cdr.require_cdr = false;
                            }
                            break;
                        case 2:
                            if (activity_cdr['cdr_percent'][2] < 50 || check_min_cdr) {
                                activity_cdr.require_cdr = true;
                            } else {
                                activity_cdr.require_cdr = false;
                            }
                            break;
                        case 3:
                            const a_2_3 = activity_cdr['cdr_percent'][1] + activity_cdr['cdr_percent'][2]
                            if (a_2_3 < 20 || a_2_3 >= 40 || check_min_cdr) {
                                activity_cdr.require_cdr = true;
                            } else {
                                activity_cdr.require_cdr = false;
                            }
                            break;
                        default:
                            break;
                    }
                    break;
                case 3:
                    switch (activity_cdr.cdr_level) {
                        case 1:
                            const a_2_1 = activity_cdr['cdr_percent'][2] + activity_cdr['cdr_percent'][3] + activity_cdr['cdr_percent'][4];
                            if (a_2_1 < 10 || a_2_1 > 30 || check_min_cdr) {
                                activity_cdr.require_cdr = true;
                            } else {
                                activity_cdr.require_cdr = false;
                            }
                            break;
                        case 2:
                            const a_3_2 = activity_cdr['cdr_percent'][3] + activity_cdr['cdr_percent'][4];
                            if (a_3_2 > 10 || check_min_cdr) {
                                activity_cdr.require_cdr = true;
                            } else {
                                activity_cdr.require_cdr = false;
                            }
                            break;
                        case 3:
                            if (activity_cdr['cdr_percent'][3] < 50 || check_min_cdr) {
                                activity_cdr.require_cdr = true;
                            } else {
                                activity_cdr.require_cdr = false;
                            }
                            break;
                        default:
                            break;
                    }
                    break;
                case 4:
                    switch (activity_cdr.cdr_level) {
                        case 1:
                            const a_2_1 = activity_cdr['cdr_percent'][2] + activity_cdr['cdr_percent'][3] + activity_cdr['cdr_percent'][4];
                            if (a_2_1 < 10 || a_2_1 > 30 || check_min_cdr) {
                                activity_cdr.require_cdr = true;
                            } else {
                                activity_cdr.require_cdr = false;
                            }
                            break;
                        case 2:
                            const a_3_2 = activity_cdr['cdr_percent'][3] + activity_cdr['cdr_percent'][4];
                            if (a_3_2 > 10 || check_min_cdr) {
                                activity_cdr.require_cdr = true;
                            } else {
                                activity_cdr.require_cdr = false;
                            }
                            break;
                        case 3:
                            if (activity_cdr['cdr_percent'][4] > 10 || check_min_cdr) {
                                activity_cdr.require_cdr = true;
                            } else {
                                activity_cdr.require_cdr = false;
                            }
                            break;
                        default:
                            break;
                    }
                    break;
                default:
                    break;
            }

            if (check) {
                this.checkCdrCourse();
            }
        }
    }

    checkCdrCourse() {
        if (this.selectedCourse.params && this.selectedCourse.params.cdr) {
            let s = 0;

            const cdr_total = {};

            this.selectedCourse.cdr_percent = {};
            this.selectedCourse['class_require'] = {};

            this.chuandaura.forEach(f => {
                if (!f.disabled) {
                    cdr_total[f.id] = 0;
                    this.selectedCourse.cdr_percent[f.id] = 0;
                }
            })

            this.list_cdr_cauhoi.forEach(f => {
                if (f.children) {
                    f.children.forEach(c => {
                        this.chuandaura.forEach(cdr => {
                            if (c.cdr_cauhoi[cdr.id]) {
                                cdr_total[cdr.id] = cdr_total[cdr.id] + c.cdr_cauhoi[cdr.id];
                                s = c.cdr_cauhoi[cdr.id] + s;
                            }
                        })
                    })
                }
            })

            this.selectedCourse.total_question = s;

            let total_percent_less = 0;

            const less_class = [];

            let total_percent_greater = 0;

            const greater_class = [];

            this.chuandaura.forEach(cdr => {
                if (this.selectedCourse.params && this.selectedCourse.params.cdr && !cdr.disabled) {
                    if (cdr_total[cdr.id] !== 0) {
                        this.selectedCourse.cdr_percent[cdr.id] = this.convertRoundNumber(cdr_total[cdr.id] / this.selectedCourse.total_question * 100);
                    } else {
                        this.selectedCourse.cdr_percent[cdr.id] = 0;
                    }

                    if (cdr.id < this.selectedCourse.params.cdr) {
                        total_percent_less = total_percent_less + this.selectedCourse['cdr_percent'][cdr.id];
                        less_class.push(cdr.id);

                    } else if (cdr.id > this.selectedCourse.params.cdr) {
                        total_percent_greater = total_percent_greater + this.selectedCourse['cdr_percent'][cdr.id];
                        greater_class.push(cdr.id);
                    }
                }
            })

            this.selectedCourse['cdr_question'] = cdr_total;

            if (total_percent_less > 40) {
                less_class.forEach(f => {
                    this.selectedCourse['class_require'][f] = true;
                })
            } else {
                less_class.forEach(f => {
                    this.selectedCourse['class_require'][f] = false;
                })
            }

            if ((this.selectedCourse['cdr_percent'][this.selectedCourse.params.cdr] + total_percent_greater) < 50) {
                this.selectedCourse['class_require'][this.selectedCourse.params.cdr] = true;
                greater_class.forEach(f => {
                    this.selectedCourse['class_require'][f] = true;
                })
            } else if ((this.selectedCourse['cdr_percent'][this.selectedCourse.params.cdr] + total_percent_greater) >= 50) {
                this.selectedCourse['class_require'][this.selectedCourse.params.cdr] = false;
                greater_class.forEach(f => {
                    this.selectedCourse['class_require'][f] = false;
                })
            }

            if ((this.selectedCourse['cdr_percent'][this.selectedCourse.params.cdr] + total_percent_greater) < 50 || total_percent_less > 40) {
                this.selectedCourse.require_cdr = true;
            } else {
                this.selectedCourse.require_cdr = false;
            }
        }
    }

    saveCdrQuestion() {
        if (this.selectedCourse.params && this.selectedCourse.params.cdr) {

            let check_require_cdr = false;

            this.list_cdr_cauhoi.forEach(f => {
                if (f.children) {
                    f.children.forEach(c => {
                        if (c['require_cdr']) {
                            check_require_cdr = true;
                        }
                    })
                }
            })

            if (!this.selectedCourse.require_cdr && !check_require_cdr) {

                const request: Observable<any>[] = [];

                this.list_cdr_cauhoi.forEach(f => {
                    if (f.children) {
                        f.children.forEach(c => {
                            this.chuandaura.forEach(cdr => {
                                if (!cdr.disabled && c.cdr_cauhoi[cdr.id] === null) {
                                    c.cdr_cauhoi[cdr.id] = 0;
                                }
                            })
                            request.push(this.coursePlanActivitiesService.updateCoursePlanActivities(c.id, { cdr_cauhoi: c.cdr_cauhoi }));
                        })
                    }
                })

                if (request.length) {
                    this.displayModal = true;
                    this.progressValue = 0;
                    this.loopSaveCdrQuestion(request, 0).subscribe({
                        next: () => {
                            this.displayModal = false;
                            this.progressValue = 0;
                            this.notificationService.toastSuccess("Lưu thành công, vui lòng kiểm tra lại");
                            this.loadCDRCauhoi();
                        },
                        error: () => {

                        }
                    })
                }
            } else {
                this.notificationService.toastWarning("Vui lòng phân bổ lại số lượng câu hỏi CDR theo quy định ở các dòng có chữ màu đỏ")
            }
        } else {
            this.notificationService.toastWarning("Môn học này chưa xác định CDR")
        }
    }

    loopSaveCdrQuestion(request: Observable<any>[], key: number): Observable<any> {
        return request[key].pipe(mergeMap(a => {
            this.progressValue = (key + 1) / request.length * 100;
            if (request[key + 1]) {
                return this.loopSaveCdrQuestion(request, key + 1);
            } else {
                return of(null);
            }
        }))
    }

    closeLeftBody() {
        this.closeLeft = !this.closeLeft;
    }

    cdrGet(cdr: PlanActivityCdr) {
        const lessCdr = [];
        const thanCdr = [];
        this.selectedCdr = cdr;
        this.chuandaura.forEach(f => {
            if (!f.disabled) {
                if (f.id < cdr.cdr_level) {
                    lessCdr.push(f.label);
                }

                if (f.id > cdr.cdr_level) {
                    thanCdr.push(f.label);
                }
            }
        })

        const data = [];

        switch (this.selectedCourse.params.cdr) {
            case 1:
                switch (cdr.cdr_level) {
                    case 1:
                        data.push({
                            label: cdr.cdr_name,
                            html: '&#8805;',
                            value: 70
                        })
                        break;
                    case 2:
                        data.push({
                            label: cdr.cdr_name,
                            html: '&#8805;',
                            value: 10
                        })

                        data.push({
                            label: cdr.cdr_name,
                            html: '&#60;',
                            value: 40
                        })
                        break;
                    case 3:
                        data.push({
                            label: "Biết + Hiểu",
                            html: '&#8805;',
                            value: 20
                        })

                        data.push({
                            label: "Biết + Hiểu",
                            html: '&#60;',
                            value: 40
                        })
                        break;
                    default:
                        break;
                }
                break;
            case 2:
                switch (cdr.cdr_level) {
                    case 1:
                        data.push({
                            label: "Hiểu + Vận dụng + Phân tích",
                            html: '&#8805;',
                            value: 10
                        })

                        data.push({
                            label: "Hiểu + Vận dụng + Phân tích",
                            html: '&#8804;',
                            value: 30
                        })
                        break;
                    case 2:
                        data.push({
                            label: cdr.cdr_name,
                            html: '&#8805;',
                            value: 50
                        })
                        break;
                    case 3:
                        data.push({
                            label: "Biết + Hiểu",
                            html: '&#8805;',
                            value: 20
                        })

                        data.push({
                            label: "Biết + Hiểu",
                            html: '&#60;',
                            value: 40
                        })
                        break;
                    default:
                        break;
                }
                break;
            case 3:
                switch (cdr.cdr_level) {
                    case 1:
                        data.push({
                            label: "Hiểu + Vận dụng + Phân tích",
                            html: '&#8805;',
                            value: 10
                        })

                        data.push({
                            label: "Hiểu + Vận dụng + Phân tích",
                            html: '&#8804;',
                            value: 30
                        })
                        break;
                    case 2:
                        data.push({
                            label: "Vận dụng + Phân tích",
                            html: '&#8804;',
                            value: 10
                        })
                        break;
                    case 3:
                        data.push({
                            label: cdr.cdr_name,
                            html: '&#8805;',
                            value: 50
                        })
                        break;
                    default:
                        break;
                }
                break;
            case 4:
                switch (cdr.cdr_level) {
                    case 1:
                        data.push({
                            label: "Hiểu + Vận dụng + Phân tích",
                            html: '&#8805;',
                            value: 10
                        })

                        data.push({
                            label: "Hiểu + Vận dụng + Phân tích",
                            html: '&#8804;',
                            value: 30
                        })
                        break;
                    case 2:
                        data.push({
                            label: "Vận dụng + Phân tích",
                            html: '&#8804;',
                            value: 10
                        })
                        break;
                    case 3:
                        data.push({
                            label: "Phân tích",
                            html: '&#8804;',
                            value: 10
                        })
                        break;
                    default:
                        break;
                }
                break;
            default:
                break;
        }
        this.khuyennghi = data;
    }

    nextInput(input_question) {
        if (this.inputNumberQuestion && input_question) {
            const input_arrays = this.inputNumberQuestion.toArray()
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


    closeForm(d) {
        d(true);
    }

    openAutoCdr() {
        if (this.selectedCourse && this.selectedCourse.params && this.selectedCourse.params.cdr) {
            this.totalCdrCauhoi = null;
            this.modalService.open(this.autoCdrQuestion, NORMAL_MODAL_OPTIONS);
        } else {
            this.notificationService.toastWarning("Môn học này chưa được cài đật mức CDR");
        }
    }

    calculateTotalQuestions(items: PlanActivityCdr[]): number {
        if (!items) return 0;
        return items.reduce((sum, item) => {
            const count = Number(item.total_question) || 0;
            return sum + count;
        }, 0);
    }
    async saveAutoSetQuestionCdr(d) {
        console.log()
        const html = `
                <div>
                <p class="m-0">- Thao tác này sẽ thêm mới hoặc bổ sung câu hỏi</p>
                <p class="m-0">- Số lượng câu hỏi cũ: <strong style="color:red;">${this.selectedCourse.total_question}</strong>; Số lượng câu hỏi bổ sung, câu hỏi mới: <strong style="color:red;">${this.selectedCourse.total_question + (this.totalCdrCauhoi ? this.totalCdrCauhoi : 0)}</strong> </p>
                <p class="m-0">- Sau khi xác nhận hệ thống sẽ tự động phân bổ giúp các thầy cô, các thầy cô có thể sửa theo ý mình.</p>
                </div>
            `;

        if (this.totalCdrCauhoi) {
            const btn = await this.notificationService.confirm(html, 'THÔNG BÁO XÁC NHẬN BỔ SUNG CÂU HỎI ', [BUTTON_YES, BUTTON_NO]);
            if (btn.name == 'yes') {

                const cdr_cauhoi_child_no_question = this.list_cdr_cauhoi.filter(m => this.calculateTotalQuestions(m.children) === 0);

                console.log(this.list_cdr_cauhoi);

                let _total_cdr_cauhoi = this.totalCdrCauhoi;

                if (cdr_cauhoi_child_no_question.length) {
                    const cdr_cauhoi_child_has_question = this.list_cdr_cauhoi.filter(m => this.calculateTotalQuestions(m.children) > 0);
                    const ng_cdr_has_question = this.selectedCourse.total_question / cdr_cauhoi_child_has_question.length;
                    _total_cdr_cauhoi = this.totalCdrCauhoi - ng_cdr_has_question * cdr_cauhoi_child_no_question.length > 0 ? this.totalCdrCauhoi - ng_cdr_has_question * cdr_cauhoi_child_no_question.length : 0;
                    if (_total_cdr_cauhoi > 0) {
                        this.autoSetQuestionCdr(cdr_cauhoi_child_no_question, ng_cdr_has_question * cdr_cauhoi_child_no_question.length);
                    } else {
                        this.autoSetQuestionCdr(cdr_cauhoi_child_no_question, this.totalCdrCauhoi);
                    }
                }

                if (_total_cdr_cauhoi > 0) {
                    const count_cdr_cauhoi = this.list_cdr_cauhoi.filter(m => m.children && m.children.length);
                    this.autoSetQuestionCdr(count_cdr_cauhoi, _total_cdr_cauhoi);
                }

                this.checkCdrCourse();

                d(true);

            }
        } else {
            this.notificationService.toastWarning("Vui lòng nhập vào tổng số câu");
        }
    }

    autoSetQuestionCdr(_cdr_cauhois: PlanActivityCdr[], _total_cdr_cauhoi: number) {
        const cdr_mon = this.selectedCourse.params.cdr;

        const ng = Math.floor(_total_cdr_cauhoi / _cdr_cauhois.length);

        let du = _total_cdr_cauhoi % _cdr_cauhois.length;

        _cdr_cauhois.forEach(f => {
            let question_for_lesson = ng;
            if (du > 0) {
                question_for_lesson = ng + 1;
                du--;
            }

            if (f.children && f.children.length) {
                f.children.forEach(c => {
                    this.chuandaura.forEach(cdr => {
                        if (!cdr.disabled) {
                            if (!c.cdr_cauhoi[cdr.id]) {
                                c.cdr_cauhoi[cdr.id] = 0;
                            }
                        }
                    })
                })

                switch (cdr_mon) {
                    case 1:
                        if (f.children.length) {
                            const after_cdr = f.children.filter(m => m['cdr_level'] > cdr_mon);
                            if (after_cdr.length === f.children.length) {
                                const ng_c = Math.floor(question_for_lesson / after_cdr.length);
                                let du_c = question_for_lesson % after_cdr.length;
                                f.children.forEach(c => {
                                    let question_for_child = ng_c;
                                    if (du_c > 0) {
                                        question_for_child = ng_c + 1;
                                        du_c--;
                                    }

                                    c.cdr_cauhoi[cdr_mon] = c.cdr_cauhoi[cdr_mon] + question_for_child;

                                    c['cdr_percent'][cdr_mon] = c.cdr_cauhoi[cdr_mon] / (c['total_question'] + question_for_child) * 100;

                                    while (c['cdr_percent'][cdr_mon] >= 40) {
                                        c.cdr_cauhoi[cdr_mon] = c.cdr_cauhoi[cdr_mon] - 1;
                                        c.cdr_cauhoi[c['cdr_level']] = c.cdr_cauhoi[c['cdr_level']] + 1;
                                        c['cdr_percent'][cdr_mon] = c.cdr_cauhoi[cdr_mon] / (c['total_question'] + question_for_child) * 100;
                                    }

                                })
                            } else {
                                after_cdr.forEach(c => {
                                    if (c['total_question'] === 0) {
                                        c.cdr_cauhoi[cdr_mon] = 1;

                                        question_for_lesson = question_for_lesson - 1;

                                        c['cdr_percent'][cdr_mon] = 100;

                                        while (c['cdr_percent'][cdr_mon] >= 40 && question_for_lesson !== 0) {
                                            c.cdr_cauhoi[c['cdr_level']] = c.cdr_cauhoi[c['cdr_level']] + 1;
                                            question_for_lesson = question_for_lesson - 1;
                                            c['cdr_percent'][cdr_mon] = c.cdr_cauhoi[cdr_mon] / (c.cdr_cauhoi[c['cdr_level']] + c.cdr_cauhoi[cdr_mon]) * 100;
                                        }
                                    } else {
                                        let max_cdr_mon = Math.floor((c['total_question'] * 40) / 100);

                                        if ((c['total_question'] * 40) % 100 === 0) {
                                            max_cdr_mon = max_cdr_mon - 1;
                                        }

                                        if (max_cdr_mon > c.cdr_cauhoi[cdr_mon] && (question_for_lesson > (max_cdr_mon - c.cdr_cauhoi[cdr_mon]))) {
                                            c.cdr_cauhoi[cdr_mon] = max_cdr_mon;
                                            question_for_lesson = question_for_lesson - (max_cdr_mon - c.cdr_cauhoi[cdr_mon]);
                                        } else {
                                            while (c['cdr_percent'][cdr_mon] >= 40 && question_for_lesson !== 0) {
                                                c.cdr_cauhoi[c['cdr_level']] = c.cdr_cauhoi[c['cdr_level']] + 1;
                                                question_for_lesson = question_for_lesson - 1;
                                                c['total_question'] = c['total_question'] + 1;
                                                c['cdr_percent'][cdr_mon] = c.cdr_cauhoi[cdr_mon] / (c['total_question']) * 100;
                                            }
                                        }
                                    }
                                })
                                const child_cdr_mon = f.children.filter(m => m['cdr_level'] === cdr_mon);
                                if (child_cdr_mon.length) {
                                    const ng_c = Math.floor(question_for_lesson / child_cdr_mon.length);
                                    let du_c = question_for_lesson % child_cdr_mon.length;
                                    child_cdr_mon.forEach(c => {
                                        let question_for_child = ng_c;
                                        if (du_c > 0) {
                                            question_for_child = ng_c + 1;
                                            du_c--;
                                        }
                                        c.cdr_cauhoi[cdr_mon] = c.cdr_cauhoi[cdr_mon] + question_for_child;
                                    })
                                }
                            }
                        }
                        break;
                    case 2:
                        if (f.children.length) {
                            const after_cdr = f.children.filter(m => m['cdr_level'] !== cdr_mon);
                            if (after_cdr.length === f.children.length) {
                                const ng_c = Math.floor(question_for_lesson / after_cdr.length);
                                let du_c = question_for_lesson % after_cdr.length;
                                f.children.forEach(c => {
                                    let question_for_child = ng_c;
                                    if (du_c > 0) {
                                        question_for_child = ng_c + 1;
                                        du_c--;
                                    }

                                    c.cdr_cauhoi[cdr_mon] = c.cdr_cauhoi[cdr_mon] + question_for_child;

                                    switch (c['cdr_level']) {
                                        case 1:
                                            let total_percent_cdr_after_1 = this.countPercent(c.cdr_cauhoi, [2, 3, 4]);
                                            while (total_percent_cdr_after_1 > 30) {
                                                c.cdr_cauhoi[cdr_mon] = c.cdr_cauhoi[cdr_mon] - 1;
                                                c.cdr_cauhoi[c['cdr_level']] = c.cdr_cauhoi[c['cdr_level']] + 1;
                                                total_percent_cdr_after_1 = this.countPercent(c.cdr_cauhoi, [2, 3, 4]);
                                            }
                                            break;
                                        default:
                                            let total_percent_cdr_before = this.countPercent(c.cdr_cauhoi, [1, 2]);

                                            while (total_percent_cdr_before >= 40) {
                                                c.cdr_cauhoi[cdr_mon] = c.cdr_cauhoi[cdr_mon] - 1;
                                                c.cdr_cauhoi[c['cdr_level']] = c.cdr_cauhoi[c['cdr_level']] + 1;
                                                total_percent_cdr_before = this.countPercent(c.cdr_cauhoi, [1, 2]);
                                            }
                                            break;
                                    }
                                })
                            } else {
                                after_cdr.forEach(c => {
                                    if (c['total_question'] === 0) {
                                        c.cdr_cauhoi[cdr_mon] = 1;

                                        question_for_lesson = question_for_lesson - 1;

                                        c['cdr_percent'][cdr_mon] = 100;

                                        switch (c['cdr_level']) {
                                            case 1:
                                                while (c['cdr_percent'][cdr_mon] > 30 && question_for_lesson !== 0) {
                                                    c.cdr_cauhoi[c['cdr_level']] = c.cdr_cauhoi[c['cdr_level']] + 1;
                                                    question_for_lesson = question_for_lesson - 1;
                                                    c['cdr_percent'][cdr_mon] = c.cdr_cauhoi[cdr_mon] / (c.cdr_cauhoi[cdr_mon] + c.cdr_cauhoi[c['cdr_level']]) * 100;
                                                }
                                                break;
                                            default:
                                                while (c['cdr_percent'][cdr_mon] >= 40 && question_for_lesson !== 0) {
                                                    c.cdr_cauhoi[c['cdr_level']] = c.cdr_cauhoi[c['cdr_level']] + 1;
                                                    question_for_lesson = question_for_lesson - 1;
                                                    c['cdr_percent'][cdr_mon] = c.cdr_cauhoi[cdr_mon] / (c.cdr_cauhoi[cdr_mon] + c.cdr_cauhoi[c['cdr_level']]) * 100;
                                                }
                                                break;
                                        }
                                    } else {
                                        switch (c['cdr_level']) {
                                            case 1:
                                                if (question_for_lesson !== 0) {

                                                    let max_cdr_mon = Math.floor((c['total_question'] * 30) / 100);

                                                    const s_cdr_after = c.cdr_cauhoi[2] + c.cdr_cauhoi[3] + c.cdr_cauhoi[4];

                                                    if (max_cdr_mon > s_cdr_after && (question_for_lesson > (max_cdr_mon - s_cdr_after))) {
                                                        c.cdr_cauhoi[cdr_mon] = c.cdr_cauhoi[cdr_mon] + (max_cdr_mon - s_cdr_after);
                                                        question_for_lesson = question_for_lesson - (max_cdr_mon - s_cdr_after);
                                                    } else {

                                                        let total_percent_cdr_after_1 = this.countPercent(c.cdr_cauhoi, [2, 3, 4]);

                                                        while (total_percent_cdr_after_1 > 30 && question_for_lesson !== 0) {
                                                            c.cdr_cauhoi[c['cdr_level']] = c.cdr_cauhoi[c['cdr_level']] + 1;
                                                            question_for_lesson = question_for_lesson - 1;
                                                            total_percent_cdr_after_1 = this.countPercent(c.cdr_cauhoi, [2, 3, 4]);
                                                        }
                                                    }
                                                }
                                                break;
                                            default:
                                                if (question_for_lesson !== 0) {

                                                    let max_cdr_mon = Math.floor((c['total_question'] * 40) / 100);

                                                    if ((c['total_question'] * 40) % 100 === 0) {
                                                        max_cdr_mon = max_cdr_mon - 1;
                                                    }

                                                    const s_cdr_after = c.cdr_cauhoi[1] + c.cdr_cauhoi[2];

                                                    if (max_cdr_mon > s_cdr_after && (question_for_lesson > (max_cdr_mon - s_cdr_after))) {
                                                        c.cdr_cauhoi[cdr_mon] = c.cdr_cauhoi[cdr_mon] + (max_cdr_mon - s_cdr_after);
                                                        question_for_lesson = question_for_lesson - (max_cdr_mon - s_cdr_after);
                                                    } else {

                                                        let total_percent_cdr_after_1 = this.countPercent(c.cdr_cauhoi, [1, 2]);

                                                        while (total_percent_cdr_after_1 >= 40 && question_for_lesson !== 0) {
                                                            c.cdr_cauhoi[c['cdr_level']] = c.cdr_cauhoi[c['cdr_level']] + 1;
                                                            question_for_lesson = question_for_lesson - 1;
                                                            total_percent_cdr_after_1 = this.countPercent(c.cdr_cauhoi, [1, 2]);
                                                        }
                                                    }
                                                }
                                                break;
                                        }

                                    }
                                })

                                const child_cdr_mon = f.children.filter(m => m['cdr_level'] === cdr_mon);

                                if (child_cdr_mon.length) {
                                    const ng_c = Math.floor(question_for_lesson / child_cdr_mon.length);
                                    let du_c = question_for_lesson % child_cdr_mon.length;
                                    child_cdr_mon.forEach(c => {
                                        let question_for_child = ng_c;
                                        if (du_c > 0) {
                                            question_for_child = ng_c + 1;
                                            du_c--;
                                        }
                                        c.cdr_cauhoi[cdr_mon] = c.cdr_cauhoi[cdr_mon] + question_for_child;
                                    })
                                }
                            }
                        }
                        break;
                    case 3:
                        if (f.children.length) {
                            const after_cdr = f.children.filter(m => m['cdr_level'] !== cdr_mon);
                            if (after_cdr.length === f.children.length) {
                                const ng_c = Math.floor(question_for_lesson / after_cdr.length);
                                let du_c = question_for_lesson % after_cdr.length;
                                f.children.forEach(c => {
                                    let question_for_child = ng_c;
                                    if (du_c > 0) {
                                        question_for_child = ng_c + 1;
                                        du_c--;
                                    }

                                    c.cdr_cauhoi[cdr_mon] = c.cdr_cauhoi[cdr_mon] + question_for_child;

                                    switch (c['cdr_level']) {
                                        case 1:
                                            let total_percent_cdr_after_1 = this.countPercent(c.cdr_cauhoi, [2, 3, 4]);
                                            while (total_percent_cdr_after_1 > 30) {
                                                c.cdr_cauhoi[cdr_mon] = c.cdr_cauhoi[cdr_mon] - 1;
                                                c.cdr_cauhoi[c['cdr_level']] = c.cdr_cauhoi[c['cdr_level']] + 1;
                                                total_percent_cdr_after_1 = this.countPercent(c.cdr_cauhoi, [2, 3, 4]);
                                            }
                                            break;
                                        default:
                                            let total_percent_cdr_before = this.countPercent(c.cdr_cauhoi, [3, 4]);

                                            while (total_percent_cdr_before > 10) {
                                                c.cdr_cauhoi[cdr_mon] = c.cdr_cauhoi[cdr_mon] - 1;
                                                c.cdr_cauhoi[c['cdr_level']] = c.cdr_cauhoi[c['cdr_level']] + 1;
                                                total_percent_cdr_before = this.countPercent(c.cdr_cauhoi, [3, 4]);
                                            }
                                            break;
                                    }
                                })
                            } else {
                                after_cdr.forEach(c => {
                                    if (c['total_question'] === 0) {
                                        c.cdr_cauhoi[cdr_mon] = 1;

                                        question_for_lesson = question_for_lesson - 1;

                                        c['cdr_percent'][cdr_mon] = 100;

                                        switch (c['cdr_level']) {
                                            case 1:
                                                while (c['cdr_percent'][cdr_mon] > 30 && question_for_lesson !== 0) {
                                                    c.cdr_cauhoi[c['cdr_level']] = c.cdr_cauhoi[c['cdr_level']] + 1;
                                                    question_for_lesson = question_for_lesson - 1;
                                                    c['cdr_percent'][cdr_mon] = c.cdr_cauhoi[cdr_mon] / (c.cdr_cauhoi[cdr_mon] + c.cdr_cauhoi[c['cdr_level']]) * 100;
                                                }
                                                break;
                                            default:
                                                while (c['cdr_percent'][cdr_mon] > 10 && question_for_lesson !== 0) {
                                                    c.cdr_cauhoi[c['cdr_level']] = c.cdr_cauhoi[c['cdr_level']] + 1;
                                                    question_for_lesson = question_for_lesson - 1;
                                                    c['cdr_percent'][cdr_mon] = c.cdr_cauhoi[cdr_mon] / (c.cdr_cauhoi[cdr_mon] + c.cdr_cauhoi[c['cdr_level']]) * 100;
                                                }
                                                break;
                                        }
                                    } else {
                                        switch (c['cdr_level']) {
                                            case 1:
                                                if (question_for_lesson !== 0) {

                                                    let max_cdr_mon = Math.floor((c['total_question'] * 30) / 100);

                                                    const s_cdr_after = c.cdr_cauhoi[2] + c.cdr_cauhoi[3] + c.cdr_cauhoi[4];

                                                    if (max_cdr_mon > s_cdr_after && (question_for_lesson > (max_cdr_mon - s_cdr_after))) {
                                                        c.cdr_cauhoi[cdr_mon] = c.cdr_cauhoi[cdr_mon] + (max_cdr_mon - s_cdr_after);
                                                        question_for_lesson = question_for_lesson - (max_cdr_mon - s_cdr_after);
                                                    } else {

                                                        let total_percent_cdr_after_1 = this.countPercent(c.cdr_cauhoi, [2, 3, 4]);

                                                        while (total_percent_cdr_after_1 > 30 && question_for_lesson !== 0) {
                                                            c.cdr_cauhoi[c['cdr_level']] = c.cdr_cauhoi[c['cdr_level']] + 1;
                                                            question_for_lesson = question_for_lesson - 1;
                                                            total_percent_cdr_after_1 = this.countPercent(c.cdr_cauhoi, [2, 3, 4]);
                                                        }
                                                    }
                                                }
                                                break;
                                            default:
                                                if (question_for_lesson !== 0) {

                                                    let max_cdr_mon = Math.floor((c['total_question'] * 10) / 100);

                                                    const s_cdr_after = c.cdr_cauhoi[3] + c.cdr_cauhoi[4];

                                                    if (max_cdr_mon > s_cdr_after && (question_for_lesson > (max_cdr_mon - s_cdr_after))) {
                                                        c.cdr_cauhoi[cdr_mon] = c.cdr_cauhoi[cdr_mon] + (max_cdr_mon - s_cdr_after);
                                                        question_for_lesson = question_for_lesson - (max_cdr_mon - s_cdr_after);
                                                    } else {

                                                        let total_percent_cdr_after_1 = this.countPercent(c.cdr_cauhoi, [3, 4]);

                                                        while (total_percent_cdr_after_1 > 10 && question_for_lesson !== 0) {
                                                            c.cdr_cauhoi[c['cdr_level']] = c.cdr_cauhoi[c['cdr_level']] + 1;
                                                            question_for_lesson = question_for_lesson - 1;
                                                            total_percent_cdr_after_1 = this.countPercent(c.cdr_cauhoi, [3, 4]);
                                                        }
                                                    }
                                                }
                                                break;
                                        }

                                    }
                                })

                                const child_cdr_mon = f.children.filter(m => m['cdr_level'] === cdr_mon);

                                if (child_cdr_mon.length) {
                                    const ng_c = Math.floor(question_for_lesson / child_cdr_mon.length);
                                    let du_c = question_for_lesson % child_cdr_mon.length;
                                    child_cdr_mon.forEach(c => {
                                        let question_for_child = ng_c;
                                        if (du_c > 0) {
                                            question_for_child = ng_c + 1;
                                            du_c--;
                                        }
                                        c.cdr_cauhoi[cdr_mon] = c.cdr_cauhoi[cdr_mon] + question_for_child;
                                    })
                                }
                            }
                        }
                        break;
                    case 4:
                        if (f.children.length) {
                            const after_cdr = f.children.filter(m => m['cdr_level'] !== cdr_mon);
                            if (after_cdr.length === f.children.length) {
                                const ng_c = Math.floor(question_for_lesson / after_cdr.length);
                                let du_c = question_for_lesson % after_cdr.length;
                                f.children.forEach(c => {
                                    let question_for_child = ng_c;
                                    if (du_c > 0) {
                                        question_for_child = ng_c + 1;
                                        du_c--;
                                    }

                                    c.cdr_cauhoi[cdr_mon] = c.cdr_cauhoi[cdr_mon] + question_for_child;

                                    switch (c['cdr_level']) {
                                        case 1:
                                            let total_percent_cdr_after_1 = this.countPercent(c.cdr_cauhoi, [2, 3, 4]);
                                            while (total_percent_cdr_after_1 > 30) {
                                                c.cdr_cauhoi[cdr_mon] = c.cdr_cauhoi[cdr_mon] - 1;
                                                c.cdr_cauhoi[c['cdr_level']] = c.cdr_cauhoi[c['cdr_level']] + 1;
                                                total_percent_cdr_after_1 = this.countPercent(c.cdr_cauhoi, [2, 3, 4]);
                                            }
                                            break;
                                        case 2:
                                            let total_percent_cdr_before_1 = this.countPercent(c.cdr_cauhoi, [3, 4]);

                                            while (total_percent_cdr_before_1 > 10) {
                                                c.cdr_cauhoi[cdr_mon] = c.cdr_cauhoi[cdr_mon] - 1;
                                                c.cdr_cauhoi[c['cdr_level']] = c.cdr_cauhoi[c['cdr_level']] + 1;
                                                total_percent_cdr_before_1 = this.countPercent(c.cdr_cauhoi, [3, 4]);
                                            }
                                            break;
                                        default:
                                            let total_percent_cdr_before = this.countPercent(c.cdr_cauhoi, [4]);
                                            while (total_percent_cdr_before > 10) {
                                                c.cdr_cauhoi[cdr_mon] = c.cdr_cauhoi[cdr_mon] - 1;
                                                c.cdr_cauhoi[c['cdr_level']] = c.cdr_cauhoi[c['cdr_level']] + 1;
                                                total_percent_cdr_before = this.countPercent(c.cdr_cauhoi, [4]);
                                            }
                                            break;
                                    }
                                })
                            } else {
                                after_cdr.forEach(c => {
                                    if (c['total_question'] === 0) {
                                        c.cdr_cauhoi[cdr_mon] = 1;

                                        question_for_lesson = question_for_lesson - 1;

                                        c['cdr_percent'][cdr_mon] = 100;

                                        switch (c['cdr_level']) {
                                            case 1:
                                                while (c['cdr_percent'][cdr_mon] > 30 && question_for_lesson !== 0) {
                                                    c.cdr_cauhoi[c['cdr_level']] = c.cdr_cauhoi[c['cdr_level']] + 1;
                                                    question_for_lesson = question_for_lesson - 1;
                                                    c['cdr_percent'][cdr_mon] = c.cdr_cauhoi[cdr_mon] / (c.cdr_cauhoi[cdr_mon] + c.cdr_cauhoi[c['cdr_level']]) * 100;
                                                }
                                                break;
                                            default:
                                                while (c['cdr_percent'][cdr_mon] > 10 && question_for_lesson !== 0) {
                                                    c.cdr_cauhoi[c['cdr_level']] = c.cdr_cauhoi[c['cdr_level']] + 1;
                                                    question_for_lesson = question_for_lesson - 1;
                                                    c['cdr_percent'][cdr_mon] = c.cdr_cauhoi[cdr_mon] / (c.cdr_cauhoi[cdr_mon] + c.cdr_cauhoi[c['cdr_level']]) * 100;
                                                }
                                                break;
                                        }
                                    } else {
                                        switch (c['cdr_level']) {
                                            case 1:
                                                if (question_for_lesson !== 0) {

                                                    let max_cdr_mon = Math.floor((c['total_question'] * 30) / 100);

                                                    const s_cdr_after = c.cdr_cauhoi[2] + c.cdr_cauhoi[3] + c.cdr_cauhoi[4];

                                                    if (max_cdr_mon > s_cdr_after && (question_for_lesson > (max_cdr_mon - s_cdr_after))) {
                                                        c.cdr_cauhoi[cdr_mon] = c.cdr_cauhoi[cdr_mon] + (max_cdr_mon - s_cdr_after);
                                                        question_for_lesson = question_for_lesson - (max_cdr_mon - s_cdr_after);
                                                    } else {

                                                        let total_percent_cdr_after_1 = this.countPercent(c.cdr_cauhoi, [2, 3, 4]);

                                                        while (total_percent_cdr_after_1 > 30 && question_for_lesson !== 0) {
                                                            c.cdr_cauhoi[c['cdr_level']] = c.cdr_cauhoi[c['cdr_level']] + 1;
                                                            question_for_lesson = question_for_lesson - 1;
                                                            total_percent_cdr_after_1 = this.countPercent(c.cdr_cauhoi, [2, 3, 4]);
                                                        }
                                                    }
                                                }
                                                break;
                                            case 2:
                                                if (question_for_lesson !== 0) {

                                                    let max_cdr_mon = Math.floor((c['total_question'] * 10) / 100);

                                                    const s_cdr_after = c.cdr_cauhoi[3] + c.cdr_cauhoi[4];

                                                    if (max_cdr_mon > s_cdr_after && (question_for_lesson > (max_cdr_mon - s_cdr_after))) {
                                                        c.cdr_cauhoi[cdr_mon] = c.cdr_cauhoi[cdr_mon] + (max_cdr_mon - s_cdr_after);
                                                        question_for_lesson = question_for_lesson - (max_cdr_mon - s_cdr_after);
                                                    } else {

                                                        let total_percent_cdr_after_1 = this.countPercent(c.cdr_cauhoi, [3, 4]);

                                                        while (total_percent_cdr_after_1 > 10 && question_for_lesson !== 0) {
                                                            c.cdr_cauhoi[c['cdr_level']] = c.cdr_cauhoi[c['cdr_level']] + 1;
                                                            question_for_lesson = question_for_lesson - 1;
                                                            total_percent_cdr_after_1 = this.countPercent(c.cdr_cauhoi, [3, 4]);
                                                        }
                                                    }
                                                }
                                                break;
                                            default:
                                                if (question_for_lesson !== 0) {

                                                    let max_cdr_mon = Math.floor((c['total_question'] * 10) / 100);

                                                    const s_cdr_after = c.cdr_cauhoi[4];

                                                    if (max_cdr_mon > s_cdr_after && (question_for_lesson > (max_cdr_mon - s_cdr_after))) {
                                                        c.cdr_cauhoi[cdr_mon] = c.cdr_cauhoi[cdr_mon] + (max_cdr_mon - s_cdr_after);
                                                        question_for_lesson = question_for_lesson - (max_cdr_mon - s_cdr_after);
                                                    } else {

                                                        let total_percent_cdr_after_1 = this.countPercent(c.cdr_cauhoi, [4]);

                                                        while (total_percent_cdr_after_1 > 10 && question_for_lesson !== 0) {
                                                            c.cdr_cauhoi[c['cdr_level']] = c.cdr_cauhoi[c['cdr_level']] + 1;
                                                            question_for_lesson = question_for_lesson - 1;
                                                            total_percent_cdr_after_1 = this.countPercent(c.cdr_cauhoi, [4]);
                                                        }
                                                    }
                                                }
                                                break;
                                        }

                                    }
                                })

                                const child_cdr_mon = f.children.filter(m => m['cdr_level'] === cdr_mon);

                                if (child_cdr_mon.length) {
                                    const ng_c = Math.floor(question_for_lesson / child_cdr_mon.length);
                                    let du_c = question_for_lesson % child_cdr_mon.length;
                                    child_cdr_mon.forEach(c => {
                                        let question_for_child = ng_c;
                                        if (du_c > 0) {
                                            question_for_child = ng_c + 1;
                                            du_c--;
                                        }
                                        c.cdr_cauhoi[cdr_mon] = c.cdr_cauhoi[cdr_mon] + question_for_child;
                                    })
                                }
                            }
                        }
                        break;
                    default:
                        break;
                }

                f.children.forEach(c => {
                    this.setNumberCdrCauhoi(c);
                })
            }
        })
    }

    countPercent(cdr_cauhoi: {}, numbers: number[]) {

        let s_number = 0;

        let s = 0;

        Object.keys(cdr_cauhoi).forEach(o => {
            if (!isNaN(parseFloat(o))) {
                s = s + cdr_cauhoi[o];
            }
        })

        numbers.forEach(f => {
            s_number = s_number + cdr_cauhoi[f];
        })

        if (s !== 0) {
            return s_number / s * 100;
        }

        return 0;
    }

    setQuestionCdr(c: PlanActivityCdr, question_for_child: number) {
        const lessCdr = [];

        const greaterCdr = [];

        let befor_percent = 0;

        let after_percent = 0;


        this.chuandaura.forEach(f => {
            if (!f.disabled) {
                if (!c.cdr_cauhoi[f.id]) {
                    c.cdr_cauhoi[f.id] = 0;
                }

                if (f.id < c['cdr_level']) {
                    lessCdr.push(f.id);
                    // befor_percent = befor_percent + c['cdr_percent'][f.id];
                }

                if (f.id > c['cdr_level']) {
                    greaterCdr.push(f.id);
                    after_percent = after_percent + c['cdr_percent'][f.id];
                }
            }
        })


        let befor = 0 // Math.floor(question_for_child * 35 / 100);
        let after = 0 // Math.floor(question_for_child * 15 / 100);
        let mid = question_for_child;
        switch (c.cdr_level) {
            case 1:
                after = Math.floor(question_for_child * 30 / 100);
                mid = question_for_child - after;
                c.cdr_cauhoi[c["cdr_level"]] = c.cdr_cauhoi[c["cdr_level"]] + mid;
                if (greaterCdr.length !== 0 && after_percent < 30) {
                    c.cdr_cauhoi[greaterCdr[0]] = c.cdr_cauhoi[greaterCdr[0]] + after;
                } else {
                    c.cdr_cauhoi[c["cdr_level"]] = c.cdr_cauhoi[c["cdr_level"]] + after;
                }
                break;
            default:
                after = c.cdr_level !== 3 ? Math.floor(question_for_child * 10 / 100) : 0;

                mid = question_for_child - after;

                c.cdr_cauhoi[c["cdr_level"]] = c.cdr_cauhoi[c["cdr_level"]] + mid;

                if (greaterCdr.length !== 0 && after_percent <= 10) {
                    c.cdr_cauhoi[greaterCdr[0]] = c.cdr_cauhoi[greaterCdr[0]] + after;
                } else {
                    c.cdr_cauhoi[c["cdr_level"]] = c.cdr_cauhoi[c["cdr_level"]] + after;
                }

                if (lessCdr.length) {
                    this.checkPercentWhile(lessCdr, c, question_for_child);
                }
                break;
        }
    }

    checkPercentWhile(lessCdr: any[], c: PlanActivityCdr, question_for_child: number) {

        let s_befor = 0;

        lessCdr.forEach(f => {
            s_befor = s_befor + c.cdr_cauhoi[f];
        })

        const befor_percent = s_befor / (c.total_question + question_for_child) * 100;

        switch (c.cdr_level) {
            case 2:
                if (befor_percent < 10) {
                    c.cdr_cauhoi[c.cdr_level] = c.cdr_cauhoi[c.cdr_level] - 1;

                    c.cdr_cauhoi[lessCdr[lessCdr.length - 1]] = c.cdr_cauhoi[lessCdr[lessCdr.length - 1]] + 1;

                    this.checkPercentWhile(lessCdr, c, question_for_child);
                }
                break;
            case 3:
                if (befor_percent < 10) {

                    c.cdr_cauhoi[c.cdr_level] = c.cdr_cauhoi[c.cdr_level] - 1;

                    c.cdr_cauhoi[lessCdr[lessCdr.length - 1]] = c.cdr_cauhoi[lessCdr[lessCdr.length - 1]] + 1;

                    this.checkPercentWhile(lessCdr, c, question_for_child);
                }
                break;
            default:
                break;
        }
    }


    returnPercent(): number {
        if (this.totalCdrCauhoi) {
            if (this.selectedCourse.total_question) {
                return parseFloat((this.totalCdrCauhoi / this.selectedCourse.total_question * 100).toFixed(1));
            } else {
                return 100;
            }
        }
        return 0;
    }

    setQuestionCdr_v2() {

    }


    setNumberCdrCauhoi_v2(activity_cdr: PlanActivityCdr, check: boolean = false) {

        let s = 0;

        this.chuandaura.forEach(cdr => {
            if (activity_cdr.cdr_cauhoi[cdr.id] && !cdr.disabled) {
                s = s + activity_cdr.cdr_cauhoi[cdr.id];
            }
        })

        activity_cdr['total_question'] = s;

        let total_percent_less = 0;

        let total_percent_greater = 0;

        let check_min_cdr = false;

        this.chuandaura.forEach(cdr => {
            if (!cdr.disabled) {
                if (!activity_cdr.cdr_cauhoi[cdr.id]) {
                    activity_cdr.cdr_cauhoi[cdr.id] = 0;
                }
            }
            if ((activity_cdr.cdr_cauhoi[cdr.id] || activity_cdr.cdr_cauhoi[cdr.id] === 0) && !cdr.disabled) {

                if (activity_cdr.cdr_cauhoi[cdr.id] !== 0) {
                    activity_cdr['cdr_percent'][cdr.id] = this.convertRoundNumber(activity_cdr.cdr_cauhoi[cdr.id] / activity_cdr['total_question'] * 100);
                } else {
                    activity_cdr['cdr_percent'][cdr.id] = 0;
                }

                if (cdr.id < activity_cdr.cdr_level) {
                    total_percent_less = total_percent_less + activity_cdr['cdr_percent'][cdr.id];
                } else if (cdr.id > activity_cdr.cdr_level) {
                    total_percent_greater = total_percent_greater + activity_cdr['cdr_percent'][cdr.id];
                }

                if (activity_cdr.cdr_cauhoi[cdr.id] < activity_cdr.min_cdr_question[cdr.id]) {
                    check_min_cdr = true;
                }
            }
        })

        switch (activity_cdr.cdr_level) {
            case 1:
                if (activity_cdr['cdr_percent'][activity_cdr.cdr_level] < 70 || total_percent_greater < 10 || total_percent_greater > 30 || check_min_cdr) {
                    activity_cdr.require_cdr = true;
                } else {
                    activity_cdr.require_cdr = false;
                }
                break;
            case 2:
                if (activity_cdr['cdr_percent'][activity_cdr.cdr_level] < 50 || total_percent_less > 40 || total_percent_less < 10 || total_percent_greater > 10 || check_min_cdr) {
                    activity_cdr.require_cdr = true;
                } else {
                    activity_cdr.require_cdr = false;
                }
                break;
            case 3:
                if (activity_cdr['cdr_percent'][activity_cdr.cdr_level] < 50 || total_percent_less > 40 || total_percent_less < 10 || total_percent_greater > 10 || check_min_cdr) {
                    activity_cdr.require_cdr = true;
                } else {
                    activity_cdr.require_cdr = false;
                }
                break;
            case 4:
                if (activity_cdr['cdr_percent'][activity_cdr.cdr_level] < 50 || total_percent_greater > 10 || check_min_cdr) {
                    activity_cdr.require_cdr = true;
                } else {
                    activity_cdr.require_cdr = false;
                }
                break;
            default:
                break;
        }

        if (check) {
            this.checkCdrCourse();
        }
    }

    resetPhanbo() {
        this.modalService.dismissAll();
        this.loadCDRCauhoi();
    }
}
