import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, WritableSignal, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { Drawer } from 'primeng/drawer';
import { Tooltip } from 'primeng/tooltip';
import { Subject, finalize, takeUntil } from 'rxjs';
import { LoadingProgressComponent } from '@core-new/components/loading-progress/loading-progress.component';
import { AppState } from '@core-new/models/app-state';
import { IctuDeletingAnimationControl } from '@core-new/models/ictu-deleting-animation-control';
import { NotificationService } from '@core-new/service/notification.service';
import { HelperService } from '@core/services/helper.service';
import { OvicQueryCondition } from '@core/models/dto';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { BoCtdt } from '@modules/shared/models/bo-ctdt';
import { BoCtdtCdr, BoCtdtCdrPayload } from '@modules/shared/models/bo-ctdt-cdr';
import { BoCtdtCdrService } from '@modules/shared/services/ctdt-bo-cdr.service';
import { OvicEditorComponent } from '@modules/shared/components/ovic-editor/ovic-editor.component';

export interface BoCtdtCdrParent extends BoCtdtCdr {
    children: BoCtdtCdr[];
}

@Component({
    selector: 'app-bo-ctdt-cdr',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, Drawer, Tooltip, MatButtonModule,
        LoadingProgressComponent, OvicEditorComponent],
    templateUrl: './bo-ctdt-cdr.component.html',
    styleUrl: './bo-ctdt-cdr.component.css'
})
export class BoCtdtCdrComponent implements OnChanges, OnDestroy {
    private readonly fb = inject(FormBuilder);
    private readonly cdrService = inject(BoCtdtCdrService);
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

    readonly state: WritableSignal<AppState> = signal('loading');
    readonly saving: WritableSignal<boolean> = signal(false);
    readonly deleting: WritableSignal<boolean> = signal(false);
    readonly rows: WritableSignal<BoCtdtCdrParent[]> = signal([]);
    readonly expandedPloIds: WritableSignal<ReadonlySet<number>> = signal(new Set<number>());
    readonly drawerVisible: WritableSignal<boolean> = signal(false);
    readonly selectedParent: WritableSignal<BoCtdtCdrParent | null> = signal(null);
    readonly editingRow: WritableSignal<BoCtdtCdr | null> = signal(null);
    readonly formTitle: WritableSignal<string> = signal('');
    readonly form = this.fb.group({
        percent_pi: [null as number | null],
        noidung: ['', [Validators.required, (control: AbstractControl): ValidationErrors | null => {
            const text = this.helper.decodeHTML(String(control.value || ''))
                .replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').trim();
            return text ? null : { required: true };
        }]]
    });

    get f() { return this.form.controls; }
    get busy(): boolean { return this.saving() || this.deleting(); }
    get isPiForm(): boolean { return this.selectedParent() !== null; }
    decodeContent(value: string): string {
        return value ? this.helper.decodeHTML(value) : '';
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (!changes['selectedBo']) return;
        ++this.contextVersion;
        this.cancelContext$.next();
        this.cancelLoad$.next();
        this.drawerVisible.set(false);
        this.editingRow.set(null);
        this.selectedParent.set(null);
        this.rows.set([]);
        this.expandedPloIds.set(new Set<number>());
        this.loadRows();
    }

    ngOnDestroy(): void {
        this.destroyed = true;
        ++this.contextVersion;
        this.cancelContext$.next();
        this.cancelContext$.complete();
        this.cancelLoad$.next();
        this.cancelLoad$.complete();
        this.destroy$.next();
        this.destroy$.complete();
    }

    goBack(): void {
        if (!this.busy) this.back.emit();
    }

