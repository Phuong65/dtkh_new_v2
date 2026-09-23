import { CoursePlanActivityTuluanService } from '@modules/shared/services/course-plan-activity-tuluan.service';
import { CoursePlanActivityTuluan } from '@modules/shared/models/course-plan-activity-tuluan';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OvicQueryCondition } from '@core/models/dto';
import { NotificationService } from '@core/services/notification.service';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { CHUAN_DAU_RA } from '@modules/shared/utils/syscat';
import { TableModule } from 'primeng/table';
import { SharedModule } from '@modules/shared/shared.module';
import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';
import { CoursePlanActivities } from '@modules/shared/models/course-plan-activities';
import { CourseFormTuluan15pService } from '@modules/shared/services/course-form-tuluan-15p.service';
import { CourseFormTuluan15p } from '@modules/shared/models/course-form-tuluan-15p';
import { forkJoin, mergeMap, map } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';

/** 1 dòng CDR trong bảng */
interface CdrRow {
    lessonWeek: number;
    coursePlanActivityId: number;
    cdrId: number;
    savedId?: number;
    stt: number | string;
    cdr_label: string;
    point: number | null;
    questionTake: number | null;
}

@Component({
    selector: 'app-form-de-tuluan-15p',
    standalone: true,
    imports: [
        CommonModule,
        SharedModule,
        TableModule,
        FormsModule,
        ButtonModule
    ],
    templateUrl: './form-de-tuluan-15p.component.html',
    styleUrls: ['./form-de-tuluan-15p.component.css']
})
export class FormDeTuluan15pComponent implements OnInit, OnDestroy {

    @Input() _course: ElnKhoaHoc;

    @Output() save = new EventEmitter<void>();

    selectedCourse: ElnKhoaHoc;

    chuandaura = CHUAN_DAU_RA;

    /** Dữ liệu bảng — mỗi CDR là 1 dòng, đã phẳng */
    cdrRows: CdrRow[] = [];

    get grandTotalTake(): number {
        return this.cdrRows.reduce((sum, r) => sum + (r.questionTake || 0), 0);
    }

    get grandTotalScore(): number {
        return this.cdrRows.reduce((sum, r) => sum + ((r.questionTake || 0) * (r.point || 0)), 0);
    }

    /** Tổng hợp theo bài cho group header */
    getLessonTotals(week: number): { totalScore: number; totalTake: number } {
        const rows = this.cdrRows.filter(r => r.lessonWeek === week);
        return {
            totalScore: rows.reduce((s, r) => s + ((r.questionTake || 0) * (r.point || 0)), 0),
            totalTake: rows.reduce((s, r) => s + (r.questionTake || 0), 0),
        };
    }

    /** Clamp điểm: không âm, null nếu rỗng */
    onPointChange(value: number | string | null, row: CdrRow) {
        const num = Number(value);
        if (isNaN(num)) { row.point = null; return; }
        row.point = Math.max(0, num);
    }

    isTakeError(row: CdrRow): boolean {
        return row.questionTake != null
            && (!Number.isInteger(Number(row.questionTake)) || Number(row.questionTake) <= 0);
    }

    /** Kiểm tra tổng điểm 1 bài > 10 */
    isLessonScoreError(week: number): boolean {
        return this.getLessonTotals(week).totalScore > 10;
    }

    /** Kiểm tra toàn bộ bảng có lỗi không */
    private hasErrors(): boolean {
        for (const row of this.cdrRows) {
            if (row.questionTake != null && (!Number.isInteger(Number(row.questionTake)) || Number(row.questionTake) <= 0)) return true;
            if (row.stt !== null && this.isLessonScoreError(row.lessonWeek)) return true;
        }
        return false;
    }

    /** Clamp số câu lấy: không âm */
    onTakeChange(value: number | string | null, row: CdrRow) {
        const num = Number(value);
        if (isNaN(num)) { row.questionTake = null; return; }
        if (num < 0) { row.questionTake = 0; return; }
        row.questionTake = num;
    }

    constructor(
        private notificationService: NotificationService,
        private coursePlanActivityTuluanService: CoursePlanActivityTuluanService,
        private coursePlanActivitiesService: CoursePlanActivitiesService,
        private courseFormTuluan15pService: CourseFormTuluan15pService,
    ) {

    }

    ngOnDestroy(): void {

    }

    ngOnInit(): void {
        this.selectedCourse = this._course;
        this.loadAllData();
    }

