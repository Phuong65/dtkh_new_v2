import { CommonModule } from '@angular/common';
import { Component, DestroyRef, ElementRef, EventEmitter, Input, Output, inject, signal, viewChild, viewChildren } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, FormControl, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { PopoverModule } from 'primeng/popover';
import { OvicEditorComponent } from '@modules/shared/components/ovic-editor/ovic-editor.component';
import { OvicDropdownComponent } from '@modules/shared/components/ovic-dropdown/ovic-dropdown.component';
import type { DocumentFileAndLink } from '@modules/shared/components/form-document-file-and-link/form-document-file-and-link.component';
import { LoadingProgressComponent } from '@core-new/components/loading-progress/loading-progress.component';
import { AppState } from '@core-new/models/app-state';
import { OvicFile } from '@core/models/file';
import { Subject, SubjectParams } from '@modules/shared/models/subject';
import { SubjectClo } from '@modules/shared/models/subject-clo';
import { SubjectMuctieuChitiet } from '@modules/shared/models/subject-muctieu-chitiet';
import { SubjectCloService } from '@modules/shared/services/subject-clo.service';
import { SubjectMuctieuChitietService } from '@modules/shared/services/subject-muctieu-chitiet.service';
import { SubjectService } from '@modules/shared/services/subject.service';
import { OpenFileManagerService } from '@modules/shared/services/open-file-manager.service';
import { NotificationService } from '@core-new/service/notification.service';
import { DINHDANG_BAITRACNGHIEM } from '@modules/shared/utils/syscat';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { OvicQueryCondition } from '@core/models/dto';
import { Observable, Subject as RxSubject, firstValueFrom, forkJoin, takeUntil } from 'rxjs';

export type SubjectTemplateSectionId =
    | 'subject-info' | 'exam-format' | 'learning-volume' | 'materials' | 'outline'
    | 'general-objective' | 'goals' | 'outcomes' | 'goal-outcome-links';
type SubjectTemplateGroupId = 'general-info' | 'objectives-cdr';
type MaterialGroup = 'tailieu_chinh' | 'tailieu_thamkhao';
type ObjectiveKind = 'goals' | 'outcomes';
type SubjectField = 'name' | 'code' | 'sotinchi' | 'sotinchi_th' | 'av' | 'desc' | 'yeucau_sinhvien' | 'muctieu';

interface SubjectTemplateItem { id: SubjectTemplateSectionId; label: string; icon: string; }
interface SubjectTemplateGroup { id: SubjectTemplateGroupId; label: string; icon: string; items: readonly SubjectTemplateItem[]; }
interface DraftMaterial extends DocumentFileAndLink { id: number; }

const nonNegativeInteger: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === '') return null;
    return Number.isSafeInteger(value) && value >= 0 ? null : { nonNegativeInteger: true };
};
const creditBalance: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const total = control.get('sotinchi')?.value;
    const practice = control.get('sotinchi_th')?.value;
    return total !== null && practice !== null && practice > total ? { practiceExceedsTotal: true } : null;
};

@Component({
    selector: 'app-subject-template-detail', standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, MatButtonModule, TableModule, TooltipModule, PopoverModule, OvicEditorComponent, OvicDropdownComponent, LoadingProgressComponent],
    templateUrl: './subject-template-detail.component.html',
    styleUrls: [
        '../../course-management/course-management-detail/children/monhoc-thongtin/monhoc-thongtin.component.css',
        '../../course-management/course-management-detail/children/monhoc-muctieu-cdr/monhoc-muctieu-cdr.component.css',
        '../../../../shared/components/form-document-file-and-link/form-document-file-and-link.component.css',
        './subject-template-detail.component.css'
    ]
})
export class SubjectTemplateDetailComponent {
    private readonly fb = inject(FormBuilder);
    private readonly destroyRef = inject(DestroyRef);
    private readonly subjectMuctieuService = inject(SubjectMuctieuChitietService);
    private readonly subjectCloService = inject(SubjectCloService);
    private readonly subjectService = inject(SubjectService);
    private readonly fileManager = inject(OpenFileManagerService);
    private readonly notificationService = inject(NotificationService);
    private readonly cancelRequests$ = new RxSubject<void>();
    private loadVersion = 0;
    private nextRowId = 1;
    private closed = false;
    private readonly goalDrafts = new Map<number, string | null>();
    private readonly outcomeDrafts = new Map<number, string | null>();
    private readonly pendingOutcomeLinks = new Map<number, number | null>();
    private readonly subjectInfoFields = ['name', 'code', 'sotinchi', 'sotinchi_th'] as const;
    goalDraft: string | null = null;
    outcomeDraft: string | null = null;

