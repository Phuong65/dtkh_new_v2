import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, inject, signal, viewChildren } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Tooltip } from 'primeng/tooltip';
import { Subject as RxSubject, takeUntil } from 'rxjs';
import { CtdtThongtinComponent } from './children/ctdt-thongtin/ctdt-thongtin.component';
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
    imports: [CommonModule, Tooltip, CtdtThongtinComponent],
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
    readonly programName = signal<string>('Chương trình đào tạo');

    get activeTab(): CtdtTabItem {
        return this.tabs.find(tab => tab.id === this.activeTabId()) ?? this.tabs[0];
    }

    ngOnInit(): void {
        this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
            const boId = params['bo_id'] ? Number(params['bo_id']) : null;
            const code = params['code'] ? Number(params['code']) : null;
            const requestedTab = params['tab'] as CtdtTabId;

            this.boId.set(boId);
            if (requestedTab && this.tabs.some(tab => tab.id === requestedTab)) {
                this.activeTabId.set(requestedTab);
            }

            if (code && code !== this.ctdtId()) {
                this.ctdtId.set(code);
                this.loadProgramName(code);
            }
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

    private loadProgramName(id: number): void {
        const condition: ConditionOption = {
            condition: [{ conditionName: 'id', condition: OvicQueryCondition.equal, value: String(id) }],
            set: [{ label: 'limit', value: '1' }],
            page: null
        };

        this.ctdtService.getCtdtByPageNew(condition).pipe(takeUntil(this.destroy$)).subscribe({
            next: response => this.programName.set(response.data?.[0]?.ten || 'Chương trình đào tạo')
        });
    }
}
