import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, Router } from '@angular/router';
import { OvicQueryCondition } from '@core/models/dto';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { KatexImgDirective } from '@modules/shared/directives/katex-img.directive';
import { ClassPlanActivityStudentAnswers } from '@modules/shared/models/class-plan-activity-student-answers';
import { ClassPlanActivityStudentTests } from '@modules/shared/models/class-plan-activity-student-tests';
import { Classes } from '@modules/shared/models/classes';
import { ClassStudent } from '@modules/shared/models/class-student';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { CourseQuestions } from '@modules/shared/models/course-questions';
import { CoursePlanActivityTuluan } from '@modules/shared/models/course-plan-activity-tuluan';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { ClassPlanActivityStudentAnswersService } from '@modules/shared/services/class-plan-activity-student-answers.service';
import { ClassPlanActivityStudentTestsService } from '@modules/shared/services/class-plan-activity-student-tests.service';
import { ClassesService } from '@modules/shared/services/classes.service';
import { ApiAiService } from '@modules/shared/services/api-ai.service';
import { ClassStudentService } from '@modules/shared/services/class-student.service';
import { CourseQuestionsService } from '@modules/shared/services/course-questions.service';
import { CoursePlanActivityTuluanService } from '@modules/shared/services/course-plan-activity-tuluan.service';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { SharedModule } from '@modules/shared/shared.module';
import { LARGE_MODAL_OPTIONS, ROLES } from '@modules/shared/utils/syscat';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { PaginatorModule } from 'primeng/paginator';
import {
    catchError,
    distinctUntilChanged,
    finalize,
    forkJoin,
    map,
    Observable,
    of,
    Subject,
    Subscription,
    switchMap,
    takeUntil
} from 'rxjs';
import {
    EssayBulkGradingEvent,
    EssayBulkGradingProgress,
    EssayBulkGradingService
} from '../essay-ai-grading/essay-bulk-grading.service';
import { ViewTracnghiemTuluanComponent } from '../view-tracnghiem-tuluan/view-tracnghiem-tuluan.component';
import {
    buildEssayAiGradingPrompt,
    containsEssayAiImageReference,
    createEssayTestGradePayload,
    getValidEssayAiMaxScore,
    mapEssayAiGradingResult,
    normalizeEssayAiPromptContent,
    parseEssayAiGradingResponse
} from '../essay-ai-grading/essay-ai-grading.utils';

type GradeFilter = 'all' | 'ungraded' | 'graded' | 'not-submitted' | 'no-essay';

interface GradeFilterOption {
    label: string;
    value: GradeFilter;
}

interface GradeFilterCounts {
    all: number;
    ungraded: number;
    graded: number;
    notSubmitted: number;
    noEssay: number;
}

type StudentTest = ClassPlanActivityStudentTests & {
    submit_by?: number;
    trudiem?: number | string;
};
type ListLoadMode = 'default' | 'preserve' | 'auto-next';
type MobilePane = 'list' | 'detail';

type GradingStudent = ClassStudent & {
    index_: number;
    full_name: string;
    student_code: string;
    student_test?: StudentTest;
};

interface StudentListRequest {
    id: number;
    pageIndex: number;
    pageSize: number;
    searchValue: string;
    preferredStudentId?: number;
    mode: ListLoadMode;
}

interface DetailRequest {
    id: number;
    student: GradingStudent;
    testId: number;
    force: boolean;
}

interface PendingNavigation {
    action: () => void;
    cancel?: () => void;
    focusTarget: HTMLElement | null;
}

interface EssayQuestionGradingState {
    questionId: number;
    answerId: number | null;
    currentPoint: number | null;
    aiSuggestedPoint: number | null;
    editablePoint: number | null;
    maxPoint: number | null;
    currentFeedback: string;
    feedback: string;
    status: 'idle' | 'grading' | 'graded' | 'saving' | 'saved' | 'error';
    error: string;
    aiUnavailableReason: string;
    pointValidationError: string;
    hasUnsavedChanges: boolean;
    canSave: boolean;
}

interface EssayAiPromptItem {
    key: string;
    questionId: number;
    answerId: number;
    question: CoursePlanActivityTuluan;
    answer: ClassPlanActivityStudentAnswers;
}

interface EssaySaveResult {
    testId: number;
    success: boolean;
    answerSaveFailed: boolean;
    aggregateFailed: boolean;
}

@Component({
    selector: 'app-cham-diem-kiemtra-daugio',
    templateUrl: './cham-diem-kiemtra-daugio.component.html',
    styleUrls: ['./cham-diem-kiemtra-daugio.component.css'],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        SharedModule,
        PaginatorModule,
        DialogModule,
        DropdownModule,
        KatexImgDirective,
        ViewTracnghiemTuluanComponent
    ]
})
export class ChamDiemKiemtraDaugioComponent implements OnInit, OnDestroy {
    @ViewChild('studentList') studentList: ElementRef<HTMLElement>;
    @ViewChild('essayHeading') essayHeading: ElementRef<HTMLElement>;
    @ViewChild('viewStudentTest') viewStudentTest: TemplateRef<unknown>;

    classSelected: Classes;
    courseSelected: ElnKhoaHoc;
    currentWeek: number;
    students: GradingStudent[] = [];
    selectedStudent: GradingStudent | null = null;
    essayQuestions: CoursePlanActivityTuluan[] = [];
    studentAnswers: ClassPlanActivityStudentAnswers[] = [];
    studentAnswerMap: { [questionId: number]: ClassPlanActivityStudentAnswers } = {};
    essayQuestionStateMap: { [questionId: number]: EssayQuestionGradingState } = {};
    essayQuestionGuidanceVisible: { [questionId: number]: boolean } = {};
    activeEssayQuestionId: number | null = null;
    isGradingSelectedEssayWithAi: boolean = false;
    isSavingEssay: boolean = false;
    needsAggregateRetry: boolean = false;
    essayAiMessage: string = '';
    essaySaveMessage: string = '';
    isLoadingStudentTest: boolean = false;
    studentTestReviewStudent: GradingStudent | null = null;
    studentTestReviewQuestions: CourseQuestions[] = [];
    studentTestReviewAnswers: ClassPlanActivityStudentAnswers[] = [];

    pageIndex: number = 1;
    pageSize: number = 50;
    totalStudents: number = 0;
    gradeFilterCounts: GradeFilterCounts = {
        all: 0,
        ungraded: 0,
        graded: 0,
        notSubmitted: 0,
        noEssay: 0
    };
    searchValue: string = '';
    gradeFilter: GradeFilter = 'all';
    focusedStudentId: number | null = null;
    mobilePane: MobilePane = 'list';
    rosterCollapsed: boolean = false;

    isLoadingList: boolean = false;
    isLoadingDetail: boolean = false;
    listError: string = '';
    detailError: string = '';
    isBulkAiGrading: boolean = false;
    bulkFailedTestIds: number[] = [];
    bulkFailedReasons: Record<number, string> = {};
    liveMessage: string = '';
    bulkProgress: EssayBulkGradingProgress = {
        phase: 'loading',
        message: '',
        percent: 0,
        summary: ''
    };

    private readonly userId: number;
    private readonly isManager: boolean;
    private readonly destroy$ = new Subject<void>();
    private readonly listRequest$ = new Subject<StudentListRequest>();
    private readonly detailRequest$ = new Subject<DetailRequest>();
    private bulkSubscription: Subscription | null = null;
    private appliedSearchValue: string = '';
    private listRequestId: number = 0;
    private detailRequestId: number = 0;
    private activeListRequestId: number = 0;
    private activeDetailRequestId: number = 0;
    private essayAiRunId: number = 0;
    private essayAiSubscription: Subscription | null = null;
    private essaySaveSubscription: Subscription | null = null;
    private studentTestReviewSubscription: Subscription | null = null;
    private pendingNavigation: PendingNavigation | null = null;
    private pendingDiscard: PendingNavigation | null = null;
    private focusEssayAfterLoad: boolean = false;

