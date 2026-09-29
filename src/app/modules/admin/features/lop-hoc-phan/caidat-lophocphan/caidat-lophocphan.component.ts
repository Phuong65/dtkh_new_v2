import { Component, OnInit, inject, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '@modules/shared/shared.module';
import { CheckboxModule } from 'primeng/checkbox';
import { Paginator, PaginatorModule } from 'primeng/paginator';
import { ProgressBarModule } from 'primeng/progressbar';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { DatePickerModule } from 'primeng/datepicker';
import { PopoverModule } from 'primeng/popover';
import { AuthService } from '@core/services/auth.service';
import { HelperService } from '@core/services/helper.service';
import { NotificationService } from '@core/services/notification.service';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { ClassesService } from '@modules/shared/services/classes.service';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { ElnChuyenMucService } from '@modules/shared/services/elearning-chuyen-muc.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { DonViService } from '@modules/shared/services/don-vi.service';
import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';
import { CoursePlanBankService } from '@modules/shared/services/course-plan-bank.service';
import { ClassPlansService } from '@modules/shared/services/class-plans.service';
import { ROLES } from '@modules/shared/utils/syscat';
import { OvicQueryCondition } from '@core/models/dto';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { Classes } from '@modules/shared/models/classes';
import { ElnChuyenMuc } from '@modules/shared/models/Elng';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { DonVi } from '@modules/shared/models/don-vi';
import { ElngUserProfile } from '@modules/shared/models/elng-user-profile';
import { APP_CONFIGS } from '@env';
import { Observable } from 'rxjs';
import { catchError, concatMap, finalize, forkJoin, from, map, mergeMap, of, tap, toArray } from 'rxjs';

@Component({
    selector: 'app-caidat-lophocphan',
    standalone: true,
    imports: [
        CommonModule,
        SharedModule,
        FormsModule,
        RouterModule,
        TableModule,
        PaginatorModule,
        ProgressBarModule,
        CheckboxModule,
        DialogModule,
        DatePickerModule,
        PopoverModule
    ],
    templateUrl: './caidat-lophocphan.component.html',
    styleUrls: ['./caidat-lophocphan.component.css']
})
export class CaidatLophocphanComponent implements OnInit {

    paginator = viewChild<Paginator>('paginator');

    listClass: Classes[] = [];
    cols_class = [
        { label: 'TT', class: 'text-center', key: 'index_', width: '50' },
        { label: 'Tên lớp học phần', class: 'text-left', key: 'name', width: '350' },
        { label: 'Môn học', class: 'text-left', key: 'show_mon', width: '300' },
        { label: 'Khóa', class: 'text-center', key: 'khoa', width: '80' },
        { label: 'Đợt', class: 'text-center', key: 'dothoc', width: '80' },
        { label: 'Giảng viên', class: 'text-left', key: 'mainTeacher', width: '220' },
        { label: 'Năm học', class: 'text-center', key: 'namhoc', width: '110' },
        { label: 'Học kỳ', class: 'text-center', key: 'hocky', width: '90' },
    ];

    objectFilter: any = {};

    listNamhoc: any[] = [];
    listHocky: any[] = [];
    list_donvi_chuyenmon: DonVi[] = [];
    listCategory: ElnChuyenMuc[];
    listCourse: ElnKhoaHoc[];

    user_profile: ElngUserProfile;

    emptyList: string;
    countClass = 0;
    limitList = 20;
    pageIndex = 0;

    // ===== Kích hoạt bài kiểm tra hàng loạt =====
    canShowBulkActivateTest: boolean = false;
    selectedClasses: Classes[] = [];
    selectedClassesForTest: Classes[] = [];
    displayActivateTestDialog: boolean = false;
    dateStartTest: Date = null;
    practiceTimeForTest: number = 7;
    isActivating: boolean = false;
    progressValue: number = 0;
    failedClasses: { class: Classes; reason: string }[] = [];

    private auth = inject(AuthService);
    private helperService = inject(HelperService);
    private noitifi = inject(NotificationService);
    private httpHelper = inject(HttpParamsHeplerService);
    private classesService = inject(ClassesService);
    private elnKhoaHocService = inject(ElnKhoaHocService);
    private elnChuyenMucService = inject(ElnChuyenMucService);
    private elngUserProfileService = inject(ElngUserProfileService);
    private donViService = inject(DonViService);
    private coursePlanActivitiesService = inject(CoursePlanActivitiesService);
    private coursePlanBankService = inject(CoursePlanBankService);
    private classPlansService = inject(ClassPlansService);

    ngOnInit(): void {
        this.canShowBulkActivateTest = APP_CONFIGS.isDttx && (
            this.auth.userHasRole(ROLES.lanhdaokhoa) ||
            this.auth.userHasRole(ROLES.manager) ||
            this.auth.userHasRole(ROLES.admin) ||
            this.auth.userHasRole(ROLES.chuyenvien_pdt)
        );
        if (this.canShowBulkActivateTest) {
            this.initData();
        }
    }

    async initData() {
        this.listClass = [];
        this.pageIndex = 0;
        this.noitifi.isProcessing(true);

        const condition_group_namhoc = this.httpHelper.paramsConditionBuilder([
            { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' },
        ]).set('order', 'DESC').set('orderby', 'namhoc').set('groupby', 'namhoc').set('limit', -1);

        const condition_group_hocky = this.httpHelper.paramsConditionBuilder([
            { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' },
        ]).set('order', 'DESC').set('orderby', 'hocky').set('groupby', 'hocky').set('limit', -1);

        const condition_donvi = this.httpHelper.paramsConditionBuilder([
            { conditionName: 'status', condition: OvicQueryCondition.greaterThan, value: '0', orWhere: 'and' },
            { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: this.auth.user.donvi_id.toString(), orWhere: 'and' },
        ]).set('limit', -1).set('order', 'ASC').set('orderby', 'title');

        forkJoin([
            this.classesService.getClassesByCols(condition_group_namhoc),
            this.classesService.getClassesByCols(condition_group_hocky),
            this.donViService.getDonViByCols(condition_donvi),
            this.elngUserProfileService.getElngUserProfileByItem(this.auth.user.id.toString(), 'user_id'),
        ]).subscribe({
            next: ([_resNamhoc, _resHocky, _resCategory, _userProfile]) => {
                this.listNamhoc = _resNamhoc.filter((f: any) => f['namhoc']).map((f: any) => ({
                    value: f['namhoc'],
                    label: 'Năm học '.concat(f['namhoc']),
                }));

                this.listHocky = _resHocky.filter((f: any) => f['hocky']).map((f: any) => ({
                    value: f['hocky'],
                    label: 'HK '.concat(f['hocky']),
                }));

                this.list_donvi_chuyenmon = _resCategory;

                this.user_profile = _userProfile[0];

                if (this.listNamhoc && this.listNamhoc[0] && this.listNamhoc[0]['value']) {
                    this.objectFilter['namhoc'] = this.listNamhoc[0]['value'];
                    this.objectFilter['hocky'] = this.listHocky && this.listHocky[0] && this.listHocky[0]['value'] ? this.listHocky[0]['value'] : null;
                    this.loadPageClass(1);
                } else {
                    this.noitifi.isProcessing(false);
                }
            },
            error: () => {
                this.noitifi.toastError('Lỗi kết nối');
                this.noitifi.isProcessing(false);
            },
        });
    }

    loadPageClass(page: number) {
        this.noitifi.isProcessing(true);
        this.selectedClasses = [];

        if (this.auth.userHasRole(ROLES.lanhdaokhoa) && (!this.user_profile || !this.user_profile.donvi_chuyenmon_id || this.user_profile.donvi_chuyenmon_id === 0)) {
            this.noitifi.isProcessing(false);
            return this.noitifi.toastInfo('Thầy/Cô chưa được phân khoa trên hệ thống, vui lòng liên hệ phòng Đào tạo');
        }

        if (this.auth.userHasRole(ROLES.lanhdaobomon) && (!this.user_profile || !this.user_profile.bomon_id)) {
            this.noitifi.isProcessing(false);
            return this.noitifi.toastInfo('Thầy/Cô chưa được phân bộ môn trên hệ thống, vui lòng liên hệ phòng Đào tạo');
        }

        const condition: ConditionOption = {
            condition: [
                { conditionName: 'status', condition: OvicQueryCondition.equal, value: '1', orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: this.limitList.toString() }
            ],
            page: page.toString(),
        };

        if (this.user_profile && this.user_profile.donvi_chuyenmon_id && this.auth.userHasRole(ROLES.lanhdaokhoa)) {
            condition.condition.push(
                { conditionName: 'category_id', condition: OvicQueryCondition.equal, value: this.user_profile.donvi_chuyenmon_id.toString(), orWhere: 'and' }
            );
        }

        if (this.user_profile && this.user_profile.bomon_id && this.auth.userHasRole(ROLES.lanhdaobomon)) {
            condition.condition.push(
                { conditionName: 'nganh_bomon_id', condition: OvicQueryCondition.equal, value: this.user_profile.bomon_id.toString(), orWhere: 'and' }
            );
        }

        const arr_like = ['name'];

        Object.keys(this.objectFilter).forEach((f) => {
            if (this.objectFilter[f] === null || this.objectFilter[f] === undefined || this.objectFilter[f] === '') {
                return;
            }
            const index = arr_like.findIndex((m) => m === f);
            if (index !== -1) {
                condition.condition.push(
                    { conditionName: f, condition: OvicQueryCondition.like, value: '%'.concat(this.objectFilter[f], '%'), orWhere: 'and' }
                );
            } else {
                condition.condition.push(
                    { conditionName: f, condition: OvicQueryCondition.equal, value: this.objectFilter[f].toString(), orWhere: 'and' }
                );
            }
        });

        forkJoin([
            this.classesService.getClassesByPageNew(condition).pipe(
                mergeMap((_class) => {

                    const couse_ids = [0];

                    _class.data.forEach((f) => {
                        couse_ids.push(f.course_id);
                    });

                    const new_couse_ids = [...new Set(couse_ids)];

                    const condition_mon: ConditionOption = {
                        condition: [],
                        set: [
                            { label: 'include', value: new_couse_ids.toString() },
                            { label: 'include_by', value: 'id' },
                            { label: 'limit', value: '-1' },
                        ],
                        page: null,
                    };

                    if (_class.recordsFiltered) {
                        return this.elnKhoaHocService.getKhoaHocByPageNew_2(condition_mon).pipe(
                            map((_mon) => {
                                _class.data.forEach((f) => {
                                    const index_mon = _mon.data.findIndex((m) => m.id === f.course_id);
                                    if (index_mon !== -1) {
                                        f['show_mon'] = '['.concat(_mon.data[index_mon].maso, '] - ', _mon.data[index_mon].title);
                                    } else {
                                        f['show_mon'] = '';
                                    }
                                });
                                return _class;
                            })
                        );
                    }
                    return of(_class);
                })
            ),
        ]).subscribe(([_resClass]) => {

            const tmpClass = [];

            if (!_resClass.recordsFiltered) {
                this.emptyList =
                    'Không tìm thấy lớp học phần nào phù hợp với bộ lọc, vui lòng kiểm tra lại điều kiện lọc (Năm học, Học kỳ, Khoa, Khóa, Đợt, Môn học).';
            }

            this.countClass = _resClass.recordsFiltered;

            const _index_start = (page - 1) * this.limitList;

            _resClass.data.forEach((f, key) => {
                f['index_'] = _index_start + key + 1;
                f.manager_ids = f.manager_ids ? f.manager_ids.split('|').filter((m) => m) : null;
                if (f.manager_info) {
                    f['mainTeacher'] = f.manager_info.replace(/\*/gi, '').replace(/\,/gi, ', ');
                }
                if (f.course_id && f.course_info && f.course_info['title']) {
                    f['course_name'] = f.course_info['title'];
                }
                tmpClass.push(f);
            });

            this.listClass = tmpClass;

            this.noitifi.isProcessing(false);
        });
    }

    searchClass(event) {
        if (event) {
            if (event.code === 'Enter' || event.code === 'NumpadEnter') {
                const value = event.target.value.trim();
                this.objectFilter['name'] = value;
                this.onResetPage();
            }

            if (!event.target.value || !event.target.value.trim()) {
                delete this.objectFilter['name'];
                this.onResetPage();
            }
        } else {
            delete this.objectFilter['name'];
            this.onResetPage();
        }
    }

    onChangeFilter(event, keyName: string) {
        if (event) {
            this.objectFilter[keyName] = event['value'] ? event['value'] : event['id'];
        } else {
            delete this.objectFilter[keyName];
        }
        this.onResetPage();
    }

    async onChangeBulkFacultyFilter(event: any): Promise<void> {
        if (event) {
            this.objectFilter['category_id'] = event.id;
            this.listCategory = await this.getDonviPromise(event.id);
            this.listCourse = await this.getCoursePromise('category_ids', event.id);
        } else {
            delete this.objectFilter['category_id'];
            this.listCategory = [];
            this.listCourse = [];
        }
        delete this.objectFilter['nganh_bomon_id'];
        delete this.objectFilter['course_id'];
        this.onResetPage();
    }

    onChangeTextFilter(value: any, keyName: string): void {
        if (value !== null && value !== undefined && value !== '') {
            this.objectFilter[keyName] = value;
        } else {
            delete this.objectFilter[keyName];
        }
        this.onResetPage();
    }

    onResetPage() {
        if (!this.paginator()?.empty()) {
            this.paginator()?.changePage(0);
        } else {
            this.loadPageClass(1);
        }
    }

    changePage(event) {
        this.pageIndex = event.page + 1;
        this.loadPageClass(event.page + 1);
    }

    cancelFilter() {
        delete this.objectFilter['name'];
        delete this.objectFilter['khoa'];
        delete this.objectFilter['dothoc'];
        delete this.objectFilter['nganh_bomon_id'];
        delete this.objectFilter['course_id'];
        delete this.objectFilter['category_id'];
        this.onResetPage();
    }

    getDonviPromise(donvi_chuyenmon_id: number): Promise<any> {
        return new Promise((resolve, reject) => {
            const arr_condition = [
                {
                    conditionName: 'status',
                    condition: OvicQueryCondition.notEqual,
                    value: '-1',
                    orWhere: 'and',
                },
                {
                    conditionName: 'donvi_id',
                    condition: OvicQueryCondition.equal,
                    value: this.auth.user.donvi_id.toString(),
                    orWhere: 'and',
                },
                {
                    conditionName: 'type',
                    condition: OvicQueryCondition.equal,
                    value: 'bomon',
                    orWhere: 'and',
                },
                {
                    conditionName: 'donvi_chuyenmon_id',
                    condition: OvicQueryCondition.equal,
                    value: donvi_chuyenmon_id.toString(),
                    orWhere: 'and',
                },
            ];

            const condition_nganh = this.httpHelper.paramsConditionBuilder(arr_condition).set('limit', '-1');

            this.elnChuyenMucService.getElnChuyenMucByCols(condition_nganh).subscribe({
                next: (_category) => {
                    resolve(_category);
                },
                error: () => {
                    resolve([]);
                },
            });
        });
    }

    getCoursePromise(col: string, id: number): Promise<any> {
        return new Promise((resolve, reject) => {
            this.elnKhoaHocService.getElnKhoaHocByCol(col, id.toString()).subscribe({
                next: (_resCourse) => {
                    const tmp = _resCourse.filter((m) => m.status > -1);
                    tmp.forEach((f) => {
                        f['title'] = f.title.concat(' - [', f.maso, ']');
                    });
                    resolve(tmp);
                },
                error: () => {
                    this.noitifi.toastError('Lỗi kết nối');
                    resolve([]);
                },
            });
        });
    }

    // ==================== Kích hoạt bài kiểm tra hàng loạt ====================

    openBulkActivateTest(): void {
        if (!this.canShowBulkActivateTest || !this.selectedClasses.length) {
            return;
        }
        this.selectedClassesForTest = this.selectedClasses.slice();
        this.dateStartTest = null;
        this.practiceTimeForTest = 7;
        this.failedClasses = [];
        this.progressValue = 0;
        this.isActivating = false;
        this.displayActivateTestDialog = true;
    }

    cancelBulkActivateTest(): void {
        if (!this.isActivating) {
            this.displayActivateTestDialog = false;
        }
    }

    startBulkActivateTest(): void {
        const duration = Number(this.practiceTimeForTest);
        if (!this.dateStartTest) {
            this.noitifi.toastWarning('Vui lòng chọn ngày giờ bắt đầu kích hoạt');
            return;
        }
        if (!Number.isInteger(duration) || duration <= 0) {
            this.noitifi.toastWarning('Số ngày mở bài kiểm tra phải là số nguyên dương');
            return;
        }
        if (!this.selectedClassesForTest.length || this.isActivating) {
            return;
        }

        this.isActivating = true;
        this.progressValue = 0;
        this.failedClasses = [];
        this.noitifi.isProcessing(true);
        from(this.selectedClassesForTest).pipe(
            concatMap((item, index) => this.activateTestsForClass(item, this.dateStartTest, duration).pipe(
                catchError(error => of({
                    success: false,
                    class: item,
                    reason: error && error.reason ? error.reason : 'Lỗi kết nối hoặc lỗi khi lưu dữ liệu'
                })),
                tap(result => {
                    if (!result.success) {
                        this.failedClasses.push({ class: item, reason: result.reason });
                    }
                    this.progressValue = ((index + 1) / this.selectedClassesForTest.length) * 100;
                })
            )),
            toArray(),
            finalize(() => {
                this.isActivating = false;
                this.noitifi.isProcessing(false);
                this.loadPageClass(this.pageIndex || 1);
            })
        ).subscribe({
            next: results => {
                const successCount = results.filter(result => result.success).length;
                if (this.failedClasses.length) {
                    this.noitifi.toastWarning('Đã kích hoạt ' + successCount + '/' + results.length + ' lớp; một số lớp chưa đủ điều kiện');
                } else {
                    this.noitifi.toastSuccess('Kích hoạt thành công ' + successCount + ' lớp');
                }
            },
            error: () => this.noitifi.toastError('Kích hoạt thất bại, vui lòng thử lại')
        });
    }

    private activateTestsForClass(item: Classes, dateStart: Date, duration: number): Observable<{ success: boolean; class: Classes; reason?: string }> {
        const activityCondition: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: item.course_id.toString() },
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.greaterThan, value: '0', orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.lessThan, value: '100', orWhere: 'and' }
            ],
            set: [{ label: 'limit', value: '-1' }, { label: 'orderby', value: 'ordering' }, { label: 'order', value: 'ASC' }],
            page: null
        };
        const bankCondition: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: item.course_id.toString() },
                { conditionName: 'bank_type', condition: OvicQueryCondition.equal, value: 'CC', orWhere: 'and' }
            ],
            set: [{ label: 'limit', value: '-1' }, { label: 'select', value: 'week,id' }],
            page: null
        };
        const classPlanCondition: ConditionOption = {
            condition: [
                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: item.id.toString(), orWhere: 'and' },
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: item.course_id.toString(), orWhere: 'and' }
            ],
            set: [{ label: 'limit', value: '-1' }],
            page: null
        };
        return forkJoin({
            activities: this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(activityCondition),
            banks: this.coursePlanBankService.getCoursePlanBankByPageNew(bankCondition),
            classPlans: this.classPlansService.getClassPlansByPageNew(classPlanCondition)
        }).pipe(
            mergeMap(({ activities, banks, classPlans }) => {
                const allActivities = activities.data || [];
                const testActivities = allActivities.filter(activity => activity.type === 'ACTIVITY_TEST');
                if (!testActivities.length) {
                    return of({ success: false, class: item, reason: 'Môn học chưa có bài kiểm tra' });
                }

                const weekParents = allActivities.filter(activity => activity.parent_id === 0 && activity.week > 0 && activity.week < 100);
                const invalidWeeks = testActivities.filter(test => {
                    const parent = weekParents.find(week => week.id === test.parent_id);
                    const hasContent = parent && allActivities.some(activity =>
                        activity.parent_id === parent.id &&
                        (activity.type === 'ACTIVITY' || activity.type === 'ACTIVITY_CDR') &&
                        activity.status === 1 &&
                        !!(activity.desc || (activity.files && activity.files.length) || activity.video)
                    );
                    const hasQuestions = (banks.data || []).some(bank => bank.week === test.week);
                    return !hasContent || !hasQuestions;
                });
                if (invalidWeeks.length) {
                    return of({ success: false, class: item, reason: 'Thiếu nội dung bài học hoặc đề kiểm tra ở tuần ' + invalidWeeks.map(activity => activity.week).join(', ') });
                }

                const teachingDay = this.helperService.stringToDateSql(dateStart.toString());
                const requests: Observable<any>[] = testActivities.map(test => {
                    const parent = weekParents.find(week => week.id === test.parent_id);
                    const existingPlan = (classPlans.data || []).find(plan => plan.course_plan_activity_id === (parent ? parent.id : test.parent_id));
                    const dataPlan = {
                        class_id: item.id,
                        course_id: item.course_id,
                        week: test.week,
                        title: test.week,
                        teaching_day: teachingDay,
                        course_plan_activity_id: parent ? parent.id : test.parent_id
                    };
                    return existingPlan && existingPlan.id
                        ? this.classPlansService.updateClassPlans(existingPlan.id, dataPlan)
                        : this.classPlansService.addClassPlans(dataPlan);
                });
                const params = { ...(item.params || {}), PRACTICE_TIME_FOR_A_TEST: duration };
                requests.push(this.classesService.updateDataClasses(item.id, { params }));
                return forkJoin(requests).pipe(
                    map(() => ({ success: true, class: item }))
                );
            })
        );
    }
}