import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { Drawer } from 'primeng/drawer';
import { InputText } from 'primeng/inputtext';
import { Tooltip } from 'primeng/tooltip';
import { Observable, Subject as RxSubject, filter, map, switchMap, takeUntil } from 'rxjs';
import { IctuPaginatorComponent } from '@core-new/components/ictu-paginator/ictu-paginator.component';
import { LoadingProgressComponent } from '@core-new/components/loading-progress/loading-progress.component';
import { AppState } from '@core-new/models/app-state';
import { DataTableEvent, DataTableEventName, IctuDataTable2 } from '@core-new/models/datatable';
import { IctuFormControl2 } from '@core-new/models/ictu-form-control';
import { IctuDeletingAnimationControl } from '@core-new/models/ictu-deleting-animation-control';
import { NotificationService } from '@core-new/service/notification.service';
import { OvicConditionParam, OvicQueryCondition } from '@core/models/dto';
import { AuthService } from '@core/services/auth.service';
import { BoCtdt } from '@modules/shared/models/bo-ctdt';
import { BoCtdtService } from '@modules/shared/services/bo-ctdt.service';
import { Ctdt } from '@modules/shared/models/ctdt';
import { CtdtService } from '@modules/shared/services/ctdt.service';

@Component({
    selector: 'app-bo-ctdt-management',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        Drawer,
        InputText,
        Tooltip,
        IctuPaginatorComponent,
        LoadingProgressComponent,
        MatButton
    ],
    templateUrl: './bo-ctdt-management.component.html',
    styleUrl: './bo-ctdt-management.component.css'
})
export class BoCtdtManagementComponent implements OnInit, OnDestroy {
    private readonly fb = inject(FormBuilder);
    private readonly boCtdtService = inject(BoCtdtService);
    private readonly ctdtService = inject(CtdtService);
    private readonly cancelCtdtLoad$ = new RxSubject<void>();
    private readonly cancelBoLoad$ = new RxSubject<void>();
    private readonly notificationService = inject(NotificationService);
    private readonly auth = inject(AuthService);
    private readonly router = inject(Router);

    readonly drawer = viewChild<Drawer>('boCtdtDrawer');
    readonly destroy$ = new RxSubject<void>();
    readonly boTable = new IctuDataTable2<BoCtdt>({ rows: 20, pageLinkSize: 5 });
    readonly ctdtTable = new IctuDataTable2<Ctdt>({ rows: 10, pageLinkSize: 5 });
    readonly state = signal<AppState>('loading');
    readonly ctdtState = signal<AppState>('success');
    readonly isSaving = signal<boolean>(false);
    readonly searchValue = signal<string>('');
    readonly selectedBo = signal<BoCtdt | null>(null);
    readonly ctdtSearchValue = signal<string>('');

    canAdd = true;
    canUpdate = true;
    canDelete = true;
    canAddCtdt = false;
    canDeleteCtdt = true;
    ctdtDrawerVisible = false;
    private creatingForBo: BoCtdt | null = null;

    readonly ctdtForm = this.fb.group({
        ten: ['', [Validators.required, Validators.maxLength(255)]],
        madt: ['', [Validators.required, Validators.maxLength(50)]]
    });

    readonly boCtdtForm: FormGroup = this.fb.group({
        name: ['', [Validators.required, Validators.maxLength(255)]],
        code: ['', [Validators.required, Validators.maxLength(50)]]
    });

    readonly formControl = new IctuFormControl2<BoCtdt>({
        dropdownFields: [],
        formGroup: this.boCtdtForm,
        objectName: 'bộ chương trình đào tạo',
        drawer: this.drawer
    });

    private readonly handelEvent: Record<DataTableEventName, (data: BoCtdt) => void> = {
        OPEN_FORM_ADD: () => this.openCreateDrawer(),
        OPEN_FORM_UPDATE: data => this.openEditDrawer(data),
        DELETE_SINGLE_ROW: data => this.deleteBoCtdt(data),
        DELETE_SELECTED_ROWS: () => this.deleteSelectedBoCtdt(),
        SUBMIT_FORM: () => this.submitForm()
    };

    private readonly observeEvents = new RxSubject<DataTableEvent<BoCtdt>>();

    ngOnInit(): void {
        this.checkPermissions();
        this.observeEvents.pipe(takeUntil(this.destroy$)).subscribe(({ name, data }) => this.handelEvent[name](data));
        this.loadBoCtdt(1, true);
    }