    constructor(
        private activatedRoute: ActivatedRoute,
        private router: Router,
        private auth: AuthService,
        private notificationService: NotificationService,
        private modalService: NgbModal,
        private classesService: ClassesService,
        private classStudentService: ClassStudentService,
        private studentTestsService: ClassPlanActivityStudentTestsService,
        private studentAnswersService: ClassPlanActivityStudentAnswersService,
        private essayQuestionsService: CoursePlanActivityTuluanService,
        private apiAiService: ApiAiService,
        private courseService: ElnKhoaHocService,
        private courseQuestionsService: CourseQuestionsService,
        private bulkGradingService: EssayBulkGradingService
    ) {
        this.userId = this.auth.user.id;
        this.isManager = this.auth.userHasRole(ROLES.manager)
            || this.auth.userHasRole(ROLES.chuyenvien_pdt)
            || this.auth.userHasRole(ROLES.troly_pdt);
    }

    ngOnInit(): void {
        this.notificationService.setCloseLeftMenu(true);
        this.bindListLoader();
        this.bindDetailLoader();
        this.activatedRoute.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
            const classId = Number(params['code']);
            const week = Number(params['test']);
            if (!Number.isFinite(classId) || classId <= 0 || !Number.isFinite(week) || week <= 0) {
                this.rejectAccess();
                return;
            }
            this.currentWeek = week;
            this.loadClass(classId);
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.bulkSubscription?.unsubscribe();
        this.studentTestReviewSubscription?.unsubscribe();
        this.cancelEssayRequests();
        this.pendingNavigation?.cancel?.();
        this.pendingDiscard?.cancel?.();
    }

    @HostListener('window:beforeunload', ['$event'])
    preventUnsavedExit(event: BeforeUnloadEvent): void {
        if (this.hasUnsavedChanges) {
            event.preventDefault();
            event.returnValue = '';
        }
    }

    @HostListener('document:keydown', ['$event'])
    saveWithShortcut(event: KeyboardEvent): void {
        if (event.key !== 'Enter' || !event.ctrlKey) {
            return;
        }
        if (!this.canSaveEssay) {
            return;
        }
        event.preventDefault();
        this.saveSelectedEssay();
    }

    get hasUnsavedChanges(): boolean {
        return this.needsAggregateRetry
            || Object.values(this.essayQuestionStateMap).some(state => state.hasUnsavedChanges);
    }

    get isEssayBusy(): boolean {
        return this.isGradingSelectedEssayWithAi || this.isSavingEssay;
    }

    get canSaveEssay(): boolean {
        return !this.isBulkAiGrading
            && !this.isEssayBusy
            && this.getEssayTestGradePayload() !== null;
    }

    get canGradeEssayWithAi(): boolean {
        return !this.isBulkAiGrading
            && !this.isEssayBusy
            && !this.hasUnsavedChanges
            && Object.values(this.essayQuestionStateMap).some(state => !state.aiUnavailableReason);
    }

    get activeEssayQuestion(): CoursePlanActivityTuluan | null {
        return this.essayQuestions.find(question => Number(question.id) === this.activeEssayQuestionId) || null;
    }

    get activeEssayState(): EssayQuestionGradingState | null {
        return this.activeEssayQuestionId === null
            ? null
            : this.essayQuestionStateMap[this.activeEssayQuestionId] || null;
    }

    get activeEssayAnswer(): ClassPlanActivityStudentAnswers | null {
        return this.activeEssayQuestionId === null
            ? null
            : this.studentAnswerMap[this.activeEssayQuestionId] || null;
    }

    get filteredStudents(): GradingStudent[] {
        return this.students.filter(student => this.matchesFilter(student));
    }

    get gradeFilterOptions(): GradeFilterOption[] {
        return [
            { label: `Tất cả (${this.gradeFilterCounts.all})`, value: 'all' },
            { label: `Chưa chấm (${this.gradeFilterCounts.ungraded})`, value: 'ungraded' },
            { label: `Đã chấm (${this.gradeFilterCounts.graded})`, value: 'graded' },
            { label: `Chưa nộp (${this.gradeFilterCounts.notSubmitted})`, value: 'not-submitted' },
            { label: `Không tự luận (${this.gradeFilterCounts.noEssay})`, value: 'no-essay' }
        ];
    }

    get submittedCount(): number {
        return this.gradeFilterCounts.all - this.gradeFilterCounts.notSubmitted;
    }

    get gradedCount(): number {
        return this.gradeFilterCounts.graded;
    }

    get ungradedCount(): number {
        return this.gradeFilterCounts.ungraded;
    }

    get currentIndex(): number {
        return this.filteredStudents.findIndex(student => student.student_id === this.selectedStudent?.student_id);
    }

    get canSelectPrevious(): boolean {
        return this.canNavigate && this.currentIndex > 0;
    }

    get canSelectNext(): boolean {
        return this.canNavigate && this.currentIndex >= 0 && this.currentIndex < this.filteredStudents.length - 1;
    }

    get canNavigate(): boolean {
        return !this.isLoadingList
            && !this.isLoadingDetail
            && !this.isBulkAiGrading
            && !this.isEssayBusy;
    }

    get canStartBulkAi(): boolean {
        return this.canNavigate && !!this.classSelected?.id && !!this.currentWeek;
    }

    requestDeactivate(): Promise<boolean> | boolean {
        if (!this.hasUnsavedChanges) {
            return true;
        }
        if (this.isEssayBusy || this.isLoadingDetail || this.isBulkAiGrading) {
            return false;
        }
        return new Promise<boolean>(resolve => {
            this.confirmDirtyNavigation(
                () => resolve(true),
                () => resolve(false),
                true
            );
        });
    }

    selectStudent(student: GradingStudent): void {
        if (student.student_id === this.selectedStudent?.student_id) {
            this.showDetailPane(true);
            return;
        }
        this.gateNavigation(() => this.activateStudent(student, true, true));
    }

    selectRelative(offset: -1 | 1): void {
        const target = this.filteredStudents[this.currentIndex + offset];
        if (target) {
            this.selectStudent(target);
        }
    }

    changePage(event: { page: number, rows: number }): void {
        this.gateNavigation(() => {
            this.pageIndex = event.page + 1;
            this.pageSize = event.rows;
            this.requestStudentList('default');
        });
    }

    applySearch(): void {
        this.gateNavigation(() => {
            this.appliedSearchValue = this.searchValue.trim();
            this.gradeFilter = 'all';
            this.pageIndex = 1;
            this.requestStudentList('default');
        });
    }

    clearSearch(): void {
        this.gateNavigation(() => {
            this.searchValue = '';
            this.appliedSearchValue = '';
            this.gradeFilter = 'all';
            this.pageIndex = 1;
            this.requestStudentList('default');
        });
    }

    setFilter(filterValue: GradeFilter): void {
        if (filterValue === this.gradeFilter) {
            return;
        }
        this.gateNavigation(() => {
            this.gradeFilter = filterValue;
            const visibleSelection = this.filteredStudents.find(
                student => student.student_id === this.selectedStudent?.student_id
            );
            const target = visibleSelection
                || this.filteredStudents.find(student => this.isGradeable(student))
                || this.filteredStudents[0];
            this.focusedStudentId = target?.student_id || null;
            if (!visibleSelection && target) {
                this.activateStudent(target, false, false);
            } else if (!target) {
                this.clearSelection();
            }
            this.announceListCount();
        });
    }

    retryList(): void {
        this.gateNavigation(() => this.requestStudentList('preserve', this.selectedStudent?.student_id));
    }

    retryDetail(): void {
        if (this.selectedStudent) {
            this.gateNavigation(() => this.requestDetail(this.selectedStudent as GradingStudent, true));
        }
    }

    gradeAllWithAi(testIds: number[] = []): void {
        if (!this.canNavigate) {
            return;
        }
        if (this.hasUnsavedChanges) {
            this.gateNavigation(() => this.startBulkAi(testIds));
            return;
        }
        this.startBulkAi(testIds);
    }

    retryFailedBulk(): void {
        if (this.bulkFailedTestIds.length) {
            this.gradeAllWithAi([...this.bulkFailedTestIds]);
        }
    }

    bulkFailedReasonSummary(): string {
        const reasons = Object.values(this.bulkFailedReasons);
        if (!reasons.length) {
            return '';
        }
        const grouped = reasons.reduce((groups, reason) => {
            groups.set(reason, (groups.get(reason) || 0) + 1);
            return groups;
        }, new Map<string, number>());
        return [...grouped.entries()]
            .map(([reason, count]) => `${count} bài: ${reason}`)
            .join('; ');
    }

