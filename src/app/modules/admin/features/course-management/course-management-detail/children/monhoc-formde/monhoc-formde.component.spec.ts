import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core-new/service/notification.service';
import { CourseFormCcService } from '@modules/shared/services/course-form-cc.service';
import { CourseFormCommentService } from '@shared/services/course-form-comment.service';
import { CourseFormDgService } from '@modules/shared/services/course-form-dg.service';
import { CourseFormDuyetService } from '@shared/services/course-form-duyet.service';
import { CourseFormTuluan15pService } from '@modules/shared/services/course-form-tuluan-15p.service';
import { CourseFormTxService } from '@modules/shared/services/course-form-tx.service';
import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';
import { CoursePlanActivityTuluanService } from '@modules/shared/services/course-plan-activity-tuluan.service';
import { CoursePlanBankService } from '@modules/shared/services/course-plan-bank.service';
import { CourseQuestionsService } from '@modules/shared/services/course-questions.service';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { HelperService } from '@core/services/helper.service';
import { HoidongThamdinhMonhocService } from '@modules/shared/services/hoidong-thamdinh-monhoc.service';
import { HoidongThamdinhMonhocThanhvienService } from '@modules/shared/services/hoidong-thamdinh-monhoc-thanhvien.service';
import { HoidongThamdinhService } from '@modules/shared/services/hoidong-thamdinh.service';
import { MonhocFormdeComponent } from './monhoc-formde.component';
import { PlanActivityCdr } from '../monhoc-question-cdr/monhoc-question-cdr.component';

