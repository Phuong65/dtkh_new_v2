import { CtdtHocphanService } from '@shared/services/ctdt-hocphan.service';
import { CtdtConfigService } from '@modules/shared/services/ctdt-config.service';
import { CtdtService } from '@modules/shared/services/ctdt.service';
import { DonViService } from '@modules/shared/services/don-vi.service';
import { NotificationService } from '@core/services/notification.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SharedModule } from '@modules/shared/shared.module';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { OvicQueryCondition } from '@core/models/dto';
import { ElnKhoaHoc, EXAMFORMAT } from '@modules/shared/models/elng-khoa-hoc';
import { AuthService } from '@core/services/auth.service';
import { CHUAN_DAU_RA, DINHDANG_BAITRACNGHIEM, ROLES, ROUTERS, THUONGXUYEN_TEST_TYPE } from '@modules/shared/utils/syscat';
import { firstValueFrom, forkJoin, Observable } from 'rxjs';
import { ElnChuyenMuc } from '@modules/shared/models/Elng';
import { DonVi } from '@modules/shared/models/don-vi';
import { ElnChuyenMucService } from '@modules/shared/services/elearning-chuyen-muc.service';
import { HelperService } from '@core/services/helper.service';
import { FieldsetModule } from 'primeng/fieldset';
import { PanelModule } from 'primeng/panel';
import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';
import { CoursePlanActivities } from '@modules/shared/models/course-plan-activities';
import { TableModule } from 'primeng/table';
import { key_server } from '@env';
import { DropdownModule } from 'primeng/dropdown';
import { SelectItemGroup } from 'primeng/api';
import { MultiSelectModule } from 'primeng/multiselect';
import { Ctdt } from '@modules/shared/models/ctdt';
import { CtdtHocphan } from '@modules/shared/models/ctdt_hocphan';


interface ItemGroupExTend extends SelectItemGroup {
    hocky?: number;
    select_item?: string;
    hp_hoctruoc?: number[];
    hp_tienquyet?: number[];
    hp_songhanh?: number[];
}
@Component({
    selector: 'app-monhoc-thongtin',
    standalone: true,
    imports: [
        CommonModule,
        SharedModule,
        FormsModule,
        ReactiveFormsModule,
        FieldsetModule,
        PanelModule,
        TableModule,
        MultiSelectModule,
        DropdownModule
    ],
    templateUrl: './monhoc-thongtin.component.html',
    styleUrls: ['./monhoc-thongtin.component.css']
})
export class MonhocThongtinComponent implements OnInit {

    isLanhDaoKhoa: boolean = false;

    isLanhDaoBomon: boolean = false;

    isManager: boolean = false;

    selectedCourse: ElnKhoaHoc;

    userId: number;

    routerDaotao: boolean = false;

    routerAdmin: boolean = false;

    routerLanhdaokhoa: boolean = false;

    routerGiangvien: boolean = false;

    routerLanhdaobomon: boolean = false;

    formKhoaHoc: FormGroup;

    chuandaura = CHUAN_DAU_RA;

    EXAMFORMAT = EXAMFORMAT;

    list_nganh_bomon: ElnChuyenMuc[];

    list_donvi_chuyenmon: DonVi[];

    slugIsValid: boolean = true;

    donvi_chuyenmon_id: number;

    bomon_id: number;

    list_plan: CoursePlanActivities[];

    list_test_thuongxuyen: CoursePlanActivities[];

    THUONGXUYEN_TEST_TYPE = THUONGXUYEN_TEST_TYPE;

    key_server = key_server;

    DINHDANG_BAITRACNGHIEM = DINHDANG_BAITRACNGHIEM;

    group_ctdt: ItemGroupExTend[] = [];

    selectCtdts: ItemGroupExTend[] = [];

    selectedCtdtsId: number[] = [];

