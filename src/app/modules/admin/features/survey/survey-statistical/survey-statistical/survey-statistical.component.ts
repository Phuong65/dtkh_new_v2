import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ChartModule } from 'primeng/chart';
import { SharedModule } from '@modules/shared/shared.module';
import { TableModule } from 'primeng/table';
import { NotificationService } from '@core/services/notification.service';
import { AuthService } from '@core/services/auth.service';
import { UserService } from '@core/services/user.service';
import { SurveyPlanService } from '@modules/shared/services/survey-plan.service';
import { SurveyQuestionService } from '@modules/shared/services/survey-question.service';
import { SurveyQuestionAnswerService } from '@modules/shared/services/survey-question-answer.service';
import { SurveyService } from '@modules/shared/services/survey.service';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { ClassesService } from '@modules/shared/services/classes.service';
import { DonViService } from '@modules/shared/services/don-vi.service';
import { IctuQueryParams, OvicConditionParam, OvicQueryCondition } from '@core/models/dto';
import { forkJoin, map, Observable, EMPTY, of } from 'rxjs';
import { catchError, expand, reduce, switchMap } from 'rxjs/operators';
import { SurveyPlan } from '@modules/shared/models/survey-plan';
import { Survey } from '@modules/shared/models/survey';
import { SurveyQuestion, SurveyQuestionRateOption } from '@modules/shared/models/survey-question';
import { QuestionStat, StatOverview, OptionStatData, RateStatData, TextStatData, SurveyAnswerRaw } from '@modules/shared/models/survey-statistics.model';
import { StatOverviewComponent } from '../components/stat-overview/stat-overview.component';
import { StatQuestionChartComponent } from '../components/stat-question-chart/stat-question-chart.component';
import { StatTextResponsesComponent } from '../components/stat-text-responses/stat-text-responses.component';
import { StatTeacherPanelComponent } from '../components/stat-teacher-panel/stat-teacher-panel.component';
import { TagModule } from 'primeng/tag';
import { SurveyExportDialogComponent } from '../components/survey-export-dialog/survey-export-dialog.component';
import { SurveyStatisticalExportService } from '../services/survey-statistical-export.service';
import {
    SurveyExportContext,
    SurveyExportFilter,
    SurveyExportOption
} from '../models/survey-export.model';

@Component({
    selector: 'app-survey-statistical',
    standalone: true,
    imports: [
        CommonModule,
        ChartModule,
        SharedModule,
        TableModule,
        TagModule,
        StatOverviewComponent,
        StatQuestionChartComponent,
        StatTextResponsesComponent,
        StatTeacherPanelComponent,
        SurveyExportDialogComponent
    ],
    templateUrl: './survey-statistical.component.html',
    styleUrls: ['./survey-statistical.component.css']
})
export class SurveyStatisticalComponent implements OnInit {

    constructor(
        private notifi: NotificationService,
        private surveyPlanService: SurveyPlanService,
        private surveyQuestionService: SurveyQuestionService,
        private surveyQuestionAnswerService: SurveyQuestionAnswerService,
        private surveyService: SurveyService,
        private auth: AuthService,
        private elngUserProfileService: ElngUserProfileService,
        private elnKhoaHocService: ElnKhoaHocService,
        private userService: UserService,
        private classesService: ClassesService,
        private surveyExportService: SurveyStatisticalExportService,
        private router: Router,
        private donViService: DonViService,
        private changeDetectorRef: ChangeDetectorRef
    ) { }

    // Bộ lọc phân cấp: Phiếu khảo sát → Đợt khảo sát
    listSurveys: Survey[] = [];
    selectedSurveyId: number | null = null;
    listPlans: SurveyPlan[] = [];
    selectedPlanId: number | null = null;
    selectedSchoolYear: string = '';
    selectedSemester: number | null = null;

    // Kết quả thống kê
    overview: StatOverview | null = null;
    questionStats: QuestionStat[] = [];

