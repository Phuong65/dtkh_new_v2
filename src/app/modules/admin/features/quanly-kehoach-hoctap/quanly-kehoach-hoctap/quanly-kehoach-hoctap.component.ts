import { RadioButtonModule } from 'primeng/radiobutton';
import { CourseFormTxService, SINHDETX } from '@shared/services/course-form-tx.service';
import { CourseFormCcService, SINHDECC } from '@shared/services/course-form-cc.service';

import { CoursePlanBankService } from './../../../../shared/services/course-plan-bank.service';
import { SINHDE } from './../../../../shared/services/course-plan-activities.service';
import { CoursePlanActivities } from '@shared/models/course-plan-activities';
import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';
import { Component, OnInit, ElementRef, TemplateRef, AfterViewInit, inject, viewChild } from '@angular/core';
import { OvicFlexibleColumn, OvicFlexibleTopbarRight, OvicMenu, OvicMenuItem } from '@shared/models/ovic-flexible-table';
import { ElnKhoaHocService } from '@shared/services/elearning-khoa-hoc.service';
import { EXAMFORMAT, ElnKhoaHoc } from '@shared/models/elng-khoa-hoc';
import { UserService } from '@core/services/user.service';
import { ElnChuyenMucService } from '@shared/services/elearning-chuyen-muc.service';
import { ElnChuyenMuc } from '@shared/models/Elng';
import { FileService } from '@core/services/file.service';
import { ElnBaiHocService } from '@shared/services/elearning-bai-hoc.service';
import { User, SimpleUser } from '@core/models/user';
import { Role } from '@core/models/role';
import { Observable, of, throwError, filter, forkJoin } from 'rxjs';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CHUAN_DAU_RA, KEY_ANSWER_new, LARGE_MODAL_OPTIONS, MAXIMIZE_MODAL_OPTIONS, NORMAL_MODAL_OPTIONS, ROLES, TYPE_FILE_LIST, WAITING_POPUP } from '@shared/utils/syscat';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { HelperService } from '@core/services/helper.service';
import { AuthService } from '@core/services/auth.service';
import { OrWhereCondition, OvicQueryCondition } from '@core/models/dto';
import { ActivatedRoute, ActivationEnd, NavigationEnd, Router, RouterModule, RoutesRecognized } from '@angular/router';
import { catchError, map, mergeMap } from 'rxjs/operators';
import * as XLSX from 'xlsx';
import { ElnLessonTestService } from '@shared/services/elearning-lesson-test.service';
import { saveAs } from 'file-saver';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { ExportExcelNewService } from '@shared/services/export-excel-new.service';
import { ElnBaiHoc } from '@shared/models/elng-bai-hoc';
import { NotificationService } from '@core/services/notification.service';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { DonViService } from '@modules/shared/services/don-vi.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { DonVi } from '@modules/shared/models/don-vi';
import { Paginator, PaginatorModule } from 'primeng/paginator';
import { ElnLessonTestQuestionService } from '@modules/shared/services/elearning-lesson-test-question.service';
import { ElnLessonTestQuestion } from '@modules/shared/models/elng-lesson-test-question';
import { LoaivbService } from '@modules/shared/services/loaivb.service';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { ClassHomeworkPostService } from '@modules/shared/services/class-homework-post.service';
import { TREE } from '@modules/shared/components/tree-custom/tree-custom.component';
import { MediaFolderService } from '@modules/shared/services/media-folder.service';
import { OvicFile } from '@core/models/file';
import { BUTTON_CLOSED, BUTTON_NO, BUTTON_YES } from '@core/models/buttons';
import { CourseQuestionsService } from '@modules/shared/services/course-questions.service';
import { CourseQuestionFormService } from '@modules/shared/services/course-question-form.service';
import { VideoMarkerQuestionService } from '@modules/shared/services/video-marker-question.service';
import { VideoMarkerService } from '@modules/shared/services/video-marker.service';
import { CourseThanhvienService } from '@modules/shared/services/course-thanhvien.service';
import { APP_CONFIGS } from '@env';
import { CoursePlanBank } from '@modules/shared/models/course-plan-bank';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { SharedModule } from '@modules/shared/shared.module';
import { DialogModule } from 'primeng/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatMenuModule } from '@angular/material/menu';
import { ImportHoidongDuyetComponent } from '../import-hoidong-duyet/import-hoidong-duyet.component';
import { ImportCanbothiComponent } from '../import-canbothi/import-canbothi.component';
import { OvicGroupsRadioV2Component } from '@modules/shared/components/ovic-groups-radio-v2/ovic-groups-radio-v2.component';



@Component({
    standalone: true,
    imports: [
    RouterModule,
    CommonModule,
    PaginatorModule,
    TableModule,
    SharedModule,
    DialogModule,
    MatProgressBarModule,
    RadioButtonModule,
    MatMenuModule,
    MatListModule,
    FormsModule,
    ReactiveFormsModule,
    ImportHoidongDuyetComponent,
    ImportCanbothiComponent,
    OvicGroupsRadioV2Component
],
    selector: 'app-quanly-kehoach-hoctap',
    templateUrl: './quanly-kehoach-hoctap.component.html',
    styleUrls: ['./quanly-kehoach-hoctap.component.css']
})
export class QuanlyKehoachHoctapComponent implements OnInit {
    private helperService = inject(HelperService);
    private modalService = inject(NgbModal);
    private elnKhoaHocService = inject(ElnKhoaHocService);
    private userService = inject(UserService);
    formBuilder = inject(FormBuilder);
    private auth = inject(AuthService);
    private fileService = inject(FileService);
    private elnBaiHocService = inject(ElnBaiHocService);
    private activatedRoute = inject(ActivatedRoute);
    private noitifi = inject(NotificationService);
    private httpHepler = inject(HttpParamsHeplerService);
    private donViService = inject(DonViService);
    private elngUserProfileService = inject(ElngUserProfileService);
    private elnChuyenMucService = inject(ElnChuyenMucService);
    private router = inject(Router);
    private courseThanhvienService = inject(CourseThanhvienService);
    private coursePlanActivitiesService = inject(CoursePlanActivitiesService);
    private courseQuestionsService = inject(CourseQuestionsService);
    private coursePlanBankService = inject(CoursePlanBankService);
    private courseFormCcService = inject(CourseFormCcService);
    private courseFormTxService = inject(CourseFormTxService);


    readonly inputImport = viewChild<ElementRef>('inputImport');
    readonly templateWaiting = viewChild<ElementRef>('templateWaiting');
    readonly templatePmsCttdg = viewChild<TemplateRef<any>>('templatePmsGiangvien');
    readonly paginator = viewChild<Paginator>('paginator');
    readonly templateFilter = viewChild<TemplateRef<any>>('templateFilter');
    readonly templateBaiHoc = viewChild<TemplateRef<any>>('templateBaiHoc');
    readonly templateQuanlyde = viewChild<TemplateRef<any>>('templateQuanlyde');
    readonly templateFolder = viewChild<TemplateRef<any>>('templateFolder');
    readonly templateFolderSelect = viewChild<ElementRef>('templateFolderSelect');
    readonly templateCouresPlan = viewChild<TemplateRef<any>>('templateCouresPlan');
    readonly templatePmsHoidongduyet = viewChild<TemplateRef<any>>('templatePmsHoidongduyet');
    readonly templateImporthoidong = viewChild<TemplateRef<any>>('templateImporthoidong');
    readonly templateImporCbthi = viewChild<TemplateRef<any>>('templateImporCbthi');
    readonly templateTestWeek = viewChild<TemplateRef<any>>('templateTestWeek');
    readonly templateTestKynang = viewChild<TemplateRef<any>>('templateTestKynang');
    readonly templatePhanboCDRcauhoi = viewChild<TemplateRef<any>>('templatePhanboCDRcauhoi');
    readonly viewDocumentTempalte = viewChild<ElementRef>('viewDocumentTempalte');
    readonly templateKhoaHoc = viewChild<TemplateRef<any>>('templateKhoaHoc');

