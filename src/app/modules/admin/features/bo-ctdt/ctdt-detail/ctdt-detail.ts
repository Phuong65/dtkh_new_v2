import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, inject, signal, viewChildren } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Tooltip } from 'primeng/tooltip';
import { Subject as RxSubject, distinctUntilChanged, filter, map, switchMap, takeUntil } from 'rxjs';
import { LoadingProgressComponent } from '@core-new/components/loading-progress/loading-progress.component';
import { Ctdt } from '@modules/shared/models/ctdt';
import { CtdtThongtinComponent } from './children/ctdt-thongtin/ctdt-thongtin.component';
import { CtdtMuctieuCdrComponent } from './children/ctdt-muctieu-cdr/ctdt-muctieu-cdr.component';
import { CtdtCdrComponent } from './children/ctdt-cdr/ctdt-cdr.component';
import { CtdtNoidungComponent } from './children/ctdt-noidung/ctdt-noidung.component';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { CtdtService } from '@modules/shared/services/ctdt.service';
import { OvicQueryCondition } from '@core/models/dto';

export type CtdtTabId = 'thong-tin' | 'muc-tieu' | 'cdr' | 'noi-dung' | 'doi-ngu' | 'cau-hinh';

export interface CtdtTabItem {
    id: CtdtTabId;
    label: string;
    icon: string;
}

@Component({
    selector: 'app-ctdt-detail',
    standalone: true,
    imports: [CommonModule, Tooltip, LoadingProgressComponent, CtdtThongtinComponent, CtdtMuctieuCdrComponent, CtdtCdrComponent, CtdtNoidungComponent],
    templateUrl: './ctdt-detail.html',
    styleUrl: './ctdt-detail.css',
})
export class CtdtDetail implements OnInit, OnDestroy {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly ctdtService = inject(CtdtService);
    private readonly destroy$ = new RxSubject<void>(); 

    readonly tabButtons = viewChildren<ElementRef<HTMLButtonElement>>('tabButton');

    readonly tabs: readonly CtdtTabItem[] = [
        { id: 'thong-tin', label: 'Thông tin chung', icon: 'ti ti-info-circle' },
        { id: 'muc-tieu', label: 'Mục tiêu', icon: 'ti ti-target' },
        { id: 'cdr', label: 'CDR', icon: 'ti ti-certificate' },
        { id: 'noi-dung', label: 'Nội dung', icon: 'ti ti-book' },
        { id: 'doi-ngu', label: 'Đội ngũ', icon: 'ti ti-users' },
        { id: 'cau-hinh', label: 'Cấu hình', icon: 'ti ti-settings' }
    ];

    readonly activeTabId = signal<CtdtTabId>('thong-tin');
    readonly boId = signal<number | null>(null);
    readonly ctdtId = signal<number | null>(null);
    readonly selectedCtdt = signal<Ctdt | null>(null);
    readonly loadingCtdt = signal(false);
    readonly ctdtLoadError = signal('');
    readonly programName = signal<string>('Chương trình đào tạo');

    get activeTab(): CtdtTabItem {
        return this.tabs.find(tab => tab.id === this.activeTabId()) ?? this.tabs[0];
    }

    ngOnInit(): void {
        this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
            const boId = params.get('bo_id') ? Number(params.get('bo_id')) : null;
            const requestedTab = params.get('tab') as CtdtTabId;
            this.boId.set(boId);
            if (requestedTab && this.tabs.some(tab => tab.id === requestedTab)) {
                this.activeTabId.set(requestedTab);
            }
        });

        // CTĐT chỉ tải ở đây; thay đổi query param "tab" không kích hoạt request này.
        this.route.queryParamMap.pipe(
            map(params => params.get('code')),
            filter((code): code is string => !!code),
            distinctUntilChanged(),
            switchMap(code => {
                const id = Number(code);
                this.prepareCtdtLoad(id);
                return this.ctdtService.getCtdtByPageNew(this.createCtdtCondition(id));
            }),
            takeUntil(this.destroy$)
        ).subscribe({
            next: response => this.completeCtdtLoad(response.data?.[0] || null),
            error: () => this.failCtdtLoad()
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    selectTab(tabId: CtdtTabId): void {
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
        const queryParams = this.boId() ? { bo_id: this.boId() } : undefined;
        this.router.navigate(['/admin/dao-tao/bo-ctdt'], { queryParams });
    }

    retryLoadCtdt(): void {
        const id = this.ctdtId();
        if (id) this.loadCtdt(id);
    }

    onCtdtUpdated(updated: Ctdt): void {
        if (!updated) return;
        this.selectedCtdt.set(updated);
        if (updated.ten) {
            this.programName.set(updated.ten);
        }
    }

    private loadCtdt(id: number): void {
        this.prepareCtdtLoad(id);
        this.ctdtService.getCtdtByPageNew(this.createCtdtCondition(id)).pipe(takeUntil(this.destroy$)).subscribe({
            next: response => this.completeCtdtLoad(response.data?.[0] || null),
            error: () => this.failCtdtLoad()
        });
    }

    private prepareCtdtLoad(id: number): void {
        this.ctdtId.set(id);
        this.selectedCtdt.set(null);
        this.loadingCtdt.set(true);
        this.ctdtLoadError.set('');
    }

    private createCtdtCondition(id: number): ConditionOption {
        return {
            condition: [{ conditionName: 'id', condition: OvicQueryCondition.equal, value: String(id) }],
            set: [{ label: 'limit', value: '1' }],
            page: null
        };
    }

    private completeCtdtLoad(ctdt: Ctdt | null): void {
        this.selectedCtdt.set(ctdt);
        this.programName.set(ctdt?.ten || 'Chương trình đào tạo');
        this.loadingCtdt.set(false);
        if (!ctdt) this.ctdtLoadError.set('Không tìm thấy chương trình đào tạo.');
    }

    private failCtdtLoad(): void {
        this.selectedCtdt.set(null);
        this.loadingCtdt.set(false);
        this.ctdtLoadError.set('Không thể tải chương trình đào tạo. Vui lòng thử lại.');
    }
}
