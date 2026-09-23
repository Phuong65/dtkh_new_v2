import { DialogModule } from 'primeng/dialog';
import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';
import { CoursePlanActivityTuluanService } from './../../../../shared/services/course-plan-activity-tuluan.service';
import { CommonModule } from '@angular/common';
import { Component, NgModule, OnInit, QueryList, TemplateRef, ViewChild, ViewChildren } from '@angular/core';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { MatTabsModule } from '@angular/material/tabs';
import { OvicQueryCondition } from '@core/models/dto';
import { AuthService } from '@core/services/auth.service';
import { FileService } from '@core/services/file.service';
import { HelperService } from '@core/services/helper.service';
import { NotificationService } from '@core/services/notification.service';
import { UserService } from '@core/services/user.service';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { DonVi } from '@modules/shared/models/don-vi';
import { ElnKhoaHoc, EXAMFORMAT } from '@modules/shared/models/elng-khoa-hoc';
import { ElngUserProfile } from '@modules/shared/models/elng-user-profile';
import { ConfigsService } from '@modules/shared/services/configs.service';
import { DonViService } from '@modules/shared/services/don-vi.service';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { OvicDateTimeService } from '@modules/shared/services/ovic-date-time.service';
import { SharedModule } from '@modules/shared/shared.module';
import { CHUAN_DAU_RA, ROLES, ROUTERS } from '@modules/shared/utils/syscat';
import { NgbModal, NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { Paginator, PaginatorModule } from 'primeng/paginator';
import { catchError, forkJoin, mergeMap, Observable, of } from 'rxjs';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CoursePlanActivityTuluan } from '@modules/shared/models/course-plan-activity-tuluan';
import { DividerModule } from 'primeng/divider';
import { CoursePlanTuluanComment } from '@modules/shared/models/course-plan-tuluan-comment';
import { BUTTON_NO, BUTTON_YES } from '@core/models/buttons';
import { CoursePlanTuluanCommentService } from '@modules/shared/services/course-plan-tuluan-comment.service';
import { MultiSelectModule } from 'primeng/multiselect';
import { Title } from '@angular/platform-browser';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CheckboxModule } from 'primeng/checkbox';
import { LoadMediaOnTextDirective } from '@modules/shared/directives/load-media-on-text.directive';
import { InputQuestionDirectionComponent } from '../../cauhoi-tracnghiem/input-question-direction/input-question-direction.component';
import { Router } from '@angular/router';
import { CoursePlanActivities } from '@modules/shared/models/course-plan-activities';
import { AccordionModule } from 'primeng/accordion';
import { DropdownModule } from 'primeng/dropdown';
import { PanelModule } from 'primeng/panel';
import { SplitterModule } from 'primeng/splitter';
import { CoursePlanActivityTuluanTieuchicham } from '@modules/shared/models/course-plan-activity-tuluan-tieuchicham';
import { CoursePlanActivityTuluanTieuchichamService } from '@modules/shared/services/course-plan-activity-tuluan-tieuchicham.service';
import { TableModule } from 'primeng/table';
import { KatexImgDirective } from '@modules/shared/directives/katex-img.directive';

export interface SINHDEOBJECT {
    cau_1: CoursePlanActivityTuluan[],
    cau_2: CoursePlanActivityTuluan[],
    chuaduyet: number,
    cau_1_total: number,
    cau_2_total: number,
    ghi_de: boolean,
}

@Component({
    selector: 'app-cauhoi-ketthuc-hocphan',
    templateUrl: './cauhoi-ketthuc-hocphan.component.html',
    styleUrls: ['./cauhoi-ketthuc-hocphan.component.css'],
    imports: [
        MultiSelectModule,
        CommonModule,
        SharedModule,
        MatListModule,
        PaginatorModule,
        NgbTooltipModule,
        MatTabsModule,
        FormsModule,
        NgbModule,
        ReactiveFormsModule,
        InputQuestionDirectionComponent,
        LoadMediaOnTextDirective,
        DividerModule,
        DialogModule,
        MatProgressBarModule,
        CheckboxModule,
        SplitterModule,
        AccordionModule,
        PanelModule,
        DropdownModule,
        TableModule,
        KatexImgDirective
    ],
    standalone: true
})


export class CauhoiKetthucHocphanComponent implements OnInit {

    countChanges = 0;

    @ViewChild('paginator', { static: true }) paginator: Paginator;

    @ViewChild('paginator_q', { static: true }) paginator_q: Paginator;

    @ViewChild('templateQuestion') templateQuestion: TemplateRef<any>;

    @ViewChild('templateQuestionHelp') templateQuestionHelp: TemplateRef<any>;

    @ViewChild('templateFormAddTieuchicham') templateFormAddTieuchicham: TemplateRef<any>;

    @ViewChildren('panel_tieuchi') panel_tieuchi: QueryList<any>;

    list_typeQuestion_practice = [
        { id: 1, label: 'Câu hỏi', key: 'QUESTION' },
        { id: 2, label: 'Đề', key: 'GROUP_QUESTION' },
    ]

    formData: FormGroup;

    chuandaura = CHUAN_DAU_RA;

    closeLeft: boolean = false;

    // isManager: boolean = false;

    // isLanhDaoKhoa: boolean = false;

    // isLanhDaoBomon: boolean = false;

    courseSelected: ElnKhoaHoc;

    dmKhoahoc: ElnKhoaHoc[];

    totalCourse: number = 0;

    limitCourse: number = 20;

    list_donvi_chuyenmon: DonVi[];

    categoryFilter: number;

    searchCourse: string;

    userId: number;

    donviId: number;

    user_profile: ElngUserProfile;

    my_course: boolean = false;

    indexTap = 0;

    type_question: any;

    formTitle: string = '';

    list_tuluan: CoursePlanActivityTuluan[];

    selectedTuluan: CoursePlanActivityTuluan;

    list_question = [
        { id: 1, label: 'Câu 1' },
        { id: 2, label: 'Câu 2' }
    ]

    isUpdate: boolean = false;

    ckEditor = {
        editor1: null,
        editor2: null
    };

    limit_tuluan: number = 20;

    total_tuluan: number = 0;


    list_unprivate_tuluan: CoursePlanActivityTuluan[];

    selectedComment: CoursePlanTuluanComment;

    pageIndex: number = 1;

    pageCourseIndex: number = 1;

    codeTuluan: string;

