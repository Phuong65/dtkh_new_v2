import { Component, inject, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { OvicQueryCondition } from '@core/models/dto';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { CoursePlanActivities } from '@modules/shared/models/course-plan-activities';
import { DonVi } from '@modules/shared/models/don-vi';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';
import { CourseQuestionsService } from '@modules/shared/services/course-questions.service';
import { DonViService } from '@modules/shared/services/don-vi.service';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { forkJoin } from 'rxjs';

import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { ClassesService } from '@modules/shared/services/classes.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { ElngUserProfile } from '@modules/shared/models/elng-user-profile';
import { ROLES } from '@modules/shared/utils/syscat';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@modules/shared/shared.module';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { DialogModule } from 'primeng/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';

interface objectFillter {
    category_id?: number;
    namhoc?: string;
    hocky?: number;
    dot_capnhat: string;
}

@Component({
    standalone: true,
    imports: [CommonModule, SharedModule, TableModule, PaginatorModule, DialogModule, MatProgressBarModule],
    selector: 'app-ketqua-caycelo-noidungkhac',
    templateUrl: './ketqua-caycelo-noidungkhac.component.html',
    styleUrls: ['./ketqua-caycelo-noidungkhac.component.css']
})
export class KetquaCayceloNoidungkhacComponent implements OnInit, OnChanges {
    private auth = inject(AuthService);
    private donViService = inject(DonViService);
    private elnKhoaHocService = inject(ElnKhoaHocService);
    private coursePlanActivitiesService = inject(CoursePlanActivitiesService);
    private courseQuestionsService = inject(CourseQuestionsService);
    private noitifi = inject(NotificationService);
    private sanitizer = inject(DomSanitizer);
    private httpHelper = inject(HttpParamsHeplerService);
    private classesService = inject(ClassesService);
    private elngUserProfileService = inject(ElngUserProfileService);
    _parent_Khoa: number;
    ds_dotCapnhat: ElnKhoaHoc[];
    list_cdr: ElnKhoaHoc[];
    dataWeek: CoursePlanActivities[];
    limitCourse = 20;
    totalCourse = 0;
    donviId: number;
    isManager: boolean;
    dataAllContent: any[];
    list_donvi_chuyenmon: DonVi[] = [];
    listHocky = [];
    listNamhoc = [];

    objectFilter: objectFillter = {
        category_id: 0,
        hocky: 0,
        namhoc: '0',
        dot_capnhat: null,
    };
    user_profile: ElngUserProfile;
    userId: number;
    isLanhDaoKhoa: boolean = false;
    progressValue = 0;
    displayModal = false;
    waitting_title = 'Vui lòng không tắt trình duyệt';

    constructor(
    ) {
        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin) ? true : false;
        if (this.isManager) {
            this.donviId = 105;
        }
        else {
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
        this.userId = this.auth.user.id;
        this.donviId = this.auth.user.donvi_id;
        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin);
        this.isLanhDaoKhoa = this.auth.userHasRole(ROLES.lanhdaokhoa);
        // this.noitifi.isProcessing(true);
        this.initData();
    }

    initData() {
        this.displayModal = true;
        this.waitting_title = "Đang tải dữ liệu, vui lòng không tắt trình duyệt";

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
            { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: this.auth.user.donvi_id.toString(), orWhere: 'and' },
        ]).set("limit", -1)


        const arr_condition = [
            { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' },
            { conditionName: 'donvi_id', condition: OvicQueryCondition.equal, value: this.donviId.toString(), orWhere: 'and' },
        ];

        const condition_nganh = this.httpHelper.paramsConditionBuilder(arr_condition).set('limit', '-1');

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
        this.displayModal = true;
        this.waitting_title = "Đang tải dữ liệu, vui lòng không tắt trình duyệt";
        // this.noitifi.isProcessing(true);

        if (this.donviId || this.donviId === 0) {
            const condition_courses: ConditionOption = {
                condition: [
                    { conditionName: 'category_ids', condition: OvicQueryCondition.equal, value: this.objectFilter.category_id.toString(), orWhere: "and" },
                ],
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
                    {
                        conditionName: 'week',
                        condition: OvicQueryCondition.notEqual,
                        value: '1000'
                    }
                ],
                set: [
                    { label: 'groupby', value: 'week' },
                    { label: 'limit', value: '-1' },
                ],
                page: null
            }

            forkJoin([
                this.elnKhoaHocService.getKhoaHocByPageNew_2(condition_courses),
                this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_week),
            ]).subscribe({
                next: ([dtKhoaHoc, dtWeekCoures]) => {
                    // this.displayModal = true;
                    this.dataWeek = dtWeekCoures.data.filter(dt => dt.week > 0 && dt.week < 13);
                    if (dtKhoaHoc.data.length > 0) {
                        this.loopGetPlanActivities(1, [], dtKhoaHoc.data.map(m => m.id), 1000, dtKhoaHoc.data, this.dataWeek);
                    }
                    else {
                        this.displayModal = false;
                        this.list_cdr = [];
                        this.noitifi.isProcessing(false);

                    }
                },
            })
        }
    }

    changePage(event) {
        // ( event.page + 1 );
    }

    loopGetPlanActivities(page: number, plan: CoursePlanActivities[], ids: number[], recordsFiltered: number, dtKhoahoc: ElnKhoaHoc[], dtWeek: CoursePlanActivities[]) {
        if (plan.length < recordsFiltered) {
            this.progressValue = plan.length / recordsFiltered * 100;
            const condition_plan_activities: ConditionOption = {
                condition: [
                    { conditionName: 'week', condition: OvicQueryCondition.greaterThan, value: '0', orWhere: 'and' },
                    { conditionName: 'week', condition: OvicQueryCondition.lessThan, value: '100', orWhere: 'and' },
                    { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' }
                ],
                set: [
                    { label: 'include', value: ids.toString() },
                    { label: 'include_by', value: 'course_id' },
                    { label: 'limit', value: '500' },
                ],
                page: page.toString(),
            };

            this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_plan_activities).subscribe({
                next: (dataPlans) => {

                    this.loopGetPlanActivities(page + 1, plan.concat(dataPlans.data), ids, dataPlans.recordsFiltered, dtKhoahoc, dtWeek);
                },
                error: () => {

                }
            })
        } else {
            this.list_cdr = dtKhoahoc.map(kh => {
                kh['__plans'] = plan.filter(pl => pl.course_id === kh.id).sort((a, b) => (a.week - b.week));

                kh['__celoResult'] = this.dataWeek.map(week => {
                    const plansForWeek = kh['__plans'].filter(p => p.week === week.week && p.type === 'ACTIVITY_CDR');
                    const countStatus1 = plansForWeek.filter(p => p.status === 1).length;
                    const countValidPlans = plansForWeek.filter(p => p.status !== -3).length;
                    return countValidPlans > 0 ? (countStatus1 === countValidPlans ? 'ĐẠT' : `${countStatus1}/${countValidPlans}`) : '-';
                });

                kh['__otherResult'] = this.dataWeek.map(week => {
                    const plansForWeek = kh['__plans'].filter(p => p.week === week.week && p.type === 'ACTIVITY');
                    if (plansForWeek.length > 0) {
                        const countStatus1 = plansForWeek.filter(p => p.status === 1).length;
                        return countStatus1 === 1 ? 'ĐẠT' : 'Chưa đạt';
                    }
                    return '-';
                });
                return kh;
            });

            this.noitifi.isProcessing(false);
            this.displayModal = false;
        }
    }


    onChangeDonviCM(event) {
        if (event) {
            this.objectFilter.category_id = event['id'];
        } else {
            this.objectFilter.category_id = null;
        }
        this.loadData();
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
