import {CourseQuestionsService} from '@modules/shared/services/course-questions.service';
import {Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {CourseThanhvien} from "@shared/models/course_thanhvien";
import {CoursePlanActivities} from "@shared/models/course-plan-activities";
import {CoursePlanActivitiesService} from "@shared/services/course-plan-activities.service";
import {forkJoin, from, mergeMap, Observable, of, switchMap, toArray} from "rxjs";
import {CoursePlanCommentService} from "@shared/services/course-plan-comment.service";
import {map} from "rxjs/operators";
import {NotificationService} from '@core/services/notification.service';
import {ConditionOption} from '@modules/shared/models/condition-option';
import {OvicQueryCondition} from '@core/models/dto';
import {HelperService} from '@core/services/helper.service';
import {ElnKhoaHoc} from '@modules/shared/models/elng-khoa-hoc';
import {BUTTON_NO, BUTTON_YES} from '@core/models/buttons';
import {OvicDateTimeService} from '@modules/shared/services/ovic-date-time.service';
import {AuthService} from '@core/services/auth.service';
import {CommonModule} from '@angular/common';
import {SharedModule} from '@modules/shared/shared.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ROLES} from '@modules/shared/utils/syscat';
import {RippleModule} from "primeng/ripple";
import {ButtonModule} from "primeng/button";
import {TooltipModule} from "primeng/tooltip";
import {CourseQuestions} from "@shared/models/course-questions";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {MatLineModule} from "@angular/material/core";
import {MatListModule} from "@angular/material/list";
import {NORMAL_MODAL_OPTIONS} from "@core/utils/syscat";
import {CheckboxModule} from "primeng/checkbox";
import {key_server} from "@env";
import {ConfigsService} from "@shared/services/configs.service";
import {CourseQuestionCommentService} from "@shared/services/course-question-comment.service";
import {CourseQuestionComment} from "@shared/models/course-question-comment";

@Component({
    standalone: true,
    imports: [CommonModule, SharedModule, FormsModule, ReactiveFormsModule, RippleModule, ButtonModule, TooltipModule, MatLineModule, MatListModule, CheckboxModule],
    selector: 'ket-qua-tham-dinh',
    templateUrl: './ket-qua-tham-dinh.component.html',
    styleUrls: ['./ket-qua-tham-dinh.component.css']
})

export class KetQuaThamDinhComponent implements OnInit, OnChanges {

    @ViewChild('templateDuyetnoidung') templateDuyetnoidung: ElementRef;
    @ViewChild('templateCommentNoidung') templateCommentNoidung: ElementRef;


    @Input() coursePlan: CoursePlanActivities;

    @Input() listThamDInh: CourseThanhvien[];

    @Input() courseSelected: ElnKhoaHoc;

    _coursePlan: CoursePlanActivities;
    _courseThanhVien: CourseThanhvien[];
    selectedCourse: ElnKhoaHoc;
    dataCDR: CoursePlanActivities[] = [];
    dataContentOrther: CoursePlanActivities[] = [];
    headerTable: { label: string, type: string }[] = [];
    headerTableContentOrther: { label: string, type: string }[] = [];
    dataAllContent: CoursePlanActivities[] = [];
    typeShow: "PLAN" | "ALL" = "PLAN";

    lockByContent: boolean = false;// trường hợp khóa 1 cái đang khóa cũng sẽ khóa cả 2 ;
    lockByQuestion: boolean = false; // thao tác này sẽ cho cập nhật || đóng cập nhật với question với tuần hoặc
    questionList: CourseQuestions[];
    question_info = {
        dat: 0,
        lamlai: 0,
        chuadat: 0,
        tong: 0,

    }
    keyServer = key_server;
    rejectRole: boolean = false;
    config_check_hoidong_by_chutich :boolean ;
    isChutichHoidong:boolean = false;
    isThanhvien:boolean = false;
    objectFillterCheckAfterAccept = {
        isNotEdit: false,
        isHaveEdit: false,
        type: null
    }

    courseQuestionComment: CourseQuestionComment[];
    constructor(
        private coursePlanActivitiesService: CoursePlanActivitiesService,
        private coursePlanCommentService: CoursePlanCommentService,
        private noitifi: NotificationService,
        private helperService: HelperService,
        private courseQuestionsService: CourseQuestionsService,
        private ovicDateTimeService: OvicDateTimeService,
        private auth: AuthService,
        private modalService: NgbModal,
        private configsService:ConfigsService,
        private courseQuestionCommentService: CourseQuestionCommentService
    ) {


        this.rejectRole = this.auth.userHasRole(ROLES.chuyenvien_pdt) || this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.lanhdaokhoa) || this.auth.userHasRole(ROLES.lanhdaobomon) ? true : false;
    }

    ngOnChanges(changes: SimpleChanges): void {

        if (changes['coursePlan'] || changes['listThamDInh']) {

            this.question_info = {
                dat: 0,
                lamlai: 0,
                chuadat: 0,
                tong: 0,

            }

            this._coursePlan = this.coursePlan;

            this._courseThanhVien = this.listThamDInh;

            this.isChutichHoidong = !!this.listThamDInh.find(f=>f.user_id == this.auth.user.id && f.vaitro == "CHUTICH") ;
            this.isThanhvien =  !!this._courseThanhVien.find(f=>f.user_id == this.auth.user.id && f.vaitro == "UYVIEN" )

            this.selectedCourse = this.courseSelected;

            this.headerTable = [
                {label: 'CELO', type: ''},
                {label: 'KẾT QUẢ CẤP KHOA', type: ''},
                // {label: 'KẾT QUẢ CẤP TRƯỜNG ', type: ''}
            ]
            this.headerTableContentOrther = [
                {label: 'Nội dung khác', type: ''},
                {label: 'KẾT QUẢ CẤP KHOA', type: ''},
                // {label: 'KẾT QUẢ CẤP TRƯỜNG ', type: ''}
            ]

            if (this._courseThanhVien && this._courseThanhVien.length > 0) {

                this.sapxepThanhVien(this._courseThanhVien);


                this._courseThanhVien.forEach(e => {
                    this.headerTable.push({
                        label: e['display_name'],
                        type: e.vaitro === 'CHUTICH' ? '(Chủ tịch HĐ)' : (e.vaitro === 'UYVIEN' ? '( Ủy viên )' : ''),
                    })
                    this.headerTableContentOrther.push(
                        {
                            label: e['display_name'],
                            type: e.vaitro === 'CHUTICH' ? '(Chủ tịch HĐ)' : (e.vaitro === 'UYVIEN' ? '( Ủy viên )' : ''),
                        }
                    )
                })
            }

            if (this._coursePlan.id === 0) {
                this.loadParent(this._coursePlan)
            } else {
                this.load(this._coursePlan);
            }
        }
    }

    ngOnInit(): void {
        this.dataCDR = [];
        this.dataContentOrther = [];
        this.dataAllContent = [];
    }


    load(item: CoursePlanActivities) {
        this.noitifi.isProcessing(true);

        // const condition_get_cdr: ConditionOption = {
        //     condition: [
        //         { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: item.id.toString() },
        //         { conditionName: 'type', condition: OvicQueryCondition.equal, value: 'ACTIVITY_CDR', orWhere: 'and' },
        //         { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' }
        //     ],
        //     set: [
        //         { label: 'limit', value: '-1' },
        //     ],
        //     page: null
        // }
        const condition_getConfig :ConditionOption= {
            condition:[
                { conditionName:'config_key',condition:OvicQueryCondition.equal,value:'CHECK_DUYET_HOIDONG_BY_CHUTICH'}
            ],
            set:[
                {label:'limit',value:'1'}
            ],
            page:'1'
        }
        const condition_question_comment :ConditionOption= {
            condition:[
                { conditionName:'course_id',condition:OvicQueryCondition.equal,value:this.courseSelected.id.toString()},
                { conditionName:'parent_id',condition:OvicQueryCondition.equal,value:'0'},
                { conditionName:'user_id',condition:OvicQueryCondition.equal,value:this.auth.user.id.toString()}

            ],
            set:[
                {label:'limit',value:'-1'}
            ],
            page:'1'
        }


        forkJoin([
            this.coursePlanActivitiesService.getCoursePlanActivitiesByparendIdAndType(item.id,).pipe(mergeMap(_res => {
                const reference_ids = [];
                _res.forEach(f => {
                    if (f.type === 'ACTIVITY_CDR')
                        reference_ids.push(f.id);
                })

                if (reference_ids.length) {
                    const condition_question: ConditionOption = {
                        condition: [
                            {
                                conditionName: 'course_id',
                                condition: OvicQueryCondition.equal,
                                value: item.course_id.toString()
                            },
                            {
                                conditionName: 'reference',
                                condition: OvicQueryCondition.equal,
                                value: 'course_plan_activities',
                                orWhere: 'and'
                            },
                            {
                                conditionName: 'status',
                                condition: OvicQueryCondition.notEqual,
                                value: '-3',
                                orWhere: 'and'
                            }
                            // { conditionName: 'group_id', condition: this.selectedCourse.av === 0 ? OvicQueryCondition.equal : OvicQueryCondition.notEqual, value: '0', orWhere: 'and' },
                        ],

                        set: [
                            {label: 'limit', value: '-1'},
                            {label: 'include', value: reference_ids.toString()},
                            {label: 'include_by', value: 'reference_id'}
                        ],

                        page: null
                    }

                    return this.courseQuestionsService.getCourseQuestionsByPageNew(condition_question).pipe(mergeMap(_question => {
                        // if ( this.selectedCourse.av !== 1 ) {

                        condition_question_comment.condition.push({
                            conditionName:'course_question_id',
                            value: Array.from(_question.data.filter(m => m.group_id === 0)).map(m=>m.id).toString(),
                            condition:OvicQueryCondition.equal,
                            orWhere:'in'
                        })
                        this.questionList = _question.data.filter(m => m.group_id === 0);

                        this.lockByQuestion = Array.from(this.questionList).map(a => a.status).every(status => status === 0);

                        this.question_info.tong = _question.data.filter(m => m.group_id === 0).length;
                        this.question_info.chuadat = _question.data.filter(m => m.group_id === 0 && (m.status === 0 || m.status === -2)).length;
                        this.question_info.dat = _question.data.filter(m => m.group_id === 0 && m.status === 1).length;
                        this.question_info.lamlai = _question.data.filter(m => m.group_id === 0 && m.status === -1).length;
                        // } else {
                        //     this.question_info.tong = _question
                        // }

                        return forkJoin([
                            of(_res),
                            this.courseQuestionCommentService.getCourseQuestionCommentByPageNew(condition_question_comment).pipe(map(m=>m.data))
                        ]);

                    }))
                } else {
                    return forkJoin([of(_res),of([])]) ;
                }
            })),
            this.coursePlanCommentService.getCoursePlanCommentByCourse_idAndCourse_plan_activity_id(item.course_id, item.id),
            this.configsService.getConfigsByPageNew(condition_getConfig).pipe(map(m=>m.data[0])),
            // this.courseQuestionCommentService.getCourseQuestionCommentByPageNew(condition_question_comment).pipe(map(m=>m.data))
            // this.courseQuestionsService.getCourseQuestionsByPageNew(condition_question)
        ]).subscribe({
            next: ([[activity,questionConments], comment,config, ]) => {
                this.courseQuestionComment = questionConments;
                this.config_check_hoidong_by_chutich =config['params']['check']

                const dataActivity = activity ? activity.map(m => {
                    m['_status_class'] = m.status === 1 ? 'Dat' : (m.status === 0 ? 'choduyet' : (m.status === -1 ? 'chuadat' : ''))
                    m['_status_label'] = m.status === 1 ? 'Đạt' : (m.status === 0 ? ' Chờ duyệt ' : (m.status === -1 ? ' Chưa đạt' : '_'));
                    m['_status_class'] = m.status === -2 ? 'dasua' : m['_status_class'];
                    m['_status_label'] = m.status === -2 ? 'Đã sửa' : m['_status_label'];

                    m['_comment'] = Array.from(comment).filter(i => i.course_plan_activity_id === m.id || i.course_plan_activity_id === m.course_plan_activity_id);
                    const _comment_cdr = comment.filter(i => i.course_plan_activity_id === m.id || i.course_plan_activity_id === m.course_plan_activity_id);

                    this._courseThanhVien.sort((a, b) => {
                        if (a.vaitro === "CHUTICH" && b.vaitro !== "CHUTICH") {
                            return -1;
                        }
                        if (a.vaitro !== "CHUTICH" && b.vaitro === "CHUTICH") {
                            return 1;
                        }
                        return 0;
                    }).forEach(a => {
                        m[a.vaitro + a.user_id] = _comment_cdr.findIndex(i => i.user_id === a.user_id) !== -1 ? 'Đã nhận xét' : 'Chưa nhận xét';
                        m[(a.vaitro + a.user_id).concat('_class')] = _comment_cdr.findIndex(i => i.user_id === a.user_id) !== -1 ? 'danhanxet' : 'chuanhanxet';
                    })

                    m['stt'] = m.kyhieu ? m.kyhieu.replace(/\D/g, '') : 0;

                    return m;
                }) : [];
                const data_cdr = dataActivity && dataActivity.length ? dataActivity.filter(f => f.type === "ACTIVITY_CDR") : [];
                this.dataCDR = this.helperService.sort(data_cdr, 'stt');
                this.dataContentOrther = dataActivity && dataActivity.length ? dataActivity.filter(f => f.type === "MUCTIEU" || f.type === "ACTIVITY") : [];

                this.lockByContent = Array.from(this.dataContentOrther).map(a => a.status).every(status => status === 0);
                this.noitifi.isProcessing(false);
            }, error: (e) => {
                this.dataCDR = [];
                this.dataContentOrther = [];
                this.noitifi.isProcessing(false);
                this.noitifi.toastError("Lỗi kết nối, vui lòng thử lại");
            }
        })

    }

    sapxepThanhVien(data: CourseThanhvien[]): CourseThanhvien[] {
        return data.sort((a, b) => {
            if (a.vaitro === "CHUTICH" && b.vaitro !== "CHUTICH") {
                return -1;
            }
            if (a.vaitro !== "CHUTICH" && b.vaitro === "CHUTICH") {
                return 1;
            }
            return 0;
        })
    }

    loadParent(item: CoursePlanActivities): void {
        this.noitifi.isProcessing(true);
        this.coursePlanActivitiesService.getCoursePlanActivityBycourseId(item.course_id, item.type).pipe(
            mergeMap(m => from(m).pipe(
                mergeMap(a => this.getDataActivity(a)),
                toArray()
            ))
        ).subscribe({
            next: (data) => {
                this.dataAllContent = data.sort((a, b) => (a.week - b.week)).map(m => {
                    const child = m['__data'];
                    const cdr = child.length > 0 ? child.filter(f => f.type === 'ACTIVITY_CDR') : [];
                    const muctieu = child.length > 0 ? child.filter(f => f.type === 'MUCTIEU') : [];
                    const tailieu = child.length > 0 ? child.filter(f => f.type === 'ACTIVITY') : [];
                    const baitap = child.length > 0 ? child.filter(f => f.type === 'ACTIVITY_TEST') : [];
                    m['_cdr'] = cdr && cdr.length > 0 ? (cdr.filter(a => a.status === 1).length === cdr.length ? ' Đạt ' : (cdr.filter(a => a.status === 1).length + '/' + cdr.length)) : '-';
                    m['_cdr_class'] = cdr && cdr.length > 0 ? (cdr.filter(a => a.status === 1).length === cdr.length ? ' DAT ' : '') : '';

                    m['_muctieu'] = '-' //muctieu && muctieu.length > 0 ? (muctieu.filter(a => a.status === 1).length === muctieu.length ? ' Đạt ' : (muctieu.filter(a => a.status === 1).length + '/' + muctieu.length)) : '-';
                    m['_muctieu_class'] = muctieu && muctieu.length > 0 ? (muctieu.filter(a => a.status === 1).length === muctieu.length ? ' DAT ' : '') : '';

                    m['_tailieu'] = '-' // tailieu && tailieu.length > 0 ? (tailieu.filter(a => a.status === 1).length === tailieu.length ? ' Đạt ' : (tailieu.filter(a => a.status === 1).length + '/' + tailieu.length)) : '-';
                    m['_tailieu_class'] = tailieu && tailieu.length > 0 ? (tailieu.filter(a => a.status === 1).length === tailieu.length ? ' DAT ' : '') : '';

                    m['_baitap'] = '-' // baitap && baitap.length > 0 ? (baitap.filter(a => a.status === 1).length === baitap.length ? ' Đạt ' : (baitap.filter(a => a.status === 1).length + '/' + baitap.length)) : '-';
                    m['_baitap_class'] = baitap && baitap.length > 0 ? (baitap.filter(a => a.status === 1).length === baitap.length ? ' DAT ' : '') : '';

                    return m;
                })
                this.noitifi.isProcessing(false);
            },
            error: (err) => {
                this.dataAllContent = [];
                this.noitifi.isProcessing(false);
            }
        });
    }

    private getDataActivity(item: CoursePlanActivities): Observable<CoursePlanActivities> {
        return this.coursePlanActivitiesService.getCoursePlanActivitiesByparendIdAndType(item.id,).pipe(
            map(m => {
                item['__data'] = m.filter(f => f.type === "MUCTIEU" || f.type === "ACTIVITY" || f.type === "ACTIVITY_TEST" || f.type === 'ACTIVITY_CDR');
                return item;
            })
        );
    }

    huyTrangThai(activity: CoursePlanActivities, status: number) {
        // this.noitifi.confirm( '<div class="alert-duyetnoidung">' +
        //     '<span>- Bạn đang thực hiện thao tác đưa nội dung về trạng thái chờ duyệt</span>' +
        //     '<span>- Bạn có chắc chắn thực hiện thao tác này?</span>' +
        //     '</div>', 'Xác nhận hành động', [ BUTTON_YES, BUTTON_NO ] ).then( a => {
        //         if ( a.name === 'yes' ) {

        //         }
        //     } )

        if (status === 1 && activity.old_status !== 1) {
            return this.noitifi.toastWarning("Nội dung này chưa từng được duyệt, không thể khóa");
        }

        this.noitifi.isProcessing(true);
        this.ovicDateTimeService.getCurrentDateTime().pipe(mergeMap(_date => {
            return this.coursePlanActivitiesService.updateCoursePlanActivities(activity.id, {
                old_status: activity.status,
                status: status,
                accept_edit_id: this.auth.user.id,
                accept_edit_at: this.helperService.stringToDateSql(_date.toString())
            }).pipe(mergeMap(() => {
                return of(null);
            }))
        })).subscribe({
            next: () => {
                this.load(this._coursePlan);
                this.noitifi.isProcessing(false);
                this.noitifi.toastSuccess('Cập nhật thành công');
            },
            error: () => {
                this.noitifi.isProcessing(false);
                this.noitifi.toastError('Cập nhật thất bại, Lỗi kết nối');
            }
        })
    }

    // reDoStatus ( activity ) {
    //     this.noitifi.isProcessing( true );
    //     this.ovicDateTimeService.getCurrentDateTime().pipe( mergeMap( _date => {
    //         return this.coursePlanActivitiesService.updateCoursePlanActivities( activity.id, { old_status: activity.status, status: 1, accept_edit_id: this.auth.user.id, accept_edit_at: this.helperService.stringToDateSql( _date.toString() ) } ).pipe( mergeMap( () => {
    //             return of( null );
    //         } ) )
    //     } ) ).subscribe( {
    //         next: () => {
    //             this.load( this._coursePlan );
    //             this.noitifi.isProcessing( false );
    //             this.noitifi.toastSuccess( 'Cập nhật thành công' );
    //         },
    //         error: () => {
    //             this.noitifi.isProcessing( false );
    //             this.noitifi.toastError( 'Cập nhật thất bại, Lỗi kết nối' );
    //         }
    //     } )
    // }

    //1: khóa, 0 mở khóa
    async btnUpdateLockByContent(type: 1 | 0) {

        const dataContentMap = this.dataContentOrther.filter(f => f.status >= 0 && f.status !== type);

        if (dataContentMap.length > 0) {
            this.noitifi.isProcessing(true);
            this.loopUpdateStatus(dataContentMap, type).subscribe({
                next: () => {
                    this.load(this._coursePlan);
                    this.noitifi.isProcessing(false);
                    this.noitifi.toastSuccess('Cập nhật thành công');
                }, error: () => {
                    this.noitifi.isProcessing(false);
                    this.noitifi.toastError('Cập nhật thất bại, Lỗi kết nối');
                }
            })

        } else {
            this.noitifi.toastWarning(type == 1 ? 'Không có nội dung nào đang mở khóa' : 'Không có nội dung nào đang bị khóa');
        }
    }

    private loopUpdateStatus(data: any[], status: number) {
        // const index = data.findIndex(i => !i['isCreated']);
        // if (index !== -1) {
        const index = data.findIndex(f => !f['_haveUpdate']);
        if (index !== -1) {
            const activity = data[index];
            data[index]['_haveUpdate'] = true; // đánh dấu đã xử lý

            if (status === 1 && activity.old_status !== 1) {
                return this.loopUpdateStatus(data, status);
            }
            return this.ovicDateTimeService.getCurrentDateTime().pipe(
                mergeMap(_date =>
                    this.coursePlanActivitiesService.updateCoursePlanActivities(activity.id, {
                        old_status: activity.status,
                        status: status,
                        accept_edit_id: this.auth.user.id,
                        accept_edit_at: this.helperService.stringToDateSql(_date.toString())
                    })
                ),
                mergeMap(() => this.loopUpdateStatus(data, status))
            );
        } else {
            return of(data);
        }
    }

    // btnUpdateLockByQuestion(type: 1 | 0){
    // const dataContentMap = Array.from(this.questionList).filter(f=>f.status >= 0 && f.status !== type);
    //
    // if (dataContentMap.length>0 ) {
    //     this.noitifi.isProcessing(true);
    //
    //     const step: number = 100 / dataContentMap.length;
    //     this.noitifi.isProcessing(true);
    //     this.noitifi.loadingAnimationV2({process: {percent: 0}});
    //     this.ovicDateTimeService.getCurrentDateTime().pipe(
    //         mergeMap(date=> this.loopUpdateStatusQuestions(dataContentMap, type, date,step,0))).subscribe({
    //         next: () => {
    //             this.load(this._coursePlan);
    //             this.noitifi.isProcessing(false);
    //             this.noitifi.disableLoadingAnimationV2()
    //             this.noitifi.toastSuccess('Cập nhật thành công');
    //         }, error: () => {
    //             this.noitifi.isProcessing(false);
    //             this.noitifi.disableLoadingAnimationV2()
    //
    //             this.noitifi.toastError('Cập nhật thất bại, Lỗi kết nối');
    //         }
    //     })
    //
    // }else{
    //     this.noitifi.toastWarning(type == 1 ? 'Không có câu hỏi nào đang mở khóa' : 'Không có câu hỏi nào đang bị khóa');
    // }


    //     const dataContentMap = Array.from(this.questionList).filter(f => f.status >= 0 && f.status !== type);
    //     if (dataContentMap.length > 0) {
    //         this.noitifi.isProcessing(true);
    //         console.log(this.dataCDR);
    //         const step: number = 100 / dataContentMap.length;
    //         this.noitifi.loadingAnimationV2({ process: { percent: 0 } });
    //         const condition_question: ConditionOption = {
    //             condition: [
    //                 { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse.id.toString() },
    //                 { conditionName: 'reference', condition: OvicQueryCondition.equal, value: 'course_plan_activities', orWhere: 'and' },
    //                 { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
    //             ],
    //             set: [
    //                 { label: 'limit', value: '-1' },
    //                 { label: 'include', value: [...new Set(this.dataCDR.map(m=>m.id))].toString() },
    //                 { label: 'include_by', value: 'reference_id' },
    //                 { label: 'order', value: 'ASC' },
    //                 { label: 'orderby', value: 'cdr' }
    //             ],
    //             page: null
    //         }
    //
    //         // return this.courseQuestionsService.getCourseQuestionsByPageNew(condition_question)
    //
    //         forkJoin([
    //             this.ovicDateTimeService.getCurrentDateTime(),
    //             this.courseQuestionsService.getCourseQuestionsByPageNew(condition_question)
    //         ]).pipe(
    //
    //             mergeMap(dataNew => {
    //
    //                 const dataContentMapNew = Array.from(dataNew[1]['data']).filter(f => f.status >= 0 && f.status !== type);
    //
    //                 return this.loopUpdateStatusQuestions(dataContentMapNew, type, dataNew[0], step, 0)
    //             })).subscribe({
    //             next: () => {
    //                 // this.load(this._coursePlan);
    //                 this.load(this._coursePlan);
    //                 this.noitifi.disableLoadingAnimationV2()
    //                 this.noitifi.isProcessing(false);
    //                 this.noitifi.toastSuccess('Cập nhật thành công');
    //             }, error: () => {
    //                 this.noitifi.isProcessing(false);
    //                 this.noitifi.disableLoadingAnimationV2()
    //
    //                 this.noitifi.toastError('Cập nhật thất bại, Lỗi kết nối');
    //             }
    //         })
    //
    //     } else {
    //         this.noitifi.toastWarning(type == 1 ? 'Không có câu hỏi nào đang mở khóa' : 'Không có đề nào đang bị khóa');
    //     }
    // }
    //
    // private loopUpdateStatusQuestions(data: any[], status: number,_date:any,step: number, percent: number) {
    //
    //     const index = data.findIndex(f => !f['_haveUpdate']);
    //     if (index !== -1) {
    //         const activity = data[index];
    //         activity['_haveUpdate'] = true; // đánh dấu đã xử lý
    //
    //         const newPercent: number = percent + step;
    //         this.noitifi.loadingAnimationV2({process: {percent: newPercent}});
    //         if (status === 1 && activity.old_status !== 1) {
    //             return this.loopUpdateStatusQuestions(data, status,_date,step,newPercent);
    //         }
    //         return this.courseQuestionsService.updateCourseQuestions(activity.id, {
    //             old_status: activity.status,
    //             status: status,
    //             accept_edit_id: this.auth.user.id,
    //             accept_edit_at: this.helperService.stringToDateSql(_date.toString())
    //         }).pipe(mergeMap(() => this.loopUpdateStatusQuestions(data, status,_date,step,newPercent)));
    //
    //     } else {
    //         return of(data);
    //     }
    // }

    closeRightForm() {
        this.modalService.dismissAll();
    }

    titleTemplace: string = null;

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




    btnViewFormDuyet(type: string) {
        this.objectFillterCheckAfterAccept = {
            isNotEdit: false,
            isHaveEdit: false,
            type: type
        }
        this.titleTemplace = type == 'celo' ? 'Duyệt Tất cả nội dung CELO' : (type == 'question' ? 'Duyệt Tất cả câu hỏi' : (type == 'other' ? 'Duyệt nội dung khác' : ''));
        this.modalService.open(this.templateDuyetnoidung, NORMAL_MODAL_OPTIONS)

    }

    async btnDuyet() {
        if (!this.objectFillterCheckAfterAccept.isHaveEdit && !this.objectFillterCheckAfterAccept.isNotEdit) {
            return this.noitifi.toastWarning('Thầy cô giảng viên vui lòng chọn ít nhất 1 trong các phương án trên');
        }

        if (this.objectFillterCheckAfterAccept.type == 'celo') {
            const newdataCDR = Array.from(this.dataCDR)
            const newdataCDRNotEdit = newdataCDR.filter(f => f.status == 0 && f.old_status == 0)
            const newdataCDRHaveEdit = [...newdataCDR.filter(f => f.status == 0 && f.old_status !== 0), ...newdataCDR.filter(f => f.status == -2 && f.old_status !== 0)]

            let html = `
            `;
            let arr: any[] = [];
            if (this.objectFillterCheckAfterAccept.isNotEdit) {
                html += `<p class="m-0">- Xác nhận duyệt với những nội dung không yêu cầu sửa</p>`
                arr = [...arr, ...newdataCDRNotEdit];
            }
            if (this.objectFillterCheckAfterAccept.isHaveEdit) {
                html += `<p class="m-0">- Xác nhận duyệt với những nội dung yêu cầu sửa</p>`;
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
                        this.load(this._coursePlan);
                    }, error: () => {
                        this.noitifi.isProcessing(false);
                        this.noitifi.toastError('Duyệt không thành công')
                        this.modalService.dismissAll();

                    }
                })
            }

        } else if (this.objectFillterCheckAfterAccept.type == 'other') {
            const newdataContentOther = Array.from(this.dataContentOrther);
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
                        this.load(this._coursePlan);
                    }, error: () => {
                        this.noitifi.isProcessing(false);
                        this.noitifi.toastError('Duyệt không thành công')
                        this.modalService.dismissAll();
                    }
                })
            }
        } else if (this.objectFillterCheckAfterAccept.type == 'question') {
            const newdataQuestion = Array.from(this.questionList)
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
                            this.load(this._coursePlan);
                        },
                        error: () => {
                            this.noitifi.isProcessing(false);
                            this.noitifi.toastError('Duyệt không thành công')
                            this.modalService.dismissAll();
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
    // ----------------------------- duyệt coment--------------

    objectTypeAddComment : {
        type:string;
        data:any[];

    };
    btnViewFormComment(type: string) {




        if(!this._courseThanhVien.find(f=>f.user_id == this.auth.user.id)){
            return this.noitifi.toastError('Giảng viên không ở trong hội đồng môn này');
        }

        if(type == 'celo'){

            const dataNotduyet = Array.from(this.dataCDR).filter(f=>f.status == 0 && f.old_status !==1 );
            let listUpdate = [];
            dataNotduyet.forEach(f=>{
                const itemByCdr =f['_comment'].length > 0 ? f['_comment'].filter(a=>a.user_id == this.auth.user.id) : [];
                if(itemByCdr.length == 0){
                    listUpdate.push({
                        course_plan_activity_id:f.id,
                        cap_hoidong:this._courseThanhVien.find(f=>f.user_id == this.auth.user.id) ? this._courseThanhVien.find(f=>f.user_id == this.auth.user.id).cap_hoidong :'cap_khoa',
                        user_id: this.auth.user.id,
                        parent_id:0,
                        course_id:this.courseSelected.id
                    })
                }
            })
            this.objectTypeAddComment = {
                type : type,
                data : listUpdate
            };
            if(dataNotduyet.length ==0){
                return this.noitifi.toastWarning('Tất cả nội dung Cây CELO đã được xét duyệt');
            }else{
                if(listUpdate.length == 0){
                    return this.noitifi.toastWarning('Nội dung này giảng viên đã được nhận xét');
                }
            }

        }else if(type == 'other'){
            const dataNotduyet = Array.from(this.dataContentOrther).filter(f=>f.status == 0 && f.old_status !==1 );
            let listUpdate = [];
            dataNotduyet.forEach(f=>{
                const itemByCdr =f['_comment'] && f['_comment'].length > 0 ? f['_comment'].filter(a=>a.user_id == this.auth.user.id) : [];
                if(itemByCdr.length == 0){
                    listUpdate.push({
                        course_plan_activity_id:f.id,
                        cap_hoidong:this._courseThanhVien.find(f=>f.user_id == this.auth.user.id) ? this._courseThanhVien.find(f=>f.user_id == this.auth.user.id).cap_hoidong :'cap_khoa',
                        user_id: this.auth.user.id,
                        parent_id:0,
                        course_id:this.courseSelected.id
                    })
                }
            })
            this.objectTypeAddComment = {
                type : type,
                data : listUpdate
            };
            if(dataNotduyet.length ==0){
                return this.noitifi.toastWarning('Tất cả nội dung khác đã được xét duyệt');
            }else{
                if(listUpdate.length == 0){
                    return this.noitifi.toastWarning('Nội dung này giảng viên đã được nhận xét');
                }
            }

        }else if(type == 'question'){

            const dataNotduyet = Array.from(this.questionList).filter(f=>f.status == 0 && f.old_status ==0 );
            let listUpdate = [];
            dataNotduyet.forEach(f=>{
                const itemByCdr = f['_comment'] && f['_comment'].length > 0 ? f['_comment'].filter(a=>a.user_id == this.auth.user.id) : [];
                if(itemByCdr.length == 0){
                    listUpdate.push({
                        course_question_id:f.id,
                        cap_hoidong:this._courseThanhVien.find(f=>f.user_id == this.auth.user.id) ? this._courseThanhVien.find(f=>f.user_id == this.auth.user.id).cap_hoidong :'cap_khoa',
                        user_id: this.auth.user.id,
                        parent_id:0,
                        course_id:this.courseSelected.id
                    })
                }
            })
            this.objectTypeAddComment = {
                type : type,
                data : listUpdate
            };
            if(dataNotduyet.length ==0){
                return this.noitifi.toastWarning('Tất cả câu hỏi trắc nghiệm đã được xét duyệt');
            }else{
                if(listUpdate.length == 0){
                    return this.noitifi.toastWarning('Nội dung này giảng viên đã được nhận xét');
                }
            }

        }


        this.titleTemplace = type == 'celo' ? 'Nhận xét tất cả nội dung CELO theo bài' : (type == 'question' ? 'Nhận xét tất cả câu hỏi theo bài' : (type == 'other' ? 'Nhận xét tất cả nội dung khác' : ''));
        this.modalService.open(this.templateCommentNoidung, NORMAL_MODAL_OPTIONS)
    }

    async btnDuyetComment(type:1 |-1){
        if(['celo','other'].includes(this.objectTypeAddComment.type)){
            const html = `Thao tác này sẽ ` + `<strong>${type == 1 ? 'Đồng ý duyệt ' :' Yêu cầu sửa ' }</strong>` + `nhận xét các nội dung ?`
            const btn = await this.noitifi.confirmRounded(html,'Thông báo',[BUTTON_YES,BUTTON_NO]);
            if(btn.name == 'yes'){
                this.noitifi.isProcessing(true)
                this.loopAddCommentByCdrOrOther(this.objectTypeAddComment.data,type).subscribe({
                    next:()=>{
                        this.noitifi.isProcessing(false);
                        this.noitifi.toastSuccess('Thao tác thành công');
                        this.load(this._coursePlan);
                        this.modalService.dismissAll();
                    },error:()=>{
                        this.noitifi.isProcessing(false);
                        this.noitifi.toastError('Thao tác không thành công');
                        this.modalService.dismissAll();

                    }
                })
            }

        }else{

            const html = `Thao tác này sẽ ` + `<strong>${type == 1 ? 'duyệt' :'Yêu cầu sửa' }</strong>` + `nhận xét các nội dung ?`
            const btn = await this.noitifi.confirmRounded(html,'Thông báo',[BUTTON_YES,BUTTON_NO]);
            if(btn.name == 'yes'){
                this.noitifi.isProcessing(true)
                this.loopAddCommentByQuestion(this.objectTypeAddComment.data,type).subscribe({
                    next:()=>{
                        this.noitifi.isProcessing(false);
                        this.noitifi.toastSuccess('Thao tác thành công');
                        this.modalService.dismissAll();

                        this.load(this._coursePlan);
                    },error:()=>{
                        this.noitifi.isProcessing(false);
                        this.noitifi.toastError('Thao tác không thành công');
                        this.modalService.dismissAll();

                    }
                })
            }
        }
    }

    private loopAddCommentByCdrOrOther( data:any[],type:1|-1):Observable<any[]>{
        const index = data.findIndex(f=>!f['isAdd']);
        if(index !== -1){

            const item = {
                ... data[index],
                status:type,
                comment: type == 1? 'Đồng ý duyệt':"Yêu cầu sửa",
            }
            return  this.coursePlanCommentService.addCoursePlanComment(item).pipe(switchMap(m=>{
                data[index]['isAdd'] = true;
                return this.loopAddCommentByCdrOrOther(data, type)
            }))
        }else{
            return of(data);
        }
    }

    private loopAddCommentByQuestion( data:any[],type:1|-1):Observable<any[]>{
        const index = data.findIndex(f=>!f['isAdd']);
        if(index !== -1){

            const item = {
                ... data[index],
                status:type,
                comment: type == 1? 'Đồng ý duyệt':"Yêu cầu sửa",
            }
            return  this.courseQuestionCommentService.addCourseQuestionComment(item).pipe(switchMap(m=>{
                data[index]['isAdd'] = true;
                return this.loopAddCommentByQuestion(data, type)
            }))
        }else{
            return of(data);
        }
    }
}
