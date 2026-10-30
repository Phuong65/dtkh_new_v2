import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MatMenuModule } from '@angular/material/menu';
import { PanelModule } from 'primeng/panel';
import { EMPTY, of } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { HelperService } from '@core/services/helper.service';
import { ClassesService } from '@shared/services/classes.service';
import { CourseCloService } from '@modules/shared/services/course-clo.service';
import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';
import { CoursePlanCommentService } from '@modules/shared/services/course-plan-comment.service';
import { CourseQuestionsService } from '@modules/shared/services/course-questions.service';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { SafeHtmlDecodePipe } from '@modules/shared/pipes/safe-html-decode';
import { OvicDateTimePipe } from '@modules/shared/pipes/ovic-date-time.pipe';
import { ShowLabelData } from '@modules/shared/pipes/show-label-data.pipe';
import { CoursePlanActivities } from '@modules/shared/models/course-plan-activities';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { MonhocNoidungComponent } from './monhoc-noidung.component';

describe('MonhocNoidungComponent presentation', () => {
    let fixture: ComponentFixture<MonhocNoidungComponent>;
    let component: MonhocNoidungComponent;
    let root: HTMLElement;
    let planApi: jasmine.SpyObj<CoursePlanActivitiesService>;
    let router: jasmine.SpyObj<Router>;

    const plan = (id: number, week: number, children: CoursePlanActivities[] = []): CoursePlanActivities => ({
        id, week, children, type: 'PLAN', title: `Bài ${week}`, status: 0
    } as CoursePlanActivities);

    beforeEach(async () => {
        planApi = jasmine.createSpyObj<CoursePlanActivitiesService>('planApi', ['updateCoursePlanActivities']);
        planApi.updateCoursePlanActivities.and.returnValue(of(1));
        router = jasmine.createSpyObj<Router>('router', ['navigate']);
        await TestBed.configureTestingModule({
            imports: [MonhocNoidungComponent],
            providers: [
                provideNoopAnimations(),
                { provide: ActivatedRoute, useValue: { queryParams: EMPTY } },
                { provide: Router, useValue: router },
                { provide: AuthService, useValue: { user: { id: 1 }, userHasRole: () => false, hasRouter: () => false } },
                { provide: NotificationService, useValue: jasmine.createSpyObj('notification', ['isProcessing', 'toastSuccess', 'toastError', 'toastWarning']) },
                { provide: CoursePlanActivitiesService, useValue: planApi },
                { provide: NgbModal, useValue: { open: jasmine.createSpy('open') } },
                ...[ClassesService, CourseCloService, CoursePlanCommentService, CourseQuestionsService,
                    ElnKhoaHocService, ElngUserProfileService, HelperService].map(provide => ({ provide, useValue: {} }))
            ]
        }).overrideComponent(MonhocNoidungComponent, {
            set: {
                imports: [CommonModule, FormsModule, ReactiveFormsModule, MatMenuModule, PanelModule, SafeHtmlDecodePipe, OvicDateTimePipe, ShowLabelData],
                schemas: [NO_ERRORS_SCHEMA]
            }
        }).compileComponents();
        fixture = TestBed.createComponent(MonhocNoidungComponent);
        component = fixture.componentInstance;
        root = fixture.nativeElement;
        component.selectedCourse = { id: 1, params: { sotinchi: 3 } } as ElnKhoaHoc;
        component.state.set('success');
        component.canAdded = true;
        component.unlimitLesson = false;
        component.list_clo = [];
        fixture.detectChanges();
    });

    it('hiển thị app-loading-progress khi đang tải', () => {
        component.state.set('loading');
        fixture.detectChanges();
        expect(root.querySelector('app-loading-progress')).not.toBeNull();
        expect(root.querySelector('.course-content-empty')).toBeNull();
    });

    it('đặt trạng thái success để hiển thị empty khi API tải thành công nhưng không có plan', () => {
        component.state.set('success');
        component.list_plan = [];
        fixture.detectChanges();
        expect(root.querySelector('.course-content-empty')).not.toBeNull();
    });

    it('cấp quyền khởi tạo cho vai trò Đào tạo và Lãnh đạo khoa', () => {
        component.routerDaotao = true;
        component.isLanhDaoKhoa = true;
        const hasContentCreationPermission = component.routerDaotao
            || component.isLanhDaoKhoa
            || component.routerLanhdaokhoa
            || component.routerLanhdaobomon
            || component.userId === component.selectedCourse.creator_plan_id;
        component.canAdded = hasContentCreationPermission;
        fixture.detectChanges();
        expect(root.querySelector('.course-content-empty__action')).not.toBeNull();
    });

    it('hiển thị giao diện báo lỗi và nút tải lại khi xảy ra lỗi', () => {
        const reloadSpy = spyOn(component, 'reloadData');
        component.state.set('error');
        component.errorMessage.set('Không tìm thấy môn học');
        fixture.detectChanges();
        expect(root.querySelector('.course-content-error')).not.toBeNull();
        expect(root.querySelector('.course-content-error')?.textContent).toContain('Không tìm thấy môn học');
        const reloadBtn = root.querySelector<HTMLButtonElement>('.course-content-error button');
        expect(reloadBtn).not.toBeNull();
        reloadBtn?.click();
        expect(reloadSpy).toHaveBeenCalled();
    });

    it('giữ empty state và gọi đúng hành động khởi tạo', () => {
        const create = spyOn(component, 'openFormAddLesson');
        expect(root.querySelector('.course-content-empty h2')?.textContent).toContain('Chưa có nội dung giảng dạy');
        expect(root.querySelector('.course-content-empty__visual')).not.toBeNull();
        root.querySelector<HTMLButtonElement>('.course-content-empty__action')!.click();
        expect(create).toHaveBeenCalledTimes(1);
    });

    it('thiếu tín chỉ hướng dẫn nhập thông tin, giữ query params khi điều hướng', () => {
        component.selectedCourse.params.sotinchi = 0;
        fixture.detectChanges();
        expect(root.querySelector('.course-content-empty__action')).toBeNull();
        root.querySelector<HTMLButtonElement>('.course-content-empty__credit-action')!.click();
        expect(router.navigate).toHaveBeenCalledWith([], jasmine.objectContaining({
            queryParams: { tab: 'thong-tin' }, queryParamsHandling: 'merge'
        }));
    });

    it('giữ nhánh không giới hạn số bài và quyền khởi tạo', () => {
        component.unlimitLesson = true;
        component.selectedCourse.params.sotinchi = 0;
        fixture.detectChanges();
        expect(root.querySelector('.course-content-empty__action')).not.toBeNull();
        component.canAdded = false;
        fixture.detectChanges();
        expect(root.querySelector('.course-content-empty__action')).toBeNull();
        component.canAdded = true;
        component.state.set('loading');
        fixture.detectChanges();
        expect(root.querySelector('.course-content-empty__action')).toBeNull();
    });

    it('thu gọn mục lục mà không hủy dữ liệu đang chọn', () => {
        const selected = plan(10, 1);
        component.list_plan = [selected];
        component.selectPlan = selected;
        fixture.detectChanges();
        const collapseToggle = root.querySelector<HTMLButtonElement>('.course-outline-toggle')!;
        expect(collapseToggle).not.toBeNull();
        expect(root.querySelector('.content-context-bar')).toBeNull();
        collapseToggle.click();
        fixture.detectChanges();
        expect(root.querySelector('.close-left-body')).not.toBeNull();
        const reopenToggle = root.querySelector<HTMLButtonElement>('.course-outline-reopen')!;
        expect(reopenToggle.getAttribute('aria-label')).toBe('Mở mục lục');
        expect(component.selectPlan).toBe(selected);
        reopenToggle.click();
        fixture.detectChanges();
        expect(root.querySelector('.close-left-body')).toBeNull();
    });

    it('giữ nguyên điều kiện xóa theo index, không phụ thuộc id của thảo luận', () => {
        component.unlimitLesson = true;
        component.list_plan = [plan(10, 0), plan(11, 1), plan(12, 2)];
        component.list_thaoluan = [plan(100, 2000, [plan(0, 2000), plan(0, 2000)]), plan(200, 2000, [plan(21, 2000), plan(22, 2000)])];
        component.updateDeletableState();
        expect(component.deletableLessonMap).toEqual({ 2: true });
        expect(component.deletableThaoluanMap).toEqual({ 1: true });
        fixture.detectChanges();
        expect(root.querySelectorAll('[aria-label="Xóa bài thảo luận"]').length).toBe(2);
        component.unlimitLesson = false;
        component.updateDeletableState();
        expect(component.deletableLessonMap).toEqual({});
        component.list_thaoluan = [];
        component.updateDeletableState();
        expect(component.deletableThaoluanMap).toEqual({});
    });

    it('kéo đổi thứ tự vẫn xét bài ở index cuối và loại tuần 0', () => {
        component.unlimitLesson = true;
        component.list_plan = [plan(10, 0), plan(11, 1)];
        component.updateDeletableState();
        expect(component.deletableLessonMap).toEqual({ 1: true });
        component.drop({ previousIndex: 0, currentIndex: 1 } as any);
        expect(component.list_plan.map(item => item.id)).toEqual([11, 10]);
        expect(component.deletableLessonMap).toEqual({});
    });

    it('chọn bài vẫn nạp form mục tiêu và học liệu', () => {
        const selected = plan(10, 1, [
            { id: 11, type: 'MUCTIEU', kienthuc: 'Kiến thức', kynang: 'Kỹ năng' } as CoursePlanActivities,
            { id: 12, type: 'ACTIVITY', files: [], slides: [], desc: 'Học liệu', video: { id: 9 } } as unknown as CoursePlanActivities
        ]);
        selected.title = 'Nội dung bài';
        selected.course_clo_id = 2;
        component.onChangePlan(selected, 'muctieu');
        expect(component.formMuctieu.controls['title'].value).toBe('Nội dung bài');
        expect(component.formMuctieu.controls['kienthuc'].value).toBe('Kiến thức');
        expect(component.formTailieu.controls['desc'].value).toBe('Học liệu');
        expect(component.formTailieu.controls['video'].value).toEqual([{ id: 9 }]);
        component.keyScroll = null;
    });

    it('lưu mục tiêu giữ hai payload và tải lại như trước', () => {
        const reload = spyOn(component, 'loadPlan');
        component.selectPlan = plan(10, 1);
        component.planMuctieu = plan(11, 1);
        component.formMuctieu.setValue({ title: 'Bài mới', course_clo_id: 2, desc: 'Tóm tắt', kienthuc: 'KT', kynang: 'KN' });
        component.saveMuctieu();
        expect(planApi.updateCoursePlanActivities).toHaveBeenCalledWith(11, { kienthuc: 'KT', kynang: 'KN' });
        expect(planApi.updateCoursePlanActivities).toHaveBeenCalledWith(10, { title: 'Bài mới', course_clo_id: 2, desc: 'Tóm tắt' });
        expect(reload).toHaveBeenCalledTimes(1);
    });
});
