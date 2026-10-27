import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Subject, finalize, takeUntil } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { LoadingProgressComponent } from '@core-new/components/loading-progress/loading-progress.component';
import { NotificationService } from '@core-new/service/notification.service';
import { Ctdt } from '@modules/shared/models/ctdt';
import { OvicEditorComponent } from '@modules/shared/components/ovic-editor/ovic-editor.component';
import { CtdtService } from '@modules/shared/services/ctdt.service';
import { ROLES } from '@modules/shared/utils/syscat';

type ProfileEditorTabId = 'mota' | 'cohoi' | 'vitri';
type ProfileFields = Pick<Ctdt, 'mota' | 'cohoihoctap_sautotnghiep' | 'vitri_lamviec_sautotnghiep'>;

@Component({
    selector: 'app-ctdt-hoso-phattrien',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, OvicEditorComponent, LoadingProgressComponent],
    templateUrl: './ctdt-hoso-phattrien.component.html',
    styleUrls: ['./ctdt-hoso-phattrien.component.css']
})
export class CtdtHosoPhatTrienComponent implements OnChanges, OnDestroy {
    private readonly auth = inject(AuthService);
    private readonly ctdtService = inject(CtdtService);
    private readonly formBuilder = inject(FormBuilder);
    private readonly notificationService = inject(NotificationService);
    private readonly destroy$ = new Subject<void>();
    private readonly cancelSave$ = new Subject<void>();
    private loadedCtdtId: number | null = null;

    @Input() selectedCtdt: Ctdt | null = null;
    @Input() disabled = true;
    @Output() ctdtUpdated = new EventEmitter<Ctdt>();

    readonly activeEditorTab = signal<ProfileEditorTabId>('mota');
    readonly isSaving = signal(false);
    readonly canEdit = [ROLES.manager, ROLES.admin, ROLES.troly_pdt, ROLES.chuyenvien_pdt, ROLES.daotao_new, ROLES.lanhdaokhoa]
        .some(role => this.auth.userHasRole(role));

    initialProfileValue: ProfileFields = { mota: '', cohoihoctap_sautotnghiep: '', vitri_lamviec_sautotnghiep: '' };
    readonly formProfile = this.formBuilder.nonNullable.group({
        mota: [''],
        cohoihoctap_sautotnghiep: [''],
        vitri_lamviec_sautotnghiep: ['']
    });

    get f() { return this.formProfile.controls; }

    ngOnChanges(changes: SimpleChanges): void {
        if (!changes['selectedCtdt']) return;
        const ctdt = this.selectedCtdt;
        const programmeId = ctdt?.id ?? null;
        if (programmeId === this.loadedCtdtId) return;
        this.cancelSave$.next();
        this.loadedCtdtId = programmeId;
        this.activeEditorTab.set('mota');
        this.initialProfileValue = {
            mota: ctdt?.mota || '',
            cohoihoctap_sautotnghiep: ctdt?.cohoihoctap_sautotnghiep || '',
            vitri_lamviec_sautotnghiep: ctdt?.vitri_lamviec_sautotnghiep || ''
        };
        this.formProfile.reset(this.initialProfileValue);
    }

    ngOnDestroy(): void {
        this.cancelSave$.next();
        this.cancelSave$.complete();
        this.destroy$.next();
        this.destroy$.complete();
    }

    selectEditorTab(tabId: ProfileEditorTabId): void {
        this.activeEditorTab.set(tabId);
    }

    onEditorTabKeydown(event: KeyboardEvent, index: number): void {
        const tabs: readonly ProfileEditorTabId[] = ['mota', 'cohoi', 'vitri'];
        let targetIndex: number;
        switch (event.key) {
            case 'ArrowRight':
                targetIndex = (index + 1) % tabs.length;
                break;
            case 'ArrowLeft':
                targetIndex = (index - 1 + tabs.length) % tabs.length;
                break;
            case 'Home':
                targetIndex = 0;
                break;
            case 'End':
                targetIndex = tabs.length - 1;
                break;
            default:
                return;
        }

        event.preventDefault();
        this.selectEditorTab(tabs[targetIndex]);
        const buttons = (event.currentTarget as HTMLElement).parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
        buttons?.[targetIndex]?.focus();
    }

    saveProfile(): void {
        const programmeId = this.selectedCtdt?.id;
        if (!programmeId || this.disabled || !this.canEdit || this.isSaving()) return;
        const data = this.formProfile.getRawValue();
        this.isSaving.set(true);
        this.ctdtService.updateCtdt(programmeId, data).pipe(
            takeUntil(this.cancelSave$), takeUntil(this.destroy$),
            finalize(() => this.isSaving.set(false))
        ).subscribe({
            next: () => {
                if (this.selectedCtdt?.id !== programmeId) return;
                const updated = { ...this.selectedCtdt, ...data };
                this.selectedCtdt = updated;
                this.formProfile.markAsPristine();
                this.ctdtUpdated.emit(updated);
                this.notificationService.toastSuccess('Lưu hồ sơ phát triển thành công');
            },
            error: () => this.notificationService.toastError('Lưu hồ sơ phát triển thất bại. Nội dung đang soạn được giữ lại.')
        });
    }
}
