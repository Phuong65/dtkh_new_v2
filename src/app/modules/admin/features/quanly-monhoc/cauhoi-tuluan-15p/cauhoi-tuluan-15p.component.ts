import { CourseFormDuyetService } from '@modules/shared/services/course-form-duyet.service';
import { CourseFormDuyet } from '@modules/shared/models/course-form-duyet';
import { HoidongThamdinhService } from '@modules/shared/services/hoidong-thamdinh.service';
import { HoidongThamdinhMonhocThanhvienService } from '@modules/shared/services/hoidong-thamdinh-monhoc-thanhvien.service';
import { HoidongThamdinhMonhocThanhvien } from '@modules/shared/models/hoidong-thamdinh-monhoc-thanhvien';
import { CoursePlanTuluanCommentService } from '@modules/shared/services/course-plan-tuluan-comment.service';
import { CoursePlanActivityTuluanTieuchichamService } from '@modules/shared/services/course-plan-activity-tuluan-tieuchicham.service';
import { AiRubricResponse, ApiAiService } from '@modules/shared/services/api-ai.service';
import { CoursePlanActivityTuluanTieuchicham } from '@modules/shared/models/course-plan-activity-tuluan-tieuchicham';
import { CoursePlanActivityTuluanService } from '@shared/services/course-plan-activity-tuluan.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';

import { NotificationService } from '@core/services/notification.service';
import { Component, ElementRef, Input, OnDestroy, OnInit, QueryList, TemplateRef, ViewChild, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { Router } from '@angular/router';
import { OvicQueryCondition } from '@core/models/dto';
import { SharedModule } from '@modules/shared/shared.module';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CoursePlanActivities } from '@modules/shared/models/course-plan-activities';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { CHUAN_DAU_RA, ROLES, ROUTERS } from '@modules/shared/utils/syscat';
import { AuthService } from '@core/services/auth.service';
import { forkJoin, mergeMap, Observable, of, Subscription } from 'rxjs';
import { CoursePlanActivityTuluan } from '@modules/shared/models/course-plan-activity-tuluan';
import { TableModule } from 'primeng/table';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { SplitterModule } from 'primeng/splitter';
import { LoadMediaOnTextDirective } from '@modules/shared/directives/load-media-on-text.directive';
import { ButtonModule } from 'primeng/button';
import { PanelModule } from 'primeng/panel';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DividerModule } from 'primeng/divider';
import { CoursePlanTuluanComment } from '@modules/shared/models/course-plan-tuluan-comment';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { CourseClo } from '@modules/shared/models/course-clo';
import { KatexImgDirective } from "@modules/shared/directives/katex-img.directive";
import { CourseFormTuluan15p } from '@modules/shared/models/course-form-tuluan-15p';
import { CourseFormTuluan15pService } from '@modules/shared/services/course-form-tuluan-15p.service';

export interface LessonFormRow {
    id?: number;
    cdr: number | null;
    originalCdr: number | null;
    ordering: number;
    question_take: number | null;
    point: number | null;
    hasQuestions: boolean;
    error: string;
}

@Component({
    selector: 'app-cauhoi-tuluan-15p',
    standalone: true,
    imports: [
        CommonModule,
        SharedModule,
        FormsModule,
        ReactiveFormsModule,
        TableModule,
        NgbTooltipModule,
        SplitterModule,
        LoadMediaOnTextDirective,
        ButtonModule,
        PanelModule,
        DropdownModule,
        DialogModule,
        InputTextareaModule,
        MatProgressBarModule,
        DividerModule,
        MatListModule,
        KatexImgDirective
    ],
    templateUrl: './cauhoi-tuluan-15p.component.html',
    styleUrls: ['./cauhoi-tuluan-15p.component.css']
})
export class CauhoiTuluan15pComponent implements OnInit, OnDestroy {

    @Input() courseSelected: ElnKhoaHoc;

    @ViewChild('templateQuestion') templateQuestion: TemplateRef<any>;

    @ViewChild('templateFormAddTieuchicham') templateFormAddTieuchicham: TemplateRef<any>;

    @ViewChild('templateViewTuluan') templateViewTuluan: TemplateRef<any>;

    @ViewChild('templatePmsDuan') templatePmsDuan: TemplateRef<any>;

    @ViewChild('templateLessonForm') templateLessonForm: TemplateRef<any>;

    @ViewChild('questionFormBody') questionFormBody: ElementRef<HTMLElement>;

    @ViewChildren('panel_tieuchi') panel_tieuchi: QueryList<any>;

    selectedCourse: ElnKhoaHoc;

    /** Danh sách bài học (cột trái) */
    lessons: CoursePlanActivities[] = [];

    selectPlan: CoursePlanActivities;

    isManager: boolean = false;

    isLanhDaoKhoa: boolean = false;

    isLanhDaoBomon: boolean = false;

    routerAdmin: boolean = false;

    routerDaotao: boolean = false;

    routerLanhdaokhoa: boolean = false;

    routerGiangvien: boolean = false;

    routerLanhdaobomon: boolean = false;

    routerKhaothi: boolean = false;

    userId: number;

    canAdded: boolean = false;

    label_parent_kehoach: string = "Bài";

    closeLeft: boolean = false;

    selectedLesson: CoursePlanActivities | null = null;

    isLoadingLessons: boolean = true;

    isLoadingQuestions: boolean = false;

    lessonFormRows: CourseFormTuluan15p[] = [];

    lessonFormDraftRows: LessonFormRow[] = [];

    lessonFormCdrOptions = CHUAN_DAU_RA.map(item => ({ ...item }));

    questionCdrOptions = CHUAN_DAU_RA.map(item => ({ ...item }));

    selectedQuestionCdr: number | null = null;

    cdrFilteredQuestions: CoursePlanActivityTuluan[] = [];

    hasLessonForm: boolean = false;

    isLessonFormSaveIncomplete: boolean = false;

    isLoadingLessonForm: boolean = false;

    isSavingLessonForm: boolean = false;

    lessonFormLoadError: string = '';

    private removedLessonFormRows: CourseFormTuluan15p[] = [];

    private lessonFormSaveState = new Map<number, CourseFormTuluan15p>();

    private lessonSelectionToken: number = 0;

    isSavingQuestion: boolean = false;

    selectedQuestionPoint: number | null = null;

    deletingQuestionId: number | null = null;

    limit_cauhoi: number = 25;

    total_cauhoi: number = 0;

    formData: FormGroup;

    list_cauhoi: CoursePlanActivityTuluan[] = [];

    selectedCauhoi: CoursePlanActivityTuluan;

    formTitle: string;

    select_private = [
        { label: "Private", id: 1 },
        { label: "Public", id: 0 }
    ]

    chuandaura = CHUAN_DAU_RA;

    number_questions = [
        { key: 1 },
        { key: 2 },
        { key: 3 },
        { key: 4 },
        { key: 5 },
        { key: 6 },
        { key: 7 },
        { key: 8 },
        { key: 9 },
        { key: 10 }
    ]

    isUpdated: boolean = false;

    list_tieuchi_chamdiem: CoursePlanActivityTuluanTieuchicham[] = [];

    totalPointTieuChi: number = 0;

    waitting_title: string;

    progressValue: number = 0;

    displayModal: boolean = false;

    selectedComment: CoursePlanTuluanComment;