    gradeSelectedWithAi(): void {
        if (this.isEssayBusy || this.isBulkAiGrading) {
            return;
        }
        if (!this.canGradeEssayWithAi) {
            return;
        }

        const promptItems: EssayAiPromptItem[] = this.essayQuestions
            .filter(question => {
                const state = this.essayQuestionStateMap[Number(question.id)];
                return !!state?.answerId && !state.aiUnavailableReason;
            })
            .map((question, index) => {
                const questionId = Number(question.id);
                const answer = this.studentAnswerMap[questionId];
                return {
                    key: `essay_${index + 1}`,
                    questionId,
                    answerId: Number(answer.id),
                    question,
                    answer
                };
            });
        if (!promptItems.length) {
            this.essayAiMessage = 'Không có câu tự luận đủ điều kiện chấm bằng AI';
            return;
        }

        const testId = Number(this.selectedStudent?.student_test?.id);
        const runId = ++this.essayAiRunId;
        this.isGradingSelectedEssayWithAi = true;
        this.essayAiMessage = '';
        promptItems.forEach(item => {
            const state = this.essayQuestionStateMap[item.questionId];
            state.status = 'grading';
            state.error = '';
        });

        this.essayAiSubscription?.unsubscribe();
        this.essayAiSubscription = this.apiAiService.getChamDiemAi(buildEssayAiGradingPrompt(
            promptItems.map(item => ({
                key: item.key,
                question: item.question.desc,
                studentAnswer: item.answer.student_answer,
                rubricMarkdown: item.question.rubric_markdown || '',
                maxScore: Number(item.question.point)
            }))
        )).subscribe({
            next: response => {
                if (!this.isCurrentEssayAiRequest(testId, promptItems, runId)) {
                    return;
                }
                const responseItems = parseEssayAiGradingResponse(response);
                let succeeded = 0;
                promptItems.forEach(item => {
                    const state = this.essayQuestionStateMap[item.questionId];
                    const matchingItems = responseItems?.filter(result => result['question_key'] === item.key) || [];
                    const result = matchingItems.length === 1
                        ? mapEssayAiGradingResult(matchingItems[0], state.maxPoint)
                        : null;
                    if (!result) {
                        state.status = 'error';
                        state.error = `AI chưa trả kết quả hợp lệ cho ${item.key}`;
                        return;
                    }
                    state.aiSuggestedPoint = result.score;
                    state.editablePoint = result.score;
                    state.feedback = result.feedback;
                    state.status = 'graded';
                    this.updateEssayQuestionState(item.questionId);
                    succeeded++;
                });
                this.finishEssayAiGrading(succeeded, promptItems.length - succeeded);
            },
            error: () => {
                if (!this.isCurrentEssayAiRequest(testId, promptItems, runId)) {
                    return;
                }
                promptItems.forEach(item => {
                    const state = this.essayQuestionStateMap[item.questionId];
                    state.status = 'error';
                    state.error = 'Không thể chấm điểm bằng AI. Vui lòng thử lại';
                });
                this.finishEssayAiGrading(0, promptItems.length);
            }
        });
    }

    saveSelectedEssay(): void {
        if (this.isEssayBusy || this.isBulkAiGrading) {
            return;
        }
        Object.keys(this.essayQuestionStateMap).forEach(questionId => {
            this.updateEssayQuestionState(Number(questionId), true);
        });
        if (!this.canSaveEssay) {
            this.notificationService.toastWarning('Điểm hiện tại chưa hợp lệ để lưu');
            return;
        }

        const testId = Number(this.selectedStudent?.student_test?.id);
        const saveItems = this.essayQuestions
            .filter(question => {
                const questionId = Number(question.id);
                const state = this.essayQuestionStateMap[questionId];
                const answer = this.studentAnswerMap[questionId];
                return !!state?.canSave && !!normalizeEssayAiPromptContent(answer?.student_answer);
            })
            .map(question => {
                const questionId = Number(question.id);
                const state = this.essayQuestionStateMap[questionId];
                const answer = this.studentAnswerMap[questionId];
                return {
                    questionId,
                    answer,
                    answerId: Number(answer.id),
                    point: Number(state.editablePoint),
                    feedback: state.feedback
                };
            });
        const payload = this.getEssayTestGradePayload();
        if (!payload || !Number.isFinite(testId) || testId <= 0) {
            return;
        }

        this.isSavingEssay = true;
        this.essaySaveMessage = '';
        this.needsAggregateRetry = false;
        saveItems.forEach(item => {
            const state = this.essayQuestionStateMap[item.questionId];
            state.status = 'saving';
            state.error = '';
        });

        const answerSaveRequest = saveItems.length
            ? forkJoin(saveItems.map(item => this.studentAnswersService
                .updateClassPlanActivityStudentAnswers(item.answerId, {
                    point: item.point,
                    feedback: item.feedback
                })
                .pipe(
                    map(() => ({ item, success: true as const })),
                    catchError(() => of({ item, success: false as const }))
                )))
            : of([]);

        this.essaySaveSubscription?.unsubscribe();
        this.essaySaveSubscription = answerSaveRequest.pipe(
            switchMap(answerResults => {
                const allAnswersSaved = answerResults.every(result => result.success);
                if (!allAnswersSaved) {
                    return of({ answerResults, aggregateSucceeded: false });
                }
                // Trước chamBaiTuluan: gánește point = point_tracnghiem (phần trắc nghiệm) și point_tracnghiem = null,
                // că chamBaiTuluan să recalculeze corect tổng điểm (tracnghiem + tuluan) fără să din noi în joc vechi điểm.
                const rawTracnghiemPoint = this.selectedStudent?.student_test?.point_tracnghiem;
                const hasTracnghiemPoint = rawTracnghiemPoint !== null
                    && rawTracnghiemPoint !== undefined
                    && String(rawTracnghiemPoint).trim() !== '';
                const tracnghiemPoint = hasTracnghiemPoint ? Number(rawTracnghiemPoint) : Number.NaN;
                const resetTracnghiemRequest = hasTracnghiemPoint && Number.isFinite(tracnghiemPoint)
                    ? this.studentTestsService.updateClassPlanActivityStudentTests(testId, {
                        point: tracnghiemPoint,
                        point_tracnghiem: null
                    })
                    : of(null);
                return resetTracnghiemRequest.pipe(
                    switchMap(() => this.studentTestsService.chamBaiTuluan(testId, payload).pipe(
                        map(() => ({ answerResults, aggregateSucceeded: true })),
                        catchError(() => of({ answerResults, aggregateSucceeded: false }))
                    )),
                    catchError(() => of({ answerResults, aggregateSucceeded: false }))
                );
            }),
            finalize(() => {
                this.isSavingEssay = false;
                this.essaySaveSubscription = null;
            })
        ).subscribe(({ answerResults, aggregateSucceeded }) => {
            if (testId !== Number(this.selectedStudent?.student_test?.id)) {
                return;
            }
            let answerSaveFailed = false;
            answerResults.forEach(result => {
                const state = this.essayQuestionStateMap[result.item.questionId];
                if (result.success) {
                    result.item.answer.point = result.item.point;
                    result.item.answer.feedback = result.item.feedback;
                    state.currentPoint = result.item.point;
                    state.editablePoint = result.item.point;
                    state.currentFeedback = result.item.feedback;
                    state.status = 'saved';
                } else {
                    answerSaveFailed = true;
                    state.status = 'error';
                    state.error = 'Không thể lưu điểm và nhận xét. Vui lòng thử lại';
                }
                this.updateEssayQuestionState(result.item.questionId);
            });
            this.needsAggregateRetry = !answerSaveFailed && !aggregateSucceeded;
            this.handleEssaySaveResult({
                testId,
                success: !answerSaveFailed && aggregateSucceeded,
                answerSaveFailed,
                aggregateFailed: !answerSaveFailed && !aggregateSucceeded
            });
        });
    }

    selectEssayQuestion(questionId: number): void {
        if (this.essayQuestionStateMap[questionId]) {
            this.activeEssayQuestionId = questionId;
        }
    }

    toggleEssayQuestionGuidance(questionId: number): void {
        this.essayQuestionGuidanceVisible[questionId] = !this.essayQuestionGuidanceVisible[questionId];
    }

