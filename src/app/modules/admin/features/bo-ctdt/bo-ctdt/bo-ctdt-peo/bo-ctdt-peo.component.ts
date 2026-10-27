import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { Drawer } from 'primeng/drawer';
import { Tooltip } from 'primeng/tooltip';
import { Subject, finalize, takeUntil } from 'rxjs';
import { AppState } from '@core-new/models/app-state';
import { LoadingProgressComponent } from '@core-new/components/loading-progress/loading-progress.component';
import { IctuDeletingAnimationControl } from '@core-new/models/ictu-deleting-animation-control';
import { NotificationService } from '@core-new/service/notification.service';
import { HelperService } from '@core/services/helper.service';
import { OvicQueryCondition } from '@core/models/dto';
import { BoCtdt } from '@modules/shared/models/bo-ctdt';
import { CtdtBoMuctieuCuthe, CtdtBoMuctieuCuthePayload } from '@modules/shared/models/ctdt-bo-muctieu-cuthe';
import { CtdtBoMuctieuCutheService } from '@modules/shared/services/ctdt-bo-muctieu-cuthe.service';
import { OvicEditorComponent } from '@modules/shared/components/ovic-editor/ovic-editor.component';

@Component({
    selector: 'app-bo-ctdt-peo',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, MatButtonModule, Drawer, Tooltip, LoadingProgressComponent, OvicEditorComponent],
    templateUrl: './bo-ctdt-peo.component.html',
    styleUrl: './bo-ctdt-peo.component.css'
})
export class BoCtdtPeoComponent implements OnChanges, OnDestroy {
    private readonly fb = inject(FormBuilder);
    private readonly service = inject(CtdtBoMuctieuCutheService);
    private readonly notification = inject(NotificationService);
    private readonly helper = inject(HelperService);
    private readonly destroy$ = new Subject<void>();
    private readonly cancelLoad$ = new Subject<void>();
    private readonly cancelContext$ = new Subject<void>();
    private contextVersion = 0;
    private destroyed = false;

    @Input({ required: true }) selectedBo: BoCtdt | null = null;
    @Input() canAdd = false;
    @Input() canUpdate = false;
    @Input() canDelete = false;
    @Output() back = new EventEmitter<void>();

    readonly state = signal<AppState>('loading');
    readonly rows = signal<CtdtBoMuctieuCuthe[]>([]);
    readonly saving = signal(false);
    readonly deleting = signal(false);
    readonly drawerVisible = signal(false);
    readonly editingRow = signal<CtdtBoMuctieuCuthe | null>(null);
    readonly formTitle = signal('');
    readonly form = this.fb.group({
        noidung: ['', [Validators.required, (control: AbstractControl): ValidationErrors | null => {
            const text = this.decodeContent(String(control.value || '')).replace(/<[^>]*>/g, ' ')
                .replace(/&nbsp;/gi, ' ').replace(/[​-‍﻿]/g, '').trim();
            return text ? null : { required: true };
        }]]
    });

    get f() { return this.form.controls; }
    get busy(): boolean { return this.saving() || this.deleting(); }

    decodeContent(value: string): string { return value ? this.helper.decodeHTML(value) : ''; }

    ngOnChanges(changes: SimpleChanges): void {
        if (!changes['selectedBo']) return;
        ++this.contextVersion;
        this.cancelContext$.next();
        this.cancelLoad$.next();
        this.drawerVisible.set(false);
        this.editingRow.set(null);
        this.rows.set([]);
        this.form.reset({ noidung: '' });
        this.loadRows();
    }

    ngOnDestroy(): void {
        this.destroyed = true;
        ++this.contextVersion;
        [this.cancelContext$, this.cancelLoad$, this.destroy$].forEach(subject => {
            subject.next();
            subject.complete();
        });
    }

    goBack(): void { if (!this.busy) this.back.emit(); }

    loadRows(): void {
        if (this.busy || this.destroyed) return;
        this.cancelLoad$.next();
        const boId = Number(this.selectedBo?.id);
        if (!Number.isSafeInteger(boId) || boId <= 0) {
            this.state.set('error');
            return;
        }
        const version = this.contextVersion;
        this.state.set('loading');
        this.service.getByPage({
            condition: [{ conditionName: 'ctdt_bo_id', condition: OvicQueryCondition.equal, value: String(boId), orWhere: 'and' }],
            set: [{ label: 'limit', value: '-1' }], page: null
        }).pipe(takeUntil(this.cancelLoad$), takeUntil(this.destroy$)).subscribe({
            next: response => {
                if (version !== this.contextVersion || this.destroyed) return;
                this.rows.set((response.data || []).filter(row => Number(row.ctdt_bo_id) === boId)
                    .map(row => ({ ...row, id: Number(row.id), ctdt_bo_id: boId }))
                    .filter(row => Number.isSafeInteger(row.id) && row.id > 0));
                this.state.set('success');
            },
            error: () => {
                if (version === this.contextVersion && !this.destroyed) this.state.set('error');
            }
        });
    }

