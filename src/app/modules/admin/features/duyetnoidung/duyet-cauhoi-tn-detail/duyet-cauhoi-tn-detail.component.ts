import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { CHUAN_DAU_RA, ROLES } from '@modules/shared/utils/syscat';
import { AuthService } from '@core/services/auth.service';
import { HelperService } from '@core/services/helper.service';
import { NotificationService } from '@core/services/notification.service';
import { CourseQuestionsService } from '@modules/shared/services/course-questions.service';
import { CourseQuestions } from '@modules/shared/models/course-questions';
import { CourseQuestionComment } from '@modules/shared/models/course-question-comment';
import { CourseQuestionCommentService } from '@modules/shared/services/course-question-comment.service';
import { CourseQuestionReportService } from '@shared/services/course-question-report.service';
import { OvicDateTimeService } from '@modules/shared/services/ovic-date-time.service';
import { OvicQueryCondition } from '@core/models/dto';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { catchError, concatMap, forkJoin, from, Observable, of, Subject, switchMap, takeUntil, toArray } from 'rxjs';
import { map } from 'rxjs/operators';
import { BUTTON_YES, BUTTON_NO } from '@core/models/buttons';
import { APP_CONFIGS } from '@env';
import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';
import { CoursePlanActivities } from '@modules/shared/models/course-plan-activities';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { HoidongThamdinhMonhocThanhvien } from '@modules/shared/models/hoidong-thamdinh-monhoc-thanhvien';
import { HoidongThamdinhMonhocThanhvienService } from '@modules/shared/services/hoidong-thamdinh-monhoc-thanhvien.service';
import { CourseTesterResultsDucService } from '@modules/shared/services/course-tester-results-duc.service';
import { ConfigsService } from '@modules/shared/services/configs.service';
import { QuestionTypeRadioAndCheckboxComponent } from '../../cauhoi-tracnghiem-v2/question-types-view/question-type-radio-and-checkbox/question-type-radio-and-checkbox.component';
import { QuestionTypeInputboxComponent } from '../../cauhoi-tracnghiem-v2/question-types-view/question-type-inputbox/question-type-inputbox.component';
import { QuestionTypeReorderWordsComponent } from '../../cauhoi-tracnghiem-v2/question-types-view/question-type-reorder-words/question-type-reorder-words.component';
import { QuestionTypeArrangeParagraphsComponent } from '../../cauhoi-tracnghiem-v2/question-types-view/question-type-arrange-paragraphs/question-type-arrange-paragraphs.component';
import { QuestionTypeDragDropComponent } from '../../cauhoi-tracnghiem-v2/question-types-view/question-type-drag-drop/question-type-drag-drop.component';
import { QuestionTypeGroupInputComponent } from '../../cauhoi-tracnghiem-v2/question-types-view/question-type-group-input/question-type-group-input.component';
import { QuestionTypeGroupRadioComponent } from '../../cauhoi-tracnghiem-v2/question-types-view/question-type-group-radio/question-type-group-radio.component';
import { QuestionTypeGroupingComponent } from '../../cauhoi-tracnghiem-v2/question-types-view/question-type-grouping/question-type-grouping.component';
import { TestFormat } from '../../cauhoi-tracnghiem-v2/cauhoi-tracnghiem-create/cauhoi-tracnghiem-create-form/cauhoi-tracnghiem-create-form.component';
import { QuestionTypesModule } from '../../cauhoi-tracnghiem/question-types/question-types.module';
import { SharedModule } from '@modules/shared/shared.module';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { OvicDateTimePipe } from '@modules/shared/pipes/ovic-date-time.pipe';
import { QuestionHistoryComponent } from './question-history/question-history.component';

// ── BroadcastChannel sync ─────────────────────────────────
const SYNC_CHANNEL_NAME = 'duyet-cauhoi-tn-detail-sync';

// ── Constants ─────────────────────────────────────────────
export const REPORT_HEADER_OTHER = 'Nhận xét khác';
const CAP_KHOA = 'cap_khoa';
const DEFAULT_APPROVE_COMMENT = 'Đồng ý duyệt';

// ── Interfaces for dynamic properties ─────────────────────
interface QuestionStatusSnapshot {
    id: number;
    status: number;
    approvedBy?: number;
    approvedAt?: string;
}

interface PendingUndoAction {
    questionId: number;
    role: 'uy_vien' | 'chutich';
    action: 'approve' | 'request_change';
    commentId?: number;
    previousQuestions?: QuestionStatusSnapshot[];
    expiresAt: number;
    isLastQuestion?: boolean;
}

@Component({
    selector: 'app-duyet-cauhoi-tn-detail',
    standalone: true,
    imports: [
        CommonModule,
        QuestionTypesModule,
        SharedModule,
        MatChipsModule,
        QuestionTypeRadioAndCheckboxComponent,
        QuestionTypeInputboxComponent,
        QuestionTypeReorderWordsComponent,
        QuestionTypeArrangeParagraphsComponent,
        QuestionTypeDragDropComponent,
        QuestionTypeGroupInputComponent,
        QuestionTypeGroupRadioComponent,
        QuestionTypeGroupingComponent,
        FormsModule,
        QuestionHistoryComponent,
        OvicDateTimePipe,
    ],
    templateUrl: './duyet-cauhoi-tn-detail.component.html',
    styleUrls: ['./duyet-cauhoi-tn-detail.component.css']
})
export class DuyetCauhoiTnDetailComponent implements OnInit, OnDestroy {
    private location = inject(Location);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private auth = inject(AuthService);
    private helperService = inject(HelperService);
    private noitifi = inject(NotificationService);
    private courseQuestionsService = inject(CourseQuestionsService);
    private courseTesterResultsDucService = inject(CourseTesterResultsDucService);
    private configsService = inject(ConfigsService);
    private courseQuestionCommentService = inject(CourseQuestionCommentService);
    private courseQuestionReportService = inject(CourseQuestionReportService);
    private ovicDateTimeService = inject(OvicDateTimeService);
    private coursePlanActivitiesService = inject(CoursePlanActivitiesService);
    private hoidongThamdinhMonhocThanhvienService = inject(HoidongThamdinhMonhocThanhvienService);
    private elnKhoaHocService = inject(ElnKhoaHocService);
    private domSanitizer = inject(DomSanitizer);
    private titleService = inject(Title);

    // Route params
    questionId: string | null;
    courseId: string | null;
    activityId: string | null;
    cdrId: string | null;

    // Data
    selectedQuestion: CourseQuestions | null = null;
    courseSelected: ElnKhoaHoc | null = null;
    planActivity: CoursePlanActivities | null = null;
    list_question: CourseQuestions[] = [];
    hoidong: HoidongThamdinhMonhocThanhvien[] = [];

    // Roles & identity
    userId: number;
    kd_hoidong: boolean = false;
    kd_uyvien: boolean = false;
    isLanhDaoKhoa: boolean = false;
    isLanhDaoBomon: boolean = false;
    isManager: boolean = false;
    rejectRole: boolean = false;
    no_test_question = APP_CONFIGS.no_test_question;

    // UI
    CHUAN_DAU_RA = CHUAN_DAU_RA;
    REPORT_HEADER_OTHER = REPORT_HEADER_OTHER;
    object_chuandaura = {};
    selectedComment: CourseQuestionComment;
    loading = false;
    showRequestChangeForm = false;
    pendingUndoAction: PendingUndoAction | null = null;
    undoRemainingSeconds = 0;

    // Sync
    private broadcastChannel: BroadcastChannel | null = null;
    private destroy$ = new Subject<void>();
    private undoTimer: any = null;

    // Track các câu mà ủy viên hiện tại đã từng nhận xét cấp gốc (parent_id = 0, cap_hoidong = cap_khoa)
    private commentedQuestionIds = new Set<number>();

    // ── Test mode (kiểm thử trên chính giao diện này) ────
    testMode = false;
    previewChecked = false;
    previewIsCorrect = false;
    previewChildCorrectCount = 0;
    previewChildTotal = 0;
    private initialQuestion: CourseQuestions | null = null;

    get testFormat(): TestFormat {
        return this.courseSelected?.av === 1 ? 'tienganh' : 'monkhac';
    }

