import { Component, Input, OnInit } from '@angular/core';
import { Classes } from "@shared/models/classes";
import { RptClassStudentPoints, RptClassStudentPointsService } from "@shared/services/rpt-class-student-points.service";
import { NotificationService } from "@core/services/notification.service";
import { ClassStudentService } from "@shared/services/class-student.service";
import { ClassPlanActivitiesTestsService } from "@shared/services/class-plan-activities-tests.service";
import { ClassPlanActivityStudentTestsService } from "@shared/services/class-plan-activity-student-tests.service";
import { HttpParamsHeplerService } from "@core/services/http-params-hepler.service";
import { OvicQueryCondition } from "@core/models/dto";
import { forkJoin, Observable, of, switchMap } from "rxjs";
import { ClassStudent } from "@shared/models/class-student";
import { ClassPlanActivitiesTests } from "@shared/models/class-plan-activities-tests";
import { ClassPlanActivityStudentTests } from "@shared/models/class-plan-activity-student-tests";
import { ExportDiemthuongxuyenService } from "@shared/services/export-diemthuongxuyen.service";
import { ClassPlanActivityTuluanService } from "@shared/services/class-plan-activity-tuluan-service";
import { ClassPlanActivitiesService } from "@shared/services/class-plan-activities.service";
import { ClassPlanActivityTuluan } from "@shared/models/class-plan-activity-tuluan";
import { map } from "rxjs/operators";
import { ClassPlanActivities } from "@shared/models/class-plan-activities";
import { ConditionOption } from "@shared/models/condition-option";
import * as XLSX from 'xlsx';
import { BUTTON_NO, BUTTON_YES } from "@core/models/buttons";
import { HelperService } from "@core/services/helper.service";
import { AuthService } from "@core/services/auth.service";
import { ROLES } from '@modules/shared/utils/syscat';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@modules/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ConfigsService } from '@modules/shared/services/configs.service';
import { ButtonModule } from "primeng/button";
import { RippleModule } from "primeng/ripple";
import { CheckboxModule } from "primeng/checkbox";
import { ClassStudentDiemdanhService } from "@shared/services/class-student-diemdanh.service";
import { ClassStudentDiemdanh } from "@shared/models/class-student-diemdanh";
import { key_server } from "@env";
import Decimal from "decimal.js";
import { ClassesService } from '@modules/shared/services/classes.service';

type AOA = any[][];

interface PercentScore {
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
    standalone: true,
    imports: [CommonModule, SharedModule, FormsModule, ReactiveFormsModule, TableModule, DialogModule, MatProgressBarModule, ButtonModule, RippleModule, CheckboxModule],
    selector: 'app-thong-ke-diem-thuong-xuyen',
    templateUrl: './thong-ke-diem-thuong-xuyen.component.html',
    styleUrls: ['./thong-ke-diem-thuong-xuyen.component.css']
})
export class ThongKeDiemThuongXuyenComponent implements OnInit {
    @Input() set classSelected(clases: Classes) {
        this._clases = clases;
        this.arrSotinchi = this.cloneArrSoTinchi(parseInt(clases.sotinchi));

        this.checkData(clases);
    };

    _clases: Classes;

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

    isAdmin: boolean = false;