    onEssayPointChange(questionId: number): void {
        const state = this.essayQuestionStateMap[questionId];
        if (!state || this.isEssayBusy || this.isBulkAiGrading) {
            return;
        }
        state.error = '';
        if (state.status === 'saved' || state.status === 'error') {
            state.status = state.aiSuggestedPoint !== null ? 'graded' : 'idle';
        }
        this.updateEssayQuestionState(questionId, true);
        this.liveMessage = 'Có điểm tự luận chưa lưu';
    }

    onEssayFeedbackChange(questionId: number): void {
        this.onEssayPointChange(questionId);
    }

    hasEssayAnswer(questionId: number): boolean {
        return !!normalizeEssayAiPromptContent(this.studentAnswerMap[questionId]?.student_answer);
    }

    trackEssayQuestion(_: number, question: CoursePlanActivityTuluan): number {
        return Number(question.id);
    }

    private handleEssaySaveResult(result: EssaySaveResult): void {
        if (!result.success) {
            this.essaySaveMessage = result.answerSaveFailed
                ? 'Lưu câu trả lời thất bại; sinh viên hiện tại vẫn được giữ'
                : 'Tổng hợp điểm thất bại; có thể thử lại mà không lưu lại câu đã thành công';
            this.liveMessage = this.essaySaveMessage;
            this.notificationService.toastError(this.essaySaveMessage);
            this.cancelPendingNavigation();
            return;
        }

        this.essaySaveMessage = 'Đã lưu và tổng hợp điểm thành công';
        this.notificationService.toastSuccess(this.essaySaveMessage);
        this.refreshSavedStudent(result.testId, currentPosition => {
            if (this.pendingNavigation) {
                this.resumePendingNavigation();
                return;
            }
            this.liveMessage = this.essaySaveMessage;
            this.selectNextUngraded(result.testId, currentPosition);
        });
    }

    isStudentGraded(student: GradingStudent): boolean {
        return Number(student.student_test?.trangthai_cham) === 1;
    }

    formatComponentPoint(student: GradingStudent): string {
        if (!this.isStudentGraded(student)) {
            return '-';
        }
        const point = Number(student.student_test?.point);
        const essayPoint = Number(student.student_test?.point_tuluan ?? 0);
        return Number.isFinite(point) && Number.isFinite(essayPoint)
            ? this.formatPointOnTen(point - essayPoint)
            : '-';
    }

    formatEssayPoint(student: GradingStudent): string {
        return this.isStudentGraded(student)
            ? this.formatPointOnTen(student.student_test?.point_tuluan)
            : '-';
    }

    formatTotalPoint(student: GradingStudent): string {
        return this.isStudentGraded(student)
            ? this.formatPointOnTen(student.student_test?.tong_diem)
            : '-';
    }

    formatDeductionPercent(student: GradingStudent): string {
        if (!this.isStudentGraded(student)) {
            return '-';
        }
        const deduction = Number(student.student_test?.trudiem);
        return Number.isFinite(deduction) ? `${deduction}%` : '-';
    }

    get canViewPreviousStudentTest(): boolean {
        return this.canNavigateStudentTest(-1);
    }

    get canViewNextStudentTest(): boolean {
        return this.canNavigateStudentTest(1);
    }

    canOpenStudentTest(student: GradingStudent): boolean {
        return !this.isBulkAiGrading
            && !this.isLoadingStudentTest
            && this.isStudentTestReviewable(student);
    }

    openViewTest(event: Event, student: GradingStudent): void {
        event.stopPropagation();
        if (this.canOpenStudentTest(student)) {
            this.loadStudentTest(student, true);
        }
    }

    navigateStudentTest(offset: -1 | 1): void {
        if (!this.canNavigateStudentTest(offset)) {
            return;
        }

        const reviewableStudents = this.getReviewableStudents();
        const currentIndex = reviewableStudents.findIndex(
            student => student.student_id === this.studentTestReviewStudent?.student_id
        );
        const targetStudent = reviewableStudents[currentIndex + offset];
        if (targetStudent) {
            this.loadStudentTest(targetStudent, false);
        }
    }

    private canNavigateStudentTest(offset: -1 | 1): boolean {
        if (this.isLoadingStudentTest) {
            return false;
        }

        const reviewableStudents = this.getReviewableStudents();
        const currentIndex = reviewableStudents.findIndex(
            student => student.student_id === this.studentTestReviewStudent?.student_id
        );
        const targetIndex = currentIndex + offset;
        return currentIndex !== -1 && targetIndex >= 0 && targetIndex < reviewableStudents.length;
    }

    private getReviewableStudents(): GradingStudent[] {
        return this.filteredStudents.filter(student => this.isStudentTestReviewable(student));
    }

    private isStudentTestReviewable(student: GradingStudent): boolean {
        return Number(student.student_test?.status) === 1
            && this.getQuestionIds(student.student_test?.questions).length > 0;
    }

