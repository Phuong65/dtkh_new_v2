import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from "primeng/button";
import { CheckboxModule } from "primeng/checkbox";
import { DropdownModule } from "primeng/dropdown";
import { Paginator, PaginatorModule } from "primeng/paginator";
import { RippleModule } from "primeng/ripple";
import { SharedModule } from "@shared/shared.module";
import { SidebarModule } from "primeng/sidebar";
import { MatLineModule } from "@angular/material/core";
import { MatListModule, MatSelectionListChange } from "@angular/material/list";
import { ConditionOption } from "@shared/models/condition-option";
import { OvicQueryCondition } from "@core/models/dto";
import { forkJoin, mergeMap, of } from "rxjs";
import { ElnKhoaHoc, EXAMFORMAT } from "@shared/models/elng-khoa-hoc";
import { CHUAN_DAU_RA, LARGE_MODAL_OPTIONS, ROLES, ROUTERS } from "@shared/utils/syscat";
import { DonVi } from "@shared/models/don-vi";
import { HelperService } from "@core/services/helper.service";
import { NgbModal, NgbTooltipModule } from "@ng-bootstrap/ng-bootstrap";
import { ElnKhoaHocService } from "@shared/services/elearning-khoa-hoc.service";
import { UserService } from "@core/services/user.service";
import { AuthService } from "@core/services/auth.service";
import { NotificationService } from "@core/services/notification.service";

import { ElngUserProfileService } from "@shared/services/elearning-user-profile.service";
import { DonViService } from "@shared/services/don-vi.service";
import { CoursePlanActivitiesService } from "@shared/services/course-plan-activities.service";
import { ElngUserProfile } from "@shared/models/elng-user-profile";
import { TooltipModule } from "primeng/tooltip";
import { key_server } from "@env";
import {
    cdrId2Name,
    CdrName,
    CoursePlanActivitiesCdr,
    CoursePlanActivitiesCdrGroup,
    CoursePlanActivitiesExtends, coursePlanActivitiesExtendsChecker,
    CourseQuestionHierarchy,
    isCoursePlanActivityCdrVerify, SelectOptions,
    validateCoursePlanActivitiesCdrGroup
} from "@modules/admin/features/cauhoi-tracnghiem/models/bank-questions";
import {
    getCdrRequire,
    InputQuestionMode
} from "@modules/admin/features/cauhoi-tracnghiem/topical-question-bank/topical-question-bank.component";
import { CourseQuestions } from "@shared/models/course-questions";
import { CoursePlanActivities } from "@shared/models/course-plan-activities";
import { map } from "rxjs/operators";
import { CourseQuestionsService } from "@shared/services/course-questions.service";
import {
    CreateQuestionComponent, CreateQuestionInfo
} from "@modules/admin/features/cauhoi-tracnghiem/questions/create-question/create-question.component";
import {
    ListQuestionsComponent
} from "@modules/admin/features/cauhoi-tracnghiem/questions/list-questions/list-questions.component";
import { BUTTON_NO, BUTTON_YES } from "@core/models/buttons";
import { Router } from "@angular/router";

interface InputQuestion {
    enable: boolean;
    info: CreateQuestionInfo;
    cdrName: CdrName | 'total';
    mode: InputQuestionMode;
    btnFormAddNew: boolean;
    ready: boolean;
}
// type EmployeeRole = 'truong_ld' | 'khoa_ld' | 'giangvien' | 'bomon_ld';


@Component({
    selector: 'app-topical-question-bank-v2',
    standalone: true,
    imports: [CommonModule, ButtonModule, CheckboxModule, DropdownModule, PaginatorModule, RippleModule, SharedModule, SidebarModule, MatLineModule, MatListModule, NgbTooltipModule, TooltipModule, CreateQuestionComponent, ListQuestionsComponent],
    templateUrl: './topical-question-bank-v2.component.html',
    styleUrls: ['./topical-question-bank-v2.component.css']
})
export class TopicalQuestionBankV2Component implements OnInit {

    @ViewChild('paginator', { static: true }) paginator: Paginator;
    @ViewChild("autoCdrQuestion") autoCdrQuestion: ElementRef;

    closeLeft: boolean = false;
    dmKhoahoc: ElnKhoaHoc[];
    limitCourse: number = 20;
    list_donvi_chuyenmon: DonVi[];
    categoryFilter: number;

