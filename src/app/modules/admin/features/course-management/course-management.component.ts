import { CommonModule } from '@angular/common';
import { Component, DestroyRef, WritableSignal, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MatButtonModule } from '@angular/material/button';
import { forkJoin } from 'rxjs';
import { OvicConditionParam, OvicQueryCondition } from '@core/models/dto';
import { AppState } from '@core-new/models/app-state';
import { IctuDataTable2 } from '@core-new/models/datatable';
import { IctuPaginatorComponent } from '@core-new/components/ictu-paginator/ictu-paginator.component';
import { LoadingProgressComponent } from '@core-new/components/loading-progress/loading-progress.component';
import { AuthService } from '@core/services/auth.service';
import { DonVi } from '@modules/shared/models/don-vi';
import { Ctdt } from '@modules/shared/models/ctdt';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { CtdtService } from '@modules/shared/services/ctdt.service';
import { DonViService } from '@modules/shared/services/don-vi.service';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';

@Component({
    selector: 'app-course-management',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, InputTextModule, SelectModule, MatButtonModule,
        IctuPaginatorComponent, LoadingProgressComponent],
    templateUrl: './course-management.component.html',
    styleUrl: './course-management.component.css'
})
export class CourseManagementComponent {
    private readonly destroyRef = inject(DestroyRef);
    private readonly courseService = inject(ElnKhoaHocService);
    private readonly ctdtService = inject(CtdtService);
    private readonly donViService = inject(DonViService);
    private readonly auth = inject(AuthService);

    readonly state: WritableSignal<AppState> = signal('loading');
    readonly filterState: WritableSignal<AppState> = signal('loading');
    readonly errorMessage = signal('');
    readonly filterError = signal('');
    readonly searchValue = signal('');
    readonly categoryId = signal<number | null>(null);
    readonly ctdtId = signal<number | null>(null);
    readonly categories = signal<DonVi[]>([]);
    readonly programmes = signal<Ctdt[]>([]);
    readonly table = new IctuDataTable2<ElnKhoaHoc>({ rows: 20, pageLinkSize: 5 });

    private requestId = 0;

    constructor() {
        void this.auth;
    }

    ngOnInit(): void {
        this.loadFilterOptions();
        this.loadCourses(1, true);
    }

    private loadFilterOptions(): void {
        this.filterState.set('loading');
        const category: ConditionOption = {
            condition: [{ conditionName: 'status', condition: OvicQueryCondition.greaterThan, value: '0', orWhere: 'and' }],
            set: [{ label: 'limit', value: '-1' }, { label: 'orderby', value: 'title' }, { label: 'order', value: 'ASC' }],
            page: null
        };
        const programme: ConditionOption = {
            condition: [{ conditionName: 'status', condition: OvicQueryCondition.greaterThan, value: '-1', orWhere: 'and' }],
            set: [{ label: 'limit', value: '-1' }, { label: 'orderby', value: 'ten' }, { label: 'order', value: 'ASC' }],
            page: null
        };
        forkJoin({ categories: this.donViService.getDonviByPageNew(category), programmes: this.ctdtService.getCtdtByPageNew(programme) })
            .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
                next: response => {
                    this.categories.set(response.categories.data || []);
                    this.programmes.set(response.programmes.data || []);
                    this.filterState.set('success');
                },
                error: () => {
                    this.filterState.set('error');
                }
            });
    }

    loadCourses(page = 1, resetPaginator = false): void {
        const requestId = ++this.requestId;
        this.state.set('loading');
        this.errorMessage.set('');
        const conditions: OvicConditionParam[] = [
            { conditionName: 'status', condition: OvicQueryCondition.greaterThan, value: '-1', orWhere: 'and' }
        ];
        const query = this.searchValue().trim();
        if (query) conditions.push({ conditionName: 'title', condition: OvicQueryCondition.like, value: `%${query}%`, orWhere: 'and' });
        if (this.categoryId() !== null) conditions.push({ conditionName: 'category_ids', condition: OvicQueryCondition.equal, value: String(this.categoryId()), orWhere: 'and' });
        if (this.ctdtId() !== null) conditions.push({ conditionName: 'ctdt_id', condition: OvicQueryCondition.equal, value: String(this.ctdtId()), orWhere: 'and' });
        const option: ConditionOption = {
            condition: conditions,
            set: [{ label: 'limit', value: String(this.table.paginator.rows()) }, { label: 'orderby', value: 'created_at' }, { label: 'order', value: 'DESC' }],
            page: String(page)
        };
        this.courseService.getKhoaHocByPageNew_2(option).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: response => {
                if (requestId !== this.requestId) return;
                const total = Number(response.recordsFiltered) || 0;
                this.table.fillRawData({ data: response.data || [], recordsFiltered: total, recordsTotal: total, draw: 1 }, { paged: page, resetPaginator });
                this.state.set('success');
            },
            error: () => {
                if (requestId !== this.requestId) return;
                this.state.set('error');
                this.errorMessage.set('Không thể tải danh sách học phần. Vui lòng thử lại.');
            }
        });
    }

    onSearch(): void {
        this.searchValue.set(this.searchValue().trim());
        this.loadCourses(1, true);
    }

    onFilterChange(): void {
        if (this.ctdtId() !== null && this.categoryId() !== null) {
            const programme = this.programmes().find(item => item.id === this.ctdtId());
            if (programme && programme.category_id !== this.categoryId()) this.ctdtId.set(null);
        }
        this.loadCourses(1, true);
    }

    categoryName(id: number): string {
        return this.categories().find(item => item.id === id)?.title || '—';
    }

    programmeName(id: number): string {
        return this.programmes().find(item => item.id === id)?.ten || '—';
    }

    filteredProgrammes(): Ctdt[] {
        const categoryId = this.categoryId();
        return categoryId === null ? this.programmes() : this.programmes().filter(item => item.category_id === categoryId);
    }
}