    private loadStudentTest(student: GradingStudent, openModal: boolean): void {
        const studentTest = student.student_test;
        if (!studentTest || !this.getQuestionIds(studentTest.questions).length) {
            return;
        }

        const conditionQuestion: ConditionOption = {
            condition: [],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'include', value: studentTest.questions.toString() },
                { label: 'include_by', value: 'id ' }
            ],
            page: null
        };
        const conditionAnswer: ConditionOption = {
            condition: [{
                conditionName: 'class_plan_activity_student_test_id',
                condition: OvicQueryCondition.equal,
                value: studentTest.id.toString(),
                orWhere: 'and'
            }],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'cursor', value: '0' }
            ],
            page: null
        };

        this.studentTestReviewSubscription?.unsubscribe();
        this.isLoadingStudentTest = true;
        this.notificationService.isProcessing(true);
        this.studentTestReviewSubscription = forkJoin([
            this.courseQuestionsService.getCourseQuestionsByPageNew(conditionQuestion),
            this.studentAnswersService.getClassPlanActivityStudentAnswersByPageNew(conditionAnswer)
        ]).pipe(
            takeUntil(this.destroy$),
            finalize(() => {
                this.isLoadingStudentTest = false;
                this.notificationService.isProcessing(false);
                this.studentTestReviewSubscription = null;
            })
        ).subscribe({
            next: ([questionResponse, answerResponse]) => {
                this.studentTestReviewStudent = student;
                this.studentTestReviewQuestions = questionResponse.data || [];
                this.studentTestReviewAnswers = answerResponse.data || [];
                if (openModal) {
                    const modalRef = this.modalService.open(this.viewStudentTest, LARGE_MODAL_OPTIONS);
                    modalRef.result.then(
                        () => this.resetStudentTestReview(),
                        () => this.resetStudentTestReview()
                    );
                }
            },
            error: () => {
                this.notificationService.toastError('Không tải được bài kiểm tra, vui lòng thử lại');
            }
        });
    }

    private resetStudentTestReview(): void {
        this.studentTestReviewSubscription?.unsubscribe();
        this.studentTestReviewSubscription = null;
        this.isLoadingStudentTest = false;
        this.studentTestReviewStudent = null;
        this.studentTestReviewQuestions = [];
        this.studentTestReviewAnswers = [];
    }

    getStatusLabel(student: GradingStudent): string {
        const test = student.student_test;
        if (!test) {
            return 'Chưa có đề';
        }
        if (Number(test.trangthai_cham) === 1) {
            return 'Đã chấm';
        }
        if (Number(test.trangthai_cham) === -1) {
            return 'Đang chấm';
        }
        if (Number(test.status) !== 1) {
            return Number(test.status) === 0 ? 'Đang làm bài' : 'Chưa nộp';
        }
        if (!this.hasEssayQuestions(test)) {
            return 'Không có tự luận';
        }
        return 'Chưa chấm';
    }

    getStatusClass(student: GradingStudent): string {
        const label = this.getStatusLabel(student);
        if (label === 'Đã chấm') {
            return 'status-graded';
        }
        if (label === 'Đang chấm') {
            return 'status-grading';
        }
        if (label === 'Chưa chấm') {
            return 'status-ungraded';
        }
        if (label === 'Đang làm bài') {
            return 'status-doing';
        }
        return 'status-muted';
    }

    getStudentAriaLabel(student: GradingStudent): string {
        const objective = this.formatComponentPoint(student);
        const essay = this.formatEssayPoint(student);
        return `${student.full_name}, mã ${student.student_code}, ${this.getStatusLabel(student)}, `
            + `điểm trắc nghiệm ${objective === '-' ? 'chưa có' : objective}, `
            + `điểm tự luận ${essay === '-' ? 'chưa có' : essay}`;
    }

    getStudentTabIndex(student: GradingStudent): number {
        return student.student_id === this.focusedStudentId ? 0 : -1;
    }

    onStudentFocus(student: GradingStudent): void {
        this.focusedStudentId = student.student_id;
    }

    onStudentKeydown(event: KeyboardEvent, student: GradingStudent): void {
        const rows = this.filteredStudents;
        const current = rows.findIndex(row => row.student_id === student.student_id);
        let targetIndex = current;
        if (event.key === 'ArrowDown') {
            targetIndex = Math.min(current + 1, rows.length - 1);
        } else if (event.key === 'ArrowUp') {
            targetIndex = Math.max(current - 1, 0);
        } else if (event.key === 'Home') {
            targetIndex = 0;
        } else if (event.key === 'End') {
            targetIndex = rows.length - 1;
        } else if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.selectStudent(student);
            return;
        } else {
            return;
        }
        event.preventDefault();
        const target = rows[targetIndex];
        if (target) {
            this.focusedStudentId = target.student_id;
            this.focusStudentRow(target.student_id);
        }
    }

    showListPane(): void {
        this.mobilePane = 'list';
        this.rosterCollapsed = false;
        setTimeout(() => {
            if (this.focusedStudentId) {
                this.focusStudentRow(this.focusedStudentId);
            }
        });
    }

    showDetailPane(focusHeading: boolean = false): void {
        this.mobilePane = 'detail';
        if (focusHeading) {
            setTimeout(() => this.essayHeading?.nativeElement.focus());
        }
    }

    toggleRoster(): void {
        this.rosterCollapsed = !this.rosterCollapsed;
        if (!this.rosterCollapsed && this.focusedStudentId) {
            setTimeout(() => this.focusStudentRow(this.focusedStudentId as number));
        }
    }

    isGradeable(student: GradingStudent): boolean {
        return Number(student.student_test?.status) === 1 && this.hasEssayQuestions(student.student_test);
    }

    trackStudent(_: number, student: GradingStudent): number {
        return student.student_id;
    }

    private loadClass(classId: number): void {
        const condition: ConditionOption = {
            condition: [{ conditionName: 'id', condition: OvicQueryCondition.equal, value: classId.toString() }],
            set: [],
            page: null
        };
        if (!this.isManager) {
            condition.condition.push({
                conditionName: 'manager_ids',
                condition: OvicQueryCondition.like,
                value: `%|${this.userId}|%`,
                orWhere: 'and'
            });
        }

        this.isLoadingList = true;
        this.classesService.getClassesByPageNew(condition).pipe(
            switchMap(response => {
                const selectedClass = response.data?.[0];
                if (!selectedClass) {
                    return of(null);
                }
                this.classSelected = selectedClass;
                this.auth.setFeatureSecondary(`${selectedClass.name} - Chấm kiểm tra 15 phút bài ${this.currentWeek}`);
                return selectedClass.course_id
                    ? this.courseService.getElnKhoaHocByItem(selectedClass.course_id.toString(), 'id')
                    : of([]);
            }),
            takeUntil(this.destroy$)
        ).subscribe({
            next: courses => {
                if (!this.classSelected) {
                    this.rejectAccess();
                    return;
                }
                this.courseSelected = courses?.[0] || null;
                this.requestStudentList('default');
            },
            error: () => this.rejectAccess('Lỗi kết nối, vui lòng thử lại')
        });
    }

    private bindListLoader(): void {
        this.listRequest$.pipe(
            switchMap(request => {
                this.activeListRequestId = request.id;
                this.isLoadingList = true;
                this.listError = '';
                return forkJoin({
                    page: this.fetchStudentPage(request),
                    counts: this.fetchGradeFilterCounts(request.searchValue)
                }).pipe(
                    map(({ page, counts }) => ({ ...page, counts, request, error: '' })),
                    catchError(() => of({
                        request,
                        students: [] as ClassStudent[],
                        tests: [] as ClassPlanActivityStudentTests[],
                        total: this.totalStudents,
                        counts: null,
                        error: 'Không tải được danh sách sinh viên. Kiểm tra kết nối rồi thử lại.'
                    })),
                    finalize(() => {
                        if (this.activeListRequestId === request.id) {
                            this.isLoadingList = false;
                        }
                    })
                );
            }),
            takeUntil(this.destroy$)
        ).subscribe(result => {
            if (result.request.id !== this.activeListRequestId) {
                return;
            }
            if (result.error) {
                this.listError = result.error;
                if (result.request.mode === 'auto-next') {
                    this.notificationService.toastError('Không thể tìm bài tiếp theo vì tải danh sách thất bại');
                }
                return;
            }
            if (result.counts) {
                this.gradeFilterCounts = result.counts;
            }
            this.applyStudentPage(result.request, result.students, result.tests, result.total);
        });
    }

    private fetchGradeFilterCounts(searchValue: string): Observable<GradeFilterCounts> {
        const studentCondition: ConditionOption = {
            condition: [{
                conditionName: 'class_id',
                condition: OvicQueryCondition.equal,
                value: this.classSelected.id.toString()
            }],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'with', value: 'user' }
            ],
            page: null
        };
        if (searchValue) {
            studentCondition.condition.push({
                conditionName: 'user_info',
                condition: OvicQueryCondition.like,
                value: `%${searchValue}%`,
                orWhere: 'and'
            });
        }

        return this.classStudentService.getClassStudentByPageNew(studentCondition).pipe(
            switchMap(response => {
                const students = response.data || [];
                if (!students.length) {
                    return of({ all: 0, ungraded: 0, graded: 0, notSubmitted: 0, noEssay: 0 });
                }
                return this.studentTestsService.getClassPlanActivityStudentTestsByPageNew({
                    condition: [
                        { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.classSelected.id.toString() },
                        { conditionName: 'week', condition: OvicQueryCondition.equal, value: this.currentWeek.toString(), orWhere: 'and' },
                        { conditionName: 'type', condition: OvicQueryCondition.equal, value: 'KT_DAUGIO', orWhere: 'and' }
                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'select', value: 'id,student_id,status,questions_tuluan,trangthai_cham' }
                    ],
                    page: null
                }).pipe(map(testResponse => this.calculateGradeFilterCounts(
                    students,
                    testResponse.data || []
                )));
            })
        );
    }

    private calculateGradeFilterCounts(
        students: ClassStudent[],
        tests: ClassPlanActivityStudentTests[]
    ): GradeFilterCounts {
        const testsByStudentId = new Map<number, StudentTest>();
        tests.forEach(test => {
            if (!testsByStudentId.has(Number(test.student_id))) {
                testsByStudentId.set(Number(test.student_id), test);
            }
        });

        return students.reduce<GradeFilterCounts>((counts, student) => {
            const test = testsByStudentId.get(Number(student.student_id));
            counts.all++;
            if (!test || Number(test.status) !== 1) {
                counts.notSubmitted++;
            }
            if (Number(test?.trangthai_cham) === 1) {
                counts.graded++;
            }
            if (test && !this.hasEssayQuestions(test)) {
                counts.noEssay++;
            }
            if (test && Number(test.status) === 1
                && this.hasEssayQuestions(test)
                && Number(test.trangthai_cham) !== 1) {
                counts.ungraded++;
            }
            return counts;
        }, { all: 0, ungraded: 0, graded: 0, notSubmitted: 0, noEssay: 0 });
    }

    private updateGradeFilterCountsForTestChange(
        previousTest: StudentTest | undefined,
        currentTest: StudentTest
    ): void {
        const previousGraded = Number(previousTest?.trangthai_cham) === 1;
        const currentGraded = Number(currentTest.trangthai_cham) === 1;
        const previousUngraded = !!previousTest
            && Number(previousTest.status) === 1
            && this.hasEssayQuestions(previousTest)
            && !previousGraded;
        const currentUngraded = Number(currentTest.status) === 1
            && this.hasEssayQuestions(currentTest)
            && !currentGraded;

        if (previousGraded !== currentGraded) {
            this.gradeFilterCounts.graded += currentGraded ? 1 : -1;
        }
        if (previousUngraded !== currentUngraded) {
            this.gradeFilterCounts.ungraded += currentUngraded ? 1 : -1;
        }
    }

    private fetchStudentPage(request: StudentListRequest): Observable<{
        students: ClassStudent[];
        tests: ClassPlanActivityStudentTests[];
        total: number;
    }> {
        const studentCondition: ConditionOption = {
            condition: [{
                conditionName: 'class_id',
                condition: OvicQueryCondition.equal,
                value: this.classSelected.id.toString()
            }],
            set: [
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'ordering' },
                { label: 'limit', value: request.pageSize.toString() },
                { label: 'with', value: 'user' }
            ],
            page: request.pageIndex.toString()
        };
        if (request.searchValue) {
            studentCondition.condition.push({
                conditionName: 'user_info',
                condition: OvicQueryCondition.like,
                value: `%${request.searchValue}%`,
                orWhere: 'and'
            });
        }

        return this.classStudentService.getClassStudentByPageNew(studentCondition).pipe(
            switchMap(response => {
                const students = response.data || [];
                const studentIds = students.map(student => student.student_id);
                if (!studentIds.length) {
                    return of({ students, tests: [] as ClassPlanActivityStudentTests[], total: response.recordsFiltered });
                }
                return this.studentTestsService.getClassPlanActivityStudentTestsByPageNew({
                    condition: [
                        { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.classSelected.id.toString() },
                        { conditionName: 'week', condition: OvicQueryCondition.equal, value: this.currentWeek.toString(), orWhere: 'and' },
                        { conditionName: 'type', condition: OvicQueryCondition.equal, value: 'KT_DAUGIO', orWhere: 'and' }
                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'include', value: studentIds.join(',') },
                        { label: 'include_by', value: 'student_id' },
                        { label: 'select', value: 'id,student_id,status,questions,questions_tuluan,trangthai_cham,tong_diem,point,point_tracnghiem,point_tuluan,trudiem,submit_by' }
                    ],
                    page: null
                }).pipe(map(testResponse => ({
                    students,
                    tests: testResponse.data || [],
                    total: response.recordsFiltered
                })));
            })
        );
    }

    private requestStudentList(
        mode: ListLoadMode,
        preferredStudentId?: number,
        requestedPage: number = this.pageIndex
    ): void {
        if (!this.classSelected?.id) {
            return;
        }
        const request: StudentListRequest = {
            id: ++this.listRequestId,
            pageIndex: requestedPage,
            pageSize: this.pageSize,
            searchValue: this.appliedSearchValue,
            preferredStudentId,
            mode
        };
        this.activeListRequestId = request.id;
        this.listRequest$.next(request);
    }

    private applyStudentPage(
        request: StudentListRequest,
        students: ClassStudent[],
        tests: ClassPlanActivityStudentTests[],
        total: number
    ): void {
        const previousSelectedStudentId = this.selectedStudent?.student_id;
        const shouldReloadSelectedDetail = request.mode === 'preserve';
        this.pageIndex = request.pageIndex;
        this.pageSize = request.pageSize;
        this.totalStudents = total;
        this.students = students.map((student, index) => {
            const studentTest = tests.find(test => test.student_id === student.student_id) as StudentTest;
            return {
                ...student,
                index_: (request.pageIndex - 1) * request.pageSize + index + 1,
                full_name: student.user_info?.full_name || '-',
                student_code: student.user_info?.student_code || '-',
                student_test: studentTest
            };
        });

        if (request.mode === 'auto-next') {
            const next = this.filteredStudents.find(student => this.isEligibleUngraded(student));
            if (next) {
                this.activateStudent(next, true, true);
                this.liveMessage = `Đã chuyển đến bài của ${next.full_name}`;
                return;
            }
            if (request.pageIndex * request.pageSize < total) {
                this.requestStudentList('auto-next', undefined, request.pageIndex + 1);
                return;
            }
            this.liveMessage = 'Đã chấm hết bài tự luận chưa chấm trong bộ lọc hiện tại';
            this.notificationService.toastInfo(this.liveMessage);
            return;
        }

        const target = this.students.find(student => student.student_id === request.preferredStudentId)
            || this.students.find(student => this.isEligibleUngraded(student))
            || this.students.find(student => this.isGradeable(student))
            || this.students[0]
            || null;
        this.focusedStudentId = target?.student_id || null;
        if (target) {
            const sameSelection = target.student_id === previousSelectedStudentId;
            this.selectedStudent = target;
            if (!sameSelection || shouldReloadSelectedDetail) {
                this.activateStudent(target, false, false, shouldReloadSelectedDetail);
            }
        } else {
            this.clearSelection();
        }
        this.announceListCount();
    }

    private bindDetailLoader(): void {
        this.detailRequest$.pipe(
            distinctUntilChanged((previous, current) => previous.student.student_id === current.student.student_id
                && previous.testId === current.testId
                && !current.force),
            switchMap(request => {
                this.activeDetailRequestId = request.id;
                this.detailError = '';
                this.resetEssayState();
                const test = request.student.student_test;
                if (!this.isGradeable(request.student) || !test?.id) {
                    this.isLoadingDetail = false;
                    return of({ request, questions: [], answers: [], error: '' });
                }

                this.isLoadingDetail = true;
                const questionIds = this.getEssayQuestionIds(test);
                const questionCondition: ConditionOption = {
                    condition: [],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'include', value: questionIds.join(',') },
                        { label: 'include_by', value: 'id' }
                    ],
                    page: null
                };
                const answerCondition: ConditionOption = {
                    condition: [{
                        conditionName: 'class_plan_activity_student_test_id',
                        condition: OvicQueryCondition.equal,
                        value: test.id.toString(),
                        orWhere: 'and'
                    }],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'cursor', value: '0' }
                    ],
                    page: null
                };
                return forkJoin([
                    this.essayQuestionsService.getCoursePlanActivityTuluanByPageNew(questionCondition),
                    this.studentAnswersService.getClassPlanActivityStudentAnswersByPageNew(answerCondition)
                ]).pipe(
                    map(([questionResponse, answerResponse]) => ({
                        request,
                        questions: questionResponse.data || [],
                        answers: answerResponse.data || [],
                        error: ''
                    })),
                    catchError(() => of({
                        request,
                        questions: [] as CoursePlanActivityTuluan[],
                        answers: [] as ClassPlanActivityStudentAnswers[],
                        error: 'Không tải được bài tự luận. Giữ nguyên sinh viên đã chọn; bấm Thử lại.'
                    })),
                    finalize(() => {
                        if (this.activeDetailRequestId === request.id) {
                            this.isLoadingDetail = false;
                        }
                    })
                );
            }),
            takeUntil(this.destroy$)
        ).subscribe(result => {
            if (
                result.request.id !== this.activeDetailRequestId
                || result.request.testId !== Number(this.selectedStudent?.student_test?.id)
            ) {
                return;
            }
            this.detailError = result.error;
            if (result.error) {
                this.pendingDiscard?.cancel?.();
                this.pendingDiscard = null;
                return;
            }
            this.essayQuestions = result.questions;
            this.studentAnswers = result.answers;
            this.initializeEssayState();
            this.liveMessage = `Đã mở bài tự luận của ${result.request.student.full_name}`;
            if (this.pendingDiscard) {
                const pending = this.pendingDiscard;
                this.pendingDiscard = null;
                pending.action();
                return;
            }
            if (this.focusEssayAfterLoad) {
                this.focusEssayAfterLoad = false;
                setTimeout(() => this.essayHeading?.nativeElement.focus());
            }
        });
    }

    private requestDetail(student: GradingStudent, force: boolean = false): void {
        const testId = Number(student.student_test?.id) || 0;
        const request: DetailRequest = {
            id: ++this.detailRequestId,
            student,
            testId,
            force
        };
        this.activeDetailRequestId = request.id;
        this.detailRequest$.next(request);
    }

    private activateStudent(
        student: GradingStudent,
        focusEssay: boolean = false,
        showDetail: boolean = true,
        forceDetail: boolean = false
    ): void {
        this.selectedStudent = student;
        this.focusedStudentId = student.student_id;
        this.focusEssayAfterLoad = focusEssay;
        this.resetEssayState();
        if (showDetail) {
            this.mobilePane = 'detail';
        }
        this.requestDetail(student, forceDetail);
    }

    private gateNavigation(action: () => void, cancel?: () => void): void {
        if (!this.canNavigate) {
            cancel?.();
            return;
        }
        if (!this.hasUnsavedChanges) {
            action();
            return;
        }
        this.confirmDirtyNavigation(action, cancel);
    }

    private confirmDirtyNavigation(
        action: () => void,
        cancel?: () => void,
        routeLeave: boolean = false
    ): void {
        const focusTarget = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const saveButton = {
            label: 'Lưu và tiếp tục',
            name: 'save_continue',
            class: 'p-button-success',
            icon: 'pi pi-save'
        };
        const discardButton = {
            label: 'Bỏ thay đổi',
            name: 'discard',
            class: 'p-button-danger',
            icon: 'pi pi-trash'
        };
        const stayButton = {
            label: 'Ở lại',
            name: 'stay',
            class: 'p-button-secondary',
            icon: 'pi pi-ban'
        };

        this.notificationService.confirm(
            'Điểm đang chỉnh sửa chưa được lưu. Chọn cách xử lý trước khi tiếp tục.',
            'Thay đổi chưa lưu',
            [saveButton, discardButton, stayButton]
        ).then(result => {
            if (result.name === 'save_continue') {
                if (!this.canSaveEssay) {
                    this.notificationService.toastWarning('Điểm hiện tại chưa hợp lệ để lưu');
                    cancel?.();
                    this.restoreFocus(focusTarget);
                    return;
                }
                this.pendingNavigation = { action, cancel, focusTarget };
                this.saveSelectedEssay();
                return;
            }
            if (result.name === 'discard') {
                if (routeLeave || !this.selectedStudent) {
                    action();
                    return;
                }
                this.pendingDiscard = { action, cancel, focusTarget };
                this.requestDetail(this.selectedStudent, true);
                return;
            }
            cancel?.();
            this.restoreFocus(focusTarget);
        }).catch(() => {
            cancel?.();
            this.restoreFocus(focusTarget);
        });
    }

    private resumePendingNavigation(): void {
        const pending = this.pendingNavigation;
        this.pendingNavigation = null;
        pending?.action();
    }

    private cancelPendingNavigation(): void {
        const pending = this.pendingNavigation;
        this.pendingNavigation = null;
        pending?.cancel?.();
        this.restoreFocus(pending?.focusTarget || null);
    }

    private refreshSavedStudent(testId: number, afterRefresh: (currentPosition: number) => void): void {
        if (!Number.isFinite(testId) || testId <= 0) {
            this.cancelPendingNavigation();
            return;
        }
        const currentPosition = this.students.findIndex(student => student.student_test?.id === testId);
        this.studentTestsService.getClassPlanActivityStudentTestsByPageNew({
            condition: [{ conditionName: 'id', condition: OvicQueryCondition.equal, value: testId.toString() }],
            set: [{ label: 'select', value: 'id,student_id,status,questions,questions_tuluan,trangthai_cham,tong_diem,point,point_tracnghiem,point_tuluan,trudiem' }],
            page: null
        }).pipe(takeUntil(this.destroy$)).subscribe({
            next: response => {
                const refreshed = response.data?.[0] as StudentTest;
                const row = this.students.find(student => student.student_test?.id === testId);
                if (!refreshed || !row) {
                    this.notificationService.toastError('Không tải được điểm mới, sinh viên hiện tại được giữ nguyên');
                    this.cancelPendingNavigation();
                    return;
                }
                const previousTest = row.student_test;
                row.student_test = {
                    ...row.student_test,
                    id: refreshed.id,
                    student_id: refreshed.student_id,
                    status: refreshed.status,
                    questions: refreshed.questions,
                    questions_tuluan: refreshed.questions_tuluan,
                    trangthai_cham: refreshed.trangthai_cham,
                    tong_diem: refreshed.tong_diem,
                    point: refreshed.point,
                    point_tracnghiem: refreshed.point_tracnghiem,
                    point_tuluan: refreshed.point_tuluan,
                    trudiem: refreshed.trudiem
                };
                this.updateGradeFilterCountsForTestChange(previousTest, row.student_test);
                if (this.selectedStudent?.student_id === row.student_id) {
                    this.selectedStudent = row;
                }
                afterRefresh(currentPosition);
            },
            error: () => {
                this.notificationService.toastError('Không tải được điểm mới, sinh viên hiện tại được giữ nguyên');
                this.cancelPendingNavigation();
            }
        });
    }

    private selectNextUngraded(savedTestId: number, currentPosition: number): void {
        const position = currentPosition >= 0
            ? currentPosition
            : this.students.findIndex(student => student.student_test?.id === savedTestId);
        const next = [
            ...this.students.slice(position + 1),
            ...this.students.slice(0, position + 1)
        ].find(student => this.matchesFilter(student) && this.isEligibleUngraded(student));
        if (next) {
            this.activateStudent(next, true, true);
            this.liveMessage = `Đã lưu điểm; chuyển đến bài của ${next.full_name}`;
            return;
        }
        this.liveMessage = 'Đã lưu điểm; không còn bài tự luận chưa chấm trong trang hiện tại';
        this.notificationService.toastInfo(this.liveMessage);
    }

    private startBulkAi(testIds: number[]): void {
        if (!this.canStartBulkAi) {
            this.notificationService.toastWarning('Chỉ có thể chấm AI tất cả khi danh sách và bài hiện tại đã sẵn sàng');
            return;
        }
        this.isBulkAiGrading = true;
        this.bulkFailedTestIds = [];
        this.bulkFailedReasons = {};
        this.bulkProgress = { phase: 'loading', message: 'Đang chuẩn bị dữ liệu', percent: 0, summary: '' };
        this.bulkSubscription?.unsubscribe();
        this.bulkSubscription = this.bulkGradingService.gradeClassTests(
            Number(this.classSelected.id),
            this.currentWeek,
            testIds
        ).pipe(finalize(() => this.isBulkAiGrading = false)).subscribe({
            next: (event: EssayBulkGradingEvent) => {
                if (event.type === 'progress') {
                    this.bulkProgress = event.progress;
                    this.liveMessage = event.progress.message;
                    return;
                }
                const summary = event.result;
                this.bulkFailedTestIds = summary.failedTestIds;
                this.bulkFailedReasons = summary.failedReasons || {};
                this.bulkProgress = {
                    phase: 'done',
                    message: 'Đã hoàn tất chấm điểm AI tất cả',
                    percent: 100,
                    summary: summary.summary
                };
                this.liveMessage = summary.summary;
                if (summary.failedTests || summary.failedAnswers) {
                    this.notificationService.toastWarning(summary.summary);
                } else {
                    this.notificationService.toastSuccess(summary.summary);
                }
                this.requestStudentList('preserve', this.selectedStudent?.student_id);
            },
            error: () => {
                this.bulkProgress = {
                    phase: 'done',
                    message: 'Không thể hoàn tất chấm điểm AI tất cả',
                    percent: 100,
                    summary: 'Lỗi tải hoặc xử lý dữ liệu. Vui lòng thử lại'
                };
                this.liveMessage = this.bulkProgress.summary;
                this.notificationService.toastError(this.bulkProgress.summary);
            }
        });
    }

    private matchesFilter(student: GradingStudent): boolean {
        switch (this.gradeFilter) {
            case 'ungraded':
                return this.isEligibleUngraded(student);
            case 'graded':
                return Number(student.student_test?.trangthai_cham) === 1;
            case 'not-submitted':
                return !student.student_test || Number(student.student_test.status) !== 1;
            case 'no-essay':
                return !!student.student_test && !this.hasEssayQuestions(student.student_test);
            default:
                return true;
        }
    }

    private isEligibleUngraded(student: GradingStudent): boolean {
        return this.isGradeable(student) && Number(student.student_test?.trangthai_cham) !== 1;
    }

    private hasEssayQuestions(test: StudentTest | undefined): boolean {
        return this.getEssayQuestionIds(test).length > 0;
    }

    private formatPointOnTen(value: number | string | null | undefined): string {
        if (value === null || value === undefined || value === '') {
            return '-';
        }
        const point = Number(value);
        return Number.isFinite(point) ? (point / 10).toFixed(1) : '-';
    }

    private getQuestionIds(questionIds: unknown): number[] {
        const values = Array.isArray(questionIds)
            ? questionIds
            : typeof questionIds === 'string'
                ? questionIds.split(',')
                : [];
        return [...new Set(values
            .map(id => Number(id))
            .filter(id => Number.isFinite(id) && id > 0))];
    }

    private getEssayQuestionIds(test: StudentTest | undefined): number[] {
        if (!Array.isArray(test?.questions_tuluan)) {
            return [];
        }
        return [...new Set(test.questions_tuluan
            .map(id => Number(id))
            .filter(id => Number.isFinite(id) && id > 0))];
    }

    private initializeEssayState(): void {
        this.cancelEssayRequests();
        this.studentAnswerMap = {};
        this.essayQuestionStateMap = {};
        this.essayQuestionGuidanceVisible = {};
        this.studentAnswers.forEach(answer => {
            const questionId = Number(answer.course_plan_activity_tuluan_id);
            if (Number.isFinite(questionId) && questionId > 0) {
                this.studentAnswerMap[questionId] = answer;
            }
        });
        this.essayQuestions.forEach(question => {
            const questionId = Number(question.id);
            if (!Number.isFinite(questionId) || questionId <= 0) {
                return;
            }
            this.essayQuestionStateMap[questionId] = this.createEssayQuestionState(
                question,
                this.studentAnswerMap[questionId]
            );
            this.updateEssayQuestionState(questionId);
        });
        this.activeEssayQuestionId = this.essayQuestions.length
            ? Number(this.essayQuestions[0].id)
            : null;
        this.needsAggregateRetry = false;
        this.essayAiMessage = '';
        this.essaySaveMessage = '';
    }

    private createEssayQuestionState(
        question: CoursePlanActivityTuluan,
        answer?: ClassPlanActivityStudentAnswers
    ): EssayQuestionGradingState {
        const maxPoint = getValidEssayAiMaxScore(question.point);
        const hasAnswer = !!normalizeEssayAiPromptContent(answer?.student_answer);
        const currentPoint = !hasAnswer
            ? 0
            : answer?.point !== null && answer?.point !== undefined && Number.isFinite(Number(answer.point))
                ? Number(answer.point)
                : null;
        const currentFeedback = typeof answer?.feedback === 'string' ? answer.feedback : '';
        return {
            questionId: Number(question.id),
            answerId: answer?.id || null,
            currentPoint,
            aiSuggestedPoint: null,
            editablePoint: currentPoint,
            maxPoint,
            currentFeedback,
            feedback: currentFeedback,
            status: 'idle',
            error: '',
            aiUnavailableReason: this.getEssayAiUnavailableReason(question, answer, maxPoint),
            pointValidationError: '',
            hasUnsavedChanges: false,
            canSave: false
        };
    }

    private getEssayAiUnavailableReason(
        question: CoursePlanActivityTuluan,
        answer: ClassPlanActivityStudentAnswers | undefined,
        maxPoint: number | null
    ): string {
        if (!answer?.id) {
            return 'Không có bản ghi câu trả lời để chấm';
        }
        if (!normalizeEssayAiPromptContent(answer.student_answer)) {
            return 'Sinh viên chưa có câu trả lời';
        }
        if (!normalizeEssayAiPromptContent(question.desc)) {
            return 'Câu hỏi chưa có nội dung';
        }
        if (!question.rubric_markdown?.trim()) {
            return 'Câu hỏi chưa có rubric chấm điểm';
        }
        if (maxPoint === null) {
            return 'Câu hỏi chưa có điểm tối đa hợp lệ';
        }
        if (containsEssayAiImageReference(question.desc) || containsEssayAiImageReference(answer.student_answer)) {
            return 'AI chưa hỗ trợ đọc nội dung ảnh trong câu hỏi hoặc bài làm';
        }
        return '';
    }

    private updateEssayQuestionState(questionId: number, showValidationError: boolean = false): void {
        const state = this.essayQuestionStateMap[questionId];
        if (!state) {
            return;
        }
        const editablePoint = state.editablePoint === null || state.editablePoint === undefined
            ? Number.NaN
            : Number(state.editablePoint);
        const pointIsValid = Number.isFinite(editablePoint)
            && state.maxPoint !== null
            && editablePoint >= 0
            && editablePoint <= state.maxPoint;
        if (!showValidationError) {
            state.pointValidationError = '';
        } else if (state.editablePoint === null || state.editablePoint === undefined) {
            state.pointValidationError = 'Vui lòng nhập điểm';
        } else if (!Number.isFinite(editablePoint)) {
            state.pointValidationError = 'Điểm không hợp lệ';
        } else if (state.maxPoint === null) {
            state.pointValidationError = 'Câu hỏi chưa có điểm tối đa hợp lệ';
        } else if (editablePoint < 0 || editablePoint > state.maxPoint) {
            state.pointValidationError = `Điểm phải nằm trong khoảng 0 đến ${state.maxPoint}`;
        } else {
            state.pointValidationError = '';
        }
        const pointChanged = state.editablePoint === null || state.editablePoint === undefined
            ? state.currentPoint !== null
            : !Number.isFinite(editablePoint) || state.currentPoint === null || editablePoint !== Number(state.currentPoint);
        const feedbackChanged = state.feedback !== state.currentFeedback;
        state.hasUnsavedChanges = pointChanged || feedbackChanged;
        state.canSave = !!state.answerId
            && pointIsValid
            && state.hasUnsavedChanges
            && state.status !== 'grading'
            && state.status !== 'saving';
    }

    private getEssayTestGradePayload(): { point_tuluan: number, max_tracnghiem: number } | null {
        if (!this.essayQuestions.length || this.essayQuestions.some(question => {
            const questionId = Number(question.id);
            return !Number.isFinite(questionId) || !this.essayQuestionStateMap[questionId];
        })) {
            return null;
        }
        return createEssayTestGradePayload(this.essayQuestions.map(question => {
            const questionId = Number(question.id);
            const state = this.essayQuestionStateMap[questionId];
            const answer = this.studentAnswerMap[questionId];
            return {
                point: normalizeEssayAiPromptContent(answer?.student_answer) ? state.editablePoint : 0,
                maxPoint: question.point
            };
        }));
    }

    private isCurrentEssayAiRequest(testId: number, items: EssayAiPromptItem[], runId: number): boolean {
        return runId === this.essayAiRunId
            && testId === Number(this.selectedStudent?.student_test?.id)
            && items.every(item => this.studentAnswerMap[item.questionId]?.id === item.answerId);
    }

    private finishEssayAiGrading(succeeded: number, failed: number): void {
        this.isGradingSelectedEssayWithAi = false;
        this.essayAiSubscription = null;
        this.essayAiMessage = failed
            ? `AI đã chấm ${succeeded}/${succeeded + failed} câu; ${failed} câu lỗi`
            : `AI đã chấm xong ${succeeded} câu tự luận`;
        this.liveMessage = this.essayAiMessage;
    }

    private cancelEssayRequests(): void {
        this.essayAiRunId++;
        this.essayAiSubscription?.unsubscribe();
        this.essaySaveSubscription?.unsubscribe();
        this.essayAiSubscription = null;
        this.essaySaveSubscription = null;
        this.isGradingSelectedEssayWithAi = false;
        this.isSavingEssay = false;
    }

    private resetEssayState(): void {
        this.cancelEssayRequests();
        this.essayQuestions = [];
        this.studentAnswers = [];
        this.studentAnswerMap = {};
        this.essayQuestionStateMap = {};
        this.activeEssayQuestionId = null;
        this.needsAggregateRetry = false;
        this.essayAiMessage = '';
        this.essaySaveMessage = '';
    }

    private announceListCount(): void {
        this.liveMessage = `Hiển thị ${this.filteredStudents.length} sinh viên phù hợp trên trang ${this.pageIndex}`;
    }

    private focusStudentRow(studentId: number): void {
        const row = this.studentList?.nativeElement.querySelector<HTMLElement>(
            `[data-student-id="${studentId}"]`
        );
        row?.focus();
        row?.scrollIntoView({ block: 'nearest' });
    }

    private restoreFocus(target: HTMLElement | null): void {
        setTimeout(() => target?.focus());
    }

    private clearSelection(): void {
        this.selectedStudent = null;
        this.focusedStudentId = null;
        this.resetEssayState();
        this.mobilePane = 'list';
    }

    private rejectAccess(message: string = 'Không tìm thấy bài kiểm tra'): void {
        this.isLoadingList = false;
        this.notificationService.toastError(message);
        this.router.navigate(['/admin/lop-hoc-phan']);
    }
}