    searchCauhoi: string;

    copyTieuchiDuan: CoursePlanActivityTuluan;

    list_clo: CourseClo[];

    search_id_question: string;

    thanhvien_hoidong: HoidongThamdinhMonhocThanhvien[] = [];

    form_duyet: CourseFormDuyet;

    isGeneratingAiRubric: boolean = false;

    aiRubricPreview: string = '';

    aiRubricWarnings: string[] = [];

    aiRubricError: string = '';

    private aiRubricRequest: Subscription | null = null;

    /** Sinh rubric ngay tren the cau hoi (question-a4-card-header) */
    isGeneratingCardRubric: boolean = false;
    isSavingCardRubric: boolean = false;
    showNotePromptDialog: boolean = false;
    notePromptValue: string = '';
    showRubricEditDialog: boolean = false;
    rubricEditValue: string = '';
    cardRubricWarnings: string[] = [];
    cardRubricTarget: CoursePlanActivityTuluan | null = null;
    private cardRubricRequest: Subscription | null = null;

    private questionCdrSubscription: Subscription;

    constructor(
        private notificationService: NotificationService,
        private coursePlanActivitiesService: CoursePlanActivitiesService,
        private router: Router,
        private auth: AuthService,
        private elngUserProfileService: ElngUserProfileService,
        private formBuilder: FormBuilder,
        private coursePlanActivityTuluanService: CoursePlanActivityTuluanService,
        private coursePlanActivityTuluanTieuchichamService: CoursePlanActivityTuluanTieuchichamService,
        private apiAiService: ApiAiService,
        private coursePlanTuluanCommentService: CoursePlanTuluanCommentService,
        private hoidongThamdinhMonhocThanhvienService: HoidongThamdinhMonhocThanhvienService,
        private hoidongThamdinhService: HoidongThamdinhService,
        private courseFormDuyetService: CourseFormDuyetService,
        private courseFormTuluan15pService: CourseFormTuluan15pService,
    ) {
        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin) || this.auth.userHasRole(ROLES.troly_pdt) || this.auth.userHasRole(ROLES.chuyenvien_pdt) ? true : false;

        this.isLanhDaoKhoa = this.auth.userHasRole(ROLES.lanhdaokhoa);

        this.isLanhDaoBomon = this.auth.userHasRole(ROLES.lanhdaobomon);

        this.routerAdmin = this.auth.hasRouter(ROUTERS.admin, '/cauhoi-tuluan-15p');

        this.routerDaotao = this.auth.hasRouter(ROUTERS.daotao, '/cauhoi-tuluan-15p');

        this.routerLanhdaokhoa = this.auth.hasRouter(ROUTERS.lanhdao_khoa, '/cauhoi-tuluan-15p');

        this.routerGiangvien = this.auth.hasRouter(ROUTERS.giangvien, '/cauhoi-tuluan-15p');

        this.routerLanhdaobomon = this.auth.hasRouter(ROUTERS.lanhdao_bomon, '/cauhoi-tuluan-15p');

        this.routerKhaothi = this.auth.hasRouter(ROUTERS.khaothi, '/cauhoi-tuluan-15p');

        this.userId = this.auth.user.id;

        this.formData = this.formBuilder.group(
            {
                ordering: ['0'],
                course_plan_activity_id: ['', Validators.required],
                course_id: ['', Validators.required],
                type: [''],
                cdr: ['', Validators.required],
                private: [''],
                desc: ['', Validators.required],
                status: [''],
                point: [''],
                note: [''], // Hướng dẫn ai chấm điểm
                rubric_markdown: [''],
            }
        );

