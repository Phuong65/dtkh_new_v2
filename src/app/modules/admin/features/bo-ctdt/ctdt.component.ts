import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { Drawer } from 'primeng/drawer';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Tooltip } from 'primeng/tooltip';
import { Observable, Subject, catchError, filter, forkJoin, map, of, switchMap, takeUntil } from 'rxjs';
import { IctuPaginatorComponent } from '@core-new/components/ictu-paginator/ictu-paginator.component';
import { LoadingProgressComponent } from '@core-new/components/loading-progress/loading-progress.component';
import { AppState } from '@core-new/models/app-state';
import { IctuDataTable2 } from '@core-new/models/datatable';
import { NotificationService } from '@core-new/service/notification.service';
import { OvicConditionParam, OvicQueryCondition } from '@core/models/dto';
import { AuthService } from '@core/services/auth.service';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { DonVi } from '@modules/shared/models/don-vi';
import { ElnChuyenMuc } from '@modules/shared/models/Elng';
import { HeDt } from '@modules/shared/models/he-dt';
import { BoCtdt } from '@modules/shared/models/bo-ctdt';
import { Ctdt } from '@modules/shared/models/ctdt';
import { BoCtdtService } from '@modules/shared/services/bo-ctdt.service';
import { CtdtService } from '@modules/shared/services/ctdt.service';
import { CtdtHocphanService } from '@modules/shared/services/ctdt-hocphan.service';
import { DonViService } from '@modules/shared/services/don-vi.service';
import { ElnChuyenMucService } from '@modules/shared/services/elearning-chuyen-muc.service';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { HeDtService } from '@modules/shared/services/he-dt.service';
import { ROUTERS } from '@modules/shared/utils/syscat';

interface CtdtDisplayMeta {
    khoa: string;
    nganh: string;
    heDaoTao: string;
    tongTinChi: number | null;
}

@Component({
    selector: 'app-ctdt',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, Drawer, InputText, Select, Tooltip,
        IctuPaginatorComponent, LoadingProgressComponent, MatButton],
    templateUrl: './ctdt.component.html',
    styleUrl: './ctdt.component.css'
})
export class CtdtComponent implements OnInit, OnDestroy {
    private readonly fb = inject(FormBuilder);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly auth = inject(AuthService);
    private readonly boCtdtService = inject(BoCtdtService);
    private readonly ctdtService = inject(CtdtService);
    private readonly ctdtHocphanService = inject(CtdtHocphanService);
    private readonly courseService = inject(ElnKhoaHocService);
    private readonly donViService = inject(DonViService);
    private readonly nganhService = inject(ElnChuyenMucService);
    private readonly heDtService = inject(HeDtService);
    private readonly userProfileService = inject(ElngUserProfileService);
    private readonly notificationService = inject(NotificationService);
    private readonly destroy$ = new Subject<void>();
    private readonly cancelBoLoad$ = new Subject<void>();
    private readonly cancelCtdtLoad$ = new Subject<void>();
    private readonly cancelCtdtMetaLoad$ = new Subject<void>();
    private readonly cancelCtdtFormOptionsLoad$ = new Subject<void>();
    private readonly isFacultyRoute = this.auth.hasRouter(ROUTERS.lanhdao_khoa) && !this.auth.hasRouter(ROUTERS.daotao);
    private facultyCategoryId: number | null = null;
    private requestedBoId: number | null = null;
    private creatingForBo: BoCtdt | null = null;

    readonly boOptions = signal<BoCtdt[]>([]);
    readonly selectedBo = signal<BoCtdt | null>(null);
    readonly boState = signal<AppState>('loading');
    readonly ctdtState = signal<AppState>('success');
    readonly ctdtTable = new IctuDataTable2<Ctdt>({ rows: 10, pageLinkSize: 5 });
    readonly ctdtDisplayMeta = signal<Record<number, CtdtDisplayMeta>>({});
    readonly ctdtSearchValue = signal('');
    readonly isSaving = signal(false);
    readonly ctdtFormLoading = signal(false);
    ctdtFormDonViOptions: DonVi[] = [];
    ctdtFormNganh: ElnChuyenMuc[] = [];
    ctdtFormNganhOptions: ElnChuyenMuc[] = [];
    ctdtFormHeDt: HeDt[] = [];
    ctdtDrawerVisible = false;
    canAddCtdt = false;
    canDeleteCtdt = false;

