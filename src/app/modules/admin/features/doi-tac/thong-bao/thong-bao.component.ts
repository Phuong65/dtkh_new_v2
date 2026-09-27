import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators} from "@angular/forms";
import {Observable, Subscription} from "rxjs";

import {DonVi} from "@shared/models/don-vi";
import {AuthService} from "@core/services/auth.service";
import {Announcement, AnnouncementsService} from "@shared/services/announcements.service";
import {NotificationService} from "@core/services/notification.service";
import {HttpParamsHeplerService} from "@core/services/http-params-hepler.service";
import {OvicQueryCondition} from "@core/models/dto";
import {ConditionOption} from "@shared/models/condition-option";
import {BUTTON_NO, BUTTON_YES} from "@core/models/buttons";
import {ButtonModule} from "primeng/button";
import {CheckboxModule} from "primeng/checkbox";
import {SelectModule} from "primeng/select";
import {
    InputQuestionDirectionComponent
} from "@modules/admin/features/cauhoi-tracnghiem/input-question-direction/input-question-direction.component";
import {InputTextModule} from "primeng/inputtext";
import {MatCheckboxModule} from "@angular/material/checkbox";
import {PaginatorModule} from "primeng/paginator";
import {RippleModule} from "primeng/ripple";
import {SharedModule} from "@shared/shared.module";
import {ThongbaoFilesComponent} from "@modules/admin/features/thong-bao/thongbao-files/thongbao-files.component";
import {OpenFileManagerV2Component} from "@modules/shared/components/open-file-manager-v2/open-file-manager-v2.component";
import {OvicMultiSelectComponent} from "@modules/shared/components/ovic-multi-select/ovic-multi-select.component";
import {DoitacSinhvienService, PartnerStudents} from "@shared/services/doitac-sinhvien.service";
import {map} from "rxjs/operators";
import {RadioButtonModule} from "primeng/radiobutton";
import {MultiSelectModule} from "primeng/multiselect";

@Component({
  selector: 'app-thong-bao',
  standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, CheckboxModule, SelectModule, InputQuestionDirectionComponent, InputTextModule, MatCheckboxModule, PaginatorModule, ReactiveFormsModule, RippleModule, SharedModule, ThongbaoFilesComponent, OpenFileManagerV2Component, OvicMultiSelectComponent, RadioButtonModule, MultiSelectModule],
  templateUrl: './thong-bao.component.html',
  styleUrls: ['./thong-bao.component.css']
})
export class ThongBaoComponent implements OnInit {

    @ViewChild('formAdd') formAdd: TemplateRef<any>;

    rows: number = 20;
    objectFilter = {}; // sort sắp sếp

    typeView        : number = 0;// 0 : loading/ -1 :error, 1:true

    form            : FormGroup;

    sizeFullWidth   : number = 1024;
    subscription = new Subscription();


    ckEditor: any = {
        editor1: null,
    };

    listKhoadaotao: any[] = [];

    listHocky = [];
    listNamhoc = [];
    page            : number = 1;
    recordTotal     : number = 0;
    textSearch      : string = '';
    listData        : any[] = [];

    listDonvi       : DonVi[]  = [];

    constructor(
        private auth: AuthService,
        private fb: FormBuilder,
        private announcementsService: AnnouncementsService,
        private notifi: NotificationService,

        private httpHelper: HttpParamsHeplerService,
        private doitacSinhvienService: DoitacSinhvienService

    ) {
        const observerOnResize = this.notifi.observeScreenSize.subscribe(size => this.sizeFullWidth = size.width)
        this.subscription.add(observerOnResize);

        this.objectFilter['sort'] = 'DESC';
        this.form = this.fb.group({
            title: ['', Validators.required],
            message: ['', Validators.required],
            files: [null],
            type: ['', Validators.required],
            student_ids: [null] ,
            khoadaotao:[null,Validators.required]

        })


    }

    get f() {
        return this.form.controls;
    }


    ngOnInit(): void {
        this.loadInit()
    }

    loadInit() {
        const condition:ConditionOption= {
            condition:[

            ],
            page:'1',
            set:[
                {label:'limit',value:'-1'},
                {
                    label:'groupby',value:'khoadaotao'
                },
                {
                    label:'orderby',value:'khoadaotao',
                },
                {
                    label:'order', value:'DESC'
                },
                {
                    label:"select", value:'id,khoadaotao'
                }

            ]
        }

        this.doitacSinhvienService.getDataByPageNew(condition).subscribe({
            next:({data})=>{
                this.listKhoadaotao= data.length > 0 ? data.map(m=>{
                    m['_title'] = 'K'  +m.khoadaotao
                    return m;
                }) : [];
                this.typeView = 1;
                this.notifi.isProcessing(false);
                this.loadData();
            },error:()=>{
                this.typeView = -1;
               this.notifi.isProcessing(false);
               this.notifi.toastError('Mất kết nối với máy chủ')
            }
        })

    }


