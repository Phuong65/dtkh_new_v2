import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { OvicQueryCondition } from '@core/models/dto';
import { forkJoin, mergeMap, of } from 'rxjs';
import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';
import { CoursePlanActivities } from '@modules/shared/models/course-plan-activities';
import { CourseQuestionsService } from '@modules/shared/services/course-questions.service';
import { APP_CONFIGS } from '@env';
import { SharedModule } from '@modules/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';

export interface PlanKiemDuyet extends CoursePlanActivities {
    status_muctieu?: number;
    status_tailieu?: number;
    total_question?: number;
    duyet_question?: number;
    total_cdr?: number;
    duyet_cdr?: number;
}

@Component({
    standalone: true,
    imports: [CommonModule, SharedModule, FormsModule, ReactiveFormsModule, TableModule],
    selector: 'app-ketqua-duyet-all',
    templateUrl: './ketqua-duyet-all.component.html',
    styleUrls: ['./ketqua-duyet-all.component.css']
})
export class KetquaDuyetAllComponent implements OnInit, OnChanges {
    @Input() courseSelected: ElnKhoaHoc;

    selectedCourse: ElnKhoaHoc;

    list_plan_activite: PlanKiemDuyet[];

    label_week: string = 'Bài';

    constructor(
        private coursePlanActivitiesService: CoursePlanActivitiesService,
        private courseQuestionsService: CourseQuestionsService
    ) {
        const config = JSON.parse(localStorage.getItem('--app_configs-' + APP_CONFIGS.realm));

        const setting = config.find(m => m.config_key === 'SETTING')['params'];

        this.label_week = setting['plan']['prefix'];
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['courseSelected']) {
            this.selectedCourse = this.courseSelected;
            this.initLoad();
        }
    }

    ngOnInit(): void {

    }

    initLoad() {
        const condition_plan: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse.id.toString(), orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.lessThan, value: '100', orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.greaterThan, value: '0', orWhere: 'and' },
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'ordering' }
            ],
            page: null
        }

        const condition_question: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse.id.toString(), orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.lessThan, value: '100', orWhere: 'and' },
                { conditionName: 'reference', condition: OvicQueryCondition.equal, value: 'course_plan_activities', orWhere: 'and' },
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
                { conditionName: 'group_id', condition: OvicQueryCondition.equal, value: '0', orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'status,id,cdr,reference_id,status_captruong,week' }
            ],
            page: null
        }

        forkJoin([
            this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_plan),
            this.courseQuestionsService.getCourseQuestionsByPageNew(condition_question).pipe(mergeMap(a => {
                if (this.selectedCourse.av === 1) {
                    const ids = a.data.map(m => m.id);
                    const condition_child_question: ConditionOption = {
                        condition: [
                            { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse.id.toString(), orWhere: 'and' },
                            { conditionName: 'week', condition: OvicQueryCondition.lessThan, value: '100', orWhere: 'and' },
                            { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
                        ],
                        set: [
                            { label: 'limit', value: '-1' },
                            { label: 'select', value: 'status,id,cdr,reference_id,status_captruong,week,group_id' },
                            { label: 'include', value: ids.toString() },
                            { label: 'include_by', value: 'group_id' }
                        ],
                        page: null
                    }

                    return this.courseQuestionsService.getCourseQuestionsByPageNew(condition_child_question).pipe(mergeMap(_child_question => {
                        a.data.forEach(f => {
                            const child_question = _child_question.data.filter(m => m.group_id === f.id);
                            child_question.forEach(c => {
                                c.status = f.status;
                            })
                        })
                        return of(_child_question);
                    }))
                }
                return of(a);
            })),
        ]).subscribe({
            next: ([_plan_activity, _course_question]) => {
                const parent_plan = _plan_activity.data.filter(m => m.parent_id === 0);
                parent_plan.forEach(f => {
                    const children_plan = _plan_activity.data.filter(m => m.parent_id === f.id);
                    f['status_muctieu'] = children_plan.find(m => m.type === 'MUCTIEU') ? children_plan.find(m => m.type === 'MUCTIEU').status_captruong : null;
                    f['status_tailieu'] = children_plan.find(m => m.type === 'ACTIVITY') ? children_plan.find(m => m.type === 'ACTIVITY').status_captruong : null;
                    f['total_question'] = _course_question.data.filter(m => m['week'] === f.week).length;
                    f['duyet_question'] = _course_question.data.filter(m => m['week'] === f.week && m.status_captruong === 1).length;
                    f['total_cdr'] = children_plan.filter(m => m.type === 'ACTIVITY_CDR').length;
                    f['duyet_cdr'] = children_plan.filter(m => m.type === 'ACTIVITY_CDR' && m.status_captruong === 1).length;
                })

                this.list_plan_activite = parent_plan;
            },
            error: () => {

            }
        })
    }
}
