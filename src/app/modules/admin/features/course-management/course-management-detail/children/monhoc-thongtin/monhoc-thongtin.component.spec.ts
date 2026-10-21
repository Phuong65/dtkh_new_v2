import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { EMPTY } from 'rxjs';
import { MultiSelectModule } from 'primeng/multiselect';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { HelperService } from '@core/services/helper.service';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { ElnChuyenMucService } from '@modules/shared/services/elearning-chuyen-muc.service';
import { DonViService } from '@modules/shared/services/don-vi.service';
import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';
import { CtdtService } from '@modules/shared/services/ctdt.service';
import { CtdtConfigService } from '@modules/shared/services/ctdt-config.service';
import { CtdtHocphanService } from '@shared/services/ctdt-hocphan.service';
import { FilterPipe } from '@modules/shared/directives/filter.pipe';
import { MonhocThongtinComponent } from './monhoc-thongtin.component';

// Kiểm thử presentation bằng dữ liệu giả; không gọi API lưu hoặc thay đổi quan hệ CTĐT.
describe('MonhocThongtinComponent giao diện thống nhất', () => {
    let fixture: ComponentFixture<MonhocThongtinComponent>;
    let component: MonhocThongtinComponent;
    let root: HTMLElement;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MonhocThongtinComponent],
            providers: [
                provideNoopAnimations(),
                { provide: ActivatedRoute, useValue: { queryParamMap: EMPTY, snapshot: { queryParamMap: convertToParamMap({ code: '1' }) } } },
                { provide: Router, useValue: { url: '/hoc-phan?code=1' } },
                { provide: AuthService, useValue: { user: { id: 1 }, userHasRole: () => false, hasRouter: () => false } },
                { provide: NotificationService, useValue: { toastError: jasmine.createSpy('toastError') } },
                ...[ElnKhoaHocService, ElngUserProfileService, ElnChuyenMucService, DonViService,
                    HelperService, CoursePlanActivitiesService, CtdtService, CtdtConfigService, CtdtHocphanService]
                    .map(provide => ({ provide, useValue: {} }))
            ]
        }).overrideComponent(MonhocThongtinComponent, {
            set: {
                imports: [CommonModule, FormsModule, ReactiveFormsModule, MultiSelectModule, FilterPipe],
                schemas: [NO_ERRORS_SCHEMA]
            }
        }).compileComponents();

        fixture = TestBed.createComponent(MonhocThongtinComponent);
        component = fixture.componentInstance;
        root = fixture.nativeElement;
        component.list_nganh_bomon = [];
        component.list_donvi_chuyenmon = [];
        fixture.detectChanges();
    });

    function renderForm(): void {
        component.formKhoaHoc.patchValue({
            title: 'Học phần thử nghiệm', maso: 'HP01', category_ids: 1, sotinchi: 3, sotinchi_th: 0
        });
        component.state.set('success');
        fixture.detectChanges();
    }

    it('hiển thị đủ sáu nhóm, một nút lưu và thông tin nhanh', () => {
        renderForm();
        expect(Array.from(root.querySelectorAll('.mh-main > section')).map(section => section.id))
            .toEqual(['sec-info', 'sec-ctdt', 'sec-time', 'sec-eval', 'sec-desc', 'sec-docs']);
        expect(root.querySelectorAll('button[type="submit"]').length).toBe(1);
        expect(root.querySelector('.mh-overview')?.textContent).toContain('HP01');
        expect(root.querySelector('[role="main"]')).toBeNull();
    });

    for (const field of ['title', 'maso', 'category_ids', 'sotinchi', 'sotinchi_th']) {
        it(`hiển thị lỗi ${field} sau touched, không gửi form không hợp lệ`, () => {
            renderForm();
            component.f[field].setValue(null);
            fixture.detectChanges();
            expect(root.querySelector('.mh-field__error')).toBeNull();
            expect((root.querySelector('button[type="submit"]') as HTMLButtonElement).disabled).toBeTrue();
            component.f[field].markAsTouched();
            fixture.detectChanges();
            expect(root.querySelector('.mh-field__error')).not.toBeNull();
            expect(root.querySelector('[aria-invalid="true"]')).not.toBeNull();
        });
    }

    it('giữ tín chỉ thực hành bằng 0 là dữ liệu hợp lệ', () => {
        renderForm();
        expect(component.formKhoaHoc.valid).toBeTrue();
        expect((root.querySelector('button[type="submit"]') as HTMLButtonElement).disabled).toBeFalse();
    });

    it('chỉ gọi saveCourse một lần qua ngSubmit', () => {
        renderForm();
        const save = spyOn(component, 'saveCourse').and.resolveTo();
        (root.querySelector('button[type="submit"]') as HTMLButtonElement).click();
        expect(save).toHaveBeenCalledTimes(1);
    });

    it('hiển thị loading và khóa submit trong lúc lưu', () => {
        expect(root.querySelector('app-loading-progress')).not.toBeNull();
        renderForm();
        const save = spyOn(component, 'saveCourse').and.resolveTo();
        component.isSaving.set(true);
        fixture.detectChanges();
        const button = root.querySelector<HTMLButtonElement>('button[type="submit"]')!;
        expect(button.disabled).toBeTrue();
        expect(button.textContent).toContain('Đang lưu');
        expect(root.querySelector('app-loading-progress')).not.toBeNull();
        expect(root.querySelector('form')?.hasAttribute('inert')).toBeTrue();
        button.click();
        expect(save).not.toHaveBeenCalled();
        component.isSaving.set(false);
        fixture.detectChanges();
        expect(root.querySelector('form')?.hasAttribute('inert')).toBeFalse();
    });

    it('hiển thị thông báo lỗi cụ thể, tải lại bằng button', () => {
        const reload = spyOn(component, 'reloadData');
        component.errorMessage.set('Không tìm thấy học phần.');
        component.state.set('error');
        fixture.detectChanges();
        expect(root.querySelector('[role="alert"]')?.textContent).toContain('Không tìm thấy học phần.');
        root.querySelector<HTMLButtonElement>('.mh-error button')!.click();
        expect(reload).toHaveBeenCalledTimes(1);
        expect(root.querySelector('a[href="javascript:"]')).toBeNull();
    });

    it('giữ dữ liệu và metadata CTĐT khi đổi tab editor', () => {
        renderForm();
        component.group_ctdt = [{ label: 'Chương trình A', value: 1, items: [], select_item: 'KKT', hocky: 2 }];
        component.selectedCtdtsId = [1];
        component.onChangeSelectCtdt();
        fixture.detectChanges();
        expect(root.querySelector('tbody')?.textContent).toContain('Chương trình A');
        const original = component.selectCtdts[0];
        root.querySelector<HTMLButtonElement>('#tab-yeucau')!.click();
        fixture.detectChanges();
        expect(root.querySelector<HTMLElement>('#panel-desc')!.hidden).toBeTrue();
        expect(root.querySelector<HTMLElement>('#panel-yeucau')!.hidden).toBeFalse();
        expect(component.selectCtdts[0]).toBe(original);
        expect(component.selectCtdts[0].hocky).toBe(2);
        component.selectedCtdtsId = [];
        component.onChangeSelectCtdt();
        fixture.detectChanges();
        expect(root.querySelector('.mh-empty')?.textContent).toContain('Chưa liên kết');
    });

    it('chuyển tab bằng bàn phím và cập nhật tabindex', () => {
        renderForm();
        const first = root.querySelector<HTMLButtonElement>('#tab-desc')!;
        const second = root.querySelector<HTMLButtonElement>('#tab-yeucau')!;
        first.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        fixture.detectChanges();
        expect(component.activeDescTab).toBe('yeucau');
        expect(first.tabIndex).toBe(-1);
        expect(second.tabIndex).toBe(0);
    });

    it('giữ điều kiện khóa trường định danh của giảng viên', () => {
        component.routerDaotao = false;
        component.routerAdmin = false;
        component.routerLanhdaokhoa = false;
        component.routerLanhdaobomon = false;
        component.routerGiangvien = true;
        renderForm();
        for (const field of ['title', 'maso', 'sotinchi', 'sotinchi_th']) {
            expect(root.querySelector<HTMLInputElement>(`#${field}`)!.readOnly).toBeTrue();
            expect(root.querySelector<HTMLInputElement>(`#${field}`)!.disabled).toBeFalse();
        }
    });

    it('không hiển thị menu điều hướng từng phần', () => {
        renderForm();
        expect(root.querySelector('.mh-section-nav')).toBeNull();
    });
});
