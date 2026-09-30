import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, computed, HostListener, inject, OnInit, signal } from '@angular/core';
import { Dto, OvicQueryCondition } from '@core/models/dto';
import { AuthService } from '@core/services/auth.service';
import { FileService } from '@core/services/file.service';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { NotificationService } from '@core/services/notification.service';
import { getLinkDownload_aws, getRoute } from '@env';
import { OvicFileInfo } from '@modules/shared/models/file-store';
import { StudentFeedbackCategory } from '@modules/shared/models/student-feedback-category';
import { StudentFeedback } from '@modules/shared/models/student-feedback';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { ChartModule } from 'primeng/chart';
import { PaginatorModule } from 'primeng/paginator';
import { defer, forkJoin, Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Component({
    selector: 'app-gop-y-all',
    standalone: true,
    imports: [CommonModule, ChartModule, PaginatorModule],
    templateUrl: './gop-y-all.component.html',
    styleUrls: ['./gop-y-all.component.css']
})
export class GopYAllComponent implements OnInit {

    private readonly http = inject(HttpClient);
    private readonly authService = inject(AuthService);
    private readonly userProfileService = inject(ElngUserProfileService);
    private readonly httpParamsHelper = inject(HttpParamsHeplerService);
    readonly fileService = inject(FileService);
    private readonly notificationService = inject(NotificationService);

    readonly rows = 20;

    feedbacks = signal<StudentFeedback[]>([]);
    categories = signal<StudentFeedbackCategory[]>([]);
    page = signal(1);
    totalRecords = signal(0);
    selectedCategoryId = signal<number | null>(null);
    donviChuyenmonId = signal<number | null>(null);
    loading = signal(false);
    categoryLoading = signal(false);
    chartLoading = signal(false);
    chartError = signal(false);
    chartVisible = signal(true);
    chartData = signal<any>(null);
    chartSummary = signal<Array<{ label: string; value: number; color: string }>>([]);
    chartTotal = signal(0);
    previewImage = signal<OvicFileInfo | null>(null);
    mediaErrorKeys = signal(new Set<string>());
    mediaRetryVersions = signal(new Map<string, number>());
    downloadingFileIds = signal(new Set<number>());
    expandedContentIds = signal(new Set<number>());
    expandedAttachmentIds = signal(new Set<number>());
    readonly firstRecordIndex = computed(() => (this.page() - 1) * this.rows);
    readonly chartOptions: any = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                callbacks: {
                    label: context => {
                        const value = Number(context.raw) || 0;
                        const total = this.chartTotal();
                        const percent = total ? (value * 100 / total).toFixed(1) : '0.0';
                        return `${context.label}: ${value} danh mục (${percent}%)`;
                    }
                }
            }
        }
    };

    private readonly api = getRoute('student-feedbacks/');
    private readonly categoryApi = getRoute('student-feedback-categorys/');
    private readonly chartBatchSize = 1000;
    private readonly chartColors = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'];
    private chartFeedbacks = signal<StudentFeedback[]>([]);
    private categoriesLoaded = signal(false);
    private chartFeedbacksLoaded = signal(false);
    private activeApiRequests = 0;

    ngOnInit(): void {
        this.loadUserProfile();
    }

    loadData(page: number): void {
        if (!this.donviChuyenmonId()) {
            return;
        }

        this.page.set(page);
        this.loading.set(true);

        const conditions = [{
            conditionName: 'donvi_chuyenmon_id',
            condition: OvicQueryCondition.equal,
            value: this.donviChuyenmonId().toString()
        }];
        if (this.selectedCategoryId()) {
            conditions.push({
                conditionName: 'student_feedback_category_id',
                condition: OvicQueryCondition.equal,
                value: this.selectedCategoryId().toString()
            });
        }
        let params = this.httpParamsHelper.paramsConditionBuilder(conditions)
            .set('paged', page.toString())
            .set('limit', this.rows.toString())
            .set('orderby', 'created_at')
            .set('order', 'DESC');
        this.withApiAnimation(this.http.get<Dto>(this.api, { params }))
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: response => {
                    const feedbacks = Array.isArray(response.data) ? response.data as StudentFeedback[] : [];
                    this.feedbacks.set(feedbacks.map(feedback => ({
                        ...feedback,
                        attachments: this.parseAttachments(feedback.attachments)
                    })));
                    this.totalRecords.set(Number(response.recordsFiltered) || 0);
                },
                error: () => {
                    this.feedbacks.set([]);
                    this.totalRecords.set(0);
                    this.notificationService.toastError('Không tải được danh sách danh mục');
                }
            });
    }

    loadUserProfile(): void {
        this.withApiAnimation(
            this.userProfileService.getElngUserProfileByCol('user_id', this.authService.user.id.toString())
        ).subscribe({
                next: profiles => {
                    this.donviChuyenmonId.set(Number(profiles[0]?.donvi_chuyenmon_id) || null);
                    if (this.donviChuyenmonId()) {
                        this.loadData(1);
                        this.loadCategories();
                        this.loadChartFeedbacks();
                    } else {
                        this.notificationService.toastWarning('Tài khoản chưa có đơn vị chuyên môn');
                    }
                },
                error: () => {
                    this.donviChuyenmonId.set(null);
                    this.notificationService.toastError('Không tải được hồ sơ người dùng');
                }
            });
    }

    loadCategories(): void {
        if (!this.donviChuyenmonId()) {
            return;
        }

        this.categoryLoading.set(true);
        const params = new HttpParams()
            .set('limit', '-1')
            .set('orderby', 'name')
            .set('order', 'ASC');

        this.withApiAnimation(this.http.get<Dto>(this.categoryApi, { params }))
            .pipe(finalize(() => this.categoryLoading.set(false)))
            .subscribe({
                next: response => {
                    this.categories.set(Array.isArray(response.data) ? response.data : []);
                    this.categoriesLoaded.set(true);
                    this.buildChart();
                },
                error: () => {
                    this.categories.set([]);
                    this.categoriesLoaded.set(false);
                    this.notificationService.toastError('Không tải được danh mục');
                }
            });
    }

    loadChartFeedbacks(): void {
        if (!this.donviChuyenmonId()) {
            return;
        }

        this.chartLoading.set(true);
        this.chartError.set(false);
        this.chartFeedbacksLoaded.set(false);
        this.getChartFeedbackBatch(1).subscribe({
            next: firstResponse => {
                const firstData = Array.isArray(firstResponse.data) ? firstResponse.data as StudentFeedback[] : [];
                const total = Number(firstResponse.recordsFiltered) || firstData.length;
                const totalPages = Math.ceil(total / this.chartBatchSize);

                if (totalPages <= 1) {
                    this.finishChartLoading(firstData);
                    return;
                }

                const requests = Array.from({ length: totalPages - 1 }, (_, index) => this.getChartFeedbackBatch(index + 2));
                forkJoin(requests).subscribe({
                    next: responses => {
                        const remainingData = responses.reduce<StudentFeedback[]>((result, response) => {
                            return result.concat(Array.isArray(response.data) ? response.data as StudentFeedback[] : []);
                        }, []);
                        this.finishChartLoading(firstData.concat(remainingData).slice(0, total));
                    },
                    error: () => this.failChartLoading()
                });
            },
            error: () => this.failChartLoading()
        });
    }

    selectCategory(categoryId: number = null): void {
        this.selectedCategoryId.set(categoryId);
        this.loadData(1);
    }

    isContentExpanded(feedback: StudentFeedback): boolean {
        return this.expandedContentIds().has(feedback.id);
    }

    shouldShowExpand(feedback: StudentFeedback, contentElement: HTMLElement): boolean {
        return this.isContentExpanded(feedback)
            || (!!contentElement && contentElement.scrollWidth > contentElement.clientWidth);
    }

    toggleContentExpanded(feedback: StudentFeedback): void {
        if (this.isContentExpanded(feedback)) {
            this.expandedContentIds.update(ids => {
                const updatedIds = new Set(ids);
                updatedIds.delete(feedback.id);
                return updatedIds;
            });
        } else {
            this.expandedContentIds.update(ids => new Set(ids).add(feedback.id));
        }
    }

    isAttachmentExpanded(feedback: StudentFeedback): boolean {
        return this.expandedAttachmentIds().has(feedback.id);
    }

    toggleAttachmentExpanded(feedback: StudentFeedback): void {
        if (this.isAttachmentExpanded(feedback)) {
            this.expandedAttachmentIds.update(ids => {
                const updatedIds = new Set(ids);
                updatedIds.delete(feedback.id);
                return updatedIds;
            });
        } else {
            this.expandedAttachmentIds.update(ids => new Set(ids).add(feedback.id));
        }
    }

    formatRelativeTime(createdAt: string): string {
        const createdTime = new Date(createdAt).getTime();
        if (!Number.isFinite(createdTime)) {
            return '';
        }

        const elapsedMinutes = Math.max(0, Math.floor((Date.now() - createdTime) / 60000));
        if (elapsedMinutes < 1) {
            return 'Vừa xong';
        }
        if (elapsedMinutes < 60) {
            return `${elapsedMinutes} phút trước`;
        }

        const elapsedHours = Math.floor(elapsedMinutes / 60);
        if (elapsedHours < 24) {
            return `${elapsedHours} giờ trước`;
        }

        const elapsedDays = Math.floor(elapsedHours / 24);
        if (elapsedDays < 7) {
            return `${elapsedDays} ngày trước`;
        }

        const elapsedWeeks = Math.floor(elapsedDays / 7);
        if (elapsedWeeks < 4) {
            return `${elapsedWeeks} tuần trước`;
        }

        const elapsedMonths = Math.floor(elapsedDays / 30);
        return `${elapsedMonths} tháng trước`;
    }

    getCategoryCount(categoryId: number): number {
        return this.chartFeedbacks().filter(feedback => Number(feedback.student_feedback_category_id) === categoryId).length;
    }

    toggleChart(): void {
        this.chartVisible.update(visible => !visible);
    }

    onPageChange(event: { page?: number }): void {
        this.loadData((event.page ?? 0) + 1);
    }

    downloadAttachment(file: OvicFileInfo): void {
        if (typeof file.id !== 'number' || this.downloadingFileIds().has(file.id)) {
            return;
        }

        this.downloadingFileIds.update(ids => new Set(ids).add(file.id));
        this.withApiAnimation(this.fileService.AwsDownloadWithProgress(file.id, file.title || file.name))
            .pipe(finalize(() => this.downloadingFileIds.update(ids => {
                const updatedIds = new Set(ids);
                updatedIds.delete(file.id);
                return updatedIds;
            })))
            .subscribe({
                error: () => this.notificationService.toastError('Tải file đính kèm thất bại')
            });
    }

    isImageFile(file: OvicFileInfo): boolean {
        return (file.type || '').startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes((file.ext || '').toLowerCase());
    }

    isVideoFile(file: OvicFileInfo): boolean {
        return (file.type || '').startsWith('video/') || ['mp4', 'webm', 'ogg', 'mov', 'm4v'].includes((file.ext || '').toLowerCase());
    }

    getImageAttachments(files: OvicFileInfo[]): OvicFileInfo[] {
        return (files || []).filter(file => this.isImageFile(file));
    }

    getVideoAttachments(files: OvicFileInfo[]): OvicFileInfo[] {
        return (files || []).filter(file => this.isVideoFile(file));
    }

    getDocumentAttachments(files: OvicFileInfo[]): OvicFileInfo[] {
        return (files || []).filter(file => !this.isImageFile(file) && !this.isVideoFile(file));
    }

    getMediaUrl(file: OvicFileInfo): string {
        if (!file.name) {
            return '';
        }
        const key = this.getMediaKey(file);
        const retryVersion = this.mediaRetryVersions().get(key) || 0;
        return getLinkDownload_aws(file.name.concat(
            '?token=', this.authService.accessToken,
            retryVersion ? `&retry=${retryVersion}` : ''
        ));
    }

    hasMediaError(file: OvicFileInfo): boolean {
        return this.mediaErrorKeys().has(this.getMediaKey(file));
    }

    onMediaError(file: OvicFileInfo): void {
        this.mediaErrorKeys.update(keys => new Set(keys).add(this.getMediaKey(file)));
    }

    onMediaLoaded(file: OvicFileInfo): void {
        this.mediaErrorKeys.update(keys => {
            const updatedKeys = new Set(keys);
            updatedKeys.delete(this.getMediaKey(file));
            return updatedKeys;
        });
    }

    retryMedia(file: OvicFileInfo): void {
        const key = this.getMediaKey(file);
        this.mediaErrorKeys.update(keys => {
            const updatedKeys = new Set(keys);
            updatedKeys.delete(key);
            return updatedKeys;
        });
        this.mediaRetryVersions.update(versions => new Map(versions).set(key, (versions.get(key) || 0) + 1));
    }

    openVideoFullscreen(video: HTMLVideoElement): void {
        const videoWithWebkit = video as HTMLVideoElement & { webkitEnterFullscreen?: () => void };
        if (video.requestFullscreen) {
            void video.requestFullscreen();
        } else if (videoWithWebkit.webkitEnterFullscreen) {
            videoWithWebkit.webkitEnterFullscreen();
        }
    }

    openImagePreview(file: OvicFileInfo): void {
        this.previewImage.set(file);
    }

    closeImagePreview(): void {
        this.previewImage.set(null);
    }

    @HostListener('document:keydown.escape')
    onEscape(): void {
        this.closeImagePreview();
    }

    formatFileSize(size: number): string {
        return this.fileService.formatBytes(size);
    }

    getCategoryName(categoryId: number): string {
        return this.categories().find(category => category.id === categoryId)?.name || 'Khác';
    }

    private getMediaKey(file: OvicFileInfo): string {
        return String(file.id || file.name || '');
    }

    private parseAttachments(attachments: OvicFileInfo[] | string | null): OvicFileInfo[] {
        if (Array.isArray(attachments)) {
            return attachments;
        }
        if (typeof attachments !== 'string' || !attachments.trim()) {
            return [];
        }
        try {
            const parsed = JSON.parse(attachments);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    private getChartFeedbackBatch(page: number) {
        const params = this.httpParamsHelper.paramsConditionBuilder([{
            conditionName: 'donvi_chuyenmon_id',
            condition: OvicQueryCondition.equal,
            value: this.donviChuyenmonId().toString()
        }])
            .set('paged', page.toString())
            .set('limit', this.chartBatchSize.toString())
            .set('orderby', 'id')
            .set('order', 'ASC');

        return this.withApiAnimation(this.http.get<Dto>(this.api, { params }));
    }

    private withApiAnimation<T>(request: Observable<T>): Observable<T> {
        return defer(() => {
            this.activeApiRequests++;
            this.notificationService.isProcessing(true);
            return request.pipe(finalize(() => {
                this.activeApiRequests = Math.max(0, this.activeApiRequests - 1);
                if (this.activeApiRequests === 0) {
                    this.notificationService.isProcessing(false);
                }
            }));
        });
    }

    private finishChartLoading(feedbacks: StudentFeedback[]): void {
        this.chartFeedbacks.set(feedbacks);
        this.chartFeedbacksLoaded.set(true);
        this.chartLoading.set(false);
        this.buildChart();
    }

    private failChartLoading(): void {
        this.chartFeedbacks.set([]);
        this.chartFeedbacksLoaded.set(false);
        this.chartLoading.set(false);
        this.chartError.set(true);
        this.chartData.set(null);
        this.chartSummary.set([]);
        this.chartTotal.set(0);
    }

    private buildChart(): void {
        if (!this.categoriesLoaded() || !this.chartFeedbacksLoaded()) {
            return;
        }

        const countByCategory = new Map<number, number>();
        this.chartFeedbacks().forEach(feedback => {
            const categoryId = Number(feedback.student_feedback_category_id) || 0;
            countByCategory.set(categoryId, (countByCategory.get(categoryId) || 0) + 1);
        });

        const categories = this.categories();
        const chartFeedbacks = this.chartFeedbacks();
        const knownCategoryIds = new Set(categories.map(category => category.id));
        const rows = categories.map(category => ({
            label: category.name,
            value: countByCategory.get(category.id) || 0
        }));
        const unclassifiedValue = chartFeedbacks.reduce((total, feedback) => {
            return total + (knownCategoryIds.has(Number(feedback.student_feedback_category_id)) ? 0 : 1);
        }, 0);
        if (unclassifiedValue) {
            rows.push({ label: 'Khác', value: unclassifiedValue });
        }

        const visibleRows = rows.slice(0, 7);
        if (rows.length > 8) {
            visibleRows.push({
                label: 'Khác',
                value: rows.slice(7).reduce((total, row) => total + row.value, 0)
            });
        } else if (rows.length === 8) {
            visibleRows.push(rows[7]);
        }

        this.chartTotal.set(chartFeedbacks.length);
        const chartSummary = visibleRows.map((row, index) => ({
            ...row,
            color: this.chartColors[index]
        }));
        this.chartSummary.set(chartSummary);
        this.chartData.set(chartFeedbacks.length ? {
            labels: chartSummary.map(row => row.label),
            datasets: [{
                data: chartSummary.map(row => row.value),
                backgroundColor: chartSummary.map(row => row.color),
                borderColor: '#ffffff',
                borderWidth: 2,
                hoverOffset: 5
            }]
        } : null);
        this.chartError.set(false);
    }

    trackByFeedback(index: number, feedback: StudentFeedback): number {
        return feedback.id || index;
    }

    trackByFile(index: number, file: OvicFileInfo): number | string {
        return file.id || file.name || index;
    }

    trackByCategory(index: number, category: StudentFeedbackCategory): number {
        return category.id || index;
    }
}
