import { Component, inject, OnInit, signal } from '@angular/core';
import {DialogModule} from "primeng/dialog";
import {MatProgressBarModule} from "@angular/material/progress-bar";
import {CommonModule} from "@angular/common";
import {PaginatorModule} from "primeng/paginator";
import {SharedModule} from "@shared/shared.module";
import {TableModule} from "primeng/table";
import {ElnKhoaHocService} from "@shared/services/elearning-khoa-hoc.service";
import {NotificationService} from "@core/services/notification.service";
import {
    objectFillter
} from "@modules/admin/features/thongke-solieu-tonghop/ketqua-test-sinhvien/ketqua-test-sinhvien.component";
import {DonVi} from "@shared/models/don-vi";
import {CHUAN_DAU_RA, ROLES} from "@shared/utils/syscat";
import {AuthService} from "@core/services/auth.service";
import {OvicQueryCondition} from "@core/models/dto";
import {ConditionOption} from "@shared/models/condition-option";
import {forkJoin} from "rxjs";
import {DonViService} from "@shared/services/don-vi.service";
import {CoursePlanActivitiesService} from "@shared/services/course-plan-activities.service";
import {CourseQuestionsService} from "@shared/services/course-questions.service";
import {HttpParamsHeplerService} from "@core/services/http-params-hepler.service";
import {ClassesService} from "@shared/services/classes.service";
import {ElngUserProfileService} from "@shared/services/elearning-user-profile.service";
import {ElnKhoaHoc} from "@shared/models/elng-khoa-hoc";
import {CoursePlanActivities} from "@shared/models/course-plan-activities";
import {ElngUserProfile} from "@shared/models/elng-user-profile";
import {SelectOptions} from "@modules/admin/features/cauhoi-tracnghiem/models/bank-questions";
import {IctuQuestionType} from "@modules/kiem-thu-ngan-hang-cau-hoi/models/class-tests";
import {ButtonModule} from "primeng/button";
import {RippleModule} from "primeng/ripple";
import {ExpExcelBaocaoService} from "@shared/services/exp-excel-baocao.service";



@Component({
    selector: 'app-ketqua-nghiemthu-cauhoi-hvu',
    templateUrl: './ketqua-nghiemthu-cauhoi-hvu.component.html',
    styleUrls: ['./ketqua-nghiemthu-cauhoi-hvu.component.css'],
    imports: [
        DialogModule,
        MatProgressBarModule,
        CommonModule,
        PaginatorModule,
        TableModule,
        SharedModule,
        ButtonModule,
        RippleModule

    ],
    standalone: true
})
export class KetquaNghiemthuCauhoiHvuComponent implements OnInit {

    private auth = inject(AuthService);
    private donViService = inject(DonViService);
    private elnKhoaHocService = inject(ElnKhoaHocService);
    private noitifi = inject(NotificationService);
    private httpHelper = inject(HttpParamsHeplerService);
    private classesService = inject(ClassesService);
    private elngUserProfileService = inject(ElngUserProfileService);
    private expExcelBaocaoService = inject(ExpExcelBaocaoService);


    formTitle:string= '';

    ds_dotCapnhat: ElnKhoaHoc[];

    listData = signal<ElnKhoaHoc[]>([]);
    listDataClone = signal<ElnKhoaHoc[]>([]);

