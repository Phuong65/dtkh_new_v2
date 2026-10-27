import { CtdtCdrService } from '@modules/shared/services/ctdt-cdr.service';
import { BoCtdtCdr } from '@modules/shared/models/bo-ctdt-cdr';
import { BoCtdtCdrService } from '@modules/shared/services/ctdt-bo-cdr.service';
import { HelperService } from '@core/services/helper.service';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, WritableSignal, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SafeHtmlDecodePipe } from '@modules/shared/pipes/safe-html-decode';
import { OvicEditorComponent } from '@modules/shared/components/ovic-editor/ovic-editor.component';
import { LoadingProgressComponent } from '@core-new/components/loading-progress/loading-progress.component';
import { AppState } from '@core-new/models/app-state';
import { DividerModule } from 'primeng/divider';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { Router, ActivatedRoute } from '@angular/router';
import { OvicQueryCondition } from '@core/models/dto';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core-new/service/notification.service';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { CtdtMuctieuCutheService } from '@modules/shared/services/ctdt-muctieu-cuthe.service';
import { CtdtService } from '@modules/shared/services/ctdt.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { ROLES } from '@modules/shared/utils/syscat';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, forkJoin, Observable, of, Subject, takeUntil } from 'rxjs';
import { Ctdt } from '@modules/shared/models/ctdt';
import { CtdtCdr } from '@modules/shared/models/ctdt-cdr';
import { CtdtMuctieuCuthe } from '@modules/shared/models/ctdt-muctieu-cuthe';
import { MultiSelectModule } from 'primeng/multiselect';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { MatButtonModule } from '@angular/material/button';
import { InputTextModule } from 'primeng/inputtext';
import { Drawer } from 'primeng/drawer';
import { TooltipModule } from 'primeng/tooltip';
import { Select } from 'primeng/select';

export interface CtdtCdrParent extends CtdtCdr {
    children?: CtdtCdr[];
}

interface PloTemplate extends BoCtdtCdr {
    label: string;
    searchText: string;
    children: BoCtdtCdr[];
}

type PloCreateMode = 'template' | 'manual';

interface TemplateCopyState {
    programmeId: number;
    parentId: number | null;
    parentAttempted: boolean;
    uncertainChild: boolean;
    parentPayload: Omit<CtdtCdr, 'id'>;
    children: Omit<CtdtCdr, 'id'>[];
    completed: number;
}

export interface CtdtCdrSummary {
    programmeId: number;
    state: AppState;
    ploCount: number;
    piCount: number;
    peoPloLinkCount: number;
    invalidPiPercentPloCount: number;
}

@Component({
    selector: 'app-ctdt-cdr',
    standalone: true,
    imports: [
        CommonModule,
        DividerModule,
        FormsModule,
        ReactiveFormsModule,
        TableModule,
        MatButtonModule,
        InputTextModule,
        Drawer,
        Select,
        TooltipModule,
        MultiSelectModule,
        OvicEditorComponent,
        SafeHtmlDecodePipe,
        NgbTooltipModule,
        LoadingProgressComponent
    ],
    templateUrl: './ctdt-cdr.component.html',
    styleUrls: ['./ctdt-cdr.component.css'],
    host: { '[class.cdr-embedded]': 'embedded' }
})
export class CtdtCdrComponent implements OnChanges, OnInit, OnDestroy {
    private readonly auth = inject(AuthService);
    private readonly notificationService = inject(NotificationService);
    private readonly router = inject(Router);
    private readonly activatedRoute = inject(ActivatedRoute);
    private readonly ctdtService = inject(CtdtService);
    readonly formBuilder = inject(FormBuilder);
    private readonly elngUserProfileService = inject(ElngUserProfileService);
    private readonly ctdtCdrService = inject(CtdtCdrService);
    private readonly boCtdtCdrService = inject(BoCtdtCdrService);
    private readonly ctdtMuctieuCutheService = inject(CtdtMuctieuCutheService);
    private readonly helperService = inject(HelperService);
    private readonly destroy$ = new Subject<void>();
    private readonly cancelLoad$ = new Subject<void>();
    private readonly cancelTemplateLoad$ = new Subject<void>();
    private readonly cancelDrawer$ = new Subject<void>();
    private destroyed = false;
    private loadedCtdtId: number | null = null;
    private loadToken = 0;

    @Input() selectedCtdtInput: Ctdt | null = null;
    @Input() embedded = false;
    @Input() peoListInput: CtdtMuctieuCuthe[] | null = null;
    @Input() peoRefreshKey = 0;
    @Output() summaryChange = new EventEmitter<CtdtCdrSummary>();

    readonly state: WritableSignal<AppState> = signal<AppState>('loading');
    loadingHeading = 'Đang tải chuẩn đầu ra...';
    isManager = [ROLES.manager, ROLES.admin, ROLES.troly_pdt, ROLES.chuyenvien_pdt, ROLES.daotao_new]
        .some(role => this.auth.userHasRole(role));
    isLanhDaoKhoa = this.auth.userHasRole(ROLES.lanhdaokhoa);
    userId: number = this.auth.user?.id ?? 0;

    selectedCtdt: Ctdt | null = null;

    donvi_chuyenmon_id: number;

    list_ctdt_cdr: CtdtCdrParent[] = [];

    selectedCtdtCdr: CtdtCdrParent;

    selectedParentCtdtCdr: CtdtCdrParent;

