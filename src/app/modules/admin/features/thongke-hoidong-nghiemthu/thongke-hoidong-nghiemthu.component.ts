import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OvicQueryCondition } from '@core/models/dto';
import { NotificationService } from '@core/services/notification.service';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { CoursePlanActivities } from '@modules/shared/models/course-plan-activities';
import { CoursePlanActivityTuluan } from '@modules/shared/models/course-plan-activity-tuluan';
import { CourseQuestions } from '@modules/shared/models/course-questions';
import { CourseParams, ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { HoidongThamdinh, HoidongThamdinhMonhocExpand } from '@modules/shared/models/hoidong-thamdinh';
import { HoidongThamdinhThanhvien } from '@modules/shared/models/hoidong-thamdinh-thanhvien';
import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';
import { CoursePlanActivityTuluanService } from '@modules/shared/services/course-plan-activity-tuluan.service';
import { CourseQuestionsService } from '@modules/shared/services/course-questions.service';
import { HoidongThamdinhMonhocService } from '@modules/shared/services/hoidong-thamdinh-monhoc.service';
import { HoidongThamdinhMonhocThanhvienService } from '@modules/shared/services/hoidong-thamdinh-monhoc-thanhvien.service';
import { HoidongThamdinhService } from '@modules/shared/services/hoidong-thamdinh.service';
import { HoidongThamdinhThanhvienService } from '@modules/shared/services/hoidong-thamhdinh-thanhvien.service';
import { OvicDateTimeService } from '@modules/shared/services/ovic-date-time.service';
import { HOIDONG_STATUS } from '@modules/shared/utils/syscat';
import { SharedModule } from '@modules/shared/shared.module';
import { forkJoin, of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { DatePickerModule } from 'primeng/datepicker';
import { PanelModule } from 'primeng/panel';
import { ProgressBarModule } from 'primeng/progressbar';
import { TableModule } from 'primeng/table';
import type {
    CouncilDashboardCouncilGroup,
    CouncilDashboardCourseRow,
    CouncilDashboardStatCard,
    CouncilDashboardStatCardKey,
    CouncilDashboardSummary
} from './thongke-hoidong-nghiemthu.types';

@Component({
    selector: 'app-thongke-hoidong-nghiemthu',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        SharedModule,
        TableModule,
        PanelModule,
        ProgressBarModule,
        DatePickerModule,

    ],
    templateUrl: './thongke-hoidong-nghiemthu.component.html',
    styleUrls: ['./thongke-hoidong-nghiemthu.component.css']
})
export class ThongkeHoidongNghiemthuComponent implements OnInit {
    selectedYear: Date | null = null;

    private serverDate: Date | null = null;

    councils: HoidongThamdinh[] = [];

    councilGroups: CouncilDashboardCouncilGroup[] = [];

    courseRows: CouncilDashboardCourseRow[] = [];

    statCards: CouncilDashboardStatCard[] = [];

    isDashboardLoading = false;

    summary: CouncilDashboardSummary = this.createEmptySummary();

    constructor(
        private notificationService: NotificationService,
        private hoidongThamdinhService: HoidongThamdinhService,
        private hoidongThamdinhMonhocService: HoidongThamdinhMonhocService,
        private hoidongThamdinhThanhvienService: HoidongThamdinhThanhvienService,
        private hoidongThamdinhMonhocThanhvienService: HoidongThamdinhMonhocThanhvienService,
        private coursePlanActivitiesService: CoursePlanActivitiesService,
        private coursePlanActivityTuluanService: CoursePlanActivityTuluanService,
        private courseQuestionsService: CourseQuestionsService,
        private ovicDateTimeService: OvicDateTimeService
    ) {}

    ngOnInit(): void {
        this.ovicDateTimeService.getCurrentDateTime().subscribe({
            next: serverDate => {
                this.serverDate = serverDate;
                this.selectedYear = new Date(serverDate.getFullYear(), 0, 1);
                this.loadDashboard();
            },
            error: () => {
                this.notificationService.toastError('Không lấy được thời gian server');
            }
        });
    }

    get selectedYearNumber(): number {
        return (this.selectedYear || this.serverDate || new Date()).getFullYear();
    }

    get celoProgress(): number {
        const total = this.summary.totalLectureItems + this.summary.totalCpiItems;
        const approved = this.summary.approvedLectureItems + this.summary.approvedCpiItems;
        return total ? Math.round((approved / total) * 100) : 0;
    }

    get questionProgress(): number {
        return this.summary.totalQuestionCourses
            ? Math.round((this.summary.acceptedQuestionCourses / this.summary.totalQuestionCourses) * 100)
            : 0;
    }

    onYearChange(): void {
        this.loadDashboard();
    }

    private loadDashboard(): void {
        this.isDashboardLoading = true;
        this.summary = this.createEmptySummary();
        this.councilGroups = [];
        this.courseRows = [];
        this.statCards = this.buildStatCards(this.summary, ['councils', 'courses', 'proposals', 'celo', 'questions']);

        const year = this.selectedYearNumber;
        const start = `${year}-01-01`;
        const end = `${year}-12-31`;

        const councilCondition: ConditionOption = {
            condition: [
                { conditionName: 'date_start', condition: OvicQueryCondition.lessThanOrEqualsTo, value: end, orWhere: 'and' },
                { conditionName: 'date_end', condition: OvicQueryCondition.greaterThanToEqualsTo, value: start, orWhere: 'and' },
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'order', value: 'DESC' },
                { label: 'orderby', value: 'date_start' }
            ],
            page: null
        };

        this.hoidongThamdinhService.getHoidongThamdinhByPageNew(councilCondition).pipe(
            mergeMap(({ data }) => {
                const councils = data.filter(council => council.type === 'celo' || council.type === 'cauhoi');
                this.councils = councils;
                this.summary.totalCouncils = councils.length;
                this.statCards = this.buildStatCards(this.summary, ['courses', 'proposals', 'celo', 'questions']);

                if (!councils.length) {
                    return of(null);
                }

                const councilIds = councils
                    .map(council => council.id)
                    .filter((id): id is number => typeof id === 'number');

                const courseCondition: ConditionOption = {
                    condition: [],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'include', value: councilIds.toString() },
                        { label: 'include_by', value: 'hoidong_thamdinh_id' },
                        { label: 'with', value: 'course' }
                    ],
                    page: null
                };

                const councilMemberCondition: ConditionOption = {
                    condition: [],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'include', value: councilIds.toString() },
                        { label: 'include_by', value: 'hoidong_thamdinh_id' },
                        { label: 'with', value: 'user_id' }
                    ],
                    page: null
                };

                const councilCourseMemberCondition: ConditionOption = {
                    condition: [],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'include', value: councilIds.toString() },
                        { label: 'include_by', value: 'hoidong_thamdinh_id' },
                        { label: 'with', value: 'user_id' }
                    ],
                    page: null
                };

                return forkJoin([
                    this.hoidongThamdinhThanhvienService.getHoidongThamdinhThanhvienByPageNew(councilMemberCondition),
                    this.hoidongThamdinhMonhocService.getHoidongThamdinhMonhocByPageNew(courseCondition),
                    this.hoidongThamdinhMonhocThanhvienService.getHoidongThamdinhMonhocThanhvienByPageNew(councilCourseMemberCondition)
                ]).pipe(
                    mergeMap(([councilMemberResponse, courseResponse, courseMemberResponse]) => {
                        const councilMembers = councilMemberResponse.data as HoidongThamdinhThanhvien[];
                        const courseLinks = courseResponse.data.map(course => this.normalizeCourse(course));

                        courseLinks.forEach(course => {
                            course.thanhvien = courseMemberResponse.data.filter(member => member.hoidong_thamdinh_monhoc_id === course.id);
                        });

                        this.councils.forEach(council => {
                            council['thanhviens'] = councilMembers.filter(member => member.hoidong_thamdinh_id === council.id);
                            council.courses = courseLinks.filter(course => course.hoidong_thamdinh_id === council.id);
                        });

                        const courseIds = [...new Set(courseLinks.map(course => course.course_id))];
                        this.summary.totalCourses = courseIds.length;
                        this.statCards = this.buildStatCards(this.summary, ['proposals', 'celo', 'questions']);

                        if (!courseIds.length) {
                            return of({
                                activities: [] as CoursePlanActivities[],
                                questions: [] as CourseQuestions[],
                                tuluanKthp: [] as CoursePlanActivityTuluan[],
                                tuluanTx: [] as CoursePlanActivityTuluan[],
                                duan: [] as CoursePlanActivityTuluan[],
                                idsPlanCdrByCourse: new Map<number, number[]>()
                            });
                        }

                        const planCondition: ConditionOption = {
                            condition: [
                                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
                                { conditionName: 'type', condition: OvicQueryCondition.notEqual, value: 'THUONGXUYEN_TRACNGHIEM', orWhere: 'and' },
                                { conditionName: 'type', condition: OvicQueryCondition.notEqual, value: 'GIOITHIEU', orWhere: 'and' },
                                { conditionName: 'type', condition: OvicQueryCondition.notEqual, value: 'PLAN', orWhere: 'and' }
                            ],
                            set: [
                                { label: 'limit', value: '-1' },
                                { label: 'include', value: courseIds.toString() },
                                { label: 'include_by', value: 'course_id' },
                                { label: 'select', value: 'course_id,status,id,type,week,parent_id,ordering' }
                            ],
                            page: null
                        };

                        const questionCondition: ConditionOption = {
                            condition: [
                                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
                                { conditionName: 'reference', condition: OvicQueryCondition.equal, value: 'course_plan_activities', orWhere: 'and' }
                            ],
                            set: [
                                { label: 'limit', value: '-1' },
                                { label: 'include', value: courseIds.toString() },
                                { label: 'include_by', value: 'course_id' },
                                { label: 'select', value: 'course_id,status,id,reference_id,group_id' }
                            ],
                            page: null
                        };

                        const tuluanKthpCondition: ConditionOption = {
                            condition: [
                                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
                                { conditionName: 'course_plan_activity_id', condition: OvicQueryCondition.equal, value: '0', orWhere: 'and' }
                            ],
                            set: [
                                { label: 'limit', value: '-1' },
                                { label: 'include', value: courseIds.toString() },
                                { label: 'include_by', value: 'course_id' },
                                { label: 'select', value: 'course_id,status,id' }
                            ],
                            page: null
                        };

                        return forkJoin([
                            this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(planCondition),
                            this.courseQuestionsService.getCourseQuestionsByPageNew(questionCondition),
                            this.coursePlanActivityTuluanService.getCoursePlanActivityTuluanByPageNew(tuluanKthpCondition)
                        ]).pipe(
                            mergeMap(([activityResponse, questionResponse, tuluanKthpResponse]) => {
                                const idsPlanCdrByCourse = new Map<number, number[]>();
                                const idsPlanTh: number[] = [];
                                const idsPlanDa: number[] = [];

                                activityResponse.data.forEach(activity => {
                                    if (activity.type === 'ACTIVITY_CDR') {
                                        const current = idsPlanCdrByCourse.get(activity.course_id) || [];
                                        current.push(activity.id);
                                        idsPlanCdrByCourse.set(activity.course_id, current);
                                    }

                                    if (activity.type === 'THUONGXUYEN_TULUAN') {
                                        idsPlanTh.push(activity.id);
                                    }

                                    if (activity.type === 'THUONGXUYEN_DUAN' && activity.ordering === 0) {
                                        idsPlanDa.push(activity.id);
                                    }
                                });

                                const tuluanTxCondition: ConditionOption = {
                                    condition: [
                                        { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' }
                                    ],
                                    set: [
                                        { label: 'limit', value: '-1' },
                                        { label: 'include', value: idsPlanTh.length ? idsPlanTh.toString().concat('-1') : '-1' },
                                        { label: 'include_by', value: 'course_plan_activity_id' },
                                        { label: 'select', value: 'course_id,status,id' }
                                    ],
                                    page: null
                                };

                                const duanCondition: ConditionOption = {
                                    condition: [
                                        { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' }
                                    ],
                                    set: [
                                        { label: 'limit', value: '-1' },
                                        { label: 'include', value: idsPlanDa.length ? idsPlanDa.toString().concat('-1') : '-1' },
                                        { label: 'include_by', value: 'course_plan_activity_id' },
                                        { label: 'select', value: 'course_id,status,id' }
                                    ],
                                    page: null
                                };

                                return forkJoin([
                                    idsPlanTh.length
                                        ? this.coursePlanActivityTuluanService.getCoursePlanActivityTuluanByPageNew(tuluanTxCondition)
                                        : of({ data: [] as CoursePlanActivityTuluan[], recordsFiltered: 0 }),
                                    idsPlanDa.length
                                        ? this.coursePlanActivityTuluanService.getCoursePlanActivityTuluanByPageNew(duanCondition)
                                        : of({ data: [] as CoursePlanActivityTuluan[], recordsFiltered: 0 })
                                ]).pipe(
                                    map(([tuluanTxResponse, duanResponse]) => ({
                                        idsPlanCdrByCourse,
                                        activities: activityResponse.data,
                                        questions: questionResponse.data,
                                        tuluanKthp: tuluanKthpResponse.data,
                                        tuluanTx: tuluanTxResponse.data,
                                        duan: duanResponse.data
                                    }))
                                );
                            })
                        );
                    })
                );
            }),
            catchError(() => {
                this.notificationService.toastError('Không tải được thống kê hội đồng nghiệm thu');
                return of(null);
            })
        ).subscribe(result => {
            if (result) {
                this.buildDashboard(result.activities, result.questions, result.tuluanKthp, result.tuluanTx, result.duan, result.idsPlanCdrByCourse);
            } else {
                this.councilGroups = [];
                this.summary = this.createEmptySummary();
                this.statCards = this.buildStatCards(this.summary);
            }
            this.isDashboardLoading = false;
        });
    }

    private normalizeCourse(course: HoidongThamdinhMonhocExpand): HoidongThamdinhMonhocExpand {
        if (course.course && typeof course.course.params === 'string') {
            try {
                course.course.params = JSON.parse(course.course.params) as CourseParams;
            } catch {
                course.course.params = undefined;
            }
        }
        return course;
    }

    private buildDashboard(
        activities: CoursePlanActivities[],
        questions: CourseQuestions[],
        tuluanKthp: CoursePlanActivityTuluan[],
        tuluanTx: CoursePlanActivityTuluan[],
        duan: CoursePlanActivityTuluan[],
        idsPlanCdrByCourse: Map<number, number[]>
    ): void {
        const rows: CouncilDashboardCourseRow[] = [];
        const summary = {
            ...this.createEmptySummary(),
            totalCouncils: this.summary.totalCouncils,
            totalCourses: this.summary.totalCourses
        };

        this.councils.forEach(council => {
            const councilCourses = (council.courses || []) as HoidongThamdinhMonhocExpand[];

            councilCourses.forEach(courseLink => {
                const course = courseLink.course as ElnKhoaHoc | undefined;

                const cdrActivityIds = idsPlanCdrByCourse.get(courseLink.course_id) || [];
                const filteredQuestions = questions.filter(question =>
                    question.course_id === courseLink.course_id && cdrActivityIds.includes(question.reference_id || 0)
                );
                const filteredActivities = activities.filter(activity => activity.course_id === courseLink.course_id);
                const filteredTuluanKthp = tuluanKthp.filter(item => item.course_id === courseLink.course_id);
                const filteredTuluanTx = tuluanTx.filter(item => item.course_id === courseLink.course_id);
                const filteredDuan = duan.filter(item => item.course_id === courseLink.course_id);

                const approvedQuestions = course?.av === 1
                    ? filteredQuestions.filter(item => item.status === 1 && item.group_id !== 0).length
                    : filteredQuestions.filter(item => item.status === 1 && item.group_id === 0).length;
                const totalQuestions = course?.av === 1
                    ? filteredQuestions.filter(item => item.group_id !== 0).length
                    : filteredQuestions.filter(item => item.group_id === 0).length;
                const approvedEssayProposals = filteredTuluanKthp.filter(item => item.status === 1).length + filteredTuluanTx.filter(item => item.status === 1).length;
                const totalEssayProposals = filteredTuluanKthp.length + filteredTuluanTx.length;
                const approvedProjectProposals = filteredDuan.filter(item => item.status === 1).length;
                const totalProjectProposals = filteredDuan.length;
                const approvedProposals = approvedEssayProposals + approvedProjectProposals;
                const totalProposals = totalEssayProposals + totalProjectProposals;
                const approvedLectures = filteredActivities.filter(activity =>
                    activity.status === 1 && (activity.type === 'ACTIVITY' || activity.type === 'MUCTIEU')
                ).length;
                const totalLectures = filteredActivities.filter(activity =>
                    activity.type === 'ACTIVITY' || activity.type === 'MUCTIEU'
                ).length;
                const approvedCpi = filteredActivities.filter(activity =>
                    activity.status === 1 && activity.type === 'ACTIVITY_CDR' && activity.week !== 100
                ).length;
                const totalCpi = filteredActivities.filter(activity =>
                    activity.type === 'ACTIVITY_CDR' && activity.week !== 100
                ).length;
                const totalLessons = filteredActivities.filter(activity =>
                    activity.type === 'PLAN' &&
                    activity.parent_id === 0 &&
                    activity.week > 0 &&
                    activity.week < 100 &&
                    activity.status !== -3
                ).length;

                if (council.type === 'celo') {
                    summary.approvedLectureItems += approvedLectures;
                    summary.totalLectureItems += totalLectures;
                    summary.approvedCpiItems += approvedCpi;
                    summary.totalCpiItems += totalCpi;
                    summary.totalCeloCourses += 1;
                    if (council.status === 2) {
                        summary.acceptedCeloCourses += 1;
                    }
                }

                if (council.type === 'cauhoi') {
                    summary.totalQuestionCourses += totalQuestions;
                    summary.acceptedQuestionCourses += approvedQuestions;
                    summary.totalProposals += totalProposals;
                    summary.approvedProposals += approvedProposals;
                }

                rows.push({
                    councilId: council.id || 0,
                    councilTitle: council.title,
                    councilType: this.normalizeCouncilType(council.type),
                    councilStatus: council.status,
                    councilStatusLabel: this.getCouncilStatusLabel(council),
                    councilDateStart: council.date_start,
                    councilDateEnd: council.date_end,
                    courseId: courseLink.course_id,
                    courseTitle: course?.title || 'Chưa có tên môn học',
                    courseCode: course?.maso || '---',
                    credits: this.getCredits(course),
                    totalLessons,
                    totalQuestions,
                    approvedQuestions,
                    totalProposals,
                    approvedProposals,
                    approvedLectures,
                    totalLectures,
                    approvedCpi,
                    totalCpi,
                    memberStatusLabel: this.getMemberStatusLabel(courseLink),
                    accepted: council.status === 2
                });
            });
        });

        this.councilGroups = this.councils.map(council => {
            const uniqueRows = new Map<number, CouncilDashboardCourseRow>();
            rows
                .filter(row => row.councilId === (council.id || 0))
                .forEach(row => {
                    if (!uniqueRows.has(row.courseId)) {
                        uniqueRows.set(row.courseId, row);
                    }
                });

            return {
                councilId: council.id || 0,
                councilTitle: council.title,
                councilType: this.normalizeCouncilType(council.type),
                councilStatus: council.status,
                councilStatusLabel: this.getCouncilStatusLabel(council),
                councilDateStart: council.date_start,
                councilDateEnd: council.date_end,
                rows: [...uniqueRows.values()],
                councilMemberCount: Array.isArray(council['thanhviens']) ? council['thanhviens'].length : 0,
                councilChairmanCount: Array.isArray(council['thanhviens'])
                    ? council['thanhviens'].filter((member: HoidongThamdinhThanhvien) => member.chutich === true).length
                    : 0
            };
        });
        this.statCards = this.buildStatCards(summary);
        this.summary = summary;
    }

    private getCredits(course: ElnKhoaHoc | undefined): number {
        const params = course?.params as CourseParams | undefined;
        return Number(params?.sotinchi || 0);
    }

    private getCouncilStatusLabel(council: HoidongThamdinh): string {
        if (council.status === 2) {
            return 'Đã hoàn thành';
        }

        const now = this.serverDate;
        const start = new Date(council.date_start);
        const end = new Date(council.date_end);
        end.setHours(23, 59, 59, 999);

        if (now && now.getTime() < start.getTime()) {
            return 'Chưa bắt đầu';
        }

        if (now && now.getTime() > end.getTime()) {
            return 'Đã kết thúc';
        }

        if (now && start.getTime() <= now.getTime() && now.getTime() <= end.getTime()) {
            return council.status === 0 ? 'Chưa mở' : 'Đang thực hiện';
        }

        const found = HOIDONG_STATUS.find(item => item.key === council.status);
        return found ? found.label : 'Không xác định';
    }

    private getMemberStatusLabel(courseLink: HoidongThamdinhMonhocExpand): string {
        const assignedCourseMembers = Array.isArray(courseLink.thanhvien) ? courseLink.thanhvien.length : 0;
        return assignedCourseMembers ? assignedCourseMembers.toString() : '0';
    }

    private normalizeCouncilType(type: HoidongThamdinh['type']): 'celo' | 'cauhoi' {
        return type === 'celo' ? 'celo' : 'cauhoi';
    }

    private createEmptySummary(): CouncilDashboardSummary {
        return {
            totalCouncils: 0,
            totalCourses: 0,
            totalProposals: 0,
            approvedProposals: 0,
            acceptedCeloCourses: 0,
            totalCeloCourses: 0,
            acceptedQuestionCourses: 0,
            totalQuestionCourses: 0,
            approvedLectureItems: 0,
            totalLectureItems: 0,
            approvedCpiItems: 0,
            totalCpiItems: 0
        };
    }

    private buildStatCards(summary: CouncilDashboardSummary, loadingKeys: CouncilDashboardStatCardKey[] = []): CouncilDashboardStatCard[] {
        const loadingKeySet = new Set<CouncilDashboardStatCardKey>(loadingKeys);
        const celoApprovedTotal = summary.approvedLectureItems + summary.approvedCpiItems;
        const celoItemsTotal = summary.totalLectureItems + summary.totalCpiItems;

        return [
            {
                key: 'councils',
                label: 'Số lượng hội đồng',
                value: summary.totalCouncils,
                colorClass: 'council-card--blue',
                loading: loadingKeySet.has('councils')
            },
            {
                key: 'courses',
                label: 'Số lượng môn học',
                value: summary.totalCourses,
                colorClass: 'council-card--teal',
                loading: loadingKeySet.has('courses')
            },
            {
                key: 'proposals',
                label: 'Số lượng đề (TH + Dự án)',
                value: summary.totalProposals,
                subLabel: `${summary.approvedProposals}/${summary.totalProposals}`,
                colorClass: 'council-card--purple',
                loading: loadingKeySet.has('proposals')
            },
            {
                key: 'celo',
                label: 'CPI + Bài giảng đã duyệt',
                value: celoApprovedTotal,
                subLabel: `BG ${summary.approvedLectureItems}/${summary.totalLectureItems} • CPI ${summary.approvedCpiItems}/${summary.totalCpiItems} • Tổng ${celoApprovedTotal}/${celoItemsTotal}`,
                colorClass: 'council-card--green',
                loading: loadingKeySet.has('celo')
            },
            {
                key: 'questions',
                label: 'Câu hỏi đã duyệt',
                value: summary.acceptedQuestionCourses,
                subLabel: `${summary.acceptedQuestionCourses}/${summary.totalQuestionCourses}`,
                colorClass: 'council-card--red',
                loading: loadingKeySet.has('questions')
            }
        ];
    }
}
