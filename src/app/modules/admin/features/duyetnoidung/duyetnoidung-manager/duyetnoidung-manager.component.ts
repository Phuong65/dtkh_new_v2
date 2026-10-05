import { CourseQuestionsService } from '@shared/services/course-questions.service';
import { CoursePlanActivityTuluanService } from '@shared/services/course-plan-activity-tuluan.service';
import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';
import { RouterModule } from '@angular/router';
import { HoidongThamdinhMonhocThanhvienService } from './../../../../shared/services/hoidong-thamdinh-monhoc-thanhvien.service';
import { HelperService } from '@core/services/helper.service';
import { OvicDateTimeService } from '@modules/shared/services/ovic-date-time.service';
import { HoidongThamdinhThanhvienService } from './../../../../shared/services/hoidong-thamhdinh-thanhvien.service';
import { HoidongThamdinhService } from '@modules/shared/services/hoidong-thamdinh.service';
import { HoidongThamdinhMonhocService } from '@modules/shared/services/hoidong-thamdinh-monhoc.service';
import { NotificationService } from '@core/services/notification.service';
import { Component, OnInit, inject, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@modules/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { HoidongThamdinh } from '@modules/shared/models/hoidong-thamdinh';
import { ROLES, TYPE_HOIDONG } from '@modules/shared/utils/syscat';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { Table, TableModule } from 'primeng/table';
import { OvicQueryCondition } from '@core/models/dto';
import { firstValueFrom, forkJoin, mergeMap, of } from 'rxjs';
import { EXAMFORMAT } from '@modules/shared/models/elng-khoa-hoc';
import { PaginatorModule } from 'primeng/paginator';
import { SkeletonModule } from 'primeng/skeleton';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { PopoverModule } from 'primeng/popover';
import { CheckboxModule } from 'primeng/checkbox';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { FilterChildPipe } from '@modules/shared/pipes/filter-child.pipe';
import { OvicGroupsRadioV2Component } from '@modules/shared/components/ovic-groups-radio-v2/ovic-groups-radio-v2.component';


@Component({
    selector: 'app-duyetnoidung-manager',
    standalone: true,
    imports: [
        CommonModule,
        SharedModule,
        ReactiveFormsModule,
        FormsModule,
        TableModule,
        RouterModule,
        PaginatorModule,
        SkeletonModule,
        NgbTooltipModule,
        PopoverModule,
        CheckboxModule,
        FilterChildPipe,
        OvicGroupsRadioV2Component
    ],
    templateUrl: './duyetnoidung-manager.component.html',
    styleUrls: ['./duyetnoidung-manager.component.css']
})
export class DuyetnoidungManagerComponent implements OnInit {
    private auth = inject(AuthService);
    private notificationService = inject(NotificationService);
    private hoidongThamdinhMonhocService = inject(HoidongThamdinhMonhocService);
    private hoidongThamdinhService = inject(HoidongThamdinhService);
    private hoidongThamdinhThanhvienService = inject(HoidongThamdinhThanhvienService);
    private ovicDateTimeService = inject(OvicDateTimeService);
    private helperService = inject(HelperService);
    private hoidongThamdinhMonhocThanhvienService = inject(HoidongThamdinhMonhocThanhvienService);
    private coursePlanActivitiesService = inject(CoursePlanActivitiesService);
    private coursePlanActivityTuluanService = inject(CoursePlanActivityTuluanService);
    private courseQuestionsService = inject(CourseQuestionsService);
    private elngUserProfileService = inject(ElngUserProfileService);


    isLanhdaokhoa: boolean = false;

    isManager: boolean = false;

    isKhaothi: boolean = false;

    isDaotao: boolean = false;

    list_hoidong: HoidongThamdinh[] = [];

    selectedHoidong: HoidongThamdinh;

    limit_hoidong: number = 5;

    total_hoidong: number = 0;

    type_hoidong = TYPE_HOIDONG;

    pageIndex: number = 0;

    loadInfo: boolean = false;

    searchCourse: String;

    readonly tableHoidong = viewChild.required<Table>('dt1');

    times_hoidong = [
        { label: 'Đang thực hiện', key: 'dangthuchien' },
        { label: 'Đã kết thúc', key: 'dakethuc' },
        { label: 'Đã hoàn thành', key: 'dahoanthanh' }
    ]

    types_hoidong = [
        { label: 'Duyệt CPI/Bài giảng', key: 'celo' },
        { label: 'Duyệt Câu hỏi/Đề', key: 'cauhoi' }
    ]

    filterHoidong = {
        times_hoidong: "dangthuchien",
        types_hoidong: null,
        hoidongShow: false
    };

    donvi_chuyenmon_id: number = 0;

    constructor() {
        this.isManager = this.auth.userHasRole(ROLES.admin) || this.auth.userHasRole(ROLES.manager) ? true : false;

        this.isDaotao = this.auth.userHasRole(ROLES.chuyenvien_pdt);

        this.isKhaothi = this.auth.userHasRole(ROLES.hoidongthi_lanhdao);

        this.isLanhdaokhoa = this.auth.userHasRole(ROLES.lanhdaokhoa);

        if (this.isDaotao || this.isManager) {
            this.filterHoidong.hoidongShow = true;
        }
    }

    async ngOnInit(): Promise<void> {
        const condition_user_profile: ConditionOption = {
            condition: [
                { conditionName: 'user_id', condition: OvicQueryCondition.equal, value: this.auth.user.id.toString(), orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '1' }
            ],
            page: null
        }

        const user_profile$ = await firstValueFrom(this.elngUserProfileService.getUserProfileByPageNewV2(condition_user_profile));

        if (user_profile$ && user_profile$.data && user_profile$.data.length) {
            this.donvi_chuyenmon_id = user_profile$.data[0].donvi_chuyenmon_id;
        }

        this.loadHoidong();
    }

    async loadHoidong() {
        this.notificationService.isProcessing(true);

        this.list_hoidong = [];

        const isOnlyLanhdaokhoa = this.isLanhdaokhoa && !this.isManager && !this.isDaotao && !this.isKhaothi && !this.filterHoidong.hoidongShow;

        if (isOnlyLanhdaokhoa && !this.donvi_chuyenmon_id) {
            this.notificationService.isProcessing(false);
            this.notificationService.toastWarning('Bạn chưa được phân vào khoa');
            return;
        }

        const time = await firstValueFrom(this.ovicDateTimeService.getCurrentDateTime());

        const time_ = new Date(time);

        const date_before = new Date(time_.setDate(time_.getDate() - 1));

        // const date_before_last_hour = new Date(date_before.setHours(23, 59, 59, 999));

        // console.log(date_before_last_hour);

        const today_for_start = new Date(time);

        const time_start_convert = this.helperService.stringToDateSql(today_for_start.toString());

        const timeConvert = this.helperService.stringToDateSql(date_before.toString());

        const condition_hoidong: ConditionOption = {
            condition: [

            ],
            set: [
                { label: 'limit', value: '-1' },
            ],
            page: null
        }

        switch (this.filterHoidong.times_hoidong) {
            case 'dangthuchien':
                condition_hoidong.condition.push(
                    { conditionName: 'status', condition: OvicQueryCondition.equal, value: '1', orWhere: 'and' },
                    { conditionName: 'date_start', condition: OvicQueryCondition.lessThanOrEqualsTo, value: time_start_convert, orWhere: 'and' },
                    { conditionName: 'date_end', condition: OvicQueryCondition.greaterThanToEqualsTo, value: timeConvert, orWhere: 'and' }
                )
                break;
            case 'dakethuc':
                condition_hoidong.condition.push(
                    { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '0', orWhere: 'and' },
                    { conditionName: 'date_end', condition: OvicQueryCondition.lessThan, value: timeConvert, orWhere: 'and' }
                )
                break;
            case 'dahoanthanh':
                condition_hoidong.condition.push(
                    { conditionName: 'status', condition: OvicQueryCondition.equal, value: '2', orWhere: 'and' },
                )
                break;
            default:
                break;
        }


        if (this.filterHoidong.types_hoidong) {
            if (this.filterHoidong.hoidongShow || this.isManager || this.isLanhdaokhoa) {
                condition_hoidong.condition.push(
                    { conditionName: 'type', condition: OvicQueryCondition.equal, value: this.filterHoidong.types_hoidong, orWhere: 'and' }
                )
            } else {
                if (this.isDaotao && (this.filterHoidong.types_hoidong === 'celo') && !this.isKhaothi && !this.isManager) {
                    condition_hoidong.condition.push(
                        { conditionName: 'type', condition: OvicQueryCondition.equal, value: this.filterHoidong.types_hoidong, orWhere: 'and' }
                    )
                }

                if (this.isKhaothi && this.filterHoidong.types_hoidong === "cauhoi" && !this.isDaotao && !this.isManager) {
                    condition_hoidong.condition.push(
                        { conditionName: 'type', condition: OvicQueryCondition.equal, value: this.filterHoidong.types_hoidong, orWhere: 'and' }
                    )
                }
            }
        } else {
            if (!this.filterHoidong.hoidongShow) {
                if (this.isDaotao) {
                    condition_hoidong.set.push(
                        { label: 'include_by', value: 'type' },
                        { label: 'include', value: 'celo,noidung' }
                    )
                }

                if (this.isKhaothi) {
                    condition_hoidong.condition.push(
                        { conditionName: 'type', condition: OvicQueryCondition.equal, value: 'cauhoi', orWhere: 'and' }
                    )
                }
            }
        }



        if (isOnlyLanhdaokhoa && this.donvi_chuyenmon_id) {
            condition_hoidong.condition.push(
                { conditionName: 'category_id', condition: OvicQueryCondition.equal, value: this.donvi_chuyenmon_id.toString(), orWhere: 'and' }
            )
        }

        this.hoidongThamdinhService.getHoidongThamdinhByPageNew(condition_hoidong).pipe(mergeMap(_hoidong => {
            const id_hoidong = _hoidong.data.map(m => m.id);

            if (id_hoidong.length) {
                const condition_monhoc: ConditionOption = {
                    condition: [],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'include', value: id_hoidong.toString() },
                        { label: 'include_by', value: 'hoidong_thamdinh_id' },
                        { label: 'with', value: 'course' }
                    ],
                    page: null
                }

                const condition_thanhvien: ConditionOption = {
                    condition: [

                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'include', value: id_hoidong.toString() },
                        { label: 'include_by', value: 'hoidong_thamdinh_id' },
                        { label: 'with', value: 'user_id' }
                    ],
                    page: null
                }

                if ((!this.isDaotao && !this.isManager && !this.isKhaothi && !this.isLanhdaokhoa) || this.filterHoidong.hoidongShow) {
                    condition_thanhvien.condition.push(
                        { conditionName: 'user_id', condition: OvicQueryCondition.equal, value: this.auth.user.id.toString(), orWhere: 'and' }
                    )
                }

                return forkJoin([
                    this.hoidongThamdinhThanhvienService.getHoidongThamdinhThanhvienByPageNew(condition_thanhvien),
                    this.hoidongThamdinhMonhocService.getHoidongThamdinhMonhocByPageNew(condition_monhoc),
                    this.hoidongThamdinhMonhocThanhvienService.getHoidongThamdinhMonhocThanhvienByPageNew(condition_thanhvien),
                ]).pipe(mergeMap(([_thanhvien, _monhoc, _monhoc_thanhvien]) => {
                    let data: HoidongThamdinh[] = [];

                    _monhoc.data.forEach(f => {
                        try {
                            if (f['course']) {
                                const params = f['course']['params'];
                                if (params) {
                                    if (typeof params === 'string') {
                                        f['course_params'] = JSON.parse(params);
                                    } else if (typeof params === 'object') {
                                        f['course_params'] = params;
                                    } else {
                                        f['course_params'] = null;
                                    }
                                } else {
                                    f['course_params'] = null;
                                }
                                f['course_title'] = f['course']['title'];
                                f['course_maso'] = f['course']['maso'];
                                f['created_plan_name'] = f['course']['user_name'] ? f['course']['user_name'] : 'Chưa phân quyền';
                            }
                            if (f['course_params']) {
                                if (!f['course_params'].exam_type) {
                                    const index = EXAMFORMAT.findIndex((m) => m.key === f['course_params'].exam_format);
                                    if (index !== -1) {
                                        f['hinhthucthi'] = EXAMFORMAT[index].label;
                                    }
                                } else {
                                    const index = EXAMFORMAT.findIndex((m) => m.id === f['course_params'].exam_type);
                                    if (index !== -1) {
                                        f['hinhthucthi'] = EXAMFORMAT[index].label;
                                    }
                                }

                                const sotinchi = f['course_params'].sotinchi ? f['course_params'].sotinchi : 0;
                                const sotinchi_th = f['course_params']['sotinchi_th'] ? f['course_params']['sotinchi_th'] : 0;
                                const index_m = EXAMFORMAT.findIndex((m) => m.key === f['course_params'].exam_format);
                                let exam = 'Chưa có thông tin';

                                if (index_m !== -1) {
                                    exam = EXAMFORMAT[index_m].label;
                                }

                                f['info_'] = ' - TC: ' + sotinchi.toString().concat('-', sotinchi_th.toString(), ' - ', f['hinhthucthi']);
                            }
                        } catch (e) {
                            console.error('Lỗi xử lý môn học:', e, f);
                        }
                    })


                    if ((!this.isManager && !this.isDaotao && !this.isKhaothi && !this.isLanhdaokhoa) || this.filterHoidong.hoidongShow) {
                        const hoidong_id = _monhoc_thanhvien.data.map(m => m.hoidong_thamdinh_id);
                        const hoidong_monhoc_id = _monhoc_thanhvien.data.map(m => m.hoidong_thamdinh_monhoc_id);
                        const monhoc_ = _monhoc.data.filter(m => hoidong_monhoc_id.includes(m.id));
                        const hoidong_ = _hoidong.data.filter(m => hoidong_id.includes(m.id));

                        monhoc_.forEach(f => {
                            f.thanhvien = _monhoc_thanhvien.data.filter(m => m.hoidong_thamdinh_monhoc_id === f.id);
                        })

                        hoidong_.forEach(f => {
                            f.courses = monhoc_.filter(m => m.hoidong_thamdinh_id === f.id);
                        })

                        data = hoidong_;


                    } else {
                        _monhoc.data.forEach(f => {
                            f.thanhvien = _monhoc_thanhvien.data.filter(m => m.hoidong_thamdinh_monhoc_id === f.id);
                        })

                        _hoidong.data.forEach(f => {
                            f.courses = _monhoc.data.filter(m => m.hoidong_thamdinh_id === f.id);
                        })

                        data = _hoidong.data;

                    }

                    return of(data)
                }))
            }
            return of(null);
        })).subscribe({
            next: (_hoidong) => {

                if (_hoidong) {
                    _hoidong.forEach(f => {
                        const today = new Date(date_before);
                        const time_start = new Date(f.date_start);
                        const time_end = new Date(f.date_end);
                        if (time_end.getTime() < today.getTime() && f.status < 2) {
                            f['ended'] = true;
                        }

                        if (time_start.getTime() > today_for_start.getTime() && f.status > 0) {
                            f['not_start'] = true;
                        }

                        this.checkOpen(f);

                    })
                    this.list_hoidong = _hoidong;
                    this.loadDataOnThisPage();
                }
                this.notificationService.isProcessing(false);
            },
            error: () => {
                this.notificationService.isProcessing(false);
            }
        })
    }

    changePage(event) {
        this.pageIndex = event.page;
        this.limit_hoidong = event.rows;
        this.loadDataOnThisPage();
    }

    loadDataOnThisPage() {
        this.loadInfo = true;

        setTimeout(() => {
            const data = this.tableHoidong().value;

            if (data.length) {

                let course_ids = [];

                data.forEach(f => {
                    course_ids = course_ids.concat(f.courses.map(m => m.course_id));
                })

                course_ids = [... new Set(course_ids)];

                const object_course_ids = {};

                course_ids.forEach(f => {
                    object_course_ids[f] = {};
                })

                const condition_plan: ConditionOption = {
                    condition: [
                        { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
                        { conditionName: 'type', condition: OvicQueryCondition.notEqual, value: 'THUONGXUYEN_TRACNGHIEM', orWhere: 'and' },
                        { conditionName: 'type', condition: OvicQueryCondition.notEqual, value: 'GIOITHIEU', orWhere: 'and' },
                        { conditionName: 'type', condition: OvicQueryCondition.notEqual, value: 'PLAN', orWhere: 'and' },
                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'include', value: course_ids.toString() },
                        { label: 'include_by', value: 'course_id' },
                        { label: 'select', value: 'course_id,status,id,type,week,ordering' }
                    ],
                    page: null
                }

                const condition_question: ConditionOption = {
                    condition: [
                        { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
                        { conditionName: 'reference', condition: OvicQueryCondition.equal, value: 'course_plan_activities', orWhere: 'and' },
                        { conditionName: 'group_id', condition: OvicQueryCondition.equal, value: '0 ', orWhere: 'and' },
                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'include', value: course_ids.toString() },
                        { label: 'include_by', value: 'course_id' },
                        { label: 'select', value: 'course_id,status,id,week,reference_id' }
                    ],
                    page: null
                }

                const condition_tuluan_kthp: ConditionOption = {
                    condition: [
                        { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
                        { conditionName: 'course_plan_activity_id', condition: OvicQueryCondition.equal, value: '0', orWhere: 'and' },
                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'include', value: course_ids.toString() },
                        { label: 'include_by', value: 'course_id' },
                        { label: 'select', value: 'course_id,status,id' }
                    ],
                    page: null
                }


                forkJoin([
                    this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_plan),
                    this.courseQuestionsService.getCourseQuestionsByPageNew(condition_question),
                    this.coursePlanActivityTuluanService.getCoursePlanActivityTuluanByPageNew(condition_tuluan_kthp)
                ]).pipe(mergeMap(([_plan, _question, _tuluan_kthp]) => {

                    const ids_plan_da = [];

                    const ids_plan_th = [];

                    const ids_plan_cdr = [];


                    _plan.data.forEach(f => {
                        if (f.type === 'ACTIVITY_CDR') {
                            ids_plan_cdr.push(f.id);
                        }

                        if (f.type === 'THUONGXUYEN_TULUAN') {
                            ids_plan_th.push(f.id);
                        }

                        if (f.type === 'THUONGXUYEN_DUAN' && f.ordering === 0) {
                            ids_plan_da.push(f.id)
                        }
                    })

                    const questions_tmp = _question.data.filter(m => ids_plan_cdr.includes(m.reference_id));

                    Object.keys(object_course_ids).forEach(f => {
                        object_course_ids[f]['duyet_tn'] = questions_tmp.filter(m => m.status === 1 && m.course_id.toString() === f.toString()).length;
                        object_course_ids[f]['tong_tn'] = questions_tmp.filter(m => m.course_id.toString() === f.toString()).length;
                        object_course_ids[f]['duyet_baigiang'] = _plan.data.filter(m => m.course_id.toString() === f.toString() && m.status === 1 && (m.type === 'ACTIVITY' || m.type === 'MUCTIEU')).length;
                        object_course_ids[f]['tong_baigiang'] = _plan.data.filter(m => m.course_id.toString() === f.toString() && (m.type === 'ACTIVITY' || m.type === 'MUCTIEU')).length;
                        object_course_ids[f]['duyet_cpi'] = _plan.data.filter(m => m.course_id.toString() === f.toString() && m.status === 1 && m.type === 'ACTIVITY_CDR' && m.week !== 100).length;
                        object_course_ids[f]['tong_cpi'] = _plan.data.filter(m => m.course_id.toString() === f.toString() && m.type === 'ACTIVITY_CDR' && m.week !== 100).length;
                    })


                    if (ids_plan_th.length || ids_plan_da.length) {
                        const condition_thuchanh: ConditionOption = {
                            condition: [
                                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
                            ],
                            set: [
                                { label: 'limit', value: '-1' },
                                { label: 'include', value: ids_plan_th.toString().concat("-1") },
                                { label: 'include_by', value: 'course_plan_activity_id' },
                                { label: 'select', value: 'course_id,status,id' }
                            ],
                            page: null
                        }

                        const condition_duan: ConditionOption = {
                            condition: [
                                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
                            ],
                            set: [
                                { label: 'limit', value: '-1' },
                                { label: 'include', value: ids_plan_da.toString().concat("-1") },
                                { label: 'include_by', value: 'course_plan_activity_id' },
                                { label: 'select', value: 'course_id,status,id' }
                            ],
                            page: null
                        }

                        return forkJoin([
                            this.coursePlanActivityTuluanService.getCoursePlanActivityTuluanByPageNew(condition_thuchanh),
                            this.coursePlanActivityTuluanService.getCoursePlanActivityTuluanByPageNew(condition_duan)
                        ]).pipe(mergeMap(([_tuluan_tx, _duan]) => {
                            Object.keys(object_course_ids).forEach(f => {
                                const duyet_th = _tuluan_kthp.data.filter(m => m.status === 1 && m.course_id.toString() === f.toString()).length + _tuluan_tx.data.filter(m => m.status === 1 && m.course_id.toString() === f.toString()).length;
                                const tong_th = _tuluan_kthp.data.filter(m => m.course_id.toString() === f.toString()).length + _tuluan_tx.data.filter(m => m.course_id.toString() === f.toString()).length
                                object_course_ids[f]['duyet_th'] = duyet_th;
                                object_course_ids[f]['tong_th'] = tong_th;
                                object_course_ids[f]['duyet_duan'] = _duan.data.filter(m => m.status === 1 && m.course_id.toString() === f.toString()).length;
                                object_course_ids[f]['tong_duan'] = _duan.data.filter(m => m.course_id.toString() === f.toString()).length;
                            })

                            data.forEach(f => {
                                if (Array.isArray(f.courses)) {
                                    f.courses.forEach(c => {
                                        Object.keys(object_course_ids[c.course_id]).forEach(o => {
                                            c[o] = object_course_ids[c.course_id][o];
                                        })
                                    })
                                }
                            })

                            return of(null)
                        }))
                    } else {
                        data.forEach(f => {
                            if (Array.isArray(f.courses)) {
                                f.courses.forEach(c => {
                                    Object.keys(object_course_ids[c.course_id]).forEach(o => {
                                        c[o] = object_course_ids[c.course_id][o];
                                    })
                                })
                            }
                        })

                    }
                    return of(null)
                })).subscribe({
                    next: () => {
                        this.loadInfo = false;
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                    }
                })
            }
        })
    }

    filterCourseByname(event) {
        if (event.target['value']) {
            if (event.key === 'Enter') {
                this.searchCourse = event.target['value'].trim();
                this.loadDataOnThisPage();
            }
        } else {
            this.searchCourse = null;
        }
    }

    startFilter(event, key) {
        if (event) {
            this.filterHoidong[key] = event;
        } else {
            this.filterHoidong[key] = null;
        }

        this.loadHoidong();
    }

    cancelFilter() {
        this.filterHoidong = {
            times_hoidong: "dangthuchien",
            types_hoidong: null,
            hoidongShow: false
        };

        this.searchCourse = null;

        this.loadHoidong();
    }

    checkOpen(row: HoidongThamdinh) {
        // if (!this.isDaotao && !this.isKhaothi && !this.isManager) {
        //     if (row.status === 2) {
        //         row['disabled_route'] = true;
        //     }

        //     if (row.status === 0) {
        //         row['disabled_route'] = true;
        //     }

        //     if (row['ended']) {
        //         row['disabled_route'] = true;
        //     }

        //     if (row['not_start']) {
        //         row['disabled_route'] = true;
        //     }
        // }
    }

    noitiRoute(event, row) {
        if (row['disabled_route']) {
            event.preventDefault();
            event.stopPropagation();
            if (row.status === 2) {
                return this.notificationService.toastWarning("Đã hoàn thành, không thể xem");
            }

            if (row.status === 0) {
                return this.notificationService.toastWarning("Đang thiết lập, không thể xem");
            }

            if (row['ended']) {
                return this.notificationService.toastWarning("Đã kết thúc, không thể xem");
            }

            if (row['not_start']) {
                return this.notificationService.toastWarning("Chưa bắt đâu, không thể xem");
            }
        }
    }
}
