import { CourseConfigService } from './../../../../shared/services/course-config.service';
import { ConfigsService } from '@shared/services/configs.service';
import { Component, OnInit } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { OvicQueryCondition } from '@core/models/dto';
import { APP_CONFIGS, key_server } from '@env';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { firstValueFrom, forkJoin, Observable } from 'rxjs';
import { NotificationService } from '@core/services/notification.service';
import { getTestType, ROLES, ROUTERS, THUONGXUYEN_TEST_TYPE } from '@modules/shared/utils/syscat';
import { AuthService } from '@core/services/auth.service';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';
import { CoursePlanActivities } from '@modules/shared/models/course-plan-activities';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { SharedModule } from '@modules/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PanelModule } from 'primeng/panel';
import { TableModule } from 'primeng/table';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { Configs } from '@modules/shared/models/configs';
import { CourseConfig } from '@modules/shared/models/course-config';

@Component({
    selector: 'app-monhoc-cauhinh',
    standalone: true,
    imports: [
    SharedModule,
    ReactiveFormsModule,
    FormsModule,
    PanelModule,
    TableModule,
    NgbTooltipModule
],
    templateUrl: './monhoc-cauhinh.component.html',
    styleUrls: ['./monhoc-cauhinh.component.css']
})
export class MonhocCauhinhComponent implements OnInit {
    isManager: boolean = false;

    isLanhDaoKhoa: boolean = false;

    isLanhDaoBomon: boolean = false;

    routerAdmin: boolean = false;

    routerDaotao: boolean = false;

    routerLanhdaokhoa: boolean = false;

    routerGiangvien: boolean = false;

    routerLanhdaobomon: boolean = false;

    userId: number;

    key_server = key_server;

    canAdded: boolean = false;

    selectedCourse: ElnKhoaHoc;

    indexByKeyServerInSotinchi: number;

    plan_kiemtra: CoursePlanActivities;

    THUONGXUYEN_TEST_TYPE = getTestType();

    list_config: Configs[];

    list_plan: CoursePlanActivities[];

    isOpenSettingDate: boolean = false;

    course_config_object = {};

    isDttx = APP_CONFIGS.isDttx;

    //PERCENT_SCORE_SUMMARY: cc: điểm chuyên cần , daugio:  điểm đầu giờ, kynang: điểm kiểm tra thường xuyên hoặc giữa kỳ đối với dttx, luyentap: điểm luyện tập tại nhà
    constructor(
        private router: Router,
        private notificationService: NotificationService,
        private activatedRoute: ActivatedRoute,
        private auth: AuthService,
        private elnKhoaHocService: ElnKhoaHocService,
        private elngUserProfileService: ElngUserProfileService,
        private coursePlanActivitiesService: CoursePlanActivitiesService,
        private configsService: ConfigsService,
        private courseConfigService: CourseConfigService
    ) {
        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin) || this.auth.userHasRole(ROLES.troly_pdt) || this.auth.userHasRole(ROLES.chuyenvien_pdt) ? true : false;

        this.isLanhDaoKhoa = this.auth.userHasRole(ROLES.lanhdaokhoa);

        this.isLanhDaoBomon = this.auth.userHasRole(ROLES.lanhdaobomon);

        this.routerAdmin = this.auth.hasRouter(ROUTERS.admin, '/monhoc-cauhinh');

        this.routerDaotao = this.auth.hasRouter(ROUTERS.daotao, '/monhoc-cauhinh');

        this.routerLanhdaokhoa = this.auth.hasRouter(ROUTERS.lanhdao_khoa, '/monhoc-cauhinh');

        this.routerGiangvien = this.auth.hasRouter(ROUTERS.giangvien, '/monhoc-cauhinh');

        this.routerLanhdaobomon = this.auth.hasRouter(ROUTERS.lanhdao_bomon, '/monhoc-cauhinh');

