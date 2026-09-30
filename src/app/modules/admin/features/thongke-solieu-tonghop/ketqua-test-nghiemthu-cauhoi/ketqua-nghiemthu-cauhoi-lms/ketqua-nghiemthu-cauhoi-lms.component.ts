import { Component, inject, OnInit, signal, TemplateRef, viewChild } from '@angular/core';
import {ButtonModule} from "primeng/button";
import {DialogModule} from "primeng/dialog";
import {MatProgressBarModule} from "@angular/material/progress-bar";
import {CommonModule} from "@angular/common";
import {PaginatorModule} from "primeng/paginator";
import {RippleModule} from "primeng/ripple";
import {SharedModule} from "@shared/shared.module";
import {TableModule} from "primeng/table";
import {ElnKhoaHoc} from "@shared/models/elng-khoa-hoc";
import {CoursePlanActivities} from "@shared/models/course-plan-activities";
import {DonVi} from "@shared/models/don-vi";
import {
    objectFillter
} from "@modules/admin/features/thongke-solieu-tonghop/ketqua-test-sinhvien/ketqua-test-sinhvien.component";
import {ElngUserProfile} from "@shared/models/elng-user-profile";
import {CHUAN_DAU_RA, ROLES} from "@shared/utils/syscat";
import {SelectOptions} from "@modules/admin/features/cauhoi-tracnghiem/models/bank-questions";
import {IctuQuestionType} from "@modules/kiem-thu-ngan-hang-cau-hoi/models/class-tests";
import {AuthService} from "@core/services/auth.service";
import {DonViService} from "@shared/services/don-vi.service";
import {ElnKhoaHocService} from "@shared/services/elearning-khoa-hoc.service";
import {CoursePlanActivitiesService} from "@shared/services/course-plan-activities.service";
import {CourseQuestionsService} from "@shared/services/course-questions.service";
import {NotificationService} from "@core/services/notification.service";
import {HttpParamsHeplerService} from "@core/services/http-params-hepler.service";
import {ClassesService} from "@shared/services/classes.service";
import {ElngUserProfileService} from "@shared/services/elearning-user-profile.service";
import {OvicQueryCondition} from "@core/models/dto";
import {ConditionOption} from "@shared/models/condition-option";
import {forkJoin} from "rxjs";
import {CourseQuestions} from "@shared/models/course-questions";

@Component({
    selector: 'app-ketqua-nghiemthu-cauhoi-lms',
    templateUrl: './ketqua-nghiemthu-cauhoi-lms.component.html',
    styleUrls: ['./ketqua-nghiemthu-cauhoi-lms.component.css'],
    imports: [
        ButtonModule,
        DialogModule,
        MatProgressBarModule,
        CommonModule,
        PaginatorModule,
        RippleModule,
        SharedModule,
        SharedModule,
        TableModule
    ],
    standalone: true
})
export class KetquaNghiemthuCauhoiLmsComponent implements OnInit {

    private auth = inject(AuthService);
    private donViService = inject(DonViService);
    private elnKhoaHocService = inject(ElnKhoaHocService);
    private coursePlanActivitiesService = inject(CoursePlanActivitiesService);
    private courseQuestionsService = inject(CourseQuestionsService);
    private noitifi = inject(NotificationService);
    private httpHelper = inject(HttpParamsHeplerService);
    private classesService = inject(ClassesService);
    private elngUserProfileService = inject(ElngUserProfileService);

    formView = viewChild.required<TemplateRef<any>>('formView');
    formTitle:string= '';

    ds_dotCapnhat: ElnKhoaHoc[];
    list_cdr = signal<ElnKhoaHoc[]>([]);
    dataWeek = signal<CoursePlanActivities[]>([]);
    limitCourse = 20;
    totalCourse = 0;
    donviId: number;
    isManager: boolean;
    list_donvi_chuyenmon: DonVi[] = [];
    listHocky = [];
    listNamhoc = [];

    objectFilter: objectFillter = {
        category_id: 0,
        hocky: 0,
        namhoc: '0',
    };
    user_profile: ElngUserProfile;
    userId: number;
    isLanhDaoKhoa: boolean = false;
    progressValue = 0;
    displayModal = false;
    waitting_title = 'Vui lòng không tắt trình duyệt';
    cdrList = CHUAN_DAU_RA;
    CourseSelect :ElnKhoaHoc;

