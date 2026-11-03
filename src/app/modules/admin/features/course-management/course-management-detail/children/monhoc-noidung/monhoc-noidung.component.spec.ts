import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { TooltipModule } from 'primeng/tooltip';
import { PanelModule } from 'primeng/panel';
import { MessageService } from 'primeng/api';
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
                { provide: MessageService, useValue: { add: jasmine.createSpy('add'), clear: jasmine.createSpy('clear') } },
                { provide: NotificationService, useValue: jasmine.createSpyObj('notification', ['isProcessing', 'toastSuccess', 'toastError', 'toastWarning']) },
                { provide: CoursePlanActivitiesService, useValue: planApi },
                { provide: NgbModal, useValue: { open: jasmine.createSpy('open') } },
                ...[ClassesService, CourseCloService, CoursePlanCommentService, CourseQuestionsService,
                    ElnKhoaHocService, ElngUserProfileService, HelperService].map(provide => ({ provide, useValue: {} }))
            ]
        }).overrideComponent(MonhocNoidungComponent, {
            set: {
                imports: [CommonModule, FormsModule, ReactiveFormsModule, MatButtonModule, MatMenuModule, TooltipModule, PanelModule, SafeHtmlDecodePipe, OvicDateTimePipe, ShowLabelData],
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

    it('đặt nút thêm cạnh nút thu gọn và giữ đúng quyền hiển thị', () => {
        component.list_plan = [plan(10, 1)];
        fixture.detectChanges();
        const actions = root.querySelector('.course-outline-heading__actions')!;
        const addButton = actions.querySelector<HTMLButtonElement>('[aria-label^="Bổ sung"]')!;
        const collapseButton = actions.querySelector<HTMLButtonElement>('.course-outline-toggle')!;
        expect(addButton.classList).toContain('ictu-badge-btn--success-reverse');
        expect(collapseButton.classList).toContain('ictu-badge-btn--secondary-reverse');
        expect(addButton.classList).toContain('mat-mdc-unelevated-button');
        expect(collapseButton.classList).toContain('mat-mdc-unelevated-button');
        expect(addButton.querySelector('.ti-plus')).not.toBeNull();
        expect(addButton.textContent?.trim()).toBe('');
        expect(root.querySelector('.course-outline-actions')).toBeNull();
        expect(actions.children[0]).toBe(addButton);
        expect(actions.children[1]).toBe(collapseButton);
        const add = spyOn(component, 'openFormAddLesson');
        addButton.click();
        expect(add).toHaveBeenCalledTimes(1);
        component.canAdded = false;
        fixture.detectChanges();
        expect(root.querySelector('.course-outline-heading__actions [aria-label^="Bổ sung"]')).toBeNull();
        expect(root.querySelector('.course-outline-toggle')).not.toBeNull();
    });

    it('hiển thị trạng thái mục lục dạng chữ màu thay vì dot hoặc badge', () => {
        const child = plan(11, 1);
        child.status = 1;
        const parent = plan(10, 1, [child]);
        parent.status = -1;
        component.list_plan = [parent];
        fixture.detectChanges();

        expect(root.querySelector('.parent-status .course-status-text--revision')?.textContent?.trim()).toBe('Chưa đạt');
        expect(root.querySelector('.child-status .course-status-text--approved')).toBeNull();
        expect(root.querySelector('.child-action-menu .course-status-text--approved')?.textContent?.trim()).toBe('Đạt');
        expect(root.querySelector('.status-dot')).toBeNull();
        expect(root.querySelector('.course-status-badge')).toBeNull();
    });

    it('dùng chung nút nhận xét và badge vuông cho trạng thái header', () => {
        const goal = Object.assign(plan(11, 1), {
            type: 'MUCTIEU',
            status: 1,
            approved_at: '2026-11-03T00:00:00Z',
            comments: [{}, {}] as unknown[] | undefined,
            kienthuc: '',
            kynang: ''
        });
        const material = Object.assign(plan(12, 1), {
            type: 'ACTIVITY',
            status: 1,
            approved_at: '2026-11-03T00:00:00Z',
            comments: [{}] as unknown[] | undefined,
            files: [],
            slides: [],
            desc: '',
            videos: [],
            video: null
        });
        const selected = plan(10, 1, [goal, material]);
        component.list_plan = [selected];
        component.onChangePlan(selected, 'muctieu');
        fixture.detectChanges();

        const commentButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('.content-comment-toggle'));
        expect(commentButtons.length).toBe(2);
        expect(commentButtons.map(button => button.querySelector('.content-comment-count')?.textContent?.trim())).toEqual(['2', '1']);
        expect(root.querySelector('.muctieu-comment-toggle, .tailieu-comment-toggle, .view-comment-action')).toBeNull();

        const statusCases = [
            { status: 0, label: 'Chờ duyệt', badgeClass: 'ictu-badge--warning' },
            { status: 1, label: 'Đạt', badgeClass: 'ictu-badge--success' },
            { status: -1, label: 'Yêu cầu sửa', badgeClass: 'ictu-badge--danger' },
            { status: -2, label: 'Đã sửa', badgeClass: 'ictu-badge--primary' }
        ];
        for (const { status, label, badgeClass } of statusCases) {
            goal.status = status;
            material.status = status;
            fixture.detectChanges();

            const goalBadge = root.querySelector<HTMLElement>('.content-panel-status .course-status-badge');
            const materialBadge = root.querySelector<HTMLElement>('.tailieu-header__status .course-status-badge');
            expect(goalBadge?.textContent?.trim()).toBe(label);
            expect(materialBadge?.textContent?.trim()).toBe(label);
            expect(goalBadge?.classList).toContain(badgeClass);
            expect(materialBadge?.classList).toContain(badgeClass);

            if (status === 1) {
                expect(root.querySelectorAll('.content-panel-status .course-status-badge').length).toBe(2);
                expect(root.querySelectorAll('.tailieu-header__status .course-status-badge').length).toBe(2);
                const approvalBadges = root.querySelectorAll<HTMLElement>(
                    '.content-panel-status .course-status-badge, .tailieu-header__status .course-status-badge'
                );
                expect(approvalBadges[1].textContent?.trim()).toContain('Duyệt lúc:');
                expect(approvalBadges[3].textContent?.trim()).toContain('Duyệt lúc:');
            } else {
                expect(root.querySelectorAll('.content-panel-status .course-status-badge').length).toBe(1);
                expect(root.querySelectorAll('.tailieu-header__status .course-status-badge').length).toBe(1);
            }
            root.querySelectorAll<HTMLElement>(
                '.content-panel-status .course-status-badge, .tailieu-header__status .course-status-badge'
            ).forEach(badge => expect(getComputedStyle(badge).borderRadius).toBe('4px'));
        }

        const goalCommentToggle = jasmine.createSpy('goalCommentToggle');
        const materialCommentToggle = jasmine.createSpy('materialCommentToggle');
        component.appNhanxetMuctieu = { showComment: goalCommentToggle } as unknown as typeof component.appNhanxetMuctieu;
        component.appNhanxetTailieu = { showComment: materialCommentToggle } as unknown as typeof component.appNhanxetTailieu;
        commentButtons[0].click();
        commentButtons[1].click();
        expect(goalCommentToggle).toHaveBeenCalledTimes(1);
        expect(materialCommentToggle).toHaveBeenCalledTimes(1);

        goal.comments = undefined;
        material.comments = [];
        fixture.detectChanges();
        expect(root.querySelector('.content-comment-toggle')).toBeNull();
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
