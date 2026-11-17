import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AbstractControl } from '@angular/forms';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { Subject as RxSubject, of, throwError } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { HelperService } from '@core/services/helper.service';
import { NotificationService } from '@core-new/service/notification.service';
import { BoCtdt } from '@modules/shared/models/bo-ctdt';
import { Subject } from '@modules/shared/models/subject';
import { BoCtdtService } from '@modules/shared/services/bo-ctdt.service';
import { DonViService } from '@modules/shared/services/don-vi.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { SubjectService } from '@modules/shared/services/subject.service';
import { SubjectCourseService } from '@modules/shared/services/subject-course.service';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { CtdtBoMuctieuCutheService } from '@modules/shared/services/ctdt-bo-muctieu-cuthe.service';
import { BoCtdtCdrService } from '@modules/shared/services/ctdt-bo-cdr.service';
import { OvicEditorComponent } from '@modules/shared/components/ovic-editor/ovic-editor.component';
import { BoCtdtComponent } from './bo-ctdt.component';
import { BoCtdtPeoComponent } from './bo-ctdt-peo/bo-ctdt-peo.component';
import { BoCtdtCdrComponent } from './bo-ctdt-cdr/bo-ctdt-cdr.component';

@Component({ selector: 'ovic-editor', standalone: true, template: '' })
class EditorStub {
    @Input() height = '';
    @Input() formField: AbstractControl | undefined;
    @Input() default = '';
    @Input() readonly = false;
}

