import {Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild} from '@angular/core';

import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { OvicQueryCondition } from '@core/models/dto';
import {forkJoin, mergeMap, Observable, of, switchMap} from 'rxjs';
import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';
import { CoursePlanActivities } from '@modules/shared/models/course-plan-activities';
import { CourseQuestionsService } from '@modules/shared/services/course-questions.service';
import {APP_CONFIGS, key_server} from '@env';
import { SharedModule } from '@modules/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import {ButtonModule} from "primeng/button";
import {RippleModule} from "primeng/ripple";
import {ConfigsService} from "@shared/services/configs.service";
import {NotificationService} from "@core/services/notification.service";
import {map} from "rxjs/operators";
import {NORMAL_MODAL_OPTIONS} from "@core/utils/syscat";
import {BUTTON_NO, BUTTON_YES} from "@core/models/buttons";
import {CourseQuestions} from "@shared/models/course-questions";
import {AuthService} from "@core/services/auth.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {OvicDateTimeService} from "@shared/services/ovic-date-time.service";
import {HelperService} from "@core/services/helper.service";
import {CheckboxModule} from "primeng/checkbox";
import {CourseThanhvien} from "@shared/models/course_thanhvien";
import {CoursePlanActivityTuluan} from "@shared/models/course-plan-activity-tuluan";
import {CoursePlanActivityTuluanService} from "@shared/services/course-plan-activity-tuluan.service";

export interface PlanKiemDuyet extends CoursePlanActivities {
    status_muctieu?: number;
    status_tailieu?: number;
    total_question?: number;
    duyet_question?: number;
    total_cdr?: number;
    duyet_cdr?: number;
}

@Component({
    standalone: true,
    imports: [SharedModule, FormsModule, ReactiveFormsModule, TableModule, ButtonModule, RippleModule, CheckboxModule],
    selector: 'app-ketqua-duyet-all',
    templateUrl: './ketqua-duyet-all.component.html',
    styleUrls: ['./ketqua-duyet-all.component.css']
})
export class KetquaDuyetAllComponent implements OnInit, OnChanges {
    @ViewChild('templateDuyetnoidung') templateDuyetnoidung: ElementRef;

    @Input() courseSelected: ElnKhoaHoc;
    @Input() listThamDInh: CourseThanhvien[];

    _courseThanhVien : CourseThanhvien[];
    selectedCourse: ElnKhoaHoc;

    list_plan_activite: PlanKiemDuyet[];

    label_week: string = 'Bài';

    config_check_hoidong_by_chutich: boolean =false;
    isChutichHoidong: boolean =false;

    listQuestionParent: CourseQuestions[];

    isLanhdaotruong:boolean =false;
    isLanhdaoKhoaBomon : boolean = false;
    keyServer= key_server;

    listKttxTuluan: CoursePlanActivityTuluan[];
    constructor(
        private coursePlanActivitiesService: CoursePlanActivitiesService,
        private courseQuestionsService: CourseQuestionsService,
        private configsService:ConfigsService,
        private noitifi: NotificationService,
        private auth: AuthService,
        private modalService: NgbModal,
        private ovicDateTimeService: OvicDateTimeService,
        private helperService: HelperService,
        private coursePlanActivityTuluanService: CoursePlanActivityTuluanService
    ) {
        const config = JSON.parse(localStorage.getItem('--app_configs-' + APP_CONFIGS.realm));

        const setting = config.find(m => m.config_key === 'SETTING')['params'];

        this.label_week = setting['plan']['prefix'];


        this.isLanhdaotruong = !!this.auth.roles.find(f=> ['daotao_ld'].includes(f.name))
        this.isLanhdaoKhoaBomon = !!this.auth.roles.find(f=> ['khoa_ld','bomon_ld'].includes(f.name))
        console.log(this.auth.roles);
        console.log(this.isLanhdaoKhoaBomon);

    }
    // ['truong_ld','daotao_ld']
    ngOnChanges(changes: SimpleChanges): void {
        if (changes['courseSelected'] ||changes['listThamDInh']) {
            this.selectedCourse = this.courseSelected;
            this.initLoad();
            this._courseThanhVien = this.listThamDInh;
            this.isChutichHoidong = !!this.listThamDInh.find(f => f.user_id == this.auth.user.id && f.vaitro == "CHUTICH");
        }

    }

    ngOnInit(): void {
        // const condition_question: ConditionOption = {
        //     condition: [
        //     ],
        //     set: [
        //         { label: 'limit', value: '-1' },
        //         { label: 'select', value: 'status,id,cdr,reference_id,week,created_at' }
        //     ],
        //     page: null
        // }
        // this.courseQuestionsService.getCourseQuestionsByPageNew(condition_question).subscribe(() => { })
    }

