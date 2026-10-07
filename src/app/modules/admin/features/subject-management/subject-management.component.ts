import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal, viewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatButton } from '@angular/material/button';
import { Drawer } from 'primeng/drawer';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { Observable, Subject as RxSubject, filter, map, switchMap, takeUntil } from 'rxjs';
import { IctuPaginatorComponent } from '@core-new/components/ictu-paginator/ictu-paginator.component';
import { LoadingProgressComponent } from '@core-new/components/loading-progress/loading-progress.component';
import { AppState } from '@core-new/models/app-state';
import { DataTableEvent, DataTableEventName, IctuDataTable2 } from '@core-new/models/datatable';
import { IctuFormControl2 } from '@core-new/models/ictu-form-control';
import { OvicConditionParam, OvicQueryCondition } from '@core/models/dto';
import { AuthService } from '@core/services/auth.service';
import { Subject } from '@modules/shared/models/subject';
import { SubjectService } from '@modules/shared/services/subject.service';
import { IctuDeletingAnimationControl } from '@core-new/models/ictu-deleting-animation-control';
import { NotificationService } from '@core-new/service/notification.service';

function nonNegativeIntegerValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const val = control.value;
        if (val === null || val === undefined || val === '') {
            return null;
        }
        const num = Number(val);
        if (Number.isNaN(num) || num < 0 || !Number.isInteger(num)) {
            return { nonNegativeInteger: true };
        }
        return null;
    };
}

function creditBalanceValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
        const total = group.get('sotinchi')?.value;
        const practice = group.get('sotinchi_th')?.value;
        if (total === null || total === undefined || practice === null || practice === undefined) {
            return null;
        }
        const numTotal = Number(total);
        const numPractice = Number(practice);
        if (!Number.isNaN(numTotal) && !Number.isNaN(numPractice) && numPractice > numTotal) {
            return { practiceExceedsTotal: true };
        }
        return null;
    };
}

@Component({
    selector: 'app-subject-management',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatCheckbox,
        Drawer,
        InputText,
        Textarea,
        IctuPaginatorComponent,
        LoadingProgressComponent,
        MatButton
    ],
    templateUrl: './subject-management.component.html',
    styleUrl: './subject-management.component.css'
})
export class SubjectManagementComponent implements OnInit, OnDestroy {
    private readonly fb = inject(FormBuilder);
    private readonly subjectService = inject(SubjectService);
    private readonly notificationService = inject(NotificationService);
    private readonly auth = inject(AuthService);
    private readonly router = inject(Router);

    readonly drawer = viewChild<Drawer>('subjectDrawer');
    readonly destroy$ = new RxSubject<void>();
    private closingDrawer = false;

    readonly table = new IctuDataTable2<Subject>({ rows: 20, pageLinkSize: 5 });
    readonly state = signal<AppState>('loading');
    readonly isSaving = signal<boolean>(false);
    readonly searchValue = signal<string>('');

    canAdd = true;
    canUpdate = true;
    canDelete = true;

    readonly subjectForm: FormGroup = this.fb.group({
        name: ['', [Validators.required, Validators.maxLength(255)]],
        code: ['', [Validators.required, Validators.maxLength(50)]],
        desc: ['', [Validators.maxLength(1000)]],
        sotinchi: [0, [Validators.required, nonNegativeIntegerValidator()]],
        sotinchi_th: [0, [Validators.required, nonNegativeIntegerValidator()]]
    }, { validators: creditBalanceValidator() });

    readonly formControl = new IctuFormControl2<Subject>({
        dropdownFields: [],
        formGroup: this.subjectForm,
        objectName: 'môn học',
        drawer: this.drawer
    });

    private readonly handelEvent: Record<DataTableEventName, (data: Subject) => void> = {
        OPEN_FORM_ADD: () => this.openCreateDrawer(),
        OPEN_FORM_UPDATE: data => this.openEditDrawer(data),
        DELETE_SINGLE_ROW: data => this.deleteSubject(data),
        DELETE_SELECTED_ROWS: () => this.deleteSelectedSubjects(),
        SUBMIT_FORM: () => this.submitForm()
    };

