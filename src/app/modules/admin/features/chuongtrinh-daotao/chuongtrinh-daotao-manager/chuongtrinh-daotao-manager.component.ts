import { ActivatedRoute, RouterModule } from '@angular/router';
import { HeDtService } from './../../../../shared/services/he-dt.service';
import { ElngUserProfileService } from '@shared/services/elearning-user-profile.service';
import { NotificationService } from '@core/services/notification.service';
import { ElnChuyenMucService } from '@modules/shared/services/elearning-chuyen-muc.service';
import { AuthService } from '@core/services/auth.service';
import { DonViService } from '@shared/services/don-vi.service';
import { CtdtService } from './../../../../shared/services/ctdt.service';
import { UserService } from '@core/services/user.service';
import { HelperService } from '@core/services/helper.service';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';

import { SharedModule } from '@modules/shared/shared.module';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Ctdt } from '@modules/shared/models/ctdt';
import { DonVi } from '@modules/shared/models/don-vi';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { Router } from '@angular/router';
import { DANHHIEU_TOTNGHIEP, ROUTERS } from '@modules/shared/utils/syscat';
import { forkJoin } from 'rxjs';
import { OvicQueryCondition } from '@core/models/dto';
import { ElnChuyenMuc } from '@modules/shared/models/Elng';
import { HeDt } from '@modules/shared/models/he-dt';
import { PaginatorModule } from 'primeng/paginator';
import { TableModule } from 'primeng/table';

@Component({
    selector: 'app-chuongtrinh-daotao-manager',
    standalone: true,
    imports: [
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    PaginatorModule,
    TableModule,
    RouterModule
],
    templateUrl: './chuongtrinh-daotao-manager.component.html',
    styleUrls: ['./chuongtrinh-daotao-manager.component.css']
})
export class ChuongtrinhDaotaoManagerComponent implements OnInit {

    @ViewChild('templateCtdt') templateCtdt: TemplateRef<any>;

    list_ctdt: Ctdt[];

    selectedCtdt: Ctdt;

    list_donvi: DonVi[];

    list_nganh: ElnChuyenMuc[];

    list_hedt: HeDt[];

    canAdd: boolean = false;

    canDelete: boolean = false;

    canUpdate: boolean = false;

    routerAdmin: boolean = false;

    routerDaotao: boolean = false;

    routerLanhdaokhoa: boolean = false;

    donviId: number;

    formCtdt: FormGroup;

    formTitle: string;

    isUpdated: boolean = false;

    userId: number;

    khoaId: number;

    danhhieu_totnghiep = DANHHIEU_TOTNGHIEP;

    total_ctdt: number = 0;

    limit_ctdt: number = 20;

    pageIndex: number = 1;
    constructor(
        private helperService: HelperService,
        private userService: UserService,
        private ctdtService: CtdtService,
        private donViService: DonViService,
        private router: Router,
        private auth: AuthService,
        public formBuilder: FormBuilder,
        private elnChuyenMucService: ElnChuyenMucService,
        private notificationService: NotificationService,
        private elngUserProfileService: ElngUserProfileService,
        private heDtService: HeDtService,
        private activatedRoute: ActivatedRoute
    ) {
        const url = this.router.url.substring(7).split('?')[0];

        this.routerAdmin = this.auth.hasRouter(ROUTERS.admin);

        this.routerDaotao = this.auth.hasRouter(ROUTERS.daotao);

        this.routerLanhdaokhoa = this.auth.hasRouter(ROUTERS.lanhdao_khoa);

        this.canAdd = this.auth.userCanAdd(url);

        this.canDelete = this.auth.userCanDelete(url);

        this.canUpdate = this.auth.userCanEdit(url);

        this.donviId = this.auth.user.donvi_id;

        this.userId = this.auth.user.id;

        this.formCtdt = this.formBuilder.group(
            {
                ten: ['', Validators.required],
                madt: ['', Validators.required],
                // mota: [''],
                // nganh_id: ['', Validators.required],
                // he_dt: [''],
                // danhhieu_totnghiep: [''],
                // thoigian_daotao: [''],
                // vitri_lamviec_sautotnghiep: [''],
                // cohoihoctap_sautotnghiep: [''],
                category_id: ['', Validators.required],
                // khoa_apdung: [''],
            }
        );
    }

    ngOnInit(): void {
        this.initData();
    }


    get f() {
        return this.formCtdt.controls;
    }

