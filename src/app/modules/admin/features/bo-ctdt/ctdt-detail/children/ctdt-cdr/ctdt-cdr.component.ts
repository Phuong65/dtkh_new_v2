import { CtdtCdrService } from '@modules/shared/services/ctdt-cdr.service';
import { HelperService } from '@core/services/helper.service';
import { Component, OnInit, WritableSignal, inject, signal } from '@angular/core';
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
import { NotificationService } from '@core/services/notification.service';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { CtdtMuctieuCutheService } from '@modules/shared/services/ctdt-muctieu-cuthe.service';
import { CtdtService } from '@modules/shared/services/ctdt.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { ROLES } from '@modules/shared/utils/syscat';
import { firstValueFrom, forkJoin } from 'rxjs';
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
    styleUrls: ['./ctdt-cdr.component.css']
})
export class CtdtCdrComponent implements OnInit {
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

    readonly state: WritableSignal<AppState> = signal<AppState>('loading');
    loadingHeading = 'Đang tải chuẩn đầu ra...';
    isManager = [ROLES.manager, ROLES.admin, ROLES.troly_pdt, ROLES.chuyenvien_pdt]
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
        if (this.isLanhDaoKhoa || this.isManager) {
            this.activatedRoute.queryParams.subscribe(async (params) => {
                if (params && params['code']) {
                    this.loadCtdtData(String(params['code']));
                } else {
                    this.state.set('success');
                    this.router.navigate(['/admin/content-none']);
                }
            })
        } else {
            this.state.set('success');
            this.router.navigate(['/admin/content-none']);
        }
    }

    reloadData(): void {
        const code = this.activatedRoute.snapshot.queryParamMap.get('code');
        if (code) this.loadCtdtData(code);
    }

    private loadCtdtData(ctdtId: string): void {
        this.loadingHeading = 'Đang tải dữ liệu chuẩn đầu ra...';
        this.state.set('loading');
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
            this.ctdtMuctieuCutheService.getCtdtMuctieuCutheByPageNew(conditionMuctieu)
        ]).subscribe({
            next: ([ctdtResponse, userResponse, muctieuResponse]) => {
                this.selectedCtdt = ctdtResponse.data?.[0] || null;
                if (!this.selectedCtdt) {
                    this.state.set('error');
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
            error: () => this.state.set('error')
        });
    }

    get f() {
        return this.formCtdtCdr.controls;
    }

    loadCtdtCdr() {
        if (!this.selectedCtdt) return;
        this.loadingHeading = 'Đang tải danh sách chuẩn đầu ra...';
        this.state.set('loading');

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

        this.ctdtCdrService.getCtdtCdrByPageNew(condition_ctdt_cdr).subscribe({
            next: (_ctdt_cdr) => {
                const parent: CtdtCdrParent[] = _ctdt_cdr.data.filter(m => m.parent_id === 0);
                parent.forEach(f => {
                    f.children = _ctdt_cdr.data.filter(m => m.parent_id === f.id);
                })
                this.list_ctdt_cdr = parent;
                this.compatibilityMatrix = Object.fromEntries(this.list_cdr_muctieu.map(peo => [
                    peo.id,
                    Object.fromEntries(parent.map(cdr => [
                        cdr.id,
                        cdr.tuongthich_peos.includes(peo.id)
                    ]))
                ]));

                if (this.selectedParentCtdtCdr) {
                    this.selectedParentCtdtCdr = this.list_ctdt_cdr.find(m => m.id === this.selectedParentCtdtCdr.id);
                }

                this.resetForm();
                this.state.set('success');
            },
            error: () => this.state.set('error')
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

        this.notificationService.confirmDelete().then(a => {
            if (a) {
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
                })
            }
        })
    }

}