    loadData() {
        this.typeView = 0;
        const condtion: ConditionOption = {
            condition: [
                {
                    conditionName: 'state',
                    condition: OvicQueryCondition.equal,
                    value: '1',
                    orWhere: 'and'
                },
            ],
            page: this.page.toString(),
            set: [
                {label: 'limit', value: '20'},
                {label: 'order', value: this.objectFilter['sort']},
                {label: 'orderby', value: 'id'},
                {label: 'type', value: 'send'}

            ]
        }
        if (this.textSearch) {
            condtion.condition.push({
                conditionName: 'title',
                condition: OvicQueryCondition.like,
                value: `%${this.textSearch}%`,
                orWhere: 'and'
            })
        }

        this.announcementsService.getDataByPageNew(condtion).subscribe({
            next: ({data, recordsFiltered}) => {
                this.listData = data.map(m => {

                    m['checked'] = false;
                    m['_date'] = this.formatSQLDateTime(new Date(m['created_at']));

                    return m;
                });
                this.recordTotal = recordsFiltered;
                this.typeView = 1;
            }, error: () => {
                this.typeView = -1;
                this.notifi.toastError('Mất kết nối với máy chủ');
            }
        })
    }

    formatSQLDateTime(date: Date): string {
        const y = date.getFullYear().toString();
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const d = date.getDate().toString().padStart(2, '0');
        const h = date.getHours().toString().padStart(2, '0');
        const min = date.getMinutes().toString().padStart(2, '0');
        return `${d}-${m}-${y} ${h}:${min}`;
    }

    panigate(event) {
        this.page = event+1;
        this.loadInit()
    }

    reload() {
        this.loadInit()
    }

    btnChangeViewSort(key: string) {
        this.objectFilter[key] = this.objectFilter[key] == 'DESC' ? 'ASC' : 'DESC';
        this.page = 1;
        this.loadData()
    }

    resetForm() {
        this.loadThisinh = 0;

        this.form.reset(
            {
                title:'',
                message:'',
                files :null,
                type:'',
                student_ids  :'',
                khoadaotao:null,
            }
        )
    }

    openViewForm() {
        this.resetForm();

        this.notifi.openSideNavigationMenu({
            template: this.formAdd,
            offsetTop: '0px',
            name: 'form',
            size: this.sizeFullWidth
        })

    }

    closeForm() {
        this.notifi.closeSideNavigationMenu();

    }

    ckEditorSetup(ckEditor, name) {
        this.ckEditor[name] = ckEditor;
    }

    async btnSubmitForm() {
        if(this.form.valid){
            const item = {
                title : this.form.value['title'],
                message: this.form.value['message'],
                files: this.form.value['files'],
                type: this.form.value['type'],
                student_ids: this.form.value['student_ids'],
                khoadaotao: this.form.value['khoadaotao'],
            }

            if(item.type == 'select' && item.student_ids == '' ){
                return this.notifi.toastError('Vui lòng chọn sinh viên');
            }

            this.announcementsService.sendByDoitac(item).subscribe({
                next: () => {
                    this.notifi.isProcessing(false);
                    this.notifi.toastSuccess('Thao tác thành công');
                    this.notifi.closeSideNavigationMenu();
                    this.page = 1;
                    this.loadData();
                }, error: () => {
                    this.notifi.isProcessing(false);
                    this.notifi.toastError('Thao tác không thành công');
                }
            })

        }else{
            this.notifi.toastError('Vui lòng nhập đủ thông tin');
        }
    }


    itemSelect: Announcement = null;

    viewAnnouncements(item: Announcement) {
        this.itemSelect = item;
        this.typeView = 2;
    }

    btnReturnPage() {
        this.typeView = 1;
    }

    async btnDelete(item: Announcement) {
        const btn = await this.notifi.confirmRounded('Lưu trữ thông báo này ?', 'Thông báo', [BUTTON_YES, BUTTON_NO]);
        if (btn.name == 'yes') {
            this.announcementsService.update(item.id, {state: 0}).subscribe({
                next: () => {
                    this.notifi.toastSuccess('Lưu trữ thành công');
                    this.loadData();
                }, error: () => {
                    this.notifi.toastError('Lưu trữ không thành công');
                }
            })
        }
    }

    inputSearch(event:string){
        this.textSearch = event;
        this.loadData()
    }


    listStudentByKhoadaotao :PartnerStudents[] = [];
    onChangeKhoadaotao(event){

        this.loadThisinh = 0;

        this.getDoitacStudent(this.auth.user.id,event).subscribe({
            next:(data)=>{

                this.listStudentByKhoadaotao = data;
                this.loadThisinh= 2;
                setTimeout(() => {
                    this.loadThisinh= 0;
                }, 5000);
            },error:()=>{
                this.notifi.isProcessing(false);
                this.notifi.toastError('Mất kết nối với máy chủ ');
            }
        })
    }

    arrTypeSelectByKhoa = [
        {
            label:'Gửi toàn bộ sinh viên theo khóa',
            value:'all'
        },
        {
            label:'Chọn sinh viên theo khóa',
            value:'select'
        }
    ]

    loadThisinh: 0 |1 |2 = 1;
    getDoitacStudent(doitac_id:number , khoadaotao:number):Observable<PartnerStudents[]>{
        this.loadThisinh  = 1;

        const condition :ConditionOption = {
            condition:[
                {
                    conditionName:'doitac_id',
                    condition:OvicQueryCondition.equal,
                    value:doitac_id.toString()
                },
                {
                    conditionName:'khoadaotao',
                    condition:OvicQueryCondition.equal,
                    value:khoadaotao.toString()
                },
            ],page:'1',
            set:[
                {label:'limit', value:'-1'},
                {label:'select', value:'id,doitac_id,student_id,khoadaotao,full_name'},
            ]
        }

        return this.doitacSinhvienService.getDataByPageNew(condition).pipe(map(m=>m.data))
    }

}