        this.userId = this.auth.user.id;
    }

    ngOnInit(): void {
        this.activatedRoute.queryParams.subscribe((params) => {
            if (params && params['code']) {
                this.notificationService.isProcessing(true);

                const course_id = params['code'];

                const contition_course: ConditionOption = {
                    condition: [
                        { conditionName: 'id', condition: OvicQueryCondition.equal, value: course_id.toString(), orWhere: 'and' },
                    ],
                    set: [
                        { label: 'limit', value: '1' }
                    ],
                    page: null
                }

                if (this.routerGiangvien) {
                    contition_course.condition.push({ conditionName: 'creator_plan_id', condition: OvicQueryCondition.equal, value: this.userId.toString(), orWhere: 'and' })
                }

                const condition_user: ConditionOption = {
                    condition: [
                        { conditionName: 'user_id', condition: OvicQueryCondition.equal, value: this.userId.toString(), orWhere: 'and' }
                    ],
                    set: [
                        { label: 'limit', value: '1' }
                    ],
                    page: null
                }

                const condition_plan: ConditionOption = {
                    condition: [
                        { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: course_id.toString(), orWhere: 'and' },
                        { conditionName: 'week', condition: OvicQueryCondition.lessThan, value: '100', orWhere: 'and' },
                        { conditionName: 'week', condition: OvicQueryCondition.greaterThan, value: '0', orWhere: 'and' },
                        { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
                        { conditionName: 'type', condition: OvicQueryCondition.equal, value: 'PLAN', orWhere: 'and' },
                        { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: '0', orWhere: 'and' }
                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'order', value: 'ASC' },
                        { label: 'orderby', value: 'ordering' },
                        { label: 'select', value: 'week' }
                    ],
                    page: null
                }

                const condition_config: ConditionOption = {
                    condition: [],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'include_by', value: 'config_key' },
                        { label: 'include', value: 'PERCENT_SCORE_SUMMARY,PERCENT_OF_LEAVE_ALLOWED,NUMOF_TEST_CCTX,PRACTICE_TIME_FOR_A_TEST' }
                    ],
                    page: null
                }


                const condition_course_config: ConditionOption = {
                    condition: [
                        { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: course_id.toString(), orWhere: 'and' }
                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'order', value: 'ASC' },
                        { label: 'orderby', value: 'ordering' },
                    ],
                    page: null
                }

                forkJoin([
                    this.elnKhoaHocService.getKhoaHocByPageNew_2(contition_course),
                    this.elngUserProfileService.getUserProfileByPageNewV2(condition_user),
                    this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_plan),
                    this.configsService.getConfigsByPageNew(condition_config),
                    this.courseConfigService.getCourseConfigByPageNew(condition_course_config)
                ]).subscribe({
                    next: ([_course, _user_profile, _plan, _config, _course_config]) => {
                        if (_course.recordsFiltered) {

                            this.selectedCourse = _course.data[0];

                            this.indexByKeyServerInSotinchi = key_server == 'hvu' ? (this.selectedCourse.params.sotinchi == 2 ? 1 : ([3, 4].includes(this.selectedCourse.params.sotinchi) ? 2 : null)) : this.selectedCourse.params.sotinchi;

                            if (this.routerLanhdaokhoa) {
                                if (_user_profile.recordsFiltered === 0 || this.selectedCourse.category_ids !== _user_profile.data[0].donvi_chuyenmon_id) {
                                    this.notificationService.toastError("Không tìm thấy môn học");
                                    this.router.navigate(['/admin/content-none']);
                                }
                            }

                            if (this.routerLanhdaobomon) {
                                if (_user_profile.recordsFiltered === 0 || this.selectedCourse.nganh_bomon_id !== _user_profile.data[0].bomon_id) {
                                    this.notificationService.toastError("Không tìm thấy môn học");
                                    this.router.navigate(['/admin/content-none']);
                                }
                            }

                            if (this.routerDaotao || this.routerLanhdaobomon || this.routerLanhdaokhoa || this.userId === this.selectedCourse.creator_plan_id) {
                                this.canAdded = true;
                            } else {
                                this.canAdded = false;
                            }

                            this.list_config = _config.data;

                            this.list_plan = _plan.data;

                            this.convertDataCourseConfig(_course_config.data);

                            this.loadKiemtrathuongxuyen();

                            this.notificationService.isProcessing(false);

                        } else {
                            this.notificationService.toastError("Không tìm thấy môn học");
                            this.router.navigate(['/admin/content-none']);
                        }
                    },
                    error: () => {
                        this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
                    }
                })
            } else {
                this.router.navigate(['/admin/content-none']);
            }
        })
    }


    loadKiemtrathuongxuyen() {
        this.notificationService.isProcessing(true);
        const condition_test: ConditionOption = {
            condition: [
                { conditionName: 'week', condition: OvicQueryCondition.equal, value: '1000', orWhere: 'and' },
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse.id.toString(), orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'ordering' }
            ],
            page: null
        }

        forkJoin([
            this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_test)
        ]).subscribe({
            next: ([_course_plan]) => {

                const parent = _course_plan.data.find(m => m.parent_id === 0);

                if (parent) {
                    parent.children = _course_plan.data.filter(m => m.parent_id === parent.id);
                    this.plan_kiemtra = parent;
                } else {
                    let title = 'Kiểm tra thường xuyên';

                    if (this.isDttx) {
                        title = 'Kiểm tra giữa kỳ';
                    }

                    const _plan_kiemtra: CoursePlanActivities = {
                        course_id: this.selectedCourse.id,
                        week: 1000,
                        title: 'Kiểm tra thường xuyên',
                        desc: null,
                        video: null,
                        files: null,
                        ordering: 1000,
                        status: 1,
                        course_lesson_id: 0,
                        parent_id: 0,
                        type: 'PLAN',
                        desc_title: null,
                        edit: 1,
                        slides: null,
                        children: [],
                        exam_type: this.selectedCourse.params.exam_type
                    }

                    this.plan_kiemtra = _plan_kiemtra;

                }

                this.createTestTx();

                this.notificationService.isProcessing(false);

            },
            error: () => {
                this.notificationService.isProcessing(false);
            }
        })
    }

    onChangeTypeTest(event, test: CoursePlanActivities) {
        if (event) {
            test.type = event.key;
            test.exam_type = event.id;
        }
    }

    addTestTx() {
        let type = null;

        switch (this.selectedCourse.params.exam_format) {
            case 'DUAN':
                type = "THUONGXUYEN_DUAN";
                break;
            case 'THUCHANH':
                type = "THUONGXUYEN_TULUAN";
                break;
            case 'TRACNGHIEM':
                type = "THUONGXUYEN_TRACNGHIEM";
                break;
        }

        if (this.plan_kiemtra.children) {
            const data_length = this.plan_kiemtra.children.filter(m => m.ordering > 0 && m.ordering < 100);

            const ordering = data_length.length + 1;

            let title = 'Bài kiểm tra thường xuyên '.concat(ordering.toString());

            if (this.isDttx) {
                title = 'Bài kiểm tra giữa kỳ số '.concat(ordering.toString());
            }

            const child: CoursePlanActivities = {
                course_id: this.selectedCourse.id,
                week: 1000,
                title: title,
                desc: null,
                video: null,
                files: null,
                ordering: ordering,
                status: 1,
                course_lesson_id: 0,
                parent_id: this.plan_kiemtra.id,
                type: type,
                desc_title: null,
                edit: 1,
                slides: null,
                exam_type: this.selectedCourse.params.exam_type
            }

            const index = this.plan_kiemtra.children.findIndex(m => m.ordering === ordering - 1);


            if (index !== -1) {
                this.plan_kiemtra.children.splice(index + 1, 0, child);
            } else {
                this.plan_kiemtra.children.push(child);
            }

            if (this.selectedCourse.params.exam_format === 'DUAN') {
                this.plan_kiemtra.children = this.addDuan(this.plan_kiemtra.children, type);
            }
        }
    }

    createTestTx() {
        let type = null;

        switch (this.selectedCourse.params.exam_format) {
            case 'DUAN':
                type = "THUONGXUYEN_DUAN";
                break;
            case 'THUCHANH':
                type = "THUONGXUYEN_TULUAN";
                break;
            case 'TRACNGHIEM':
                type = "THUONGXUYEN_TRACNGHIEM";
                break;
        }

        if (this.selectedCourse.params && this.selectedCourse.params.sotinchi) {
            let maxTest = 1;
            switch (key_server) {
                case 'ictu':
                    maxTest = this.selectedCourse.params.sotinchi;
                    break;
                case 'hvu':
                    if (Number(this.selectedCourse.params.sotinchi) > 2) {
                        maxTest = 2;
                    }
                    break;
                default:
                    break;
            }

            if (this.plan_kiemtra.children && this.plan_kiemtra.children.length === 0) {
                while (this.plan_kiemtra.children.filter(m => m.ordering > 0 && m.ordering < 100).length < maxTest) {
                    this.addTestTx();
                }
            }

            let childs: CoursePlanActivities[] = this.plan_kiemtra.children;

            if (this.selectedCourse.params.exam_format === 'DUAN') {
                childs = this.addDuan(childs, type);
            }

            this.plan_kiemtra.children = childs;

        } else {
            this.notificationService.toastWarning("Môn học này chưa được cài đặt số tín chỉ");
        }
    }

    addDuan(data: CoursePlanActivities[], type) {
        const index_0 = data.findIndex(m => m.ordering === 0);
        if (index_0 === -1) {
            const test: CoursePlanActivities = {
                course_id: this.selectedCourse.id,
                week: 1000,
                title: 'Danh sách dự án',
                desc: null,
                video: null,
                files: null,
                ordering: 0,
                status: 1,
                course_lesson_id: 0,
                parent_id: this.plan_kiemtra.id,
                type: type,
                desc_title: null,
                edit: 1,
                slides: null,
                exam_type: this.selectedCourse.params.exam_type
            }
            data.splice(0, 0, test);
        }

        const index_100 = data.findIndex(m => m.ordering === 100);

        if (index_100 === -1) {
            const test: CoursePlanActivities = {
                course_id: this.selectedCourse.id,
                week: 1000,
                title: 'Thi kết thúc học phần',
                desc: null,
                video: null,
                files: null,
                ordering: 100,
                status: 1,
                course_lesson_id: 0,
                parent_id: this.plan_kiemtra.id,
                type: type,
                desc_title: null,
                edit: 1,
                slides: null,
                exam_type: this.selectedCourse.params.exam_type
            }

            data.push(test);
        }

        return data;
    }

    async deleteItemKynang(item: CoursePlanActivities, index: number) {
        if (!item.id) {
            this.plan_kiemtra.children.splice(index, 1);
        } else {

            const confirm = await this.notificationService.confirmDelete();

            if (confirm) {
                this.notificationService.isProcessing(true);
                this.coursePlanActivitiesService.deleteCoursePlanActivities(item.id).subscribe({
                    next: () => {
                        this.loadKiemtrathuongxuyen();
                        this.notificationService.toastSuccess('Thao tác thành công');

                    }, error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError('Thao tác không thành công');
                    }
                })
            }
        }
    }

    async saveTestKynang() {
        this.notificationService.isProcessing(true);

        const request: Observable<any>[] = [];

        if (!this.plan_kiemtra.id) {
            const data_parent = { ...this.plan_kiemtra }
            delete data_parent.children;
            this.plan_kiemtra.id = await firstValueFrom(this.coursePlanActivitiesService.addCoursePlanActivities(data_parent))
        }

        if (this.plan_kiemtra.children && this.plan_kiemtra.children.length) {
            if (this.plan_kiemtra.children.filter(m => m.ordering > 0).length > 4) {
                this.notificationService.isProcessing(false);
                return this.notificationService.toastWarning("Số lượng bài kiểm tra tối đa là 4");
            }

            if (this.plan_kiemtra.children.filter(m => !m.type).length) {
                this.notificationService.isProcessing(false);
                return this.notificationService.toastWarning("Vui lòng chọn loại kiểm tra");
            }

            this.plan_kiemtra.children.forEach(f => {
                f.parent_id = this.plan_kiemtra.id;
                const id = f.id;
                delete f.disabled_type;
                if (f.id) {
                    delete f.id;
                    request.push(this.coursePlanActivitiesService.updateCoursePlanActivities(id, f))
                } else {
                    request.push(this.coursePlanActivitiesService.addCoursePlanActivities(f))
                }

            })
        }

        forkJoin(request).subscribe({
            next: () => {
                this.notificationService.toastSuccess("Thêm thành công");
                this.loadKiemtrathuongxuyen();
            },
            error: () => {
                this.notificationService.toastSuccess("Thêm thất bại");
                this.notificationService.isProcessing(false);
            }
        })
    }

    checkDeletePlan(ordering: number): boolean {
        if (this.plan_kiemtra && this.plan_kiemtra.children && this.plan_kiemtra.children.length) {
            const data = this.plan_kiemtra.children.filter(m => m.ordering > 0 && m.ordering < 100);
            if (ordering === data.length) {
                return true;
            }
            return false;
        }
        return false;
    }

    loadConfig() {
        this.notificationService.isProcessing(true);
        const condition_course_config: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse.id.toString(), orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'ordering' },
            ],
            page: null
        }
        this.courseConfigService.getCourseConfigByPageNew(condition_course_config).subscribe({
            next: (_course_config) => {
                this.convertDataCourseConfig(_course_config.data);
                this.notificationService.isProcessing(false);
            },
            error: () => {
                this.notificationService.isProcessing(false);
            }
        })
    }

    openSettingDateByWeek() {
        this.isOpenSettingDate = !this.isOpenSettingDate;
    }

    convertDataCourseConfig(_course_config: CourseConfig[]) {
        this.course_config_object = {};
        const tmp_object = {};
        if (_course_config && _course_config.length) {
            _course_config.forEach(f => {
                if (!tmp_object[f.group]) {
                    tmp_object[f.group] = [];
                    tmp_object[f.group].push(f);
                } else {
                    tmp_object[f.group].push(f);
                }
            })
        } else {
            this.list_config.forEach(f => {
                if (!tmp_object[f.config_key]) {
                    tmp_object[f.config_key] = [];
                    const tmp_percent = [];
                    switch (f.config_key) {
                        case 'PERCENT_SCORE_SUMMARY':
                            Object.keys(f.params).forEach((o, key) => {
                                let title = '';
                                if (o === "cc") {
                                    title = "Điểm chuyên cần";
                                } else if (o === "daugio") {
                                    title = "Kiểm tra 15 phút";
                                } else if (o === "kynang") {
                                    title = "Kiểm tra thường xuyên";
                                    if (this.isDttx) {
                                        title = "Kiểm tra giữa kỳ";
                                    }
                                } else if (o === "bttn") {
                                    title = "Luyện tập tại nhà";
                                }

                                tmp_percent.push({
                                    course_id: this.selectedCourse.id,
                                    group: f.config_key,
                                    key: o,
                                    title: title,
                                    ordering: key + 1,
                                    value: f.params[o],
                                })
                            })

                            tmp_percent.push(
                                {
                                    course_id: this.selectedCourse.id,
                                    group: f.config_key,
                                    key: "thi",
                                    title: "Kiểm tra kết thúc học phần",
                                    ordering: 4,
                                    value: 50,
                                }
                            )
                            break;
                        case 'NUMOF_TEST_CCTX':
                            Object.keys(f.params).forEach((o, key) => {

                                let title = '';

                                if (o === "CC_TEST") {
                                    title = "Luyện tập tại nhà & Kiểm tra 15 phút";
                                    if (this.isDttx) {
                                        title = "Luyện tập tại nhà";
                                    }
                                } else if (o === "TX_TEST") {
                                    title = "Kiểm tra thường xuyên";
                                    if (this.isDttx) {
                                        title = "Kiểm tra giữa kỳ";
                                    }
                                }

                                tmp_percent.push({
                                    course_id: this.selectedCourse.id,
                                    group: f.config_key,
                                    key: o,
                                    title: title,
                                    ordering: key + 1,
                                    value: f.params[o],
                                })
                            })
                            break;
                        case 'PRACTICE_TIME_FOR_A_TEST':
                            tmp_percent.push({
                                course_id: this.selectedCourse.id,
                                group: f.config_key,
                                key: "DEFAULT",
                                title: "Thời hạn làm bài tính theo ngày (mặc định)",
                                ordering: 0,
                                value: f.value,
                            });

                            const params_date = {};

                            this.list_plan.forEach(p => {
                                params_date[p.week] = f.value;
                            })

                            tmp_percent.push(
                                {
                                    course_id: this.selectedCourse.id,
                                    group: f.config_key,
                                    key: "EXCEPT",
                                    title: "Thời hạn theo từng bài (ngày)",
                                    ordering: 1,
                                    value: 0,
                                    params: params_date
                                },
                                {
                                    course_id: this.selectedCourse.id,
                                    group: f.config_key,
                                    key: "NUMOF_EXTDATE_FORTEST",
                                    title: "Tối đa số ngày cho phép gia hạn",
                                    ordering: 100,
                                    value: 7,
                                },
                                {
                                    course_id: this.selectedCourse.id,
                                    group: f.config_key,
                                    key: "TIME_OF_TEST",
                                    title: "Thời gian làm bài luyện tập (phút)",
                                    ordering: 200,
                                    value: 15,
                                });

                            break;
                        case 'PERCENT_OF_LEAVE_ALLOWED':
                            tmp_percent.push({
                                course_id: this.selectedCourse.id,
                                group: f.config_key,
                                key: "DEFAULT",
                                title: "Số ngày sinh viên được phép nghỉ (%)",
                                ordering: 1,
                                value: f.value,
                            });
                            break;
                        default:
                            break;
                    }
                    tmp_object[f.config_key] = tmp_percent;
                }
            })
        }
        this.course_config_object = tmp_object;
    }

    saveCourseConfig() {
        const request: Observable<any>[] = [];
        Object.keys(this.course_config_object).forEach(o => {
            if (Array.isArray(this.course_config_object[o])) {
                this.course_config_object[o].forEach(f => {
                    if (f.id) {
                        const tmp_id = f.id;
                        const data = { ...f };
                        delete data.id;
                        request.push(this.courseConfigService.updateCourseConfig(tmp_id, data));
                    } else {
                        const data = { ...f };
                        request.push(this.courseConfigService.addCourseConfig(data));
                    }
                })
            }
        })

        if (request.length) {
            this.notificationService.isProcessing(true);
            forkJoin(request).subscribe({
                next: () => {
                    this.notificationService.toastSuccess("Cập nhật thành công");
                    this.loadConfig();
                },
                error: () => {
                    this.notificationService.isProcessing(false);
                    this.notificationService.toastError("Cập nhật thất bại")
                }
            })
        }
    }

    pointQuestionKeyDown(event) {
        if (event) {
            if (/[0-9]/.test(event.key) || event.key === 'Backspace') {
                // if (inputPoint_quest.value.replace(/\d/gi, '').length > 0 && event.key === '.') {
                //     event.preventDefault();
                // }
            } else {
                event.preventDefault();
            }
        }
    }

    onChangeValueInput(item: CourseConfig) {
        if (item.key === "DEFAULT") {
            const index = this.course_config_object['PRACTICE_TIME_FOR_A_TEST'].findIndex(m => m.key === "EXCEPT");
            if (index !== -1) {
                const dt = this.course_config_object['PRACTICE_TIME_FOR_A_TEST'][index].params;
                Object.keys(dt).forEach(f => {
                    dt[f] = item.value;
                })
            }
        }
    }
}