    private allQuestionType: SelectOptions<IctuQuestionType>[] = [
        { value: 'group-input', label: '[group-input] - Nhóm câu hỏi nhập đáp án', disable: false },
        { value: 'group-radio', label: '[group-radio] - Nhóm câu hỏi chọn đáp án Đúng - Sai', disable: false },
        { value: 'checkbox', label: '[check-box] - Chọn nhiều đáp án đúng', disable: false },
        { value: 'drag_drop', label: '[drag-drop] - Câu hỏi nhóm kéo thả đáp án đúng', disable: false },
        { value: 'radio', label: '[radio] - Chọn 1 đáp án đúng', disable: false },
        { value: 'grouping', label: '[grouping] - Câu hỏi kéo thả đáp án vào cột tương ứng', disable: false },
        { value: 'inputbox', label: '[input-box] - Nhập vào đáp án đúng', disable: false },
        { value: 'reorder_words', label: '[reorder-words] - Sắp xếp lại câu theo thứ tự đúng', disable: false },
        { value: 'matching', label: '[matching] - Matching 2 vế', disable: true }
        // { value : 'selectbox' , label : '[select-box] - Select box' , disable : false } ,
    ];
    constructor(
    ) {
        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin) ;
        if (this.isManager) {
            this.donviId = 105;
        }
        else {
            this.donviId = this.auth.user.donvi_id;
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
        // this.noitifi.isProcessing(true);
        this.displayModal = true;
        this.waitting_title = "Đang tải dữ liệu, vui lòng không tắt trình duyệt";

        if (this.donviId || this.donviId === 0) {
            const condition_courses: ConditionOption = {
                condition: [{
                    conditionName: 'category_ids', condition: OvicQueryCondition.equal, value: this.objectFilter.category_id.toString(), orWhere: "and"

                }, {
                    conditionName: 'id', condition: OvicQueryCondition.notEqualTo, value: '20094', orWhere: "and"

                }],
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
                    // {
                    //     conditionName: 'week',
                    //     condition: OvicQueryCondition.lessThan,
                    //     value: '100'
                    // }
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
                    this.dataWeek.set(dtWeekCoures.data.filter(dt => (dt.week > 0 && dt.week < 13) || dt.week == 100  ));
                    // this.dataWeek = dtWeekCoures.data.filter(dt => dt.week > 0);
                    if (dtKhoaHoc.data.length > 0) {
                        this.loopGetPlanActivities(1, [], dtKhoaHoc.data.map(m => m.id), 1000, dtKhoaHoc.data, this.dataWeek());
                    }
                    else {
                        this.list_cdr.set([]);
                        this.noitifi.isProcessing(false);
                        this.displayModal = false;

                    }
                },
                error: () => this.closeLoadingWithError(),
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
                    { conditionName: 'week', condition: OvicQueryCondition.lessThan, value: '1000', orWhere: 'and' },
                    { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
                    { conditionName: 'type', condition: OvicQueryCondition.equal, value: 'ACTIVITY_CDR', orWhere: 'and' }
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
                error: () => this.closeLoadingWithError(),
            })
        } else {
            dtKhoahoc.map(kh => {
                kh['__plans'] = plan.filter(pl => pl.course_id === kh.id).sort((a, b) => (a.week - b.week));
                return kh;
            });
            this.lopGetCoursesQuestions(1, [], dtKhoahoc.map(m => m.id), 1000, dtKhoahoc, dtWeek);
        }
    }

    lopGetCoursesQuestions(page: number, courses: CourseQuestions[], ids: number[], recordsFiltered: number, dtKhoahoc: ElnKhoaHoc[], dtWeek: CoursePlanActivities[]) {
        if (courses.length < recordsFiltered) {
            this.progressValue = courses.length / recordsFiltered * 100;
            const condition_question: ConditionOption = {
                condition: [
                    { conditionName: 'reference', condition: OvicQueryCondition.equal, value: 'course_plan_activities', orWhere: 'and' },
                    { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' }
                ],
                set: [
                    { label: 'include', value: ids.toString() },
                    { label: 'include_by', value: 'course_id' },
                    { label: 'order', value: 'ASC' },
                    { label: 'orderby', value: 'cdr' },
                    { label: 'limit', value: '500' },
                ],
                page: page.toString()
            }

            this.courseQuestionsService.getCourseQuestionsByPageNew(condition_question).subscribe({
                next: (dataCourses) => {

                    this.lopGetCoursesQuestions(page + 1, courses.concat(dataCourses.data), ids, dataCourses.recordsFiltered, dtKhoahoc, dtWeek);

                },
                error: () => this.closeLoadingWithError(),
            })

        } else {
            this.list_cdr.set(dtKhoahoc.map(m => {
                if (m.av === 1) {
                    const courseQuestionParent  = Array.from(courses).filter(f=>f['group_id']===0).map(parent => {
                        return {...parent,
                            __child: courses.filter(e => e.group_id === parent['id'])}
                    });


                    m['__courses'] = courseQuestionParent.filter(cs => cs.course_id === m.id);
                    m['__total'] = m['__courses'] ? this.getTotalQuestionByChild(m['__courses'].filter(cs=>cs.group_id === 0)) + ' - ' + this.getTotalQuestionByChild(m['__courses']) : 0;


                    m['__textShow'] = this.dataWeek().map(week => {
                        const plansForWeek = m['__plans'].filter(p => p.week === week.week);


                        const course_question = m['__courses'].filter(q =>
                            plansForWeek.filter(p => p.id === q.reference_id).length > 0
                        );
                        const countCoursePass = this.getTotalQuestionByChild(course_question.filter(q => q.status === 0 ),true);
                        const countCourseFail = this.getTotalQuestionByChild(course_question.filter(q => (q.status === -1 || q.status === -2)),true);
                        const countNotAccepted = this.getTotalQuestionByChild(course_question.filter(q => q.status === 1 ),true);

                        const status_question = course_question.length > 0 ? `${countNotAccepted} - ${countCourseFail} | ${countCoursePass} ` : `-`;


                        return status_question;
                    });

                    return m;
                }

                else {
                    const coureseNew = courses.filter(cs => cs.course_id === m.id);
                    m['__courses'] = coureseNew

                    m['__total'] = m['__courses'] ? m['__courses'].filter(cs=>cs.group_id === 0).length + ' - ' + this.countRelatedItems(m['__courses']) : 0;

                    m['__textShow'] = Array.from(this.dataWeek()).map(week => {
                        const plansForWeek = m['__plans'].filter(p => p.week === week.week);
                        const course_question = m['__courses'].filter(q =>
                            plansForWeek.filter(p => p.id === q.reference_id).length > 0
                        );
                        const countCoursePass = course_question.filter(q => q.status === 0 && q.group_id ===0).length;
                        const countCourseFail = course_question.filter(q => (q.status === -1 || q.status === -2) && q.group_id ===0).length;
                        const countNotAccepted = course_question.filter(q => q.status === 1 && q.group_id ===0).length;

                        const status_question = course_question.length > 0 ? `${countNotAccepted} - ${countCourseFail} | ${countCoursePass}` : `-`;

                        return  status_question;
                    });




                    return m;
                }


            }));

            this.displayModal = false;
            this.noitifi.isProcessing(false);
        }
    }

    private closeLoadingWithError(): void {
        this.displayModal = false;
        this.noitifi.toastError('Tải dữ liệu không thành công');
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

    countRelatedItems(arr: any[]):number {
        const groupMap = arr.reduce((map, item) => {
            if (!map[item.ground_id]) {
                map[item.ground_id] = [];
            }
            map[item.ground_id].push(item);
            return map;
        }, {});
        return arr.reduce((total, item) => {
            const children = groupMap[item.id];
            if (children && children.length > 0) {
                return total + children.length;
            } else if (!groupMap[item.ground_id]) {
                return total + 1;
            } else {
                return total + 1;
            }
        }, 0);
    }


    btnselectRows(item:ElnKhoaHoc){
        this.CourseSelect = null;
        // this.CourseSelect = item;
        if(item.av !==1){
            const courseQuestionParent  = item['__courses'].filter(f=>f['group_id']===0 && f['status'] === 1).map(parent => {
                return {...parent,
                    __child: item['__courses'].filter(e => e.group_id === parent['id'])}
            });

            const itemTotal = {
                arr: [],
                title :'Tổng',
                soluong: courseQuestionParent.length + ' - ' + this.getTotalQuestionByChild(courseQuestionParent,true)
            }
            //==========================================
            const totalByCdr = this.cdrList.map(e=>{
                const newArr =  Array.from(courseQuestionParent).filter(cq => cq['cdr'] === e.id );
                const numOfViewByChild = this.getTotalQuestionByChild(newArr, true)
                const numOfView = newArr.length ? newArr.length  + (numOfViewByChild >0 ? ' - ' + numOfViewByChild: '' ) : '-';
                return {arr :newArr.length > 0 ? newArr : [], title:e.label, soluong:numOfView };
            }).slice(0,-2);
            totalByCdr.push(itemTotal)

            //==========================================
            const arrTotalByQuestionType = this.allQuestionType.map((e)=>{
                const  newArr =Array.from(courseQuestionParent).filter(cq => e.value === cq['question_type'] );
                const numOfViewByChild = this.getTotalQuestionByChild(newArr,true)
                const numOfView = newArr.length ? newArr.length  + (numOfViewByChild >0 ? ' - ' + numOfViewByChild: '' ) : '-';
                return {arr :newArr.length > 0 ? newArr : [], title:e.label, soluong:numOfView} }).filter(f=>f.arr.length >0);
            arrTotalByQuestionType.push(itemTotal);
            //==========================================
            const dataWee = Array.from([...this.dataWeek().slice(0,(item.params.sotinchi * 3)),this.dataWeek().find(a=>a.week ==100)]).map(dw=>{
                dw['__cdrList']= this.cdrList.map(e=>{
                    const newArr =  Array.from(courseQuestionParent).filter(cq => cq['cdr'] === e.id && cq['week'] === dw.week);
                    const numOfViewByChild = this.rplTotalAllByChild(newArr,'__child',true)
                    const numOfView = newArr.length ? newArr.length  + (numOfViewByChild >0 ? ' - ' + this.getTotalQuestionByChild(newArr,true): '' ) : '-';
                    return {arr :newArr.length > 0 ? newArr : [], title:e.label, soluong:numOfView};
                })

                dw['__questionType'] = this.allQuestionType.map((e)=>{
                    const  newArr =Array.from(courseQuestionParent).filter(cq => e.value === cq['question_type'] && cq['week'] === dw.week);

                    const numOfViewByChild = this.rplTotalAllByChild(newArr,'__child',true)

                    const numOfView = newArr.length ? newArr.length  + (numOfViewByChild >0 ? ' - ' + this.getTotalQuestionByChild(newArr,true): '' ) : '-';
                    return {arr :newArr.length > 0 ? newArr : [], title:e.label, soluong:numOfView};
                }).filter(f=>f.arr.length > 0);
                return dw
            });
            item['__dataWeek']  = dataWee
            item['__TotalCdrByChild']  = totalByCdr
            item['__TotalQuyestionTypeByChild']  = arrTotalByQuestionType;
            this.CourseSelect = {...item};
        }else{
            const courseQuestionParent  = Array.from(item['__courses'].filter(f=>f.status == 1));
            //==========================================
            const totalByCdr = this.cdrList.map(e=>{
                const newArr =  Array.from(courseQuestionParent).filter(cq => cq['cdr'] === e.id );
                return {arr :newArr.length > 0 ? newArr : [], title:e.label, soluong:newArr.length > 0 ? this.getTotalQuestionByChild(newArr,true) : '-' };
            })
            //==========================================
            const arrTotalByQuestionType = this.allQuestionType.map((e)=>{
                const  newArr =Array.from(courseQuestionParent).filter(cq => e.value === cq['question_type'] );
                return {arr :newArr.length > 0 ? newArr : [], title:e.label, soluong:this.getTotalQuestionByChild(newArr,true)} }).filter(f=>f.soluong !==0);
            //==========================================
            const dataWee = Array.from([...this.dataWeek().slice(0,(item.params.sotinchi * 3)),this.dataWeek().find(a=>a.week ==100)]).map(dw=>{
                dw['__cdrList']= this.cdrList.map(e=>{
                    const newArr =  Array.from(courseQuestionParent).filter(cq => cq['cdr'] === e.id && cq['week'] === dw.week);
                    return {arr :newArr.length > 0 ? newArr : [], title:e.label, soluong:newArr.length > 0 ? this.getTotalQuestionByChild(newArr,true) : '-' };
                })
                dw['__questionType'] = this.allQuestionType.map((e)=>{
                    const  newArr =Array.from(courseQuestionParent).filter(cq => e.value === cq['question_type'] && cq['week'] === dw.week);
                    return {arr :newArr.length > 0 ? newArr : [], title:e.label, soluong:this.getTotalQuestionByChild(newArr,true)};
                }).filter(f=>f.soluong !== 0);
                return dw
            });
            item['__dataWeek']  = dataWee
            item['__TotalCdrByChild']  = totalByCdr.slice(0,-2);
            item['__TotalQuyestionTypeByChild']  = arrTotalByQuestionType
            this.CourseSelect = {...item};
        }
        this.formTitle = item.title;
        this.noitifi.openSideNavigationMenu({template:this.formView(), size: 700, offsetTop: '0px' })
    }
    closeForm(){
        this.noitifi.closeSideNavigationMenu();
    }

    getTotalQuestionByChild(arr :any[], isData?:boolean){
        return  arr.length>0 ? arr.reduce((acc, parent) => {
            const childCount = parent['__child']?.length || 0;
            return acc + (childCount > 0 ? childCount : 1);
        }, 0) : (isData ? 0 : '-');

    }
    rplTotalAllByChild(arr:any[],key?:string, isData?:boolean,isAv?:boolean){
        return  arr.length>0 ? arr.reduce((acc, parent) => {
            const childCount = !isAv ? parent[key]?.length : this.getTotalQuestionByChild(parent[key],true) ;
            return acc + (childCount > 0 ? childCount : 0);
        }, 0) :(isData ? 0 : '-');

    }

}
