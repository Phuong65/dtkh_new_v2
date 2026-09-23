import { CtdtConfigService } from './../../../../shared/services/ctdt-config.service';
import { data } from 'autoprefixer';
import { ConfigsService } from '@shared/services/configs.service';
import { CtdtMuctieuCuthe, TYPE_CTDT_MUCTIEU_CUTHE } from './../../../../shared/models/ctdt-muctieu-cuthe';
import { CtdtTuongthichService } from './../../../../shared/services/ctdt-tuongthich.service';
import { CtdtMuctieuCutheService } from './../../../../shared/services/ctdt-muctieu-cuthe.service';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';

import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { OvicQueryCondition } from '@core/models/dto';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { CtdtService } from '@modules/shared/services/ctdt.service';
import { DonViService } from '@modules/shared/services/don-vi.service';
import { ElnChuyenMucService } from '@modules/shared/services/elearning-chuyen-muc.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { HeDtService } from '@modules/shared/services/he-dt.service';
import { firstValueFrom, forkJoin } from 'rxjs';
import { Ctdt } from '@modules/shared/models/ctdt';
import { DonVi } from '@modules/shared/models/don-vi';
import { ElnChuyenMuc } from '@modules/shared/models/Elng';
import { HeDt } from '@modules/shared/models/he-dt';
import { DANHHIEU_TOTNGHIEP, ROLES } from '@modules/shared/utils/syscat';
import { DividerModule } from 'primeng/divider';
import { SharedModule } from '@modules/shared/shared.module';
import { PanelModule } from 'primeng/panel';
import { TableModule } from 'primeng/table';
import { CtdtTuongthich } from '@modules/shared/models/ctdt-tuongthich';
import { MultiSelectModule } from 'primeng/multiselect';
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { APP_CONFIGS } from '@env';
import { Params } from '@modules/shared/models/configs';
import { CtdtConfig } from '@modules/shared/models/ctdt-config';

export interface typeMuctieuCuthe {
    key: string;
    title: string;
    disabled?: boolean;
    children: CtdtMuctieuCuthe[];
}

@Component({
    selector: 'app-ctdt-muctieu-cdr',
    standalone: true,
    imports: [
    DividerModule,
    SharedModule,
    PanelModule,
    TableModule,
    FormsModule,
    ReactiveFormsModule,
    MultiSelectModule,
    NgbModule
],
    templateUrl: './ctdt-muctieu-cdr.component.html',
    styleUrls: ['./ctdt-muctieu-cdr.component.css']
})

export class CtdtMuctieuCdrComponent implements OnInit {

    @ViewChild('templateCtdtMuctieu') templateCtdtMuctieu: TemplateRef<any>;

    isLanhDaoKhoa: boolean = false;

    isManager: boolean = false;

    selectedCtdt: Ctdt;

    formMuctieuCuthe: FormGroup;

    isUpdated: boolean = false;

    userId: number;

    donvi_chuyenmon_id: number;

    type_ctdt_muctieu_cuthe: CtdtConfig[] = [];

    list_tuongthich: CtdtConfig[] = [];

    list_ctdt_muctieu_cuthe: typeMuctieuCuthe[];

    list_muctieu_cuthe: CtdtMuctieuCuthe[] = [];

    selectedMuctieuCuthe: CtdtMuctieuCuthe;

    formTitle: string;

    kyhieuMutieuCuthe: string = 'PEO';

    constructor(
        private auth: AuthService,
        private notificationService: NotificationService,
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private ctdtService: CtdtService,
        public formBuilder: FormBuilder,
        private elngUserProfileService: ElngUserProfileService,
        private ctdtMuctieuCutheService: CtdtMuctieuCutheService,
        private ctdtTuongthichService: CtdtTuongthichService,
        private configsService: ConfigsService,
        private ctdtConfigService: CtdtConfigService
    ) {
        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin) || this.auth.userHasRole(ROLES.troly_pdt) || this.auth.userHasRole(ROLES.chuyenvien_pdt) ? true : false;

