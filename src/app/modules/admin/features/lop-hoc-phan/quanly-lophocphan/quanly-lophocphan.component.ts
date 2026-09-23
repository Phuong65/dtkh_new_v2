import { CommonModule } from '@angular/common';
import {
    Component,
    OnInit,
    ViewChild,
    ElementRef,
    OnDestroy,
    Injectable,
    TemplateRef,
    AfterViewInit,
} from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { HelperService } from '@core/services/helper.service';
import { ClassesService } from '@shared/services/classes.service';
import { ElnKhoaHocService } from '@shared/services/elearning-khoa-hoc.service';
import { ElnChuyenMucService } from '@shared/services/elearning-chuyen-muc.service';
import { UserService } from '@core/services/user.service';
import {
    MAXIMIZE_MODAL_OPTIONS,
    GENDER,
    SM_MODAL_OPTIONS,
    NORMAL_MODAL_OPTIONS,
    LARGE_MODAL_OPTIONS,
    LESSON_KEY_LOG,
    ROLES,
} from '@shared/utils/syscat';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Classes } from '@shared/models/classes';
import { ElnKhoaHoc } from '@shared/models/elng-khoa-hoc';
import { User } from '@core/models/user';
import { forkJoin, Observable, of, Subscription } from 'rxjs';
import {
    OvicFlexibleColumn,
    OvicFlexibleTopbarRight,
    OvicMenu,
} from '@shared/models/ovic-flexible-table';
import { OvicQueryCondition } from '@core/models/dto';
import {
    ActivatedRoute,
    ActivationEnd,
    NavigationEnd,
    Router,
    RouterModule,
    RoutesRecognized,
} from '@angular/router';
import {
    distinctUntilChanged,
    filter,
    last,
    map,
    mergeMap,
    throttleTime,
} from 'rxjs/operators';
import { DomSanitizer } from '@angular/platform-browser';
import { FileService } from '@core/services/file.service';
import { OvicMeetingService } from '@shared/services/ovic-meeting.service';
import { SelectItemGroup } from 'primeng/api';
import * as XLSX from 'xlsx';
import { ClassStudentService } from '@shared/services/class-student.service';
import { ElngUserProfileService } from '@shared/services/elearning-user-profile.service';

import * as fs from 'file-saver';
import { ExportExcelService } from '@shared/services/export-excel.service';

import { ClassHomeworkPostService } from '@shared/services/class-homework-post.service';
import { MenuItem } from 'primeng/api';
import { saveAs } from 'file-saver';
import { UserMetaService } from '@shared/services/user-meta.service';
import { NotificationService } from '@core/services/notification.service';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { Paginator, PaginatorModule } from 'primeng/paginator';
import { DonViService } from '@modules/shared/services/don-vi.service';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { ElngUserProfile } from '@shared/models/elng-user-profile';
import { DonVi } from '@modules/shared/models/don-vi';
import { ElnChuyenMuc } from '@modules/shared/models/Elng';
import { getLinkDownload_aws } from '@env';
import { ActivityLogService } from '@modules/shared/services/activity_log.service';
import { ElnBaiHocService } from '@modules/shared/services/elearning-bai-hoc.service';
import { ReportStudentActivityService } from '@modules/shared/services/report-activity.service';
import { RoleService } from '@core/services/role.service';
import { Role } from '@core/models/role';
import { SharedModule } from '@modules/shared/shared.module';
import { TableModule } from 'primeng/table';
import { ProgressBarModule } from 'primeng/progressbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { TabViewModule } from 'primeng/tabview';
import { CheckboxModule } from 'primeng/checkbox';
import { MatButtonModule } from '@angular/material/button';
@Component({
    selector: 'app-quanly-lophocphan',
    standalone: true,
    imports: [
        CommonModule,
        SharedModule,
        TableModule,
        ProgressBarModule,
        ReactiveFormsModule,
        FormsModule,
        PaginatorModule,
        MatMenuModule,
        MatIconModule,
        TabViewModule,
        CheckboxModule,
        RouterModule,
        MatButtonModule
    ],
    templateUrl: './quanly-lophocphan.component.html',
    styleUrls: ['./quanly-lophocphan.component.css']
})

export class QuanlyLophocphanComponent implements OnInit, OnDestroy {
    @ViewChild('createInllusionClass') createInllusionClass: ElementRef;
    @ViewChild('createPointClass') createPointClass: ElementRef;
    @ViewChild('createClass') createClass: TemplateRef<any>;
    @ViewChild('inputImport') inputImport: ElementRef;
    @ViewChild('templateChooseExcel') templateChooseExcel: ElementRef;
    @ViewChild('paginator') paginator: Paginator;
    // @ViewChild('calendar') calendar: FullCalendarComponent;
    @ViewChild('templateDuplicateStudent') templateDuplicateStudent: ElementRef;
    //@ViewChild ( 'studentPointForm' ) studentPointForm : ElementRef;

    // tooltip: Tooltip;
    reloadPage = false;
    // default_Zoom = DEFAULT_ZOOM;
    isUpdated = false;
    isAdmin = false;
    slugIsValid = true;
    kyhieuIsValid = true;
    classesCurrent: Classes;
    userId: number;
    donviId: number;
    isManager = false;
    indexFocus: number;
    isOpenClass = false;
    classIdQuerryParam: number;
    formTitle: string;
    formClass: FormGroup;
    listClass: Classes[];
    listCategory: ElnChuyenMuc[];
    listCourse: ElnKhoaHoc[] = [];
    listTeacher: User[] = [];
    objectTeacher = {};
    profile: User;
    selectedClass: Classes;
    arrayYear = [];
    selectedYear: string;
    progressValue = 0;
    startProgress = false;
    countProgressValue = 0;
    countCalendar = 0;
    listHocky = [];
    listNamhoc = [];
    objectFilter = {};
    valueImport: any;
    showButtonContinue = true;
    countClass = 0;
    isGrid = false;
    classGridWidth = false;
    // optionsCalendar: CalendarOptions = {};
    cols: OvicFlexibleColumn[];
    duplicateStudent = [];
    noStudentData = [];
    firstColTable: OvicMenu = {
        openState: false,
        cssClass: '',
        elements: [
            {
                hint: 'Xóa thông tin',
                label: '',
                icon: '<i class="pi pi-external-link move-to-class-icon"></i>',
                type: 'handleEvent',
                eventName: 'moveToClass',
                cssClass: 'edit-color',
            },
        ],
    };

    topRightAction: OvicFlexibleTopbarRight[] = [
    ];

    pageIndex = 0;
    limitList = 20;
    isImportClass: string;
    itemSplitButton: MenuItem[];
    isLanhDaoKhoa = false;
    emptyList: string;
    filterOwn = false;
    canAdd = false;
    activeIndex_class: number = 0; // 0 list; 1 grid
    cols_class = [];
    user_profile: ElngUserProfile;
    list_donvi_chuyenmon: DonVi[];
    action_table = [
        {
            label: 'Meet',
            key: 'google_meet',
            icon: '<i class="fa fa-video-camera" ></i>',
            class: 'btn btn-icon btn-success btn-transparent',
        },
        {
            label: 'Sửa',
            key: 'editDataClasses',
            icon: '<i class="fa fa-pencil-square-o" ></i>',
            class: 'btn btn-icon btn-primary btn-transparent',
        },
        {
            label: 'Xóa',
            key: 'requireDelete',
            icon: '<i class="fa fa-trash" ></i>',
            class: 'btn btn-icon btn-danger btn-transparent',
        },
    ];

    selectedClasses: Classes[];

    select_page: number = 0;

    objectRoles = {};

    constructor(
        private helperService: HelperService,
        public formBuilder: FormBuilder,
        private auth: AuthService,
        private classesService: ClassesService,
        private elnKhoaHocService: ElnKhoaHocService,
        private userService: UserService,
        private modalService: NgbModal,
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private ovicMeetingService: OvicMeetingService,
        private elnChuyenMucService: ElnChuyenMucService,
        private fileService: FileService,
        protected sanitizer: DomSanitizer,
        // private classCalendarService: ClassCalendarService,
        private classStudentService: ClassStudentService,
        private elngUserProfileService: ElngUserProfileService,
        private exportExcelService: ExportExcelService,
        private classHomeworkPostService: ClassHomeworkPostService,
        private userMetaService: UserMetaService,
        private noitifi: NotificationService,
        private httpHelper: HttpParamsHeplerService,
        private donViService: DonViService,
        private activityLogService: ActivityLogService,
        private elnBaiHocService: ElnBaiHocService,
        private reportActivityService: ReportStudentActivityService,
        private roleService: RoleService
    ) {
        setTimeout(() => this.noitifi.closeLeftMenu(), 300);
        this.noitifi.closeOvicFlexibleTemplate();
        this.noitifi.closeSideNavigationMenu();
        const url = this.router.url.substring(7).split('?')[0];
        this.canAdd = this.auth.userCanAdd(url);
        this.profile = this.auth.user;
        this.formClass = this.formBuilder.group({
            category_id: ['', Validators.required],
            course_id: ['', Validators.required],
            name: ['', Validators.required],
            slug: [''],
            course_info: [''],
            manager_ids: ['', Validators.required],
            manager_info: [''],
            user_id: [''],
            status: [''],
            // time_start: [''],
            // time_end: [''],
            image: [''],
            kyhieu: ['', Validators.required],
            sotinchi: ['', Validators.required],
            namhoc: ['', Validators.required],
            hocky: ['', Validators.required],
            khoa: [''],
            dothoc: [''],
            sosv_dangky: [''],
            // donvi_chuyenmon_id: [''],
            nganh_bomon_id: [''],
        });
    }
    routeData: Subscription;
    ngOnInit(): void {
        this.noitifi.closeSideNavigationMenu();
        this.userId = this.auth.user.id;
        this.donviId = this.auth.user.donvi_id;
        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin) || this.auth.userHasRole(ROLES.chuyenvien_pdt) ? true : false;
        this.isLanhDaoKhoa = this.auth.userHasRole(ROLES.lanhdaokhoa);
        // if (this.isManager) {
        this.firstColTable.elements.push({
            hint: 'Sửa thông tin',
            label: '',
            icon: '<i class="fi-rr-edit"></i>',
            type: 'handleEvent',
            eventName: 'editDataClasses',
            cssClass: 'edit-color',
        });
        // }
        const today = new Date();
        const year = today.getFullYear();
        const dataYear = [
            {
                value: Number(year - 1)
                    .toString()
                    .concat('_', year.toString()),
            },
            { value: year.toString().concat('_', Number(year + 1).toString()) },
        ];

        this.arrayYear = dataYear;
        // const routeData$ = this.router.events.pipe(
        //     filter(e => e instanceof ActivationEnd),
        //     throttleTime(0),
        //     map((e: ActivationEnd) => e.snapshot.data)
        // );
        // this.routeData = routeData$.subscribe(data => {
        //     if (this.reloadPage) {

        //         this.checkUrlAvai();
        //     }
        //     // this.checkUrlAvai();
        // });

        // if (!this.reloadPage) {
        this.itemSplitButton = [
            {
                label: 'Import sinh viên',
                icon: 'fa fa-graduation-cap',
                command: () => { },
            },
            {
                label: 'Xóa sinh viên',
                icon: 'pi pi-trash',
                command: () => { },
            },
        ];

