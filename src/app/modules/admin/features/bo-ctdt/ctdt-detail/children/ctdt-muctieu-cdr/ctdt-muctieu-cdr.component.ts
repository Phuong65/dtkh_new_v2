import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, WritableSignal, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, Subject, concatMap, defer, finalize, forkJoin, from, map, of, switchMap, takeUntil, tap, throwError, toArray } from 'rxjs';
import { Drawer } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { MatButtonModule } from '@angular/material/button';
import { TooltipModule } from 'primeng/tooltip';
import { HelperService } from '@core/services/helper.service';
import { LoadingProgressComponent } from '@core-new/components/loading-progress/loading-progress.component';
import { AppState } from '@core-new/models/app-state';
import { IctuDeletingAnimationControl } from '@core-new/models/ictu-deleting-animation-control';
import { OvicQueryCondition } from '@core/models/dto';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core-new/service/notification.service';
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
import { CtdtCdrComponent, CtdtCdrSummary } from '../ctdt-cdr/ctdt-cdr.component';
import { CtdtHosoPhatTrienComponent } from '../ctdt-hoso-phattrien/ctdt-hoso-phattrien.component';

export interface typeMuctieuCuthe {
    key: string;
    title: string;
    children: CtdtMuctieuCuthe[];
}

type CtdtSettingsTabId = 'hoso-phattrien' | 'muc-tieu-chung' | 'dinh-huong' | 'muc-tieu-cu-the' | 'chuan-dau-ra';

interface CtdtSettingsTabItem {
    id: CtdtSettingsTabId;
    label: string;
    icon: string;
}

interface OrientationMutation {
    kind: 'save' | 'delete';
    programmeId: number;
    session: number;
    key: string;
    editing: boolean;
    defaults: CtdtConfig[];
    payload?: CtdtConfig;
    attemptedCreate: boolean;
    writesComplete: boolean;
}

@Component({
    selector: 'app-ctdt-muctieu-cdr',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, Drawer, MultiSelectModule, InputTextModule,
        OvicEditorComponent, SafeHtmlDecodePipe, MatButtonModule, TooltipModule, LoadingProgressComponent, CtdtCdrComponent, CtdtHosoPhatTrienComponent],
    templateUrl: './ctdt-muctieu-cdr.component.html',
    styleUrls: ['./ctdt-muctieu-cdr.component.css']
})
export class CtdtMuctieuCdrComponent implements OnChanges, OnInit, OnDestroy {
    private readonly auth = inject(AuthService);
    private readonly notificationService = inject(NotificationService);
    private readonly router = inject(Router);
    private readonly ctdtService = inject(CtdtService);
    readonly formBuilder = inject(FormBuilder);
    private readonly elngUserProfileService = inject(ElngUserProfileService);
    private readonly ctdtMuctieuCutheService = inject(CtdtMuctieuCutheService);
    private readonly configsService = inject(ConfigsService);
    private readonly ctdtConfigService = inject(CtdtConfigService);
    private readonly helperService = inject(HelperService);
    private readonly emptyKhungTrinhDoGroup = 'KHUNG_TRINH_DO_EMPTY';
    private readonly emptyDinhHuongGroup = 'TUONGTHICH_PEOs_EMPTY';
    private emptyKhungTrinhDoMarker: CtdtConfig | null = null;
    private emptyDinhHuongMarker: CtdtConfig | null = null;
    private readonly destroy$ = new Subject<void>();
    private readonly cancelTabLoad$ = new Subject<void>();
    private readonly cancelGoalsLoad$ = new Subject<void>();
    private readonly cancelOrientation$ = new Subject<void>();
    readonly settingsTabs: readonly CtdtSettingsTabItem[] = [
        { id: 'hoso-phattrien', label: 'Hồ sơ phát triển', icon: 'ti ti-file-text' },
        { id: 'muc-tieu-chung', label: 'Mục tiêu chung', icon: 'ti ti-compass' },
        { id: 'dinh-huong', label: 'Định hướng', icon: 'ti ti-arrows-left-right' },
        { id: 'muc-tieu-cu-the', label: 'Mục tiêu cụ thể', icon: 'ti ti-target' },
        { id: 'chuan-dau-ra', label: 'Chuẩn đầu ra', icon: 'ti ti-certificate' }
    ];
    readonly activeSettingsTabId = signal<CtdtSettingsTabId>('muc-tieu-chung');

    peoRefreshKey = 0;
    cdrSummary: CtdtCdrSummary | null = null;
    private orientationSession = 0;
    private orientationSeed: CtdtConfig[] | null = null;
    private orientationSaveKey: string | null = null;
    private readonly attemptedOrientationKeys = new Set<string>();
    private orientationRefreshPending: { programmeId: number; session: number; message: string; closeDrawer: boolean } | null = null;
    private destroyed = false;
    private loadedCtdtId: number | null = null;

    @Input() selectedCtdt: Ctdt | null = null;
    @Output() ctdtUpdated = new EventEmitter<Ctdt>();