    // Trạng thái
    isLoadingSurveys: boolean = false;
    isLoadingPlans: boolean = false;
    isLoadingStats: boolean = false;
    hasData: boolean = false;
    isSurveyNavCollapsed: boolean = false;
    isLanhDaoKhoaContext: boolean = false;
    currentFacultyName: string = '';
    showExportDialog: boolean = false;
    isExporting: boolean = false;
    exportEstimatedRows: number = 0;
    exportContext: SurveyExportContext | null = null;
    exportFacultyOptions: SurveyExportOption<number | string>[] = [];
    exportCohortOptions: SurveyExportOption<string>[] = [];
    exportGroupOptions: SurveyExportOption<string>[] = [];

    // null = load full (role khaosat); khác null = giới hạn theo các course_id cho phép
    private allowedCourseIds: number[] | null = null;

    // Map teacher_id/class_id → tên hiển thị (resolve 1 lần cho cả đợt)
    teacherNames: Map<number, string> = new Map<number, string>();
    classNames: Map<number, string> = new Map<number, string>();
    private statsRequestVersion: number = 0;

    ngOnInit(): void {
        // Đồng bộ cách xác định context với SurveyPlanSettingComponent.
        this.isLanhDaoKhoaContext = this.router.url.startsWith('/admin/lanhdao-khoa/');
        this.initializeFilters();
    }

    /**
     * Route khảo sát: load full. Route lãnh đạo khoa: giới hạn answers theo khoa
     * (donvi_chuyenmon_id từ user profile → course.category_ids).
     */
    private initializeFilters(): void {
        if (this.isLanhDaoKhoaContext) {
            this.isLoadingSurveys = true;
            this.elngUserProfileService.getElngUserProfileByCol('user_id', this.auth.user.id.toString()).pipe(
                switchMap(profiles => {
                    const facultyId = Number(profiles[0]?.donvi_chuyenmon_id);
                    if (!Number.isFinite(facultyId) || facultyId <= 0) {
                        return of({ facultyId: null, facultyName: '', courses: [] });
                    }
                    return forkJoin({
                        courses: this.elnKhoaHocService.getElnKhoaHocByCol('category_ids', facultyId.toString()),
                        faculty: this.donViService.getDonViById(facultyId).pipe(catchError(() => of(null)))
                    }).pipe(
                        map(({ courses, faculty }) => ({
                            facultyId,
                            facultyName: faculty?.title || '',
                            courses: Array.isArray(courses) ? courses : []
                        }))
                    );
                })
            ).subscribe({
                next: ({ facultyId, facultyName, courses }) => {
                    this.currentFacultyName = facultyName;
                    this.allowedCourseIds = facultyId == null
                        ? []
                        : courses
                            .filter(course => this.normalizeCategoryIds(course.category_ids).includes(facultyId))
                            .map(course => course.id)
                            .filter((id): id is number => id != null);
                    this.loadSurveys();
                },
                error: () => {
                    this.allowedCourseIds = [];
                    this.isLoadingSurveys = false;
                    this.notifi.toastError('Không thể xác định đơn vị chuyên môn của người dùng');
                }
            });
            return;
        }

        this.allowedCourseIds = null; // route khảo sát: load full answers
        this.loadSurveys();
    }

    private normalizeCategoryIds(value: any): number[] {
        if (Array.isArray(value)) {
            return value.map(Number).filter(id => Number.isFinite(id) && id > 0);
        }
        if (value == null || value === '') return [];
        if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? [value] : [];

        const raw = String(value).trim();
        try {
            const parsed = JSON.parse(raw);
            return (Array.isArray(parsed) ? parsed : [parsed])
                .map(Number)
                .filter(id => Number.isFinite(id) && id > 0);
        } catch {
            return raw.split(/[|,]/)
                .map(Number)
                .filter(id => Number.isFinite(id) && id > 0);
        }
    }

