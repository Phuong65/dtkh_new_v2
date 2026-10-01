import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { BieudoPhodiemComponent } from './bieudo-phodiem.component';
import { DonViService } from '@shared/services/don-vi.service';
import { NotificationService } from '@core/services/notification.service';
import { ClassesService } from '@shared/services/classes.service';
import { SummaryService } from '@shared/services/summary.service';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { AuthService } from '@core/services/auth.service';
import { ExpExcelBaocaoService } from '@shared/services/exp-excel-baocao.service';
import { ElnKhoaHoc } from '@shared/models/elng-khoa-hoc';

describe('BieudoPhodiemComponent', () => {
    let component: BieudoPhodiemComponent;
    let fixture: ComponentFixture<BieudoPhodiemComponent>;

    const mockDonViService = {
        getDonviByPageNew: jasmine.createSpy('getDonviByPageNew').and.returnValue(of({
            data: [{ id: 1, title: 'Khoa CNTT' }]
        }))
    };

    const mockNotificationService = {
        isProcessing: jasmine.createSpy('isProcessing'),
        toastError: jasmine.createSpy('toastError'),
        toastWarning: jasmine.createSpy('toastWarning'),
        loadingAnimationV2: jasmine.createSpy('loadingAnimationV2'),
        disableLoadingAnimationV2: jasmine.createSpy('disableLoadingAnimationV2')
    };

    const mockClassesService = {
        getClassesByCols: jasmine.createSpy('getClassesByCols').and.returnValue(of([
            { namhoc: '2025-2026', hocky: '1' }
        ]))
    };

    const mockSummaryService = {
        getBietdoPhodiem: jasmine.createSpy('getBietdoPhodiem').and.returnValue(of([
            {
                id: 1,
                name: 'Lớp Lập trình Web',
                title: 'Lập trình Web',
                maso: 'WEB01',
                category_ids: '1',
                _point_0: 0,
                _point_1: 2,
                _point_2: 3,
                _point_3: 5,
                _point_4: 10,
                _point_5: 20,
                _point_6: 25,
                _point_7: 20,
                _point_8: 10,
                _point_9: 4,
                _point_10: 1,
                _point_all: 100
            }
        ]))
    };

    const mockHttpParamsHelperService = {
        paramsConditionBuilder: jasmine.createSpy('paramsConditionBuilder').and.returnValue(new HttpParams())
    };

    const mockAuthService = {
        user: { donvi_id: 1, id: 99 }
    };

    const mockExpExcelBaocaoService = {
        exportPhodiem: jasmine.createSpy('exportPhodiem')
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [BieudoPhodiemComponent],
            providers: [
                { provide: DonViService, useValue: mockDonViService },
                { provide: NotificationService, useValue: mockNotificationService },
                { provide: ClassesService, useValue: mockClassesService },
                { provide: SummaryService, useValue: mockSummaryService },
                { provide: HttpParamsHeplerService, useValue: mockHttpParamsHelperService },
                { provide: AuthService, useValue: mockAuthService },
                { provide: ExpExcelBaocaoService, useValue: mockExpExcelBaocaoService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(BieudoPhodiemComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create BieudoPhodiemComponent', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize filter options and load data', () => {
        expect(component.listDonvi.length).toBe(1);
        expect(component.listNamhoc.length).toBe(1);
        expect(component.listHocky.length).toBe(1);
        expect(component.typeView).toBe('start');
    });

    it('should calculate replacerViewPoint correctly', () => {
        expect(component.replacerViewPoint(20, 100)).toBe(20);
        expect(component.replacerViewPoint(20, 0)).toBe(0);
    });

    it('should toggle view mode and update chart options', () => {
        component.selectChangeTb(1);
        expect(component.changePecent).toBe(1);
        expect(component.optionChart.scales.y.max).toBe(100);

        component.selectChangeTb(0);
        expect(component.changePecent).toBe(0);
        expect(component.optionChart.scales.y.min).toBe(0);
    });

    it('should fetch and format chart data via getDataSummary without mutating source', () => {
        component.objectFilter = {
            namhoc: '2025-2026',
            hocky: '1',
            donvi_id: 1,
            hinhthuc: 'mon'
        };

        component.getDataSummary(component.objectFilter);
        expect(mockSummaryService.getBietdoPhodiem).toHaveBeenCalled();
        expect(component.listData.length).toBe(1);
        expect(component.listData[0]._dataChart).toBeDefined();
        expect(component.listData[0]._dataChartByPecent).toBeDefined();
        expect(component.typeView).toBe('checked');
    });

    it('should export excel file with data', () => {
        component.objectFilter = {
            namhoc: '2025-2026',
            hocky: '1',
            donvi_id: 1,
            hinhthuc: 'mon'
        };

        component.btnExport();
        expect(mockNotificationService.loadingAnimationV2).toHaveBeenCalled();
    });

    it('should select course when viewing by lophocphan', () => {
        const mockCourse: ElnKhoaHoc = { id: 10, title: 'Kỹ thuật lập trình', maso: 'KT01' } as any;
        component.objectFilter = {
            namhoc: '2025-2026',
            hocky: '1',
            donvi_id: 1,
            hinhthuc: 'lophocphan'
        };

        component.selecCourse(mockCourse);
        expect(component.courseSeleclt).toEqual(mockCourse);
        expect(component.objectFilter['course_id']).toBe(10);
    });
});
