import { Component, inject, OnInit, SimpleChanges } from '@angular/core';
import { ElnKhoaHoc } from "@shared/models/elng-khoa-hoc";
import { DonVi } from "@shared/models/don-vi";
import {
    objectFillter
} from "@modules/admin/features/thongke-solieu-tonghop/ketqua-test-sinhvien/ketqua-test-sinhvien.component";
import { ElngUserProfile } from "@shared/models/elng-user-profile";
import { AuthService } from "@core/services/auth.service";
import { DonViService } from "@shared/services/don-vi.service";
import { ElnKhoaHocService } from "@shared/services/elearning-khoa-hoc.service";
import { CoursePlanActivitiesService } from "@shared/services/course-plan-activities.service";
import { CourseQuestionsService } from "@shared/services/course-questions.service";
import { NotificationService } from "@core/services/notification.service";
import { HttpParamsHeplerService } from "@core/services/http-params-hepler.service";
import { ClassesService } from "@shared/services/classes.service";
import { ElngUserProfileService } from "@shared/services/elearning-user-profile.service";
import { OvicQueryCondition } from "@core/models/dto";
import { forkJoin, Observable, of, switchMap } from "rxjs";
import { ConditionOption } from "@shared/models/condition-option";
import { map } from "rxjs/operators";
import { CoursePlanActivities } from "@shared/models/course-plan-activities";
import { CourseQuestions } from "@shared/models/course-questions";
import { CoursePlanActivityTuluan } from "@shared/models/course-plan-activity-tuluan";
import { CoursePlanActivityTuluanService } from "@shared/services/course-plan-activity-tuluan.service";
import { ROLES } from '@modules/shared/utils/syscat';
import { SharedModule } from '@modules/shared/shared.module';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DialogModule } from 'primeng/dialog';
import { PaginatorModule } from 'primeng/paginator';
import { TableModule } from 'primeng/table';

@Component({
    standalone: true,
    imports: [CommonModule, SharedModule, TableModule, PaginatorModule, DialogModule, MatProgressBarModule],
    selector: 'app-ketqua-nghiem-cauhoi-tuluan-kthp',
    templateUrl: './ketqua-nghiem-cauhoi-tuluan-kthp.component.html',
    styleUrls: ['./ketqua-nghiem-cauhoi-tuluan-kthp.component.css']
})
export class KetquaNghiemCauhoiTuluanKthpComponent implements OnInit {
    private auth = inject(AuthService);
    private donViService = inject(DonViService);
    private elnKhoaHocService = inject(ElnKhoaHocService);
    private coursePlanActivitiesService = inject(CoursePlanActivitiesService);
    private courseQuestionsService = inject(CourseQuestionsService);
    private noitifi = inject(NotificationService);
    private httpHelper = inject(HttpParamsHeplerService);
    private classesService = inject(ClassesService);
    private elngUserProfileService = inject(ElngUserProfileService);
    private coursePlanActivityTuluanService = inject(CoursePlanActivityTuluanService);
    ds_dotCapnhat: ElnKhoaHoc[];

    list_cdr: ElnKhoaHoc[];
    list_cdr_clone: ElnKhoaHoc[];
    limitCourse: number = 20;
    totalCourse: number = 0;
    donviId: number;
    isManager: boolean;
    list_donvi_chuyenmon: DonVi[] = [];
    listHocky = [];
    listNamhoc = [];
    check_number_questions =
        [
            { title: 'Có câu hỏi ', value: 0 },
            { title: 'Chưa có câu hỏi ', value: 1 }
        ];
    type_have_question: number = 0;

    objectFilter: objectFillter = {
        category_id: 0,
        hocky: 0,
        namhoc: '0',
    };
    user_profile: ElngUserProfile;
    userId: number;
    isLanhDaoKhoa: boolean = false;
    progressValue: number = 0;
    displayModal: boolean = false;
    waitting_title: string = 'Vui lòng không tắt trình duyệt';