    /**
     * Bước 1: Load danh sách phiếu khảo sát.
     */
    private loadSurveys(): void {
        this.isLoadingSurveys = true;
        const condition: OvicConditionParam[] = [
            { conditionName: 'status', condition: OvicQueryCondition.equal, value: 'PUBLISHED' },
            { conditionName: 'status', condition: OvicQueryCondition.equal, value: 'CLOSED', orWhere: 'or' }
        ];
        const queryParams: IctuQueryParams = {
            limit: -1,
            paged: 1,
            order: 'DESC',
            orderby: 'created_at'
        };

        this.surveyService.loadData(condition, queryParams).pipe(
            map(res => (res.data || []) as Survey[])
        ).subscribe({
            next: (surveys) => {
                this.listSurveys = surveys;
                this.isLoadingSurveys = false;
                this.changeDetectorRef.detectChanges();
            },
            error: () => {
                this.listSurveys = [];
                this.isLoadingSurveys = false;
                this.notifi.toastError('Không thể tải danh sách phiếu khảo sát');
            }
        });
    }

    /**
     * Mở/đóng Phiếu trong sidebar; chỉ một Phiếu được mở tại một thời điểm.
     */
    selectSurvey(surveyId: number): void {
        this.statsRequestVersion++;
        const nextSurveyId = this.selectedSurveyId === surveyId ? null : surveyId;
        this.selectedSurveyId = nextSurveyId;
        this.clearPlanSelection();

        if (nextSurveyId != null) {
            this.loadPlansBySurvey(nextSurveyId);
        }
    }

    private clearPlanSelection(): void {
        this.selectedPlanId = null;
        this.listPlans = [];
        this.selectedSchoolYear = '';
        this.selectedSemester = null;
        this.isLoadingPlans = false;
        this.isLoadingStats = false;
        this.notifi.isProcessing(false);
        this.resetStats();
    }

    get schoolYearOptions(): string[] {
        return Array.from(new Set(
            this.listPlans.map(plan => plan.school_year).filter(value => !!value)
        )).sort((a, b) => b.localeCompare(a));
    }

    get semesterOptions(): number[] {
        return Array.from(new Set(
            this.listPlans
                .filter(plan => !this.selectedSchoolYear || plan.school_year === this.selectedSchoolYear)
                .map(plan => Number(plan.semester))
                .filter(value => Number.isFinite(value))
        )).sort((a, b) => a - b);
    }

    get filteredPlans(): SurveyPlan[] {
        return this.listPlans.filter(plan =>
            (!this.selectedSchoolYear || plan.school_year === this.selectedSchoolYear) &&
            (this.selectedSemester == null || Number(plan.semester) === this.selectedSemester)
        );
    }

    setSchoolYear(value: string): void {
        this.selectedSchoolYear = value || '';
        if (this.selectedSemester != null && !this.semesterOptions.includes(this.selectedSemester)) {
            this.selectedSemester = null;
        }
        this.resetSelectedPlanIfHidden();
    }

    setSemester(value: string): void {
        this.selectedSemester = value === '' ? null : Number(value);
        this.resetSelectedPlanIfHidden();
    }

    private resetSelectedPlanIfHidden(): void {
        if (this.selectedPlanId != null && !this.filteredPlans.some(plan => plan.id === this.selectedPlanId)) {
            this.statsRequestVersion++;
            this.selectedPlanId = null;
            this.isLoadingStats = false;
            this.notifi.isProcessing(false);
            this.resetStats();
        }
    }

    /**
     * Bước 2: Load PUBLISHED/CLOSED plans của đúng phiếu đã chọn.
     */
    private loadPlansBySurvey(surveyId: number): void {
        this.isLoadingPlans = true;
        const condition: OvicConditionParam[] = [
            { conditionName: 'status', condition: OvicQueryCondition.equal, value: 'PUBLISHED' },
            { conditionName: 'status', condition: OvicQueryCondition.equal, value: 'CLOSED', orWhere: 'or' }
        ];
        const queryParams: IctuQueryParams = {
            limit: -1,
            paged: 1,
            order: 'DESC',
            orderby: 'created_at',
            include: surveyId,
            include_by: 'survey_id'
        };

        this.surveyPlanService.loadData(condition, queryParams).pipe(
            map(res => ((res.data || []) as SurveyPlan[]).filter(plan => Number(plan.survey_id) === surveyId))
        ).subscribe({
            next: (plans) => {
                if (this.selectedSurveyId !== surveyId) return;
                this.listPlans = plans;
                this.isLoadingPlans = false;
                this.changeDetectorRef.detectChanges();
            },
            error: () => {
                if (this.selectedSurveyId !== surveyId) return;
                this.listPlans = [];
                this.isLoadingPlans = false;
                this.notifi.toastError('Không thể tải danh sách đợt khảo sát');
            }
        });
    }

