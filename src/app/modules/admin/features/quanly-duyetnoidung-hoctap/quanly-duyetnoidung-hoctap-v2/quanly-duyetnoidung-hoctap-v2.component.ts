import { CommonModule } from '@angular/common';
import { CoursePlanActivityTuluanService } from './../../../../shared/services/course-plan-activity-tuluan.service';
import {
    Component,
    ElementRef,
    OnDestroy,
    OnInit,
    ViewChild,
} from '@angular/core';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { ActivatedRoute, Router } from '@angular/router';
import { BUTTON_NO, BUTTON_YES } from '@core/models/buttons';
import { OvicQueryCondition } from '@core/models/dto';
import { OvicDocument } from '@core/models/file';
import { AuthService } from '@core/services/auth.service';
import { FileService } from '@core/services/file.service';
import { HelperService } from '@core/services/helper.service';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { NotificationService } from '@core/services/notification.service';
import { UserService } from '@core/services/user.service';
import { ClassPlanActivities } from '@modules/shared/models/class-plan-activities';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { CoursePlanActivities } from '@modules/shared/models/course-plan-activities';
import { CoursePlanComment } from '@modules/shared/models/course-plan-comment';
import { CourseThanhvien } from '@modules/shared/models/course_thanhvien';
import { DonVi } from '@modules/shared/models/don-vi';
import { EXAMFORMAT, ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { ElngUserProfile } from '@modules/shared/models/elng-user-profile';
import { ConfigsService } from '@modules/shared/services/configs.service';
import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';
import { CoursePlanCommentService } from '@modules/shared/services/course-plan-comment.service';
import { CourseThanhvienService } from '@modules/shared/services/course-thanhvien.service';
import { DonViService } from '@modules/shared/services/don-vi.service';
import { ElnChuyenMucService } from '@modules/shared/services/elearning-chuyen-muc.service';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { OvicDateTimeService } from '@modules/shared/services/ovic-date-time.service';
import {
    CHUAN_DAU_RA,
    LARGE_MODAL_OPTIONS,
    ROLES,
} from '@modules/shared/utils/syscat';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Paginator, PaginatorModule } from 'primeng/paginator';
import { forkJoin, mergeMap, of } from 'rxjs';
import { SharedModule } from '@modules/shared/shared.module';
import { TabViewModule } from 'primeng/tabview';
import { MatMenuModule } from '@angular/material/menu';
import { PanelModule } from 'primeng/panel';
import { KetquaDuyetAllComponent } from '../ketqua-duyet-all/ketqua-duyet-all.component';
import { KetQuaThamDinhComponent } from '../ket-qua-tham-dinh/ket-qua-tham-dinh.component';
import { DuyetCauhoiComponent } from '../duyet-cauhoi/duyet-cauhoi.component';
import { DuyetCauhoiThuchanhKthpComponent } from '../duyet-cauhoi-thuchanh-kthp/duyet-cauhoi-thuchanh-kthp.component';
import { DuyetThuongxuyenTuluanComponent } from '../duyet-thuongxuyen-tuluan/duyet-thuongxuyen-tuluan.component';
import { DuyetThuongxuyenDuanComponent } from '../duyet-thuongxuyen-duan/duyet-thuongxuyen-duan.component';
import { key_server } from '@env';
@Component({
    standalone: true,
    imports: [
        CommonModule,
        SharedModule,
        TabViewModule,
        PaginatorModule,
        MatMenuModule,
        PanelModule,
        MatListModule,
        KetquaDuyetAllComponent,
        KetQuaThamDinhComponent,
        DuyetCauhoiComponent,
        DuyetCauhoiThuchanhKthpComponent,
        DuyetThuongxuyenTuluanComponent,
        DuyetThuongxuyenDuanComponent
    ],
    selector: 'app-quanly-duyetnoidung-hoctap-v2',
    templateUrl: './quanly-duyetnoidung-hoctap-v2.component.html',
    styleUrls: ['./quanly-duyetnoidung-hoctap-v2.component.css'],
})
export class QuanlyDuyetnoidungHoctapV2Component implements OnInit, OnDestroy {
    @ViewChild('paginator', { static: true }) paginator: Paginator;

    @ViewChild('filesLessonReview') filesLessonReview: ElementRef;

    userId: number;

    donviId: number;

    isManager = false;

    EXAMFORMAT = EXAMFORMAT;

    CHUAN_DAU_RA = CHUAN_DAU_RA;

    dmKhoahoc: ElnKhoaHoc[];

    objectFilter = {};

    totalCourse = 0;

    searchCourse: string;

    limitCourse = 20;

    list_plan: CoursePlanActivities[];

    list_activity_cdr: CoursePlanActivities[];

    list_activity_other: CoursePlanActivities[];

    list_donvi_chuyenmon: DonVi[];

    courseSelected: ElnKhoaHoc;

    list_group_week: CoursePlanActivities[];

    label_parent_kehoach: string = 'Bài';

    list_thanhvien: CourseThanhvien[];

    thanhvien_: CourseThanhvien[] = [];

    selectedPlan: CoursePlanActivities;

    activeIndex = 0;

    my_course: 'my_course' | 'my_council' | 'show_all' = 'show_all';