    constructor(
        private activatedRoute: ActivatedRoute,
        private elnKhoaHocService: ElnKhoaHocService,
        private auth: AuthService,
        private elngUserProfileService: ElngUserProfileService,
        private router: Router,
        private notificationService: NotificationService,
        public formBuilder: FormBuilder,
        private elnChuyenMucService: ElnChuyenMucService,
        private donViService: DonViService,
        private helperService: HelperService,
        private coursePlanActivitiesService: CoursePlanActivitiesService,
        private ctdtService: CtdtService,
        private ctdtConfigService: CtdtConfigService,
        private ctdtHocphanService: CtdtHocphanService
    ) {
        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin) || this.auth.userHasRole(ROLES.troly_pdt) || this.auth.userHasRole(ROLES.chuyenvien_pdt) ? true : false;

        this.isLanhDaoKhoa = this.auth.userHasRole(ROLES.lanhdaokhoa);

        this.isLanhDaoBomon = this.auth.userHasRole(ROLES.lanhdaobomon);

        this.routerAdmin = this.auth.hasRouter(ROUTERS.admin, '/monhoc-thongtin');

        this.routerDaotao = this.auth.hasRouter(ROUTERS.daotao, '/monhoc-thongtin');

        this.routerLanhdaokhoa = this.auth.hasRouter(ROUTERS.lanhdao_khoa, '/monhoc-thongtin');

        this.routerGiangvien = this.auth.hasRouter(ROUTERS.giangvien, '/monhoc-thongtin');

        this.routerLanhdaobomon = this.auth.hasRouter(ROUTERS.lanhdao_bomon, '/monhoc-thongtin');

        this.userId = this.auth.user.id;