    displayModal = false;
    waitingTitle = 'Đang kiểm tra dữ liệu, vui lòng chờ...';
    keyAnswer = KEY_ANSWER_new;
    handleChangeDonviSubscription: Subscription;
    dmParent: ElnKhoaHoc[];
    khoahocId: number;
    dmKhoahoc: ElnKhoaHoc[];
    listTeacher: User[];
    listRoles: Role[];
    dmChuyenmuc: ElnChuyenMuc[];
    selectedKhoahoc: ElnKhoaHoc;
    formKhoaHoc: FormGroup;
    checkedCategory = [];
    categoryChildren: ElnChuyenMuc[];
    dmChuyenmucParent: ElnChuyenMuc[];
    idHighlight = null;
    donviId: number;
    formTitle = 'Tạo mới học phần';
    isAdmin = false;
    canAdded = false;
    isUpdated = false;
    showParent = false;
    titleIsValid = true;
    slugIsValid = true;
    isExpand = false;
    isOpenSettingBaihoc = false;
    disabledButtonNext = true;
    currentForm = 1;
    isChangeTitle = false;

    isManager = false;

    currentAuth: string;

    searchUser: string;

    titleForm = 'Danh sách học phần';

    myObj = {
        style: 'currency',
        currency: 'VND'
    };

    isChuyenVien = false;

    startProgress = false;

    progressValue = 0;

    isLanhDaoKhoa = false;

    objectFilter = {};

    limitCourse = 20;

    totalCourse: number;

    pageIndex = 0;


    listFilter = [
        { label: 'Tên học phần', key: 'title', value: 0 },
        { label: 'Mã học phần', key: 'maso', value: 0 },
        // { label: 'Người tạo', key: 'creator_name', value: 0 },
    ]

    nomalFilter = { key: 'title', value: '' };

    categoryFilter: number;

    teacherFilter: number;

    numberLessonFilter: number;

    courseIds: number[] = [];


    cols_course = [];

    donvi_chuyenmon_id: number;

    list_donvi_chuyenmon: DonVi[];

    list_nganh_bomon: ElnChuyenMuc[];

    readonly = false;

    action_table = [
        { label: 'Quản lý bài giảng', key: 'createLesson', icon: '<i class="fa fa-book" ></i>' },
        { label: 'Quản lý kho đề kiểm tra', key: 'createTest', icon: '<i class="fa fa-university" ></i>' },
        { label: 'Sửa', key: 'callEditingForm', icon: '<i class="fa fa-pencil-square-o" ></i>' },
        { label: 'Xoá toàn bộ bài giảng', key: 'requireDeleteLesson', icon: '<i class="fa fa-trash-o" ></i>' },
    ]

    select_page: number = 0;

    isLanhDaoBomon = false;

    bomon_id: number;

    listGiangvien: User[];

    phanquyen_taokehoach: boolean = false;

    data_import_check: any[] = [];

    kiemduyethoidong: boolean = false;

    kiemduyetuyvien: boolean = false;

    showhoidong = false;

    chuandaura = CHUAN_DAU_RA;

    list_week: CoursePlanActivities[];

    list_test_kynang: CoursePlanActivities[];

    label_week: string;

    number_test_config: any;

    pdfSrc: any;

    list_cdr_cauhoi: CoursePlanActivities[];

    EXAMFORMAT = EXAMFORMAT;

    current_url: string;