    /**
     * Chọn đợt trong accordion → mới load questions/answers thống kê.
     */
    selectPlan(planId: number): void {
        if (this.selectedPlanId === planId) return;

        this.statsRequestVersion++;
        this.selectedPlanId = planId;
        this.isLoadingStats = false;
        this.notifi.isProcessing(false);
        this.resetStats();
        this.loadStatistics(planId, this.statsRequestVersion);
    }

    /**
     * Load tất cả answers cho 1 câu hỏi cụ thể, tự loop pages
     * cho đến khi đủ recordsFiltered.
     */
    private loadAllAnswersForQuestion(questionId: number, planId: number): Observable<SurveyAnswerRaw[]> {
        const PAGE_SIZE = 999; // server cap

        // Context lãnh đạo khoa nhưng không có course thuộc khoa → không gọi API full answers.
        if (this.allowedCourseIds !== null && this.allowedCourseIds.length === 0) {
            return of([]);
        }

        const loadPage = (paged: number): Observable<{ data: SurveyAnswerRaw[]; total: number }> => {
            const condition: OvicConditionParam[] = [
                {
                    conditionName: 'survey_plan_id',
                    condition: OvicQueryCondition.equal,
                    value: planId.toString()
                },
                {
                    conditionName: 'survey_question_id',
                    condition: OvicQueryCondition.equal,
                    value: questionId.toString()
                }
            ];
            const queryParams: IctuQueryParams & { includeby?: string } = {
                limit: PAGE_SIZE,
                paged: paged,
                ...(this.allowedCourseIds && this.allowedCourseIds.length ? {
                    include: this.allowedCourseIds.join(','),
                    include_by: 'course_id'
                } : {})
            };
            return this.surveyQuestionAnswerService.loadData(condition, queryParams).pipe(
                map(res => ({
                    data: this.filterByAllowedCourses(res.data || []),
                    total: res.recordsFiltered || 0
                }))
            );
        };

        return loadPage(1).pipe(
            expand((res, idx) => {
                // idx = 0 nghĩa là vừa nhận page 1; đã load (idx+1) page
                const loaded = (idx + 1) * PAGE_SIZE;
                return loaded < res.total ? loadPage(idx + 2) : EMPTY;
            }),
            reduce((acc, curr) => acc.concat(curr.data), [] as SurveyAnswerRaw[])
        );
    }

    /**
     * Bảo hiểm lọc client-side theo allowedCourseIds (phòng khi server bỏ qua IN)
     */
    private filterByAllowedCourses(answers: SurveyAnswerRaw[]): SurveyAnswerRaw[] {
        if (!this.allowedCourseIds) return answers; // role khaosat: full
        const allowed = new Set(this.allowedCourseIds.map(String));
        return answers.filter(a => a.course_id != null && allowed.has(String(a.course_id)));
    }