    list_cdr_muctieu: CtdtMuctieuCuthe[] = [];

    compatibilityMatrix: Record<number, Record<number, boolean>> = {};

    isUpdated: boolean = false;

    formTitle: string;

    kyhieu_cdr: string;
    drawerVisible = false;
    savingCdr = false;
    manualEditorInitialValue = '';
    isMatrixExpanded = false;
    readonly createMode = signal<PloCreateMode>('template');
    readonly templateState = signal<AppState>('success');
    readonly ploTemplates = signal<PloTemplate[]>([]);
    readonly selectedTemplateId = signal<number | null>(null);
    readonly templateCopyError = signal('');
    readonly templateRetryable = signal(false);
    private templateLoadToken = 0;
    private drawerToken = 0;
    private templateCopy: TemplateCopyState | null = null;

    readonly collapsedPlos = signal<Set<number>>(new Set<number>());
    readonly hoveredMatrixCol = signal<number | null>(null);
    readonly hoveredMatrixRow = signal<number | null>(null);

    formCtdtCdr: FormGroup = this.formBuilder.group({
        ctdt_id: ['', Validators.required],
        kyhieu: [''],
        ordering: ['', [Validators.required, Validators.min(1), Validators.pattern(/^[0-9]+$/)]],
        noidung: ['', Validators.required],
        parent_id: [''],
        tuongthich_peos: [''],
        percent_pi: ['']
    });

    ngOnInit(): void {
        if (!this.isLanhDaoKhoa && !this.isManager) {
            this.state.set('success');
            this.router.navigate(['/admin/content-none']);
            return;
        }
        if (this.embedded) {
            // Inputs are handled by ngOnChanges, including the initial binding.
            return;
        }
        this.activatedRoute.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
            if (params?.['code']) {
                this.loadCtdtData(String(params['code']));
            } else {
                this.state.set('success');
                this.router.navigate(['/admin/content-none']);
            }
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (!this.embedded || (!this.isLanhDaoKhoa && !this.isManager)) return;
        const ctdt = this.selectedCtdtInput;
        if (changes['selectedCtdtInput'] && (ctdt?.id !== this.selectedCtdt?.id
            || ctdt?.ctdt_bo_id !== this.selectedCtdt?.ctdt_bo_id)) this.resetDrawerState();
        if (!ctdt?.id) {
            this.selectedCtdt = null;
            return;
        }
        if (ctdt.id !== this.selectedCtdt?.id) {
            this.list_ctdt_cdr = [];
            this.compatibilityMatrix = {};
            this.cancelLoad$.next();
        }
        this.selectedCtdt = ctdt;
        if (this.peoRefreshKey <= 0) return;
        if (ctdt.id !== this.loadedCtdtId || changes['peoRefreshKey'] || changes['peoListInput']) {
            this.loadEmbeddedData(ctdt);
        }
    }

    private loadEmbeddedData(ctdt: Ctdt): void {
        this.cancelLoad$.next();
        this.loadedCtdtId = ctdt.id;
        this.selectedCtdt = ctdt;
        this.list_cdr_muctieu = this.peoListInput ?? [];
        this.loadCtdtCdr();
    }

    private emitSummary(state: AppState, programmeId = this.selectedCtdt?.id ?? this.selectedCtdtInput?.id ?? 0): void {
        this.summaryChange.emit({
            programmeId,
            state,
            ploCount: this.list_ctdt_cdr.length,
            piCount: this.getTotalPiCount(),
            peoPloLinkCount: this.getMatrixLinkCount(),
            invalidPiPercentPloCount: this.list_ctdt_cdr.filter(cdr =>
                Boolean(cdr.children?.length) && this.getTotalPiPercent(cdr) !== 100).length
        });
    }

    ngOnDestroy(): void {
        this.destroyed = true;
        this.cancelDrawer$.next();
        this.cancelDrawer$.complete();
        this.cancelLoad$.next();
        this.cancelLoad$.complete();
        this.cancelTemplateLoad$.next();
        this.cancelTemplateLoad$.complete();
        this.destroy$.next();
        this.destroy$.complete();
    }

    reloadData(): void {
        if (this.embedded) {
            if (this.selectedCtdtInput?.id) this.loadEmbeddedData(this.selectedCtdtInput);
            return;
        }
        const id = Number(this.activatedRoute.snapshot.queryParamMap.get('code'));
        if (id) this.loadCtdtData(String(id));
    }

