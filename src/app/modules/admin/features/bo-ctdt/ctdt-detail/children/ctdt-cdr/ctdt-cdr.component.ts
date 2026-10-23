import { CtdtCdrService } from '@modules/shared/services/ctdt-cdr.service';
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
import { firstValueFrom, forkJoin, of, Subject, takeUntil } from 'rxjs';
import { Ctdt } from '@modules/shared/models/ctdt';
import { CtdtCdr } from '@modules/shared/models/ctdt-cdr';
import { CtdtMuctieuCuthe } from '@modules/shared/models/ctdt-muctieu-cuthe';
import { MultiSelectModule } from 'primeng/multiselect';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { MatButtonModule } from '@angular/material/button';
import { InputTextModule } from 'primeng/inputtext';
import { Drawer } from 'primeng/drawer';
import { TooltipModule } from 'primeng/tooltip';

export interface CtdtCdrParent extends CtdtCdr {
    children?: CtdtCdr[];
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
    private readonly ctdtMuctieuCutheService = inject(CtdtMuctieuCutheService);
    private readonly helperService = inject(HelperService);
    private readonly destroy$ = new Subject<void>();
    private readonly cancelLoad$ = new Subject<void>();
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
    isMatrixExpanded = false;

    readonly collapsedPlos = signal<Set<number>>(new Set<number>());
    readonly hoveredMatrixCol = signal<number | null>(null);
    readonly hoveredMatrixRow = signal<number | null>(null);

    formCtdtCdr: FormGroup = this.formBuilder.group({
        ctdt_id: ['', Validators.required],
        kyhieu: [''],
        ordering: ['', Validators.required],
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
        if (!ctdt?.id || this.peoRefreshKey <= 0) return;
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
        this.cancelLoad$.next();
        this.cancelLoad$.complete();
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

                this.resetForm();
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
        this.formCtdtCdr.reset();
        this.f['ctdt_id'].setValue(this.selectedCtdt.id);
        this.f['parent_id'].setValue(this.selectedParentCtdtCdr ? this.selectedParentCtdtCdr.id : 0);
        this.f['ordering'].setValue(this.list_ctdt_cdr.length ? this.list_ctdt_cdr[this.list_ctdt_cdr.length - 1].ordering + 1 : 1);
        if (this.selectedParentCtdtCdr) {
            const child = this.selectedParentCtdtCdr.children;
            this.f['ordering'].setValue(child.length ? child[child.length - 1].ordering + 1 : 1);
        }
        this.isUpdated = false;
    }

    openAddCtdtCdr(parent?: CtdtCdrParent) {
        this.selectedParentCtdtCdr = null;
        this.formTitle = parent ? 'Thêm chỉ báo PI' : 'Thêm chuẩn đầu ra PLO';
        this.kyhieu_cdr = "PLO";
        if (parent) {
            this.selectedParentCtdtCdr = parent;
            this.kyhieu_cdr = "PI ".concat(parent.ordering.toString(), ".");
        }
        this.resetForm();
        this.drawerVisible = true;
    }


    async saveCtdtCdr() {
        if (this.savingCdr || !this.selectedCtdt) return;
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

    closeForm() {
        this.drawerVisible = false;
        this.selectedParentCtdtCdr = null;
        this.selectedCtdtCdr = null;
        this.isUpdated = false;
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