        this.cols_class = [
            { label: 'TT', class: 'text-center', key: 'index_', width: '50' },
            {
                label: 'Tên lớp học phần',
                class: 'text-left',
                key: 'name',
                width: '400',
            },
            {
                label: 'Môn học',
                class: 'text-left',
                key: 'show_mon',
                width: '300',
            },
            {
                label: 'Số tín chỉ',
                class: 'text-center',
                key: 'sotinchi',
                width: '100',
            },
            {
                label: 'Giảng viên',
                class: 'text-left',
                key: 'mainTeacher',
                width: '250',
            },
            {
                label: 'Số ĐTGV',
                class: 'text-center',
                key: 'sdt_teacher',
                width: '150',
            },
            {
                label: 'Năm học',
                class: 'text-center',
                key: 'namhoc',
                width: '100',
            },
            {
                label: 'Học kỳ',
                class: 'text-center',
                key: 'hocky',
                width: '100',
            },
            // { label: 'Số SV', class: 'text-center', key: 'number_student', width: '100' },
            // { label: '#', class: 'text-center', key: 'id', width: '100' },
        ];
        this.checkUrlAvai();
        // }
    }

    ngAfterViewInit(): void { }

    ngOnDestroy() { }

    checkUrlAvai() {
        this.reloadPage = true;
        this.activatedRoute.queryParams.subscribe((params) => {
            if (params && params['class_id']) {
                const class_id = params['class_id'];
                this.classIdQuerryParam = class_id;
                const condition = this.httpHelper
                    .paramsConditionBuilder([
                        {
                            conditionName: 'id',
                            condition: OvicQueryCondition.equal,
                            value: class_id.toString(),
                        },
                    ])
                    .set('select', 'manager_ids');
                this.classesService.getClassesByCols(condition).subscribe({
                    next: (res) => {
                        if (res && res.length) {
                            if (
                                res[0].manager_ids ||
                                this.isManager ||
                                this.isLanhDaoKhoa
                            ) {
                                const index =
                                    res[0] && res[0].manager_ids
                                        ? res[0].manager_ids
                                            .split('|')
                                            .findIndex(
                                                (i) =>
                                                    i.toString() ===
                                                    this.userId.toString()
                                            )
                                        : '';
                                if (
                                    index !== -1 ||
                                    this.isManager ||
                                    this.isLanhDaoKhoa
                                ) {
                                    if (params['meeting_id']) {
                                        const id = params['meeting_id'];
                                        const class_id = params['class_id'];
                                        const url = this.router.serializeUrl(
                                            this.router.createUrlTree(
                                                ['admin/lop-hoc-phan'],
                                                {
                                                    queryParams: {
                                                        class_id: class_id,
                                                    },
                                                }
                                            )
                                        );
                                        // ZoomMtg.preLoadWasm();
                                        // ZoomMtg.prepareJssdk();
                                        // ZoomMtg.i18n.load('vi-VN');
                                        // ZoomMtg.i18n.reload('vi-VN');
                                        // this.ovicMeetingService.getOvicMeetingByCol('id', id).subscribe(res => {
                                        //     this.loadZoom(res[0]['meeting_number'], this.auth.user.display_name, res[0]['password'], class_id);
                                        // })
                                    } else {
                                        this.isOpenClass = true;
                                    }
                                } else {
                                    this.isOpenClass = false;
                                    this.router.navigate([
                                        '/admin/lop-hoc-phan',
                                    ]);
                                }
                            } else {
                                this.isOpenClass = false;
                                this.router.navigate(['/admin/lop-hoc-phan']);
                                this.noitifi.toastWarning(
                                    'Lớp học này chưa có giảng viên'
                                );
                            }
                        } else {
                            this.isOpenClass = false;
                            this.router.navigate(['/admin/lop-hoc-phan']);
                        }
                    },
                    error: () =>
                        this.noitifi.toastError('Lỗi kết nối, tải thất bại'),
                });
            } else {
                this.isOpenClass = false;
                this.initData();
            }
        });
    }

    loadZoom(meetingNumber, userName, password, class_id) {
        // document.getElementById('zmmtg-root').style.display = 'block';
        // document.getElementById('zmmtg-root').style.zIndex = '999999';
        // const url = this.router.serializeUrl(
        //     this.router.createUrlTree(['admin/lop-hoc-phan'], { queryParams: { class_id: class_id } })
        // );
        // const meetConfig = {
        //     apiKey: this.default_Zoom.api,
        //     meetingNumber: meetingNumber,
        //     leaveUrl: this.router.url,
        //     userName: userName,
        //     passWord: password,
        //     role: 1 // 1 for host
        // };
        // const meetingsin = ZoomMtg.generateSignature({
        //     apiKey: this.default_Zoom.api,
        //     apiSecret: this.default_Zoom.apiSecret,
        //     meetingNumber: meetingNumber,
        //     role: '1',
        //     success: res => {
        //         ZoomMtg.init({
        //             debug: true,
        //             leaveUrl: meetConfig.leaveUrl,
        //             isSupportAV: true,
        //             isSupportChat: true,
        //             // on success, call the join method
        //             success: (res_2) => {
        //                 ZoomMtg.join({
        //                     // pass your signature response in the join method
        //                     signature: res.result,
        //                     apiKey: meetConfig.apiKey,
        //                     meetingNumber: meetConfig.meetingNumber,
        //                     userName: meetConfig.userName,
        //                     passWord: meetConfig.passWord,
        //                     success: (res_1) => {
        //                     },
        //                     error(resaa) {
        //                     }
        //                 })
        //             },
        //         })
        //     },
        // })
    }

    get fC() {
        return this.formClass.controls;
    }

    passingColumnsVariableToView() {
        this.cols = [
            {
                header: 'TT',
                field: 'index_',
                width: '60px',
                headerClass:
                    'ovic-sct-title ovic-color-blue text-center elm-sticky',
                rowClass: 'text-center elm-sticky suggest-editing',
                dataType: 'text',
                enableFilter: true,
                filterSetting: {
                    mode: 'input',
                    inputClass: 'text-left',
                    inputType: 'text',
                    inputPlaceholder: '............',
                },
            },
            {
                header: 'Tên lớp học phần',
                field: 'name',
                width: '450px',
                headerClass:
                    'change-left-sticky ovic-sct-title ovic-color-blue text-left elm-sticky',
                rowClass:
                    'change-left-sticky text-left elm-sticky suggest-editing',
                dataType: 'text',
                enableFilter: true,
                data: this.listClass,
                menu: this.firstColTable,
                filterSetting: {
                    mode: 'input',
                    inputClass: 'text-left',
                    inputType: 'text',
                    inputPlaceholder: '............',
                },
            },
            {
                header: 'Mã lớp',
                field: 'id',
                width: '90px',
                rowClass: 'text-center',
                headerClass: 'text-center',
                dataType: 'text',
                enableFilter: true,
                filterSetting: {
                    mode: 'input',
                    inputClass: 'text-left',
                    inputType: 'text',
                    inputPlaceholder: '............',
                },
            },
            {
                header: 'Tên học phần',
                field: 'course_name',
                width: '200px',
                rowClass: 'text-left',
                headerClass: 'text-left',
                dataType: 'text',
                enableFilter: true,
                filterSetting: {
                    mode: 'input',
                    inputClass: 'text-left',
                    inputType: 'text',
                    inputPlaceholder: '............',
                },
            },
            {
                header: 'Giảng viên',
                field: 'mainTeacher',
                width: '200px',
                rowClass: 'text-left',
                headerClass: 'text-left',
                dataType: 'text',
                enableFilter: true,
                filterSetting: {
                    mode: 'input',
                    inputClass: 'text-left',
                    inputType: 'text',
                    inputPlaceholder: '............',
                },
            },
            {
                header: 'Số tín chỉ',
                field: 'sotinchi',
                width: '90px',
                rowClass: 'text-center',
                headerClass: 'text-center',
                dataType: 'text',
                enableFilter: true,
                filterSetting: {
                    mode: 'input',
                    inputClass: 'text-left',
                    inputType: 'text',
                    inputPlaceholder: '............',
                },
            },
            {
                header: 'Năm học',
                field: 'namhoc',
                width: '100px',
                rowClass: 'text-center',
                headerClass: 'text-center',
                dataType: 'text',
                enableFilter: true,
                filterSetting: {
                    mode: 'input',
                    inputClass: 'text-left',
                    inputType: 'text',
                    inputPlaceholder: '............',
                },
            },
            {
                header: 'Học kỳ',
                field: 'hocky',
                width: '80px',
                rowClass: 'text-center',
                headerClass: 'text-center',
                dataType: 'text',
                enableFilter: true,
                filterSetting: {
                    mode: 'input',
                    inputClass: 'text-left',
                    inputType: 'text',
                    inputPlaceholder: '............',
                },
            },

            {
                header: 'Link google meet',
                field: 'linkgooglemeet',
                width: '260px',
                rowClass: 'text-left',
                headerClass: 'text-left',
                dataType: 'text',
                enableFilter: true,
                filterSetting: {
                    mode: 'input',
                    inputClass: 'text-left',
                    inputType: 'text',
                    inputPlaceholder: '............',
                },
            },
            {
                header: 'Số sinh viên',
                field: 'student_register',
                width: '100px',
                rowClass: 'text-center',
                headerClass: 'text-center',
                dataType: 'text',
                enableFilter: true,
                filterSetting: {
                    mode: 'input',
                    inputClass: 'text-left',
                    inputType: 'text',
                    inputPlaceholder: '............',
                },
            },

            {
                header: 'Số điện thoại',
                field: 'sdt_teacher',
                width: '150px',
                rowClass: 'text-center',
                headerClass: 'text-center',
                dataType: 'text',
                enableFilter: true,
                filterSetting: {
                    mode: 'input',
                    inputClass: 'text-left',
                    inputType: 'text',
                    inputPlaceholder: '............',
                },
            },
        ];
    }

    resetForm() {
        this.formClass.reset();
        this.fC['user_id'].setValue(this.userId);
        this.fC['status'].setValue(1);
        this.isUpdated = false;
        this.fC['image'].setValue({
            ext: 'jpg',
            file_size: '77.3 KB',
            id: 21271,
            name: 'upload_c5f9b0067cbea71bd6fa8ca7445cd03d.jpg',
            size: 36142,
            title: 'cartoon-background-with-empty-classroom-interior-inside_1441-1735.jpg',
            type: 'image/jpg',
        });
        this.fC['manager_ids'].setValue(this.userId);
        this.fC['manager_info'].setValue(
            this.auth.user.display_name.concat(' *')
        );

        if (this.user_profile && this.user_profile.donvi_chuyenmon_id) {
            this.fC['category_id'].setValue(
                this.user_profile.donvi_chuyenmon_id
            );
            this.onChangeDonviCM({ id: this.user_profile.donvi_chuyenmon_id });
        }

        if (this.user_profile && this.user_profile.bomon_id) {
            this.fC['nganh_bomon_id'].setValue(this.user_profile.bomon_id);
        }
    }

    openFormAddClass(flag: boolean, event?: Classes) {
        // this.changeManagerClass();
        // this.loopGetDataActivity();
        // this.getStudentActivi();
        this.resetForm();
        this.formTitle = 'Thêm lớp học';
        this.isUpdated = flag;

        // if (!this.isManager && this.auth.user.donvi_ids && this.auth.user.donvi_ids.length) {
        //     this.fC['category_id'].setValue(this.auth.user.donvi_ids[0]);
        //     this.onChangeCategory({ value: this.auth.user.donvi_ids[0] });
        // }
        this.noitifi.openSideNavigationMenu({
            template: this.createClass,
            size: 700,
        });
        if (this.isUpdated) {
            this.editClass(event);
        }
    }

    editClass(object: Classes) {
        this.formTitle = 'Sửa thông tin lớp học';
        this.selectedClass = object;
        // this.fC['donvi_chuyenmon_id'].setValue(object.donvi_chuyenmon_id);
        this.fC['category_id'].setValue(object.category_id);
        this.fC['nganh_bomon_id'].setValue(object.nganh_bomon_id);
        this.fC['course_id'].setValue(object.course_id);
        this.fC['image'].setValue(object.image);
        this.fC['kyhieu'].setValue(object.kyhieu);
        this.fC['sotinchi'].setValue(object.sotinchi);
        this.fC['status'].setValue(object.status);
        this.fC['namhoc'].setValue(object.namhoc);
        this.fC['manager_ids'].setValue(
            object.manager_ids ? Number(object.manager_ids[0]) : null
        );
        this.fC['manager_info'].setValue(
            object.manager_info ? object.manager_info.split(',')[0] : null
        );
        this.fC['hocky'].setValue(object.hocky);
        this.fC['name'].setValue(object.name);
        this.fC['khoa'].setValue(object.khoa);
        this.fC['dothoc'].setValue(object.dothoc);
        this.fC['sosv_dangky'].setValue(object.sosv_dangky);
        if (object.category_id) {
            const index = this.list_donvi_chuyenmon.findIndex(
                (m) => m.id === object.category_id
            );
            if (index !== -1) {
                this.onChangeDonviCM(this.list_donvi_chuyenmon[index]);
            }
        }
    }

    loadInforCourse(course_id) {
        this.elnKhoaHocService
            .getElnKhoaHocByCol('id', course_id.toString())
            .subscribe({
                next: (_resCourse) => {
                    if (_resCourse.length) {
                        this.fC['category_id'].setValue(
                            _resCourse[0]['category_ids'][0]
                        );
                        // this.loadCourse(_resCourse[0]['category_ids'][0]);
                    }
                },
                error: () => this.noitifi.toastError('Lỗi kết nối'),
            });
    }

    onFocusoutTitle(key, valid) {
        if (this.fC[key].value) {
            let slug = this.fC[key].value;
            let key_ = key;
            if (key === 'name') {
                slug = this.helperService.slugVietnamese(this.fC[key].value);
                key_ = 'slug';
                this.checkIsValid(key_, slug, this.slugIsValid);
            } else {
                this.checkIsValid(key_, slug, this.kyhieuIsValid);
            }
        }
    }

    checkIsValid(col: string, item: string, valid) {
        if (item) {
            const arrayCondition = [
                {
                    conditionName: 'status',
                    condition: OvicQueryCondition.notEqual,
                    value: '-1',
                    orWhere: 'and',
                },
                {
                    conditionName: col,
                    condition: OvicQueryCondition.equal,
                    value: item,
                    orWhere: 'and',
                },
            ];
            if (this.isUpdated) {
                if (this.selectedClass)
                    arrayCondition.push({
                        conditionName: 'id',
                        condition: OvicQueryCondition.notEqual,
                        value: this.selectedClass.id.toString(),
                        orWhere: 'and',
                    });
            }
            const condition = this.httpHelper.paramsConditionBuilder(arrayCondition);
            setTimeout(() => {
                this.classesService.getClassesByCols(condition).subscribe((_res) => {
                    if (_res.length) {
                        if (col === 'slug') {
                            this.slugIsValid = false;
                        } else {
                            this.kyhieuIsValid = false;
                        }
                    } else {
                        if (col === 'slug') {
                            this.slugIsValid = true;
                        } else {
                            this.kyhieuIsValid = true;
                        }
                    }
                });
            }, 1000);
        }
    }

    addClass() {
        if (this.formClass.valid) {
            const data = this.formClass.getRawValue();
            data['slug'] = this.helperService.slugVietnamese(data['name']);
            data['manager_ids'] = !data['manager_ids']
                ? [this.userId]
                : [data['manager_ids']];
            data['manager_info'] = !data['manager_ids']
                ? this.auth.user.display_name.concat(' *')
                : data['manager_info'];
            if (!data['course_info']) {
                delete data['course_info'];
            }

            if (!data['image']) {
                delete data['image'];
            }

            if (this.isUpdated) {
                if (this.selectedClass.manager_ids) {
                    const manager_ids = this.selectedClass.manager_ids.splice(
                        1,
                        this.selectedClass.manager_ids.length
                    );
                    const manager_info = this.selectedClass.manager_info
                        .split(',')
                        .splice(
                            1,
                            this.selectedClass.manager_info.split(',').length
                        );
                    data['manager_ids'] =
                        data['manager_ids'].concat(manager_ids);
                    data['manager_info'] = data['manager_info'].concat(
                        ',',
                        manager_info.toString()
                    );
                    data['manager_ids'] = data['manager_ids']
                        ? '|'.concat(data['manager_ids'].join('|'), '|')
                        : '';
                }

                this.classesService
                    .updateDataClasses(this.selectedClass.id, data)
                    .subscribe({
                        next: () => {
                            this.noitifi.toastSuccess('Cập nhật thành công');
                            this.resetForm();
                            // if (this.isGrid) {
                            //     this.loadFilterPage(this.objectFilter, this.pageIndex * 20, 20);
                            // } else {
                            //     this.loadFilterPage(this.objectFilter, this.pageIndex * this.limitList, this.limitList);
                            // }
                            this.loadFirstPage();
                            this.closeSideMenu();
                        },
                        error: () =>
                            this.noitifi.toastWarning('Cập nhật thất bại'),
                    });
            } else {
                data['manager_ids'] = data['manager_ids']
                    ? '|'.concat(data['manager_ids'].join('|'), '|')
                    : '';
                this.classesService.createDataClasses(data).subscribe({
                    next: () => {
                        this.noitifi.toastSuccess('Thêm thành công');
                        this.resetForm();
                        this.loadFirstPage();
                        // if (this.isGrid) {
                        //     this.loadFilterPage(this.objectFilter, this.pageIndex * 20, 20);
                        // } else {
                        //     this.loadFilterPage(this.objectFilter, this.pageIndex * this.limitList, this.limitList);
                        // }
                        this.closeSideMenu();
                    },
                    error: () => this.noitifi.toastWarning('Thêm thất bại'),
                });
            }
        } else {
            this.noitifi.toastWarning(
                'Vui lòng điền đầy đủ thông tin cần thiết'
            );
        }
    }

    closeSideMenu() {
        this.noitifi.closeSideNavigationMenu();
    }

    onChangeCategory(event) {
        if (event) {
            this.fC['course_id'].setValue(event.value);
            this.loadCourse(event.value, 'nganh_bomon_id');
        } else {
            this.fC['course_id'].setValue(null);
        }
    }

    loadCourse(event, col) {
        if (event) {
            this.elnKhoaHocService
                .getElnKhoaHocByCol(col, event.id.toString())
                .subscribe({
                    next: (_resCourse) => {
                        const tmp = _resCourse.filter((m) => m.status > -1);
                        tmp.forEach((f) => {
                            f['title'] = f.title.concat(' - [', f.maso, ']');
                        });
                        this.listCourse = tmp;
                    },
                    error: () => this.noitifi.toastError('Lỗi kết nối'),
                });
        } else {
            this.listCourse = [];
        }
    }

    openFormChooseYear() {
        this.formTitle = 'Chọn năm học';
        this.modalService.open(this.templateChooseExcel, NORMAL_MODAL_OPTIONS);
    }

    openImport(year) {
        this.selectedYear = year;
        this.isImportClass = 'importClass';
        this.valueImport = null;
        this.inputImport.nativeElement.click();
    }

    changeInputImport(event) {
        if (event.target.files[0]) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.readAsBinaryString(file);
            reader.onloadend = (event) => {
                const localUrl = reader.result;
                const wb: XLSX.WorkBook = XLSX.read(localUrl, {
                    type: 'binary',
                });
                const wsname: string = wb.SheetNames[0];
                const ws: XLSX.WorkSheet = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
                if (this.isImportClass === 'importClass') {
                    this.convertDataForClass(data);
                } else if (this.isImportClass === 'importDeleteStudent') {
                    this.noitifi
                        .confirmDelete(
                            'Các bài tập của sinh viên trong lớp cũng sẽ bị xóa, bạn có chắc chắn thực hiện thao tác này?'
                        )
                        .then(
                            (a) => {
                                if (a) {
                                    this.startDelete(
                                        data.filter(
                                            (m) => m[0] && m[1] && !isNaN(m[0])
                                        )
                                    );
                                }
                            },
                            () => null
                        );
                } else {
                    this.convertDataForStudent(data);
                }
            };
        }
    }

    converNextDate(value: string, space: number) {
        const thisDate = value.split('/');
        const date = thisDate[2]
            .trim()
            .concat('-', thisDate[1].trim(), '-', thisDate[0].trim());
        const d = new Date(date);
        d.setDate(d.getDate() + space);
        return this.helperService.formatSQLDateTime(d);
    }

    convertDataForClass(data) {
        const lophocphan = [];
        const emailAr = [];
        const mahpAr = [];
        const newData = data.filter(
            (f) => f[1] && f[2] && f[5] && f[6] && f[7] && f[8] && f[9]
        );
        newData.forEach((f, key) => {
            if (key !== 0 && key !== 1) {
                f[15] = f[15].toLowerCase();
                const mahp = f[1];
                const kyhieu = f[2].trim().split('(')[1].replace(')', '');
                const index = kyhieu.indexOf('TH');
                if (f[10].trim().toLowerCase() === 'lt') {
                    const object = {
                        name: f[2].trim(),
                        mahp: mahp,
                        kyhieu: kyhieu,
                        sotinchi: f[6],
                        slug: this.helperService.slugVietnamese(f[2].trim()),
                        status: 1,
                        manager_ids: null,
                        manager_info: null,
                        khoa: f[5] ? f[5].trim().replace(/\D/gi, '') : '',
                        dothoc: f[7],
                        sosv_dangky: f[9],
                        image: {
                            ext: 'jpg',
                            file_size: '77.3 KB',
                            id: 21271,
                            name: 'upload_c5f9b0067cbea71bd6fa8ca7445cd03d.jpg',
                            size: 36142,
                            title: 'cartoon-background-with-empty-classroom-interior-inside_1441-1735.jpg',
                            type: 'image/png',
                        },
                        user_id: this.userId,
                        hocky: f[8],
                        namhoc: this.selectedYear,
                        email: f[15] ? f[15].trim().toLowerCase() : null,
                    };
                    if (f[15] && f[15].trim()) {
                        emailAr.push(f[15]);
                    }
                    mahpAr.push(mahp);
                    lophocphan.push(object);
                }
            }
        });
        this.addClassFormExcel(lophocphan, emailAr, mahpAr);
    }

    addClassFormExcel(data, emailAr, slugAr) {
        this.startProgress = true;
        this.progressValue = 0;
        this.countProgressValue = 0;
        forkJoin([
            this.userService.getUserByItem(emailAr.toString(), 'email'),
            this.elnKhoaHocService.getElnKhoaHocByItem(
                slugAr.toString(),
                'maso'
            ),
        ]).subscribe(([_resUser, _resKhoa]) => {
            const objectUser = {};
            const objectKhoa = {};
            _resUser.forEach((f, key) => {
                if (!objectUser[f.email]) {
                    objectUser[f.email] = f;
                }
            });
            _resKhoa.forEach((f, key) => {
                if (!objectKhoa[f.maso]) {
                    objectKhoa[f.maso] = f;
                }
            });

            data.forEach((f, key) => {
                if (objectUser[f.email]) {
                    f.manager_ids = [objectUser[f.email]['id']];
                    f.manager_info =
                        objectUser[f.email]['display_name'].concat(' *');
                } else {
                    delete f.manager_ids;
                    delete f.manager_info;
                }
                if (objectKhoa[f['mahp']]) {
                    f['course_id'] = objectKhoa[f['mahp']]['id'];
                    f['category_id'] = objectKhoa[f['mahp']]['category_ids']
                        ? objectKhoa[f['mahp']]['category_ids'][0]
                        : null;
                    f['course_info'] = {
                        title: objectKhoa[f['mahp']]['title'],
                    };
                }
                delete f.mahp;
                delete f.email;
                setTimeout(() => {
                    this.classesService
                        .getDataClassesByCol('slug', f.slug)
                        .subscribe((_resClass) => {
                            if (_resClass.length) {
                                this.countProgress(data.length);
                            } else {
                                this.classesService
                                    .createDataClasses(f)
                                    .subscribe(
                                        () => {
                                            this.countProgress(data.length);
                                        },
                                        () =>
                                            this.noitifi.toastError(
                                                'Thêm thất bại'
                                            )
                                    );
                            }
                        });
                }, 100 * key);
            });
        });
    }
    countProgress(maxLength: number) {
        this.countProgressValue = this.countProgressValue + 1;
        this.progressValue = (this.countProgressValue / maxLength) * 100;
        if (this.countProgressValue === maxLength) {
            this.noitifi.toastSuccess('Thêm thành công');

            this.initData();

            this.startProgress = false;
            this.progressValue = 0;
            this.countProgressValue = 0;
        }
    }
    onChangeTeacher(event) {
        if (event) {
            this.fC['manager_ids'].setValue(event.id);
            this.fC['manager_info'].setValue(event.display_name.concat(' *'));
        } else {
            this.fC['manager_ids'].setValue(this.userId);
            this.fC['manager_info'].setValue(
                this.auth.user.display_name.concat(' *')
            );
        }
    }

    onChangeCourse(event) {
        if (event) {
            this.fC['course_id'].setValue(event.id);
            this.fC['course_info'].setValue({ title: event.title });
        } else {
            this.fC['course_id'].setValue(null);
            this.fC['course_info'].setValue(null);
        }
    }

    openClass(object) {
        if (this.isManager || this.isLanhDaoKhoa) {
            this.router.navigate(['admin/giang-vien/lop-hoc-phan/class-details'], { queryParams: { code: object.id } });
            setTimeout(() => this.noitifi.closeLeftMenu(), 300);
        } else if (object.manager_ids) {
            if (
                object.manager_ids.findIndex((m) => m.toString() === this.userId.toString()) !== -1
            ) {
                this.router.navigate(['admin/giang-vien/lop-hoc-phan/class-details'], { queryParams: { code: object.id } });
                setTimeout(() => this.noitifi.closeLeftMenu(), 300);
            }
        } else {
            this.noitifi.toastWarning('Bạn không có quyền');
        }
    }

    deleteClass(object: Classes) {
        this.noitifi.confirmDelete().then(
            (a) => {
                if (a) {
                    forkJoin([
                        this.classesService.deleteDataClasses(object.id),
                        this.classStudentService.deleteClassStudentByCol(
                            object.id.toString(),
                            'class_id'
                        ),
                    ]).subscribe({
                        next: () => {
                            this.noitifi.toastSuccess('Xóa thành công');
                            this.loadFirstPage();
                            // if (this.isGrid) {
                            //     this.loadFilterPage(this.objectFilter, this.pageIndex * 20, 20);
                            // } else {
                            //     this.loadFilterPage(this.objectFilter, this.pageIndex * this.limitList, this.limitList);
                            // }
                        },
                        error: () =>
                            this.noitifi.toastError(
                                'Xóa thất bại, lỗi kết nối'
                            ),
                    });
                }
            },
            () => null
        );
    }

    searchClass(event) {
        if (event) {
            const value = event.target.value.trim();
            this.objectFilter['name'] = value;
        } else {
            this.objectFilter['name'] = null;
        }
        this.loadFirstPage();
        this.pageIndex = 0;
        // setTimeout(() => {
        //     if (this.isGrid) {
        //         this.listClass = [];
        //         this.loadFilterPage(this.objectFilter, 0, 20);
        //     } else {
        //         this.loadFilterPage(this.objectFilter, 0, this.limitList);
        //     }
        // }, 500)
    }

    onChangeFilter(event, keyName: string) {
        if (event) {
            this.objectFilter[keyName] = event['value'];
        } else {
            this.objectFilter[keyName] = null;
        }
        this.loadFirstPage();
        // if (this.isGrid) {
        //     this.listClass = [];
        //     this.loadFilterPage(this.objectFilter, 0, 20);
        // } else {
        //     this.loadFilterPage(this.objectFilter, 0, this.limitList);
        // }
    }

    clearDataImport() {
        this.selectedYear = null;
        this.valueImport = null;
    }

    close(d) {
        this.clearDataImport();
        d(true);
    }

    loadMoreClass() {
        // this.pageIndex = this.pageIndex + 1;
        // this.loadFilterPage(this.objectFilter, this.pageIndex * 20, 20);
    }

    calendarInit() {
        // const currentThis = this;
        // const calendarApi = this.calendar.getApi();
        // this.optionsCalendar = {
        //     initialView: 'dayGridMonth',
        //     weekends: true,
        //     customButtons: {
        //         prev: {
        //             text: '<',
        //             click: function (event) {
        //                 calendarApi.prev();
        //                 currentThis.loadDataClassInMonth(calendarApi.getDate());
        //             }
        //         },
        //         next: {
        //             text: '>',
        //             click: function (event) {
        //                 calendarApi.next();
        //                 currentThis.loadDataClassInMonth(calendarApi.getDate());
        //             }
        //         },
        //         today: {
        //             text: 'Today',
        //             click: function (event) {
        //                 calendarApi.today();
        //                 currentThis.loadDataClassInMonth(calendarApi.getDate());
        //             }
        //         },
        //     },
        //     headerToolbar: {
        //         left: 'today',
        //         center: 'title',
        //         right: 'prev,next'
        //     },
        //     dayHeaderClassNames: 'calendar-day-header',
        //     dayCellClassNames: 'calendar-day-cell',
        //     height: "100%",
        //     firstDay: 1,
        //     themeSystem: 'bootstrap',
        //     dayMaxEvents: false,
        //     buttonIcons: {
        //         close: 'fa-times',
        //         prev: 'fa-chevron-left',
        //         next: 'fa-chevron-right',
        //         prevYear: 'fa-angle-double-left',
        //         nextYear: 'fa-angle-double-right'
        //     },
        //     eventClassNames: 'calendar-events-name',
        //     titleFormat: { year: 'numeric', month: 'long', day: 'numeric' },
        //     timeZone: 'local',
        //     locale: 'vi',
        //     // allDaySlot: false,
        //     // eventDidMount: this.handleEventMouseEnter.bind(this),
        //     eventClick: this.eventCalendarClick.bind(this),
        //     dateClick: this.handleDateClick.bind(this),
        //     eventMouseEnter: this.handleEventMouseEnter.bind(this),
        //     eventMouseLeave: this.handleEventMouseLeave.bind(this),
        // }
        // this.loadDataClassInMonth(calendarApi.getDate());
    }

    handleDateClick(event) {
        // console.log(event);
    }

    eventCalendarClick(info) {
        // if (this.tooltip) {
        //     this.tooltip.dispose();
        // }
        // this.router.navigate(['admin/lop-hoc-phan'], { queryParams: { class_id: info.event.extendedProps.class_id } })
        // setTimeout(() => this.noitifi.closeLeftMenu(), 300);
        // this.router.navigate(['/admin/lop-hoc', { class: this.classesCurrent.id }]);
    }

    loadDataClassInMonth(date) {
        // const thisDate = new Date(date);
        // const firstDay = new Date(thisDate.getFullYear(), thisDate.getMonth(), 1);
        // const lastDay = new Date(thisDate.getFullYear(), thisDate.getMonth() + 1, 0);
        // const condition_class = this.httpHelper.paramsConditionBuilder(
        //     [
        //         { conditionName: 'namhoc', condition: OvicQueryCondition.like, value: '%'.concat(thisDate.getFullYear().toString(), '%') },
        //         { conditionName: 'manager_ids', condition: OvicQueryCondition.like, value: '%'.concat(this.userId.toString(), '%'), orWhere: 'and' },
        //         { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' },
        //     ]).set('pluck', 'id');
        // this.classesService.getClassesByCols(condition_class).subscribe(_resClass => {
        //     if (_resClass.length) {
        //         const class_ids = [];
        //         _resClass.forEach((f) => {
        //             class_ids.push(f.id);
        //         })
        //         const condition_calendar = this.httpHelper.paramsConditionBuilder(
        //             [
        //                 { conditionName: 'ngay', condition: OvicQueryCondition.greaterThanToEqualsTo, value: this.helperService.convertToSqlServerTime(firstDay) },
        //                 { conditionName: 'ngay', condition: OvicQueryCondition.lessThanOrEqualsTo, value: this.helperService.convertToSqlServerTime(lastDay), orWhere: 'and' },
        //             ]).set('include_by', 'class_id').set('include', class_ids.toString());
        //         const condition_meeting = this.httpHelper.paramsConditionBuilder(
        //             [
        //                 { conditionName: 'start_time', condition: OvicQueryCondition.greaterThanToEqualsTo, value: this.helperService.convertToSqlServerTime(firstDay) },
        //             ]).set('include_by', 'class_id').set('include', class_ids.toString());;
        //         forkJoin([
        //             this.classCalendarService.getClassCalendarByCols(condition_calendar),
        //             this.ovicMeetingService.getOvicMeetingByCols(condition_meeting)
        //         ]).subscribe(([_resCalendar, _resMeeting]) => {
        //             const eventsCalendar = [];
        //             _resCalendar.forEach((f, key) => {
        //                 const dateF = new Date(f.ngay);
        //                 let month = Number(dateF.getMonth() + 1).toString();
        //                 let day = Number(dateF.getDate()).toString();
        //                 if ((dateF.getMonth() + 1) < 10) {
        //                     month = '0'.concat(Number(dateF.getMonth() + 1).toString());
        //                 }
        //                 if (dateF.getDate() < 10) {
        //                     day = '0'.concat(dateF.getDate().toString());
        //                 }
        //                 const reDate = dateF.getFullYear().toString().concat('-', month, '-', day);
        //                 eventsCalendar.push({
        //                     id: f.id,
        //                     title: ''.concat('Tiết: ', f.tiethoc.split("|").join(","), ' - ', f.phonghoc),
        //                     start: reDate,
        //                     extendedProps: {
        //                         className: 'Lớp: '.concat(f.class_name),
        //                         class_id: f.class_id,
        //                     }
        //                 })
        //             });
        //             _resMeeting.forEach((f, key) => {
        //                 const dateF = new Date(f.start_time);
        //                 let month = Number(dateF.getMonth() + 1).toString();
        //                 let day = Number(dateF.getDate()).toString();
        //                 if ((dateF.getMonth() + 1) < 10) {
        //                     month = '0'.concat(Number(dateF.getMonth() + 1).toString());
        //                 }
        //                 if (dateF.getDate() < 10) {
        //                     day = '0'.concat(dateF.getDate().toString());
        //                 }
        //                 const reDate = dateF.getFullYear().toString().concat('-', month, '-', day, ' ', dateF.toLocaleString('en-GB').split(",")[1].trim());
        //                 eventsCalendar.push({
        //                     "id": f.id,
        //                     "class_id": f.class_id,
        //                     "title": f.title,
        //                     "start": reDate,
        //                     extendedProps: {
        //                         class_id: f.class_id,
        //                     }
        //                 })
        //             });
        //             this.optionsCalendar.events = eventsCalendar;
        //             const calendarApi = this.calendar.getApi();
        //             calendarApi.resetOptions(this.optionsCalendar);
        //             calendarApi.render();
        //         })
        //     } else {
        //         this.optionsCalendar.events = [];
        //         const calendarApi = this.calendar.getApi();
        //         calendarApi.resetOptions(this.optionsCalendar);
        //         calendarApi.render();
        //     }
        // })
    }

    handleEventMouseEnter(info) {
        // if (this.tooltip) {
        //     this.tooltip.dispose();
        // }
        // if (info.event.extendedProps.className) {
        //     this.tooltip = new Tooltip(info.el, {
        //         title: '<div class="details-event-tooltip">'.concat(info.event.extendedProps.className, '</div>'),
        //         placement: 'top',
        //         trigger: 'hover',
        //         container: 'body',
        //         html: true,
        //     });
        //     this.tooltip.show();
        // } else {
        //     this.tooltip = new Tooltip(info.el, {
        //         title: '<div class="details-event-tooltip">'.concat(info.event.title, '</div>'),
        //         placement: 'top',
        //         trigger: 'hover',
        //         container: 'body',
        //         html: true,
        //     });
        //     this.tooltip.show();
        // }
    }

    handleEventMouseLeave(info) {
        // this.tooltip.hide();
    }

    chooseStyleClass(index: number) {
        this.activeIndex_class = index;

        // this.isGrid = flag;
        // this.pageIndex = 0;
        // this.loadFirtPage();
    }

    topBarRightEvent(event) { }

    actionsEvent(require, object: Classes) {
        if (require) {
            this.selectedClass = object;
            switch (require.key) {
                case 'editDataClasses':
                    this.resetForm();
                    if (
                        this.isManager ||
                        this.isLanhDaoKhoa ||
                        this.userId === this.selectedClass.user_id
                    ) {
                        this.isUpdated = true;
                        this.editClass(this.selectedClass);
                        this.noitifi.openSideNavigationMenu({
                            template: this.createClass,
                            size: 700,
                        });
                    } else {
                        this.noitifi.toastError('Bạn không có quyền');
                    }
                    break;
                case 'requireDelete':
                    if (
                        this.isManager ||
                        this.userId === this.selectedClass.user_id
                    ) {
                        this.deleteClass(this.selectedClass);
                    } else {
                        this.noitifi.toastError('Bạn không có quyền');
                    }
                    break;
                case 'moveToClass':
                    this.openClass(this.selectedClass);
                    break;
                case 'synch':
                    // if (this.isAdmin) {
                    this.synchronized(this.selectedClass);
                    // } else {
                    //     this.noitifi.toastError('Bạn không có quyền');
                    // }
                    break;
                case 'google_meet':
                    if (object['google_meet']) {
                        const url = 'https://meet.google.com/'.concat(
                            object['google_meet']
                        );
                        window.open(url, '_blank');
                    }
                    break;
                default:
                    break;
            }
        }
    }
    changePage(event) {
        this.select_page = event.page;
        this.loadFilterPage(event.page + 1);
        // this.loadPageData(event.page + 1);
    }

    getRolesPromise(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.objectRoles = {};

            const condition: ConditionOption = {
                condition: [],
                set: [
                    { label: 'limit', value: '-1' },
                    { label: 'include', value: ROLES.giangvien },
                    { label: 'include_by', value: 'name' },
                ],
                page: null,
            };


            this.roleService.getRolesByPageNew(condition).subscribe({
                next: (_role) => {
                    console.log(_role);
                    _role.data.forEach((f) => {
                        this.objectRoles[f.name] = f;
                    });

                    this.noitifi.isProcessing(false);
                    resolve(this.objectRoles);
                },
                error: () => {
                    this.noitifi.isProcessing(false);
                    this.noitifi.toastError(
                        'Lỗi kết nối, vui lòng thử lại, hoặc liên hệ với kỹ thuật viên nếu thử lại không thành công'
                    );
                    resolve(null);
                },
            });
        });
    }

    async initData() {
        this.listClass = [];
        this.pageIndex = 0;
        const t = await this.getRolesPromise();
        const condition_group_namhoc = this.httpHelper
            .paramsConditionBuilder([
                {
                    conditionName: 'status',
                    condition: OvicQueryCondition.notEqual,
                    value: '-1',
                    orWhere: 'and',
                },
            ])
            .set('order', 'DESC')
            .set('orderby', 'namhoc')
            .set('groupby', 'namhoc')
            .set('limit', -1);

        const condition_group_hocky = this.httpHelper
            .paramsConditionBuilder([
                {
                    conditionName: 'status',
                    condition: OvicQueryCondition.notEqual,
                    value: '-1',
                    orWhere: 'and',
                },
            ])
            .set('order', 'DESC')
            .set('orderby', 'hocky')
            .set('groupby', 'hocky')
            .set('limit', -1);

        const condition_donvi = this.httpHelper
            .paramsConditionBuilder([
                {
                    conditionName: 'status',
                    condition: OvicQueryCondition.notEqual,
                    value: '-1',
                    orWhere: 'and',
                },
                {
                    conditionName: 'parent_id',
                    condition: OvicQueryCondition.equal,
                    value: this.auth.user.donvi_id.toString(),
                    orWhere: 'and',
                },
            ])
            .set('limit', -1);

        const roleATeacher = this.auth.roles.find((r) => r.name === ROLES.giangvien);

        forkJoin([
            this.classesService.getClassesByCols(condition_group_namhoc),
            this.classesService.getClassesByCols(condition_group_hocky),
            this.userService.getUserByCol('role_ids', roleATeacher ? roleATeacher['id'] : this.objectRoles[ROLES.giangvien].id),
            this.donViService.getDonViByCols(condition_donvi),
            this.elngUserProfileService.getElngUserProfileByItem(
                this.userId.toString(),
                'user_id'
            ),
        ]).subscribe({
            next: ([
                _resNamhoc,
                _resHocky,
                _resUser,
                _resCategory,
                _userProfile,
            ]) => {
                const tmpNamHoc = [];
                const tmpHocky = [];
                _resNamhoc.forEach((f) => {
                    if (f['namhoc'])
                        tmpNamHoc.push({
                            value: f['namhoc'],
                            label: 'Năm học '.concat(f['namhoc']),
                        });
                });
                _resHocky.forEach((f) => {
                    if (f['hocky'])
                        tmpHocky.push({
                            value: f['hocky'],
                            label: 'HK '.concat(f['hocky']),
                        });
                });
                this.listNamhoc = tmpNamHoc;
                this.listHocky = tmpHocky;
                this.user_profile = _userProfile[0];
                //
                const objectTeacher = {};
                const tmpUser = [];
                _resUser.forEach((f, key) => {
                    if (f.status !== -1) {
                        f['show_name'] = f.display_name.concat(
                            ' (',
                            f.email,
                            ')'
                        );
                        if (!objectTeacher[f.id]) {
                            objectTeacher[f.id] = f;
                        }
                        tmpUser.push(f);
                    }
                });
                this.objectTeacher = objectTeacher;
                this.listTeacher = tmpUser;
                this.list_donvi_chuyenmon = _resCategory;
                //

                const condition_group_hocky_end = this.httpHelper
                    .paramsConditionBuilder([
                        {
                            conditionName: 'status',
                            condition: OvicQueryCondition.notEqual,
                            value: '-1',
                        },
                        {
                            conditionName: 'namhoc',
                            condition: OvicQueryCondition.equal,
                            value: this.listNamhoc[0]['value'],
                            orWhere: 'and',
                        },
                    ])
                    .set('order', 'DESC')
                    .set('orderby', 'hocky')
                    .set('groupby', 'hocky');

                this.classesService
                    .getClassesByCols(condition_group_hocky_end)
                    .subscribe((_res) => {
                        this.objectFilter['namhoc'] =
                            this.listNamhoc[0]['value'];
                        this.objectFilter['hocky'] =
                            _res.length && _res[0] && _res[0]['hocky']
                                ? _res[0]['hocky']
                                : this.listHocky[0]['value'];
                        this.passingColumnsVariableToView();
                        if (!this.isLanhDaoKhoa && !this.isManager) {
                            this.filterOwn = true;
                        } else {
                            this.filterOwn = false;
                        }
                        this.loadFilterPage(1);
                        // if (!this.isGrid) {
                        //     this.loadFilterPage(this.objectFilter, 0, 40);
                        // } else {
                        //     this.loadFilterPage(this.objectFilter, 0, 20);
                        // }
                    });
            },
            error: () => this.noitifi.toastError('Lỗi kết nối'),
        });
    }

    loadFilterPage(page) {
        this.noitifi.isProcessing(true);
        const condition: ConditionOption = {
            condition: [
                {
                    conditionName: 'status',
                    condition: OvicQueryCondition.equal,
                    value: '1',
                    orWhere: 'and',
                },
            ],
            set: [],
            page: page,
        };

        if (
            !this.isManager &&
            this.isLanhDaoKhoa &&
            this.user_profile &&
            this.user_profile.donvi_chuyenmon_id &&
            !this.filterOwn
        ) {
            condition.condition.push({
                conditionName: 'category_id',
                condition: OvicQueryCondition.equal,
                value: this.user_profile.donvi_chuyenmon_id.toString(),
                orWhere: 'and',
            });
        }

        const arr_like = ['name'];
        Object.keys(this.objectFilter).forEach((f) => {
            const index = arr_like.findIndex((m) => m === f);
            if (index !== -1) {
                condition.condition.push({
                    conditionName: f,
                    condition: OvicQueryCondition.like,
                    value: '%'.concat(this.objectFilter[f], '%'),
                    orWhere: 'and',
                });
            } else {
                condition.condition.push({
                    conditionName: f,
                    condition: OvicQueryCondition.equal,
                    value: this.objectFilter[f].toString(),
                    orWhere: 'and',
                });
            }
        });

        // let condition = this.httpHelper.paramsConditionBuilder(arrayCondition).set('orderby', 'namhoc').set('order', 'DESC').set("manager_ids", this.userId.toString()).set('limit', limit.toString()).set("offset", start.toString());
        // let condition_pluck = this.httpHelper.paramsConditionBuilder(arrayCondition).set('pluck', 'manager_ids').set("manager_ids", this.userId.toString());

        if ((this.isManager || this.isLanhDaoKhoa) && !this.filterOwn) {
        } else {
            condition.condition.push({
                conditionName: 'manager_ids',
                condition: OvicQueryCondition.like,
                value: '%|'.concat(this.userId.toString(), '|%'),
                orWhere: 'and',
            });
        }

        forkJoin([
            this.classesService.getClassesByPageNew(condition).pipe(
                mergeMap((_class) => {
                    const class_student_request: Observable<any>[] = [];
                    const manager_ids = [0];
                    const couse_ids = [0];
                    _class.data.forEach((f) => {
                        const condition_count: ConditionOption = {
                            condition: [
                                {
                                    conditionName: 'status',
                                    condition: OvicQueryCondition.equal,
                                    value: '1',
                                    orWhere: 'and',
                                },
                                {
                                    conditionName: 'class_id',
                                    condition: OvicQueryCondition.equal,
                                    value: f.id.toString(),
                                    orWhere: 'and',
                                },
                            ],
                            set: [{ label: 'limit', value: '1' }],
                            page: null,
                        };
                        couse_ids.push(f.course_id);

                        if (f.manager_ids) {
                            const teacher_id = f.manager_ids
                                ? f.manager_ids.split('|').filter((m) => m)
                                : null;
                            manager_ids.push(teacher_id);
                        }
                        // class_student_request.push(this.classStudentService.getClassStudentByPageNew(condition_count).pipe(mergeMap(_student => {
                        //     f['number_student'] = _student.recordsFiltered;

                        // if (f.manager_ids) {
                        //     const teacher_id = f.manager_ids ? f.manager_ids.split("|").filter(m => m) : null;
                        //     const condition_meet: ConditionOption = {
                        //         condition: [
                        //             { conditionName: 'user_id', condition: OvicQueryCondition.equal, value: teacher_id[0], },
                        //         ],
                        //         set: [
                        //             { label: 'limit', value: '1' },
                        //             { label: 'select', value: 'google_meet' }
                        //         ],
                        //         page: null
                        //     }

                        //     return this.elngUserProfileService.getUserProfileByPageNewV2(condition_meet).pipe(mergeMap(_user => {
                        //         f['google_meet'] = _user.data && _user.data.length ? _user.data[0]['google_meet'] : null;
                        //         const condition_mon: ConditionOption = {
                        //             condition: [
                        //                 { conditionName: 'id', condition: OvicQueryCondition.equal, value: f.course_id ? f.course_id.toString() : '0' }
                        //             ],
                        //             set: [],
                        //             page: null
                        //         }
                        //         return this.elnKhoaHocService.getKhoaHocByPageNew_2(condition_mon).pipe(mergeMap(_mon => {
                        //             if (_mon.data.length) {
                        //                 f['show_mon'] = '['.concat(_mon.data[0].maso, '] - ', _mon.data[0].title);
                        //             } else {
                        //                 f['show_mon'] = ''
                        //             }
                        //             return of(null);
                        //         }))
                        //     }))
                        // }
                        // return of(_class);
                        // })))
                    });

                    const new_couse_ids = [...new Set(couse_ids)];
                    const new_manager_ids = [...new Set(manager_ids)];

                    const condition_meet: ConditionOption = {
                        condition: [],
                        set: [
                            {
                                label: 'include',
                                value: new_manager_ids.toString(),
                            },
                            { label: 'include_by', value: 'user_id' },
                            { label: 'limit', value: '-1' },
                        ],
                        page: null,
                    };

                    const condition_mon: ConditionOption = {
                        condition: [],
                        set: [
                            {
                                label: 'include',
                                value: new_couse_ids.toString(),
                            },
                            { label: 'include_by', value: 'id' },
                            { label: 'limit', value: '-1' },
                        ],
                        page: null,
                    };

                    return forkJoin([
                        this.elnKhoaHocService.getKhoaHocByPageNew_2(
                            condition_mon
                        ),
                        this.elngUserProfileService.getUserProfileByPageNewV2(
                            condition_meet
                        ),
                    ]).pipe(
                        mergeMap(([_mon, _user]) => {
                            _class.data.forEach((f) => {
                                const index_mon = _mon.data.findIndex(
                                    (m) => m.id === f.course_id
                                );
                                if (index_mon !== -1) {
                                    f['show_mon'] = '['.concat(
                                        _mon.data[index_mon].maso,
                                        '] - ',
                                        _mon.data[index_mon].title
                                    );
                                } else {
                                    f['show_mon'] = '';
                                }

                                if (f.manager_ids) {
                                    const teacher_id = f.manager_ids
                                        ? f.manager_ids
                                            .split('|')
                                            .filter((m) => m)
                                        : null;
                                    const index_meet = _user.data.findIndex(
                                        (m) =>
                                            m.user_id.toString() ===
                                            teacher_id.toString()
                                    );
                                    f['google_meet'] =
                                        index_meet !== -1
                                            ? _user.data[index_meet][
                                            'google_meet'
                                            ]
                                            : null;
                                }
                            });
                            return of(_class);
                        })
                    );

                    return of(_class);
                })
            ),
        ]).subscribe(([_resClass]) => {
            const tmpClass = [];
            if (!_resClass.recordsFiltered) {
                this.emptyList =
                    'Đến thời điểm hiện tại, Học kỳ ' +
                    this.objectFilter['hocky'] +
                    ' năm học ' +
                    this.objectFilter['namhoc'] +
                    ' Thầy/cô chưa có lớp học phần nào được phân công, vui lòng liên hệ với phòng Đào tạo nếu thấy thiếu sót, trân trọng cảm ơn!';
            }
            this.countClass = _resClass.recordsFiltered;
            const _index_start = (page - 1) * 20;
            const user_ids = [];
            _resClass.data.forEach((f, key) => {
                f['index_'] = _index_start + key + 1;
                f['blob'] =
                    f.image && f.image['id']
                        ? this.sanitizer.bypassSecurityTrustUrl(
                            getLinkDownload_aws(
                                f.image['id'].toString()
                            ).concat('?token=', this.auth.accessToken)
                        )
                        : '..\\assets\\images\\class_avatar.jpg';
                f.manager_ids = f.manager_ids
                    ? f.manager_ids.split('|').filter((m) => m)
                    : null;
                if (f.manager_info) {
                    f['mainTeacher'] = f.manager_info
                        .replace(/\*/gi, '')
                        .replace(/\,/gi, ', ');
                }

                if (f.manager_ids) {
                    f['sdt_teacher'] =
                        this.objectTeacher[f.manager_ids[0]] &&
                            this.objectTeacher[f.manager_ids[0]]['phone']
                            ? this.objectTeacher[f.manager_ids[0]]['phone']
                            : 'Chưa xác định';
                }

                if (f.course_id && f.course_info && f.course_info['title']) {
                    f['course_name'] = f.course_info['title'];
                }

                if (f['mainTeacher']) {
                    user_ids.push(f['mainTeacher']);
                }

                tmpClass.push(f);
            });

            this.noitifi.isProcessing(false);
            this.listClass = tmpClass;
        });
    }

    openImportSinhvien() {
        this.isImportClass = 'importSinhvien';
        this.valueImport = null;
        this.inputImport.nativeElement.click();
    }

    convertDataForStudent(data) {
        const newData = data.filter(
            (m) => m[0] && m[1] && m[2] && !isNaN(m[0])
        ); // 0=> stt, 1 => ma sinh vien => 2 > id lop
        this.duplicateStudent = [];
        this.noStudentData = [];
        this.progressValue = 0;
        this.startProgress = true;
        this.countProgressValue = 0;
        const objectDuplicate = {};
        const email = {};
        const objectClass = {};
        const objectStudentCode = {};
        const objectAddStudent = {};
        let i = 0;
        newData.forEach((f, key) => {
            if (f[0] && f[1] && f[2]) {
                // stt , ma sinh vien, ma lop, nam hoc, hoc ky, id hoc phan
                f[1] = f[1].toLowerCase();
                if (!objectDuplicate[f[1].concat('_', f[2])]) {
                    objectDuplicate[f[1].concat('_', f[2])] = { ...f };
                } else {
                    objectDuplicate[f[1].concat('_', f[2])]['duplicate'] = true;
                }

                if (!objectDuplicate[f[1].concat('_', f[2])]['duplicate']) {
                    if (!email[f[1].concat('_', f[2])]) {
                        email[f[1].concat('_', f[2])] = 1;
                        const newEmail = f[1]
                            ? f[1].trim().concat('@ictu.edu.vn').toLowerCase()
                            : null;
                        if (!objectClass[f[2]]) {
                            objectClass[f[2]] = [];
                            objectClass[f[2]].push(f);
                        } else {
                            if (Array.isArray(objectClass[f[2]])) {
                                objectClass[f[2]].push(f);
                            }
                        }
                        if (!objectStudentCode[f[1]]) {
                            objectStudentCode[f[1]] = [];
                            objectStudentCode[f[1]].push(f);
                        } else {
                            if (Array.isArray(objectStudentCode[f[1]])) {
                                objectStudentCode[f[1]].push(f);
                            }
                        }
                        i = i + 1;
                    } else {
                    }
                } else {
                }
            }
        });
        let j = 0;
        Object.keys(objectClass).forEach((f, key) => {
            setTimeout(() => {
                const arrStudent = [];
                objectClass[f].forEach((o, okey) => {
                    arrStudent.push(o[1].toLowerCase());
                });
                const condition = this.httpHelper
                    .paramsConditionBuilder([
                        {
                            conditionName: 'class_id',
                            condition: OvicQueryCondition.equal,
                            value: f,
                        },
                        {
                            conditionName: 'status',
                            condition: OvicQueryCondition.notEqual,
                            value: '-1',
                            orWhere: 'and',
                        },
                    ])
                    .set('pluck', 'student_id,user_id');
                forkJoin([
                    this.classesService.getTnClassesByItem(f, 'id'),
                    this.elngUserProfileService.getElngUserProfileByItem(
                        arrStudent.toString(),
                        'student_code'
                    ),
                    this.classStudentService.getClassStudentByCols(condition),
                ]).subscribe(
                    ([_resClass, _resStudent, _resClassStudent]) => {
                        const objectClassStudent = {};
                        _resClassStudent.forEach((c) => {
                            if (!objectClassStudent[c.user_id]) {
                                objectClassStudent[c.user_id] = c;
                            }
                        });
                        objectClass[f].forEach((s, skey) => {
                            const index_ = _resStudent.findIndex(
                                (m) => m.student_code === s[1]
                            );
                            if (index_ !== -1) {
                                if (
                                    !objectClassStudent[
                                    _resStudent[index_].user_id
                                    ]
                                ) {
                                    const newClassStudent = {
                                        user_id: _resStudent[index_].user_id,
                                        class_id: _resClass[0].id,
                                        status: 1,
                                        student_id: _resStudent[index_].id,
                                        user_info: {
                                            name: _resStudent[index_].name,
                                            full_name:
                                                _resStudent[index_].full_name,
                                            birthday:
                                                _resStudent[index_].birthday,
                                            student_code:
                                                _resStudent[
                                                    index_
                                                ].student_code.toLowerCase(),
                                            email: _resStudent[index_]
                                                .student_code
                                                ? _resStudent[
                                                    index_
                                                ].student_code
                                                    .toLowerCase()
                                                    .concat('@ictu.edu.vn')
                                                : null,
                                        },
                                        hocky: _resClass[0].hocky,
                                        namhoc: _resClass[0].namhoc,
                                    };
                                    const newUserCourse = {
                                        user_id: _resStudent[index_].user_id,
                                        class_id: _resClass[0].id,
                                        status: 1,
                                        course_id: _resClass[0].course_id,
                                        activer_id: this.userId,
                                        type_student: 'be_registered',
                                    };
                                    objectAddStudent[
                                        _resStudent[index_].user_id
                                            .toString()
                                            .concat(
                                                '_',
                                                _resClass[0].id.toString()
                                            )
                                    ] = {};
                                    objectAddStudent[
                                        _resStudent[index_].user_id
                                            .toString()
                                            .concat(
                                                '_',
                                                _resClass[0].id.toString()
                                            )
                                    ]['newClassStudent'] = newClassStudent;
                                    objectAddStudent[
                                        _resStudent[index_].user_id
                                            .toString()
                                            .concat(
                                                '_',
                                                _resClass[0].id.toString()
                                            )
                                    ]['newUserCourse'] = newUserCourse;
                                } else {
                                    // this.countProgressStudent(i);
                                }
                            } else {
                                this.duplicateStudent.push(s);
                                // this.countProgressStudent(i);
                            }
                        });
                        j = j + 1;
                        if (j === Object.keys(objectClass).length) {
                            Object.keys(objectAddStudent).forEach(
                                (ob, keyOb) => {
                                    setTimeout(() => {
                                        this.addClassStudent(
                                            objectAddStudent[ob][
                                            'newClassStudent'
                                            ],
                                            objectAddStudent[ob][
                                            'newUserCourse'
                                            ],
                                            Object.keys(objectAddStudent)
                                                .length,
                                            keyOb
                                        );
                                    }, keyOb * 100);
                                }
                            );
                        }
                    },
                    () => this.noitifi.toastError('Thêm thất bại')
                );
            }, key * 100);
        });
    }

    addClassStudent(
        object: any,
        object_userCourse: any,
        maxLenght: number,
        key: number
    ) {
        const condition = this.httpHelper.paramsConditionBuilder([
            {
                conditionName: 'class_id',
                condition: OvicQueryCondition.equal,
                value: object['class_id'],
            },
            {
                conditionName: 'user_id',
                condition: OvicQueryCondition.equal,
                value: object['user_id'],
                orWhere: 'and',
            },
        ]);
        this.classStudentService
            .getClassStudentByCols(condition)
            .subscribe((check) => {
                if (check.length) {
                    this.countProgressStudent(maxLenght);
                } else {
                    forkJoin([
                        this.classStudentService.addClassStudent(object),
                    ]).subscribe(
                        (res) => {
                            this.countProgressStudent(maxLenght);
                        },
                        () => this.noitifi.toastError('Thêm thất bại')
                    );
                }
            });
    }

    exportClass() {
        if (Object.keys(this.objectFilter).length === 0) {
            this.noitifi.toastWarning('Vui lòng chọn năm học và học kỳ');
        } else if (!this.objectFilter['namhoc']) {
            this.noitifi.toastWarning('Vui lòng chọn năm học');
        } else if (!this.objectFilter['hocky']) {
            this.noitifi.toastWarning('Vui lòng chọn học kỳ');
        } else {
            const condition = this.httpHelper
                .paramsConditionBuilder([
                    {
                        conditionName: 'namhoc',
                        condition: OvicQueryCondition.equal,
                        value: this.objectFilter['namhoc'],
                    },
                    {
                        conditionName: 'hocky',
                        condition: OvicQueryCondition.equal,
                        value: this.objectFilter['hocky'],
                        orWhere: 'and',
                    },
                    {
                        conditionName: 'status',
                        condition: OvicQueryCondition.notEqual,
                        value: '-1',
                        orWhere: 'and',
                    },
                ])
                .set(
                    'pluck',
                    'id,name,sotinchi,course_info,manager_info,hocky,khoa,namhoc,link_googlemeet,course_id'
                );
            this.classesService
                .getClassesByCols(condition)
                .subscribe((_resClass) => {
                    if (_resClass.length) {
                        const newClass = [];
                        _resClass.forEach((f, key) => {
                            f['linkGoogleMeet'] = f.link_googlemeet
                                ? f.link_googlemeet[
                                    f.link_googlemeet.length - 1
                                ].link
                                : '';
                            f['hocphan'] = f.course_info
                                ? f.course_info['title']
                                : '';
                            f['giangvien'] = f.manager_info
                                ? f.manager_info.split('*')[0]
                                : '';
                            newClass.push(f);
                        });
                        this.convertDataToExportExcel(
                            newClass,
                            'Trường Đại học Công nghệ thông tin và truyền thông'
                        );
                    } else {
                        this.noitifi.toastInfo(
                            'Không có giữ liệu được tìm thấy'
                        );
                    }
                });
        }
    }

    convertDataToExportExcel(data, tenDonvi: string) {
        const dataExport = [];
        const header = [
            'STT',
            'Tên lớp',
            'Mã lớp',
            'Số tín chỉ',
            'Năm học',
            'Học kỳ',
            'Khóa mở',
            'Học phần',
            'Giảng viên',
            'Link google meet',
        ];
        data.forEach((f, key) => {
            dataExport.push([
                key + 1,
                f['name'],
                f['id'],
                f['sotinchi'],
                f['namhoc'],
                f['hocky'],
                f['khoa'],
                f['hocphan'],
                f['giangvien'],
                f['linkGoogleMeet'],
            ]);
        });
        const titleFont = {
            name: 'Times New Roman',
            family: 1,
            size: 18,
            bold: true,
        };
        const rowFont = { name: 'Times New Roman', family: 1, size: 11 };
        const donviFont = {
            name: 'Times New Roman',
            family: 1,
            size: 11,
            bold: true,
        };
        this.exportExcelService.exportExcel(
            dataExport,
            header,
            'Danh sách sinh viên năm học '.concat(
                this.objectFilter['namhoc'],
                ' - học kỳ: ',
                this.objectFilter['hocky']
            ),
            titleFont,
            'E1:M2',
            rowFont,
            rowFont,
            tenDonvi,
            donviFont,
            null,
            null,
            null,
            null,
            ' '.concat(
                this.objectFilter['namhoc'],
                ' - học kỳ: ',
                this.objectFilter['hocky']
            )
        );
    }

    countProgressStudent(maxLength: number) {
        this.countProgressValue = this.countProgressValue + 1;
        this.progressValue = (this.countProgressValue / maxLength) * 100;
        if (this.countProgressValue === maxLength) {
            if (this.duplicateStudent && this.duplicateStudent.length !== 0) {
                this.modalService.open(
                    this.templateDuplicateStudent,
                    LARGE_MODAL_OPTIONS
                );
            }
            this.noitifi.toastSuccess('Thao tác thành công');
            this.startProgress = false;
            this.progressValue = 0;
            this.countProgressValue = 0;
            this.valueImport = null;
            this.initData();
        }
    }

    deleteStudentInClass() {
        this.noitifi.confirmDelete().then(
            (a) => {
                if (a) {
                    this.valueImport = null;
                    this.isImportClass = 'importDeleteStudent';
                    this.duplicateStudent = [];
                    this.inputImport.nativeElement.click();
                }
            },
            () => null
        );
    }

    startDelete(data) {
        this.startProgress = true;
        this.progressValue = 0;
        this.countProgressValue = 0;
        data.forEach((f, key) => {
            setTimeout(() => {
                this.elngUserProfileService
                    .getElngUserProfileByItem(
                        f[1].toLowerCase(),
                        'student_code'
                    )
                    .subscribe((_resUs) => {
                        if (_resUs.length) {
                            this.classStudentService
                                .getClassStudentByItem(
                                    _resUs[0].user_id.toString(),
                                    'user_id'
                                )
                                .subscribe((_rescs) => {
                                    const class_student_ids = [];
                                    _rescs.forEach((cs) => {
                                        class_student_ids.push(cs.id);
                                    });
                                    if (class_student_ids.length) {
                                        forkJoin([
                                            this.classHomeworkPostService.deleteClassHomeworkPostByCol(
                                                class_student_ids.toString(),
                                                'class_student_id'
                                            ),
                                            this.classStudentService.deleteClassStudentByCol(
                                                _resUs[0].user_id.toString(),
                                                'user_id'
                                            ),
                                        ]).subscribe(() => {
                                            this.countProgressStudent(
                                                data.length
                                            );
                                        });
                                    } else {
                                        this.countProgressStudent(data.length);
                                    }
                                });
                        } else {
                            this.countProgressStudent(data.length);
                        }
                    });
            }, key * 100);
        });
    }

    downLoadExStudent() {
        this.fileService
            .getFileContent(
                '..\\assets\\files\\Danh_sach_sinhvien_theo_lophocphan_mau.xlsx'
            )
            .subscribe((res) => {
                saveAs(res, 'Danh_sach_sinhvien_theo_lophocphan_mau.xlsx');
            });
    }

    downLoadExDelete() {
        this.fileService
            .getFileContent(
                '..\\assets\\files\\file_mau_xoa_sinh_vien_khoi_lophp.xlsx'
            )
            .subscribe((res) => {
                saveAs(res, 'file_mau_xoa_sinh_vien_khoi_lophp.xlsx');
            });
    }

    downLoadExClass() {
        this.fileService
            .getFileContent('..\\assets\\files\\file_mau_import_lophp.xlsx')
            .subscribe((res) => {
                saveAs(res, 'file_mau_import_lophp.xlsx');
            });
    }

    synchronized(object: Classes) {
        // this.startProgress = true;
        // this.progressValue = 0;
        // this.countProgressValue = 0;
        // this.userCoursesService.deleteUserCourseByCol(object.id.toString(), "class_id").subscribe(() => {
        //     if (object['student_array'].length) {
        //         object['student_array'].forEach((f, key) => {
        //             f['course_id'] = object.course_id;
        //             f['status'] = 1;
        //             setTimeout(() => {
        //                 this.userCoursesService.addUserCourses(f).subscribe(() => {
        //                     this.countProgress(object['student_array'].length);
        //                 })
        //             }, 100 * key)
        //         })
        //     }
        // })
    }

    syncCourse() {
        const condition_1 = this.httpHelper.paramsConditionBuilder([
            {
                conditionName: 'status',
                condition: OvicQueryCondition.notEqual,
                value: '-1',
                orWhere: 'and',
            },
        ]);
        forkJoin([
            this.classesService.getClassesByCols(condition_1),
            this.elnKhoaHocService.getElnKhoaHocByCols(condition_1),
        ]).subscribe(([_resClass, _rescourse]) => {
            const tmp = [];
            // _resClass.forEach((f, key) => {
            //     if (!f.category_id) {
            //         if (f.course_id) {
            //             const index = _rescourse.findIndex(m => m.id === f.course_id);
            //             if (index !== -1) {
            //                 f['category_id'] = _rescourse[index].category_ids[0];
            //             }
            //         } else if (f.manager_ids) {
            //             const index = this.listTeacher.findIndex(m => m.id === f.manager_ids[0]);
            //             if (index !== -1 && this.listTeacher[index].donvi_ids) {
            //                 f['category_id'] = this.listTeacher[index].donvi_ids[0];
            //             }
            //         }
            //         tmp.push(f);
            //     }
            // })

            this.startProgress = true;
            this.progressValue = 0;
            let i = 0;
            tmp.forEach((f, key) => {
                setTimeout(() => {
                    this.classesService
                        .updateDataClasses(f.id, { category_id: f.category_id })
                        .subscribe(() => {
                            i = i + 1;
                            this.progressValue = (i / tmp.length) * 100;
                            if (i === tmp.length) {
                                this.startProgress = false;
                                this.progressValue = 0;
                            }
                        });
                }, key * 100);
            });
        });
    }

    filterMyClass() {
        this.filterOwn = !this.filterOwn;
        this.pageIndex = 0;
        this.loadFirstPage();
        // this.loadFilterPage(this.objectFilter, 0, 20);
        // if (this.isGrid) {
        //     this.loadFilterPage(this.objectFilter, 0, 20);
        // } else {
        //     this.loadFilterPage(this.objectFilter, 0, 40);
        // }
    }

    loadFirstPage() {
        // if (!this.paginator.empty()) {
        //     this.paginator.changePage(0);
        // } else {
        // if (this.select_page > 0) {
        //     this.paginator.changePage(0);
        // } else {
        this.loadFilterPage(this.select_page + 1);
        // }
    }

    onChangeDonviCM(event) {
        if (event) {
            const arr_condition = [
                {
                    conditionName: 'status',
                    condition: OvicQueryCondition.notEqual,
                    value: '-1',
                    orWhere: 'and',
                },
                {
                    conditionName: 'donvi_id',
                    condition: OvicQueryCondition.equal,
                    value: this.donviId.toString(),
                    orWhere: 'and',
                },
                {
                    conditionName: 'type',
                    condition: OvicQueryCondition.equal,
                    value: 'bomon',
                    orWhere: 'and',
                },
                {
                    conditionName: 'donvi_chuyenmon_id',
                    condition: OvicQueryCondition.equal,
                    value: event.id.toString(),
                    orWhere: 'and',
                },
            ];

            const condition_nganh = this.httpHelper
                .paramsConditionBuilder(arr_condition)
                .set('limit', '-1');

            this.elnChuyenMucService
                .getElnChuyenMucByCols(condition_nganh)
                .subscribe({
                    next: (_category) => {
                        this.listCategory = _category;
                        // const index = this.listCategory.findIndex(m => m.id.toString() === this.fC['nganh_bomon_id'].value.toString());
                        this.loadCourse(event, 'category_ids');
                    },
                    error: () => { },
                });
        } else {
            this.listCategory = [];
        }
    }

    onChangeCheckAllInPage(event) {
        let tmpdata = [];
        if (event['checked']) {
            if (this.selectedClasses) {
                tmpdata = [...this.selectedClasses];
                this.listClass.forEach((f) => {
                    const index = this.selectedClasses.findIndex(
                        (m) => m.id === f.id
                    );
                    if (index === -1) {
                        tmpdata.push(f);
                    }
                });
            } else {
                this.selectedClasses = this.listClass;
            }
        } else {
            if (this.selectedClasses) {
                this.selectedClasses.forEach((f) => {
                    const index = this.listClass.findIndex(
                        (m) => m.id === f.id
                    );
                    if (index === -1) {
                        tmpdata.push(f);
                    }
                });
            }
        }
        this.selectedClasses = tmpdata;
    }

    // getClassStudentNoCouser() {
    //     forkJoin([
    //         this.classStudentService.getAllClassStudent(),
    //         this.elngUserProfileService.getAllElngUserProfile()
    //     ]).subscribe(([_resClassStudent, _resUser]) => {
    //         const ObjectUser = {};
    //         _resUser.forEach((f, key) => {
    //             if (!ObjectUser[f.user_id]) {
    //                 ObjectUser[f.user_id] = f;
    //             }
    //         })
    //         const tH = [];
    //         _resClassStudent.forEach((f, key) => {
    //             const user_info = {
    //                 name: ObjectUser[f.user_id].name,
    //                 full_name: ObjectUser[f.user_id].full_name,
    //                 birthday: ObjectUser[f.user_id].birthday,
    //                 student_code: ObjectUser[f.user_id].student_code,
    //                 email: ObjectUser[f.user_id].student_code.concat('@ictu.edu.vn')
    //             }
    //             setTimeout(() => {
    //                 this.classStudentService.updateClassStudent(f.id, { user_info: user_info }).subscribe();
    //             }, 200 * key)
    //         })
    //         // const next = [];
    //         // const ids = [];
    //         // tH.forEach((f,key) => {
    //         //     f['student_code'] = f.user_info.student_code;
    //         //     ids.push(f.id);
    //         //     // delete f.user_info;
    //         //     // delete f.student_id;
    //         //     // delete f.user_id;
    //         //     // delete f.namhoc;
    //         //     // delete f.hocky;
    //         //     // delete f.status;
    //         //     // delete f.created_at;
    //         //     // delete f.updated_at;
    //         //     // setTimeout(() => {
    //         //     //     this.classStudentService.deleteClassStudent(f.id).subscribe(_res=>{})
    //         //     // }, 200 * key)
    //         //     // next.push(f);

    //         // })
    //         // console.log(ids);
    //         // this.duplicateStudent = next;
    //         // console.log(next);
    //     })
    // }

    changeManagerClass() {
        const data = [];
        this.loopGetClass(data, 1, 1000);
    }

    loopGetClass(data, page, count) {
        if (data.length < count) {
            const option: ConditionOption = {
                condition: [
                    {
                        conditionName: 'status',
                        condition: OvicQueryCondition.notEqual,
                        value: '-1',
                        orWhere: 'and',
                    },
                    {
                        conditionName: 'manager_ids',
                        condition: OvicQueryCondition.like,
                        value: '%[%',
                        orWhere: 'and',
                    },
                ],
                set: [],
                page: page,
            };

            this.classesService.getClassesByPageNew(option).subscribe({
                next: (_res) => {
                    console.log(_res);
                    this.loopGetClass(
                        data.concat(_res.data),
                        page + 1,
                        _res.recordsFiltered
                    );
                },
                error: () => {
                    this.loopGetClass(data, page, count);
                },
            });
        } else {
            const data_ = [];
            let i = 0;
            data_[i] = [];
            data.forEach((f) => {
                if (data_[i].length < 2) {
                    data_[i].push(f);
                } else {
                    i = i + 1;
                    data_[i] = [];
                    data_[i].push(f);
                }
            });
            // this.modalService.open(this.templateWaiting, LARGE_MODAL_OPTIONS);
            this.startProgress = true;
            this.progressValue = 0;
            this.loopReclass(data_[0], data_, 0);
        }
    }

    loopReclass(data: Classes[], datas, key) {
        if (key < datas.length) {
            this.progressValue = ((key + 1) / datas.length) * 100;
            console.log(this.progressValue);
            const request: Observable<any>[] = [];
            data.forEach((f) => {
                if (f.manager_ids) {
                    request.push(
                        this.classesService.updateDataClasses(f.id, {
                            manager_ids: f.manager_ids.replace(
                                /\[|\]|\,/gi,
                                '|'
                            ),
                        })
                    );
                }
            });

            forkJoin(request).subscribe({
                next: () => {
                    this.loopReclass(datas[key + 1], datas, key + 1);
                },
                error: () => {
                    this.loopReclass(datas[key + 1], datas, key + 1);
                },
            });
        } else {
            this.modalService.dismissAll();
        }
    }

    /** đồng bộ bảng activity */

    getStudentActivi() {
        const data = [];
        // this.loopGetDataActivity(data, 1, 1000);
        return;
        this.loopGetClass_activity(data, 1, 1000);
    }

    loopGetClass_activity(data, page, count) {
        if (data.length < count) {
            console.log((data.length / count) * 100);
            const condition: ConditionOption = {
                condition: [
                    {
                        conditionName: 'status',
                        condition: OvicQueryCondition.notEqual,
                        value: '-1',
                    },
                ],
                set: [{ label: 'limit', value: '5' }],
                page: page,
            };

            this.classesService
                .getClassesByPageNew(condition)
                .pipe(
                    mergeMap((_class) => {
                        const class_ids = [];
                        const course_ids = [];
                        _class.data.forEach((f) => {
                            class_ids.push(f.id);
                            course_ids.push(f.course_id);
                        });

                        let newCouser_id = [...new Set(course_ids)];
                        if (class_ids.length) {
                            const condition_class: ConditionOption = {
                                condition: [
                                    {
                                        conditionName: 'status',
                                        condition: OvicQueryCondition.notEqual,
                                        value: '-1',
                                    },
                                ],
                                set: [
                                    {
                                        label: 'include',
                                        value: class_ids.toString(),
                                    },
                                    { label: 'include_by', value: 'class_id' },
                                    { label: 'limit', value: '-1' },
                                ],
                                page: null,
                            };

                            const condition_lesson: ConditionOption = {
                                condition: [
                                    {
                                        conditionName: 'status',
                                        condition: OvicQueryCondition.notEqual,
                                        value: '-1',
                                    },
                                ],
                                set: [
                                    {
                                        label: 'include',
                                        value: newCouser_id.toString(),
                                    },
                                    { label: 'include_by', value: 'course_id' },
                                    { label: 'limit', value: '-1' },
                                ],
                                page: null,
                            };

                            return forkJoin([
                                this.classStudentService.getClassStudentByPageNew(
                                    condition_class
                                ),
                                this.elnBaiHocService.getLessonByPageNew(
                                    condition_lesson
                                ),
                            ]).pipe(
                                mergeMap(([_student, _lesson]) => {
                                    _lesson.data.forEach((f) => {
                                        f['count'] = 0;
                                    });

                                    _class.data.forEach((f) => {
                                        f['student_list'] =
                                            _student.data.filter(
                                                (m) => m.class_id === f.id
                                            );
                                        f['lesson_list'] = _lesson.data.filter(
                                            (m) => m.course_id === f.course_id
                                        );
                                    });
                                    return of(_class);
                                })
                            );
                        }
                        return of(_class);
                    })
                )
                .subscribe({
                    next: (_res) => {
                        // this.initThongkeTuongtac(_res.data);
                        this.loopGetClass_activity(
                            data.concat(_res.data),
                            page + 1,
                            _res.recordsFiltered
                        );
                    },
                    error: () => { },
                });
        } else {
            this.initThongkeTuongtac(data);
        }
    }

    initThongkeTuongtac(data_class) {
        const request: Observable<any>[] = [];
        const data = [];
        this.loopGetDataActivity([], 0, 1000, data_class);
    }

    getDataActivityFromJson(Object) {
        if (Array.isArray(Object)) {
            const index = Object.findIndex((m) => m.type === 'table');
            if (index !== -1) {
                return Object[index].data;
            }
            return Object;
        }
        return Object;
    }
    loopGetDataActivity(data, page, count, data_class) {
        forkJoin([
            this.fileService.getFileLocalAsJson('..\\assets\\json\\student_activity_1.json'),
            this.fileService.getFileLocalAsJson(
                '..\\assets\\json\\student_activity_2.json'
            ),
            this.fileService.getFileLocalAsJson(
                '..\\assets\\json\\student_activity_3.json'
            ),
        ]).subscribe(([_activity_1, _activity_2, _activity_3]) => {
            console.log(_activity_1);
            const data_json = this.getDataActivityFromJson(_activity_1).concat(
                this.getDataActivityFromJson(_activity_2),
                this.getDataActivityFromJson(_activity_3)
            );

            const object_check = {};
            const data_filter = [];
            data_json.forEach((ac, key) => {
                ac.content = JSON.parse(ac.content);

                if (!object_check[ac.id]) {
                    object_check[ac.id] = ac;
                    data_filter.push(ac);
                    if (key === 0) {
                        console.log(ac);
                    }
                }
            });

            console.log(data_filter);

            let _lesson_report = [];

            data_class.forEach((f, key) => {
                // console.log(key);
                const _resLesson = f.lesson_list;
                const _class_student = f.student_list;
                console.log(key);
                _resLesson.forEach((_r) => {
                    const count = data_filter.filter(
                        (m) =>
                            m.content &&
                            m.content.lesson &&
                            m.content.lesson.toString() === _r.id.toString() &&
                            _class_student.findIndex(
                                (c) =>
                                    c.student_id.toString() ===
                                    m.student_id.toString()
                            ) !== -1
                    ).length;
                    _r['class_id'] = f.id;
                    _r['count'] = _r['count'] + count;
                });

                if (
                    _resLesson &&
                    _resLesson.length &&
                    _class_student &&
                    _class_student.length
                ) {
                    _lesson_report = _lesson_report.concat(
                        _resLesson.filter((m) => m.parent_id)
                    );
                }
                // if (_resLesson.length && _class_student.length) {
                //     data_json.forEach(ac => {
                //         ac.content = JSON.parse(ac.content);
                //         console.log(ac.content);
                //         const index_class = _class_student.findIndex(m => m.student_id === ac.student_id);
                //         const index_lesson = _resLesson.findIndex(m => ac.content && ac.content.lesson && m.id === ac.content.lesson);
                //         if (index_class !== -1 && index_lesson !== -1) {
                //             f.lesson_list[index_lesson]['count'] = f.lesson_list[index_lesson]['count'] + 1;

                //             // ac['class_id'] = f.id;
                //         }
                //     })
                // }
            });

            let i = 0;
            const data_next = [];
            data_next[i] = [];
            _lesson_report.forEach((ac) => {
                if (data_next[i].length < 6) {
                    data_next[i].push(ac);
                } else {
                    i = i + 1;
                    data_next[i] = [];
                    data_next[i].push(ac);
                }
            });

            this.loopUpdateStudentActivi(data_next[0], data_next, 0);
            // const data_json = _activity_1.data.concat(_activity_2.dat)
            // const reader = new FileReader();
            // reader.readAsBinaryString(_activity_1);
            // reader.readAsBinaryString(_activity_2);
            // reader.readAsBinaryString(_activity_3);
            // reader.onloadend = (event) => {
            //     console.log(event);
            //     // const localUrl = reader.result;
            //     // const json = JSON.parse(localUrl.toString());
            //     // console.log(json);

            // };
        });
        // let check = count;
        // // if (count > 10000) {
        // //     check = 10000
        // // }
        // if (data.length < check) {
        //     console.log(data.length / check * 100);
        //     const ar = [
        //         { conditionName: 'content', condition: OvicQueryCondition.like, value: '%lesson%' },
        //         { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: '0', orWhere: 'and' },
        //         { conditionName: 'lesson_id', condition: OvicQueryCondition.equal, value: '0', orWhere: 'and' }
        //     ];
        //     const condition: ConditionOption = {
        //         condition: ar,
        //         set: [
        //             { label: 'limit', value: '900' },
        //         ],
        //         page: page
        //     }

        //     this.activityLogService.getActivityLogHeadByPageNew(condition).subscribe({
        //         next: _res => {
        //             this.loopGetDataActivity(data.concat(_res.data), page + 1, _res.recordsFiltered, data_class);

        //         }, error: () => {

        //         }
        //     })
        // } else {
        //     data_class.forEach(f => {
        //         const _resLesson = f.lesson_list;
        //         const _class_student = f.student_list;
        //         if (_resLesson.length && _class_student.length) {
        //             data.forEach(ac => {
        //                 const index_class = _class_student.findIndex(m => m.student_id === ac.student_id);
        //                 const index_lesson = _resLesson.findIndex(m => ac.content && ac.content.lesson && m.id === ac.content.lesson);
        //                 if (index_class !== -1 && index_lesson !== -1) {
        //                     f.lesson_list[index_lesson]['count'] = f.lesson_list[index_lesson]['count'] + 1;
        //                     // ac['class_id'] = f.id;
        //                 }
        //             })
        //         }
        //     })

        //     let i = 0;
        //     const data_next = [];
        //     data_next[i] = [];
        //     console.log(data_class);
        //     // _res.data.forEach(ac => {
        //     //     if (ac['class_id']) {
        //     //         if (data_next[i].length < 6) {
        //     //             data_next[i].push(ac);
        //     //         } else {
        //     //             i = i + 1;
        //     //             data_next[i] = [];
        //     //             data_next[i].push(ac);
        //     //         }
        //     //     }
        //     // })
        //     //this.loopUpdateStudentActivi(data_next[0], data_next, 0);
        //     console.log(data);
        //     console.log(data_class);

        // }
    }

    loopUpdateStudentActivi(object, data, key) {
        if (key < data.length) {
            const request: Observable<any>[] = [];
            console.log(((key + 1) / data.length) * 100);
            object.forEach((f) => {
                request.push(
                    this.reportActivityService.addReportStudentActivity({
                        class_id: f.class_id,
                        number: f.count,
                        lesson_id: f.id,
                        lesson_type: f.type,
                    })
                );
            });

            if (request.length) {
                forkJoin(request).subscribe({
                    next: () => {
                        this.loopUpdateStudentActivi(
                            data[key + 1],
                            data,
                            key + 1
                        );
                    },
                    error: () => { },
                });
            } else {
                this.loopUpdateStudentActivi(data[key + 1], data, key + 1);
            }
        } else {
            console.log('done');
        }
    }

    // loopGetActiveStudent(object, data, key, acitvity) {
    //     if (key < data.length) {
    //         console.log((key + 1) / data.length * 100);
    //         const request: Observable<any>[] = [];
    //         object.request.subscribe({
    //             next: (active) => {

    //                 active.data.forEach(f => {
    //                     f['class_id'] = object.class_id;
    //                 })

    //                 this.loopGetActiveStudent(data[key + 1], data, key + 1, acitvity.concat(active.data));
    //             },
    //             error: () => {

    //             }
    //         })
    //     } else {
    //         console.log(acitvity)
    //     }
    // }

    // loopGetStudentClass(data_student, class_id, page, count, data_class) {
    //     if (data_student.length < count) {
    //         const condition: ConditionOption = {
    //             condition: [
    //                 { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1' },
    //                 { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: class_id.toString(), orWhere: 'and' }
    //             ],
    //             set: [
    //                 { label: 'limit', value: '500' }
    //             ],
    //             page: page
    //         }

    //         this.classStudentService.getClassStudentByPageNew(condition).subscribe(_student => {
    //             this.loopGetStudentClass(data_student.concat(_student.data),data_class[])
    //         })
    //     }
    // }
}