    isLanhDaoKhoa = this.auth.userHasRole(ROLES.lanhdaokhoa);
    isManager = [ROLES.manager, ROLES.admin, ROLES.troly_pdt, ROLES.chuyenvien_pdt, ROLES.daotao_new]
        .some(role => this.auth.userHasRole(role));
    formMuctieuCuthe: FormGroup = this.formBuilder.group({
        ctdt_id: ['', Validators.required],
        kyhieu: [''],
        ordering: ['', Validators.required],
        noidung: ['', Validators.required],
        type: ['', Validators.required],
        tuongthich: [[]]
    });
    formKhungTrinhDo: FormGroup = this.formBuilder.group({
        title: ['', Validators.required]
    });
    formDinhHuong: FormGroup = this.formBuilder.group({
        title: ['', Validators.required],
        noidung: ['']
    });
    isUpdated = false;
    groupDrawerVisible = false;
    orientationDrawerVisible = false;
    savingConfig = false;
    selectedKhungTrinhDo: CtdtConfig | null = null;
    selectedDinhHuong: CtdtConfig | null = null;
    selectedGoalTypeKey: string | null = null;
    isMatrixExpanded = false;
    groupFormTitle = '';
    orientationFormTitle = '';
    userId: number = this.auth.user?.id;
    donvi_chuyenmon_id: number;
    type_ctdt_muctieu_cuthe: CtdtConfig[] = [];
    list_tuongthich: CtdtConfig[] = [];
    private defaultDinhHuong: CtdtConfig[] = [];
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
        return this.state() === 'loading' || this.goalsState() === 'loading' || this.savingGeneral
            || this.savingGoal || this.savingConfig || this.deletingGoalId !== null;
    }

    get generalEditorInitialValue(): string {
        return this.selectedCtdt?.muctieu || '';
    }

    selectSettingsTab(tabId: CtdtSettingsTabId): void {
        this.activeSettingsTabId.set(tabId);
    }

    onSettingsTabKeydown(event: KeyboardEvent, index: number): void {
        let targetIndex: number;
        switch (event.key) {
            case 'ArrowRight':
                targetIndex = (index + 1) % this.settingsTabs.length;
                break;
            case 'ArrowLeft':
                targetIndex = (index - 1 + this.settingsTabs.length) % this.settingsTabs.length;
                break;
            case 'Home':
                targetIndex = 0;
                break;
            case 'End':
                targetIndex = this.settingsTabs.length - 1;
                break;
            default:
                return;
        }

        event.preventDefault();
        this.selectSettingsTab(this.settingsTabs[targetIndex].id);
        const buttons = (event.currentTarget as HTMLElement).parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
        buttons?.[targetIndex]?.focus();
    }

    ngOnInit(): void {
        if (this.selectedCtdt?.id) this.loadTabData(this.selectedCtdt);
    }

    ngOnChanges(changes: SimpleChanges): void {
        const change = changes['selectedCtdt'];
        const ctdt = change?.currentValue as Ctdt | null;
        if (ctdt?.id && ctdt.id !== change.previousValue?.id) {
            this.activeSettingsTabId.set('muc-tieu-chung');
        }
        if (ctdt?.id && ctdt.id !== this.loadedCtdtId) this.loadTabData(ctdt);
    }

    ngOnDestroy(): void {
        this.destroyed = true;
        this.cancelTabLoad$.next();
        this.cancelTabLoad$.complete();
        this.cancelGoalsLoad$.next();
        this.cancelGoalsLoad$.complete();
        this.cancelOrientation$.next();
        this.cancelOrientation$.complete();
        this.destroy$.next();
        this.destroy$.complete();
    }

    reloadData(): void {
        if (this.selectedCtdt) this.loadTabData(this.selectedCtdt, true);
    }

    private rebuildGoalGroups(): void {
        this.list_ctdt_muctieu_cuthe = this.type_ctdt_muctieu_cuthe.map(group => ({
            key: group.key,
            title: group.title,
            children: this.list_muctieu_cuthe.filter(goal => goal.type === group.key)
        }));
        const ungrouped = this.list_muctieu_cuthe.filter(goal =>
            !this.type_ctdt_muctieu_cuthe.some(group => group.key === goal.type)
        );
        if (ungrouped.length) {
            this.list_ctdt_muctieu_cuthe.push({ key: '__ungrouped__', title: 'Chưa phân nhóm', children: ungrouped });
        }
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
        this.cancelOrientation$.next();
        this.orientationSession++;
        this.orientationSeed = null;
        this.orientationSaveKey = null;
        this.orientationRefreshPending = null;
        this.attemptedOrientationKeys.clear();
        this.loadedCtdtId = ctdt.id;
        this.isMatrixExpanded = false;
        this.drawerVisible = false;
        this.groupDrawerVisible = false;
        this.orientationDrawerVisible = false;
        this.type_ctdt_muctieu_cuthe = [];
        this.emptyKhungTrinhDoMarker = null;
        this.emptyDinhHuongMarker = null;
        this.list_tuongthich = [];
        this.defaultDinhHuong = [];
        this.list_muctieu_cuthe = [];
        this.list_ctdt_muctieu_cuthe = [];
        this.peoRefreshKey = 0;
        this.cdrSummary = null;
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
            set: [{ label: 'limit', value: '-1' }, { label: 'include', value: 'KHUNG_TRINH_DO,TUONGTHICH_PEOs,KHUNG_TRINH_DO_EMPTY,TUONGTHICH_PEOs_EMPTY' },
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
                this.emptyKhungTrinhDoMarker = (ctdtConfig.data || [])
                    .find(item => item.group === this.emptyKhungTrinhDoGroup) || null;
                this.emptyDinhHuongMarker = (ctdtConfig.data || [])
                    .find(item => item.group === this.emptyDinhHuongGroup) || null;
                const resolveConfig = (group: string): CtdtConfig[] => {
                    const custom = (ctdtConfig.data || []).filter(item => item.group === group);
                    const fallback = (config.data || []).find(item => item.config_key === group)?.params;
                    if (custom.length) return custom;
                    if (group === 'KHUNG_TRINH_DO' && this.emptyKhungTrinhDoMarker) return [];
                    if (group === 'TUONGTHICH_PEOs' && this.emptyDinhHuongMarker) return [];
                    return Array.isArray(fallback)
                        ? fallback.map((item: CtdtConfig, index: number) => ({
                            ...item,
                            ctdt_id: ctdt.id,
                            group,
                            ordering: item.ordering ?? index + 1
                        })) : [];
                };
                this.type_ctdt_muctieu_cuthe = resolveConfig('KHUNG_TRINH_DO');
                const defaultOrientationParams = (config.data || []).find(item => item.config_key === 'TUONGTHICH_PEOs')?.params;
                this.defaultDinhHuong = Array.isArray(defaultOrientationParams) ? defaultOrientationParams : [];
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
                this.rebuildGoalGroups();
                this.peoRefreshKey++;
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
        this.selectedGoalTypeKey = null;
    }

    openAddKhungTrinhDo(): void {
        if (!this.selectedCtdt || this.busy) return;
        this.formKhungTrinhDo.reset({ title: '' });
        this.selectedKhungTrinhDo = null;
        this.groupFormTitle = 'Thêm khung trình độ';
        this.groupDrawerVisible = true;
    }

    editKhungTrinhDo(group: typeMuctieuCuthe): void {
        const config = this.type_ctdt_muctieu_cuthe.find(item => item.key === group.key);
        if (!config || this.busy) return;
        this.selectedKhungTrinhDo = config;
        this.formKhungTrinhDo.reset({ title: config.title });
        this.groupFormTitle = 'Sửa khung trình độ';
        this.groupDrawerVisible = true;
    }

    closeKhungTrinhDo(): void {
        if (!this.savingConfig) this.groupDrawerVisible = false;
    }

    private isUsingDefaultKhungTrinhDo(): boolean {
        return !this.emptyKhungTrinhDoMarker && this.type_ctdt_muctieu_cuthe.length > 0
            && !this.type_ctdt_muctieu_cuthe.some(config => Boolean(config.id));
    }

    private buildKhungTrinhDoPayload(config: CtdtConfig, ordering: number, title = config.title): CtdtConfig {
        return {
            ctdt_id: this.selectedCtdt!.id,
            group: 'KHUNG_TRINH_DO',
            key: config.key || this.helperService.slugVietnamese(title),
            title,
            ordering,
            noidung: config.noidung || ''
        };
    }

    private getKhungTrinhDoConfig(): Observable<CtdtConfig[]> {
        if (!this.selectedCtdt) return of([]);
        return this.ctdtConfigService.getCtdtConfigByPageNew({
            condition: [{ conditionName: 'ctdt_id', condition: OvicQueryCondition.equal, value: String(this.selectedCtdt.id) }],
            set: [{ label: 'limit', value: '-1' }, { label: 'include', value: 'KHUNG_TRINH_DO,KHUNG_TRINH_DO_EMPTY' },
                { label: 'include_by', value: 'group' }, { label: 'orderby', value: 'ordering' }, { label: 'order', value: 'ASC' }],
            page: null
        }).pipe(map(response => response.data || []));
    }

    private refreshKhungTrinhDo(message: string): void {
        this.groupDrawerVisible = false;
        this.notificationService.toastSuccess(message);
        if (this.selectedCtdt) this.loadTabData(this.selectedCtdt, true);
    }

    private runConfigRequests(requestFactories: Array<() => Observable<unknown>>): Observable<unknown[]> {
        return from(requestFactories).pipe(concatMap(createRequest => defer(createRequest)), toArray());
    }

    private runConfigDeleteAnimation(
        animationId: number,
        createRequest: () => Observable<unknown>,
        onSuccess: () => void,
        errorMessage: string
    ): void {
        const deleteController = new IctuDeletingAnimationControl([animationId], {
            delete: () => defer(createRequest)
        });
        this.notificationService.startDeleting(deleteController.progress).pipe(
            takeUntil(this.cancelTabLoad$),
            takeUntil(this.destroy$),
            finalize(() => this.savingConfig = false)
        ).subscribe({
            next: deleted => {
                if (deleted) onSuccess();
                else this.notificationService.toastError(errorMessage);
            },
            error: () => this.notificationService.toastError(errorMessage)
        });
        deleteController.run();
    }

    private materializeDefaultKhungTrinhDo(saved: CtdtConfig[], override?: CtdtConfig): Observable<unknown[]> {
        const savedKeys = new Set(saved.filter(item => item.group === 'KHUNG_TRINH_DO').map(item => item.key));
        const requests = this.type_ctdt_muctieu_cuthe
            .filter(item => !savedKeys.has(item.key))
            .map((item, index) => () => this.ctdtConfigService.addCtdtConfig(this.buildKhungTrinhDoPayload(
                item,
                item.ordering ?? index + 1,
                override?.key === item.key ? override.title : item.title
            )));
        return requests.length ? this.runConfigRequests(requests) : of([]);
    }

    private addConfigMarkerIfNeeded(): Observable<unknown> {
        return this.emptyKhungTrinhDoMarker ? of(null) : this.ctdtConfigService.addCtdtConfig({
            ctdt_id: this.selectedCtdt!.id,
            group: this.emptyKhungTrinhDoGroup,
            key: this.emptyKhungTrinhDoGroup.toLocaleLowerCase(),
            title: 'Đã xóa toàn bộ khung trình độ',
            ordering: 1,
            noidung: ''
        });
    }

    private removeEmptyKhungMarker(): Observable<unknown> {
        return this.emptyKhungTrinhDoMarker?.id
            ? this.ctdtConfigService.deleteCtdtConfig(this.emptyKhungTrinhDoMarker.id)
            : of(null);
    }

    saveKhungTrinhDo(): void {
        if (!this.selectedCtdt || this.savingConfig) return;
        this.formKhungTrinhDo.markAllAsTouched();
        if (this.formKhungTrinhDo.invalid) return;
        const title = String(this.formKhungTrinhDo.value.title || '').trim();
        if (!title) return;
        const selected = this.selectedKhungTrinhDo;
        const editing = Boolean(selected);
        const duplicate = this.type_ctdt_muctieu_cuthe.some(item => item.key !== selected?.key
            && item.title.trim().toLocaleLowerCase() === title.toLocaleLowerCase());
        if (duplicate) {
            this.notificationService.toastWarning('Khung trình độ đã tồn tại');
            return;
        }
        this.savingConfig = true;
        const programmeId = this.selectedCtdt.id;
        const usingDefaults = this.isUsingDefaultKhungTrinhDo();
        const newConfig: CtdtConfig = {
            ctdt_id: this.selectedCtdt.id,
            group: 'KHUNG_TRINH_DO',
            key: this.helperService.slugVietnamese(title),
            title,
            ordering: this.type_ctdt_muctieu_cuthe.length + 1,
            noidung: ''
        };
        if (!editing && (!newConfig.key || this.type_ctdt_muctieu_cuthe.some(item => item.key === newConfig.key))) {
            this.savingConfig = false;
            this.notificationService.toastWarning('Ký hiệu khung trình độ đã tồn tại hoặc không hợp lệ');
            return;
        }
        const request = usingDefaults
            ? this.getKhungTrinhDoConfig().pipe(
                switchMap(saved => this.materializeDefaultKhungTrinhDo(saved,
                    editing ? { ...selected!, title } : undefined)),
                switchMap(() => editing ? of(null) : this.ctdtConfigService.addCtdtConfig(newConfig)))
            : editing
                ? this.ctdtConfigService.updateCtdtConfig(selected!.id!, this.buildKhungTrinhDoPayload(selected!, selected!.ordering || 1, title))
                : this.ctdtConfigService.addCtdtConfig(newConfig).pipe(
                    switchMap(saved => this.removeEmptyKhungMarker().pipe(map(() => saved))));
        request.pipe(takeUntil(this.cancelTabLoad$), takeUntil(this.destroy$), finalize(() => this.savingConfig = false)).subscribe({
            next: () => {
                if (this.selectedCtdt?.id !== programmeId) return;
                this.refreshKhungTrinhDo(editing ? 'Sửa khung trình độ thành công' : 'Thêm khung trình độ thành công');
            },
            error: () => {
                this.notificationService.toastError('Không thể lưu khung trình độ. Vui lòng thử lại.');
                if (this.selectedCtdt?.id === programmeId) this.loadTabData(this.selectedCtdt, true);
            }
        });
    }

    addPeoToGroup(group: typeMuctieuCuthe): void {
        if (!this.selectedCtdt || this.busy || group.key === '__ungrouped__') return;
        this.resetForm();
        this.selectedGoalTypeKey = group.key;
        this.formTitle = `Thêm PEO · ${group.title}`;
        this.formMuctieuCuthe.patchValue({ type: group.key });
        this.drawerVisible = true;
    }

    deleteKhungTrinhDo(group: typeMuctieuCuthe): void {
        if (!this.selectedCtdt || this.busy || group.key === '__ungrouped__') return;
        const config = this.type_ctdt_muctieu_cuthe.find(item => item.key === group.key);
        if (!config) return;
        if (group.children.length) {
            this.notificationService.toastWarning('Không thể xóa khung đang có PEO. Hãy xóa hoặc chuyển các PEO trước.');
            return;
        }
        this.notificationService.confirmDelete2({
            heading: 'Xác nhận xóa',
            htmlMessage: `Bạn có chắc muốn xóa khung trình độ "${group.title}"?`
        }).pipe(takeUntil(this.destroy$)).subscribe(confirmed => {
            if (!confirmed || !this.selectedCtdt || this.busy) return;
            const programmeId = this.selectedCtdt.id;
            const usingDefaults = this.isUsingDefaultKhungTrinhDo();
            const remaining = this.type_ctdt_muctieu_cuthe.filter(item => item.key !== config.key);
            this.savingConfig = true;
            const request = usingDefaults
                ? (remaining.length
                    ? this.runConfigRequests(remaining.map((item, index) =>
                        () => this.ctdtConfigService.addCtdtConfig(this.buildKhungTrinhDoPayload(item, index + 1))))
                    : this.addConfigMarkerIfNeeded())
                : (config.id
                    ? (remaining.length
                        ? this.ctdtConfigService.deleteCtdtConfig(config.id)
                        : this.ctdtConfigService.deleteCtdtConfig(config.id).pipe(switchMap(() => this.addConfigMarkerIfNeeded())))
                    : this.addConfigMarkerIfNeeded());
            this.runConfigDeleteAnimation(
                config.id || -Math.abs(group.key.split('').reduce((sum, char) => sum + char.charCodeAt(0), 1)),
                () => request,
                () => {
                    if (this.selectedCtdt?.id !== programmeId) return;
                    this.refreshKhungTrinhDo('Xóa khung trình độ thành công');
                },
                'Xóa khung trình độ thất bại'
            );
        });
    }

    saveMucTieuCuthe(): void {
        if (!this.selectedCtdt || this.savingGoal || this.deletingGoalId !== null) return;
        this.formMuctieuCuthe.markAllAsTouched();
        if (this.formMuctieuCuthe.invalid) return;
        const data = { ...this.formMuctieuCuthe.getRawValue() };
        if (!this.isUpdated && this.selectedGoalTypeKey) data.type = this.selectedGoalTypeKey;
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
                this.drawerVisible = false;
                this.loadMuctieuCuthe();
            },
            error: () => this.notificationService.toastError('Không thể lưu mục tiêu. Dữ liệu nhập được giữ lại, vui lòng thử lại.')
        });
    }

    editMucTieuchuThe(goal: CtdtMuctieuCuthe): void {
        if (!this.selectedCtdt || this.busy) return;
        this.resetForm();
        this.isUpdated = true;
        this.selectedGoalTypeKey = goal.type;
        const group = this.type_ctdt_muctieu_cuthe.find(item => item.key === goal.type);
        this.formTitle = group ? `Sửa PEO · ${group.title}` : 'Sửa PEO · Chưa phân nhóm';
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
        if (!this.selectedCtdt || this.busy || !goal?.id) return;
        const programmeId = this.selectedCtdt.id;
        const safeTitle = (goal.kyhieu || `PEO ${goal.ordering}`).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        this.notificationService.confirmDelete2({
            heading: 'Xác nhận xóa',
            htmlMessage: `Bạn có chắc muốn xóa mục tiêu cụ thể "${safeTitle}"?`
        }).pipe(takeUntil(this.destroy$)).subscribe(confirmed => {
            if (!confirmed || this.destroyed || this.busy || this.selectedCtdt?.id !== programmeId) return;
            this.deletingGoalId = goal.id;
            const deleteController = new IctuDeletingAnimationControl([goal.id], {
                delete: id => this.ctdtMuctieuCutheService.deleteCtdtMuctieuCuthe(id)
            });
            this.notificationService.startDeleting(deleteController.progress).pipe(
                takeUntil(this.destroy$), finalize(() => this.deletingGoalId = null)
            ).subscribe({
                next: deleted => {
                    if (!deleted) {
                        this.notificationService.toastError('Xóa mục tiêu thất bại');
                        return;
                    }
                    if (this.selectedCtdt?.id === programmeId) {
                        this.list_muctieu_cuthe = this.list_muctieu_cuthe.filter(item => item.id !== goal.id);
                        this.rebuildGoalGroups();
                        if (this.selectedMuctieuCuthe?.id === goal.id) {
                            this.drawerVisible = false;
                            this.resetForm();
                        }
                        this.peoRefreshKey++;
                    }
                    this.notificationService.toastSuccess('Xóa mục tiêu thành công');
                },
                error: () => this.notificationService.toastError('Xóa mục tiêu thất bại')
            });
            deleteController.run();
        });
    }

    openAddDinhHuong(): void {
        if (!this.selectedCtdt || this.busy || this.orientationRefreshPending) return;
        this.orientationSeed = null;
        this.orientationSaveKey = null;
        this.attemptedOrientationKeys.clear();
        this.formDinhHuong.reset({ title: '', noidung: '' });
        this.selectedDinhHuong = null;
        this.orientationFormTitle = 'Thêm định hướng';
        this.orientationDrawerVisible = true;
    }

    editDinhHuong(orientation: CtdtConfig): void {
        if (!this.selectedCtdt || this.busy || this.orientationRefreshPending) return;
        this.orientationSeed = null;
        this.orientationSaveKey = orientation.key;
        this.attemptedOrientationKeys.clear();
        this.selectedDinhHuong = orientation;
        this.formDinhHuong.reset({ title: orientation.title, noidung: orientation.noidung || '' });
        this.orientationFormTitle = 'Sửa định hướng';
        this.orientationDrawerVisible = true;
    }

    closeDinhHuong(): void {
        if (!this.savingConfig) {
            this.orientationDrawerVisible = false;
            this.orientationSeed = null;
            this.orientationSaveKey = null;
            this.attemptedOrientationKeys.clear();
        }
    }

    private getDinhHuongConfig(programmeId = this.selectedCtdt?.id): Observable<CtdtConfig[]> {
        if (!programmeId) return of([]);
        return this.ctdtConfigService.getCtdtConfigByPageNew({
            condition: [{ conditionName: 'ctdt_id', condition: OvicQueryCondition.equal, value: String(programmeId) }],
            set: [{ label: 'limit', value: '-1' }, { label: 'include', value: 'TUONGTHICH_PEOs,TUONGTHICH_PEOs_EMPTY' },
                { label: 'include_by', value: 'group' }, { label: 'orderby', value: 'ordering' }, { label: 'order', value: 'ASC' }],
            page: null
        }).pipe(map(response => response.data || []));
    }

    private buildDinhHuongPayload(config: CtdtConfig, ordering: number, title = config.title, noidung = config.noidung || ''): CtdtConfig {
        return {
            ctdt_id: this.selectedCtdt!.id,
            group: 'TUONGTHICH_PEOs',
            key: config.key || this.helperService.slugVietnamese(title),
            title,
            ordering,
            noidung
        };
    }

    private materializeDefaultDinhHuong(saved: CtdtConfig[], override?: CtdtConfig): Observable<unknown[]> {
        const savedKeys = new Set(saved.filter(item => item.group === 'TUONGTHICH_PEOs').map(item => item.key));
        const seed = this.orientationSeed || this.defaultDinhHuong;
        const requests = seed
            .filter(item => !savedKeys.has(item.key))
            .map((item, index) => () => this.ctdtConfigService.addCtdtConfig(this.buildDinhHuongPayload(
                item,
                item.ordering ?? index + 1,
                override?.key === item.key ? override.title : item.title,
                override?.key === item.key ? override.noidung || '' : item.noidung || ''
            )));
        return requests.length ? this.runConfigRequests(requests) : of([]);
    }

    private addDinhHuongMarkerIfNeeded(): Observable<unknown> {
        return this.emptyDinhHuongMarker ? of(null) : this.ctdtConfigService.addCtdtConfig({
            ctdt_id: this.selectedCtdt!.id,
            group: this.emptyDinhHuongGroup,
            key: this.emptyDinhHuongGroup.toLocaleLowerCase(),
            title: 'Đã xóa toàn bộ định hướng',
            ordering: 1,
            noidung: ''
        });
    }

    private removeEmptyDinhHuongMarker(programmeId: number): Observable<unknown> {
        return this.getDinhHuongConfig(programmeId).pipe(switchMap(rows => {
            const marker = rows.find(item => item.group === this.emptyDinhHuongGroup);
            return marker?.id ? this.ctdtConfigService.deleteCtdtConfig(marker.id) : of(null);
        }));
    }

    private applyDinhHuongRows(rows: CtdtConfig[], programmeId: number): void {
        this.emptyDinhHuongMarker = rows.find(item => item.group === this.emptyDinhHuongGroup) || null;
        const custom = rows.filter(item => item.group === 'TUONGTHICH_PEOs');
        this.list_tuongthich = custom.length ? custom : this.emptyDinhHuongMarker ? []
            : this.defaultDinhHuong.map((item, index) => ({ ...item, ctdt_id: programmeId,
                group: 'TUONGTHICH_PEOs', ordering: item.ordering ?? index + 1 }));
    }

    private refreshDinhHuong(message: string, programmeId: number, closeDrawer = true): void {
        const session = this.orientationSession;
        this.orientationRefreshPending = { programmeId, session, message, closeDrawer };
        this.getDinhHuongConfig(programmeId).pipe(takeUntil(this.cancelOrientation$), takeUntil(this.destroy$)).subscribe({
            next: rows => {
                if (this.selectedCtdt?.id !== programmeId || session !== this.orientationSession) return;
                this.applyDinhHuongRows(rows, programmeId);
                this.orientationRefreshPending = null;
                if (closeDrawer) this.orientationDrawerVisible = false;
                if (message) this.notificationService.toastSuccess(message);
            },
            error: () => this.notificationService.toastError('Đã lưu nhưng không thể tải lại danh sách định hướng')
        });
    }

    retryDinhHuongRefresh(): void {
        const pending = this.orientationRefreshPending;
        if (!pending || pending.session !== this.orientationSession || this.selectedCtdt?.id !== pending.programmeId) return;
        this.refreshDinhHuong(pending.message, pending.programmeId, pending.closeDrawer);
    }

    saveDinhHuong(): void {
        if (!this.selectedCtdt || this.savingConfig) return;
        this.formDinhHuong.markAllAsTouched();
        if (this.formDinhHuong.invalid) return;
        const title = String(this.formDinhHuong.value.title || '').trim();
        const noidung = String(this.formDinhHuong.value.noidung || '');
        if (!title) return;
        const programmeId = this.selectedCtdt.id;
        const session = this.orientationSession;
        const selected = this.selectedDinhHuong;
        const editing = Boolean(selected);
        if (!this.orientationSeed) this.orientationSeed = this.list_tuongthich.map(item => ({ ...item }));
        if (!this.orientationSaveKey) {
            this.orientationSaveKey = editing ? selected!.key : this.helperService.slugVietnamese(title);
        }
        const key = this.orientationSaveKey;
        if (!key || this.list_tuongthich.some(item => item.key !== selected?.key
            && (item.key === key || item.title.trim().toLocaleLowerCase() === title.toLocaleLowerCase()))) {
            this.notificationService.toastWarning('Định hướng đã tồn tại hoặc không hợp lệ');
            return;
        }
        const payload: CtdtConfig = {
            ctdt_id: programmeId,
            group: 'TUONGTHICH_PEOs',
            key,
            title,
            noidung,
            ordering: editing ? selected!.ordering || 1 : this.list_tuongthich.length + 1
        };
        this.savingConfig = true;
        this.getDinhHuongConfig().pipe(
            switchMap(saved => {
                const real = saved.filter(item => item.group === 'TUONGTHICH_PEOs');
                const persistedSelected = real.find(item => item.key === selected?.key);
                if (editing && persistedSelected?.id) {
                    return this.ctdtConfigService.updateCtdtConfig(persistedSelected.id,
                        this.buildDinhHuongPayload(persistedSelected, persistedSelected.ordering || 1, title, noidung));
                }
                return this.materializeDefaultDinhHuong(saved, editing ? payload : undefined).pipe(
                    switchMap(() => editing ? of(null) : this.ctdtConfigService.addCtdtConfig(payload)));
            }),
            switchMap(saved => this.removeEmptyDinhHuongMarker(programmeId).pipe(map(() => saved))),
            takeUntil(this.cancelTabLoad$), takeUntil(this.destroy$), finalize(() => this.savingConfig = false)
        ).subscribe({
            next: () => this.refreshDinhHuong(editing ? 'Sửa định hướng thành công' : 'Thêm định hướng thành công', programmeId),
            error: () => {
                this.notificationService.toastError('Không thể lưu định hướng. Vui lòng thử lại.');
                if (this.selectedCtdt?.id === programmeId) this.getDinhHuongConfig().pipe(
                    takeUntil(this.cancelTabLoad$), takeUntil(this.destroy$)
                ).subscribe({
                    next: rows => {
                        const persisted = rows.find(item => item.group === 'TUONGTHICH_PEOs' && item.key === key);
                        if (persisted?.id && this.selectedCtdt?.id === programmeId) {
                            this.selectedDinhHuong = persisted;
                            this.notificationService.toastInfo('Định hướng đã được lưu. Kiểm tra lại dữ liệu trước khi thử tiếp.');
                        }
                    },
                    error: () => this.notificationService.toastError('Không thể kiểm tra trạng thái lưu định hướng')
                });
            }
        });
    }

    deleteDinhHuong(orientation: CtdtConfig): void {
        if (!this.selectedCtdt || this.busy) return;
        const linkedCount = this.list_muctieu_cuthe.filter(goal =>
            Array.isArray(goal.tuongthich) && goal.tuongthich.includes(orientation.key)).length;
        if (linkedCount) {
            this.notificationService.toastWarning(`Không thể xóa: định hướng đang liên kết với ${linkedCount} PEO.`);
            return;
        }
        const safeTitle = (orientation.title || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        this.notificationService.confirmDelete2({
            heading: 'Xác nhận xóa',
            htmlMessage: `Bạn có chắc muốn xóa định hướng "${safeTitle}"?`
        }).pipe(takeUntil(this.destroy$)).subscribe(confirmed => {
            if (!confirmed || !this.selectedCtdt || this.busy) return;
            const programmeId = this.selectedCtdt.id;
            const animationId = orientation.id || -Math.abs(orientation.key.split('').reduce((sum, char) => sum + char.charCodeAt(0), 1));
            this.savingConfig = true;
            this.runConfigDeleteAnimation(
                animationId,
                () => forkJoin([this.getDinhHuongConfig(programmeId), this.ctdtMuctieuCutheService.getCtdtMuctieuCutheByPageNew({
                    condition: [{ conditionName: 'ctdt_id', condition: OvicQueryCondition.equal, value: String(programmeId) }],
                    set: [{ label: 'limit', value: '-1' }], page: null
                })]).pipe(
                    switchMap(([saved, goals]) => {
                        if ((goals.data || []).some(goal => Array.isArray(goal.tuongthich)
                            && goal.tuongthich.includes(orientation.key))) {
                            this.notificationService.toastWarning('Định hướng vừa được liên kết với PEO, không thể xóa.');
                            return throwError(() => new Error('Định hướng đang được PEO sử dụng'));
                        }
                        const real = saved.filter(item => item.group === 'TUONGTHICH_PEOs');
                        const target = real.find(item => item.key === orientation.key);
                        const remaining = this.list_tuongthich.filter(item => item.key !== orientation.key);
                        if (!real.length) {
                            return remaining.length ? this.runConfigRequests(remaining.map((item, index) =>
                                () => this.ctdtConfigService.addCtdtConfig(this.buildDinhHuongPayload(item, index + 1))))
                                : this.addDinhHuongMarkerIfNeeded();
                        }
                        if (!target?.id) return throwError(() => new Error('Không tìm thấy định hướng cần xóa'));
                        return real.length === 1
                            ? this.addDinhHuongMarkerIfNeeded().pipe(switchMap(() => this.ctdtConfigService.deleteCtdtConfig(target.id)))
                            : this.ctdtConfigService.deleteCtdtConfig(target.id);
                    })
                ),
                () => {
                    if (this.selectedCtdt?.id !== programmeId) return;
                    this.refreshDinhHuong('Xóa định hướng thành công', programmeId);
                },
                'Xóa định hướng thất bại'
            );
        });
    }

    checkTuongthich(key: string, goal: CtdtMuctieuCuthe): boolean {
        return Array.isArray(goal.tuongthich) && goal.tuongthich.includes(key);
    }

    compatibilityTitle(key: string): string {
        return this.list_tuongthich.find(item => item.key === key)?.title || key;
    }

    compatibilityTooltip(key: string): string {
        const item = this.list_tuongthich.find(config => config.key === key);
        const content = item?.noidung ? this.helperService.decodeHTML(item.noidung) : '';
        return content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || this.compatibilityTitle(key);
    }

    onProfileUpdated(updated: Ctdt): void {
        if (!updated || !this.selectedCtdt || updated.id !== this.selectedCtdt.id) return;
        this.selectedCtdt = { ...this.selectedCtdt, ...updated };
        this.ctdtUpdated.emit(this.selectedCtdt);
    }

    onCdrSummaryChange(summary: CtdtCdrSummary): void {
        if (summary.programmeId === this.selectedCtdt?.id) this.cdrSummary = summary;
    }

    hasGeneralContent(): boolean {
        const text = this.helperService.decodeHTML(this.selectedCtdt?.muctieu || '')
            .replace(/<[^>]*>/g, ' ').replace(/[ ​-‍﻿]/g, ' ').trim();
        return text.length > 0;
    }

    private linkedOrientationKeys(goal: CtdtMuctieuCuthe): string[] {
        const validKeys = new Set(this.list_tuongthich.map(item => item.key));
        return [...new Set(Array.isArray(goal.tuongthich) ? goal.tuongthich : [])]
            .filter(key => validKeys.has(key));
    }

    getCompatibilityLinkCount(): number {
        return this.list_muctieu_cuthe.reduce((count, goal) =>
            count + this.linkedOrientationKeys(goal).length, 0);
    }

    getLinkedPeoCount(): number {
        return this.list_muctieu_cuthe.filter(goal => this.linkedOrientationKeys(goal).length > 0).length;
    }

    getUsedOrientationCount(): number {
        return new Set(this.list_muctieu_cuthe.flatMap(goal => this.linkedOrientationKeys(goal))).size;
    }

    pointQuestionKeyDown(event: KeyboardEvent): void {
        if (event.ctrlKey || event.metaKey || /^[0-9]$/.test(event.key)
            || ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
    }
}
