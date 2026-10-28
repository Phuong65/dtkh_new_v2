import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { HelperService } from '@core/services/helper.service';
import { NotificationService } from '@core-new/service/notification.service';
import { CourseCloContributeService } from '@modules/shared/services/course-clo-contribute.service';
import { CourseCloService } from '@modules/shared/services/course-clo.service';
import { CourseMuctieuChitietService } from '@modules/shared/services/course-muctieu-chitiet.service';
import { CtdtCdrService } from '@modules/shared/services/ctdt-cdr.service';
import { CtdtHocphanService } from '@modules/shared/services/ctdt-hocphan.service';
import { CtdtService } from '@modules/shared/services/ctdt.service';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { MonhocMuctieuCdrComponent } from './monhoc-muctieu-cdr.component';

describe('MonhocMuctieuCdrComponent tabs', () => {
    let fixture: ComponentFixture<MonhocMuctieuCdrComponent>;
    let component: MonhocMuctieuCdrComponent;
    let root: HTMLElement;
    const code$ = new BehaviorSubject(convertToParamMap({ code: '1' }));
    const service = {
        getKhoaHocByPageNew_2: () => of({ data: [{ id: 1, muctieu: 'Bản nháp' }] }),
        getUserProfileByPageNewV2: () => of({ data: [] }),
        getCourseMuctieuChitietByPageNew: () => of({ data: [] }),
        getCourseCloByPageNew: () => of({ data: [] }),
        getCourseCloContributeByPageNew: () => of({ data: [] }),
        getCtdtHocphanByPageNew: () => of({ data: [] }),
        getCtdtByPageNew: () => of({ data: [] }),
        getCtdtCdrByPageNew: () => of({ data: [] })
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MonhocMuctieuCdrComponent],
            providers: [
                provideNoopAnimations(),
                { provide: ActivatedRoute, useValue: { queryParamMap: code$, snapshot: { queryParamMap: convertToParamMap({ code: '1' }) } } },
                { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
                { provide: AuthService, useValue: { user: { id: 1 }, userHasRole: () => false, hasRouter: () => false } },
                { provide: NotificationService, useValue: { toastSuccess: jasmine.createSpy(), toastError: jasmine.createSpy(), toastWarning: jasmine.createSpy() } },
                { provide: HelperService, useValue: { sort: (items: unknown[]) => items } },
                ...[[ElnKhoaHocService, service], [ElngUserProfileService, service], [CourseMuctieuChitietService, service],
                    [CourseCloService, service], [CourseCloContributeService, service], [CtdtHocphanService, service],
                    [CtdtService, service], [CtdtCdrService, service]].map(([provide, useValue]) => ({ provide, useValue }))
            ]
        }).overrideComponent(MonhocMuctieuCdrComponent, {
            set: { imports: [CommonModule], schemas: [NO_ERRORS_SCHEMA] }
        }).compileComponents();

        fixture = TestBed.createComponent(MonhocMuctieuCdrComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
        root = fixture.nativeElement;
    });

    it('hiển thị ba tab liên kết đúng panel và roving tabindex', () => {
        const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
        expect(tabs.map(tab => tab.textContent?.trim())).toEqual(['Mục tiêu chung', 'CO / CLO', 'Kiểm tra đánh giá']);
        expect(tabs.map(tab => tab.getAttribute('aria-controls')))
            .toEqual(['cdr-panel-muc-tieu-chung', 'cdr-panel-co-clo', 'cdr-panel-kiem-tra-danh-gia']);
        tabs.forEach(tab => expect(root.querySelector('#' + tab.getAttribute('aria-controls'))?.getAttribute('aria-labelledby')).toBe(tab.id));
        expect(tabs.map(tab => tab.tabIndex)).toEqual([0, -1, -1]);
        expect(root.querySelector<HTMLElement>('#cdr-panel-muc-tieu-chung')?.hidden).toBeFalse();
        expect(root.querySelector<HTMLElement>('#cdr-panel-co-clo')?.hidden).toBeTrue();
    });

    it('hỗ trợ phím mũi tên, Home và End', () => {
        const tabs = root.querySelectorAll<HTMLButtonElement>('[role="tab"]');
        tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
        fixture.detectChanges();
        expect(component.activeSubTabId()).toBe('kiem-tra-danh-gia');
        tabs[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
        fixture.detectChanges();
        expect(component.activeSubTabId()).toBe('muc-tieu-chung');
        tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
        fixture.detectChanges();
        expect(component.activeSubTabId()).toBe('kiem-tra-danh-gia');
    });

    it('giữ bản nháp và chỉ khởi tạo một màn hình cấu hình sau lần mở đầu tiên', () => {
        component.generalObjectiveControl.setValue('Nội dung nháp');
        component.selectSubTab('kiem-tra-danh-gia');
        fixture.detectChanges();
        expect(component.settingsVisited()).toBeTrue();
        expect(root.querySelectorAll('app-monhoc-cauhinh').length).toBe(1);

        component.selectSubTab('co-clo');
        fixture.detectChanges();
        component.selectSubTab('kiem-tra-danh-gia');
        fixture.detectChanges();

        expect(root.querySelectorAll('app-monhoc-cauhinh').length).toBe(1);
        expect(component.generalObjectiveControl.value).toBe('Nội dung nháp');
    });
});