    get hasChildResultSummary(): boolean {
        return this.previewChecked && this.previewChildTotal > 0;
    }

    constructor() {
        this.userId = this.auth?.user?.id || 0;
        this.questionId = this.route.snapshot.paramMap.get('questionId');
        this.courseId = this.route.snapshot.queryParamMap.get('courseId');
        this.activityId = this.route.snapshot.queryParamMap.get('activityId');
        this.cdrId = this.route.snapshot.queryParamMap.get('cdrId');
    }

    ngOnInit(): void {
        this.initRoles();
        this.initBroadcastChannel();

        this.route.params.pipe(
            switchMap(params => {
                const newQId = params['questionId'];
                if (newQId && newQId !== this.questionId) {
                    this.questionId = newQId;
                }
                return this.loadFullContext();
            }),
            takeUntil(this.destroy$)
        ).subscribe();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.clearUndoTimer();
        if (this.broadcastChannel) {
            this.broadcastChannel.close();
        }
    }

    // ── Roles ─────────────────────────────────────────────
    private initRoles() {
        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin) || this.auth.userHasRole(ROLES.chuyenvien_pdt) || this.auth.userHasRole(ROLES.hoidongthi_lanhdao);
        this.isLanhDaoKhoa = this.auth.userHasRole(ROLES.lanhdaokhoa);
        this.isLanhDaoBomon = this.auth.userHasRole(ROLES.lanhdaobomon);
        this.rejectRole = this.isManager || this.isLanhDaoBomon || this.isLanhDaoKhoa ? true : false;
        this.kd_hoidong = false;
        this.kd_uyvien = false;
    }

    private loadCouncilRoles(): Observable<HoidongThamdinhMonhocThanhvien[]> {
        if (!this.courseId) {
            this.hoidong = [];
            this.kd_hoidong = false;
            this.kd_uyvien = false;
            return of([]);
        }

        const condition: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.courseId.toString() },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'with', value: 'user' },
            ],
            page: null,
        };

        return this.hoidongThamdinhMonhocThanhvienService.getHoidongThamdinhMonhocThanhvienByPageNew(condition).pipe(
            map(result => {
                this.hoidong = result.data || [];
                const member = this.hoidong.find(item => item.user_id === this.userId);
                this.kd_hoidong = member?.chutich === 1;
                this.kd_uyvien = !!member && member.chutich !== 1;
                return this.hoidong;
            }),
            catchError(() => {
                this.hoidong = [];
                this.kd_hoidong = false;
                this.kd_uyvien = false;
                return of([]);
            })
        );
    }

    /**
     * Load id của các câu mà ủy viên hiện tại đã từng nhận xét (cấp gốc, cap_khoa).
     * Chỉ chạy khi user là ủy viên hội đồng (kd_uyvien). Dùng để loại trừ khi auto-next.
     */
    private loadMyCommentedQuestionIds(): Observable<void> {
        this.commentedQuestionIds.clear();
        if (!this.kd_uyvien || !this.courseId || !this.userId) {
            return of(void 0);
        }

        const condition: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.courseId.toString() },
                { conditionName: 'user_id', condition: OvicQueryCondition.equal, value: this.userId.toString(), orWhere: 'and' },
                { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: '0', orWhere: 'and' },
                { conditionName: 'cap_hoidong', condition: OvicQueryCondition.equal, value: CAP_KHOA, orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'id, course_question_id' },
            ],
            page: null,
        };

        return this.courseQuestionCommentService.getCourseQuestionCommentByPageNew(condition).pipe(
            map(result => {
                (result.data || []).forEach((c: any) => {
                    if (c?.course_question_id) {
                        this.commentedQuestionIds.add(Number(c.course_question_id));
                    }
                });
                return void 0;
            }),
            catchError(() => {
                // Không chặn flow nếu lỗi — chỉ mất khả năng filter
                return of(void 0);
            })
        );
    }

    // ── BroadcastChannel sync ─────────────────────────────
    private initBroadcastChannel() {
        try {
            this.broadcastChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
            this.broadcastChannel.onmessage = (event: MessageEvent) => {
                const payload = event.data;
                if (payload?.type === 'QUESTION_REVIEW_UPDATED' &&
                    payload.questionId === this.questionId &&
                    payload.updatedAt) {
                    this.loadCommentQuestion();
                }
            };
        } catch {
            // Fallback: localStorage events handled by list component
        }
    }

    private emitSyncEvent(questionId = this.questionId) {
        const payload = {
            type: 'QUESTION_REVIEW_UPDATED',
            questionId: questionId?.toString(),
            courseId: this.courseId,
            activityId: this.activityId,
            updatedAt: new Date().toISOString()
        };
        try {
            if (this.broadcastChannel) {
                this.broadcastChannel.postMessage(payload);
            }
            localStorage.setItem('duyet-cauhoi-tn-detail-updated', JSON.stringify(payload));
        } catch {
            // silent
        }
    }

    // ── Load data ─────────────────────────────────────────
    private loadFullContext(): Observable<null> {
        if (!this.questionId || !this.courseId) {
            return of(null);
        }

        this.loading = true;
        this.selectedQuestion = null;
        this.list_question = [];
        this.showRequestChangeForm = false;
        this.exitTestMode();

        const condition: ConditionOption = {
            condition: [
                { conditionName: 'id', condition: OvicQueryCondition.equal, value: this.questionId }
            ],
            set: [{ label: 'limit', value: '1' }],
            page: '1'
        };

        return this.courseQuestionsService.getCourseQuestionsByPageNew(condition).pipe(
            switchMap(result => {
                if (!result.data || result.data.length === 0) {
                    this.loading = false;
                    this.noitifi.toastError('Không tìm thấy câu hỏi');
                    return of(null);
                }

                const question = result.data[0];
                return this.courseQuestionsService.resolveLatestQuestion(question).pipe(
                    switchMap(latestQuestion => {
                        if (!latestQuestion || latestQuestion.status === -3) {
                            this.loading = false;
                            this.noitifi.toastInfo('Câu hỏi không còn hiệu lực');
                            return of(null);
                        }
                        if (latestQuestion.id !== question.id) {
                            this.loading = false;
                            this.noitifi.toastInfo('Đã chuyển đến phiên bản câu hỏi mới nhất');
                            this.navigateToQuestion(latestQuestion.id);
                            return of(null);
                        }
                        this.selectedQuestion = latestQuestion;

                        return forkJoin([
                            this.loadCourseSelected$(),
                            this.loadSelectedQuestionChildren$(latestQuestion)
                        ]).pipe(
                            switchMap(() => forkJoin([
                                this.loadQuestionList$(),
                                this.loadCouncilRoles().pipe(
                                    switchMap(() => this.loadMyCommentedQuestionIds())
                                ),
                                this.loadPlanActivity$()
                            ])),
                            switchMap(() => {
                                this.applyTitleAndSecondaryFeature();
                                return this.loadCommentQuestion$();
                            }),
                            map(() => null)
                        );
                    })
                );
            }),
            catchError(() => {
                this.loading = false;
                this.noitifi.toastError('Không tải được dữ liệu câu hỏi, vui lòng thử lại');
                return of(null);
            })
        );
    }

    /**
     * Tải trực tiếp câu hỏi con của câu đang mở. Không phụ thuộc danh sách CDR,
     * nên detail vẫn có children khi loadQuestionList$ lỗi hoặc không chứa câu hiện tại.
     */
    private loadSelectedQuestionChildren$(question: CourseQuestions): Observable<void> {
        if (!question.id) {
            question.children = [];
            return of(void 0);
        }

        return this.courseQuestionsService.getCourseQuestionsByCol('group_id', question.id).pipe(
            map(children => {
                const activeChildren = (children || []).filter(child => child.status !== -3);
                const referencedIds = new Set<number>(
                    activeChildren
                        .map(child => Number(child.question_root_id))
                        .filter(rootId => rootId > 0)
                );
                question.children = activeChildren
                    .filter(child => !referencedIds.has(Number(child.id)))
                    .sort((a, b) => {
                        const questionNumberA = Number(a.question_number);
                        const questionNumberB = Number(b.question_number);
                        if (questionNumberA !== questionNumberB) {
                            if (!questionNumberA) return 1;
                            if (!questionNumberB) return -1;
                            return questionNumberA - questionNumberB;
                        }
                        return Number(a.id) - Number(b.id);
                    });
            }),
            catchError(() => {
                this.noitifi.toastWarning('Không tải được câu hỏi con');
                return of(void 0);
            })
        );
    }

    /**
     * Load thông tin course (ElnKhoaHoc) theo courseId để lấy đầy đủ av, creator_plan_id, display_name.
     * Chạy đồng bộ trong forkJoin cùng các request khác trong loadFullContext.
     */
    private loadCourseSelected$(): Observable<void> {
        if (!this.courseId) {
            this.courseSelected = null;
            return of(void 0);
        }

        const condition: ConditionOption = {
            condition: [
                { conditionName: 'id', condition: OvicQueryCondition.equal, value: this.courseId.toString() }
            ],
            set: [{ label: 'limit', value: '1' }],
            page: '1'
        };

        return this.elnKhoaHocService.getKhoaHocByPageNew_2(condition).pipe(
            map(result => {
                if (result.data && result.data.length > 0) {
                    this.courseSelected = result.data[0];
                } else {
                    this.courseSelected = null;
                }
            }),
            catchError(() => {
                this.courseSelected = null;
                return of(void 0);
            })
        );
    }

    /**
     * Load thông tin plan activity (bài học) theo activityId để lấy title, week.
     */
    private loadPlanActivity$(): Observable<void> {
        if (!this.activityId || this.activityId === '0') {
            return of(void 0);
        }

        const condition: ConditionOption = {
            condition: [
                { conditionName: 'id', condition: OvicQueryCondition.equal, value: this.activityId.toString() }
            ],
            set: [{ label: 'limit', value: '1' }],
            page: '1'
        };

        return this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition).pipe(
            map(result => {
                if (result.data && result.data.length > 0) {
                    this.planActivity = result.data[0];
                } else {
                    this.planActivity = null;
                }
            }),
            catchError(() => {
                this.planActivity = null;
                return of(void 0);
            })
        );
    }

    /**
     * Set page title = tên plan + course name, set secondary_feature = tên plan.
     * Nếu không có plan cụ thể (activityId = 0), dùng fallback "Duyệt Câu hỏi".
     */
    private applyTitleAndSecondaryFeature(): void {
        const planName = this.getPlanName();
        const courseTitle = this.courseSelected?.title || '';
        const secondaryLabel = planName || 'Duyệt Câu hỏi';

        this.auth.setFeatureSecondary(secondaryLabel);

        if (planName && courseTitle) {
            this.titleService.setTitle(planName + ' - ' + courseTitle);
        } else if (courseTitle) {
            this.titleService.setTitle(courseTitle);
        } else if (planName) {
            this.titleService.setTitle(planName);
        }
    }

    private getPlanName(): string {
        if (!this.planActivity) return '';
        if (this.planActivity.week > 0 && this.planActivity.week < 100) {
            return 'Bài ' + this.planActivity.week;
        }
        return this.planActivity.title || '';
    }

    // FIX #7: Đổi thành Observable, dùng switchMap thay mergeMap
    private loadQuestionList$(): Observable<void> {
        if (!this.courseId) return of(void 0);

        const condition_cdr: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.courseId.toString() },
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
                { conditionName: 'type', condition: OvicQueryCondition.equal, value: 'ACTIVITY_CDR', orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'order_by', value: 'id' },
                { label: 'order', value: 'ASC' },
            ],
            page: null
        };

        if (this.activityId && this.activityId !== '0') {
            condition_cdr.condition.push({ conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: this.activityId.toString(), orWhere: 'and' });
        }

        return this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_cdr)
            .pipe(
                switchMap(_plan_activity => {
                    const _plan_activity_ids = _plan_activity.data.map((f: any) => f.id);

                    if (!_plan_activity_ids.length) {
                        return of({
                            _plan_activity,
                            _question: { data: [] } as any,
                            _results: { data: [] } as any,
                            _timeConfig: null
                        });
                    }

                    const condition_question: ConditionOption = {
                        condition: [
                            { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.courseId.toString() },
                            { conditionName: 'reference', condition: OvicQueryCondition.equal, value: 'course_plan_activities', orWhere: 'and' },
                            { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
                        ],
                        set: [
                            { label: 'limit', value: '-1' },
                            { label: 'include', value: [...new Set(_plan_activity_ids)].toString() },
                            { label: 'include_by', value: 'reference_id' },
                            { label: 'order', value: 'ASC' },
                            { label: 'orderby', value: 'cdr' }
                        ],
                        page: null
                    };

                    return this.courseQuestionsService.getCourseQuestionsByPageNew(condition_question).pipe(
                        switchMap(_question => {
                            const questionIds = (_question.data || []).map(question => question.id);
                            if (!questionIds.length) {
                                return of({ _plan_activity, _question, _results: { data: [] }, _timeConfig: null });
                            }
                            const conditionResult: ConditionOption = {
                                condition: [],
                                set: [
                                    { label: 'limit', value: '-1' },
                                    { label: 'include', value: questionIds.toString() },
                                    { label: 'include_by', value: 'question_id' }
                                ],
                                page: null
                            };
                            const conditionTimeForTest: ConditionOption = {
                                condition: [
                                    { conditionName: 'config_key', condition: OvicQueryCondition.equal, value: 'TIME_FOR_TEST' }
                                ],
                                set: [{ label: 'limit', value: '1' }],
                                page: '1'
                            };
                            return forkJoin({
                                _results: this.courseTesterResultsDucService.getCourseTesterResultsDucByPageNew(conditionResult),
                                _timeConfig: this.configsService.getConfigsByPageNew(conditionTimeForTest).pipe(map(result => result.data[0] || null))
                            }).pipe(map(({ _results, _timeConfig }) => ({
                                _plan_activity,
                                _question,
                                _results,
                                _timeConfig
                            })));
                        })
                    );
                }),
                map(({ _plan_activity, _question, _results, _timeConfig }) => {
                    const parent_question: CourseQuestions[] = [];
                    const timeConfig = Object.assign({ MONKHAC: {}, TIENGANH: {} }, _timeConfig?.params || {});
                    const questions = (_question.data || []) as CourseQuestions[];
                    const referencedIds = new Set<number>(
                        questions
                            .map((question: CourseQuestions) => Number(question.question_root_id))
                            .filter((rootId: number) => rootId > 0)
                    );
                    questions.forEach((f: CourseQuestions) => {
                        if (f.group_id === 0 && !referencedIds.has(Number(f.id))) {
                            f.children = _question.data.filter((m: any) =>
                                m.group_id === f.id && !referencedIds.has(Number(m.id))
                            );
                            this.applyTestSummary(f, _results.data || [], timeConfig);
                            parent_question.push(f);
                        }
                    });
                    let question_list: CourseQuestions[] = [];
                    _plan_activity.data.forEach((f: any) => {
                        const question_cdr = parent_question.filter(m => m.reference_id === f.id);
                        question_list = question_list.concat(question_cdr);
                    });
                    this.list_question = question_list;
                    const enrichedQuestion = this.list_question.find(question => question.id === Number(this.questionId));
                    if (enrichedQuestion) {
                        this.selectedQuestion = enrichedQuestion;
                    }
                }),
                catchError(() => {
                    // non-fatal: next/back may not work but detail still shows
                    return of(void 0);
                })
            );
    }

    private applyTestSummary(question: CourseQuestions, results: any[], timeConfig: any): void {
        const targets = this.courseSelected?.av === 1 && question.children?.length
            ? question.children
            : [question];
        const thresholdMap = this.courseSelected?.av === 1
            ? timeConfig.TIENGANH || {}
            : timeConfig.MONKHAC || {};
        const answers = results.filter(result => targets.some(target => target.id === result.question_id));

        question.count_teacher = answers.length;
        question.count_answer_true = answers.filter(result => result.result === 1).length;
        question.count_answer_false = answers.filter(result => result.result === 0).length;
        question.count_answer_later = answers.filter(result => {
            const target = targets.find(item => item.id === result.question_id) || question;
            const threshold = Number(thresholdMap[target.cdr ?? question.cdr]);
            return threshold > 0 && result.time_to_answer > threshold;
        }).length;
    }

    canCommentQuestion(question: CourseQuestions | null = this.selectedQuestion): boolean {
        return !!question && (
            Number(question.count_teacher) > 0
            || question.old_status === 1
            || Number(question.question_root_id) > 0
            || this.no_test_question
        );
    }

    private getQuestionGroup(question: CourseQuestions): CourseQuestions[] {
        if (this.courseSelected?.av !== 1) {
            return [question];
        }
        return [question, ...(question.children || [])]
            .filter(item => item.status !== -3);
    }

    private ensureLatestQuestion$(question: CourseQuestions): Observable<CourseQuestions | null> {
        return this.courseQuestionsService.resolveLatestQuestion(question).pipe(
            map(latestQuestion => {
                if (!latestQuestion || latestQuestion.status === -3) {
                    this.noitifi.toastInfo('Câu hỏi không còn hiệu lực');
                    this.goBack();
                    return null;
                }
                if (latestQuestion.id !== question.id) {
                    this.noitifi.toastInfo('Đã chuyển đến phiên bản câu hỏi mới nhất');
                    this.navigateToQuestion(latestQuestion.id);
                    return null;
                }
                return question;
            })
        );
    }

    // ── Load comments + reports ───────────────────────────
    // FIX #1/#5: Trả về Observable, guard stale question để tránh overwrite khi navigate nhanh
    private loadCommentQuestion$(): Observable<void> {
        if (!this.selectedQuestion || !this.courseId) return of(void 0);

        // Capture questionId tại thời điểm gọi để guard stale response
        const capturedQuestionId = this.selectedQuestion.id;

        const condition_comment: ConditionOption = {
            condition: [
                { conditionName: 'course_question_id', condition: OvicQueryCondition.equal, value: this.selectedQuestion.id.toString(), orWhere: 'and' },
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.courseId.toString(), orWhere: 'and' },
                { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: '0', orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'with', value: 'user' }
            ],
            page: null
        };

        const condition_reply_comment: ConditionOption = {
            condition: [
                { conditionName: 'course_question_id', condition: OvicQueryCondition.equal, value: this.selectedQuestion.id.toString(), orWhere: 'and' },
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.courseId.toString(), orWhere: 'and' },
                { conditionName: 'parent_id', condition: OvicQueryCondition.notEqual, value: '0', orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'id, parent_id' },
            ],
            page: null,
        };

        const conditionQuestionReport: ConditionOption = {
            condition: [
                { conditionName: 'question_id', condition: OvicQueryCondition.equal, value: this.selectedQuestion.id.toString() },
            ],
            page: '1',
            set: []
        };

        return forkJoin([
            this.courseQuestionCommentService.getCourseQuestionCommentByPageNew(condition_comment),
            this.courseQuestionCommentService.getCourseQuestionCommentByPageNew(condition_reply_comment),
            this.courseQuestionReportService.getDataByPageNew(conditionQuestionReport).pipe(map(m => m.data))
        ]).pipe(
            map(([_comment, _comment_child, _courseQuestionReport]) => {
                // Guard: nếu selectedQuestion đã đổi (user navigate nhanh) → bỏ qua response cũ
                if (!this.selectedQuestion || this.selectedQuestion.id !== capturedQuestionId) {
                    return;
                }

                _comment.data.forEach((f: any) => {
                    f['display_name'] = f.user ? f.user.display_name : 'Không xác định';
                    f['reply_open'] = false;
                    f['textarea_comment'] = '';
                });

                const object_comment: any = {};
                _comment.data.forEach((c: any) => {
                    const count_reply = _comment_child.data.filter((m: any) => m.parent_id === c.id).length;
                    c['count_reply'] = count_reply;

                    const capHoiDong = c.cap_hoidong || CAP_KHOA;
                    if (!object_comment[c.user_id]) {
                        object_comment[c.user_id] = { [CAP_KHOA]: [], display_name: c['display_name'] };
                    }
                    object_comment[c.user_id][capHoiDong]?.push(c);
                });

                this.selectedQuestion['comments'] = [];
                Object.keys(object_comment).forEach((o, key) => {
                    let display_name = 'Ủy viên '.concat((key + 1).toString());
                    if (this.kd_hoidong || this.isLanhDaoKhoa || this.isManager || this.isLanhDaoBomon) {
                        if (o.toString() === this.userId.toString()) {
                            display_name = 'Nhận xét của bạn';
                        } else {
                            display_name = object_comment[o] ? object_comment[o]['display_name'] : 'Không xác định';
                        }
                    } else if (o.toString() === this.userId.toString()) {
                        display_name = 'Nhận xét của bạn';
                    }

                    if (object_comment[o][CAP_KHOA] && object_comment[o][CAP_KHOA].length) {
                        this.selectedQuestion['comments'].push({
                            user_id: Number(o), display_name, cap_hoidong: CAP_KHOA, children: object_comment[o][CAP_KHOA]
                        });
                    }
                });

                this.selectedQuestion['textarea_comment'] = '';
                this.selectedQuestion['_reportQuestions'] = this.mapListReduceQuestionReport(
                    _courseQuestionReport.filter((rp: any) => rp.question_id == this.selectedQuestion.id)
                );
                this.loading = false;
            }),
            catchError(() => {
                this.loading = false;
                this.noitifi.toastError('Lỗi kết nối, vui lòng thử lại');
                return of(void 0);
            })
        );
    }

    /**
     * Public wrapper — dùng khi cần reload comment từ bên ngoài (BroadcastChannel, reloadCurrentQuestion).
     * Tự subscribe + guard stale question.
     */
    loadCommentQuestion() {
        this.loadCommentQuestion$()
            .pipe(takeUntil(this.destroy$))
            .subscribe();
    }

    // ── Helpers ───────────────────────────────────────────
    /**
     * Trích xuất id của comment vừa tạo từ response của addCourseQuestionComment.
     * API có thể trả về: number, {id}, {data:{id}}, {insert_id}, {inserted_id}, {last_id}.
     * Trả về undefined nếu không tìm thấy.
     */
    private extractCommentId(res: any): number | undefined {
        if (res === null || res === undefined) return undefined;
        if (typeof res === 'number' && !isNaN(res)) return res;
        if (typeof res === 'string') {
            const n = Number(res);
            return isNaN(n) ? undefined : n;
        }
        if (typeof res === 'object') {
            const candidate = res.id ?? res.insert_id ?? res.inserted_id ?? res.last_id ?? res.lastInsertId;
            if (candidate !== undefined && candidate !== null) {
                const n = Number(candidate);
                return isNaN(n) ? undefined : n;
            }
            if (res.data) return this.extractCommentId(res.data);
        }
        return undefined;
    }

    // ── Reply ─────────────────────────────────────────────
    openReply(comment: CourseQuestionComment, index_comment: number) {
        comment['reply_open'] = !comment['reply_open'];
        this.selectedComment = comment;
        if (comment['reply_open'] === true) {
            this.loadReplyComment(comment, index_comment);
        }
    }

    loadReplyComment(comment: CourseQuestionComment, index_comment: number) {
        const condition_comment: ConditionOption = {
            condition: [
                { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: comment.id.toString() },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'with', value: 'user' }
            ],
            page: null,
        };

        this.courseQuestionCommentService.getCourseQuestionCommentByPageNew(condition_comment)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (_comment) => {
                    _comment.data.forEach((f: any) => {
                        if (f.user_id === this.userId) {
                            f['display_name'] = 'Phản hồi của bạn';
                            f['my_reply_comment'] = true;
                        } else {
                            if (this.kd_hoidong || this.isManager || this.isLanhDaoKhoa || this.isLanhDaoBomon) {
                                f['display_name'] = 'Không xác định';
                            } else {
                                if (comment.user_id === f.user_id) {
                                    f['display_name'] = 'Ủy viên '.concat((index_comment + 1).toString());
                                } else {
                                    f['display_name'] = 'Ủy viên khác';
                                }
                            }
                        }
                    });
                    comment['reply_comments'] = _comment.data;
                    comment['count_reply'] = _comment.data.length;
                },
                error: () => {
                    this.noitifi.toastError('Lỗi kết nối, vui lòng thử lại');
                }
            });
    }

    saveCommentReply(comment: CourseQuestionComment, activity: CourseQuestions, index_comment: number) {
        const comment_content = comment['textarea_comment']
            ? comment['textarea_comment'].trim()
            : '';

        if (comment_content && comment_content !== '') {
            const data_comment: CourseQuestionComment = {
                course_plan_activity_id: activity.course_plan_activity_id,
                comment: comment_content,
                status: 0,
                user_id: this.userId,
                course_id: Number(this.courseId),
                parent_id: comment.id,
                course_question_id: activity.id
            };

            this.ensureLatestQuestion$(activity).pipe(
                switchMap(latestQuestion => latestQuestion
                    ? this.courseQuestionCommentService.addCourseQuestionComment(data_comment)
                    : of(null)),
                takeUntil(this.destroy$)
            ).subscribe({
                next: result => {
                    if (!result) {
                        return;
                    }
                    this.noitifi.toastSuccess('Đã gửi phản hồi thành công');
                    comment['textarea_comment'] = '';
                    this.loadReplyComment(comment, index_comment);
                    this.emitSyncEvent(activity.id.toString());
                },
                error: () => {
                    this.noitifi.toastError('Lỗi kết nối, vui lòng thử lại');
                }
            });
        } else {
            this.noitifi.toastWarning('Vui lòng nhập phản hồi trước khi gửi');
        }
    }

    // ── Save comment (ủy viên) ──────────────────────────────
    saveComment(status: number, activity: CourseQuestions) {
        if (!this.canCommentQuestion(activity)) {
            this.noitifi.toastWarning('Chưa có giảng viên test, không thể nhận xét');
            return;
        }
        if (status === -1 && !this.showRequestChangeForm) {
            this.showRequestChangeForm = true;
            setTimeout(() => {
                const textarea = document.querySelector('.request-change-textarea') as HTMLTextAreaElement | null;
                textarea?.focus();
            });
            return;
        }

        const noidung = status === 1
            ? DEFAULT_APPROVE_COMMENT
            : (activity['textarea_comment'] ? activity['textarea_comment'].trim() : '');

        if (!noidung) {
            this.noitifi.toastWarning('Vui lòng nhập nội dung cần sửa');
            return;
        }

        const data: CourseQuestionComment = {
            course_plan_activity_id: activity.course_plan_activity_id,
            comment: noidung,
            status,
            user_id: this.auth.user.id,
            course_id: Number(this.courseId),
            parent_id: 0,
            course_question_id: activity.id,
            cap_hoidong: CAP_KHOA
        };

        this.noitifi.isProcessing(true);
        this.ensureLatestQuestion$(activity).pipe(
            switchMap(latestQuestion => latestQuestion
                ? this.courseQuestionCommentService.addCourseQuestionComment(data)
                : of(null)),
            takeUntil(this.destroy$)
        )
            .subscribe({
                next: (createdComment) => {
                    this.noitifi.isProcessing(false);
                    if (!createdComment) {
                        return;
                    }
                    this.noitifi.toastSuccess('Cập nhật thành công');
                    // Đánh dấu câu này đã được ủy viên hiện tại nhận xét → loại khỏi auto-next
                    this.commentedQuestionIds.add(activity.id);
                    this.registerUndoAction({
                        questionId: activity.id,
                        role: 'uy_vien',
                        action: status === 1 ? 'approve' : 'request_change',
                        commentId: this.extractCommentId(createdComment),
                        expiresAt: Date.now() + 10000,
                        isLastQuestion: this.isLastPendingQuestion()
                    });
                    activity['textarea_comment'] = '';
                    this.showRequestChangeForm = false;
                    this.emitSyncEvent(activity.id.toString());
                    this.navigateNextQuestion();
                },
                error: () => {
                    this.noitifi.isProcessing(false);
                    this.noitifi.toastError('Cập nhật thất bại, lỗi kết nối');
                }
            });
    }

    // ── Duyệt nội dung (chủ tịch) ─────────────────────────
    duyetNoidung(activity: CourseQuestions, status: number) {
        if (status === 1) {
            const confirm_data = this.getChairmanApproveConfirmMessage();
            if (confirm_data) {
                this.noitifi.confirm(confirm_data, 'Xác nhận hành động', [BUTTON_YES, BUTTON_NO])
                    .then((a) => {
                        if (a.name === 'yes') {
                            this.updateQuestionByChairman(activity, status);
                        }
                    });
                return;
            }
            this.updateQuestionByChairman(activity, status);
            return;
        }

        const confirm_data = '<div class="alert-duyetnoidung">' +
            '<span>- Bạn đang thực hiện thao tác yêu cầu sửa câu hỏi</span>' +
            '<span>- Chức năng nhận xét cho câu hỏi sẽ bị đóng</span>' +
            '<span>- Bạn có chắc chắn yêu cầu sửa câu hỏi này?</span>' +
            '</div>';

        this.noitifi.confirm(confirm_data, 'Xác nhận hành động', [BUTTON_YES, BUTTON_NO])
            .then((a) => {
                if (a.name === 'yes') {
                    this.updateQuestionByChairman(activity, status);
                }
            });
    }

    private getChairmanApproveConfirmMessage(): string | null {
        const uyVienComments = this.getUyVienComments();
        if (uyVienComments.some(comment => comment.status === -1)) {
            return '<div class="alert-duyetnoidung">' +
                '<span>- Có ủy viên yêu cầu sửa câu hỏi này</span>' +
                '<span>- Bạn có chắc chắn vẫn đồng ý duyệt?</span>' +
                '</div>';
        }
        if (!uyVienComments.length) {
            return '<div class="alert-duyetnoidung">' +
                '<span>- Chưa có ủy viên nào nhận xét</span>' +
                '<span>- Bạn có chắc chắn đồng ý duyệt?</span>' +
                '</div>';
        }
        return null;
    }

    private getUyVienComments(): CourseQuestionComment[] {
        const commentGroups = (this.selectedQuestion?.['comments'] || []) as Array<{
            cap_hoidong?: string;
            children?: CourseQuestionComment[];
        }>;
        return commentGroups
            .filter(group => group.cap_hoidong === CAP_KHOA)
            .reduce((result: CourseQuestionComment[], group) => {
                result.push(...(group.children || []));
                return result;
            }, []);
    }

    private updateQuestionByChairman(activity: CourseQuestions, status: number) {
        const targets = this.getQuestionGroup(activity);
        const previousQuestions: QuestionStatusSnapshot[] = targets.map(question => ({
            id: Number(question.id),
            status: question.status,
            approvedBy: question.approved_by,
            approvedAt: question.approved_at
        }));

        this.noitifi.isProcessing(true);
        this.ensureLatestQuestion$(activity).pipe(
            switchMap(latestQuestion => latestQuestion
                ? this.ovicDateTimeService.getCurrentDateTime()
                : of(null)),
            switchMap(date => {
                if (!date) {
                    return of(null);
                }
                const approvedAt = this.helperService.stringToDateSql(date.toString());
                const updateGroup$ = from(targets).pipe(
                    concatMap(question => this.courseQuestionsService.updateCourseQuestions(question.id, {
                        status,
                        old_status: question.status,
                        approved_by: this.userId,
                        approved_at: approvedAt,
                    })),
                    toArray()
                );
                const comment$: Observable<any> = status === 1
                    ? this.courseQuestionCommentService.addCourseQuestionComment({
                        course_plan_activity_id: activity.course_plan_activity_id,
                        comment: DEFAULT_APPROVE_COMMENT,
                        status,
                        user_id: this.userId,
                        course_id: Number(this.courseId),
                        parent_id: 0,
                        course_question_id: activity.id,
                        cap_hoidong: CAP_KHOA
                    })
                    : of(null);
                return forkJoin({ updated: updateGroup$, createdComment: comment$ });
            }),
            takeUntil(this.destroy$)
        ).subscribe({
            next: result => {
                this.noitifi.isProcessing(false);
                if (!result) {
                    return;
                }
                targets.forEach(question => {
                    question.status = status;
                    question.approved_at = new Date().toString();
                    question.approved_by = this.userId;
                });
                this.noitifi.toastSuccess('Cập nhật thành công');
                this.registerUndoAction({
                    questionId: activity.id,
                    role: 'chutich',
                    action: status === 1 ? 'approve' : 'request_change',
                    commentId: this.extractCommentId(result.createdComment),
                    previousQuestions,
                    expiresAt: Date.now() + 10000,
                    isLastQuestion: this.isLastPendingQuestion()
                });
                this.emitSyncEvent(activity.id.toString());
                this.navigateNextQuestion();
            },
            error: () => {
                this.noitifi.isProcessing(false);
                this.noitifi.toastError('Cập nhật thất bại, Lỗi kết nối');
            }
        });
    }

    // ── Undo ───────────────────────────────────────────────
    private registerUndoAction(action: PendingUndoAction) {
        this.clearUndoTimer();
        this.pendingUndoAction = action;
        this.undoRemainingSeconds = 10;
        this.undoTimer = setInterval(() => {
            if (!this.pendingUndoAction) {
                this.clearUndoTimer();
                return;
            }
            this.undoRemainingSeconds = Math.max(0, Math.ceil((this.pendingUndoAction.expiresAt - Date.now()) / 1000));
            if (this.undoRemainingSeconds <= 0) {
                this.pendingUndoAction = null;
                this.clearUndoTimer();
            }
        }, 1000);
    }

    private clearUndoTimer() {
        if (this.undoTimer) {
            clearInterval(this.undoTimer);
            this.undoTimer = null;
        }
        this.undoRemainingSeconds = 0;
    }

    restorePreviousQuestion() {
        const undoAction = this.pendingUndoAction;
        if (!undoAction || !this.selectedQuestion) return;
        if (Date.now() > undoAction.expiresAt) {
            this.pendingUndoAction = null;
            this.clearUndoTimer();
            this.noitifi.toastWarning('Đã hết thời gian khôi phục');
            return;
        }

        const targetQuestion = this.list_question.find(question => question.id === undoAction.questionId)
            || ({ id: undoAction.questionId } as CourseQuestions);
        const actions: Observable<any>[] = [];
        if (undoAction.commentId) {
            actions.push(this.courseQuestionCommentService.deleteCourseQuestionComment(undoAction.commentId));
        }
        if (undoAction.role === 'chutich') {
            (undoAction.previousQuestions || []).forEach(question => {
                actions.push(this.courseQuestionsService.updateCourseQuestions(question.id, {
                    status: question.status,
                    approved_by: question.approvedBy ?? null,
                    approved_at: question.approvedAt ?? null,
                }));
            });
        }

        this.noitifi.isProcessing(true);
        this.ensureLatestQuestion$(targetQuestion).pipe(
            switchMap(latestQuestion => latestQuestion
                ? (actions.length ? forkJoin(actions).pipe(map(() => true)) : of(true))
                : of(false)),
            takeUntil(this.destroy$)
        )
            .subscribe({
                next: restored => {
                    this.noitifi.isProcessing(false);
                    if (!restored) {
                        return;
                    }
                    this.noitifi.toastSuccess('Đã khôi phục câu trước');
                    // Nếu undo nhận xét của ủy viên → khôi phục lại trạng thái "chưa nhận xét"
                    if (undoAction.role === 'uy_vien') {
                        this.commentedQuestionIds.delete(undoAction.questionId);
                    }
                    this.pendingUndoAction = null;
                    this.clearUndoTimer();
                    this.emitSyncEvent(undoAction.questionId.toString());
                    if (this.selectedQuestion.id === undoAction.questionId) {
                        this.reloadCurrentQuestion();
                    } else {
                        this.navigateToQuestion(undoAction.questionId);
                    }
                },
                error: () => {
                    this.noitifi.isProcessing(false);
                    this.noitifi.toastError('Khôi phục thất bại, vui lòng thử lại');
                }
            });
    }

    // ── Next / Back ───────────────────────────────────────
    /** Navigate to a question by ID — uses absolute route to avoid segment stacking. */
    private navigateToQuestion(questionId: number) {
        this.questionId = questionId.toString();
        this.router.navigate(
            ['/admin/hoi-dong/duyetnoidung/duyet-cauhoi-tn-detail', this.questionId],
            {
                queryParams: {
                    courseId: this.courseId,
                    activityId: this.activityId,
                    cdrId: this.cdrId,
                },
                queryParamsHandling: 'merge',
            },
        );
    }

    /** Auto-advance to the next PENDING question (status === 0) after a successful action. */
    navigateNextQuestion() {
        if (!this.list_question.length || !this.selectedQuestion) {
            return;
        }
        const nextPending = this.findNextPendingQuestion();
        if (nextPending) {
            this.navigateToQuestion(nextPending.id);
        } else {
            const msg = this.kd_uyvien
                ? 'Đã xử lý hết câu chờ duyệt mà bạn chưa nhận xét trong phạm vi hiện tại'
                : 'Đã xử lý hết câu chờ duyệt trong phạm vi hiện tại';
            this.noitifi.toastInfo(msg);
            // Câu cuối: reload lại nhận xét + trạng thái câu hiện tại để UI phản ánh action vừa thực hiện
            this.reloadCurrentQuestion();
        }
    }

    /** Tìm câu kế tiếp thoả: status=0 + (nếu là ủy viên) chưa nhận xét. Dùng chung cho navigate + check "câu cuối". */
    private findNextPendingQuestion(): CourseQuestions | undefined {
        if (!this.list_question.length || !this.selectedQuestion) return undefined;
        const currentIdx = this.list_question.findIndex(q => q.id === this.selectedQuestion?.id);
        const startIdx = currentIdx === -1 ? 0 : currentIdx + 1;
        const currentId = this.selectedQuestion?.id;
        return this.list_question
            .slice(startIdx)
            .find(q => q.status === 0
                && q.id !== currentId
                && (!this.kd_uyvien || !this.commentedQuestionIds.has(q.id))
            );
    }

    /** True nếu sau action hiện tại sẽ không còn câu kế tiếp thoả filter (câu vừa xử lý là câu cuối). */
    private isLastPendingQuestion(): boolean {
        return !this.findNextPendingQuestion();
    }

    /**
     * Reload câu hiện tại (status + nhận xét). Dùng khi đã xử lý hết các câu kế tiếp
     * — không có câu để auto-next, nhưng vẫn cần cập nhật UI cho câu vừa thao tác.
     */
    private reloadCurrentQuestion() {
        if (!this.selectedQuestion || !this.courseId) return;

        // FIX #5: Capture questionId tại thời điểm gọi, guard trước khi ghi kết quả
        const capturedQuestionId = this.selectedQuestion.id;

        const condition: ConditionOption = {
            condition: [
                { conditionName: 'id', condition: OvicQueryCondition.equal, value: this.selectedQuestion.id.toString() }
            ],
            set: [{ label: 'limit', value: '1' }],
            page: '1'
        };

        this.courseQuestionsService.getCourseQuestionsByPageNew(condition).pipe(
            takeUntil(this.destroy$)
        ).subscribe({
            next: (result) => {
                // Guard: nếu đã navigate sang câu khác → bỏ qua
                if (!this.selectedQuestion || this.selectedQuestion.id !== capturedQuestionId) return;

                if (result.data && result.data.length > 0) {
                    const fresh = result.data[0];
                    // Bảo toàn các field UI đã gắn (comments, _reportQuestions, textarea_comment...)
                    this.selectedQuestion.status = fresh.status;
                    this.selectedQuestion.approved_by = (fresh as any).approved_by;
                    this.selectedQuestion.approved_at = (fresh as any).approved_at;
                    // Đồng bộ vào list_question để các filter sau (auto-next) hoạt động đúng
                    const idx = this.list_question.findIndex(q => q.id === fresh.id);
                    if (idx !== -1) {
                        this.list_question[idx].status = fresh.status;
                        (this.list_question[idx] as any).approved_by = (fresh as any).approved_by;
                        (this.list_question[idx] as any).approved_at = (fresh as any).approved_at;
                    }
                }
                this.loadCommentQuestion();
            },
            error: () => {
                // Guard stale trước khi reload comment
                if (!this.selectedQuestion || this.selectedQuestion.id !== capturedQuestionId) return;
                // Không chặn — vẫn cố reload comment
                this.loadCommentQuestion();
            }
        });
    }

    /** Navigate to previous/next question (wraps around). */
    openNewQuestion(action: 'next' | 'back') {
        if (!this.list_question.length || !this.selectedQuestion) {
            this.noitifi.toastWarning('Không có danh sách câu hỏi');
            return;
        }
        const idx = this.list_question.findIndex(q => q.id === this.selectedQuestion.id);
        if (idx === -1) {
            this.noitifi.toastWarning('Không tìm thấy câu hỏi');
            return;
        }

        const nextQ = action === 'next'
            ? (idx + 1 >= this.list_question.length ? this.list_question[0] : this.list_question[idx + 1])
            : (idx - 1 < 0 ? this.list_question[this.list_question.length - 1] : this.list_question[idx - 1]);

        this.navigateToQuestion(nextQ.id);
    }

    // ── Report helpers ────────────────────────────────────
    private mapListReduceQuestionReport(data: any[]): any[] {
        if (!data || data.length === 0) return [];

        const object_group: any = {};
        data.forEach(rp => {
            const header = rp['report_title'];
            if (!object_group[header]) {
                object_group[header] = { header, order: rp['order_report'], stats: [], others: [] };
            }
            if (rp['danhgia_khac'] === 1) {
                object_group[header]['others'].push(rp);
            } else {
                object_group[header]['stats'].push({
                    title: rp['report_answer_title'],
                    order: rp['order'],
                    checkedCount: rp['count_checked'] || 0,
                    total: rp['count_total'] || 0,
                });
            }
        });

        return Object.values(object_group).sort((a: any, b: any) => a.order - b.order);
    }

    checkItemByReport(item: any): string {
        if (item.order === 1) {
            return item.checkedCount > 0 ? 'rp-on' : 'rp-off';
        } else if (item.order === 2) {
            return item.checkedCount > 0 ? 'rp-on' : 'rp-off';
        } else if (item.order === 3) {
            return item.checkedCount > 0 ? 'rp-off' : 'rp-on';
        }
        return '';
    }

    // ── Sanitize ──────────────────────────────────────────
    sanitizeHtml(value: string | null | undefined): string {
        return this.domSanitizer.sanitize(2, value || '') || '';
    }

    // ── Navigation ────────────────────────────────────────
    goBack() {
        this.location.back();
    }

    // ── Test mode (kiểm thử trên chính giao diện) ─────────
    toggleTestMode(): void {
        if (!this.selectedQuestion) return;
        if (this.testMode) {
            this.exitTestMode();
        } else {
            this.initialQuestion = this.cloneQuestion(this.selectedQuestion);
            this.testMode = true;
            this.resetPreview();
        }
    }

    private exitTestMode(): void {
        if (this.testMode && this.initialQuestion && this.selectedQuestion) {
            // Restore original question state when exiting
            this.selectedQuestion = this.cloneQuestion(this.initialQuestion);
        }
        this.testMode = false;
        this.initialQuestion = null;
        this.previewChecked = false;
        this.previewIsCorrect = false;
        this.previewChildCorrectCount = 0;
        this.previewChildTotal = 0;
    }

    checkAnswers(): void {
        if (!this.selectedQuestion) return;
        this.resetQuestionState(this.selectedQuestion);
        this.previewChecked = true;
        this.previewIsCorrect = this.evaluateQuestionCorrectness(this.selectedQuestion, this.testFormat);
        this.updateChildResultSummary();
    }

    resetPreview(): void {
        this.previewChecked = false;
        this.previewIsCorrect = false;
        this.previewChildCorrectCount = 0;
        this.previewChildTotal = 0;
        if (this.selectedQuestion) {
            this.resetQuestionState(this.selectedQuestion);
        }
    }

    retryPreview(): void {
        if (!this.initialQuestion) {
            this.resetPreview();
            return;
        }
        this.selectedQuestion = this.cloneQuestion(this.initialQuestion);
        this.resetPreview();
    }

    private resetQuestionState(q: CourseQuestions): void {
        (q as any)['showCorrectAnswer'] = false;
        if (q.answer_option && q.answer_option.length) {
            q.answer_option.forEach((ans: any) => { ans.isWrong = false; });
        }
        if ((q as any)['answer'] && (q as any)['answer'].length) {
            (q as any)['answer'].forEach((a: any) => { a.isWrong = false; });
        }
        (q as any)['isWrong'] = false;
        (q as any)['isCorrect'] = false;
        if (q.children && q.children.length) {
            q.children.forEach((child: any) => this.resetQuestionState(child));
        }
    }

    private evaluateQuestionCorrectness(q: CourseQuestions, testFormat: TestFormat): boolean {
        switch (q.question_type) {
            case 'radio': return this.evaluateRadio(q);
            case 'checkbox': return this.evaluateCheckbox(q);
            case 'inputbox': return this.evaluateInputbox(q, testFormat);
            case 'group-input': return this.evaluateGroupInput(q);
            case 'group-radio': return this.evaluateGroupRadio(q);
            case 'drag_drop': return this.evaluateDragDrop(q);
            case 'grouping': return this.evaluateGrouping(q);
            case 'reorder_words': return this.evaluateReorderWords(q);
            case 'arrange_paragraphs': return this.evaluateArrangeParagraphs(q);
            default: return false;
        }
    }

    private evaluateRadio(q: CourseQuestions): boolean {
        if (q.children && q.children.length) {
            let allCorrect = true;
            q.children.forEach((child: any) => {
                const correctIds = this.parseCorrectAnswerIds(child.answer_correct);
                const selectedIds = (child.answer_option || []).filter((a: any) => a.isSelected === true).map((a: any) => String(a.id));
                const childCorrect = selectedIds.length === 1 && correctIds.length === 1 && selectedIds[0] === correctIds[0];
                child['showCorrectAnswer'] = true;
                child['isCorrect'] = childCorrect;
                child['isWrong'] = !childCorrect;
                (child.answer_option || []).forEach((ans: any) => { ans.isCorrect = correctIds.includes(String(ans.id)); });
                if (!childCorrect) {
                    (child.answer_option || []).forEach((ans: any) => { if (ans.isSelected && !ans.isCorrect) ans.isWrong = true; });
                    allCorrect = false;
                }
            });
            (q as any)['showCorrectAnswer'] = true;
            return allCorrect;
        }
        const correctIds = this.parseCorrectAnswerIds(q.answer_correct);
        const selectedIds = q.answer_option.filter((a: any) => a.isSelected === true).map((a: any) => String(a.id));
        const userCorrect = selectedIds.length === 1 && correctIds.length === 1 && selectedIds[0] === correctIds[0];
        (q as any)['showCorrectAnswer'] = true;
        q.answer_option.forEach((ans: any) => { ans.isCorrect = correctIds.includes(String(ans.id)); });
        if (!userCorrect) {
            q.answer_option.forEach((ans: any) => { if (ans.isSelected && !ans.isCorrect) ans.isWrong = true; });
        }
        return userCorrect;
    }

    private evaluateCheckbox(q: CourseQuestions): boolean {
        if (q.children && q.children.length) {
            let allCorrect = true;
            q.children.forEach((child: any) => {
                const correctIds = this.parseCorrectAnswerIds(child.answer_correct);
                const selectedIds = (child.answer_option || []).filter((a: any) => a.isSelected === true).map((a: any) => String(a.id));
                const childCorrect = correctIds.length === selectedIds.length && correctIds.every(id => selectedIds.includes(id));
                child['showCorrectAnswer'] = true;
                child['isCorrect'] = childCorrect;
                child['isWrong'] = !childCorrect;
                (child.answer_option || []).forEach((ans: any) => { ans.isCorrect = correctIds.includes(String(ans.id)); });
                if (!childCorrect) {
                    (child.answer_option || []).forEach((ans: any) => { if (ans.isSelected && !ans.isCorrect) ans.isWrong = true; });
                    allCorrect = false;
                }
            });
            (q as any)['showCorrectAnswer'] = true;
            return allCorrect;
        }
        const correctIds = this.parseCorrectAnswerIds(q.answer_correct);
        const selectedIds = q.answer_option.filter((a: any) => a.isSelected === true).map((a: any) => String(a.id));
        const userCorrect = correctIds.length === selectedIds.length && correctIds.every(id => selectedIds.includes(id));
        (q as any)['showCorrectAnswer'] = true;
        q.answer_option.forEach((ans: any) => { ans.isCorrect = correctIds.includes(String(ans.id)); });
        if (!userCorrect) {
            q.answer_option.forEach((ans: any) => { if (ans.isSelected && !ans.isCorrect) ans.isWrong = true; });
        }
        return userCorrect;
    }

    private evaluateInputbox(q: CourseQuestions, testFormat: TestFormat): boolean {
        if (testFormat === 'tienganh') return this.evaluateChildrenInputbox(q);
        return this.evaluateSingleInputbox(q);
    }

    private evaluateSingleInputbox(q: CourseQuestions): boolean {
        if (!q.children || !q.children.length) {
            const correctValues = this.parseCorrectAnswerValues(q.answer_correct);
            const userAnswer = ((q as any)['userAnswer'] || '').toString().trim().toLowerCase();
            const isCorrect = correctValues.some(cv => cv.toLowerCase() === userAnswer);
            (q as any)['showCorrectAnswer'] = true;
            (q as any)['isWrong'] = !isCorrect;
            return isCorrect;
        }
        return this.evaluateChildrenInputbox(q);
    }

    private evaluateChildrenInputbox(q: CourseQuestions): boolean {
        if (!q.children || !q.children.length) return true;
        let allCorrect = true;
        q.children.forEach((child: any) => {
            const correctValues = this.parseCorrectAnswerValues(child.answer_correct);
            const userAnswer = (child['userAnswer'] || '').toString().trim().toLowerCase();
            const childCorrect = correctValues.some(cv => cv.toLowerCase() === userAnswer);
            child['showCorrectAnswer'] = true;
            child['isCorrect'] = childCorrect;
            child['isWrong'] = !childCorrect;
            if (!childCorrect) allCorrect = false;
        });
        return allCorrect;
    }

    private evaluateGroupInput(q: CourseQuestions): boolean {
        if (!q.children || !q.children.length) return true;
        let allCorrect = true;
        q.children.forEach((child: any) => {
            const correctValues = this.parseCorrectAnswerValues(child.answer_correct);
            const userAnswer = (child['userAnswer'] || '').toString().trim().toLowerCase();
            const childCorrect = correctValues.some(cv => cv.toLowerCase() === userAnswer);
            child['showCorrectAnswer'] = true;
            child['isCorrect'] = childCorrect;
            child['isWrong'] = !childCorrect;
            if (!childCorrect) allCorrect = false;
        });
        return allCorrect;
    }

    private evaluateGroupRadio(q: CourseQuestions): boolean {
        if (!q.children || !q.children.length) return true;
        let allCorrect = true;
        q.children.forEach((child: any) => {
            const correctIds = this.parseCorrectAnswerIds(child.answer_correct);
            const selectedIds = child.answer_option.filter((a: any) => a.isSelected === true).map((a: any) => String(a.id));
            const childCorrect = selectedIds.length === 1 && correctIds.length === 1 && selectedIds[0] === correctIds[0];
            child['showCorrectAnswer'] = true;
            child['isCorrect'] = childCorrect;
            child['isWrong'] = !childCorrect;
            child.answer_option.forEach((ans: any) => { ans.isCorrect = correctIds.includes(String(ans.id)); });
            if (!childCorrect) {
                child.answer_option.forEach((ans: any) => { if (ans.isSelected && !ans.isCorrect) ans.isWrong = true; });
                allCorrect = false;
            }
        });
        return allCorrect;
    }

    private evaluateDragDrop(q: CourseQuestions): boolean {
        if (!q.children || !q.children.length) return true;
        let allCorrect = true;
        q.children.forEach((child: any) => {
            const correctId = this.parseCorrectAnswerIdDigits(child.answer_correct);
            const userAnswerItems = child['answer'] || [];
            const selectedAnswer = userAnswerItems[0];
            const childCorrect = userAnswerItems.length === 1 && String(selectedAnswer?.id) === correctId;
            child['showCorrectAnswer'] = true;
            child['isCorrect'] = childCorrect;
            child['isWrong'] = !childCorrect;
            child['correct_id'] = correctId;
            userAnswerItems.forEach((a: any) => { a.isCorrect = String(a.id) === correctId; });
            if (!childCorrect) {
                userAnswerItems.forEach((a: any) => { if (!a.isCorrect) a.isWrong = true; });
                child['isWrong'] = true;
                allCorrect = false;
            }
        });
        return allCorrect;
    }

    private evaluateGrouping(q: CourseQuestions): boolean {
        if (!q.children || !q.children.length) return true;
        let allCorrect = true;
        q.children.forEach((child: any) => {
            const correctIds = this.parseCorrectAnswerIdsSemicolon(child.answer_correct);
            const userAnswerItems = child['answer'] || [];
            const correctIdSet = new Set(correctIds);
            const userAnswerIds = userAnswerItems.map((a: any) => String(a.id));
            const childCorrect = correctIds.length === userAnswerIds.length && userAnswerIds.every((id: string) => correctIdSet.has(id));
            child['showCorrectAnswer'] = true;
            child['isCorrect'] = childCorrect;
            child['isWrong'] = !childCorrect;
            userAnswerItems.forEach((a: any) => { a.isCorrect = correctIdSet.has(String(a.id)); });
            if (!childCorrect) {
                userAnswerItems.forEach((a: any) => { if (!a.isCorrect) a.isWrong = true; });
                child['isWrong'] = true;
                allCorrect = false;
            }
        });
        return allCorrect;
    }

    private evaluateReorderWords(q: CourseQuestions): boolean {
        if (!q.children || !q.children.length) return true;
        let allCorrect = true;
        q.children.forEach((child: any) => {
            const correctWords = String(child.answer_correct || '').split('|').filter((w: string) => w && w !== '');
            const userSentence = (child['userSentence'] || []).join(' ');
            const childCorrect = correctWords.includes(userSentence);
            child['showCorrectAnswer'] = true;
            child['isCorrect'] = childCorrect;
            child['isWrong'] = !childCorrect;
            if (!childCorrect) {
                child['isWrong'] = true;
                allCorrect = false;
            }
        });
        return allCorrect;
    }

    private evaluateArrangeParagraphs(q: CourseQuestions): boolean {
        const targets = q.children && q.children.length ? q.children : [q];
        let allCorrect = true;
        targets.forEach((item: any) => {
            const correctIds = this.parseCorrectAnswerIds(item.answer_correct);
            const userOrderIds = (item.answer_option || []).map((a: any) => String(a.id));
            const itemCorrect = correctIds.length === userOrderIds.length && correctIds.every((id, idx) => id === userOrderIds[idx]);
            item['showCorrectAnswer'] = true;
            item['isCorrect'] = itemCorrect;
            item['isWrong'] = !itemCorrect;
            (item.answer_option || []).forEach((ans: any, idx: number) => {
                const expectedId = idx < correctIds.length ? correctIds[idx] : null;
                ans.isCorrect = expectedId !== null && String(ans.id) === expectedId;
                ans.isWrong = !ans.isCorrect;
            });
            if (!itemCorrect) allCorrect = false;
        });
        return allCorrect;
    }

    private updateChildResultSummary(): void {
        const children = (this.selectedQuestion?.children || []) as any[];
        this.previewChildTotal = children.length;
        this.previewChildCorrectCount = children.filter(child => child.isCorrect === true).length;
    }

    private parseCorrectAnswerIds(answerCorrect: any): string[] {
        if (!answerCorrect) return [];
        return String(answerCorrect).replace(/\|/g, '').split(',').filter(id => id && id !== '');
    }

    private parseCorrectAnswerIdDigits(answerCorrect: any): string {
        if (!answerCorrect) return '';
        return String(answerCorrect).replace(/\D/g, '');
    }

    private parseCorrectAnswerIdsSemicolon(answerCorrect: any): string[] {
        if (!answerCorrect) return [];
        return String(answerCorrect).replace(/\|/g, '').split(';').filter(id => id && id !== '');
    }

    private parseCorrectAnswerValues(answerCorrect: any): string[] {
        if (!answerCorrect) return [];
        return String(answerCorrect).split('|').filter(v => v && v !== '');
    }

    private cloneQuestion(question: CourseQuestions): CourseQuestions {
        const clone = (globalThis as any).structuredClone;
        if (typeof clone === 'function') return clone(question);
        return JSON.parse(JSON.stringify(question));
    }
}