    readonly ctdtForm = this.fb.group({
        ten: ['', [Validators.required, Validators.pattern(/.*\S.*/), Validators.maxLength(255)]],
        madt: ['', [Validators.required, Validators.pattern(/.*\S.*/), Validators.maxLength(50)]],
        category_id: [null as number | null, Validators.required],
        nganh_id: [null as number | null, Validators.required],
        khoa_apdung: ['', [Validators.required, Validators.pattern(/^[0-9]+$/)]],
        he_dt: [null as string | null, Validators.required]
    });

    ngOnInit(): void {
        this.checkPermissions();
        const requested = Number(this.route.snapshot.queryParamMap.get('bo_id'));
        this.requestedBoId = Number.isInteger(requested) && requested > 0 ? requested : null;
        if (this.isFacultyRoute) this.loadFacultyProfile();
        else this.loadBoCtdt();
    }

    ngOnDestroy(): void {
        this.cancelBoLoad$.next();
        this.cancelBoLoad$.complete();
        this.cancelCtdtLoad$.next();
        this.cancelCtdtLoad$.complete();
        this.cancelCtdtMetaLoad$.next();
        this.cancelCtdtMetaLoad$.complete();
        this.cancelCtdtFormOptionsLoad$.next();
        this.cancelCtdtFormOptionsLoad$.complete();
        this.destroy$.next();
        this.destroy$.complete();
    }