        this.formKhoaHoc = this.formBuilder.group(
            {
                title: ['', Validators.required],
                maso: ['', Validators.required],
                category_ids: ['', Validators.required],
                nganh_bomon_id: [''],
                slug: [''],
                desc: [''],
                yeucau_sinhvien: [''],
                tailieu_chinh: [''],
                tailieu_thamkhao: [''],
                sotinchi: ['', Validators.required],
                exam_format: [''],
                cdr: [''],
                sotinchi_th: ['', Validators.required],
                exam_type: [''],
                tongsogio: [''],
                lythuyet: [''],
                thaoluan_baitap: [''],
                th_thinghiem: [''],
                kiemtra_dinhky: [''],
                tuhoc: [''],
                av: [''],
            }
        );
    }

    get f() {
        return this.formKhoaHoc.controls;
    }

    ngOnInit(): void {
        this.activatedRoute.queryParams.subscribe((params) => {
            if (params && params['code']) {
                this.notificationService.isProcessing(true);

                const course_id = params['code'];

                const contition_course: ConditionOption = {
                    condition: [
                        { conditionName: 'id', condition: OvicQueryCondition.equal, value: course_id.toString(), orWhere: 'and' },
                    ],
                    set: [
                        { label: 'limit', value: '1' }
                    ],
                    page: null
                }

                if (this.routerGiangvien) {
                    contition_course.condition.push({ conditionName: 'creator_plan_id', condition: OvicQueryCondition.equal, value: this.userId.toString(), orWhere: 'and' })
                }

                const condition_user: ConditionOption = {
                    condition: [
                        { conditionName: 'user_id', condition: OvicQueryCondition.equal, value: this.userId.toString(), orWhere: 'and' }
                    ],
                    set: [
                        { label: 'limit', value: '1' }
                    ],
                    page: null
                }

                const condition_donvi: ConditionOption = {
                    condition: [
                        { conditionName: 'status', condition: OvicQueryCondition.greaterThan, value: '0', orWhere: 'and' },
                        { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: this.auth.user.donvi_id.toString(), orWhere: 'and' },
                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'order', value: 'ASC' },
                        { label: 'orderby', value: 'title' }
                    ],
                    page: null
                }

                const condition_nganh: ConditionOption = {
                    condition: [
                        { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' },
                        { conditionName: 'type', condition: OvicQueryCondition.equal, value: 'bomon', orWhere: 'and' },
                    ],
                    set: [
                        { label: 'limit', value: '-1' }
                    ],
                    page: null
                }

                const condition_ctdt: ConditionOption = {
                    condition: [

                    ],
                    set: [
                        { label: 'limit', value: '-1' }
                    ],
                    page: null
                }

                const condition_ctdt_khoi_kienthuc: ConditionOption = {
                    condition: [
                        { conditionName: 'GROUP', condition: OvicQueryCondition.equal, value: 'KHOI_KIEN_THUC', orWhere: 'and' },
                    ],
                    set: [
                        { label: 'limit', value: '-1' }
                    ],
                    page: null
                }

                forkJoin([
                    this.elnKhoaHocService.getKhoaHocByPageNew_2(contition_course),
                    this.elngUserProfileService.getUserProfileByPageNewV2(condition_user),
                    this.donViService.getDonviByPageNew(condition_donvi),
                    this.elnChuyenMucService.getChuyemucByPageNew(condition_nganh),
                    this.ctdtService.getCtdtByPageNew(condition_ctdt),
                    this.ctdtConfigService.getCtdtConfigByPageNew(condition_ctdt_khoi_kienthuc)
                ]).subscribe({
                    next: ([_course, _user_profile, _donvi, _nganh, _ctdt, _ctdt_khoi_kienthuc]) => {
                        if (_course.recordsFiltered) {

                            this.selectedCourse = _course.data[0];

                            if (this.routerLanhdaokhoa) {
                                if (_user_profile.recordsFiltered === 0 || this.selectedCourse.category_ids !== _user_profile.data[0].donvi_chuyenmon_id) {
                                    this.notificationService.toastError("Không tìm thấy môn học");
                                    this.router.navigate(['/admin/content-none']);
                                }
                            }

                            if (this.routerLanhdaobomon) {
                                if (_user_profile.recordsFiltered === 0 || this.selectedCourse.nganh_bomon_id !== _user_profile.data[0].bomon_id) {
                                    this.notificationService.toastError("Không tìm thấy môn học");
                                    this.router.navigate(['/admin/content-none']);
                                }
                            }

                            this.list_nganh_bomon = _nganh.data;

                            this.list_donvi_chuyenmon = _donvi.data;

                            const khung_trinh_do_config = this.auth.getSysConfigParams('KHOI_KIEN_THUC');

                            const g_ctdt = [];

                            _ctdt.data.forEach(f => {
                                const child = _ctdt_khoi_kienthuc.data.filter(m => m.ctdt_id === f.id);

                                const items = [];

                                if (child.length) {
                                    child.forEach(c => {
                                        items.push({ label: c.title, value: c.key, parent_id: f.id })
                                    })
                                } else {
                                    if (khung_trinh_do_config && Array.isArray(khung_trinh_do_config)) {
                                        khung_trinh_do_config.forEach(k => {
                                            items.push({ label: k.title, value: k.key, parent_id: f.id })
                                        })
                                    }
                                }

                                g_ctdt.push({
                                    label: f.ten, value: f.id,
                                    items: items,
                                    select_item: null,
                                    hocky: null
                                })
                            })

                            this.group_ctdt = g_ctdt;

                            this.editKhoaHoc();

                            this.notificationService.isProcessing(false);

                        } else {
                            this.notificationService.toastError("Không tìm thấy môn học");
                            this.router.navigate(['/admin/content-none']);
                        }
                    },
                    error: () => {
                        this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
                    }
                })
            } else {
                this.router.navigate(['/admin/content-none']);
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

    resetForm() {
        this.f['sotinchi_th'].setValue(0);
    }

    async editKhoaHoc() {
        if (this.selectedCourse) {
            const condition_ctdt_hocphan: ConditionOption = {
                condition: [
                    { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse.id.toString(), orWhere: 'and' },
                ],
                set: [
                    { label: 'limit', value: '-1' }
                ],
                page: null
            }

            const request_ctdt_hocphan = await firstValueFrom(this.ctdtHocphanService.getCtdtHocphanByPageNew(condition_ctdt_hocphan));

            const data_ctdt_select = [];

            const select_ctdt_ids = [];

            this.group_ctdt.forEach(f => {
                const index = request_ctdt_hocphan.data.findIndex(m => m.ctdt_id === f.value);
                if (index !== -1) {
                    select_ctdt_ids.push(f.value);
                    const index_kkt = f.items.findIndex(m => m.value === request_ctdt_hocphan.data[index].khoikienthuc);
                    if (index_kkt !== -1) {
                        f.select_item = f.items[index_kkt].value;
                        f.hocky = request_ctdt_hocphan.data[index].hocky;
                        f.hp_hoctruoc = request_ctdt_hocphan.data[index].hp_hoctruoc;
                        f.hp_songhanh = request_ctdt_hocphan.data[index].hp_songhanh;
                        f.hp_tienquyet = request_ctdt_hocphan.data[index].hp_tienquyet;
                    }
                    data_ctdt_select.push(f)
                }
            })
            this.selectedCtdtsId = select_ctdt_ids;
            this.selectCtdts = data_ctdt_select;
            this.resetForm();
            this.f['title'].setValue(this.selectedCourse.title);
            this.f['slug'].setValue(this.selectedCourse.slug);
            this.f['maso'].setValue(this.selectedCourse.maso);
            if (this.selectedCourse.desc) {
                this.f['desc'].setValue(this.selectedCourse.desc);
            } else {
                setTimeout(() => {
                    this.f['desc'].setValue(`
                        <p>1) Quy định về điểm:</p>
                        <p><br></p>
                        <p>2) Điều kiện dự thi:</p>
                    `);
                })
            }
            this.f['category_ids'].setValue(this.selectedCourse.category_ids ? this.selectedCourse.category_ids : null);
            this.f['tailieu_chinh'].setValue(this.selectedCourse.tailieu_chinh);
            this.f['tailieu_thamkhao'].setValue(this.selectedCourse.tailieu_thamkhao);
            this.f['nganh_bomon_id'].setValue(this.selectedCourse.nganh_bomon_id);
            this.f['av'].setValue(this.selectedCourse.av);
            this.f['yeucau_sinhvien'].setValue(this.selectedCourse.yeucau_sinhvien);
            if (this.selectedCourse.params) {
                this.f['sotinchi'].setValue(this.selectedCourse.params.sotinchi);
                this.f['exam_format'].setValue(this.selectedCourse.params.exam_format);
                this.f['cdr'].setValue(this.selectedCourse.params.cdr);
                this.f['sotinchi_th'].setValue(this.selectedCourse.params.sotinchi_th);
                this.f['exam_type'].setValue(this.selectedCourse.params.exam_type ? this.selectedCourse.params.exam_type : null);
                this.f['tongsogio'].setValue(this.selectedCourse.params.tongsogio ? this.selectedCourse.params.tongsogio : null);
                this.f['lythuyet'].setValue(this.selectedCourse.params.lythuyet ? this.selectedCourse.params.lythuyet : null);
                this.f['thaoluan_baitap'].setValue(this.selectedCourse.params.thaoluan_baitap ? this.selectedCourse.params.thaoluan_baitap : null);
                this.f['th_thinghiem'].setValue(this.selectedCourse.params.th_thinghiem ? this.selectedCourse.params.th_thinghiem : null);
                this.f['kiemtra_dinhky'].setValue(this.selectedCourse.params.kiemtra_dinhky ? this.selectedCourse.params.kiemtra_dinhky : null);
                this.f['tuhoc'].setValue(this.selectedCourse.params.tuhoc ? this.selectedCourse.params.tuhoc : null);
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

            condition_monhoc.condition.push({ conditionName: 'id', condition: OvicQueryCondition.notEqual, value: this.selectedCourse.id.toString(), orWhere: 'and' })

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

    addCtdtHocPhan(_monhoc): Promise<any> {
        return new Promise(async (resolve, reject) => {
            const request: Observable<any>[] = [];
            const index_cate = this.list_donvi_chuyenmon.findIndex(m => m.id === _monhoc.category_ids)
            this.selectCtdts.forEach(f => {
                const data: CtdtHocphan = {
                    course_id: this.selectedCourse.id,
                    course_name: _monhoc.title,
                    khoikienthuc: f['select_item'] ? f['select_item'] : null,
                    sotinchi: _monhoc.params.sotinchi,
                    sotinchi_thuchanh: _monhoc.params.sotinchi_th,
                    hocky: f.hocky ? f.hocky : null,
                    category_title: index_cate !== -1 ? this.list_donvi_chuyenmon[index_cate].title : null,
                    status: 1,
                    category_id: _monhoc.category_ids,
                    ctdt_id: f.value,
                    hp_hoctruoc: f.hp_hoctruoc ? f.hp_hoctruoc : null,
                    hp_tienquyet: f.hp_tienquyet ? f.hp_tienquyet : null,
                    hp_songhanh: f.hp_songhanh ? f.hp_songhanh : null,
                    ordering: 100
                }
                request.push(this.ctdtHocphanService.addCtdtHocphan(data));
            })

            await firstValueFrom(this.ctdtHocphanService.deleteCtdtHocphanByCol(this.selectedCourse.id, 'course_id'))

            forkJoin(request).subscribe({
                next: () => {
                    resolve(true);
                },
                error: () => {
                    resolve(null);
                }
            })
        });
    }


    async saveCourse() {
        if (this.formKhoaHoc.valid) {
            this.notificationService.isProcessing(true);


            const checkMa = await this.onCheckMaHpPromise();


            if (checkMa === null) {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
                return;
            }

            if (checkMa) {


                const data = { ...this.formKhoaHoc.getRawValue() };

                data['maso'] = data['maso'] ? data['maso'].trim() : data['maso'];

                data['slug'] = this.helperService.slugVietnamese(data['title']);

                data['params'] = {
                    sotinchi: data['sotinchi'],
                    exam_format: data['exam_format'],
                    cdr: data['cdr'],
                    sotinchi_th: data['sotinchi_th'],
                    exam_type: data['exam_type'],
                    tongsogio: data['tongsogio'],
                    lythuyet: data['lythuyet'],
                    thaoluan_baitap: data['thaoluan_baitap'],
                    th_thinghiem: data['th_thinghiem'],
                    kiemtra_dinhky: data['kiemtra_dinhky'],
                    tuhoc: data['tuhoc'],
                }

                if (this.selectCtdts.length) {
                    const check = this.selectCtdts.filter(m => !m.select_item).length;
                    if (check !== 0) {
                        this.notificationService.isProcessing(false);
                        return this.notificationService.toastWarning("Vui lòng chọn Khung Trình Độ và Học Kỳ cho môn học ở Chương Trinh Đào Tạo")
                    }

                    await this.addCtdtHocPhan(data);
                } else {
                    await firstValueFrom(this.ctdtHocphanService.deleteCtdtHocphanByCol(this.selectedCourse.id, 'course_id'));
                }

                delete data['sotinchi'];
                delete data['exam_format'];
                delete data['cdr'];
                delete data['sotinchi_th'];
                delete data['exam_type'];
                delete data['tongsogio'];
                delete data['lythuyet'];
                delete data['thaoluan_baitap'];
                delete data['th_thinghiem'];
                delete data['kiemtra_dinhky'];
                delete data['tuhoc'];


                this.elnKhoaHocService.updateElnKhoaHoc(this.selectedCourse.id, data).subscribe({
                    next: () => {
                        this.notificationService.toastSuccess('Sửa thông tin thành công');
                        this.notificationService.isProcessing(false);
                    },
                    error: () => {
                        this.notificationService.toastError('Sửa thông tin thất bại');
                        this.notificationService.isProcessing(false);
                    }
                });

            } else {
                this.notificationService.isProcessing(false);
                this.notificationService.toastWarning("Mã học phần đã tồn tại, vui lòng thử lại");
            }
        } else {
            this.notificationService.toastError('Thông tin nhập vào chưa đúng, vui lòng kiểm tra lại', 'Lỗi nhập liệu');
            return this.formKhoaHoc.markAllAsTouched();
        }
    }

    onChangeTypeTest(event, test: CoursePlanActivities) {
        if (event) {
            test.type = event.key;
        }
    }

    createTestThuongxuyen(exam_format: string, sotinchi: number) {
        this.list_test_thuongxuyen = [];
        if (sotinchi && sotinchi !== 0 && exam_format) {
            let type = null;
            switch (exam_format) {
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
                    this.createTestIctu(type, exam_format, sotinchi);
                    break;
                case 'hvu':
                    this.createTestHvu(type, exam_format, sotinchi);
                    break;
                default:
                    break;
            }

        } else {
            this.notificationService.toastWarning('Vui lòng cài đặt số tín chỉ cho môn học');
        }
    }

    createTestIctu(type, exam_format: string, sotinchi: number) {
        if (sotinchi) {
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
                        if (exam_format === 'DUAN')
                            data_duan.push(test);
                    }
                })

                if (sotinchi) {
                    if (data.length < sotinchi) {
                        for (let i = data.length + 1; i <= sotinchi; i++) {
                            const test: CoursePlanActivities = {
                                course_id: this.selectedCourse.id,
                                week: 1000,
                                title: 'Bài kiểm tra thường xuyên '.concat(i.toString()),
                                desc: null,
                                video: null,
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
                for (let i = 1; i <= sotinchi; i++) {
                    const test: CoursePlanActivities = {
                        course_id: this.selectedCourse.id,
                        week: 1000,
                        title: 'Bài kiểm tra thường xuyên '.concat(i.toString()),
                        desc: null,
                        video: null,
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

            if (exam_format === 'DUAN') {

                const index_0 = this.list_test_thuongxuyen.findIndex(m => m.ordering === 0);

                if (index_0 === -1) {
                    const test: CoursePlanActivities = {
                        course_id: this.selectedCourse.id,
                        week: 1000,
                        title: 'Danh sách dự án',
                        desc: null,
                        video: null,
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
                        course_id: this.selectedCourse.id,
                        week: 1000,
                        title: 'Thi kết thúc học phần',
                        desc: null,
                        video: null,
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
            this.notificationService.toastWarning('Vui lòng cài đặt số tín chỉ cho môn học');
        }
    }

    createTestHvu(type, exam_format: string, sotinchi: number) {
        const index = this.list_plan.findIndex(m => m.week === 1000);

        let maxTest = 1;

        if (Number(sotinchi) > 2) {
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
                    if (exam_format === 'DUAN')
                        data_duan.push(test);
                }
            })


            if (data.length < maxTest) {
                for (let i = data.length + 1; i <= maxTest; i++) {
                    const test: CoursePlanActivities = {
                        course_id: this.selectedCourse.id,
                        week: 1000,
                        title: 'Bài kiểm tra thường xuyên '.concat(i.toString()),
                        desc: null,
                        video: null,
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
                    course_id: this.selectedCourse.id,
                    week: 1000,
                    title: type,
                    desc: null,
                    video: null,
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

        if (exam_format === 'DUAN') {
            const index_0 = this.list_test_thuongxuyen.findIndex(m => m.ordering === 0);
            if (index_0 === -1) {
                const test: CoursePlanActivities = {
                    course_id: this.selectedCourse.id,
                    week: 1000,
                    title: 'Danh sách dự án',
                    desc: null,
                    video: null,
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
                    course_id: this.selectedCourse.id,
                    week: 1000,
                    title: 'Thi kết thúc học phần',
                    desc: null,
                    video: null,
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

    onChangeSelectCtdt() {
        if (this.selectedCtdtsId && this.selectedCtdtsId.length) {
            this.selectCtdts = this.group_ctdt.filter(m => this.selectedCtdtsId.includes(m.value));
        } else {
            this.selectCtdts = [];
        }
    }
}