    /**
     * Load toàn bộ dữ liệu thống kê cho đợt khảo sát
     */
    loadStatistics(planId: number, requestVersion: number): void {
        this.isLoadingStats = true;
        this.notifi.isProcessing(true);

        const plan = this.listPlans.find(p => p.id === planId);
        if (!plan) {
            this.isLoadingStats = false;
            this.notifi.isProcessing(false);
            return;
        }
        const survey = this.listSurveys.find(item => Number(item.id) === Number(plan.survey_id));

        const questionParams: IctuQueryParams = {
            limit: -1,
            paged: 1,
            order: 'ASC',
            orderby: 'ordering',
            include: plan.survey_id,
            include_by: 'survey_id'
        };

        this.surveyQuestionService.loadData([], questionParams).pipe(
            map(res => (res.data || []) as SurveyQuestion[]),
            // Với mỗi question → load answers riêng (parallel)
            switchMap(questions => {
                if (!questions.length) {
                    return of({
                        questions,
                        perQuestion: [] as { question: SurveyQuestion; answers: SurveyAnswerRaw[] }[]
                    });
                }
                const answerRequests = questions.map(question =>
                    this.loadAllAnswersForQuestion(question.id, planId).pipe(
                        map(answers => ({ question, answers }))
                    )
                );
                return forkJoin(answerRequests).pipe(
                    map(perQuestion => ({ questions, perQuestion }))
                );
            })
        ).subscribe({
            next: ({ questions, perQuestion }) => {
                if (requestVersion !== this.statsRequestVersion || this.selectedPlanId !== planId) return;

                const totalResponses = perQuestion.reduce((total, item) => total + item.answers.length, 0);
                this.overview = {
                    planTitle: plan.title,
                    surveyTitle: survey?.title || '',
                    totalResponses,
                    totalQuestions: questions.length,
                    startDate: plan.start_date,
                    endDate: plan.end_date,
                    schoolYear: plan.school_year,
                    semester: plan.semester,
                    khoa: plan.khoa || []
                };

                this.resolveComparisonNames(
                    perQuestion,
                    () => {
                        if (requestVersion === this.statsRequestVersion && this.selectedPlanId === planId) {
                            this.assignQuestionStats(perQuestion);
                        }
                    },
                    requestVersion
                );
            },
            error: () => {
                if (requestVersion !== this.statsRequestVersion || this.selectedPlanId !== planId) return;
                this.notifi.toastError('Không thể tải dữ liệu thống kê');
                this.isLoadingStats = false;
                this.notifi.isProcessing(false);
            }
        });
    }

    /**
     * Gom toàn bộ teacher_id/class_id của đợt, resolve tên mỗi danh mục 1 lần,
     * rồi gọi callback để render kết quả.
     */
    private resolveComparisonNames(
        perQuestion: { question: SurveyQuestion; answers: SurveyAnswerRaw[] }[],
        onDone: () => void,
        requestVersion: number
    ): void {
        const allAnswers = perQuestion.flatMap(pq => pq.answers);
        const allTeacherIds = Array.from(new Set(
            allAnswers.map(a => a.teacher_id).filter((id): id is number => id != null)
        ));
        const allClassIds = Array.from(new Set(
            allAnswers.map(a => a.class_id).filter((id): id is number => id != null)
        ));

        const teacherNames = new Map<number, string>();
        const classNames = new Map<number, string>();

        forkJoin({
            users: allTeacherIds.length
                ? this.userService.getUserByItem(allTeacherIds.join(','), 'id')
                : of([]),
            classes: allClassIds.length
                ? this.classesService.getDataClassesByCol('id', allClassIds.join(','))
                : of([])
        }).subscribe({
            next: ({ users, classes }) => {
                if (requestVersion !== this.statsRequestVersion) return;
                users.forEach(user => {
                    if (user.id != null) {
                        teacherNames.set(user.id, user.display_name);
                    }
                });
                classes.forEach(item => {
                    if (item.id == null) return;
                    const name = String(item.name || '').trim();
                    const symbol = String(item.kyhieu || '').trim();
                    const label = name && symbol ? `${name} (${symbol})` : name || symbol;
                    if (label) classNames.set(item.id, label);
                });
                this.teacherNames = teacherNames;
                this.classNames = classNames;
                onDone();
            },
            error: () => {
                if (requestVersion === this.statsRequestVersion) onDone();
            }
        });
    }

