import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, computed, inject, signal, viewChildren } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject as RxSubject, distinctUntilChanged, map, takeUntil } from 'rxjs';
import { LoadingProgressComponent } from '@core-new/components/loading-progress/loading-progress.component';
import { AppState } from '@core-new/models/app-state';
import { OvicConditionParam, OvicQueryCondition } from '@core/models/dto';
import { AuthService } from '@core/services/auth.service';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { ROLES } from '@modules/shared/utils/syscat';
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
    private readonly auth = inject(AuthService);
    private readonly titleService = inject(Title);
    private readonly initialPageTitle = this.titleService.getTitle();
    private currentPageTitle: string | null = null;
    private readonly destroy$ = new RxSubject<void>();

    readonly tabButtons = viewChildren<ElementRef<HTMLButtonElement>>('tabButton');
    readonly modeButtons = viewChildren<ElementRef<HTMLButtonElement>>('modeButton');

    readonly modes = COURSE_MANAGEMENT_MODES;
    readonly isLecturer: boolean;
    readonly lecturerModes = signal<readonly CourseManagementModeId[]>([]);
    readonly availableModes = computed(() => this.isLecturer && !this.lecturerModes().length ? [] : this.modes);

    readonly tabs: readonly CourseManagementTabItem[] = [
        { id: 'thong-tin', label: 'Thông tin chung', icon: 'ti ti-info-circle', mode: 'ke-hoach-giang-day' },
        { id: 'muc-tieu-cdr', label: 'Khung mục tiêu', icon: 'ti ti-target', mode: 'ke-hoach-giang-day' },
        { id: 'noi-dung', label: 'Nội dung giảng dạy', icon: 'ti ti-book', mode: 'ke-hoach-giang-day' },
        { id: 'phan-bo-cdr-cau-hoi', label: 'Ma trận câu hỏi CĐR', icon: 'ti ti-chart-donut', mode: 'kiem-tra-danh-gia' },
        { id: 'form-de', label: 'Form đề', icon: 'ti ti-forms', mode: 'kiem-tra-danh-gia' },
        { id: 'sinh-de', label: 'Sinh đề', icon: 'ti ti-clipboard-check', mode: 'kiem-tra-danh-gia' }
    ];

    readonly activeModeId = signal<CourseManagementModeId>('ke-hoach-giang-day');
    readonly activeTabId = signal<CourseManagementTabId>('thong-tin');

    readonly visibleTabs = computed(() => {
        const availableModeIds = this.availableModes().map(mode => mode.id);
        return this.tabs.filter(tab => tab.mode === this.activeModeId() && availableModeIds.includes(tab.mode));
    });
    readonly activeModeAllowed = computed(() => !this.isLecturer
        || this.lecturerModes().includes(this.activeModeId()));
    private hasExplicitViewSelection = false;

    constructor() {
        const elevatedRoles = [
            ROLES.admin,
            ROLES.manager,
            ROLES.troly_pdt,
            ROLES.chuyenvien_pdt,
            ROLES.daotao_new,
            ROLES.daotao_cv_1,
            ROLES.lanhdaokhoa,
            ROLES.lanhdaobomon
        ];
        this.isLecturer = this.auth.userHasRole(ROLES.giangvien)
            && !elevatedRoles.some(role => this.auth.userHasRole(role));
    }

    readonly state = signal<AppState>('loading');
    readonly selectedCourse = signal<ElnKhoaHoc | null>(null);
    readonly courseIdentity = computed(() => {
        const course = this.selectedCourse();
        const code = course?.maso?.trim();
        const name = course?.title?.trim();
        return [code ? `[${code}]` : '', name].filter(Boolean).join(' - ');
    });
    readonly courseHeading = computed(() =>
        this.courseIdentity() ? `Học phần - ${this.courseIdentity()}` : 'Học phần'
    );
    readonly errorMessage = signal('');
    readonly courseId = signal<number | null>(null);
    private readonly reload$ = new RxSubject<void>();

    ngOnInit(): void {
        this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
            const tabParam = params.get('tab');
            const modeParam = params.get('mode');
            this.hasExplicitViewSelection = !!tabParam || !!modeParam;

            const requestedTab = this.tabs.find(tab => tab.id === tabParam);
            if (requestedTab) {
                if (this.isLecturer && this.state() === 'success'
                    && !this.availableModes().some(mode => mode.id === requestedTab.mode)) {
                    this.selectFirstAvailableTab();
                    return;
                }
                this.activeModeId.set(requestedTab.mode);
                this.activeTabId.set(requestedTab.id);
                return;
            }

            const requestedMode = this.modes.find(m => m.id === modeParam);
            if (requestedMode) {
                if (this.isLecturer && this.state() === 'success'
                    && !this.availableModes().some(mode => mode.id === requestedMode.id)) {
                    this.selectFirstAvailableTab();
                    return;
                }
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

    private restorePageTitle(): void {
        if (this.currentPageTitle && this.titleService.getTitle() === this.currentPageTitle) {
            this.titleService.setTitle(this.initialPageTitle);
        }
        this.currentPageTitle = null;
    }

    private loadCourse(id: number): void {
        this.reload$.next();
        this.selectedCourse.set(null);
        this.lecturerModes.set([]);
        this.restorePageTitle();
        this.errorMessage.set('');

        if (!Number.isSafeInteger(id) || id <= 0) {
            this.courseId.set(null);
            this.errorMessage.set('ID học phần không hợp lệ.');
            this.state.set('error');
            return;
        }

        this.courseId.set(id);
        this.state.set('loading');
        const conditions: OvicConditionParam[] = [
            { conditionName: 'id', condition: OvicQueryCondition.equal, value: String(id), orWhere: 'and' }
        ];
        if (this.isLecturer) {
            const userId = String(this.auth.user.id);
            conditions.push(
                { conditionName: 'creator_plan_id', condition: OvicQueryCondition.equal, value: userId, orWhere: 'and' },
                { conditionName: 'id', condition: OvicQueryCondition.equal, value: String(id), orWhere: 'or' },
                { conditionName: 'creator_exam_id', condition: OvicQueryCondition.equal, value: userId, orWhere: 'and' }
            );
        }
        const option: ConditionOption = {
            condition: conditions,
            set: [{ label: 'limit', value: '1' }],
            page: null
        };
        this.courseService.getKhoaHocByPageNew_2(option).pipe(
            takeUntil(this.reload$),
            takeUntil(this.destroy$)
        ).subscribe({
            next: response => {
                const course = response.data?.[0] ?? null;
                if (course && !this.resolveLecturerAccess(course)) {
                    this.errorMessage.set('Bạn không được phân công vào học phần này.');
                    this.state.set('error');
                    return;
                }
                this.selectedCourse.set(course);
                if (course) {
                    this.currentPageTitle = [course.maso?.trim(), course.title?.trim()]
                        .filter(Boolean).join(' - ') || 'Học phần';
                    this.titleService.setTitle(this.currentPageTitle);
                }
                this.errorMessage.set(course ? '' : 'Không tìm thấy học phần hoặc bạn không được phân công.');
                this.state.set(course ? 'success' : 'error');
            },
            error: () => {
                this.errorMessage.set('Không thể tải học phần. Vui lòng thử lại.');
                this.state.set('error');
            }
        });
    }

    private selectFirstAvailableTab(): void {
        const firstTab = this.tabs.find(tab =>
            this.availableModes().some(mode => mode.id === tab.mode)
        );
        if (firstTab) this.selectTab(firstTab.id);
    }

    private resolveLecturerAccess(course: ElnKhoaHoc): boolean {
        if (!this.isLecturer) return true;

        const userId = String(this.auth.user.id);
        const allowedModes: CourseManagementModeId[] = [];
        if (String(course.creator_plan_id) === userId) allowedModes.push('ke-hoach-giang-day');
        if (String(course.creator_exam_id) === userId) allowedModes.push('kiem-tra-danh-gia');
        this.lecturerModes.set(allowedModes);
        if (!allowedModes.length) return false;

        if (!this.hasExplicitViewSelection) {
            const firstAssignedTab = this.tabs.find(tab => tab.mode === allowedModes[0]);
            if (firstAssignedTab) {
                this.activeModeId.set(firstAssignedTab.mode);
                this.activeTabId.set(firstAssignedTab.id);
            }
        }
        return true;
    }

    ngOnDestroy(): void {
        this.restorePageTitle();
        this.destroy$.next();
        this.destroy$.complete();
        this.reload$.complete();
    }

    selectTab(tabId: CourseManagementTabId): void {
        const targetTab = this.tabs.find(t => t.id === tabId);
        if (!targetTab || !this.availableModes().some(mode => mode.id === targetTab.mode)) return;

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
        if (this.activeModeId() === modeId || !this.availableModes().some(mode => mode.id === modeId)) return;

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
        const availableModes = this.availableModes();
        let targetIndex: number | null = null;

        switch (event.key) {
            case 'ArrowRight':
                targetIndex = (index + 1) % availableModes.length;
                break;
            case 'ArrowLeft':
                targetIndex = (index - 1 + availableModes.length) % availableModes.length;
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
        this.selectMode(availableModes[targetIndex].id);
        this.modeButtons()[targetIndex]?.nativeElement.focus();
    }

    goBack(): void {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        const allowedReturnUrls = [
            '/admin/dao-tao/quanly-monhoc',
            '/admin/giang-vien/quanly-monhoc',
            '/admin/lanhdao-khoa/quanly-monhoc',
            '/admin/lanhdao-bomon/quanly-monhoc',
            '/admin/dao-tao/course-management'
        ];
        if (returnUrl && allowedReturnUrls.includes(returnUrl)) {
            void this.router.navigateByUrl(returnUrl);
            return;
        }
        this.router.navigate(['/admin/dao-tao/course-management']);
    }
}