    private loadCtdtData(ctdtId: string): void {
        const requestedCtdtId = Number(ctdtId);
        const requestToken = ++this.loadToken;
        this.cancelLoad$.next();
        if (this.selectedCtdt?.id !== requestedCtdtId) this.resetDrawerState();
        this.loadedCtdtId = requestedCtdtId;
        this.loadingHeading = 'Đang tải dữ liệu chuẩn đầu ra...';
        this.state.set('loading');
        this.emitSummary('loading', requestedCtdtId);
        const conditionCtdt: ConditionOption = {
            condition: [{ conditionName: 'id', condition: OvicQueryCondition.equal, value: ctdtId }],
            set: [{ label: 'limit', value: '1' }],
            page: null
        };
        const conditionUser: ConditionOption = {
            condition: [{ conditionName: 'user_id', condition: OvicQueryCondition.equal, value: this.userId.toString(), orWhere: 'and' }],
            set: [{ label: 'limit', value: '1' }],
            page: null
        };
        const conditionMuctieu: ConditionOption = {
            condition: [{ conditionName: 'ctdt_id', condition: OvicQueryCondition.equal, value: ctdtId }],
            set: [{ label: 'limit', value: '-1' }, { label: 'orderby', value: 'ordering' }, { label: 'order', value: 'ASC' }],
            page: null
        };

        forkJoin([
            this.ctdtService.getCtdtByPageNew(conditionCtdt),
            this.elngUserProfileService.getUserProfileByPageNewV2(conditionUser),
            this.embedded && this.peoListInput
                ? of({ data: this.peoListInput })
                : this.ctdtMuctieuCutheService.getCtdtMuctieuCutheByPageNew(conditionMuctieu)
        ]).pipe(takeUntil(this.cancelLoad$), takeUntil(this.destroy$)).subscribe({
            next: ([ctdtResponse, userResponse, muctieuResponse]) => {
                if (this.loadedCtdtId !== requestedCtdtId || requestToken !== this.loadToken) return;
                this.selectedCtdt = ctdtResponse.data?.[0] || null;
                if (!this.selectedCtdt) {
                    this.state.set('error');
                    this.emitSummary('error', requestedCtdtId);
                    return;
                }
                this.list_cdr_muctieu = muctieuResponse.data || [];
                if (!this.isManager && userResponse.data?.[0]) {
                    this.donvi_chuyenmon_id = userResponse.data[0].donvi_chuyenmon_id;
                    if (this.donvi_chuyenmon_id !== this.selectedCtdt.category_id) {
                        this.state.set('success');
                        this.router.navigate(['/admin/content-none']);
                        return;
                    }
                }
                this.loadCtdtCdr();
            },
            error: () => {
                if (this.loadedCtdtId !== requestedCtdtId || requestToken !== this.loadToken) return;
                this.state.set('error');
                this.emitSummary('error', requestedCtdtId);
            }
        });
    }

    get f() {
        return this.formCtdtCdr.controls;
    }

    get isNewRootPlo(): boolean {
        return !this.isUpdated && !this.selectedParentCtdtCdr;
    }

    get isTemplateMode(): boolean {
        return this.isNewRootPlo && this.createMode() === 'template';
    }

    get selectedTemplate(): PloTemplate | null {
        const id = this.selectedTemplateId();
        return this.ploTemplates().find(template => template.id === id) ?? null;
    }

    get hasTemplateCopyPending(): boolean {
        return !!this.templateCopy?.parentAttempted;
    }

    get drawerInputsLocked(): boolean {
        return this.savingCdr || this.hasTemplateCopyPending;
    }

    get canSubmitDrawer(): boolean {
        if (this.savingCdr) return false;
        if (this.hasTemplateCopyPending) return true;
        if (this.isTemplateMode) return this.templateState() === 'success' && !!this.selectedTemplate;
        return Number.isSafeInteger(Number(this.f['ordering'].value))
            && Number(this.f['ordering'].value) > 0 && !!this.plainText(this.f['noidung'].value);
    }

    get templateProgress(): string {
        const copy = this.templateCopy;
        if (!copy?.parentAttempted) return '';
        return copy.parentId
            ? `Đã tạo ${copy.parentPayload.kyhieu} và ${copy.completed}/${copy.children.length} PI.`
            : 'Đã gửi yêu cầu tạo PLO. Cần đối chiếu kết quả trước khi tiếp tục.';
    }

    selectCreateMode(mode: PloCreateMode): void {
        if (!this.isNewRootPlo || this.drawerInputsLocked) return;
        this.createMode.set(mode);
    }

    onCreateModeKeydown(event: KeyboardEvent, index: number): void {
        const modes: readonly PloCreateMode[] = ['template', 'manual'];
        let targetIndex: number;
        switch (event.key) {
            case 'ArrowRight':
                targetIndex = (index + 1) % modes.length;
                break;
            case 'ArrowLeft':
                targetIndex = (index - 1 + modes.length) % modes.length;
                break;
            case 'Home':
                targetIndex = 0;
                break;
            case 'End':
                targetIndex = modes.length - 1;
                break;
            default:
                return;
        }

        event.preventDefault();
        this.selectCreateMode(modes[targetIndex]);
        const buttons = (event.currentTarget as HTMLElement).parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
        buttons?.[targetIndex]?.focus();
    }

    selectTemplate(templateId: number | null): void {
        if (this.drawerInputsLocked) return;
        this.selectedTemplateId.set(templateId ? Number(templateId) : null);
        this.templateCopyError.set('');
        this.templateRetryable.set(false);
        this.templateCopy = null;
    }

    previewPloCode(): string {
        return `PLO${Number(this.f['ordering'].value) || ''}`;
    }

    previewPiCode(index: number): string {
        return `PI ${Number(this.f['ordering'].value) || ''}.${index + 1}`;
    }

    getTemplatePiTotal(template: PloTemplate): number {
        return Math.round(template.children.reduce((total, pi) => total + Number(pi.percent_pi || 0), 0));
    }

