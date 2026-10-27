import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, WritableSignal, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, forkJoin, takeUntil, map } from 'rxjs';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { OvicQueryCondition } from '@core/models/dto';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core-new/service/notification.service';
import { LoadingProgressComponent } from '@core-new/components/loading-progress/loading-progress.component';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { Ctdt } from '@modules/shared/models/ctdt';
import { BoCtdt } from '@modules/shared/models/bo-ctdt';
import { DonVi } from '@modules/shared/models/don-vi';
import { ElnChuyenMuc } from '@modules/shared/models/Elng';
import { HeDt } from '@modules/shared/models/he-dt';
import { CtdtService } from '@modules/shared/services/ctdt.service';
import { BoCtdtService } from '@modules/shared/services/bo-ctdt.service';
import { DonViService } from '@modules/shared/services/don-vi.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { ElnChuyenMucService } from '@modules/shared/services/elearning-chuyen-muc.service';
import { HeDtService } from '@modules/shared/services/he-dt.service';
import { OvicDropdownComponent } from '@modules/shared/components/ovic-dropdown/ovic-dropdown.component';
import { FilterPipe } from '@modules/shared/directives/filter.pipe';
import { ROLES, DANHHIEU_TOTNGHIEP } from '@modules/shared/utils/syscat';

@Component({
    selector: 'app-ctdt-thongtin',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        ReactiveFormsModule,
        OvicDropdownComponent,
        FilterPipe,
        NgbTooltipModule,
        LoadingProgressComponent
    ],
    templateUrl: './ctdt-thongtin.component.html',
    styleUrls: ['./ctdt-thongtin.component.css']
})
export class CtdtThongtinComponent implements OnChanges, OnDestroy {
    private readonly destroy$ = new Subject<void>();
    private readonly cancelLoad$ = new Subject<void>();
    private loadedCtdtId: number | null = null;

    @Input() selectedCtdt: Ctdt | null = null;
    @Output() ctdtUpdated = new EventEmitter<Ctdt>();

    isLanhDaoKhoa = false;
    isManager = false;
    formCtdt: FormGroup;
    readonly isLoading: WritableSignal<boolean> = signal(true);
    readonly isSaving: WritableSignal<boolean> = signal(false);
    readonly loadError: WritableSignal<boolean> = signal(false);
    list_donvi: DonVi[] = [];
    private allowedCategoryIds: number[] = [];
    list_nganh: ElnChuyenMuc[] = [];
    danhhieu_totnghiep = DANHHIEU_TOTNGHIEP;
    list_hedt: HeDt[] = [];
    userId: number;
    donvi_chuyenmon_id: number;

    constructor(
        private auth: AuthService,
        private notificationService: NotificationService,
        private router: Router,
        private ctdtService: CtdtService,
        public formBuilder: FormBuilder,
        private elngUserProfileService: ElngUserProfileService,
        private elnChuyenMucService: ElnChuyenMucService,
        private heDtService: HeDtService,
        private donViService: DonViService,
        private boCtdtService: BoCtdtService
    ) {
        this.isManager = [ROLES.manager, ROLES.admin, ROLES.troly_pdt, ROLES.chuyenvien_pdt, ROLES.daotao_new]
            .some(role => this.auth.userHasRole(role));
        this.isLanhDaoKhoa = this.auth.userHasRole(ROLES.lanhdaokhoa);
        this.userId = this.auth.user?.id;
        this.formCtdt = this.formBuilder.group({
            ten: ['', Validators.required],
            madt: ['', Validators.required],
            nganh_id: ['', Validators.required],
            he_dt: ['', Validators.required],
            danhhieu_totnghiep: [''],
            thoigian_daotao: [''],
            category_id: ['', Validators.required],
            khoa_apdung: ['', Validators.required]
        });
    }

    get f() { return this.formCtdt.controls; }