    constructor(
    ) {
        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin);
        if (this.isManager) {
            this.donviId = 105;
        } else {
            this.donviId = this.auth.user.donvi_id;
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['parent_Khoa']) {
            this.donviId = changes['parent_Khoa'].currentValue;
            this.loadData();
        }

    }

    ngOnInit() {
        this.noitifi.isProcessing(true);
        this.userId = this.auth.user.id;
        this.donviId = this.auth.user.donvi_id;
        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin);
        this.isLanhDaoKhoa = this.auth.userHasRole(ROLES.lanhdaokhoa);
        // this.noitifi.isProcessing(true);
        this.initData();
    }

    onChangeDonviCM(event) {
        if (event) {
            this.objectFilter.category_id = event['id'];
        } else {
            this.objectFilter.category_id = null;
        }
        this.loadData();
    }


    // onChangeFilter(event, keyName: string) {
    //     if (event) {
    //         this.objectFilter[keyName] = event['value'];
    //     } else {
    //         this.objectFilter[keyName] = null;
    //     }
    //
    // }


    initData() {
        this.noitifi.isProcessing(true);
        const condition_group_namhoc = this.httpHelper.paramsConditionBuilder(
            [
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' },
            ]).set('order', 'DESC').set('orderby', 'namhoc').set("groupby", "namhoc").set("limit", -1);

        const condition_group_hocky = this.httpHelper.paramsConditionBuilder(
            [
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' },
            ]).set('order', 'DESC').set('orderby', 'hocky').set("groupby", "hocky").set("limit", -1);

        const condition_donvi = this.httpHelper.paramsConditionBuilder([
            { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' },
            {
                conditionName: 'parent_id',
                condition: OvicQueryCondition.equal,
                value: this.auth.user.donvi_id.toString(),
                orWhere: 'and'
            },
        ]).set("limit", -1)


        const arr_condition = [
            { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' },
            {
                conditionName: 'donvi_id',
                condition: OvicQueryCondition.equal,
                value: this.donviId.toString(),
                orWhere: 'and'
            },
        ];
        const condition_courses: ConditionOption = {
            condition: [
                {
                    condition: OvicQueryCondition.notEqual, conditionName: 'dot_capnhat', value: ''
                }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'orderby', value: 'dot_capnhat' },
                { label: 'order', value: 'ASC' },
                { label: 'groupby', value: 'dot_capnhat' },
                { label: 'select', value: 'id,dot_capnhat' },
            ],
            page: null,
        };

        forkJoin([
            this.classesService.getClassesByCols(condition_group_namhoc),
            this.classesService.getClassesByCols(condition_group_hocky),
            this.donViService.getDonViByCols(condition_donvi),
            this.elngUserProfileService.getElngUserProfileByItem(this.userId.toString(), "user_id"),
            this.elnKhoaHocService.getKhoaHocByPageNew_2(condition_courses)
            // this.elnChuyenMucService.getElnChuyenMucByCols(condition_nganh)

        ]).subscribe({
            next: ([_resNamhoc, _resHocky, _resCategory, _userProfile, _dot_capnhat]) => {
                this.ds_dotCapnhat = _dot_capnhat.data;
                this.user_profile = _userProfile[0];
                this.list_donvi_chuyenmon = _resCategory;
                if (this.list_donvi_chuyenmon.length) {
                    if (this.user_profile.donvi_chuyenmon_id) {
                        this.objectFilter.category_id = this.user_profile.donvi_chuyenmon_id;
                    } else {
                        this.objectFilter.category_id = this.list_donvi_chuyenmon[0].id;
                    }
                }
                this.objectFilter.dot_capnhat = _dot_capnhat.data ? _dot_capnhat.data[_dot_capnhat.data.length - 1].dot_capnhat : null;

                this.loadData();
                // this.noitifi.isProcessing(false);


            },
            error: () => { this.noitifi.isProcessing(false); this.noitifi.toastError("Lỗi kết nối"); }
        })
    }

    loadData() {
        //Load khoá học
        this.noitifi.isProcessing(true);
        this.displayModal = true;
        this.waitting_title = "Đang tải dữ liệu, vui lòng không tắt trình duyệt";

        if (this.donviId || this.donviId === 0) {
            const condition_courses: ConditionOption = {
                condition: [{
                    conditionName: 'category_ids',
                    condition: OvicQueryCondition.equal,
                    value: this.objectFilter.category_id.toString()
                }],
                set: [
                    { label: 'limit', value: '-1' },
                    { label: 'orderby', value: 'title' },
                    { label: 'order', value: 'ASC' }
                ],
                page: null,
            };
            if (this.objectFilter.dot_capnhat) {
                condition_courses.condition.push(
                    { conditionName: 'dot_capnhat', condition: OvicQueryCondition.equal, value: this.objectFilter.dot_capnhat, orWhere: "and" }

                )
            }

            //Load số lượng tuần
            const condition_week: ConditionOption = {
                condition: [
                    { conditionName: 'week', condition: OvicQueryCondition.equal, value: '100' }
                ],
                set: [
                    { label: 'groupby', value: 'week' },
                    { label: 'limit', value: '-1' },
                ],
                page: null
            }

            forkJoin([
                this.elnKhoaHocService.getKhoaHocByPageNew_2(condition_courses).pipe(map(m => m.data)),
                this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_week).pipe(map(m => m.data)),
            ]).subscribe({
                next: ([dtKhoaHoc, dtWeekCoures]) => {

                    if (dtKhoaHoc.length > 0) {
                        // this.loopGetPlanActivities(1, [], dtKhoaHoc.data.map(m => m.id), 1000, dtKhoaHoc.data, this.dataWeek);
                        this.getCourseplanActityTuluan(dtKhoaHoc).subscribe({
                            next: ([dtKhoaHocpr, courseTuluan]) => {
                                this.list_cdr = dtKhoaHoc.filter(f => f.params && f.params.exam_format === 'THUCHANH').map(m => {
                                    const courseTuluanBYdtKhoahoc = courseTuluan.length > 0 ? courseTuluan.filter(f => f.course_id === m.id) : [];
                                    const courseTuluanQuestions = courseTuluanBYdtKhoahoc.length > 0 ? courseTuluanBYdtKhoahoc.filter(f => f.type === 'QUESTION') : [];
                                    const courseTuluanGroupQuestions = courseTuluanBYdtKhoahoc.length > 0 ? courseTuluanBYdtKhoahoc.filter(f => f.type === 'GROUP_QUESTION') : [];
                                    // console.log(courseTuluanQuestions, courseTuluanGroupQuestions);
                                    m['_total_question'] = courseTuluanQuestions.length;
                                    m['_total_group_question'] = courseTuluanGroupQuestions.length;
                                    m['_total_question_accept'] = courseTuluanQuestions.length > 0 ? courseTuluanQuestions.filter(f => f.status === 1).length : 0;
                                    m['_total_group_question_accept'] = courseTuluanGroupQuestions.length > 0 ? courseTuluanGroupQuestions.filter(f => f.status === 1).length : 0;


                                    return m;
                                });

                                this.displayModal = false;

                                this.list_cdr_clone = this.list_cdr;
                                this.noitifi.isProcessing(false);

                            }, error: () => {
                                this.displayModal = false;
                                this.list_cdr = []
                                this.list_cdr_clone = [];
                                this.noitifi.isProcessing(false);
                            }
                        })
                    } else {
                        this.list_cdr = [];
                        this.list_cdr_clone = [];

                        this.noitifi.isProcessing(false);
                        this.displayModal = false;

                    }
                },
            })
        }
    }

    getCourseplanActivity(dtKhoaHoc: ElnKhoaHoc[], week: number): Observable<[coursePlanActivities: CoursePlanActivities[], courseQuetion: CourseQuestions[]]> {
        this.progressValue = 20;
        const condition_course_plan_activities: ConditionOption = {
            condition: [
                { conditionName: 'week', condition: OvicQueryCondition.equal, value: week.toString() },
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3' },
                { conditionName: 'type', condition: OvicQueryCondition.equal, value: 'ACTIVITY_CDR' },
            ],
            set: [
                { label: 'include', value: dtKhoaHoc.map(m => m.id).toString() },
                { label: 'include_by', value: 'course_id' },
                { label: 'limit', value: '-1' },
            ],
            page: '1',
        };

        return this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_course_plan_activities).pipe(
            map(m => {
                this.progressValue = 40;
                return m.data;
            }),
            switchMap(e => {
                const cousePlanActivitiesIds = e.map(n => n.id);
                const condition_course_question: ConditionOption = {
                    condition: [
                        {
                            conditionName: 'reference',
                            condition: OvicQueryCondition.equal,
                            value: 'course_plan_activities',
                            orWhere: 'and'
                        },
                        { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
                        // { conditionName: 'group_id', condition: OvicQueryCondition.notEqual, value: '0',orWhere: 'and' },

                    ],
                    set: [
                        { label: 'include', value: cousePlanActivitiesIds.toString() },
                        { label: 'include_by', value: 'reference_id' },
                        { label: 'order', value: 'ASC' },
                        { label: 'orderby', value: 'cdr' },
                        { label: 'limit', value: '-1' },
                        {
                            label: 'select',
                            value: 'id,question_root_id,reference,reference_id,cdr_id,course_id, group_id,cdr,status'
                        }
                    ],
                    page: '1'
                };
                return forkJoin([
                    of(e),
                    this.courseQuestionsService.getCourseQuestionsByPageNew(condition_course_question).pipe(map(m => {
                        this.progressValue = 80;
                        return m.data;
                    }))
                ]);
            })
        )
    }


    getCourseplanActityTuluan(dtKhoaHoc: ElnKhoaHoc[]): Observable<[ElnKhoaHoc[], CoursePlanActivityTuluan[]]> {
        // const ids_courser = dtKhoaHoc.map(m => m.id);

        const condition_course_plan_activities_tuluan: ConditionOption = {
            condition: [
                { conditionName: 'private', condition: OvicQueryCondition.equal, value: '1' },
                // { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3'},
                // { conditionName: 'type', condition: OvicQueryCondition.equal, value: 'ACTIVITY_CDR'},
            ],
            set: [
                { label: 'include', value: dtKhoaHoc.map(m => m.id).toString() },
                { label: 'include_by', value: 'course_id' },
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'id,course_id,type,status' }
            ],
            page: '1',
        };

        return forkJoin([of(dtKhoaHoc),
        this.coursePlanActivityTuluanService.getCoursePlanActivityTuluanByPageNew(condition_course_plan_activities_tuluan).pipe(map(m => m.data))
        ])
    }

    onChangeFilter(event, keyName: string) {

        if (event) {
            this.objectFilter[keyName] = event['dot_capnhat'];
        } else {
            this.objectFilter[keyName] = null;
        }
        this.loadData();

    }

}
