import { HvuApiDanhsachdiemdanh, HvuApiDanhsachdiemdanhService } from './../../../../../shared/services/hvu-api-danhsachdiemdanh.service';
import { UserService } from './../../../../../../core/services/user.service';
import { ExportDiemthuongxuyenV2Service } from './../../../../../shared/services/export-diemthuongxuyen-v2.service';
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Classes } from "@shared/models/classes";
import { RptClassStudentPoints, RptClassStudentPointsService } from "@shared/services/rpt-class-student-points.service";
import { key_server } from "@env";
import { HttpParamsHeplerService } from "@core/services/http-params-hepler.service";
import { NotificationService } from "@core/services/notification.service";
import { ClassStudentService } from "@shared/services/class-student.service";
import { ClassPlanActivitiesTestsService } from "@shared/services/class-plan-activities-tests.service";
import { ClassPlanActivityStudentTestsService } from "@shared/services/class-plan-activity-student-tests.service";
import { ExportDiemthuongxuyenService } from "@shared/services/export-diemthuongxuyen.service";
import { ClassPlanActivityTuluanService } from "@shared/services/class-plan-activity-tuluan-service";
import { ClassPlanActivitiesService } from "@shared/services/class-plan-activities.service";
import { HelperService } from "@core/services/helper.service";
import { AuthService } from "@core/services/auth.service";
import { ConfigsService } from "@shared/services/configs.service";
import { ClassStudentDiemdanhService } from "@shared/services/class-student-diemdanh.service";
import { ROLES } from "@shared/utils/syscat";
import { ConditionOption } from "@shared/models/condition-option";
import { OvicQueryCondition } from "@core/models/dto";
import { firstValueFrom, forkJoin, Observable, of, switchMap } from "rxjs";
import { map } from "rxjs/operators";
import { ClassStudent } from "@shared/models/class-student";
import { ClassPlanActivitiesTests } from "@shared/models/class-plan-activities-tests";
import { ClassPlanActivityStudentTests } from "@shared/models/class-plan-activity-student-tests";
import { ClassPlanActivities } from "@shared/models/class-plan-activities";
import { ClassPlanActivityTuluan } from "@shared/models/class-plan-activity-tuluan";
import { ClassStudentDiemdanh } from "@shared/models/class-student-diemdanh";
import * as XLSX from "xlsx";
import { BUTTON_NO, BUTTON_YES } from "@core/models/buttons";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { FormsModule } from "@angular/forms";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { RippleModule } from "primeng/ripple";
import { SharedModule } from "primeng/api";
import { TableModule } from "primeng/table";
import { CalendarService } from "@shared/services/calendar.service";
import { ClassCalendar } from "@shared/models/class-calendar";
import { MatMenuModule } from "@angular/material/menu";
import { ClassPlansService } from "@shared/services/class-plans.service";
import { ClassPlans } from "@shared/models/class-plans";
import { CoursePlanBankService } from "@shared/services/course-plan-bank.service";
import { CoursePlanBank } from "@shared/models/course-plan-bank";
import { CoursePlanActivitiesService } from "@shared/services/course-plan-activities.service";
import { ClassManagementService } from '@modules/shared/services/class-management.service';
import { Body } from 'docx';


type AOA = any[][];

export interface PercentScore {
    cc: number;
    daugio: number;
    kynang: number;
}

interface FileImportCC {
    class_id: number;
    student_code: string;
    cc: number;
    nghi_20_pecent: string;
    hodem: string;
    ten: string;
}

const validatePoint: (point: number | undefined | null, _default: number) => number = (point: number, _default: number): number => (point !== undefined && point !== null ? point : _default);

@Component({
    selector: 'app-thong-ke-diemthuongxuyen-hvu',
    standalone: true,
    imports: [CommonModule, ButtonModule, DialogModule, FormsModule, MatProgressBarModule, RippleModule, SharedModule, TableModule, MatMenuModule],
    templateUrl: './thong-ke-diemthuongxuyen-hvu.component.html',
    styleUrls: ['./thong-ke-diemthuongxuyen-hvu.component.css']
})
export class ThongKeDiemthuongxuyenHvuComponent implements OnInit {

    @Input() set classSelected(clases: Classes) {
        this._clases = clases;
        this.arrSotinchi = this.cloneArrSoTinchi(parseInt(clases.sotinchi), this.keyServer);

        this.checkData(clases);
    };

    private _clases: Classes;

    typeView: 'viewDongbo' | 'data' | 'loading' = "loading";

    arrSotinchi: { value: number }[] = [];

    displayModal: boolean = false;
    waitting_title: string = 'Hệ thống đang xử lý vui lòng không tắt trình duyệt';
    progressValue: number = 0;
    // this.progressValue = key / request.length * 100;
    listData: RptClassStudentPoints[] = [];
    listDataClassStudent: any[] = [];

    //====================== import điểm cc
    import_cc_type: 'data' | 'await' = 'await';
    file_name: string = '';
    errorFileType: boolean = false;
    datafile: FileImportCC[] = [];

    isManager: boolean = false;
    isLanhDaoKhoa: boolean = false;

    textReport: string = '';
    configPercentOfLeave: number = 20;

    sobuoi_duocphepnghi: number = 0;

    percentScore: PercentScore;

    keyServer = key_server;

