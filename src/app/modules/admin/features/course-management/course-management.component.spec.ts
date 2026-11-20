import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { FileService } from '@core/services/file.service';
import { UserService } from '@core/services/user.service';
import { NotificationService as IctuNotificationService } from '@core-new/service/notification.service';
import { CourseManagementComponent } from './course-management.component';
import { CtdtService } from '@modules/shared/services/ctdt.service';
import { DonViService } from '@modules/shared/services/don-vi.service';
import { ElnChuyenMucService } from '@modules/shared/services/elearning-chuyen-muc.service';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';
import { HoidongThamdinhMonhocService } from '@modules/shared/services/hoidong-thamdinh-monhoc.service';
import { HoidongThamdinhService } from '@modules/shared/services/hoidong-thamdinh.service';

describe('CourseManagementComponent role scope', () => {
    let fixture: ComponentFixture<CourseManagementComponent>;
    let courseService: jasmine.SpyObj<ElnKhoaHocService>;
    let profileService: jasmine.SpyObj<ElngUserProfileService>;
    let routeUrl: string;
    let profileResponse: any;

    beforeEach(async () => {
        routeUrl = '/admin/giang-vien/quanly-monhoc';
        profileResponse = of([]);
        courseService = jasmine.createSpyObj<ElnKhoaHocService>('ElnKhoaHocService', ['getKhoaHocByPageNew_2']);
        courseService.getKhoaHocByPageNew_2.and.returnValue(of({ data: [], recordsFiltered: 0 }));
        profileService = jasmine.createSpyObj<ElngUserProfileService>('ElngUserProfileService', ['getElngUserProfileByCol']);
        profileService.getElngUserProfileByCol.and.callFake(() => profileResponse);

        await TestBed.configureTestingModule({
            imports: [CourseManagementComponent],
            providers: [
                { provide: Router, useValue: { get url() { return routeUrl; } } },
                {
                    provide: AuthService,
                    useValue: {
                        user: { id: 12 },
                        hasRouter: () => false,
                        userCanEdit: () => false,
                        userCanDelete: () => false,
                        userCanAccess: () => false
                    }
                },
                { provide: ElnKhoaHocService, useValue: courseService },
                { provide: ElngUserProfileService, useValue: profileService },
                { provide: CtdtService, useValue: { getCtdtByPageNew: () => of({ data: [] }) } },
                { provide: DonViService, useValue: { getDonviByPageNew: () => of({ data: [] }) } },
                { provide: ElnChuyenMucService, useValue: { getChuyemucByPageNew: () => of({ data: [] }) } },
                { provide: UserService, useValue: {} },
                { provide: NotificationService, useValue: {} },
                { provide: IctuNotificationService, useValue: {} },
                { provide: FileService, useValue: {} },
                { provide: CoursePlanActivitiesService, useValue: {} },
                { provide: HoidongThamdinhMonhocService, useValue: {} },
                { provide: HoidongThamdinhService, useValue: {} }
            ]
        }).overrideComponent(CourseManagementComponent, {
            set: { template: '', imports: [] }
        }).compileComponents();
    });

    function createComponent(): CourseManagementComponent {
        fixture = TestBed.createComponent(CourseManagementComponent);
        fixture.detectChanges();
        return fixture.componentInstance;
    }

    it('filters lecturer courses by either assignment while preserving shared filters in both branches', () => {
        createComponent();

        const option = courseService.getKhoaHocByPageNew_2.calls.mostRecent().args[0];
        const conditions = option.condition;
        expect(conditions.filter(condition => condition.conditionName === 'creator_plan_id'))
            .toEqual([jasmine.objectContaining({ value: '12', orWhere: 'and' })]);
        expect(conditions.filter(condition => condition.conditionName === 'creator_exam_id'))
            .toEqual([jasmine.objectContaining({ value: '12', orWhere: 'and' })]);
        expect(conditions.filter(condition => condition.conditionName === 'status').length).toBe(2);
        expect(conditions.find(condition => condition.conditionName === 'status' && condition.orWhere === 'or')).toBeTruthy();
    });

    it('scopes faculty-leader courses to the faculty in the profile', () => {
        routeUrl = '/admin/lanhdao-khoa/quanly-monhoc';
        profileResponse = of([{ donvi_chuyenmon_id: 45 }]);
        const component = createComponent();

        expect(component.state()).toBe('success');
        expect(courseService.getKhoaHocByPageNew_2.calls.mostRecent().args[0].condition)
            .toContain(jasmine.objectContaining({ conditionName: 'category_ids', value: '45', orWhere: 'and' }));
        expect(profileService.getElngUserProfileByCol).toHaveBeenCalledWith('user_id', '12');
    });

    it('scopes department-leader courses to the department in the profile', () => {
        routeUrl = '/admin/lanhdao-bomon/quanly-monhoc';
        profileResponse = of([{ bomon_id: 78 }]);
        const component = createComponent();

        expect(component.state()).toBe('success');
        expect(courseService.getKhoaHocByPageNew_2.calls.mostRecent().args[0].condition)
            .toContain(jasmine.objectContaining({ conditionName: 'nganh_bomon_id', value: '78', orWhere: 'and' }));
    });

    it('fails closed without a faculty profile scope', () => {
        routeUrl = '/admin/lanhdao-khoa/quanly-monhoc';
        profileResponse = of([]);
        const component = createComponent();

        expect(component.state()).toBe('error');
        expect(courseService.getKhoaHocByPageNew_2).not.toHaveBeenCalled();
    });
});