    constructor() {
        this.currentAuth = this.auth.user.id.toString();
        this.donviId = this.auth.user.donvi_id;
        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin) || this.auth.userHasRole(ROLES.chuyenvien_pdt) ? true : false;
        this.isLanhDaoKhoa = this.auth.userHasRole(ROLES.lanhdaokhoa);
        this.isLanhDaoBomon = this.auth.userHasRole(ROLES.lanhdaobomon);
        const url = this.router.url.substring(7).split('?')[0];
        this.canAdded = this.auth.userCanAdd(url);
        this.readonly = this.auth.userHasRole('duyet_baigiang') && this.auth.user.role_ids && this.auth.user.role_ids.length === 1 ? true : false;
        this.phanquyen_taokehoach = this.auth.userHasRole(ROLES.phanquyen_taokehoach) || this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin) ? true : false;

        this.kiemduyethoidong = this.auth.userHasRole(ROLES.kiemduyet_hoidong);

        this.kiemduyetuyvien = this.auth.userHasRole(ROLES.kiemduyet_uyvien);

        const actions = [];

        this.cols_course = [
            { label: 'TT', class: 'ovic-w-50px text-center', key: 'index_' },
            { label: 'Tên môn học', class: 'col-width-400', key: 'title' },
            { label: 'Mã môn', class: 'ovic-w-120px', key: 'maso' },
            // { label: 'Mã học phần', class: 'ovic-w-120px text-center', key: 'maso' },
            // { label: 'Bộ môn', class: 'col-width-400 text-left', key: 'bomon_name' },
            { label: 'Khoa quản lý', class: 'col-width-400 text-left', key: 'category_name' },
            { label: 'Số tín chỉ', class: 'ovic-w-120px text-center', key: 'sotinchi' },
            { label: 'Hình thức thi', class: 'ovic-w-120px text-center', key: 'hinhthucthi' },
            { label: 'Yêu cầu CDR', class: 'ovic-w-120px text-center', key: 'chuandaura' },
            { label: 'Giảng viên phụ trách', class: 'ovic-w-200px text-left', key: 'editor_name' },

            // { label: 'Số bài giảng', class: 'ovic-w-120px text-center', key: 'sobaigiang_per' },
            // { label: 'Người tạo', class: 'ovic-w-200px text-left', key: 'creator_name' },
        ]

        if (this.isLanhDaoKhoa || this.isManager) {
            this.action_table = [
                { label: 'Cập nhật nội dung giảng dạy', key: 'course-plan', icon: '<i class="fa fa-list-ul" ></i>' },
                { label: 'Phân quyền cập nhật nội dung', key: 'pms-create-plan', icon: '<i class="fa fa-list-ul" ></i>' },
            ]
        }

        this.formKhoaHoc = this.formBuilder.group(
            {
                title: ['', Validators.required],
                subtitle: [''],
                category_ids: ['', Validators.required],
                creator_id: [''],
                keyword: [''],
                slug: ['', Validators.required],
                desc: [''],
                files: [''],
                creator_name: [''],
                decuong: [''],
                maso: ['', Validators.required],
                status: [''],
                nganh_bomon_id: [''],
                sotinchi: ['', Validators.required],
                exam_format: [''],
                cdr: [''],
                sotinchi_th: ['', Validators.required]
            }
        );
    }

    get f() {
        return this.formKhoaHoc.controls;

    }



    ngOnInit(): void {
        const config = JSON.parse(localStorage.getItem('--app_configs-' + APP_CONFIGS.realm));

        const setting = config.find(m => m.config_key === 'SETTING')['params'];

        this.number_test_config = config.find(m => m.config_key === 'NUMOF_TEST_CCTX')['params']

        this.label_week = setting['plan']['prefix'];

        this.loadUserInfo();
    }

    checkUrlAvai() {
        // this.reloadPage = true;
        this.activatedRoute.queryParams.subscribe(
            params => {
                if (params && params['code']) {
                    const hocphanid = params['code'];
                } else {

                    // this.loadPageData(0, this.limitCourse);

                }
            }
        )
    }

    loadUserInfo() {
        const condition_donvi = this.httpHepler.paramsConditionBuilder([
            { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' },
            { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: this.auth.user.donvi_id.toString(), orWhere: 'and' },
        ]).set("limit", -1)

        forkJoin([
            this.elngUserProfileService.getElngUserProfileByCol('user_id', this.auth.user.id.toString()),
            this.donViService.getDonViByCols(condition_donvi)
        ]).subscribe(([_resUser, _resDonvi]) => {
            this.donvi_chuyenmon_id = _resUser[0] && _resUser[0].donvi_chuyenmon_id ? _resUser[0].donvi_chuyenmon_id : 0;
            this.bomon_id = _resUser[0] && _resUser[0].bomon_id ? _resUser[0].bomon_id : 0;
            this.list_donvi_chuyenmon = _resDonvi;
            this.loadPageData(1);
        })
    }



    loadPageData(start) { // start = page;
        //let category_id = this.auth.user.donvi_ids && this.auth.user.donvi_ids[0] ? this.auth.user.donvi_ids[0].toString() : null;
        const arrayCondition = [
            { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' },
        ];

        if (this.categoryFilter) {
            arrayCondition.push({ conditionName: 'category_ids', condition: OvicQueryCondition.equal, value: this.categoryFilter.toString(), orWhere: 'and' });
        }

        const likeSearch = ['title', 'creator_name', 'maso'];
        Object.keys(this.objectFilter).forEach(f => {
            if (likeSearch.findIndex(i => i === f) !== -1) {
                arrayCondition.push({ conditionName: f, condition: OvicQueryCondition.like, value: '%'.concat(this.objectFilter[f].toString(), '%'), orWhere: 'and' },);
            } else {
                arrayCondition.push({ conditionName: f, condition: OvicQueryCondition.equal, value: this.objectFilter[f].toString(), orWhere: 'and' },);
            }
        })




        if ((this.isManager || this.isLanhDaoKhoa || this.readonly) && this.teacherFilter) {
            arrayCondition.push({ conditionName: 'creator_plan_id', condition: OvicQueryCondition.equal, value: this.teacherFilter.toString(), orWhere: 'and' });
        }

        if (!this.isManager && !this.isLanhDaoKhoa && !this.readonly && !this.isLanhDaoBomon) {
            arrayCondition.push({ conditionName: 'creator_plan_id', condition: OvicQueryCondition.equal, value: this.auth.user.id.toString(), orWhere: 'and' });
        }

        if (!this.isManager && this.isLanhDaoKhoa) {
            arrayCondition.push({ conditionName: 'category_ids', condition: OvicQueryCondition.equal, value: this.donvi_chuyenmon_id.toString(), orWhere: 'and' });
        }

        if (!this.isManager && !this.isLanhDaoKhoa && this.isLanhDaoBomon) {
            arrayCondition.push({ conditionName: 'nganh_bomon_id', condition: OvicQueryCondition.equal, value: this.bomon_id.toString(), orWhere: 'and' });
        }

        let setCondition = [];
        if (this.numberLessonFilter) {
            if (this.numberLessonFilter.toString() === '1') {
                setCondition = [
                    { label: 'exclude', value: this.courseIds.toString() },
                    { label: 'exclude_by', value: 'id' },
                ]
            } else if (this.numberLessonFilter.toString() === '2') {
                setCondition = [
                    { label: 'include', value: this.courseIds.toString() },
                    { label: 'include_by', value: 'id' },
                ]
            }
        }

        setCondition.push({ label: 'orderby', value: 'title' });

        forkJoin([
            this.elnKhoaHocService.getKhoaHocByPageNew(arrayCondition, start, setCondition),
        ]).subscribe({
            next: ([_resCourse]) => {
                // this.dmChuyenmuc = this.sortData(_resChuyenmuc);
                const tmpData = [];
                let teacher_ids = [0];
                const courses_ids = [0];
                const chuyenmuc_ids = [];
                let bomon_ids = [0];
                _resCourse.data.forEach((f, key) => {
                    // const teacher_ids_re = f.teacher_ids ? f.teacher_ids.split("|").filter(m => m && m !== '') : [];
                    teacher_ids.push(f.creator_plan_id);
                    courses_ids.push(f.id);
                    chuyenmuc_ids.push(f.category_ids);
                    f['show_name'] = '['.concat(f.maso, '] - ', f.title);
                    bomon_ids.push(f.nganh_bomon_id);
                    if (f.params) {
                        if (f.params.sotinchi) {
                            f['sotinchi'] = f.params.sotinchi;
                        }

                        if (f.params.exam_format) {
                            const index = EXAMFORMAT.findIndex(m => m.key === f.params.exam_format);
                            if (index !== -1) {
                                f['hinhthucthi'] = EXAMFORMAT[index].label;
                            }
                        }

                        if (f.params.cdr) {
                            const index = CHUAN_DAU_RA.findIndex(m => m.id === f.params.cdr);
                            if (index !== -1) {
                                f['chuandaura'] = CHUAN_DAU_RA[index].label;
                            }
                        }


                    }
                })

                // const conditionLesson = this.httpHepler.paramsConditionBuilder(
                //     [
                //         { conditionName: 'type', condition: OvicQueryCondition.equal, value: 'LESSON' },
                //         { conditionName: 'status', condition: OvicQueryCondition.greaterThan, value: '-1', orWhere: 'and' },
                //         { conditionName: 'parent_id', condition: OvicQueryCondition.notEqual, value: '0', orWhere: 'and' },
                //     ]).set("select", "course_id,type,video,audio,slide,documents,other_video").set("include", courses_ids.toString()).set("include_by", "course_id").set("limit", "-1");
                bomon_ids = [...new Set(bomon_ids)];

                const condition_bomon: ConditionOption = {
                    condition: [],
                    set: [
                        { label: 'include', value: bomon_ids.toString() },
                        { label: 'include_by', value: 'id' }
                    ],
                    page: null
                }

                teacher_ids = [... new Set(teacher_ids)];
                forkJoin([
                    // this.elnBaiHocService.getElnBaiHocByCols(conditionLesson),

                    this.userService.getUserByItem(teacher_ids.toString(), "id"),
                    this.elnChuyenMucService.getChuyemucByPageNew(condition_bomon)
                ]).subscribe({
                    next: ([_resTeacher, _bomon]) => {
                        const result = [];
                        const _index_start = (start - 1) * 20;
                        _resCourse.data.forEach((f, key) => {
                            f["index_"] = _index_start + key + 1;
                            if (!f.checkedVideo) {
                                if (f.video_introduce && f.video_introduce.length !== 0) {
                                    f['checkedVideo'] = 'có';
                                } else {
                                    f['checkedVideo'] = 'không';
                                }
                            }

                            const index_category = f.category_ids ? this.list_donvi_chuyenmon.findIndex(m => m.id.toString() === f.category_ids.toString()) : -1;

                            f['category_name'] = index_category !== -1 ? this.list_donvi_chuyenmon[index_category].title : '';

                            f['editor_name'] = '';
                            const index_teacher = _resTeacher.findIndex(m => m.id === f.creator_plan_id);
                            if (index_teacher !== -1) {
                                f['editor_name'] = _resTeacher[index_teacher].display_name;
                            }

                            const _index_bomon = _bomon.data.findIndex(m => m.id === f.nganh_bomon_id);
                            if (_index_bomon !== -1) {
                                f['bomon_name'] = _bomon.data[_index_bomon].title;
                            }

                            result.push(f);
                        });

                        this.listTeacher = _resTeacher.filter(m => m.status !== -1).map(m => { m['newName'] = m.display_name.concat(" (", m.email, ")"); return m });
                        this.dmKhoahoc = result;
                    },
                    error: () => {
                        this.noitifi.toastError("Lỗi kết nối");
                    }
                })
                this.totalCourse = _resCourse.recordsFiltered;
            },
            error: () => {
                this.noitifi.toastError("Lỗi kết nối");
            }
        })
    }

    setNewDmKhoahoc(data, object) {
        const result = [];
        data.forEach(f => {
            const price = Number(f.price);
            const discount = Number(f.discount);
            // f['currency_price'] = price.toLocaleString('vi-VN', this.myObj);
            // f['currency_discount'] = discount.toLocaleString('vi-VN', this.myObj);
            if (!f.checkedVideo) {
                if (f.video_introduce && f.video_introduce !== 0) {
                    f['checkedVideo'] = 'có';
                } else {
                    f['checkedVideo'] = 'không';
                }
            }
            f['pmsAction'] = f.teacher_ids && f.teacher_ids.length && f.teacher_ids.findIndex(m => m.toString() === this.auth.user.id.toString()) !== -1 ? true : false;
            f['pmsAction'] = this.isManager || this.isLanhDaoKhoa || f.creator_id === this.auth.user.id ? true : f['pmsAction'];
            f['delAction'] = this.isManager || this.isLanhDaoKhoa ? true : false;
            f['sobaigiang_per'] = object[f.id] ? Number(object[f.id]).toString().concat("/", Number(f['sobaigiang']).toString()) : '0'.toString().concat("/", Number(f['sobaigiang']).toString());
            if (f['pmsAction']) {
                result.push(f);
            }
        });
        return result;
    }

    sortData(chuyenmucData: ElnChuyenMuc[]) {
        const parent = chuyenmucData.filter(m => m.parent_id === 0);
        this.dmChuyenmucParent = parent;
        let array = [];
        parent.forEach((f, key) => {
            if (f.parent_id === 0) {
                if (!f.showName) {
                    f.showName = f.title;
                }
                const children = chuyenmucData.filter(m => m.parent_id === f.id);
                const thisParent = [];
                thisParent.push(f);
                const temp = thisParent.concat(children);
                array = array.concat(temp);
            }
        });

        array.forEach((f, key) => {
            if (f.parent_id !== 0) {
                if (!f.showName) {
                    f.showName = '\xa0\xa0-'.concat(f.title);
                }
            }
        });

        return array;
    }

    closeForm() {
        this.isUpdated = false;
        this.isExpand = false;
        this.isOpenSettingBaihoc = false;
        this.noitifi.closeSideNavigationMenu();
    }

    actionsEvent(event, item: ElnKhoaHoc) {
        this.isUpdated = false;
        if (event) {
            this.selectedKhoahoc = item;
            this.khoahocId = item.id;
            switch (event.key) {
                case 'moveToLesson':
                    this.moveToLesson();
                    break
                case 'course-plan':
                    this.openCoursePlanTemplate();
                    break;
                case 'pms-create-plan':
                    if (this.phanquyen_taokehoach) {
                        this.loadGiangVien(false);
                        this.noitifi.openSideNavigationMenu({ template: this.templatePmsCttdg(), size: 500 });
                    } else {
                        this.noitifi.toastWarning('Bạn không có quyền');
                    }
                    break;
                case 'pms-duyet-plan':
                    this.loadHoidongDuyet(item);
                    break;
                default:
                    this.noitifi.toastWarning('Chức năng đang tạm khóa')
                    break;
            }
        }
    }

    loadGiangVien(filter) {
        let arrcondition = [
            { conditionName: 'teacher', condition: OvicQueryCondition.equal, value: '1', orWhere: 'and' },
        ]

        if (!this.isManager) {
            arrcondition.push({ conditionName: 'donvi_chuyenmon_id', condition: OvicQueryCondition.equal, value: this.donvi_chuyenmon_id.toString(), orWhere: 'and' })
        }

        const condition = this.httpHepler.paramsConditionBuilder(arrcondition).set("limit", -1).set('select', 'user_id');
        this.elngUserProfileService.getElngUserProfileByCols(condition).subscribe({
            next: _resGiangVien => {
                const user_ids = [];
                _resGiangVien.forEach(f => {
                    user_ids.push(f.user_id);
                })

                const condition_ = this.httpHepler.paramsConditionBuilder([
                    { conditionName: 'status', condition: OvicQueryCondition.equal, value: '1', orWhere: 'and' },
                ]).set("limit", -1).set('include', user_ids.toString()).set('include_by', 'id');
                this.userService.getUserByCols(condition_).subscribe(_user => {
                    _user.forEach(f => {
                        if (f.id === this.selectedKhoahoc.creator_plan_id) {
                            f['check'] = true;
                        } else {
                            f['check'] = false;
                        }

                        f['newName'] = f.display_name.concat(" (", f.email, ")");
                    })
                    this.listGiangvien = _user;
                })

            },
            error: () => this.noitifi.toastError("Lỗi kết nối")
        })
    }


    topBarRightEvent(event_name: string) {
        if (event_name) {
            switch (event_name) {
                case 'eventSearch':
                    this.loadGiangVien(true);
                    this.noitifi.openOvicFlexibleTemplate('templateFilter');
                    break;

                default:
                    break;
            }
        }
    }

    moveToLesson() {
        if (this.selectedKhoahoc.id) {
            // const code = this.auth.encryptData(`${this.auth.user.id}.${this.selectedKhoahoc.id}.${this.selectedKhoahoc.id}`);
            // const url = this.router.serializeUrl(
            //     this.router.createUrlTree(['/admin/danhmuc-hocphan'], { queryParams: { code } })
            // );
            // window.open(url, "_blank");
            return;
            this.helperService.moveLinkToCourse(this.selectedKhoahoc.id.toString())
        }
    }



    closeRightForm() {
        this.noitifi.closeSideNavigationMenu();
    }

    changePage(event) {
        this.select_page = event.page;

        this.loadPageData(event.page + 1);

        // this.loadPageData(event.page + 1);
    }

    filterAdvanced(value, filterList, key) {
        if (value) {
            const index = filterList.findIndex(m => m.key === key);
            if (index !== -1) {
                this.objectFilter[key] = value;
                filterList.forEach((f, key) => {
                    if (index !== key) {
                        delete this.objectFilter[f.key];
                    }
                })

            }
        } else {
            filterList.forEach((f, key) => {
                delete this.objectFilter[f.key];
            })
        }
    }

    searchSuccess() {
        this.filterAdvanced(this.nomalFilter.value, this.listFilter, this.nomalFilter.key);
        this.pageIndex = 0;
        if (this.numberLessonFilter) {
            const condition = this.httpHepler.paramsConditionBuilder([
                { conditionName: 'type', condition: OvicQueryCondition.equal, value: 'LESSON' },
                { conditionName: 'status', condition: OvicQueryCondition.greaterThan, value: '-1', orWhere: 'and' },
                { conditionName: 'parent_id', condition: OvicQueryCondition.notEqual, value: '0', orWhere: 'and' },
            ]).set("groupby", "course_id").set("select", "course_id").set("limit", -1);
            this.elnBaiHocService.getElnBaiHocByCols(condition).subscribe(_res => {
                const numberIds = [];
                _res.forEach(f => {
                    numberIds.push(f.course_id);
                })
                this.courseIds = numberIds;
                this.loadFirstPage();
            })
        } else {
            this.loadFirstPage();
        }
    }

    onChangeFilterChuyenmon(event) {
        if (event) {
            this.categoryFilter = event.id;
        } else {
            this.categoryFilter = null;
        }
    }

    onChangeFilterTeacher(event) {
        if (event) {
            this.teacherFilter = event.id;
        } else {
            this.teacherFilter = null;
        }
    }

    cancelSearch() {
        this.teacherFilter = null;
        this.categoryFilter = null;
        this.nomalFilter.key = 'title';
        this.nomalFilter.value = '';
        this.listFilter.forEach(f => {
            delete this.objectFilter[f.key];
        })
        this.numberLessonFilter = null;
        this.courseIds = [];
        this.pageIndex = 0;

        this.loadFirstPage();
    }

    reFilter() {
        this.loadGiangVien(true);
        this.noitifi.openSideNavigationMenu({ template: this.templateFilter(), size: 700 });
    }

    loadFirstPage() {
        const index = this.router.url.indexOf('duyetnoidung-hoctap');
        this.loadPageData(this.select_page + 1);

    }

    openCoursePlanTemplate() {
        this.router.navigate(['admin/kehoach-hoctap/chitiet-kehoach'], { queryParams: { code: this.selectedKhoahoc.id } })
        setTimeout(() => this.noitifi.closeLeftMenu(), 300);
        // this.noitifi.openSideNavigationMenu({ template: this.templateCouresPlan, size: window.innerWidth, offsetTop: '0px' })
    }

    closeFormLesson() {
        this.selectedKhoahoc = null;
        this.noitifi.closeSideNavigationMenu();
    }

    seacherKhoaHocWithTitle(event) {
        if (event) {
            this.objectFilter['title'] = event.target.value;
        }
        this.loadFirstPage();
    }

    changeSelecGiangvien(event: MatSelectionListChange) {
        const checked = this.listGiangvien.filter(m => m['check']);
        checked.forEach(f => {
            f['check'] = false;
        })

        const index = this.listGiangvien.findIndex(m => m.id === event.options[0].value.id);

        if (index !== -1) {
            this.listGiangvien[index]['check'] = !this.listGiangvien[index]['check']
        }
    }

    savePmsGiangVien() {
        const index = this.listGiangvien.findIndex(m => m['check']);
        if (index !== -1) {
            this.elnKhoaHocService.updateElnKhoaHoc(this.selectedKhoahoc.id, { creator_plan_id: this.listGiangvien[index].id }).subscribe({
                next: _res => {
                    this.noitifi.toastSuccess("Cập nhật thành công");
                    this.pageIndex = 0;
                    // this.loadFirstPage();
                    this.noitifi.closeSideNavigationMenu();
                },
                error: () => this.noitifi.toastError("Lỗi kết nối, cập nhật thất bại")
            })
        } else {
            this.noitifi.toastWarning('Vui lòng chọn giảng viên')
        }
    }

    loadHoidongDuyet(course: ElnKhoaHoc) {
        this.noitifi.openSideNavigationMenu({ template: this.templatePmsHoidongduyet(), size: 700 });
        // const condition: ConditionOption = {
        //     condition: [
        //         { conditionName: 'status', condition: OvicQueryCondition.equal, value: '1', orWhere: 'and' },
        //     ],
        //     set: [
        //         {label:'role_ids',''}
        //     ],
        //     page: null
        // }
    }

    onOpenImportTemplate() {
        this.noitifi.openSideNavigationMenu({ template: this.templateImporthoidong(), size: window.innerWidth, offsetTop: '0px' });
    }

    onGetFileImport() {
        inputImport.nativeElement.value = null;
        inputImport.nativeElement.click();
    }

    changeInputImport(event) {
        if (event.target.files[0]) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.readAsArrayBuffer(file);
            reader.onloadend = (event) => {
                const localUrl = reader.result;
                const wb: XLSX.WorkBook = XLSX.read(localUrl, { type: 'buffer' });
                const wsname: string = wb.SheetNames[0];
                const ws: XLSX.WorkSheet = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
                this.convertSqlToImportHoidong(data.filter(m => m[1] && m[9] && m[10]))
            };
        }
    }

    convertSqlToImportHoidong(data) {
        data.splice(0, 1);
        const user_create_plan = [];
        const hoidongduyet = [];
        const emails = [];
        const maso = [];
        const objectMaso = {};
        data.forEach(f => {
            if (!objectMaso[f[1].trim()]) {
                objectMaso[f[1].trim()] = true;

                maso.push(f[1].trim());

                const create_plan = {
                    maso: f[1].trim(),
                    email_user: f[9].toLowerCase(),
                    thuockhoa: f[7]
                }

                for (let i = 10; i < f.length; i++) {
                    if (f[i]) {
                        const data_duyet = {
                            maso: f[1].trim(),
                            email_user: f[i].toLowerCase().trim(),
                            vaitro: i === 10 ? 'CHUTICH' : 'UYVIEN'
                        }
                        emails.push(f[i].toLowerCase().trim());
                        hoidongduyet.push(data_duyet);
                    }
                }

                user_create_plan.push(create_plan);

                emails.push(f[9].toLowerCase().trim());
            }
        })

        let last_emails = [... new Set(emails)];

        let last_maso = [... new Set(maso)];


        let i = 0;
        const get_emails = [];
        const get_monhoc = [];

        last_emails.forEach(f => {
            if (!get_emails[i]) {
                get_emails[i] = [];
                get_emails[i].push(f);
            } else if (get_emails[i] && get_emails[i].length < 20) {
                get_emails[i].push(f);
            } else if (get_emails[i].length === 20) {
                i = i + 1;
                get_emails[i] = [];
                get_emails[i].push(f);
            }
        })

        let j = 0;
        last_maso.forEach(f => {
            if (!get_monhoc[j]) {
                get_monhoc[j] = [];
                get_monhoc[j].push(f);
            } else if (get_monhoc[j] && get_monhoc[j].length < 20) {
                get_monhoc[j].push(f);
            } else if (get_monhoc[j].length === 20) {
                j = j + 1;
                get_monhoc[j] = [];
                get_monhoc[j].push(f);
            }
        })

        this.displayModal = true;
        this.progressValue = 0;

        let data_show_import = [];
        this.waitingTitle = 'Đang tải dữ liệu khóa học, vui lòng chờ...';
        this.loopGetCourse(0, get_monhoc[0], get_monhoc, hoidongduyet, user_create_plan, data_show_import, get_emails);
    }

    loopGetCourse(key, data_maso, data_masos, hoidongduyet, user_create_plan, data_show_import, data_emails) {
        if (key < data_masos.length) {
            this.progressValue = (key + 1) / data_masos.length * 100;
            const condition: ConditionOption = {
                condition: [],
                set: [
                    { label: 'limit', value: '-1' },
                    { label: 'include', value: data_maso.toString() },
                    { label: 'include_by', value: 'maso' }
                ],
                page: null
            }

            this.elnKhoaHocService.getKhoaHocByPageNew_2(condition).subscribe({
                next: (_res_course) => {
                    data_show_import = data_show_import.concat(_res_course.data);
                    this.loopGetCourse(key + 1, data_masos[key + 1], data_masos, hoidongduyet, user_create_plan, data_show_import, data_emails);
                },
                error: () => {
                    this.noitifi.toastError("Lỗi kết nối, vui lòng thử lại");
                    this.displayModal = false;
                }
            })
        } else {
            this.progressValue = 0;
            this.displayModal = false;
            this.waitingTitle = 'Đang tải dữ liệu giảng viên, vui lòng chờ...';
            let giangviens = [];
            this.loopGetGiangVienByEmail(0, data_emails[0], data_emails, hoidongduyet, user_create_plan, data_show_import, giangviens)
        }
    }

    loopGetGiangVienByEmail(key, data_email, data_emails, hoidongduyet, user_create_plan, data_show_import, giangviens) {
        if (key < data_emails.length) {
            this.progressValue = (key + 1) / data_emails.length * 100;
            const condition: ConditionOption = {
                condition: [],
                set: [
                    { label: 'limit', value: '-1' },
                    { label: 'include', value: data_email.toString() },
                    { label: 'include_by', value: 'email' }
                ],
                page: null
            }

            this.userService.getUserByPageNew(condition).subscribe({
                next: (_res) => {
                    giangviens = giangviens.concat(_res.data);
                    this.loopGetGiangVienByEmail(key + 1, data_emails[key + 1], data_emails, hoidongduyet, user_create_plan, data_show_import, giangviens);
                    // data_show_import.push(_res.data);
                },
                error: () => {
                    this.noitifi.toastError("Lỗi kết nối, vui lòng thử lại");
                    this.displayModal = false;
                }
            })
        } else {

            hoidongduyet.forEach(f => {
                const index = giangviens.findIndex(m => m.email === f.email_user);
                if (index !== -1) {
                    f['user_id'] = giangviens[index].id;
                    f['user_name'] = giangviens[index].display_name;
                }
            })


            user_create_plan.forEach(f => {
                const index = giangviens.findIndex(m => m.email === f.email_user);
                if (index !== -1) {
                    f['user_edit_id'] = giangviens[index].id;
                    f['user_edit_name'] = giangviens[index].display_name;
                }

                const index_course = data_show_import.findIndex(m => m.maso === f.maso);
                if (index_course !== -1) {
                    f['course_name'] = data_show_import[index_course].title;
                    f['course_id'] = data_show_import[index_course].id;
                }

                const hoidong = hoidongduyet.filter(m => m.maso === f.maso);
                f['hoidong'] = hoidong;
                f['trangthai'] = 'Chưa import';
            })

            this.data_import_check = user_create_plan;
        }
    }

    startImportHoidong() {
        this.displayModal = true;
        this.progressValue = 0;
        this.waitingTitle = 'Đang đồng bộ dữ liệu, vui lòng chờ';
        this.loopAddHoidong(0, this.data_import_check[0], this.data_import_check);
    }

    loopAddHoidong(key, course, courses) {
        if (key < courses.length) {
            this.progressValue = (key + 1) / courses.length * 100;
            if (course['course_id']) {

                const data_edit = {
                    creator_plan_id: course['user_edit_id']
                }

                const request: Observable<any>[] = [this.elnKhoaHocService.updateElnKhoaHoc(course['course_id'], data_edit)];

                if (course['hoidong']) {
                    course['hoidong'].forEach(f => {
                        if (f['user_id']) {
                            const data_hoidong = {
                                course_id: course['course_id'],
                                user_id: f['user_id'],
                                vaitro: f['vaitro']
                            }
                            request.push(this.courseThanhvienService.addCourseThanhvien(data_hoidong));
                        }

                    })
                }


                this.courseThanhvienService.deleteCourseThanhvienBy('course_id', course['course_id']).pipe(
                    catchError(() => {
                        course['trangthai'] = "Thất bại";
                        return null
                    }),
                    mergeMap(() => {
                        return forkJoin(request).pipe(mergeMap(() => {
                            return null;
                        }))
                    })).subscribe({
                        next: () => {
                            course['trangthai'] = "Thành công";
                            this.loopAddHoidong(key + 1, courses[key + 1], courses);
                        },
                        error: () => {
                            this.loopAddHoidong(key + 1, courses[key + 1], courses);
                        }
                    })
            } else {
                course['trangthai'] = 'Chưa tạo HP';
                this.loopAddHoidong(key + 1, courses[key + 1], courses);
            }
        } else {
            this.displayModal = false;
            this.noitifi.toastSuccess('Đã hoàn thành cập nhật, vui lòng kiểm tra lại');
        }
    }

    downLoadEx() {
        this.fileService.getFileContent('..\\assets\\files\\mau_file_import_hoidong\\Mau 07 - Import sinh viên vào nhiều lớp học phần.xlsx').subscribe(res => {
            saveAs(res, 'Mau 07 - Import sinh viên vào nhiều lớp học phần.xlsx');
        });
    }

    openTemplateImportCbthi() {
        this.noitifi.openSideNavigationMenu({ template: this.templateImporCbthi(), size: window.innerWidth, offsetTop: '0px' })
    }

    openTestTuan(course: ElnKhoaHoc) {
        this.selectedKhoahoc = course;
        this.list_week = [];
        const condition_lesson: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: course.id.toString(), orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.notEqual, value: '0', orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.lessThan, value: '100', orWhere: 'and' },
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'include', value: 'ACTIVITY_CDR,PLAN' },
                { label: 'include_by', value: 'type' },
                { label: 'orderby', value: 'week' },
                { label: 'order', value: 'ASC' }
            ],
            page: null
        }

        const condition_question: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: course.id.toString(), orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.lessThan, value: '100', orWhere: 'and' },
                { conditionName: 'reference', condition: OvicQueryCondition.equal, value: 'course_plan_activities', orWhere: 'and' },
                { conditionName: 'status', condition: OvicQueryCondition.equal, value: '1', orWhere: 'and' },
                { conditionName: 'group_id', condition: OvicQueryCondition.equal, value: '0', orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'status,id,cdr,reference_id,week,created_at' }
            ],
            page: null
        }

        const condition_plan_bank: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: course.id.toString(), orWhere: 'and' },
                { conditionName: 'bank_type', condition: OvicQueryCondition.equal, value: 'CC', orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'week,id' },
                { label: 'groupby', value: 'week' }
            ],
            page: null
        }


        const condition_form_week: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: course.id.toString(), orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'week,id' },
                { label: 'groupby', value: 'week' }
            ],
            page: null
        }

        this.noitifi.isProcessing(true);

        forkJoin([
            this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_lesson),
            this.coursePlanBankService.getCoursePlanBankByPageNew(condition_plan_bank),
            this.courseFormCcService.getCourseFormCcByPage(condition_form_week),
            this.courseQuestionsService.getCourseQuestionsByPageNew(condition_question).pipe(mergeMap(_res_question => {
                if (course.av === 1) {

                    const group_ids = _res_question.data.map(m => m.id);

                    group_ids.push(-1);

                    const condition_question_child: ConditionOption = {
                        condition: [
                            { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: course.id.toString(), orWhere: 'and' },
                        ],
                        set: [
                            { label: 'limit', value: '-1' },
                            { label: 'include', value: group_ids.toString() },
                            { label: 'include_by', value: 'group_id' },
                            { label: 'select', value: 'status,id,cdr,reference_id,week' }
                        ],
                        page: null
                    }

                    return this.courseQuestionsService.getCourseQuestionsByPageNew(condition_question_child).pipe(mergeMap(_child_question => {
                        return of(_child_question)
                    }))
                }
                return of(_res_question);
            }))
        ]).subscribe({
            next: ([_plan_activity, _bank, _form_cc, _course_question]) => {

                const parent = _plan_activity.data.filter(m => m.parent_id === 0);
                parent.forEach(f => {
                    f['datuyet_question'] = _course_question.data.filter(m => m['week'] === f.week).length;

                    const children = _plan_activity.data.filter(m => m.parent_id === f.id);

                    f['has_form'] = false;

                    const index_form = _form_cc.data.findIndex(m => m.week === f.week);

                    if (index_form !== -1) {
                        f['has_form'] = true;
                    }


                    f['children'] = this.helperService.sort(children, 'stt_cdr');
                    const index_week = _bank.data.findIndex(m => m.week === f.week);
                    f['has_test'] = false;
                    if (index_week !== -1) {
                        f['has_test'] = true;
                    }
                })
                this.list_week = parent
                this.noitifi.isProcessing(false);
                this.noitifi.openSideNavigationMenu({ template: this.templateTestWeek(), size: 800, offsetTop: '0px' });
            },
            error: () => {
                this.noitifi.isProcessing(false);
            }
        })
    }

    openTestKynang(course: ElnKhoaHoc) {
        this.selectedKhoahoc = course;
        this.list_test_kynang = [];
        const condition_test: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: course.id.toString(), orWhere: 'and' },
                { conditionName: 'parent_id', condition: OvicQueryCondition.notEqual, value: '0', orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.equal, value: '1000', orWhere: 'and' },
                { conditionName: 'type', condition: OvicQueryCondition.equal, value: 'THUONGXUYEN_TRACNGHIEM', orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'orderby', value: 'ordering' },
                { label: 'order', value: 'ASC' }
            ],
            page: null
        }

        const condition_plan_bank: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: course.id.toString(), orWhere: 'and' },
                { conditionName: 'bank_type', condition: OvicQueryCondition.equal, value: 'TX', orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.equal, value: '100', orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'week,id,ordering' },
                { label: 'groupby', value: 'ordering' }
            ],
            page: null
        }


        const condition_question: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: course.id.toString(), orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.lessThan, value: '100', orWhere: 'and' },
                { conditionName: 'reference', condition: OvicQueryCondition.equal, value: 'course_plan_activities', orWhere: 'and' },
                { conditionName: 'status', condition: OvicQueryCondition.equal, value: '1', orWhere: 'and' },
                { conditionName: 'group_id', condition: OvicQueryCondition.equal, value: '0', orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'status,id,cdr,reference_id,week' }
            ],
            page: null
        }

        const condition_week: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: course.id.toString(), orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.notEqual, value: '0', orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.lessThan, value: '100', orWhere: 'and' },
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'include', value: 'ACTIVITY_CDR,PLAN' },
                { label: 'include_by', value: 'type' },
                { label: 'orderby', value: 'week' },
                { label: 'order', value: 'ASC' }
            ],
            page: null
        }

        const condition_form_kynang: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: course.id.toString(), orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'ordering,id,week' },
                // { label: 'groupby', value: 'ordering' }
            ],
            page: null
        }

        this.noitifi.isProcessing(true);

        forkJoin([
            this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_test),
            this.coursePlanBankService.getCoursePlanBankByPageNew(condition_plan_bank),
            this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_week),
            this.courseFormTxService.getCourseFormTxByPage(condition_form_kynang),
            this.courseQuestionsService.getCourseQuestionsByPageNew(condition_question).pipe(mergeMap(_res_question => {
                if (course.av === 1) {

                    const group_ids = _res_question.data.map(m => m.id);

                    group_ids.push(-1);

                    const condition_question_child: ConditionOption = {
                        condition: [
                            { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: course.id.toString(), orWhere: 'and' },
                        ],
                        set: [
                            { label: 'limit', value: '-1' },
                            { label: 'include', value: group_ids.toString() },
                            { label: 'include_by', value: 'group_id' },
                            { label: 'select', value: 'status,id,cdr,reference_id,week' }
                        ],
                        page: null
                    }

                    return this.courseQuestionsService.getCourseQuestionsByPageNew(condition_question_child).pipe(mergeMap(_child_question => {
                        return of(_child_question)
                    }))
                }
                return of(_res_question);
            }))
        ]).subscribe({
            next: ([_plan_activity, _course_plan_bank, _plan_week, _form_tx, _course_question]) => {

                if (_plan_activity.recordsFiltered === 0) {
                    this.noitifi.isProcessing(false);
                    return this.noitifi.toastWarning('Môn học này không có bài kiểm tra trắc nghiệm thường xuyên')
                }

                const weeks = _plan_week.data.filter(m => m.parent_id === 0);

                weeks.forEach(f => {
                    const children = _plan_week.data.filter(m => m.parent_id === f.id);
                    f['children'] = this.helperService.sort(children, 'stt_cdr');
                })


                _plan_activity.data.forEach(f => {

                    f['has_test'] = false;

                    f['has_form'] = false;

                    const _form_kn = _form_tx.data.filter(m => m.ordering === f.ordering);

                    if (_form_kn.length !== 0) {

                        f['has_form'] = true;

                        let weeks_tx = _form_kn.map(m => m['week']);

                        weeks_tx = [...new Set(weeks_tx)];

                        f['datuyet_question'] = _course_question.data.filter(m => weeks_tx.findIndex(i => i === m['week']) !== -1).length;

                    }

                    if (this.selectedKhoahoc.params) {

                        const index_week = _course_plan_bank.data.findIndex(m => m['ordering'] === f.ordering);

                        if (index_week !== -1) {
                            f['has_test'] = true;
                        }
                    }

                })


                this.list_test_kynang = _plan_activity.data;
                this.noitifi.isProcessing(false);
                this.noitifi.openSideNavigationMenu({ template: this.templateTestKynang(), size: 800, offsetTop: '0px' });
            },
            error: () => {
                this.noitifi.isProcessing(false);
            }
        })
    }


    sinhDeByWeek(row: CoursePlanActivities) {
        this.noitifi.confirm('Thầy/Cô có chắc chắn muốn sinh đề trắc nghiệm tuần '.concat(this.label_week, ' ', row.week.toString()), 'Xác nhận hành động', [BUTTON_YES, BUTTON_NO]).then(a => {
            if (a.name === 'yes') {
                const data: SINHDECC = {
                    course_id: this.selectedKhoahoc.id,
                    week: row.week,
                    limit: this.number_test_config['CC_TEST']
                }
                this.noitifi.isProcessing(true);
                this.courseFormCcService.sinhde(data).subscribe({
                    next: (a) => {
                        this.openTestTuan(this.selectedKhoahoc);
                        this.noitifi.toastInfo("Đã sinh đề xong, vui lòng kiểm tra ")
                        this.noitifi.isProcessing(false);
                    },
                    error: () => {
                        this.noitifi.isProcessing(false);
                        this.noitifi.toastError("Sinh đề thất bại, vui lòng thử lại");
                    }
                })
            }
        })
    }

    sinhDeByKynang(row: CoursePlanActivities) {
        this.noitifi.confirm('Thầy/Cô có chắc chắn muốn sinh đề '.concat(row.title.toString()), 'Xác nhận hành động', [BUTTON_YES, BUTTON_NO]).then(a => {
            if (a.name === 'yes') {
                const data: SINHDETX = {
                    course_id: this.selectedKhoahoc.id,
                    ordering: row.ordering,
                    limit: this.number_test_config['TX_TEST']
                }

                this.noitifi.isProcessing(true);

                this.courseFormTxService.sinhde(data).subscribe({
                    next: (a) => {
                        this.openTestKynang(this.selectedKhoahoc);
                        this.noitifi.toastInfo("Đã sinh đề xong, vui lòng kiểm tra ")
                        this.noitifi.isProcessing(false);
                    },
                    error: () => {
                        this.noitifi.isProcessing(false);
                        this.noitifi.toastError("Sinh đề thất bại, vui lòng thử lại");
                    }
                })
                // const request: Observable<any>[] = [];
                // if ( row[ 'weeks_for_kynang' ] ) {
                //     row[ 'weeks_for_kynang' ].forEach( f => {
                //         const data: SINHDE = {
                //             course_id: this.selectedKhoahoc.id,
                //             week: f,
                //             type: 'TX'
                //         }

                //         request.push( this.coursePlanActivitiesService.sinhde( data ) )
                //     } )

                //     if ( request.length ) {
                //         this.progressValue = 0;
                //         this.displayModal = true;
                //         this.waitingTitle = "Đang sinh đề, vui lòng không tắt trình duyệt";
                //         this.loopAddTestKyNang( request, 0 ).subscribe( {
                //             next: () => {
                //                 this.displayModal = false;
                //                 this.openTestKynang( this.selectedKhoahoc );
                //                 this.noitifi.toastInfo( "Đã sinh đề xong, vui lòng kiểm tra " )
                //             },
                //             error: () => {

                //             }
                //         } )
                //     }
                // }
            }
        })
    }

    loopAddTestKyNang(request: Observable<any>[], key: number): Observable<any> {
        return request[key].pipe(mergeMap(a => {
            this.progressValue = (key + 1) / request.length * 100;
            if (request[key + 1]) {
                return this.loopAddTestKyNang(request, key + 1);
            } else {
                return of(null);
            }
        }))
    }

    openViewQuydinh() {
        window.open("..\\assets\\files\\mau_file_import_LMS-LCMS\\kiemtra-kynang-quydinh.pdf", "_blank");
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

    clearFormData() {
        this.formKhoaHoc.reset();
        this.currentForm = 1;
        this.checkedCategory = [];
        this.f['status'].setValue(1);
        if (!this.isManager && !this.isAdmin) {
            this.f['category_ids'].setValue(this.donvi_chuyenmon_id);
            this.f['nganh_bomon_id'].setValue(this.bomon_id);
            this.onChangeDonviCM({ id: this.donvi_chuyenmon_id });
        }
        this.f['cdr'].setValue(1);
        this.f['exam_format'].setValue('TRACNGHIEM');
        this.f['sotinchi_th'].setValue(0);
    }

    onChangeDonviCM(event): Promise<any> {
        return new Promise((resolve, reject) => {
            if (event) {
                this.noitifi.isProcessing(true);

                const arr_condition = [
                    { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' },
                    { conditionName: 'donvi_id', condition: OvicQueryCondition.equal, value: this.donviId.toString(), orWhere: 'and' },
                    { conditionName: 'type', condition: OvicQueryCondition.equal, value: 'bomon', orWhere: 'and' },
                    { conditionName: 'donvi_chuyenmon_id', condition: OvicQueryCondition.equal, value: event.id.toString(), orWhere: 'and' }
                ];

                const condition_nganh = this.httpHepler.paramsConditionBuilder(arr_condition).set('limit', '-1');

                this.elnChuyenMucService.getElnChuyenMucByCols(condition_nganh).subscribe({
                    next: (_category) => {
                        resolve(_category);
                        this.noitifi.isProcessing(false);
                    },

                    error: () => {
                        resolve([]);
                        this.noitifi.isProcessing(false);
                        this.noitifi.toastError("Lỗi kết nối, vui lòng thử lại");
                    }
                })
            } else {
                this.list_nganh_bomon = [];
            }

        });
    }



    async editKhoaHoc(course: ElnKhoaHoc) {
        this.clearFormData();
        this.selectedKhoahoc = course;
        this.isUpdated = false;
        if (this.selectedKhoahoc) {
            this.isUpdated = true;
            this.f['title'].setValue(this.selectedKhoahoc.title);
            this.f['slug'].setValue(this.selectedKhoahoc.slug);
            this.f['files'].setValue(this.selectedKhoahoc.files);
            this.f['decuong'].setValue(this.selectedKhoahoc.decuong);
            this.f['maso'].setValue(this.selectedKhoahoc.maso);
            this.f['keyword'].setValue(this.selectedKhoahoc.keyword ? this.selectedKhoahoc.keyword.slice(1, this.selectedKhoahoc.keyword.length - 1) : '');
            this.f['desc'].setValue(this.selectedKhoahoc.desc);
            this.f['subtitle'].setValue(this.selectedKhoahoc.subtitle);
            this.f['category_ids'].setValue(this.selectedKhoahoc.category_ids ? this.selectedKhoahoc.category_ids : null);
            this.f['status'].setValue(this.selectedKhoahoc.status);
            this.f['nganh_bomon_id'].setValue(this.selectedKhoahoc.nganh_bomon_id);

            if (this.selectedKhoahoc.category_ids) {
                this.list_nganh_bomon = await this.onChangeDonviCM({ id: this.selectedKhoahoc.category_ids });
            }

            if (this.selectedKhoahoc.params) {
                this.f['sotinchi'].setValue(this.selectedKhoahoc.params.sotinchi);
                this.f['exam_format'].setValue(this.selectedKhoahoc.params.exam_format);
                this.f['cdr'].setValue(this.selectedKhoahoc.params.cdr);
                this.f['sotinchi_th'].setValue(this.selectedKhoahoc.params.sotinchi_th)
            }

            this.noitifi.openSideNavigationMenu({ template: this.templateKhoaHoc(), size: 700 });
        }
    }

    processAddForm() {
        if (this.formKhoaHoc.valid) {

            const data = { ...this.formKhoaHoc.getRawValue() };

            data['maso'] = data['maso'] ? data['maso'].trim() : data['maso'];

            data['params'] = {
                sotinchi: data['sotinchi'],
                exam_format: data['exam_format'],
                cdr: data['cdr'],
                sotinchi_th: data['sotinchi_th']
            }

            delete data['sotinchi'];
            delete data['keyword'];
            delete data['exam_format'];
            delete data['cdr'];
            delete data['sotinchi_th'];

            if (this.isUpdated) {
                this.elnKhoaHocService.updateElnKhoaHoc(this.selectedKhoahoc.id, data).subscribe({
                    next: () => {
                        this.noitifi.toastSuccess('Sửa thông tin chuyên mục thành công');
                        this.noitifi.closeOvicFlexibleTemplate();
                        this.pageIndex = 0;
                        this.closeForm();
                        this.loadFirstPage();

                    },
                    error: () => this.noitifi.toastError('Sửa thông tin chuyên mục thất bại')
                });
            } else {
                this.elnKhoaHocService.addElnKhoaHoc(data).subscribe({
                    next: () => {
                        this.noitifi.toastSuccess('Thêm học phần mới thành công');
                        this.clearFormData();
                        this.pageIndex = 0;
                        this.loadFirstPage();
                    },
                    error: () => this.noitifi.toastError('Thêm học phần thất bại')
                });
            }
        } else {
            this.noitifi.toastError('Thông tin nhập vào chưa đúng, vui lòng kiểm tra lại', 'Lỗi nhập liệu');
            return this.formKhoaHoc.markAllAsTouched();
        }
    }

}