    constructor(
        private httphelper: HttpParamsHeplerService,
        private rptClassStudentPointsService: RptClassStudentPointsService,
        private notifi: NotificationService,
        private classStudentService: ClassStudentService,
        private txService: ClassPlanActivitiesTestsService,
        private ccService: ClassPlanActivityStudentTestsService,
        private exportExcel: ExportDiemthuongxuyenService,
        private classPlanActivityTuluanService: ClassPlanActivityTuluanService,
        private classPlanActivitiesService: ClassPlanActivitiesService,
        private helperService: HelperService,
        private auth: AuthService,
        private configsService: ConfigsService,
        private classStudentDiemdanhService: ClassStudentDiemdanhService,
        private calendarService: CalendarService,
        private classPlansService: ClassPlansService,
        private coursePlanActivitiesService: CoursePlanActivitiesService,
        private exportDiemthuongxuyenV2Service: ExportDiemthuongxuyenV2Service,
        private classManagementService: ClassManagementService,
        private userService: UserService,
        private hvuApiDanhsachdiemdanhService: HvuApiDanhsachdiemdanhService
    ) {

        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.chuyenvien_pdt) || this.auth.userHasRole(ROLES.troly_pdt) ? true : false;
        this.isLanhDaoKhoa = this.auth.userHasRole(ROLES.lanhdaokhoa);

    }

    ngOnInit(): void {
    }

    checkData(clases: Classes) {
        const conditionCc: ConditionOption = {
            condition: [
                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this._clases.id.toString() },
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1' },
            ],
            set: [
                { label: 'limit', value: '1' },
                // { label: 'select', value:  "id,class_id, class_plan_activity_id, student_id,point,created_at,updated_at"},
                { label: 'order', value: "DESC" },
                { label: 'orderby', value: "id" },
            ],
            page: '1'
        };

        conditionCc.condition.push({
            conditionName: 'type', condition: OvicQueryCondition.equal, value: 'KT_DAUGIO', orWhere: "and"
        })

        const conditionTxTracNghiem: ConditionOption = {
            condition: [
                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this._clases.id.toString() },
                {
                    conditionName: 'course_id',
                    condition: OvicQueryCondition.equal,
                    value: this._clases.course_id.toString()
                },
            ],
            set: [
                { label: 'limit', value: '1' },
                { label: 'select', value: "id, student_id,point,created_at,updated_at" },
                { label: 'order', value: "DESC" },
                { label: 'orderby', value: "created_at" },
            ],
            page: '1'
        };

        const conditionTxTuluan: ConditionOption = {
            condition: [
                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this._clases.id.toString() },
                {
                    conditionName: 'course_id',
                    condition: OvicQueryCondition.equal,
                    value: this._clases.course_id.toString()
                },

            ],
            set: [
                { label: 'limit', value: '1' },
                { label: 'select', value: "id, student_id,point,created_at,updated_at" },
                { label: 'order', value: "DESC" },
                { label: 'orderby', value: "updated_at" },
            ],
            page: '1'
        };

        const configCondition = {
            condition: [
                { conditionName: 'config_key', condition: OvicQueryCondition.equal, value: 'PERCENT_OF_LEAVE_ALLOWED' },
            ],
            set: [
                { label: 'limit', value: '1' },
                // { label: 'select', value: "id, class_plan_activity_id, student_id,point,lock" },
            ],
            page: '1'
        }
        const configPercentScoreCondition = {
            condition: [
                { conditionName: 'config_key', condition: OvicQueryCondition.equal, value: 'PERCENT_SCORE_SUMMARY' },
            ],
            set: [
                { label: 'limit', value: '1' },
                // { label: 'select', value: "id, class_plan_activity_id, student_id,point,lock" },
            ],
            page: '1'
        }

        // this.notifi.isProcessing(true);

        forkJoin([
            this.ccService.getClassPlanActivityStudentTestsByPageNew(conditionCc).pipe(map(m => m.data[0])),
            this.txService.getClassPlanActivitiesTestsByPageNew(conditionTxTracNghiem).pipe(map(m => m.data[0])),
            this.classPlanActivityTuluanService.getClassPlanActivityTuluanByPageNew(conditionTxTuluan).pipe(map(m => m.data[0])),
            this.rptClassStudentPointsService.getItemMaxUpdateAtByClassId(clases.id),
            this.configsService.getConfigsByPageNew(configCondition).pipe(map(m => m.data[0])),
            this.configsService.getConfigsByPageNew(configPercentScoreCondition).pipe(map(m => m.data[0])),



        ]).subscribe({
            next: ([cc, txTn, txTl, rptMax, config, configPercentScore]) => {

                // this.notifi.isProcessing(false);
                this.configPercentOfLeave = config ? config.value : 20;
                this.percentScore = configPercentScore['params'] as PercentScore;
                this.sobuoi_duocphepnghi = Math.round(this.configPercentOfLeave * (parseInt(this._clases.sotinchi) * 3) / 100);
                const timeCC = cc ? this.helperService.formatSQLDateTime(new Date(cc['created_at'])) : null;
                const timetxTl = txTl ? this.helperService.formatSQLDateTime(new Date(txTl['updated_at'])) : null;
                const timetxTn = txTn ? this.helperService.formatSQLDateTime(new Date(txTn['created_at'])) : null;
                const timeRpt = rptMax ? this.helperService.formatSQLDateTime(new Date(rptMax['updated_at'])) : null;
                this.textReport = '';
                if (timeRpt) {
                    if (timeCC > timeRpt || timetxTn > timeRpt || timetxTl > timeRpt) {
                        if (this.isLanhDaoKhoa || this.isManager) {
                            this.textReport = 'Ghi chú: Dữ liệu điểm đã có thay đổi nhưng chưa được giảng viên đồng bộ. ';
                        }

                        if (this.auth.user.id === parseInt(clases['manager_id'])) {
                            this.createAndAddRpt();
                        } else {
                            this.getDataDongbo();
                        }
                    } else {

                        this.getDataDongbo();
                    }
                } else {
                    // this.getDataDongbo()
                    this.typeView = "viewDongbo";
                }


            }, error: () => {
                this.notifi.isProcessing(false);
                this.notifi.toastError('Load dữ liệu không thành công ');
            }
        })

    }

    getDataDongbo() {

        this.notifi.isProcessing(true)

        this.rptClassStudentPointsService.getDataByClassid(this._clases.id).subscribe({
            next: (data) => {

                this.typeView = 'data';
                this.listData = data.map(m => {
                    m['_diemCC'] = m.cc !== -1 ? this.replaceScore(m.cc) : null;

                    m['__cam'] = m['check_ban'] == 'CAM' || m['nghi_20_pecent'];
                    return m;
                }).sort((a, b) => a.hodem.localeCompare(b.hodem)).sort((a, b) => a.ten.localeCompare(b.ten));

                this.notifi.isProcessing(false);

            }, error: () => {
                this.notifi.isProcessing(false);

                this.notifi.toastError('load dữ liệu không thành công');
            }
        })
    }

    btnclickCreated() {
        this.createAndAddRpt();

    }

    async createAndAddRpt(load_diem_danh: boolean = false) {
        this.textReport = '';
        this.displayModal = true;


        let _hvu_diemdanh = [];

        if (load_diem_danh) {
            const arrayKyhieu = this._clases.kyhieu.split("-");

            const namhoc_first = this._clases.namhoc.replace(/\D/gi, ",").split(",");

            const _body = {
                ma_mon_hoc: this._clases.course_detail.maso,
                nhom_to: arrayKyhieu[2],
                nhhk: namhoc_first[0].toString().concat(this._clases.hocky.toString())
            }

            const _res_hvu_diemdanh = await firstValueFrom(this.hvuApiDanhsachdiemdanhService.getHvuApiDanhsachdiemdanhBybody(_body));

            if (_res_hvu_diemdanh && _res_hvu_diemdanh['ds_ket_qua_diem_danh']) {
                _hvu_diemdanh = _res_hvu_diemdanh['ds_ket_qua_diem_danh'];

            } else {
                this.displayModal = false;
                return this.notifi.toastError("Không tìm được lớp học có mã là " + this._clases.course_detail.maso + " trên hệ thống AQSOFT")
            }
        }

        // console.log(_hvu_diemdanh.filter(m => m.ma_sinh_vien.toLowerCase() === '245d420021'))
        // return;

        const condition = this.httphelper.paramsConditionBuilder(
            [
                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this._clases.id.toString() },
            ]).set('limit', -1).set("select", "id, class_id, student_id,ordering").set('with', 'profile').set("order", "ASC").set("orderby", "ordering");
        this.classStudentService.getClassStudentByCols(condition).pipe(switchMap(m => {
            this.progressValue = 1 / 3 * 100;

            const student_ids = m.map(m => m.student_id);
            return forkJoin<[ClassStudent[], ClassPlanActivitiesTests[]]>([
                of(m), this.txService.getDataByClassIdAndStudentIds(this._clases.id, student_ids, 'id,student_id,point,course_id,class_plan_activities_id,lock,class_id,created_at,violation_of_exam,tong_diem')
            ]);
        }), switchMap(a => {
            this.progressValue = 2 / 3 * 100;

            const student_ids = a[0].map(m => m.student_id);

            const conditionClassPlanActivity: ConditionOption = {
                condition: [
                    { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this._clases.id.toString() },
                ],
                set: [
                    { label: 'limit', value: '-1' },
                    { label: 'select', value: "id, type, ordering,class_id " },
                    { label: 'order', value: "ASC" },
                    { label: 'orderby', value: "ordering" },
                ],
                page: '1'
            };

            const conditionClassPlan: ConditionOption = {
                condition: [
                    { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this._clases.id.toString(), orWhere: "and" },
                    { conditionName: 'week', condition: OvicQueryCondition.lessThan, value: "100", orWhere: "and" },
                    { conditionName: 'week', condition: OvicQueryCondition.greaterThan, value: "0", orWhere: "and" },
                ],
                set: [
                    { label: 'limit', value: '-1' },
                    { label: 'select', value: "week" },
                    { label: 'groupby', value: 'week' }
                ],
                page: null
            };

            const conditionClassPlanActivityTuLuan: ConditionOption = {
                condition: [
                    { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this._clases.id.toString() },
                ],
                set: [
                    { label: 'limit', value: '-1' },
                    { label: 'select', value: "id, class_plan_activity_id, student_id,point,lock" },
                ],
                page: '1'
            };

            const configCondition = {
                condition: [
                    { conditionName: 'config_key', condition: OvicQueryCondition.equal, value: 'GET_VIOLATION_OF_EXAM' },
                ],
                set: [
                    { label: 'limit', value: '-1' },
                    // { label: 'select', value: "id, class_plan_activity_id, student_id,point,lock" },
                ],
                page: '1'
            }
            const conditionClassDiemdanh: ConditionOption = {
                condition: [
                    { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this._clases.id.toString() },
                ],
                set: [
                    { label: 'limit', value: '-1' },
                ],
                page: '1'
            };
            const conditionClassCalendar: ConditionOption = {
                condition: [
                    { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this._clases.id.toString() },
                ],
                set: [
                    { label: 'limit', value: '-1' },
                ],
                page: '1'
            };
            const conditionCC: ConditionOption = {
                condition: [
                    { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this._clases.id.toString(), orWhere: 'and' },
                    { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this._clases.course_id.toString(), orWhere: 'and' },
                    {
                        conditionName: 'type',
                        condition: OvicQueryCondition.notEqual,
                        value: 'KT_TUAN,KT_DAUGIO',
                        orWhere: "in"
                    },
                ],
                set: [
                    { label: 'limit', value: '-1' },
                    // { label: 'select', value: "id, class_plan_activity_id, student_id,point,lock" },
                ],
                page: '1'
            };

            const conditionCoursePlanActivity: ConditionOption = {
                condition: [
                    // {conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this._clases.id.toString()},
                    {
                        conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this._clases.course_id.toString(), orWhere: "and"
                    },
                    {
                        conditionName: 'type', condition: OvicQueryCondition.equal, value: 'PLAN', orWhere: "and"
                    },
                    {
                        conditionName: 'week', condition: OvicQueryCondition.greaterThan, value: '0', orWhere: "and"
                    },
                    {
                        conditionName: 'week', condition: OvicQueryCondition.lessThan, value: '100', orWhere: "and"
                    },

                ],
                set: [
                    { label: 'limit', value: '-1' },
                    { label: 'select', value: "id, week" },
                ],
                page: '1'
            };

            return forkJoin<[ClassStudent[], ClassPlanActivitiesTests[], ClassPlanActivityStudentTests[], ClassPlanActivities[], ClassPlanActivityTuluan[], ClassPlanActivityStudentTests[], ClassStudentDiemdanh[], ClassCalendar[], any[], ClassPlans[]]>(
                [
                    of(a[0]),
                    of(a[1]),
                    this.ccService.getDataByClassIdAndStudentIds(this._clases.id, student_ids, 'id,class_id,student_id,passing_point,point,course_id,created_at,class_plan_activity_id,week,type,tong_diem', 'KT_DAUGIO'),
                    this.classPlanActivitiesService.getClassPlanActivitiesByPageNew(conditionClassPlanActivity).pipe(map(m => m.data)),
                    this.classPlanActivityTuluanService.getClassPlanActivityTuluanByPageNew(conditionClassPlanActivityTuLuan).pipe(map(m => m.data)),
                    // this.ccService.getDataByClassIdAndStudentIdsNotType(this._clases.id, student_ids, 'id,class_id,student_id,passing_point,point,course_id,created_at,class_plan_activity_id,week,type,tong_diem', 'KT_DAUGIO'),
                    this.ccService.getClassPlanActivityStudentTestsByPageNew(conditionCC).pipe(map(a => a.data)),
                    this.classStudentDiemdanhService.getClassStudentDiemdanhByPageNew(conditionClassDiemdanh).pipe(map(m => m.data)),
                    this.calendarService.getCalendarByPageNew(conditionClassCalendar).pipe(map(a => a.data)),
                    this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(conditionCoursePlanActivity).pipe(map(a => a.data)),
                    this.classPlansService.getClassPlansByPageNew(conditionClassPlan).pipe(map(a => a.data)),
                ])
        })).subscribe({
            next: ([students, studentTxTn, studentCC, classPlanactivity, classPlanActivityTuLuan, studentCCNotDaugio, classStudentDiemdanh, classCalendar, classPlanActivitis, _classPlan]) => {
                const week_active = _classPlan.length;

                this.progressValue = 100;

                const classPlansTotal: number = classPlanActivitis.length;

                const studentTxParamV2 = classPlanactivity.filter(f => f.type === 'THUONGXUYEN_TRACNGHIEM' || f.type === 'THUONGXUYEN_TULUAN').map(m => {
                    if (m.type === 'THUONGXUYEN_TULUAN') {
                        m['txParam'] = classPlanActivityTuLuan.filter(f => f.class_plan_activity_id === m.id);
                    } else {
                        m['txParam'] = studentTxTn.filter(f => f.class_plan_activities_id === m.id);
                    }

                    return m;
                })

                const studentTxParam = studentTxTn.map(m => {
                    m['_created_at'] = new Date(m['created_at']).getTime();
                    return m;
                })
                const studentCcParam = studentCC.sort((a, b) => a.id - b.id);
                if (studentTxParam && studentCcParam) {
                    this.listDataClassStudent = students.map(m => {
                        const info = m['profile'];
                        const mapData = {};
                        mapData['student_id'] = m.student_id;
                        mapData['hodem'] = info ? info['full_name'] : ' ';
                        mapData['student_code'] = info ? info['student_code'] : ' ';
                        mapData['ten'] = info ? info['name'] : ' ';
                        mapData['ordering'] = m['ordering'];

                        if (load_diem_danh) {
                            const student_hvu = _hvu_diemdanh.filter(i => i.ma_sinh_vien.toLowerCase() === mapData['student_code'].toLowerCase());

                            const index_hvu = _hvu_diemdanh.findIndex(i => i.ma_sinh_vien.toLowerCase() === mapData['student_code'].toLowerCase() && i.cam_thi);

                            mapData['so_tietnghi'] = 0;

                            student_hvu.forEach(h => {
                                mapData['so_tietnghi'] = mapData['so_tietnghi'] + (h.vang_khong_phep + h.vang_co_phep) * h.so_tiet;
                            })

                            mapData['nghi_20_pecent'] = index_hvu !== -1 && _hvu_diemdanh[index_hvu] && _hvu_diemdanh[index_hvu].cam_thi === 1 ? 'CẤM THI' : '';
                        }


                        // mapData['so_buoinghi'] = classStudentDiemdanh.length > 0 ? classStudentDiemdanh.filter(f => f.student_id === m.student_id && f.loaiphep !== 'M').length : 0;

                        // mapData['so_buoinghi'] = index_hvu !== -1 ? _hvu_diemdanh[index_hvu].vang_khong_phep : 0

                        const weeks = parseInt(this._clases.sotinchi) * 3;

                        mapData['bttn_tp'] = {};

                        mapData['bttn_max_tp'] = {};

                        let checkban = [];
                        let bttn_tp_total = 0;
                        _classPlan.forEach((i, index) => {
                            const index_diem_daugio = studentCC.findIndex(c => c.week === i.week && c.student_id === m.student_id);

                            mapData['bttn_tp']['week_' + (index + 1)] = index_diem_daugio !== -1 ? Number(studentCC[index_diem_daugio]['tong_diem']) : 0;

                            bttn_tp_total = bttn_tp_total + mapData['bttn_tp']['week_' + (index + 1)];

                            const diem_cc: number[] = Array.from(studentCCNotDaugio).filter(c => c.student_id === m.student_id && c.week === i.week).map(m => Number(m['tong_diem']));

                            if (diem_cc.length) {
                                mapData['bttn_max_tp']['week_' + (index + 1)] = diem_cc.length ? Math.max(...diem_cc) / 10 : -1;
                            } else {
                                checkban.push(1);
                            }
                            // console.log(Array.from(studentCCNotDaugio).filter(c => c.student_id === m.student_id && c.week === i && (parseInt(String(c['tong_diem'])) >= c.passing_point ) );

                            if (Array.from(studentCCNotDaugio).filter(c => c.student_id === m.student_id && c.week === i.week && Number(c['tong_diem']) >= Number(c['passing_point'])).length <= 0) {
                                checkban.push(2);
                            }
                        })

                        mapData['bttn'] = this.replaceNumberThapPhan((bttn_tp_total / ((classPlansTotal < week_active ? classPlansTotal : week_active) * 10)));

                        mapData['check_ban'] = checkban.length === 0 ? '' : 'CAM';

                        studentTxParamV2.forEach((b, index) => {
                            const tx = b['txParam'].length > 0 && b['txParam'].find(c => c.student_id === m.student_id) ? b['txParam'].find(c => c.student_id === m.student_id) : null;
                            if (b.type === 'THUONGXUYEN_TRACNGHIEM') {
                                if (tx && tx.lock === 1) {
                                    mapData['tx' + (index + 1)] = 0;
                                } else if (tx && tx.lock === 0) {
                                    mapData['tx' + (index + 1)] = Number(tx['tong_diem']) > 0 ? Number(tx['tong_diem']) : 0;
                                } else {
                                    mapData['tx' + (index + 1)] = -1;
                                }

                            }
                            if (b.type === 'THUONGXUYEN_TULUAN') {
                                mapData['tx' + (index + 1)] = tx ? validatePoint(tx.point, 0) : -1;
                            }
                            // mapData['tx' + (index + 1)] = tx ? (tx.point  ? tx.point : -1) : -1;

                        })

                        mapData['check_ban'] = checkban.length === 0 ? '' : 'CAM';

                        mapData['tyle'] = this.percentScore;

                        // return m ;


                        return { ...mapData, course_id: this._clases.course_id, class_id: this._clases.id };
                    })

                    this.createRowRptPoints(this.listDataClassStudent, this.listData).subscribe({
                        next: (data) => {
                            this.typeView = "data";
                            this.displayModal = false;
                            this.getDataDongbo();
                        },
                        error: () => {
                            this.notifi.toastError('Thao tác không thành công ');
                            this.displayModal = false;
                            this.typeView = "viewDongbo";
                        }
                    })
                }
            }, error: (e) => {
                console.log(e);
                this.displayModal = false;
                this.notifi.toastError('Load dữ liệu không thành công');
            }
        })
            ;
    }


    createRowRptPoints(classes: ClassStudent[], listRpt: RptClassStudentPoints[]): Observable<RptClassStudentPoints[]> {
        const index = classes.findIndex(f => !f['_created']);
        const numOfCreate = classes.filter(f => f['_created']).length;
        if (index !== -1) {
            const itemUpdate = classes[index];

            const rptSelect = listRpt && listRpt.length > 0 ? listRpt.find(f => f.student_id === classes[index].student_id) : null;
            // itemUpdate['cc'] = -1;
            if (rptSelect) {
                itemUpdate['cc'] = rptSelect && rptSelect['_diemCC'] !== null ? (rptSelect['_diemCC'] > 0 ? rptSelect['_diemCC'].toString().replace(',', '.') : 0) : -1;
            }
            if (itemUpdate['tx1'] && itemUpdate['tx1'] === null) {
                delete itemUpdate['tx1'];
            }
            if (itemUpdate['tx2'] && itemUpdate['tx2'] === null) {
                delete itemUpdate['tx2'];
            }
            if (itemUpdate['tx3'] && itemUpdate['tx3'] === null) {
                delete itemUpdate['tx3'];
            }
            if (itemUpdate['tx4'] && itemUpdate['tx4'] === null) {
                delete itemUpdate['tx4'];
            }

            return !itemUpdate['cc'] || itemUpdate['cc'] >= -1 && itemUpdate['cc'] <= 10 ? this.rptClassStudentPointsService.add(itemUpdate).pipe(switchMap(m => {
                this.progressValue = (numOfCreate + 1) / (classes.length) * 100;
                classes[index]['_created'] = true;
                return this.createRowRptPoints(classes, listRpt);
            })) : this.rptClassStudentPointsService.getDataByClassid(this._clases.id).pipe(switchMap(m => {
                this.notifi.toastError('Điểm nhập vào không phải cơ số 10,vui lòng kiểm tra lại');
                return of(m);
            }))
        } else {
            return this.rptClassStudentPointsService.getDataByClassid(this._clases.id)
        }

    }

    cloneArrSoTinchi(num: number, key: string): { value: number }[] {
        if (key == 'hvu') {
            const numOfTx = num == 2 ? 1 : ([3, 4].includes(num) ? 2 : num);

            const arr: { value: number }[] = [];
            for (let i = 1; i <= numOfTx; i++) {
                arr.push({ value: i })
            }
            return arr;
        } else {
            const arr: { value: number }[] = [];
            for (let i = 1; i <= num; i++) {
                arr.push({ value: i })
            }
            return arr;
        }

    }


    async btnExportExcel() {


        const conditionCoursePlanActivity: ConditionOption = {
            condition: [
                // {conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this._clases.id.toString()},
                {
                    conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this._clases.course_id.toString(), orWhere: "and"
                },
                {
                    conditionName: 'type', condition: OvicQueryCondition.equal, value: 'PLAN', orWhere: "and"
                },
                {
                    conditionName: 'week', condition: OvicQueryCondition.greaterThan, value: '0', orWhere: "and"
                },
                {
                    conditionName: 'week', condition: OvicQueryCondition.lessThan, value: '100', orWhere: "and"
                },

            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: "id, week" },
            ],
            page: '1'
        };

        this.notifi.isProcessing(true);

        // this.classPlansService.getClassPlansByPageNew(conditionClassPlanActivitis).pipe(map(a => a.data)).subscribe({
        this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(conditionCoursePlanActivity).pipe(map(a => a.data)).subscribe({
            next: async (data) => {


                const weekUse = data.length < parseInt(this._clases.sotinchi) * 3 ? data.length : parseInt(this._clases.sotinchi) * 3;
                const numOfTinchiByUse = parseInt(this._clases.sotinchi) * 3;

                const datatx = Array.from(this.listData).map((m, index) => {
                    const info = m['profile'];
                    const itemAdd = {};
                    itemAdd['index_table'] = index + 1;
                    itemAdd['student_code'] = info ? info['student_code'] : '';
                    const fullName = info ? info['full_name'] : '';
                    const parts = fullName.trim().split(/\s+/);

                    itemAdd['firstName'] = fullName ? parts.slice(0, -1).join(" ") : '';
                    itemAdd['lastName'] = fullName ? parts[parts.length - 1] : '';

                    itemAdd['ngaysinh'] = info ? info['birthday'] : ' ';
                    itemAdd['tenlop'] = ' ';
                    itemAdd['diemcc'] = m.cc >= 0 ? this.replaceScore(m.cc) : ' ';
                    itemAdd['dienbttn'] = this.replaceScore(m.bttn.toFixed(1));

                    let txTotal = 0;
                    let haveTx = 0;
                    const arrBan = [];

                    let number_ban_tx = 0;
                    let text_note_lack = 'Thiếu bài TX '
                    this.arrSotinchi.forEach(a => {
                        // itemAdd['tx'+ a.value] = m['tx'+a.value]>0 ? m['tx'+a.value] : ' ';
                        itemAdd['tx' + a.value] = m['tx' + a.value] >= 0 ? this.replaceScore(m['tx' + a.value]) : ' ';
                        haveTx = haveTx + 1;
                        txTotal = txTotal + (m['tx' + a.value] > 0 ? m['tx' + a.value] : 0);
                    })
                    itemAdd['tx1'] = m['tx1'] >= 0 ? this.replaceScore(m['tx1']) : ' ';
                    itemAdd['tx2'] = m['tx2'] >= 0 ? this.replaceScore(m['tx2']) : ' ';
                    itemAdd['tx3'] = m['tx3'] >= 0 ? this.replaceScore(m['tx3']) : ' ';

                    const totalConvert = parseFloat(this.replaceNumberThapPhan(txTotal / (haveTx !== 0 ? haveTx : 1)));
                    const sobuoinghi = Math.round(this.configPercentOfLeave * (parseInt(this._clases.sotinchi) * 3) / 100)
                    // itemAdd['cc'] = m.nghi_20_pecent || m.check_ban === 'CAM' ? 'CAM' : this.replaceScore(this.replaceNumberThapPhan(((m.cc > 0 ? m.cc : 0) * (this.percentScore.cc/100) + m.bttn *(this.percentScore.daugio)  + (totalConvert) * (this.percentScore.kynang)) * 2));
                    itemAdd['cc'] = this.replaceNumberThapPhan((((m.cc > 0 ? m.cc : 0) * (this.percentScore.cc / 100) + (m.bttn * (this.percentScore.daugio / 100)) + (totalConvert * (this.percentScore.kynang / 100))) * 2));

                    if (m.check_ban === 'CAM') {
                        arrBan.push('Không qua bài điều kiện');
                    }

                    // if (m.so_buoinghi > sobuoinghi) {
                    //     if(m.accept_duthi == 1) {
                    //
                    //     }else{
                    //         arrBan.push('Nghỉ quá số buổi QĐ');
                    //
                    //     }
                    //
                    // }
                    if (m.nghi_20_pecent) {
                        arrBan.push('Nghỉ quá số buổi QĐ');
                    }
                    itemAdd['so_buoinghi'] = m.so_buoinghi;
                    // itemAdd['ghichu'] = arrBan.length > 0 ? arrBan.join('; ') : ' ';
                    itemAdd['ghichu'] = ' ';
                    return Object.values(itemAdd);
                })

                const datatxtp = Array.from(this.listData).map((m, index) => {
                    const info = m['profile'];
                    const itemAdd = {};
                    itemAdd['index_table'] = index + 1;
                    itemAdd['student_code'] = info ? info['student_code'] : '';
                    itemAdd['fullName'] = info ? info['full_name'] : '';
                    itemAdd['ngaysinh'] = info ? info['birthday'] : '';
                    itemAdd['diemcc'] = m.cc >= 0 ? m.cc : ' ';
                    const tp = m.bttn_tp;
                    const max_tp = m['bttn_max_tp'];
                    itemAdd['dienbttn'] = m.bttn.toFixed(1);


                    for (let i = 1; i <= numOfTinchiByUse; i++) {
                        if (i <= weekUse) {
                            itemAdd['week' + i] = (tp['week_' + i] && tp['week_' + i] >= 0 ? Number(tp['week_' + i]) / 10 : '-') + ' | ' + (max_tp['week_' + i] && max_tp['week_' + i] >= 0 ? max_tp['week_' + i] : '-');
                        } else {
                            itemAdd['week' + i] = '';
                        }
                    }
                    let txTotal = 0;
                    let haveTx = 0;
                    this.arrSotinchi.forEach(a => {
                        itemAdd['tx' + a.value] = m['tx' + a.value] >= 0 ? this.replaceScore(m['tx' + a.value]) : ' ';
                        haveTx = haveTx + 1;
                        txTotal = txTotal + (m['tx' + a.value] > 0 ? m['tx' + a.value] : 0);
                    })
                    // const totalConvert = parseFloat((txTotal / (haveTx !== 0 ? haveTx : 1)).toFixed(1))
                    const totalConvert = parseFloat(this.replaceNumberThapPhan(txTotal / (haveTx !== 0 ? haveTx : 1)));

                    // const totalConvert = (txTotal / (haveTx !== 0 ? haveTx : 1));
                    // itemAdd['cc'] = (((m.cc > 0 ? m.cc : 0) * 0.05 + m.bttn * 0.15 + (totalConvert) * 0.3) * 2).toFixed(1);
                    itemAdd['cc'] = this.replaceNumberThapPhan((((m.cc > 0 ? m.cc : 0) * (this.percentScore.cc / 100) + (m.bttn * (this.percentScore.daugio / 100)) + (totalConvert * (this.percentScore.kynang / 100))) * 2));

                    const arrBan = [];
                    if (m.check_ban === 'CAM') {
                        const arrWeekBan = []
                        for (let i = 1; i <= weekUse; i++) {
                            const value = parseInt(max_tp['week_' + i]);
                            if (isNaN(value) || max_tp['week_' + i] < 8) {
                                arrWeekBan.push(i)
                            }

                        }
                        arrBan.push('Không qua bài điều kiện: ' + arrWeekBan.join(', '));
                    }


                    if (m.nghi_20_pecent) {
                        arrBan.push('Nghỉ quá số buổi QĐ');
                    }
                    itemAdd['so_buoinghi'] = m.so_buoinghi;

                    itemAdd['ghichu'] = arrBan.length ? 'CAM' : '';
                    itemAdd['ghichu2'] = arrBan.length > 0 ? arrBan.join('; ') : '';


                    return Object.values(itemAdd);
                })

                if (datatx && datatxtp) {
                    const numOfBan = this.listData.filter(f => !f['__cam']).length;
                    const listCodeStudentBan = this.listData.filter(f => f['__cam']).map(m => m.student_code).join(', ');

                    await this.exportExcel.exportThuongxuyenByHvu(datatx, datatxtp, this._clases, this._clases.name, weekUse, this.percentScore, numOfBan, listCodeStudentBan);
                }

                this.notifi.isProcessing(false);


            }, error: () => {
                this.notifi.toastError('Load dữ liệu không thành công');
            }
        })



    }

    saveData() {
        this.createAndAddRpt();
    }

    //=========================import điểm chuyên cần====================

    displayImportData: boolean = false;

    btnImportDiemCC() {
        this.displayImportData = true;
        // this.inputFile();
    }

    onDroppedFiles(fileList: FileList) {

        const file: File = fileList.item(0);
        this.file_name = file.name;
        this.errorFileType = !(file && this.validateExcelFile(file));
        if (!this.errorFileType) {
            // this.loading = true;
            const reader: FileReader = new FileReader();
            reader.onload = (e: any) => {
                /* read workbook */
                const wb: XLSX.WorkBook = XLSX.read(e.target.result, { type: 'binary' });

                /* grab first sheet */
                const firstSheetName: string = wb.SheetNames[0];
                const ws: XLSX.WorkSheet = wb.Sheets[firstSheetName];


                /* save data */
                const rawData: AOA = <AOA>(XLSX.utils.sheet_to_json(ws, { header: 1 }));
                const filterData = rawData.filter(u => !!(Array.isArray(u) && u.length));
                if (filterData.length) {
                    // filterData.shift();
                    filterData.shift();
                    this.datafile = this.covertDataExport(filterData);
                    this.import_cc_type = this.datafile.length > 0 ? "data" : 'await';

                }

            };
            reader.readAsBinaryString(file);
        } else {
            this.errorFileType = true;
            // this.loading = false;
        }
    }

    inputFile() {
        const inputFile: HTMLInputElement = Object.assign(document.createElement('input'), {
            type: 'file',
            accept: '.xlsx',
            multiple: false,
            onchange: () => {
                this.onDroppedFiles(inputFile.files);

                setTimeout(() => inputFile.remove(), 1000)
            }
        });
        inputFile.click();
    }

    validateExcelFile(file: File): boolean {
        return file.name ? file.name.split('.').pop().toLowerCase() === 'xlsx' : false;
    }

    covertDataExport(datafile) {
        const data: FileImportCC[] = [];

        datafile.forEach(row => {
            if (!isNaN(parseInt(String(row[0])))) {
                const cell: FileImportCC = {
                    class_id: this._clases.id,
                    student_code: row[1] ? row[1].toLowerCase().trim() : '',
                    hodem: row[2] + ' ' + row[3],
                    ten: row[3],
                    cc: row[6],
                    nghi_20_pecent: row[6] === -1 || row[7] ? 'CẤM THI' : ''
                }
                data.push(cell)
            }
        })
        return data;
    }

    removeItemDataInport(item) {
        this.datafile = this.datafile.filter(f => f.student_code !== item.student_code);
    }

    btnEndImport() {
        this.import_cc_type = "await";
        this.file_name = '';
        this.datafile = [];
        this.displayImportData = false;
    }

    btnClickSaveInport() {
        if (this.datafile.length > 0) {
            this.notifi.isProcessing(true);
            this.rptClassStudentPointsService.getStudentCodeByClass_id(this._clases.id).subscribe({
                next: (data) => {
                    const studentData = data.map(m => m.student_code);
                    const dataParram = this.datafile.filter(f => studentData.includes(f.student_code)).length > 0 ?
                        this.datafile.filter(f => studentData.includes(f.student_code)).map(m => {
                            const student_id = data.find(f => f.student_code === m.student_code) ? data.find(f => f.student_code === m.student_code).student_id : null;
                            return {
                                student_code: m.student_code,
                                cc: m.cc,
                                nghi_20_pecent: m.nghi_20_pecent,
                                student_id: student_id,
                                class_id: m.class_id
                            };
                        })
                        : [];
                    this.notifi.isProcessing(false);

                    if (dataParram.length > 0) {
                        this.displayModal = true;
                        this.progressValue = 0;
                        this.createRowRptPointsByImPort(dataParram).subscribe({
                            next: (data) => {
                                this.getDataDongbo()
                                this.file_name = '';
                                this.datafile = [];
                                this.import_cc_type = "await";
                                this.displayImportData = false;
                                this.notifi.toastSuccess('Import dữ liệu không thành công');
                                this.displayModal = false;

                            }, error: () => {
                                this.displayModal = false;
                                this.notifi.toastError('Import dữ liệu không thành công');
                            }
                        })

                    } else {
                        this.notifi.toastError('Danh sách sinh viên được Import vào có mã sinh viên không thuộc lớp, vui lòng kiểm tra lại. ');
                    }

                },
                error: (e) => {
                    this.notifi.isProcessing(false);
                    this.notifi.toastError('Load dữ liệu không thành công ');
                    this.notifi.isProcessing(false);

                }
            });
        } else {
            this.notifi.toastWarning('Chưa có dữ liệu Import.');
        }
    }

    createRowRptPointsByImPort(classes: any[]): Observable<RptClassStudentPoints[]> {
        const index = classes.findIndex(f => !f['_created']);
        const numOfCreate = classes.filter(f => f['_created']).length;
        if (index !== -1) {
            const itemUpdate = classes[index];

            return this.rptClassStudentPointsService.add(itemUpdate).pipe(switchMap(m => {
                this.progressValue = (numOfCreate + 1) / (classes.length) * 100;
                classes[index]['_created'] = true;
                return this.createRowRptPointsByImPort(classes);
            }))
        } else {
            return this.rptClassStudentPointsService.getDataByClassid(this._clases.id)
        }

    }

    btnActiveDuthi(item: RptClassStudentPoints) {
        let noiti = `Bạn có chắc cho phép thi sinh dự thi khi nghỉ quá số buổi ?`;

        if (item['accept_duthi'] == 1) {
            noiti = "Bạn có chắc chắn cấm thi sinh viên này không?";
        }

        if (item.so_buoinghi > this.sobuoi_duocphepnghi) {
            this.notifi.confirm(noiti, "Xác nhận hành động", [BUTTON_YES, BUTTON_NO]).then(a => {
                if (a.name === 'yes') {
                    this.notifi.isProcessing(true);
                    this.rptClassStudentPointsService.update(item.id, { accept_duthi: item.accept_duthi == 1 ? 0 : 1 }).subscribe({
                        next: () => {
                            if (item.accept_duthi == 1) {
                                this.listData.find(f => f.id === item.id).accept_duthi = 0;
                            } else {
                                this.listData.find(f => f.id === item.id).accept_duthi = 1;
                            }

                            this.getDataDongbo()
                            this.notifi.isProcessing(false);
                        }, error: () => {
                            this.notifi.isProcessing(false);

                        }
                    })
                }
            })
        } else {
            this.notifi.toastWarning('Sinh viên chưa nghỉ quá số buổi quy định! ');
        }
    }

    deleteItem(item: RptClassStudentPoints) {

        this.notifi.confirmDelete().then(
            (a) => {
                if (a) {
                    this.rptClassStudentPointsService.delelte(item.id).subscribe({
                        next: () => {
                            this.notifi.toastSuccess('Xoá thành công');
                            this.getDataDongbo();
                        },
                        error: () =>
                            this.notifi.toastError('Xóa thất bại'),
                    });
                }
            },
            () => null
        );
    }

    replaceNumberThapPhan(a: number) {
        return (Math.round(a * 10) / 10).toFixed(1);
    }

    replaceScore(text: number | string): string {
        if (typeof text === 'number') {
            return text.toString(); // Nếu là số, giữ nguyên
        }
        return text.replace(/,/g, '.'); // Thay thế tất cả dấu ',' thành '.'
    }

    pointQuestionKeyDown(event, inputPoint_quest) {

        if (event) {
            if (/[0-9]/.test(event.key) || event.key === '.' || event.key === 'Backspace') {
                // Không cho nhập thêm '.' nếu đã có
                if (inputPoint_quest.value.includes('.') && event.key === '.') {
                    event.preventDefault();
                }

                // Đợi một chút rồi check giá trị
                setTimeout(() => {
                    const val = parseFloat(inputPoint_quest.value);
                    if (!isNaN(val) && (val < 0 || val > 10)) {
                        inputPoint_quest.value = '';
                    }
                });
            } else {
                event.preventDefault();
            }
        }
    }

    btnActive20pecent(item: RptClassStudentPoints) {
        let noiti = "Bạn có chắc chắn muốn bỏ cấm thi sinh viên này không ?";
        if (!item.nghi_20_pecent) {
            noiti = "Bạn có chắc chắn cấm thi sinh viên này không?";
        }
        this.notifi.confirm(noiti, "Xác nhận hành động", [BUTTON_YES, BUTTON_NO]).then(a => {
            if (a.name === 'yes') {
                this.notifi.isProcessing(true);
                this.rptClassStudentPointsService.update(item.id, { nghi_20_pecent: item.nghi_20_pecent ? '' : 'CẤM THI' }).subscribe({
                    next: () => {
                        if (item.nghi_20_pecent) {
                            this.listData.find(f => f.id === item.id).nghi_20_pecent = '';
                        } else {
                            this.listData.find(f => f.id === item.id).nghi_20_pecent = 'CẤM THI';
                        }
                        this.notifi.isProcessing(false);
                    }, error: () => {
                        this.notifi.isProcessing(false);

                    }
                })
            }
        })

    }

    async btnExportMauHVU() {
        const weekUse = parseInt(this._clases.sotinchi) * 3;


        const datatx = Array.from(this.listData).map((m, index) => {
            const info = m['profile'];
            const itemAdd = {};
            itemAdd['index_table'] = index + 1;
            itemAdd['student_code'] = info ? info['student_code'] : '';
            const fullName = info ? info['full_name'] : '';
            const parts = fullName.trim().split(/\s+/);

            itemAdd['firstName'] = fullName ? parts.slice(0, -1).join(" ") : '';
            itemAdd['lastName'] = fullName ? parts[parts.length - 1] : '';

            itemAdd['ngaysinh'] = info ? info['birthday'] : ' ';
            itemAdd['tenlop'] = ' ';
            itemAdd['diemcc'] = m.cc >= 0 ? this.replaceScore(m.cc) : ' ';
            itemAdd['dienbttn'] = this.replaceScore(m.bttn.toFixed(1));

            let txTotal = 0;
            let haveTx = 0;
            const arrBan = [];

            let number_ban_tx = 0;
            let text_note_lack = 'Thiếu bài TX '
            this.arrSotinchi.forEach(a => {
                // itemAdd['tx'+ a.value] = m['tx'+a.value]>0 ? m['tx'+a.value] : ' ';
                itemAdd['tx' + a.value] = m['tx' + a.value] >= 0 ? this.replaceScore(m['tx' + a.value]) : ' ';
                haveTx = haveTx + 1;
                txTotal = txTotal + (m['tx' + a.value] > 0 ? m['tx' + a.value] : 0);
            })
            itemAdd['tx1'] = m['tx1'] >= 0 ? this.replaceScore(m['tx1']) : ' ';
            itemAdd['tx2'] = m['tx2'] >= 0 ? this.replaceScore(m['tx2']) : ' ';
            itemAdd['tx3'] = m['tx3'] >= 0 ? this.replaceScore(m['tx3']) : ' ';

            const totalConvert = parseFloat(this.replaceNumberThapPhan(txTotal / (haveTx !== 0 ? haveTx : 1)));
            const sobuoinghi = Math.round(this.configPercentOfLeave * (parseInt(this._clases.sotinchi) * 3) / 100)
            // itemAdd['cc'] = m.nghi_20_pecent || m.check_ban === 'CAM' ? 'CAM' : this.replaceScore(this.replaceNumberThapPhan(((m.cc > 0 ? m.cc : 0) * (this.percentScore.cc/100) + m.bttn *(this.percentScore.daugio)  + (totalConvert) * (this.percentScore.kynang)) * 2));
            itemAdd['cc'] = this.replaceNumberThapPhan((((m.cc > 0 ? m.cc : 0) * (this.percentScore.cc / 100) + (m.bttn * (this.percentScore.daugio / 100)) + (totalConvert * (this.percentScore.kynang / 100))) * 2));

            if (m.check_ban === 'CAM') {
                arrBan.push('Không qua bài điều kiện');
            }

            // if (m.so_buoinghi > sobuoinghi) {
            //     if(m.accept_duthi == 1) {
            //
            //     }else{
            //         arrBan.push('Nghỉ quá số buổi QĐ');
            //
            //     }
            //
            // }
            if (m.nghi_20_pecent) {
                arrBan.push('Nghỉ quá số buổi QĐ');
            }
            itemAdd['so_buoinghi'] = m.so_buoinghi;
            // itemAdd['ghichu'] = arrBan.length > 0 ? arrBan.join('; ') : ' ';
            itemAdd['ghichu'] = ' ';
            return Object.values(itemAdd);
        })

        const datatxtp = Array.from(this.listData).map((m, index) => {
            const info = m['profile'];
            const itemAdd = {};
            itemAdd['index_table'] = index + 1;
            itemAdd['student_code'] = info ? info['student_code'] : '';
            itemAdd['fullName'] = info ? info['full_name'] : '';
            itemAdd['ngaysinh'] = info ? info['birthday'] : '';
            itemAdd['diemcc'] = m.cc >= 0 ? m.cc : ' ';
            const tp = m.bttn_tp;
            const max_tp = m['bttn_max_tp'];
            itemAdd['dienbttn'] = m.bttn.toFixed(1);


            for (let i = 1; i <= weekUse; i++) {
                itemAdd['week' + i] = (tp['week_' + i] && tp['week_' + i] > -1 ? Number(tp['week_' + i]) / 10 : '-') + ' | ' + (max_tp['week_' + i] && max_tp['week_' + i] > -1 ? max_tp['week_' + i] : '-');
            }
            let txTotal = 0;
            let haveTx = 0;
            this.arrSotinchi.forEach(a => {
                itemAdd['tx' + a.value] = m['tx' + a.value] >= 0 ? this.replaceScore(m['tx' + a.value]) : ' ';
                haveTx = haveTx + 1;
                txTotal = txTotal + (m['tx' + a.value] > 0 ? m['tx' + a.value] : 0);
            })
            // const totalConvert = parseFloat((txTotal / (haveTx !== 0 ? haveTx : 1)).toFixed(1))
            const totalConvert = parseFloat(this.replaceNumberThapPhan(txTotal / (haveTx !== 0 ? haveTx : 1)));

            // const totalConvert = (txTotal / (haveTx !== 0 ? haveTx : 1));
            // itemAdd['cc'] = (((m.cc > 0 ? m.cc : 0) * 0.05 + m.bttn * 0.15 + (totalConvert) * 0.3) * 2).toFixed(1);
            itemAdd['cc'] = this.replaceNumberThapPhan((((m.cc > 0 ? m.cc : 0) * (this.percentScore.cc / 100) + (m.bttn * (this.percentScore.daugio / 100)) + (totalConvert * (this.percentScore.kynang / 100))) * 2));

            const arrBan = [];
            if (m.check_ban === 'CAM') {
                const arrWeekBan = []
                for (let i = 1; i <= weekUse; i++) {
                    const value = parseInt(max_tp['week_' + i]);
                    if (isNaN(value) || max_tp['week_' + i] < 8) {
                        arrWeekBan.push(i)
                    }

                }
                arrBan.push('Không qua bài điều kiện: ' + arrWeekBan.join(', '));
            }


            if (m.nghi_20_pecent) {
                arrBan.push('Nghỉ quá số buổi QĐ');
            }
            itemAdd['so_buoinghi'] = m.so_buoinghi;

            itemAdd['ghichu'] = arrBan.length ? 'CAM' : '';
            itemAdd['ghichu2'] = arrBan.length > 0 ? arrBan.join('; ') : '';


            return Object.values(itemAdd);
        })

        if (datatx && datatxtp) {
            const numOfBan = this.listData.filter(f => !f['__cam']).length;
            const listCodeStudentBan = this.listData.filter(f => f['__cam']).map(m => m.student_code).join(', ');

            await this.exportExcel.exportThuongxuyenByHvuMau2(datatx, datatxtp, this._clases, this._clases.name, weekUse, this.percentScore, numOfBan, listCodeStudentBan);
        }
    }

    exportDiemThuongXuyenHvu() {
        this.notifi.isProcessing(true);
        const object_data: { [key: string]: RptClassStudentPoints[] } = {};
        const _class_manager_ids = [];
        this.listData.forEach(f => {
            if (f['profile']) {
                if (!object_data[f['profile']['class_management_id']]) {
                    object_data[f['profile']['class_management_id']] = [];
                    object_data[f['profile']['class_management_id']].push(f);
                    _class_manager_ids.push(f['profile']['class_management_id']);
                } else {
                    object_data[f['profile']['class_management_id']].push(f)
                }
            }

        })

        const condition_class_manager: ConditionOption = {
            condition: [],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'include', value: [... new Set(_class_manager_ids)].toString() },
                { label: 'include_by', value: 'id' }
            ],
            page: null
        }

        const condition_diemdanh: ConditionOption = {
            condition: [
                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this._clases.id.toString(), orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'include', value: 'K,P' },
                { label: 'include_by', value: 'loaiphep' }
            ],
            page: null
        }

        forkJoin([
            this.classManagementService.getDataByPageNew(condition_class_manager),
            this.classStudentDiemdanhService.getClassStudentDiemdanhByPageNew(condition_diemdanh),
            this.userService.getUserByCol("id", this._clases['manager_id'])
        ]).subscribe({
            next: ([_class_management, _diemdanh, _user]) => {
                Object.keys(object_data).forEach(o => {
                    const index_cm = _class_management.data.findIndex(m => m.id.toString() === o.toString());
                    if (index_cm !== -1) {
                        object_data[o].forEach(f => {
                            f['class_kyhieu'] = _class_management.data[index_cm].kyhieu;
                        })
                    }

                    object_data[o].forEach(f => {
                        const tietnghi = _diemdanh.data.filter(m => m.student_id === f.student_id && m.tiet).map(m => m.tiet);
                        // f['so_tietnghi'] = tietnghi.toString().split(",").filter(m => m && m !== '').length;
                        // f['so_tietnghi'] = f.so_buoinghi ? f.so_buoinghi * 5 : 0;
                    })
                })

                if (_user.length) {
                    this._clases['magiangvien'] = _user[0].username;
                }

                this.exportDiemthuongxuyenV2Service.exportExcel(object_data, this._clases);

                this.notifi.isProcessing(false);
            },
            error: () => {

            }
        })
    }

    downloadDiemDanhFromApi() {

        const arrayKyhieu = this._clases.kyhieu.split("-");

        const _body = {
            ma_mon_hoc: this._clases.course_detail.maso,
            nhom_to: arrayKyhieu[2],
            nhhk: this._clases.namhoc.toString().concat(this._clases.hocky.toString())
        }

        this.hvuApiDanhsachdiemdanhService.getHvuApiDanhsachdiemdanhBybody(_body)
    }
}