    private readonly observeEvents = new RxSubject<DataTableEvent<Subject>>();

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
            this.canAdd = this.auth.userCanAdd(routePath) || this.auth.userCanAdd('quanly-monhoc');
        }
        if (this.auth?.userCanEdit) {
            this.canUpdate = this.auth.userCanEdit(routePath) || this.auth.userCanEdit('quanly-monhoc');
        }
        if (this.auth?.userCanDelete) {
            this.canDelete = this.auth.userCanDelete(routePath) || this.auth.userCanDelete('quanly-monhoc');
        }
    }

    onSearchChange(event: Event): void {
        const value = (event.target as HTMLInputElement).value || '';
        this.searchValue.set(value);
    }

    onSearchData(): void {
        this.searchValue.set(this.searchValue().trim());
        this.loadData(1, true);
    }

    onChangePage(page: number): void {
        this.loadData(page, false);
    }

    loadData(page: number = 1, resetPaginator: boolean = false): void {
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

        const queryParams = {
            limit: this.table.paginator.rows(),
            paged: page,
            orderby: 'created_at',
            order: 'DESC'
        };

        this.subjectService.get(conditions, queryParams).pipe(
            takeUntil(this.destroy$)
        ).subscribe({
            next: response => {
                const total = Number(response.totalRecords) || 0;
                this.table.fillRawData(
                    {
                        data: Array.isArray(response.data) ? response.data : [],
                        recordsFiltered: total,
                        recordsTotal: total,
                        draw: 1
                    },
                    { paged: page, resetPaginator }
                );
                this.state.set('success');
            },
            error: () => {
                this.state.set('error');
                this.notificationService.toastError('Không thể tải dữ liệu môn học', 'Lỗi kết nối');
            }
        });
    }

    emitEvent(name: DataTableEventName, data: Subject = null): void {
        this.observeEvents.next({ name, data });
    }

    openCreateDrawer(): void {
        if (!this.canAdd) {
            this.notificationService.toastWarning('Bạn không có quyền thêm mới môn học');
            return;
        }

        this.subjectForm.reset({
            name: '',
            code: '',
            desc: '',
            sotinchi: 0,
            sotinchi_th: 0
        });
        this.formControl.openFormAdd();
    }

    openEditDrawer(item: Subject): void {
        if (!this.canUpdate) {
            this.notificationService.toastWarning('Bạn không có quyền chỉnh sửa môn học');
            return;
        }

        this.subjectForm.reset({
            name: item.name || '',
            code: item.code || '',
            desc: item.desc || '',
            sotinchi: Number(item.sotinchi) || 0,
            sotinchi_th: Number(item.sotinchi_th) || 0
        });
        this.formControl.openFormEdit(item);
    }

    requestCloseDrawer(): void {
        if (this.closingDrawer || this.formControl.state() === 'SUBMITTING') {
            return;
        }

        this.closeDrawer();
    }

    private closeDrawer(): void {
        this.formControl.visible = false;
    }

    submitForm(): void {
        if (this.formControl.state() === 'SUBMITTING' || this.isSaving()) {
            return;
        }

        this.subjectForm.markAllAsTouched();
        if (this.subjectForm.invalid) {
            if (this.subjectForm.errors?.['practiceExceedsTotal']) {
                this.notificationService.toastWarning('Tín chỉ thực hành không được lớn hơn tổng tín chỉ');
                return;
            }
            this.notificationService.toastWarning('Vui lòng kiểm tra lại các trường bắt buộc');
            return;
        }

        const value = this.subjectForm.getRawValue();
        const sotinchi = Number(value.sotinchi) || 0;
        const sotinchiTh = Number(value.sotinchi_th) || 0;

        const payload: Partial<Subject> = {
            name: (value.name || '').trim(),
            code: (value.code || '').trim(),
            desc: (value.desc || '').trim(),
            sotinchi,
            sotinchi_th: sotinchiTh
        };

        const isAdd = this.formControl.isFormAdd;
        const request$ = isAdd
            ? this.subjectService.create(payload)
            : this.subjectService.update(this.formControl.object.id, payload);

        this.isSaving.set(true);
        this.closeDrawer();

        request$.pipe(
            takeUntil(this.destroy$)
        ).subscribe({
            next: () => {
                this.isSaving.set(false);
                const message = isAdd ? 'Thêm mới môn học thành công' : 'Cập nhật môn học thành công';
                this.notificationService.toastSuccess(message, 'Thành công');
                this.loadData(this.table.paginator.paged(), false);
            },
            error: () => {
                this.isSaving.set(false);
                const message = isAdd ? 'Thêm mới môn học thất bại' : 'Cập nhật môn học thất bại';
                this.notificationService.toastError(message, 'Lỗi thao tác');
            }
        });
    }

    deleteSubject(item: Subject): void {
        if (!this.canDelete) {
            this.notificationService.toastWarning('Bạn không có quyền xóa môn học');
            return;
        }

        const safeTitle = (item.name || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        this.requestDeletingData([item.id], `Bạn có chắc muốn xóa môn học "${safeTitle}"?`);
    }

    deleteSelectedSubjects(): void {
        if (!this.canDelete) {
            this.notificationService.toastWarning('Bạn không có quyền xóa môn học');
            return;
        }

        const selected = this.table.getSelectedData();
        if (!selected.length) {
            return;
        }

        this.requestDeletingData(
            selected.map(item => item.id),
            `Bạn có chắc muốn xóa ${selected.length} môn học đã chọn?`
        );
    }

    private requestDeletingData(ids: number[], message: string): void {
        const currentPage = this.table.paginator.paged();
        const nextPage = ids.length === this.table.data().length && currentPage > 1
            ? currentPage - 1
            : currentPage;

        this.notificationService.confirmDelete2({
            heading: 'Xác nhận xóa',
            htmlMessage: message
        }).pipe(
            filter((confirmed: boolean): boolean => confirmed),
            map(() => new IctuDeletingAnimationControl(ids, this.subjectService)),
            switchMap((deleteController: IctuDeletingAnimationControl): Observable<boolean> => {
                deleteController.run();
                return this.notificationService.startDeleting(deleteController.progress);
            }),
            takeUntil(this.destroy$)
        ).subscribe({
            next: (success: boolean): void => {
                if (success) {
                    this.notificationService.toastSuccess('Xóa môn học thành công', 'Thành công');
                }
                this.loadData(nextPage, false);
            },
            error: (): void => {
                this.notificationService.toastError('Xóa một hoặc nhiều môn học thất bại', 'Lỗi thao tác');
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

    trackById(_index: number, item: Subject): number {
        return item.id;
    } 
}