    openCreate(): void {
        if (!this.canAdd || !this.selectedBo?.id || this.busy || this.state() !== 'success') return;
        this.editingRow.set(null);
        this.formTitle.set('Thêm PEO');
        this.form.reset({ noidung: '' });
        this.drawerVisible.set(true);
    }

    openEdit(row: CtdtBoMuctieuCuthe): void {
        if (!this.canUpdate || this.busy || this.state() !== 'success') return;
        const current = this.rows().find(item => item.id === row.id);
        if (!current) return;
        this.editingRow.set(current);
        this.formTitle.set('Sửa PEO');
        this.form.reset({ noidung: current.noidung || '' });
        this.drawerVisible.set(true);
    }

    closeDrawer(): void {
        if (this.busy) return;
        this.drawerVisible.set(false);
        this.editingRow.set(null);
    }

    submit(): void {
        const boId = Number(this.selectedBo?.id);
        const editing = this.editingRow();
        if (!(editing ? this.canUpdate : this.canAdd) || this.busy || this.state() !== 'success'
            || !this.drawerVisible() || !Number.isSafeInteger(boId) || boId <= 0) return;
        this.form.markAllAsTouched();
        if (this.form.invalid || (editing && !this.rows().some(row => row.id === editing.id))) return;
        const payload: CtdtBoMuctieuCuthePayload = { ctdt_bo_id: boId, noidung: this.form.getRawValue().noidung || '' };
        const version = this.contextVersion;
        this.saving.set(true);
        const request$ = editing ? this.service.update(editing.id, payload) : this.service.create(payload);
        request$.pipe(takeUntil(this.cancelContext$), takeUntil(this.destroy$), finalize(() => this.saving.set(false))).subscribe({
            next: () => {
                if (version !== this.contextVersion || this.destroyed) return;
                this.saving.set(false);
                this.closeDrawer();
                this.notification.toastSuccess(editing ? 'Đã cập nhật PEO.' : 'Đã thêm PEO.', 'Thành công');
                this.loadRows();
            },
            error: () => {
                if (version === this.contextVersion && !this.destroyed) {
                    this.notification.toastError('Không thể lưu PEO. Dữ liệu nhập được giữ lại.', 'Lỗi thao tác');
                }
            }
        });
    }

    deleteRow(row: CtdtBoMuctieuCuthe): void {
        if (!this.canDelete || this.busy || this.state() !== 'success' || !this.rows().some(item => item.id === row.id)) return;
        const version = this.contextVersion;
        this.notification.confirmDelete2({ heading: 'Xác nhận xóa', htmlMessage: 'Bạn có chắc muốn xóa mục tiêu PEO này?' })
            .pipe(takeUntil(this.cancelContext$), takeUntil(this.destroy$)).subscribe(confirmed => {
                if (!confirmed || !this.canDelete || this.busy || this.destroyed || version !== this.contextVersion
                    || this.state() !== 'success' || !this.rows().some(item => item.id === row.id)) return;
                this.deleting.set(true);
                const controller = new IctuDeletingAnimationControl([row.id], {
                    delete: id => this.service.delete(id).pipe(takeUntil(this.cancelContext$), takeUntil(this.destroy$))
                });
                this.notification.startDeleting(controller.progress.pipe(takeUntil(this.cancelContext$), takeUntil(this.destroy$)))
                    .pipe(takeUntil(this.cancelContext$), takeUntil(this.destroy$), finalize(() => this.deleting.set(false))).subscribe({
                        next: success => {
                            if (version !== this.contextVersion || this.destroyed) return;
                            if (!success) {
                                this.notification.toastError('Xóa PEO thất bại.', 'Lỗi thao tác');
                                return;
                            }
                            this.rows.update(items => items.filter(item => item.id !== row.id));
                            this.notification.toastSuccess('Đã xóa PEO.', 'Thành công');
                        },
                        error: () => this.notification.toastError('Xóa PEO thất bại.', 'Lỗi thao tác')
                    });
                controller.run();
            });
    }
}
