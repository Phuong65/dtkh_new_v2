import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core-new/service/notification.service';
import { CourseConfigService } from '@modules/shared/services/course-config.service';
import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { ConfigsService } from '@shared/services/configs.service';
import { MonhocCauhinhComponent } from './monhoc-cauhinh.component';

describe('MonhocCauhinhComponent mode', () => {
    let fixture: ComponentFixture<MonhocCauhinhComponent>;
    let component: MonhocCauhinhComponent;
    let root: HTMLElement;
    let planLoad: jasmine.Spy;
    let configApi: jasmine.SpyObj<CourseConfigService>;
    let code$: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
    const configs = [
        { config_key: 'PERCENT_SCORE_SUMMARY', params: { cc: 10, kynang: 20 }, value: 0 },
        { config_key: 'NUMOF_TEST_CCTX', params: { TX_TEST: 1 }, value: 0 },
        { config_key: 'PRACTICE_TIME_FOR_A_TEST', params: {}, value: 7 },
        { config_key: 'PERCENT_OF_LEAVE_ALLOWED', params: {}, value: 2 }
    ];
    const configRows = [{ id: 9, course_id: 1, group: 'PERCENT_SCORE_SUMMARY', key: 'cc', value: 10, title: 'Điểm', ordering: 1 }];

    beforeEach(async () => {
        code$ = new BehaviorSubject(convertToParamMap({ code: '1' }));
        planLoad = jasmine.createSpy('getCoursePlanActivitiesByPageNew').and.callFake((condition: any) => {
            const week = condition.condition?.find((item: any) => item.conditionName === 'week');
            return of({ data: week?.value === '1000' ? [{ id: 20, parent_id: 0, week: 1000 }] : [{ week: 1 }] });
        });
        configApi = jasmine.createSpyObj<CourseConfigService>('CourseConfigService', [
            'getCourseConfigByPageNew', 'updateCourseConfig', 'addCourseConfig'
        ]);
        configApi.getCourseConfigByPageNew.and.returnValue(of({ data: configRows.map(row => ({ ...row })) } as any));
        configApi.updateCourseConfig.and.returnValue(of(1));
        configApi.addCourseConfig.and.returnValue(of(10));

        await TestBed.configureTestingModule({
            imports: [MonhocCauhinhComponent],
            providers: [
                provideNoopAnimations(),
                { provide: ActivatedRoute, useValue: { queryParamMap: code$, snapshot: { queryParamMap: convertToParamMap({ code: '1' }) } } },
                { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
                { provide: AuthService, useValue: { user: { id: 1 }, userHasRole: () => false, hasRouter: () => false } },
                { provide: NotificationService, useValue: { toastSuccess: jasmine.createSpy(), toastError: jasmine.createSpy(), toastWarning: jasmine.createSpy() } },
                { provide: ElnKhoaHocService, useValue: { getKhoaHocByPageNew_2: () => of({ data: [{ id: 1, creator_plan_id: 1, params: { sotinchi: 1 } }] }) } },
                { provide: ElngUserProfileService, useValue: { getUserProfileByPageNewV2: () => of({ data: [] }) } },
                { provide: CoursePlanActivitiesService, useValue: { getCoursePlanActivitiesByPageNew: planLoad } },
                { provide: ConfigsService, useValue: { getConfigsByPageNew: () => of({ data: configs }) } },
                { provide: CourseConfigService, useValue: configApi }
            ]
        }).overrideComponent(MonhocCauhinhComponent, {
            set: { imports: [CommonModule], schemas: [NO_ERRORS_SCHEMA] }
        }).compileComponents();

        fixture = TestBed.createComponent(MonhocCauhinhComponent);
        component = fixture.componentInstance;
        root = fixture.nativeElement;
    });

    async function render(mode: 'all' | 'settings-only' = 'all'): Promise<void> {
        fixture.componentRef.setInput('mode', mode);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
        expect(component.state()).toBe('success');
    }

    it('giữ chế độ mặc định: danh sách kiểm tra và bốn nhóm điểm', async () => {
        expect(component.mode).toBe('all');
        await render();
        expect(root.querySelector('.config-table-card')).not.toBeNull();
        expect(root.querySelectorAll('.config-setting-card').length).toBe(4);
        expect(planLoad).toHaveBeenCalledTimes(2);
        expect(planLoad).toHaveBeenCalledWith(jasmine.objectContaining({
            condition: jasmine.arrayContaining([jasmine.objectContaining({ conditionName: 'week', value: '1000' })])
        }));
    });

    it('settings-only hiển thị điểm dù chưa có kế hoạch kiểm tra, không tải tuần 1000', async () => {
        await render('settings-only');
        expect(component.plan_kiemtra).toBeNull();
        expect(root.querySelector('.config-table-card')).toBeNull();
        expect(root.querySelectorAll('.config-setting-card').length).toBe(4);
        expect(planLoad).toHaveBeenCalledTimes(1);
        expect(planLoad.calls.allArgs().some(args => JSON.stringify(args).includes('1000'))).toBeFalse();
        expect(component.list_plan.length).toBe(1);
        expect(root.querySelector('.config-settings')?.getAttribute('aria-labelledby')).toBe('settings-title');
        expect(root.querySelector('#settings-title')?.textContent).toContain('THIẾT LẬP ĐIỂM HỌC PHẦN');
    });

    it('giữ API lưu và tải lại cấu hình trong settings-only', async () => {
        await render('settings-only');
        component.course_config_object['PERCENT_SCORE_SUMMARY'][0].value = 25;
        await component.saveCourseConfig();
        expect(configApi.updateCourseConfig).toHaveBeenCalledOnceWith(9, jasmine.objectContaining({ course_id: 1, value: 25 }));
        expect(configApi.addCourseConfig).not.toHaveBeenCalled();
        expect(configApi.getCourseConfigByPageNew).toHaveBeenCalledTimes(2);
        expect(component.isSaving()).toBeFalse();
    });

    it('khóa nhập và không lưu khi không có quyền chỉnh sửa', async () => {
        await render('settings-only');
        component.canAdded = false;
        fixture.detectChanges();
        expect(root.querySelector<HTMLInputElement>('.setting-input')?.disabled).toBeTrue();
        expect(root.querySelector<HTMLButtonElement>('[aria-label="Lưu cài đặt học phần"]')?.disabled).toBeTrue();
        await component.saveCourseConfig();
        expect(configApi.updateCourseConfig).not.toHaveBeenCalled();
        expect(configApi.addCourseConfig).not.toHaveBeenCalled();
    });

    it('giữ giá trị mặc định, lọc số và thời hạn theo từng bài', async () => {
        configApi.getCourseConfigByPageNew.and.returnValue(of({ data: [] } as any));
        await render('settings-only');
        const practice = component.course_config_object['PRACTICE_TIME_FOR_A_TEST'];
        const item = practice.find(row => row.key === 'DEFAULT')!;
        const except = practice.find(row => row.key === 'EXCEPT')!;
        expect(item.value).toBe(7);
        expect(except.params[1]).toBe(7);
        const input = root.querySelector<HTMLInputElement>('#practice-DEFAULT')!;
        input.value = '12x';
        input.dispatchEvent(new Event('input'));
        expect(input.value).toBe('12');
        expect(item.value).toBe(12);
        expect(except.params[1]).toBe(12);
        await component.saveCourseConfig();
        expect(configApi.addCourseConfig).toHaveBeenCalled();
        expect(configApi.updateCourseConfig).not.toHaveBeenCalled();
    });

    it('hiển thị lỗi tải cấu hình, không báo thành công giả', async () => {
        configApi.getCourseConfigByPageNew.and.returnValue(throwError(() => new Error('Unavailable')));
        fixture.componentRef.setInput('mode', 'settings-only');
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
        expect(component.state()).toBe('error');
        expect(root.querySelector('.admin-table__alert-danger')?.textContent).toContain('Không thể tải cấu hình học phần');
        expect(root.querySelector('.config-settings')).toBeNull();
    });
});