    userId: number;
    donviId: number;
    isManager: boolean;
    isLanhDaoKhoa: boolean;
    isLanhDaoBomon: boolean;
    isgiangvien: boolean;
    user_profile: ElngUserProfile;
    my_course: boolean = false;
    searchCourse: string;
    totalCourse: number = 0;
    courseSelected: ElnKhoaHoc;

    loadingCourse: boolean = false;
    loadingCourseFail: boolean;
    unLimitQuestion: boolean;
    show_button_create_week_100: boolean;

    canAdd: boolean = true;

    canUpdate: boolean = true;

    canDelete: boolean = true;
    
    keyServer = key_server;


    chapters: CoursePlanActivitiesExtends[];
    courseQuestionHierarchy: CourseQuestionHierarchy[];

    selectedChapter: CoursePlanActivitiesExtends;
    cdr_cauhoi_kthp = {};

    cdr_cauhoi_kthp_require = {};

    isUpdate_cdr_exam: boolean = true;

    checkboxCdrCauhoi: boolean = false;
    chuandaura = CHUAN_DAU_RA;

    cdrOptions: SelectOptions<CdrName | 'total'>[] = [
        { label: 'Tất cả', value: 'total', disable: false },
        { label: 'Biết', value: 'know', disable: false },
        { label: 'Hiểu', value: 'understand', disable: false },
        { label: 'Vận dụng', value: 'apply', disable: false },
        { label: 'Phân tích', value: 'analysis', disable: false },
        { label: 'Đánh giá', value: 'evaluate', disable: true },
        { label: 'Sáng tạo', value: 'invent', disable: true },
    ];
    inputQuestion: InputQuestion = {
        info: null,
        enable: false,
        btnFormAddNew: false,
        ready: false,
        cdrName: null,
        mode: 'create',
    };
    search_id: string;
    question_status = [
        { value: 0, label: 'Chờ duyệt' },
        { value: -1, label: 'Yêu cầu sửa' },
        { value: -2, label: 'Yêu cầu duyệt' },
        { value: 1, label: 'Đạt' }
    ]
    selected_status: number;
    timeOut: any;

    emptyMenu: string = 'Bạn chưa được phần công cập nhật câu hỏi trắc nghiệm';

