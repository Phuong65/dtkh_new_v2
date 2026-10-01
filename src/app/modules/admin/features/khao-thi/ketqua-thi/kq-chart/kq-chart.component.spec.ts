import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KqChartComponent } from './kq-chart.component';
import { Courses } from '@shared/services/courses.service';

describe('KqChartComponent', () => {
    let component: KqChartComponent;
    let fixture: ComponentFixture<KqChartComponent>;

    const mockCourse: Courses = {
        id: 1,
        title: 'Lập trình Web',
        maso: 'WEB01',
        _users: [
            {
                id: 10,
                display_name: 'Giảng viên A',
                _total_classes: '3',
                _total_students: '90',
                _point_all: 90,
                _point_1: 5,
                _point_2: 10,
                _point_3: 15,
                _point_4: 15,
                _point_5: 15,
                _point_6: 10,
                _point_7: 10,
                _point_8: 5,
                _point_9: 3,
                _point_10: 2,
                _point_cambothi: 0,
                _point_notDk: 0,
                _point_F: 5,
                _point_D: 10,
                _point_C: 25,
                _point_B: 30,
                _point_A: 20
            } as any
        ],
        _total_classes: 3,
        _total_students: 90
    } as any;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [KqChartComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(KqChartComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create KqChartComponent', () => {
        expect(component).toBeTruthy();
    });

    it('should build charts when dataParam is set', () => {
        component.dataParam = mockCourse;
        expect(component.course).toEqual(mockCourse);
        expect(component.listData.length).toBe(1);
        expect(component.dataChartClass.labels).toContain('Giảng viên A');
        expect(component.dataChartStudent.datasets[0].data).toEqual([90]);
        expect(component.dataChart.datasets.length).toBe(1);
    });

    it('should toggle view mode between count and percent', () => {
        component.dataParam = mockCourse;

        component.selectChangeTb(1);
        expect(component.changeViewPecent).toBe(1);
        expect(component.optionChart.scales.y.max).toBe(100);

        component.selectChangeTb(0);
        expect(component.changeViewPecent).toBe(0);
    });

    it('should format view points correctly with replacerViewPoint', () => {
        expect(component.replacerViewPoint(10, 0)).toBe('0%');
        expect(component.replacerViewPoint(10, 0, true)).toBe(0);
        expect(component.replacerViewPoint(25, 100)).toBe('25%');
        expect(component.replacerViewPoint(25, 100, true)).toBe(25);
    });
});