    loadRows(): void {
        if (this.busy) return;
        const boId = Number(this.selectedBo?.id);
        this.cancelLoad$.next();
        if (!Number.isInteger(boId) || boId <= 0) {
            this.state.set('error');
            return;
        }
        const version = this.contextVersion;
        this.state.set('loading');
        const condition: ConditionOption = {
            condition: [{ conditionName: 'ctdt_bo_id', condition: OvicQueryCondition.equal, value: String(boId), orWhere: 'and' }],
            set: [{ label: 'limit', value: '-1' }],
            page: null
        };
        this.cdrService.getByPage(condition).pipe(takeUntil(this.cancelLoad$), takeUntil(this.destroy$)).subscribe({
            next: response => {
                if (version !== this.contextVersion || this.destroyed) return;
                const all = (response.data || []).filter(row => Number(row.ctdt_bo_id) === boId).map(row => ({
                    ...row, id: Number(row.id), ctdt_bo_id: boId, parent_id: Number(row.parent_id),
                    percent_pi: Number(row.percent_pi) || 0
                }));
                this.rows.set(all.filter(row => row.parent_id === 0).map(parent => ({
                    ...parent, children: all.filter(child => child.parent_id === parent.id)
                })));
                this.state.set('success');
            },
            error: () => {
                if (version === this.contextVersion && !this.destroyed) this.state.set('error');
            }
        });
    }

    isPloExpanded(plo: BoCtdtCdrParent): boolean {
        return !!plo.id && this.expandedPloIds().has(plo.id);
    }

    togglePlo(plo: BoCtdtCdrParent): void {
        if (!plo.id || !plo.children.length || this.busy) return;
        const expanded = new Set(this.expandedPloIds());
        expanded.has(plo.id) ? expanded.delete(plo.id) : expanded.add(plo.id);
        this.expandedPloIds.set(expanded);
    }

    openCreatePlo(): void {
        if (!this.canAdd || !this.selectedBo?.id || this.busy || this.state() !== 'success') return;
        this.selectedParent.set(null);
        this.editingRow.set(null);
        this.formTitle.set('Thêm PLO');
        this.resetForm();
        this.drawerVisible.set(true);
    }

    openCreatePi(parent: BoCtdtCdrParent): void {
        if (!this.canAdd || this.busy || this.state() !== 'success') return;
        const current = this.rows().find(row => row.id === parent.id);
        if (!current) return;
        this.selectedParent.set(current);
        this.editingRow.set(null);
        this.formTitle.set('Thêm PI');
        this.resetForm();
        this.drawerVisible.set(true);
    }

    openEdit(row: BoCtdtCdr, parent: BoCtdtCdrParent | null = null): void {
        if (!this.canUpdate || this.busy || this.state() !== 'success' || !this.findRow(row.id)) return;
        const currentParent = parent ? this.rows().find(item => item.id === parent.id) : null;
        if (parent && (!currentParent || !currentParent.children.some(child => child.id === row.id))) return;
        this.selectedParent.set(currentParent);
        this.editingRow.set(row);
        this.formTitle.set(parent ? 'Sửa PI' : 'Sửa PLO');
        this.f.percent_pi.setValidators(parent
            ? [Validators.required, Validators.min(0), Validators.max(100), Validators.pattern(/^[0-9]+$/)]
            : []);
        this.form.reset({ noidung: row.noidung, percent_pi: parent ? Number(row.percent_pi) : null });
        this.drawerVisible.set(true);
    }

    closeDrawer(): void {
        if (this.busy) return;
        this.drawerVisible.set(false);
        this.editingRow.set(null);
        this.selectedParent.set(null);
    }

    private resetForm(): void {
        this.f.percent_pi.setValidators(this.isPiForm
            ? [Validators.required, Validators.min(0), Validators.max(100), Validators.pattern(/^[0-9]+$/)]
            : []);
        this.form.reset({ noidung: '', percent_pi: null });
    }

    submit(): void {
        const boId = Number(this.selectedBo?.id);
        const editing = this.editingRow();
        if (!(editing ? this.canUpdate : this.canAdd) || !boId || this.busy || this.state() !== 'success') return;
        this.form.markAllAsTouched();
        if (this.form.invalid) return;
        const parent = this.selectedParent();
        if (parent && !this.rows().some(row => row.id === parent.id)) return;
        if (editing && !this.findRow(editing.id)) return;
        const value = this.form.getRawValue();
        const version = this.contextVersion;
        this.saving.set(true);
        const payload = this.buildPayload(boId, parent, value.noidung || '', value.percent_pi);
        const save$ = editing?.id
            ? this.cdrService.update(editing.id, payload)
            : this.cdrService.create(payload);
        save$.pipe(
            takeUntil(this.cancelContext$), takeUntil(this.destroy$), finalize(() => this.saving.set(false))
        ).subscribe({
            next: () => {
                if (version !== this.contextVersion || this.destroyed) return;
                this.saving.set(false);
                this.closeDrawer();
                this.notification.toastSuccess(editing ? 'Đã cập nhật chuẩn đầu ra.' : 'Đã thêm chuẩn đầu ra.', 'Thành công');
                this.loadRows();
            },
            error: () => {
                if (version === this.contextVersion && !this.destroyed) {
                    this.notification.toastError('Không thể lưu chuẩn đầu ra. Dữ liệu nhập được giữ lại.', 'Lỗi thao tác');
                }
            }
        });
    }