    initData() {
        this.notificationService.isProcessing(true);

        const condition_nganh: ConditionOption = {
            condition: [
                { conditionName: 'type', condition: OvicQueryCondition.equal, value: 'nganh', orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' }
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

        const condition_user: ConditionOption = {
            condition: [
                { conditionName: 'user_id', condition: OvicQueryCondition.equal, value: this.userId.toString(), orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '1' },
            ],
            page: null
        }

        forkJoin([
            this.elnChuyenMucService.getChuyemucByPageNew(condition_nganh),
            this.donViService.getDonviByPageNew(condition_donvi),
            this.elngUserProfileService.getUserProfileByPageNewV2(condition_user),
            this.heDtService.getAllHeDt()
        ]).subscribe({
            next: ([_nganh, _donvi, _user, _hedt]) => {
                if (this.routerLanhdaokhoa)
                    if (_user.data[0] && _user.data[0].donvi_chuyenmon_id) {
                        this.khoaId = _user.data[0].donvi_chuyenmon_id;
                    } else {
                        this.notificationService.toastInfo("Thầy/Cô chưa được phân vào khoa trong hệ thống, vui lòng liên hệ phòng đào tạo")
                    }

                this.list_nganh = _nganh.data;
                this.list_donvi = _donvi.data;
                this.list_hedt = _hedt;
                this.loadCtdt(1);
            },
            error: () => {
                this.notificationService.isProcessing(false);
            }
        })
    }

    loadCtdt(page: number) {
        this.notificationService.isProcessing(true);

        const condition_ctdt: ConditionOption = {
            condition: [],
            set: [
                { label: 'limit', value: this.limit_ctdt.toString() },
                { label: 'order', value: 'DESC' },
                { label: 'orderby', value: 'id' }
            ],
            page: page.toString()
        }

        if (this.routerLanhdaokhoa && this.khoaId) {
            condition_ctdt.condition.push({ conditionName: 'category_id', condition: OvicQueryCondition.equal, value: this.khoaId.toString() })
        }

        this.ctdtService.getCtdtByPageNew(condition_ctdt).subscribe({
            next: (_ctdt) => {
                const _index_start = (page - 1) * this.limit_ctdt;

                _ctdt.data.forEach((f, key) => {
                    f['index_'] = _index_start + key + 1;
                })

                this.list_ctdt = _ctdt.data;

                this.notificationService.isProcessing(false);
            },
            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
            }
        })
    }

    resetForm() {
        this.formCtdt.reset();
        this.isUpdated = false;
        if (this.routerLanhdaokhoa && this.khoaId) {
            this.f['category_id'].setValue(this.khoaId);
        } else {
            this.f['category_id'].setValue(0);
        }
    }

    closeForm() {
        this.notificationService.closeSideNavigationMenu();
    }

    openAddForm() {
        this.resetForm();
        this.formTitle = "Thêm chương trình đào tạo mới";
        this.notificationService.openSideNavigationMenu({ template: this.templateCtdt, size: 1024, offsetTop: '0px' });
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

    onChangeDonviCM(event: DonVi) {
        this.f['nganh_id'].setValue(null);
    }

    saveCtdt() {
        if (this.formCtdt.valid) {
            this.notificationService.isProcessing(true);
            const data = { ...this.formCtdt.getRawValue() }
            if (this.isUpdated) {
                this.ctdtService.updateCtdt(this.selectedCtdt.id, data).subscribe({
                    next: () => {
                        this.loadCtdt(this.pageIndex);
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastSuccess("Sửa thành công");
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError("Sửa thất bại");
                    }
                })
            } else {
                this.ctdtService.addCtdt(data).subscribe({
                    next: () => {
                        this.loadCtdt(this.pageIndex);
                        this.notificationService.isProcessing(false);
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

    changePageCtdt(event) {
        this.pageIndex = event.page + 1;
        this.loadCtdt(event.page + 1);
    }

    deleteCtdt(ctdt: Ctdt) {
        this.notificationService.confirmDelete().then(a => {
            if (a) {
                this.notificationService.isProcessing(true);
                this.ctdtService.deleteCtdt(ctdt.id).subscribe({
                    next: () => {
                        this.notificationService.toastSuccess("Xóa thành công");
                        this.loadCtdt(this.pageIndex);
                    },
                    error: () => {
                        this.notificationService.toastError("Xóa thất bại");
                        this.notificationService.isProcessing(false);
                    }
                })
            }
        })
    }
}
