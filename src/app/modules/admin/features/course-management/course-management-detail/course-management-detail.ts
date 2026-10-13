import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, inject, signal, viewChildren } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject as RxSubject, distinctUntilChanged, map, takeUntil } from 'rxjs';
import { LoadingProgressComponent } from '@core-new/components/loading-progress/loading-progress.component';
import { AppState } from '@core-new/models/app-state';
import { OvicQueryCondition } from '@core/models/dto';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';

export type CourseManagementTabId =
    | 'thong-tin'
    | 'muc-tieu-cdr'
    | 'noi-dung'
    | 'phan-bo-cdr-cau-hoi'
    | 'form-de'
    | 'kiem-tra-danh-gia'
    | 'cau-hinh';

export interface CourseManagementTabItem {
    id: CourseManagementTabId;
    label: string;
    icon: string;
}

@Component({
    selector: 'app-course-management-detail',
    standalone: true,
    imports: [CommonModule, LoadingProgressComponent],
    templateUrl: './course-management-detail.html',
    styleUrl: './course-management-detail.css',
})
export class CourseManagementDetail implements OnInit, OnDestroy {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly courseService = inject(ElnKhoaHocService);
    private readonly destroy$ = new RxSubject<void>();

    readonly tabButtons = viewChildren<ElementRef<HTMLButtonElement>>('tabButton');

    readonly tabs: readonly CourseManagementTabItem[] = [
        { id: 'thong-tin', label: 'Thông tin chung', icon: 'ti ti-info-circle' },
        { id: 'muc-tieu-cdr', label: 'Mục tiêu/CDR', icon: 'ti ti-target' },
        { id: 'noi-dung', label: 'Nội dung', icon: 'ti ti-book' },
        { id: 'phan-bo-cdr-cau-hoi', label: 'Phân bổ câu hỏi CDR', icon: 'ti ti-chart-donut' },
        { id: 'form-de', label: 'Form đề', icon: 'ti ti-file-description' },
        { id: 'kiem-tra-danh-gia', label: 'Kiểm tra - Đánh giá', icon: 'ti ti-clipboard-check' },
        { id: 'cau-hinh', label: 'Cấu hình', icon: 'ti ti-settings' }
    ];

    readonly activeTabId = signal<CourseManagementTabId>('thong-tin');
    readonly state = signal<AppState>('loading');
    readonly selectedCourse = signal<ElnKhoaHoc | null>(null);
    readonly errorMessage = signal('');
    readonly courseId = signal<number | null>(null);
    private readonly reload$ = new RxSubject<void>();

    ngOnInit(): void {
        this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
            const requestedTab = this.tabs.find(tab => tab.id === params.get('tab'));
            this.activeTabId.set(requestedTab?.id ?? 'thong-tin');
        });

        this.route.queryParamMap.pipe(
            map(params => Number(params.get('code'))),
            distinctUntilChanged(),
            takeUntil(this.destroy$)
        ).subscribe(id => this.loadCourse(id));
    }

    retryLoadCourse(): void {
        const id = this.courseId();
        if (id) this.loadCourse(id);
    }

    private loadCourse(id: number): void {
        this.reload$.next();
        this.selectedCourse.set(null);
        this.errorMessage.set('');

        if (!Number.isSafeInteger(id) || id <= 0) {
            this.courseId.set(null);
            this.errorMessage.set('ID học phần không hợp lệ.');
            this.state.set('error');
            return;
        }

        this.courseId.set(id);
        this.state.set('loading');
        const option: ConditionOption = {
            condition: [{ conditionName: 'id', condition: OvicQueryCondition.equal, value: String(id) }],
            set: [{ label: 'limit', value: '1' }],
            page: null
        };
        this.courseService.getKhoaHocByPageNew_2(option).pipe(
            takeUntil(this.reload$),
            takeUntil(this.destroy$)
        ).subscribe({
            next: response => {
                const course = response.data?.[0] ?? null;
                this.selectedCourse.set(course);
                this.errorMessage.set(course ? '' : 'Không tìm thấy học phần.');
                this.state.set(course ? 'success' : 'error');
            },
            error: () => {
                this.errorMessage.set('Không thể tải học phần. Vui lòng thử lại.');
                this.state.set('error');
            }
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.reload$.complete();
    }

    selectTab(tabId: CourseManagementTabId): void {
        if (this.activeTabId() === tabId) return;

        this.activeTabId.set(tabId);
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { tab: tabId },
            queryParamsHandling: 'merge',
            replaceUrl: true
        });
    }

    onTabKeydown(event: KeyboardEvent, index: number): void {
        let targetIndex: number | null = null;

        switch (event.key) {
            case 'ArrowRight':
                targetIndex = (index + 1) % this.tabs.length;
                break;
            case 'ArrowLeft':
                targetIndex = (index - 1 + this.tabs.length) % this.tabs.length;
                break;
            case 'Home':
                targetIndex = 0;
                break;
            case 'End':
                targetIndex = this.tabs.length - 1;
                break;
            default:
                return;
        }

        event.preventDefault();
        this.selectTab(this.tabs[targetIndex].id);
        this.tabButtons()[targetIndex]?.nativeElement.focus();
    }

    goBack(): void {
        this.router.navigate(['/admin/dao-tao/course-management']);
    }
}
