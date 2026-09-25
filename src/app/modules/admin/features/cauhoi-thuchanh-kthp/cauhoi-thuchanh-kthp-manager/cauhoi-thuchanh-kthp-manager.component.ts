import { CoursePlanActivitiesService } from '@shared/services/course-plan-activities.service';
import { ElngUserProfileService } from '@shared/services/elearning-user-profile.service';
import { HelperService } from '@core/services/helper.service';
import { NotificationService } from '@core/services/notification.service';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'primeng/api';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OvicQueryCondition } from '@core/models/dto';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { ElnKhoaHoc, EXAMFORMAT } from '@modules/shared/models/elng-khoa-hoc';
import { CHUAN_DAU_RA, ROUTERS } from '@modules/shared/utils/syscat';
import { forkJoin, mergeMap, of } from 'rxjs';
import { ElngUserProfile } from '@modules/shared/models/elng-user-profile';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { CoursePlanActivityTuluanService } from '@modules/shared/services/course-plan-activity-tuluan.service';
import { UserService } from '@core/services/user.service';
import { AuthService } from '@core/services/auth.service';
import { DonViService } from '@modules/shared/services/don-vi.service';
import { DonVi } from '@modules/shared/models/don-vi';
import { Route, Router, RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';

@Component({
    selector: 'app-cauhoi-thuchanh-kthp-manager',
    standalone: true,
    imports: [
        CommonModule,
        SharedModule,
        FormsModule,
        ReactiveFormsModule,
        TableModule,
        RouterModule,
        PaginatorModule
    ],
    templateUrl: './cauhoi-thuchanh-kthp-manager.component.html',
    styleUrls: ['./cauhoi-thuchanh-kthp-manager.component.css']
})
export class CauhoiThuchanhKthpManagerComponent implements OnInit {

    searchCourse: string;

    limitCourse: number = 25;

    totalCourse: number = 0;

    dmKhoahoc: ElnKhoaHoc[];

    user_profile: ElngUserProfile;

    routerLanhdaokhoa: boolean = false;

    routerLanhdaobomon: boolean = false;

    routerDaotao: boolean = false;

    routerKhaothi: boolean = false;

    routerGiangvien: boolean = false;

    routerAdmin: boolean = false;

    courseSelected: ElnKhoaHoc;

    categoryFilter: number;

    my_course: boolean = false;

    userId: number;

    list_donvi_chuyenmon: DonVi[];

    donviId: number;

    canAdd: boolean = false;

    canDelete: boolean = false;

    canUpdate: boolean = false;

    pageCourseIndex: number = 1;

    constructor(
        private notificationService: NotificationService,
        private helperService: HelperService,
        private elnKhoaHocService: ElnKhoaHocService,
        private coursePlanActivityTuluanService: CoursePlanActivityTuluanService,
        private userService: UserService,
        private elngUserProfileService: ElngUserProfileService,
        private auth: AuthService,
        private donViService: DonViService,
        private router: Router,
        private coursePlanActivitiesService: CoursePlanActivitiesService
    ) {
        const url = this.router.url.substring(7).split('?')[0];

        this.routerAdmin = this.auth.hasRouter(ROUTERS.admin);

        this.routerDaotao = this.auth.hasRouter(ROUTERS.daotao);

        this.routerLanhdaokhoa = this.auth.hasRouter(ROUTERS.lanhdao_khoa);

        this.routerGiangvien = this.auth.hasRouter(ROUTERS.giangvien);

        this.routerKhaothi = this.auth.hasRouter(ROUTERS.khaothi);

        this.routerLanhdaobomon = this.auth.hasRouter(ROUTERS.lanhdao_bomon);

        this.canAdd = this.auth.userCanAdd(url);

        this.canDelete = this.auth.userCanDelete(url);

        this.canUpdate = this.auth.userCanEdit(url);

        this.userId = this.auth.user.id;

        this.donviId = this.auth.user.donvi_id;
    }

    ngOnInit(): void {
        this.notificationService.isProcessing(true);

        const condition_profile: ConditionOption = {
            condition:
                [
                    {
                        conditionName: 'user_id',
                        condition: OvicQueryCondition.equal,
                        value: this.userId.toString(),
                    },
                ],
            set: [],
            page: null,
        };

        const condition_donvi: ConditionOption = {
            condition: [
                {
                    conditionName: 'parent_id',
                    condition: OvicQueryCondition.equal,
                    value: this.auth.user.donvi_id.toString(),
                },
                {
                    conditionName: 'status',
                    condition: OvicQueryCondition.greaterThan,
                    value: '0',
                    orWhere: 'and',
                },
            ],

            set: [
                { label: 'limit', value: '-1' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'title' }
            ],

            page: null,
        };



        forkJoin([
            this.elngUserProfileService.getUserProfileByPageNewV2(condition_profile),
            this.donViService.getDonviByPageNew(condition_donvi),
        ]).subscribe({
            next: ([_userProfile, _donvi]) => {

                this.list_donvi_chuyenmon = _donvi.data;

                if (_userProfile.recordsFiltered) {
                    this.user_profile = _userProfile.data[0];
                    if (this.routerLanhdaokhoa)
                        this.categoryFilter = this.user_profile.donvi_chuyenmon_id;
                }

                this.notificationService.isProcessing(false);

                this.loadPageData_course(1);
            },
            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError('Lỗi kết nối, vui lòng thử lại');
            },
        });
    }

    loadPageData_course(page: number) {
        this.dmKhoahoc = [];
        const condition_course: ConditionOption = {
            condition: [
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and', },
                { conditionName: 'params', condition: OvicQueryCondition.like, value: '%THUCHANH%', orWhere: 'and', },

            ],
            set: [
                { label: 'orderby', value: 'title' },
                { label: 'limit', value: this.limitCourse.toString() },
                { label: 'with', value: 'creatorPlan' }
            ],
            page: page.toString()
        }

        if (this.routerLanhdaokhoa && (!this.user_profile || !this.user_profile.donvi_chuyenmon_id)) {
            this.notificationService.isProcessing(false)
            return this.notificationService.toastInfo("Thầy/Cô chưa được phân vào khoa trong hệ thống, vui lòng liên hệ phòng đào tạo");
        }

        if (this.categoryFilter || this.routerLanhdaokhoa) {
            condition_course.condition.push({ conditionName: 'category_ids', condition: OvicQueryCondition.equal, value: this.categoryFilter.toString(), orWhere: 'and' });
        }

        if (this.routerLanhdaobomon) {
            if (this.user_profile.bomon_id) {
                condition_course.condition.push({ conditionName: 'nganh_bomon_id', condition: OvicQueryCondition.equal, value: this.user_profile.bomon_id.toString(), orWhere: 'and' });
            } else {
                this.notificationService.isProcessing(false)
                return this.notificationService.toastInfo("Thầy/Cô chưa được phân vào bộ môn trong hệ thống, vui lòng liên hệ phòng đào tạo");
            }
        }

        if (this.routerGiangvien) {
            this.my_course = true;
        }

        if (this.my_course) {
            condition_course.condition.push({ conditionName: 'creator_plan_id', condition: OvicQueryCondition.equal, value: this.user_profile.user_id.toString(), orWhere: 'and' });
        }

        if (this.searchCourse) {
            condition_course.condition.push({ conditionName: 'title', condition: OvicQueryCondition.like, value: '%' + this.searchCourse.toString() + '%', orWhere: 'and' });
        }

        this.elnKhoaHocService.getKhoaHocByPageNew_2(condition_course).pipe(mergeMap((_course_ => {

            const _course_ids = [];

            _course_.data.forEach(f => {
                _course_ids.push(f.id);
            })

            if (_course_ids.length) {
                const condition_tuluan: ConditionOption = {
                    condition: [
                        { conditionName: 'course_plan_activity_id', condition: OvicQueryCondition.equal, value: '0', orWhere: 'and' },
                        { conditionName: 'form_th_kthp_id', condition: OvicQueryCondition.notEqual, value: '0', orWhere: 'and' },
                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'include', value: _course_ids.toString() },
                        { label: 'include_by', value: 'course_id' },
                        { label: 'select', value: 'course_id,status,type,course_plan_activity_id' }
                    ],
                    page: null
                }

                return this.coursePlanActivityTuluanService.getCoursePlanActivityTuluanByPageNew(condition_tuluan).pipe(mergeMap((_tuluan) => {
                    _course_.data.forEach(f => {
                        const course_tuluan = _tuluan.data.filter(m => m.course_id === f.id);
                        f['_daduyet_cauhoi'] = course_tuluan.filter(m => m.status === 1).length;
                        f['_choduyet_cauhoi'] = course_tuluan.filter(m => m.status === 0 || m.status === -2).length;
                        f['_yeucausua_cauhoi'] = course_tuluan.filter(m => m.status === -1).length;
                        f['_tong_cauhoi'] = course_tuluan.length;
                    })
                    return of(_course_);
                }))
            }
            return of(_course_);
        }))).subscribe({
            next: (_course) => {
                this.totalCourse = _course.recordsFiltered;
                if (_course.data && _course.data.length) {

                    const _index_start = (page - 1) * this.limitCourse;

                    _course.data.forEach((f, key) => {
                        f["index_"] = _index_start + key + 1;

                        if (f.creatorPlan) {
                            f['creator_name'] = f.creatorPlan.display_name;
                        } else {
                            f['creator_name'] = "Chưa phân quyền";
                        }

                        if (f.params) {
                            if (!f.params.exam_type) {
                                const index = EXAMFORMAT.findIndex((m) => m.key === f.params.exam_format);
                                if (index !== -1) {
                                    f['hinhthucthi'] = EXAMFORMAT[index].label;
                                }
                            } else {
                                const index = EXAMFORMAT.findIndex((m) => m.id === f.params.exam_type);
                                if (index !== -1) {
                                    f['hinhthucthi'] = EXAMFORMAT[index].label;
                                }
                            }

                            const sotinchi = f.params.sotinchi ? f.params.sotinchi : 0;
                            const sotinchi_th = f.params['sotinchi_th'] ? f.params['sotinchi_th'] : 0;
                            const index_m = EXAMFORMAT.findIndex((m) => m.key === f.params.exam_format);
                            let exam = 'Chưa có thông tin';

                            if (index_m !== -1) {
                                exam = EXAMFORMAT[index_m].label;
                            }

                            f['info_'] = ' - TC: ' + sotinchi.toString().concat('-', sotinchi_th.toString(), ' - ', f['hinhthucthi']);
                        }
                    });

                    this.dmKhoahoc = _course.data;

                    if (this.dmKhoahoc && this.dmKhoahoc.length) {
                        if (this.courseSelected) {
                            const index = this.dmKhoahoc.findIndex(m => m.id === this.courseSelected.id);
                            if (index !== -1) {
                                this.courseSelected = this.dmKhoahoc[index];
                            }
                        } else {
                            this.courseSelected = this.dmKhoahoc[0];
                        }
                    }
                }

                this.notificationService.isProcessing(false);
            },

            error: () => {
                this.notificationService.isProcessing(false);
            }
        })

    }

    onSearchByTitle() {
        this.dmKhoahoc = null;
        this.loadPageData_course(0);
    }

    changePage(event) {
        this.pageCourseIndex = event.page + 1;
        this.loadPageData_course(event.page + 1);
    }
}
