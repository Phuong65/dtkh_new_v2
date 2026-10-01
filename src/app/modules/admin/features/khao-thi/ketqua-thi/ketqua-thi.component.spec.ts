import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { KetquaThiComponent } from './ketqua-thi.component';
import { NotificationService } from '@core/services/notification.service';
import { SummaryService } from '@shared/services/summary.service';
import { ClassesService } from '@shared/services/classes.service';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { DonViService } from '@shared/services/don-vi.service';
import { AuthService } from '@core/services/auth.service';
import { Courses } from '@shared/services/courses.service';

describe('KetquaThiComponent', () => {
    let component: KetquaThiComponent;
    let fixture: ComponentFixture<KetquaThiComponent>;
    let screenSizeSubject: Subject<{ width: number, height: number }>;

    const mockNotificationService = {
        observeScreenSize: of({ width: 1200, height: 800 }),
        isProcessing: jasmine.createSpy('isProcessing'),
        toastError: jasmine.createSpy('toastError'),
        openSideNavigationMenu: jasmine.createSpy('openSideNavigationMenu'),
        closeSideNavigationMenu: jasmine.createSpy('closeSideNavigationMenu')
    };

    const mockSummaryService = {
        getKhaothiKetquathi: jasmine.createSpy('getKhaothiKetquathi').and.returnValue(of([
            { id: 1, title: 'Toán cao cấp', maso: 'MATH01', _total_students: 120, _point_all: 120, _point_F: 5, _point_D: 10, _point_C: 30, _point_B: 45, _point_A: 30 } as unknown as Courses
        ]))
    };

    const mockClassesService = {
        getClassesByCols: jasmine.createSpy('getClassesByCols').and.returnValue(of([
            { namhoc: '2025-2026', hocky: '1' }
        ]))
    };

    const mockHttpParamsHelperService = {
        paramsConditionBuilder: jasmine.createSpy('paramsConditionBuilder').and.returnValue(new HttpParams())
    };

    const mockDonViService = {
        getDonviByPageNew: jasmine.createSpy('getDonviByPageNew').and.returnValue(of({
            data: [{ id: 1, title: 'Khoa CNTT' }]
        }))
    };

    const mockAuthService = {
        user: { donvi_id: 1, id: 99, display_name: 'Admin' }
    };

    beforeEach(async () => {
        screenSizeSubject = new Subject<{ width: number, height: number }>();
        mockNotificationService.observeScreenSize = screenSizeSubject.asObservable();

        await TestBed.configureTestingModule({
            imports: [KetquaThiComponent],
            providers: [
                { provide: NotificationService, useValue: mockNotificationService },
                { provide: SummaryService, useValue: mockSummaryService },
                { provide: ClassesService, useValue: mockClassesService },
                { provide: HttpParamsHeplerService, useValue: mockHttpParamsHelperService },
                { provide: DonViService, useValue: mockDonViService },
                { provide: AuthService, useValue: mockAuthService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(KetquaThiComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create KetquaThiComponent', () => {
        expect(component).toBeTruthy();
    });

    it('should load initial filter options and list data', () => {
        expect(component.listDonvi.length).toBeGreaterThan(0);
        expect(component.listNamhoc.length).toBeGreaterThan(0);
        expect(component.listHocky.length).toBeGreaterThan(0);
        expect(component.listData.length).toBe(1);
    });

    it('should clean up subscriptions on destroy', () => {
        spyOn(component.subscription, 'unsubscribe');
        component.ngOnDestroy();
        expect(component.subscription.unsubscribe).toHaveBeenCalled();
    });

    it('should toggle view mode between score and percentage', () => {
        component.selectChangeTb(1);
        expect(component.changeView).toBe(1);
        expect(component.replacerViewPoint(20, 100)).toBe('20%');
        expect(component.replacerViewPoint(20, 0)).toBe('0%');

        component.selectChangeTb(0);
        expect(component.changeView).toBe(0);
    });

    it('should open and close course chart sidebar', () => {
        const sampleRow = { id: 1, title: 'Toán', maso: 'T1' } as Courses;
        component.viewClassAndChart(sampleRow);
        expect(component.courseSelect).toEqual(sampleRow);
        expect(mockNotificationService.openSideNavigationMenu).toHaveBeenCalled();

        component.closeForm();
        expect(mockNotificationService.closeSideNavigationMenu).toHaveBeenCalled();
    });
});