    /**
     * Build stats cho tất cả câu và set state hiển thị.
     */
    private assignQuestionStats(perQuestion: { question: SurveyQuestion; answers: SurveyAnswerRaw[] }[]): void {
        this.questionStats = perQuestion.map(({ question, answers }) => ({
            ...this.buildQuestionStat(question, answers),
            selectedOption: null,
            selectedOptionAnswers: []
        }));

        this.hasData = true;
        this.isLoadingStats = false;
        this.notifi.isProcessing(false);
        this.changeDetectorRef.detectChanges();
    }

    /**
     * User nhấn "Xem" ở 1 đáp án → set selectedOption cho câu đó (bảng giáo viên hiện theo đáp án)
     */
    onOptionSelected(stat: QuestionStat, event: { type: 'option' | 'rate' | 'text'; key: string; label: string }): void {
        stat.selectedOption = event;
        stat.selectedOptionAnswers = this.filterOptionAnswers(stat.rawAnswers || [], event);
    }

    /**
     * Lọc answers đúng 1 lần khi chọn đáp án. Không gọi hàm từ template để tránh
     * tạo mảng mới trong mỗi vòng change detection.
     */
    private filterOptionAnswers(
        answers: SurveyAnswerRaw[],
        selected: { type: 'option' | 'rate' | 'text'; key: string; label: string }
    ): SurveyAnswerRaw[] {
        if (selected.type === 'option') {
            if (selected.key === 'other') {
                return answers.filter(a => a.has_other_answer === 1);
            }
            const optionId = selected.key.replace(/^id:/, '');
            return answers.filter(a => String(a.answer_id) === optionId && a.has_other_answer !== 1);
        }

        if (selected.type === 'rate') {
            const star = Number(selected.key);
            return answers.filter(a => Number(a.answer_id ?? a.answer_text) === star);
        }

        const value = String(selected.key || '').trim().toLowerCase();
        return answers.filter(a => String(a.answer_text ?? '').trim().toLowerCase() === value);
    }

    /**
     * Build thống kê cho 1 câu hỏi từ list answers đã filter sẵn.
     */
    private buildQuestionStat(question: SurveyQuestion, answers: SurveyAnswerRaw[]): QuestionStat {
        let data: OptionStatData | RateStatData | TextStatData;

        // Đếm lượt trả lời = số student_id duy nhất (1 người chỉ tính 1 lần)
        const uniqueStudents = new Set(answers.map(a => a.student_id).filter(id => id != null));
        const totalAnswers = uniqueStudents.size || answers.length;

        switch (question.question_type) {
            case 'RADIO':
            case 'SELECT':
            case 'YES_NO':
                data = this.processOptionSingle(question, answers);
                break;
            case 'CHECKBOX':
            case 'MULTI_SELECT':
                data = this.processOptionMultiple(question, answers);
                break;
            case 'RATE':
                data = this.processRate(question, answers);
                break;
            case 'INPUT':
            case 'TEXTAREA':
            case 'DATE':
            case 'TIME':
            default:
                data = this.processText(answers);
                break;
        }
        return { question, totalAnswers, data, rawAnswers: answers };
    }

    /**
     * (Giữ lại làm wrapper cho backward-compat nếu có nơi khác gọi)
     */
    processQuestions(questions: SurveyQuestion[], allAnswers: SurveyAnswerRaw[]): QuestionStat[] {
        return questions.map(question => {
            const questionAnswers = allAnswers.filter(a => a.survey_question_id === question.id);
            return this.buildQuestionStat(question, questionAnswers);
        });
    }