    constructor(
        private router: Router,
        private helperService: HelperService,
        private modalService: NgbModal,
        private elnKhoaHocService: ElnKhoaHocService,
        private userService: UserService,
        private auth: AuthService,
        private noitifi: NotificationService,
        private elngUserProfileService: ElngUserProfileService,
        private donViService: DonViService,
        private coursePlanActivitiesService: CoursePlanActivitiesService,
        private courseQuestionsService: CourseQuestionsService
    ) {
        const url = this.router.url.substring(7).split('?')[0];

        this.canAdd = this.auth.userCanAdd(url);

        this.canDelete = this.auth.userCanDelete(url);

        this.canUpdate = this.auth.userCanEdit(url);
        this.userId = this.auth.user.id;
        this.donviId = this.auth.user.donvi_id;

        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin) || this.auth.userHasRole(ROLES.chuyenvien_pdt) ? true : false;;
        this.isLanhDaoKhoa = this.auth.hasRouter(ROUTERS.lanhdao_khoa);
        this.isLanhDaoBomon = this.auth.hasRouter(ROUTERS.lanhdao_bomon);
        this.isgiangvien = this.auth.hasRouter(ROUTERS.giangvien);
    }

    ngOnInit(): void {
        this.noitifi.isProcessing(true);
        const condition_profile: ConditionOption = {
            condition: [
                {
                    conditionName: 'user_id',
                    condition: OvicQueryCondition.equal,
                    value: this.userId.toString(),
                },
            ],
            set: [],
            page: null,
        };

        const condition_donvi: ConditionOption = {
            condition: [
                {
                    conditionName: 'parent_id',
                    condition: OvicQueryCondition.equal,
                    value: this.auth.user.donvi_id.toString(),
                },
                {
                    conditionName: 'status',
                    condition: OvicQueryCondition.greaterThan,
                    value: '0',
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



        forkJoin([
            this.elngUserProfileService.getUserProfileByPageNewV2(condition_profile),
            this.donViService.getDonviByPageNew(condition_donvi),
        ]).subscribe({
            next: ([_userProfile, _donvi]) => {

                this.list_donvi_chuyenmon = _donvi.data;

                if (_userProfile.recordsFiltered) {
                    this.user_profile = _userProfile.data[0];
                    if (!this.isManager)
                        this.categoryFilter = this.user_profile.donvi_chuyenmon_id;
                }

                this.noitifi.isProcessing(false);

                this.loadPageData_course(1);
            },
            error: () => {
                this.noitifi.isProcessing(false);
                this.noitifi.toastError('Lỗi kết nối, vui lòng thử lại');
            },
        });
    }

    closeLeftBody() {
        this.closeLeft = !this.closeLeft;
    }

    loadPageData_course(page: number) {
        this.dmKhoahoc = [];
        const condition_course: ConditionOption = {
            condition: [
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and', },
            ],
            set: [{ label: 'orderby', value: 'title' }, { label: 'limit', value: this.limitCourse.toString() }],
            page: page.toString()
        }

        if (this.categoryFilter && (this.isLanhDaoBomon || this.isLanhDaoKhoa || this.isManager)) {
            condition_course.condition.push({ conditionName: 'category_ids', condition: OvicQueryCondition.equal, value: this.categoryFilter.toString(), orWhere: 'and' });
        }

        if (this.isLanhDaoBomon && this.user_profile && !this.isLanhDaoKhoa && !this.isManager) {
            condition_course.condition.push({ conditionName: 'nganh_bomon_id', condition: OvicQueryCondition.equal, value: (this.user_profile.bomon_id !== 0 ? this.user_profile.bomon_id : -1).toString(), orWhere: 'and' });
        }



        if (!this.isLanhDaoBomon && this.user_profile && !this.isLanhDaoKhoa && !this.isManager) {
            this.my_course = true;
        }

        // console.log(this.isgiangvien)
        // if(this.isgiangvien){
        //     this.my_course = true;
        // }

        if (this.my_course) {
            // this.emptyMenu ='Bạn hiện tại chưa được phân quyền cập nhật cho môn học nào cả!';
            condition_course.condition.push({ conditionName: 'creator_plan_id', condition: OvicQueryCondition.equal, value: this.user_profile.user_id.toString(), orWhere: 'and' });
        }

        if (this.searchCourse) {

            condition_course.condition.push({ conditionName: 'title', condition: OvicQueryCondition.like, value: '%' + this.searchCourse.toString() + '%', orWhere: 'and' });
        }

        this.elnKhoaHocService.getKhoaHocByPageNew_2(condition_course).pipe(mergeMap((_course_ => {

            const _course_ids = [];

            _course_.data.forEach(f => {
                _course_ids.push(f.id);

            })

            return of(_course_);
        }))).subscribe({
            next: (_course) => {
                this.totalCourse = _course.recordsFiltered;
                if (_course.data && _course.data.length) {

                    let teacher_ids = [0];

                    _course.data.forEach((f, key) => {
                        teacher_ids.push(f.creator_plan_id);
                        if (f.params) {
                            if (f.params.sotinchi) {
                                f['sotinchi'] = f.params.sotinchi;
                            }

                            if (!f.params.exam_type) {
                                const index = EXAMFORMAT.findIndex((m) => m.key === f.params.exam_format);
                                if (index !== -1) {
                                    f['hinhthucthi'] = EXAMFORMAT[index].label;
                                }
                            } else {
                                const index = EXAMFORMAT.findIndex((m) => m.id === f.params.exam_type);
                                if (index !== -1) {
                                    f['hinhthucthi'] = EXAMFORMAT[index].label;
                                }
                            }

                            if (f.params.cdr) {
                                const index = CHUAN_DAU_RA.findIndex((m) => m.id === f.params.cdr);
                                if (index !== -1) {
                                    f['chuandaura'] = CHUAN_DAU_RA[index].label;
                                }
                            }
                        }
                    });


                    const condition_teacher: ConditionOption = {
                        condition: [],
                        set: [
                            { label: 'limit', value: '-1' },
                            { label: 'include', value: [...new Set(teacher_ids)].toString() },
                            { label: 'include_by', value: 'id' },
                        ],
                        page: null,
                    };

                    this.userService.getUserByPageNew(condition_teacher).subscribe({
                        next: (_user) => {
                            this.dmKhoahoc.forEach((f) => {
                                const index_creator = _user.data.findIndex((m) => m.id === f.creator_plan_id);

                                f['creator_name'] = 'Chưa có giảng viên';

                                f['display_name'] = 'Chưa có giảng viên';

                                if (index_creator !== -1) {
                                    f['creator_name'] = ''.concat(_user.data[index_creator].display_name);
                                    f['display_name'] = _user.data[index_creator].display_name;
                                }

                                f['info_'] = '';

                                if (f.params) {
                                    const sotinchi = f.params.sotinchi ? f.params.sotinchi : 0;
                                    const sotinchi_th = f.params['sotinchi_th'] ? f.params['sotinchi_th'] : 0;
                                    const index_m = EXAMFORMAT.findIndex((m) => m.key === f.params.exam_format);
                                    let exam = 'Chưa có thông tin';

                                    if (index_m !== -1) {
                                        exam = EXAMFORMAT[index_m].label;
                                    }

                                    f['info_'] = ' - TC: ' + sotinchi.toString().concat('-', sotinchi_th.toString(), ' - ', f['hinhthucthi']);
                                }
                            });
                        },

                        error: () => { },
                    });

                    this.dmKhoahoc = _course.data;

                    if (this.dmKhoahoc && this.dmKhoahoc.length) {
                        // this.courseSelected = this.dmKhoahoc[0];

                        // this.onSelectTap(this.type_question ? this.type_question : this.list_typeQuestion_practice[0], this.indexTap);
                    }

                }
                if (this.isManager) {
                    this.emptyMenu = this.dmKhoahoc && this.dmKhoahoc.length > 0 ? '' : 'Load dữ liệu không thành công';
                }
                else if (this.isLanhDaoKhoa) {
                    this.emptyMenu = this.dmKhoahoc && this.dmKhoahoc.length > 0 ? '' : 'Đơn vị hiện tại của bạn chưa có môn học nào';
                }
                else if (this.isLanhDaoBomon) {
                    this.emptyMenu = this.dmKhoahoc && this.dmKhoahoc.length > 0 ? '' : 'Đơn vị hiện tại của bạn chưa có môn học nào';
                }
                else if (this.isgiangvien) {
                    this.emptyMenu = this.dmKhoahoc && this.dmKhoahoc.length > 0 ? '' : 'Bạn hiện tại chưa được phân quyền cập nhật cho môn học nào cả!';
                }

                this.noitifi.isProcessing(false);
            },

            error: () => {
                this.noitifi.isProcessing(false);
            }
        })

    }
    changePage(event) {
        this.loadPageData_course(event.page + 1);
    }
    onChangeFilterChuyenmon(event) {
        if (event) {
            this.categoryFilter = event.id;
        } else {
            this.categoryFilter = null;
        }
        this.onSearchByTitle();
    }
    onSearchByTitle() {
        if (!this.paginator.empty()) {
            this.paginator.changePage(0);
        } else {
            this.loadPageData_course(1);
        }
    }

    changeToMyCourse() {
        this.my_course = !this.my_course;
        this.onSearchByTitle();
    }


    onSelectCourse(event: MatSelectionListChange) {
        this.courseSelected = event.options[0].value;
        // this.onSelectTap(this.list_typeQuestion_practice[0], 0);
        this.loadCoursePlanActivities(this.courseSelected);

    }

    reloadingCourse() {
        this.loadCoursePlanActivities(this.courseSelected);

    }
    loadCoursePlanActivities(course: ElnKhoaHoc) {
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
                                course['av'] = this.courseSelected['av'];
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

    closeForm(d) {
        d(true);
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
    resetToMinCdrCauhoi(chapter: CoursePlanActivitiesExtends) {
        this.noitifi.confirm("Thầy/Cô có chắc chắn muốn thực hiện thao tác này?", "Xác nhận hành động", [BUTTON_YES, BUTTON_NO]).then(a => {
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
                            this.noitifi.toastSuccess('Thiết lập thành công');
                            this.noitifi.isProcessing(false);
                            this.loadCoursePlanActivities(this.courseSelected);
                        },
                        error: () => {
                            this.noitifi.toastError("Thiết lập thất bại, vui lòng thử lại");
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
                if (cdr.id < this.courseSelected.params.cdr) {
                    total_less.push("<strong>" + cdr.label + "</strong>");
                } else if (cdr.id > this.courseSelected.params.cdr) {
                    total_greater.push("<strong>" + cdr.label + "</strong>");
                }
            }
        })

        if (name === "less") {
            return total_less.join(" + ");
        }

        return total_greater.join(" + ");
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
                if (cdr.id < this.courseSelected.params.cdr) {
                    total_percent_less = total_percent_less + percent;
                    total_less.push(cdr.id);
                } else if (cdr.id > this.courseSelected.params.cdr) {
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

        const number = Number(this.returnPercentOnCdrItem(this.cdr_cauhoi_kthp[this.courseSelected.params.cdr]));

        if (number < 50) {
            this.cdr_cauhoi_kthp_require[this.courseSelected.params.cdr] = true;
        } else {
            this.cdr_cauhoi_kthp_require[this.courseSelected.params.cdr] = false;
        }
    }
    returnPercentOnCdrItem(cdr_number: number) {
        if (!cdr_number) {
            return 0;
        }

        const s = Object.keys(this.cdr_cauhoi_kthp).map(m => this.cdr_cauhoi_kthp[m]).reduce((total, current) => total + current, 0);

        return s === 0 ? 0 : (cdr_number / s * 100).toFixed(1);
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

    returnTotalCdrLastExam() {
        return Object.keys(this.cdr_cauhoi_kthp).map(m => this.cdr_cauhoi_kthp[m]).reduce((total, current) => total + current, 0);
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

    addBS20(d) {
        const index_ = Object.keys(this.cdr_cauhoi_kthp_require).map(m => this.cdr_cauhoi_kthp_require[m]).findIndex(m => m === true);

        if (index_ !== -1) {
            return this.noitifi.toastWarning("Vui lòng kiểm tra lại phân bổ câu hỏi");
        }

        const number_check = Number(this.returnPercentOnCdrItem(this.cdr_cauhoi_kthp[this.courseSelected.params.cdr]));

        if (number_check < 50) {
            return this.noitifi.toastError("Số lượng câu hỏi dạng " + this.chuandaura.find(m => m.id === this.courseSelected.params.cdr).label + " của môn học phải lớn 50%")
        }

        d(true);

        this.checkboxCdrCauhoi = false;

        this.noitifi.isProcessing(true);

        if (!this.isUpdate_cdr_exam) {
            const data_parent = {
                week: 100,
                parent_id: 0,
                course_id: this.courseSelected.id,
                title: this.keyServer == 'huv' ? 'Ngân hàng câu hỏi thi KTHP' : 'Bổ sung câu hỏi thi KTHP',
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
                    course_id: this.courseSelected.id,
                    title: this.keyServer == 'hvu' ? 'Ngân hàng câu hỏi thi KTHP' : 'Bổ sung câu hỏi thi KTHP',
                    kyhieu: this.keyServer == 'hvu' ? 'KTHP' : 'BS',
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
                    this.noitifi.toastSuccess('Thêm thành công');
                    this.noitifi.isProcessing(false);
                    this.loadCoursePlanActivities(this.courseSelected);
                },
                error: () => {
                    this.noitifi.toastError("Thêm thất bại, vui lòng thử lại");
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
                            this.noitifi.toastSuccess('Thiết lập thành công');
                            this.noitifi.isProcessing(false);
                            this.loadCoursePlanActivities(this.courseSelected);
                        },
                        error: () => {
                            this.noitifi.toastError("Thiết lập thất bại, vui lòng thử lại");
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
                        title: this.keyServer == 'hvu' ? 'Ngân hàng câu hỏi thi KTHP' : 'Bổ sung câu hỏi thi KTHP',
                        kyhieu: this.keyServer == 'hvu' ? 'KTHP' : 'BS',
                        ma_cdr: 'BS',
                        type: 'ACTIVITY_CDR',
                        ordering: this.selectedChapter.ordering,
                        cdr_cauhoi: cdr_cauhoi,
                        status: 1
                    }

                    this.coursePlanActivitiesService.addCoursePlanActivities(data).subscribe({
                        next: () => {
                            this.noitifi.toastSuccess('Thiết lập thành công');
                            this.noitifi.isProcessing(false);
                            this.loadCoursePlanActivities(this.courseSelected);
                        },
                        error: () => {
                            this.noitifi.toastError("Thiết lập thất bại, vui lòng thử lại");
                        }
                    })
                }
            }
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

    openFormInput(cdr: CoursePlanActivitiesCdr, cdrName: CdrName, mode: InputQuestionMode) {
        if (mode === 'create' && cdr.group[cdrName].reachRequirement && !this.unLimitQuestion) {
            this.noitifi.toastInfo(
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
        console.log(this.inputQuestion);
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
    onPanelClose(): void {
        this.inputQuestion.enable = false;
        this.inputQuestion.ready = false;
    }
    openEdit(question: CourseQuestionHierarchy | CourseQuestions): void {
        this.inputQuestion.info.cdrName = cdrId2Name(question.cdr);
        this.inputQuestion.info.question = question;
        this.inputQuestion.mode = 'edit';
    }
    btnOpenFormCreate(): void {
        this.inputQuestion.info.cdrName = this.inputQuestion.cdrName as CdrName;
        this.inputQuestion.mode = 'create';
        this.inputQuestion.enable = true;
        this.inputQuestion.ready = true;
    }

}