    // locked score confirmation
    displayLockedScoreDialog: boolean = false;
    lockedScoreAgreed: boolean = false;
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
        private classesService: ClassesService,
    ) {

        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.chuyenvien_pdt) || this.auth.userHasRole(ROLES.troly_pdt) ? true : false;
        this.isLanhDaoKhoa = this.auth.userHasRole(ROLES.lanhdaokhoa);
        this.isAdmin = this.auth.userHasRole(ROLES.manager);
    }

    ngOnInit(): void {
    }

    checkData(clases: Classes) {


        // this.rptClassStudentPointsService.checkLeghtByClassId(clases.id).subscribe({
        //   next:(nub)=>{
        //     if (nub === 0){
        //       this.typeView = "viewDongbo";
        //       this.listData = [];
        //     }else{
        //       // this.typeView = "data";
        //       this.getDataDongbo();
        //     }
        //   },
        //   error:(e)=>{
        //     this.notifi.isProcessing(false);
        //     this.notifi.toastError('Load dữ liệu không thành công ');
        //   }
        // })
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
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this._clases.course_id.toString() },
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
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this._clases.course_id.toString() },
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

                this.sobuoi_duocphepnghi = Math.floor(this.configPercentOfLeave * (parseInt(this._clases.sotinchi) * 3) / 100);
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

        const condition: ConditionOption = {
            condition: [
                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this._clases.id.toString() },
            ], page: '1',
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'id, class_id, student_id,ordering' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'ordering' },
            ]
        }


        forkJoin([
            this.classStudentService.getClassStudentByPageNew(condition),
            this.rptClassStudentPointsService.getDataByClassid(this._clases.id)
        ]).subscribe({
            next: ([{ data }, dataPoint]) => {
                this.typeView = 'data';
                this.listData = dataPoint.map(m => {
                    m['_diemCC'] = m.cc !== -1 ? this.replaceScore(m.cc) : 0;

                    m['_orderding'] = data.find(f => f.student_id == m.student_id) ? data.find(f => f.student_id == m.student_id)['ordering'] : 0;
                    return m;
                }).sort((a, b) => a['_orderding'] - b['_orderding']);
                // }).sort((a, b) => a.hodem.localeCompare(b.hodem)).sort((a, b) => a.ten.localeCompare(b.ten));
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

    createAndAddRpt() {
        this.textReport = '';
        this.displayModal = true;
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
                    { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this._clases.id.toString(), orWhere: 'and' },
                    { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this._clases.course_id.toString(), orWhere: 'and' },
                    { conditionName: 'ordering', condition: OvicQueryCondition.notEqual, value: '0', orWhere: 'and' },
                ],
                set: [
                    { label: 'limit', value: '-1' },
                    { label: 'select', value: "id, type, ordering,class_id " },
                    { label: 'order', value: "ASC" },
                    { label: 'orderby', value: "ordering" },
                ],
                page: '1'
            };

            const conditionClassPlanActivityTuLuan: ConditionOption = {
                condition: [
                    { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this._clases.id.toString(), orWhere: 'and' },
                    { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this._clases.course_id.toString(), orWhere: 'and' },

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
                    // { label: 'select', value: "id, student_id,point,created_at,updated_at" },
                    // { label: 'order', value: "DESC" },
                    // { label: 'orderby', value: "updated_at" },
                ],
                page: '1'
            };

            return forkJoin<[ClassStudent[], ClassPlanActivitiesTests[], ClassPlanActivityStudentTests[], ClassPlanActivities[], ClassPlanActivityTuluan[], ClassPlanActivityStudentTests[], ClassStudentDiemdanh[]]>(
                [of(a[0]),
                of(a[1]),
                this.ccService.getDataByClassIdAndStudentIds(this._clases.id, student_ids, 'id,class_id,student_id,passing_point,point,course_id,created_at,class_plan_activity_id,week,type,tong_diem', 'KT_DAUGIO'),
                this.classPlanActivitiesService.getClassPlanActivitiesByPageNew(conditionClassPlanActivity).pipe(map(m => m.data)),
                this.classPlanActivityTuluanService.getClassPlanActivityTuluanByPageNew(conditionClassPlanActivityTuLuan).pipe(map(m => m.data)),
                this.ccService.getDataByClassIdAndStudentIdsNotType(this._clases.id, student_ids, 'id,class_id,student_id,passing_point,point,course_id,created_at,class_plan_activity_id,week,type,tong_diem', 'KT_DAUGIO'),
                this.classStudentDiemdanhService.getClassStudentDiemdanhByPageNew(conditionClassDiemdanh).pipe(map(m => m.data)),
                ])
        })).subscribe({
            next: ([students, studentTxTn, studentCC, classPlanactivity, classPlanActivityTuLuan, studentCCNotDaugio, classStudentDiemdanh]) => {
                this.progressValue = 100;
                const studentTxParamV2 = classPlanactivity.filter(f => f.type === 'THUONGXUYEN_TRACNGHIEM' || f.type === 'THUONGXUYEN_TULUAN' || f.type === 'THUONGXUYEN_DUAN').map(m => {
                    if (m.type === 'THUONGXUYEN_TULUAN' || m.type === 'THUONGXUYEN_DUAN') {
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
                        mapData['so_buoinghi'] = classStudentDiemdanh.length > 0 ? classStudentDiemdanh.filter(f => f.student_id === m.student_id && f.loaiphep !== 'M').length : 0;


                        const weeks = parseInt(this._clases.sotinchi) * 3 - 1;
                        const sotinchi = parseInt(this._clases.sotinchi);
                        mapData['bttn_tp'] = {};
                        mapData['bttn_max_tp'] = {};
                        let checkban = [];
                        let bttn_tp_total = 0;
                        for (let i = 1; i <= weeks; i++) {
                            const index_diem_daugio = studentCC.findIndex(c => c.week === i && c.student_id === m.student_id);

                            mapData['bttn_tp']['week_' + i] = index_diem_daugio !== -1 ? Number(studentCC[index_diem_daugio]['tong_diem']) : 0;

                            bttn_tp_total = bttn_tp_total + mapData['bttn_tp']['week_' + i];

                            const diem_cc: number[] = studentCCNotDaugio.filter(c => c.student_id === m.student_id && c.week === i).map(m => Number(m['tong_diem']));

                            if (diem_cc.length) {
                                mapData['bttn_max_tp']['week_' + i] = diem_cc.length ? Math.max(...diem_cc) / 10 : -1;
                            } else {
                                checkban.push(1);
                            }

                        }

                        // mapData['bttn'] = parseFloat(((bttn_tp_total / (weeks * 10)).toFixed(1)));


                        mapData['bttn'] = this.replaceNumberThapPhan(bttn_tp_total / (weeks * 10));

                        mapData['check_ban'] = checkban.length === 0 ? '' : 'CAM';

                        studentTxParamV2.forEach((b, index) => {
                            const tx = b['txParam'].length > 0 && b['txParam'].find(c => c.student_id === m.student_id) ? b['txParam'].find(c => c.student_id === m.student_id) : null;

                            // mapData['tx' + (index + 1)] = tx ? (tx.point ? ( tx.point >0 ? tx.point: 0) : -1) : -1;
                            if (b.type === 'THUONGXUYEN_TRACNGHIEM') {
                                // const violation_of_exam = tx['violation_of_exam']? (configParam.find(f=>f['key'] === tx['violation_of_exam']['key']) ? configParam.find(f=>f['key'] === m['violation_of_exam']['key']).  ) : ;

                                if (tx && tx.lock === 1) {
                                    mapData['tx' + (index + 1)] = -1;
                                } else if (tx && tx.lock === 0) {

                                    // const violation_of_exam = tx && tx['violation_of_exam'] ? tx['violation_of_exam']['key']: null;
                                    // const minusPoint:number = violation_of_exam && configParam.find(f=>f['key'] === violation_of_exam ) ? configParam.find(f=>f['key'] === violation_of_exam )['POINT'] :0;
                                    // mapData['tx' + (index + 1)] = tx.point > 0 ? this.replaceNumberThapPhan(tx['tong_diem']) : 0;
                                    mapData['tx' + (index + 1)] = Number(tx['tong_diem']) > 0 ? Number(tx['tong_diem']) : 0;

                                } else {
                                    mapData['tx' + (index + 1)] = -1;
                                }
                                // if (tx && tx.status !== 0){
                                //     mapData['tx' + (index + 1)] = tx.point >0 ? tx.point: 0;
                                // }
                                //  if (!tx){
                                //      mapData['tx' + (index + 1)] = -1;
                                //  }
                            }
                            if (b.type === 'THUONGXUYEN_TULUAN' || b.type === 'THUONGXUYEN_DUAN') {
                                mapData['tx' + (index + 1)] = tx ? validatePoint(tx.point, -1) : -1;
                            }
                            // mapData['tx' + (index + 1)] = tx ? (tx.point  ? tx.point : -1) : -1;

                        })


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
            }, error: () => {
                this.displayModal = false;
                this.notifi.toastError('Load dữ liệu không thành công');
            }
        })
            ;
    }


    replaceConfigKey(data) {
        const get_violation = data['params'];

        const config_array = [];

        if (get_violation && Object.keys(get_violation)) {
            Object.keys(get_violation).forEach(f => {
                get_violation[f]['key'] = f;
                config_array.push(get_violation[f]);
            })
        }

        return config_array;
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

    cloneArrSoTinchi(num: number): { value: number }[] {
        const arr: { value: number }[] = [];
        for (let i = 1; i <= num; i++) {
            arr.push({ value: i })
        }
        return arr;
    }

    sumTBC(data: RptClassStudentPoints): string {
        let total: number = 0;
        let numofTotal: number = 0;

        let tx = 0;
        this.arrSotinchi.forEach(e => {
            total += (data['tx' + e.value] > 0 ? data['tx' + e.value] : 0);
            numofTotal += 1;
        })
        return (((data.cc > 0 ? data.cc : 0) * 0.05) + data.bttn * 0.15 + (total * 0.3 / (numofTotal === 0 ? 1 : numofTotal))).toFixed(2);
    }


    addPointCC(item: RptClassStudentPoints) {
        if (item['_diemCC'] > 0 && item['_diemCC'] <= 10) {
            this.rptClassStudentPointsService.update(item.id, { cc: item['_diemCC'] }).subscribe({
                next: () => {
                    this.listData.find(f => f.id === item.id).cc = item['_diemCC'];
                    this.notifi.toastSuccess('Cập nhật điểm CC thành công');
                }, error: () => {
                    this.notifi.toastSuccess('Cập nhật điểm CC không thành công');
                }
            });
        } else {
            this.notifi.toastError('Vui lòng nhập điểm cơ số 10');
        }
    }

    async btnExportExcel() {
        const weekUse = this.arrSotinchi.length * 3 - 1;
        const sobuoinghi = Math.floor(this.configPercentOfLeave * (parseInt(this._clases.sotinchi) * 3) / 100);

        const datatx = this.listData.map((m, index) => {
            const info = m['profile'];
            const itemAdd = {};
            itemAdd['index_table'] = index + 1;
            itemAdd['student_code'] = info ? info['student_code'] : '';
            itemAdd['fullName'] = info ? info['full_name'] : '';
            itemAdd['ngaysinh'] = info ? info['birthday'] : '';
            itemAdd['diemcc'] = m.cc >= 0 ? this.replaceScore(m.cc) : ' ';
            itemAdd['dienbttn'] = this.replaceScore(m.bttn.toFixed(1));
            // this.arrSotinchi.forEach(a=>{
            //   itemAdd['tx'+ a.value] = m['tx'+a.value]>0 ? m['tx'+a.value] : ' ';
            // })
            let txTotal = 0;
            let haveTx = 0;
            const arrBan = [];
            // if (m.nghi_20_pecent) {
            //     arrBan.push('Nghỉ quá Số buổi QĐ');
            // }
            let number_ban_tx = 0;
            let text_note_lack = 'Thiếu bài TX '
            this.arrSotinchi.forEach(a => {
                // itemAdd['tx'+ a.value] = m['tx'+a.value]>0 ? m['tx'+a.value] : ' ';
                itemAdd['tx' + a.value] = m['tx' + a.value] >= 0 ? this.replaceScore(m['tx' + a.value]) : ' ';

                haveTx = haveTx + 1;
                txTotal = txTotal + (m['tx' + a.value] > 0 ? m['tx' + a.value] : 0);

            })


            // const totalConvert = parseFloat((txTotal / (haveTx !== 0 ? haveTx : 1)).toFixed(1))
            // const totalConvert = parseFloat(this.replaceScore(txTotal / (haveTx !== 0 ? haveTx : 1)));
            const totalConvert = parseFloat(this.replaceNumberThapPhan(txTotal / (haveTx !== 0 ? haveTx : 1)));

            const totalPoint = this.plussToDecimal(this.numToDecimal(m.cc > 0 ? m.cc : 0, 0.05), this.numToDecimal(m.bttn, 0.15), this.numToDecimal(totalConvert, 0.3))
            itemAdd['cc'] = (m.so_buoinghi > sobuoinghi && m.accept_duthi == 0) || m.check_ban === 'CAM' ? 'CAM' : this.replaceScore(this.toFixed(this.numToDecimal(totalPoint, 2), 1));

            if (m.check_ban === 'CAM') {
                arrBan.push('Không qua bài điều kiện');
            }

            if (m.so_buoinghi > sobuoinghi) {
                if (m.accept_duthi == 1) {

                } else {
                    arrBan.push('Nghỉ quá số buổi QĐ');

                }

            }
            // if(number_ban_tx !== 0){
            //     arrBan.push(text_note_lack);
            // }

            itemAdd['ghichu'] = arrBan.length > 0 ? arrBan.join('; ') : ' ';
            return Object.values(itemAdd);
        })

        const columnDataTx = ['index_table', 'fullName', 'ngaysinh', 'diemcc', 'dienbttn'];
        const columnDataTxTp = ['index_table', 'fullName', 'ngaysinh', 'diemcc', 'dienbttn'];
        for (let i = 1; i <= this.arrSotinchi.length * 3; i++) {
            columnDataTxTp.push('week_' + i);
        }


        this.arrSotinchi.forEach(a => {
            columnDataTx.push('tx' + a.value);
            columnDataTxTp.push('tx' + a.value);
        })

        columnDataTx.push('ghichu');
        columnDataTxTp.push('ghichu');



        const datatxtp = this.listData.map((m, index) => {
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
                itemAdd['week' + i] = (tp['week_' + i] > -1 ? tp['week_' + i] / 10 : '-') + ' | ' + (max_tp['week_' + i] && max_tp['week_' + i] > -1 ? max_tp['week_' + i] : '-');
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


            // itemAdd['cc'] = this.replaceScore(this.toFixed((((m.cc > 0 ? m.cc : 0) * 0.05 + m.bttn * 0.15 + (totalConvert) * 0.3) * 2),1));

            // itemAdd['cc'] = this.replaceScore(this.toFixed(((this.numToDecimal(m.cc >0 ? m.cc: 0,0.05) + this.numToDecimal(m.bttn,0.15) + this.numToDecimal(totalConvert,0.3)) * 2),1));

            const totalPoint = this.plussToDecimal(this.numToDecimal(m.cc > 0 ? m.cc : 0, 0.05), this.numToDecimal(m.bttn, 0.15), this.numToDecimal(totalConvert, 0.3))
            itemAdd['cc'] = this.replaceScore(this.toFixed(this.numToDecimal(totalPoint, 2), 1));

            const arrBan = [];
            if (m.check_ban === 'CAM') {
                const arrWeekBan = []
                for (let i = 1; i <= weekUse; i++) {
                    if (!(typeof max_tp['week_' + i] === 'number') || max_tp['week_' + i] < 8) {
                        arrWeekBan.push(i)
                    }

                }
                arrBan.push('Không qua bài điều kiện: ' + arrWeekBan.join(', '));
            }


            if (m.so_buoinghi > sobuoinghi) {
                if (m.accept_duthi == 1) {

                } else {
                    arrBan.push('Nghỉ quá số buổi QĐ');

                }
                // arrBan.push('Nghỉ quá số buổi QĐ');
            }
            itemAdd['so_buoinghi'] = m.so_buoinghi;

            itemAdd['ghichu'] = arrBan.length ? 'CAM' : '';
            itemAdd['ghichu2'] = arrBan.length > 0 ? arrBan.join('; ') : '';



            return Object.values(itemAdd);
        })

        if (datatx && datatxtp && columnDataTx) {
            await this.exportExcel.exportExcel(datatx, datatxtp, this._clases, this._clases.name, weekUse, columnDataTx, columnDataTxTp);
        }
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

                            this.getDataDongbo();

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
        return this.toFixed(a, 1);

    }
    toFixed(value: number, digits?: number): string {
        const precision: number = digits || 0;
        const power: number = Math.pow(10, precision);
        const absValue: number = Math.abs(Math.round(value * power));
        let result: string = (value < 0 ? '-' : '') + String(Math.floor(absValue / power));
        if (precision > 0) {
            const fraction: string = String(absValue % power);
            const padding: string = new Array(Math.max(precision - fraction.length, 0) + 1).join('0');
            result += '.' + padding + fraction;
        }
        return result;
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
                if (inputPoint_quest.value.replace(/\d/gi, '').length > 0 && event.key === '.') {
                    event.preventDefault();
                }
            } else {
                event.preventDefault();
            }
        }
    }

    numToDecimal(num1: number, num2: number): number {
        return new Decimal(num1).mul(num2).toNumber();
    }
    plussToDecimal(num1: number, num2: number, num3: number): number {
        return new Decimal(num1).plus(num2).plus(num3).toNumber();
    }

    index_focus: number = 0;
    tabByKeyboard(event, row: any, index) {
        if (event && row) {

            if (event.key === 'Tab') {
                this.index_focus = this.listData[index + 1].id;

            }
        }
    }

    lockedScore() {
        this.displayLockedScoreDialog = true;
        this.lockedScoreAgreed = false;
    }

    confirmLockedScore() {
        if (!this.lockedScoreAgreed) {
            this.notifi.toastWarning('Vui lòng tích vào ô "Tôi đã đọc và đồng ý"');
            return;
        }
        this.displayLockedScoreDialog = false;
        // TODO: Implement the actual score locking logic
        this.notifi.isProcessing(true);
        this.classesService.updateDataClasses(this._clases.id, { locked_score: 1 }).subscribe({
            next: () => {
                this._clases.locked_score = 1;
                this.notifi.isProcessing(false);
                this.notifi.toastSuccess('Đã chốt điểm thành công. Điểm thường xuyên sẽ không thể chỉnh sửa được nữa.');
            },
            error: () => {
                this.notifi.isProcessing(false);
                this.notifi.toastError('Chốt điểm thất bại. Vui lòng thử lại.');
            }
        });
    }

    cancelLockedScore() {
        this.displayLockedScoreDialog = false;
        this.lockedScoreAgreed = false;
    }

    unLockedScore() {
        this.notifi.confirm('Bạn có chắc chắn muốn mở chốt điểm không?', 'Xác nhận hành động', [BUTTON_YES, BUTTON_NO]).then(a => {
            if (a.name === 'yes') {
                this.notifi.isProcessing(true);
                this.classesService.updateDataClasses(this._clases.id, { locked_score: 0 }).subscribe({
                    next: () => {
                        this._clases.locked_score = 0;
                        this.notifi.isProcessing(false);
                        this.notifi.toastSuccess('Đã mở chốt điểm thành công.');
                    },
                    error: () => {
                        this.notifi.isProcessing(false);
                        this.notifi.toastError('Mở chốt điểm thất bại. Vui lòng thử lại.');
                    }
                });
            }
        });
    }
}
