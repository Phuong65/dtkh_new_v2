import { CoursePlanActivityTuluanService } from '@shared/services/course-plan-activity-tuluan.service';
import { request } from 'http';
import { Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, inject, viewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { BUTTON_NO, BUTTON_YES } from '@core/models/buttons';
import { OvicQueryCondition } from '@core/models/dto';
import { FileService } from '@core/services/file.service';
import { HelperService } from '@core/services/helper.service';
import { NotificationService } from '@core/services/notification.service';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { ElnBaiHoc } from '@modules/shared/models/elng-bai-hoc';
import { ElnKhoaHoc, EXAMFORMAT } from '@modules/shared/models/elng-khoa-hoc';
import {
    VideoMarker,
    VideoMarkerQuestion,
} from '@modules/shared/models/video-marker';
import { ElnBaiHocService } from '@modules/shared/services/elearning-bai-hoc.service';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { VideoMarkerQuestionService } from '@modules/shared/services/video-marker-question.service';
import { VideoMarkerService } from '@modules/shared/services/video-marker.service';
import {
    CHUAN_DAU_RA,
    CLASS_ANWSER_COLS,
    CONTENT_ACTIVITY_TYPE,
    CONTENT_LESSON_TYPE,
    CONVERT_TYPE_TEST,
    LARGE_MODAL_OPTIONS,
    TITLE_ACTIVITY_TYPE,
    TITLE_LESSOn_TYPE,
    TYPE_COURSE_QUEST,
    THUONGXUYEN_TEST_TYPE,
    ROLES,
} from '@modules/shared/utils/syscat';
import { Observable, concat, config, forkJoin, map, mergeMap, of, pipe } from 'rxjs';
import { saveAs } from 'file-saver';
import { ElnLessonTestService } from '@modules/shared/services/elearning-lesson-test.service';
import { ElnLessonTest } from '@modules/shared/models/elng-lesson-test';
import { ElnLessonTestQuestion } from '@modules/shared/models/elng-lesson-test-question';
import { ElnLessonTestQuestionService } from '@modules/shared/services/elearning-lesson-test-question.service';
import { AuthService } from '@core/services/auth.service';
import {
    CdkDragDrop,
    DragDropModule,
    moveItemInArray,
    transferArrayItem,
} from '@angular/cdk/drag-drop';
import { NgbModal, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { NORMAL_MODAL_OPTIONS } from '@core/utils/syscat';
import { CoursePlanActivities } from '@modules/shared/models/course-plan-activities';
import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';
import { CourseQuestions } from '@modules/shared/models/course-questions';
import { CourseQuestionsService } from '@modules/shared/services/course-questions.service';
import { CourseQuestionFormService } from '@modules/shared/services/course-question-form.service';
import {
    CourseQuestionForm,
    structure,
} from '@modules/shared/models/course-question-form';
import { OvicDocument, OvicDocumentDownloadResult } from '@core/models/file';
import { CourseBankService } from '@modules/shared/services/course-bank-service';
import { CourseBank } from '@modules/shared/models/course-bank';
import { CoursePlans } from '@modules/shared/models/course-plans';
import { ChuandauraComponent } from '../chuandaura/chuandaura.component';
import { ActivatedRoute, Router } from '@angular/router';
import { DonViService } from '@modules/shared/services/don-vi.service';
import { UserService } from '@core/services/user.service';
import { ConfigsService } from '@modules/shared/services/configs.service';
import { CourseThanhvienService } from '@modules/shared/services/course-thanhvien.service';
import { CoursePlanCommentService } from '@modules/shared/services/course-plan-comment.service';
import { CoursePlanComment } from '@modules/shared/models/course-plan-comment';
import { ClassPlanActivities } from '@modules/shared/models/class-plan-activities';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@modules/shared/shared.module';
import { MatMenuModule } from '@angular/material/menu';
import { TabsModule } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { NhanxetNoidungComponent } from '../nhanxet-noidung/nhanxet-noidung.component';
import { PickListModule } from 'primeng/picklist';
import { PanelModule } from 'primeng/panel';
import { DialogModule } from 'primeng/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { APP_CONFIGS, key_server } from '@env';
import { ThuongxuyenTuluanV2Component } from '../thuongxuyen-tuluan-v2/thuongxuyen-tuluan-v2.component';
import { ButtonModule } from "primeng/button";
import { OvicCkeditorDocumentComponent } from '@modules/shared/components/ovic-ckeditor-document/ovic-ckeditor-document.component';
import { OpenFileManagerV2Component } from '@modules/shared/components/open-file-manager-v2/open-file-manager-v2.component';
import { AudioViewerComponent } from '@modules/shared/components/audio-viewer/audio-viewer.component';
import { TestQuestionReviewComponent } from '@modules/shared/components/test-question-review/test-question-review.component';
import { ViewDocumentComponent } from '@modules/shared/components/view-document/view-document.component';
import { OvicFileIconPipe } from '@modules/shared/pipes/ovic-file-icon.pipe';
import { OvicDateTimePipe } from '@modules/shared/pipes/ovic-date-time.pipe';
import { ThuongxuyenDuanComponent } from '../thuongxuyen-duan/thuongxuyen-duan.component';
import {
    OpenFileManagerDraDropComponent
} from "@shared/components/open-file-manager-dra-drop/open-file-manager-dra-drop.component";

@Component({
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        SharedModule,
        FormsModule,
        MatMenuModule,
        TabsModule,
        TableModule,
        NhanxetNoidungComponent,
        NgbTooltipModule,
        DragDropModule,
        PickListModule,
        PanelModule,
        DialogModule,
        MatProgressBarModule,
        ChuandauraComponent,
        ThuongxuyenTuluanV2Component,
        ButtonModule,
        ThuongxuyenDuanComponent,
        OpenFileManagerDraDropComponent,
        OvicCkeditorDocumentComponent,
        OpenFileManagerV2Component,
        AudioViewerComponent,
        TestQuestionReviewComponent,
        ViewDocumentComponent,
        OvicFileIconPipe,
        OvicDateTimePipe
    ],
    selector: 'app-kehoach',
    templateUrl: './kehoach.component.html',
    styleUrls: ['./kehoach.component.css'],
})
export class KehoachComponent implements OnInit, OnChanges {
    private elnBaiHocService = inject(ElnBaiHocService);
    private noitifi = inject(NotificationService);
    private helperService = inject(HelperService);
    formBuilder = inject(FormBuilder);
    private elnKhoaHocService = inject(ElnKhoaHocService);
    private videoMarkerService = inject(VideoMarkerService);
    private videoMarkerQuestionService = inject(VideoMarkerQuestionService);
    private fileService = inject(FileService);
    private elnLessonTestService = inject(ElnLessonTestService);
    private elnLessonTestQuestionService = inject(ElnLessonTestQuestionService);
    private auth = inject(AuthService);
    private modalService = inject(NgbModal);
    private coursePlanActivitiesService = inject(CoursePlanActivitiesService);
    private courseQuestionsService = inject(CourseQuestionsService);
    private courseQuestionFormService = inject(CourseQuestionFormService);
    private courseBankService = inject(CourseBankService);
    private activatedRoute = inject(ActivatedRoute);
    private router = inject(Router);
    private donViService = inject(DonViService);
    private userService = inject(UserService);
    private configsService = inject(ConfigsService);
    private courseThanhvienService = inject(CourseThanhvienService);
    private coursePlanCommentService = inject(CoursePlanCommentService);
    private coursePlanActivityTuluanService = inject(CoursePlanActivityTuluanService);

    // @Output() onCloseLesson = new EventEmitter<any>();

    readonly templateChooseClasQuestion = viewChild<ElementRef>('templateChooseClasQuestion');

    readonly templateChooseParentPlan = viewChild<ElementRef>('templateChooseParentPlan');

    readonly inputImport = viewChild<ElementRef>('inputImport');

    readonly filesLessonReview = viewChild<ElementRef>('filesLessonReview');

    readonly formAddBaigiang = viewChild<ElementRef>('formAddBaigiang');

    readonly chuandauraComponent = viewChild(ChuandauraComponent);

    courseSelected: ElnKhoaHoc;

    PLAN_RIGHT_KEY:
        | 'chooseTypeContent'
        | 'editPlan'
        | 'editActivity'
        | 'drag-drop'
        | 'chooseLesson'
        | 'editActivityTest'
        | 'lesson'
        | 'editMeet'
        | 'editCdr'
        | 'editMuctieu'
        | 'editGioithieu'
        | 'editOfflineTest'
        | 'edit_kiemtra_thuongxuyen'
        | 'create_test_thuongxuyen'
        | 'thuongxuyen_tuluan'
        | 'thuongxuyen_duan'

    formPlan: FormGroup;

    formQuest: FormGroup;

    list_plan: CoursePlanActivities[] = [];

    selectPlan: CoursePlanActivities;

    smallScreen = false; // < 1524;

    minScreen = 1024;

    closeLeft = false;

    displayModal: boolean;

    progressValue: number;

    titleWaiting = 'Đang đồng bộ, vui lòng chờ...';

    newWeek: number;

    isUpdate = false;

    activeIndex: number;

    dmBaihoc: ElnBaiHoc[];

    idLesssonDelete = [];

    CONTENT_ACTIVITY_TYPE = CONTENT_ACTIVITY_TYPE;

    TITLE_ACTIVITY_TYPE = TITLE_ACTIVITY_TYPE;

    THUONGXUYEN_TEST_TYPE = THUONGXUYEN_TEST_TYPE;

    CHUAN_DAU_RA = CHUAN_DAU_RA;

    EXAMFORMAT = EXAMFORMAT;

    selectActivityId: number;

    nameFileWord = 'Chọn bài test';

    fileInput: string;

    hasContent = false;

    arrayIdImages: any[] = [];

    questionImport: CourseQuestions[];

    list_question: any[];

    option_show_anwser_col = [
        { value: 1 },
        { value: 2 },
        { value: 3 },
        { value: 4 },
    ];

    checkQuestion = {
        noAnswerCorrect: 0,
        noAnswerCorrectArray: [],
    };

    list_question_form: CourseQuestionForm;

    selected_structure: structure;

    targetQuestion: CourseQuestions[];

    sourceQuestion: CourseQuestions[];

    question_chooselist: CourseQuestions[];

    fileWordTest: File;

    TYPE_COURSE_QUEST = TYPE_COURSE_QUEST;

    selectActivityMove: CoursePlanActivities;

    parent_id_before_move: number;

    selectedFileReview: OvicDocument;

    list_question_lesson_test: ElnLessonTestQuestion[];

    planName: string;

    window = window;

    time_video = {
        time_stamp: null,
        time_convert: null,
    };

    form_question_marker: any;

    list_question_in_video: VideoMarker[];

    class_anwser_cols = CLASS_ANWSER_COLS;

    list_open_test = [
        { value: 'SCHEDULED', label: 'Kiểm tra thường xuyên' },
        { value: 'ADDITIONAL', label: 'Bài tập theo tuần' },
    ];

    listCourseBank: CourseBank[] = [];

    listExamCode: CourseQuestions[] = [];

    kd_hoidong: boolean = false;

    kd_uyvien: boolean = false;

    canAdded: boolean = false;

    label_parent_kehoach: string = 'Bài';

    isManager: boolean = false;

    isAdmin: boolean = false;

    isLanhDaoKhoa: boolean = false;

    list_bai_for_test: CoursePlanActivities[];

    list_cdr_for_test: CoursePlanActivities[];

    list_test_thuongxuyen: CoursePlanActivities[];

    showFirstCreatedPlan: boolean = true;

    unlimitLesson: boolean = APP_CONFIGS.unlimitLesson;

    numberAddLesson: number;

    formTitle: string;

    keyServer = key_server;

    indexByKeyServerInSotinchi: number = null;

    loading: boolean = true;
    constructor() {
        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin) || this.auth.userHasRole(ROLES.troly_pdt) || this.auth.userHasRole(ROLES.chuyenvien_pdt) ? true : false;
        this.isLanhDaoKhoa = this.auth.userHasRole(ROLES.lanhdaokhoa);
        this.isAdmin = this.auth.userHasRole(ROLES.manager);
        this.kd_uyvien = this.auth.userHasRole(ROLES.kiemduyet_uyvien);
        this.kd_hoidong = this.auth.userHasRole(ROLES.kiemduyet_hoidong);
        this.formPlan = this.formBuilder.group({
            title: ['', Validators.required],
            type: [''],
            course_id: [''],
            parent_id: [''],
            week: [''],
            desc: [''],
            video: [''],
            videos: [''],
            files: [''],
            slides: [''],
            ordering: [''],
            course_lesson_id: [''],
            forward: [''],
            skip: [''],
            ignore: [''],
            pause_when_change_tap: [''],
            obligatory: [''],
        });
    }

    get fp() {
        return this.formPlan.controls;
    }

    ngOnChanges(changes: SimpleChanges): void {
        // if (changes['courseSelected']) {
        //     if (this.courseSelected) {
        //         this.smallScreen = window.innerWidth < this.minScreen ? true : false;
        //         this.PLAN_RIGHT_KEY = null;
        //         this.selectPlan = null;
        //         this.list_plan = [];
        //         this.selectActivityId = null;
        //         this.loadCoursePlan();
        //     }
        // }
    }

    ngOnInit(): void {
        this.activatedRoute.queryParams.subscribe((params) => {
            if (params && params['code']) {
                const courseId = params['code'];
                const condition_course: ConditionOption = {
                    condition: [
                        {
                            conditionName: 'id',
                            condition: OvicQueryCondition.equal,
                            value: courseId,
                        },
                    ],
                    set: [],
                    page: null,
                };

                const condition_config: ConditionOption = {
                    condition: [
                        {
                            conditionName: 'config_key',
                            condition: OvicQueryCondition.equal,
                            value: 'SETTING',
                        },
                    ],
                    set: [],
                    page: null,
                };

                this.noitifi.isProcessing(true);

                const condition_thanhvien: ConditionOption = {
                    condition: [
                        {
                            conditionName: 'user_id',
                            condition: OvicQueryCondition.equal,
                            value: this.auth.user.id.toString(),
                            orWhere: 'and',
                        },
                        {
                            conditionName: 'course_id',
                            condition: OvicQueryCondition.equal,
                            value: courseId.toString(),
                            orWhere: 'and',
                        },
                    ],
                    set: [{ label: 'limit', value: '-1' }],
                    page: null,
                };

                // if (!this.isManager && !this.isLanhDaoBomon) {
                // }

                forkJoin([
                    this.elnKhoaHocService.getKhoaHocByPageNew_2(condition_course).pipe(mergeMap((_course) => {
                        if (_course.recordsFiltered) {
                            return forkJoin([
                                this.donViService.getDonViById(
                                    _course.data[0].category_ids
                                ),
                                this.userService.getUserByItem(
                                    _course.data[0].creator_plan_id.toString(),
                                    'id'
                                ),
                            ]).pipe(
                                mergeMap(([_donvi, _user]) => {
                                    if (_donvi) {
                                        _course.data[0]['khoa_label'] =
                                            _donvi.title;
                                    }

                                    if (_user.length) {
                                        _course.data[0]['user_label'] =
                                            _user[0].display_name;
                                    }

                                    return of(_course);
                                })
                            );
                        }
                        return of(_course);
                    })
                    ),
                    this.configsService.getConfigsByPageNew(condition_config),
                    this.courseThanhvienService.getCourseThanhvienByPageNew(
                        condition_thanhvien
                    ),
                ]).subscribe({
                    next: ([_course, _config, _thanhvien]) => {
                        this.noitifi.isProcessing(false);


                        if (_thanhvien.recordsFiltered) {
                            this.kd_uyvien = true;
                            this.kd_hoidong = true;
                        }

                        if (_config.recordsFiltered) {
                            this.label_parent_kehoach =
                                _config.data[0].params.plan.prefix;
                        }

                        if (_course.recordsFiltered) {
                            this.courseSelected = _course.data[0];

                            this.indexByKeyServerInSotinchi = key_server == 'hvu' ? (this.courseSelected.params.sotinchi == 2 ? 1 : ([3, 4].includes(this.courseSelected.params.sotinchi) ? 2 : null)) : this.courseSelected.params.sotinchi;
                            this.smallScreen = window.innerWidth < this.minScreen ? true : false;
                            this.PLAN_RIGHT_KEY = null;
                            this.selectPlan = null;
                            this.list_plan = [];
                            this.showFirstCreatedPlan = true;
                            this.selectActivityId = null;
                            // this.auth.addFeatureSecondary = _course.data[ 0 ].title;
                            this.noitifi.setCloseLeftMenu(true);
                            this.auth.setFeatureSecondary(''.concat('[', this.courseSelected.maso, '] - ', this.courseSelected.title));
                            this.canAdded = this.isManager || this.isLanhDaoKhoa || this.auth.user.id === _course.data[0].creator_plan_id ? true : false;
                            this.loadCoursePlan();
                        } else {
                            this.noitifi.toastError(
                                'Không tìm thấy nội dung giảng dạy, vui lòng kiểm tra lại'
                            );
                            this.router.navigate(['/admin/content-none']);
                        }
                    },
                    error: () => {
                        this.noitifi.isProcessing(false);
                        this.noitifi.toastError(
                            'Lỗi kết nối, vui lòng thử lại'
                        );
                        this.router.navigate(['/admin/content-none']);
                    },
                });
            } else {
                this.router.navigate(['/admin/content-none']);
            }
        });
    }

    loadCoursePlan() {
        this.noitifi.isProcessing(true);
        const condition_plan: ConditionOption = {
            condition: [
                {
                    conditionName: 'course_id',
                    condition: OvicQueryCondition.equal,
                    value: this.courseSelected.id.toString(),
                },
                {
                    conditionName: 'status',
                    condition: OvicQueryCondition.notEqual,
                    value: '-3',
                    orWhere: 'and',
                },
                {
                    conditionName: 'week',
                    condition: OvicQueryCondition.notEqual,
                    value: '100',
                    orWhere: 'and',
                },
            ],

            set: [
                { label: 'limit', value: '-1' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'ordering' },
            ],

            page: null,
        };

        const condition_comment: ConditionOption = {
            condition: [
                {
                    conditionName: 'course_id',
                    condition: OvicQueryCondition.equal,
                    value: this.courseSelected.id.toString(),
                },
                {
                    conditionName: 'parent_id',
                    condition: OvicQueryCondition.equal,
                    value: '0',
                    orWhere: 'and',
                },
            ],

            set: [{ label: 'limit', value: '-1' }],
            page: null,
        };

        const condition_reply_comment: ConditionOption = {
            condition: [
                {
                    conditionName: 'course_id',
                    condition: OvicQueryCondition.equal,
                    value: this.courseSelected.id.toString(),
                },
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

        forkJoin([
            this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_plan).pipe(mergeMap(_plan => {
                const plan_test_ids = [];
                _plan.data.forEach(f => {
                    if (f.type === 'THUONGXUYEN_TULUAN') {
                        plan_test_ids.push(f.id);
                    }
                })

                if (plan_test_ids.length) {
                    const condition_tuluan: ConditionOption = {
                        condition: [],
                        set: [
                            { label: 'limit', value: '-1' },
                            { label: 'include', value: [...new Set(plan_test_ids)].toString() },
                            { label: 'include_by', value: 'course_plan_activity_id' },
                            { label: 'groupby', value: 'course_plan_activity_id' }
                        ],
                        page: null
                    }

                    return this.coursePlanActivityTuluanService.getCoursePlanActivityTuluanByPageNew(condition_tuluan).pipe(mergeMap(_tuluan => {
                        _plan.data.forEach(f => {
                            const index = _tuluan.data.findIndex(m => m.course_plan_activity_id === f.id && f.type === 'THUONGXUYEN_TULUAN');
                            if (index !== -1) {
                                f['disabled_type'] = true;
                            }
                        })

                        return of(_plan);
                    }))
                }

                return of(_plan);

            })),
            this.coursePlanCommentService.getCoursePlanCommentByPageNew(condition_comment),
            this.coursePlanCommentService.getCoursePlanCommentByPageNew(
                condition_reply_comment
            ),
        ]).subscribe({
            next: ([course_plan, _comment, _comment_child]) => {
                const new_ = course_plan.data.filter((m) => m.parent_id === 0);
                if (new_.length) {
                    this.list_plan = this.setNewData(
                        course_plan.data,
                        _comment.data,
                        _comment_child.data
                    );
                    if (this.selectActivityId) {
                        const index = course_plan.data.findIndex(
                            (m) => m.id === this.selectActivityId
                        );
                        if (index !== -1) {
                            this.onChangePlan(course_plan.data[index]);
                        }
                    }
                } else {
                    // this.firstCreatePlan();
                }
                this.loading = false;
                this.noitifi.isProcessing(false);
            },
            error: () => {
                this.noitifi.isProcessing(false);
                this.noitifi.toastError('Lỗi kết nối vui lòng thử lại');
            },
        });
    }

    setNewData(
        data: CoursePlanActivities[],
        _comment: CoursePlanComment[],
        _comment_child: CoursePlanComment[]
    ) {
        if (data) {
            if (data.length > 0) {
                this.helperService.sort(data, 'ordering');
            }
            const parent = [...data].filter((m) => m.parent_id === 0);

            parent.forEach((f, index) => {
                if (f.week === 0) {
                    const comments = _comment.filter(
                        (m) =>
                            m.course_plan_activity_id === f.id ||
                            m.course_plan_activity_id ===
                            f.course_plan_activity_id
                    );
                    const object_comment = {};
                    comments.forEach((c) => {
                        const count_reply = _comment_child.filter(
                            (m) => m.parent_id === c.id
                        ).length;

                        c['count_reply'] = count_reply;

                        if (!object_comment[c.user_id]) {
                            object_comment[c.user_id] = [];
                            object_comment[c.user_id].push(c);
                        } else {
                            object_comment[c.user_id].push(c);
                        }
                    });

                    f['comments'] = [];

                    Object.keys(object_comment).forEach((o) => {
                        f['comments'].push({
                            user_id: o,
                            children: object_comment[o],
                        });
                    });

                    // f['comments'] = comments;
                }

                f['checked'] = false;
                const nodes = [...data].filter(
                    (m) => m.parent_id === f.id && m.type !== 'ACTIVITY_CDR'
                );
                f['children'] = nodes;

                f['show_name'] = this.label_parent_kehoach.concat(' ', f.week.toString());

                f['children'].forEach((c) => {
                    f['checked'] = false;
                    switch (c['type']) {
                        case 'LESSON':
                            c['icon'] = 'fa fa-file-text-o';
                            break;
                        case 'LESSON_TEST':
                            c['icon'] = 'fa fa-clock-o';
                            break;
                        case 'MEET':
                            c['icon'] = 'fa fa-video-camera';
                            break;
                        case 'OFFLINE_TEST':
                            c['icon'] = 'fa fa-pencil-square-o';
                            break;
                        case 'ACTIVITY_TEST':
                            c['icon'] = 'fa fa-clock-o';
                            break;
                        case 'THUONGXUYEN_TRACNGHIEM':
                            c['icon'] = 'fa fa-clock-o';
                            break;
                        case 'THUONGXUYEN_TULUAN':
                            c['icon'] = 'fa fa-pencil-square-o';
                            break;
                        case 'THUONGXUYEN_DUAN':
                            c['icon'] = 'fa fa-book';
                            break;
                        case 'ACTIVITY':
                            c['icon'] =
                                c['video'] && Object.keys(c['video']).length
                                    ? 'fa fa-file-video-o'
                                    : 'fa fa-file-text-o';
                            break;
                        case 'MUCTIEU':
                            c['icon'] =
                                c['video'] && Object.keys(c['video']).length
                                    ? 'fa fa-file-video-o'
                                    : 'fa fa-file-text-o';
                            break;
                        // case 'ACTIVITY_CDR':
                        //     c['icon'] = 'fa fa-list-alt';
                        //     break;
                        default:
                            break;
                    }
                    const comments = _comment.filter(
                        (m) => m.course_plan_activity_id === c.id
                    );

                    const object_comment = {};

                    comments.forEach((t) => {
                        const count_reply = _comment_child.filter(
                            (m) => m.parent_id === t.id
                        ).length;

                        t['count_reply'] = count_reply;

                        if (!object_comment[t.user_id]) {
                            object_comment[t.user_id] = [];
                            object_comment[t.user_id].push(t);
                        } else {
                            object_comment[t.user_id].push(t);
                        }
                    });

                    c['comments'] = [];

                    Object.keys(object_comment).forEach((o) => {
                        c['comments'].push({
                            user_id: o,
                            children: object_comment[o],
                        });
                    });
                });

                if (f['children'].length && f.week !== 0 && f.week < 1000) {
                    const CDR: CoursePlanActivities = {
                        id: f.id * -1,
                        course_id: this.courseSelected.id,
                        week: f.week,
                        desc: '',
                        title: 'Nội dung',
                        ordering: 0,
                        parent_id: f.id,
                        type: 'CDR',
                        icon: 'fa fa-list-alt',
                        children: [...data].filter(
                            (m) =>
                                m.parent_id === f.id &&
                                m.type === 'ACTIVITY_CDR'
                        ),
                        video: null,
                        videos: null,
                        files: [],
                        status: 0,
                        course_lesson_id: 0,
                        desc_title: '',
                        edit: 0,
                        slides: [],
                    };

                    if (CDR['children'].length !== 0) {
                        const index_s = CDR['children'].filter(
                            (m) => m.status === 1
                        );

                        const status_notactivity = CDR['children'].filter(
                            (m) => m.status === 0
                        );
                        const status_redo = CDR['children'].filter(
                            (m) => m.status === -1
                        );
                        const stauts_edit = CDR['children'].filter(
                            (m) => m.status === -2
                        );

                        if (status_notactivity.length) {
                            CDR['status'] = 0;
                            f['status'] = 0;
                        }

                        if (status_redo.length) {
                            CDR['status'] = -1;
                            f['status'] = -1;
                        }

                        if (stauts_edit.length) {
                            CDR['status'] = -2;
                            f['status'] = -2;
                        }

                        if (
                            index_s.length === CDR['children'].length &&
                            CDR['children'].length !== 0
                        ) {
                            CDR['status'] = 1;
                            f['status'] = 1;
                        }
                    } else {
                        CDR['status'] = 0;
                        f['status'] = 0;
                    }

                    f['children'].splice(1, 0, CDR);

                    // if (f['children'].length !== 0) {
                    //     const index_s = f['children'].filter(m => m.status === 1);

                    //     const status_notactivity = f['children'].filter(m => m.status === 0);
                    //     const status_redo = f['children'].filter(m => m.status === -1);
                    //     const stauts_edit = f['children'].filter(m => m.status === -2);

                    //     if (status_notactivity.length) {
                    //         f['status'] = 0;
                    //     }

                    //     if (status_redo.length) {
                    //         f['status'] = -1;
                    //     }

                    //     if (stauts_edit.length) {
                    //         f['status'] = -2;
                    //     }

                    //     if (index_s.length === f['children'].length && f['children'].length !== 0) {
                    //         f['status'] = 1;
                    //     }
                    // } else {
                    //     f['status'] = 0;
                    // }
                }
            });
            return parent;
        } else {
            return null;
        }
    }

    closeLesson() {
        this.closeLeft = false;
        // this.onCloseLesson.emit();
    }

    closeLeftBody() {
        this.closeLeft = !this.closeLeft;
    }

    formReset() {
        this.formPlan.reset();
        this.fp['course_id'].setValue(this.courseSelected.id);
        this.fp['parent_id'].setValue(0);
        this.fp['type'].setValue('ACTIVITY');
        this.fp['skip'].setValue(false);
        this.fp['forward'].setValue(false);
        this.fp['ignore'].setValue(true);
        this.fp['pause_when_change_tap'].setValue(true);
        this.fp['obligatory'].setValue(true);
        this.isUpdate = false;
    }

    createdLesson(parent: CoursePlanActivities) {
        this.formReset();
        const order = parent['children'] ? parent['children'].length : 1;
        this.fp['parent_id'].setValue(parent.id);
        this.fp['ordering'].setValue(order);
        this.PLAN_RIGHT_KEY = 'chooseTypeContent';
        // if (window.innerWidth <= 1524) {
        //     this.closeLeft = true;
        // }
    }

    createdPart() {
        // this.formReset();
        const order = this.list_plan ? this.list_plan.length : 1;
        this.selectPlan = null;
        this.PLAN_RIGHT_KEY = 'editPlan';
        if (!this.list_plan.length) {
            this.firstCreatePlan();
        } else {
            this.formReset();
            this.fp['week'].setValue(order + 1);
            // console.log("run");
            // this.loopAddPlan(order + 1, order + 1);
        }
    }

    firstCreatePlan(add_lesson?: number) {
        this.noitifi.isProcessing(false);
        this.progressValue = 0;
        this.displayModal = true;
        this.titleWaiting = 'Đang khởi tạo, vui lòng chờ';
        let lesson = add_lesson ? add_lesson : 9;
        if (
            this.courseSelected &&
            this.courseSelected.params &&
            this.courseSelected.params.sotinchi &&
            !this.unlimitLesson
        ) {
            lesson = this.courseSelected.params.sotinchi * 3;
        }

        let first = 0;

        if (this.list_plan.length) {
            const _plan = this.list_plan.filter(m => m.week !== 1000);
            if (_plan.length !== 0) {
                if (lesson + 1 > _plan.length) {
                    first = _plan[_plan.length - 1].week + 1;
                    this.loopAddPlan(first, lesson);
                } else {
                    this.noitifi.toastWarning('Bài học cho môn học này đã đạt số lượng tối đa, không thể thêm');
                    this.displayModal = false;
                }
            } else {
                this.loopAddPlan(first, lesson);
            }
        } else {
            this.loopAddPlan(first, lesson);
        }
    }

    loopAddPlan(key: number, length: number) {
        if (key <= length) {
            this.progressValue = (key / length) * 100;
            const data = {
                ordering: key,
                course_id: this.courseSelected.id,
                week: key,
                parent_id: 0,
                type: 'PLAN',
            };

            if (key === 0) {
                data['title'] = 'Thông tin chung';
            }

            this.coursePlanActivitiesService.addCoursePlanActivities(data).subscribe({
                next: (_id) => {
                    if (_id) {
                        if (key === 0) {
                            const titles = [
                                'Mô tả học phần',
                                'Quy định về điểm của học phần',
                                'Điều kiện dự thi kết thúc học phần',
                                'Tài liệu tham khảo',
                            ];
                            const request: Observable<any>[] = [];
                            titles.forEach((f, key) => {
                                const ch = this.addChildrenPlan(f, key + 1, _id, key);
                                request.push(this.coursePlanActivitiesService.addCoursePlanActivities(ch));
                            });

                            forkJoin(request).subscribe({
                                next: () => {
                                    this.loopAddPlan(key + 1, length);
                                },
                                error: () => {
                                    this.noitifi.toastError(
                                        'Lỗi kết nối, vui lòng thử lại'
                                    );
                                    this.displayModal = false;
                                },
                            });
                        } else {
                            const muctieu = {
                                ordering: 0,
                                course_id: this.courseSelected.id,
                                week: key,
                                parent_id: _id,
                                title: 'Mục tiêu',
                                type: 'MUCTIEU',
                                edit: 0,
                            };

                            const tailieu = {
                                ordering: 1,
                                course_id: this.courseSelected.id,
                                week: key,
                                parent_id: _id,
                                title: 'Tài liệu giảng dạy',
                                type: 'ACTIVITY',
                                edit: 0,
                            };

                            const baikiemtra = {
                                ordering: 2,
                                course_id: this.courseSelected.id,
                                week: key,
                                parent_id: _id,
                                title: this.keyServer == 'hvu' ? 'Bài tập theo tuần' : 'Bài tập chuyên đề',
                                type: 'ACTIVITY_TEST',
                                edit: 0,
                            };

                            forkJoin([
                                this.coursePlanActivitiesService.addCoursePlanActivities(
                                    muctieu
                                ),
                                this.coursePlanActivitiesService.addCoursePlanActivities(
                                    tailieu
                                ),
                                this.coursePlanActivitiesService.addCoursePlanActivities(
                                    baikiemtra
                                ),
                            ]).subscribe({
                                next: () => {
                                    this.loopAddPlan(key + 1, length);
                                },
                                error: () => {
                                    this.noitifi.toastError(
                                        'Lỗi kết nối, vui lòng thử lại'
                                    );
                                    this.displayModal = false;
                                },
                            });
                        }
                    } else {
                        this.loopAddPlan(key + 1, length);
                    }
                },
                error: () => {
                    this.noitifi.toastError(
                        'Lỗi kết nối, vui lòng thử lại'
                    );
                    this.displayModal = false;
                },
            });
        } else {
            if (this.isLanhDaoKhoa || this.isManager) {
                this.elnKhoaHocService
                    .updateElnKhoaHoc(this.courseSelected.id, {
                        creator_plan_id: this.auth.user.id,
                    })
                    .subscribe({
                        next: () => {
                            this.displayModal = false;
                            this.noitifi.toastSuccess('Khởi tạo thành công');
                            this.loadCoursePlan();
                        },
                        error: () => {
                            this.displayModal = false;
                            this.noitifi.toastError('Khởi tạo thất bại');
                        },
                    });
            } else {
                this.displayModal = false;
                this.noitifi.toastSuccess('Khởi tạo thành công');
                this.loadCoursePlan();
            }
        }
    }

    addChildrenPlan(
        title: string,
        key: number,
        parent_id: number,
        week: number
    ) {
        return {
            ordering: key,
            course_id: this.courseSelected.id,
            week: week,
            parent_id: parent_id,
            title: title,
            type: 'GIOITHIEU',
            edit: 0,
        };
    }

    deletePlan(plan: CoursePlanActivities) {
        this.noitifi.confirmDelete().then((a) => {
            if (a) {
                this.noitifi.isProcessing(true);
                const condition_question: ConditionOption = {
                    condition: [
                        {
                            conditionName: 'week',
                            condition: OvicQueryCondition.equal,
                            value: plan.week.toString(),
                            orWhere: "and"
                        },
                        {
                            conditionName: 'course_id',
                            condition: OvicQueryCondition.equal,
                            value: this.courseSelected.id.toString(),
                            orWhere: "and"
                        },
                    ],
                    set: [
                        { label: 'limit', value: '1' },
                        { label: 'select', value: 'id' }
                    ],
                    page: null
                }

                this.courseQuestionsService.getCourseQuestionsByPageNew(condition_question).subscribe({
                    next: (a) => {
                        if (a.recordsFiltered) {
                            this.noitifi.isProcessing(false);
                            this.noitifi.toastInfo("Bài này đã có câu hỏi, không thể xóa");
                        } else {
                            forkJoin([
                                this.coursePlanActivitiesService.deleteCoursePlanActivities(plan.id),
                                this.coursePlanActivitiesService.deleteCoursePlanActivitiesByCol(plan.id.toString(), 'parent_id'),
                            ]).subscribe({
                                next: () => {
                                    this.noitifi.toastSuccess('Xóa thành công');
                                    this.loadCoursePlan();
                                },
                                error: () => {
                                    this.noitifi.isProcessing(false);
                                    this.noitifi.toastSuccess('Xóa thất bài');
                                },
                            });

                        }
                    },
                    error: () => {
                        this.noitifi.isProcessing(false);
                        this.noitifi.toastSuccess('Xóa thất bài');
                    }
                })

            }
        });
    }

    onSubmit() {
        switch (this.PLAN_RIGHT_KEY) {
            case 'chooseTypeContent':
                this.saveActivity();
                break;
            case 'editPlan':
                const index = this.list_plan.findIndex(
                    (m) =>
                        (m.week === this.fp['week'].value && !this.isUpdate) ||
                        (m.week === this.fp['week'].value &&
                            this.selectPlan &&
                            this.selectPlan.id !== m.id &&
                            this.isUpdate)
                );
                this.fp['title'].setValue(this.fp['week'].value);
                this.fp['ordering'].setValue(this.fp['week'].value);
                this.fp['type'].setValue('PLAN');
                if (index !== -1) {
                    this.noitifi.toastWarning(
                        'Kế hoạch ' +
                        this.label_parent_kehoach +
                        ' ' +
                        this.newWeek +
                        ' đã tồn tại, vui lòng thử lại'
                    );
                } else {
                    this.saveActivity();
                }
                break;
            case 'drag-drop':
                this.saveOrdering();
                break;
            case 'editActivity':
                this.saveActivity();
                break;
            case 'chooseLesson':
                this.saveChoseLesson();
                break;
            case 'editActivityTest':
                this.onSaveLessonTest();
                break;
            case 'editCdr':
                this.chuandauraComponent().saveCdr();
                break;
            case 'editMuctieu':
                this.saveActivity();
                break;
            case 'editGioithieu':
                this.saveActivity();
                break;
            case 'editOfflineTest':
                this.saveActivity();
                break;
            case 'editMeet':
                this.saveActivity();
                break;
            default:
                // this.saveLesson();
                break;
        }
    }

    onSaveLessonTest() {
        this.saveQuestionStructure();
        // switch (this.activeIndex) {
        //     case 0:
        //         this.onSaveQuestion();
        //         break;
        //     case 1:
        //         break;
        //     case 2:

        //         // this.onSaveLessonTestConfig();
        //         break;
        //     default:
        //         break;
        // }
    }

    onChangePlan(item: CoursePlanActivities) {
        if (item.id) {
            this.selectPlan = item;
            this.newWeek = item.week;
            this.formReset();
            this.isUpdate = true;
            this.activeIndex = 0;
            this.list_question = null;
            this.questionImport = null;

            if (this.smallScreen) this.closeLeft = true;
            if (!item.course_lesson_id) {
                switch (item.type) {
                    case 'ACTIVITY':
                        this.PLAN_RIGHT_KEY = 'editActivity';
                        break;
                    case 'ACTIVITY_TEST':
                        this.planName = item.title;
                        this.PLAN_RIGHT_KEY = 'editActivityTest';
                        // this.loadQuestionForm();
                        break;
                    case 'PLAN':
                        this.PLAN_RIGHT_KEY = 'editPlan';
                        break;
                    case 'OFFLINE_TEST':
                        this.PLAN_RIGHT_KEY = 'editOfflineTest';
                        break;
                    case 'MEET':
                        this.PLAN_RIGHT_KEY = 'editMeet';
                        break;
                    case 'ACTIVITY_CDR':
                        this.PLAN_RIGHT_KEY = 'editCdr';
                        break;
                    case 'MUCTIEU':
                        this.PLAN_RIGHT_KEY = 'editMuctieu';
                        break;
                    case 'GIOITHIEU':
                        this.PLAN_RIGHT_KEY = 'editGioithieu';
                        break;
                    case 'CDR':
                        this.PLAN_RIGHT_KEY = 'editCdr';
                        break;
                    case 'THUONGXUYEN_TRACNGHIEM':
                        this.PLAN_RIGHT_KEY = 'edit_kiemtra_thuongxuyen';
                        this.loadQuestionForm();
                        break;
                    case 'THUONGXUYEN_TULUAN':
                        this.PLAN_RIGHT_KEY = 'thuongxuyen_tuluan';
                        break;
                    case 'THUONGXUYEN_DUAN':
                        this.PLAN_RIGHT_KEY = 'thuongxuyen_duan';
                        break;
                    default:
                        break;
                }
                this.editPlan(item);
            } else {
                this.PLAN_RIGHT_KEY = 'lesson';
                switch (item.type) {
                    case 'LESSON':
                        this.onLoadLesson();
                        break;
                    case 'LESSON_TEST':
                        this.onLoadLessonTest();
                        break;
                    default:
                        break;
                }
            }
        }
    }

    editPlan(item: CoursePlanActivities) {
        this.formPlan.patchValue({
            title: item.title,
            type: item.type,
            parent_id: item.parent_id,
            week: item.week,
            desc: item.desc,
            video: item.video ? [item.video] : null,
            videos: item.videos && item.videos.length> 0 ? item.videos : null,
            files: item.files,
            ordering: item.ordering,
            course_lesson_id: item.course_lesson_id,
            slides: item.slides,
        });

        if (item.params) {
            this.fp['ignore'].setValue(item.params.ignore);
            this.fp['forward'].setValue(item.params.can_jump_forward);
            this.fp['skip'].setValue(item.params.skip);
            this.fp['pause_when_change_tap'].setValue(
                item.params.pause_when_change_tap
            );
            this.fp['obligatory'].setValue(item.params.obligatory);
        }
    }

    createNewActivity(parent: CoursePlanActivities) {
        this.selectPlan = parent;
        this.formReset();
        this.fp['parent_id'].setValue(parent.id);
        this.fp['type'].setValue('ACTIVITY');
        const order = parent['children'] ? parent['children'].length + 1 : 1;
        this.fp['ordering'].setValue(order);
        this.fp['week'].setValue(parent.week);
        this.PLAN_RIGHT_KEY = 'chooseTypeContent';
    }

    saveActivity() {
        if (this.formPlan.valid) {

            const data = { ...this.formPlan.getRawValue() };
            data['video'] =
                data['video'] && data['video'][0] ? data['video'][0] : null;
            data['videos'] ==  data['videos'] !== null ? data['videos'] : null;
            data.params = {};
            data.params['skip'] = data['skip'];
            data.params['ignore'] = data['ignore'];
            data.params['can_jump_forward'] = data['forward'];
            data.params['pause_when_change_tap'] =
                data['pause_when_change_tap'];
            data.params['obligatory'] = data['obligatory'];
            if (data['type'] !== 'ACTIVITY') {
                delete data['params'];
            }

            if (data['week'] === 0 && data['type'] === 'PLAN') {
                data['title'] = 'Thông tin chung';
            }

            if (data['type'] === 'MEET') {
                data['status'] = 1;
            }

            delete data['forward'];
            delete data['skip'];
            delete data['ignore'];
            delete data['pause_when_change_tap'];
            delete data['obligatory'];
            this.noitifi.isProcessing(true);
            if (this.isUpdate) {
                if (this.selectPlan.parent_id === 0) {
                    this.coursePlanActivitiesService
                        .updateCoursePlanActivities(this.selectPlan.id, data)
                        .subscribe({
                            next: () => {
                                this.selectActivityId = null;
                                this.noitifi.toastSuccess('Sửa thành công');
                                this.loadCoursePlan();
                            },
                            error: () => {
                                this.noitifi.toastError(
                                    'Lỗi kết nối, sửa thất bại'
                                );
                                this.noitifi.isProcessing(false);
                            },
                        });
                } else {
                    if (this.selectPlan.status === -1) {
                        const data_copy: CoursePlanActivities = {
                            course_id: this.selectPlan.course_id,
                            course_lesson_id: this.selectPlan.course_lesson_id,
                            desc: this.selectPlan.desc,
                            files: this.selectPlan.files,
                            ordering: this.selectPlan.ordering,
                            params: this.selectPlan.params,
                            parent_id: this.selectPlan.parent_id,
                            slides: this.selectPlan.slides,
                            title: this.selectPlan.title,
                            type: this.selectPlan.type,
                            video: this.selectPlan.video,
                            videos: this.selectPlan.videos,
                            week: this.selectPlan.week,
                            status: -3,
                            desc_title: this.selectPlan.desc_title,
                            edit: this.selectPlan.edit,
                            cdr_cauhoi: this.selectPlan.cdr_cauhoi,
                            course_plan_activity_id: this.selectPlan.id,
                            approved_by: this.selectPlan.approved_by,
                            approved_at: this.selectPlan.approved_at ? this.helperService.strToSQLDate(this.selectPlan.approved_at) : null
                        }

                        forkJoin([
                            this.coursePlanActivitiesService.updateCoursePlanActivities(
                                this.selectPlan.id,
                                data
                            ),
                            this.coursePlanActivitiesService.addCoursePlanActivities(
                                data_copy
                            ),
                        ]).subscribe({
                            next: ([_u, _id]) => {
                                this.noitifi.toastSuccess('Sửa thành công');
                                this.selectActivityId = this.selectPlan.id;
                                this.loadCoursePlan();
                            },
                            error: () => {
                                this.noitifi.isProcessing(false);
                                this.noitifi.toastSuccess('Sửa thất bại');
                            },
                        });
                    } else {
                        this.coursePlanActivitiesService
                            .updateCoursePlanActivities(
                                this.selectPlan.id,
                                data
                            )
                            .subscribe({
                                next: () => {
                                    this.selectActivityId = null;
                                    this.noitifi.toastSuccess('Sửa thành công');
                                    this.loadCoursePlan();
                                },
                                error: () => {
                                    this.noitifi.toastError(
                                        'Lỗi kết nối, sửa thất bại'
                                    );
                                    this.noitifi.isProcessing(false);
                                },
                            });
                    }
                }
            } else {
                this.coursePlanActivitiesService
                    .addCoursePlanActivities(data)
                    .subscribe({
                        next: (_id) => {
                            if (this.PLAN_RIGHT_KEY === 'editPlan') {
                                this.selectActivityId = _id;
                                this.noitifi.toastSuccess('Thêm thành công');
                                this.loadCoursePlan();
                                this.noitifi.isProcessing(false);
                            } else {
                                const muctieu = {
                                    ordering: 0,
                                    course_id: this.courseSelected.id,
                                    week: data['week'],
                                    parent_id: _id,
                                    title: 'Mục tiêu',
                                    type: 'MUCTIEU',
                                };

                                const tailieu = {
                                    ordering: 1,
                                    course_id: this.courseSelected.id,
                                    week: data['week'],
                                    parent_id: _id,
                                    title: 'Tài liệu giảng dạy',
                                    type: 'ACTIVITY',
                                    edit: 0,
                                };

                                const baikiemtra = {
                                    ordering: 2,
                                    course_id: this.courseSelected.id,
                                    week: data['week'],
                                    parent_id: _id,
                                    title: this.keyServer == 'hvu' ? 'Bài tập theo tuần' : 'Bài tập chuyên đề',
                                    type: 'ACTIVITY_TEST',
                                    edit: 0,
                                };

                                forkJoin([
                                    this.coursePlanActivitiesService.addCoursePlanActivities(
                                        muctieu
                                    ),
                                    this.coursePlanActivitiesService.addCoursePlanActivities(
                                        tailieu
                                    ),
                                    this.coursePlanActivitiesService.addCoursePlanActivities(
                                        baikiemtra
                                    ),
                                ]).subscribe({
                                    next: () => {
                                        this.selectActivityId = _id;
                                        this.noitifi.toastSuccess(
                                            'Thêm thành công'
                                        );
                                        this.loadCoursePlan();
                                    },
                                    error: () => {
                                        this.noitifi.isProcessing(false);
                                        this.noitifi.toastError(
                                            'Lỗi kết nối, thêm thất bại'
                                        );
                                    },
                                });
                            }
                        },
                        error: () => {
                            this.noitifi.isProcessing(false);
                            this.noitifi.toastError(
                                'Lỗi kết nối, thêm thất bại'
                            );
                        },
                    });
            }
        } else {
            this.noitifi.toastWarning('Vui lòng điền đầy đủ thông ting');
        }
    }

    expandAndComLeson(part: any) {
        part['expand'] = !part['expand'];
    }

    onChooseLesson(parent: CoursePlanActivities) {
        this.noitifi.isProcessing(true);
        this.PLAN_RIGHT_KEY = 'chooseLesson';
        this.selectPlan = parent;
        this.idLesssonDelete = [];
        const condition: ConditionOption = {
            condition: [
                {
                    conditionName: 'course_id',
                    condition: OvicQueryCondition.equal,
                    value: this.courseSelected.id.toString(),
                    orWhere: 'and',
                },
                {
                    conditionName: 'status',
                    condition: OvicQueryCondition.greaterThan,
                    value: '0',
                    orWhere: 'and',
                },
            ],
            set: [{ label: 'limit', value: '-1' }],
            page: null,
        };
        forkJoin([
            this.elnBaiHocService.getLessonByPageNew(condition),
        ]).subscribe({
            next: ([baihoc]) => {
                baihoc.data.forEach((f) => {
                    f['readonly'] = false;
                    f['expand'] = true;
                    this.list_plan.forEach((p) => {
                        if (p['children']) {
                            const index = p['children'].findIndex(
                                (m) => m.course_lesson_id === f.id
                            );
                            if (index !== -1) {
                                f['inActivity'] = true;
                            }
                        }
                    });
                });

                if (baihoc) {
                    if (baihoc.data.length > 0) {
                        this.helperService.sort(baihoc.data, 'ordering');
                    }
                    const parent_ = [...baihoc.data].filter(
                        (m) => m.parent_id === 0
                    );
                    parent_.forEach((f, index) => {
                        const nodes = [...baihoc.data].filter(
                            (m) => m.parent_id === f.id
                        );
                        f['children'] = nodes;
                        const index_status = nodes.findIndex((m) => m.status);
                        if (!nodes.length) {
                            f['expand'] = false;
                        }
                        f['status_check'] = index_status !== -1 ? 1 : 0;
                    });
                    this.dmBaihoc = parent_;
                } else {
                    return null;
                }

                this.noitifi.isProcessing(false);
            },
            error: () => {
                this.noitifi.isProcessing(false);
                this.noitifi.toastError('Không load được danh mục bài giảng');
            },
        });
    }

    chooseLessonForPlan(item: ElnBaiHoc) {
        if (this.selectPlan['children']) {
            // if (!item['inActivity']) {
            //     item['inActivity'] = true;
            //     const order = this.selectPlan['children'] ? this.selectPlan['children'].length + 1 : 1;
            //     const data = {
            //         title: item.title,
            //         type: item.type === 'TEST' ? 'LESSON_TEST' : 'LESSON',
            //         course_id: this.courseSelected.id,
            //         parent_id: this.selectPlan.id,
            //         week: this.selectPlan.week,
            //         ordering: order + 1,
            //         course_lesson_id: item.id,
            //     }
            //     this.selectPlan['children'].push(data);
            // } else {
            //     this.list_plan.forEach(p => {
            //         if (p['children']) {
            //             const index = p['children'].findIndex(m => m.course_lesson_id === item.id);
            //             if (index !== -1) {
            //                 if (p['children'][index].id) {
            //                     this.idLesssonDelete.push(p['children'][index].id);
            //                 }
            //                 p['children'].splice(index, 1);
            //                 item['inActivity'] = false;
            //             }
            //         }
            //     })
            // }
        }
    }

    deleteLessonFromPlan(
        item: CoursePlanActivities,
        parent: CoursePlanActivities,
        index_: number
    ) {
        if (item.id) {
            this.noitifi.confirmDelete().then((a) => {
                if (a) {
                    this.coursePlanActivitiesService
                        .deleteCoursePlanActivities(item.id)
                        .subscribe({
                            next: () => {
                                this.deleteManualLesson(item, parent, index_);
                            },
                            error: () => {
                                this.noitifi.toastError(
                                    'Lỗi kết nối, vui lòng thử lại'
                                );
                            },
                        });
                }
            });
        } else {
            this.deleteManualLesson(item, parent, index_);
        }
    }

    deleteManualLesson(
        item: CoursePlanActivities,
        parent: CoursePlanActivities,
        index_
    ) {
        if (item.course_lesson_id) {
            if (parent['children']) {
                parent['children'].splice(index_, 1);
            }
            if (this.dmBaihoc)
                this.dmBaihoc.forEach((f) => {
                    if (f['children']) {
                        const index = f.children.findIndex(
                            (m) => m.id === item.course_lesson_id
                        );
                        if (index !== -1) {
                            f.children[index]['inActivity'] = false;
                        }
                    }
                });
        } else {
            this.PLAN_RIGHT_KEY = null;
            this.loadCoursePlan();
        }
    }

    saveChoseLesson() {
        let data = [];
        this.list_plan.forEach((p) => {
            if (p['children']) {
                data = data.concat(
                    p['children'].filter((m) => !m.id && m.course_lesson_id)
                );
            }
        });
        this.displayModal = true;
        this.progressValue = 0;
        this.titleWaiting = 'Đang đồng bộ, vui lòng chờ...';
        if (this.idLesssonDelete.length) {
            this.coursePlanActivitiesService
                .deleteCoursePlanActivities(this.idLesssonDelete.toString())
                .subscribe({
                    next: () => {
                        this.loopAddLessonToPlan(data[0], data, 0);
                    },
                    error: () => {
                        this.noitifi.toastError(
                            'Lỗi kết nối, vui lòng thử lại'
                        );
                    },
                });
        } else {
            this.loopAddLessonToPlan(data[0], data, 0);
        }
    }

    loopAddLessonToPlan(
        item: CoursePlanActivities,
        data: CoursePlanActivities[],
        key: number
    ) {
        if (key < data.length) {
            this.progressValue = ((key + 1) / data.length) * 100;
            this.coursePlanActivitiesService
                .addCoursePlanActivities(item)
                .subscribe({
                    next: () => {
                        this.loopAddLessonToPlan(data[key + 1], data, key + 1);
                    },
                    error: () => {
                        this.displayModal = false;
                        this.noitifi.toastError(
                            'Lỗi kết nối, vui lòng thử lại'
                        );
                    },
                });
        } else {
            this.displayModal = false;
            this.noitifi.toastSuccess('Cập nhật thành công');
            this.PLAN_RIGHT_KEY = null;
            this.idLesssonDelete = [];
            this.loadCoursePlan();
        }
    }

    chooseContentType(type) {
        this.fp['type'].setValue(type.key);
    }

    /** activity test */
    tapViewLesson() {
        switch (this.PLAN_RIGHT_KEY) {
            case 'editActivityTest':
                this.switchLoadLessonTest();
                break;
            case 'editActivity':
                this.switchLoadActivity();
                break;
            default:
                break;
        }
    }

    switchLoadActivity() {
        switch (this.activeIndex) {
            case 3:
                this.loadVideoMarker();
                break;
            default:
                break;
        }
    }

    downLoadExFile() {
        this.fileService
            .downloadFileAsBlob(
                '..\\assets\\files\\mau_file_import_LMS-LCMS\\Mau 03 - 03 Import cau hoi bai tap bo tro - trac nghiem.docx'
            )
            .subscribe((res) => {
                saveAs(
                    res,
                    'Mau 03 - 03 Import cau hoi bai tap bo tro - trac nghiem.docx'
                );
            });
    }

    changeFileDocument(event) {
        if (event.target.files[0]) {
            this.hasContent = false;
            const file = event.target.files[0];
            const indexDot = file.name.lastIndexOf('.');
            let codeFile = '';
            if (indexDot !== -1) {
                codeFile = file.name.slice(0, indexDot);
            }
            if (file.name.length > 30) {
                this.nameFileWord = this.deleteAtIndex(file.name, 0, 30).concat(
                    '...'
                );
            } else {
                this.nameFileWord = file.name;
            }
            this.questionImport;
            this.fileWordTest = file;
        }
    }

    deleteAtIndex(s, i, j) {
        return s.substr(i, j);
    }

    deleteDataQuest(part: CourseQuestions) {
        const deleteQuest = [];
        deleteQuest.push(part.id);
        if (part['children'] && part['children'].length) {
            part['children'].forEach((f) => {
                deleteQuest.push(f.id);
            });
        }

        this.noitifi.confirmDelete().then(
            (a) => {
                if (a) {
                    this.courseQuestionsService
                        .deleteCourseQuestions(deleteQuest.toString())
                        .subscribe({
                            next: () => {
                                this.noitifi.toastSuccess(
                                    'Xoá câu hỏi thành công'
                                );
                                this.loadQuestion();
                            },
                            error: () =>
                                this.noitifi.toastError('Xóa câu hỏi thất bại'),
                        });
                }
            },
            () => null
        );
    }

    expandAndCom(part: ElnLessonTestQuestion) {
        part['expand'] = !part['expand'];
    }

    onGetResultWordTest(event) {
        if (event.data) {
            this.checkQuestion = event['info'];
            this.arrayIdImages = [];
            this.arrayIdImages = event.imgs;
            this.questionImport = event.data;
        }
    }

    getImageAndUpload(arrayIdImages: any): Promise<any> {
        if (arrayIdImages && arrayIdImages.length !== 0) {
            return new Promise((resolve, reject) => {
                const fileUploadRes: Observable<any>[] = [];
                if (arrayIdImages.length !== 0) {
                    arrayIdImages.forEach((f, index) => {
                        fileUploadRes.push(
                            this.fileService
                                .uploadFileAwsWidthProgress(f.file, 'private')
                                .pipe(
                                    map((res) => {
                                        if (res.state === 'DONE') {
                                            f.idUpLoad =
                                                res.content['data'][0].id;
                                        }
                                    })
                                )
                        );
                    });
                }
                if (fileUploadRes.length !== 0) {
                    forkJoin(fileUploadRes).subscribe({
                        next: (forkRes: any) => {
                            const result = [...arrayIdImages];
                            resolve(result);
                        },
                        error: () => {
                            this.displayModal = false;
                        },
                    });
                }
            });
        }
        return null;
    }

    async onSaveQuestion() {
        if (this.questionImport && this.questionImport.length) {
            if (this.checkQuestion.noAnswerCorrect === 0) {
                this.progressValue = 0;
                this.displayModal = true;
                this.fileWordTest = null;
                const img = await this.getImageAndUpload(this.arrayIdImages);
                if (img && img.length !== 0) {
                    this.questionImport.forEach((f, key) => {
                        const tmpPartDirection =
                            this.helperService.replaceImageSrc(
                                f.question_direction,
                                img
                            );
                        f.question_direction = tmpPartDirection;
                        if (f['children'].length) {
                            f['children'].forEach((c, key) => {
                                const tmpQ = this.helperService.replaceImageSrc(
                                    c.question_direction,
                                    img
                                );
                                c.question_direction = tmpQ;
                                if (c.answer_option) {
                                    c.answer_option.forEach((a, n) => {
                                        const tmpA =
                                            this.helperService.replaceImageSrc(
                                                a.value,
                                                img
                                            );
                                        a.value = tmpA;
                                    });
                                }
                            });
                        }
                    });
                }
                this.onSaveQuestionLoop(
                    this.questionImport[0],
                    this.questionImport,
                    0
                );
            } else {
                this.noitifi.toastWarning(
                    'Có câu hỏi chưa có đáp án, vui lòng kiểm tra lại'
                );
            }
        } else {
            this.noitifi.toastWarning('Vui lòng kiểm tra lại file word');
        }
    }

    onSaveQuestionLoop(
        question: CourseQuestions,
        questions: CourseQuestions[],
        key
    ) {
        if (key < questions.length) {
            this.progressValue = ((key + 1) / questions.length) * 100;
            const quest = {
                course_id: this.courseSelected.id,
                course_plan_activity_id: this.selectPlan.id,
                group_id: question.group_id,
                part: question.part,
                question_type: question.question_type,
                question_direction: question.question_direction,
                media: question.media,
                question_number: question.question_number,
                code: question['code'],
                answer_option: question.answer_option
                    ? question.answer_option
                    : null,
                answer_correct: question.answer_correct
                    ? '|'.concat(question['answer_correct'].join('|'), '|')
                    : null,
                config: question.config ? question.config : null,
            };

            if (!quest.media) {
                delete quest.media;
            }

            this.courseQuestionsService.addCourseQuestions(quest).subscribe({
                next: (_id) => {
                    if (question['children'] && question['children'].length) {
                        question['children'].forEach((f) => {
                            f.group_id = _id;
                        });
                    }

                    this.onSaveQuestionLoop(
                        questions[key + 1],
                        questions,
                        key + 1
                    );
                },
                error: () => {
                    this.displayModal = false;
                    this.questionImport = null;
                    this.noitifi.toastError('Lỗi kết nối, vui lòng thử lại');
                },
            });
        } else {
            let childrens = [];
            questions.forEach((f) => {
                if (f['children']) {
                    childrens = childrens.concat(f['children']);
                }
            });

            if (childrens.length) {
                this.progressValue = 0;
                this.onSaveQuestionLoop(childrens[0], childrens, 0);
            } else {
                this.displayModal = false;
                this.noitifi.toastSuccess('Thêm câu hỏi thành công');
            }
        }
    }

    loadQuestion() {
        this.list_question = [];
        this.courseQuestionsService.getCourseQuestionsByCol('course_plan_activity_id', this.selectPlan.id)
            .subscribe({
                next: (_question) => {
                    this.list_question = _question;
                },
                error: () => {
                    this.noitifi.toastError('Lỗi kết nối, vui lòng thử lại');
                },
            });
    }

    switchLoadLessonTest() {
        switch (this.activeIndex) {
            case 1:
                this.loadQuestion();
                break;
            case 2:
                this.loadQuestionForm();
                break;
            default:
                break;
        }
    }

    loadQuestionForm() {
        const form_question: CourseQuestionForm = {
            course_id: this.courseSelected.id,
            title: '',
            structure: [],
            total_time: null,
            course_plan_activity_id: this.selectPlan.id,

        };

        this.list_bai_for_test = this.list_plan.filter(m => m.week > 0 && m.week < 1000);

        this.list_question_form = form_question;

        const condition_quest: ConditionOption = {
            condition: [
                {
                    conditionName: 'course_id',
                    condition: OvicQueryCondition.equal,
                    value: this.courseSelected.id.toString(),
                },
                {
                    conditionName: 'course_plan_activity_id',
                    condition: OvicQueryCondition.equal,
                    value: this.selectPlan.id.toString(),
                    orWhere: 'and',
                },
            ],

            set: [
                { label: 'limit', value: '-1' },
                { label: 'orderby', value: 'id' },
                { label: 'order', value: 'ASC' },
            ],

            page: null,
        };

        forkJoin([
            this.courseQuestionFormService.getCourseQuestionFormByPageNew(
                condition_quest
            ),
        ]).subscribe({
            next: ([_res]) => {
                if (_res.recordsFiltered) {
                    this.list_question_form.structure = _res.data[0].structure;
                }
            },
            error: () => {
                this.noitifi.isProcessing(false);
                this.noitifi.toastError('Lỗi kết nối, vui lòng thử lại');
            },
        });
        this.getquestTionCdr();
    }

    // ---------------------------------test
    getquestTionCdr() {

    }


    loadBankByPurpose() {
        this.noitifi.isProcessing(true);
        const condition_course_bank: ConditionOption = {
            condition: [
                {
                    conditionName: 'course_id',
                    condition: OvicQueryCondition.equal,
                    value: this.courseSelected.id.toString(),
                },
                {
                    conditionName: 'type',
                    condition: OvicQueryCondition.equal,
                    value: CONVERT_TYPE_TEST[
                        this.list_question_form.config.purpose
                    ],
                    orWhere: 'and',
                },
            ],
            set: [{ label: 'limit', value: '-1' }],
            page: null,
        };

        this.courseBankService
            .getCourseBankByPageNew(condition_course_bank)
            .subscribe({
                next: (_bank) => {
                    this.listCourseBank = _bank.data;
                    this.noitifi.isProcessing(false);
                },
                error: () => {
                    this.noitifi.isProcessing(false);
                    this.noitifi.toastError('Lỗi kết nối');
                },
            });
    }

    changeChooseBankForm(bank: CourseBank, structure: structure) {
        if (bank) {
            structure.course_bank_id = bank.id;
        }
    }

    changeFormCdr(cdr, structure: structure) {
        if (cdr) {
            structure.cdr = cdr.id;
        }
    }

    loadCourseQuestionForForm(
        data_structure: structure[],
        structure: structure,
        index
    ) {
        if (structure.course_bank_id && structure.cdr) {
            this.noitifi.isProcessing(true);
            const condition: ConditionOption = {
                condition: [
                    {
                        conditionName: 'course_bank_id',
                        condition: OvicQueryCondition.equal,
                        value: structure.course_bank_id.toString(),
                    },
                    {
                        conditionName: 'course_id',
                        condition: OvicQueryCondition.equal,
                        value: this.courseSelected.id.toString(),
                        orWhere: 'and',
                    },
                    {
                        conditionName: 'group_id',
                        condition: OvicQueryCondition.equal,
                        value: '0',
                        orWhere: 'and',
                    },
                ],
                set: [{ label: 'limit', value: '-1' }],
                page: null,
            };

            if (this.list_question_form.type_test === 'tienganh') {
                condition.condition.push({
                    conditionName: 'cdr',
                    condition: OvicQueryCondition.equal,
                    value: structure.cdr.toString(),
                    orWhere: 'and',
                });
            }

            this.courseQuestionsService
                .getCourseQuestionsByPageNew(condition)
                .pipe(
                    mergeMap((_parent) => {
                        if (this.list_question_form.type_test === 'monkhac') {
                            const group_ids = [];

                            _parent.data.forEach((f) => {
                                group_ids.push(f.id);
                            });

                            const condition_child: ConditionOption = {
                                condition: [
                                    {
                                        conditionName: 'course_bank_id',
                                        condition: OvicQueryCondition.equal,
                                        value: structure.course_bank_id.toString(),
                                    },
                                    {
                                        conditionName: 'course_id',
                                        condition: OvicQueryCondition.equal,
                                        value: this.courseSelected.id.toString(),
                                        orWhere: 'and',
                                    },
                                    {
                                        conditionName: 'cdr',
                                        condition: OvicQueryCondition.equal,
                                        value: structure.cdr.toString(),
                                        orWhere: 'and',
                                    },
                                ],
                                set: [
                                    { label: 'limit', value: '-1' },
                                    {
                                        label: 'include',
                                        value: group_ids.toString(),
                                    },
                                    { label: 'include_by', value: 'group_id' },
                                ],
                                page: null,
                            };

                            if (group_ids.length) {
                                return this.courseQuestionsService
                                    .getCourseQuestionsByPageNew(
                                        condition_child
                                    )
                                    .pipe(
                                        mergeMap((_children) => {
                                            _parent.recordsFiltered =
                                                _parent.recordsFiltered +
                                                _children.recordsFiltered;
                                            _parent.data = _parent.data.concat(
                                                _children.data
                                            );
                                            return of(_parent);
                                        })
                                    );
                            }
                            return of(_parent);
                        }
                        return of(_parent);
                    })
                )
                .subscribe({
                    next: (_question) => {
                        this.question_chooselist = _question.data;
                        this.chooseQuestion(data_structure, structure, index);
                        this.noitifi.isProcessing(false);
                    },
                    error: () => {
                        this.noitifi.isProcessing(false);
                        this.noitifi.toastError(
                            'Lỗi kết nối, vui lòng thử lại'
                        );
                    },
                });
        } else {
            this.noitifi.toastWarning(
                'Vui lòng chọn ngân hàng và chuẩn đâu ra trước khi chọn câu hỏi'
            );
        }
    }

    chooseQuestion(data_structure: structure[], structure: structure, index) {
        const target = [];
        const source = [];
        this.selected_structure = structure;
        let quest_id_list = [];
        data_structure.forEach((f) => {
            if (Array.isArray(f.question)) {
                quest_id_list = quest_id_list.concat(f.question);
            }
        });

        let data_ = [];

        if (this.list_question_form.type_test === 'tienganh') {
            data_ = this.question_chooselist.filter((m) => !m.group_id);
        } else {
            data_ = this.question_chooselist.filter((m) => m.group_id);
        }

        data_.forEach((f) => {
            if (this.list_question_form.type_test === 'tienganh') {
                f['show_label'] = ''.concat('[', f.id.toString(), ']', f.code);
            } else {
                f['show_label'] = ''.concat(
                    '[',
                    f.id.toString(),
                    '][',
                    f.question_number,
                    ']',
                    f.code
                );
            }

            const index = structure.question.findIndex(
                (m) => m.toString() === f.id.toString()
            );
            if (index !== -1) {
                target.push({ ...f });
            }
            const index_ = quest_id_list.findIndex(
                (m) => m.toString() === f.id.toString()
            );
            if (index_ === -1) {
                source.push({ ...f });
            }
        });

        this.targetQuestion = target;
        this.sourceQuestion = source;
        this.modalService.open(
            this.templateChooseClasQuestion(),
            LARGE_MODAL_OPTIONS
        );
    }

    numberQuestionKeyDown(event) {
        if (event.key === '.' || event.key === 'e' || event.key === ',') {
            event.preventDefault();
        }
    }

    pointQuestionKeyDown(event, inputPoint_quest) {
        if (event) {
            if (
                /[0-9]/.test(event.key) ||
                event.key === '.' ||
                event.key === 'Backspace'
            ) {
                if (
                    inputPoint_quest.value.replace(/\d/gi, '').length > 0 &&
                    event.key === '.'
                ) {
                    event.preventDefault();
                }
            } else {
                event.preventDefault();
            }
        }
    }

    deleteQuestionStructure(structure: structure[], index) {
        structure.splice(index, 1);
    }

    addQuestionStructure(structure: structure[]) {
        if (this.list_bai_for_test && this.list_bai_for_test.length) {
            const question_id = [];
            const t: structure = {
                question_ids: question_id,
                ordering: structure.length + 1,
                numberQuestion: 0,
                course_plan_activity_id: this.list_bai_for_test[0].id,
                cdr: 1,
                cdr_id: 0,
            };
            structure.push(t);
        } else {
            this.noitifi.toastWarning(
                'Môn học này không có bài học, vui lòng tạo ngân hàng câu hỏi hoặc liên hệ với người phụ trách tạo ngân hàng câu hỏi'
            );
        }
    }

    saveTargetQuestion(d) {
        const question_id = [];
        this.targetQuestion.forEach((f) => {
            question_id.push(f.id);
        });

        this.selected_structure.question = question_id;
        d(true);
    }

    saveNameTestPromise(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.coursePlanActivitiesService
                .updateCoursePlanActivities(this.selectPlan.id, {
                    title: this.planName,
                })
                .subscribe({
                    next: () => {
                        resolve(null);
                    },
                    error: () => {
                        this.noitifi.toastError('Lỗi kết nối vui lòng thử lại');
                        reject(null);
                    },
                });
        });
    }

    async saveQuestionStructure() {
        const t = await this.saveNameTestPromise();

        const formQuest = this.list_question_form;

        let valid = true;

        let label = '';

        formQuest.structure.forEach((f, key) => {
            f.ordering = key + 1;
            if (!f.point) {
                valid = false;
                label = 'Vui lòng nhập điểm';
            }

            if (!f.question.length) {
                valid = false;
                label = 'Vui lòng chọn câu hỏi';
            }

            if (f.question.length < f.numberQuestion) {
                valid = false;
                label = 'Số lượng câu hỏi lớn hơn số lượng câu hỏi được chọn';
            }

            if (!f.numberQuestion) {
                valid = false;
                label = 'Vui lòng nhập số lượng câu hỏi';
            }
        });
        if (formQuest.config) {
            if (!formQuest.config.maxTestTimes) {
                delete formQuest.config.maxTestTimes;
            }
        }

        formQuest['course_id'] = this.courseSelected.id;
        formQuest['course_plan_activity_id'] = this.selectPlan.id;

        if (valid) {
            if (formQuest.id) {
                const data: CourseQuestionForm = {
                    course_id: formQuest.course_id,
                    course_plan_activity_id: formQuest.course_plan_activity_id,
                    title: formQuest.title,
                    type_test: formQuest.type_test,
                    structure: formQuest.structure,
                    total_time: formQuest.total_time,
                    config: formQuest.config,
                };

                this.courseQuestionFormService
                    .updateCourseQuestionForm(formQuest.id, data)
                    .subscribe({
                        next: (_res) => {
                            this.noitifi.toastSuccess('Lưu thành công');
                            this.loadCoursePlan();
                            this.selectActivityId = this.selectPlan.id;
                        },
                        error: () => {
                            this.noitifi.toastError(
                                'Lưu thất bại, vui lòng thử lại'
                            );
                        },
                    });
            } else {
                this.courseQuestionFormService
                    .addCourseQuestionForm(formQuest)
                    .subscribe({
                        next: (_res) => {
                            this.noitifi.toastSuccess('Lưu thành công');
                            this.loadCoursePlan();
                            formQuest['id'] = _res;
                        },
                        error: () => {
                            this.noitifi.toastError(
                                'Lưu thất bại, vui lòng thử lại'
                            );
                        },
                    });
            }
        } else {
            this.noitifi.toastWarning(label);
        }
    }

    onChangeTypeQuestionForm(event) {
        if (this.list_question_form) {
            if (event !== this.list_question_form['type_test']) {
                this.list_question_form['type_test'] = event;
                this.list_question_form.structure = [];
            }
        }
    }

    onChangepurposeQuestionForm(event) {
        if (this.list_question_form && this.list_question_form.config) {
            if (event !== this.list_question_form.config.purpose) {
                this.list_question_form.config.purpose = event;
                this.list_question_form.structure = [];
                this.loadBankByPurpose();
                // this.loadQuestionForm();
            }
        }
    }

    clearInfotest() {
        switch (this.PLAN_RIGHT_KEY) {
            case 'editActivityTest':
                this.onEditActivityTest();
                break;
            case 'drag-drop':
                this.loadCoursePlan();
                break;
            default:
                break;
        }
    }

    onEditActivityTest() {
        const inputImport = this.inputImport();
        switch (this.activeIndex) {
            case 0:
                this.nameFileWord = 'Chọn bài test...';
                this.fileWordTest = null;
                this.fileInput = '';
                if (inputImport && inputImport.nativeElement)
                    inputImport.nativeElement.value = null;
                break;
            case 2:
                this.loadQuestionForm();
                break;
            default:
                break;
        }
    }

    dropParent(event: CdkDragDrop<CoursePlanActivities[]>) {
        if (event.previousContainer === event.container) {
            let currentIndex = event.currentIndex;
            moveItemInArray(
                event.container.data,
                event.previousIndex,
                currentIndex
            );
        } else {
            let currentIndex = event.currentIndex;
            transferArrayItem(
                event.previousContainer.data,
                event.container.data,
                event.previousIndex,
                currentIndex
            );
        }
    }

    dropChild(event: CdkDragDrop<CoursePlanActivities[]>) {
        if (event.previousContainer === event.container) {
            let currentIndex = event.currentIndex;
            moveItemInArray(
                event.container.data,
                event.previousIndex,
                currentIndex
            );
        } else {
            let currentIndex = event.currentIndex;
            transferArrayItem(
                event.previousContainer.data,
                event.container.data,
                event.previousIndex,
                currentIndex
            );
        }
    }

    saveOrdering() {
        let i = 0;
        this.progressValue = 0;
        this.displayModal = true;
        this.list_plan.forEach((f, key) => {
            if (!isNaN(f.id)) {
                f.ordering = key + 1;
                setTimeout(() => {
                    this.coursePlanActivitiesService.updateCoursePlanActivities(f.id, { ordering: key + 1, parent_id: f.parent_id }).subscribe({
                        next: (_res) => {
                            if (f['children'] && f['children'].length) {
                                let j = 0;
                                f['children'].forEach((c, ckey) => {
                                    if (!isNaN(c.id)) {
                                        c.ordering = ckey + 1;
                                        setTimeout(() => {
                                            this.coursePlanActivitiesService.updateCoursePlanActivities(c.id, { ordering: ckey + 1, parent_id: c.parent_id }).subscribe({
                                                next: (_res) => {
                                                    j = j + 1;
                                                    if (j === f['children'].length - 1) {
                                                        i = i + 1;
                                                        this.progressValue = (i / (this.list_plan.length - 1)) * 100;
                                                    }
                                                    if (i === this.list_plan.length - 1 && j === f['children'].length - 1) {
                                                        this.noitifi.toastSuccess('Cập nhật thành công');
                                                        this.displayModal = false;
                                                        this.progressValue = 0;
                                                        this.loadCoursePlan();
                                                    }
                                                },
                                                error: () => {
                                                    i = i + 1;
                                                    this.progressValue = (i / (this.list_plan.length - 1)) * 100;
                                                    if (i === this.list_plan.length - 1) {
                                                        this.noitifi.toastSuccess('Cập nhật thành công');
                                                        this.displayModal = false;
                                                        this.progressValue = 0;
                                                        this.loadCoursePlan();
                                                    }
                                                },
                                            });
                                        }, key * ckey * 100);
                                    } else {
                                        i = i + 1;
                                        this.progressValue = (i / (this.list_plan.length - 1)) * 100;
                                        if (i === this.list_plan.length - 1) {
                                            this.noitifi.toastSuccess('Cập nhật thành công');
                                            this.displayModal = false;
                                            this.progressValue = 0;
                                            this.loadCoursePlan();
                                        }
                                    }
                                });
                            } else {
                                i = i + 1;
                                this.progressValue = (i / (this.list_plan.length - 1)) * 100;
                                if (i === this.list_plan.length - 1) {
                                    this.noitifi.toastSuccess('Cập nhật thành công');
                                    this.displayModal = false;
                                    this.progressValue = 0;
                                    this.loadCoursePlan();
                                }
                            }
                        },
                        error: () => {
                            i = i + 1;
                            this.progressValue = (i / (this.list_plan.length - 1)) * 100;
                            if (i === this.list_plan.length - 1) {
                                this.noitifi.toastSuccess('Cập nhật thành công');
                                this.displayModal = false;
                                this.progressValue = 0;
                            }
                        },
                    });
                }, key * 100);
            }
        });
    }

    moveToOtherParent(child: CoursePlanActivities) {
        this.selectActivityMove = child;
        this.parent_id_before_move = child.parent_id;
        this.modalService.open(
            this.templateChooseParentPlan(),
            NORMAL_MODAL_OPTIONS
        );
    }

    moveChildToParent(parent: CoursePlanActivities) {
        this.selectActivityMove.parent_id = parent.id;
    }

    closeChooseParent(d) {
        this.selectActivityMove.parent_id = this.parent_id_before_move;
        d(true);
    }

    dragDropPlan() {
        this.PLAN_RIGHT_KEY = 'drag-drop';
    }

    savePostionOfChild(d) {
        const index_current = this.list_plan.findIndex(
            (m) => m.id === this.selectActivityMove.parent_id
        );
        if (index_current !== -1) {
            const children = this.list_plan[index_current]['children'];
            if (children) {
                children.push(this.selectActivityMove);
            }
        }

        const index_p = this.list_plan.findIndex(
            (m) => m.id === this.parent_id_before_move
        );
        if (index_p !== -1) {
            if (this.list_plan[index_p]['children']) {
                const children = this.list_plan[index_p]['children'];
                const index_c = children.findIndex(
                    (m) => m.id === this.selectActivityMove.id
                );
                if (index_c !== -1) {
                    children.splice(index_c, 1);
                }
            }
        }
        d(true);
    }

    /** end */

    onLoadLesson() {
        if (this.selectPlan && this.selectPlan.course_lesson_id) {
            const condition: ConditionOption = {
                condition: [
                    {
                        conditionName: 'id',
                        condition: OvicQueryCondition.equal,
                        value: this.selectPlan.course_lesson_id.toString(),
                        orWhere: 'and',
                    },
                ],
                set: [],
                page: null,
            };
            this.elnBaiHocService.getLessonByPageNew(condition).subscribe({
                next: (_lesson) => {
                    if (_lesson.recordsFiltered) {
                        this.selectPlan['lesson_text'] = _lesson.data[0].desc;
                        this.selectPlan['lesson_video'] = _lesson.data[0].video;
                        this.selectPlan['lesson_slide'] = _lesson.data[0].slide;
                        this.selectPlan['lesson_documents'] =
                            _lesson.data[0].documents;
                    } else {
                        this.noitifi.toastWarning(
                            'Bài giảng không tồn tại hoặc đã bị xóa, vui lòng kiểm tra lại'
                        );
                    }
                },
                error: () => {
                    this.noitifi.toastError('Lỗi kết nối, vui lòng thử lại');
                },
            });
        } else {
            this.noitifi.toastError(
                'Đã có lỗi xảy ra trong quá trình xử lý dữ liệu, vui lòng ấn f5 rồi thử lại'
            );
        }
    }

    onSelectFileReview(file: OvicDocument) {
        this.selectedFileReview = null;
        this.selectedFileReview = file;
        this.modalService.open(this.filesLessonReview(), LARGE_MODAL_OPTIONS);
    }

    onLoadLessonTest() {
        this.list_question_lesson_test = [];
        this.elnLessonTestQuestionService
            .getElnLessonTestQuestionByCol(
                'lesson_id',
                this.selectPlan.course_lesson_id
            )
            .subscribe({
                next: (_question) => {
                    this.list_question_lesson_test = _question;
                },
                error: () => {
                    this.noitifi.toastError('Lỗi kết nối, vui lòng thử lại');
                },
            });
    }

    setActiceParent(parent) {
        const string = parent['status']
            ? 'Thầy/Cô có chắc chắn muốn tắt kích hoạt toàn bộ hoạt động<br>của tuần <span class="title-parent-report">' +
            parent['week'] +
            '</span>?'
            : 'Thầy/Cô có chắc chắn muốn kích hoạt toàn bộ hoạt động của tuần <span class="title-parent-report">' +
            parent['week'] +
            '</span>?';
        const status = parent['status'] ? 0 : 1;
        this.noitifi
            .confirm(string, 'Xác nhận hành động', [BUTTON_YES, BUTTON_NO])
            .then((a) => {
                if (a.name === 'yes') {
                    this.noitifi.isProcessing(true);
                    const ids = [];
                    const request: Observable<any>[] = [
                        this.coursePlanActivitiesService.updateCoursePlanActivities(
                            parent.id,
                            { status: status }
                        ),
                    ];
                    if (parent['children'] && parent['children'].length) {
                        parent['children'].forEach((f) => {
                            if (!isNaN(f.id)) {
                                request.push(
                                    this.coursePlanActivitiesService.updateCoursePlanActivities(
                                        f.id,
                                        { status: status }
                                    )
                                );
                            }
                        });
                    }

                    forkJoin(request).subscribe({
                        next: (_res) => {
                            this.loadCoursePlan();
                            this.noitifi.isProcessing(false);
                            this.noitifi.toastSuccess('Kích hoạt thành công');
                        },
                        error: () => {
                            this.noitifi.toastError('Cập nhật thất bại');
                            this.noitifi.isProcessing(false);
                        },
                    });
                }
            });
    }

    setActiceLesson(children: ElnBaiHoc) {
        const status = children.status ? 0 : 1;
        this.coursePlanActivitiesService
            .updateCoursePlanActivities(children.id, { status: status })
            .subscribe({
                next: () => {
                    this.loadCoursePlan();
                    this.noitifi.toastSuccess('Cập nhật thành công');
                },
                error: () => {
                    this.noitifi.toastError('Cập nhật thất bại');
                    this.noitifi.isProcessing(false);
                },
            });
    }

    /** video_marker */

    onSeekingTn(event) {
        this.time_video.time_stamp = event;
        this.time_video.time_convert = this.millisToMinutesAndSeconds(event);
    }

    loadVideoMarker() {
        this.list_question_in_video = [];

        this.form_question_marker = {
            collection_id: this.selectPlan.id,
            collection_type: 'COURSE_PLAN_ACTIVITY',
            video_marker_id: 0,
            question_direction: null,
            answer_correct: null,
            config: {
                cols: 1,
            },
            answer_option: [
                {
                    id: '1',
                    value: 'Đáp án 1',
                    checked: false,
                },
                {
                    id: '2',
                    value: 'Đáp án 2',
                    checked: false,
                },
            ],
        };

        const condition: ConditionOption = {
            condition: [
                {
                    conditionName: 'collection_id',
                    condition: OvicQueryCondition.equal,
                    value: this.selectPlan.id.toString(),
                },
                {
                    conditionName: 'collection_type',
                    condition: OvicQueryCondition.equal,
                    value: 'COURSE_PLAN_ACTIVITY',
                    orWhere: 'and',
                },
            ],
            set: [],
            page: null,
        };

        forkJoin([
            this.videoMarkerService.getVideoMarkerByPageNew(condition),
            this.videoMarkerQuestionService.getVideoMarkerQuestionByPageNew(
                condition
            ),
        ]).subscribe({
            next: ([_mark, _question]) => {
                _mark.data.forEach((f) => {
                    f['time_convert'] = this.millisToMinutesAndSeconds(
                        f['time']
                    );
                    const child = _question.data.filter(
                        (m) => m.video_marker_id === f.id
                    );
                    child.forEach((c, key) => {
                        const correct = c.answer_correct
                            .replace(/\,/gi, '|')
                            .split('|')
                            .filter((m) => m && m !== '');
                        c.answer_option.forEach((a) => {
                            const index = correct.findIndex(
                                (m) => m.toString() === a.id.toString()
                            );
                            if (index !== -1) {
                                a['checked'] = true;
                            }
                        });
                    });

                    f['children'] = child;
                });

                this.list_question_in_video = this.helperService.sort(
                    _mark.data,
                    'time'
                );
                this.noitifi.isProcessing(false);
            },
            error: () => {
                this.noitifi.isProcessing(false);
            },
        });
    }

    millisToMinutesAndSeconds(millis) {
        let minutes = Math.floor(millis / 60);
        let seconds = Number(millis % 60);
        return minutes + ':' + (seconds < 10 ? '0' : '') + Math.floor(seconds);
    }

    addAnwerQuestion(child) {
        if (child && child['answer_option']) {
            child['answer_option'].push({
                id: (child['answer_option'].length + 1).toString(),
                value: null,
                checked: false,
            });
        }
    }

    deleteAnwerVideo(child, index) {
        child.splice(index, 1);
        // child.forEach((f, key) => {
        //     f['id'] = (key + 1).toString();
        // })
    }

    addQuestionIntime() {
        // const time_id = this.time_video.time_convert.replace(/\D/g, '_');
        const index = this.list_question_in_video.findIndex(
            (m) => m['time_convert'] === this.time_video.time_convert
        );
        this.noitifi.isProcessing(true);
        let answer_option = [];
        let answer_correct = [];
        if (this.form_question_marker['answer_option']) {
            this.form_question_marker['answer_option'].forEach((f) => {
                answer_option.push({ id: f.id, value: f.value });
                if (f['checked']) {
                    answer_correct.push(f.id);
                }
            });
        }

        if (answer_correct && answer_correct.length) {
            const object_question: VideoMarkerQuestion = {
                collection_id: this.selectPlan.id,
                collection_type: 'COURSE_PLAN_ACTIVITY',
                video_marker_id: 0,
                question_direction:
                    this.form_question_marker.question_direction,
                answer_correct: '|'.concat(answer_correct.toString(), '|'),
                answer_option: answer_option,
                config: this.form_question_marker.config,
            };

            if (index !== -1) {
                object_question.video_marker_id =
                    this.list_question_in_video[index].id;
                this.videoMarkerQuestionService
                    .addVideoMarkerQuestion(object_question)
                    .subscribe({
                        next: () => {
                            // this.noitifi.isProcessing(false);
                            this.noitifi.toastSuccess('Thêm thành công');
                            this.loadVideoMarker();
                        },
                        error: () => {
                            this.noitifi.isProcessing(false);
                            this.noitifi.toastError(
                                'Lỗi kết nối, vui lòng thử lại'
                            );
                        },
                    });
            } else {
                const object_mark = {
                    time: this.time_video.time_stamp,
                    collection_id: this.selectPlan.id,
                    collection_type: 'COURSE_PLAN_ACTIVITY',
                };

                this.videoMarkerService
                    .addVideoMarker(object_mark)
                    .pipe(
                        mergeMap((_mar) => {
                            object_question.video_marker_id = _mar;
                            return this.videoMarkerQuestionService
                                .addVideoMarkerQuestion(object_question)
                                .pipe(
                                    mergeMap(() => {
                                        return of(null);
                                    })
                                );
                        })
                    )
                    .subscribe({
                        next: () => {
                            this.noitifi.toastSuccess('Thêm thành công');
                            this.loadVideoMarker();
                        },
                        error: () => {
                            this.noitifi.isProcessing(false);
                            this.noitifi.toastError(
                                'Lỗi kết nối, vui lòng thử lại'
                            );
                        },
                    });
            }
        } else {
            this.noitifi.toastWarning(
                'Vui lòng chọn đáp án đúng trước khi thực hiện thao tác này'
            );
            this.noitifi.isProcessing(false);
        }
    }

    deleteQuestionVideo(quest) {
        this.noitifi.confirmDelete().then((a) => {
            if (a) {
                this.videoMarkerQuestionService
                    .deleteVideoMarkerQuestion(quest.id)
                    .subscribe({
                        next: () => {
                            this.noitifi.toastSuccess('Xóa thành công');
                            this.loadVideoMarker();
                        },
                        error: () => {
                            this.noitifi.toastError(
                                'Xóa thất bại, lỗi kết nỗi'
                            );
                        },
                    });
            }
        });
    }

    deleteMarkVideo(mark) {
        this.noitifi.confirmDelete().then((a) => {
            if (a) {
                forkJoin([
                    this.videoMarkerService.deleteVideoMarker(mark.id),
                    this.videoMarkerQuestionService.deleteVideoMarkerQuestionByCol(
                        mark.id.toString(),
                        'video_marker_id'
                    ),
                ]).subscribe({
                    next: () => {
                        this.noitifi.toastSuccess('Xóa thành công');
                        this.loadVideoMarker();
                    },
                    error: () => {
                        this.noitifi.toastError('Xóa thất bại, lỗi kết nỗi');
                    },
                });
            }
        });
    }

    onOpenAddCdr() {
        this.chuandauraComponent().onOpenAddCdr();
    }

    backToQuanly() {
        if (this.kd_hoidong || this.kd_uyvien) {
            this.router.navigate(['admin/duyetnoidung-hoctap']);
        } else {
            this.router.navigate(['admin/kehoach-hoctap']);
        }
    }

    checkPlanActivity(plan: CoursePlanActivities) {
        if (plan['children'] && plan['children'].length) {
            plan['children'].forEach((f) => {
                f['checked'] = plan['checked'];
                if (f['children'] && f['children'].length) {
                    f['children'].forEach((c) => {
                        c['checked'] = plan['checked'];
                    });
                }
            });
        }

        const index = this.list_plan.findIndex((m) => m.id === plan.parent_id);
        if (index !== -1) {
            if (plan['checked']) this.list_plan[index]['checked'] = true;
        }
    }

    changeStatusApproved(check: boolean) {
        const ids = [];

        this.list_plan.forEach((f) => {
            if (f['checked']) {
                ids.push(f.id);
            }

            if (f['children'] && f['children'].length) {
                f['children'].forEach((c) => {
                    if (c['checked']) {
                        if (c.type !== 'CDR') {
                            ids.push(c.id);
                        }
                    }

                    if (c['children'] && c['children'].length) {
                        c['children'].forEach((t) => {
                            if (t['checked']) {
                                ids.push(t.id);
                            }
                        });
                    }
                });
            }
        });

        if (ids.length) {
            this.noitifi
                .confirm(
                    check === true
                        ? 'Bạn có chắc chắn thực hiện thao tác duyệt?'
                        : 'Bạn có chắc chắn hủy trạng thái duyệt?',
                    'Xác nhận hành động',
                    [BUTTON_YES, BUTTON_NO]
                )
                .then((a) => {
                    if (a.name === 'yes') {
                        this.displayModal = true;
                        this.progressValue = 0;
                        this.loopUpdateStatus(ids[0], ids, 0, check);
                    }
                });
        } else {
            this.noitifi.toastWarning(
                'Vui lòng chọn nội dung trước khi thực hiện thao tác này'
            );
        }
    }

    loopUpdateStatus(id, ids, key: number, check: boolean) {
        if (key < ids.length) {
            this.progressValue = ((key + 1) / ids.length) * 100;
            this.coursePlanActivitiesService
                .updateCoursePlanActivities(id.toString(), {
                    status: check === true ? 1 : 0,
                    approved_by: this.auth.user.id,
                })
                .subscribe({
                    next: () => {
                        this.loopUpdateStatus(
                            ids[key + 1],
                            ids,
                            key + 1,
                            check
                        );
                    },
                    error: () => {
                        this.displayModal = false;
                        this.noitifi.toastError(
                            'Cập nhật thất bại, lỗi kết nối'
                        );
                    },
                });
        } else {
            this.displayModal = false;
            this.noitifi.toastSuccess('Cập nhật thành công');
            this.loadCoursePlan();
        }
    }

    yeucauduyet(activity: CoursePlanActivities) {
        this.noitifi
            .confirm(
                '<div class="alert-duyetnoidung">' +
                '<span>- Bạn đang thực hiện thao tác yêu cầu duyệt nội dung giảng dạy</span>' +
                '<span>- Thao tác này không thể hoàn tác</span>' +
                '<span>- Bạn có chắc chắn yêu cầu duyệt nội dung giảng dạy này?</span>' +
                '</div>',
                'Xác nhận hành động',
                [BUTTON_YES, BUTTON_NO]
            )
            .then((a) => {
                if (a.name === 'yes') {
                    this.noitifi.isProcessing(true);
                    const request: Observable<any>[] = [
                        this.coursePlanActivitiesService.updateCoursePlanActivities(
                            activity.id,
                            { status: -2 }
                        ),
                    ];
                    if (this.selectPlan.week === 0) {
                        if (this.selectPlan['children']) {
                            this.selectPlan['children'].forEach((f) => {
                                if (f.type === 'GIOITHIEU') {
                                    request.push(
                                        this.coursePlanActivitiesService.updateCoursePlanActivities(
                                            f.id,
                                            { status: -2 }
                                        )
                                    );
                                }
                            });
                        }
                    }
                    forkJoin(request).subscribe({
                        next: () => {
                            this.selectActivityId = activity.id;
                            this.loadCoursePlan();
                            this.noitifi.isProcessing(false);
                            this.noitifi.toastSuccess('Cập nhật thành công');
                        },
                        error: () => {
                            this.noitifi.isProcessing(false);
                            this.noitifi.toastError(
                                'Cập nhật thất bại, Lỗi kết nối'
                            );
                        },
                    });
                }
            });
    }


    /** end */

    /** tạo bài kiểm tra trắc nghiệm */


    // getTuluanActivityPromise (): Promise<any> {
    //     return new Promise( ( resolve, reject ) => {
    //         this.coursePlanActivitiesService
    //             .updateCoursePlanActivities( this.selectPlan.id, {
    //                 title: this.planName,
    //             } )
    //             .subscribe( {
    //                 next: () => {
    //                     resolve( null );
    //                 },
    //                 error: () => {
    //                     this.noitifi.toastError( 'Lỗi kết nối vui lòng thử lại' );
    //                     reject( null );
    //                 },
    //             } );
    //     } );
    // }

    createTestThuongxuyen() {
        this.PLAN_RIGHT_KEY = 'create_test_thuongxuyen';
        this.list_test_thuongxuyen = [];
        if (this.courseSelected.params && this.courseSelected.params.sotinchi) {
            let type = null;
            switch (this.courseSelected.params.exam_format) {
                case 'DUAN':
                    type = "THUONGXUYEN_DUAN";
                    break;
                case 'THUCHANH':
                    type = "THUONGXUYEN_TULUAN";
                    break;
                case 'TRACNGHIEM':
                    type = "THUONGXUYEN_TRACNGHIEM";
                    break;
            }


            switch (key_server) {
                case 'ictu':
                    this.createTestIctu(type);
                    break;
                case 'hvu':
                    this.createTestHvu(type);
                    break;
                default:
                    break;
            }

        } else {
            this.noitifi.toastWarning('Vui lòng cài đặt số tín chỉ cho môn học');
        }
    }

    createTestIctu(type) {
        this.PLAN_RIGHT_KEY = 'create_test_thuongxuyen';
        if (this.courseSelected.params && this.courseSelected.params.sotinchi) {
            const index = this.list_plan.findIndex(m => m.week === 1000);
            if (index !== -1) {
                const data: CoursePlanActivities[] = [];
                const data_duan: CoursePlanActivities[] = [];
                this.list_plan[index].children.forEach(f => {
                    const test: CoursePlanActivities = {
                        id: f.id,
                        course_id: f.course_id,
                        week: 1000,
                        title: f.title,
                        desc: f.desc,
                        video: f.video,
                        videos: f.videos,
                        files: f.files,
                        ordering: f.ordering,
                        status: 1,
                        course_lesson_id: f.course_lesson_id,
                        parent_id: f.parent_id,
                        type: f.type,
                        desc_title: f.desc_title,
                        edit: f.edit,
                        slides: f.slides,
                        disabled_type: f.disabled_type
                    }

                    if (f.ordering !== 0 && f.ordering !== 100) {
                        data.push(test);
                    } else {
                        if (this.courseSelected.params.exam_format === 'DUAN')
                            data_duan.push(test);
                    }
                })

                if (this.courseSelected && this.courseSelected.params && this.courseSelected.params.sotinchi) {
                    if (data.length < this.courseSelected.params.sotinchi) {
                        for (let i = data.length + 1; i <= this.courseSelected.params.sotinchi; i++) {
                            const test: CoursePlanActivities = {
                                course_id: this.courseSelected.id,
                                week: 1000,
                                title: 'Bài kiểm tra thường xuyên '.concat(i.toString()),
                                desc: null,
                                video: null,
                                videos: null,
                                files: null,
                                ordering: i,
                                status: 1,
                                course_lesson_id: 0,
                                parent_id: this.list_plan[index].id,
                                type: type,
                                desc_title: null,
                                edit: 1,
                                slides: null
                            }
                            data.push(test);
                        }
                    }
                }

                if (data_duan.length > 0) {
                    data_duan.splice(1, 0, ...data);
                    this.list_test_thuongxuyen = data_duan;
                } else {
                    this.list_test_thuongxuyen = data;
                }

            } else {
                const data: CoursePlanActivities[] = [];
                for (let i = 1; i <= this.courseSelected.params.sotinchi; i++) {
                    const test: CoursePlanActivities = {
                        course_id: this.courseSelected.id,
                        week: 1000,
                        title: 'Bài kiểm tra thường xuyên '.concat(i.toString()),
                        desc: null,
                        video: null,
                        videos: null,
                        files: null,
                        ordering: i,
                        status: 1,
                        course_lesson_id: 0,
                        parent_id: null,
                        type: type,
                        desc_title: null,
                        edit: 1,
                        slides: null
                    }
                    data.push(test);
                }
                this.list_test_thuongxuyen = data;
            }

            if (this.courseSelected.params.exam_format === 'DUAN') {

                const index_0 = this.list_test_thuongxuyen.findIndex(m => m.ordering === 0);

                if (index_0 === -1) {
                    const test: CoursePlanActivities = {
                        course_id: this.courseSelected.id,
                        week: 1000,
                        title: 'Danh sách dự án',
                        desc: null,
                        video: null,
                        videos: null,
                        files: null,
                        ordering: 0,
                        status: 1,
                        course_lesson_id: 0,
                        parent_id: this.list_plan[index].id,
                        type: type,
                        desc_title: null,
                        edit: 1,
                        slides: null
                    }
                    this.list_test_thuongxuyen.splice(0, 0, test);
                }

                const index_100 = this.list_test_thuongxuyen.findIndex(m => m.ordering === 100);

                if (index_100 === -1) {
                    const test: CoursePlanActivities = {
                        course_id: this.courseSelected.id,
                        week: 1000,
                        title: 'Thi kết thúc học phần',
                        desc: null,
                        video: null,
                        videos: null,
                        files: null,
                        ordering: 100,
                        status: 1,
                        course_lesson_id: 0,
                        parent_id: this.list_plan[index].id,
                        type: type,
                        desc_title: null,
                        edit: 1,
                        slides: null
                    }

                    this.list_test_thuongxuyen.push(test);
                }
            }
        } else {
            this.noitifi.toastWarning('Vui lòng cài đặt số tín chỉ cho môn học');
        }
    }

    createTestHvu(type) {
        const index = this.list_plan.findIndex(m => m.week === 1000);

        let maxTest = 1;

        if (Number(this.courseSelected.params.sotinchi) > 2) {
            maxTest = 2;
        }

        if (index !== -1) {
            const data: CoursePlanActivities[] = [];
            const data_duan: CoursePlanActivities[] = [];
            this.list_plan[index].children.forEach(f => {
                const test: CoursePlanActivities = {
                    id: f.id,
                    course_id: f.course_id,
                    week: 1000,
                    title: f.title,
                    desc: f.desc,
                    video: f.video,
                    files: f.files,
                    ordering: f.ordering,
                    status: 1,
                    course_lesson_id: f.course_lesson_id,
                    parent_id: f.parent_id,
                    type: f.type,
                    desc_title: f.desc_title,
                    edit: f.edit,
                    slides: f.slides,
                    disabled_type: f.disabled_type
                }

                if (f.ordering !== 0 && f.ordering !== 100) {
                    data.push(test);
                } else {
                    if (this.courseSelected.params.exam_format === 'DUAN')
                        data_duan.push(test);
                }
            })


            if (data.length < maxTest) {
                for (let i = data.length + 1; i <= maxTest; i++) {
                    const test: CoursePlanActivities = {
                        course_id: this.courseSelected.id,
                        week: 1000,
                        title: 'Bài kiểm tra thường xuyên '.concat(i.toString()),
                        desc: null,
                        video: null,
                        videos: null,
                        files: null,
                        ordering: i,
                        status: 1,
                        course_lesson_id: 0,
                        parent_id: this.list_plan[index].id,
                        type: type,
                        desc_title: null,
                        edit: 1,
                        slides: null
                    }

                    data.push(test);
                }
            }

            if (data_duan.length > 0) {
                data_duan.splice(1, 0, ...data);
                this.list_test_thuongxuyen = data_duan;
            } else {
                this.list_test_thuongxuyen = data;
            }


        } else {
            const data: CoursePlanActivities[] = [];

            for (let i = 1; i <= maxTest; i++) {
                const test: CoursePlanActivities = {
                    course_id: this.courseSelected.id,
                    week: 1000,
                    title: 'Bài kiểm tra thường xuyên '.concat(i.toString()),
                    desc: null,
                    video: null,
                    videos: null,
                    files: null,
                    ordering: i,
                    status: 1,
                    course_lesson_id: 0,
                    parent_id: null,
                    type: type,
                    desc_title: null,
                    edit: 1,
                    slides: null
                }
                data.push(test);
            }

            this.list_test_thuongxuyen = data;
        }

        if (this.courseSelected.params.exam_format === 'DUAN') {
            const index_0 = this.list_test_thuongxuyen.findIndex(m => m.ordering === 0);
            if (index_0 === -1) {
                const test: CoursePlanActivities = {
                    course_id: this.courseSelected.id,
                    week: 1000,
                    title: 'Danh sách dự án',
                    desc: null,
                    video: null,
                    videos: null,
                    files: null,
                    ordering: 0,
                    status: 1,
                    course_lesson_id: 0,
                    parent_id: this.list_plan[index].id,
                    type: type,
                    desc_title: null,
                    edit: 1,
                    slides: null
                }
                this.list_test_thuongxuyen.splice(0, 0, test);
            }

            const index_100 = this.list_test_thuongxuyen.findIndex(m => m.ordering === 100);

            if (index_100 === -1) {
                const test: CoursePlanActivities = {
                    course_id: this.courseSelected.id,
                    week: 1000,
                    title: 'Thi kết thúc học phần',
                    desc: null,
                    video: null,
                    videos: null,
                    files: null,
                    ordering: 100,
                    status: 1,
                    course_lesson_id: 0,
                    parent_id: this.list_plan[index].id,
                    type: type,
                    desc_title: null,
                    edit: 1,
                    slides: null
                }

                this.list_test_thuongxuyen.push(test);
            }
        }
    }

    createThuongxuyenDuan() { // Hàm này không dùng nữa
        let maxTest = this.courseSelected.params.sotinchi;

        switch (key_server) {
            case 'hvu':
                maxTest = maxTest > 2 ? 2 : 1;
                break;
            default:
                break;
        }

        const index = this.list_plan.findIndex(m => m.week === 1000);

        if (index === -1) {
            const data: CoursePlanActivities[] = [];
            for (let i = 0; i <= maxTest; i++) {
                const test: CoursePlanActivities = {
                    course_id: this.courseSelected.id,
                    week: 1000,
                    title: i === 0 ? 'Danh sách dự án' : 'Bài kiểm tra thường xuyên '.concat(i.toString()),
                    desc: null,
                    video: null,
                    videos: null,
                    files: null,
                    ordering: i,
                    status: 1,
                    course_lesson_id: 0,
                    parent_id: null,
                    type: 'THUONGXUYEN_DUAN',
                    desc_title: null,
                    edit: 1,
                    slides: null
                }
                data.push(test);
            }
            this.list_test_thuongxuyen = data;

            this.saveTestThuongXuyen();
        } else {
            this.noitifi.toastInfo("Bài kiểm tra thường xuyên dạng dự án đã được tạo rồi");
        }
    }

    /** test */

    onSelectBaiForQuestion(event: CoursePlanActivities, quest: structure) {
        if (event) {
            quest.course_plan_activity_id = event.id;
            this.list_cdr_for_test = event['children'][1].children;
            quest.cdr_id = this.list_cdr_for_test[0].id;
        }
    }

    onChangeTypeTest(event, test: CoursePlanActivities) {
        if (event) {
            test.type = event.key;
        }
    }

    saveTestThuongXuyen() {
        this.noitifi.isProcessing(true);
        const index = this.list_plan.findIndex(m => m.week === 1000);
        if (index !== -1) {
            const request: Observable<any>[] = [];
            this.list_test_thuongxuyen.forEach(f => {
                const id = f.id;
                delete f.disabled_type;
                if (f.id) {
                    delete f.id;
                    request.push(this.coursePlanActivitiesService.updateCoursePlanActivities(id, f))
                } else {
                    request.push(this.coursePlanActivitiesService.addCoursePlanActivities(f))
                }

            })

            forkJoin(request).subscribe({
                next: () => {
                    this.noitifi.toastSuccess("Thêm thành công");
                    this.noitifi.isProcessing(false);
                    this.PLAN_RIGHT_KEY = null;
                    this.loadCoursePlan();
                },
                error: () => {
                    this.noitifi.toastSuccess("Thêm thất bại");
                    this.noitifi.isProcessing(false);
                }
            })
        } else {
            const test: CoursePlanActivities = {
                course_id: this.courseSelected.id,
                week: 1000,
                title: 'Kiểm tra thường xuyên',
                desc: null,
                video: null,
                videos: null,
                files: null,
                ordering: 1000,
                status: 1,
                course_lesson_id: 0,
                parent_id: 0,
                type: 'PLAN',
                desc_title: null,
                edit: 1,
                slides: null
            }

            this.coursePlanActivitiesService.addCoursePlanActivities(test).pipe(mergeMap(_id => {
                const request: Observable<any>[] = [];
                this.list_test_thuongxuyen.forEach(f => {
                    f.parent_id = _id;
                    request.push(this.coursePlanActivitiesService.addCoursePlanActivities(f))
                })

                return forkJoin(request).pipe(mergeMap(() => {
                    return of(null)
                }))
            })).subscribe({
                next: () => {
                    this.noitifi.toastSuccess("Thêm thành công");
                    this.noitifi.isProcessing(false);
                    this.PLAN_RIGHT_KEY = null;
                    this.loadCoursePlan();
                },
                error: () => {
                    this.noitifi.toastSuccess("Thêm thất bại");
                    this.noitifi.isProcessing(false);
                }
            })
        }
    }

    openFormAddLesson(add_lesson: boolean = false) {
        if (this.unlimitLesson) {
            this.formTitle = add_lesson ? "Tạo bài giảng" : "Thêm bài giảng";
            this.modalService.open(this.formAddBaigiang(), NORMAL_MODAL_OPTIONS);
        } else {
            this.firstCreatePlan();
        }
    }

    closeForm(d) {
        d(true);
    }

    saveAddLesson(d) {
        if (this.numberAddLesson) {
            d(true);
            const number_lesson = this.list_plan ? this.list_plan.filter(m => m.week > 0 && m.week < 100).length + parseInt(this.numberAddLesson.toString()) : parseInt(this.numberAddLesson.toString())
            this.firstCreatePlan(number_lesson);
        } else {
            this.noitifi.toastWarning("Vui lòng nhập vào số bài giảng lớn hơn 0");
        }
    }

    numberCheck(event, inputPoint_quest) {
        if (event) {
            if (/[0-9]/.test(event.key) || event.key === 'Backspace') {
                if (inputPoint_quest.value.replace(/\d/gi, '').length > 0) {
                    event.preventDefault();
                }
            } else {
                event.preventDefault();
            }
        }
    }

    checkDeleteBaigiang(index: number): boolean {
        let result = false;

        const data = this.list_plan.filter(m => m.week < 100);

        if (index === data.length - 1 && this.list_plan[index] && this.list_plan[index].week !== 0 && this.unlimitLesson) {
            result = true;
        }

        return result;
    }

    async deleteItemKynang(item: CoursePlanActivities) {
        if (!item.id) {
            return this.noitifi.toastWarning('Bài kiểm tra thường xuyên chưa được tạo');
        }

        const confirm = await this.noitifi.confirmDelete();

        if (confirm) {
            this.noitifi.isProcessing(true);
            this.coursePlanActivitiesService.deleteCoursePlanActivities(item.id).subscribe({
                next: () => {
                    this.loadCoursePlan();
                    this.noitifi.isProcessing(false);
                    this.noitifi.toastSuccess('Thao tác thành công');

                }, error: () => {
                    this.noitifi.isProcessing(false);
                    this.noitifi.toastError('Thao tác không thành công');
                }
            })
        }
    }

}
