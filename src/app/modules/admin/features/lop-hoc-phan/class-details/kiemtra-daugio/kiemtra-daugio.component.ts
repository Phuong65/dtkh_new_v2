import { NotificationService } from '@core/services/notification.service';
import { ClassPlanActivityStudentTestsService } from '@shared/services/class-plan-activity-student-tests.service';
import { CoursePlanActivitiesService } from '@shared/services/course-plan-activities.service';
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Classes } from '@modules/shared/models/classes';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { OvicQueryCondition } from '@core/models/dto';
import { CoursePlanActivities } from '@modules/shared/models/course-plan-activities';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SharedModule } from '@modules/shared/shared.module';
import { forkJoin, mergeMap, of } from 'rxjs';
import { CoursePlanBankService } from '@modules/shared/services/course-plan-bank.service';
import { key_server } from '@env';

@Component({
    selector: 'app-kiemtra-daugio',
    templateUrl: './kiemtra-daugio.component.html',
    styleUrls: ['./kiemtra-daugio.component.css'],
    standalone: true,
    imports: [CommonModule, RouterModule, SharedModule]
})
export class KiemtraDaugioComponent implements OnInit, OnChanges {

    @Input() classSelected: Classes;

    list_course_plan: CoursePlanActivities[];

    key_server = key_server;

    constructor(
        private coursePlanActivitiesService: CoursePlanActivitiesService,
        private classPlanActivityStudentTestsService: ClassPlanActivityStudentTestsService,
        private notificationService: NotificationService,
        private coursePlanBankService: CoursePlanBankService
    ) {

    }


    ngOnInit(): void {

    }

    ngOnChanges(_changes: SimpleChanges): void {
        this.initData();
    }

    onClickTracnghiem(plan: CoursePlanActivities): void {
        if (!plan['has_test']) {
            this.notificationService.toastWarning('Chưa có ngân hàng đề cho tuần này, vui lòng liên hệ giảng viên phụ trách môn học');
        }
    }

    initData() {
        const condition_plan: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.classSelected.course_id.toString() },
                { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: '0', orWhere: 'and' },
                { conditionName: 'ordering', condition: OvicQueryCondition.greaterThan, value: '0', orWhere: 'and' },
                { conditionName: 'ordering', condition: OvicQueryCondition.lessThan, value: '100', orWhere: 'and' }
            ],

            set: [
                { label: 'limit', value: '-1' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'ordering' },
                { label: 'select', value: 'title,id,week,ordering' }
            ],

            page: null
        }

        const condition_plan_bank: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.classSelected.course_id.toString(), orWhere: 'and' },
                { conditionName: 'bank_type', condition: OvicQueryCondition.equal, value: 'DG', orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'week,id' },
                { label: 'groupby', value: 'week' }
            ],
            page: null
        }

        this.notificationService.isProcessing(true);

        forkJoin([
            this.coursePlanBankService.getCoursePlanBankByPageNew(condition_plan_bank),
            this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_plan).pipe(mergeMap(_course_plan => {
                const weeks = _course_plan.data.map(m => m.week);
                if (weeks.length) {
                    const condition_test: ConditionOption = {
                        condition: [
                            { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.classSelected.id.toString(), orWhere: 'and' },
                            { conditionName: 'type', condition: OvicQueryCondition.equal, value: 'KT_DAUGIO', orWhere: 'and' },
                            { conditionName: 'status', condition: OvicQueryCondition.greaterThan, value: '-1', orWhere: 'and' },
                        ],
                        set: [
                            { label: 'limit', value: '-1' },
                            { label: 'include', value: weeks.toString() },
                            { label: 'include_by', value: 'week' },
                            { label: 'select', value: 'week,questions_tuluan' }
                        ],
                        page: null
                    }

                    return this.classPlanActivityStudentTestsService.getClassPlanActivityStudentTestsByPageNew(condition_test).pipe(mergeMap(_test => {
                        _course_plan.data.forEach(f => {
                            f['test_already'] = _test.data.some(m => m.week === f.week && this.hasQuestionsTuluan(m.questions_tuluan));
                        })
                        return of(_course_plan);
                    }))
                }
                return of(_course_plan);
            }))
        ]).subscribe({
            next: ([_plan_bank, _course_plan]) => {
                _course_plan.data.forEach(f => {
                    const index = _plan_bank.data.findIndex(m => m.week === f.week);
                    if (index !== -1) {
                        f['has_test'] = true;
                    }
                })
                _course_plan.data.splice(_course_plan.data.length - 1, 1)
                this.list_course_plan = _course_plan.data;
                this.notificationService.isProcessing(false);
            },
            error: () => {
                this.notificationService.isProcessing(false);
            }
        })
    }

    hasQuestionsTuluan(questionsTuluan?: string[]): boolean {
        return Array.isArray(questionsTuluan) && questionsTuluan.some(q => Number.isFinite(Number(q)) && Number(q) > 0);
    }

}