    @Input() canUpdate = true;
    @Input({ required: true }) set subject(value: Subject | null) {
        // Parent phản hồi bản ghi cùng môn sau PUT: giữ nguyên tab và các bản nháp chưa lưu.
        if (value && this.selectedSubject()?.id === value.id && !this.closed) return;
        this.loadVersion++;
        this.cancelRequests$.next();
        this.closed = false;
        this.selectedSubject.set(value);
        this.resetDraft();
        if (value) {
            this.form.patchValue({
                name: value.name || '', code: value.code || '', desc: value.desc || '',
                sotinchi: value.sotinchi ?? value.params?.sotinchi ?? 0,
                sotinchi_th: value.sotinchi_th ?? value.params?.sotinchi_th ?? 0,
                muctieu: value.muctieu ?? '', yeucau_sinhvien: value.yeucau_sinhvien ?? '', av: value.av ?? null,
                tongsogio: value.params?.tongsogio ?? null, lythuyet: value.params?.lythuyet ?? null,
                thaoluan_baitap: value.params?.thaoluan_baitap ?? null, th_thinghiem: value.params?.th_thinghiem ?? null,
                kiemtra_dinhky: value.params?.kiemtra_dinhky ?? null, tuhoc: value.params?.tuhoc ?? null
            }, { emitEvent: false });
            for (const { key } of this.materialGroups) {
                this.materials[key] = this.copyDocuments(value[key] || []).map(item => ({ ...item, id: this.nextRowId++ }));
            }
            void this.loadSubjectObjectives(value.id);
        }
    }
    @Output() readonly back = new EventEmitter<void>();
    @Output() readonly subjectUpdated = new EventEmitter<Subject>();