    initLoad() {
        this.noitifi.isProcessing(true);
        const condition_plan: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse.id.toString(), orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.lessThan, value: '100', orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.greaterThan, value: '0', orWhere: 'and' },
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'ordering' }
            ],
            page: null
        }

        const condition_question: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse.id.toString(), orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.lessThan, value: '100', orWhere: 'and' },
                { conditionName: 'reference', condition: OvicQueryCondition.equal, value: 'course_plan_activities', orWhere: 'and' },
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
                { conditionName: 'group_id', condition: OvicQueryCondition.equal, value: '0', orWhere: 'and' },
                { conditionName: 'reference_id', condition: OvicQueryCondition.notEqual, value: '0', orWhere: 'and' },

            ],
            set: [
                { label: 'limit', value: '-1' },
                // { label: 'select', value: 'status,id,cdr,reference_id,week,created_at' }
            ],
            page: null
        }
        const condition_getConfig :ConditionOption= {
            condition:[
                { conditionName:'config_key',condition:OvicQueryCondition.equal,value:'CHECK_DUYET_HOIDONG_BY_CHUTICH'}
            ],
            set:[
                {label:'limit',value:'1'}
            ],
            page:'1'
        };

        const condition_activity_Tuluan :ConditionOption= {
            condition:[
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse.id.toString(), orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.equal, value: '1000', orWhere: 'and' },
                { conditionName: 'type', condition: OvicQueryCondition.equal, value: 'THUONGXUYEN_TULUAN', orWhere: 'and' },
                { conditionName: 'parent_id', condition: OvicQueryCondition.notEqual, value: '0', orWhere: 'and' },
            ],
            set:[
                {label:'limit',value:'-1'},
                {label:'order',value:'ASC'},
            ],
            page:'1'
        };




        forkJoin([
            this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_plan),
            this.courseQuestionsService.getCourseQuestionsByPageNew(condition_question).pipe(mergeMap(a => {
                this.listQuestionParent = a.data;
                if (this.selectedCourse.av === 1) {

                    const ids = a.data.map(m => m.id);
                    const condition_child_question: ConditionOption = {
                        condition: [
                            { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse.id.toString(), orWhere: 'and' },
                            { conditionName: 'week', condition: OvicQueryCondition.lessThan, value: '100', orWhere: 'and' },
                            { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
                        ],
                        set: [
                            { label: 'limit', value: '-1' },
                            { label: 'select', value: 'status,id,cdr,reference_id,week,group_id' },
                            { label: 'include', value: ids.toString() },
                            { label: 'include_by', value: 'group_id' }
                        ],
                        page: null
                    }

                    return this.courseQuestionsService.getCourseQuestionsByPageNew(condition_child_question).pipe(mergeMap(_child_question => {
                        a.data.forEach(f => {
                            const child_question = _child_question.data.filter(m => m.group_id === f.id);
                            child_question.forEach(c => {
                                c.status = f.status;
                            })
                        })
                        return of(_child_question);
                    }))
                }
                return of(a);
            })),
            this.configsService.getConfigsByPageNew(condition_getConfig).pipe(map(m=>m.data[0])),
            this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_activity_Tuluan).pipe(switchMap(m=>{
                const condition_activity_Tuluan_DE ={
                    condition:[
                        { conditionName: 'course_plan_activity_id', condition: OvicQueryCondition.equal, value: m.data.map(a=>a.id).toString(), orWhere: 'in' },
                    ],
                    set:[
                        {label:'limit',value:'-1'},
                        {label:'order',value:'ASC'},
                        {label:'select',value:'id,status,old_status,title,course_plan_activity_id,course_id,accept_edit_id,accept_edit_at'},
                    ],
                    page:'1'
                }
                return m.data.length >0 ? this.coursePlanActivityTuluanService.getCoursePlanActivityTuluanByPageNew(condition_activity_Tuluan_DE) : of({data:[]})
            }))
        ]).subscribe({
            next: ([_plan_activity, _course_question, configChutich, _course_activity_tuluan]) => {
                this.config_check_hoidong_by_chutich =configChutich['params']['check']
                this.listKttxTuluan = _course_activity_tuluan.data;

                const parent_plan = _plan_activity.data.filter(m => m.parent_id === 0);
                parent_plan.forEach(f => {
                    const children_plan = _plan_activity.data.filter(m => m.parent_id === f.id);
                    f['status_muctieu'] = children_plan.find(m => m.type === 'MUCTIEU').status;
                    f['status_tailieu'] = children_plan.find(m => m.type === 'ACTIVITY').status;
                    f['total_question'] = _course_question.data.filter(m => m['week'] === f.week).length;
                    f['duyet_question'] = _course_question.data.filter(m => m['week'] === f.week && m.status === 1).length;
                    f['total_cdr'] = children_plan.filter(m => m.type === 'ACTIVITY_CDR').length;
                    f['duyet_cdr'] = children_plan.filter(m => m.type === 'ACTIVITY_CDR' && m.status === 1).length;
                    f['_total_question'] = _course_question.data.filter(m => m['week'] === f.week);
                    f['_dataCDR'] = children_plan.filter(m => m.type === 'ACTIVITY_CDR');
                    f['_dataContentkhac'] = children_plan.filter(m => m.type === 'MUCTIEU' ||  m.type === 'ACTIVITY');
                })

                this.list_plan_activite = parent_plan;
                this.noitifi.isProcessing(false);

            },
            error: () => {
                this.noitifi.isProcessing(false);

            }
        })
    }
    //----------------------------------------------
    objectCheckAfterAccept = [
        {
            id: 1,
            check: false,
            title: 'Chỉ duyệt những nội dung không yêu cầu sửa ',
            key: 'isNotEdit'
        },
        {
            id: 2,
            check: false,
            title: 'Chỉ duyệt những nội dung đã và đang sửa ',
            key: 'isHaveEdit'
        }
    ];
    objectFillterCheckAfterAccept = {
        isNotEdit: false,
        isHaveEdit: false,
        type: null
    }
    titleTemplace:string = '';
    btnViewFormDuyet(type: string) {
        this.objectFillterCheckAfterAccept = {
            isNotEdit: false,
            isHaveEdit: false,
            type: type
        }
        this.titleTemplace = type == 'celo' ? 'Duyệt Tất cả nội dung CELO' : (type == 'question' ? 'Duyệt Tất cả câu hỏi' : (type == 'other' ? 'Duyệt nội dung khác' : (type =='kttxTH' ?'Duyệt KTTX Thực hành' : '')));
        this.modalService.open(this.templateDuyetnoidung, NORMAL_MODAL_OPTIONS)

    }

    async btnDuyet() {
        if (!this.objectFillterCheckAfterAccept.isHaveEdit && !this.objectFillterCheckAfterAccept.isNotEdit) {
            return this.noitifi.toastWarning('Thầy cô giảng viên vui lòng chọn ít nhất 1 trong các phương án trên');
        }

        if (this.objectFillterCheckAfterAccept.type == 'celo') {
            const newdataCDR = this.collectData(Array.from(this.list_plan_activite),'_dataCDR')
            const newdataCDRNotEdit = newdataCDR.filter(f => f.status == 0 && f.old_status == 0)
            const newdataCDRHaveEdit = [...newdataCDR.filter(f => f.status == 0 && f.old_status !== 0), ...newdataCDR.filter(f => f.status == -2 && f.old_status !== 0)]

            let html = `
            `;
            let arr: any[] = [];
            if (this.objectFillterCheckAfterAccept.isNotEdit) {
                html += `<p class="m-0">- Xác nhận duyệt với những nội dung không yêu cầu sửa </p>`
                arr = [...arr, ...newdataCDRNotEdit];
            }
            if (this.objectFillterCheckAfterAccept.isHaveEdit) {
                html += `<p class="m-0">- Xác nhận duyệt với những nội dung yêu cầu sửa </p>`;
                arr = [...arr, ...newdataCDRHaveEdit];

            }
            if (arr.length == 0) {
                return this.noitifi.toastWarning('Tiêu chí giảng viên chọn không có dữ liệu');
            }
            const btn = await this.noitifi.confirmRounded(html, 'THÔNG BÁO', [BUTTON_YES, BUTTON_NO])
            if (btn.name == 'yes') {
                this.noitifi.isProcessing(true);
                this.ovicDateTimeService.getCurrentDateTime().pipe(switchMap(m => {
                    return this.loopUpdatecelo(arr, m)
                })).subscribe({
                    next: () => {
                        this.noitifi.isProcessing(false);
                        this.noitifi.toastSuccess('Duyệt thành công');
                        this.modalService.dismissAll();
                        // this.load(this._coursePlan);
                        this.initLoad()
                    }, error: () => {
                        this.noitifi.isProcessing(false);
                        this.noitifi.toastError('Duyệt không thành công')
                        this.modalService.dismissAll();

                    }
                })
            }

        } else if (this.objectFillterCheckAfterAccept.type == 'other') {
            const newdataContentOther = this.collectData(Array.from(this.list_plan_activite),'_dataContentkhac')
            const newdataContentOtherNotEdit = newdataContentOther.filter(f => f.status == 0 && f.old_status == 0)
            const newdataContentOtherHaveEdit = [...newdataContentOther.filter(f => f.status == 0 && f.old_status !== 0), ...newdataContentOther.filter(f => f.status == -2 && f.old_status !== 0)]

            let html = ``;
            let arr: any[] = [];
            if (this.objectFillterCheckAfterAccept.isNotEdit) {
                html += `<p class="m-0">- Xác nhận duyệt với những nội dung không yêu cầu sửa</p>`
                arr = [...arr, ...newdataContentOtherNotEdit];
            }
            if (this.objectFillterCheckAfterAccept.isHaveEdit) {
                html += `<p class="m-0">- Xác nhận duyệt với những nội dung yêu cầu sửa</p>`;
                arr = [...arr, ...newdataContentOtherHaveEdit];
            }
            if (arr.length == 0) {
                return this.noitifi.toastWarning('Tiêu chí giảng viên chọn không có dữ liệu');
            }
            const btn = await this.noitifi.confirmRounded(html, 'THÔNG BÁO', [BUTTON_YES, BUTTON_NO])
            if (btn.name == 'yes') {
                this.noitifi.isProcessing(true);
                this.ovicDateTimeService.getCurrentDateTime().pipe(switchMap(m => {
                    return this.loopUpdatecelo(arr, m)
                })).subscribe({
                    next: () => {
                        this.noitifi.isProcessing(false);
                        this.noitifi.toastSuccess('Duyệt thành công');
                        this.modalService.dismissAll();
                        // this.load(this._coursePlan);
                        this.initLoad()
                    }, error: () => {
                        this.noitifi.isProcessing(false);
                        this.noitifi.toastError('Duyệt không thành công')
                        this.modalService.dismissAll();
                    }
                })
            }
        } else if (this.objectFillterCheckAfterAccept.type == 'question') {
            const newdataQuestion = Array.from(this.listQuestionParent);
            const newdataQuestionNotEdit = newdataQuestion.filter(f => f.status == 0 && f.old_status == 0)
            const newdataQuestionHaveEdit = [...newdataQuestion.filter(f => f.status == 0 && f.old_status !== 0), ...newdataQuestion.filter(f => f.status == -2 && f.old_status !== 0)]
            let html = ``;
            let arr: any[] = [];
            if (this.objectFillterCheckAfterAccept.isNotEdit) {
                html += `<p class="m-0">- Xác nhận duyệt với những nội dung không yêu cầu sửa</p>`
                arr = [...arr, ...newdataQuestionNotEdit];
            }
            if (this.objectFillterCheckAfterAccept.isHaveEdit) {
                html += `<p class="m-0">- Xác nhận duyệt với những nội dung yêu cầu sửa</p>`;
                arr = [...arr, ...newdataQuestionHaveEdit];

            }
            if (arr.length == 0) {
                return this.noitifi.toastWarning('Tiêu chí giảng viên chọn không có dữ liệu');
            }
            const btn = await this.noitifi.confirmRounded(html, 'THÔNG BÁO', [BUTTON_YES, BUTTON_NO])
            if (btn.name == 'yes') {
                const step: number = 100 / arr.length;
                this.noitifi.isProcessing(true);
                this.noitifi.loadingAnimationV2({process: {percent: 0}});
                this.ovicDateTimeService.getCurrentDateTime().pipe(
                    mergeMap(date => this.loopUpdateStatusQuestions(arr, date, step, 0))).subscribe({
                        next: () => {
                            this.noitifi.isProcessing(false);
                            this.noitifi.toastSuccess('Duyệt thành công');
                            this.modalService.dismissAll();
                            this.noitifi.disableLoadingAnimationV2();

                            // this.load(this._coursePlan);
                            this.initLoad()
                        },
                        error: () => {
                            this.noitifi.isProcessing(false);
                            this.noitifi.toastError('Duyệt không thành công')
                            this.modalService.dismissAll();
                            this.noitifi.disableLoadingAnimationV2();

                        }
                    }
                )
            }
        }else if (this.objectFillterCheckAfterAccept.type == 'kttxTH') {


            const newdata = Array.from(this.listKttxTuluan);
            const newdataNotEdit = newdata.filter(f => f.status == 0 && f.old_status == 0)
            const newdataHaveEdit = [...newdata.filter(f => f.status == 0 && f.old_status !== 0), ...newdata.filter(f => f.status == -2 && f.old_status !== 0)]

            let html = ``;
            let arr: any[] = [];
            if (this.objectFillterCheckAfterAccept.isNotEdit) {
                html += `<p class="m-0">- Xác nhận duyệt với những nội dung không yêu cầu sửa</p>`
                arr = [...arr, ...newdataNotEdit];
            }
            if (this.objectFillterCheckAfterAccept.isHaveEdit) {
                html += `<p class="m-0">- Xác nhận duyệt với những nội dung yêu cầu sửa</p>`;
                arr = [...arr, ...newdataHaveEdit];

            }
            if (arr.length == 0) {
                return this.noitifi.toastWarning('Tiêu chí giảng viên chọn không có dữ liệu');
            }

            const btn = await this.noitifi.confirmRounded(html, 'THÔNG BÁO', [BUTTON_YES, BUTTON_NO])
            if (btn.name == 'yes') {
                const step: number = 100 / arr.length;
                this.noitifi.isProcessing(true);
                this.noitifi.loadingAnimationV2({process: {percent: 0}});
                this.ovicDateTimeService.getCurrentDateTime().pipe(
                    mergeMap(date => this.loopUpdateStatusKTTXTL(arr, date, step, 0))).subscribe({
                        next: () => {
                            this.noitifi.isProcessing(false);
                            this.noitifi.toastSuccess('Duyệt thành công');
                            this.modalService.dismissAll();
                            this.noitifi.disableLoadingAnimationV2();

                            // this.load(this._coursePlan);
                            this.initLoad()
                        },
                        error: () => {
                            this.noitifi.isProcessing(false);
                            this.noitifi.toastError('Duyệt không thành công')
                            this.modalService.dismissAll();
                            this.noitifi.disableLoadingAnimationV2();

                        }
                    }
                )
            }


        }
    }

    private loopUpdatecelo(data: CoursePlanActivities[], datetime: Date):
        Observable<CoursePlanActivities[]> {
        const index = data.findIndex(f => !f['isUpdate']);
        if (index !== -1
        ) {
            data[index]['isUpdate'] = true;
            return this.coursePlanActivitiesService.updateCoursePlanActivities(data[index].id, {
                old_status: 0,
                status: 1,
                accept_edit_id: this.auth.user.id,
                accept_edit_at: this.helperService.stringToDateSql(datetime.toString())
            }).pipe(
                switchMap(() => this.loopUpdatecelo(data, datetime))
            );
        }
        return of(data);
    }

    private loopUpdateStatusQuestions(data: CourseQuestions[], _date: Date, step: number, percent: number): Observable<CourseQuestions[]> {

        const index = data.findIndex(f => !f['_haveUpdate']);
        if (index !== -1
        ) {
            const activity = data[index];
            activity['_haveUpdate'] = true; // đánh dấu đã xử lý

            const newPercent: number = percent + step;
            this.noitifi.loadingAnimationV2({process: {percent: newPercent}});
            return this.courseQuestionsService.updateCourseQuestions(activity.id, {
                old_status: 0,
                status: 1,
                accept_edit_id: this.auth.user.id,
                accept_edit_at: this.helperService.stringToDateSql(_date.toString())
            }).pipe(mergeMap(() => this.loopUpdateStatusQuestions(data, _date, step, newPercent)));

        } else {
            return of(data);
        }
    }
    private loopUpdateStatusKTTXTL(data: CoursePlanActivityTuluan[], _date: Date, step: number, percent: number): Observable<CoursePlanActivityTuluan[]> {

        const index = data.findIndex(f => !f['_haveUpdate']);
        if (index !== -1
        ) {
            const activity = data[index];
            activity['_haveUpdate'] = true; // đánh dấu đã xử lý

            const newPercent: number = percent + step;
            this.noitifi.loadingAnimationV2({process: {percent: newPercent}});
            return this.coursePlanActivityTuluanService.updateCoursePlanActivityTuluan(activity.id, {
                old_status: 0,
                status: 1,
                accept_edit_id: this.auth.user.id,
                accept_edit_at: this.helperService.stringToDateSql(_date.toString())
            }).pipe(mergeMap(() => this.loopUpdateStatusKTTXTL(data, _date, step, newPercent)));

        } else {
            return of(data);
        }
    }
    closeRightForm() {
        this.modalService.dismissAll();
    }

    private collectData(data:any[], type:string):any[]{
        return  data.reduce((acc, item) => {
            return acc.concat(item[type] || []);
        }, []);
    }

}
