import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, WritableSignal, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, finalize, forkJoin, map, of, switchMap, takeUntil } from 'rxjs';
import { Drawer } from 'primeng/drawer';
import { Select } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { LoadingProgressComponent } from '@core-new/components/loading-progress/loading-progress.component';
import { AppState } from '@core-new/models/app-state';
import { OvicQueryCondition } from '@core/models/dto';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { Ctdt } from '@modules/shared/models/ctdt';
import { CtdtConfig } from '@modules/shared/models/ctdt-config';
import { CtdtMuctieuCuthe } from '@modules/shared/models/ctdt-muctieu-cuthe';
import { CtdtService } from '@modules/shared/services/ctdt.service';
import { CtdtConfigService } from '@modules/shared/services/ctdt-config.service';
import { CtdtMuctieuCutheService } from '@modules/shared/services/ctdt-muctieu-cuthe.service';
import { ConfigsService } from '@modules/shared/services/configs.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { OvicEditorComponent } from '@modules/shared/components/ovic-editor/ovic-editor.component';
import { SafeHtmlDecodePipe } from '@modules/shared/pipes/safe-html-decode';
import { ROLES } from '@modules/shared/utils/syscat';

export interface typeMuctieuCuthe {
    key: string;
    title: string;
    children: CtdtMuctieuCuthe[];
}

@Component({
    selector: 'app-ctdt-muctieu-cdr',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, Drawer, Select, MultiSelectModule,
        OvicEditorComponent, SafeHtmlDecodePipe, NgbTooltipModule, LoadingProgressComponent],
    templateUrl: './ctdt-muctieu-cdr.component.html',
    styleUrls: ['./ctdt-muctieu-cdr.component.css']
})
export class CtdtMuctieuCdrComponent implements OnInit, OnDestroy {
    private readonly auth = inject(AuthService);
    private readonly notificationService = inject(NotificationService);
    private readonly router = inject(Router);
    private readonly ctdtService = inject(CtdtService);
    readonly formBuilder = inject(FormBuilder);
    private readonly elngUserProfileService = inject(ElngUserProfileService);
    private readonly ctdtMuctieuCutheService = inject(CtdtMuctieuCutheService);
    private readonly configsService = inject(ConfigsService);
    private readonly ctdtConfigService = inject(CtdtConfigService);
    private readonly destroy$ = new Subject<void>();
    private readonly cancelTabLoad$ = new Subject<void>();
    private readonly cancelGoalsLoad$ = new Subject<void>();
    private destroyed = false;
    private loadedCtdtId: number | null = null;

    @Input() selectedCtdt: Ctdt | null = null;

    isLanhDaoKhoa = this.auth.userHasRole(ROLES.lanhdaokhoa);
    isManager = [ROLES.manager, ROLES.admin, ROLES.troly_pdt, ROLES.chuyenvien_pdt]
        .some(role => this.auth.userHasRole(role));
    formMuctieuCuthe: FormGroup = this.formBuilder.group({
        ctdt_id: ['', Validators.required],
        kyhieu: [''],
        ordering: ['', Validators.required],
        noidung: ['', Validators.required],
        type: ['', Validators.required],
        tuongthich: [[]]
    });
    isUpdated = false;
    userId: number = this.auth.user?.id;
    donvi_chuyenmon_id: number;
    type_ctdt_muctieu_cuthe: CtdtConfig[] = [];
    list_tuongthich: CtdtConfig[] = [];
    list_ctdt_muctieu_cuthe: typeMuctieuCuthe[] = [];
    list_muctieu_cuthe: CtdtMuctieuCuthe[] = [];
    selectedMuctieuCuthe: CtdtMuctieuCuthe;
    formTitle = '';
    kyhieuMutieuCuthe = 'PEO';
    mucTieuChungDraft = '';
    drawerVisible = false;
    readonly state: WritableSignal<AppState> = signal<AppState>('loading');
    readonly goalsState: WritableSignal<AppState> = signal<AppState>('success');
    savingGeneral = false;
    savingGoal = false;
    deletingGoalId: number | null = null;