    dataWeek: {label:string,value:number}[] = [
        {label:'Bài 1' , value:1},
        {label:'Bài 2' , value:2},
        {label:'Bài 3' , value:3},
        {label:'Bài 4' , value:4},
        {label:'Bài 5' , value:5},
        {label:'Bài 6' , value:6},
        {label:'Bài 7' , value:7},
        {label:'Bài 8' , value:8},
        {label:'Bài 9' , value:9},
        {label:'Bài 10' , value:10},
        {label:'Bài 11' , value:11},
        {label:'Bài 12' , value:12},
        {label:'KTHP',  value:100},
    ];
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
  ) { }

  ngOnInit(): void {

      this.userId = this.auth.user.id;
      this.donviId = this.auth.user.donvi_id;
      this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin);
      this.isLanhDaoKhoa = this.auth.userHasRole(ROLES.lanhdaokhoa);
      // this.noitifi.isProcessing(true);
      this.initData();
  }

    initData(){

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


                    this.objectFilter.dot_capnhat = _dot_capnhat.data ? _dot_capnhat.data[_dot_capnhat.data.length - 1].dot_capnhat : null;
                    this.loadData();
                    // this.noitifi.isProcessing(false);


                },
                error: () => { this.noitifi.isProcessing(false); this.noitifi.toastError("Lỗi kết nối"); }
            })

    }

    loadData(){

      this.noitifi.isProcessing(true);
        this.elnKhoaHocService.getTotalQuestion({dot_capnhat: this.objectFilter['dot_capnhat']}).subscribe({
            next:(a)=>{
                this.listDataClone.set(a.length> 0 ? a.map(m=>{
                    m['__total'] =m['data_week'] ? Object.values(m['data_week']).reduce(
                        (sum: number, value: any) => sum + Number(value),
                        0
                    ) : 0;

                    m['__categoris_name'] = this.list_donvi_chuyenmon.find(f=>f.id == m.category_ids) ? this.list_donvi_chuyenmon.find(f=>f.id == m.category_ids).title : '';
                    return m;
                }): []);

                this.listData.set(this.listDataClone());
                this.noitifi.isProcessing(false);
            },
            error:()=>{
                this.noitifi.isProcessing(false);
                this.noitifi.toastError('Tải dữ liệu không thành công');
            }
        })

    }



    onChangeDonviCM(event) {
        // console.log(event);
        if (event) {
            this.objectFilter.category_id = event['id'];
            this.listData.set(this.listDataClone().filter(f=>f.category_ids == event['id'])) ;
        } else {
            this.objectFilter.category_id = null;
            this.listData.set([...this.listDataClone()]);
        }

    }

    onChangeFilter(event, keyName: string) {
        if (event) {
            this.objectFilter[keyName] = event['dot_capnhat'];
        } else {
            this.objectFilter[keyName] = null;
        }
        this.loadData();

    }
    btnExport(){
      if(this.objectFilter.dot_capnhat == null){
          return this.noitifi.toastWarning('Vui lòng chọn đợt cập nhật')
      }

      this.noitifi.loadingAnimationV2({process:{percent:0}});
        this.elnKhoaHocService.getTotalQuestion({dot_capnhat:this.objectFilter.dot_capnhat}).subscribe({
            next:(a)=>{
                const dataExport = a.length> 0 ? a.map((m,index)=>{
                    m['__total'] =m['data_week'] ? Object.values(m['data_week']).reduce(
                        (sum: number, value: any) => sum + Number(value),
                        0
                    ) : 0;

                    m['__categoris_name'] = this.list_donvi_chuyenmon.find(f=>f.id == m.category_ids) ? this.list_donvi_chuyenmon.find(f=>f.id == m.category_ids).title : '';
                    const item = {
                        index: index+ 1,
                        maso: m.maso,
                        title:m['title'],
                        category:m['__categoris_name'],

                    }
                    this.dataWeek.forEach(e=>{
                        item['week' + e.value] = m['data_week'][e.value.toString()] ? m['data_week'][e.value.toString()] : ' - ';
                    })

                    item['total'] = m['__total']
                    return item ;
                }): [];

                this.noitifi.loadingAnimationV2({process:{percent:100}});
                this.noitifi.disableLoadingAnimationV2();
                this.expExcelBaocaoService.exportExcel(dataExport,'tonghop-cauhoi-trachnghiem')

            },error:()=>{
                this.noitifi.toastWarning('Load dữ liệu không thành công');
                this.noitifi.disableLoadingAnimationV2();

            }
        })
    }
}