    ngOnDestroy(): void {
        this.cancelCtdtLoad$.next();
        this.cancelCtdtLoad$.complete();
        this.cancelBoLoad$.next();
        this.cancelBoLoad$.complete();
        this.destroy$.next();
        this.destroy$.complete();
    }

    private checkPermissions(): void {
        const rawUrl = this.router.url.split('?')[0];
        const routePath = rawUrl.startsWith('/admin/') ? rawUrl.substring(7) : rawUrl.replace(/^\//, '');
        if (this.auth?.userCanAdd) {
            this.canAdd = this.auth.userCanAdd(routePath) || this.auth.userCanAdd('bo-ctdt');
            this.canAddCtdt = this.canAdd || this.auth.userCanAdd('chuongtrinh-daotao');
        }
        if (this.auth?.userCanEdit) this.canUpdate = this.auth.userCanEdit(routePath) || this.auth.userCanEdit('bo-ctdt');
        if (this.auth?.userCanDelete) this.canDelete = this.auth.userCanDelete(routePath) || this.auth.userCanDelete('bo-ctdt');
        if (this.auth?.userCanDelete) this.canDeleteCtdt = this.canDelete || this.auth.userCanDelete('chuongtrinh-daotao');
    }

    emitEvent(name: DataTableEventName, data: BoCtdt = null): void {
        this.observeEvents.next({ name, data });
    }

    uppercaseCodeInput(event: Event, form: FormGroup, controlName: string): void {
        const input = event.target as HTMLInputElement;
        const originalValue = input.value;
        const uppercaseValue = originalValue.toUpperCase();
        if (originalValue === uppercaseValue) return;

        const selectionStart = input.selectionStart ?? originalValue.length;
        const selectionEnd = input.selectionEnd ?? selectionStart;
        const uppercaseSelectionStart = originalValue.slice(0, selectionStart).toUpperCase().length;
        const uppercaseSelectionEnd = originalValue.slice(0, selectionEnd).toUpperCase().length;

        input.value = uppercaseValue;
        form.get(controlName)?.setValue(uppercaseValue);
        input.setSelectionRange(uppercaseSelectionStart, uppercaseSelectionEnd);
    }

    onSearchChange(event: Event): void {
        this.searchValue.set((event.target as HTMLInputElement).value || '');
    }

    onSearchData(): void {
        this.searchValue.set(this.searchValue().trim());
        this.loadBoCtdt(1, true);
    }

    onCtdtSearchChange(event: Event): void {
        this.ctdtSearchValue.set((event.target as HTMLInputElement).value || '');
    }

    onCtdtSearchData(): void {
        this.ctdtSearchValue.set(this.ctdtSearchValue().trim());
        this.loadCtdt(1, true);
    }

    onBoPageChange(page: number): void {
        this.loadBoCtdt(page, false);
    }

    onCtdtPageChange(page: number): void {
        this.loadCtdt(page, false);
    }

    loadBoCtdt(page = 1, resetPaginator = false): void {
        this.state.set('loading');
        const conditions: OvicConditionParam[] = [];
        const query = this.searchValue();
        if (query) {
            conditions.push({ conditionName: 'name', condition: OvicQueryCondition.like, value: `%${query}%`, orWhere: 'or' });
            conditions.push({ conditionName: 'code', condition: OvicQueryCondition.like, value: `%${query}%`, orWhere: 'or' });
        }

        this.cancelBoLoad$.next();
        this.boCtdtService.get(conditions, {
            limit: this.boTable.paginator.rows(), paged: page, orderby: 'created_at', order: 'DESC'
        }).pipe(takeUntil(this.destroy$), takeUntil(this.cancelBoLoad$)).subscribe({
            next: response => {
                const total = Number(response.totalRecords) || 0;
                const rows = Array.isArray(response.data) ? response.data : [];
                this.boTable.fillRawData({ data: rows, recordsFiltered: total, recordsTotal: total, draw: 1 }, { paged: page, resetPaginator });
                this.state.set('success');
                const current = this.selectedBo();
                const next = current && rows.some((item: BoCtdt) => item.id === current.id) ? current : rows[0] || null;
                if (this.selectedBo()?.id === next?.id) {
                    this.loadCtdt(1, true);
                } else {
                    this.selectBo(next);
                }
            },
            error: () => {
                this.state.set('error');
                this.notificationService.toastError('Không thể tải danh sách bộ chương trình đào tạo', 'Lỗi kết nối');
            }
        });
    }

    selectBo(bo: BoCtdt | null): void {
        if (this.selectedBo()?.id === bo?.id) return;
        this.selectedBo.set(bo);
        this.ctdtSearchValue.set('');
        this.loadCtdt(1, true);
    }

    loadCtdt(page = 1, resetPaginator = false): void {
        const bo = this.selectedBo();
        if (!bo) {
            this.ctdtTable.fillRawData({ data: [], recordsFiltered: 0, recordsTotal: 0, draw: 1 }, { paged: 1, resetPaginator: true });
            this.ctdtState.set('success');
            return;
        }

        this.ctdtState.set('loading');
        const conditions: OvicConditionParam[] = [
            { conditionName: 'ctdt_bo_id', condition: OvicQueryCondition.equal, value: String(bo.id), orWhere: 'and' }
        ];
        const query = this.ctdtSearchValue();
        if (query) {
            conditions.push({ conditionName: 'ten', condition: OvicQueryCondition.like, value: `%${query}%`, orWhere: 'and' });
        }

        this.cancelCtdtLoad$.next();
        this.ctdtService.getCtdtByPageNew({
            condition: conditions,
            set: [
                { label: 'limit', value: String(this.ctdtTable.paginator.rows()) },
                { label: 'orderby', value: 'id' },
                { label: 'order', value: 'DESC' }
            ],
            page: String(page)
        }).pipe(takeUntil(this.destroy$), takeUntil(this.cancelCtdtLoad$)).subscribe({
            next: response => {
                const total = Number(response.recordsFiltered) || 0;
                this.ctdtTable.fillRawData({ data: response.data || [], recordsFiltered: total, recordsTotal: total, draw: 1 }, { paged: page, resetPaginator });
                this.ctdtState.set('success');
            },
            error: () => {
                this.ctdtState.set('error');
                this.notificationService.toastError('Không thể tải danh sách chương trình đào tạo', 'Lỗi kết nối');
            }
        });
    }

    openCreateDrawer(): void {
        if (!this.canAdd) {
            this.notificationService.toastWarning('Bạn không có quyền thêm mới bộ chương trình đào tạo');
            return;
        }
        this.boCtdtForm.reset({ name: '', code: '' });
        this.formControl.openFormAdd();
    }

    openEditDrawer(item: BoCtdt): void {
        if (!this.canUpdate) {
            this.notificationService.toastWarning('Bạn không có quyền chỉnh sửa bộ chương trình đào tạo');
            return;
        }
        this.boCtdtForm.reset({ name: item.name || '', code: item.code || '' });
        this.formControl.openFormEdit(item);
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
        this.creatingForBo = bo;
        this.ctdtForm.reset({ ten: '', madt: '' });
        this.ctdtDrawerVisible = true;
    }

    openCtdt(item: Ctdt): void {
        this.router.navigate(['/admin/dao-tao/chuongtrinh-daotao/ctdt-thongtin'], {
            queryParams: { code: item.id }
        });
    }

    submitCtdtForm(): void {
        if (!this.creatingForBo) {
            this.notificationService.toastWarning('Vui lòng chọn một bộ chương trình đào tạo');
            return;
        }
        this.ctdtForm.markAllAsTouched();
        if (this.ctdtForm.invalid) {
            this.notificationService.toastWarning('Vui lòng kiểm tra lại các trường bắt buộc');
            return;
        }

        const value = this.ctdtForm.getRawValue();
        const payload: Partial<Ctdt> = {
            ten: (value.ten || '').trim(),
            madt: (value.madt || '').trim(),
            ctdt_bo_id: this.creatingForBo.id
        };

        this.isSaving.set(true);
        this.ctdtDrawerVisible = false;
        this.ctdtService.addCtdt(payload).pipe(takeUntil(this.destroy$)).subscribe({
            next: () => {
                this.isSaving.set(false);
                this.notificationService.toastSuccess('Thêm mới chương trình đào tạo thành công', 'Thành công');
                this.loadCtdt(this.ctdtTable.paginator.paged(), false);
            },
            error: () => {
                this.isSaving.set(false);
                this.notificationService.toastError('Thêm mới chương trình đào tạo thất bại', 'Lỗi thao tác');
            }
        });
    }

    deleteCtdt(item: Ctdt): void {
        if (!this.canDeleteCtdt) {
            this.notificationService.toastWarning('Bạn không có quyền xóa chương trình đào tạo');
            return;
        }

        const currentPage = this.ctdtTable.paginator.paged();
        const nextPage = this.ctdtTable.data().length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
        const safeTitle = (item.ten || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        this.notificationService.confirmDelete2({
            heading: 'Xác nhận xóa',
            htmlMessage: `Bạn có chắc muốn xóa chương trình đào tạo "${safeTitle}"?`
        }).pipe(
            filter(Boolean),
            switchMap(() => this.ctdtService.deleteCtdt(item.id)),
            takeUntil(this.destroy$)
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

    requestCloseDrawer(): void {
        if (this.formControl.state() === 'SUBMITTING') return;
        this.formControl.visible = false;
    }

    submitForm(): void {
        if (this.formControl.state() === 'SUBMITTING' || this.isSaving()) return;
        this.boCtdtForm.markAllAsTouched();
        if (this.boCtdtForm.invalid) {
            this.notificationService.toastWarning('Vui lòng kiểm tra lại các trường bắt buộc');
            return;
        }
        const value = this.boCtdtForm.getRawValue();
        const payload: Partial<BoCtdt> = { name: (value.name || '').trim(), code: (value.code || '').trim() };
        const isAdd = this.formControl.isFormAdd;
        const request$ = isAdd ? this.boCtdtService.create(payload) : this.boCtdtService.update(this.formControl.object.id, payload);
        this.isSaving.set(true);
        this.formControl.visible = false;
        request$.pipe(takeUntil(this.destroy$)).subscribe({
            next: () => {
                this.isSaving.set(false);
                this.notificationService.toastSuccess(isAdd ? 'Thêm mới bộ chương trình đào tạo thành công' : 'Cập nhật bộ chương trình đào tạo thành công', 'Thành công');
                this.loadBoCtdt(this.boTable.paginator.paged(), false);
            },
            error: () => {
                this.isSaving.set(false);
                this.notificationService.toastError(isAdd ? 'Thêm mới bộ chương trình đào tạo thất bại' : 'Cập nhật bộ chương trình đào tạo thất bại', 'Lỗi thao tác');
            }
        });
    }

    deleteBoCtdt(item: BoCtdt): void {
        if (!this.canDelete) { this.notificationService.toastWarning('Bạn không có quyền xóa bộ chương trình đào tạo'); return; }
        const safeTitle = (item.name || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        this.requestDeletingData([item.id], `Bạn có chắc muốn xóa bộ chương trình đào tạo "${safeTitle}"?`);
    }

    deleteSelectedBoCtdt(): void {
        if (!this.canDelete) { this.notificationService.toastWarning('Bạn không có quyền xóa bộ chương trình đào tạo'); return; }
        const selected = this.boTable.getSelectedData();
        if (selected.length) this.requestDeletingData(selected.map(item => item.id), `Bạn có chắc muốn xóa ${selected.length} bộ chương trình đào tạo đã chọn?`);
    }

    private requestDeletingData(ids: number[], message: string): void {
        const currentPage = this.boTable.paginator.paged();
        const nextPage = ids.length === this.boTable.data().length && currentPage > 1 ? currentPage - 1 : currentPage;
        this.notificationService.confirmDelete2({ heading: 'Xác nhận xóa', htmlMessage: message }).pipe(
            filter(Boolean), map(() => new IctuDeletingAnimationControl(ids, this.boCtdtService)),
            switchMap((controller: IctuDeletingAnimationControl): Observable<boolean> => { controller.run(); return this.notificationService.startDeleting(controller.progress); }),
            takeUntil(this.destroy$)
        ).subscribe({
            next: success => { if (success) this.notificationService.toastSuccess('Xóa bộ chương trình đào tạo thành công', 'Thành công'); this.loadBoCtdt(nextPage, false); },
            error: () => { this.notificationService.toastError('Xóa một hoặc nhiều bộ chương trình đào tạo thất bại', 'Lỗi thao tác'); this.loadBoCtdt(currentPage, false); }
        });
    }

    toggleBoCheckAll(checked: boolean): void { this.boTable.selectRow(checked); }
    toggleBoCheckRow(checked: boolean, index: number): void { this.boTable.selectRow(checked, index); }
    trackByBoId(_index: number, item: BoCtdt): number { return item.id; }
    trackByCtdtId(_index: number, item: Ctdt): number { return item.id || _index; }
}