    totalSinhdeObject: SINHDEOBJECT = {
        cau_1: [],
        cau_2: [],
        chuaduyet: 0,
        cau_1_total: 0,
        cau_2_total: 0,
        ghi_de: false
    }

    display_sinhde: boolean = false;

    progressValue: number = 0;

    displayModal: boolean = false;

    waitting_title: string = 'Đang thực hiện quá trình sinh đề, vui lòng không tắt trình đuyệt';

    canAdd: boolean = false;

    canUpdate: boolean = false;

    canDelete: boolean = false;

    routerAdmin: boolean = false;

    routerDaotao: boolean = false;

    routerGiangvien: boolean = false;

    routerLanhdaokhoa: boolean = false;

    routerKhaothi: boolean = false;

    routerLanhdaobomon: boolean = false;

    list_activity_cdr: CoursePlanActivities[] = [];

    list_tieuchi_chamdiem: CoursePlanActivityTuluanTieuchicham[] = [];

    activityTieuChiIndex: number = 0;

    sortAZ: boolean = false;

    constructor(
        private elnKhoaHocService: ElnKhoaHocService,
        private userService: UserService,
        private auth: AuthService,
        private noitifi: NotificationService,
        private elngUserProfileService: ElngUserProfileService,
        private donViService: DonViService,
        private formBuilder: FormBuilder,
        private coursePlanActivityTuluanService: CoursePlanActivityTuluanService,
        private coursePlanActivitiesService: CoursePlanActivitiesService,
        private coursePlanTuluanCommentService: CoursePlanTuluanCommentService,
        private router: Router,
        private helperService: HelperService,
        private coursePlanActivityTuluanTieuchichamService: CoursePlanActivityTuluanTieuchichamService
    ) {

        const url = this.router.url.substring(7).split('?')[0];

        this.routerAdmin = this.auth.hasRouter(ROUTERS.admin);

        this.routerDaotao = this.auth.hasRouter(ROUTERS.daotao);

        this.routerLanhdaokhoa = this.auth.hasRouter(ROUTERS.lanhdao_khoa);

        this.routerGiangvien = this.auth.hasRouter(ROUTERS.giangvien);

        this.routerKhaothi = this.auth.hasRouter(ROUTERS.khaothi);

        this.routerLanhdaobomon = this.auth.hasRouter(ROUTERS.lanhdao_bomon);

        this.canAdd = this.auth.userCanAdd(url);

        this.canDelete = this.auth.userCanDelete(url);

        this.canUpdate = this.auth.userCanEdit(url);

        this.formData = this.formBuilder.group({
            desc: ['', Validators.required],
            title: [''],
            course_id: [''],
            time_duration: [''],
            type: [''],
            point: ['', Validators.required],
            private: [''],
            ordering: [''],
            note: [''],
            tuluan_id: [''],
            cdr: [''],
            activity_cdr_ids: ['']
        });

        this.userId = this.auth.user.id;
        this.donviId = this.auth.user.donvi_id;
        // this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin) ? true : false;
        // this.isLanhDaoKhoa = this.auth.userHasRole(ROLES.lanhdaokhoa);
        // this.isLanhDaoBomon = this.auth.userHasRole(ROLES.lanhdaobomon);
    }

