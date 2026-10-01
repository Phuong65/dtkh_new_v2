import { OvicDateTimeService } from '@modules/shared/services/ovic-date-time.service';
import { HOIDONG_STATUS } from './../../../../shared/utils/syscat';
import { objectFillter } from './../../thongke-solieu-tonghop/ketqua-test-sinhvien/ketqua-test-sinhvien.component';
import { HoidongThamdinhService } from './../../../../shared/services/hoidong-thamdinh.service';
import { NotificationService } from '@core/services/notification.service';
import { HelperService } from '@core/services/helper.service';
import { Component, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@modules/shared/shared.module';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '@core/services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { ROLES, ROUTERS } from '@modules/shared/utils/syscat';
import { HoidongThamdinh } from '@modules/shared/models/hoidong-thamdinh';
import { DonVi } from '@modules/shared/models/don-vi';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { OvicQueryCondition } from '@core/models/dto';
import { forkJoin } from 'rxjs';
import { DonViService } from '@modules/shared/services/don-vi.service';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { TableModule } from 'primeng/table';
import { Paginator, PaginatorModule } from 'primeng/paginator';
import { DatePickerModule } from 'primeng/datepicker';
import { OpenFileManagerV2Component } from '@modules/shared/components/open-file-manager-v2/open-file-manager-v2.component';
import { HoidongThamdinhThanhvienService } from '@modules/shared/services/hoidong-thamhdinh-thanhvien.service';
import { HoidongThamdinhThanhvien } from '@modules/shared/models/hoidong-thamdinh-thanhvien';
import { HoidongThamdinhMonhoc } from '@modules/shared/models/hoidong-thamdinh-monhoc';
import { HoidongThamdinhMonhocService } from '@modules/shared/services/hoidong-thamdinh-monhoc.service';
import { EXAMFORMAT } from '@modules/shared/models/elng-khoa-hoc';
import { MatSelectModule } from '@angular/material/select';
import { MatListModule } from '@angular/material/list';
import { SaoChepHoidongComponent } from '../sao-chep-hoidong/sao-chep-hoidong.component';
import { CopySelectedHoidongJobStatus, HoidongType } from '../sao-chep-hoidong/sao-chep-hoidong.types';



@Component({
    selector: 'app-hd-thamdinh-manager',
    standalone: true,
    imports: [
        CommonModule,
        SharedModule,
        FormsModule,
        ReactiveFormsModule,
        NgbTooltipModule,
        TableModule,
        PaginatorModule,
        DatePickerModule,
        OpenFileManagerV2Component,
        RouterModule,
        MatSelectModule,
        MatListModule,
        SaoChepHoidongComponent
    ],
    templateUrl: './hd-thamdinh-manager.component.html',
    styleUrls: ['./hd-thamdinh-manager.component.css']
})
export class HdThamdinhManagerComponent implements OnInit {

    type_hd: HoidongType | 'baigiang';

    @ViewChild('createHoidong') createHoidong: TemplateRef<any>;

    @ViewChild('templateMonhoc') templateMonhoc: TemplateRef<any>;

    @ViewChild('templateThanhvien') templateThanhvien: TemplateRef<any>;

    @ViewChild('templateSaoChepHoidong') templateSaoChepHoidong: TemplateRef<any>;

    @ViewChild('paginator') paginator: Paginator;

    isManager: boolean = false;

    isLanhdaokhoa: boolean = false;

    isLanhDaoBomon: boolean = false;

    canAdd: boolean = false;

    canDelete: boolean = false;

    canUpdate: boolean = false;

    list_hoidong: HoidongThamdinh[];

    selectHoidong: HoidongThamdinh;

    formData: FormGroup;

    list_donvi_chuyenmon: DonVi[];

    donvi_chuyenmon_id: number = 0;

    pageIndex: number = 1;

    limit_hoidong: number = 20;

    total_hoidong: number = 0;

    isUpdated: boolean = false;

    objectFillter = {};

    formTitle: string;

    list_thanhvien: HoidongThamdinhThanhvien[];

    list_hoidong_monhoc: HoidongThamdinhMonhoc[];

    searchMonhoc: string;

    searchUser: string;

    hoidong_status = HOIDONG_STATUS;

    get sourceCopyType(): HoidongType {
        return this.type_hd === 'celo' ? 'cauhoi' : 'celo';
    }

    get targetCopyType(): HoidongType {
        return this.type_hd as HoidongType;
    }

    get copyButtonLabel(): string {
        return this.sourceCopyType === 'celo'
            ? 'Sao chép từ CPI/Bài giảng'
            : 'Sao chép từ hội đồng câu hỏi';
    }

    constructor(
        private auth: AuthService,
        private router: Router,
        private helperService: HelperService,
        private notificationService: NotificationService,
        private hoidongThamdinhService: HoidongThamdinhService,
        public formBuilder: FormBuilder,
        private httpHepler: HttpParamsHeplerService,
        private elngUserProfileService: ElngUserProfileService,
        private donViService: DonViService,
        private hoidongThamdinhThanhvienService: HoidongThamdinhThanhvienService,
        private hoidongThamdinhMonhocService: HoidongThamdinhMonhocService,
        private ovicDateTimeService: OvicDateTimeService
    ) {
        const url = this.router.url.substring(7).split('?')[0];

        const key_url = url.split("/")[1];

        switch (key_url) {
            case 'thamdinh-celo':
                this.type_hd = "celo";
                break;
            case 'thamdinh-cauhoi':
                this.type_hd = "cauhoi";
                break;
            default:
                break;
        }

        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin) || this.auth.userHasRole(ROLES.hoidongthi_lanhdao) || this.auth.userHasRole(ROLES.chuyenvien_pdt) ? true : false;

        this.isLanhdaokhoa = this.auth.userHasRole(ROLES.lanhdaokhoa);

        this.isLanhDaoBomon = this.auth.userHasRole(ROLES.lanhdaobomon);

        this.canAdd = this.auth.userCanAdd(url);

        this.canDelete = this.auth.userCanDelete(url);

        this.canUpdate = this.auth.userCanEdit(url);

        this.formData = this.formBuilder.group(
            {
                title: ['', Validators.required],
                desc: [''],
                date_start: ['', Validators.required],
                date_end: ['', Validators.required],
                category_id: ['', Validators.required],
                type: ['', Validators.required],
                status: [''],
                files: ['']
            }
        );
    }

    ngOnInit(): void {
        this.loadUserInfo();
    }

    get f() {
        return this.formData.controls;
    }

    loadUserInfo() {
        this.notificationService.isProcessing(true);
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

                this.list_donvi_chuyenmon = _resDonvi;

                this.loadHoidong(1);
            },

            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError("Lỗi kết nỗi, vui lòng thử lại")
            }
        })
    }

    loadHoidong(page: number) {
        this.notificationService.isProcessing(true);
        const condition_hoidong: ConditionOption = {
            condition: [
                { conditionName: 'type', condition: OvicQueryCondition.equal, value: this.type_hd, orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: this.limit_hoidong.toString() },
                { label: 'with', value: 'countthanhviens,countcourses' }
            ],
            page: page.toString()
        }

        if ((this.isLanhdaokhoa || this.isLanhDaoBomon) && !this.isManager) {
            condition_hoidong.condition.push(
                { conditionName: 'category_id', condition: OvicQueryCondition.equal, value: this.donvi_chuyenmon_id.toString(), orWhere: 'and' },
                { conditionName: 'status', condition: OvicQueryCondition.greaterThan, value: '0', orWhere: 'and' }
            )
        }

        const array_like = ['title']
        Object.keys(this.objectFillter).forEach(f => {
            const index = array_like.findIndex(m => m === f);
            if (index !== -1) {
                condition_hoidong.condition.push({ conditionName: f, condition: OvicQueryCondition.like, value: '%' + this.objectFillter[f] + '%', orWhere: 'and' })
            } else {
                condition_hoidong.condition.push({ conditionName: f, condition: OvicQueryCondition.equal, value: this.objectFillter[f], orWhere: 'and' })
            }
        })

        forkJoin([
            this.hoidongThamdinhService.getHoidongThamdinhByPageNew(condition_hoidong),
            this.ovicDateTimeService.getCurrentDateTime()
        ]).subscribe({
            next: ([_hoidong, _time_server]) => {
                const _index_start = (page - 1) * this.limit_hoidong;

                _hoidong.data.forEach((f, key) => {
                    f['index_'] = _index_start + key + 1;
                })

                this.list_hoidong = _hoidong.data;

                this.total_hoidong = _hoidong.recordsFiltered;

                this.notificationService.isProcessing(false)
            },
            error: () => {
                this.notificationService.isProcessing(false);
            }
        })
    }

    formReset() {
        this.formData.reset();
        this.isUpdated = false;
        this.f['status'].setValue(0);
        this.f['type'].setValue(this.type_hd);
    }

    changePage(event) {
        this.pageIndex = event.page + 1;
        this.loadHoidong(event.page + 1);
    }

    closeSideMenu() {
        this.notificationService.closeSideNavigationMenu();
    }

    openAddFormHoidong() {
        this.formTitle = "Thêm hội đồng";
        this.formReset();
        this.notificationService.openSideNavigationMenu({ template: this.createHoidong, size: 700, offsetTop: "0px" });
    }

    openCopyHoidong(): void {
        this.notificationService.openSideNavigationMenu({
            template: this.templateSaoChepHoidong,
            size: Math.min(window.innerWidth, 1200),
            offsetTop: '0px'
        });
    }

    copyHoidongCompleted(job: CopySelectedHoidongJobStatus): void {
        this.loadHoidong(this.pageIndex);
        if (job.status === 'completed') {
            this.notificationService.toastSuccess(`Đã sao chép ${job.created_total} hội đồng`);
        } else {
            this.notificationService.toastWarning(`Đã tạo ${job.created_total}, thất bại ${job.failed_total}, bỏ qua ${job.skipped_total} hội đồng`);
        }
    }

    openEditFormHoidong(hoidong: HoidongThamdinh) {
        this.formTitle = "Sửa hội đồng";
        this.formReset();
        this.selectHoidong = hoidong;
        this.f['title'].setValue(hoidong.title);
        this.f['date_start'].setValue(hoidong.date_start ? new Date(hoidong.date_start) : new Date());
        this.f['date_end'].setValue(hoidong.date_end ? new Date(hoidong.date_end) : new Date());
        this.f['category_id'].setValue(hoidong.category_id);
        this.f['status'].setValue(hoidong.status);
        this.f['files'].setValue(hoidong.files);
        this.isUpdated = true;
        this.notificationService.openSideNavigationMenu({ template: this.createHoidong, size: 700, offsetTop: "0px" });
    }

    searchHoidong(event) {
        if (event) {
            const value = event.target['value'].trim();
            if (!value) {
                delete this.objectFillter['title'];
                this.resetPage();
            } else if (event.key === 'Enter') {
                this.objectFillter['title'] = value;
                this.resetPage();
            }
        }
    }

    onChangeFilterChuyenmon(event: DonVi) {
        if (event) {
            this.objectFillter['category_id'] = event.id;
        } else {
            delete this.objectFillter['category_id'];
        }
        this.resetPage();
    }

    resetPage() {
        if (this.paginator && !this.paginator.empty()) {
            this.paginator.changePage(0);
        } else {
            this.loadHoidong(1);
        }
    }

    saveHoidong() {
        if (this.formData.valid) {
            this.notificationService.isProcessing(true);
            const data = { ...this.formData.getRawValue() };
            data['date_start'] = this.helperService.strToSQLDate(data['date_start']);
            data['date_end'] = this.helperService.strToSQLDate(data['date_end']);
            if (this.isUpdated) {
                this.hoidongThamdinhService.updateHoidongThamdinh(this.selectHoidong.id, data).subscribe({
                    next: () => {
                        this.loadHoidong(this.pageIndex);
                        this.closeSideMenu();
                        this.notificationService.toastSuccess("Sửa thành công");
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError("Sửa thất bại");
                    }
                })
            } else {
                this.hoidongThamdinhService.addHoidongThamdinh(data).subscribe({
                    next: () => {
                        this.loadHoidong(this.pageIndex);
                        this.formReset();
                        this.notificationService.toastSuccess("Thêm thành công");
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError("Thêm thất bại");
                    }
                })
            }
        }
    }

    deleteHoidong(row: HoidongThamdinh) {
        this.notificationService.confirmDelete().then(a => {
            if (a) {
                this.hoidongThamdinhService.deleteHoidongThamdinh(row.id).subscribe({
                    next: () => {
                        this.loadHoidong(this.pageIndex);
                        this.notificationService.toastSuccess("Xóa thành công");
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError("Xóa thất bại");
                    }
                })
            }
        })
    }

    viewThanhviens(row: HoidongThamdinh) {
        if (row.countthanhviens > 0) {
            this.notificationService.isProcessing(true);

            this.selectHoidong = row;

            const condition_thanhvien: ConditionOption = {
                condition: [
                    { conditionName: "hoidong_thamdinh_id", condition: OvicQueryCondition.equal, value: row.id.toString() }
                ],
                set: [
                    { label: 'limit', value: '-1' },
                    { label: 'with', value: 'user' }
                ],
                page: null
            }

            this.hoidongThamdinhThanhvienService.getHoidongThamdinhThanhvienByPageNew(condition_thanhvien).subscribe({
                next: (_thanhvien) => {
                    _thanhvien.data.forEach(f => {
                        if (f.user) {
                            f['display_name'] = f.user.display_name;
                            f['email'] = f.user.email;
                        }
                    })
                    this.list_thanhvien = _thanhvien.data;
                    this.notificationService.openSideNavigationMenu({ template: this.templateThanhvien, size: 600, offsetTop: '0px' });
                    this.notificationService.isProcessing(false);
                },
                error: () => {
                    this.notificationService.isProcessing(false);
                }
            })
        }
    }

    viewCourses(row: HoidongThamdinh) {
        if (row.countthanhviens > 0) {
            this.notificationService.isProcessing(true);

            this.selectHoidong = row;

            const condition_monhoc: ConditionOption = {
                condition: [
                    { conditionName: "hoidong_thamdinh_id", condition: OvicQueryCondition.equal, value: row.id.toString() }
                ],
                set: [
                    { label: 'limit', value: '-1' },
                    { label: 'with', value: 'course' },
                ],
                page: null
            }

            this.hoidongThamdinhMonhocService.getHoidongThamdinhMonhocByPageNew(condition_monhoc).subscribe({
                next: (_course) => {
                    _course.data.forEach(f => {
                        if (f['course']) {
                            const params = f['course']['params'];
                            if (params) {
                                if (typeof params === 'string') {
                                    f['course_params'] = JSON.parse(params);
                                } else if (typeof params === 'object') {
                                    f['course_params'] = params;
                                } else {
                                    f['course_params'] = null;
                                }
                            } else {
                                f['course_params'] = null;
                            }
                            f['course_title'] = f['course']['title'];
                            f['course_maso'] = f['course']['maso'];
                            f['created_plan_name'] = f['course']['user_name'] ? f['course']['user_name'] : 'Chưa phân quyền';
                        }
                        if (f['course_params']) {
                            if (f['course_params']) {
                                if (!f['course_params'].exam_type) {
                                    const index = EXAMFORMAT.findIndex((m) => m.key === f['course_params'].exam_format);
                                    if (index !== -1) {
                                        f['hinhthucthi'] = EXAMFORMAT[index].label;
                                    }
                                } else {
                                    const index = EXAMFORMAT.findIndex((m) => m.id === f['course_params'].exam_type);
                                    if (index !== -1) {
                                        f['hinhthucthi'] = EXAMFORMAT[index].label;
                                    }
                                }

                                const sotinchi = f['course_params'].sotinchi ? f['course_params'].sotinchi : 0;
                                const sotinchi_th = f['course_params']['sotinchi_th'] ? f['course_params']['sotinchi_th'] : 0;
                                const index_m = EXAMFORMAT.findIndex((m) => m.key === f['course_params'].exam_format);
                                let exam = 'Chưa có thông tin';

                                if (index_m !== -1) {
                                    exam = EXAMFORMAT[index_m].label;
                                }

                                f['info_'] = ' - TC: ' + sotinchi.toString().concat('-', sotinchi_th.toString(), ' - ', f['hinhthucthi']);
                            }
                        }
                    })

                    this.list_hoidong_monhoc = _course.data;
                    this.notificationService.openSideNavigationMenu({ template: this.templateMonhoc, size: 600, offsetTop: '0px' });
                    this.notificationService.isProcessing(false);
                },
                error: () => {
                    this.notificationService.isProcessing(false);
                }
            })
        }
    }

    closeForm() {
        this.notificationService.closeSideNavigationMenu();
    }
}
