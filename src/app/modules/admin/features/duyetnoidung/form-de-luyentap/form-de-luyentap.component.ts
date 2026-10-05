import { CourseFormCcService } from '@shared/services/course-form-cc.service';
import { CourseFormDuyetService } from './../../../../shared/services/course-form-duyet.service';
import { CourseFormCommentService } from './../../../../shared/services/course-form-comment.service';
import { HelperService } from '@core/services/helper.service';
import { CoursePlanActivitiesService } from '@shared/services/course-plan-activities.service';
import { NotificationService } from '@core/services/notification.service';
import { Component, OnInit, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { HoidongThamdinhMonhocThanhvien } from '@modules/shared/models/hoidong-thamdinh-monhoc-thanhvien';
import { SharedModule } from '@modules/shared/shared.module';
import { AuthService } from '@core/services/auth.service';
import { TableModule } from 'primeng/table';
import { OvicQueryCondition } from '@core/models/dto';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { CoursePlanBankService } from '@modules/shared/services/course-plan-bank.service';
import { CourseQuestionsService } from '@modules/shared/services/course-questions.service';
import { forkJoin } from 'rxjs';
import { PlanActivityCdr } from '../../quanly-kehoach-hoctap/phanbo-cdr-cauhoi/phanbo-cdr-cauhoi.component';
import { CHUAN_DAU_RA } from '@modules/shared/utils/syscat';
import { ReactiveFormsModule } from '@angular/forms';
import { DuyetFormDeComponent } from "../duyet-form-de/duyet-form-de.component";

@Component({
    selector: 'app-form-de-luyentap',
    standalone: true,
    imports: [
        CommonModule,
        SharedModule,
        TableModule,
        ReactiveFormsModule,
        DuyetFormDeComponent
    ],
    templateUrl: './form-de-luyentap.component.html',
    styleUrls: ['./form-de-luyentap.component.css']
})
export class FormDeLuyentapComponent implements OnInit {
    private auth = inject(AuthService);
    private notificationService = inject(NotificationService);
    private coursePlanActivitiesService = inject(CoursePlanActivitiesService);
    private helperService = inject(HelperService);
    private courseFormCommentService = inject(CourseFormCommentService);
    private courseFormDuyetService = inject(CourseFormDuyetService);
    private courseFormCcService = inject(CourseFormCcService);
    private coursePlanBankService = inject(CoursePlanBankService);
    private courseQuestionsService = inject(CourseQuestionsService);


    readonly selectedCourse = input<ElnKhoaHoc>(undefined);

    readonly listThamDInh = input<HoidongThamdinhMonhocThanhvien[]>(undefined);

    readonly formType = input<'TN_KTHP' | 'TH_KTHP' | 'DG' | 'TNTX' | 'CC'>(undefined);

    readonly onChangeStatus = output<any>();

    isManager: boolean = false;

    list_cdr_cauhoi: PlanActivityCdr[];

    list_part: string[];

    chuandaura = CHUAN_DAU_RA;

    label_week: string = "Bài";

    ngOnInit(): void {
        this.loadFormCcCauhoi();
    }


    loadFormCcCauhoi() {
        switch (this.selectedCourse().av) {
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

    loadFormCcCauhoiType0() {
        const condition_lesson: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse().id.toString(), orWhere: 'and' },
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
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse().id.toString(), orWhere: 'and' },
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

    loadFormCcCauhoiType1() {
        const condition_lesson: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse().id.toString(), orWhere: 'and' },
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
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse().id.toString(), orWhere: 'and' },
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

    changeStatusForm(event) {
        this.onChangeStatus.emit(event);
    }
}