    get f() {
        return this.formData.controls;
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
                    if (this.routerLanhdaokhoa)
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

    resetForm() {
        this.formData.reset();
        this.isUpdate = false;
        this.f['ordering'].setValue(1);
        this.f['course_id'].setValue(this.courseSelected.id);
        this.f['type'].setValue(this.type_question.key);
        this.f['private'].setValue(1);
        this.f['desc'].setValue('');
        this.f['note'].setValue('');

        if (this.type_question.key === "GROUP_QUESTION") {
            this.f['point'].setValue(10);
        }

        if (this.indexTap === 1) {
            if (this.total_tuluan !== 0) {
                this.f['title'].setValue('Đề số '.concat((this.total_tuluan + 1).toString()));
                this.f['ordering'].setValue(this.total_tuluan + 1);
            } else if (this.courseSelected) {
                this.f['title'].setValue('Đề số '.concat((this.courseSelected['GROUP_QUESTION'] + 1).toString()));
                this.f['ordering'].setValue(this.courseSelected['GROUP_QUESTION'] + 1);
            }
            this.f['time_duration'].setValue('50');

        }

        if (this.ckEditor.editor1) {
            this.ckEditor.editor1.data.set('');
            // this.ckEditor.editor1 = null;
        }

        if (this.ckEditor.editor2) {
            this.ckEditor.editor2.data.set('');
            // this.ckEditor.editor2 = null;
        }
    }

    ckEditorSetup(ckEditor, name) {
        this.ckEditor[name] = ckEditor;
    }

    loadPageData_course(page: number) {
        this.dmKhoahoc = [];
        const condition_course: ConditionOption = {
            condition: [
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and', },
                { conditionName: 'params', condition: OvicQueryCondition.like, value: '%THUCHANH%', orWhere: 'and', },

            ],
            set: [{ label: 'orderby', value: 'title' }, { label: 'limit', value: this.limitCourse.toString() }],
            page: page.toString()
        }

        if (this.routerLanhdaokhoa && (!this.user_profile || !this.user_profile.donvi_chuyenmon_id)) {
            this.noitifi.isProcessing(false)
            return this.noitifi.toastInfo("Thầy/Cô chưa được phân vào khoa trong hệ thống, vui lòng liên hệ phòng đào tạo");
        }

        if (this.categoryFilter || this.routerLanhdaokhoa) {
            condition_course.condition.push({ conditionName: 'category_ids', condition: OvicQueryCondition.equal, value: this.categoryFilter.toString(), orWhere: 'and' });
        }

        if (this.routerLanhdaobomon) {
            if (this.user_profile.bomon_id) {
                condition_course.condition.push({ conditionName: 'nganh_bomon_id', condition: OvicQueryCondition.equal, value: this.user_profile.bomon_id.toString(), orWhere: 'and' });
            } else {
                this.noitifi.isProcessing(false)
                return this.noitifi.toastInfo("Thầy/Cô chưa được phân vào bộ môn trong hệ thống, vui lòng liên hệ phòng đào tạo");
            }
        }

        if (this.routerGiangvien) {
            this.my_course = true;
        }

        if (this.my_course) {
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


            if (_course_ids.length) {
                const condition_tuluan: ConditionOption = {

                    condition: [
                        { conditionName: 'private', condition: OvicQueryCondition.equal, value: '1', orWhere: 'and' },
                        { conditionName: 'course_plan_activity_id', condition: OvicQueryCondition.equal, value: '0', orWhere: 'and' }
                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'include', value: _course_ids.toString() },
                        { label: 'include_by', value: 'course_id' },
                        { label: 'select', value: 'course_id,status,type' }
                    ],
                    page: null
                }

                return this.coursePlanActivityTuluanService.getCoursePlanActivityTuluanByPageNew(condition_tuluan).pipe(mergeMap(_tuluan => {
                    _course_.data.forEach(f => {
                        const gray = _tuluan.data.filter(m => (m.status === 0 || m.status === -2) && f.id === m.course_id).length;
                        const red = _tuluan.data.filter(m => m.status === -1 && f.id === m.course_id).length;
                        const blue = _tuluan.data.filter(m => m.status === 1 && f.id === m.course_id).length;
                        f['status_question'] = '(<span class="gray">'.concat(gray.toString(), '</span> + <span class="red">', red.toString(), '</span> + <span class="blue">', blue.toString(), '</span> = ', (gray + red + blue).toString(), ')')
                        f['QUESTION'] = _tuluan.data.filter(m => m.course_id === f.id && m.type === 'QUESTION').length;
                        f['GROUP_QUESTION'] = _tuluan.data.filter(m => m.course_id === f.id && m.type === 'GROUP_QUESTION').length;
                    })
                    return of(_course_);
                }))
            }
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
                        if (this.courseSelected) {
                            const index = this.dmKhoahoc.findIndex(m => m.id === this.courseSelected.id);
                            if (index !== -1) {
                                this.courseSelected = this.dmKhoahoc[index];
                            }
                        } else {
                            this.courseSelected = this.dmKhoahoc[0];
                        }

                        this.onSelectTap(this.type_question ? this.type_question : this.list_typeQuestion_practice[0], this.indexTap);
                    }

                }
                this.noitifi.isProcessing(false);
            },

            error: () => {
                this.noitifi.isProcessing(false);
            }
        })

    }

    closeLeftBody() {
        this.closeLeft = !this.closeLeft;
    }

    onSelectCourse(event: MatSelectionListChange) {
        this.courseSelected = event.options[0].value;
        this.onSelectTap(this.list_typeQuestion_practice[0], 0);
    }

    changePage(event) {
        this.pageCourseIndex = event.page + 1;
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

    onSelectTap(lvl, index: number) {
        this.indexTap = index;
        this.type_question = lvl;
        this.loadTuLuan(1);
    }

    loadTuLuan(page: number) {
        const conditiion_tuluan: ConditionOption = {
            condition: [
                { conditionName: 'private', condition: OvicQueryCondition.equal, value: '1', orWhere: 'and' },
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.courseSelected.id.toString(), orWhere: 'and' },
                { conditionName: 'type', condition: OvicQueryCondition.equal, value: this.type_question.key, orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: this.limit_tuluan.toString() },
            ],
            page: page.toString()
        }

        if (this.sortAZ) {
            conditiion_tuluan.set.push(
                { label: 'order', value: 'DESC' },
                { label: 'orderby', value: 'id' }
            )
        } else {
            conditiion_tuluan.set.push(
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'ordering' }
            )
        }

        const conditiion_count: ConditionOption = {
            condition: [
                { conditionName: 'private', condition: OvicQueryCondition.equal, value: '1', orWhere: 'and' },
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.courseSelected.id.toString(), orWhere: 'and' },
                { conditionName: 'type', condition: OvicQueryCondition.equal, value: this.type_question.key, orWhere: 'and' }
            ],

            set: [
                { label: 'limit', value: '1' }
            ],

            page: null
        }

        this.noitifi.isProcessing(true);

        const condition_tuluan_unprivate: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.courseSelected.id.toString(), orWhere: 'and' },
                { conditionName: 'status', condition: OvicQueryCondition.equal, value: '1', orWhere: 'and' },
                { conditionName: 'course_plan_activity_id', condition: OvicQueryCondition.notEqual, value: '0', orWhere: 'and' },
                { conditionName: 'type', condition: OvicQueryCondition.notEqual, value: 'GROUP_QUESTION', orWhere: 'and' },
                { conditionName: 'type', condition: OvicQueryCondition.notEqual, value: 'QUESTION', orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'id,course_plan_activity_id,title,desc' }
            ],
            page: null
        }

        const condition_kynang: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.courseSelected.id.toString(), orWhere: 'and' },
                { conditionName: 'status', condition: OvicQueryCondition.equal, value: '1', orWhere: 'and' },
                { conditionName: 'type', condition: OvicQueryCondition.equal, value: 'THUONGXUYEN_TULUAN', orWhere: 'and' },
            ],

            set: [
                { label: 'limit', value: '-1' },
            ],

            page: null
        }


        if (this.codeTuluan && this.codeTuluan.trim()) {
            conditiion_tuluan.condition.push({ conditionName: 'id', condition: OvicQueryCondition.like, value: '%' + this.codeTuluan.trim() + '%', orWhere: 'and' });
            conditiion_count.condition.push({ conditionName: 'id', condition: OvicQueryCondition.like, value: '%' + this.codeTuluan.trim() + '%', orWhere: 'and' });
        }


        const condition_cdr: ConditionOption = {
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
                    conditionName: 'type',
                    condition: OvicQueryCondition.equal,
                    value: 'ACTIVITY_CDR',
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


        forkJoin([
            this.coursePlanActivityTuluanService.getCoursePlanActivityTuluanByPageNew(conditiion_tuluan).pipe(mergeMap(_tuluan => {
                const _tuluan_ids = [];
                _tuluan.data.forEach(f => {
                    _tuluan_ids.push(f.id);
                })
                const condition_comment: ConditionOption = {
                    condition: [
                        // { conditionName: 'course_plan_activity_tuluan_id', condition: OvicQueryCondition.equal, value: this.selectedTuluan.id.toString(), orWhere: 'and' },
                        { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.courseSelected.id.toString(), orWhere: 'and' },
                        { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: '0', orWhere: 'and', },
                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'include', value: _tuluan_ids.toString() },
                        { label: 'include_by', value: 'course_plan_activity_tuluan_id' }
                    ],
                    page: null
                }

                const condition_reply_comment: ConditionOption = {
                    condition: [
                        // { conditionName: 'course_plan_activity_tuluan_id', condition: OvicQueryCondition.equal, value: this.selectedTuluan.id.toString(), orWhere: 'and' },
                        { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.courseSelected.id.toString(), orWhere: 'and' },
                        { conditionName: 'parent_id', condition: OvicQueryCondition.notEqual, value: '0', orWhere: 'and', },
                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'select', value: 'id, parent_id' },
                        { label: 'include', value: _tuluan_ids.toString() },
                        { label: 'include_by', value: 'course_plan_activity_tuluan_id' }
                    ],
                    page: null,
                };

                let tieuchi_ids = [];

                _tuluan.data.forEach(f => {
                    if (f.tuluan_root_ids) {
                        tieuchi_ids = tieuchi_ids.concat(f.tuluan_root_ids.split("|").filter(m => m));
                    }

                    tieuchi_ids.push(f.id);
                })

                tieuchi_ids.push(0);

                const condition_tieuchicham: ConditionOption = {
                    condition: [
                        { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.courseSelected.id.toString() }
                    ],
                    set: [
                        { label: "limit", value: "-1" },
                        { label: 'include', value: [...new Set(tieuchi_ids)].toString() },
                        { label: 'include_by', value: 'course_plan_activity_tuluan_id' },
                        { label: 'order', value: 'ASC' },
                        { label: 'orderby', value: 'ordering' }
                    ],
                    page: null
                }

                if (_tuluan_ids.length) {
                    return forkJoin([
                        this.coursePlanTuluanCommentService.getCoursePlanTuluanCommentByPageNew(condition_comment),
                        this.coursePlanTuluanCommentService.getCoursePlanTuluanCommentByPageNew(condition_reply_comment),
                        this.coursePlanActivityTuluanTieuchichamService.getCoursePlanActivityTuluanTieuchichamByPageNew(condition_tieuchicham)
                    ]).pipe(mergeMap(([_comment, _comment_child, _tieuchi_cham]) => {

                        _tuluan.data.forEach(f => {
                            const object_comment = {};
                            const _filter_comment = _comment.data.filter(m => m.course_plan_activity_tuluan_id === f.id);
                            _filter_comment.forEach((c) => {
                                const count_reply = _comment_child.data.filter((m) => m.parent_id === c.id).length;
                                c['count_reply'] = count_reply;
                                c['reply_open'] = false;
                                if (!object_comment[c.user_id]) {
                                    object_comment[c.user_id] = [];
                                    object_comment[c.user_id].push(c);
                                } else {
                                    object_comment[c.user_id].push(c);
                                }
                            });

                            f['comments'] = [];

                            Object.keys(object_comment).forEach(
                                (o, key) => {
                                    let display_name = 'Ủy viên '.concat((key + 1).toString());
                                    if (o.toString() === this.userId.toString()) {
                                        display_name = 'Nhận xét của bạn';
                                    }

                                    f['comments'].push({
                                        user_id: o,
                                        display_name: display_name,
                                        children: object_comment[o],
                                    });
                                }
                            );

                            f['tieuchi_cham'] = [];

                            f['tieuchi_cham_cau1'] = [];

                            f['tieuchi_cham_cau2'] = [];

                            if (f.tuluan_root_ids) {
                                const root_ids = f.tuluan_root_ids.split("|").filter(m => m);

                                f['tieuchi_cham_cau1'] = _tieuchi_cham.data.filter(m => m.course_plan_activity_tuluan_id.toString() === root_ids[0]);

                                f['tieuchi_cham_cau2'] = _tieuchi_cham.data.filter(m => m.course_plan_activity_tuluan_id.toString() === root_ids[1]);

                                //f['tieuchi_cham'] = f['tieuchi_cham'].concat(_tieuchi_cham.data.filter(m => root_ids.findIndex(i => i.toString() === m.toString())));
                            }

                            f['tieuchi_cham'] = f['tieuchi_cham'].concat(_tieuchi_cham.data.filter(m => m.course_plan_activity_tuluan_id === f.id));
                        })
                        return of(_tuluan);
                    }))
                } else {
                    return of(_tuluan);
                }

            })),
            this.coursePlanActivityTuluanService.getCoursePlanActivityTuluanByPageNew(conditiion_count),
            this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_kynang).pipe(mergeMap(_kynangthuchanh => {
                const kynang_ids = [];
                _kynangthuchanh.data.forEach(f => {
                    kynang_ids.push(f.id);
                })

                if (kynang_ids.length) {
                    condition_tuluan_unprivate.set.push({ label: 'include', value: kynang_ids.toString() });
                    condition_tuluan_unprivate.set.push({ label: 'include_by', value: 'course_plan_activity_id' });
                    return this.coursePlanActivityTuluanService.getCoursePlanActivityTuluanByPageNew(condition_tuluan_unprivate).pipe(mergeMap(_tuluan_unprivate => {
                        _tuluan_unprivate.data.forEach(f => {

                            const index = _kynangthuchanh.data.findIndex(m => m.id === f.course_plan_activity_id);
                            if (index !== -1) {
                                f['label'] = f.title.concat(' - ', _kynangthuchanh.data[index].title);
                                f['show_label'] = _kynangthuchanh.data[index].title.concat(': ', f['label']);
                            }
                        })
                        this.list_unprivate_tuluan = _tuluan_unprivate.data;
                        return of({ _kynangthuchanh: _kynangthuchanh, _tuluan_unprivate: _tuluan_unprivate });
                    }))
                }

                return of({ _kynangthuchanh: _kynangthuchanh, _tuluan_unprivate: null });
            })),
            this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_cdr)
        ]).subscribe({
            next: ([_tuluan, _count, _kynang_and_tuluan, _cdr]) => {
                this.noitifi.isProcessing(false);
                this.total_tuluan = _count.recordsFiltered;
                _tuluan.data.forEach(f => {
                    f['extend'] = true;
                    if (f.tuluan_id && _kynang_and_tuluan['_tuluan_unprivate']) {
                        const ids = f.tuluan_id.toString().split(',')
                        const data = this.list_unprivate_tuluan.filter(m => ids.findIndex(i => i.toString() === m.id.toString()) !== -1);
                        if (data && data.length) {
                            let titles = [];
                            data.forEach(f => {
                                titles.push(f['label']);
                            })
                            f['tuluan_in_name'] = titles;
                        }

                        // const index = _kynang_and_tuluan['_tuluan_unprivate'].data.findIndex(m => m.id === f.tuluan_id);
                        // if (index !== -1) {
                        //     f['tuluan_in_name'] = _kynang_and_tuluan['_tuluan_unprivate'].data[index]['show_label'];
                        // }
                    }
                })

                this.list_tuluan = _tuluan.data;

                const _re_kyhieu_cdr = _cdr.data.map(m => {
                    m['label'] = m.kyhieu.concat(". ", m.title);
                    m['re_kyhieu'] = parseFloat(m.kyhieu.replace(/\D/g, ""));
                    return m;
                })

                this.list_activity_cdr = this.helperService.sort(_re_kyhieu_cdr, "re_kyhieu");

            },

            error: (e) => {
                console.log(e);
                this.noitifi.isProcessing(false);
            }
        })
    }

    onOpenAddQuestion(lvl, index: number) {
        this.type_question = lvl;
        this.formTitle = "Thêm ".concat(this.type_question.label);
        if (index !== this.indexTap) {
            this.total_tuluan = 0;
        }
        this.indexTap = index;
        this.resetForm();
        this.loadTuLuan(1);
        this.noitifi.openSideNavigationMenu({ template: this.templateQuestion, size: 800, offsetTop: '0px' });
    }

    closeSideMenu() {
        // this.ckEditor.editor1 = null;
        // this.ckEditor.editor2 = null;
        this.noitifi.closeSideNavigationMenu();
        this.loadTuLuan(this.pageIndex);
    }

    saveCourseTuluan(b?: boolean) {
        if (this.formData.valid) {
            switch (this.type_question.key) {
                case 'QUESTION':
                    if (!this.f['point'].value && this.f['point'].value !== 0) {
                        return this.noitifi.toastWarning("Vui lòng nhập điểm");
                    }
                    break;
                case 'GROUP_QUESTION':

                    if (!this.f['time_duration'].value) {
                        return this.noitifi.toastWarning("Vui lòng nhập thời gian làm bài");
                    }

                    if (!this.f['title'].value) {
                        return this.noitifi.toastWarning("Vui lòng nhập tiêu đề");
                    }

                    break;
                default:
                    break;
            }

            this.noitifi.isProcessing(true);

            if (this.isUpdate) {
                const data = { ...this.formData.getRawValue() };

                if (b === true) {
                    data['status'] = -2;
                }

                // const note = data.note ? data.note.replace(/<(.*?)><\/(.*?)>/gi, '') : null;

                // if (!note || note === '') {
                //     data.note = null;
                // }

                // const desc = data.desc ? data.desc.replace(/<(.*?)><\/(.*?)>/gi, '') : null;

                // if (!desc || desc === '') {
                //     data.desc = '';
                // }

                this.coursePlanActivityTuluanService.updateCoursePlanActivityTuluan(this.selectedTuluan.id, data).subscribe({
                    next: () => {
                        this.noitifi.isProcessing(false);
                        this.noitifi.toastSuccess("Sửa thành công");
                        this.resetForm();
                        this.closeSideMenu();
                        this.loadTuLuan(this.pageIndex);
                    },
                    error: () => {
                        this.noitifi.toastError("Sửa thất bại");
                        this.noitifi.isProcessing(false)
                    }
                })
            } else {
                this.coursePlanActivityTuluanService.addCoursePlanActivityTuluan(this.formData.value).subscribe({
                    next: () => {
                        this.noitifi.isProcessing(false);
                        this.noitifi.toastSuccess("Thêm thành công");
                        this.resetForm();
                        this.resetPageTuluan(1);
                    },
                    error: () => {
                        this.noitifi.toastError("Thêm thất bại");
                        this.noitifi.isProcessing(false)
                    }
                })
            }
        } else {

            this.noitifi.toastWarning("Vui lòng nhập nội dung");
        }
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

    changePageQuestion(event) {
        this.pageIndex = event.page + 1;
        this.loadTuLuan(event.page + 1);
    }


    filterIdTuluan(page_order) {
        if (this.codeTuluan && this.codeTuluan.trim()) {
            if (this.paginator_q) {
                this.paginator_q.changePage(page_order - 1);
            } else {
                this.loadTuLuan(1);
            }
        } else {
            this.loadTuLuan(1);
        }
    }

    filterNone(page_order) {
        if (!this.codeTuluan) {
            if (this.paginator_q) {
                this.paginator_q.changePage(page_order - 1);
            } else {
                this.loadTuLuan(1);
            }
        }
    }


    resetPageTuluan(page_order: number) {
        if (this.paginator_q) {
            if (!this.paginator_q.empty()) {
                this.paginator_q.changePage(page_order - 1);
            } else {
                this.loadTuLuan(1);
            }
        } else {
            this.loadTuLuan(1);
        }
    }

    editQuestion(quest: CoursePlanActivityTuluan) {
        this.resetForm();
        this.isUpdate = true;
        this.formTitle = "Sửa ".concat(this.type_question.label);
        this.selectedTuluan = quest;

        this.f['title'].setValue(quest.title);
        this.f['time_duration'].setValue(quest.time_duration);
        this.f['point'].setValue(quest.point);

        if (this.type_question.key === "GROUP_QUESTION") {
            this.f['point'].setValue(10);
        }

        this.f['ordering'].setValue(quest.ordering);
        this.f['desc'].setValue(quest.desc);
        this.f['note'].setValue(quest.note);
        this.f['tuluan_id'].setValue(quest.type === 'GROUP_QUESTION' ? quest.tuluan_id : Number(quest.tuluan_id));

        this.f['cdr'].setValue(quest.cdr);
        this.f['activity_cdr_ids'].setValue(quest.activity_cdr_ids);

        if (this.ckEditor.editor1 && this.ckEditor.editor1.data) {
            this.ckEditor.editor1.data.set(quest.desc ? quest.desc : '');
        }

        if (this.ckEditor.editor2 && this.ckEditor.editor2.data) {
            this.ckEditor.editor2.data.set(quest.note ? quest.note : '');
        }

        if (quest.status === 1) {
            this.noitifi.openSideNavigationMenu({ template: this.templateQuestionHelp, size: 800, offsetTop: '0px' });
        } else {
            this.noitifi.openSideNavigationMenu({ template: this.templateQuestion, size: 800, offsetTop: '0px' });
        }

    }

    deleteQuestion(quest: CoursePlanActivityTuluan) {
        this.noitifi.confirmDelete().then(a => {
            if (a) {
                this.noitifi.isProcessing(true);
                this.coursePlanActivityTuluanService.deleteCoursePlanActivityTuluan(quest.id).subscribe({
                    next: () => {
                        this.resetPageTuluan(this.pageIndex);
                        this.noitifi.isProcessing(false);
                        this.noitifi.toastSuccess("Xoá thành công");
                    },
                    error: () => {
                        this.noitifi.isProcessing(false);
                        this.noitifi.toastSuccess("Xoá thất bại");
                    }
                })
            }
        })
    }

    extendQuestion(quest: CoursePlanActivityTuluan) {
        quest['extend'] = !quest['extend'];
    }

    startCopyDesc(event) {
        event.preventDefault();
        const ids = this.f['tuluan_id'].value.toString().split(',')
        const data = this.list_unprivate_tuluan.filter(m => ids.findIndex(i => i.toString() === m.id.toString()) !== -1);
        if (data && data.length) {

            let desc = '';

            data.forEach(f => {
                desc = desc.concat(f.desc);
            })

            this.f['desc'].setValue(desc);

            if (this.ckEditor.editor1) {
                this.ckEditor.editor1.data.set(desc)
            }
        }
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
                    if (f.user_id === this.courseSelected.creator_plan_id && this.userId !== f.user_id) {
                        f['display_name'] = this.courseSelected['user_label'];
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
                this.noitifi.toastError('Lỗi kết nôi, vui lòng thử lại');
            }
        })
    }


    saveCommentReply(comment: CoursePlanTuluanComment, question: CoursePlanActivityTuluan, index_comment: number) {
        const comment_content = comment['textarea_comment'] ? comment['textarea_comment'].trim() : comment['textarea_comment'].trim();

        if (comment_content && comment_content !== '') {
            const data_comment: CoursePlanTuluanComment = {
                course_plan_activity_id: 0,
                comment: comment_content,
                status: 0,
                user_id: this.userId,
                course_id: this.courseSelected.id,
                parent_id: comment.id,
                course_plan_activity_tuluan_id: question.id
            }

            this.coursePlanTuluanCommentService.addCoursePlanTuluanComment(data_comment).subscribe({
                next: () => {
                    this.noitifi.toastSuccess("Đã gửi phản hồi thành công");
                    comment['textarea_comment'] = '';
                    this.loadReplyComment(this.selectedComment, index_comment);
                },
                error: () => {
                    this.noitifi.toastError("Lỗi kết nối, vui lòng thử lại")
                }
            })
        } else {
            this.noitifi.toastWarning("Vui lòng nhập phản hồi trước khi gửi")
        }
    }


    yeucauduyet(question: CoursePlanActivityTuluan) {
        this.noitifi.confirm('<div class="alert-duyetnoidung">' +
            '<span>- Bạn đang thực hiện thao tác yêu cầu duyệt nội dung giảng dạy</span>' +
            '<span>- Thao tác này không thể hoàn tác</span>' +
            '<span>- Bạn có chắc chắn yêu cầu duyệt nội dung giảng dạy này?</span>' +
            '</div>', 'Xác nhận hành động', [BUTTON_YES, BUTTON_NO]).then(a => {
                if (a.name === 'yes') {
                    this.noitifi.isProcessing(true);
                    this.coursePlanActivityTuluanService.updateCoursePlanActivityTuluan(question.id, { status: -2 }).subscribe({
                        next: () => {
                            question['status'] = 0;
                            this.noitifi.isProcessing(false);
                            this.noitifi.toastSuccess('Cập nhật thành công');
                        },
                        error: () => {
                            this.noitifi.isProcessing(false);
                            this.noitifi.toastError('Cập nhật thất bại, Lỗi kết nối');
                        }
                    })
                }
            })
    }

    returnToOrderPage(page_order: number) {
        if (this.paginator) {
            if (!this.paginator.empty()) {
                this.paginator.changePage(page_order - 1);
            } else {
                this.loadPageData_course(1);
            }
        } else {
            this.loadPageData_course(1);
        }
    }

    openSinhdeTuluan() {
        // return this.noitifi.toastWarning( 'Chức năng nay đang tạm khóa' );
        this.totalSinhdeObject = {
            cau_1: [],
            cau_2: [],
            chuaduyet: 0,
            cau_1_total: 0,
            cau_2_total: 0,
            ghi_de: false
        }

        if (this.courseSelected) {
            this.noitifi.isProcessing(true);
            const conditiion_tuluan: ConditionOption = {
                condition: [
                    { conditionName: 'private', condition: OvicQueryCondition.equal, value: '1', orWhere: 'and' },
                    { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.courseSelected.id.toString(), orWhere: 'and' },
                    { conditionName: 'type', condition: OvicQueryCondition.equal, value: this.type_question.key, orWhere: 'and' }
                ],
                set: [
                    { label: 'limit', value: '-1' }
                ],
                page: null
            }

            this.coursePlanActivityTuluanService.getCoursePlanActivityTuluanByPageNew(conditiion_tuluan).subscribe({
                next: (_tuluan) => {
                    if (_tuluan.recordsFiltered) {
                        this.totalSinhdeObject.cau_1 = _tuluan.data.filter(m => m.ordering === 1);
                        this.totalSinhdeObject.cau_2 = _tuluan.data.filter(m => m.ordering === 2);
                        this.totalSinhdeObject.cau_1_total = this.totalSinhdeObject.cau_1.length;
                        this.totalSinhdeObject.cau_2_total = this.totalSinhdeObject.cau_2.length;
                        this.totalSinhdeObject.chuaduyet = _tuluan.data.filter(m => m.status !== 1).length;
                        this.display_sinhde = true;
                    } else {
                        this.noitifi.toastWarning("Không tìm thấy câu hỏi nào");
                    }

                    this.noitifi.isProcessing(false);
                },
                error: () => {

                }
            })
        }
    }

    startSinhde() {
        if (this.totalSinhdeObject.chuaduyet === 0) {
            if (this.totalSinhdeObject.cau_1_total === 0) {
                return this.noitifi.toastWarning('Không có câu 1, không đủ điều kiện sinh đề');
            }

            if (this.totalSinhdeObject.cau_2_total === 0) {
                return this.noitifi.toastWarning('Không có câu 2, không đủ điều kiện sinh đề');
            }


            this.noitifi.confirm('Thầy/Cô có chắc chắn muốn thực hiện thao tác sinh đề?', 'Xác nhận hành động', [BUTTON_YES, BUTTON_NO]).then(a => {
                if (a.name === 'yes') {
                    const request: Observable<any>[][] = [];
                    let j = 0;
                    request[j] = [];
                    let i = 0;
                    this.totalSinhdeObject.cau_1.forEach((f1, key1) => {
                        this.totalSinhdeObject.cau_2.forEach((f2, key2) => {
                            i = i + 1;
                            const group_q: CoursePlanActivityTuluan = {
                                note: null,
                                tuluan_id: null,
                                point: f1.point + f2.point,
                                time_duration: 0,
                                desc: '',
                                tuluan_root_ids: null,
                                course_plan_activity_id: 0,
                                files: null,
                                ordering: i,
                                title: 'Đề số '.concat(i.toString()),
                                status: 1,
                                course_id: this.courseSelected.id,
                                private: 1,
                                type: 'GROUP_QUESTION',
                                activity_cdr_ids: null
                            }

                            const note_1 = f1.note ? '<p><strong>Câu 1: </strong></p>' + f1.note : '';
                            const note_2 = f2.note ? '<p><strong>Câu 2: </strong></p>' + f2.note : '';
                            const desc_1 = f1.desc ? '<p><strong>Câu 1: (' + f1.point.toString() + ' Điểm)</strong></p>'.concat(f1.desc) : '';
                            const desc_2 = f2.desc ? '<p><strong>Câu 2: (' + f2.point.toString() + ' Điểm)</strong></p>'.concat(f2.desc) : '';
                            const tuluanid_1 = f1.tuluan_id ? f1.tuluan_id : '';
                            const tuluanid_2 = f2.tuluan_id ? f2.tuluan_id : '';
                            if (this.courseSelected.params) {
                                if (this.courseSelected.params.sotinchi <= 2) {
                                    group_q.time_duration = 60;
                                } else {
                                    group_q.time_duration = 90;
                                }
                            }
                            group_q.note = note_1.concat(note_2);
                            group_q.desc = desc_1.concat(desc_2);
                            group_q.point = f1.point + f2.point;
                            group_q.tuluan_id = [... new Set(tuluanid_1.concat(',', tuluanid_2).split(','))].map(m => m).join(',');
                            group_q.tuluan_root_ids = '|'.concat(f1.id.toString(), '|', f2.id.toString(), '|');

                            const f1_activity_cdr_ids = f1.activity_cdr_ids && Array.isArray(f1.activity_cdr_ids) ? f1.activity_cdr_ids : [];
                            const f2_activity_cdr_ids = f2.activity_cdr_ids && Array.isArray(f2.activity_cdr_ids) ? f2.activity_cdr_ids : [];

                            const activity_cdr_ids = f1_activity_cdr_ids.concat(f2_activity_cdr_ids);
                            group_q.activity_cdr_ids = activity_cdr_ids && activity_cdr_ids.length ? activity_cdr_ids : null;
                            const condition_tuluan_dup: ConditionOption = {
                                condition: [
                                    { conditionName: 'tuluan_root_ids', condition: OvicQueryCondition.equal, value: group_q.tuluan_root_ids, orWhere: 'and' },
                                    { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.courseSelected.id.toString(), orWhere: 'and' },
                                    { conditionName: 'type', condition: OvicQueryCondition.equal, value: group_q.type, orWhere: 'and' }
                                ],
                                set: [
                                    { label: 'limit', value: '1' }
                                ],
                                page: null
                            }
                            if (request[j].length < 3) {
                                request[j].push(this.coursePlanActivityTuluanService.getCoursePlanActivityTuluanByPageNew(condition_tuluan_dup).pipe(mergeMap(_res => {
                                    if (_res.recordsFiltered) {
                                        if (this.totalSinhdeObject.ghi_de) {
                                            return this.coursePlanActivityTuluanService.updateCoursePlanActivityTuluan(_res.data[0].id, group_q).pipe(mergeMap(a => {
                                                return of(null);
                                            }))
                                        } else {
                                            return of(null);
                                        }
                                    } else {
                                        return this.coursePlanActivityTuluanService.addCoursePlanActivityTuluan(group_q).pipe(mergeMap(a => {
                                            return of(null);
                                        }))
                                    }
                                })))
                            } else {
                                j = j + 1;
                                request[j] = [];
                                request[j].push(this.coursePlanActivityTuluanService.getCoursePlanActivityTuluanByPageNew(condition_tuluan_dup).pipe(mergeMap(_res => {
                                    if (_res.recordsFiltered) {
                                        if (this.totalSinhdeObject.ghi_de) {
                                            return this.coursePlanActivityTuluanService.updateCoursePlanActivityTuluan(_res.data[0].id, group_q).pipe(mergeMap(a => {
                                                return of(null);
                                            }))
                                        } else {
                                            return of(null);
                                        }
                                    } else {
                                        return this.coursePlanActivityTuluanService.addCoursePlanActivityTuluan(group_q).pipe(mergeMap(a => {
                                            return of(null);
                                        }))
                                    }
                                })))
                            }
                        })
                    })

                    if (request.length) {
                        this.displayModal = true;
                        this.progressValue = 0;
                        this.loopAddDeTuluan(0, request).subscribe({
                            next: () => {
                                this.displayModal = false;
                                // this.getStatusObject();
                                this.type_question = { id: 2, label: 'Đề', key: 'GROUP_QUESTION' };
                                this.indexTap = 1;
                                this.display_sinhde = false;

                                this.returnToOrderPage(this.pageCourseIndex);

                                this.noitifi.toastSuccess("Đã hoàn thành quá trình sinh đề, vui lòng kiểm tra lại số lượn đề đã được sinh ra");
                            },
                            error: () => {
                                this.displayModal = false;
                            }
                        })
                    } else {
                        this.noitifi.toastWarning("Không có đề, vui lòng kiểm tra lại số lượng câu hỏi");
                    }
                }
            })
        } else {
            this.noitifi.toastWarning('Còn câu hỏi chưa duyệt, không đủ điều kiện sinh đề')
        }
    }

    loopAddDeTuluan(key, request_: Observable<any>[][]): Observable<any> {
        this.progressValue = (key + 1) / request_.length * 100;
        return forkJoin(request_[key]).pipe(
            mergeMap(_res => {
                if (request_[key + 1] && request_[key + 1].length) {
                    return this.loopAddDeTuluan(key + 1, request_);
                } else {
                    return of(null)
                }
            }))
    }

    onSelectCDR() {
        if (this.f['activity_cdr_ids'].value) {
            const _cdr_number = this.list_activity_cdr.filter(m => this.f['activity_cdr_ids'].value.includes(m.id)).map(m => parseFloat(m.params.cdr.cdr_info.find(i => i.id === "level_require")['key']));
            this.f['cdr'].setValue(Math.max(..._cdr_number));
        }
    }


    // add Tiêu chí chấm


    returnTotalPointTieuChi() {
        if (this.list_tieuchi_chamdiem.length) {
            return this.list_tieuchi_chamdiem.map(m => m.point).reduce((sum, num) => sum + num, 0);
        }
        return 0;
    }

    addOneTieuchiChams() {
        const data: CoursePlanActivityTuluanTieuchicham = {
            course_id: this.courseSelected.id,
            course_plan_activity_tuluan_id: this.selectedTuluan.id,
            course_plan_activity_id: 0,
            title: '',
            cdr: this.selectedTuluan.cdr,
            point: 1,
            desc: '',
            ordering: this.list_tieuchi_chamdiem.length + 1
        }

        this.noitifi.isProcessing(true);

        this.coursePlanActivityTuluanTieuchichamService.addCoursePlanActivityTuluanTieuchicham(data).subscribe({
            next: () => {
                this.noitifi.toastSuccess("Tạo thành công")
                this.loadTieuchicham();
            },
            error: () => {
                this.noitifi.isProcessing(false);
                this.noitifi.toastError("Tạo thất bại, vui lòng thử lại")
            }
        })
    }

    openAddTieuchicham(tuluan: CoursePlanActivityTuluan) {
        this.formTitle = "".concat(tuluan.title, " - Nhập tiêu chí chấm");
        this.selectedTuluan = tuluan;
        this.activityTieuChiIndex = 0;
        this.noitifi.openSideNavigationMenu({ template: this.templateFormAddTieuchicham, size: window.innerWidth, offsetTop: "0px" });
        this.loadTieuchicham();
    }

    loadTieuchicham() {
        const condition_tieuchicham: ConditionOption = {
            condition: [
                { conditionName: "course_id", condition: OvicQueryCondition.equal, value: this.selectedTuluan.course_id.toString(), orWhere: "and" },
                { conditionName: "course_plan_activity_tuluan_id", condition: OvicQueryCondition.equal, value: this.selectedTuluan.id.toString(), orWhere: "and" }
            ],
            set: [
                { label: "limit", value: "-1" },
                { label: "order", value: "ASC" },
                { label: "orderby", value: "ordering" }
            ],
            page: null
        }

        this.noitifi.isProcessing(true);

        this.coursePlanActivityTuluanTieuchichamService.getCoursePlanActivityTuluanTieuchichamByPageNew(condition_tieuchicham).subscribe({
            next: (tieuchi_cham) => {
                tieuchi_cham.data.forEach(f => {
                    f['collapsed'] = true;
                })
                this.list_tieuchi_chamdiem = tieuchi_cham.data;
                this.noitifi.isProcessing(false);
            }
        })
    }

    addTieuchiChams(isUpdate: boolean = false) {

        const request: Observable<any>[] = [];

        if (this.selectedTuluan.type === "GROUP_QUESTION") {
            this.selectedTuluan.point = 10;
        }

        if (!isUpdate) {
            for (let i = 1; i <= this.selectedTuluan.point; i++) {
                const data: CoursePlanActivityTuluanTieuchicham = {
                    course_id: this.courseSelected.id,
                    course_plan_activity_tuluan_id: this.selectedTuluan.id,
                    course_plan_activity_id: 0,
                    title: '',
                    cdr: this.selectedTuluan.cdr,
                    point: 1,
                    desc: '',
                    ordering: i
                }

                request.push(this.coursePlanActivityTuluanTieuchichamService.addCoursePlanActivityTuluanTieuchicham(data))
            }
        } else {
            this.list_tieuchi_chamdiem.forEach((f, key) => {
                const data: CoursePlanActivityTuluanTieuchicham = {
                    course_id: f.course_id,
                    course_plan_activity_tuluan_id: f.course_plan_activity_tuluan_id,
                    course_plan_activity_id: f.course_plan_activity_id,
                    title: f.title,
                    cdr: f.cdr,
                    point: f.point,
                    desc: f.desc,
                    ordering: key + 1
                }

                request.push(this.coursePlanActivityTuluanTieuchichamService.updateCoursePlanActivityTuluanTieuchicham(f.id, data))
            })
        }

        this.waitting_title = "Đang tạo tiêu chí chấm, vui lòng chờ";
        this.progressValue = 0;
        this.displayModal = true;
        if (request.length) {
            this.loopAddForm(request, 0).subscribe({
                next: () => {
                    this.displayModal = false;
                    this.noitifi.toastSuccess("Tạo thành công")
                    this.loadTieuchicham();
                },
                error: () => {
                    this.displayModal = false;
                    this.noitifi.toastError("Tạo thất bại, vui lòng thử lại")
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

    onChangeEditorTieuchi(event, tieuchi: CoursePlanActivityTuluanTieuchicham) {
        tieuchi.desc = event;
    }

    deleteTieuchi(id: number) {
        this.noitifi.confirmDelete().then(a => {
            if (a) {
                this.noitifi.isProcessing(true);
                this.coursePlanActivityTuluanTieuchichamService.deleteCoursePlanActivityTuluanTieuchicham(id).subscribe({
                    next: () => {
                        this.noitifi.toastSuccess("Xóa thành công");
                        this.loadTieuchicham();
                    },
                    error: () => {
                        this.noitifi.isProcessing(false);
                        this.noitifi.toastError("Xóa thất bại");
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

    returnIdCauhoi() {
        if (this.selectedTuluan && this.selectedTuluan.tuluan_root_ids) {
            return this.selectedTuluan.tuluan_root_ids.split("|").filter(m => m).join(" ; ")
        }
        return '';
    }

    sortAz() {
        this.sortAZ = !this.sortAZ;
        this.filterIdTuluan(0);
    }
}