    /** Tải bài học + saved data song song → tuluans theo lesson → build rows */
    loadAllData() {
        this.notificationService.isProcessing(true);
        const conditionLesson: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this._course.id.toString(), orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.greaterThan, value: '0', orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.lessThan, value: '100', orWhere: 'and' },
                { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: '0', orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'week' },
            ],
            page: null
        };
        const conditionSaved: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this._course.id.toString(), orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
            ],
            page: null
        };
        forkJoin({
            lessonsResult: this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(conditionLesson),
            savedResult: this.courseFormTuluan15pService.getByPage(conditionSaved),
        }).pipe(
            mergeMap(({ lessonsResult, savedResult }) => {
                const lessons = lessonsResult.data || [];
                const savedData = savedResult?.data || [];
                if (!lessons.length) return [];

                const ids = lessons.map(l => l.id).filter(id => id != null);
                const conditionTuluan: ConditionOption = {
                    condition: [],
                    set: [
                        { label: 'include', value: ids.join(',') },
                        { label: 'include_by', value: 'course_plan_activity_id' },
                        { label: 'limit', value: '-1' },
                    ],
                    page: null
                };
                return this.coursePlanActivityTuluanService.getCoursePlanActivityTuluanByPageNew(conditionTuluan).pipe(
                    map(resTuluan => ({ lessons, questions: resTuluan?.data || [], savedData }))
                );
            })
        ).subscribe({
            next: ({ lessons, questions, savedData }) => {
                this.cdrRows = this.buildRows(lessons, questions, savedData);
                this.notificationService.isProcessing(false);
            },
            error: () => {
                this.notificationService.isProcessing(false);
            }
        });
    }

    /** Flatten lessons + questions thành CdrRow[], merge saved data */
    private buildRows(lessons: CoursePlanActivities[], allQuestions: CoursePlanActivityTuluan[], savedData: CourseFormTuluan15p[]): CdrRow[] {
        const rows: CdrRow[] = [];
        lessons.forEach(lesson => {
            const questions = allQuestions.filter(q => q.course_plan_activity_id === lesson.id);
            const summaries = this.buildCdrSummary(questions);
            if (summaries.length) {
                summaries.forEach((s, i) => {
                    const saved = savedData.find(d => d.course_plan_activity_id === lesson.id && d.cdr === s.cdr_id);
                    rows.push({
                        lessonWeek: lesson.week,
                        coursePlanActivityId: lesson.id,
                        cdrId: s.cdr_id,
                        savedId: saved?.id,
                        stt: i + 1,
                        cdr_label: s.cdr_label,
                        point: saved?.point ?? null,
                        questionTake: saved?.question_take ?? null,
                    });
                });
            } else {
                rows.push({
                    lessonWeek: lesson.week,
                    coursePlanActivityId: lesson.id,
                    cdrId: 0,
                    stt: null,
                    cdr_label: null,
                    point: null,
                    questionTake: null,
                });
            }
        });
        return rows;
    }

    /** Lưu dữ liệu điểm và số câu lấy — xoá hết cũ → insert lại */
    onSave() {
        if (this.hasErrors()) {
            this.notificationService.toastWarning('Dữ liệu có lỗi (điểm > 10 hoặc số câu lấy không hợp lệ), vui lòng kiểm tra lại');
            return;
        }
        const rowsToSave = this.cdrRows.filter(r => r.stt !== null && (r.point != null && r.point > 0) && (r.questionTake != null && r.questionTake > 0));
        if (!rowsToSave.length) {
            this.notificationService.toastWarning('Không có dữ liệu để lưu');
            return;
        }
        this.notificationService.isProcessing(true);

        // Xoá dữ liệu cũ → insert lại tất cả
        this.courseFormTuluan15pService.deleteByCol(this._course.id.toString(), 'course_id').pipe(
            mergeMap(() => {
                const obs = rowsToSave.map(row => {
                    const data: CourseFormTuluan15p = {
                        course_id: this._course.id,
                        week: row.lessonWeek,
                        cdr: row.cdrId,
                        ordering: row.stt as number,
                        question_take: row.questionTake ?? 0,
                        point: row.point ?? 0,
                        course_plan_activity_id: row.coursePlanActivityId,
                    };
                    return this.courseFormTuluan15pService.add(data);
                });
                return forkJoin(obs);
            })
        ).subscribe({
            next: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastSuccess('Lưu thành công');
                // Refresh savedId sau khi insert lại
                this.loadAllData();
                this.save.emit();
            },
            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError('Lỗi khi lưu dữ liệu');
            }
        });
    }

    /** Nhóm câu hỏi theo CDR */
    private buildCdrSummary(questions: CoursePlanActivityTuluan[]): { cdr_id: number; cdr_label: string }[] {
        const cdrIds = new Set<number>();
        questions.forEach(question => {
            if (question.cdr != null) {
                cdrIds.add(Number(question.cdr));
            }
        });
        const result = Array.from(cdrIds).map(cdr_id => ({
            cdr_id,
            cdr_label: this.chuandaura.find(c => c.id === cdr_id)?.label || `CDR ${cdr_id}`
        }));
        result.sort((a, b) => a.cdr_id - b.cdr_id);
        return result;
    }
}