    get f() { return this.formMuctieuCuthe.controls; }

    get busy(): boolean {
        return this.state() === 'loading' || this.goalsState() === 'loading' || this.savingGeneral || this.savingGoal || this.deletingGoalId !== null;
    }

    get generalEditorInitialValue(): string {
        return this.selectedCtdt?.muctieu || '';
    }

    ngOnInit(): void {
        if (this.selectedCtdt?.id) this.loadTabData(this.selectedCtdt);
    }

    ngOnDestroy(): void {
        this.destroyed = true;
        this.cancelTabLoad$.next();
        this.cancelTabLoad$.complete();
        this.cancelGoalsLoad$.next();
        this.cancelGoalsLoad$.complete();
        this.destroy$.next();
        this.destroy$.complete();
    }

    reloadData(): void {
        if (this.selectedCtdt) this.loadTabData(this.selectedCtdt, true);
    }

    private loadTabData(ctdt: Ctdt, force = false): void {
        if (!this.isManager && !this.isLanhDaoKhoa) {
            this.state.set('success');
            this.router.navigate(['/admin/content-none']);
            return;
        }
        if (!force && this.loadedCtdtId === ctdt.id && this.type_ctdt_muctieu_cuthe.length) return;
        this.cancelTabLoad$.next();
        this.cancelGoalsLoad$.next();
        this.loadedCtdtId = ctdt.id;
        this.drawerVisible = false;
        this.type_ctdt_muctieu_cuthe = [];
        this.list_tuongthich = [];
        this.list_muctieu_cuthe = [];
        this.list_ctdt_muctieu_cuthe = [];
        this.mucTieuChungDraft = ctdt.muctieu || '';
        this.state.set('loading');
        this.goalsState.set('success');

        const profile: ConditionOption = {
            condition: [{ conditionName: 'user_id', condition: OvicQueryCondition.equal, value: String(this.userId), orWhere: 'and' }],
            set: [{ label: 'limit', value: '1' }], page: null
        };
        const defaults: ConditionOption = {
            condition: [],
            set: [{ label: 'limit', value: '-1' }, { label: 'include', value: 'KHUNG_TRINH_DO,TUONGTHICH_PEOs' },
                { label: 'include_by', value: 'config_key' }], page: null
        };
        const programmeConfig: ConditionOption = {
            condition: [{ conditionName: 'ctdt_id', condition: OvicQueryCondition.equal, value: String(ctdt.id) }],
            set: [{ label: 'limit', value: '-1' }, { label: 'include', value: 'KHUNG_TRINH_DO,TUONGTHICH_PEOs' },
                { label: 'include_by', value: 'group' }, { label: 'orderby', value: 'ordering' }, { label: 'order', value: 'ASC' }],
            page: null
        };

        forkJoin([
            this.elngUserProfileService.getUserProfileByPageNewV2(profile),
            this.configsService.getConfigsByPageNew(defaults),
            this.ctdtConfigService.getCtdtConfigByPageNew(programmeConfig)
        ]).pipe(
            takeUntil(this.cancelTabLoad$),
            takeUntil(this.destroy$),
            finalize(() => {
                if (this.state() === 'loading') this.state.set('success');
            })
        ).subscribe({
            next: ([user, config, ctdtConfig]) => {
                if (!this.isManager && user.data?.[0]) {
                    this.donvi_chuyenmon_id = user.data[0].donvi_chuyenmon_id;
                    if (this.donvi_chuyenmon_id !== ctdt.category_id) {
                        this.router.navigate(['/admin/content-none']);
                        return;
                    }
                }
                const resolveConfig = (group: string): CtdtConfig[] => {
                    const custom = (ctdtConfig.data || []).filter(item => item.group === group);
                    const fallback = (config.data || []).find(item => item.config_key === group)?.params;
                    return custom.length ? custom : Array.isArray(fallback) ? fallback as CtdtConfig[] : [];
                };
                this.type_ctdt_muctieu_cuthe = resolveConfig('KHUNG_TRINH_DO');
                this.list_tuongthich = resolveConfig('TUONGTHICH_PEOs');
                this.goalsState.set('loading');
                this.loadMuctieuCuthe();
            },
            error: () => {
                this.loadedCtdtId = null;
                this.state.set('error');
            }
        });
    }

