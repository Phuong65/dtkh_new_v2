import { Component, ElementRef, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@modules/shared/shared.module';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { NotificationService } from '@core/services/notification.service';
import { DonViService } from '@modules/shared/services/don-vi.service';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { NgbModal, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { Router, RouterModule } from '@angular/router';
import { CHUAN_DAU_RA, ROUTERS } from '@modules/shared/utils/syscat';
import { OvicQueryCondition } from '@core/models/dto';
import { forkJoin, map, mergeMap, Observable, of, switchMap } from 'rxjs';
import { DonVi } from '@modules/shared/models/don-vi';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { ElnKhoaHoc, EXAMFORMAT } from '@modules/shared/models/elng-khoa-hoc';
import { UserService } from '@core/services/user.service';
import { Paginator, PaginatorModule } from 'primeng/paginator';
import { key_server } from '@env';
import { TableModule } from 'primeng/table';
import { ElnChuyenMucService } from '@modules/shared/services/elearning-chuyen-muc.service';
import { ElnChuyenMuc } from '@modules/shared/models/Elng';
import { CloneCourseComponent } from '../clone-course/clone-course.component';
import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';
import JSZip from 'jszip';
import * as fs from 'file-saver';
import { FileService } from '@core/services/file.service';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DialogModule } from 'primeng/dialog';
import { User } from '@core/models/user';
import { DropdownModule } from 'primeng/dropdown';
import { HelperService } from '@core/services/helper.service';
import { MatMenuModule } from '@angular/material/menu';
import { ImportCanbothiComponent } from '../../quanly-kehoach-hoctap/import-canbothi/import-canbothi.component';
import { ExportExcelBaocaoUpdateDataService } from '@shared/services/export-excel-baocao-update-data.service';
import { CoursePlanActivities } from '@modules/shared/models/course-plan-activities';
import { HoidongThamdinhMonhocService } from '@modules/shared/services/hoidong-thamdinh-monhoc.service';
import { HoidongThamdinhService } from '@modules/shared/services/hoidong-thamdinh.service';

export interface documentDownload {
    week: string,
    request: Observable<any>[],
    infoFiles: { fileTitle: string, blob: Blob }[]
}

@Component({
    selector: 'app-danhsach-monhoc',
    standalone: true,
    imports: [
        CommonModule,
        SharedModule,
        FormsModule,
        ReactiveFormsModule,
        PaginatorModule,
        NgbTooltipModule,
        TableModule,
        CloneCourseComponent,
        MatProgressBarModule,
        DialogModule,
        DropdownModule,
        RouterModule,
        MatMenuModule,
        ImportCanbothiComponent
    ],
    templateUrl: './danhsach-monhoc.component.html',
    styleUrls: ['./danhsach-monhoc.component.css']
})
export class DanhsachMonhocComponent implements OnInit {
    @ViewChild('paginator') paginator: Paginator;

    @ViewChild('templateKhoaHoc') templateKhoaHoc: TemplateRef<any>;

    @ViewChild('templateClone') templateClone: TemplateRef<any>;

    @ViewChild('templateImporCbthi') templateImporCbthi: TemplateRef<any>;

    routerAdmin: boolean = false;

    routerDaotao: boolean = false;

    routerLanhdaokhoa: boolean = false;

    routerGiangvien: boolean = false;

    routerLanhdaobomon: boolean = false;

    canAdd: boolean = false;

    canDelete: boolean = false;

    canUpdate: boolean = false;

    donviId: number;

    cols_course = [];

    formKhoaHoc: FormGroup;

    donvi_chuyenmon_id: number;

    bomon_id: number;

    list_donvi_chuyenmon: DonVi[];

    limitCourse: number = 20;

    totalCourse: number = 0;

    dmKhoahoc: ElnKhoaHoc[];

    selectedKhoahoc: ElnKhoaHoc;

    objectFilter = {};

    categoryFilter: number;

    pageIndex: number = 1;

    key_server = key_server;

    formTitle: string;

    isUpdated: boolean = false;

    slugIsValid: boolean = true;

    isClone: boolean = false;

    list_nganh_bomon: ElnChuyenMuc[] = [];

    displayModal: boolean = false;

    progressValue: number = 0;

    waitingTitle: string;

    listGiangvien: User[] = [];

    constructor(
        private noitifi: NotificationService,
        private elnKhoaHocService: ElnKhoaHocService,
        private donViService: DonViService,
        private elngUserProfileService: ElngUserProfileService,
        public formBuilder: FormBuilder,
        private auth: AuthService,
        private httpHepler: HttpParamsHeplerService,
        private modalService: NgbModal,
        private router: Router,
        private userService: UserService,
        private elnChuyenMucService: ElnChuyenMucService,
        private coursePlanActivitiesService: CoursePlanActivitiesService,
        private fileService: FileService,
        private helperService: HelperService,
        private exportExcelBaocaoUpdateDataService: ExportExcelBaocaoUpdateDataService,
        private hoidongThamdinhMonhocService: HoidongThamdinhMonhocService,
        private hoidongThamdinhService: HoidongThamdinhService
    ) {
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
            { label: 'Tên môn học', class: 'col-width-500', key: 'title' },
            { label: 'Mã môn', class: 'ovic-w-150px', key: 'maso' },
            { label: 'Khoa quản lý', class: 'col-width-300 text-left', key: 'category_name' },
            // { label: 'Số tín chỉ', class: 'ovic-w-120px text-center', key: 'sotinchi' },
            // { label: 'Hình thức thi', class: 'ovic-w-120px text-center', key: 'hinhthucthi' },
            { label: 'Yêu cầu CDR', class: 'ovic-w-120px text-center', key: 'chuandaura' },
            // { label: 'Giảng viên phụ trách', class: 'ovic-w-200px text-left', key: 'editor_name' },
        ]

        this.formKhoaHoc = this.formBuilder.group(
            {
                title: ['', Validators.required],
                category_ids: ['', Validators.required],
                maso: ['', Validators.required],
                nganh_bomon_id: [''],
                status: [''],
                creator_plan_id: ['']
            }
        );
    }

    ngOnInit(): void {
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

        const condition_teacher: ConditionOption = {
            condition: [
                { conditionName: 'teacher', condition: OvicQueryCondition.equal, value: '1', orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'user_id' },
                { label: 'with', value: 'user' }
            ],
            page: null
        }

        forkJoin([
            this.elngUserProfileService.getElngUserProfileByCol('user_id', this.auth.user.id.toString()),
            this.donViService.getDonViByCols(condition_donvi),
            this.elngUserProfileService.getUserProfileByPageNewV2(condition_teacher)
        ]).subscribe({
            next: ([_resUser, _resDonvi, _resGiangVien]) => {

                this.donvi_chuyenmon_id = _resUser[0] && _resUser[0].donvi_chuyenmon_id ? _resUser[0].donvi_chuyenmon_id : 0;

                this.bomon_id = _resUser[0] && _resUser[0].bomon_id ? _resUser[0].bomon_id : 0;

                this.list_donvi_chuyenmon = _resDonvi;

                this.listGiangvien = _resGiangVien.data.filter(i => i['user']).map(f => f['user']);

                this.listGiangvien.forEach(f => {
                    f['showName'] = ''.concat(f.display_name, ' - ', f.email);
                })

                this.loadPageData(1);
            },

            error: () => {
                this.noitifi.isProcessing(false);
                this.noitifi.toastError("Lỗi kết nỗi, vui lòng thử lại")
            }
        })
    }

    loadPageData(start) { // start = page;

        const condition_monhoc: ConditionOption = {
            condition: [
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' },
            ],
            set: [],
            page: start.toString()
        }

        // const arrayCondition = [
        //     { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' },
        // ];

        const likeSearch = ['title', 'creator_name', 'maso'];

        Object.keys(this.objectFilter).forEach(f => {
            if (likeSearch.findIndex(i => i === f) !== -1) {
                condition_monhoc.condition.push({ conditionName: f, condition: OvicQueryCondition.like, value: '%'.concat(this.objectFilter[f].toString(), '%'), orWhere: 'and' },);
            } else {
                condition_monhoc.condition.push({ conditionName: f, condition: OvicQueryCondition.equal, value: this.objectFilter[f].toString(), orWhere: 'and' },);
            }
        })

        if (this.routerGiangvien) {
            condition_monhoc.condition.push({ conditionName: 'creator_plan_id', condition: OvicQueryCondition.equal, value: this.auth.user.id.toString(), orWhere: 'and' });
        }

        if (this.routerLanhdaokhoa) {
            if (this.donvi_chuyenmon_id) {
                this.categoryFilter = this.donvi_chuyenmon_id;
                condition_monhoc.condition.push({ conditionName: 'category_ids', condition: OvicQueryCondition.equal, value: this.donvi_chuyenmon_id.toString(), orWhere: 'and' });
            } else {
                this.noitifi.isProcessing(false);
                return this.noitifi.toastInfo("Thầy/Cô chưa được phân vào khoa trong hệ thống, vui lòng liên hệ phòng đào tạo");
            }
        }

        if ((this.routerDaotao || this.routerAdmin) && this.categoryFilter) {
            condition_monhoc.condition.push({ conditionName: 'category_ids', condition: OvicQueryCondition.equal, value: this.categoryFilter.toString(), orWhere: 'and' });
        }

        if (this.routerLanhdaobomon) {
            if (this.bomon_id) {
                condition_monhoc.condition.push({ conditionName: 'nganh_bomon_id', condition: OvicQueryCondition.equal, value: this.bomon_id.toString(), orWhere: 'and' });
            } else {
                this.noitifi.isProcessing(false);
                return this.noitifi.toastInfo("Thầy/Cô chưa được phân vào bộ môn trong hệ thống, vui lòng liên hệ phòng đào tạo");
            }
        }

        condition_monhoc.set.push({ label: 'orderby', value: 'title' });
        condition_monhoc.set.push({ label: 'order', value: 'ASC' });
        condition_monhoc.set.push({ label: 'limit', value: this.limitCourse.toString() });

        this.noitifi.isProcessing(true);

        this.elnKhoaHocService.getKhoaHocByPageNew_2(condition_monhoc).pipe(mergeMap(_courses => {
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
                        f['editor_name'] = 'Chưa phân quyền';
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

                const _index_start = (start - 1) * this.limitCourse;

                _resCourse.data.forEach((f, key) => {



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

    changePage(event) {
        this.pageIndex = event.page + 1;
        this.loadPageData(event.page + 1);
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
        if (!this.paginator.empty()) {
            this.paginator.changePage(0);
        } else {
            this.loadPageData(1);
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
        this.isUpdated = false;
        this.isClone = false;
        if (!this.routerAdmin && !this.routerDaotao) {
            this.f['category_ids'].setValue(this.donvi_chuyenmon_id);
            this.f['nganh_bomon_id'].setValue(this.bomon_id);
            await this.onChangeDonviCM({ id: this.donvi_chuyenmon_id });
        }
    }


    addCourse() {
        this.clearFormData();
        this.formTitle = 'Tạo mới môn học';
        this.isUpdated = false;
        this.slugIsValid = true;
        this.noitifi.openSideNavigationMenu({ template: this.templateKhoaHoc, size: 700, offsetTop: '0px' });
    }


    onEditCourse(course: ElnKhoaHoc) {
        this.clearFormData();
        this.formTitle = 'Sửa môn học';
        this.isUpdated = true;
        this.slugIsValid = true;
        this.f['title'].setValue(course.title);
        this.f['category_ids'].setValue(course.category_ids);
        this.f['maso'].setValue(course.maso);
        this.f['nganh_bomon_id'].setValue(course.nganh_bomon_id);
        this.f['creator_plan_id'].setValue(course.creator_plan_id);
        this.selectedKhoahoc = course;
        this.noitifi.openSideNavigationMenu({ template: this.templateKhoaHoc, size: 700, offsetTop: '0px' });
    }

    cloneCourse(course: ElnKhoaHoc) {
        this.selectedKhoahoc = course;
        this.formTitle = "Sao chép nội dung từ môn học khác";
        this.noitifi.openSideNavigationMenu({ template: this.templateClone, size: 800, offsetTop: "0px" });
    }

    closeForm() {
        this.isUpdated = false;
        this.noitifi.closeSideNavigationMenu();
    }

    dowloadCoursePlanDocument(course: ElnKhoaHoc) {
        this.displayModal = true;

        this.progressValue = 0;

        this.waitingTitle = "Đang tải dữ liệu, vui lòng không tắt trình duyệt";

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
                            this.waitingTitle = "Vui lòng kiểm tra lại kết nối. Nếu kết nối ổn định, liên hệ đến giảng viên phụ trách môn để khôi phục lại tài liệu đã bị xóa"
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

                // data['params'] = {
                //     sotinchi: data['sotinchi'],
                //     exam_format: data['exam_format'],
                //     cdr: data['cdr'],
                //     sotinchi_th: data['sotinchi_th'],
                //     exam_type: data['exam_type']
                // }

                // delete data['sotinchi'];
                // delete data['keyword'];
                // delete data['exam_format'];
                // delete data['cdr'];
                // delete data['sotinchi_th'];
                // delete data['exam_type'];

                if (this.isUpdated) {
                    this.elnKhoaHocService.updateElnKhoaHoc(this.selectedKhoahoc.id, data).subscribe({
                        next: () => {
                            this.noitifi.toastSuccess('Sửa thông tin thành công');
                            this.noitifi.closeOvicFlexibleTemplate();
                            this.closeForm();
                            this.loadPageData(this.pageIndex);
                        },
                        error: () => this.noitifi.toastError('Sửa thông tin thất bại')
                    });
                } else {
                    this.elnKhoaHocService.addElnKhoaHoc(data).subscribe({
                        next: () => {
                            this.noitifi.toastSuccess('Thêm môn học mới thành công');
                            this.clearFormData();
                            this.onResetPage();
                        },
                        error: () => this.noitifi.toastError('Thêm môn học thất bại')
                    });
                }
            } else {
                this.noitifi.isProcessing(false);
                this.noitifi.toastWarning("Mã môn học đã tồn tại, vui lòng thử lại");
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

    openTemplateImportCbthi() {
        this.noitifi.openSideNavigationMenu({ template: this.templateImporCbthi, size: window.innerWidth, offsetTop: '0px' })
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

    deleteKhoahoc(objectId: number) {
        const condition_monhoc: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: objectId.toString(), orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '-1' }
            ],
            page: null
        };

        this.noitifi.isProcessing(true);

        this.hoidongThamdinhMonhocService.getHoidongThamdinhMonhocByPageNew(condition_monhoc).pipe(
            switchMap(({ data: courseLinks }) => {
                if (!courseLinks.length) {
                    return of<string[]>([]);
                }

                const councilIds = [...new Set(courseLinks.map(item => item.hoidong_thamdinh_id))];
                const condition_hoidong: ConditionOption = {
                    condition: [],
                    set: [
                        { label: 'include', value: councilIds.toString() },
                        { label: 'include_by', value: 'id' },
                        { label: 'limit', value: '-1' }
                    ],
                    page: null
                };

                return this.hoidongThamdinhService.getHoidongThamdinhByPageNew(condition_hoidong).pipe(
                    map(({ data: councils }) => councilIds.map(id => {
                        const council = councils.find(item => item.id === id);
                        return council ? council.title : `Hội đồng #${id}`;
                    }))
                );
            })
        ).subscribe({
            next: councilTitles => {
                this.noitifi.isProcessing(false);

                if (councilTitles.length) {
                    const course = this.dmKhoahoc.find(item => item.id === objectId);
                    this.openCourseDeleteBlockedPopup(course, councilTitles);
                    return;
                }

                this.confirmDeleteKhoahoc(objectId);
            },
            error: () => {
                this.noitifi.isProcessing(false);
                this.noitifi.toastError('Không thể kiểm tra hội đồng thẩm định, vui lòng thử lại');
            }
        });
    }

    private openCourseDeleteBlockedPopup(course: ElnKhoaHoc, councilTitles: string[]) {
        const courseTitle = this.escapeHtml(course?.title || 'Môn học đã chọn');
        const courseCode = course?.maso
            ? `<span class="course-delete-blocked__code">${this.escapeHtml(course.maso)}</span>`
            : '';
        const councilList = councilTitles
            .map((title, index) => `
                <li class="course-delete-blocked__council">
                    <span class="course-delete-blocked__number">${index + 1}</span>
                    <span>${this.escapeHtml(title)}</span>
                </li>`)
            .join('');

        const htmlBody = `
            <section class="course-delete-blocked" aria-label="Chi tiết môn học không thể xóa">
                <div class="course-delete-blocked__hero">
                    <span class="course-delete-blocked__icon" aria-hidden="true">
                        <i class="fa fa-lock"></i>
                    </span>
                    <div>
                        <span class="course-delete-blocked__eyebrow">Dữ liệu đang được sử dụng</span>
                        <p>Môn học chưa thể xóa vì đang thuộc hội đồng thẩm định.</p>
                    </div>
                </div>
                <div class="course-delete-blocked__course">
                    <span class="course-delete-blocked__label">Môn học</span>
                    <strong>${courseTitle}</strong>
                    ${courseCode}
                </div>
                <div class="course-delete-blocked__section-head">
                    <span>Hội đồng đang sử dụng</span>
                    <span class="course-delete-blocked__count">${councilTitles.length}</span>
                </div>
                <ol class="course-delete-blocked__councils">${councilList}</ol>
                <div class="course-delete-blocked__guide">
                    <span class="course-delete-blocked__guide-icon" aria-hidden="true">
                        <i class="fa fa-info-circle"></i>
                    </span>
                    <div>
                        <strong>Cách xử lý</strong>
                        <p>Vào quản lý hội đồng, gỡ môn học khỏi tất cả hội đồng trên, sau đó thực hiện xóa lại.</p>
                    </div>
                </div>
            </section>`;

        this.noitifi.popup(htmlBody, 'Không thể xóa môn học').then(() => null, () => null);
    }

    private confirmDeleteKhoahoc(objectId: number) {
        this.noitifi.confirmDelete().then(
            (confirmed) => {
                if (confirmed) {
                    this.elnKhoaHocService.deleteElnKhoaHoc(objectId).subscribe({
                        next: () => {
                            this.noitifi.toastSuccess('Xóa thông tin thành công');
                            this.loadPageData(this.pageIndex);
                        },
                        error: () => this.noitifi.toastError('Xóa môn học thất bại')
                    });
                }
            },
            () => null
        );
    }

    private escapeHtml(value: string): string {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}
