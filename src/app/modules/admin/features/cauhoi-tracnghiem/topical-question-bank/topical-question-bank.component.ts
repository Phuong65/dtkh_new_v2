import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '@core/services/notification.service';
import { CourseBankService } from '@shared/services/course-bank-service';
import { FormBuilder, FormsModule } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { ElngUserProfileService } from '@shared/services/elearning-user-profile.service';
import { ElnKhoaHocService } from '@shared/services/elearning-khoa-hoc.service';
import { HelperService } from '@core/services/helper.service';
import { DonViService } from '@shared/services/don-vi.service';
import { CourseQuestionsService } from '@shared/services/course-questions.service';
import { TreeModule } from 'primeng/tree';
import { forkJoin, Observable, of, switchMap, tap } from 'rxjs';
import { OvicQueryCondition } from '@core/models/dto';
import { ConditionOption } from '@shared/models/condition-option';
import { map, mergeMap } from 'rxjs/operators';
import { DonVi } from '@shared/models/don-vi';
import { ElnKhoaHoc } from '@shared/models/elng-khoa-hoc';
import { CoursePlanActivitiesService } from '@shared/services/course-plan-activities.service';
import { CoursePlanActivities } from '@shared/models/course-plan-activities';
import { CourseQuestions } from '@shared/models/course-questions';
import { SidebarModule } from 'primeng/sidebar';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import {
    cdrId2Name,
    CdrName,
    CoursePlanActivitiesCdr,
    CoursePlanActivitiesExtends,
    CourseQuestionHierarchy,
    coursePlanActivitiesExtendsChecker,
    CoursePlanActivitiesCdrGroup,
    cdrName2Id,
    validateCoursePlanActivitiesCdrGroup,
    SelectOptions,
    isCoursePlanActivityCdrVerify,
} from '@modules/admin/features/cauhoi-tracnghiem/models/bank-questions';
import { DropdownModule } from 'primeng/dropdown';
import {
    CreateQuestionComponent,
    CreateQuestionInfo,
} from '@modules/admin/features/cauhoi-tracnghiem/questions/create-question/create-question.component';
import { ListQuestionsComponent } from '@modules/admin/features/cauhoi-tracnghiem/questions/list-questions/list-questions.component';
import { TooltipModule } from 'primeng/tooltip';
import { ElngUserProfile } from '@shared/models/elng-user-profile';
import { CHUAN_DAU_RA, LARGE_MODAL_OPTIONS, NORMAL_MODAL_OPTIONS_FOLDER, ROLES, ROUTERS } from '@modules/shared/utils/syscat';
import { NgbModal, NgbTooltip, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import {APP_CONFIGS, key_server} from '@env';
import { NORMAL_MODAL_OPTIONS } from '@core/utils/syscat';
import { TableModule } from 'primeng/table';
import { SharedModule } from '@modules/shared/shared.module';
import { CheckBox } from 'docx';
import { CheckboxModule } from 'primeng/checkbox';
import { BUTTON_NO, BUTTON_YES } from '@core/models/buttons';


type EmployeeRole = 'truong_ld' | 'khoa_ld' | 'giangvien' | 'bomon_ld';

type TopicalQuestionBankMenuName = 'organization' | 'course';

class TopicalQuestionBankTree {
    type: TopicalQuestionBankMenuName;

    organization: DonVi = null;

    course: ElnKhoaHoc = null;

    activated: boolean = false;

    private loaded: boolean = false;

    label: string;

    icon: string = 'fa fa-folder-o';

    children: TopicalQuestionBankTree[] = [];

    private _expanded: boolean = false;

    get expanded(): boolean {
        return this._expanded;
    }

    private _loading: boolean = false;

    get loading(): boolean {
        return this._loading;
    }

    private service: ElnKhoaHocService;

    constructor(
        type: TopicalQuestionBankMenuName,
        organization: DonVi,
        course: ElnKhoaHoc,
        service: ElnKhoaHocService
    ) {
        this.type = type;
        this.organization = organization;
        this.course = course;
        this.service = service;
        if (course) {
            this.label = course.title;
            this.icon = 'fa fa-graduation-cap';
        }
        if (organization) {
            this.label = organization.title;
            this.icon = 'fa fa-folder-o';
        }
    }

    toggle(): void {
        if (!this._loading) {
            if (this._expanded) {
                this._expanded = false;
                this.icon = 'fa fa-folder-o';
            } else {
                if (this.loaded) {
                    this._expanded = true;
                    this.icon = 'fa fa-folder-open-o';
                } else {
                    this.icon = 'fa fa-spinner fa-pulse fa-fw';
                    this.loadChild();
                }
            }
        }
    }

    private loadChild(): void {
        const condition: ConditionOption = {
            condition: [
                {
                    conditionName: 'category_ids',
                    condition: OvicQueryCondition.equal,
                    value: this.organization.id.toString(),
                },
            ],
            set: [{ label: 'limit', value: '-1' }],
            page: null,
        };
        this._loading = true;
        this.service.getKhoaHocByPageNew_2(condition).subscribe({
            next: (res): void => {
                this.children = res.data
                    .reduce(
                        (
                            reducer: TopicalQuestionBankTree[],
                            course: ElnKhoaHoc
                        ): TopicalQuestionBankTree[] => {
                            reducer.push(
                                new TopicalQuestionBankTree(
                                    'course',
                                    null,
                                    course,
                                    null
                                )
                            );
                            return reducer;
                        },
                        new Array<TopicalQuestionBankTree>()
                    )
                    .sort((a, b) => a.label.localeCompare(b.label));
                this.loaded = true;
                this.icon = 'fa fa-folder-open-o';
                this._expanded = true;
                this._loading = false;
            },
            error: (): void => {
                this._loading = false;
                this.icon = 'fa fa-folder-o';
            },
        });
    }
}

export type InputQuestionMode = 'list' | 'edit' | 'create';

interface InputQuestion {
    enable: boolean;
    info: CreateQuestionInfo;
    cdrName: CdrName | 'total';
    mode: InputQuestionMode;
    btnFormAddNew: boolean;
    ready: boolean;
}

export const getCdrRequire: (
    c: CoursePlanActivities,
    name: CdrName
) => number = (c: CoursePlanActivities, name: CdrName): number => {
    return c.cdr_cauhoi && c.cdr_cauhoi[cdrName2Id(name)]
        ? c.cdr_cauhoi[cdrName2Id(name)]
        : 0;
};

@Component({
    selector: 'app-topical-question-bank',
    standalone: true,
    imports: [
        CommonModule,
        TreeModule,
        SidebarModule,
        ButtonModule,
        RippleModule,
        DropdownModule,
        FormsModule,
        CreateQuestionComponent,
        ListQuestionsComponent,
        TooltipModule,
        NgbTooltipModule,
        TableModule,
        SharedModule,
        CheckboxModule
    ],
    templateUrl: './topical-question-bank.component.html',
    styleUrls: ['./topical-question-bank.component.css'],
})
export class TopicalQuestionBankComponent implements OnInit {
    menuLoading: boolean = false;

    loading: boolean = false;

    error: boolean = false;

    course: ElnKhoaHoc;

    courses: ElnKhoaHoc[];

    treeMenu: TopicalQuestionBankTree[];

    userProfile: ElngUserProfile;

    emptyMenu: string = 'Không có đơn vị';

    chuandaura = CHUAN_DAU_RA;

    show_button_create_week_100: boolean = false;

    private menuLoader: Record<EmployeeRole, () => Observable<TopicalQuestionBankTree[]>> = {
        truong_ld: (): Observable<TopicalQuestionBankTree[]> => {
            this.emptyMenu = 'Không có đơn vị';
            const condition: ConditionOption = {
                condition: [
                    {
                        conditionName: 'status',
                        condition: OvicQueryCondition.greaterThan,
                        value: '0',
                    },
                    {
                        conditionName: 'parent_id',
                        condition: OvicQueryCondition.equal,
                        value: this.auth.userDonViId.toString(),
                        orWhere: 'and',
                    },
                ],
                set: [
                    { label: 'limit', value: '-1' },
                    { label: 'order', value: 'ASC' },
                    { label: 'orderby', value: 'title' }
                ],
                page: null,
            };
            return this.donViService.getDonviByPageNew(condition).pipe(
                map((res): TopicalQuestionBankTree[] => {
                    return res.data && res.data.length
                        ? res.data.reduce(
                            (
                                reducer: TopicalQuestionBankTree[],
                                donvi: DonVi
                            ): TopicalQuestionBankTree[] => {
                                reducer.push(
                                    new TopicalQuestionBankTree(
                                        'organization',
                                        donvi,
                                        null,
                                        this.elnKhoaHocService
                                    )
                                );
                                return reducer;
                            },
                            new Array<TopicalQuestionBankTree>()
                        )
                        : [];
                })
            );
        },
        khoa_ld: (): Observable<TopicalQuestionBankTree[]> => {
            this.emptyMenu = 'Đơn vị hiện tại của bạn chưa có môn học nào';
            return this._loadUserProfile().pipe(
                switchMap((profile) => {
                    const condition: ConditionOption = {
                        condition: [
                            {
                                conditionName: 'category_ids',
                                condition: OvicQueryCondition.equal,
                                value: profile.donvi_chuyenmon_id ? profile.donvi_chuyenmon_id.toString(10) : '-1',
                            },
                        ],
                        set: [{ label: 'limit', value: '-1' }],
                        page: null,
                    };
                    return this.elnKhoaHocService.getKhoaHocByPageNew_2(
                        condition
                    );
                }),
                map((res) => {
                    return res.data && res.data.length
                        ? res.data.reduce(
                            (
                                reducer: TopicalQuestionBankTree[],
                                course
                            ): TopicalQuestionBankTree[] => {
                                reducer.push(
                                    new TopicalQuestionBankTree(
                                        'course',
                                        null,
                                        course,
                                        null
                                    )
                                );
                                return reducer;
                            },
                            new Array<TopicalQuestionBankTree>()
                        )
                        : [];
                })
            );
        },
        bomon_ld: (): Observable<TopicalQuestionBankTree[]> => {
            this.emptyMenu = 'Đơn vị hiện tại của bạn chưa có môn học nào';
            return this._loadUserProfile().pipe(
                switchMap((profile) => {
                    const condition: ConditionOption = {
                        condition: [
                            {
                                conditionName: 'nganh_bomon_id',
                                condition: OvicQueryCondition.equal,
                                value: profile.bomon_id ? profile.bomon_id.toString(10) : '-1',
                            },
                        ],
                        set: [{ label: 'limit', value: '-1' }],
                        page: null,
                    };
                    return this.elnKhoaHocService.getKhoaHocByPageNew_2(
                        condition
                    );
                }),
                map((res) => {
                    return res.data && res.data.length
                        ? res.data.reduce(
                            (
                                reducer: TopicalQuestionBankTree[],
                                course
                            ): TopicalQuestionBankTree[] => {
                                reducer.push(
                                    new TopicalQuestionBankTree(
                                        'course',
                                        null,
                                        course,
                                        null
                                    )
                                );
                                return reducer;
                            },
                            new Array<TopicalQuestionBankTree>()
                        )
                        : [];
                })
            );
        },
        giangvien: (): Observable<TopicalQuestionBankTree[]> => {
            this.emptyMenu =
                'Bạn hiện tại chưa được phân quyền cập nhật cho môn học nào cả!';
            const condition: ConditionOption = {
                condition: [
                    {
                        conditionName: 'creator_plan_id',
                        condition: OvicQueryCondition.equal,
                        value: this.auth.user.id.toString(10),
                    },
                ],
                set: [{ label: 'limit', value: '-1' }],
                page: null,
            };
            return this.elnKhoaHocService.getKhoaHocByPageNew_2(condition).pipe(
                map((res) => {
                    return res.data && res.data.length
                        ? res.data.reduce(
                            (
                                reducer: TopicalQuestionBankTree[],
                                course
                            ): TopicalQuestionBankTree[] => {
                                reducer.push(
                                    new TopicalQuestionBankTree(
                                        'course',
                                        null,
                                        course,
                                        null
                                    )
                                );
                                return reducer;
                            },
                            new Array<TopicalQuestionBankTree>()
                        )
                        : [];
                })
            );
        },
    };

    invalidRole: boolean = false;

    loadingCourse: boolean = false;

    loadingCourseFail: boolean = false;

    chapters: CoursePlanActivitiesExtends[];

    courseQuestionHierarchy: CourseQuestionHierarchy[];

    inputQuestion: InputQuestion = {
        info: null,
        enable: false,
        btnFormAddNew: false,
        ready: false,
        cdrName: null,
        mode: 'create',
    };

    cdrOptions: SelectOptions<CdrName | 'total'>[] = [
        { label: 'Tất cả', value: 'total', disable: false },
        { label: 'Biết', value: 'know', disable: false },
        { label: 'Hiểu', value: 'understand', disable: false },
        { label: 'Vận dụng', value: 'apply', disable: false },
        { label: 'Phân tích', value: 'analysis', disable: false },
        { label: 'Đánh giá', value: 'evaluate', disable: true },
        { label: 'Sáng tạo', value: 'invent', disable: true },
    ];

    timeOut: any;

    question_status = [
        { value: 0, label: 'Chờ duyệt' },
        { value: -1, label: 'Yêu cầu sửa' },
        { value: -2, label: 'Yêu cầu duyệt' },
        { value: 1, label: 'Đạt' }
    ]

    selected_status: number;

    search_id: string;

    canAdd: boolean = true;

    canUpdate: boolean = true;

    canDelete: boolean = true;

    unLimitQuestion: boolean = false;

    @ViewChild("autoCdrQuestion") autoCdrQuestion: ElementRef;

    selectedChapter: CoursePlanActivitiesExtends;

    cdr_cauhoi_kthp = {};

    cdr_cauhoi_kthp_require = {};

    isUpdate_cdr_exam: boolean = true;

    checkboxCdrCauhoi: boolean = false;

    keyServer = key_server;

    constructor(
        private router: Router,
        private notificationService: NotificationService,
        private courseBankService: CourseBankService,
        private fb: FormBuilder,
        private auth: AuthService,
        private elngUserProfileService: ElngUserProfileService,
        private elnKhoaHocService: ElnKhoaHocService,
        private helperService: HelperService,
        private donViService: DonViService,
        private courseQuestionsService: CourseQuestionsService,
        private coursePlanActivitiesService: CoursePlanActivitiesService,
        private modalService: NgbModal,
    ) {
        const url = this.router.url.substring(7).split('?')[0];

        this.canAdd = this.auth.userCanAdd(url);

        this.canDelete = this.auth.userCanDelete(url);

        this.canUpdate = this.auth.userCanEdit(url);


    }

    ngOnInit(): void {
        const config = JSON.parse(localStorage.getItem('--app_configs-' + APP_CONFIGS.realm));

        const setting = config.find(m => m.config_key === 'SETTING')['params'];

        this.unLimitQuestion = setting && setting['form_question'] ? setting['form_question']['unlimit'] : false;

        this.loadData();
    }

    loadData(): void {
        this.error = false;
        let loader: Observable<TopicalQuestionBankTree[]>;

        switch (true) {
            case this.auth.hasRouter(ROUTERS.lanhdao_bomon):
                loader = this.menuLoader.bomon_ld();
                break;
            case this.auth.hasRouter(ROUTERS.admin):
                loader = this.menuLoader.truong_ld();
                break;
            case this.auth.hasRouter(ROUTERS.daotao):
                loader = this.menuLoader.truong_ld();
                break;
            case this.auth.hasRouter(ROUTERS.khaothi):
                loader = this.menuLoader.truong_ld();
                break;
            case this.auth.hasRouter(ROUTERS.lanhdao_khoa):
                loader = this.menuLoader.khoa_ld();
                break;
            case this.auth.hasRouter(ROUTERS.giangvien):
                loader = this.menuLoader.giangvien();
                break;
            default:
                loader = of([]).pipe(tap((): any => (this.invalidRole = true)));
                break;
        }
        this.menuLoading = true;
        loader.subscribe({
            next: (treeMenu: TopicalQuestionBankTree[]): void => {
                this.treeMenu = treeMenu;
                this.menuLoading = false;
            },
            error: (): void => {
                this.error = true;
                this.menuLoading = false;
            },
        });
    }

    private _loadUserProfile(): Observable<ElngUserProfile> {
        return this.userProfile ? of(this.userProfile) : this.elngUserProfileService.getElngUserProfileByCol('user_id', this.auth.user.id.toString(10)).pipe(
            map((res) => (res.length ? res[0] : null)),
            tap(
                (userProfile: ElngUserProfile) =>
                    (this.userProfile = userProfile)
            )
        );
    }

    reload(): void {
        this.loadData();
    }

    onMenuItemClick(
        menu: TopicalQuestionBankTree,
        parent: TopicalQuestionBankTree
    ): void {
        if (menu.course) {
            if (parent) {
                this.treeMenu.map((m) => {
                    m.activated = false;
                    return m;
                });
                parent.activated = true;
            }
            this.loadCoursePlanActivities(menu.course);
        } else {
            menu.toggle();
        }
    }

    loadCoursePlanActivities(course: ElnKhoaHoc): void {
        this.course = course;
        this.loadingCourse = true;
        const conditionsForPlanActivities: ConditionOption = {
            condition: [
                {
                    conditionName: 'course_id',
                    condition: OvicQueryCondition.equal,
                    value: course.id.toString(),
                },
                {
                    conditionName: 'status',
                    condition: OvicQueryCondition.notEqual,
                    value: '-3',
                    orWhere: 'and',
                },
                {
                    conditionName: 'week',
                    condition: OvicQueryCondition.greaterThan,
                    value: '0',
                    orWhere: 'and',
                },
                // {
                //     conditionName: 'week',
                //     condition: OvicQueryCondition.lessThan,
                //     value: '100',
                //     orWhere: 'and',
                // },
            ],
            set: [{ label: 'limit', value: '-1' }],
            page: null,
        };
        const conditionsForCourseQuestions: ConditionOption = {
            condition: [
                {
                    conditionName: 'status',
                    condition: OvicQueryCondition.notEqual,
                    value: '-3',
                    orWhere: 'and',
                },
                {
                    conditionName: 'course_id',
                    condition: OvicQueryCondition.equal,
                    value: course.id.toString(),
                },
                {
                    conditionName: 'reference',
                    condition: OvicQueryCondition.equal,
                    value: 'course_plan_activities',
                },
            ],
            set: [{ label: 'limit', value: '-1' }],
            page: null,
        };
        forkJoin<[CourseQuestions[], CoursePlanActivities[]]>([
            this.courseQuestionsService.getCourseQuestionsByPageNew(conditionsForCourseQuestions).pipe(map((res): CourseQuestions[] => res.data)),
            this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(conditionsForPlanActivities).pipe(map((res): CoursePlanActivities[] => res.data)),
        ]).subscribe({
            next: ([courseQuestions, coursePlanActivities]): void => {
                this.courseQuestionHierarchy = courseQuestions.map(
                    (q: CourseQuestions): CourseQuestionHierarchy => ({
                        ...q,
                        children: courseQuestions.filter(
                            (t) => t.group_id === q.id
                        ),
                    })
                );
                this.chapters = coursePlanActivities
                    .filter(
                        ({ parent_id, week }: CoursePlanActivities) =>
                            parent_id === 0 && week !== 0 && week !== 1000
                    )
                    .sort(
                        (a: CoursePlanActivities, b: CoursePlanActivities) =>
                            a.week - b.week
                    )
                    .reduce(
                        (
                            reducer: CoursePlanActivitiesExtends[],
                            course: CoursePlanActivities
                        ): CoursePlanActivitiesExtends[] => {
                            const cdrList: CoursePlanActivitiesCdr[] = coursePlanActivities.filter(
                                ({
                                    parent_id,
                                    type,
                                }: CoursePlanActivities): boolean =>
                                    parent_id === course.id &&
                                    type === 'ACTIVITY_CDR'
                            ).reduce((reducer: CoursePlanActivitiesCdr[], c: CoursePlanActivities): CoursePlanActivitiesCdr[] => {
                                const _init_reducer: CoursePlanActivitiesCdrGroup =
                                {
                                    know: { questions: [], reachRequirement: false, require: getCdrRequire(c, 'know'), },
                                    understand: { questions: [], reachRequirement: false, require: getCdrRequire(c, 'understand'), },
                                    apply: { questions: [], reachRequirement: false, require: getCdrRequire(c, 'apply'), },
                                    analysis: { questions: [], reachRequirement: false, require: getCdrRequire(c, 'analysis'), },
                                    evaluate: { questions: [], reachRequirement: false, require: getCdrRequire(c, 'evaluate'), },
                                    invent: { questions: [], reachRequirement: false, require: getCdrRequire(c, 'invent'), },
                                };
                                course['av'] = this.course['av'];
                                const group: CoursePlanActivitiesCdrGroup =
                                    this.courseQuestionHierarchy
                                        .filter((q: CourseQuestionHierarchy): boolean => q.group_id === 0 && q['reference_id'] === c.id)
                                        .reduce(
                                            (
                                                reducer: CoursePlanActivitiesCdrGroup,
                                                q: CourseQuestionHierarchy
                                            ): CoursePlanActivitiesCdrGroup => {
                                                reducer[
                                                    cdrId2Name(
                                                        q.cdr
                                                    )
                                                ].questions.push(q);
                                                return reducer;
                                            },
                                            _init_reducer
                                        );
                                reducer.push({
                                    group: validateCoursePlanActivitiesCdrGroup(
                                        group
                                    ),
                                    verify: isCoursePlanActivityCdrVerify(
                                        c
                                    ),
                                    ...c,
                                });
                                return reducer;
                            },
                                new Array<CoursePlanActivitiesCdr>()
                            );
                            reducer.push({
                                heading: 'Bài ' + course.week.toString(10),
                                ...course,
                                cdrList,
                                totalQuestions: 0,
                                verify: cdrList.reduce(
                                    (
                                        _anyCdrVerified: boolean,
                                        cdr: CoursePlanActivitiesCdr
                                    ): boolean => _anyCdrVerified || cdr.verify,
                                    false
                                ),
                            });
                            return reducer;
                        },
                        new Array<CoursePlanActivitiesExtends>()
                    )
                    .map(
                        (
                            chapter: CoursePlanActivitiesExtends
                        ): CoursePlanActivitiesExtends =>
                            coursePlanActivitiesExtendsChecker(chapter)
                    );
                this.chapters.forEach((f) => {
                    if (f.cdrList && f.cdrList.length) {
                        f.cdrList.forEach((cdr) => {
                            cdr['stt'] = Number(cdr.kyhieu.replace(/\D/g, ''));
                            Object.keys(cdr.group).forEach(key => {
                                cdr.group[key].reachRequirement = cdr.group[key]['count_question'] === cdr.group[key].require ? true : false;
                            })
                        });
                        f.cdrList = this.helperService.sort(f.cdrList, 'stt');
                    }
                });
                const index_week = this.chapters.findIndex(m => m.week === 100);
                if (index_week !== -1) {
                    this.show_button_create_week_100 = false;
                } else {
                    this.show_button_create_week_100 = true;
                }

                this.loadingCourseFail = false;

                this.loadingCourse = false;
            },
            error: (): void => {
                this.loadingCourseFail = true;
                this.loadingCourse = false;
            },
        });
    }

    reloadingCourse(): void {
        this.loadCoursePlanActivities(this.course);
    }

    openFormInput(
        cdr: CoursePlanActivitiesCdr,
        cdrName: CdrName,
        mode: InputQuestionMode
    ): void {
        if (mode === 'create' && cdr.group[cdrName].reachRequirement && !this.unLimitQuestion) {
            this.notificationService.toastInfo(
                'Số lượng câu hỏi phân phối theo Cdr này đã đạt tới ngưỡng yêu cầu.'
            );
            return;
        }
        this.inputQuestion.mode = mode;
        this.inputQuestion.info = { cdrName, cdr };
        this.inputQuestion.cdrName = cdrName ? cdrName : 'total';
        this._checkBtnSwitchToAddNewForm();
        this.inputQuestion.ready = true;
        this.inputQuestion.enable = true;
        this.changeCdrSelect();
    }

    private _checkBtnSwitchToAddNewForm(): void {
        if (this.inputQuestion.cdrName === 'total') {
            this.inputQuestion.btnFormAddNew = false;
        } else {
            this.inputQuestion.btnFormAddNew = !this.inputQuestion.info.cdr.group[this.inputQuestion.cdrName].reachRequirement;
        }

        if (this.unLimitQuestion) {
            this.inputQuestion.btnFormAddNew = true;
        }
    }

    changeCdrSelect(): void {
        this.inputQuestion.ready = false;
        this._checkBtnSwitchToAddNewForm();
        if (this.timeOut) {
            clearTimeout(this.timeOut);
        }
        this.timeOut = setTimeout(
            (): any => (this.inputQuestion.ready = true),
            100
        );
    }

    // showMenuQuestionList() : void {
    // 	this.inputQuestion.ready = false;
    // 	this.inputQuestion.mode  = 'list';
    // 	if ( this.timeOut ) {
    // 		clearTimeout( this.timeOut );
    // 	}
    // 	this.timeOut = setTimeout( () : any => this.inputQuestion.ready = true );
    // }

    onPanelClose(): void {
        this.inputQuestion.enable = false;
        this.inputQuestion.ready = false;
    }

    btnOpenFormCreate(): void {
        this.inputQuestion.info.cdrName = this.inputQuestion.cdrName as CdrName;
        this.inputQuestion.mode = 'create';
        this.inputQuestion.enable = true;
        this.inputQuestion.ready = true;
    }

    changeMode(mode: InputQuestionMode): void {
        this.inputQuestion.mode = mode;
    }

    onFormCreateResponse(mode: InputQuestionMode): void {
        if (mode) {
            this.changeCdrSelect();
            this.changeMode(mode);
        } else {
            this.onPanelClose();
        }
    }

    openEdit(question: CourseQuestionHierarchy | CourseQuestions): void {
        this.inputQuestion.info.cdrName = cdrId2Name(question.cdr);
        this.inputQuestion.info.question = question;
        this.inputQuestion.mode = 'edit';
    }

    setThiKetThucHocPhan(chapter: CoursePlanActivitiesExtends, isUpdate: boolean = false) {
        const cdr_cauhoi = this.cdr_cauhoi_kthp;

        this.chuandaura.forEach(f => {
            if (!f.disabled) {
                if (!cdr_cauhoi[f.id]) {
                    cdr_cauhoi[f.id] = 0;
                }
            }
        })

        cdr_cauhoi['status'] = 1;

        const data = {
            week: chapter.week,
            parent_id: chapter.id,
            course_id: chapter.course_id,
            title: this.keyServer == 'huv' ? 'Ngân hàng câu hỏi thi KTHP'  : 'Bổ sung câu hỏi thi KTHP',
            kyhieu: 'KTHP',
            ma_cdr: 'BS',
            type: 'ACTIVITY_CDR',
            ordering: chapter.ordering,
            cdr_cauhoi: cdr_cauhoi,
            status: 1
        }

        this.notificationService.isProcessing(true);

        if (!isUpdate) {
            this.coursePlanActivitiesService.addCoursePlanActivities(data).subscribe({
                next: () => {
                    this.notificationService.toastSuccess('Thiết lập thành công');
                    this.notificationService.isProcessing(false);
                    this.loadCoursePlanActivities(this.course);
                },
                error: () => {
                    this.notificationService.toastError("Thiết lập thất bại, vui lòng thử lại");
                }
            })
        } else {
            this.coursePlanActivitiesService.updateCoursePlanActivities(chapter.cdrList[0].id, data).subscribe({
                next: () => {
                    this.notificationService.toastSuccess('Thiết lập thành công');
                    this.notificationService.isProcessing(false);
                    this.loadCoursePlanActivities(this.course);
                },
                error: () => {
                    this.notificationService.toastError("Thiết lập thất bại, vui lòng thử lại");
                }
            })
        }

    }

    addBS20(d) {
        const index_ = Object.keys(this.cdr_cauhoi_kthp_require).map(m => this.cdr_cauhoi_kthp_require[m]).findIndex(m => m === true);

        if (index_ !== -1) {
            return this.notificationService.toastWarning("Vui lòng kiểm tra lại phân bổ câu hỏi");
        }

        const number_check = Number(this.returnPercentOnCdrItem(this.cdr_cauhoi_kthp[this.course.params.cdr]));

        if (number_check < 50) {
            return this.notificationService.toastError("Số lượng câu hỏi dạng " + this.chuandaura.find(m => m.id === this.course.params.cdr).label + " của môn học phải lớn 50%")
        }

        d(true);

        this.checkboxCdrCauhoi = false;

        this.notificationService.isProcessing(true);

        if (!this.isUpdate_cdr_exam) {
            const data_parent = {
                week: 100,
                parent_id: 0,
                course_id: this.course.id,
                title: this.keyServer == 'huv' ? 'Ngân hàng câu hỏi thi KTHP'  : 'Bổ sung câu hỏi thi KTHP',
                type: 'PLAN',
                ordering: 100,
                status: 1
            }


            this.coursePlanActivitiesService.addCoursePlanActivities(data_parent).pipe(mergeMap(a => {
                const cdr_cauhoi = this.cdr_cauhoi_kthp;

                this.chuandaura.forEach(f => {
                    if (!f.disabled) {
                        if (!cdr_cauhoi[f.id]) {
                            cdr_cauhoi[f.id] = 0;
                        }
                    }
                })

                cdr_cauhoi['status'] = 1;

                const data = {
                    week: 100,
                    parent_id: a,
                    course_id: this.course.id,
                    title: this.keyServer == 'hvu' ? 'Ngân hàng câu hỏi thi KTHP'  : 'Bổ sung câu hỏi thi KTHP',
                    kyhieu: this.keyServer == 'hvu' ? 'KTHP': 'BS',
                    ma_cdr: 'BS',
                    type: 'ACTIVITY_CDR',
                    ordering: 100,
                    cdr_cauhoi: cdr_cauhoi,
                    status: 1
                }

                return this.coursePlanActivitiesService.addCoursePlanActivities(data).pipe(mergeMap(s => {
                    return of(s);
                }))
            })).subscribe({
                next: () => {
                    this.notificationService.toastSuccess('Thêm thành công');
                    this.notificationService.isProcessing(false);
                    this.loadCoursePlanActivities(this.course);
                },
                error: () => {
                    this.notificationService.toastError("Thêm thất bại, vui lòng thử lại");
                }
            })
        } else {
            if (this.selectedChapter) {
                if (this.selectedChapter.cdrList && this.selectedChapter.cdrList[0]) {
                    const cdr_cauhoi = this.cdr_cauhoi_kthp;

                    this.chuandaura.forEach(f => {
                        if (!f.disabled) {
                            if (!cdr_cauhoi[f.id]) {
                                cdr_cauhoi[f.id] = 0;
                            }
                        }
                    })

                    Object.keys(cdr_cauhoi).forEach(f => {
                        if (!this.selectedChapter.cdrList[0].cdr_cauhoi[f]) {
                            this.selectedChapter.cdrList[0].cdr_cauhoi[f] = 0;
                        }
                        cdr_cauhoi[f] = cdr_cauhoi[f] + this.selectedChapter.cdrList[0].cdr_cauhoi[f];
                    })

                    cdr_cauhoi['status'] = 1;

                    this.coursePlanActivitiesService.updateCoursePlanActivities(this.selectedChapter.cdrList[0].id, { cdr_cauhoi: cdr_cauhoi }).subscribe({
                        next: () => {
                            this.notificationService.toastSuccess('Thiết lập thành công');
                            this.notificationService.isProcessing(false);
                            this.loadCoursePlanActivities(this.course);
                        },
                        error: () => {
                            this.notificationService.toastError("Thiết lập thất bại, vui lòng thử lại");
                        }
                    })

                } else {
                    const cdr_cauhoi = this.cdr_cauhoi_kthp;

                    this.chuandaura.forEach(f => {
                        if (!f.disabled) {
                            if (!cdr_cauhoi[f.id]) {
                                cdr_cauhoi[f.id] = 0;
                            }
                        }
                    })

                    cdr_cauhoi['status'] = 1;

                    const data = {
                        week: this.selectedChapter.week,
                        parent_id: this.selectedChapter.id,
                        course_id: this.selectedChapter.course_id,
                        title: this.keyServer == 'hvu' ? 'Ngân hàng câu hỏi thi KTHP'  : 'Bổ sung câu hỏi thi KTHP',
                        kyhieu: this.keyServer == 'hvu' ? 'KTHP': 'BS',
                        ma_cdr: 'BS',
                        type: 'ACTIVITY_CDR',
                        ordering: this.selectedChapter.ordering,
                        cdr_cauhoi: cdr_cauhoi,
                        status: 1
                    }

                    this.coursePlanActivitiesService.addCoursePlanActivities(data).subscribe({
                        next: () => {
                            this.notificationService.toastSuccess('Thiết lập thành công');
                            this.notificationService.isProcessing(false);
                            this.loadCoursePlanActivities(this.course);
                        },
                        error: () => {
                            this.notificationService.toastError("Thiết lập thất bại, vui lòng thử lại");
                        }
                    })
                }
            }
        }
    }

    addQuestionLastExam(chapter?: CoursePlanActivitiesExtends) {
        this.selectedChapter = null;
        this.isUpdate_cdr_exam = false;
        this.checkboxCdrCauhoi = false;
        this.cdr_cauhoi_kthp = {};
        this.cdr_cauhoi_kthp_require = {};
        if (chapter) {
            this.selectedChapter = chapter;
            this.isUpdate_cdr_exam = true;
        }
        this.modalService.open(this.autoCdrQuestion, LARGE_MODAL_OPTIONS);
    }

    pointQuestionKeyDown(event, inputPoint_quest) {
        if (event) {
            if (/[0-9]/.test(event.key) || event.key === 'Backspace') {
                if (inputPoint_quest.value.replace(/\d/gi, '').length > 0 && event.key === '.') {
                    event.preventDefault();
                }
            } else {
                event.preventDefault();
            }
        }
    }

    closeForm(d) {
        d(true);
    }

    returnPercent() {
        if (!this.selectedChapter) {
            return 100;
        }

        if (Object.keys(this.cdr_cauhoi_kthp).length === 0) {
            return 0;
        }

        if (this.selectedChapter && this.selectedChapter.cdrList && this.selectedChapter.cdrList[0] && this.selectedChapter.cdrList[0].cdr_cauhoi) {
            const cdr_cauhoi = this.selectedChapter.cdrList[0].cdr_cauhoi;

            let s = 0;

            Object.keys(cdr_cauhoi).forEach(f => {
                if (!isNaN(parseFloat(f))) {
                    s = cdr_cauhoi[f] + s;
                }
            })

            const total = Object.keys(this.cdr_cauhoi_kthp).map(m => this.cdr_cauhoi_kthp[m]).reduce((total, current) => total + current, 0);

            return s !== 0 ? (total / s * 100).toFixed(1) : 100;
        }

        return 0;
    }

    returnTotalCdrLastExam() {
        return Object.keys(this.cdr_cauhoi_kthp).map(m => this.cdr_cauhoi_kthp[m]).reduce((total, current) => total + current, 0);
    }

    returnPercentOnCdrItem(cdr_number: number) {
        if (!cdr_number) {
            return 0;
        }

        const s = Object.keys(this.cdr_cauhoi_kthp).map(m => this.cdr_cauhoi_kthp[m]).reduce((total, current) => total + current, 0);

        return s === 0 ? 0 : (cdr_number / s * 100).toFixed(1);
    }

    changeCdrCauhoi() {
        let total_percent_less = 0;

        let total_percent_greater = 0;

        const total_less = [];

        const total_greater = [];

        const s = Object.keys(this.cdr_cauhoi_kthp).map(m => this.cdr_cauhoi_kthp[m]).reduce((total, current) => total + current, 0);

        this.chuandaura.forEach(cdr => {
            if (!cdr.disabled) {
                if (!this.cdr_cauhoi_kthp[cdr.id]) {
                    this.cdr_cauhoi_kthp[cdr.id] = 0;
                }
                const percent = s !== 0 ? this.cdr_cauhoi_kthp[cdr.id] / s * 100 : 100;
                if (cdr.id < this.course.params.cdr) {
                    total_percent_less = total_percent_less + percent;
                    total_less.push(cdr.id);
                } else if (cdr.id > this.course.params.cdr) {
                    total_percent_greater = total_percent_greater + percent;
                    total_greater.push(cdr.id);
                }
            }
        })

        if (total_percent_greater > 10) {
            total_greater.forEach(f => {
                this.cdr_cauhoi_kthp_require[f] = true;
            })
        } else {
            total_greater.forEach(f => {
                this.cdr_cauhoi_kthp_require[f] = false;
            })
        }

        if (total_percent_less > 40) {
            total_less.forEach(f => {
                this.cdr_cauhoi_kthp_require[f] = true;
            })
        } else {
            total_less.forEach(f => {
                this.cdr_cauhoi_kthp_require[f] = false;
            })
        }

        const number = Number(this.returnPercentOnCdrItem(this.cdr_cauhoi_kthp[this.course.params.cdr]));

        if (number < 50) {
            this.cdr_cauhoi_kthp_require[this.course.params.cdr] = true;
        } else {
            this.cdr_cauhoi_kthp_require[this.course.params.cdr] = false;
        }
    }

    resetToMinCdrCauhoi(chapter: CoursePlanActivitiesExtends) {
        this.notificationService.confirm("Thầy/Cô có chắc chắn muốn thực hiện thao tác này?", "Xác nhận hành động", [BUTTON_YES, BUTTON_NO]).then(a => {
            if (a.name === "yes") {
                if (chapter.cdrList && chapter.cdrList[0] && chapter.cdrList[0].group) {
                    const cdr_cauhoi = {};
                    this.chuandaura.forEach(f => {
                        if (!f.disabled) {
                            cdr_cauhoi[f.id] = chapter.cdrList[0].group[this.cdrOptions[f.id].value]['questions'].length;
                        }
                    })


                    cdr_cauhoi["status"] = 1;

                    this.coursePlanActivitiesService.updateCoursePlanActivities(chapter.cdrList[0].id, { cdr_cauhoi: cdr_cauhoi }).subscribe({
                        next: () => {
                            this.notificationService.toastSuccess('Thiết lập thành công');
                            this.notificationService.isProcessing(false);
                            this.loadCoursePlanActivities(this.course);
                        },
                        error: () => {
                            this.notificationService.toastError("Thiết lập thất bại, vui lòng thử lại");
                        }
                    })
                }

            }
        })
    }

    returnOrtherLvlCdr(name: string) {
        const total_less = [];

        const total_greater = [];

        this.chuandaura.forEach(cdr => {
            if (!cdr.disabled) {
                if (cdr.id < this.course.params.cdr) {
                    total_less.push("<strong>" + cdr.label + "</strong>");
                } else if (cdr.id > this.course.params.cdr) {
                    total_greater.push("<strong>" + cdr.label + "</strong>");
                }
            }
        })

        if (name === "less") {
            return total_less.join(" + ");
        }

        return total_greater.join(" + ");
    }
}