    /**
     * RADIO / SELECT / YES_NO: đếm theo từng option (dùng answer_id)
     */
    private processOptionSingle(question: SurveyQuestion, answers: SurveyAnswerRaw[]): OptionStatData {
        const total = answers.length;
        const countMap: { [key: string]: number } = {};

        // Khởi tạo count = 0 cho tất cả options
        question.answer_options.forEach(opt => {
            countMap[opt.id] = 0;
        });

        let otherCount = 0;
        const otherResponses: string[] = [];

        answers.forEach(answer => {
            // Câu trả lời "Khác" → has_other_answer = 1, nội dung trong answer_text
            if (answer.has_other_answer === 1) {
                otherCount++;
                if (answer.answer_text) {
                    otherResponses.push(answer.answer_text);
                }
                return;
            }
            const value = String(answer.answer_id ?? '');
            if (countMap.hasOwnProperty(value)) {
                countMap[value]++;
            }
        });

        const items = question.answer_options.map(opt => ({
            label: opt.label,
            count: countMap[opt.id],
            percentage: total > 0 ? Math.round((countMap[opt.id] / total) * 100 * 10) / 10 : 0
        }));

        return {
            type: 'option',
            items,
            otherCount: otherCount > 0 ? otherCount : undefined,
            otherPercentage: otherCount > 0 && total > 0 ? Math.round((otherCount / total) * 100 * 10) / 10 : undefined,
            otherResponses: otherResponses.length > 0 ? otherResponses : undefined
        };
    }

    /**
     * CHECKBOX / MULTI_SELECT: mỗi lượt chọn 1 option = 1 record (cùng student_id, nhiều answer_id khác nhau)
     */
    private processOptionMultiple(question: SurveyQuestion, answers: SurveyAnswerRaw[]): OptionStatData {
        const total = answers.length;

        const countMap: { [key: string]: number } = {};
        question.answer_options.forEach(opt => {
            countMap[opt.id] = 0;
        });

        let otherCount = 0;
        const otherResponses: string[] = [];

        answers.forEach(answer => {
            if (answer.has_other_answer === 1) {
                otherCount++;
                if (answer.answer_text) {
                    otherResponses.push(answer.answer_text);
                }
                return;
            }
            const value = String(answer.answer_id ?? '');
            if (countMap.hasOwnProperty(value)) {
                countMap[value]++;
            }
        });

        const items = question.answer_options.map(opt => ({
            label: opt.label,
            count: countMap[opt.id],
            percentage: total > 0 ? Math.round((countMap[opt.id] / total) * 100 * 10) / 10 : 0
        }));

        return {
            type: 'option',
            items,
            otherCount: otherCount > 0 ? otherCount : undefined,
            otherPercentage: otherCount > 0 && total > 0 ? Math.round((otherCount / total) * 100 * 10) / 10 : undefined,
            otherResponses: otherResponses.length > 0 ? otherResponses : undefined
        };
    }

    /**
     * RATE: phân bố theo số sao + tính trung bình (dùng answer_id hoặc answer_text)
     */
    private processRate(question: SurveyQuestion, answers: SurveyAnswerRaw[]): RateStatData {
        const params = question.params as SurveyQuestionRateOption;
        const minStar = params?.min_star && params.min_star > 0 ? params.min_star : 1;
        const maxStar = params?.max_star ?? 5;

        const distribution: { star: number; count: number }[] = [];
        for (let i = minStar; i <= maxStar; i++) {
            distribution.push({ star: i, count: 0 });
        }

        let totalScore = 0;
        let validCount = 0;

        answers.forEach(answer => {
            const raw = answer.answer_id ?? answer.answer_text;
            const value = Number(raw);
            if (!isNaN(value) && value >= minStar && value <= maxStar) {
                const entry = distribution.find(d => d.star === value);
                if (entry) entry.count++;
                totalScore += value;
                validCount++;
            }
        });

        return {
            type: 'rate',
            distribution,
            average: validCount > 0 ? Math.round((totalScore / validCount) * 10) / 10 : 0,
            total: validCount
        };
    }