    loadCtdtCdr() {
        if (!this.selectedCtdt) return;
        const requestedCtdtId = this.selectedCtdt.id;
        const requestToken = ++this.loadToken;
        this.loadingHeading = 'Đang tải danh sách chuẩn đầu ra...';
        this.state.set('loading');
        this.emitSummary('loading', requestedCtdtId);

        const condition_ctdt_cdr: ConditionOption = {
            condition: [
                { conditionName: 'ctdt_id', condition: OvicQueryCondition.equal, value: this.selectedCtdt.id.toString() },],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'orderby', value: 'ordering' },
                { label: 'order', value: 'ASC' }
            ],
            page: null
        }

        this.ctdtCdrService.getCtdtCdrByPageNew(condition_ctdt_cdr).pipe(
            takeUntil(this.cancelLoad$), takeUntil(this.destroy$)
        ).subscribe({
            next: (_ctdt_cdr) => {
                if (this.selectedCtdt?.id !== requestedCtdtId || requestToken !== this.loadToken) return;
                const rows = _ctdt_cdr.data || [];
                const parent: CtdtCdrParent[] = rows.filter(m => Number(m.parent_id) === 0);
                parent.forEach(f => {
                    f.children = rows.filter(m => Number(m.parent_id) === Number(f.id));
                })
                this.list_ctdt_cdr = parent;
                this.compatibilityMatrix = Object.fromEntries(this.list_cdr_muctieu.map(peo => [
                    peo.id,
                    Object.fromEntries(parent.map(cdr => [
                        cdr.id,
                        Array.isArray(cdr.tuongthich_peos) && cdr.tuongthich_peos.map(Number).includes(Number(peo.id))
                    ]))
                ]));

                if (this.selectedParentCtdtCdr) {
                    this.selectedParentCtdtCdr = this.list_ctdt_cdr.find(m => m.id === this.selectedParentCtdtCdr.id);
                }

                if (!this.drawerVisible) this.resetForm();
                this.state.set('success');
                this.emitSummary('success', requestedCtdtId);
            },
            error: () => {
                if (this.selectedCtdt?.id !== requestedCtdtId || requestToken !== this.loadToken) return;
                this.state.set('error');
                this.emitSummary('error', requestedCtdtId);
            }
        })
    }

    resetForm() {
        this.formCtdtCdr.enable({ emitEvent: false });
        this.formCtdtCdr.reset();
        this.f['ctdt_id'].setValue(this.selectedCtdt.id);
        this.f['parent_id'].setValue(this.selectedParentCtdtCdr ? this.selectedParentCtdtCdr.id : 0);
        this.f['ordering'].setValue(this.list_ctdt_cdr.length ? this.list_ctdt_cdr[this.list_ctdt_cdr.length - 1].ordering + 1 : 1);
        this.manualEditorInitialValue = '';
        if (this.selectedParentCtdtCdr) {
            const child = this.selectedParentCtdtCdr.children;
            this.f['ordering'].setValue(child.length ? child[child.length - 1].ordering + 1 : 1);
        }
        this.isUpdated = false;
    }

    openAddCtdtCdr(parent?: CtdtCdrParent) {
        if (this.savingCdr || !this.selectedCtdt?.id || this.state() !== 'success') return;
        this.resetDrawerState();
        this.createMode.set(parent ? 'manual' : 'template');
        this.formTitle = parent ? 'Thêm chỉ báo PI' : 'Thêm chuẩn đầu ra PLO';
        this.kyhieu_cdr = "PLO";
        if (parent) {
            this.selectedParentCtdtCdr = parent;
            this.kyhieu_cdr = "PI ".concat(parent.ordering.toString(), ".");
        }
        this.resetForm();
        this.manualEditorInitialValue = '';
        this.drawerVisible = true;
        if (!parent) this.loadPloTemplates();
    }

    loadPloTemplates(): void {
        if (!this.drawerVisible || !this.isNewRootPlo || this.drawerInputsLocked) return;
        const boId = Number(this.selectedCtdt?.ctdt_bo_id);
        const programmeId = Number(this.selectedCtdt?.id);
        const drawerToken = this.drawerToken;
        const token = ++this.templateLoadToken;
        this.cancelTemplateLoad$.next();
        this.selectedTemplateId.set(null);
        this.ploTemplates.set([]);
        this.templateRetryable.set(false);
        if (!Number.isSafeInteger(boId) || boId <= 0) {
            this.templateState.set('error');
            this.templateCopyError.set('CTĐT chưa liên kết với Bộ CTĐT nên chưa thể tải mẫu.');
            return;
        }
        this.templateState.set('loading');
        this.templateCopyError.set('');
        const condition: ConditionOption = {
            condition: [{ conditionName: 'ctdt_bo_id', condition: OvicQueryCondition.equal, value: String(boId), orWhere: 'and' }],
            set: [{ label: 'limit', value: '-1' }],
            page: null
        };
        this.boCtdtCdrService.getByPage(condition).pipe(
            takeUntil(this.cancelTemplateLoad$), takeUntil(this.destroy$)
        ).subscribe({
            next: response => {
                if (token !== this.templateLoadToken || drawerToken !== this.drawerToken
                    || Number(this.selectedCtdt?.id) !== programmeId || Number(this.selectedCtdt?.ctdt_bo_id) !== boId) return;
                const rows = (response.data || []).filter(row => Number(row.ctdt_bo_id) === boId).map(row => ({
                    ...row,
                    id: Number(row.id),
                    ctdt_bo_id: boId,
                    parent_id: Number(row.parent_id)
                })).filter(row => Number.isSafeInteger(row.id) && row.id > 0);
                const parents = rows.filter(row => row.parent_id === 0).map(parent => ({
                    ...parent,
                    label: this.plainText(parent.noidung) || 'Chưa có nội dung',
                    searchText: this.plainText(parent.noidung).toLowerCase(),
                    children: rows.filter(child => child.parent_id === parent.id)
                }));
                this.ploTemplates.set(parents);
                this.templateState.set('success');
                this.templateRetryable.set(false);
            },
            error: () => {
                if (token !== this.templateLoadToken || drawerToken !== this.drawerToken
                    || Number(this.selectedCtdt?.id) !== programmeId) return;
                this.templateState.set('error');
                this.templateRetryable.set(true);
                this.templateCopyError.set('Không thể tải mẫu PLO. Vui lòng thử lại.');
            }
        });
    }

    decodeTemplateContent(value: string): string {
        return this.helperService.decodeHTML(value || '');
    }

    private plainText(value: string): string {
        return this.decodeTemplateContent(value).replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ')
            .replace(/[​-‍﻿]/g, '').replace(/\s+/g, ' ').trim();
    }

    async saveCtdtCdr() {
        if (this.isTemplateMode) {
            await this.saveFromTemplate();
            return;
        }
        if (this.savingCdr || !this.selectedCtdt) return;
        const ordering = Number(this.f['ordering'].value);
        if (!Number.isSafeInteger(ordering) || ordering <= 0 || !this.plainText(this.f['noidung'].value)) {
            this.formCtdtCdr.markAllAsTouched();
            this.notificationService.toastWarning('Vui lòng nhập ký hiệu và nội dung hợp lệ.');
            return;
        }
        if (this.formCtdtCdr.invalid) {
            this.formCtdtCdr.markAllAsTouched();
            this.notificationService.toastWarning('Vui lòng nhập đầy đủ các trường bắt buộc.');
            return;
        }
        this.savingCdr = true;
        const data = { ...this.formCtdtCdr.getRawValue() };

        data['kyhieu'] = this.kyhieu_cdr.concat("", data['ordering'].toString());

        const condition: ConditionOption = {
            condition: [
                { conditionName: 'kyhieu', condition: OvicQueryCondition.equal, value: data['kyhieu'], orWhere: 'and' },
                { conditionName: 'ctdt_id', condition: OvicQueryCondition.equal, value: this.selectedCtdt.id.toString(), orWhere: 'and' },
            ],
            set: [{ label: 'limit', value: '1' }],
            page: null
        };

        if (this.isUpdated && this.selectedCtdtCdr) {
            condition.condition.push({ conditionName: 'id', condition: OvicQueryCondition.notEqual, value: this.selectedCtdtCdr.id.toString(), orWhere: 'and' });
        }

        this.loadingHeading = 'Đang kiểm tra ký hiệu...';
        let checkData: { data: CtdtCdr[]; recordsFiltered: number };
        try {
            checkData = await firstValueFrom(this.ctdtCdrService.getCtdtCdrByPageNew(condition));
        } catch {
            this.savingCdr = false;
            this.notificationService.toastError('Không thể kiểm tra ký hiệu. Vui lòng thử lại.');
            return;
        }

        if (checkData.recordsFiltered !== 0) {
            this.savingCdr = false;
            return this.notificationService.toastWarning('Ký hiệu đã tồn tại, vui lòng nhập lại');
        }

        this.loadingHeading = 'Đang lưu chuẩn đầu ra...';
        if (this.isUpdated && this.selectedCtdtCdr) {
            this.ctdtCdrService.updateCtdtCdr(this.selectedCtdtCdr.id, data).subscribe({
                next: () => {
                    this.savingCdr = false;
                    this.notificationService.toastSuccess('Sửa thành công');
                    this.closeForm();
                    this.loadCtdtCdr();
                },
                error: () => {
                    this.savingCdr = false;
                    this.notificationService.toastError('Sửa thất bại');
                }
            });
        } else {
            this.ctdtCdrService.addCtdtCdr(data).subscribe({
                next: () => {
                    this.savingCdr = false;
                    this.notificationService.toastSuccess('Thêm thành công');
                    this.closeForm();
                    this.loadCtdtCdr();
                },
                error: () => {
                    this.savingCdr = false;
                    this.notificationService.toastError('Thêm thất bại');
                }
            });
        }
    }

    private async saveFromTemplate(): Promise<void> {
        if (this.savingCdr || !this.isTemplateMode || !this.selectedCtdt?.id || !this.drawerVisible) return;
        const programmeId = Number(this.selectedCtdt.id);
        const token = this.drawerToken;
        let copy = this.templateCopy;
        if (!copy?.parentAttempted) {
            this.f['ordering'].markAsTouched();
            const ordering = Number(this.f['ordering'].value);
            const template = this.selectedTemplate;
            if (!Number.isSafeInteger(ordering) || ordering <= 0) {
                this.notificationService.toastWarning('Vui lòng nhập số thứ tự PLO hợp lệ.');
                return;
            }
            if (this.templateState() !== 'success' || !template?.id
                || Number(template.ctdt_bo_id) !== Number(this.selectedCtdt.ctdt_bo_id)) {
                this.notificationService.toastWarning('Vui lòng chọn mẫu PLO của Bộ CTĐT hiện tại.');
                return;
            }
            const validTemplate = this.plainText(template.noidung) && template.children.every(child => {
                const percent = Number(child.percent_pi);
                return child.percent_pi !== null && child.percent_pi !== undefined && String(child.percent_pi).trim() !== ''
                    && Number.isInteger(percent) && percent >= 0 && percent <= 100
                    && Number(child.ctdt_bo_id) === Number(template.ctdt_bo_id)
                    && Number(child.parent_id) === Number(template.id) && !!this.plainText(child.noidung);
            });
            if (!validTemplate) {
                this.notificationService.toastError('Nội dung hoặc tỷ lệ PI trong mẫu không hợp lệ. Vui lòng kiểm tra mẫu.');
                return;
            }
            const peos: number[] = Array.isArray(this.f['tuongthich_peos'].value)
                ? [...new Set<number>(this.f['tuongthich_peos'].value.map(Number))] : [];
            if (peos.some(id => !this.list_cdr_muctieu.some(peo => Number(peo.id) === id))) {
                this.notificationService.toastWarning('PEO đã chọn không thuộc CTĐT hiện tại.');
                return;
            }
            copy = {
                programmeId, parentId: null, parentAttempted: false, uncertainChild: false, completed: 0,
                parentPayload: {
                    ctdt_id: programmeId, kyhieu: `PLO${ordering}`, ordering, parent_id: 0,
                    noidung: template.noidung, percent_pi: 0, tuongthich_peos: peos
                },
                children: template.children.map((child, index) => ({
                    ctdt_id: programmeId, kyhieu: `PI ${ordering}.${index + 1}`,
                    ordering: index + 1, parent_id: 0,
                    noidung: child.noidung, percent_pi: Number(child.percent_pi), tuongthich_peos: []
                }))
            };
            this.templateCopy = copy;
        }
        if (copy.programmeId !== programmeId) return;
        this.savingCdr = true;
        this.formCtdtCdr.disable({ emitEvent: false });
        this.templateCopyError.set('');
        try {
            // Retry resumes the snapshot; it never creates a second parent.
            const parent = await this.findCopyRow(copy.parentPayload, token);
            if (copy.parentAttempted) {
                if (!parent || !this.sameCopyRow(parent, copy.parentPayload)
                    || (copy.parentId && Number(parent.id) !== copy.parentId)) {
                    throw new Error('Không đối chiếu được PLO đã gửi. Đóng và tải lại danh sách để kiểm tra; không tự tạo thêm PLO.');
                }
                copy.parentId = Number(parent.id);
            } else {
                if (parent) {
                    this.templateCopy = null;
                    this.notificationService.toastWarning('Ký hiệu đã tồn tại, vui lòng nhập lại');
                    return;
                }
                copy.parentAttempted = true;
                let response: unknown;
                try {
                    response = await this.drawerRequest(this.ctdtCdrService.addCtdtCdr(copy.parentPayload), token, programmeId);
                } catch (error) {
                    if (this.isRejectedWrite(error)) copy.parentAttempted = false;
                    throw error;
                }
                copy.parentId = this.extractCreatedId(response);
                if (!copy.parentId) {
                    const created = await this.findCopyRow(copy.parentPayload, token);
                    if (!created || !this.sameCopyRow(created, copy.parentPayload)) {
                        throw new Error('Đã gửi PLO nhưng chưa xác định được ID. Bấm Tiếp tục để đối chiếu; không tạo lại PLO.');
                    }
                    copy.parentId = Number(created.id);
                }
            }
            while (copy.completed < copy.children.length) {
                const child = { ...copy.children[copy.completed], parent_id: copy.parentId };
                const existing = await this.findCopyRow(child, token);
                if (existing) {
                    if (!copy.uncertainChild || !this.sameCopyRow(existing, child)) {
                        throw new Error(`${child.kyhieu} đã tồn tại hoặc không khớp nội dung cần sao chép. Vui lòng kiểm tra danh sách.`);
                    }
                } else {
                    if (copy.uncertainChild) {
                        throw new Error(`Chưa xác định được kết quả ghi ${child.kyhieu}. Bấm Tiếp tục để đối chiếu hoặc đóng để kiểm tra danh sách.`);
                    }
                    copy.uncertainChild = true;
                    try {
                        await this.drawerRequest(this.ctdtCdrService.addCtdtCdr(child), token, programmeId);
                    } catch (error) {
                        if (this.isRejectedWrite(error)) copy.uncertainChild = false;
                        throw error;
                    }
                }
                copy.uncertainChild = false;
                copy.completed++;
            }
            this.savingCdr = false;
            this.templateCopy = null;
            this.notificationService.toastSuccess('Đã thêm PLO và các PI từ mẫu.');
            this.closeForm();
            this.loadCtdtCdr();
        } catch (error) {
            if (!this.isDrawerCurrent(token, programmeId)) return;
            const detail = error instanceof HttpErrorResponse
                ? 'Không thể hoàn tất sao chép. Bấm Tiếp tục để đối chiếu phần đã lưu trước khi thử tiếp.'
                : error instanceof Error ? error.message : 'Không thể sao chép mẫu. Vui lòng thử lại.';
            this.templateCopyError.set(detail);
            this.notificationService.toastError(detail);
        } finally {
            if (token === this.drawerToken) {
                this.savingCdr = false;
                if (this.formCtdtCdr.disabled) this.formCtdtCdr.enable({ emitEvent: false });
            }
        }
    }

    private isDrawerCurrent(token: number, programmeId: number): boolean {
        return !this.destroyed && this.drawerVisible && token === this.drawerToken
            && Number(this.selectedCtdt?.id) === programmeId;
    }

    private async drawerRequest<T>(request: Observable<T>, token: number, programmeId: number): Promise<T> {
        if (!this.isDrawerCurrent(token, programmeId)) throw new Error('Phiên biểu mẫu đã thay đổi.');
        const value = await firstValueFrom(request.pipe(takeUntil(this.cancelDrawer$), takeUntil(this.destroy$)));
        if (!this.isDrawerCurrent(token, programmeId)) throw new Error('Phiên biểu mẫu đã thay đổi.');
        return value;
    }

    private isRejectedWrite(error: unknown): boolean {
        return error instanceof HttpErrorResponse && [400, 401, 403, 404, 422].includes(error.status);
    }

    private extractCreatedId(response: unknown): number | null {
        if (Array.isArray(response)) return response.length === 1 ? this.extractCreatedId(response[0]) : null;
        if (response && typeof response === 'object') {
            const data = response as Record<string, unknown>;
            return this.extractCreatedId(data['id'] ?? data['data']);
        }
        if (typeof response !== 'number' && typeof response !== 'string') return null;
        const id = Number(response);
        return Number.isSafeInteger(id) && id > 0 ? id : null;
    }

    private async findCopyRow(payload: Omit<CtdtCdr, 'id'>, token: number): Promise<CtdtCdr | null> {
        const result = await this.drawerRequest(this.ctdtCdrService.getCtdtCdrByPageNew({
            condition: [
                { conditionName: 'ctdt_id', condition: OvicQueryCondition.equal, value: String(payload.ctdt_id), orWhere: 'and' },
                { conditionName: 'kyhieu', condition: OvicQueryCondition.equal, value: payload.kyhieu, orWhere: 'and' }
            ],
            set: [{ label: 'limit', value: '2' }], page: null
        }), token, payload.ctdt_id);
        const rows = result.data || [];
        if (rows.length > 1 || Number(result.recordsFiltered) > 1
            || (Number(result.recordsFiltered) > 0 && !rows.length)) {
            throw new Error(`Không thể đối chiếu duy nhất ${payload.kyhieu}. Vui lòng tải lại danh sách để kiểm tra.`);
        }
        if (!rows.length) return null;
        if (!this.extractCreatedId(rows[0].id) || Number(rows[0].ctdt_id) !== payload.ctdt_id
            || rows[0].kyhieu !== payload.kyhieu) throw new Error('Dữ liệu đối chiếu không đúng CTĐT hoặc ký hiệu.');
        return rows[0];
    }

    private sameCopyRow(existing: CtdtCdr, expected: Omit<CtdtCdr, 'id'>): boolean {
        const peos = (ids: number[]) => [...new Set((ids || []).map(Number))].sort((a, b) => a - b).join(',');
        return Number(existing.ctdt_id) === expected.ctdt_id
            && Number(existing.parent_id) === expected.parent_id
            && Number(existing.ordering) === expected.ordering
            && Number(existing.percent_pi || 0) === expected.percent_pi
            && this.helperService.decodeHTML(existing.noidung || '').trim() === this.helperService.decodeHTML(expected.noidung).trim()
            && peos(existing.tuongthich_peos) === peos(expected.tuongthich_peos);
    }

    private resetDrawerState(): void {
        this.drawerToken++;
        this.templateLoadToken++;
        this.cancelTemplateLoad$.next();
        this.cancelDrawer$.next();
        this.savingCdr = false;
        this.drawerVisible = false;
        this.selectedParentCtdtCdr = null;
        this.selectedCtdtCdr = null;
        this.isUpdated = false;
        this.templateState.set('success');
        this.selectedTemplateId.set(null);
        this.ploTemplates.set([]);
        this.templateCopyError.set('');
        this.templateRetryable.set(false);
        this.templateCopy = null;
    }

    onDrawerVisibilityChange(visible: boolean): void {
        if (!visible) this.closeForm();
    }

    closeForm() {
        if (this.savingCdr) return;
        const refresh = this.hasTemplateCopyPending;
        if (refresh) {
            this.notificationService.toastWarning('Các bản ghi đã lưu không bị hủy. Danh sách sẽ được tải lại để kiểm tra PLO và PI.');
        }
        this.resetDrawerState();
        if (refresh) this.loadCtdtCdr();
    }

    pointQuestionKeyDown(event: KeyboardEvent) {
        if (!event) return;

        const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight'];

        if (/^[0-9]$/.test(event.key)) {
            return;
        }

        if (allowedKeys.includes(event.key)) {
            return;
        }

        event.preventDefault();
    }

    editCtdtCdr(ctdtCdr: CtdtCdrParent, ctdtCdrParent?: CtdtCdrParent) {
        if (this.savingCdr || !this.selectedCtdt?.id || this.state() !== 'success') return;
        const current = ctdtCdrParent
            ? this.list_ctdt_cdr.find(parent => parent.id === ctdtCdrParent.id)?.children?.find(child => child.id === ctdtCdr.id)
            : this.list_ctdt_cdr.find(parent => parent.id === ctdtCdr.id);
        if (!current) return;
        this.resetDrawerState();
        this.createMode.set('manual');
        this.selectedCtdtCdr = ctdtCdr;
        this.selectedParentCtdtCdr = ctdtCdrParent ? ctdtCdrParent : null;
        this.formTitle = ctdtCdrParent ? 'Cập nhật chỉ báo PI' : 'Cập nhật chuẩn đầu ra PLO';
        this.kyhieu_cdr = "PLO";
        if (ctdtCdrParent) {
            this.selectedParentCtdtCdr = ctdtCdrParent;
            this.kyhieu_cdr = "PI ".concat(ctdtCdrParent.ordering.toString(), ".");
        }
        this.resetForm();
        this.isUpdated = true;
        this.f['kyhieu'].setValue(ctdtCdr.kyhieu);
        this.f['ordering'].setValue(ctdtCdr.ordering);
        this.f['noidung'].setValue(ctdtCdr.noidung);
        this.manualEditorInitialValue = ctdtCdr.noidung;
        this.f['parent_id'].setValue(ctdtCdr.parent_id);
        this.f['tuongthich_peos'].setValue(ctdtCdr.tuongthich_peos);
        this.f['percent_pi'].setValue(ctdtCdr.percent_pi);
        this.drawerVisible = true;
    }

    getTotalPiCount(): number {
        return this.list_ctdt_cdr.reduce((total, cdr) => total + (cdr.children?.length ?? 0), 0);
    }

    getTotalPiPercent(cdr: CtdtCdrParent): number {
        return Math.round((cdr.children ?? []).reduce((total, child) => total + Number(child.percent_pi || 0), 0));
    }

    getProgressWidth(cdr: CtdtCdrParent): number {
        return Math.min(this.getTotalPiPercent(cdr), 100);
    }

    getPiPercentState(cdr: CtdtCdrParent): 'complete' | 'under' | 'over' {
        const total = this.getTotalPiPercent(cdr);
        return total === 100 ? 'complete' : total > 100 ? 'over' : 'under';
    }

    getPeoNamesForPlo(peoIds: number[] = []): string[] {
        const ids = Array.isArray(peoIds) ? peoIds.map(Number) : [];
        return this.list_cdr_muctieu
            .filter(peo => ids.includes(Number(peo.id)))
            .map(peo => peo.kyhieu || `PEO ${peo.ordering}`);
    }

    getPeoCoverageCount(): number {
        return this.list_cdr_muctieu.filter(peo => this.getLinkedPloCountForPeo(peo) > 0).length;
    }

    getLinkedPloCountForPeo(peo: CtdtMuctieuCuthe): number {
        const peoId = Number(peo.id);
        return this.list_ctdt_cdr.filter(cdr => (cdr.tuongthich_peos ?? []).map(Number).includes(peoId)).length;
    }

    getMatrixLinkCount(): number {
        return this.list_cdr_muctieu.reduce((total, peo) => total + this.getLinkedPloCountForPeo(peo), 0);
    }

    getPeoTooltip(peo: CtdtMuctieuCuthe): string {
        const content = this.helperService.decodeHTML(peo.noidung || '');
        return content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || 'Chưa có mô tả mục tiêu đào tạo.';
    }

    getRemainingPiPercent(cdr: CtdtCdrParent): number {
        return Math.max(0, 100 - this.getTotalPiPercent(cdr));
    }

    togglePlo(cdr: CtdtCdrParent): void {
        if (!cdr.id) return;
        const collapsed = new Set(this.collapsedPlos());
        collapsed.has(cdr.id) ? collapsed.delete(cdr.id) : collapsed.add(cdr.id);
        this.collapsedPlos.set(collapsed);
    }

    isPloCollapsed(cdr: CtdtCdrParent): boolean {
        return !!cdr.id && this.collapsedPlos().has(cdr.id);
    }

    setMatrixHover(rowId: number | null, colId: number | null): void {
        this.hoveredMatrixRow.set(rowId);
        this.hoveredMatrixCol.set(colId);
    }

    isMatrixHighlighted(rowId: number, colId: number): boolean {
        return this.hoveredMatrixRow() === rowId || this.hoveredMatrixCol() === colId;
    }

    deleteCtdtCdr(ctdtCdr: CtdtCdrParent) {
        if (!ctdtCdr?.id || !this.selectedCtdt || this.state() === 'loading') return;
        const isParent = ctdtCdr.parent_id === 0;
        const safeTitle = (ctdtCdr.kyhieu || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const hasChildren = Boolean(ctdtCdr.children && ctdtCdr.children.length);
        const childCount = ctdtCdr.children?.length ?? 0;
        const msg = isParent
            ? hasChildren
                ? `Bạn có chắc muốn xóa chuẩn đầu ra "${safeTitle}" cùng <b>${childCount}</b> chỉ báo PI trực thuộc?`
                : `Bạn có chắc muốn xóa chuẩn đầu ra "${safeTitle}"?`
            : `Bạn có chắc muốn xóa chỉ báo "${safeTitle}"?`;

        this.notificationService.confirmDelete2({
            heading: 'Xác nhận xóa',
            htmlMessage: msg
        }).subscribe(confirmed => {
            if (!confirmed || !this.selectedCtdt) return;
            this.loadingHeading = 'Đang xóa chuẩn đầu ra...';
            this.state.set('loading');
            let id_delete = [ctdtCdr.id];
            if (ctdtCdr.children && ctdtCdr.children.length) {
                id_delete = id_delete.concat(ctdtCdr.children.map(m => m.id));
            }
            this.ctdtCdrService.deleteCtdtCdr(id_delete.toString()).subscribe({
                next: () => {
                    this.notificationService.toastSuccess("Xóa thành công");
                    this.loadCtdtCdr();
                },
                error: () => {
                    this.state.set('success');
                    this.notificationService.toastError("Xóa thất bại");
                }
            });
        });
    }

}