    loadMuctieuCuthe(): void {
        if (!this.selectedCtdt) {
            this.goalsState.set('success');
            return;
        }
        this.cancelGoalsLoad$.next();
        this.goalsState.set('loading');
        const condition: ConditionOption = {
            condition: [{ conditionName: 'ctdt_id', condition: OvicQueryCondition.equal, value: String(this.selectedCtdt.id) }],
            set: [{ label: 'limit', value: '-1' }, { label: 'orderby', value: 'ordering' }, { label: 'order', value: 'ASC' }],
            page: null
        };
        this.ctdtMuctieuCutheService.getCtdtMuctieuCutheByPageNew(condition).pipe(
            takeUntil(this.cancelGoalsLoad$), takeUntil(this.destroy$), finalize(() => {
                if (this.goalsState() === 'loading') this.goalsState.set('success');
            })
        ).subscribe({
            next: response => {
                this.goalsState.set('success');
                this.list_muctieu_cuthe = response.data || [];
                this.list_ctdt_muctieu_cuthe = this.type_ctdt_muctieu_cuthe.map(group => ({
                    key: group.key,
                    title: group.title,
                    children: this.list_muctieu_cuthe.filter(goal => goal.type === group.key)
                }));
                const ungrouped = this.list_muctieu_cuthe.filter(goal => !this.type_ctdt_muctieu_cuthe.some(group => group.key === goal.type));
                if (ungrouped.length) {
                    this.list_ctdt_muctieu_cuthe.push({ key: '__ungrouped__', title: 'Chưa phân nhóm', children: ungrouped });
                }
                this.resetForm();
            },
            error: () => this.goalsState.set('error')
        });
    }

    onMucTieuChungChange(text: string): void { this.mucTieuChungDraft = text; }

    saveCurrentMucTieuChung(): void {
        if (!this.selectedCtdt || this.busy) return;
        const content = this.mucTieuChungDraft;
        this.savingGeneral = true;
        this.ctdtService.updateCtdt(this.selectedCtdt.id, { muctieu: content }).pipe(
            takeUntil(this.destroy$), finalize(() => this.savingGeneral = false)
        ).subscribe({
            next: () => {
                this.selectedCtdt.muctieu = content;
                this.notificationService.toastSuccess('Lưu mục tiêu chung thành công');
            },
            error: () => this.notificationService.toastError('Lưu mục tiêu chung thất bại. Nội dung đang soạn được giữ lại.')
        });
    }

    closeForm(): void { if (!this.savingGoal) this.drawerVisible = false; }

    resetForm(): void {
        if (!this.selectedCtdt) return;
        const ordering = this.list_muctieu_cuthe.reduce((max, goal) => Math.max(max, Number(goal.ordering) || 0), 0) + 1;
        this.formMuctieuCuthe.reset({ ctdt_id: this.selectedCtdt.id, kyhieu: '', ordering, noidung: '', type: '', tuongthich: [] });
        this.isUpdated = false;
        this.selectedMuctieuCuthe = null;
    }

    openAddMuctieu(): void {
        if (!this.selectedCtdt || this.busy || this.goalsState() === 'error') return;
        this.resetForm();
        this.formTitle = 'Thêm mục tiêu cụ thể';
        this.drawerVisible = true;
    }

