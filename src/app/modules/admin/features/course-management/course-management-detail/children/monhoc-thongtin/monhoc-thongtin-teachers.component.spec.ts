import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { EMPTY, Observable, Subject, of, throwError } from 'rxjs';
import { MultiSelectModule } from 'primeng/multiselect';
import { AuthService } from '@core/services/auth.service';
import { HelperService } from '@core/services/helper.service';
import { NotificationService } from '@core/services/notification.service';
import { UserService } from '@core/services/user.service';
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

describe('MonhocThongtinComponent phân công giảng viên', () => {
    let fixture: ComponentFixture<MonhocThongtinComponent>;
    let component: MonhocThongtinComponent;
    let root: HTMLElement;
    let courseService: jasmine.SpyObj<ElnKhoaHocService>;
    let profileService: jasmine.SpyObj<ElngUserProfileService>;
    let userService: jasmine.SpyObj<UserService>;
    let ctdtHocphanService: jasmine.SpyObj<CtdtHocphanService>;
    let notificationService: jasmine.SpyObj<NotificationService>;

    const emptyPage = { data: [], recordsFiltered: 0 };
    const makeCourse = (values: Record<string, unknown> = {}) => ({
        id: 1,
        title: 'Học phần thử nghiệm',
        slug: 'hoc-phan-thu-nghiem',
        maso: 'HP01',
        category_ids: 1,
        creator_plan_id: null,
        creator_exam_id: null,
        params: { sotinchi: 3, sotinchi_th: 0 },
        ...values
    });

    beforeEach(async () => {
        courseService = jasmine.createSpyObj<ElnKhoaHocService>('ElnKhoaHocService', [
            'getKhoaHocByPageNew_2', 'updateElnKhoaHoc'
        ]);
        profileService = jasmine.createSpyObj<ElngUserProfileService>('ElngUserProfileService', [
            'getUserProfileByPageNewV2'
        ]);
        userService = jasmine.createSpyObj<UserService>('UserService', ['getUser']);
        ctdtHocphanService = jasmine.createSpyObj<CtdtHocphanService>('CtdtHocphanService', [
            'getCtdtHocphanByPageNew', 'deleteCtdtHocphanByCol', 'addCtdtHocphan'
        ]);
        notificationService = jasmine.createSpyObj<NotificationService>('NotificationService', [
            'toastError', 'toastWarning', 'toastSuccess'
        ]);

        courseService.getKhoaHocByPageNew_2.and.returnValue(of(emptyPage) as any);
        courseService.updateElnKhoaHoc.and.returnValue(of({}) as any);
        profileService.getUserProfileByPageNewV2.and.returnValue(of(emptyPage) as any);
        ctdtHocphanService.getCtdtHocphanByPageNew.and.returnValue(of(emptyPage) as any);
        ctdtHocphanService.deleteCtdtHocphanByCol.and.returnValue(of({}) as any);
        ctdtHocphanService.addCtdtHocphan.and.returnValue(of({}) as any);

        await TestBed.configureTestingModule({
            imports: [MonhocThongtinComponent],
            providers: [
                provideNoopAnimations(),
                { provide: ActivatedRoute, useValue: { queryParamMap: EMPTY, snapshot: { queryParamMap: convertToParamMap({ code: '1' }) } } },
                { provide: Router, useValue: { url: '/hoc-phan?code=1', navigate: jasmine.createSpy('navigate') } },
                {
                    provide: AuthService,
                    useValue: {
                        user: { id: 1, donvi_id: 1 },
                        userHasRole: () => false,
                        hasRouter: () => false,
                        getSysConfigParams: () => []
                    }
                },
                { provide: NotificationService, useValue: notificationService },
                { provide: HelperService, useValue: { slugVietnamese: (value: string) => value } },
                { provide: UserService, useValue: userService },
                { provide: ElnKhoaHocService, useValue: courseService },
                { provide: ElngUserProfileService, useValue: profileService },
                { provide: ElnChuyenMucService, useValue: { getChuyemucByPageNew: () => of(emptyPage) } },
                { provide: DonViService, useValue: { getDonviByPageNew: () => of(emptyPage) } },
                { provide: CoursePlanActivitiesService, useValue: {} },
                { provide: CtdtService, useValue: { getCtdtByPageNew: () => of(emptyPage) } },
                { provide: CtdtConfigService, useValue: { getCtdtConfigByPageNew: () => of(emptyPage) } },
                { provide: CtdtHocphanService, useValue: ctdtHocphanService }
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

    function prepareSave(course = makeCourse(), canAssign = true): void {
        component.selectedCourse = course as any;
        component.isLanhDaoKhoa = canAssign;
        component.listGiangvien = [];
        component.quickInfoContentTeacher = null;
        component.quickInfoExamTeacher = null;
        component.selectCtdts = [];
        component.formKhoaHoc.patchValue({
            title: 'Học phần đã sửa',
            maso: 'HP01',
            category_ids: 1,
            sotinchi: 3,
            sotinchi_th: 0,
            creator_plan_id: course.creator_plan_id,
            creator_exam_id: course.creator_exam_id
        });
        const checkMa = component.onCheckMaHpPromise as jasmine.Spy;
        if (checkMa.and) checkMa.and.resolveTo(true);
        else spyOn(component, 'onCheckMaHpPromise').and.resolveTo(true);
    }

    it('giữ giảng viên nội dung của course cũ và mặc định giảng viên đề là null', async () => {
        const course = makeCourse({ creator_plan_id: '17' }) as any;
        delete course.creator_exam_id;
        component.selectedCourse = course;
        (component as any).loadVersion = 2;
        ctdtHocphanService.getCtdtHocphanByPageNew.and.returnValue(of(emptyPage) as any);

        await component.editKhoaHoc(course, 2);

        expect(component.f['creator_plan_id'].value).toBe(17);
        expect(component.f['creator_exam_id'].value).toBeNull();
    });

    it('hiển thị hai trường chọn cạnh nhau ở màn rộng', () => {
        component.state.set('success');
        component.formKhoaHoc.patchValue({ title: 'Môn học', maso: 'MH01', category_ids: 1, sotinchi: 3, sotinchi_th: 0 });
        fixture.detectChanges();
        const content = root.querySelector('#content-teacher-label')?.closest('.mh-field');
        const exam = root.querySelector('#exam-teacher-label')?.closest('.mh-field');
        expect(content).not.toBeNull();
        expect(exam).not.toBeNull();
        expect(content?.classList.contains('mh-field--wide')).toBeFalse();
        expect(exam?.classList.contains('mh-field--wide')).toBeFalse();
    });

    it('hiển thị hai vai trò độc lập và dùng chung một lookup khi cùng ID', async () => {
        const teacher = { id: 17, display_name: 'Nguyễn An', email: 'an@example.test' };
        component.selectedCourse = makeCourse({ creator_plan_id: 17, creator_exam_id: 17 }) as any;
        component.listGiangvien = [];
        userService.getUser.and.returnValue(of(teacher) as any);

        await (component as any).hydrateAssignedTeachers(0);

        component.formKhoaHoc.patchValue({ creator_plan_id: 17, creator_exam_id: 17 });
        expect(userService.getUser).toHaveBeenCalledTimes(1);
        expect(component.listGiangvien.map(item => item.id)).toEqual([17]);
        expect(component.teacherName('creator_plan_id')).toBe('Nguyễn An');
        expect(component.teacherName('creator_exam_id')).toBe('Nguyễn An');
        expect(component.teacherEmail('creator_plan_id')).toBe('an@example.test');
        expect(component.teacherEmail('creator_exam_id')).toBe('an@example.test');

        component.state.set('success');
        fixture.detectChanges();
        const labels = Array.from(root.querySelectorAll('.mh-overview dt')).map(item => item.textContent?.trim());
        expect(labels).toContain('Giảng viên phụ trách nội dung');
        expect(labels).toContain('Giảng viên phụ trách đề');
    });

    it('thêm giảng viên nằm ngoài options và giữ nhãn dự phòng nếu lookup lỗi', async () => {
        component.selectedCourse = makeCourse({ creator_plan_id: 88, creator_exam_id: 99 }) as any;
        userService.getUser.and.returnValues(
            of({ id: '88', display_name: 'Giảng viên Mới', email: 'moi@example.test' }) as any,
            throwError(() => new Error('lookup failed'))
        );

        await (component as any).hydrateAssignedTeachers(0);

        component.formKhoaHoc.patchValue({ creator_plan_id: 88, creator_exam_id: 99 });
        expect(component.listGiangvien.map(item => item.id)).toEqual([99, 88]);
        expect(typeof component.listGiangvien[1].id).toBe('number');
        expect(component.teacherName('creator_plan_id')).toBe('Giảng viên Mới');
        expect(component.teacherEmail('creator_plan_id')).toBe('moi@example.test');
        expect(component.teacherName('creator_exam_id')).toBe('Giảng viên #99');
        expect(component.teacherEmail('creator_exam_id')).toBe('—');
    });

    it('bỏ qua kết quả lookup và không ghi options của course cũ', async () => {
        const pending = new Subject<any>();
        component.selectedCourse = makeCourse({ id: 1, creator_plan_id: 88 }) as any;
        (component as any).loadVersion = 4;
        userService.getUser.and.returnValue(pending as Observable<any>);
        const hydration = (component as any).hydrateAssignedTeachers(4);

        (component as any).loadVersion = 5;
        component.selectedCourse = makeCourse({ id: 2, creator_plan_id: null }) as any;
        pending.next({ id: 88, display_name: 'Giảng viên cũ', email: 'cu@example.test' });
        pending.complete();
        await hydration;

        expect(component.quickInfoContentTeacher).toBeNull();
        expect(component.listGiangvien).toEqual([]);
    });

    it('chỉ gửi assignment thay đổi sau khi chuẩn hóa ID và gửi null khi bỏ chọn', async () => {
        prepareSave(makeCourse({ creator_plan_id: 10, creator_exam_id: 20 }) as any);
        component.f['creator_plan_id'].setValue('31');
        component.f['creator_exam_id'].setValue('');

        await component.saveCourse();

        const payload = courseService.updateElnKhoaHoc.calls.mostRecent().args[1];
        expect(payload.creator_plan_id).toBe(31);
        expect(payload.creator_exam_id).toBeNull();
        expect(component.selectedCourse.creator_plan_id).toBe(31);
        expect(component.selectedCourse.creator_exam_id).toBeNull();
        expect(component.isSaving()).toBeFalse();
    });

    it('không gửi assignment khi người dùng không có quyền hoặc giá trị không đổi', async () => {
        prepareSave(makeCourse({ creator_plan_id: 10, creator_exam_id: 20 }) as any, false);
        component.f['creator_plan_id'].setValue(99);
        component.f['creator_exam_id'].setValue(null);
        await component.saveCourse();
        let payload = courseService.updateElnKhoaHoc.calls.mostRecent().args[1];
        expect(Object.prototype.hasOwnProperty.call(payload, 'creator_plan_id')).toBeFalse();
        expect(Object.prototype.hasOwnProperty.call(payload, 'creator_exam_id')).toBeFalse();

        courseService.updateElnKhoaHoc.calls.reset();
        prepareSave(makeCourse({ creator_plan_id: 10, creator_exam_id: 20 }) as any, true);
        component.f['creator_plan_id'].setValue('10');
        component.f['creator_exam_id'].setValue(20);
        await component.saveCourse();
        payload = courseService.updateElnKhoaHoc.calls.mostRecent().args[1];
        expect(Object.prototype.hasOwnProperty.call(payload, 'creator_plan_id')).toBeFalse();
        expect(Object.prototype.hasOwnProperty.call(payload, 'creator_exam_id')).toBeFalse();
    });

    it('giữ draft và kết thúc loading khi PUT thất bại', async () => {
        prepareSave(makeCourse({ creator_plan_id: 10, creator_exam_id: 20 }) as any);
        component.f['creator_plan_id'].setValue(31);
        component.f['creator_exam_id'].setValue(null);
        courseService.updateElnKhoaHoc.and.returnValue(throwError(() => new Error('save failed')) as any);

        await component.saveCourse();

        expect(component.f['creator_plan_id'].value).toBe(31);
        expect(component.f['creator_exam_id'].value).toBeNull();
        expect(component.isSaving()).toBeFalse();
        expect(notificationService.toastError).toHaveBeenCalledWith('Sửa thông tin thất bại');
    });

    it('cập nhật model theo payload snapshot dù form đã đổi sau submit', async () => {
        prepareSave(makeCourse({ creator_plan_id: 10, creator_exam_id: 20 }) as any);
        component.f['creator_plan_id'].setValue(31);
        const response = new Subject<any>();
        courseService.updateElnKhoaHoc.and.returnValue(response as any);

        const saving = component.saveCourse();
        await new Promise(resolve => setTimeout(resolve, 0));
        component.f['creator_plan_id'].setValue(42);
        response.next({});
        response.complete();
        await saving;

        expect(courseService.updateElnKhoaHoc.calls.mostRecent().args[1].creator_plan_id).toBe(31);
        expect(component.selectedCourse.creator_plan_id).toBe(31);
        expect(component.f['creator_plan_id'].value).toBe(42);
    });

    it('không cho response GET cũ thay thế course mới', async () => {
        const oldCourse = makeCourse({ id: 1, title: 'Course cũ' });
        const newCourse = makeCourse({ id: 2, title: 'Course mới' });
        const oldRequest = new Subject<any>();
        courseService.getKhoaHocByPageNew_2.and.returnValues(
            oldRequest as any,
            of({ data: [newCourse], recordsFiltered: 1 }) as any
        );
        ctdtHocphanService.getCtdtHocphanByPageNew.and.returnValue(of(emptyPage) as any);

        (component as any).loadCourse('1');
        (component as any).loadCourse('2');
        oldRequest.next({ data: [oldCourse], recordsFiltered: 1 });
        oldRequest.complete();
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(component.selectedCourse.id).toBe(2);
        expect(component.f['title'].value).toBe('Course mới');
    });
});
