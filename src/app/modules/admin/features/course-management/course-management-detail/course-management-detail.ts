import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, computed, inject, signal, viewChildren } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject as RxSubject, distinctUntilChanged, map, takeUntil } from 'rxjs';
import { LoadingProgressComponent } from '@core-new/components/loading-progress/loading-progress.component';
import { AppState } from '@core-new/models/app-state';
import { OvicQueryCondition } from '@core/models/dto';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { MonhocThongtinComponent } from './children/monhoc-thongtin/monhoc-thongtin.component';
import { MonhocMuctieuCdrComponent } from './children/monhoc-muctieu-cdr/monhoc-muctieu-cdr.component';
import { MonhocNoidungComponent } from './children/monhoc-noidung/monhoc-noidung.component';
import { MonhocQuestionCdrComponent } from './children/monhoc-question-cdr/monhoc-question-cdr.component';
import { MonhocFormdeComponent } from './children/monhoc-formde/monhoc-formde.component';
import { MonhocKiemtraDanhgiaComponent } from './children/monhoc-kiemtra-danhgia/monhoc-kiemtra-danhgia.component';

export type CourseManagementModeId = 'ke-hoach-giang-day' | 'kiem-tra-danh-gia';

export interface CourseManagementModeItem {
    id: CourseManagementModeId;
    label: string;
    icon: string;
}

export type CourseManagementTabId =
    | 'thong-tin'
    | 'muc-tieu-cdr'
    | 'noi-dung'
    | 'phan-bo-cdr-cau-hoi'
    | 'form-de'
    | 'sinh-de';

export interface CourseManagementTabItem {
    id: CourseManagementTabId;
    label: string;
    icon: string;
    mode: CourseManagementModeId;
}

export const COURSE_MANAGEMENT_MODES: readonly CourseManagementModeItem[] = [
    { id: 'ke-hoach-giang-day', label: 'Kế hoạch giảng dạy', icon: 'ti ti-book-2' },
    { id: 'kiem-tra-danh-gia', label: 'Kiểm tra đánh giá', icon: 'ti ti-clipboard-check' }
];

@Component({
    selector: 'app-course-management-detail',
    standalone: true,
    imports: [
        CommonModule,
        LoadingProgressComponent,
        MonhocThongtinComponent,
        MonhocMuctieuCdrComponent,
        MonhocNoidungComponent,
        MonhocQuestionCdrComponent,
        MonhocFormdeComponent,
        MonhocKiemtraDanhgiaComponent
    ],
    templateUrl: './course-management-detail.html',
    styleUrl: './course-management-detail.css',
})
export class CourseManagementDetail implements OnInit, OnDestroy {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly courseService = inject(ElnKhoaHocService);
    private readonly destroy$ = new RxSubject<void>();

    readonly tabButtons = viewChildren<ElementRef<HTMLButtonElement>>('tabButton');
    readonly modeButtons = viewChildren<ElementRef<HTMLButtonElement>>('modeButton');

    readonly modes = COURSE_MANAGEMENT_MODES;

    readonly tabs: readonly CourseManagementTabItem[] = [
        { id: 'thong-tin', label: 'Thông tin chung', icon: 'ti ti-info-circle', mode: 'ke-hoach-giang-day' },
        { id: 'muc-tieu-cdr', label: 'Mục tiêu/CDR', icon: 'ti ti-target', mode: 'ke-hoach-giang-day' },
        { id: 'noi-dung', label: 'Nội dung', icon: 'ti ti-book', mode: 'ke-hoach-giang-day' },
        { id: 'phan-bo-cdr-cau-hoi', label: 'Phân bổ câu hỏi CDR', icon: 'ti ti-chart-donut', mode: 'kiem-tra-danh-gia' },
        { id: 'form-de', label: 'Form đề', icon: 'ti ti-forms', mode: 'kiem-tra-danh-gia' },
        { id: 'sinh-de', label: 'Sinh đề', icon: 'ti ti-clipboard-check', mode: 'kiem-tra-danh-gia' }
    ];

    readonly activeModeId = signal<CourseManagementModeId>('ke-hoach-giang-day');
    readonly activeTabId = signal<CourseManagementTabId>('thong-tin');

    readonly visibleTabs = computed(() =>
        this.tabs.filter(tab => tab.mode === this.activeModeId())
    );

    readonly state = signal<AppState>('loading');
    readonly selectedCourse = signal<ElnKhoaHoc | null>(null);
    readonly errorMessage = signal('');
    readonly courseId = signal<number | null>(null);
    private readonly reload$ = new RxSubject<void>();

    ngOnInit(): void {
        this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
            const tabParam = params.get('tab');
            const modeParam = params.get('mode');

            const requestedTab = this.tabs.find(tab => tab.id === tabParam);
            if (requestedTab) {
                this.activeModeId.set(requestedTab.mode);
                this.activeTabId.set(requestedTab.id);
                return;
            }

            const requestedMode = this.modes.find(m => m.id === modeParam);
            if (requestedMode) {
                const firstTab = this.tabs.find(tab => tab.mode === requestedMode.id);
                this.activeModeId.set(requestedMode.id);
                this.activeTabId.set(firstTab?.id ?? 'thong-tin');
                return;
            }

            this.activeModeId.set('ke-hoach-giang-day');
            this.activeTabId.set('thong-tin');
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
        const targetTab = this.tabs.find(t => t.id === tabId);
        if (!targetTab) return;

        const targetMode = targetTab.mode;
        if (this.activeTabId() === tabId && this.activeModeId() === targetMode) return;

        this.activeModeId.set(targetMode);
        this.activeTabId.set(tabId);
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { tab: tabId, mode: targetMode },
            queryParamsHandling: 'merge',
            replaceUrl: true
        });
    }

    selectMode(modeId: CourseManagementModeId): void {
        if (this.activeModeId() === modeId) return;

        const firstTab = this.tabs.find(tab => tab.mode === modeId);
        if (firstTab) this.selectTab(firstTab.id);
    }

    onTabKeydown(event: KeyboardEvent, index: number): void {
        const currentTabs = this.visibleTabs();
        let targetIndex: number | null = null;

        switch (event.key) {
            case 'ArrowRight':
                targetIndex = (index + 1) % currentTabs.length;
                break;
            case 'ArrowLeft':
                targetIndex = (index - 1 + currentTabs.length) % currentTabs.length;
                break;
            case 'Home':
                targetIndex = 0;
                break;
            case 'End':
                targetIndex = currentTabs.length - 1;
                break;
            default:
                return;
        }

        event.preventDefault();
        this.selectTab(currentTabs[targetIndex].id);
        this.tabButtons()[targetIndex]?.nativeElement.focus();
    }

    onModeKeydown(event: KeyboardEvent, index: number): void {
        let targetIndex: number | null = null;

        switch (event.key) {
            case 'ArrowRight':
                targetIndex = (index + 1) % this.modes.length;
                break;
            case 'ArrowLeft':
                targetIndex = (index - 1 + this.modes.length) % this.modes.length;
                break;
            case 'Home':
                targetIndex = 0;
                break;
            case 'End':
                targetIndex = this.modes.length - 1;
                break;
            default:
                return;
        }

        event.preventDefault();
        this.selectMode(this.modes[targetIndex].id);
        this.modeButtons()[targetIndex]?.nativeElement.focus();
    }

    goBack(): void {
        this.router.navigate(['/admin/dao-tao/course-management']);
    }
}