        this.questionCdrSubscription = this.f['cdr'].valueChanges.subscribe(cdr => {
            this.syncQuestionPointByCdr(cdr);
        });
    }

    ngOnDestroy(): void {
        this.questionCdrSubscription?.unsubscribe();
        this.cancelAiRubricRequest();
        this.cancelCardRubricRequest();
    }

    ngOnInit(): void {
        if (!this.courseSelected) {
            this.notificationService.toastError("Không tìm thấy môn học");
            this.router.navigate(['/admin/content-none']);
            return;
        }

        this.selectedCourse = this.courseSelected;

        this.notificationService.isProcessing(true);

        const condition_user: ConditionOption = {
            condition: [
                { conditionName: 'user_id', condition: OvicQueryCondition.equal, value: this.userId.toString(), orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '1' }
            ],
            page: null
        }

        const course_id = this.selectedCourse.id;

        const condition_thanhvien: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: course_id.toString(), orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'order', value: 'DESC' },
                { label: 'orderby', value: 'chutich' },
                { label: 'with', value: 'user' }
            ],
            page: null
        }

        const condition_course_form_duyet: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: course_id.toString(), orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' }
            ],
            page: null
        }

        forkJoin([
            this.elngUserProfileService.getUserProfileByPageNewV2(condition_user),
            this.hoidongThamdinhMonhocThanhvienService.getHoidongThamdinhMonhocThanhvienByPageNew(condition_thanhvien).pipe(mergeMap(_thanhvien => {
                const hoidongthamdinh_ids = [... new Set(_thanhvien.data.map(m => m.hoidong_thamdinh_id))];
                if (hoidongthamdinh_ids.length) {
                    const condition_hoidong: ConditionOption = {
                        condition: [
                            { conditionName: 'type', condition: OvicQueryCondition.equal, value: 'cauhoi', orWhere: 'and' },
                        ],
                        set: [
                            { label: 'limit', value: '-1' },
                            { label: 'include', value: hoidongthamdinh_ids.toString() },
                            { label: 'include_by', value: 'id' },
                        ],
                        page: null
                    }
                    return this.hoidongThamdinhService.getHoidongThamdinhByPageNew(condition_hoidong).pipe(mergeMap(_hoidong => {
                        if (_hoidong.recordsFiltered) {
                            _thanhvien.data = _thanhvien.data.filter(m => m.hoidong_thamdinh_id === _hoidong.data[0].id);
                            return of(_thanhvien);
                        }
                        return of(null)
                    }))
                }
                return of(null)
            })),
            this.courseFormDuyetService.getCourseFormDuyetByPageNew(condition_course_form_duyet)
        ]).subscribe({
            next: ([_user_profile, _thanhvien, _form_duyet]) => {

                if (_thanhvien) {
                    this.thanhvien_hoidong = _thanhvien.data;
                }

                if (_form_duyet.recordsFiltered)
                    this.form_duyet = _form_duyet.data[0];

                this.loadLessons();

                this.notificationService.isProcessing(false);
            },
            error: () => {
                this.isLoadingLessons = false;
                this.notificationService.isProcessing(false);
            }
        });
    }

    get f() {
        return this.formData.controls;
    }

    /** Tải danh sách bài học (cột trái) */
    loadLessons() {
        this.isLoadingLessons = true;
        const lessonConditions: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse.id.toString(), orWhere: 'and' },
                { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: '0', orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.greaterThan, value: '0', orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.lessThan, value: '100', orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'week' },
            ],
            page: null
        };

        this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(lessonConditions).subscribe({
            next: (_lessons) => {
                this.lessons = _lessons.data;
                this.isLoadingLessons = false;
                if (this.lessons.length) {
                    this.onSelectLesson(this.lessons[0]);
                }
            },
            error: () => {
                this.isLoadingLessons = false;
                this.notificationService.toastError("Không thể tải danh sách bài học");
            }
        });
    }

    /** Chọn bài học → tải form và câu hỏi */
    onSelectLesson(lesson: CoursePlanActivities) {
        if (this.isSavingQuestion || this.isSavingLessonForm || this.deletingQuestionId !== null) {
            this.notificationService.toastWarning('Vui lòng chờ thao tác hiện tại hoàn tất trước khi chuyển bài');
            return;
        }

        this.cancelAiRubricRequest();
        this.notificationService.closeSideNavigationMenu();
        this.selectedLesson = lesson;
        this.list_cauhoi = [];
        this.selectedQuestionCdr = null;
        this.cdrFilteredQuestions = [];
        this.lessonFormRows = [];
        this.lessonFormDraftRows = [];
        this.questionCdrOptions = [];
        this.hasLessonForm = false;
        this.isLessonFormSaveIncomplete = false;
        this.lessonFormLoadError = '';
        this.loadCauhoi();
    }

    loadCauhoi() {
        if (!this.selectedLesson?.id || !this.selectedCourse?.id) {
            return;
        }

        const selectionToken = ++this.lessonSelectionToken;
        const selectedLessonId = this.selectedLesson.id;
        const selectedLessonWeek = this.selectedLesson.week;
        this.hasLessonForm = false;
        this.questionCdrOptions = [];
        this.isLoadingQuestions = true;
        this.isLoadingLessonForm = true;
        this.lessonFormLoadError = '';
        this.notificationService.isProcessing(true);

        forkJoin({
            questions: this.coursePlanActivityTuluanService.getCoursePlanActivityTuluanByPageNew(this.getQuestionCondition(selectedLessonId)),
            lessonForm: this.courseFormTuluan15pService.getByPage(this.getLessonFormCondition(selectedLessonId, selectedLessonWeek))
        }).subscribe({
            next: ({ questions, lessonForm }) => {
                if (!this.isCurrentLessonRequest(selectionToken, selectedLessonId, selectedLessonWeek)) {
                    return;
                }
                this.notificationService.isProcessing(false);

                const serverRows = lessonForm.data || [];
                const hasMismatchedRows = serverRows.some(row =>
                    Number(row.course_id) !== Number(this.selectedCourse.id)
                    || Number(row.course_plan_activity_id) !== Number(selectedLessonId)
                    || Number(row.week) !== Number(selectedLessonWeek)
                );
                if (hasMismatchedRows) {
                    this.list_cauhoi = [];
                    this.lessonFormRows = [];
                    this.questionCdrOptions = [];
                    this.hasLessonForm = false;
                    this.isLoadingQuestions = false;
                    this.isLoadingLessonForm = false;
                    this.lessonFormLoadError = 'Server trả về dữ liệu form không đúng bài đang chọn';
                    this.notificationService.isProcessing(false);
                    this.notificationService.toastError(this.lessonFormLoadError);
                    return;
                }

                const loadedQuestions = questions.data || [];
                loadedQuestions.forEach((question, key) => {
                    question["index_"] = key + 1;
                });

                const loadedRows = [...serverRows]
                    .sort((first, second) => first.ordering - second.ordering);

                this.list_cauhoi = loadedQuestions;
                this.lessonFormRows = loadedRows;
                this.updateLessonFormState();
                this.updateCdrFilteredQuestions();
                this.isLoadingQuestions = false;
                this.isLoadingLessonForm = false;
                this.notificationService.isProcessing(false);
            },
            error: () => {
                if (!this.isCurrentLessonRequest(selectionToken, selectedLessonId, selectedLessonWeek)) {
                    return;
                }
                this.notificationService.isProcessing(false);
                this.isLoadingQuestions = false;
                this.isLoadingLessonForm = false;
                this.hasLessonForm = false;
                this.lessonFormLoadError = 'Không thể tải form nhập câu hỏi của bài';
                this.notificationService.isProcessing(false);
                this.notificationService.toastError("Không thể tải form hoặc danh sách câu hỏi");
            }
        });
    }

    private getQuestionCondition(coursePlanActivityId: number): ConditionOption {
        return {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse.id.toString(), orWhere: 'and' },
                { conditionName: 'course_plan_activity_id', condition: OvicQueryCondition.equal, value: coursePlanActivityId.toString(), orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'ordering' },
                { label: 'with', value: 'tieuchi' }
            ],
            page: null
        };
    }

    private getLessonFormCondition(coursePlanActivityId: number, week: number): ConditionOption {
        return {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse.id.toString(), orWhere: 'and' },
                { conditionName: 'course_plan_activity_id', condition: OvicQueryCondition.equal, value: coursePlanActivityId.toString(), orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.equal, value: week.toString(), orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'ordering' }
            ],
            page: null
        };
    }

    private isCurrentLessonRequest(token: number, lessonId: number, week: number): boolean {
        return token === this.lessonSelectionToken
            && Number(this.selectedLesson?.id) === Number(lessonId)
            && Number(this.selectedLesson?.week) === Number(week);
    }

    private updateLessonFormState() {
        const formCdrs = new Set(this.lessonFormRows.map(row => Number(row.cdr)));

        this.hasLessonForm = this.lessonFormRows.length > 0;
        this.questionCdrOptions = this.hasLessonForm
            ? CHUAN_DAU_RA.filter(cdr => formCdrs.has(cdr.id)).map(cdr => ({ ...cdr }))
            : [];

        if (this.selectedQuestionCdr !== null && !formCdrs.has(Number(this.selectedQuestionCdr))) {
            this.selectedQuestionCdr = null;
        }
    }

    onQuestionCdrFilterChange() {
        this.updateCdrFilteredQuestions();
    }

    private updateCdrFilteredQuestions() {
        this.cdrFilteredQuestions = this.selectedQuestionCdr === null
            ? [...this.list_cauhoi]
            : this.list_cauhoi.filter(question => Number(question.cdr) === Number(this.selectedQuestionCdr));
    }

    retryLoadLessonData() {
        this.loadCauhoi();
    }

    openLessonForm() {
        if (!this.selectedLesson || this.isLoadingLessonForm || this.isSavingLessonForm || this.lessonFormLoadError) {
            return;
        }

        this.removedLessonFormRows = [];
        this.lessonFormSaveState = new Map(
            this.lessonFormRows.filter(row => !!row.id).map(row => [row.id, { ...row }])
        );
        this.lessonFormDraftRows = this.lessonFormRows.map(row => ({
            id: row.id,
            cdr: Number(row.cdr),
            originalCdr: Number(row.cdr),
            ordering: row.ordering,
            question_take: Number(row.question_take),
            point: Number(row.point),
            hasQuestions: this.hasQuestionsForCdr(Number(row.cdr)),
            error: ''
        }));

        if (!this.lessonFormDraftRows.length) {
            this.addLessonFormRow();
        }

        this.notificationService.openSideNavigationMenu({
            template: this.templateLessonForm,
            size: 900,
            offsetTop: '0px'
        });
    }

    addLessonFormRow() {
        const firstAvailableCdr = CHUAN_DAU_RA.find(cdr =>
            !this.lessonFormDraftRows.some(row => Number(row.cdr) === cdr.id)
        );

        this.lessonFormDraftRows.push({
            cdr: firstAvailableCdr?.id ?? null,
            originalCdr: null,
            ordering: this.lessonFormDraftRows.length + 1,
            question_take: 1,
            point: null,
            hasQuestions: firstAvailableCdr ? this.hasQuestionsForCdr(firstAvailableCdr.id) : false,
            error: ''
        });
        this.refreshLessonFormDraftOrdering();
    }

    onLessonFormCdrChange(row: LessonFormRow) {
        const cdr = Number(row.cdr);
        row.hasQuestions = this.hasQuestionsForCdr(cdr);
        row.error = '';
    }

    removeLessonFormRow(row: LessonFormRow) {
        if (row.hasQuestions) {
            this.notificationService.toastWarning('Không thể xóa CDR đã có câu hỏi');
            return;
        }

        const removeRow = () => {
            if (row.id) {
                const savedRow = this.lessonFormRows.find(item => item.id === row.id);
                if (savedRow) {
                    this.removedLessonFormRows.push(savedRow);
                }
            }
            this.lessonFormDraftRows = this.lessonFormDraftRows.filter(item => item !== row);
            this.refreshLessonFormDraftOrdering();
        };

        if (!row.id) {
            removeRow();
            return;
        }

        this.notificationService.confirmDelete('Bạn có chắc muốn xóa dòng CDR này khỏi form?').then(confirmed => {
            if (confirmed) {
                removeRow();
            }
        });
    }

    isLessonFormCdrLocked(row: LessonFormRow): boolean {
        return !!row.id && row.hasQuestions;
    }

    saveLessonForm() {
        if (this.isSavingLessonForm || !this.selectedLesson?.id) {
            return;
        }

        if (!this.validateLessonFormDraft()) {
            this.notificationService.toastWarning('Vui lòng kiểm tra lại dữ liệu form');
            return;
        }

        const lessonId = this.selectedLesson.id;
        const lessonWeek = this.selectedLesson.week;
        this.isSavingLessonForm = true;
        this.notificationService.isProcessing(true);

        this.courseFormTuluan15pService.getByPage(this.getLessonFormCondition(lessonId, lessonWeek)).subscribe({
            next: result => {
                const serverRows = result.data || [];
                const serverIds = serverRows.map(row => row.id).filter(id => !!id).sort();
                const loadedIds = this.lessonFormRows.map(row => row.id).filter(id => !!id).sort();
                const serverStateChanged = serverRows.some(row => {
                    const loadedRow = row.id ? this.lessonFormSaveState.get(row.id) : null;
                    return !loadedRow
                        || Number(loadedRow.cdr) !== Number(row.cdr)
                        || Number(loadedRow.ordering) !== Number(row.ordering)
                        || Number(loadedRow.question_take) !== Number(row.question_take)
                        || Number(loadedRow.point) !== Number(row.point);
                });
                if (serverIds.join(',') !== loadedIds.join(',') || serverStateChanged) {
                    this.handleLessonFormSaveError('Form trên server đã thay đổi. Dữ liệu mới nhất đã được tải lại');
                    return;
                }

                const requests = this.buildLessonFormSaveRequests();
                if (!requests.length) {
                    this.finishLessonFormSave();
                    return;
                }

                this.runSequentialRequests(requests, 0).subscribe({
                    next: () => this.finishLessonFormSave(),
                    error: () => this.handleLessonFormSaveError('Lưu form chưa hoàn tất. Đã tải lại trạng thái thực tế từ server')
                });
            },
            error: () => this.handleLessonFormSaveError('Không thể kiểm tra trạng thái form trên server')
        });
    }

    private validateLessonFormDraft(): boolean {
        if (!this.lessonFormDraftRows.length) {
            return false;
        }

        const cdrCounts = new Map<number, number>();
        this.lessonFormDraftRows.forEach(row => {
            const cdr = Number(row.cdr);
            cdrCounts.set(cdr, (cdrCounts.get(cdr) || 0) + 1);
        });

        let isValid = true;
        this.lessonFormDraftRows.forEach(row => {
            const cdr = Number(row.cdr);
            row.hasQuestions = this.hasQuestionsForCdr(cdr);
            row.error = '';

            if (!CHUAN_DAU_RA.some(item => item.id === cdr)) {
                row.error = 'Vui lòng chọn CDR.';
            } else if ((cdrCounts.get(cdr) || 0) > 1) {
                row.error = 'CDR bị trùng trong form.';
            } else if (row.id && row.originalCdr !== cdr && this.hasQuestionsForCdr(Number(row.originalCdr))) {
                row.error = 'Không thể đổi CDR đã có câu hỏi.';
            } else if (!(Number(row.point) > 0)) {
                row.error = 'Điểm phải lớn hơn 0.';
            } else if (!Number.isInteger(Number(row.question_take)) || Number(row.question_take) <= 0) {
                row.error = 'Số câu lấy phải là số nguyên lớn hơn 0.';
            }

            if (row.error) {
                isValid = false;
            }
        });

        return isValid;
    }

    private buildLessonFormSaveRequests(): Observable<any>[] {
        const requests: Observable<any>[] = [];
        const draftRows = this.lessonFormDraftRows.map((row, index) => ({
            row,
            payload: this.buildLessonFormPayload(row, index + 1)
        }));
        this.removedLessonFormRows.forEach(row => {
            if (row.id) {
                requests.push(this.courseFormTuluan15pService.delete(row.id));
            }
        });

        draftRows.forEach(item => {
            const savedRow = item.row.id ? this.lessonFormSaveState.get(item.row.id) : null;
            if (!savedRow) {
                requests.push(this.courseFormTuluan15pService.add(item.payload));
                return;
            }

            const cdrChanged = Number(savedRow.cdr) !== item.payload.cdr;
            const hasChanges = cdrChanged
                || Number(savedRow.ordering) !== item.payload.ordering
                || Number(savedRow.question_take) !== item.payload.question_take
                || Number(savedRow.point) !== item.payload.point;
            if (cdrChanged) {
                requests.push(this.courseFormTuluan15pService.delete(item.row.id));
                requests.push(this.courseFormTuluan15pService.add(item.payload));
            } else if (hasChanges) {
                requests.push(this.courseFormTuluan15pService.update(item.row.id, item.payload));
            }
        });
        return requests;
    }

    private buildLessonFormPayload(row: LessonFormRow, ordering: number): CourseFormTuluan15p {
        return {
            course_id: this.selectedCourse.id,
            week: this.selectedLesson.week,
            cdr: Number(row.cdr),
            ordering,
            question_take: Number(row.question_take),
            point: Number(row.point),
            course_plan_activity_id: this.selectedLesson.id
        };
    }

    private runSequentialRequests(requests: Observable<any>[], index: number): Observable<any> {
        return requests[index].pipe(mergeMap(() =>
            requests[index + 1] ? this.runSequentialRequests(requests, index + 1) : of(null)
        ));
    }

    private finishLessonFormSave() {
        this.isLessonFormSaveIncomplete = false;
        this.isSavingLessonForm = false;
        this.notificationService.isProcessing(false);
        this.notificationService.toastSuccess('Lưu form thành công');
        this.notificationService.closeSideNavigationMenu();
        this.loadCauhoi();
    }

    private handleLessonFormSaveError(message: string) {
        this.isLessonFormSaveIncomplete = true;
        this.hasLessonForm = false;
        this.questionCdrOptions = [];
        this.isSavingLessonForm = false;
        this.notificationService.isProcessing(false);
        this.notificationService.closeSideNavigationMenu();
        this.notificationService.toastError(message);
        this.loadCauhoi();
    }

    private refreshLessonFormDraftOrdering() {
        this.lessonFormDraftRows.forEach((row, index) => {
            row.ordering = index + 1;
        });
    }

    private hasQuestionsForCdr(cdr: number): boolean {
        return this.list_cauhoi.some(question => Number(question.cdr) === Number(cdr));
    }

    closeLeftBody() {
        this.closeLeft = !this.closeLeft;
    }

    closeSideMenu(reload: boolean = false) {
        this.cancelAiRubricRequest();
        this.notificationService.closeSideNavigationMenu();
        if (reload) {
            this.loadCauhoi();
        }
    }

    openAddCauhoi() {
        if (this.isLoadingLessonForm || this.isSavingLessonForm || !this.hasLessonForm) {
            this.notificationService.toastWarning('Vui lòng tạo và lưu form nhập câu hỏi cho bài này trước');
            return;
        }

        this.formTitle = "Thêm câu hỏi";
        this.formReset();
        this.selectedCauhoi = null;
        this.notificationService.openSideNavigationMenu({ template: this.templateQuestion, size: 1024, offsetTop: '0px' });
    }

    formReset() {
        this.formData.reset();
        this.selectedQuestionPoint = null;
        this.f['course_plan_activity_id'].setValue(this.selectedLesson?.id || 0);
        this.f['course_id'].setValue(this.selectedCourse.id);
        this.f['type'].setValue('QUESTION');
        this.f['private'].setValue(1);
        this.f['status'].setValue(1);
        this.f['ordering'].setValue(0);
        this.isUpdated = false;
        this.cancelAiRubricRequest();
        this.resetAiRubric();
    }

    private syncQuestionPointByCdr(cdr: unknown) {
        const selectedFormRow = this.lessonFormRows.find(row => Number(row.cdr) === Number(cdr));
        this.selectedQuestionPoint = selectedFormRow ? Number(selectedFormRow.point) : null;
        this.f['point'].setValue(this.selectedQuestionPoint, { emitEvent: false });
    }

    editCauhoi(cauhoi: CoursePlanActivityTuluan) {
        if (!this.hasLessonForm || !this.lessonFormRows.some(row => Number(row.cdr) === Number(cauhoi.cdr))) {
            this.notificationService.toastWarning('CDR của câu hỏi không còn thuộc form bài hiện tại');
            return;
        }

        this.formReset();
        this.selectedCauhoi = cauhoi;
        this.f['desc'].setValue(cauhoi.desc);
        this.f['course_plan_activity_id'].setValue(cauhoi.course_plan_activity_id);
        this.f['note'].setValue(cauhoi.note);
        this.f['rubric_markdown'].setValue(cauhoi.rubric_markdown || '');
        this.f['cdr'].setValue(cauhoi.cdr);
        this.isUpdated = true;
        this.notificationService.openSideNavigationMenu({ template: this.templateQuestion, size: 1024, offsetTop: '0px' });
    }

    generateAiRubric() {
        if (this.isGeneratingAiRubric) {
            return;
        }

        const formValue = this.formData.getRawValue();
        const desc = this.normalizeQuestionContent(formValue.desc);
        const note = this.normalizeQuestionContent(formValue.note);

        if (!desc || !note) {
            return this.notificationService.toastWarning("Vui lòng nhập nội dung câu hỏi và hướng dẫn AI chấm");
        }

        const prompt = `Nội dung câu hỏi:\n${formValue.desc}\n\nĐiểm câu hỏi: ${formValue.point}\n\nHướng dẫn AI chấm:\n${formValue.note}`;
        this.isGeneratingAiRubric = true;
        this.aiRubricError = '';

        this.aiRubricRequest = this.apiAiService.getTieuChiChamAi(prompt).subscribe({
            next: (response) => {
                const rubric = this.mapAiRubricResponse(response);
                if (!rubric) {
                    this.aiRubricError = "AI chưa trả về rubric hợp lệ. Vui lòng thử lại";
                    this.finishAiRubricRequest();
                    return;
                }

                this.aiRubricPreview = rubric.rubricMarkdown;
                this.aiRubricWarnings = rubric.warnings;
                this.finishAiRubricRequest();
                setTimeout(() => this.scrollQuestionFormToBottom());
            },
            error: () => {
                this.aiRubricError = "Không thể tạo rubric bằng AI. Vui lòng thử lại";
                this.finishAiRubricRequest();
            }
        });
    }

    resetAiRubric() {
        this.aiRubricPreview = '';
        this.aiRubricWarnings = [];
        this.aiRubricError = '';
    }

    private cancelAiRubricRequest() {
        this.aiRubricRequest?.unsubscribe();
        this.finishAiRubricRequest();
    }

    private finishAiRubricRequest() {
        this.aiRubricRequest = null;
        this.isGeneratingAiRubric = false;
    }

    private scrollQuestionFormToBottom() {
        const formBody = this.questionFormBody?.nativeElement;
        if (formBody) {
            formBody.scrollTo({ top: formBody.scrollHeight, behavior: 'smooth' });
        }
    }

    applyAiRubric() {
        if (!this.aiRubricPreview) {
            return;
        }

        this.f['rubric_markdown'].setValue(this.aiRubricPreview);
        this.resetAiRubric();
        this.saveCauhoi();
    }

    /** Sinh rubric tren the cau hoi: kiem tra "huong dan AI cham" truoc khi goi AI. */
    generateRubricForQuestion(cauhoi: CoursePlanActivityTuluan) {
        if (this.isGeneratingCardRubric || this.isSavingCardRubric) {
            return;
        }

        const existingNote = this.normalizeNote(cauhoi.note);
        if (!existingNote) {
            this.cardRubricTarget = cauhoi;
            this.notePromptValue = '';
            this.showNotePromptDialog = true;
            return;
        }

        this.doGenerateRubricForQuestion(cauhoi, existingNote);
    }

    /** Dong y tu dialog nhap huong dan AI cham (skip = true: bo qua, van sinh rubric) */
    submitNotePrompt(skip: boolean) {
        const target = this.cardRubricTarget;
 if (!target) {
            return;
        }

        this.showNotePromptDialog = false;

        if (skip) {
            this.doGenerateRubricForQuestion(target, '');
            return;
        }

        const enteredNote = this.notePromptValue.trim();
        if (!enteredNote) {
            this.doGenerateRubricForQuestion(target, '');
            return;
        }

        // Luu huong dan AI cham vao cau hoi, sau do sinh rubric
        this.isSavingCardRubric = true;
        this.coursePlanActivityTuluanService.updateCoursePlanActivityTuluan(target.id, { note: enteredNote }).subscribe({
            next: () => {
                this.isSavingCardRubric = false;
                this.doGenerateRubricForQuestion(target, enteredNote);
            },
            error: () => {
                this.isSavingCardRubric = false;
                this.notificationService.toastWarning('Lưu hướng dẫn AI chấm thất bại, vẫn tiếp tục sinh rubric.');
                this.doGenerateRubricForQuestion(target, enteredNote);
            }
        });
    }

    /** Dong dialog nhap huong dan ma khong lam gi them. */
    closeNotePromptDialog() {
        this.showNotePromptDialog = false;
        this.cardRubricTarget = null;
    }

    private doGenerateRubricForQuestion(cauhoi: CoursePlanActivityTuluan, note: string) {
        if (this.isGeneratingCardRubric) {
            return;
        }

        const desc = this.normalizeQuestionContent(cauhoi.desc);
        const prompt = `Nội dung câu hỏi:\n${desc}\n\nĐiểm câu hỏi: ${cauhoi.point ?? ''}\n\nHướng dẫn AI chấm:\n${note}`;
        this.cardRubricTarget = cauhoi;

        this.isGeneratingCardRubric = true;
        this.isSavingCardRubric=false;
        this.cardRubricRequest = this.apiAiService.getTieuChiChamAi(prompt).subscribe({
            next: (response) => {
                const rubric = this.mapAiRubricResponse(response);
                if (!rubric) {
                    this.notificationService.toastError('AI chưa trả về rubric hợp lệ. Vui lòng thử lại');
                    this.finishCardRubricRequest();
                    return;
                }

                this.rubricEditValue = rubric.rubricMarkdown;
                this.cardRubricWarnings = rubric.warnings;
                this.showRubricEditDialog = true;
                this.finishCardRubricRequest();
            },
            error: () => {
                this.notificationService.toastError('Không thể tạo rubric bằng AI. Vui lòng thử lại');
                this.finishCardRubricRequest();
            }
        });
    }

    /** Luu rubric da chinh sua tu dialog vao cau hoi. */
    saveGeneratedCardRubric() {
        if (!this.cardRubricTarget) {
            return;
        }

        const rubricValue = this.rubricEditValue.trim();
        if (!rubricValue) {
            this.notificationService.toastWarning('Rubric không được để trống');
            return;
        }

        this.isSavingCardRubric = true;
        this.coursePlanActivityTuluanService.updateCoursePlanActivityTuluan(this.cardRubricTarget.id, { rubric_markdown: rubricValue }).subscribe({
            next: () => {
                this.isSavingCardRubric=false;
                this.notificationService.toastSuccess('Lưu rubric thành công');
                this.resetCardRubricState();
                this.loadCauhoi();
            },
            error: () => {
                this.isSavingCardRubric=false;
                this.notificationService.toastError('Lưu rubric thất bại');
            }
        });
    }

    /** Dong dialog rubric ma khong luu. */
    closeRubricEditDialog() {
        if (this.isSavingCardRubric) {
            return;
        }

        this.resetCardRubricState();
    }

    private resetCardRubricState() {
        this.showRubricEditDialog = false;
        this.cardRubricTarget = null;
        this.rubricEditValue = '';
        this.cardRubricWarnings = [];
    }

    private cancelCardRubricRequest() {
        this.cardRubricRequest?.unsubscribe();
        this.finishCardRubricRequest();
    }

    private finishCardRubricRequest() {
        this.cardRubricRequest = null;
        this.isGeneratingCardRubric = false;
    }

    private normalizeNote(value: unknown): string {
        const raw = typeof value === 'string' ? value : '';
        return raw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    private normalizeQuestionContent(value: unknown): string {
        return typeof value === 'string' ? value.trim() : '';
    }

    private mapAiRubricResponse(response: unknown): AiRubricResponse | null {
        let parsedResponse: unknown = response;

        if (typeof response === 'string') {
            try {
                parsedResponse = JSON.parse(response);
            } catch {
                return null;
            }
        }

        if (!parsedResponse || typeof parsedResponse !== 'object') {
            return null;
        }

        const rubricResponse = parsedResponse as Record<string, unknown>;
        const rubricMarkdown = typeof rubricResponse['rubricMarkdown'] === 'string'
            ? rubricResponse['rubricMarkdown'].trim()
            : '';

        if (!rubricMarkdown) {
            return null;
        }

        const warnings = Array.isArray(rubricResponse['warnings'])
            ? rubricResponse['warnings'].filter((warning): warning is string => typeof warning === 'string' && !!warning.trim()).map(warning => warning.trim())
            : [];

        return { rubricMarkdown, warnings };
    }

    saveCauhoi(yeucauduyet: boolean = false) {
        if (this.isSavingQuestion) {
            return;
        }

        if (!this.hasLessonForm || this.isLoadingLessonForm || this.isSavingLessonForm) {
            this.notificationService.toastWarning('Vui lòng tạo và lưu form nhập câu hỏi cho bài này trước');
            return;
        }

        const selectedCdr = Number(this.f['cdr'].value);
        const selectedFormRow = this.lessonFormRows.find(row => Number(row.cdr) === selectedCdr);
        if (!selectedFormRow) {
            this.notificationService.toastWarning('CDR đã chọn không thuộc form bài hiện tại');
            return;
        }

        if (this.formData.valid) {
            this.isSavingQuestion = true;
            this.notificationService.isProcessing(true);

            const data = {
                ...this.formData.getRawValue(),
                point: Number(selectedFormRow.point)
            };

            if (yeucauduyet) {
                data['status'] = -2;
            }

            if (this.isUpdated) {
                this.coursePlanActivityTuluanService.updateCoursePlanActivityTuluan(this.selectedCauhoi.id, data).subscribe({
                    next: () => {
                        this.isSavingQuestion = false;
                        this.notificationService.toastSuccess("Sửa thành công");
                        this.closeSideMenu();
                        this.loadCauhoi();
                    },
                    error: () => {
                        this.isSavingQuestion = false;
                        this.notificationService.toastError("Sửa thất bại");
                        this.notificationService.isProcessing(false);
                    }
                })
            } else {
                this.coursePlanActivityTuluanService.addCoursePlanActivityTuluan(data).subscribe({
                    next: () => {
                        this.isSavingQuestion = false;
                        this.notificationService.toastSuccess("Thêm thành công");
                        this.formReset();
                        this.loadCauhoi();
                    },
                    error: () => {
                        this.isSavingQuestion = false;
                        this.notificationService.toastError("Thêm thất bại");
                        this.notificationService.isProcessing(false);
                    }
                })
            }
        } else {
            this.formData.markAllAsTouched();
            this.notificationService.toastWarning("Vui lòng điền đầy đủ thông tin");
        }
    }

    deleteCauhoi(cauhoi: CoursePlanActivityTuluan) {
        this.notificationService.confirmDelete().then(a => {
            if (a) {
                this.deletingQuestionId = cauhoi.id;
                this.notificationService.isProcessing(true);
                forkJoin([
                    this.coursePlanActivityTuluanService.deleteCoursePlanActivityTuluan(cauhoi.id),
                    this.coursePlanActivityTuluanTieuchichamService.deleteCoursePlanActivityTuluanTieuchichamByCol(cauhoi.id.toString(), "course_plan_activity_tuluan_id")
                ]).subscribe({
                    next: () => {
                        this.deletingQuestionId = null;
                        this.notificationService.toastSuccess("Xóa thành công");
                        this.formReset();
                        this.loadCauhoi();
                    },
                    error: () => {
                        this.deletingQuestionId = null;
                        this.notificationService.toastError("Xóa thất bại");
                        this.notificationService.isProcessing(false);
                    }
                })
            }
        })
    }

    pointQuestionKeyDown(event, inputPoint_quest) {
        if (event) {
            if (/[0-9]/.test(event.key) || event.key === '.' || event.key === 'Backspace') {
                if (inputPoint_quest.value.replace(/\d/gi, '').length > 0 && event.key === '.') {
                    event.preventDefault();
                }
            } else {
                event.preventDefault();
            }
        }
    }

    pointQuestionKeyup(event, inputPoint_quest) {
        if (event) {
            if (!isNaN(Number(inputPoint_quest.value))) {
                if (Number(inputPoint_quest.value) > 10) {
                    this.f['point'].setValue(10);
                }
            } else {
                this.f['point'].setValue(0);
            }
        }
    }

    editTieuchi(cauhoi: CoursePlanActivityTuluan) {
        this.selectedCauhoi = cauhoi;
        this.formTitle = "Tạo tiêu chí chấm";
        this.notificationService.openSideNavigationMenu({ template: this.templateFormAddTieuchicham, size: window.innerWidth, offsetTop: '0px' });
        this.loadTieuchicham();
    }

    loadTieuchicham() {
        this.list_tieuchi_chamdiem = [];

        const condition_tieuchicham: ConditionOption = {
            condition: [
                { conditionName: "course_id", condition: OvicQueryCondition.equal, value: this.selectedCauhoi.course_id.toString(), orWhere: "and" },
                { conditionName: "course_plan_activity_tuluan_id", condition: OvicQueryCondition.equal, value: this.selectedCauhoi.id.toString(), orWhere: "and" }
            ],
            set: [
                { label: "limit", value: "-1" },
                { label: "order", value: "ASC" },
                { label: "orderby", value: "ordering" }
            ],
            page: null
        }

        this.notificationService.isProcessing(true);

        this.coursePlanActivityTuluanTieuchichamService.getCoursePlanActivityTuluanTieuchichamByPageNew(condition_tieuchicham).subscribe({
            next: (tieuchi_cham) => {
                tieuchi_cham.data.forEach(f => {
                    f['collapsed'] = true;
                })

                this.list_tieuchi_chamdiem = tieuchi_cham.data;
                this.updateTotalPointTieuChi();

                this.notificationService.isProcessing(false);
            },
            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError("Không thể tải danh sách tiêu chí chấm");
            }
        })
    }

    pointTieuchiKeyup(event, inputPoint_quest, item: CoursePlanActivityTuluanTieuchicham) {
        if (event) {
            if (!isNaN(Number(inputPoint_quest.value))) {
                if (Number(inputPoint_quest.value) > 1) {
                    item.point = 1
                }
            } else {

            }
        }
    }

    deleteTieuchi(item: CoursePlanActivityTuluanTieuchicham) {
        if (!item.id) {
            this.list_tieuchi_chamdiem = this.list_tieuchi_chamdiem.filter(criterion => criterion !== item);
            this.updateTotalPointTieuChi();
            return;
        }

        this.notificationService.confirmDelete().then(a => {
            if (a) {
                this.notificationService.isProcessing(true);
                this.coursePlanActivityTuluanTieuchichamService.deleteCoursePlanActivityTuluanTieuchicham(item.id).subscribe({
                    next: () => {
                        this.notificationService.toastSuccess("Xóa thành công");
                        this.loadTieuchicham();
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError("Xóa thất bại");
                    }
                })
            }
        })
    }

    openHuongdancham(panel, tieuchi: CoursePlanActivityTuluanTieuchicham) {

        tieuchi['collapsed'] = !tieuchi['collapsed'];

        if (this.panel_tieuchi && this.panel_tieuchi.toArray().length) {
            this.panel_tieuchi.toArray().forEach(f => {
                f['animating'] = true;
            })
        }

        if (tieuchi['collapsed'] === false) {
            this.list_tieuchi_chamdiem.filter(m => m.id !== tieuchi.id).map(m => {
                m['collapsed'] = true;
                return m;
            })
        }
    }

    onChangeEditorTieuchi(event, tieuchi: CoursePlanActivityTuluanTieuchicham) {
        tieuchi.desc = event;
    }

    addOneTieuchiChams() {
        const data: CoursePlanActivityTuluanTieuchicham = {
            course_id: this.selectedCourse.id,
            course_plan_activity_tuluan_id: this.selectedCauhoi.id,
            course_plan_activity_id: 0,
            title: '',
            cdr: this.selectedCauhoi.cdr,
            point: 0,
            desc: '',
            ordering: this.list_tieuchi_chamdiem && this.list_tieuchi_chamdiem.length ? this.list_tieuchi_chamdiem[this.list_tieuchi_chamdiem.length - 1].ordering + 1 : 1
        }

        this.notificationService.isProcessing(true);

        this.coursePlanActivityTuluanTieuchichamService.addCoursePlanActivityTuluanTieuchicham(data).subscribe({
            next: () => {
                this.notificationService.toastSuccess("Tạo thành công")
                this.loadTieuchicham();
            },
            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError("Tạo thất bại, vui lòng thử lại")
            }
        })
    }

    updateTotalPointTieuChi() {
        this.totalPointTieuChi = this.list_tieuchi_chamdiem.length
            ? this.list_tieuchi_chamdiem.filter(m => m.point).map(m => Number(parseFloat(m.point.toString()).toFixed(2))).reduce((sum, num) => sum + num, 0)
            : 0;
    }

    saveTieuchiChams() {
        const request: Observable<any>[] = [];
        this.updateTotalPointTieuChi();

        if (this.totalPointTieuChi.toString() !== this.selectedCauhoi.point.toString()) {
            return this.notificationService.toastWarning("Tổng điểm tiêu chỉ phải bằng " + this.selectedCauhoi.point);
        }

        this.list_tieuchi_chamdiem.forEach((f, key) => {

            const data: CoursePlanActivityTuluanTieuchicham = {
                course_id: f.course_id,
                course_plan_activity_tuluan_id: f.course_plan_activity_tuluan_id,
                course_plan_activity_id: 0,
                title: f.title,
                cdr: f.cdr,
                point: f.point,
                desc: f.desc,
                ordering: key + 1
            }

            request.push(f.id
                ? this.coursePlanActivityTuluanTieuchichamService.updateCoursePlanActivityTuluanTieuchicham(f.id, data)
                : this.coursePlanActivityTuluanTieuchichamService.addCoursePlanActivityTuluanTieuchicham(data));

        })

        this.waitting_title = "Đang tạo tiêu chí chấm, vui lòng chờ";

        this.progressValue = 0;

        this.displayModal = true;

        if (request.length) {
            this.loopAddForm(request, 0).subscribe({
                next: () => {
                    this.displayModal = false;
                                this.notificationService.toastSuccess("Tạo thành công");
                    this.loadTieuchicham();
                },
                error: () => {
                    this.displayModal = false;
                    this.notificationService.toastError("Tạo thất bại, vui lòng tải lại danh sách tiêu chí trước khi lưu lại")
                }
            })
        }
    }

    loopAddForm(request: Observable<any>[], key: number): Observable<any> {
        return request[key].pipe(mergeMap(a => {
            this.progressValue = (key + 1) / request.length * 100;
            if (request[key + 1]) {
                return this.loopAddForm(request, key + 1);
            } else {
                return of(null);
            }
        }))
    }

    viewTuluan(cauhoi: CoursePlanActivityTuluan) {
        this.selectedCauhoi = cauhoi;
        this.loadCommentTuluan();
    }

    loadCommentTuluan() {
        const condition_comment: ConditionOption = {
            condition: [
                { conditionName: 'course_plan_activity_tuluan_id', condition: OvicQueryCondition.equal, value: this.selectedCauhoi.id.toString(), orWhere: 'and' },
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse.id.toString(), orWhere: 'and' },
                {
                    conditionName: 'parent_id',
                    condition: OvicQueryCondition.equal,
                    value: '0',
                    orWhere: 'and',
                },
            ],
            set: [
                { label: 'limit', value: '-1' },
            ],
            page: null
        }

        const condition_reply_comment: ConditionOption = {
            condition: [
                { conditionName: 'course_plan_activity_tuluan_id', condition: OvicQueryCondition.equal, value: this.selectedCauhoi.id.toString(), orWhere: 'and' },
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse.id.toString(), orWhere: 'and' },
                {
                    conditionName: 'parent_id',
                    condition: OvicQueryCondition.notEqual,
                    value: '0',
                    orWhere: 'and',
                },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'id, parent_id' },
            ],
            page: null,
        };

        this.notificationService.isProcessing(true);

        forkJoin([
            this.coursePlanTuluanCommentService.getCoursePlanTuluanCommentByPageNew(condition_comment),
            this.coursePlanTuluanCommentService.getCoursePlanTuluanCommentByPageNew(condition_reply_comment),
        ]).subscribe({
            next: ([_comment, _comment_child]) => {
                const object_comment = {};
                _comment.data.forEach((c) => {
                    const count_reply =
                        _comment_child.data.filter(
                            (m) => m.parent_id === c.id
                        ).length;

                    c['count_reply'] = count_reply;
                    c['reply_open'] = false;
                    if (!object_comment[c.user_id]) {
                        object_comment[c.user_id] = [];
                        object_comment[c.user_id].push(c);
                    } else {
                        object_comment[c.user_id].push(c);
                    }
                });

                this.selectedCauhoi['comments'] = [];

                Object.keys(object_comment).forEach(
                    (o, key) => {
                        let display_name = 'Ủy viên '.concat((key + 1).toString());
                        if (o.toString() === this.userId.toString()) {
                            display_name = 'Nhận xét của bạn';
                        }

                        this.selectedCauhoi['comments'].push({
                            user_id: o,
                            display_name: display_name,
                            children: object_comment[o],
                        });
                    }
                );

                this.notificationService.isProcessing(false);

                this.notificationService.openSideNavigationMenu({ template: this.templateViewTuluan, size: window.innerWidth, offsetTop: '0px' });
            },
            error: () => {
                this.notificationService.isProcessing(false);
            }
        })
    }

    openReply(comment: CoursePlanTuluanComment, index_comment: number) {
        comment['reply_open'] = !comment['reply_open'];
        this.selectedComment = comment;
        if (comment['reply_open'] === true) {
            this.loadReplyComment(this.selectedComment, index_comment);
        }
    }

    loadReplyComment(comment: CoursePlanTuluanComment, index_comment) {
        const condition_comment: ConditionOption = {
            condition: [
                { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: comment.id.toString() }
            ],
            set: [
                { label: 'limit', value: '-1' }
            ],
            page: null
        }

        this.coursePlanTuluanCommentService.getCoursePlanTuluanCommentByPageNew(condition_comment).subscribe({
            next: (_comment) => {
                _comment.data.forEach(f => {
                    if (f.user_id === this.selectedCourse.creator_plan_id && this.userId !== f.user_id) {
                        f['display_name'] = this.selectedCourse['user_label'];
                    } else if (f.user_id === this.userId) {
                        f['display_name'] = 'Phản hồi của bạn';
                        f['my_reply_comment'] = true;
                    } else if (comment.user_id === f.user_id) {
                        f['display_name'] = 'Ủy viên '.concat((index_comment + 1).toString());
                    } else {
                        f['display_name'] = 'Ủy viên khác'
                    }
                })

                comment['reply_comments'] = _comment.data;

                comment['count_reply'] = _comment.data.length;

            },

            error: () => {
                this.notificationService.toastError('Lỗi kết nôi, vui lòng thử lại');
            }
        })
    }


    saveCommentReply(comment: CoursePlanTuluanComment, question: CoursePlanActivityTuluan, index_comment: number) {
        const comment_content = comment['textarea_comment'] ? comment['textarea_comment'].trim() : comment['textarea_comment'].trim();
        if (comment_content && comment_content !== '') {
            const data_comment: CoursePlanTuluanComment = {
                course_plan_activity_id: question.course_plan_activity_id,
                comment: comment_content,
                status: 0,
                user_id: this.userId,
                course_id: this.selectedCourse.id,
                parent_id: comment.id,
                course_plan_activity_tuluan_id: question.id
            }

            this.coursePlanTuluanCommentService.addCoursePlanTuluanComment(data_comment).subscribe({
                next: () => {
                    this.notificationService.toastSuccess("Đã gửi phản hồi thành công");
                    comment['textarea_comment'] = '';
                    this.loadReplyComment(this.selectedComment, index_comment);
                },
                error: () => {
                    this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại")
                }
            })
        } else {
            this.notificationService.toastWarning("Vui lòng nhập phản hồi trước khi gửi")
        }
    }

    openListDuanTuCopyTieuchi(cauhoi: CoursePlanActivityTuluan) {
        this.selectedCauhoi = cauhoi;
        this.list_cauhoi.forEach(f => {
            f['hasTieuchi'] = false;
            if (f.tieuchi && f.tieuchi.length && cauhoi.id !== f.id) {
                f['hasTieuchi'] = true;
            }
        })
        this.notificationService.openSideNavigationMenu({ template: this.templatePmsDuan, size: 600, offsetTop: '0px' });
    }

    changeSelecDuan(event: MatSelectionListChange) {
        this.copyTieuchiDuan = event.options[0].value;
    }

    saveTieuchiChamCopy() {
        if (this.copyTieuchiDuan) {
            if (this.copyTieuchiDuan.tieuchi && this.copyTieuchiDuan.tieuchi.length) {
                const request: Observable<any>[] = [];
                this.displayModal = true;
                this.progressValue = 0;
                this.copyTieuchiDuan.tieuchi.forEach(f => {
                    const data: CoursePlanActivityTuluanTieuchicham = {
                        course_id: f.course_id,
                        course_plan_activity_tuluan_id: this.selectedCauhoi.id,
                        course_plan_activity_id: 0,
                        title: f.title,
                        cdr: f.cdr,
                        point: f.point,
                        desc: f.desc,
                        ordering: f.ordering,
                    }
                    request.push(this.coursePlanActivityTuluanTieuchichamService.addCoursePlanActivityTuluanTieuchicham(data));
                })

                this.loopAddForm(request, 0).subscribe({
                    next: () => {
                        this.displayModal = false;
                        this.notificationService.toastSuccess("Sao chép thành công");
                        this.loadCauhoi();
                        this.closeSideMenu();
                    },
                    error: () => {
                        this.notificationService.toastSuccess("Sao chép thất bại, vui lòng thử lại");
                    }
                })
            }
        } else {
            this.notificationService.toastWarning("Vui lòng chọn dự án");
        }
    }
}