describe('Phiên cấu hình Bộ CTĐT', () => {
    const bo: BoCtdt = { id: 7, name: 'Bộ CNTT', code: 'CNTT', year: 2026, category_ids: [2] };
    const subject = { id: 10, name: 'Lập trình', code: 'LT', sotinchi: 3, sotinchi_th: 1, desc: '' } as Subject;
    let fixture: ComponentFixture<BoCtdtComponent>;
    let component: BoCtdtComponent;
    let root: HTMLElement;
    let boService: jasmine.SpyObj<BoCtdtService>;
    let subjectService: jasmine.SpyObj<SubjectService>;
    let relationService: jasmine.SpyObj<SubjectCourseService>;
    let courseService: jasmine.SpyObj<ElnKhoaHocService>;
    let notification: jasmine.SpyObj<NotificationService>;
    let router: { url: string; navigate: jasmine.Spy };

    beforeEach(async () => {
        boService = jasmine.createSpyObj('BoCtdtService', ['get', 'create', 'update', 'delete']);
        boService.get.and.returnValue(of({ data: [bo], totalRecords: 1 } as any));
        boService.update.and.returnValue(of(bo));
        subjectService = jasmine.createSpyObj('SubjectService', ['get']);
        subjectService.get.and.returnValue(of({ data: [subject], totalRecords: 1 } as any));
        relationService = jasmine.createSpyObj('SubjectCourseService', ['getByBoCtdt', 'create', 'delete']);
        relationService.getByBoCtdt.and.returnValue(of({ data: [], totalRecords: 0 } as any));
        relationService.create.and.returnValue(of({ id: 100, ctdt_bo_id: 7, subject_id: 10, course_id: 20 } as any));
        relationService.delete.and.returnValue(of(true));
        courseService = jasmine.createSpyObj('ElnKhoaHocService', ['addElnKhoaHoc']);
        courseService.addElnKhoaHoc.and.returnValue(of(20 as any));
        notification = jasmine.createSpyObj('NotificationService', ['confirm', 'confirmDelete2', 'startDeleting', 'toastSuccess', 'toastWarning', 'toastError']);
        notification.confirm.and.returnValue(of(undefined));
        router = { url: '/admin/dao-tao/bo-ctdt', navigate: jasmine.createSpy('navigate') };
        const childService = { getByPage: () => of({ data: [], recordsFiltered: 0 }) };
        await TestBed.configureTestingModule({
            imports: [BoCtdtComponent],
            providers: [
                provideNoopAnimations(),
                { provide: Router, useValue: router },
                { provide: AuthService, useValue: { hasRouter: () => false, userCanAdd: () => true, userCanEdit: () => true, userCanDelete: () => true, user: { id: 1, donvi_id: 1 } } },
                { provide: HelperService, useValue: { slugVietnamese: () => 'lap-trinh', decodeHTML: (text: string) => text } },
                { provide: NotificationService, useValue: notification },
                { provide: BoCtdtService, useValue: boService },
                { provide: DonViService, useValue: { getDonviByPageNew: () => of({ data: [{ id: 2, title: 'Khoa CNTT' }] }) } },
                { provide: ElngUserProfileService, useValue: {} },
                { provide: SubjectService, useValue: subjectService },
                { provide: SubjectCourseService, useValue: relationService },
                { provide: ElnKhoaHocService, useValue: courseService },
                { provide: CtdtBoMuctieuCutheService, useValue: childService },
                { provide: BoCtdtCdrService, useValue: childService }
            ]
        }).overrideComponent(BoCtdtPeoComponent, { remove: { imports: [OvicEditorComponent] }, add: { imports: [EditorStub] } })
            .overrideComponent(BoCtdtCdrComponent, { remove: { imports: [OvicEditorComponent] }, add: { imports: [EditorStub] } })
            .compileComponents();
        fixture = TestBed.createComponent(BoCtdtComponent);
        component = fixture.componentInstance;
        root = fixture.nativeElement;
        fixture.detectChanges();
    });

    function open(): void { component.openConfiguration(bo); fixture.detectChanges(); }
    function section(id: 'info' | 'subjects' | 'peo' | 'cdr'): void { component.selectConfigurationSection(id); fixture.detectChanges(); }

    it('thay bốn action bằng Cấu hình, giữ tạo mới/xóa/mở chương trình', () => {
        expect(root.querySelector('[aria-label="Cấu hình Bộ CNTT"]')).not.toBeNull();
        expect(root.querySelector('[aria-label="Thêm Bộ CTĐT"]')).not.toBeNull();
        expect(root.querySelector('[aria-label="Xóa bộ CTĐT Bộ CNTT"]')).not.toBeNull();
        expect(root.querySelector('[aria-label="Nhập PEO cho Bộ CNTT"]')).toBeNull();
        component.openPrograms(bo);
        expect(router.navigate).toHaveBeenCalledWith(['/admin/dao-tao/chuongtrinh-daotao'], { queryParams: { bo_id: 7 } });
        component.openCreate();
        expect(component.formControl.visible).toBeTrue();
    });

    it('đúng bốn mục, mặc định Thông tin và chỉ mount child đang chọn', () => {
        open();
        expect(Array.from(root.querySelectorAll('.bo-ctdt-config__nav-item')).map(item => item.textContent?.trim()))
            .toEqual(['Thông tin', 'Môn học', 'Mục tiêu cụ thể', 'Chuẩn đầu ra']);
        expect(component.configurationSection()).toBe('info');
        expect(component.peo()).toBeUndefined();
        section('peo');
        expect(component.peo()?.embedded).toBeTrue();
        expect(root.querySelector('.bo-peo-toolbar')).toBeNull();
        section('cdr');
        expect(component.peo()).toBeUndefined();
        expect(component.cdr()?.embedded).toBeTrue();
        expect(root.querySelector('.bo-cdr-toolbar')).toBeNull();
    });

    it('lưu thông tin cập nhật header/list, không thoát phiên hoặc tải lại list', () => {
        open();
        component.boForm.controls.name.setValue('Bộ mới');
        const calls = boService.get.calls.count();
        component.submitConfigurationInfo();
        fixture.detectChanges();
        expect(component.configurationBo()?.name).toBe('Bộ mới');
        expect(component.table.data()[0].name).toBe('Bộ mới');
        expect(root.querySelector('.bo-ctdt-config__header')?.textContent).toContain('Bộ mới');
        expect(component.configurationSection()).toBe('info');
        expect(boService.get.calls.count()).toBe(calls);
        expect(component.boForm.pristine).toBeTrue();
    });

    it('đóng phiên sau lưu tải lại danh sách theo bộ lọc hiện hành', () => {
        open();
        const calls = boService.get.calls.count();
        component.closeConfiguration();
        expect(component.configurationBo()).toBeNull();
        expect(boService.get.calls.count()).toBe(calls + 1);
    });

    it('danh sách sau đóng cập nhật tổng số và lùi trang nếu bộ lọc không còn khớp', () => {
        component.table.paginator.reset(21);
        component.table.paginator.changePage(2);
        open();
        boService.get.and.returnValue(of({ data: [], totalRecords: 0 } as any));
        component.closeConfiguration();
        expect(component.table.paginator.totalRecords()).toBe(0);
        expect(component.table.paginator.paged()).toBe(1);
        expect(component.table.data()).toEqual([]);
    });

    it('lỗi lưu giữ dữ liệu và mở khóa điều hướng', () => {
        open();
        component.boForm.controls.name.setValue('Nháp');
        boService.update.and.returnValue(throwError(() => new Error('offline')));
        component.submitConfigurationInfo();
        expect(component.boForm.controls.name.value).toBe('Nháp');
        expect(component.configurationBo()?.name).toBe(bo.name);
        expect(component.saving()).toBeFalse();
        expect(notification.toastError).toHaveBeenCalled();
    });

    it('đang lưu không chuyển mục/đóng; hiện overlay và khóa input', () => {
        open();
        const pending = new RxSubject<BoCtdt>();
        boService.update.and.returnValue(pending);
        component.submitConfigurationInfo();
        fixture.detectChanges();
        component.selectConfigurationSection('subjects');
        component.closeConfiguration();
        expect(component.configurationSection()).toBe('info');
        expect(component.configurationBo()?.id).toBe(7);
        expect(root.querySelector('app-loading-progress')).not.toBeNull();
        expect(root.querySelector<HTMLFieldSetElement>('.bo-ctdt-config__form fieldset')?.disabled).toBeTrue();
        pending.next(bo); pending.complete();
        expect(component.saving()).toBeFalse();
    });

    it('xác nhận bỏ nháp chỉ chạy một lần; từ chối giữ nháp, đồng ý mới chuyển', () => {
        open();
        component.boForm.controls.name.setValue('Nháp');
        const confirm = new RxSubject<any>();
        notification.confirm.and.returnValue(confirm);
        component.selectConfigurationSection('peo');
        component.selectConfigurationSection('cdr');
        expect(notification.confirm).toHaveBeenCalledTimes(1);
        confirm.next({ name: 'no' }); confirm.complete();
        expect(component.configurationSection()).toBe('info');
        expect(component.boForm.controls.name.value).toBe('Nháp');
        notification.confirm.and.returnValue(of({ name: 'yes' } as any));
        section('peo');
        expect(component.configurationSection()).toBe('peo');
        expect(component.boForm.controls.name.value).toBe(bo.name);
    });

    it('chỉ đọc xem được bốn mục nhưng không sửa thông tin hoặc chọn môn', () => {
        component.canUpdate = component.canSelectSubjects = component.canAdd = component.canDelete = false;
        open();
        expect(component.boForm.disabled).toBeTrue();
        component.submitConfigurationInfo();
        expect(boService.update).not.toHaveBeenCalled();
        section('subjects');
        expect(root.querySelector<HTMLButtonElement>('.bo-ctdt-list__subject')?.disabled).toBeTrue();
        component.toggleSubject(subject); component.saveSubjects();
        expect(component.selectedSubjectIds().size).toBe(0);
        expect(relationService.create).not.toHaveBeenCalled();
    });

    it('giữ lựa chọn qua trang/tìm kiếm/đổi mục; đóng phiên phải xác nhận', () => {
        open(); section('subjects'); component.toggleSubject(subject);
        component.loadSubjectPicker(2);
        component.subjectSearch.set('LT'); component.searchSubjects();
        section('peo'); section('subjects');
        expect(component.isSubjectSelected(10)).toBeTrue();
        expect(relationService.getByBoCtdt).toHaveBeenCalledTimes(1);
        component.closeConfiguration();
        expect(notification.confirm).toHaveBeenCalled();
        expect(component.configurationBo()?.id).toBe(7);
    });

    it('GET lần đầu lỗi, retry vẫn chọn những quan hệ đã lưu', () => {
        open();
        relationService.getByBoCtdt.and.returnValue(throwError(() => new Error('offline')));
        section('subjects');
        relationService.getByBoCtdt.and.returnValue(of({ data: [{ id: 100, ctdt_bo_id: 7, subject_id: 10, course_id: 20 }] } as any));
        component.retrySubjectLoad();
        expect(component.subjectRelationsReady()).toBeTrue();
        expect(component.isSubjectSelected(10)).toBeTrue();
        component.saveSubjects();
        expect(relationService.delete).not.toHaveBeenCalled();
        expect(component.configurationSection()).toBe('subjects');
    });

    it('mã Bộ mới đã lưu được dùng khi tạo course trong phiên môn học cũ', () => {
        open(); section('subjects'); section('info');
        component.boForm.controls.code.setValue('NEW');
        component.submitConfigurationInfo();
        section('subjects'); component.toggleSubject(subject); component.saveSubjects();
        expect(courseService.addElnKhoaHoc).toHaveBeenCalledWith(jasmine.objectContaining({ maso: 'NEW_LT' }));
    });

    it('lỗi tạo quan hệ giữ lựa chọn và retry không tạo course trùng', () => {
        open(); section('subjects'); component.toggleSubject(subject);
        relationService.create.and.returnValue(throwError(() => new Error('failed')));
        component.saveSubjects();
        expect(component.isSubjectSelected(10)).toBeTrue();
        expect(component.subjectSaveError()).toContain('0/1');
        relationService.create.and.returnValue(of({ id: 100 } as any));
        component.saveSubjects();
        expect(courseService.addElnKhoaHoc).toHaveBeenCalledTimes(1);
        expect(relationService.create.calls.mostRecent().args[0]).toEqual({ ctdt_bo_id: 7, subject_id: 10, course_id: 20 });
    });

    it('lưu thành công refresh baseline; lưu lần nữa không POST/DELETE lại', () => {
        open(); section('subjects'); component.toggleSubject(subject);
        relationService.getByBoCtdt.and.returnValue(of({ data: [{ id: 100, ctdt_bo_id: 7, subject_id: 10, course_id: 20 }] } as any));
        component.saveSubjects(); component.saveSubjects();
        expect(relationService.create).toHaveBeenCalledTimes(1);
        expect(relationService.delete).not.toHaveBeenCalled();
        expect(component.subjectsDirty).toBeFalse();
        expect(component.configurationSection()).toBe('subjects');
    });

    it('đóng phiên hủy GET môn học; response cũ không ghi vào Bộ mới', () => {
        open();
        const pending = new RxSubject<any>();
        subjectService.get.and.returnValue(pending);
        section('subjects'); component.closeConfiguration();
        expect(pending.observed).toBeFalse();
        component.openConfiguration({ ...bo, id: 8 });
        pending.next({ data: [subject], totalRecords: 1 }); pending.complete();
        expect(component.configurationBo()?.id).toBe(8);
        expect(component.configurationSection()).toBe('info');
    });
});
