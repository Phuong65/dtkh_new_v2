import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { FileService } from '@core/services/file.service';
import { HelperService } from '@core/services/helper.service';
import { NotificationService } from '@core/services/notification.service';
import { UserService } from '@core/services/user.service';
import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';
import { CoursePlanCommentService } from '@modules/shared/services/course-plan-comment.service';
import { CourseQuestionsService } from '@modules/shared/services/course-questions.service';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputTextModule } from 'primeng/inputtext';
import { PanelModule } from 'primeng/panel';
import { Drawer } from 'primeng/drawer';
import { MatButtonModule } from '@angular/material/button';
import { ChuandauraComponent } from './chuandaura.component';

describe('ChuandauraComponent presentation', () => {
    let component: ChuandauraComponent;
    let fixture: ComponentFixture<ChuandauraComponent>;
    let root: HTMLElement;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ChuandauraComponent],
            providers: [
                provideNoopAnimations(),
                { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
                { provide: AuthService, useValue: { user: { id: 1 } } },
                { provide: NotificationService, useValue: jasmine.createSpyObj('NotificationService', ['isProcessing', 'toastSuccess', 'toastError', 'toastWarning']) },
                { provide: FileService, useValue: { getFileLocalAsBlob: () => of(new Blob(['[]'], { type: 'application/json' })) } },
                { provide: HelperService, useValue: { sort: (items: unknown[]) => items } },
                { provide: CoursePlanActivitiesService, useValue: jasmine.createSpyObj('CoursePlanActivitiesService', ['getCoursePlanActivitiesByPageNew', 'addCoursePlanActivities', 'updateCoursePlanActivities', 'deleteCoursePlanActivities']) },
                { provide: CoursePlanCommentService, useValue: { getCoursePlanCommentByPageNew: () => of({ data: [] }) } },
                { provide: CourseQuestionsService, useValue: { getCourseQuestionsByPageNew: () => of({ recordsFiltered: 0 }) } },
                { provide: UserService, useValue: {} }
            ]
        }).overrideComponent(ChuandauraComponent, {
            set: {
                imports: [CommonModule, FormsModule, ReactiveFormsModule, PanelModule, Drawer, MatButtonModule, MultiSelectModule, InputTextModule],
                schemas: [NO_ERRORS_SCHEMA]
            }
        }).compileComponents();

        fixture = TestBed.createComponent(ChuandauraComponent);
        component = fixture.componentInstance;
        component.courses = { id: 1 } as any;
        component.coursePlanActivities = { id: 10, week: 1, children: [] } as any;
        component.canAdded = true;
        component.listCDR = [];
        fixture.detectChanges();
        root = fixture.nativeElement;
    });

    it('khởi tạo thành công component', () => {
        expect(component).toBeTruthy();
        expect(root.querySelector('.cdr-page-header')).not.toBeNull();
    });

    it('hiển thị header và nút thêm CPI', () => {
        expect(root.querySelector('.cdr-page-header__title')?.textContent).toContain('Chuẩn đầu ra - CPIs');
        expect(root.querySelector('.cdr-page-header__eyebrow')).toBeNull();
        expect(root.querySelector('.cdr-guidance')).toBeNull();
        expect(root.querySelector('.cdr-list-overview')).toBeNull();
        const addButton = root.querySelector<HTMLButtonElement>('.cdr-add-button');
        expect(addButton).not.toBeNull();
        expect(addButton?.hasAttribute('mat-flat-button')).toBeTrue();
        expect(addButton?.classList.contains('ictu-badge-btn--success-reverse')).toBeTrue();
        expect(addButton?.textContent).toContain('Thêm CPI mới');
    });

    it('badge Đạt và Duyệt lúc dùng cùng kiểu hiển thị', () => {
        expect(root.querySelector('.cdr-approved-badge--time')).toBeNull();
        expect(root.querySelector('.cdr-approved-badge')).toBeNull();
    });

    it('bật mở form thêm CPI và gán giá trị mặc định cho ký hiệu', () => {
        expect(component.isOpenAddForm).toBeFalse();
        component.onOpenAddCdr();
        fixture.detectChanges();
        expect(component.isOpenAddForm).toBeTrue();
        expect(document.body.querySelector('.cdr-create-drawer')).not.toBeNull();
        expect(component.formCDR.controls['kyhieu'].value).toBe(1);
    });

    it('form thêm CPI mở trong drawer và đủ primitive ictu-form', () => {
        component.onOpenAddCdr();
        fixture.detectChanges();
        const drawer = document.body.querySelector<HTMLElement>('.cdr-create-drawer')!;
        const form = drawer.querySelector<HTMLFormElement>('.cdr-ictu-form.cdr-ictu-form--create')!;
        expect(drawer.querySelector('.p-drawer-title')?.textContent).toContain('Thêm CPI mới');
        expect(form).not.toBeNull();
        expect(form.classList.contains('ictu-form')).toBeTrue();
        expect(form.querySelectorAll('.ictu-form__row').length).toBe(7);
        expect(form.querySelectorAll('.ictu-form__label--required').length).toBe(7);
        expect(form.querySelector('.ovic-mark')).toBeNull();
        expect(form.querySelectorAll('input.ictu-form__input-field').length).toBe(3);
        expect(form.querySelector('.cdr-form-section + .cdr-form-section')).not.toBeNull();
        for (const field of ['title', 'code', 'method', 'desc-title']) {
            const input = form.querySelector<HTMLElement>('#cdr-create-' + field);
            expect(input).not.toBeNull();
            expect(form.querySelector<HTMLLabelElement>('label[for="cdr-create-' + field + '"]')).not.toBeNull();
        }
        expect(form.querySelector('ovic-groups-radio-v2')).not.toBeNull();
        expect(form.querySelector('app-list-editor')).not.toBeNull();
    });

    it('giữ điều kiện hiển thị hành động cũ, không đổi quyền trong lần sửa style', () => {
        component.canAdded = false;
        fixture.detectChanges();
        expect(root.querySelector('.cdr-page-header .cdr-add-button')).not.toBeNull();
        expect(root.querySelector('.cdr-empty-state__action')).toBeNull();
    });
});