    /**
     * INPUT / TEXTAREA / DATE / TIME: thu thập text từ answer_text
     */
    private processText(answers: SurveyAnswerRaw[]): TextStatData {
        // Raw items với thời gian
        const rawItems = answers
            .map(a => ({
                value: String(a.answer_text ?? a.answer_id ?? '').trim(),
                createdAt: a.created_at || ''
            }))
            .filter(item => item.value !== '');

        const responses = rawItems.map(item => item.value);

        // Gom nhóm các câu trả lời giống nhau (không phân biệt hoa/thường + trim)
        const groupMap = new Map<string, { display: string; count: number }>();
        responses.forEach(r => {
            const display = r.trim();
            const key = display.toLowerCase();
            if (groupMap.has(key)) {
                groupMap.get(key)!.count++;
            } else {
                groupMap.set(key, { display, count: 1 });
            }
        });

        const total = responses.length;
        const grouped = Array.from(groupMap.values())
            .sort((a, b) => b.count - a.count)
            .map(g => ({
                value: g.display,
                count: g.count,
                percentage: total > 0 ? Math.round((g.count / total) * 100 * 10) / 10 : 0
            }));

        return { type: 'text', responses, grouped, total, rawItems };
    }

    async openExportDialog(): Promise<void> {
        const survey = this.listSurveys.find(item => item.id === this.selectedSurveyId);
        const plan = this.listPlans.find(item => item.id === this.selectedPlanId);
        if (!survey || !plan || !this.questionStats.length) {
            this.notifi.toastWarning('Chưa có dữ liệu thống kê để xuất');
            return;
        }

        try {
            this.notifi.isProcessing(true);
            this.exportContext = await this.surveyExportService.prepareContext(survey, plan, this.questionStats);
            this.exportFacultyOptions = this.surveyExportService.buildFacultyOptions(this.exportContext);
            this.exportCohortOptions = this.surveyExportService.buildCohortOptions(this.exportContext);
            this.exportGroupOptions = this.surveyExportService.buildGroupOptions(this.exportContext);
            const allFilter: SurveyExportFilter = { facultyIds: ['__ALL__'], cohorts: ['__ALL__'], groupIds: ['__ALL__'] };
            this.exportEstimatedRows = this.surveyExportService.countRows(this.exportContext, allFilter);
            this.showExportDialog = true;
        } catch (error) {
            console.error('Survey export preparation failed:', error);
            this.notifi.toastError('Không thể chuẩn bị dữ liệu xuất Excel');
        } finally {
            this.notifi.isProcessing(false);
        }
    }

    onExportFilterChange(filter: SurveyExportFilter): void {
        this.exportEstimatedRows = this.exportContext
            ? this.surveyExportService.countRows(this.exportContext, filter)
            : 0;
    }

    async onExportExcel(filter: SurveyExportFilter): Promise<void> {
        if (!this.exportContext || this.isExporting) return;
        try {
            this.isExporting = true;
            this.notifi.isProcessing(true);
            const count = await this.surveyExportService.export(
                this.exportContext,
                filter,
                this.isLanhDaoKhoaContext ? this.currentFacultyName : ''
            );
            if (count > 0) {
                this.showExportDialog = false;
                this.notifi.toastSuccess(`Đã xuất ${count.toLocaleString('vi-VN')} dòng dữ liệu`);
            } else {
                this.notifi.toastWarning('Không có dữ liệu phù hợp với điều kiện đã chọn');
            }
        } catch (error) {
            console.error('Xuất Excel không thành công:', error);
            this.notifi.toastError('Xuất Excel không thành công');
        } finally {
            this.isExporting = false;
            this.notifi.isProcessing(false);
        }
    }

    /**
     * Reset thống kê
     */
    resetStats(): void {
        this.overview = null;
        this.questionStats = [];
        this.teacherNames = new Map<number, string>();
        this.classNames = new Map<number, string>();
        this.exportContext = null;
        this.exportEstimatedRows = 0;
        this.showExportDialog = false;
        this.hasData = false;
    }

    /**
     * Lấy severity cho tag hiển thị loại câu hỏi
     */
    getQuestionTypeSeverity(type: string): string {
        const map: { [key: string]: string } = {
            'RADIO': 'info',
            'CHECKBOX': 'success',
            'SELECT': 'info',
            'MULTI_SELECT': 'success',
            'YES_NO': 'warning',
            'RATE': 'danger',
            'INPUT': 'secondary',
            'TEXTAREA': 'secondary',
            'DATE': 'warning',
            'TIME': 'warning'
        };
        return map[type] || 'info';
    }

}