    saveMucTieuCuthe(): void {
        if (!this.selectedCtdt || this.savingGoal || this.deletingGoalId !== null) return;
        this.formMuctieuCuthe.markAllAsTouched();
        if (this.formMuctieuCuthe.invalid) return;
        const data = { ...this.formMuctieuCuthe.getRawValue() };
        data.kyhieu = `${this.kyhieuMutieuCuthe} ${data.ordering}`;
        data.tuongthich = Array.isArray(data.tuongthich) ? data.tuongthich : [];
        const editing = this.isUpdated;
        const selectedId = this.selectedMuctieuCuthe?.id;
        const condition: ConditionOption = {
            condition: [
                { conditionName: 'kyhieu', condition: OvicQueryCondition.equal, value: data.kyhieu, orWhere: 'and' },
                { conditionName: 'ctdt_id', condition: OvicQueryCondition.equal, value: String(this.selectedCtdt.id), orWhere: 'and' }
            ],
            set: [{ label: 'limit', value: '1' }], page: null
        };
        if (editing) condition.condition.push({ conditionName: 'id', condition: OvicQueryCondition.notEqual, value: String(selectedId), orWhere: 'and' });
        this.savingGoal = true;
        this.ctdtMuctieuCutheService.getCtdtMuctieuCutheByPageNew(condition).pipe(
            switchMap(result => {
                if (Number(result.recordsFiltered) !== 0) {
                    this.notificationService.toastWarning('Ký hiệu đã tồn tại, vui lòng nhập lại');
                    return of(false);
                }
                return (editing ? this.ctdtMuctieuCutheService.updateCtdtMuctieuCuthe(selectedId, data)
                    : this.ctdtMuctieuCutheService.addCtdtMuctieuCuthe(data)).pipe(map(() => true));
            }),
            takeUntil(this.destroy$),
            finalize(() => this.savingGoal = false)
        ).subscribe({
            next: saved => {
                if (!saved) return;
                this.notificationService.toastSuccess(editing ? 'Sửa mục tiêu thành công' : 'Thêm mục tiêu thành công');
                if (editing) this.drawerVisible = false;
                this.loadMuctieuCuthe();
            },
            error: () => this.notificationService.toastError('Không thể lưu mục tiêu. Dữ liệu nhập được giữ lại, vui lòng thử lại.')
        });
    }

    editMucTieuchuThe(goal: CtdtMuctieuCuthe): void {
        if (!this.selectedCtdt || this.busy) return;
        this.resetForm();
        this.isUpdated = true;
        this.formTitle = 'Sửa mục tiêu';
        this.selectedMuctieuCuthe = goal;
        this.formMuctieuCuthe.patchValue({
            ordering: goal.ordering,
            noidung: goal.noidung,
            type: goal.type,
            tuongthich: Array.isArray(goal.tuongthich) ? [...goal.tuongthich] : []
        });
        this.drawerVisible = true;
    }

    deleteMuctieu(goal: CtdtMuctieuCuthe): void {
        if (!this.selectedCtdt || this.busy) return;
        const programmeId = this.selectedCtdt.id;
        this.notificationService.confirmDelete().then(confirmed => {
            if (!confirmed || this.destroyed || this.busy || this.selectedCtdt?.id !== programmeId) return;
            this.deletingGoalId = goal.id;
            this.ctdtMuctieuCutheService.deleteCtdtMuctieuCuthe(goal.id).pipe(
                takeUntil(this.destroy$), finalize(() => this.deletingGoalId = null)
            ).subscribe({
                next: () => {
                    this.notificationService.toastSuccess('Xóa mục tiêu thành công');
                    this.loadMuctieuCuthe();
                },
                error: () => this.notificationService.toastError('Xóa mục tiêu thất bại')
            });
        }, () => { /* Dismissed confirmation. */ });
    }

    checkTuongthich(key: string, goal: CtdtMuctieuCuthe): boolean {
        return Array.isArray(goal.tuongthich) && goal.tuongthich.includes(key);
    }

    compatibilityTitle(key: string): string {
        return this.list_tuongthich.find(item => item.key === key)?.title || key;
    }

    pointQuestionKeyDown(event: KeyboardEvent): void {
        if (event.ctrlKey || event.metaKey || /^[0-9]$/.test(event.key)
            || ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
    }
}