    kd_hoidong: boolean = false;

    kd_uyvien: boolean = false;

    selectedComment: CoursePlanComment;

    isLanhDaoKhoa: boolean = false;

    isLanhDaoBomon: boolean = false;

    user_profile: ElngUserProfile;

    selectedFileReview: OvicDocument;

    categoryFilter: number;

    closeLeft = false;

    list_plan_kynang: CoursePlanActivities[];

    rejectRole: boolean = false;

    key_server = key_server;

    hinh_thuc_thi: string;
    constructor(
        private helperService: HelperService,
        private modalService: NgbModal,
        private elnKhoaHocService: ElnKhoaHocService,
        private userService: UserService,
        private auth: AuthService,
        private fileService: FileService,
        private noitifi: NotificationService,
        private courseThanhvienService: CourseThanhvienService,
        private coursePlanActivitiesService: CoursePlanActivitiesService,
        private coursePlanCommentService: CoursePlanCommentService,
        private configsService: ConfigsService,
        private ovicDateTimeService: OvicDateTimeService,
        private elngUserProfileService: ElngUserProfileService,
        private donViService: DonViService,
        private coursePlanActivityTuluanService: CoursePlanActivityTuluanService
    ) {
        this.userId = this.auth.user.id;
        this.donviId = this.auth.user.donvi_id;
        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin) || this.auth.userHasRole(ROLES.chuyenvien_pdt) ? true : false;
        this.isLanhDaoKhoa = this.auth.userHasRole(ROLES.lanhdaokhoa);
        this.isLanhDaoBomon = this.auth.userHasRole(ROLES.lanhdaobomon);
        this.rejectRole = this.auth.userHasRole(ROLES.chuyenvien_pdt) || this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.lanhdaokhoa) || this.auth.userHasRole(ROLES.lanhdaobomon) ? true : false;
    }

    ngOnDestroy(): void { }

    ngOnInit(): void {
        this.noitifi.isProcessing(true);
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

            set: [{ label: 'limit', value: '-1' }],

            page: null,
        };

        forkJoin([
            this.configsService.getConfigsByPageNew(condition_config),
            this.elngUserProfileService.getUserProfileByPageNewV2(condition_profile),
            this.donViService.getDonviByPageNew(condition_donvi),
        ]).subscribe({
            next: ([_config, _userProfile, _donvi]) => {
                this.list_donvi_chuyenmon = _donvi.data;

                if (_config.recordsFiltered) {
                    this.label_parent_kehoach =
                        _config.data[0].params.plan.prefix;
                }

                if (_userProfile.recordsFiltered) {
                    this.user_profile = _userProfile.data[0];
                    if (!this.isManager)
                        this.categoryFilter =
                            this.user_profile.donvi_chuyenmon_id;
                }

                this.loadPageData_hoidong(0);
            },
            error: () => {
                this.noitifi.isProcessing(false);
                this.noitifi.toastError('Lỗi kết nối, vui lòng thử lại');
            },
        });
    }

    loadPageData_hoidong(start) {
        this.noitifi.isProcessing(true);
        this.activeIndex = 0;
        this.selectedPlan = null;
        this.courseSelected = null;
        this.list_activity_cdr = null;
        this.list_plan = null;
        const arrayCondition = [
            {
                conditionName: 'status',
                condition: OvicQueryCondition.notEqual,
                value: '-1',
                orWhere: 'and',
            },
        ];

        if (this.categoryFilter && (this.isLanhDaoBomon || this.isLanhDaoKhoa || this.isManager) && this.my_course === 'show_all') {
            arrayCondition.push({ conditionName: 'category_ids', condition: OvicQueryCondition.equal, value: this.categoryFilter.toString(), orWhere: 'and' });
        }

        if (this.isLanhDaoBomon && this.user_profile && !this.isLanhDaoKhoa && !this.isManager && this.my_course === "show_all") {
            arrayCondition.push({ conditionName: 'nganh_bomon_id', condition: OvicQueryCondition.equal, value: this.user_profile.bomon_id.toString(), orWhere: 'and' });
        }

        if (this.searchCourse) {
            arrayCondition.push({ conditionName: 'title', condition: OvicQueryCondition.like, value: '%' + this.searchCourse.toString() + '%', orWhere: 'and' });
        }

        if (this.my_course === 'my_course') {
            arrayCondition.push({ conditionName: 'creator_plan_id', condition: OvicQueryCondition.equal, value: this.userId.toString(), orWhere: 'and' });
        }

        let setCondition = [];

        setCondition.push({ label: 'orderby', value: 'title' });

        const condition_thanhvien: ConditionOption = {
            condition: [],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'groupby', value: 'course_id' },
            ],
            page: null,
        };

        condition_thanhvien.condition.push({ conditionName: 'user_id', condition: OvicQueryCondition.equal, value: this.auth.user.id.toString(), });

        this.courseThanhvienService.getCourseThanhvienByPageNew(condition_thanhvien).pipe(
            mergeMap((_res) => {
                if ((this.isManager || this.isLanhDaoKhoa || this.isLanhDaoBomon || this.my_course === 'my_course') && this.my_course !== 'my_council') {
                    return this.elnKhoaHocService.getKhoaHocByPageNew(arrayCondition, start, setCondition).pipe(
                        mergeMap((a) => {
                            return of(a);
                        })
                    );
                } else {

                    const course_ids = [];

                    _res.data.forEach((f) => {
                        course_ids.push(f.course_id);
                    });

                    if (course_ids.length) {
                        if ((!this.isManager && !this.isLanhDaoKhoa && !this.isLanhDaoBomon) || this.my_course === 'my_council') {

                            setCondition = [
                                { label: 'include', value: course_ids.toString() },
                                { label: 'include_by', value: 'id' },
                            ];
                        }

                        return this.elnKhoaHocService.getKhoaHocByPageNew(arrayCondition, start, setCondition).pipe(
                            mergeMap((a) => {
                                return of(a);
                            })
                        );
                    }
                }
                return of(null);
            })
        ).subscribe({
            next: (_resCourse) => {
                if (_resCourse) {
                    let teacher_ids = [0];
                    _resCourse.data.forEach((f, key) => {
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
                                const index = CHUAN_DAU_RA.findIndex(
                                    (m) => m.id === f.params.cdr
                                );
                                if (index !== -1) {
                                    f['chuandaura'] =
                                        CHUAN_DAU_RA[index].label;
                                }
                            }
                        }
                    });

                    teacher_ids = [...new Set(teacher_ids)];

                    const condition_teacher: ConditionOption = {
                        condition: [],

                        set: [
                            { label: 'limit', value: '-1' },
                            {
                                label: 'include',
                                value: teacher_ids.toString(),
                            },
                            { label: 'include_by', value: 'id' },
                        ],

                        page: null,
                    };

                    this.dmKhoahoc = _resCourse.data;

                    this.userService
                        .getUserByPageNew(condition_teacher)
                        .subscribe({
                            next: (_user) => {
                                this.dmKhoahoc.forEach((f) => {
                                    const index_creator =
                                        _user.data.findIndex(
                                            (m) =>
                                                m.id === f.creator_plan_id
                                        );
                                    f['creator_name'] =
                                        'Chưa có giảng viên';
                                    f['display_name'] =
                                        'Chưa có giảng viên';
                                    if (index_creator !== -1) {
                                        f['creator_name'] = ''.concat(
                                            _user.data[index_creator]
                                                .display_name
                                        );
                                        f['display_name'] =
                                            _user.data[
                                                index_creator
                                            ].display_name;
                                    }

                                    f['info_'] = '';

                                    if (f.params) {
                                        const sotinchi = f.params.sotinchi
                                            ? f.params.sotinchi
                                            : 0;
                                        const sotinchi_th = f.params[
                                            'sotinchi_th'
                                        ]
                                            ? f.params['sotinchi_th']
                                            : 0;
                                        const index_m =
                                            EXAMFORMAT.findIndex(
                                                (m) =>
                                                    m.key ===
                                                    f.params.exam_format
                                            );
                                        let exam = 'Chưa có thông tin';

                                        if (index_m !== -1) {
                                            exam =
                                                EXAMFORMAT[index_m].label;
                                        }

                                        f['info_'] =
                                            ' - TC: ' +
                                            sotinchi
                                                .toString()
                                                .concat(
                                                    '-',
                                                    sotinchi_th.toString(),
                                                    ' - ',
                                                    f['hinhthucthi']
                                                );
                                    }
                                });
                            },

                            error: () => { },
                        });

                    if (this.dmKhoahoc.length) {
                        this.courseSelected = this.dmKhoahoc[0];
                        this.onLoadPlan(this.courseSelected);
                    }

                    this.totalCourse = _resCourse.recordsFiltered;

                    this.noitifi.isProcessing(false);
                } else {
                    this.totalCourse = 0;
                    this.dmKhoahoc = [];
                    this.noitifi.isProcessing(false);
                }
            },
            error: () => {
                this.noitifi.isProcessing(false);
                this.noitifi.toastError('Lỗi kết nối, vui lòng thử lại');
            },
        });
    }

    changePage(event) {
        this.loadPageData_hoidong(event.page + 1);
    }

    onSearchByTitle() {
        if (!this.paginator.empty()) {
            this.paginator.changePage(0);
        } else {
            this.loadPageData_hoidong(1);
        }
    }

    onSelectCourse(event: MatSelectionListChange) {
        this.courseSelected = event.options[0].value;
        this.onLoadPlan(this.courseSelected);
    }

    onLoadPlan(course: ElnKhoaHoc) {
        this.noitifi.isProcessing(true);
        this.activeIndex = 0;
        const condition_plan: ConditionOption = {
            condition: [
                {
                    conditionName: 'course_id',
                    condition: OvicQueryCondition.equal,
                    value: course.id.toString(),
                },
                // {
                //     conditionName: 'parent_id',
                //     condition: OvicQueryCondition.equal,
                //     value: '0',
                //     orWhere: 'and',
                // },
                {
                    conditionName: 'week',
                    condition: OvicQueryCondition.notEqual,
                    value: '0',
                    orWhere: 'and',
                },
                // {
                //     conditionName: 'type',
                //     condition: OvicQueryCondition.notEqual,
                //     value: 'ACTIVITY_T',
                //     orWhere: 'and',
                // },
                // {
                //     conditionName: 'week',
                //     condition: OvicQueryCondition.notEqual,
                //     value: '100',
                //     orWhere: 'and',
                // },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'week' },
            ],
            page: null,
        };

        const condition_thanhvien: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: course.id.toString(), orWhere: 'and' },
                { conditionName: 'cap_hoidong', condition: OvicQueryCondition.equal, value: 'cap_khoa', orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'vaitro' },
            ],
            page: null,
        };

        forkJoin([
            this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_plan),
            this.courseThanhvienService.getCourseThanhvienByPageNew(condition_thanhvien).pipe(
                mergeMap((_thanhvien) => {
                    this.kd_hoidong = _thanhvien.data.findIndex((m) => m.user_id === this.userId && m.vaitro === 'CHUTICH') !== -1 ? true : false;
                    this.kd_uyvien = _thanhvien.data.findIndex((m) => m.user_id === this.userId && m.vaitro === 'UYVIEN') !== -1 ? true : false;
                    const user_ids = [];

                    _thanhvien.data.forEach((f) => {
                        user_ids.push(f.user_id);
                    });

                    if (user_ids.length) {
                        const condition_user: ConditionOption = {
                            condition: [],
                            set: [
                                { label: 'limit', value: '-1' },
                                { label: 'include', value: user_ids.toString() },
                                { label: 'include_by', value: 'id' },
                            ],

                            page: null,
                        };

                        return this.userService.getUserByPageNew(condition_user).pipe(
                            mergeMap((_user) => {
                                _thanhvien.data.forEach((f) => {
                                    const index = _user.data.findIndex((m) => m.id === f.user_id);
                                    if (index !== -1) {
                                        f['display_name'] = _user.data[index].display_name;
                                    }
                                });

                                return of(_thanhvien);
                            })
                        );
                    }
                    return of(_thanhvien);
                })
            ),
        ]).subscribe({
            next: ([_plan_activity, _thanhvien]) => {

                const _plan_parent = _plan_activity.data.filter(m => m.parent_id === 0);

                const first: CoursePlanActivities = {
                    id: 0,
                    course_id: course.id,
                    week: 0,
                    title: 'Tất cả',
                    desc: '',
                    video: undefined,
                    files: [],
                    ordering: 0,
                    status: 0,
                    course_lesson_id: 0,
                    parent_id: 0,
                    type: 'PLAN',
                    desc_title: '',
                    edit: 0,
                    slides: [],
                };

                const index = _plan_parent.findIndex(m => m.week === 100);

                const index_duan = _plan_parent.findIndex(m => m.week === 1000);

                if (index_duan !== -1 && this.courseSelected && this.courseSelected.params && this.courseSelected.params.exam_format === 'DUAN') {
                    const th_in_da: CoursePlanActivities = { ..._plan_parent[index_duan] };
                    th_in_da.key = th_in_da.id;
                    th_in_da.id = -2;

                    if (_plan_activity.data.filter(m => m.type === 'THUONGXUYEN_TULUAN').length > 0) {
                        _plan_parent.splice(index_duan + 1, 0, th_in_da);
                    } else {
                        _plan_parent.splice(index_duan, 1, th_in_da);
                    }

                }



                const last: CoursePlanActivities = {
                    id: -1,
                    course_id: course.id,
                    week: 100,
                    title: 'KTHP',
                    desc: '',
                    video: undefined,
                    files: [],
                    ordering: 0,
                    status: 0,
                    course_lesson_id: 0,
                    parent_id: 0,
                    type: 'PLAN',
                    desc_title: '',
                    edit: 0,
                    slides: [],
                    tnKTHP: index !== -1 ? _plan_parent[index] : null
                }
                // const lastLock: CoursePlanActivities = {
                //     id: -2,
                //     course_id: course.id,
                //     week: 0,
                //     title: 'pi pi-lock',
                //     desc: '',
                //     video: undefined,
                //     files: [],
                //     ordering: 0,
                //     status: 0,
                //     course_lesson_id: 0,
                //     parent_id: 0,
                //     type: 'PLAN',
                //     desc_title: '',
                //     edit: 0,
                //     slides: [],
                //     tnKTHP: index !== -2 ? _plan_activity.data[index] : null
                // }

                if (index !== -1) {
                    _plan_parent.splice(index, 1)
                }



                _plan_parent.splice(0, 0, first);

                _plan_parent.push(last);
                // _plan_activity.data.push(lastLock);

                this.list_plan = this.helperService.sort(_plan_parent, 'stt');

                this.list_thanhvien = _thanhvien.data;

                if (this.list_plan.length) {
                    this.selectedPlan = first;
                }

                this.noitifi.isProcessing(false);
            },
            error: () => {
                this.noitifi.isProcessing(false);
                this.noitifi.toastError('Lỗi kết nối vui lòng thử lại');
            },
        });
    }

    onSelecPlan(event: MatSelectionListChange) {
        // console.log(event);
        this.selectedPlan = null;
        this.selectedPlan = event.options[0].value;
        this.activeIndex = 0;
        switch (this.selectedPlan.week) {
            case 1000:
                // this.loadKynangTuluan( this.selectedPlan );
                break;
            // case 100:
            //     break;
            default:
                this.onChangeTapView();
                break;
        }
    }



    onChangeTapView() {
        switch (this.activeIndex) {
            case 0:
                break;
            case 1:
                this.onloadActivityCdr(this.selectedPlan, this.courseSelected);
                break;
            case 2:
                this.loadOther(this.selectedPlan, this.courseSelected);
                break;
        }
    }

    onloadActivityCdr(plan: CoursePlanActivities, course: ElnKhoaHoc) {
        this.list_activity_cdr = [];
        this.noitifi.isProcessing(true);

        const condition_cdr: ConditionOption = {
            condition: [
                {
                    conditionName: 'course_id',
                    condition: OvicQueryCondition.equal,
                    value: course.id.toString(),
                },
                {
                    conditionName: 'type',
                    condition: OvicQueryCondition.equal,
                    value: 'ACTIVITY_CDR',
                    orWhere: 'and',
                },
                {
                    conditionName: 'status',
                    condition: OvicQueryCondition.notEqual,
                    value: '-3',
                    orWhere: 'and',
                },
            ],
            set: [{ label: 'limit', value: '-1' }],
            page: null,
        };

        if (plan.id !== 0) {
            condition_cdr.condition.push({
                conditionName: 'parent_id',
                condition: OvicQueryCondition.equal,
                value: plan.id.toString(),
                orWhere: 'and',
            });
        }

        this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_cdr).pipe(
            mergeMap((_plan_activty) => {
                let _plan_activity_ids = [];

                _plan_activty.data.forEach((f) => {
                    _plan_activity_ids.push(f.id);
                    _plan_activity_ids.push(f.course_plan_activity_id);
                });

                _plan_activity_ids = [...new Set(_plan_activity_ids)];

                if (_plan_activity_ids.length) {
                    const condition_comment: ConditionOption = {
                        condition: [
                            {
                                conditionName: 'course_id',
                                condition: OvicQueryCondition.equal,
                                value: course.id.toString(),
                            },
                            {
                                conditionName: 'parent_id',
                                condition: OvicQueryCondition.equal,
                                value: '0',
                                orWhere: 'and',
                            },
                        ],

                        set: [
                            { label: 'limit', value: '-1' },
                            {
                                label: 'include',
                                value: _plan_activity_ids.toString(),
                            },
                            {
                                label: 'include_by',
                                value: 'course_plan_activity_id',
                            },
                            { label: 'with', value: 'user' }
                        ],

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
                            {
                                label: 'include',
                                value: _plan_activity_ids.toString(),
                            },
                            {
                                label: 'include_by',
                                value: 'course_plan_activity_id',
                            },
                        ],
                        page: null,
                    };

                    return forkJoin([
                        this.coursePlanCommentService.getCoursePlanCommentByPageNew(
                            condition_comment
                        ),
                        this.coursePlanCommentService.getCoursePlanCommentByPageNew(
                            condition_reply_comment
                        ),
                    ]).pipe(
                        mergeMap(([_comment, _comment_child]) => {
                            _comment.data.forEach((f) => {
                                // const index = this.list_thanhvien.findIndex( ( m ) => m.user_id === f.user_id );

                                // if ( index !== -1 ) {
                                //     f[ 'display_name' ] = this.list_thanhvien[ index ][ 'display_name' ];
                                // }
                                f['display_name'] = f.user ? f.user.display_name : 'Không xác định';

                                f['reply_open'] = false;

                                f['textarea_comment'] = '';
                            });

                            _plan_activty.data.forEach((f) => {
                                const comments = _comment.data.filter((m) => m.course_plan_activity_id === f.id || m.course_plan_activity_id === f.course_plan_activity_id);

                                const object_comment = {};

                                comments.forEach((c) => {
                                    const count_reply = _comment_child.data.filter((m) => m.parent_id === c.id).length;

                                    c['count_reply'] = count_reply;

                                    if (!object_comment[c.user_id]) {
                                        object_comment[c.user_id] = { cap_khoa: [], cap_truong: [], display_name: c['display_name'] };
                                        object_comment[c.user_id][c.cap_hoidong].push(c);
                                    } else {
                                        object_comment[c.user_id][c.cap_hoidong].push(c);
                                    }
                                });

                                f['comments'] = [];

                                let j = 0;
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

                                    if (object_comment[o]['cap_khoa'] && object_comment[o]['cap_khoa'].length) {
                                        f['comments'].push({ user_id: Number(o), display_name: display_name, cap_hoidong: 'cap_khoa', children: object_comment[o]['cap_khoa'] });
                                    }

                                    if (object_comment[o]['cap_truong'] && object_comment[o]['cap_truong'].length) {
                                        j = j + 1;
                                        f['comments'].push({ user_id: Number(o), display_name: this.isManager ? display_name.concat(" (Cấp trường)") : 'Ủy viên trường '.concat((j).toString()), cap_hoidong: 'cap_truong', children: object_comment[o]['cap_truong'] });
                                    }
                                }
                                );

                                f['textarea_comment'] = '';
                            });

                            return of(_plan_activty);
                        })
                    );
                }

                return of(_plan_activty);
            })
        )
            .subscribe((_plan_activity) => {
                _plan_activity.data.forEach((f) => {
                    f['stt'] = f.kyhieu.replace(/\D/g, '');
                    f['expandView'] = f['status'] === 1 ? false : true
                });
                this.noitifi.isProcessing(false);
                this.list_activity_cdr = this.helperService.sort(
                    _plan_activity.data,
                    'stt'
                );
            });
    }

    openReply(comment: CoursePlanComment, index_comment: number) {
        comment['reply_open'] = !comment['reply_open'];
        this.selectedComment = comment;
        if (comment['reply_open'] === true) {
            this.loadReplyComment(this.selectedComment, index_comment);
        }
    }

    loadReplyComment(comment: CoursePlanComment, index_comment) {
        const condition_comment: ConditionOption = {
            condition: [
                {
                    conditionName: 'parent_id',
                    condition: OvicQueryCondition.equal,
                    value: comment.id.toString(),
                },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'with', value: 'user' }
            ],
            page: null,
        };

        this.coursePlanCommentService.getCoursePlanCommentByPageNew(condition_comment).subscribe({
            next: (_comment) => {
                _comment.data.forEach((f) => {
                    if (f.cap_hoidong === 'cap_truong') {
                        if (this.isManager) {
                            f['display_name'] = f.user ? f.user.display_name.concat(' (Cấp trường)') : 'Uỷ viên (Cấp trường)';
                        } else if (comment.user_id === f.user_id) {
                            f['display_name'] = 'Ủy viên cấp trường '.concat((index_comment + 1).toString());
                        } else {
                            f['display_name'] = 'Ủy viên cấp trường';
                        }
                    } else if (f.user_id === this.courseSelected.creator_plan_id && this.userId !== f.user_id) {
                        f['display_name'] = this.courseSelected['display_name'];
                    } else if (f.user_id === this.userId) {
                        f['display_name'] = 'Phản hồi của bạn';
                        f['my_reply_comment'] = true;
                    } else {
                        if (this.kd_hoidong || this.isManager || this.isLanhDaoKhoa || this.isLanhDaoBomon) {
                            const index = this.list_thanhvien.findIndex((m) => m.user_id === f.user_id);
                            f['display_name'] = this.list_thanhvien[index]['display_name'];
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
                this.noitifi.toastError('Lỗi kết nôi, vui lòng thử lại');
            },
        });
    }

    saveCommentReply(
        comment: CoursePlanComment,
        activity: CoursePlanActivities,
        index_comment: number
    ) {
        const comment_content = comment['textarea_comment']
            ? comment['textarea_comment'].trim()
            : comment['textarea_comment'].trim();

        if (comment_content && comment_content !== '') {
            const data_comment: CoursePlanComment = {
                course_plan_activity_id: activity.id,
                comment: comment_content,
                status: 0,
                user_id: this.userId,
                course_id: this.courseSelected.id,
                parent_id: comment.id,
            };

            this.coursePlanCommentService
                .addCoursePlanComment(data_comment)
                .subscribe({
                    next: () => {
                        this.noitifi.toastSuccess('Đã gửi phản hồi thành công');
                        comment['textarea_comment'] = '';
                        this.loadReplyComment(
                            this.selectedComment,
                            index_comment
                        );
                    },
                    error: () => {
                        this.noitifi.toastError(
                            'Lỗi kết nối, vui lòng thử lại'
                        );
                    },
                });
        } else {
            this.noitifi.toastWarning('Vui lòng nhập phản hồi trước khi gửi');
        }
    }

    saveComment(status, activity: CoursePlanActivities) {
        const noidung = activity['textarea_comment']
            ? activity['textarea_comment'].trim()
            : activity['textarea_comment'];
        if (noidung) {
            this.noitifi
                .confirm(
                    status === -1
                        ? 'Thầy / Cô có chắc chắn yêu cầu sửa'
                        : 'Thầy / Cô có chắc chắn đồng ý duyệt',
                    'Xác nhận hành động',
                    [BUTTON_YES, BUTTON_NO]
                )
                .then((a) => {
                    if (a.name === 'yes') {
                        const data: CoursePlanComment = {
                            course_plan_activity_id: activity.id,
                            comment: noidung,
                            status: status,
                            user_id: this.auth.user.id,
                            course_id: this.courseSelected.id,
                            parent_id: 0,
                        };

                        this.coursePlanCommentService
                            .addCoursePlanComment(data)
                            .subscribe({
                                next: () => {
                                    this.noitifi.toastSuccess(
                                        'Cập nhật thành công'
                                    );
                                    switch (this.activeIndex) {
                                        case 1:
                                            this.onloadActivityCdr(
                                                this.selectedPlan,
                                                this.courseSelected
                                            );
                                            break;
                                        case 2:
                                            this.loadOther(
                                                this.selectedPlan,
                                                this.courseSelected
                                            );
                                            break;
                                        default:
                                            break;
                                    }
                                },
                                error: () => {
                                    this.noitifi.toastError(
                                        'Cập nhật thất bại, lỗi kết nối'
                                    );
                                },
                            });
                    }
                });
        } else {
            this.noitifi.toastWarning('Vui lòng nhập nội dung');
        }
    }

    duyetNoidung(activity: CoursePlanActivities, status) {
        const confirm_data =
            status === 1
                ? '<div class="alert-duyetnoidung">' +
                '<span>- Bạn đang thực hiện thao tác duyệt nội dung giảng dạy</span>' +
                '<span>- Chức năng nhận xét cho nội dung giảng dạy sẽ bị đóng</span>' +
                '<span>- Thao tác này không thể hoàn tác</span>' +
                '<span>- Bạn có chắc chắn duyệt nội dung giảng dạy này?</span>' +
                '</div>'
                : '<div class="alert-duyetnoidung">' +
                '<span>- Bạn đang thực hiện thao tác yêu cầu sửa nội dung giảng dạy</span>' +
                '<span>- Chức năng nhận xét cho nội dung giảng dạy sẽ bị đóng</span>' +
                '<span>- Thao tác này không thể hoàn tác</span>' +
                '<span>- Bạn có chắc chắn yêu cầu sửa nội dung giảng dạy này?</span>' +
                '</div>';

        this.noitifi
            .confirm(confirm_data, 'Xác nhận hành động', [
                BUTTON_YES,
                BUTTON_NO,
            ])
            .then((a) => {
                if (a.name === 'yes') {
                    this.noitifi.isProcessing(true);
                    this.ovicDateTimeService
                        .getCurrentDateTime()
                        .pipe(
                            mergeMap((_date) => {
                                return this.coursePlanActivitiesService
                                    .updateCoursePlanActivities(activity.id, {
                                        status: status,
                                        approved_by: this.userId,
                                        approved_at:
                                            this.helperService.stringToDateSql(
                                                _date.toString()
                                            ),
                                    })
                                    .pipe(
                                        mergeMap(() => {
                                            return of(null);
                                        })
                                    );
                            })
                        )
                        .subscribe({
                            next: () => {
                                // this.loadCoursePlan();
                                switch (this.activeIndex) {
                                    case 1:
                                        this.onloadActivityCdr(
                                            this.selectedPlan,
                                            this.courseSelected
                                        );
                                        break;
                                    case 2:
                                        this.loadOther(
                                            this.selectedPlan,
                                            this.courseSelected
                                        );
                                        break;
                                }

                                this.noitifi.isProcessing(false);
                                this.noitifi.toastSuccess(
                                    'Cập nhật thành công'
                                );
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

    onSelectFileReview(file: OvicDocument) {
        this.selectedFileReview = null;
        this.selectedFileReview = file;
        this.modalService.open(this.filesLessonReview, LARGE_MODAL_OPTIONS);
    }

    loadOther(plan: CoursePlanActivities, course: ElnKhoaHoc) {
        this.noitifi.isProcessing(true);
        this.list_activity_other = [];
        const condition_cdr: ConditionOption = {
            condition: [
                {
                    conditionName: 'course_id',
                    condition: OvicQueryCondition.equal,
                    value: course.id.toString(),
                },
                {
                    conditionName: 'type',
                    condition: OvicQueryCondition.notEqual,
                    value: 'ACTIVITY_CDR',
                    orWhere: 'and',
                },
                {
                    conditionName: 'status',
                    condition: OvicQueryCondition.notEqual,
                    value: '-3',
                    orWhere: 'and',
                },
                {
                    conditionName: 'type',
                    condition: OvicQueryCondition.notEqual,
                    value: 'MEET',
                    orWhere: 'and',
                },
                {
                    conditionName: 'type',
                    condition: OvicQueryCondition.notEqual,
                    value: 'ACTIVITY_TEST',
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

        if (plan.id !== 0) {
            condition_cdr.condition.push({
                conditionName: 'parent_id',
                condition: OvicQueryCondition.equal,
                value: plan.id.toString(),
                orWhere: 'and',
            });
        }

        this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_cdr).pipe(
            mergeMap((_plan_activty) => {
                let _plan_activity_ids = [];

                _plan_activty.data.forEach((f) => {
                    _plan_activity_ids.push(f.id);
                    _plan_activity_ids.push(f.course_plan_activity_id);
                    f['expandView'] = f.status === 1 ? false : true
                });

                _plan_activity_ids = [...new Set(_plan_activity_ids)];

                if (_plan_activity_ids.length) {
                    const condition_comment: ConditionOption = {
                        condition: [
                            {
                                conditionName: 'course_id',
                                condition: OvicQueryCondition.equal,
                                value: course.id.toString(),
                            },
                            {
                                conditionName: 'parent_id',
                                condition: OvicQueryCondition.equal,
                                value: '0',
                                orWhere: 'and',
                            },
                        ],

                        set: [
                            { label: 'limit', value: '-1' },
                            {
                                label: 'include',
                                value: _plan_activity_ids.toString(),
                            },
                            {
                                label: 'include_by',
                                value: 'course_plan_activity_id',
                            },
                            { label: 'with', value: 'user' }
                        ],

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
                            {
                                label: 'include',
                                value: _plan_activity_ids.toString(),
                            },
                            {
                                label: 'include_by',
                                value: 'course_plan_activity_id',
                            },
                        ],
                        page: null,
                    };

                    return forkJoin([
                        this.coursePlanCommentService.getCoursePlanCommentByPageNew(
                            condition_comment
                        ),
                        this.coursePlanCommentService.getCoursePlanCommentByPageNew(
                            condition_reply_comment
                        ),
                    ]).pipe(
                        mergeMap(([_comment, _comment_child]) => {
                            _comment.data.forEach((f) => {

                                f['display_name'] = f.user ? f.user.display_name : 'Không xác định';

                                f['reply_open'] = false;

                                f['textarea_comment'] = '';
                            });

                            _plan_activty.data.forEach((f) => {
                                const comments = _comment.data.filter((m) => m.course_plan_activity_id === f.id || m.course_plan_activity_id === f.course_plan_activity_id
                                );

                                const object_comment = {};

                                comments.forEach((c) => {
                                    const count_reply = _comment_child.data.filter((m) => m.parent_id === c.id).length;

                                    c['count_reply'] = count_reply;

                                    if (!object_comment[c.user_id]) {
                                        object_comment[c.user_id] = { cap_khoa: [], cap_truong: [], display_name: c['display_name'] };
                                        object_comment[c.user_id][c.cap_hoidong].push(c);
                                    } else {
                                        object_comment[c.user_id][c.cap_hoidong].push(c);
                                    }
                                });

                                f['comments'] = [];

                                let j = 0;

                                Object.keys(object_comment).forEach((o, key) => {
                                    let display_name = 'Ủy viên '.concat((key + 1).toString());
                                    if (this.kd_hoidong || this.isLanhDaoKhoa || this.isManager || this.isLanhDaoBomon) {
                                        if (o.toString() === this.userId.toString()) {
                                            display_name = 'Nhận xét của bạn';
                                        } else {
                                            display_name = object_comment[o] ? object_comment[o].display_name : 'Không xác định';
                                        }
                                    } else if (o.toString() === this.userId.toString()) {
                                        display_name = object_comment[o] ? object_comment[o]['display_name'] : 'Không xác định';
                                    }

                                    if (object_comment[o]['cap_khoa'] && object_comment[o]['cap_khoa'].length) {
                                        f['comments'].push({ user_id: Number(o), display_name: display_name, cap_hoidong: 'cap_khoa', children: object_comment[o]['cap_khoa'] });
                                    }

                                    if (object_comment[o]['cap_truong'] && object_comment[o]['cap_truong'].length) {
                                        j = j + 1;
                                        f['comments'].push({ user_id: Number(o), display_name: this.isManager ? display_name.concat(" (Cấp trường)") : 'Ủy viên trường '.concat((j).toString()), cap_hoidong: 'cap_truong', children: object_comment[o]['cap_truong'] });
                                    }
                                });

                                f['textarea_comment'] = '';
                            });

                            return of(_plan_activty);
                        })
                    );
                }

                return of(_plan_activty);
            })
        )
            .subscribe((_plan_activity) => {
                this.noitifi.isProcessing(false);
                this.list_activity_other = _plan_activity.data;
            });
    }

    changeToMyCourse(name: 'my_course' | 'my_council' | 'show_all') {
        this.my_course = name;
        this.onSearchByTitle();
    }

    onChangeFilterChuyenmon(event) {
        if (event) {
            this.categoryFilter = event.id;
        } else {
            this.categoryFilter = null;
        }
        this.onSearchByTitle();
    }

    closeLeftBody() {
        this.closeLeft = !this.closeLeft;
    }

    huyTrangThai(activity) {
        this.noitifi
            .confirm(
                '<div class="alert-duyetnoidung">' +
                '<span>- Bạn đang thực hiện thao tác đưa nội dung về trạng thái chờ duyệt</span>' +
                '<span>- Bạn có chắc chắn thực hiện thao tác này?</span>' +
                '</div>',
                'Xác nhận hành động',
                [BUTTON_YES, BUTTON_NO]
            )
            .then((a) => {
                if (a.name === 'yes') {
                    this.noitifi.isProcessing(true);
                    this.ovicDateTimeService
                        .getCurrentDateTime()
                        .pipe(
                            mergeMap((_date) => {
                                return this.coursePlanActivitiesService
                                    .updateCoursePlanActivities(activity.id, {
                                        status: 0,
                                        approved_by: this.userId,
                                        approved_at:
                                            this.helperService.stringToDateSql(
                                                _date.toString()
                                            ),
                                    })
                                    .pipe(
                                        mergeMap(() => {
                                            return of(null);
                                        })
                                    );
                            })
                        )
                        .subscribe({
                            next: () => {
                                switch (this.activeIndex) {
                                    case 1:
                                        this.onloadActivityCdr(
                                            this.selectedPlan,
                                            this.courseSelected
                                        );
                                        break;
                                    case 2:
                                        this.loadOther(
                                            this.selectedPlan,
                                            this.courseSelected
                                        );
                                        break;
                                }
                                this.noitifi.isProcessing(false);
                                this.noitifi.toastSuccess(
                                    'Cập nhật thành công'
                                );
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

    actionViewComment(activity: CoursePlanActivities) {
        activity['expandView'] = !activity['expandView'];
    }
}
