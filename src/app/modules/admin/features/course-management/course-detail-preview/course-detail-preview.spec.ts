import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CourseDetailPreview } from './course-detail-preview';

describe('CourseDetailPreview', () => {
    let fixture: ComponentFixture<CourseDetailPreview>;
    let component: CourseDetailPreview;
    let root: HTMLElement;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CourseDetailPreview]
        }).compileComponents();

        fixture = TestBed.createComponent(CourseDetailPreview);
        component = fixture.componentInstance;
        root = fixture.nativeElement;
        fixture.detectChanges();
    });

    function groupTabs(): HTMLButtonElement[] {
        return Array.from(root.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
    }

    function sidebarItems(): HTMLButtonElement[] {
        return Array.from(root.querySelectorAll<HTMLButtonElement>('.course-detail-preview__item'));
    }

    function keydown(element: HTMLElement, key: string): void {
        element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
        fixture.detectChanges();
    }

    it('khởi tạo Nhóm A với mục Thông tin học phần', () => {
        expect(component).toBeTruthy();
        expect(component.activeGroupId()).toBe('outline');
        expect(component.activeItem().title).toBe('Thông tin học phần');
        expect(sidebarItems().map(item => item.textContent?.trim())).toEqual([
            '1Thông tin học phần',
            '2Mục tiêu và chuẩn đầu ra',
            '3Nội dung và kế hoạch giảng dạy',
            '4Thiết kế kiểm tra – đánh giá',
            '5Rà soát, phê duyệt và xuất đề cương'
        ]);
    });

    it('đổi Nhóm B và reset về Cấu hình bài kiểm tra', () => {
        groupTabs()[1].click();
        fixture.detectChanges();

        expect(component.activeGroupId()).toBe('question-bank');
        expect(component.activeItem().title).toBe('Cấu hình bài kiểm tra');
        expect(sidebarItems().map(item => item.textContent?.trim())).toEqual([
            '1Cấu hình bài kiểm tra',
            '2Ma trận câu hỏi theo CĐR/CPI',
            '3Ngân hàng câu hỏi',
            '4Form đề',
            '5Sinh và quản lý đề'
        ]);
    });

    it('cập nhật tiêu đề panel khi chọn mục sidebar', () => {
        sidebarItems()[3].click();
        fixture.detectChanges();

        expect(component.activeItem().title).toBe('Thiết kế kiểm tra – đánh giá');
        expect(root.querySelector('.course-detail-preview__panel-title')?.textContent?.trim())
            .toBe('Thiết kế kiểm tra – đánh giá');
    });

    it('điều hướng tab lớn bằng phím mũi tên, Home và End', () => {
        const tabs = groupTabs();

        keydown(tabs[0], 'ArrowRight');
        expect(component.activeGroupId()).toBe('question-bank');
        expect(document.activeElement).toBe(tabs[1]);

        keydown(tabs[1], 'Home');
        expect(component.activeGroupId()).toBe('outline');
        expect(document.activeElement).toBe(tabs[0]);

        keydown(tabs[0], 'End');
        expect(component.activeGroupId()).toBe('question-bank');
        expect(document.activeElement).toBe(tabs[1]);
    });

    it('điều hướng sidebar bằng phím mũi tên, Home và End', () => {
        const items = sidebarItems();

        keydown(items[0], 'ArrowDown');
        expect(component.activeItem().title).toBe('Mục tiêu và chuẩn đầu ra');
        expect(document.activeElement).toBe(items[1]);

        keydown(items[1], 'End');
        expect(component.activeItem().title).toBe('Rà soát, phê duyệt và xuất đề cương');
        expect(document.activeElement).toBe(items[4]);

        keydown(items[4], 'Home');
        expect(component.activeItem().title).toBe('Thông tin học phần');
        expect(document.activeElement).toBe(items[0]);
    });

    it('thiết lập trạng thái ARIA và không render form nghiệp vụ', () => {
        const tabs = groupTabs();
        expect(tabs[0].getAttribute('aria-selected')).toBe('true');
        expect(tabs[0].getAttribute('tabindex')).toBe('0');
        expect(tabs[1].getAttribute('aria-selected')).toBe('false');
        expect(tabs[1].getAttribute('tabindex')).toBe('-1');
        expect(root.querySelector('[role="tabpanel"]')?.getAttribute('aria-labelledby'))
            .toBe('course-preview-group-outline');
        expect(sidebarItems()[0].getAttribute('aria-current')).toBe('page');
        expect(root.querySelectorAll('form, input, textarea, select').length).toBe(0);
    });
});
