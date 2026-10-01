import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DonVi } from '@modules/shared/models/don-vi';
import {
    CopyHoidongCandidate,
    CopySelectedHoidongFailure,
    CopySelectedHoidongJobStatus,
    CopySelectedHoidongPreview,
    CopySelectedHoidongState,
    HoidongType
} from './sao-chep-hoidong.types';
import { forkJoin, Observable, of, Subject } from 'rxjs';
import { finalize, map, mergeMap, switchMap, takeUntil, takeWhile } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';
import { HoidongThamdinhService } from '@modules/shared/services/hoidong-thamdinh.service';
import { HoidongThamdinhMonhocService } from '@modules/shared/services/hoidong-thamdinh-monhoc.service';
import { HoidongThamdinhThanhvienService } from '@modules/shared/services/hoidong-thamhdinh-thanhvien.service';
import { HoidongThamdinhMonhocThanhvien } from '@modules/shared/models/hoidong-thamdinh-monhoc-thanhvien';
import { HoidongThamdinhMonhocThanhvienService } from '@modules/shared/services/hoidong-thamdinh-monhoc-thanhvien.service';
import { SharedModule } from '@modules/shared/shared.module';
import { TableModule } from 'primeng/table';
import { HoidongThamdinh } from '@modules/shared/models/hoidong-thamdinh';
import { HoidongThamdinhThanhvien } from '@modules/shared/models/hoidong-thamdinh-thanhvien';
import { HoidongThamdinhMonhoc } from '@modules/shared/models/hoidong-thamdinh-monhoc';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { User } from '@core/models/user';
import { HelperService } from '@core/services/helper.service';
import { OvicQueryCondition } from '@core/models/dto';
import { ConditionOption } from '@modules/shared/models/condition-option';

@Component({
    selector: 'app-sao-chep-hoidong',
    standalone: true,
    imports: [CommonModule, FormsModule, SharedModule, TableModule],
    templateUrl: './sao-chep-hoidong.component.html',
    styleUrls: ['./sao-chep-hoidong.component.css']
})
export class SaoChepHoidongComponent implements OnInit, OnDestroy {

    @Input() sourceType: HoidongType;

    @Input() targetType: HoidongType;

    @Input() categories: DonVi[] = [];

    @Input() showCategoryFilter: boolean = false;

    @Output() close = new EventEmitter<void>();

    @Output() completed = new EventEmitter<CopySelectedHoidongJobStatus>();

    state: CopySelectedHoidongState = 'idle';

    candidates: CopyHoidongCandidate[] = [];

    selectedIds = new Set<number>();

    searchValue: string = '';

    categoryId: number = null;

    preview: CopySelectedHoidongPreview = null;

    job: CopySelectedHoidongJobStatus = null;

    errorMessage: string = '';

    private requestSourceIds: number[] = [];

    private readonly destroy$ = new Subject<void>();

    constructor(
        private hoidongThamdinhService: HoidongThamdinhService,
        private hoidongThamdinhMonhocService: HoidongThamdinhMonhocService,
        private hoidongThamdinhThanhvienService: HoidongThamdinhThanhvienService,
        private hoidongThamdinhMonhocThanhvienService: HoidongThamdinhMonhocThanhvienService,
        private helperService: HelperService
    ) {
    }

