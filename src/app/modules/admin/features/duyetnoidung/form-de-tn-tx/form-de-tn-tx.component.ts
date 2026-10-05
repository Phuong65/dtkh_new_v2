import { Component, OnInit, inject, input, output } from '@angular/core';


import { OvicQueryCondition } from '@core/models/dto';
import { NotificationService } from '@core/services/notification.service';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { CourseFormTxService } from '@modules/shared/services/course-form-tx.service';
import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';
import { CoursePlanBankService } from '@modules/shared/services/course-plan-bank.service';
import { CourseQuestionsService } from '@modules/shared/services/course-questions.service';
import { CHUAN_DAU_RA } from '@modules/shared/utils/syscat';
import { forkJoin } from 'rxjs';
import { PlanActivityCdr } from '../../quanly-kehoach-hoctap/phanbo-cdr-cauhoi/phanbo-cdr-cauhoi.component';
import { HelperService } from '@core/services/helper.service';
import { CourseQuestions } from '@modules/shared/models/course-questions';
import { PanelModule } from 'primeng/panel';
import { DuyetFormDeComponent } from "../duyet-form-de/duyet-form-de.component";
import { HoidongThamdinhMonhocThanhvien } from '@modules/shared/models/hoidong-thamdinh-monhoc-thanhvien';
import { TableModule } from 'primeng/table';

@Component({
    selector: 'app-form-de-tn-tx',
    standalone: true,
    imports: [
    PanelModule,
    DuyetFormDeComponent,
    TableModule
],
    templateUrl: './form-de-tn-tx.component.html',
    styleUrls: ['./form-de-tn-tx.component.css']
})
export class FormDeTnTxComponent implements OnInit {
    private coursePlanActivitiesService = inject(CoursePlanActivitiesService);
    private notificationService = inject(NotificationService);
    private courseFormTxService = inject(CourseFormTxService);
    private coursePlanBankService = inject(CoursePlanBankService);
    private courseQuestionsService = inject(CourseQuestionsService);
    private helperService = inject(HelperService);

    readonly selectedCourse = input<ElnKhoaHoc>(undefined);

    readonly listThamDInh = input<HoidongThamdinhMonhocThanhvien[]>(undefined);

    readonly formType = input<'TN_KTHP' | 'TH_KTHP' | 'DG' | 'TNTX' | 'CC'>(undefined);

    readonly onChangeStatus = output<any>();

    isManager: boolean = false;

    list_course_plan: PlanActivityCdr[];

    list_test_tx: PlanActivityCdr[];

    list_question_txt1: CourseQuestions[];

    list_question_txt2: CourseQuestions[];

    list_part: string[];

    chuandaura = CHUAN_DAU_RA;

    label_week: string = "Bài";

    show_test_tx: boolean = false;

    ngOnInit(): void {
        this.loadFormTxCauhoi();
    }

    loadFormTxCauhoi() {
        switch (this.selectedCourse().av) {
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
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse().id.toString(), orWhere: 'and' },
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
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse().id.toString(), orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' }
            ],
            page: null
        }

        const condition_plan_bank: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse().id.toString(), orWhere: 'and' },
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
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse().id.toString(), orWhere: 'and' },
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

                    if (this.selectedCourse().params) {

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

                if (this.list_test_tx && this.list_test_tx.length) {
                    this.show_test_tx = true;
                }

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

    loadFormtxCauhoiType1() {
        const condition_lesson: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse().id.toString(), orWhere: 'and' },
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
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse().id.toString(), orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' }
            ],
            page: null
        }

        const condition_question: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse().id.toString(), orWhere: 'and' },
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
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse().id.toString(), orWhere: 'and' },
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

                    if (this.selectedCourse().params) {

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

                if (this.list_test_tx && this.list_test_tx.length) {
                    this.show_test_tx = true;
                }

                this.notificationService.isProcessing(false);
            },
            error: () => {

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


    loadFormtxCauhoiType2() {
        const condition_lesson: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse().id.toString(), orWhere: 'and' },
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
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse().id.toString(), orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' }
            ],
            page: null
        }

        const condition_plan_bank: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse().id.toString(), orWhere: 'and' },
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
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse().id.toString(), orWhere: 'and' },
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
                    if (this.selectedCourse().params) {

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

                this.list_test_tx = this.helperService.sort(test_tx, 'ordering');

                if (this.list_test_tx && this.list_test_tx.length) {
                    this.show_test_tx = true;
                }

                this.notificationService.isProcessing(false);

            },
            error: () => {

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

    changeStatusForm(event) {
        this.onChangeStatus.emit(event);
    }
}
