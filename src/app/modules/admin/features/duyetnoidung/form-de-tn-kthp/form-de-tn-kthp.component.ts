import { Component, OnInit, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { SharedModule } from '@modules/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OvicQueryCondition } from '@core/models/dto';
import { AuthService } from '@core/services/auth.service';
import { HelperService } from '@core/services/helper.service';
import { NotificationService } from '@core/services/notification.service';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { HoidongThamdinhMonhocThanhvien } from '@modules/shared/models/hoidong-thamdinh-monhoc-thanhvien';
import { ThiFormDetails } from '@modules/shared/models/thi-form-details';
import { CourseFormKthpService } from '@modules/shared/services/course-form-kthp.service';
import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';
import { CourseQuestionsService } from '@modules/shared/services/course-questions.service';
import { ThiFormService } from '@modules/shared/services/thi-form.service';
import { CHUAN_DAU_RA } from '@modules/shared/utils/syscat';
import { forkJoin } from 'rxjs';
import { PlanActivityCdr } from '../../quanly-kehoach-hoctap/phanbo-cdr-cauhoi/phanbo-cdr-cauhoi.component';
import { DuyetFormDeComponent } from "../duyet-form-de/duyet-form-de.component";

@Component({
    selector: 'app-form-de-tn-kthp',
    standalone: true,
    imports: [
        CommonModule,
        TableModule,
        SharedModule,
        ReactiveFormsModule,
        FormsModule,
        DuyetFormDeComponent
    ],
    templateUrl: './form-de-tn-kthp.component.html',
    styleUrls: ['./form-de-tn-kthp.component.css']
})
export class FormDeTnKthpComponent implements OnInit {
    private notificationService = inject(NotificationService);
    private helperService = inject(HelperService);
    private auth = inject(AuthService);
    private thiFormService = inject(ThiFormService);
    private coursePlanActivitiesService = inject(CoursePlanActivitiesService);
    private courseQuestionsService = inject(CourseQuestionsService);
    private courseFormKthpService = inject(CourseFormKthpService);

    readonly selectedCourse = input<ElnKhoaHoc>(undefined);

    readonly listThamDInh = input<HoidongThamdinhMonhocThanhvien[]>(undefined);

    readonly formType = input<'TN_KTHP' | 'TH_KTHP' | 'DG' | 'TNTX' | 'CC'>(undefined);

    readonly onChangeStatus = output<any>();

    label_week: string = "Bài";

    list_form_detail: ThiFormDetails[] = [];

    seletedFormDetail: ThiFormDetails;

    list_course_plan: PlanActivityCdr[];

    chuan_dau_ra = CHUAN_DAU_RA;

    waitting_title: string;

    progressValue: number = 0;

    displayModal: boolean = false;

    ngOnInit(): void {
        this.initFormDetail();
    }

    initFormDetail() {
        this.selectedCourse()['question_take_total'] = null;
        this.list_course_plan = null;
        this.notificationService.isProcessing(true);
        switch (this.selectedCourse().av) {
            case 0:
                this.loadType0();
                break;
            case 1:
                this.loadType1();
                break;
            case 2:
                this.loadType0();
                break;
            default:
                break;
        }
    }

    loadType0() {
        const condition_plan: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse().id.toString(), orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.notEqual, value: '0', orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.lessThan, value: '1000', orWhere: 'and' },
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

        const condition_form_detail: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse().id.toString(), orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
            ],
            page: null
        }

        const condition_question: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse().id.toString(), orWhere: 'and' },
                { conditionName: 'reference', condition: OvicQueryCondition.equal, value: 'course_plan_activities', orWhere: 'and' },
                { conditionName: 'status', condition: OvicQueryCondition.equal, value: '1', orWhere: 'and' },
                { conditionName: 'group_id', condition: OvicQueryCondition.equal, value: '0', orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'cdr,week,reference_id,id,private' }
            ],
            page: null
        }

        forkJoin([
            this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_plan),
            this.courseFormKthpService.getCourseFormKthpByPageNew(condition_form_detail),
            this.courseQuestionsService.getCourseQuestionsByPageNew(condition_question)
        ]).subscribe({
            next: ([_plan_activity, _form_detail, _course_question]) => {

                const parent = _plan_activity.data.filter(m => m.parent_id === 0);

                switch (this.selectedCourse().av) {
                    case 0:
                        parent.forEach(f => {
                            const children_cdr = _plan_activity.data.filter(m => m.parent_id === f.id && m.type === 'ACTIVITY_CDR');
                            f.cdr_cauhoi = {};
                            f['cdr_cauhoi_private'] = {};
                            children_cdr.forEach(c => {
                                if (c.kyhieu)
                                    c['kyhieu_stt'] = parseFloat(c.kyhieu.replace(/\D/gi, ''));


                                if (c.cdr_cauhoi) {
                                    Object.keys(c.cdr_cauhoi).forEach(o => {
                                        if (!isNaN(Number(o)) && c.cdr_cauhoi[o]) {
                                            const count_question = _course_question.data.filter(m => m['week'] === c.week && m.cdr.toString() === o.toString() && m.reference_id === c.id && m.private === 0).length;
                                            if (!f.cdr_cauhoi[o]) {
                                                f.cdr_cauhoi[o] = count_question;
                                            } else {
                                                f.cdr_cauhoi[o] = f.cdr_cauhoi[o] + count_question;
                                            }
                                            // for_private
                                            const count_question_private = _course_question.data.filter(m => m['week'] === c.week && m.cdr.toString() === o.toString() && m.reference_id === c.id && m.private === 1).length;
                                            if (!f['cdr_cauhoi_private'][o]) {
                                                f['cdr_cauhoi_private'][o] = count_question_private;
                                            } else {
                                                f['cdr_cauhoi_private'][o] = f['cdr_cauhoi_private'][o] + count_question_private;
                                            }
                                        }
                                    })
                                }
                            })

                            f.children = this.helperService.sort(children_cdr, 'kyhieu_stt');

                            f['canEdit'] = true;

                            f['question_take'] = {};

                            f['question_take_private'] = {};

                            f['question_take_total'] = 0;

                            f['question_take_total_private'] = 0;

                            f['require_question'] = false;

                            const _form_week = _form_detail.data.filter(m => m.week === f.week);

                            _form_week.forEach(w => {
                                if (w.private === 0) {
                                    if (!f['question_take'][w.cdr]) {
                                        f['question_take'][w.cdr] = w['total_question_take'];
                                    } else {
                                        f['question_take'][w.cdr] = w['total_question_take'] + f['question_take'][w.cdr];
                                    }
                                }

                                if (w.private === 1) {
                                    if (!f['question_take_private'][w.cdr]) {
                                        f['question_take_private'][w.cdr] = w['total_question_take'];
                                    } else {
                                        f['question_take_private'][w.cdr] = w['total_question_take'] + f['question_take_private'][w.cdr];
                                    }
                                }
                            })

                            this.chuan_dau_ra.forEach(c => {
                                if (!c.disabled) {
                                    this.setNumberQuestiontype0(f, c, false);
                                }
                            })

                        })

                        this.list_course_plan = parent;

                        this.setNumberQuestiontype0(null, null);
                        break;
                    case 2:
                        parent.forEach(f => {
                            const children_cdr = _plan_activity.data.filter(m => m.parent_id === f.id && m.type === 'ACTIVITY_CDR');

                            f['canEdit'] = true;

                            children_cdr.forEach(c => {

                                c['cdr_cauhoi_private'] = {};

                                if (c.kyhieu)
                                    c['kyhieu_stt'] = parseFloat(c.kyhieu.replace(/\D/gi, ''));

                                if (c.params && c.params.cdr && c.params.cdr.cdr_info) {
                                    const index = c.params.cdr.cdr_info.findIndex(m => m.id === 'level_require');
                                    if (index !== -1) {
                                        c['cdr_name'] = c.params.cdr.cdr_info[index].value;
                                        c['cdr_level'] = c.params.cdr.cdr_info[index].key;
                                    }
                                }

                                const _form_cdr = _form_detail.data.filter(m => m['course_plan_activity_id'] === c.id && m.week === c.week);

                                c['question_take'] = {};

                                c['question_take_private'] = {};

                                _form_cdr.forEach(w => {
                                    if (w.private === 0) {
                                        if (!c['question_take'][w.cdr]) {
                                            c['question_take'][w.cdr] = w['total_question_take'];
                                        } else {
                                            c['question_take'][w.cdr] = w['total_question_take'] + c['question_take'][w.cdr];
                                        }
                                    }

                                    if (w.private === 1) {
                                        if (!c['question_take_private'][w.cdr]) {
                                            c['question_take_private'][w.cdr] = w['total_question_take'];
                                        } else {
                                            c['question_take_private'][w.cdr] = w['total_question_take'] + c['question_take_private'][w.cdr];
                                        }
                                    }
                                })

                                c['require_question'] = false;

                                Object.keys(c.cdr_cauhoi).forEach(o => {
                                    if (!isNaN(Number(o))) {
                                        c.cdr_cauhoi[o] = _course_question.data.filter(m => m['week'] === c.week && m.cdr.toString() === o.toString() && m.reference_id === c.id && m.private === 0).length;
                                        c['cdr_cauhoi_private'][o] = _course_question.data.filter(m => m['week'] === c.week && m.cdr.toString() === o.toString() && m.reference_id === c.id && m.private === 1).length;
                                    }
                                })

                            })

                            f.children = this.helperService.sort(children_cdr, 'kyhieu_stt');
                        })

                        this.list_course_plan = parent;

                        this.setNumberQuestiontype2();

                        break;
                    default:
                        break;
                }
                this.notificationService.isProcessing(false);
            },
            error: () => {

            }
        })
    }

    setNumberQuestiontype0(item: PlanActivityCdr, cdr: any, math_total = true) {


        let flag = false;

        let flag_private = false;

        if (item && cdr) {
            if (item['question_take'][cdr.id] > item['cdr_cauhoi'][cdr.id]) {
                flag = true;
            } else {
                flag = false;
            }

            if (item['question_take_private'][cdr.id] > item['cdr_cauhoi_private'][cdr.id]) {
                flag_private = true;
            } else {
                flag_private = false;
            }

            item['require_question'] = flag_private || flag ? true : false
        }



        if (math_total) {
            let s_total = 0;

            let s_total_private = 0;

            this.list_course_plan.forEach(f => {

                let s = 0;

                let s_private = 0;

                Object.keys(f['question_take']).forEach(c => {
                    s = s + f['question_take'][c];
                })

                Object.keys(f['question_take_private']).forEach(c => {
                    s_private = s_private + f['question_take_private'][c];
                })

                f['question_take_total'] = s ? s : 0;

                f['question_take_total_private'] = s_private ? s_private : 0;

                s_total = s_total + f['question_take_total'];

                s_total_private = s_total_private + f['question_take_total_private'];

            })

            this.selectedCourse()['question_take_total'] = s_total ? s_total : 0;
            this.selectedCourse()['question_take_total_private'] = s_total_private ? s_total_private : 0;
        }
    }

    /** môn toán */
    setNumberQuestiontype2() {

        let s = 0;

        let s_private = 0;

        this.list_course_plan.forEach(f => {
            if (f.children) {
                f.children.forEach(c => {
                    this.chuan_dau_ra.forEach(cdr => {
                        if (c['question_take'][cdr.id] && c.cdr_cauhoi[cdr.id]) {
                            if (c['question_take'][cdr.id] > c.cdr_cauhoi[cdr.id]) {
                                c['require_question'] = true;
                            } else {
                                c['require_question'] = false;
                            }
                        }

                        if (c['question_take_private'][cdr.id] && c.cdr_cauhoi[cdr.id]) {
                            if (c['question_take_private'][cdr.id] > c.cdr_cauhoi[cdr.id]) {
                                c['require_question'] = true;
                            } else {
                                c['require_question'] = false;
                            }
                        }
                    })


                    let s_child = 0;

                    let s_child_private = 0;

                    Object.keys(c['question_take']).forEach(o => {
                        s_child = s_child + c['question_take'][o];
                    })

                    Object.keys(c['question_take_private']).forEach(o => {
                        s_child_private = s_child_private + c['question_take_private'][o];
                    })

                    c['question_take_total'] = s_child ? s_child : 0;

                    c['question_take_total_private'] = s_child_private ? s_child_private : 0;

                    s = s + c['question_take_total'];

                    s_private = s_private + c['question_take_total_private'];
                })
            }
        })

        this.selectedCourse()['question_take_total'] = s;

        this.selectedCourse()['question_take_total_private'] = s_private;
    }

    /** môn tiếng anh */

    loadType1() {
        const condition_plan: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse().id.toString(), orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.notEqual, value: '0', orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.lessThan, value: '1000', orWhere: 'and' },
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

        const condition_form_detail: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse().id.toString(), orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
            ],
            page: null
        }

        const condition_question: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse().id.toString(), orWhere: 'and' },
                { conditionName: 'reference', condition: OvicQueryCondition.equal, value: 'course_plan_activities', orWhere: 'and' },
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'code,reference_id,week,id,group_id,cdr,private' }
            ],
            page: null
        }

        forkJoin([
            this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_plan),
            this.courseFormKthpService.getCourseFormKthpByPageNew(condition_form_detail),
            this.courseQuestionsService.getCourseQuestionsByPageNew(condition_question)
        ]).subscribe({
            next: ([_course_plan, _form_detail, _course_question]) => {
                const parent = _course_plan.data.filter(m => m.parent_id === 0);

                let ar_part = _course_question.data.map(m => m['code']);

                ar_part = [... new Set(ar_part)];

                let ar_part_number = [];

                ar_part.forEach(a => {
                    if (a) {
                        ar_part_number.push({ part: a, stt_part: a.replace(/\D/gi, '') })
                    }
                })

                ar_part_number = this.helperService.sort(ar_part_number, 'stt_part');

                parent.forEach(f => {
                    const question_parts = [];

                    f['canEdit'] = true;

                    ar_part_number.forEach(p => {
                        const cdr_cauhoi = {};

                        const cdr_cauhoi_private = {};

                        const question_part_question = _course_question.data.filter(m => m['week'] === f.week && m['code'] === p.part);

                        const question_child = _course_question.data.filter(m => question_part_question.findIndex(i => i.id === m.group_id) !== -1)

                        this.chuan_dau_ra.forEach(cdr => {
                            if (!cdr.disabled) {
                                cdr_cauhoi[cdr.id] = question_child.filter(m => m['cdr'] === cdr.id && m.group_id !== 0 && m.private === 0).length;
                                cdr_cauhoi_private[cdr.id] = question_child.filter(m => m['cdr'] === cdr.id && m.group_id !== 0 && m.private === 1).length;
                            }
                        })

                        const data_parts = {
                            part: p.part,
                            stt_part: p.stt_part,
                            cdr_cauhoi: cdr_cauhoi,
                            cdr_cauhoi_private: cdr_cauhoi_private,
                            question_take: {},
                            question_take_total: null,
                            question_take_private: {},
                            question_take_total_private: null,
                            require_question: false
                        }

                        const _form_cdr = _form_detail.data.filter(m => m.week === f.week && m['part'] === p.part);

                        _form_cdr.forEach(w => {
                            if (w.private === 0) {
                                if (!data_parts['question_take'][w.cdr]) {
                                    data_parts['question_take'][w.cdr] = w['total_question_take'];
                                } else {
                                    data_parts['question_take'][w.cdr] = w['total_question_take'] + data_parts['question_take'][w.cdr];
                                }
                            }

                            if (w.private === 1) {
                                if (!data_parts['question_take_private'][w.cdr]) {
                                    data_parts['question_take_private'][w.cdr] = w['total_question_take'];
                                } else {
                                    data_parts['question_take_private'][w.cdr] = w['total_question_take'] + data_parts['question_take_private'][w.cdr];
                                }
                            }
                        })

                        question_parts.push(data_parts);
                    })

                    f['question_parts'] = question_parts;
                })

                this.list_course_plan = parent;

                this.setNumberQuestiontype1();

                this.notificationService.isProcessing(false);
            }
        })
    }

    setNumberQuestiontype1() {

        let s = 0;

        let s_private = 0;

        this.list_course_plan.forEach(f => {
            if (f.question_parts) {
                f.question_parts.forEach(p => {
                    this.chuan_dau_ra.forEach(cdr => {
                        if (p['question_take'][cdr.id] && p.cdr_cauhoi[cdr.id]) {
                            if (p['question_take'][cdr.id] > p.cdr_cauhoi[cdr.id]) {
                                p['require_question'] = true;
                            } else {
                                p['require_question'] = false;
                            }
                        }

                        if (p['question_take_private'][cdr.id] && p.cdr_cauhoi_private[cdr.id]) {
                            if (p['question_take_private'][cdr.id] > p.cdr_cauhoi_private[cdr.id]) {
                                p['require_question'] = true;
                            } else {
                                p['require_question'] = false;
                            }
                        }
                    })

                    let s_child = 0;

                    let s_child_private = 0;

                    Object.keys(p['question_take']).forEach(o => {
                        s_child = s_child + p['question_take'][o];
                    })

                    p['question_take_total'] = s_child ? s_child : 0;

                    Object.keys(p['question_take_private']).forEach(o => {
                        s_child_private = s_child_private + p['question_take_private'][o];
                    })

                    p['question_take_total_private'] = s_child_private ? s_child_private : 0;

                    s = s + p['question_take_total'];

                    s_private = s_private + p['question_take_total_private'];
                })
            }
        })

        this.selectedCourse()['question_take_total'] = s;

        this.selectedCourse()['question_take_total_private'] = s_private;
    }

    sum(arr: number[]): number {
        return arr.reduce((a, b) => a + b, 0);
    }

    changeStatusForm(event) {
        this.onChangeStatus.emit(event);
    }
}