    private checkPermissions(): void {
        const rawUrl = this.router.url.split('?')[0];
        const routePath = rawUrl.startsWith('/admin/') ? rawUrl.substring(7) : rawUrl.replace(/^\//, '');
        if (this.auth?.userCanAdd) {
            this.canAddCtdt = this.auth.userCanAdd(routePath) || this.auth.userCanAdd('chuongtrinh-daotao');
        }
        if (this.auth?.userCanDelete) {
            this.canDeleteCtdt = this.auth.userCanDelete(routePath) || this.auth.userCanDelete('chuongtrinh-daotao');
        }
    }

    private loadFacultyProfile(): void {
        this.boState.set('loading');
        const condition: ConditionOption = {
            condition: [{ conditionName: 'user_id', condition: OvicQueryCondition.equal, value: String(this.auth.user?.id), orWhere: 'and' }],
            set: [{ label: 'limit', value: '1' }], page: null
        };
        this.userProfileService.getUserProfileByPageNewV2(condition).pipe(takeUntil(this.destroy$)).subscribe({
            next: response => {
                const id = Number(response.data?.[0]?.donvi_chuyenmon_id);
                if (!Number.isInteger(id) || id <= 0) {
                    this.boState.set('error');
                    this.notificationService.toastWarning('Tài khoản chưa được phân vào Khoa. Vui lòng liên hệ Phòng Đào tạo.');
                    return;
                }
                this.facultyCategoryId = id;
                this.loadBoCtdt();
            },
            error: () => {
                this.boState.set('error');
                this.notificationService.toastError('Không thể tải thông tin Khoa của tài khoản', 'Lỗi kết nối');
            }
        });
    }

    loadBoCtdt(): void {
        if (this.isFacultyRoute && !this.facultyCategoryId) {
            this.loadFacultyProfile();
            return;
        }
        this.boState.set('loading');
        const conditions: OvicConditionParam[] = this.isFacultyRoute
            ? [{ conditionName: 'category_ids', condition: OvicQueryCondition.like, value: `%${this.facultyCategoryId}%`, orWhere: 'and' }]
            : [];
        this.cancelBoLoad$.next();
        this.boCtdtService.get(conditions, { limit: -1, orderby: 'name', order: 'ASC' }).pipe(
            takeUntil(this.cancelBoLoad$), takeUntil(this.destroy$)
        ).subscribe({
            next: response => {
                const rows = Array.isArray(response.data) ? response.data : [];
                this.boOptions.set(rows);
                const currentId = this.selectedBo()?.id ?? this.requestedBoId;
                const selected = rows.find(bo => bo.id === currentId) || rows[0] || null;
                this.requestedBoId = null;
                this.boState.set('success');
                if (selected?.id === this.selectedBo()?.id) {
                    this.selectedBo.set(selected);
                    this.loadCtdt(1, true);
                } else this.selectBo(selected);
            },
            error: () => {
                this.boState.set('error');
                this.notificationService.toastError('Không thể tải danh sách bộ chương trình đào tạo', 'Lỗi kết nối');
            }
        });
    }

    selectBo(bo: BoCtdt | null): void {
        if (bo?.id === this.selectedBo()?.id) return;
        this.selectedBo.set(bo);
        this.ctdtSearchValue.set('');
        this.loadCtdt(1, true);
    }

    onBoSelectionChange(id: number | null): void {
        this.selectBo(this.boOptions().find(bo => bo.id === id) || null);
    }

    onCtdtSearchChange(event: Event): void {
        this.ctdtSearchValue.set((event.target as HTMLInputElement).value || '');
    }

    onCtdtSearchData(): void {
        this.ctdtSearchValue.set(this.ctdtSearchValue().trim());
        this.loadCtdt(1, true);
    }

    onCtdtPageChange(page: number): void {
        this.loadCtdt(page, false);
    }

    loadCtdt(page = 1, resetPaginator = false): void {
        this.cancelCtdtLoad$.next();
        this.cancelCtdtMetaLoad$.next();
        this.ctdtDisplayMeta.set({});
        const bo = this.selectedBo();
        if (!bo) {
            this.ctdtTable.fillRawData({ data: [], recordsFiltered: 0, recordsTotal: 0, draw: 1 }, { paged: 1, resetPaginator: true });
            this.ctdtState.set('success');
            return;
        }
        if (this.isFacultyRoute && !this.facultyCategoryId) {
            this.ctdtState.set('error');
            return;
        }
        this.ctdtState.set('loading');
        const conditions: OvicConditionParam[] = [
            { conditionName: 'ctdt_bo_id', condition: OvicQueryCondition.equal, value: String(bo.id), orWhere: 'and' }
        ];
        if (this.isFacultyRoute) {
            conditions.push({ conditionName: 'category_id', condition: OvicQueryCondition.equal, value: String(this.facultyCategoryId), orWhere: 'and' });
        }
        const query = this.ctdtSearchValue();
        if (query) conditions.push({ conditionName: 'ten', condition: OvicQueryCondition.like, value: `%${query}%`, orWhere: 'and' });
        this.ctdtService.getCtdtByPageNew({
            condition: conditions,
            set: [
                { label: 'limit', value: String(this.ctdtTable.paginator.rows()) },
                { label: 'orderby', value: 'created_at' },
                { label: 'order', value: 'DESC' }
            ], page: String(page)
        }).pipe(takeUntil(this.cancelCtdtLoad$), takeUntil(this.destroy$)).subscribe({
            next: response => {
                const total = Number(response.recordsFiltered) || 0;
                const rows = response.data || [];
                this.ctdtTable.fillRawData({ data: rows, recordsFiltered: total, recordsTotal: total, draw: 1 }, { paged: page, resetPaginator });
                this.ctdtState.set('success');
                this.loadCtdtDisplayMeta(rows);
            },
            error: () => {
                this.ctdtState.set('error');
                this.notificationService.toastError('Không thể tải danh sách chương trình đào tạo', 'Lỗi kết nối');
            }
        });
    }

    private loadCtdtDisplayMeta(rows: Ctdt[]): void {
        const validRows = rows.filter(row => Number.isInteger(Number(row.id)) && Number(row.id) > 0);
        if (!validRows.length) return;
        const major: ConditionOption = {
            condition: [{ conditionName: 'type', condition: OvicQueryCondition.equal, value: 'nganh', orWhere: 'and' }],
            set: [{ label: 'limit', value: '-1' }], page: null
        };
        const unit: ConditionOption = {
            condition: [{ conditionName: 'status', condition: OvicQueryCondition.greaterThan, value: '0', orWhere: 'and' }],
            set: [{ label: 'limit', value: '-1' }, { label: 'orderby', value: 'title' }, { label: 'order', value: 'ASC' }], page: null
        };
        forkJoin({
            nganh: this.nganhService.getChuyemucByPageNew(major),
            khoa: this.donViService.getDonviByPageNew(unit),
            heDaoTao: this.heDtService.getAllHeDt(),
            credits: forkJoin(validRows.map(row => this.loadCtdtCredits(Number(row.id))))
        }).pipe(
            catchError(() => of({ nganh: { data: [] }, khoa: { data: [] }, heDaoTao: [], credits: validRows.map(() => null) })),
            takeUntil(this.cancelCtdtMetaLoad$), takeUntil(this.destroy$)
        ).subscribe(({ nganh, khoa, heDaoTao, credits }) => {
            const nganhById = new Map((nganh.data || []).map(item => [Number(item.id), item.title]));
            const khoaById = new Map((khoa.data || []).map(item => [Number(item.id), item.title]));
            const heDaoTaoByCode = new Map((heDaoTao || []).map(item => [String((item as HeDt & { kyhieu?: string }).kyhieu ?? item.id), item.title]));
            const metadata = validRows.reduce((result, row, index) => {
                result[Number(row.id)] = {
                    khoa: khoaById.get(Number(row.category_id)) || '—',
                    nganh: nganhById.get(Number(row.nganh_id)) || '—',
                    heDaoTao: heDaoTaoByCode.get(String(row.he_dt)) || '—',
                    tongTinChi: credits[index]
                };
                return result;
            }, {} as Record<number, CtdtDisplayMeta>);
            this.ctdtDisplayMeta.set(metadata);
        });
    }

    private loadCtdtCredits(ctdtId: number): Observable<number | null> {
        const condition: ConditionOption = {
            condition: [{ conditionName: 'ctdt_id', condition: OvicQueryCondition.equal, value: String(ctdtId) }],
            set: [{ label: 'limit', value: '-1' }], page: null
        };
        return this.ctdtHocphanService.getCtdtHocphanByPageNew(condition).pipe(
            switchMap(links => {
                const courseIds = [...new Set((links.data || []).map(link => Number(link.course_id)).filter(id => Number.isInteger(id) && id > 0))];
                if (!courseIds.length) return of([] as { params?: { sotinchi?: number } }[]);
                const courseCondition: ConditionOption = {
                    condition: [{ conditionName: 'status', condition: OvicQueryCondition.greaterThan, value: '-1' }],
                    set: [{ label: 'limit', value: '-1' }, { label: 'include', value: courseIds.join(',') }, { label: 'include_by', value: 'id' }], page: null
                };
                return this.courseService.getKhoaHocByPageNew_2(courseCondition).pipe(map(response => response.data || []));
            }),
            map(courses => courses.reduce((total, course) => total + Number(course.params?.sotinchi || 0), 0)),
            catchError(() => of(null))
        );
    }

    getCtdtMeta(ctdt: Ctdt): CtdtDisplayMeta {
        return this.ctdtDisplayMeta()[Number(ctdt.id)] || { khoa: '—', nganh: '—', heDaoTao: '—', tongTinChi: null };
    }

    uppercaseCodeInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        const originalValue = input.value;
        const uppercaseValue = originalValue.toUpperCase();
        if (originalValue === uppercaseValue) return;
        const start = input.selectionStart ?? originalValue.length;
        const end = input.selectionEnd ?? start;
        input.value = uppercaseValue;
        this.ctdtForm.controls.madt.setValue(uppercaseValue);
        input.setSelectionRange(originalValue.slice(0, start).toUpperCase().length, originalValue.slice(0, end).toUpperCase().length);
    }