    ngOnInit(): void {
        this.loadCandidates();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    get title(): string {
        return this.sourceType === 'celo'
            ? 'Sao chép CPI/Bài giảng sang hội đồng câu hỏi'
            : 'Sao chép hội đồng câu hỏi sang CPI/Bài giảng';
    }

    get selectedCount(): number {
        return this.selectedIds.size;
    }

    get isSelecting(): boolean {
        return ['candidateLoading', 'selecting', 'previewLoading'].includes(this.state)
            || (this.state === 'error' && !this.preview && !this.job);
    }

    get canStartJob(): boolean {
        return this.state === 'ready' && !!this.preview && this.preview.eligible_total > 0;
    }

    get progressPercent(): number {
        if (!this.job || !this.job.selected_total) {
            return 0;
        }
        return Math.min(100, Math.round(this.job.processed_total * 100 / this.job.selected_total));
    }

    get eligibleSourceIds(): number[] {
        if (this.preview && this.preview.eligible_source_ids && this.preview.eligible_source_ids.length) {
            return this.preview.eligible_source_ids;
        }
        if (!this.preview || !this.preview.skipped || !this.preview.skipped.length) {
            return [...this.requestSourceIds];
        }
        const skippedIds = new Set(this.preview.skipped.map(item => item.source_hoidong_id));
        return this.requestSourceIds.filter(id => !skippedIds.has(id));
    }

    loadCandidates(): void {
        this.state = 'candidateLoading';
        this.errorMessage = '';

        const condition: ConditionOption = {
            condition: [
                { conditionName: 'type', condition: OvicQueryCondition.equal, value: this.sourceType, orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '20' },
                { label: 'with', value: 'countthanhviens,countcourses' }
            ],
            page: '1'
        };

        if (this.searchValue.trim()) {
            condition.condition.push({
                conditionName: 'title', condition: OvicQueryCondition.like,
                value: '%' + this.searchValue.trim() + '%', orWhere: 'and'
            });
        }

        if (this.categoryId) {
            condition.condition.push({
                conditionName: 'category_id', condition: OvicQueryCondition.equal,
                value: this.categoryId.toString(), orWhere: 'and'
            });
        }

        this.hoidongThamdinhService.getHoidongThamdinhByPageNew(condition as any).pipe(
            takeUntil(this.destroy$),
            finalize(() => {
                if (this.state === 'candidateLoading') {
                    this.state = 'selecting';
                }
            })
        ).subscribe({
            next: result => {
                this.candidates = result.data.map((candidate: any, index: number) => ({
                    ...candidate,
                    index_: index + 1
                })) as CopyHoidongCandidate[];
                this.state = 'selecting';
            },
            error: () => {
                this.errorMessage = 'Không tải được danh sách hội đồng. Vui lòng thử lại.';
                this.state = 'error';
            }
        });
    }

    search(event: KeyboardEvent): void {
        if (event.key !== 'Enter') {
            return;
        }
        this.loadCandidates();
    }

    clearSearch(): void {
        if (!this.searchValue) {
            return;
        }
        this.searchValue = '';
        this.loadCandidates();
    }

    changeCategory(category: DonVi): void {
        this.categoryId = category ? category.id : null;
        this.loadCandidates();
    }

    isSelected(id: number): boolean {
        return this.selectedIds.has(id);
    }

    toggleSelected(candidate: CopyHoidongCandidate, checked: boolean): void {
        if (checked) {
            this.selectedIds.add(candidate.id);
        } else {
            this.selectedIds.delete(candidate.id);
        }
    }

    toggleCurrentPage(checked: boolean): void {
        this.candidates.forEach(candidate => {
            if (checked) {
                this.selectedIds.add(candidate.id);
            } else {
                this.selectedIds.delete(candidate.id);
            }
        });
    }

    isCurrentPageSelected(): boolean {
        return !!this.candidates.length && this.candidates.every(candidate => this.selectedIds.has(candidate.id));
    }

    previewSelection(): void {
        if (!this.selectedIds.size || this.state === 'previewLoading') {
            return;
        }

        this.requestSourceIds = [...this.selectedIds];
        this.preview = null;
        this.errorMessage = '';
        this.state = 'previewLoading';

        const sources = this.requestSourceIds.map(id =>
            this.hoidongThamdinhService.getHoidongThamdinhByPageNew({
                condition: [
                    { conditionName: 'id', condition: OvicQueryCondition.equal, value: id.toString() }
                ],
                set: [{ label: 'limit', value: '1' }],
                page: null
            }).pipe(
                switchMap((hdResult: any) => {
                    if (!hdResult.recordsFiltered) {
                        return of({
                            source: null,
                            members: [],
                            courses: []
                        } as PreviewSourceData);
                    }
                    const hd = hdResult.data[0];

                    const members$ = this.hoidongThamdinhThanhvienService.getHoidongThamdinhThanhvienByPageNew({
                        condition: [
                            { conditionName: 'hoidong_thamdinh_id', condition: OvicQueryCondition.equal, value: id.toString() }
                        ],
                        set: [{ label: 'limit', value: '-1' }, { label: 'with', value: 'user' }],
                        page: null
                    });

                    const courses$ = this.hoidongThamdinhMonhocService.getHoidongThamdinhMonhocByPageNew({
                        condition: [
                            { conditionName: 'hoidong_thamdinh_id', condition: OvicQueryCondition.equal, value: id.toString() }
                        ],
                        set: [{ label: 'limit', value: '-1' }, { label: 'with', value: 'course' }],
                        page: null
                    });

                    return forkJoin([of(hd), members$, courses$]).pipe(
                        map(([hdData, membersResult, coursesResult]) => ({
                            source: hdData,
                            members: membersResult.data || [],
                            courses: coursesResult.data || []
                        } as PreviewSourceData))
                    );
                })
            )
        );

        forkJoin(sources).pipe(
            takeUntil(this.destroy$)
        ).subscribe({
            next: results => {
                const skipped: CopySelectedHoidongPreview['skipped'] = [];
                const warnings: string[] = [];
                let eligibleIds: number[] = [];
                let councilMembers = 0;
                let councilCourses = 0;
                let courseMembers = 0;

                results.forEach((data: any, idx: number) => {
                    const sourceId = this.requestSourceIds[idx];

                    if (!data.source) {
                        skipped.push({
                            source_hoidong_id: sourceId,
                            code: '',
                            message: 'Không tìm thấy hội đồng'
                        });
                        return;
                    }

                    if (data.source.id_coppy) {
                        skipped.push({
                            source_hoidong_id: sourceId,
                            code: data.source.title,
                            message: 'Hội đồng đã được sao chép trước đó'
                        });
                        return;
                    }

                    eligibleIds.push(sourceId);
                    councilMembers += data.members.length;
                    councilCourses += data.courses.length;

                    data.courses.forEach((cm: any) => {
                        if (cm.thanhvien && cm.thanhvien.length) {
                            courseMembers += cm.thanhvien.length;
                        }
                    });
                });

                this.preview = {
                    selected_total: this.requestSourceIds.length,
                    eligible_total: eligibleIds.length,
                    skipped_total: skipped.length,
                    eligible_source_ids: eligibleIds,
                    council_members: councilMembers,
                    council_courses: councilCourses,
                    course_members: courseMembers,
                    skipped,
                    warnings
                };
                this.state = 'ready';
            },
            error: () => {
                this.errorMessage = 'Không thể kiểm tra dữ liệu đã chọn. Vui lòng thử lại.';
                this.state = 'error';
            }
        });
    }

    backToSelection(): void {
        this.preview = null;
        this.errorMessage = '';
        this.state = 'selecting';
    }

    startJob(): void {
        const sourceIds = this.eligibleSourceIds;
        if (!sourceIds.length || !this.canStartJob) {
            return;
        }

        this.state = 'jobCreating';
        this.errorMessage = '';
        this.job = null;

        const sources = sourceIds.map(id =>
            this.hoidongThamdinhService.getHoidongThamdinhByPageNew({
                condition: [
                    { conditionName: 'id', condition: OvicQueryCondition.equal, value: id.toString() }
                ],
                set: [{ label: 'limit', value: '1' }],
                page: null
            }).pipe(
                switchMap((hdResult: any) => {
                    if (!hdResult.recordsFiltered) {
                        return of({
                            source: null,
                            members: [],
                            courses: []
                        } as CopySourceData);
                    }
                    const hd = hdResult.data[0];

                    const members$ = this.hoidongThamdinhThanhvienService.getHoidongThamdinhThanhvienByPageNew({
                        condition: [
                            { conditionName: 'hoidong_thamdinh_id', condition: OvicQueryCondition.equal, value: id.toString() }
                        ],
                        set: [{ label: 'limit', value: '-1' }, { label: 'with', value: 'user' }],
                        page: null
                    });

                    const courses$ = this.hoidongThamdinhMonhocService.getHoidongThamdinhMonhocByPageNew({
                        condition: [
                            { conditionName: 'hoidong_thamdinh_id', condition: OvicQueryCondition.equal, value: id.toString() }
                        ],
                        set: [{ label: 'limit', value: '-1' }, { label: 'with', value: 'course' }],
                        page: null
                    });

                    return forkJoin([of(hd), members$, courses$]).pipe(
                        map(([hdData, membersResult, coursesResult]) => ({
                            source: hdData,
                            members: membersResult.data || [],
                            courses: coursesResult.data || []
                        } as CopySourceData))
                    );
                })
            )
        );

        forkJoin(sources).pipe(
            switchMap(results => this.copyAll(results)),
            takeUntil(this.destroy$)
        ).subscribe({
            next: result => {
                this.job = {
                    job_id: 'direct',
                    status: result.hasFailure ? 'partial_success' : 'completed',
                    selected_total: sourceIds.length,
                    processed_total: result.processed,
                    created_total: result.created,
                    skipped_total: result.skipped,
                    failed_total: result.failures.length,
                    created: {
                        hoidong: result.created,
                        thanhvien: result.membersCopied,
                        monhoc: result.coursesCopied,
                        monhoc_thanhvien: result.courseMembersCopied
                    },
                    failures: result.failures,
                    warnings: []
                };
                this.state = result.hasFailure ? 'partialSuccess' : 'success';
                this.completed.emit(this.job);
            },
            error: () => {
                this.errorMessage = 'Tác vụ sao chép thất bại. Vui lòng thử lại.';
                this.state = 'error';
            }
        });
    }

    retryFailures(): void {
        if (!this.job || !this.job.failures || !this.job.failures.length) {
            return;
        }
        const failedIds = this.job.failures.map((item: any) => item.source_hoidong_id);
        this.requestSourceIds = failedIds;
        this.preview = null;
        this.job = null;
        this.selectedIds = new Set(failedIds);
        this.state = 'selecting';
    }

    retryCurrentStep(): void {
        this.errorMessage = '';
        this.loadCandidates();
    }

    closePanel(): void {
        if (this.state === 'jobCreating') {
            return;
        }
        this.close.emit();
    }

    private copyAll(sources: CopySourceData[]): Observable<CopyResult> {
        let processed = 0;
        let created = 0;
        let skipped = 0;
        let membersCopied = 0;
        let coursesCopied = 0;
        let courseMembersCopied = 0;
        const failures: CopySelectedHoidongFailure[] = [];
        const total = sources.length;

        const results$: Observable<CopyResult>[] = sources.map((src: any) => {
            return this.copyOne(src).pipe(
                mergeMap((result: any) => {
                    processed++;
                    if (result.created) {
                        created++;
                        membersCopied += result.membersCount;
                        coursesCopied += result.coursesCount;
                        courseMembersCopied += result.courseMembersCount;
                    } else if (result.skipped) {
                        skipped++;
                    } else {
                        failures.push({
                            source_hoidong_id: src.source.id,
                            title: src.source.title,
                            code: src.source.title,
                            message: result.error || 'Lỗi không xác định'
                        } as CopySelectedHoidongFailure);
                    }

                    this.job = {
                        job_id: 'direct',
                        status: 'running',
                        selected_total: total,
                        processed_total: processed,
                        created_total: created,
                        skipped_total: skipped,
                        failed_total: failures.length,
                        created: {
                            hoidong: created,
                            thanhvien: membersCopied,
                            monhoc: coursesCopied,
                            monhoc_thanhvien: courseMembersCopied
                        },
                        failures: [...failures],
                        warnings: []
                    };
                    this.state = 'jobRunning';

                    return of({
                        created,
                        skipped,
                        processed,
                        membersCopied,
                        coursesCopied,
                        courseMembersCopied,
                        failures: [...failures],
                        hasFailure: failures.length > 0
                    } as CopyResult);
                })
            );
        });

        return forkJoin(results$).pipe(
            map((results: CopyResult[]) => results[results.length - 1])
        );
    }

    private copyOne(data: CopySourceData): Observable<CopyOneResult> {
        if (!data.source) {
            return of({ skipped: true } as CopyOneResult);
        }

        if (data.source.id_coppy) {
            return of({ skipped: true } as CopyOneResult);
        }

        const payload: any = {
            title: data.source.title,
            desc: data.source.desc,
            date_start: this.helperService.strToSQLDate(data.source.date_start),
            date_end: this.helperService.strToSQLDate(data.source.date_end),
            category_id: data.source.category_id,
            type: this.targetType,
            status: 0,
            id_coppy: data.source.id
        };

        return this.hoidongThamdinhService.addHoidongThamdinh(payload).pipe(
            mergeMap((newId: number) => {
                const memberRequests: Observable<any>[] = data.members
                    .filter((m: any) => m.user)
                    .map((m: any) => this.hoidongThamdinhThanhvienService.addHoidongThamdinhThanhvien({
                        user_id: m.user.user_id,
                        hoidong_thamdinh_id: newId
                    }));

                const courseRequests: Observable<{ courseId: number; monhocId: number }>[] = data.courses.map((cm: any) => {
                    return this.hoidongThamdinhMonhocService.addHoidongThamdinhMonhoc({
                        course_id: cm.course.id,
                        hoidong_thamdinh_id: newId
                    }).pipe(
                        mergeMap((newMonhocId: number) => {
                            const memberCmRequests: Observable<any>[] = (cm.thanhvien || [])
                                .filter((tv: any) => tv.user)
                                .map((tv: any) => this.hoidongThamdinhMonhocThanhvienService.addHoidongThamdinhMonhocThanhvien({
                                    hoidong_thamdinh_id: newId,
                                    hoidong_thamdinh_monhoc_id: newMonhocId,
                                    course_id: cm.course.id,
                                    user_id: tv.user.user_id,
                                    chutich: tv.chutich ? 1 : 0
                                }));

                            return forkJoin(memberCmRequests).pipe(
                                map(() => ({ courseId: cm.course.id, monhocId: newMonhocId }))
                            );
                        })
                    );
                });

                return forkJoin([forkJoin(memberRequests), forkJoin(courseRequests)]).pipe(
                    map(() => ({
                        created: true,
                        membersCount: memberRequests.length,
                        coursesCount: courseRequests.length,
                        courseMembersCount: courseRequests.reduce((sum: number, c: any) => {
                            const src = data.courses.find((dc: any) => dc.course.id === c.courseId);
                            return sum + (src && src.thanhvien ? src.thanhvien.length : 0);
                        }, 0)
                    } as CopyOneResult))
                );
            }),
            finalize(() => {
                this.hoidongThamdinhService.updateHoidongThamdinh(data.source.id, {
                    id_coppy: data.source.id_coppy || data.source.id
                }).subscribe();
            })
        );
    }

    checkboxValue(event: Event): boolean {
        return (event.target as HTMLInputElement).checked;
    }

    statusLabel(status: number): string {
        switch (status) {
            case 0: return 'Đang thiết lập';
            case 1: return 'Đang thực hiện';
            case 2: return 'Đã hoàn thành';
            default: return `Trạng thái ${status}`;
        }
    }

    statusBadgeClass(status: number): string {
        switch (status) {
            case 0: return 'copy-council-badge--status-0';
            case 1: return 'copy-council-badge--status-1';
            case 2: return 'copy-council-badge--status-2';
            default: return '';
        }
    }
}

interface PreviewSourceData {
    source: HoidongThamdinh | null;
    members: HoidongThamdinhThanhvien[];
    courses: { course: ElnKhoaHoc; thanhvien: any[] }[];
}

interface CopySourceData {
    source: HoidongThamdinh;
    members: HoidongThamdinhThanhvien[];
    courses: { course: ElnKhoaHoc; thanhvien: any[] }[];
}

interface CopyOneResult {
    created?: boolean;
    skipped?: boolean;
    error?: string;
    membersCount?: number;
    coursesCount?: number;
    courseMembersCount?: number;
}

interface CopyResult {
    created: number;
    skipped: number;
    processed: number;
    membersCopied: number;
    coursesCopied: number;
    courseMembersCopied: number;
    failures: CopySelectedHoidongFailure[];
    hasFailure: boolean;
}