        this.isLanhDaoKhoa = this.auth.userHasRole(ROLES.lanhdaokhoa);

        this.userId = this.auth.user.id;

        this.formMuctieuCuthe = this.formBuilder.group(
            {
                ctdt_id: ['', Validators.required],
                kyhieu: [''],
                ordering: ['', Validators.required],
                noidung: ['', Validators.required],
                type: ['', Validators.required],
                tuongthich: ['']
            }
        );
    }

    ngOnInit(): void {
        if (this.isLanhDaoKhoa || this.isManager) {
            this.activatedRoute.queryParams.subscribe(async (params) => {

                if (params && params['code']) {

                    this.notificationService.isProcessing(true);

                    const ctdtId = params['code'];

                    const contition_ctdt: ConditionOption = {
                        condition: [
                            { conditionName: 'id', condition: OvicQueryCondition.equal, value: ctdtId.toString() },
                        ],
                        set: [
                            { label: 'limit', value: '1' }
                        ],
                        page: null
                    }

                    const condition_user: ConditionOption = {
                        condition: [
                            { conditionName: 'user_id', condition: OvicQueryCondition.equal, value: this.userId.toString(), orWhere: 'and' },
                        ],
                        set: [
                            { label: 'limit', value: '1' },
                        ],
                        page: null
                    }

                    const condition_trinhdo: ConditionOption = {
                        condition: [
                        ],
                        set: [
                            { label: 'limit', value: '-1' },
                            { label: 'include', value: 'KHUNG_TRINH_DO,TUONGTHICH_PEOs' },
                            { label: 'include_by', value: 'config_key' }
                        ],
                        page: null
                    }

                    const condition_ctdt_config: ConditionOption = {
                        condition: [
                            { conditionName: 'ctdt_id', condition: OvicQueryCondition.equal, value: ctdtId.toString() },
                        ],
                        set: [
                            { label: 'limit', value: '-1' },
                            { label: 'include', value: 'KHUNG_TRINH_DO,TUONGTHICH_PEOs' },
                            { label: 'include_by', value: 'group' },
                            { label: 'orderby', value: 'ordering' },
                            { label: 'order', value: 'ASC' }
                        ],
                        page: null
                    }


                    forkJoin([
                        this.ctdtService.getCtdtByPageNew(contition_ctdt),
                        this.elngUserProfileService.getUserProfileByPageNewV2(condition_user),
                        this.configsService.getConfigsByPageNew(condition_trinhdo),
                        this.ctdtConfigService.getCtdtConfigByPageNew(condition_ctdt_config)
                    ]).subscribe({
                        next: ([_ctdt, _user, _config, _ctdt_config]) => {
                            const config_muctieu = _ctdt_config.data.filter(m => m.group === 'KHUNG_TRINH_DO');

                            if (config_muctieu.length) {
                                this.type_ctdt_muctieu_cuthe = config_muctieu;
                            } else {
                                const index_trinhdo = _config.data.findIndex(m => m.config_key === "KHUNG_TRINH_DO");

                                if (index_trinhdo !== -1) {
                                    if (Array.isArray(_config.data[index_trinhdo].params))
                                        this.type_ctdt_muctieu_cuthe = _config.data[index_trinhdo].params as CtdtConfig[];
                                }
                            }


                            const config_tuongthich = _ctdt_config.data.filter(m => m.group === 'TUONGTHICH_PEOs');

                            if (config_tuongthich.length) {
                                this.list_tuongthich = config_tuongthich
                            } else {
                                const index_tuongthich = _config.data.findIndex(m => m.config_key === "TUONGTHICH_PEOs");

                                if (index_tuongthich !== -1) {
                                    if (Array.isArray(_config.data[index_tuongthich].params))
                                        this.list_tuongthich = _config.data[index_tuongthich].params as CtdtConfig[];
                                }
                            }

                            this.selectedCtdt = _ctdt.data[0];

                            if (!this.isManager && _user.data[0]) {
                                this.donvi_chuyenmon_id = _user.data[0].donvi_chuyenmon_id;
                                if (this.donvi_chuyenmon_id !== this.selectedCtdt.category_id) {
                                    this.router.navigate(['/admin/content-none']);
                                }
                            }

                            this.loadMuctieuCuthe();

                        },
                        error: () => {

                        }
                    })
                } else {
                    this.router.navigate(['/admin/content-none']);
                }
            })
        } else {
            this.router.navigate(['/admin/content-none']);
        }
    }

    get f() {
        return this.formMuctieuCuthe.controls;
    }


    loadMuctieuCuthe() {
        this.notificationService.isProcessing(true);
        const condition_muctieu_cuthe: ConditionOption = {
            condition: [
                { conditionName: 'ctdt_id', condition: OvicQueryCondition.equal, value: this.selectedCtdt.id.toString() },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'orderby', value: 'ordering' },
                { label: 'order', value: 'ASC' }
            ],
            page: null
        }

        this.ctdtMuctieuCutheService.getCtdtMuctieuCutheByPageNew(condition_muctieu_cuthe).subscribe({
            next: (_muctieu_cuthe) => {

                const data: typeMuctieuCuthe[] = [];

                this.type_ctdt_muctieu_cuthe.forEach(f => {
                    const _data_type: typeMuctieuCuthe = {
                        key: f.key,
                        title: f.title,
                        children: _muctieu_cuthe.data.filter(m => m.type === f.key)
                    }

                    data.push(_data_type);
                })

                this.list_muctieu_cuthe = _muctieu_cuthe.data;

                this.list_ctdt_muctieu_cuthe = data;

                this.resetForm();

                this.notificationService.isProcessing(false);
            },
            error: () => {
                this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại")
                this.notificationService.isProcessing(false);
            }
        })
    }

    saveMucTieuChung(event) {
        this.notificationService.isProcessing(true);
        this.ctdtService.updateCtdt(this.selectedCtdt.id, { muctieu: event }).subscribe({
            next: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastSuccess("Lưu thành công");
                this.selectedCtdt.muctieu = event;
            },
            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastSuccess("Lưu thất bại");
            }
        })
    }

    closeForm() {
        this.notificationService.closeSideNavigationMenu();
    }

    resetForm() {
        this.formMuctieuCuthe.reset();
        this.f['ctdt_id'].setValue(this.selectedCtdt.id);
        this.isUpdated = false;
        const ordering = this.list_muctieu_cuthe.length ? this.list_muctieu_cuthe[this.list_muctieu_cuthe.length - 1].ordering + 1 : 1;
        this.f['ordering'].setValue(ordering);
    }

    openAddMuctieu() {
        this.formTitle = "Thêm mục tiêu cụ thể";
        this.resetForm();
        this.notificationService.openSideNavigationMenu({ template: this.templateCtdtMuctieu, size: 700, offsetTop: '0px' })
    }

    onCheckKyhieuMuctieuPromise(kyhieu: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const condition: ConditionOption = {
                condition: [
                    { conditionName: 'kyhieu', condition: OvicQueryCondition.equal, value: kyhieu, orWhere: 'and' },
                    { conditionName: 'ctdt_id', condition: OvicQueryCondition.equal, value: this.selectedCtdt.id.toString(), orWhere: 'and' },
                ],
                set: [
                    { label: 'limit', value: '1' }
                ],
                page: null
            }

            if (this.isUpdated && this.selectedMuctieuCuthe) {
                condition.condition.push({ conditionName: 'id', condition: OvicQueryCondition.notEqual, value: this.selectedMuctieuCuthe.id.toString(), orWhere: 'and' })
            }

            this.ctdtMuctieuCutheService.getCtdtMuctieuCutheByPageNew(condition).subscribe({
                next: (_muctieu) => {
                    if (_muctieu.recordsFiltered) {
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

    async saveMucTieuCuthe() {
        if (this.formMuctieuCuthe.valid) {
            this.notificationService.isProcessing(true);
            const data = { ...this.formMuctieuCuthe.getRawValue() };

            data['kyhieu'] = this.kyhieuMutieuCuthe.concat(" ", data['ordering'].toString());

            const condition: ConditionOption = {
                condition: [
                    { conditionName: 'kyhieu', condition: OvicQueryCondition.equal, value: data['kyhieu'], orWhere: 'and' },
                    { conditionName: 'ctdt_id', condition: OvicQueryCondition.equal, value: this.selectedCtdt.id.toString(), orWhere: 'and' },
                ],
                set: [
                    { label: 'limit', value: '1' }
                ],
                page: null
            }

            if (this.isUpdated && this.selectedMuctieuCuthe) {
                condition.condition.push({ conditionName: 'id', condition: OvicQueryCondition.notEqual, value: this.selectedMuctieuCuthe.id.toString(), orWhere: 'and' })
            }

            const check_data = await firstValueFrom(this.ctdtMuctieuCutheService.getCtdtMuctieuCutheByPageNew(condition));

            if (check_data.recordsFiltered !== 0) {
                this.notificationService.isProcessing(false);
                return this.notificationService.toastWarning("Ký hiệu đã tồn tại, vui lòng nhập lại");
            }

            if (this.isUpdated) {
                this.ctdtMuctieuCutheService.updateCtdtMuctieuCuthe(this.selectedMuctieuCuthe.id, data).subscribe({
                    next: () => {
                        this.notificationService.toastSuccess("Sửa thành công");
                        this.closeForm();
                        this.loadMuctieuCuthe();
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError("Sửa thất bại");
                    }
                })
            } else {
                this.ctdtMuctieuCutheService.addCtdtMuctieuCuthe(data).subscribe({
                    next: () => {
                        this.notificationService.toastSuccess("Thêm thành công");
                        this.loadMuctieuCuthe();
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError("Thêm thất bại");
                    }
                })
            }
        }
    }

    editMucTieuchuThe(_muctieu: CtdtMuctieuCuthe) {
        this.resetForm();
        this.isUpdated = true;
        this.formTitle = "Sửa mục tiêu";
        this.selectedMuctieuCuthe = _muctieu;
        this.f['ordering'].setValue(_muctieu.ordering);
        this.f['noidung'].setValue(_muctieu.noidung);
        this.f['type'].setValue(_muctieu.type);
        this.f['tuongthich'].setValue(_muctieu.tuongthich);
        this.notificationService.openSideNavigationMenu({ template: this.templateCtdtMuctieu, size: 700, offsetTop: '0px' })
    }

    deleteMuctieu(_muctieu: CtdtMuctieuCuthe) {
        this.notificationService.confirmDelete().then(a => {
            if (a) {
                this.notificationService.isProcessing(true);
                this.ctdtMuctieuCutheService.deleteCtdtMuctieuCuthe(_muctieu.id).subscribe({
                    next: () => {
                        this.notificationService.toastSuccess("Xóa thành công");
                        this.loadMuctieuCuthe();
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError("Xóa thất bại");
                    }
                })
            }
        })
    }

    checkTuongthich(key_tuongthich: string, _muctieu: CtdtMuctieuCuthe) {
        const check = _muctieu.tuongthich.includes(key_tuongthich);
        if (check) {
            return true;
        }
        return false;
    }

    pointQuestionKeyDown(event: KeyboardEvent) {
        if (!event) return;

        const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight'];

        if (/^[0-9]$/.test(event.key)) {
            return;
        }

        if (allowedKeys.includes(event.key)) {
            return;
        }

        event.preventDefault();
    }
}