describe('MonhocFormdeComponent essay integration', () => {
    let fixture: ComponentFixture<MonhocFormdeComponent>;
    let component: MonhocFormdeComponent;
    const code$ = new BehaviorSubject(convertToParamMap({ code: '1' }));

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MonhocFormdeComponent],
            providers: [
                provideNoopAnimations(),
                { provide: ActivatedRoute, useValue: { queryParamMap: code$, snapshot: { queryParamMap: convertToParamMap({ code: '1' }) } } },
                { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
                { provide: AuthService, useValue: { user: { id: 1 }, userHasRole: () => true, hasRouter: () => true } },
                { provide: NotificationService, useValue: { toastSuccess: jasmine.createSpy(), toastError: jasmine.createSpy(), toastWarning: jasmine.createSpy() } },
                { provide: HelperService, useValue: { sort: (items: unknown[]) => items } },
                { provide: ElnKhoaHocService, useValue: { getKhoaHocByPageNew_2: () => of({ recordsFiltered: 1, data: [{ id: 1, creator_plan_id: 1, av: 0 }] }) } },
                { provide: ElngUserProfileService, useValue: { getUserProfileByPageNewV2: () => of({ recordsFiltered: 0, data: [] }) } },
                { provide: CourseFormDuyetService, useValue: { getCourseFormDuyetByPageNew: () => of({ recordsFiltered: 0, data: [] }) } },
                { provide: HoidongThamdinhMonhocThanhvienService, useValue: { getHoidongThamdinhMonhocThanhvienByPageNew: () => of({ data: [] }) } },
                { provide: HoidongThamdinhService, useValue: { getHoidongThamdinhByPageNew: () => of({ recordsFiltered: 0, data: [] }) } },
                { provide: HoidongThamdinhMonhocService, useValue: { getHoidongThamdinhMonhocByPageNew: () => of({ data: [] }) } },
                { provide: CourseFormCommentService, useValue: { getCourseFormCommentByPageNew: () => of({ data: [] }) } },
                { provide: CoursePlanActivitiesService, useValue: { getCoursePlanActivitiesByPageNew: () => of({ data: [] }) } },
                { provide: CourseFormCcService, useValue: { getCourseFormCcByPage: () => of({ data: [] }) } },
                { provide: CourseFormDgService, useValue: { getCourseFormDgByPage: () => of({ data: [] }), getCoursePlansByPageNew: () => of({ data: [] }) } },
                { provide: CoursePlanBankService, useValue: { getCoursePlanBankByPageNew: () => of({ data: [] }) } },
                { provide: CourseQuestionsService, useValue: { getCourseQuestionsByPageNew: () => of({ data: [] }) } },
                { provide: CourseFormTxService, useValue: { getCourseFormTxByPage: () => of({ data: [] }) } },
                { provide: CourseFormTuluan15pService, useValue: { getByPage: () => of({ data: [] }) } },
                { provide: CoursePlanActivityTuluanService, useValue: { getCoursePlanActivityTuluanByPageNew: () => of({ data: [] }) } }
            ]
        }).overrideComponent(MonhocFormdeComponent, {
            set: { imports: [CommonModule], schemas: [NO_ERRORS_SCHEMA] }
        }).compileComponents();

        fixture = TestBed.createComponent(MonhocFormdeComponent);
        component = fixture.componentInstance;
        component.selectedCourse = { id: 1 } as any;
        component.isManager = true;
    });

    it('đếm đúng số câu hỏi tự luận đã nhập theo từng bài và CDR', () => {
        const lessons = [{ id: 10, week: 1 }] as PlanActivityCdr[];
        const forms = [{ id: 101, course_id: 1, course_plan_activity_id: 10, week: 1, cdr: 3, ordering: 1, point: 5, question_take: 2 }] as any[];
        const questions = [
            { id: 201, course_id: 1, course_plan_activity_id: 10, cdr: 3 },
            { id: 202, course_id: 1, course_plan_activity_id: 10, cdr: 3 },
            { id: 203, course_id: 1, course_plan_activity_id: 10, cdr: 4 },
            { id: 204, course_id: 2, course_plan_activity_id: 10, cdr: 3 }
        ] as any[];

        const rows = (component as any).buildTuluan15pRows(lessons, forms, questions);
        expect(rows.length).toBe(1);
        expect(rows[0].questionCount).toBe(2);
        expect(rows[0].questionTake).toBe(2);
    });

    it('mở context xem/thêm câu hỏi và chặn chuyển tab khi đang mở context', () => {
        component.state.set('success');
        const tuluanRow = { cdrId: 3 } as any;
        const lesson = { id: 10, week: 1, canEdit: true, tuluan15pRows: [tuluanRow] } as unknown as PlanActivityCdr;
        component.list_test_dg = [lesson];

        component.openEssayContext(lesson, 'list', tuluanRow);
        expect(component.essayContext).toEqual(jasmine.objectContaining({
            lessonId: 10,
            week: 1,
            cdr: 3,
            action: 'list',
            canEdit: true
        }));
        expect(component.essayFormOnly).toBeFalse();

        component.activeIndexTab = 0;
        component.onTabIndexChange(1);
        expect(component.activeIndexTab).toBe(0);

        component.closeEssayContext();
        expect(component.essayContext).toBeNull();
    });

    it('cập nhật snapshot tự luận chỉ cho đúng bài học, giữ nguyên các bài khác', () => {
        const lesson1 = { id: 10, week: 1 } as PlanActivityCdr;
        const lesson2 = { id: 20, week: 2 } as PlanActivityCdr;
        component.list_test_dg = [lesson1, lesson2];
        component.essayContext = { lessonId: 10, week: 1, cdr: 3, action: 'list', canEdit: true };
        component.tuluan15pRows = [
            { id: 1, lessonWeek: 1, coursePlanActivityId: 10, cdrId: 3, stt: 1, cdrLabel: 'CDR3', point: 5, questionTake: 1, questionCount: 0 },
            { id: 2, lessonWeek: 2, coursePlanActivityId: 20, cdrId: 5, stt: 1, cdrLabel: 'CDR5', point: 10, questionTake: 1, questionCount: 4 }
        ];

        component.onEssayDataChanged({
            courseId: 1,
            lessonId: 10,
            week: 1,
            formRows: [{ id: 1, course_id: 1, course_plan_activity_id: 10, week: 1, cdr: 3, ordering: 1, point: 5, question_take: 1 }] as any[],
            questions: [{ id: 301, course_id: 1, course_plan_activity_id: 10, cdr: 3 }] as any[]
        });

        const rowL1 = component.tuluan15pRows.find(r => r.coursePlanActivityId === 10);
        const rowL2 = component.tuluan15pRows.find(r => r.coursePlanActivityId === 20);
        expect(rowL1?.questionCount).toBe(1);
        expect(rowL2?.questionCount).toBe(4);
    });
});
