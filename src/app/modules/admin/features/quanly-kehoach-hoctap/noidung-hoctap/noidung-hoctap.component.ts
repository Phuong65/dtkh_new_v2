import { CourseFormDgService } from './../../../../shared/services/course-form-dg.service';
import { Component, ElementRef, OnInit, TemplateRef, inject, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@modules/shared/shared.module';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router, RouterModule } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { Paginator, PaginatorModule } from 'primeng/paginator';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TableModule } from 'primeng/table';
import { ImportCanbothiComponent } from '../import-canbothi/import-canbothi.component';
import { ImportHoidongDuyetComponent } from '../import-hoidong-duyet/import-hoidong-duyet.component';
import { AuthService } from '@core/services/auth.service';
import { CHUAN_DAU_RA, MAXIMIZE_MODAL_OPTIONS, ROUTERS, TYPE_FILE_LIST } from '@modules/shared/utils/syscat';
import { APP_CONFIGS, key_server } from '@env';
import { OvicQueryCondition } from '@core/models/dto';
import { forkJoin, merge, mergeMap, Observable, of, switchAll, switchMap } from 'rxjs';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { DonViService } from '@modules/shared/services/don-vi.service';
import { DonVi } from '@modules/shared/models/don-vi';
import { ElnChuyenMuc } from '@modules/shared/models/Elng';
import { NotificationService } from '@core/services/notification.service';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { ElnKhoaHoc, EXAMFORMAT } from '@modules/shared/models/elng-khoa-hoc';
import { UserService } from '@core/services/user.service';
import { ElnChuyenMucService } from '@modules/shared/services/elearning-chuyen-muc.service';
import { HelperService } from '@core/services/helper.service';
import { CoursePlanActivities } from '@modules/shared/models/course-plan-activities';
import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';
import { CourseFormCcService, SINHDECC } from '@modules/shared/services/course-form-cc.service';
import { CoursePlanBankService } from '@modules/shared/services/course-plan-bank.service';
import { CourseQuestionsService } from '@modules/shared/services/course-questions.service';
import { BUTTON_YES, BUTTON_NO } from '@core/models/buttons';
import { CourseFormTxService, SINHDETX } from '@modules/shared/services/course-form-tx.service';
import { User } from '@core/models/user';
import { PopoverModule } from 'primeng/popover';
import { TREE, TreeCustomComponent } from '@modules/shared/components/tree-custom/tree-custom.component';
import { MediaFolderService } from '@modules/shared/services/media-folder.service';
import { OvicFile } from '@core/models/file';
import { FileService } from '@core/services/file.service';
import { NgbModal, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import JSZip from 'jszip';
import * as fs from 'file-saver';
import { CloneCourseComponent } from '../clone-course/clone-course.component';
import { ExportExcelBaocaoUpdateDataService } from "@shared/services/export-excel-baocao-update-data.service";
import { ClassPlanActivities } from '@modules/shared/models/class-plan-activities';
import { TooltipModule } from 'primeng/tooltip';
import { OvicGroupsRadioV2Component } from '@modules/shared/components/ovic-groups-radio-v2/ovic-groups-radio-v2.component';

export interface documentDownload {
    week: string,
    request: Observable<any>[],
    infoFiles: { fileTitle: string, blob: Blob }[]
}

@Component({
    selector: 'app-noidung-hoctap',
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
    PopoverModule,
    CloneCourseComponent,
    NgbTooltipModule,
    TooltipModule,
    OvicGroupsRadioV2Component,
    TreeCustomComponent
],
    templateUrl: './noidung-hoctap.component.html',
    styleUrls: ['./noidung-hoctap.component.css']
})
export class NoidungHoctapComponent implements OnInit {
    private auth = inject(AuthService);
    private router = inject(Router);
    formBuilder = inject(FormBuilder);
    private elngUserProfileService = inject(ElngUserProfileService);
    private httpHepler = inject(HttpParamsHeplerService);
    private donViService = inject(DonViService);
    private noitifi = inject(NotificationService);
    private elnKhoaHocService = inject(ElnKhoaHocService);
    private userService = inject(UserService);
    private helperService = inject(HelperService);
    private coursePlanActivitiesService = inject(CoursePlanActivitiesService);
    private coursePlanBankService = inject(CoursePlanBankService);
    private courseFormCcService = inject(CourseFormCcService);
    private courseQuestionsService = inject(CourseQuestionsService);
    private courseFormTxService = inject(CourseFormTxService);
    private elnChuyenMucService = inject(ElnChuyenMucService);
    private mediaFolderService = inject(MediaFolderService);
    private fileService = inject(FileService);
    private modalService = inject(NgbModal);
    private exportExcelBaocaoUpdateDataService = inject(ExportExcelBaocaoUpdateDataService);
    private courseFormDgService = inject(CourseFormDgService);


    readonly paginator = viewChild<Paginator>('paginator');

    readonly templateImporCbthi = viewChild<TemplateRef<any>>('templateImporCbthi');

    readonly templateImporthoidong = viewChild<TemplateRef<any>>('templateImporthoidong');

    readonly templateTestWeek = viewChild<TemplateRef<any>>('templateTestWeek');

    readonly templateTestdg = viewChild<TemplateRef<any>>('templateTestdg');

    readonly templateTestKynang = viewChild<TemplateRef<any>>('templateTestKynang');

    readonly templatePmsCttdg = viewChild<TemplateRef<any>>('templatePmsGiangvien');

    readonly templateKhoaHoc = viewChild<TemplateRef<any>>('templateKhoaHoc');

    readonly templateFolder = viewChild<TemplateRef<any>>('templateFolder');

    readonly templateFolderSelect = viewChild<ElementRef>('templateFolderSelect');

    readonly templateClone = viewChild<TemplateRef<any>>('templateClone');

    canAdd: boolean = false;

    canDelete: boolean = false;

    canUpdate: boolean = false;

    isUpdated: boolean = false;

    routerAdmin: boolean = false;

    routerDaotao: boolean = false;

    routerGiangvien: boolean = false;

    routerLanhdaokhoa: boolean = false;

    routerLanhdaobomon: boolean = false;

    formKhoaHoc: FormGroup;

    cols_course = [];

    label_week: string;

    number_test_config: any;

    list_donvi_chuyenmon: DonVi[];

    list_nganh_bomon: ElnChuyenMuc[];

    donvi_chuyenmon_id: number;

    bomon_id: number;

    totalCourse: number = 0;

    objectFilter = {};

    dmKhoahoc: ElnKhoaHoc[];

    selectedKhoahoc: ElnKhoaHoc;

    limitCourse: number = 20;

    pageIndex: number = 1;

    list_week: CoursePlanActivities[];

    list_test_kynang: CoursePlanActivities[];

    khoahocId: number;

    listGiangvien: User[];

    searchUser: string;

    donviId: number;

    formTitle: string;

    slugIsValid = true;

    EXAMFORMAT = EXAMFORMAT;

    chuandaura = CHUAN_DAU_RA;

    categoryFilter: number;

    selectedFolder: TREE;

    treeFolder: TREE[];

    file_list: OvicFile[] = [];

    waitingTitle: string = '';

    displayModal: boolean = false;

    progressValue: number = 0;

    isClone: boolean = false;

    list_course_for_clone: ElnKhoaHoc[] = [];

    key_server = key_server;

    list_week_dg: CoursePlanActivities[] = [];

    type_mon = [
        { id: 0, label: 'Môn thường' },
        { id: 1, label: 'Tiếng Anh' }
    ]

    constructor() {
        const url = this.router.url.substring(7).split('?')[0];

        this.routerAdmin = this.auth.hasRouter(ROUTERS.admin);

        this.routerDaotao = this.auth.hasRouter(ROUTERS.daotao);

        this.routerLanhdaokhoa = this.auth.hasRouter(ROUTERS.lanhdao_khoa);

        this.routerGiangvien = this.auth.hasRouter(ROUTERS.giangvien);

        this.routerLanhdaobomon = this.auth.hasRouter(ROUTERS.lanhdao_bomon)

        this.canAdd = this.auth.userCanAdd(url);

        this.canDelete = this.auth.userCanDelete(url);

        this.canUpdate = this.auth.userCanEdit(url);

        this.donviId = this.auth.user.donvi_id;

        this.cols_course = [
            { label: 'TT', class: 'ovic-w-50px text-center', key: 'index_' },
            { label: 'Tên môn học', class: 'col-width-400', key: 'title' },
            { label: 'Mã môn', class: 'ovic-w-120px', key: 'maso' },
            { label: 'Khoa quản lý', class: 'col-width-400 text-left', key: 'category_name' },
            { label: 'Số tín chỉ', class: 'ovic-w-120px text-center', key: 'sotinchi' },
            { label: 'Hình thức thi', class: 'ovic-w-120px text-center', key: 'hinhthucthi' },
            { label: 'Yêu cầu CDR', class: 'ovic-w-120px text-center', key: 'chuandaura' },
            { label: 'Giảng viên phụ trách', class: 'ovic-w-200px text-left', key: 'editor_name' },
        ]

        this.formKhoaHoc = this.formBuilder.group(
            {
                title: ['', Validators.required],
                subtitle: [''],
                category_ids: ['', Validators.required],
                creator_id: [''],
                keyword: [''],
                slug: [''],
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
                sotinchi_th: ['', Validators.required],
                exam_type: ['']
            }
        );
    }

    ngOnInit(): void {
        const config = JSON.parse(localStorage.getItem('--app_configs-' + APP_CONFIGS.realm));

        const setting = config.find(m => m.config_key === 'SETTING')['params'];

        this.number_test_config = config.find(m => m.config_key === 'NUMOF_TEST_CCTX')['params']

        this.label_week = setting['plan']['prefix'];

        this.loadUserInfo();
    }

    get f() {
        return this.formKhoaHoc.controls;
    }

    loadUserInfo() {
        this.noitifi.isProcessing(true);
        const condition_donvi = this.httpHepler.paramsConditionBuilder([
            { conditionName: 'status', condition: OvicQueryCondition.greaterThan, value: '0', orWhere: 'and' },
            { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: this.auth.user.donvi_id.toString(), orWhere: 'and' },
        ]).set("limit", -1).set("order", "ASC").set("orderby", "title");
        forkJoin([
            this.elngUserProfileService.getElngUserProfileByCol('user_id', this.auth.user.id.toString()),
            this.donViService.getDonViByCols(condition_donvi)
        ]).subscribe({
            next: ([_resUser, _resDonvi]) => {

                this.donvi_chuyenmon_id = _resUser[0] && _resUser[0].donvi_chuyenmon_id ? _resUser[0].donvi_chuyenmon_id : 0;

                this.bomon_id = _resUser[0] && _resUser[0].bomon_id ? _resUser[0].bomon_id : 0;

                this.list_donvi_chuyenmon = _resDonvi;

                this.loadPageData(1);
            },

            error: () => {
                this.noitifi.isProcessing(false);
                this.noitifi.toastError("Lỗi kết nỗi, vui lòng thử lại")
            }
        })
    }


    loadPageData(start) { // start = page;
        //let category_id = this.auth.user.donvi_ids && this.auth.user.donvi_ids[0] ? this.auth.user.donvi_ids[0].toString() : null;
        const arrayCondition = [
            { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' },
        ];

        const likeSearch = ['title', 'creator_name', 'maso'];

        Object.keys(this.objectFilter).forEach(f => {
            if (likeSearch.findIndex(i => i === f) !== -1) {
                arrayCondition.push({ conditionName: f, condition: OvicQueryCondition.like, value: '%'.concat(this.objectFilter[f].toString(), '%'), orWhere: 'and' },);
            } else {
                arrayCondition.push({ conditionName: f, condition: OvicQueryCondition.equal, value: this.objectFilter[f].toString(), orWhere: 'and' },);
            }
        })

        if (this.routerGiangvien) {
            arrayCondition.push({ conditionName: 'creator_plan_id', condition: OvicQueryCondition.equal, value: this.auth.user.id.toString(), orWhere: 'and' });
        }

        if (this.routerLanhdaokhoa) {
            if (this.donvi_chuyenmon_id) {
                this.categoryFilter = this.donvi_chuyenmon_id;
                arrayCondition.push({ conditionName: 'category_ids', condition: OvicQueryCondition.equal, value: this.donvi_chuyenmon_id.toString(), orWhere: 'and' });
            } else {
                this.noitifi.isProcessing(false);
                return this.noitifi.toastInfo("Thầy/Cô chưa được phân vào khoa trong hệ thống, vui lòng liên hệ phòng đào tạo");
            }
        }

        if ((this.routerDaotao || this.routerAdmin) && this.categoryFilter) {
            arrayCondition.push({ conditionName: 'category_ids', condition: OvicQueryCondition.equal, value: this.categoryFilter.toString(), orWhere: 'and' });
        }

        if (this.routerLanhdaobomon) {
            if (this.bomon_id) {
                arrayCondition.push({ conditionName: 'nganh_bomon_id', condition: OvicQueryCondition.equal, value: this.bomon_id.toString(), orWhere: 'and' });
            } else {
                this.noitifi.isProcessing(false);
                return this.noitifi.toastInfo("Thầy/Cô chưa được phân vào bộ môn trong hệ thống, vui lòng liên hệ phòng đào tạo");
            }
        }

        let setCondition = [];

        setCondition.push({ label: 'orderby', value: 'title' });

        setCondition.push({ label: 'limit', value: this.limitCourse.toString() });

        this.noitifi.isProcessing(true);

        this.elnKhoaHocService.getKhoaHocByPageNew(arrayCondition, start, setCondition).pipe(mergeMap(_courses => {
            const teacher_ids = _courses.data.map(m => m.creator_plan_id);
            if (teacher_ids.length) {
                const condition_teacher: ConditionOption = {
                    condition: [],
                    set: [
                        { label: 'include', value: teacher_ids.toString() },
                        { label: 'include_by', value: 'id' },
                        { label: 'limit', value: '-1' }
                    ],
                    page: null
                }

                return this.userService.getUserByPageNew(condition_teacher).pipe(mergeMap(_teacher => {
                    _courses.data.forEach(f => {
                        f['editor_name'] = '';
                        const index_teacher = _teacher.data.findIndex(m => m.id === f.creator_plan_id);
                        if (index_teacher !== -1) {
                            f['editor_name'] = _teacher.data[index_teacher].display_name;
                        }
                    })
                    return of(_courses);
                }))
            }
            return of(_courses);
        })).subscribe({
            next: _resCourse => {
                _resCourse.data.forEach((f, key) => {

                    const _index_start = (start - 1) * this.limitCourse;

                    f["index_"] = _index_start + key + 1;

                    f['show_name'] = '['.concat(f.maso, '] - ', f.title);

                    if (f.params) {
                        if (f.params.sotinchi) {
                            f['sotinchi'] = f.params.sotinchi;
                        }

                        if (!f.params.exam_type) {
                            const index = EXAMFORMAT.findIndex(m => m.key === f.params.exam_format);
                            if (index !== -1) {
                                f['hinhthucthi'] = EXAMFORMAT[index].label;
                            }
                        } else {
                            const index = EXAMFORMAT.findIndex(m => m.id === f.params.exam_type);
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

                    const index_category = f.category_ids ? this.list_donvi_chuyenmon.findIndex(m => m.id.toString() === f.category_ids.toString()) : -1;

                    f['category_name'] = index_category !== -1 ? this.list_donvi_chuyenmon[index_category].title : '';
                })

                this.totalCourse = _resCourse.recordsFiltered;

                this.dmKhoahoc = _resCourse.data;

                this.noitifi.isProcessing(false)
            },
            error: () => {
                this.noitifi.isProcessing(false);
                this.noitifi.toastError("Lỗi kết nỗi, vui lòng thử lại")
            }
        })
    }

    seacherKhoaHocWithTitle(event) {
        if (event) {
            if (event.target.value && event.target.value.trim()) {
                this.objectFilter['title'] = event.target.value;
                if (event.code === "Enter" || event.code === "NumpadEnter") {
                    this.onResetPage();
                }
            } else {
                delete this.objectFilter['title'];
                this.onResetPage();
            }
        }
    }

    onResetPage() {
        const paginator = this.paginator();
        if (!paginator.empty()) {
            paginator.changePage(0);
        } else {
            this.loadPageData(1);
        }
    }

    openTemplateImportCbthi() {
        this.noitifi.openSideNavigationMenu({ template: this.templateImporCbthi(), size: window.innerWidth, offsetTop: '0px' })
    }

    onOpenImportTemplate() {
        this.noitifi.openSideNavigationMenu({ template: this.templateImporthoidong(), size: window.innerWidth, offsetTop: '0px' });
    }

    closeForm() {
        this.isUpdated = false;
        this.noitifi.closeSideNavigationMenu();
    }

    changePage(event) {
        this.pageIndex = event.page + 1;
        this.loadPageData(event.page + 1);
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

    deleteDeWeek(row: CoursePlanActivities) {
        this.noitifi.confirmDelete().then(a => {
            if (a) {
                this.noitifi.isProcessing(true);
                const condition_plan_bank: ConditionOption = {
                    condition: [
                        { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedKhoahoc.id.toString(), orWhere: 'and' },
                        { conditionName: 'bank_type', condition: OvicQueryCondition.equal, value: 'CC', orWhere: 'and' },
                        { conditionName: 'week', condition: OvicQueryCondition.equal, value: row.week.toString(), orWhere: 'and' },
                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'select', value: 'id' },
                    ],
                    page: null
                }
                this.coursePlanBankService.getCoursePlanBankByPageNew(condition_plan_bank).pipe(mergeMap(_test => {
                    const ids = _test.data.map(m => m.id);
                    if (ids.length) {
                        return this.coursePlanBankService.deleteCoursePlanBank(ids.toString()).pipe(mergeMap(() => {
                            return of(null)
                        }))
                    }
                    return of(null);
                })).subscribe({
                    next: () => {
                        this.noitifi.isProcessing(false);
                        this.noitifi.toastSuccess("Xóa thành công");
                        this.openTestTuan(this.selectedKhoahoc);
                    },
                    error: () => {
                        this.noitifi.isProcessing(false);
                        this.noitifi.toastError("Xóa thất bại");
                    }
                })
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
            }
        })
    }

    deleteDeKynang(row: ClassPlanActivities) {
        this.noitifi.confirmDelete().then(a => {
            if (a) {
                this.noitifi.isProcessing(true);
                const condition_plan_bank: ConditionOption = {
                    condition: [
                        { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedKhoahoc.id.toString(), orWhere: 'and' },
                        { conditionName: 'bank_type', condition: OvicQueryCondition.equal, value: 'TX', orWhere: 'and' },
                        { conditionName: 'week', condition: OvicQueryCondition.equal, value: '100', orWhere: 'and' },
                        { conditionName: 'ordering', condition: OvicQueryCondition.equal, value: row.ordering.toString(), orWhere: 'and' },
                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'select', value: 'id' },
                    ],
                    page: null
                }
                this.coursePlanBankService.getCoursePlanBankByPageNew(condition_plan_bank).pipe(mergeMap(_test => {
                    const ids = _test.data.map(m => m.id);
                    if (ids.length) {
                        return this.coursePlanBankService.deleteCoursePlanBank(ids.toString()).pipe(mergeMap(() => {
                            return of(null)
                        }))
                    }
                    return of(null);
                })).subscribe({
                    next: () => {
                        this.noitifi.isProcessing(false);
                        this.noitifi.toastSuccess("Xóa thành công");
                        this.openTestKynang(this.selectedKhoahoc);
                    },
                    error: () => {
                        this.noitifi.isProcessing(false);
                        this.noitifi.toastError("Xóa thất bại");
                    }
                })
            }
        })
    }

    openViewQuydinh() {
        window.open("..\\assets\\files\\mau_file_import_LMS-LCMS\\kiemtra-kynang-quydinh.pdf", "_blank");
    }

    openViewQuydinhHvu() {
        window.open("..\\assets\\files\\mau_file_import_hvu\\kiemtra-quydinh-hvu.pdf", "_blank");
    }

    actionsEvent(event, item: ElnKhoaHoc) {
        this.isUpdated = false;
        if (event) {
            this.selectedKhoahoc = item;
            this.khoahocId = item.id;
            switch (event.key) {
                case 'pms-create-plan':
                    if (this.routerDaotao || this.routerAdmin) {
                        this.loadGiangVien(false);
                        this.noitifi.openSideNavigationMenu({ template: this.templatePmsCttdg(), size: 500, offsetTop: '0px' });
                    } else {
                        this.noitifi.toastWarning('Bạn không có quyền');
                    }
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

        if (this.routerLanhdaokhoa) {
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
                    this.loadPageData(this.pageIndex);
                    this.noitifi.closeSideNavigationMenu();
                },
                error: () => this.noitifi.toastError("Lỗi kết nối, cập nhật thất bại")
            })
        } else {
            this.noitifi.toastWarning('Vui lòng chọn giảng viên')
        }
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
                        this.noitifi.isProcessing(false);
                        resolve(_category);
                    },
                    error: () => {
                        this.noitifi.isProcessing(false);
                        resolve([]);
                        this.noitifi.toastError("Lỗi kết nối, vui lòng thử lại");
                    }
                })
            } else {
                this.list_nganh_bomon = [];
            }

        });
    }

    async clearFormData() {
        this.formKhoaHoc.reset();
        this.f['status'].setValue(1);
        this.f['cdr'].setValue(1);
        this.f['exam_format'].setValue('TRACNGHIEM');
        this.f['sotinchi_th'].setValue(0);
        this.isUpdated = false;
        this.isClone = false;
        if (!this.routerAdmin && !this.routerDaotao) {
            this.f['category_ids'].setValue(this.donvi_chuyenmon_id);
            this.f['nganh_bomon_id'].setValue(this.bomon_id);
            await this.onChangeDonviCM({ id: this.donvi_chuyenmon_id });
        }
    }

    async editKhoaHoc(course: ElnKhoaHoc) {
        this.clearFormData();
        this.selectedKhoahoc = course;
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

            if (this.selectedKhoahoc.params) {
                this.f['sotinchi'].setValue(this.selectedKhoahoc.params.sotinchi);
                this.f['exam_format'].setValue(this.selectedKhoahoc.params.exam_format);
                this.f['cdr'].setValue(this.selectedKhoahoc.params.cdr);
                this.f['sotinchi_th'].setValue(this.selectedKhoahoc.params.sotinchi_th);
                this.f['exam_type'].setValue(this.selectedKhoahoc.params.exam_type ? this.selectedKhoahoc.params.exam_type : null);
            }

            this.formTitle = "Sửa Môn học";

            this.noitifi.openSideNavigationMenu({ template: this.templateKhoaHoc(), size: 900, offsetTop: '0px' });

            if (this.selectedKhoahoc.category_ids) {
                this.list_nganh_bomon = await this.onChangeDonviCM({ id: this.selectedKhoahoc.category_ids });
            }
        }
    }


    onCheckMaHpPromise(): Promise<any> {
        return new Promise((resolve, reject) => {
            const condition_monhoc: ConditionOption = {
                condition: [
                    { conditionName: 'status', condition: OvicQueryCondition.greaterThan, value: '-1', orWhere: 'and' },
                    { conditionName: "maso", condition: OvicQueryCondition.equal, value: this.f['maso'].value, orWhere: 'and' },
                ],
                set: [],
                page: null
            }

            console.log(this.isUpdated);
            console.log(this.selectedKhoahoc);

            if (this.isUpdated && this.selectedKhoahoc) {
                condition_monhoc.condition.push({ conditionName: 'id', condition: OvicQueryCondition.notEqual, value: this.selectedKhoahoc.id.toString(), orWhere: 'and' })
            }

            this.elnKhoaHocService.getKhoaHocByPageNew_2(condition_monhoc).subscribe({
                next: (_monhoc) => {
                    if (_monhoc.recordsFiltered) {
                        resolve(false);
                    } else {
                        resolve(true);
                    }
                },
                error: () => {
                    resolve(null);
                }
            })

        });
    }



    async processAddForm() {
        if (this.formKhoaHoc.valid) {
            this.noitifi.isProcessing(true);

            const checkMa = await this.onCheckMaHpPromise();

            if (checkMa) {

                const data = { ...this.formKhoaHoc.getRawValue() };

                data['maso'] = data['maso'] ? data['maso'].trim() : data['maso'];

                data['slug'] = this.helperService.slugVietnamese(data['title']);

                data['params'] = {
                    sotinchi: data['sotinchi'],
                    exam_format: data['exam_format'],
                    cdr: data['cdr'],
                    sotinchi_th: data['sotinchi_th'],
                    exam_type: data['exam_type']
                }

                delete data['sotinchi'];
                delete data['keyword'];
                delete data['exam_format'];
                delete data['cdr'];
                delete data['sotinchi_th'];
                delete data['exam_type'];

                if (this.isUpdated) {
                    this.elnKhoaHocService.updateElnKhoaHoc(this.selectedKhoahoc.id, data).subscribe({
                        next: () => {
                            this.noitifi.toastSuccess('Sửa thông tin chuyên mục thành công');
                            this.noitifi.closeOvicFlexibleTemplate();
                            this.closeForm();
                            this.loadPageData(this.pageIndex);
                        },
                        error: () => this.noitifi.toastError('Sửa thông tin chuyên mục thất bại')
                    });
                } else {
                    this.elnKhoaHocService.addElnKhoaHoc(data).subscribe({
                        next: () => {
                            this.noitifi.toastSuccess('Thêm học phần mới thành công');
                            this.clearFormData();
                            this.onResetPage();
                        },
                        error: () => this.noitifi.toastError('Thêm học phần thất bại')
                    });
                }
            } else {
                this.noitifi.isProcessing(false);
                this.noitifi.toastWarning("Mã học phần đã tồn tại, vui lòng thử lại");
            }
        } else {
            this.noitifi.toastError('Thông tin nhập vào chưa đúng, vui lòng kiểm tra lại', 'Lỗi nhập liệu');
            return this.formKhoaHoc.markAllAsTouched();
        }
    }

    onChangeFilterChuyenmon(event) {
        if (event) {
            this.categoryFilter = event.id;
        } else {
            this.categoryFilter = null;
        }

        this.onResetPage();
    }

    reUpdateCourse() {
        this.clearFormData();
        this.formTitle = 'Tạo mới học phần';
        this.noitifi.openSideNavigationMenu({ template: this.templateKhoaHoc(), size: 900, offsetTop: '0px' });
        this.addKhoaHoc();
    }

    addKhoaHoc() {
        this.clearFormData();
        this.isUpdated = false;
        this.slugIsValid = true;
    }

    openFolderDeCuong() {
        if ((this.routerDaotao || this.routerAdmin || this.routerLanhdaokhoa) && this.canAdd) {
            this.noitifi.openSideNavigationMenu({ template: this.templateFolder(), size: 700, offsetTop: '0px' });
            this.selectedFolder = null
            this.onLoadFolder();
        } else {
            this.noitifi.toastWarning("Bạn không có quyền");
        }
    }

    onLoadFolder() {
        this.noitifi.isProcessing(true);
        const condition: ConditionOption = {
            condition: [
                { conditionName: 'created_by', condition: OvicQueryCondition.equal, value: this.auth.user.id.toString(), orWhere: 'and' },
                { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: '0', orWhere: 'and' },
            ],
            set: [{ label: "limit", value: "-1" }],
            page: null
        }

        this.mediaFolderService.getMediaFolderByPageNew(condition).subscribe({
            next: (_resFolder) => {
                const tmp = [];
                _resFolder.data.forEach(f => {
                    const folder_: TREE = {
                        collapsedIcon: 'fa fa-folder icon-folder-media',
                        data: '',
                        expandedIcon: 'fa fa-folder-open icon-folder-media',
                        id: f.id,
                        key: f.id.toString(),
                        label: f.name,
                        parent_id: 0,
                        styleClass: "tree-node-parent file_explorer_tree",
                        expanded: false,
                        children: [],
                        icon: '',
                        parent_folder: '0',
                        breadCrumb: [],
                        upload: true,
                    }
                    tmp.push(folder_);
                })

                const folder_parent: TREE = {
                    collapsedIcon: 'fa fa-database icon-folder-media',
                    data: '',
                    expandedIcon: 'fa fa-database icon-folder-media',
                    id: 0,
                    key: '0',
                    label: 'Thư mục của tôi',
                    parent_id: null,
                    styleClass: "tree-node-parent file_explorer_tree",
                    expanded: true,
                    children: tmp,
                    icon: '',
                    parent_folder: '0',
                    breadCrumb: [],
                    upload: true,
                }

                folder_parent.children.forEach(f => {
                    f['parent'] = folder_parent;
                })

                this.treeFolder = [folder_parent];
                if (!this.auth.currentFolder || this.auth.currentFolder.id === 0) {
                    // this.nodeSelect(folder_parent);
                } else {
                    const parent = this.loopGetPreParent(this.auth.currentFolder);
                    const index = tmp.findIndex(m => m.id === parent.id);
                    if (index !== -1) {
                        folder_parent.children[index] = parent;
                        // this.nodeSelect(this.auth.currentFolder);
                    } else {
                        // this.nodeSelect(folder_parent);
                    }
                }
                this.noitifi.isProcessing(false);
            },
            error: () => {
                this.noitifi.isProcessing(false);
                this.noitifi.toastError("Tải thư mục thất bại");
            }
        })
    }

    loopGetPreParent(folder: TREE): TREE {
        if (folder.parent && folder.parent.id) {
            return this.loopGetPreParent(folder.parent);
        }
        return folder;
    }

    closeRightForm() {
        this.noitifi.closeSideNavigationMenu();
    }

    nodeSelect(node) {
        this.selectedFolder = node;
        // this.closeAndOpenNode(node);
    }

    closeAndOpenNode(event: TREE) {
        if (event.parent_folder && event.parent_folder !== '') {
            if (event.expanded === true) {

                const condition = { parents: event.id };
                condition['limit'] = '500';
                condition['folder'] = 1;
                // this.directoriesLoading = true;

                const option: ConditionOption = {
                    condition: [
                        { conditionName: 'created_by', condition: OvicQueryCondition.equal, value: this.auth.user.id.toString(), orWhere: 'and' },
                        { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: event.id, orWhere: 'and' },
                    ],
                    set: [{ label: "limit", value: "-1" }],
                    page: null
                }
                this.mediaFolderService.getMediaFolderByPageNew(option).subscribe({
                    next: (_resRoot) => {
                        const folder_ = [];
                        _resRoot.data.forEach((fol) => {
                            // const breadCrumb_ = this.setNewBreadCrum(event.breadCrumb);
                            // breadCrumb_.push({ id: file.id, label: file.name, parents: file.parents[0] })
                            const folder: TREE = {
                                collapsedIcon: 'fa fa-folder icon-folder-media',
                                data: '',
                                expandedIcon: 'fa fa-folder-open icon-folder-media',
                                id: fol.id,
                                key: fol.id.toString(),
                                label: fol.name,
                                parent_id: fol.parent_id,
                                styleClass: "tree-node-parent file_explorer_tree",
                                expanded: false,
                                children: [],
                                icon: '',
                                parent_folder: fol.id.toString(),
                                breadCrumb: [],
                                upload: event.upload,
                                parent: event
                            }


                            // folder.breadCrumb[folder.breadCrumb.length - 1]['folder'] = folder;
                            folder_.push(folder);
                        })

                        event.children = folder_;
                    },
                    error: () => {
                        this.noitifi.toastError("Lỗi kết nối")
                    }
                })
            }
        }
    }

    openFolder() {
        this.file_list = [];
        this.loadFileList();
        this.modalService.open(this.templateFolderSelect(), MAXIMIZE_MODAL_OPTIONS)
    }

    loadFileList() {
        const condtion: ConditionOption = {
            condition: [],
            set: [
                { label: 'limit', value: '-1' }
            ],
            page: null
        }

        condtion.set.push({ label: 'orderby', value: 'created_at' });
        condtion.set.push({ label: 'order', value: 'desc' });

        if (this.selectedFolder) {
            condtion.condition.push({
                conditionName: 'tag', condition: OvicQueryCondition.equal, value: this.selectedFolder.id.toString(), orWhere: 'and'
            },)
        }

        condtion.set.push({ label: 'include_by', value: 'ext' });
        condtion.set.push({ label: 'include', value: 'pdf,PDF' });
        this.noitifi.isProcessing(true);
        forkJoin([
            this.fileService.getLibraryAws(condtion),
            // this.fileService.getLibraryAws(condtion_)
        ]).subscribe({
            next: ([files]) => {
                const data_files = [];
                // const start = (page - 1) * 20;
                let i = 0;
                const masos = [];
                masos[i] = [];
                files.data.forEach((f, key) => {
                    // f['index_'] = start + 1 + key;
                    f['upload_at'] = this.fileService.getUploadDate(f);
                    f['file_size'] = this.fileService.getFileSize(f);
                    const arTitle = f.title.split("_");
                    if (arTitle.length) {
                        f['mamon'] = arTitle[0];
                        if (f['mamon']) {
                            if (masos[i].length < 100) {
                                masos[i].push(f['mamon']);
                            } else {
                                i = i + 1;
                                masos[i] = [];
                                masos[i].push(f['mamon']);
                            }
                        }
                    }
                    data_files.push(f);
                })
                this.file_list = files.data;
                this.noitifi.isProcessing(false);
                this.waitingTitle = 'Đang kiểm tra dữ liệu, vui lòng chờ...';
                this.displayModal = true;
                this.loopGetMonHocTheoMa(masos, masos[0], 0);
            },
            error: () => { this.noitifi.toastError("Lỗi kết nối") }
        })
    }

    loopGetMonHocTheoMa(data: any[], mamon: any[], key) {
        if (key < data.length) {
            this.progressValue = (key + 1) / data.length * 100;
            const arrayCondition = [
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' },
            ];

            if (this.routerLanhdaokhoa) {
                arrayCondition.push({ conditionName: 'category_ids', condition: OvicQueryCondition.equal, value: this.donvi_chuyenmon_id.toString(), orWhere: 'and' });
            }

            // if (!this.isManager && !this.isLanhDaoKhoa && this.isLanhDaoBomon) {
            //     arrayCondition.push({ conditionName: 'nganh_bomon_id', condition: OvicQueryCondition.equal, value: this.bomon_id.toString(), orWhere: 'and' });
            // }

            let setCondition = [
                { label: 'include', value: mamon.toString() },
                { label: 'include_by', value: 'maso' },
                { label: 'limit', value: mamon.length.toString() },
            ]

            setCondition.push({ label: 'orderby', value: 'title' });

            this.elnKhoaHocService.getKhoaHocByPageNew(arrayCondition, 1, setCondition).subscribe({
                next: (_monhoc) => {
                    _monhoc.data.forEach(f => {
                        const index = this.file_list.findIndex(m => m['mamon'] === f.maso);
                        if (index !== -1) {
                            this.file_list[index]['monhoc_id'] = f.id;
                            this.file_list[index]['monhoc_name'] = '['.concat(f.maso, '] - ', f.title);
                        }
                    })
                    this.loopGetMonHocTheoMa(data, data[key + 1], key + 1);
                },
                error: () => {
                    this.loopGetMonHocTheoMa(data, data[key + 1], key + 1);
                }
            })
        } else {
            this.displayModal = false;
        }
    }

    startSyncDecuong() {
        this.noitifi.confirm('Bạn có chắc chắn muốn đồng bộ đề cương vào môn học?', 'Xác nhận hành động', [BUTTON_YES, BUTTON_NO]).then(a => {
            if (a.name === 'yes') {
                let i = 0;
                const data = [];
                data[i] = [];
                this.file_list.forEach(f => {
                    if (f['monhoc_id']) {
                        if (data[i].length < 5) {
                            data[i].push(f);
                        } else {
                            i = i + 1;
                            data[i] = [];
                            data[i].push(f);
                        }
                    }
                })
                if (data.length && data[0].length) {
                    this.displayModal = true;
                    this.waitingTitle = 'Đang đồng bộ dữ liệu, vui lòng chờ...';
                    this.loopUpdateDecuong(data[0], data, 0);
                } else {
                    this.noitifi.toastWarning('Không tìm thấy đề cương cần đồng bộ');
                }
            }
        })
    }

    loopUpdateDecuong(object: OvicFile[], data: any[], key) {
        if (key < data.length) {
            this.progressValue = (key + 1) / data.length * 100;
            const request: Observable<any>[] = [];
            object.forEach(f => {
                let type = null;
                Object.keys(TYPE_FILE_LIST).forEach(t => {
                    if (f.type) {
                        const index = f.type.indexOf(t);
                        if (index !== -1) {
                            type = TYPE_FILE_LIST[t];
                        }
                    }
                })

                const file = {
                    id: f.id,
                    name: f.name,
                    size: f.size,
                    title: f.title,
                    file_size: this.fileService.getFileSize(f),
                    type: type ? type : f['ext'],
                    path: f.id,
                    source: "serverAws",
                    fileName: f.title,
                    preview: true,
                    download: false
                }
                request.push(this.elnKhoaHocService.updateElnKhoaHoc(f['monhoc_id'], { decuong: [file] }).pipe(mergeMap(res => {
                    f['done'] = true;
                    return of(null)
                })))
            })

            if (request.length) {
                forkJoin(request).subscribe({
                    next: () => {
                        this.loopUpdateDecuong(data[key + 1], data, key + 1);
                    },

                    error: () => {
                        this.noitifi.toastError("Đã có sự cố xảy ra, vui lòng kiểm tra kết nối và thử lại");
                        this.displayModal = false;
                    }
                })
            }
        } else {
            this.displayModal = false;
            this.noitifi.toastSuccess("Cập nhật thành công");
        }
    }

    deleteFileDecuong(row) {
        this.noitifi.confirm('Bạn có chắc chắn muốn xóa đề cương này khỏi danh sách đồng bộ?', 'Xác nhận hành động', [BUTTON_YES, BUTTON_NO]).then(a => {
            if (a.name === 'yes') {
                const index = this.file_list.findIndex(m => m.id === row.id);
                if (index !== -1) {
                    this.file_list.splice(index, 1);
                }
            }
        })
    }


    loadAllPlan() {
        const condition_plan: ConditionOption = {
            condition: [
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
            ],
            set: [
                { label: "limit", value: "-1" }
            ],
            page: null
        }

        this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_plan).subscribe({
            next: (class_plan) => {
                let id_files = [];
                class_plan.data.forEach(f => {
                    if (f.video) {
                        id_files.push(f.video.path);
                    }

                    if (f.files) {
                        id_files = id_files.concat(f.files.map(m => m.path));
                    }

                    if (f.slides) {
                        id_files = id_files.concat(f.slides.map(m => m.path));
                    }
                })

            },
            error: () => {

            }
        })
    }

    deleteKhoahoc(objectId: number) {
        this.noitifi.confirmDelete().then(
            (a) => {
                if (a) {
                    this.elnKhoaHocService.deleteElnKhoaHoc(objectId).subscribe({
                        next: () => {
                            this.noitifi.toastSuccess('Xóa thông tin thành công');
                            this.loadPageData(this.pageIndex);
                        },
                        error: () => this.noitifi.toastError('Xóa thông tin chuyên mục thất bại')
                    });
                }
            },
            () => null
        );
    }

    dowloadCoursePlanDocument(course: ElnKhoaHoc) {
        this.displayModal = true;
        this.progressValue = 0;

        const condition_course_plan: ConditionOption = {
            condition: [
                { conditionName: "course_id", condition: OvicQueryCondition.equal, value: course.id.toString(), orWhere: "and" },
                { conditionName: "status", condition: OvicQueryCondition.notEqual, value: "-3", orWhere: "and" },
                { conditionName: "week", condition: OvicQueryCondition.greaterThan, value: "0", orWhere: "and" },
                { conditionName: "week", condition: OvicQueryCondition.lessThan, value: "100", orWhere: "and" }
            ],
            set: [
                { label: 'limit', value: '-1' }
            ],
            page: null
        }

        this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_course_plan).subscribe({
            next: (_plan_activity) => {
                const parent = _plan_activity.data.filter(m => m.parent_id === 0);
                const documents: documentDownload[] = []
                parent.forEach(f => {
                    const _doctument: documentDownload = {
                        week: f.week.toString(),
                        request: [],
                        infoFiles: []
                    }
                    const child = _plan_activity.data.filter(m => m.parent_id === f.id && m.type === "ACTIVITY");
                    _doctument['week'] = f.week.toString();
                    child.forEach(f => {
                        if (f.files && Array.isArray(f.files)) {
                            f.files.forEach(file => {
                                _doctument['request'].push(this.fileService.awsGetFileAsBlob(file.path.toString()).pipe(mergeMap(_res => {
                                    if (_res)
                                        _doctument['infoFiles'].push({ fileTitle: file.fileName, blob: _res });
                                    return of(null);
                                })))
                            })
                        }

                        if (f.slides && Array.isArray(f.slides)) {
                            f.slides.forEach(file => {
                                _doctument['request'].push(this.fileService.awsGetFileAsBlob(file.path.toString()).pipe(mergeMap(_res => {
                                    if (_res)
                                        _doctument['infoFiles'].push({ fileTitle: file.fileName, blob: _res });
                                    return of(null);
                                })))
                            })
                        }
                    })
                    documents.push(_doctument);
                })

                if (documents.length) {
                    this.loopDownloadFile(0, documents).subscribe({
                        next: () => {
                            const zip = new JSZip();

                            const text = course.title.replace(/\/|\\|\./g, "_");

                            const shiftFolder = zip.folder(text);

                            documents.forEach(f => {
                                const weekFolder = shiftFolder.folder('Bai_'.concat(f.week));
                                if (f.infoFiles && f.infoFiles.length) {
                                    f.infoFiles.forEach(file => {
                                        weekFolder.file(file.fileTitle, file.blob);
                                    })
                                }
                            })

                            const currentThis = this;

                            zip.generateAsync({ type: "blob" }).then(function (content) {
                                fs.saveAs(content, text);
                                currentThis.displayModal = false;
                            });
                        },
                        error: (error) => {
                            console.log(error)
                        }
                    })
                }
            },
            error: () => {

            }
        })
    }

    loopDownloadFile(key: number, _document: documentDownload[]): Observable<any> {
        this.progressValue = key / _document.length * 100;
        if (_document[key].request.length) {
            return forkJoin(_document[key].request).pipe(
                mergeMap(_res => {
                    if (_document[key + 1]) {
                        return this.loopDownloadFile(key + 1, _document);
                    } else {
                        return of(null)
                    }
                }))
        } else {
            if (_document[key + 1]) {
                return this.loopDownloadFile(key + 1, _document);
            } else {
                return of(null)
            }
        }
    }

    cloneCourse(course: ElnKhoaHoc) {
        this.selectedKhoahoc = course;
        this.formTitle = "Sao chép nội dung từ môn học khác";
        this.noitifi.openSideNavigationMenu({ template: this.templateClone(), size: 800, offsetTop: "0px" });
    }

    saveCloneCourse() {

    }

    async btnDowloadUpateData() {

        this.noitifi.isProcessing(true);


        const arrayCondition = [
            { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' },
            { conditionName: 'category_ids', condition: OvicQueryCondition.equal, value: this.categoryFilter.toString(), orWhere: 'and' }
        ];


        let setCondition = [];

        setCondition.push({ label: 'orderby', value: 'title' });

        setCondition.push({ label: 'limit', value: '-1' });


        this.elnKhoaHocService.getKhoaHocByPageNew(arrayCondition, 1, setCondition).pipe(switchMap(m => {
            const data = m.data
            this.noitifi.loadingAnimationV2({ process: { percent: 0 } });
            const step: number = 100 / data.length;

            return this.getLoopCousePlanActivityByCourseId(data, step, 0);
        }
        )).subscribe({
            next: (data) => {

                const dataMap = data.map((m, index) => {
                    const couserPlanActivitisByArr: CoursePlanActivities[] = Array.from(m['couserPlanActivitis']);

                    const coursePlanParentWeeek0 = Array.from(couserPlanActivitisByArr).filter(f => f.parent_id == 0 && f.week == 0).map(a => {
                        a['__child'] = Array.from(couserPlanActivitisByArr).filter(f => f.parent_id === a.id && f.desc);
                        return a;
                    });
                    const totalcoursePlanParentWeeek0 = coursePlanParentWeeek0.reduce((total, item) => {
                        return total + item['__child'].length;
                    }, 0);

                    const totalTT = totalcoursePlanParentWeeek0 + '/' + 4;
                    const indexExam = EXAMFORMAT.findIndex(f => f.key === m.params.exam_format);
                    const indexCDR = CHUAN_DAU_RA.findIndex(f => f.id === m.params.cdr);

                    const coursePlanParent = Array.from(couserPlanActivitisByArr).filter(f => f.parent_id == 0 && f.week !== 0).map(a => {
                        a['__child'] = Array.from(couserPlanActivitisByArr).filter(f => f.parent_id === a.id && a.type !== "GIOITHIEU");
                        return a;
                    });

                    let object = {
                        index: index + 1,
                        tenmon: m.title,
                        mamon: m.maso,
                        sotinchi: m.params.sotinchi,
                        cdr: CHUAN_DAU_RA[indexCDR] ? CHUAN_DAU_RA[indexCDR].label : '',
                        hinhthucthi: EXAMFORMAT[indexExam] ? EXAMFORMAT[indexExam].label : '',
                        nguoiphutrach: m['__teacher'] && m['__teacher']['display_name'] ? m['__teacher']['display_name'] : '',
                        sobai: coursePlanParent.length,
                        muctieu: totalTT,
                    }

                    coursePlanParent.forEach(pr => {


                        const child = pr['__child']
                        const typeActivity = pr['__child'].length > 0 ? pr['__child'].find(f => f.type == 'ACTIVITY') : null;
                        const typeActivityCdr = pr['__child'].length > 0 ? pr['__child'].filter(f => f.type == 'ACTIVITY_CDR') : null;

                        // const item = {
                        //     ['celo' + pr.week]:'x',
                        //     ['noidung' + pr.week]:typeActivityCdr && typeActivityCdr.length>0 ? 'x':'',
                        //     ['baigang' + pr.week]:typeActivity && typeActivity.desc ? 'x':'' ,
                        //     ['slide' + pr.week]:typeActivity && typeActivity.slide ? 'x' :'',
                        //     ['video' + pr.week]:typeActivity && typeActivity.files ? 'x' :'' ,
                        //
                        // };

                        object['celo' + pr.week] = 'x';
                        object['noidung' + pr.week] = typeActivityCdr && typeActivityCdr.length > 0 ? 'x' : '';
                        object['baigang' + pr.week] = typeActivity && typeActivity.files ? 'x' : '';
                        object['slide' + pr.week] = typeActivity && typeActivity.slides ? 'x' : '';
                        object['video' + pr.week] = typeActivity && typeActivity.video ? 'x' : '';



                    })


                    return object
                })

                const title = this.list_donvi_chuyenmon.find(f => f.id === this.categoryFilter).title;
                // console.log(dataMap);
                this.exportExcelBaocaoUpdateDataService.exportToLong(dataMap, title);

                this.noitifi.disableLoadingAnimationV2();
                this.noitifi.isProcessing(false);
            }, error: () => {
                this.noitifi.isProcessing(false);
                this.noitifi.disableLoadingAnimationV2();
                this.noitifi.toastError('Lỗi khi kết nối mạng');
            }
        })
    }

    private getLoopCousePlanActivityByCourseId(arr: ElnKhoaHoc[], step: number, percent: number): Observable<ElnKhoaHoc[]> {
        const index = arr.findIndex(f => !f['couserPlanActivitis'])
        if (index !== -1) {

            const item = arr[index];
            const condition_lesson: ConditionOption = {
                condition: [
                    { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: item.id.toString(), orWhere: 'and' },
                    // { conditionName: 'week', condition: OvicQueryCondition.notEqual, value: '0', orWhere: 'and' },
                    { conditionName: 'week', condition: OvicQueryCondition.lessThan, value: '100', orWhere: 'and' },
                    { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
                ],
                set: [
                    { label: 'limit', value: '-1' },
                    { label: 'include', value: 'ACTIVITY_CDR,PLAN,GIOITHIEU,MUCTIEU,ACTIVITY' },
                    { label: 'include_by', value: 'type' },
                    { label: 'orderby', value: 'week' },
                    { label: 'order', value: 'ASC' }
                ],
                page: null
            }

            const condition_teacher: ConditionOption = {
                condition: [
                    { conditionName: 'id', condition: OvicQueryCondition.equal, value: item.creator_plan_id.toString(), orWhere: 'and' },
                ],
                set: [

                    { label: 'limit', value: '1' }
                ],
                page: null
            }

            return forkJoin([
                this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_lesson),
                this.userService.getUserByPageNew(condition_teacher)
            ]).pipe(switchMap(([m, teacher]) => {
                arr[index]['couserPlanActivitis'] = m.data;
                arr[index]['__teacher'] = teacher.data[0];
                const newPercent: number = percent + step;
                this.noitifi.loadingAnimationV2({ process: { percent: newPercent } });
                return this.getLoopCousePlanActivityByCourseId(arr, step, newPercent);
            }))




        } else {

            return of(arr);
        }


    }

    openTest15p(course: ElnKhoaHoc) {
        this.selectedKhoahoc = course;
        this.list_week_dg = [];
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
                { conditionName: 'bank_type', condition: OvicQueryCondition.equal, value: 'DG', orWhere: 'and' },
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
            this.courseFormDgService.getCourseFormDgByPage(condition_form_week),
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
                this.list_week_dg = parent
                this.noitifi.isProcessing(false);
                this.noitifi.openSideNavigationMenu({ template: this.templateTestdg(), size: 800, offsetTop: '0px' });
            },
            error: () => {
                this.noitifi.isProcessing(false);
            }
        })
    }

    sinhDe15pByWeek(row: CoursePlanActivities) {
        this.noitifi.confirm('Thầy/Cô có chắc chắn muốn sinh đề trắc nghiệm 15p '.concat(this.label_week, ' ', row.week.toString()), 'Xác nhận hành động', [BUTTON_YES, BUTTON_NO]).then(a => {
            if (a.name === 'yes') {
                const data: SINHDECC = {
                    course_id: this.selectedKhoahoc.id,
                    week: row.week,
                    limit: this.number_test_config['CC_TEST']
                }
                this.noitifi.isProcessing(true);
                this.courseFormDgService.sinhde(data).subscribe({
                    next: (a) => {
                        this.openTest15p(this.selectedKhoahoc);
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

    delete15pDeByWeek(row: CoursePlanActivities) {
        this.noitifi.confirmDelete().then(a => {
            if (a) {
                this.noitifi.isProcessing(true);
                const condition_plan_bank: ConditionOption = {
                    condition: [
                        { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedKhoahoc.id.toString(), orWhere: 'and' },
                        { conditionName: 'bank_type', condition: OvicQueryCondition.equal, value: 'DG', orWhere: 'and' },
                        { conditionName: 'week', condition: OvicQueryCondition.equal, value: row.week.toString(), orWhere: 'and' },
                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'select', value: 'id' },
                    ],
                    page: null
                }
                this.coursePlanBankService.getCoursePlanBankByPageNew(condition_plan_bank).pipe(mergeMap(_test => {
                    const ids = _test.data.map(m => m.id);
                    if (ids.length) {
                        return this.coursePlanBankService.deleteCoursePlanBank(ids.toString()).pipe(mergeMap(() => {
                            return of(null)
                        }))
                    }
                    return of(null);
                })).subscribe({
                    next: () => {
                        this.noitifi.isProcessing(false);
                        this.noitifi.toastSuccess("Xóa thành công");
                        this.openTest15p(this.selectedKhoahoc);
                    },
                    error: () => {
                        this.noitifi.isProcessing(false);
                        this.noitifi.toastError("Xóa thất bại");
                    }
                })
            }
        })
    }

    onChangeExam(event) {
        if (event) {
            const index = this.EXAMFORMAT.findIndex(m => m.id === event);
            if (index !== -1) {
                this.f['exam_format'].setValue(this.EXAMFORMAT[index].key);
            }
        }
    }
}
