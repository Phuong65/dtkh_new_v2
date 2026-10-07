import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatButton } from '@angular/material/button';
import { Drawer } from 'primeng/drawer';
import { InputText } from 'primeng/inputtext';
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

@Component({
    selector: 'app-bo-ctdt-management',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatCheckbox,
        Drawer,
        InputText,
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
    private readonly notificationService = inject(NotificationService);
    private readonly auth = inject(AuthService);
    private readonly router = inject(Router);

    readonly drawer = viewChild<Drawer>('boCtdtDrawer');
    readonly destroy$ = new RxSubject<void>();
    readonly table = new IctuDataTable2<BoCtdt>({ rows: 20, pageLinkSize: 5 });
    readonly state = signal<AppState>('loading');
    readonly isSaving = signal<boolean>(false);
    readonly searchValue = signal<string>('');

    canAdd = true;
    canUpdate = true;
    canDelete = true;

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
        this.observeEvents.pipe(takeUntil(this.destroy$)).subscribe(({ name, data }) => {
            this.handelEvent[name](data);
        });
        this.loadData(1, true);
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private checkPermissions(): void {
        const rawUrl = this.router.url.split('?')[0];
        const routePath = rawUrl.startsWith('/admin/') ? rawUrl.substring(7) : rawUrl.replace(/^\//, '');

        if (this.auth?.userCanAdd) {
            this.canAdd = this.auth.userCanAdd(routePath) || this.auth.userCanAdd('bo-ctdt');
        }
        if (this.auth?.userCanEdit) {
            this.canUpdate = this.auth.userCanEdit(routePath) || this.auth.userCanEdit('bo-ctdt');
        }
        if (this.auth?.userCanDelete) {
            this.canDelete = this.auth.userCanDelete(routePath) || this.auth.userCanDelete('bo-ctdt');
        }
    }

    onSearchChange(event: Event): void {
        this.searchValue.set((event.target as HTMLInputElement).value || '');
    }

    onSearchData(): void {
        this.searchValue.set(this.searchValue().trim());
        this.loadData(1, true);
    }

    onChangePage(page: number): void {
        this.loadData(page, false);
    }

    loadData(page = 1, resetPaginator = false): void {
        this.state.set('loading');
        const conditions: OvicConditionParam[] = [];
        const query = this.searchValue();
        if (query) {
            conditions.push({
                conditionName: 'name',
                condition: OvicQueryCondition.like,
                value: `%${query}%`,
                orWhere: 'or'
            });
            conditions.push({
                conditionName: 'code',
                condition: OvicQueryCondition.like,
                value: `%${query}%`,
                orWhere: 'or'
            });
        }

        this.boCtdtService.get(conditions, {
            limit: this.table.paginator.rows(),
            paged: page,
            orderby: 'created_at',
            order: 'DESC'
        }).pipe(takeUntil(this.destroy$)).subscribe({
            next: response => {
                const total = Number(response.totalRecords) || 0;
                this.table.fillRawData({
                    data: Array.isArray(response.data) ? response.data : [],
                    recordsFiltered: total,
                    recordsTotal: total,
                    draw: 1
                }, { paged: page, resetPaginator });
                this.state.set('success');
            },
            error: () => {
                this.state.set('error');
                this.notificationService.toastError('Không thể tải dữ liệu bộ chương trình đào tạo', 'Lỗi kết nối');
            }
        });
    }

    emitEvent(name: DataTableEventName, data: BoCtdt = null): void {
        this.observeEvents.next({ name, data });
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

    requestCloseDrawer(): void {
        if (this.formControl.state() === 'SUBMITTING') {
            return;
        }
        this.formControl.visible = false;
    }

    submitForm(): void {
        if (this.formControl.state() === 'SUBMITTING' || this.isSaving()) {
            return;
        }
        this.boCtdtForm.markAllAsTouched();
        if (this.boCtdtForm.invalid) {
            this.notificationService.toastWarning('Vui lòng kiểm tra lại các trường bắt buộc');
            return;
        }

        const value = this.boCtdtForm.getRawValue();
        const payload: Partial<BoCtdt> = {
            name: (value.name || '').trim(),
            code: (value.code || '').trim()
        };
        const isAdd = this.formControl.isFormAdd;
        const request$ = isAdd
            ? this.boCtdtService.create(payload)
            : this.boCtdtService.update(this.formControl.object.id, payload);

        this.isSaving.set(true);
        this.formControl.visible = false;
        request$.pipe(takeUntil(this.destroy$)).subscribe({
            next: () => {
                this.isSaving.set(false);
                this.notificationService.toastSuccess(
                    isAdd ? 'Thêm mới bộ chương trình đào tạo thành công' : 'Cập nhật bộ chương trình đào tạo thành công',
                    'Thành công'
                );
                this.loadData(this.table.paginator.paged(), false);
            },
            error: () => {
                this.isSaving.set(false);
                this.notificationService.toastError(
                    isAdd ? 'Thêm mới bộ chương trình đào tạo thất bại' : 'Cập nhật bộ chương trình đào tạo thất bại',
                    'Lỗi thao tác'
                );
            }
        });
    }

    deleteBoCtdt(item: BoCtdt): void {
        if (!this.canDelete) {
            this.notificationService.toastWarning('Bạn không có quyền xóa bộ chương trình đào tạo');
            return;
        }
        const safeTitle = (item.name || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        this.requestDeletingData([item.id], `Bạn có chắc muốn xóa bộ chương trình đào tạo "${safeTitle}"?`);
    }

    deleteSelectedBoCtdt(): void {
        if (!this.canDelete) {
            this.notificationService.toastWarning('Bạn không có quyền xóa bộ chương trình đào tạo');
            return;
        }
        const selected = this.table.getSelectedData();
        if (!selected.length) {
            return;
        }
        this.requestDeletingData(
            selected.map(item => item.id),
            `Bạn có chắc muốn xóa ${selected.length} bộ chương trình đào tạo đã chọn?`
        );
    }

    private requestDeletingData(ids: number[], message: string): void {
        const currentPage = this.table.paginator.paged();
        const nextPage = ids.length === this.table.data().length && currentPage > 1 ? currentPage - 1 : currentPage;

        this.notificationService.confirmDelete2({
            heading: 'Xác nhận xóa',
            htmlMessage: message
        }).pipe(
            filter((confirmed: boolean): boolean => confirmed),
            map(() => new IctuDeletingAnimationControl(ids, this.boCtdtService)),
            switchMap((deleteController: IctuDeletingAnimationControl): Observable<boolean> => {
                deleteController.run();
                return this.notificationService.startDeleting(deleteController.progress);
            }),
            takeUntil(this.destroy$)
        ).subscribe({
            next: success => {
                if (success) {
                    this.notificationService.toastSuccess('Xóa bộ chương trình đào tạo thành công', 'Thành công');
                }
                this.loadData(nextPage, false);
            },
            error: () => {
                this.notificationService.toastError('Xóa một hoặc nhiều bộ chương trình đào tạo thất bại', 'Lỗi thao tác');
                this.loadData(currentPage, false);
            }
        });
    }

    toggleCheckAll(checked: boolean): void {
        this.table.selectRow(checked);
    }

    toggleCheckRow(checked: boolean, index: number): void {
        this.table.selectRow(checked, index);
    }

    trackById(_index: number, item: BoCtdt): number {
        return item.id;
    }
}
