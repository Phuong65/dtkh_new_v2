import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { CourseManagementDetail } from './course-management-detail';

@Component({ selector: 'app-loading-progress', standalone: true, template: '' })
class MockLoadingProgressComponent {}

@Component({ selector: 'app-monhoc-thongtin', standalone: true, template: '' })
class MockMonhocThongtinComponent {}

@Component({ selector: 'app-monhoc-muctieu-cdr', standalone: true, template: '' })
class MockMonhocMuctieuCdrComponent {}

@Component({ selector: 'app-monhoc-noidung', standalone: true, template: '' })
class MockMonhocNoidungComponent {}

@Component({ selector: 'app-monhoc-question-cdr', standalone: true, template: '' })
class MockMonhocQuestionCdrComponent {}

@Component({ selector: 'app-monhoc-formde', standalone: true, template: '' })
class MockMonhocFormdeComponent {}

@Component({ selector: 'app-monhoc-kiemtra-danhgia', standalone: true, template: '' })
class MockMonhocKiemtraDanhgiaComponent {}

describe('CourseManagementDetail - Mode Switching', () => {
    let fixture: ComponentFixture<CourseManagementDetail>;
    let component: CourseManagementDetail;
    let root: HTMLElement;
    let queryParamMap$: BehaviorSubject<any>;
    let routerSpy: jasmine.SpyObj<Router>;
    let courseServiceSpy: jasmine.SpyObj<ElnKhoaHocService>;

    beforeEach(async () => {
        queryParamMap$ = new BehaviorSubject(convertToParamMap({ code: '10' }));
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        courseServiceSpy = jasmine.createSpyObj('ElnKhoaHocService', ['getKhoaHocByPageNew_2']);
        courseServiceSpy.getKhoaHocByPageNew_2.and.returnValue(
            of({ data: [{ id: 10, title: 'Lập trình Web' }] } as any)
        );

        await TestBed.configureTestingModule({
            imports: [CourseManagementDetail],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {
                        queryParamMap: queryParamMap$.asObservable()
                    }
                },
                { provide: Router, useValue: routerSpy },
                { provide: ElnKhoaHocService, useValue: courseServiceSpy }
            ]
        })
            .overrideComponent(CourseManagementDetail, {
                set: {
                    imports: [
                        MockLoadingProgressComponent,
                        MockMonhocThongtinComponent,
                        MockMonhocMuctieuCdrComponent,
                        MockMonhocNoidungComponent,
                        MockMonhocQuestionCdrComponent,
                        MockMonhocFormdeComponent,
                        MockMonhocKiemtraDanhgiaComponent
                    ]
                }
            })
            .compileComponents();

        fixture = TestBed.createComponent(CourseManagementDetail);
        component = fixture.componentInstance;
        root = fixture.nativeElement;
        fixture.detectChanges();
    });

    function tabButtons(): HTMLButtonElement[] {
        return Array.from(root.querySelectorAll<HTMLButtonElement>('.course-detail-tab'));
    }

    function modeButtons(): HTMLButtonElement[] {
        return Array.from(root.querySelectorAll<HTMLButtonElement>('.course-detail-mode-btn'));
    }

    function keydown(element: HTMLElement, key: string): void {
        element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
        fixture.detectChanges();
    }

    it('khởi tạo mặc định ở mode Kế hoạch giảng dạy với 3 tab đầu tiên', () => {
        expect(component).toBeTruthy();
        expect(component.activeModeId()).toBe('ke-hoach-giang-day');
        expect(component.activeTabId()).toBe('thong-tin');

        const tabs = tabButtons();
        expect(tabs.length).toBe(3);
        expect(tabs.map(btn => btn.querySelector('.course-detail-tab__label')?.textContent?.trim())).toEqual([
            'Thông tin chung',
            'Mục tiêu/CDR',
            'Nội dung'
        ]);

        const modes = modeButtons();
        expect(modes.length).toBe(2);
        expect(modes[0].getAttribute('aria-checked')).toBe('true');
        expect(modes[1].getAttribute('aria-checked')).toBe('false');
    });

    it('tự động nhận diện mode Kiểm tra đánh giá khi mở link cũ với tab=form-de', () => {
        queryParamMap$.next(convertToParamMap({ code: '10', tab: 'form-de' }));
        fixture.detectChanges();

        expect(component.activeModeId()).toBe('kiem-tra-danh-gia');
        expect(component.activeTabId()).toBe('form-de');

        const tabs = tabButtons();
        expect(tabs.length).toBe(3);
        expect(tabs.map(btn => btn.querySelector('.course-detail-tab__label')?.textContent?.trim())).toEqual([
            'Phân bổ câu hỏi CDR',
            'Form đề',
            'Sinh đề'
        ]);
        expect(modeButtons()[1].getAttribute('aria-checked')).toBe('true');
    });

    it('tự động nhận diện mode Kiểm tra đánh giá khi mở tab=sinh-de', () => {
        queryParamMap$.next(convertToParamMap({ code: '10', tab: 'sinh-de' }));
        fixture.detectChanges();

        expect(component.activeModeId()).toBe('kiem-tra-danh-gia');
        expect(component.activeTabId()).toBe('sinh-de');
    });

    it('chọn tab đầu tiên của mode khi query param chỉ có mode mà không có tab', () => {
        queryParamMap$.next(convertToParamMap({ code: '10', mode: 'kiem-tra-danh-gia' }));
        fixture.detectChanges();

        expect(component.activeModeId()).toBe('kiem-tra-danh-gia');
        expect(component.activeTabId()).toBe('phan-bo-cdr-cau-hoi');
    });

    it('giữ mode hợp lệ khi tab sai và dùng mặc định khi cả hai không hợp lệ', () => {
        queryParamMap$.next(convertToParamMap({ code: '10', mode: 'kiem-tra-danh-gia', tab: 'khong-co' }));
        fixture.detectChanges();
        expect(component.activeTabId()).toBe('phan-bo-cdr-cau-hoi');

        queryParamMap$.next(convertToParamMap({ code: '10', mode: 'khong-co', tab: 'khong-co' }));
        fixture.detectChanges();
        expect(component.activeModeId()).toBe('ke-hoach-giang-day');
        expect(component.activeTabId()).toBe('thong-tin');
    });

    it('ưu tiên tab hợp lệ khi mode và tab mâu thuẫn trên query param', () => {
        queryParamMap$.next(convertToParamMap({ code: '10', mode: 'ke-hoach-giang-day', tab: 'sinh-de' }));
        fixture.detectChanges();

        expect(component.activeModeId()).toBe('kiem-tra-danh-gia');
        expect(component.activeTabId()).toBe('sinh-de');
    });

    it('chuyển sang mode Kiểm tra đánh giá luôn mở tab đầu tiên và gọi router navigate', () => {
        modeButtons()[1].click();
        fixture.detectChanges();

        expect(component.activeModeId()).toBe('kiem-tra-danh-gia');
        expect(component.activeTabId()).toBe('phan-bo-cdr-cau-hoi');
        expect(routerSpy.navigate).toHaveBeenCalledWith([], {
            relativeTo: jasmine.anything(),
            queryParams: { tab: 'phan-bo-cdr-cau-hoi', mode: 'kiem-tra-danh-gia' },
            queryParamsHandling: 'merge',
            replaceUrl: true
        });
    });

    it('chuyển ngược lại mode Kế hoạch giảng dạy luôn mở tab đầu tiên', () => {
        component.selectMode('kiem-tra-danh-gia');
        fixture.detectChanges();

        component.selectMode('ke-hoach-giang-day');
        fixture.detectChanges();

        expect(component.activeModeId()).toBe('ke-hoach-giang-day');
        expect(component.activeTabId()).toBe('thong-tin');
    });

    it('không navigate lại khi click vào mode đang active', () => {
        routerSpy.navigate.calls.reset();
        modeButtons()[0].click();
        expect(routerSpy.navigate).not.toHaveBeenCalled();
    });

    it('chọn tab cập nhật cả tab và mode tương ứng vào query params', () => {
        tabButtons()[2].click();
        fixture.detectChanges();

        expect(component.activeTabId()).toBe('noi-dung');
        expect(component.activeModeId()).toBe('ke-hoach-giang-day');
        expect(routerSpy.navigate).toHaveBeenCalledWith([], {
            relativeTo: jasmine.anything(),
            queryParams: { tab: 'noi-dung', mode: 'ke-hoach-giang-day' },
            queryParamsHandling: 'merge',
            replaceUrl: true
        });
    });

    it('phím mũi tên trên tab chỉ xoay vòng trong 3 tab của mode hiện tại', () => {
        const tabs = tabButtons();

        keydown(tabs[0], 'ArrowLeft');
        expect(component.activeTabId()).toBe('noi-dung');

        keydown(tabs[2], 'ArrowRight');
        expect(component.activeTabId()).toBe('thong-tin');

        keydown(tabs[0], 'End');
        expect(component.activeTabId()).toBe('noi-dung');

        keydown(tabs[2], 'Home');
        expect(component.activeTabId()).toBe('thong-tin');
    });

    it('phím mũi tên trên mode switcher đổi mode tương ứng', () => {
        const modes = modeButtons();

        keydown(modes[0], 'ArrowRight');
        expect(component.activeModeId()).toBe('kiem-tra-danh-gia');
        expect(component.activeTabId()).toBe('phan-bo-cdr-cau-hoi');

        keydown(modes[1], 'ArrowLeft');
        expect(component.activeModeId()).toBe('ke-hoach-giang-day');
        expect(component.activeTabId()).toBe('thong-tin');
    });

    it('gán panel Sinh đề với tab Sinh đề theo ARIA', () => {
        queryParamMap$.next(convertToParamMap({ code: '10', tab: 'sinh-de' }));
        fixture.detectChanges();

        const panel = root.querySelector<HTMLElement>('#course-panel-sinh-de');
        expect(panel?.getAttribute('aria-labelledby')).toBe('course-tab-sinh-de');
    });
});