    ngOnInit(): void {
        if (this.selectedCtdt?.id && this.selectedCtdt.id !== this.loadedCtdtId) {
            this.loadTabData(this.selectedCtdt);
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        const ctdt = changes['selectedCtdt']?.currentValue as Ctdt | null;
        if (!ctdt?.id || ctdt.id === this.loadedCtdtId) return;
        this.loadTabData(ctdt);
    }

    ngOnDestroy(): void {
        this.cancelLoad$.next();
        this.cancelLoad$.complete();
        this.destroy$.next();
        this.destroy$.complete();
    }

    reloadData(): void {
        const ctdt = this.selectedCtdt;
        if (ctdt) this.loadTabData(ctdt, true);
    }

    get shouldShowLoadError(): boolean {
        return !this.isLoading() && this.loadError();
    }

    private loadTabData(ctdt: Ctdt, force = false): void {
        if (!this.isLanhDaoKhoa && !this.isManager) {
            this.isLoading.set(false);
            this.router.navigate(['/admin/content-none']);
            return;
        }
        if (!force && this.loadedCtdtId === ctdt.id && this.list_hedt.length) return;
        this.cancelLoad$.next();
        this.loadedCtdtId = ctdt.id;
        this.isLoading.set(true);
        this.loadError.set(false);
        this.allowedCategoryIds = [];
        this.list_donvi = [];
        if (!Number.isInteger(Number(ctdt.ctdt_bo_id)) || Number(ctdt.ctdt_bo_id) <= 0) {
            this.isLoading.set(false);
            this.loadError.set(true);
            this.loadedCtdtId = null;
            return;
        }

        const boCondition: ConditionOption = {
            condition: [{ conditionName: 'id', condition: OvicQueryCondition.equal, value: String(ctdt.ctdt_bo_id) }],
            set: [{ label: 'limit', value: '1' }], page: null
        };
        const profile: ConditionOption = {
            condition: [{ conditionName: 'user_id', condition: OvicQueryCondition.equal, value: String(this.userId), orWhere: 'and' }],
            set: [{ label: 'limit', value: '1' }], page: null
        };
        const major: ConditionOption = {
            condition: [{ conditionName: 'type', condition: OvicQueryCondition.equal, value: 'nganh', orWhere: 'and' }],
            set: [{ label: 'limit', value: '-1' }], page: null
        };
        const unit: ConditionOption = {
            condition: [
                { conditionName: 'status', condition: OvicQueryCondition.greaterThan, value: '0', orWhere: 'and' },
                { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: String(this.auth.user?.donvi_id), orWhere: 'and' }
            ],
            set: [{ label: 'limit', value: '-1' }, { label: 'order', value: 'ASC' }, { label: 'orderby', value: 'title' }],
            page: null
        };

        forkJoin([ 
            this.boCtdtService.get(boCondition.condition, { limit: 1 }).pipe(map(response => response.data?.[0] || null)),
            this.elnChuyenMucService.getChuyemucByPageNew(major),
            this.donViService.getDonviByPageNew(unit),
            this.elngUserProfileService.getUserProfileByPageNewV2(profile),
            this.heDtService.getAllHeDt()
        ]).pipe(takeUntil(this.cancelLoad$), takeUntil(this.destroy$)).subscribe({
            next: ([bo, nganh, donvi, user, hedt]) => {
                if (!this.isManager && user.data?.[0]) {
                    this.donvi_chuyenmon_id = user.data[0].donvi_chuyenmon_id;
                    if (this.donvi_chuyenmon_id !== ctdt.category_id) {
                        this.router.navigate(['/admin/content-none']);
                        return;
                    }
                }
                const categoryIds = this.normalizeCategoryIds(bo?.category_ids);
                if (!bo || !categoryIds.length || Number(bo.id) !== Number(ctdt.ctdt_bo_id)) {
                    this.loadedCtdtId = null;
                    this.loadError.set(true);
                    this.isLoading.set(false);
                    return;
                }
                this.allowedCategoryIds = categoryIds;
                this.loadError.set(false);
                this.list_nganh = nganh.data || [];
                this.list_donvi = (donvi.data || []).filter(item => categoryIds.includes(Number(item.id)));
                this.list_hedt = hedt || [];
                this.resetForm(ctdt);
                this.isLoading.set(false);
            },
            error: () => {
                this.loadedCtdtId = null;
                this.loadError.set(true);
                this.isLoading.set(false);
            }
        });
    }

    private normalizeCategoryIds(value: BoCtdt['category_ids'] | string | null | undefined): number[] {
        const ids: (number | string)[] = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
        return [...new Set(ids.map((id: number | string) => Number(id)).filter((id: number) => Number.isInteger(id) && id > 0))];
    }

    pointQuestionKeyDown(event: KeyboardEvent): void {
        if (event.ctrlKey || event.metaKey || /^[0-9]$/.test(event.key)
            || ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
    }

    onChangeDonviCM(_event: DonVi): void {
        this.f['nganh_id'].setValue(null);
    }

    private resetForm(ctdt: Ctdt): void {
        this.formCtdt.reset({
            ten: ctdt.ten,
            madt: ctdt.madt,
            nganh_id: ctdt.nganh_id,
            he_dt: ctdt.he_dt,
            danhhieu_totnghiep: ctdt.danhhieu_totnghiep,
            thoigian_daotao: ctdt.thoigian_daotao,
            category_id: ctdt.category_id,
            khoa_apdung: ctdt.khoa_apdung
        });
    }

    saveCtdt(): void {
        this.formCtdt.markAllAsTouched();
        const categoryId = Number(this.f['category_id'].value);
        const nganhId = Number(this.f['nganh_id'].value);
        const validMajor = this.list_nganh.some(nganh => Number(nganh.id) === nganhId && Number(nganh.donvi_chuyenmon_id) === categoryId);
        if (this.formCtdt.invalid || !this.selectedCtdt || this.isSaving() || this.isLoading() || this.loadError() || !this.allowedCategoryIds.includes(categoryId) || !validMajor) {
            this.notificationService.toastWarning('Vui lòng chọn Khoa và Ngành đào tạo hợp lệ thuộc Bộ CTĐT.');
            return;
        }
        this.isSaving.set(true);
        const data = { ...this.formCtdt.getRawValue() };
        this.ctdtService.updateCtdt(this.selectedCtdt.id, data).pipe(takeUntil(this.destroy$)).subscribe({
            next: () => {
                this.isSaving.set(false);
                const updated = { ...this.selectedCtdt, ...data } as Ctdt;
                this.selectedCtdt = updated;
                this.ctdtUpdated.emit(updated);
                this.notificationService.toastSuccess('Sửa thành công');
            },
            error: () => {
                this.isSaving.set(false);
                this.notificationService.toastError('Sửa thất bại');
            }
        });
    }
}