    readonly groups: readonly SubjectTemplateGroup[] = [
        { id: 'general-info', label: 'Thông tin chung', icon: 'ti ti-info-circle', items: [
            { id: 'subject-info', label: 'Thông tin môn học', icon: 'ti ti-id' }, { id: 'exam-format', label: 'Định dạng kiểm tra', icon: 'ti ti-clipboard-check' },
            { id: 'learning-volume', label: 'Khối lượng học tập', icon: 'ti ti-clock' }, { id: 'materials', label: 'Tài liệu & học liệu', icon: 'ti ti-folders' },
            { id: 'outline', label: 'Đề cương chi tiết', icon: 'ti ti-file-text' }
        ]},
        { id: 'objectives-cdr', label: 'Khung mục tiêu', icon: 'ti ti-target', items: [
            { id: 'general-objective', label: 'Mục tiêu chung', icon: 'ti ti-target' }, { id: 'goals', label: 'Mục tiêu chi tiết (CO)', icon: 'ti ti-list-check' },
            { id: 'outcomes', label: 'Chuẩn đầu ra (CLO)', icon: 'ti ti-certificate' }, { id: 'goal-outcome-links', label: 'Liên kết CO – CLO', icon: 'ti ti-arrows-left-right' }
        ]}
    ];
    readonly sidebarButtons = viewChildren<ElementRef<HTMLButtonElement>>('sidebarButton');
    readonly goalEditor = viewChild<ElementRef<HTMLTextAreaElement>>('goalEditor');
    readonly outcomeEditor = viewChild<ElementRef<HTMLTextAreaElement>>('outcomeEditor');
    readonly selectedSubject = signal<Subject | null>(null);
    readonly activeGroupId = signal<SubjectTemplateGroupId>('general-info');
    readonly activeItemId = signal<SubjectTemplateSectionId>('subject-info');
    readonly collapsedGroups = signal<SubjectTemplateGroupId[]>([]);
    readonly appState = signal<AppState>('success');
    readonly hasObjectiveData = signal(false);
    readonly editingGoalId = signal<number | null>(null);
    readonly editingOutcomeId = signal<number | null>(null);
    readonly apiLoadingHeading = signal('Đang xử lý...');
    readonly examFormats = DINHDANG_BAITRACNGHIEM;
    readonly workloadFields = [
        { key: 'tongsogio', label: 'Tổng số tiết', help: 'Tổng thời lượng học phần' }, { key: 'lythuyet', label: 'Lý thuyết', help: 'Giảng dạy trên lớp' },
        { key: 'thaoluan_baitap', label: 'Thảo luận / bài tập', help: 'Trao đổi và luyện tập' }, { key: 'th_thinghiem', label: 'Thực hành / thí nghiệm', help: 'Thực hành chuyên môn' },
        { key: 'kiemtra_dinhky', label: 'Kiểm tra định kỳ', help: 'Đánh giá trong kỳ' }, { key: 'tuhoc', label: 'Tự học', help: 'Thời lượng tự nghiên cứu' }
    ] as const;
    readonly materialGroups: readonly { key: MaterialGroup; label: string; icon: string; help: string }[] = [
        { key: 'tailieu_chinh', label: 'Tài liệu chính', icon: 'ti ti-book', help: 'Giáo trình và học liệu cốt lõi.' }, { key: 'tailieu_thamkhao', label: 'Tài liệu tham khảo', icon: 'ti ti-external-link', help: 'Nguồn đọc thêm và học liệu mở rộng.' }
    ];
    readonly form = this.fb.group({
        name: this.fb.nonNullable.control('', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(255)]), code: this.fb.nonNullable.control('', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(50)]),
        desc: this.fb.nonNullable.control(''), yeucau_sinhvien: this.fb.nonNullable.control(''), sotinchi: new FormControl<number | null>(0, [Validators.required, nonNegativeInteger]), sotinchi_th: new FormControl<number | null>(0, [Validators.required, nonNegativeInteger]),
        av: new FormControl<number | null>(null), tongsogio: new FormControl<number | null>(null, nonNegativeInteger), lythuyet: new FormControl<number | null>(null, nonNegativeInteger), thaoluan_baitap: new FormControl<number | null>(null, nonNegativeInteger),
        th_thinghiem: new FormControl<number | null>(null, nonNegativeInteger), kiemtra_dinhky: new FormControl<number | null>(null, nonNegativeInteger), tuhoc: new FormControl<number | null>(null, nonNegativeInteger), muctieu: this.fb.nonNullable.control('')
    }, { validators: creditBalance });

    activeDescTab: 'desc' | 'yeucau' = 'desc';
    goals: SubjectMuctieuChitiet[] = [];
    outcomes: SubjectClo[] = [];
    materials: Record<MaterialGroup, DraftMaterial[]> = { tailieu_chinh: [], tailieu_thamkhao: [] };
    materialLinkDrafts: Record<MaterialGroup, { title: string; link: string }> = { tailieu_chinh: { title: '', link: '' }, tailieu_thamkhao: { title: '', link: '' } };

    activeGroup(): SubjectTemplateGroup { return this.groups.find(group => group.id === this.activeGroupId()) || this.groups[0]; }
    activeItem(): SubjectTemplateItem { return this.activeGroup().items.find(item => item.id === this.activeItemId()) || this.activeGroup().items[0]; }
    isBusy(): boolean { return this.appState() === 'loading'; }

    private resetDraft(): void {
        this.form.reset({}, { emitEvent: false });
        this.goals = [];
        this.outcomes = [];
        this.nextRowId = 1;
        this.materials = { tailieu_chinh: [], tailieu_thamkhao: [] };
        this.materialLinkDrafts = { tailieu_chinh: { title: '', link: '' }, tailieu_thamkhao: { title: '', link: '' } };
        this.activeGroupId.set('general-info');
        this.activeItemId.set('subject-info');
        this.activeDescTab = 'desc';
        this.collapsedGroups.set([]);
        this.appState.set('success');
        this.hasObjectiveData.set(false);
        this.editingGoalId.set(null);
        this.editingOutcomeId.set(null);
        this.goalDraft = null;
        this.outcomeDraft = null;
        this.goalDrafts.clear();
        this.outcomeDrafts.clear();
        this.pendingOutcomeLinks.clear();
    }

    private objectiveCondition(subjectId: number): ConditionOption {
        return {
            condition: [{ conditionName: 'subject_id', condition: OvicQueryCondition.equal, value: String(subjectId), orWhere: 'and' }],
            set: [{ label: 'limit', value: '-1' }, { label: 'order', value: 'ASC' }, { label: 'orderby', value: 'ordering' }],
            page: null
        };
    }

    private isCurrent(version: number): boolean {
        return !this.closed && !this.destroyRef.destroyed && version === this.loadVersion;
    }

    private async request<T>(source: Observable<T>, version: number): Promise<T> {
        if (!this.isCurrent(version)) throw new Error('Request cancelled');
        const result = await firstValueFrom(source.pipe(takeUntil(this.cancelRequests$), takeUntilDestroyed(this.destroyRef)));
        if (!this.isCurrent(version)) throw new Error('Request cancelled');
        return result;
    }

    // appState bao trùm cả chuỗi request, không tắt loading giữa các PUT liên tiếp.
    private async runOperation(heading: string, action: (version: number) => Promise<void>, errorMessage: string, errorState: AppState = 'success'): Promise<boolean> {
        if (this.closed || this.destroyRef.destroyed || this.isBusy()) return false;
        const version = this.loadVersion;
        this.apiLoadingHeading.set(heading);
        this.appState.set('loading');
        try {
            await action(version);
            if (!this.isCurrent(version)) return false;
            this.appState.set('success');
            return true;
        } catch {
            if (this.isCurrent(version)) {
                this.notificationService.toastError(errorMessage);
                // Mutation lỗi giữ draft và cho phép người dùng thử lưu lại; load đầu thất bại mới vào error.
                this.appState.set(errorState);
            }
            return false;
        }
    }

    private async loadSubjectObjectives(subjectId: number): Promise<void> {
        if (!Number.isSafeInteger(subjectId) || subjectId <= 0) {
            this.notificationService.toastError('ID môn học không hợp lệ.');
            this.appState.set('error');
            return;
        }
        this.hasObjectiveData.set(false);
        await this.runOperation('Đang tải mục tiêu và chuẩn đầu ra...', async version => {
            const condition = this.objectiveCondition(subjectId);
            const response = await this.request(forkJoin({
                goals: this.subjectMuctieuService.getByPageNew(condition),
                outcomes: this.subjectCloService.getByPageNew(condition)
            }), version);
            if (!this.isCurrent(version)) return;
            this.goals = [...response.goals.data].sort((a, b) => a.ordering - b.ordering);
            this.outcomes = [...response.outcomes.data].sort((a, b) => a.ordering - b.ordering);
            this.hasObjectiveData.set(true);
        }, 'Không tải được mục tiêu chi tiết và chuẩn đầu ra.', 'error');
    }

    retryLoadObjectives(): void {
        const subjectId = this.selectedSubject()?.id;
        if (subjectId && !this.isBusy() && !this.hasObjectiveData()) void this.loadSubjectObjectives(subjectId);
    }

    subjectInfoBlocked(): boolean {
        const id = this.selectedSubject()?.id;
        return !Number.isSafeInteger(id) || !id || id <= 0 || !this.canUpdate || this.closed || this.destroyRef.destroyed || this.isBusy();
    }
    objectivesBlocked(): boolean {
        return this.closed || this.destroyRef.destroyed || !this.canUpdate || this.isBusy() || !this.hasObjectiveData();
    }
    subjectInfoInvalid(): boolean {
        return this.subjectInfoFields.some(key => this.form.controls[key].invalid) || this.form.hasError('practiceExceedsTotal');
    }
    learningVolumeInvalid(): boolean { return this.workloadFields.some(field => this.form.controls[field.key].invalid); }
    hasObjectiveEditor(): boolean { return this.editingGoalId() !== null || this.editingOutcomeId() !== null; }

    private getCreatedId(response: unknown): number | null {
        if (typeof response === 'number' || typeof response === 'string') {
            const id = typeof response === 'number' ? response : /^\d+$/.test(response.trim()) ? Number(response) : NaN;
            return Number.isSafeInteger(id) && id > 0 ? id : null;
        }
        if (response && typeof response === 'object') {
            const record = response as Record<string, unknown>;
            for (const key of ['id', 'insert_id', 'inserted_id', 'last_id', 'lastInsertId']) {
                const id = this.getCreatedId(record[key]);
                if (id !== null) return id;
            }
        }
        return null;
    }

    private replaceGoal(updated: SubjectMuctieuChitiet): void { this.goals = this.goals.map(item => item.id === updated.id ? updated : item); }
    private replaceOutcome(updated: SubjectClo): void { this.outcomes = this.outcomes.map(item => item.id === updated.id ? updated : item); }
    goalContent(goal: SubjectMuctieuChitiet): string | null { return this.goalDrafts.has(goal.id) ? this.goalDrafts.get(goal.id)! : goal.noidung; }
    outcomeContent(outcome: SubjectClo): string | null { return this.outcomeDrafts.has(outcome.id) ? this.outcomeDrafts.get(outcome.id)! : outcome.noidung; }
    outcomeGoal(outcome: SubjectClo): number | null {
        return this.pendingOutcomeLinks.has(outcome.id) ? this.pendingOutcomeLinks.get(outcome.id)! : outcome.subject_muctieu_chitiet_id;
    }

    beginGoalEdit(goal: SubjectMuctieuChitiet): void {
        if (this.objectivesBlocked()) return;
        this.finishGoalEdit(); this.finishOutcomeEdit();
        this.goalDraft = this.goalContent(goal);
        this.editingGoalId.set(goal.id);
        const version = this.loadVersion;
        setTimeout(() => {
            if (this.isCurrent(version) && this.editingGoalId() === goal.id) this.goalEditor()?.nativeElement.focus();
        });
    }
    beginOutcomeEdit(outcome: SubjectClo): void {
        if (this.objectivesBlocked()) return;
        this.finishGoalEdit(); this.finishOutcomeEdit();
        this.outcomeDraft = this.outcomeContent(outcome);
        this.editingOutcomeId.set(outcome.id);
        const version = this.loadVersion;
        setTimeout(() => {
            if (this.isCurrent(version) && this.editingOutcomeId() === outcome.id) this.outcomeEditor()?.nativeElement.focus();
        });
    }
    finishGoalEdit(): void {
        const goal = this.goals.find(item => item.id === this.editingGoalId());
        if (goal) {
            if (this.goalDraft === goal.noidung) this.goalDrafts.delete(goal.id);
            else this.goalDrafts.set(goal.id, this.goalDraft);
        }
        this.editingGoalId.set(null); this.goalDraft = null;
    }
    finishOutcomeEdit(): void {
        const outcome = this.outcomes.find(item => item.id === this.editingOutcomeId());
        if (outcome) {
            if (this.outcomeDraft === outcome.noidung) this.outcomeDrafts.delete(outcome.id);
            else this.outcomeDrafts.set(outcome.id, this.outcomeDraft);
        }
        this.editingOutcomeId.set(null); this.outcomeDraft = null;
    }
    cancelObjectiveEdit(): void {
        if (this.isBusy()) return;
        this.editingGoalId.set(null); this.editingOutcomeId.set(null);
        this.goalDraft = null; this.outcomeDraft = null;
    }

    async saveGoals(): Promise<void> {
        if (this.objectivesBlocked()) return;
        this.finishGoalEdit();
        const rows = this.goals.map((goal, index) => ({
            goal, payload: { noidung: this.goalContent(goal), ordering: index + 1, kyhieu: `CO${index + 1}` }
        })).filter(({ goal, payload }) => goal.noidung !== payload.noidung || goal.ordering !== payload.ordering || goal.kyhieu !== payload.kyhieu);
        if (!rows.length) return;
        await this.runOperation('Đang lưu mục tiêu chi tiết...', async version => {
            for (const { goal, payload } of rows) {
                await this.request(this.subjectMuctieuService.update(goal.id, payload), version);
                if (!this.isCurrent(version)) return;
                this.replaceGoal({ ...goal, ...payload });
                this.goalDrafts.delete(goal.id);
            }
            this.notificationService.toastSuccess('Đã lưu mục tiêu chi tiết.');
        }, 'Không thể lưu hết mục tiêu chi tiết. Nội dung chưa lưu được giữ lại để thử lại.');
    }

    async saveOutcomes(): Promise<void> {
        if (this.objectivesBlocked()) return;
        this.finishOutcomeEdit();
        const rows = this.outcomes.map((outcome, index) => ({
            outcome, payload: { noidung: this.outcomeContent(outcome), ordering: index + 1, kyhieu: `CLO${index + 1}` }
        })).filter(({ outcome, payload }) => outcome.noidung !== payload.noidung || outcome.ordering !== payload.ordering || outcome.kyhieu !== payload.kyhieu);
        if (!rows.length) return;
        await this.runOperation('Đang lưu chuẩn đầu ra...', async version => {
            for (const { outcome, payload } of rows) {
                await this.request(this.subjectCloService.update(outcome.id, payload), version);
                if (!this.isCurrent(version)) return;
                this.replaceOutcome({ ...outcome, ...payload });
                this.outcomeDrafts.delete(outcome.id);
            }
            this.notificationService.toastSuccess('Đã lưu chuẩn đầu ra.');
        }, 'Không thể lưu hết chuẩn đầu ra. Nội dung chưa lưu được giữ lại để thử lại.');
    }

    async addGoal(): Promise<void> {
        if (this.objectivesBlocked()) return;
        this.finishGoalEdit(); this.finishOutcomeEdit();
        const subjectId = this.selectedSubject()!.id;
        const ordering = Math.max(0, ...this.goals.map(item => item.ordering)) + 1;
        let created: SubjectMuctieuChitiet | null = null;
        const version = this.loadVersion;
        const saved = await this.runOperation('Đang thêm mục tiêu chi tiết...', async requestVersion => {
            const res = await this.request(this.subjectMuctieuService.add({ subject_id: subjectId, ordering, kyhieu: `CO${ordering}`, noidung: '' }), requestVersion);
            if (!this.isCurrent(requestVersion)) return;
            const id = this.getCreatedId(res);
            if (!id) throw new Error('Missing created objective');
            created = {
                id,
                subject_id: subjectId,
                ordering,
                kyhieu: `CO${ordering}`,
                noidung: res && typeof res === 'object' && 'noidung' in res ? String(res.noidung ?? '') : ''
            };
            this.goals = [...this.goals, created];
        }, 'Không thể thêm mục tiêu chi tiết.');
        if (saved && created && this.isCurrent(version)) this.beginGoalEdit(created);
    }
    async addOutcome(): Promise<void> {
        if (this.objectivesBlocked()) return;
        this.finishGoalEdit(); this.finishOutcomeEdit();
        const subjectId = this.selectedSubject()!.id;
        const ordering = Math.max(0, ...this.outcomes.map(item => item.ordering)) + 1;
        let created: SubjectClo | null = null;
        const version = this.loadVersion;
        const saved = await this.runOperation('Đang thêm chuẩn đầu ra...', async requestVersion => {
            const res = await this.request(this.subjectCloService.add({ subject_id: subjectId, ordering, kyhieu: `CLO${ordering}`, noidung: '', subject_muctieu_chitiet_id: null }), requestVersion);
            if (!this.isCurrent(requestVersion)) return;
            const id = this.getCreatedId(res);
            if (!id) throw new Error('Missing created outcome');
            created = {
                id,
                subject_id: subjectId,
                ordering,
                kyhieu: `CLO${ordering}`,
                noidung: res && typeof res === 'object' && 'noidung' in res ? String(res.noidung ?? '') : '',
                subject_muctieu_chitiet_id: null
            };
            this.outcomes = [...this.outcomes, created];
        }, 'Không thể thêm chuẩn đầu ra.');
        if (saved && created && this.isCurrent(version)) this.beginOutcomeEdit(created);
    }

    private async saveSubjectSection(payload: Partial<Subject>, fields: readonly SubjectField[], heading: string): Promise<void> {
        if (this.subjectInfoBlocked()) return;
        const current = this.selectedSubject()!;
        await this.runOperation(heading, async version => {
            await this.request(this.subjectService.update(current.id, payload), version);
            if (!this.isCurrent(version)) return;
            // PUT có thể chỉ trả ack/response cũ: payload mới luôn thắng cho field vừa lưu.
            const updated: Subject = { ...current, ...payload };
            this.selectedSubject.set(updated);
            for (const field of fields) this.form.controls[field].markAsPristine();
            this.subjectUpdated.emit(updated);
            this.notificationService.toastSuccess('Lưu thành công.');
        }, 'Lưu thất bại. Dữ liệu nhập vẫn được giữ để thử lại.');
    }

    async saveSubjectInfo(): Promise<void> {
        this.subjectInfoFields.forEach(key => this.form.controls[key].markAsTouched());
        if (this.subjectInfoInvalid() || this.subjectInfoBlocked()) return;
        const value = this.form.getRawValue();
        await this.saveSubjectSection({
            name: value.name.trim(), code: value.code.trim(), sotinchi: value.sotinchi!, sotinchi_th: value.sotinchi_th!
        }, this.subjectInfoFields, 'Đang lưu thông tin môn học...');
    }
    async saveExamFormat(): Promise<void> {
        await this.saveSubjectSection({ av: this.form.controls.av.value }, ['av'], 'Đang lưu định dạng kiểm tra...');
    }
    async saveLearningVolume(): Promise<void> {
        this.workloadFields.forEach(field => this.form.controls[field.key].markAsTouched());
        if (this.learningVolumeInvalid()) return;
        const params: SubjectParams = { ...this.selectedSubject()?.params };
        this.workloadFields.forEach(field => params[field.key] = this.form.controls[field.key].value);
        await this.saveSubjectSection({ params }, [], 'Đang lưu khối lượng học tập...');
    }
    async saveOutline(): Promise<void> {
        await this.saveSubjectSection({ desc: this.form.controls.desc.value, yeucau_sinhvien: this.form.controls.yeucau_sinhvien.value },
            ['desc', 'yeucau_sinhvien'], 'Đang lưu đề cương chi tiết...');
    }
    async saveGeneralObjective(): Promise<void> {
        await this.saveSubjectSection({ muctieu: this.form.controls.muctieu.value }, ['muctieu'], 'Đang lưu mục tiêu chung...');
    }
    async saveMaterials(): Promise<void> {
        await this.saveSubjectSection({
            tailieu_chinh: this.copyDocuments(this.materials.tailieu_chinh),
            tailieu_thamkhao: this.copyDocuments(this.materials.tailieu_thamkhao)
        }, [], 'Đang lưu tài liệu và học liệu...');
    }

    setOutcomeGoal(outcome: SubjectClo, goalId: number | null): void {
        if (this.objectivesBlocked()) return;
        if (goalId !== null && !this.goals.some(goal => goal.id === goalId)) return;
        if (outcome.subject_muctieu_chitiet_id === goalId) this.pendingOutcomeLinks.delete(outcome.id);
        else this.pendingOutcomeLinks.set(outcome.id, goalId);
    }
    async saveOutcomeLinks(): Promise<void> {
        if (this.objectivesBlocked()) return;
        const rows = this.outcomes.filter(outcome => this.pendingOutcomeLinks.has(outcome.id))
            .map(outcome => ({ outcome, goalId: this.pendingOutcomeLinks.get(outcome.id)! }));
        if (!rows.length) return;
        await this.runOperation('Đang lưu liên kết CO – CLO...', async version => {
            for (const { outcome, goalId } of rows) {
                if (goalId !== null && !this.goals.some(goal => goal.id === goalId)) throw new Error('Invalid goal');
                await this.request(this.subjectCloService.update(outcome.id, { subject_muctieu_chitiet_id: goalId }), version);
                if (!this.isCurrent(version)) return;
                this.replaceOutcome({ ...outcome, subject_muctieu_chitiet_id: goalId });
                this.pendingOutcomeLinks.delete(outcome.id);
            }
            this.notificationService.toastSuccess('Đã lưu liên kết CO – CLO.');
        }, 'Không thể lưu hết liên kết. Các lựa chọn chưa lưu được giữ lại.');
    }

    async removeGoal(index: number): Promise<void> {
        const item = this.goals[index];
        if (!item?.id || this.objectivesBlocked()) return;
        this.finishGoalEdit(); this.finishOutcomeEdit();
        await this.runOperation('Đang xóa mục tiêu chi tiết...', async version => {
            await this.request(this.subjectMuctieuService.delete(item.id), version);
            if (!this.isCurrent(version)) return;
            this.goals = this.goals.filter(goal => goal.id !== item.id);
            this.goalDrafts.delete(item.id);
            for (const [id, goalId] of this.pendingOutcomeLinks) {
                if (goalId === item.id) this.pendingOutcomeLinks.set(id, null);
            }
            for (const outcome of this.outcomes.filter(row => row.subject_muctieu_chitiet_id === item.id)) {
                await this.request(this.subjectCloService.update(outcome.id, { subject_muctieu_chitiet_id: null }), version);
                if (!this.isCurrent(version)) return;
                this.replaceOutcome({ ...outcome, subject_muctieu_chitiet_id: null });
            }
            await this.persistOrdering('goals', this.goals, version);
        }, 'Không thể hoàn tất xóa mục tiêu và đồng bộ các hàng còn lại.');
    }
    async removeOutcome(index: number): Promise<void> {
        const item = this.outcomes[index];
        if (!item?.id || this.objectivesBlocked()) return;
        this.finishGoalEdit(); this.finishOutcomeEdit();
        await this.runOperation('Đang xóa chuẩn đầu ra...', async version => {
            await this.request(this.subjectCloService.delete(item.id), version);
            if (!this.isCurrent(version)) return;
            this.outcomes = this.outcomes.filter(outcome => outcome.id !== item.id);
            this.outcomeDrafts.delete(item.id);
            this.pendingOutcomeLinks.delete(item.id);
            await this.persistOrdering('outcomes', this.outcomes, version);
        }, 'Không thể hoàn tất xóa chuẩn đầu ra và đồng bộ các hàng còn lại.');
    }
    private async persistOrdering(kind: ObjectiveKind, rows: SubjectMuctieuChitiet[] | SubjectClo[], version: number): Promise<void> {
        for (const [index, item] of rows.entries()) {
            if (!this.isCurrent(version)) return;
            const payload = { ordering: index + 1, kyhieu: `${kind === 'goals' ? 'CO' : 'CLO'}${index + 1}` };
            if (item.ordering === payload.ordering && item.kyhieu === payload.kyhieu) continue;
            if (kind === 'goals') {
                await this.request(this.subjectMuctieuService.update(item.id, payload), version);
                if (this.isCurrent(version)) this.replaceGoal({ ...item, ...payload });
            } else {
                await this.request(this.subjectCloService.update(item.id, payload), version);
                if (this.isCurrent(version)) this.replaceOutcome({ ...item as SubjectClo, ...payload });
            }
        }
    }
    async reorderRows(kind: ObjectiveKind): Promise<void> {
        if (this.objectivesBlocked()) return;
        this.finishGoalEdit(); this.finishOutcomeEdit();
        const rows = [...(kind === 'goals' ? this.goals : this.outcomes)];
        await this.runOperation('Đang cập nhật thứ tự...', version => this.persistOrdering(kind, rows, version),
            'Không thể cập nhật hết thứ tự. Nhấn Lưu để thử lại các hàng chưa lưu.');
    }

    selectItem(groupId: SubjectTemplateGroupId, itemId: SubjectTemplateSectionId): void {
        const group = this.groups.find(item => item.id === groupId);
        if (this.isBusy() || !group?.items.some(item => item.id === itemId)) return;
        this.finishGoalEdit(); this.finishOutcomeEdit();
        this.activeGroupId.set(groupId); this.activeItemId.set(itemId);
        this.collapsedGroups.update(ids => ids.filter(id => id !== groupId));
    }
    toggleGroup(groupId: SubjectTemplateGroupId): void { if (!this.isBusy()) this.collapsedGroups.update(ids => ids.includes(groupId) ? ids.filter(id => id !== groupId) : [...ids, groupId]); }
    onSidebarKeydown(event: KeyboardEvent, groupId: SubjectTemplateGroupId, index: number): void { const group = this.groups.find(item => item.id === groupId); if (!group || this.isBusy()) return; let target: number; switch (event.key) { case 'ArrowDown': target = (index + 1) % group.items.length; break; case 'ArrowUp': target = (index - 1 + group.items.length) % group.items.length; break; case 'Home': target = 0; break; case 'End': target = group.items.length - 1; break; default: return; } event.preventDefault(); const item = group.items[target]; this.selectItem(groupId, item.id); this.sidebarButtons().find(button => button.nativeElement.id === `subject-template-item-${item.id}`)?.nativeElement.focus(); }
    selectDescTab(tab: 'desc' | 'yeucau', button?: HTMLButtonElement): void { if (!this.isBusy()) { this.activeDescTab = tab; button?.focus(); } }

    private copyDocuments(items: DocumentFileAndLink[]): DocumentFileAndLink[] {
        return items.map((item, index) => ({
            ordering: index + 1, type: item.type, title: item.title || '',
            ...(item.type === 'file' ? { file: item.file ? { ...item.file } : undefined } : { link: item.link || '' })
        }));
    }
    addMaterialLink(group: MaterialGroup): void {
        if (this.subjectInfoBlocked()) return;
        const draft = this.materialLinkDrafts[group];
        if (!draft.title.trim() && !draft.link.trim()) return;
        this.materials[group] = [...this.materials[group], {
            id: this.nextRowId++, ordering: this.materials[group].length + 1,
            type: 'link', title: draft.title.trim() || draft.link.trim(), link: draft.link.trim()
        }];
        this.materialLinkDrafts[group] = { title: '', link: '' };
    }
    async chooseMaterialFiles(group: MaterialGroup): Promise<void> {
        if (this.subjectInfoBlocked()) return;
        const version = this.loadVersion;
        try {
            const files = await this.fileManager.openFileManagerNew({
                filesDefault: this.materials[group].filter(item => item.type === 'file' && item.file).map(item => ({ ...item.file! })),
                isMultipleMode: true
            });
            if (!this.isCurrent(version) || this.isBusy()) return;
            const existing = new Set(this.materials[group].filter(item => item.type === 'file').map(item => item.file?.id));
            const added: DraftMaterial[] = [];
            for (const file of files) {
                if (existing.has(file.id)) continue;
                existing.add(file.id);
                added.push({ id: this.nextRowId++, ordering: this.materials[group].length + added.length + 1, type: 'file', title: file.title || file.name, file: { ...file } });
            }
            this.materials[group] = [...this.materials[group], ...added];
        } catch (error) {
            // Dismiss của file manager không thay đổi danh sách; lỗi thực cần báo.
            if (error instanceof Error && this.isCurrent(version)) this.notificationService.toastError('Không thể chọn tệp tin.');
        }
    }
    removeMaterial(group: MaterialGroup, id: number): void {
        if (!this.subjectInfoBlocked()) this.materials[group] = this.materials[group].filter(item => item.id !== id);
    }
    close(): void {
        if (this.isBusy()) return;
        this.loadVersion++;
        this.cancelRequests$.next();
        this.closed = true;
        this.back.emit();
    }
}
