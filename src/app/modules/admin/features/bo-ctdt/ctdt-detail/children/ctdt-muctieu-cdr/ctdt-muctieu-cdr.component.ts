import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, WritableSignal, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, Subject, concatMap, finalize, forkJoin, from, map, of, switchMap, takeUntil, toArray } from 'rxjs';
import { Drawer } from 'primeng/drawer';
import { Select } from 'primeng/select';
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

export interface typeMuctieuCuthe {
    key: string;
    title: string;
    children: CtdtMuctieuCuthe[];
}

@Component({
    selector: 'app-ctdt-muctieu-cdr',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, Drawer, Select, MultiSelectModule, InputTextModule,
        OvicEditorComponent, SafeHtmlDecodePipe, MatButtonModule, TooltipModule, LoadingProgressComponent],
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
    private emptyKhungTrinhDoMarker: CtdtConfig | null = null;
    private readonly destroy$ = new Subject<void>();
    private readonly cancelTabLoad$ = new Subject<void>();
    private readonly cancelGoalsLoad$ = new Subject<void>();
    private destroyed = false;
    private loadedCtdtId: number | null = null;

    @Input() selectedCtdt: Ctdt | null = null;

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
    isUpdated = false;
    groupDrawerVisible = false;
    savingConfig = false;
    selectedKhungTrinhDo: CtdtConfig | null = null;
    groupFormTitle = '';
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
        return this.state() === 'loading' || this.goalsState() === 'loading' || this.savingGeneral
            || this.savingGoal || this.savingConfig || this.deletingGoalId !== null;
    }

    get generalEditorInitialValue(): string {
        return this.selectedCtdt?.muctieu || '';
    }

    ngOnInit(): void {
        if (this.selectedCtdt?.id) this.loadTabData(this.selectedCtdt);
    }

    ngOnChanges(changes: SimpleChanges): void {
        const ctdt = changes['selectedCtdt']?.currentValue as Ctdt | null;
        if (ctdt?.id && ctdt.id !== this.loadedCtdtId) this.loadTabData(ctdt);
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
        this.loadedCtdtId = ctdt.id;
        this.drawerVisible = false;
        this.groupDrawerVisible = false;
        this.type_ctdt_muctieu_cuthe = [];
        this.emptyKhungTrinhDoMarker = null;
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
            set: [{ label: 'limit', value: '-1' }, { label: 'include', value: 'KHUNG_TRINH_DO,TUONGTHICH_PEOs,KHUNG_TRINH_DO_EMPTY' },
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
                const resolveConfig = (group: string): CtdtConfig[] => {
                    const custom = (ctdtConfig.data || []).filter(item => item.group === group);
                    const fallback = (config.data || []).find(item => item.config_key === group)?.params;
                    if (custom.length) return custom;
                    if (group === 'KHUNG_TRINH_DO' && this.emptyKhungTrinhDoMarker) return [];
                    return Array.isArray(fallback)
                        ? fallback.map((item: CtdtConfig, index: number) => ({
                            ...item,
                            ctdt_id: ctdt.id,
                            group,
                            ordering: item.ordering ?? index + 1
                        })) : [];
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
                this.rebuildGoalGroups();
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
        return from(requestFactories).pipe(concatMap(createRequest => createRequest()), toArray());
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
            request.pipe(takeUntil(this.cancelTabLoad$), takeUntil(this.destroy$), finalize(() => this.savingConfig = false)).subscribe({
                next: () => {
                    if (this.selectedCtdt?.id !== programmeId) return;
                    this.refreshKhungTrinhDo('Xóa khung trình độ thành công');
                },
                error: () => this.notificationService.toastError('Xóa khung trình độ thất bại')
            });
        });
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
                    }
                    this.notificationService.toastSuccess('Xóa mục tiêu thành công');
                },
                error: () => this.notificationService.toastError('Xóa mục tiêu thất bại')
            });
            deleteController.run();
        });
    }

    checkTuongthich(key: string, goal: CtdtMuctieuCuthe): boolean {
        return Array.isArray(goal.tuongthich) && goal.tuongthich.includes(key);
    }

    compatibilityTitle(key: string): string {
        return this.list_tuongthich.find(item => item.key === key)?.title || key;
    }

    compatibilityColorIndex(key: string): number {
        const index = this.list_tuongthich.findIndex(item => item.key === key);
        if (index >= 0) return index % 8;
        return [...key].reduce((hash, char) => hash + char.charCodeAt(0), 0) % 8;
    }

    compatibilityTooltip(key: string): string {
        const item = this.list_tuongthich.find(config => config.key === key);
        const content = item?.noidung ? this.helperService.decodeHTML(item.noidung) : '';
        return content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || this.compatibilityTitle(key);
    }

    getCompatibilityLinkCount(): number {
        return this.list_muctieu_cuthe.reduce((count, goal) =>
            count + (Array.isArray(goal.tuongthich) ? goal.tuongthich.length : 0), 0);
    }

    pointQuestionKeyDown(event: KeyboardEvent): void {
        if (event.ctrlKey || event.metaKey || /^[0-9]$/.test(event.key)
            || ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
    }
}