    private buildPayload(boId: number, parent: BoCtdtCdrParent | null, content: string, percentPi: number | null): BoCtdtCdrPayload {
        return {
            ctdt_bo_id: boId,
            noidung: content,
            parent_id: parent?.id || 0,
            percent_pi: parent ? Number(percentPi) : 0
        };
    }

    private findRow(id: number): BoCtdtCdr | undefined {
        return this.rows().flatMap(parent => [parent, ...parent.children]).find(row => row.id === id);
    }

    deleteRow(row: BoCtdtCdr): void {
        if (!this.canDelete || this.busy || this.state() !== 'success' || !this.findRow(row.id)) return;
        if (this.rows().find(parent => parent.id === row.id)?.children.length) {
            this.notification.toastWarning('Không thể xóa PLO khi vẫn còn PI con. Vui lòng xóa các PI trước.');
            return;
        }
        const version = this.contextVersion;
        const kind = Number(row.parent_id) === 0 ? 'PLO' : 'PI';
        this.notification.confirmDelete2({
            heading: 'Xác nhận xóa', htmlMessage: `Bạn có chắc muốn xóa ${kind} này?`
        }).pipe(takeUntil(this.cancelContext$), takeUntil(this.destroy$)).subscribe(confirmed => {
            if (!confirmed || !this.canDelete || this.busy || this.destroyed || version !== this.contextVersion
                || this.state() !== 'success' || !this.findRow(row.id)) return;
            if (this.rows().find(parent => parent.id === row.id)?.children.length) {
                this.notification.toastWarning('Không thể xóa PLO khi vẫn còn PI con.');
                return;
            }
            this.deleting.set(true);
            const controller = new IctuDeletingAnimationControl([row.id], {
                delete: id => this.cdrService.delete(id).pipe(takeUntil(this.cancelContext$), takeUntil(this.destroy$))
            });
            this.notification.startDeleting(controller.progress.pipe(takeUntil(this.cancelContext$), takeUntil(this.destroy$))).pipe(
                takeUntil(this.cancelContext$), takeUntil(this.destroy$), finalize(() => this.deleting.set(false))
            ).subscribe({
                next: success => {
                    if (version !== this.contextVersion || this.destroyed) return;
                    if (!success) {
                        this.notification.toastError('Xóa chuẩn đầu ra thất bại.', 'Lỗi thao tác');
                        return;
                    }
                    this.rows.update(items => items.filter(item => item.id !== row.id)
                        .map(item => ({ ...item, children: item.children.filter(child => child.id !== row.id) })));
                    this.notification.toastSuccess('Đã xóa chuẩn đầu ra.', 'Thành công');
                },
                error: () => this.notification.toastError('Xóa chuẩn đầu ra thất bại.', 'Lỗi thao tác')
            });
            controller.run();
        });
    }

    getTotalPiPercent(parent: BoCtdtCdrParent): number {
        return parent.children.reduce((total, child) => total + Number(child.percent_pi || 0), 0);
    }

    getPiPercentState(parent: BoCtdtCdrParent): 'complete' | 'under' | 'over' {
        const total = this.getTotalPiPercent(parent);
        return total === 100 ? 'complete' : total > 100 ? 'over' : 'under';
    }

    getPercentTooltip(parent: BoCtdtCdrParent): string {
        const total = this.getTotalPiPercent(parent);
        return total === 100 ? 'Tổng PI đạt 100%' : total < 100 ? `Còn thiếu ${100 - total}%` : `Vượt quá ${total - 100}%`;
    }
}