    onCtdtKhoaKeyDown(event: KeyboardEvent): void {
        if (event.ctrlKey || event.metaKey || /^[0-9]$/.test(event.key)
            || ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
    }

    private normalizeCategoryIds(value: number[] | string | null | undefined): number[] {
        const ids: (number | string)[] = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
        return [...new Set(ids.map(id => Number(id)).filter(id => Number.isInteger(id) && id > 0))];
    }

    openCreateCtdt(): void {
        const bo = this.selectedBo();
        if (!bo) {
            this.notificationService.toastWarning('Vui lòng chọn một bộ chương trình đào tạo');
            return;
        }
        if (!this.canAddCtdt) {
            this.notificationService.toastWarning('Bạn không có quyền thêm mới chương trình đào tạo');
            return;
        }
        const categoryIds = this.normalizeCategoryIds(bo.category_ids);
        if (!categoryIds.length) {
            this.notificationService.toastWarning('Bộ CTĐT chưa được áp dụng cho Khoa nào.');
            return;
        }
        this.creatingForBo = bo;
        const allowed = this.isFacultyRoute ? categoryIds.filter(id => id === this.facultyCategoryId) : categoryIds;
        if (!allowed.length) {
            this.notificationService.toastWarning('Bộ CTĐT chưa được áp dụng cho Khoa của bạn.');
            return;
        }
        this.ctdtForm.reset({ ten: '', madt: '', category_id: allowed.length === 1 ? allowed[0] : null,
            nganh_id: null, khoa_apdung: '', he_dt: null });
        this.ctdtFormDonViOptions = [];
        this.ctdtFormNganhOptions = [];
        this.ctdtDrawerVisible = true;
        this.loadCtdtFormOptions();
    }

    private loadCtdtFormOptions(): void {
        const major: ConditionOption = {
            condition: [{ conditionName: 'type', condition: OvicQueryCondition.equal, value: 'nganh', orWhere: 'and' }],
            set: [{ label: 'limit', value: '-1' }], page: null
        };
        const unit: ConditionOption = {
            condition: [
                { conditionName: 'status', condition: OvicQueryCondition.greaterThan, value: '0', orWhere: 'and' },
                { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: String(this.auth.user?.donvi_id), orWhere: 'and' }
            ],
            set: [{ label: 'limit', value: '-1' }, { label: 'order', value: 'ASC' }, { label: 'orderby', value: 'title' }], page: null
        };
        this.cancelCtdtFormOptionsLoad$.next();
        this.ctdtFormLoading.set(true);
        forkJoin({
            nganh: this.nganhService.getChuyemucByPageNew(major),
            donvi: this.donViService.getDonviByPageNew(unit),
            hedt: this.heDtService.getAllHeDt()
        }).pipe(takeUntil(this.cancelCtdtFormOptionsLoad$), takeUntil(this.destroy$)).subscribe({
            next: ({ nganh, donvi, hedt }) => {
                this.ctdtFormNganh = nganh.data || [];
                const categoryIds = this.normalizeCategoryIds(this.creatingForBo?.category_ids);
                const allowed = this.isFacultyRoute ? categoryIds.filter(id => id === this.facultyCategoryId) : categoryIds;
                this.ctdtFormDonViOptions = (donvi.data || []).filter(unit => allowed.includes(Number(unit.id)));
                this.ctdtFormHeDt = hedt || [];
                this.updateCtdtFormNganhOptions();
                this.ctdtFormLoading.set(false);
            },
            error: () => {
                this.ctdtFormLoading.set(false);
                this.notificationService.toastError('Không thể tải danh mục Khoa, Ngành và Hệ đào tạo', 'Lỗi kết nối');
            }
        });
    }

    private updateCtdtFormNganhOptions(): void {
        const categoryId = this.ctdtForm.controls.category_id.value;
        this.ctdtFormNganhOptions = categoryId && this.ctdtFormDonViOptions.some(unit => Number(unit.id) === Number(categoryId))
            ? this.ctdtFormNganh.filter(nganh => Number(nganh.donvi_chuyenmon_id) === Number(categoryId)) : [];
    }

    onCtdtFormDonViChange(): void {
        this.ctdtForm.controls.nganh_id.setValue(null);
        this.updateCtdtFormNganhOptions();
    }

    get canSubmitCtdtForm(): boolean {
        const categoryId = Number(this.ctdtForm.controls.category_id.value);
        return !this.isSaving() && !this.ctdtFormLoading() && this.ctdtForm.valid
            && this.ctdtFormDonViOptions.some(unit => Number(unit.id) === categoryId)
            && this.ctdtFormNganhOptions.some(nganh => Number(nganh.id) === Number(this.ctdtForm.controls.nganh_id.value));
    }

    submitCtdtForm(): void {
        if (!this.creatingForBo) {
            this.notificationService.toastWarning('Vui lòng chọn một bộ chương trình đào tạo');
            return;
        }
        this.ctdtForm.markAllAsTouched();
        if (!this.canSubmitCtdtForm) {
            this.notificationService.toastWarning('Vui lòng kiểm tra lại các trường bắt buộc');
            return;
        }
        const value = this.ctdtForm.getRawValue();
        const payload: Partial<Ctdt> = {
            ten: (value.ten || '').trim(),
            madt: (value.madt || '').trim(),
            category_id: Number(value.category_id),
            nganh_id: Number(value.nganh_id),
            khoa_apdung: Number(value.khoa_apdung),
            he_dt: value.he_dt || null,
            ctdt_bo_id: this.creatingForBo.id
        };
        this.isSaving.set(true);
        this.ctdtService.addCtdt(payload).pipe(takeUntil(this.destroy$)).subscribe({
            next: () => {
                this.isSaving.set(false);
                this.ctdtDrawerVisible = false;
                this.notificationService.toastSuccess('Thêm mới chương trình đào tạo thành công', 'Thành công');
                this.loadCtdt(this.ctdtTable.paginator.paged(), false);
            },
            error: () => {
                this.isSaving.set(false);
                this.notificationService.toastError('Thêm mới chương trình đào tạo thất bại', 'Lỗi thao tác');
            }
        });
    }

    openCtdt(item: Ctdt): void {
        this.router.navigate(['/chuong-trinh-dao-tao'], { queryParams: { code: item.id, bo_id: this.selectedBo()?.id } });
    }

    deleteCtdt(item: Ctdt): void {
        if (!this.canDeleteCtdt) {
            this.notificationService.toastWarning('Bạn không có quyền xóa chương trình đào tạo');
            return;
        }
        const currentPage = this.ctdtTable.paginator.paged();
        const nextPage = this.ctdtTable.data().length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
        const safeTitle = (item.ten || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        this.notificationService.confirmDelete2({ heading: 'Xác nhận xóa', htmlMessage: `Bạn có chắc muốn xóa chương trình đào tạo "${safeTitle}"?` }).pipe(
            filter(Boolean), switchMap(() => this.ctdtService.deleteCtdt(item.id)), takeUntil(this.destroy$)
        ).subscribe({
            next: () => {
                this.notificationService.toastSuccess('Xóa chương trình đào tạo thành công', 'Thành công');
                this.loadCtdt(nextPage, false);
            },
            error: () => {
                this.notificationService.toastError('Xóa chương trình đào tạo thất bại', 'Lỗi thao tác');
                this.loadCtdt(currentPage, false);
            }
        });
    }

    trackByCtdtId(_index: number, item: Ctdt): number { return item.id || _index; }
}
