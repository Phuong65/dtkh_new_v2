import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {User} from "@core/models/user";
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {UserService} from "@core/services/user.service";
import {ClassManagement, ClassManagementService} from "@shared/services/class-management.service";
import {ClassManagementGvcn, ClassManagementGvcnService} from "@shared/services/class-management-gvcn.service";
import {PaginatorModule} from "primeng/paginator";
import {RoleService} from "@core/services/role.service";
import {NotificationService} from "@core/services/notification.service";
import {ConditionOption} from "@shared/models/condition-option";
import {OvicQueryCondition} from "@core/models/dto";
import {Role} from "@core/models/role";
import {forkJoin, Observable, of, switchMap} from "rxjs";
import {map} from "rxjs/operators";
import {ButtonModule} from "primeng/button";
import {RippleModule} from "primeng/ripple";
import {RadioButtonModule} from "primeng/radiobutton";
import {SharedModule} from "@shared/shared.module";
import {
    OvicSelectClassmanagementComponent
} from "@modules/admin/features/cthssv/danhsach-gvcn/ovic-select-classmanagement/ovic-select-classmanagement.component";
import {SplitterModule} from "primeng/splitter";
import {CalendarModule} from "primeng/calendar";
import {NgbTooltipModule} from "@ng-bootstrap/ng-bootstrap";
import {HelperService} from "@core/services/helper.service";
import {TableModule} from "primeng/table";
import {ElngUserProfileService} from "@shared/services/elearning-user-profile.service";
import {TooltipModule} from "primeng/tooltip";
import {BUTTON_NO, BUTTON_YES} from "@core/models/buttons";
import {MatMenuModule} from "@angular/material/menu";
import {ElngUserProfile} from "@shared/models/elng-user-profile";

@Component({
    selector: 'app-danhsach-gvcn',
    standalone: true,
    imports: [CommonModule, PaginatorModule, ButtonModule, RippleModule, RadioButtonModule, ReactiveFormsModule, SharedModule, OvicSelectClassmanagementComponent, SplitterModule, CalendarModule, NgbTooltipModule, TableModule, TooltipModule, MatMenuModule],
    templateUrl: './danhsach-gvcn.component.html',
    styleUrls: ['./danhsach-gvcn.component.css']
})
export class DanhsachGvcnComponent implements OnInit {
    @ViewChild('formInfo') formInfo: TemplateRef<any>;
    @ViewChild('formViewStudent') formViewStudent: TemplateRef<any>;

    listData        : User[] = [];
    form            : FormGroup;
    row             : number = 20;
    recordsFiltered : number = 0;
    roleUse         : Role = null;
    page            : number = 1;

    user_select     : User;

    listClassByUser: ClassManagementGvcn[]= [];

    isUpdate:boolean= false;


    listStatus:{label:string,value:number}[]= [
        {
            label:'Đang chủ nhiệm',
            value:1
        },
        {
            label:'Đã kết thúc',
            value:0
        }
    ]

    pageByClass            : number = 1;
    recordsFilteredByclass : number = 0;

    viewAdd:boolean = false;



    status_is_chunhiem:number = 1; // 0 : những lớp đã kết thúc chủ nhiem
    classManagementSelect:ClassManagementGvcn;
    listStudentByClass: ElngUserProfile[];
    pageByStudent:number = 1;
    recordsFilteredByStudent = 0;
    constructor(
        private userService:UserService,
        private classManagementService:ClassManagementService,
        private classManagementGvcnService:ClassManagementGvcnService,
        private roleService: RoleService,
        private notifi: NotificationService,
        private fb: FormBuilder,
        private helperService:HelperService,
        private studentsService: ElngUserProfileService

    ) {
        this.form = fb.group({
            gvcn_id:['',Validators.required],
            class_management_ids:[[],Validators.required],
            status:[1,Validators.required],
            date_start:[null ,Validators.required],
            date_end:[null,],
            quyetdinh_so:['',Validators.required]
        })
    }

    ngOnInit(): void {
        this.loadInit()
    }
    loadInit(){
        this.notifi.isProcessing(true);

        const conditionRole: ConditionOption = {
            condition:[
                {
                    condition:OvicQueryCondition.equal,
                    conditionName:'name',
                    value:'giaovien-chunhiem'
                }
            ],
            page:'1',
            set:[
                {label:'limit',value:'1'},
                {label:'select',value:'id,name,title'}
            ]
        }
        this.roleService.getRolesByPageNew(conditionRole).subscribe({
            next:({data,recordsFiltered})=>{
                this.notifi.isProcessing(false);
                if(data.length >0){
                    this.roleUse = data[0];
                    this.getUserByRole(1)
                }

            },error:()=>{
                this.notifi.isProcessing(false);

            }
        })
    }



    getUserByRole(page:number,textSearch ?: string){

        if(!this.roleUse){
            return;
        }
        this.page = page;

        const conditionUser:ConditionOption = {
            condition:[
                // {
                //     condition:OvicQueryCondition.like,
                //     conditionName:'role_ids',
                //     value:`"${this.roleUse.id}"`
                // }
            ],
            page: this.page.toString(),
            set:[
                {label:'limit',value: this.row.toString()},
                {label:'select',value:'id,display_name,phone,email'},
                {label:'order',value:'ASC'},
                {label:'role_ids',value:this.roleUse.id.toString()}
            ]
        }
        if(textSearch){
            conditionUser.condition.push({
                condition:OvicQueryCondition.like,
                conditionName:'display_name',
                value:`%${textSearch}%`
            })
        }
        this.notifi.isProcessing(true);

        this.userService.getUserByPageNew(conditionUser).subscribe({
            next:({data,recordsFiltered})=>{

                this.listData = data;
                this.recordsFiltered = recordsFiltered;
                this.notifi.isProcessing(false);

            },error:()=>{
                this.notifi.isProcessing(false);

            }
        })
    }

    InputSeachuser(event){
        this.getUserByRole(1,event)
    }

    changePage(event) {
        this.page = event.page + 1;
        this.user_select = null;
        this.getUserByRole(this.page);
    }

    btnClickUser(user:User){

        this.user_select= user;
        this.f['gvcn_id'].setValue(user.id);

        this.getClassManagement(user,1)
    }


    getClassManagement(item:User,page:number){
        this.notifi.isProcessing(true);
        const conditionClass: ConditionOption = {
            condition:[
                {
                    conditionName:'gvcn_id',
                    condition: OvicQueryCondition.equal,
                    value:item.id.toString()
                },

            ],page: page.toString(),
            set:[
                {label:'limit',value:this.row.toString()},
                {label:'order',value:'ASC'},
                {label:'orderby',value:'date_start'},
            ]
        };

        conditionClass.condition.push({
            conditionName:'status',
            condition: OvicQueryCondition.equal,
            value:this.status_is_chunhiem.toString()
        })

        this.classManagementGvcnService.getDataByPageNew(conditionClass).pipe(switchMap(m=>{
            const class_managerment_ids = Array.from(new Set(m.data.map(a=>a.class_management_id))).filter(f=>f !== 0)

            const conditionClassManagement: ConditionOption = {
                condition:[
                    {
                        conditionName:'id',
                        condition: OvicQueryCondition.equal,
                        value:class_managerment_ids.toString(),
                        orWhere:'in'
                    },
                ],page: '1',
                set:[
                    {label:'limit',value:'-1'},
                ]
            };
            return forkJoin([
                of(m),
                class_managerment_ids.length>0 ? this.classManagementService.getDataByPageNew(conditionClassManagement).pipe(switchMap(a=>this.getTotalStudentByClass(a.data))) : of([])
            ])
        })).subscribe({
            next:([{data,recordsFiltered}, listClassManagement])=>{
                this.listClassByUser = data.length>0 ? data.map((m,index)=>{
                    m['_index'] = index + 1;
                    const classManagement:ClassManagement = listClassManagement && listClassManagement.find(f=>f.id == m.class_management_id ) ? listClassManagement.find(f=>f.id == m.class_management_id ) :null;
                    m['_className'] = classManagement ? classManagement.title: '';
                    m['_total_student'] = classManagement ? classManagement['_totalStudent']: '';
                    m['_time_use'] = this.strToTime(m.date_start) + ' - ' + (m.date_end ? this.strToTime(m.date_end):'');
                    return m;
                }): [];
                this.recordsFilteredByclass =recordsFiltered;
                this.notifi.isProcessing(false);

            },error:()=>{
                this.notifi.isProcessing(false);
                this.notifi.toastError('Tải dữ liệu không thành công');
            }
        })
    }

    btnChangViewStatus(){
        this.status_is_chunhiem = this.status_is_chunhiem == 1 ? 0 : 1;
        this.btnClickUser(this.user_select);
    }

    strToTime(input: string): string {
        const date = input ? new Date(input) : null;
        let result = '';
        if (date) {
            result += [date.getDate().toString().padStart(2, '0'), (date.getMonth() + 1).toString().padStart(2, '0'), date.getFullYear().toString()].join('/');
            // result += ' ' + [date.getHours().toString().padStart(2, '0'), date.getMinutes().toString().padStart(2, '0')].join(':');
        }
        return result;
    }

    getTotalStudentByClass(data:ClassManagement[]):Observable<ClassManagement[]>{
        const index = data.findIndex(f=>f['_totalStudent'] === undefined);
        if(index !== -1){
            const item = data[index];
            const conditionGetProfile: ConditionOption = {
                condition: [
                    // {conditionName: 'class_management_id', condition: OvicQueryCondition.equal, value: '0'},
                    {conditionName:'class_management_id',condition:OvicQueryCondition.equal,value: item.id.toString()},
                    {conditionName: 'teacher', condition: OvicQueryCondition.equal, value: '0'},
                ],
                page: '1',
                set: [
                    {label: 'limit', value: '1'},
                    {label:'select',value:'id'}
                ]
            }
            return this.studentsService.getTotalUserProfile(conditionGetProfile.condition, 1, conditionGetProfile.set).pipe(switchMap(m=>{
                data[index]['_totalStudent'] = m;
                return this.getTotalStudentByClass(data)
            }))
        }else{
            return of(data);
        }
    }

    changePageByClass(event){
        this.pageByClass = event.page + 1;
        this.getClassManagement(this.user_select,this.pageByClass);
    }

    //--------------------------Form-----------------------------
    get f() {
        return this.form.controls;
    }

    resetForm(){
        this.form.reset({
            gvcn_id:this.user_select ? this.user_select.id : '',
            class_management_ids:[],
            status:1,
            date_start:'',
            date_end:'',
            quyetdinh_so:''
        })
    }
    btnSummitForm(){
        if(this.form.valid){
            const dataForm = this.form.value;
            if(dataForm.class_management_ids.length>0){
                const arr = [];
                dataForm.class_management_ids.forEach(e=>{
                    arr.push({
                        gvcn_id:this.user_select.id,
                        class_management_id:e,
                        status:1,
                        date_start:this.helperService.formatSQLDateTime(dataForm.date_start),
                        date_end: dataForm.date_end ? this.helperService.formatSQLDateTime(dataForm.date_end):null,
                        quyetdinh_so:dataForm.quyetdinh_so,
                    })
                })
                this.notifi.isProcessing(true);
                this.loopAddItem(arr).subscribe({
                  next:()=>{
                      this.notifi.isProcessing(false);
                      this.notifi.toastSuccess('Tạo mới thành công');
                      this.resetForm();
                      this.btnClickUser(this.user_select);
                  },error:()=>{
                      this.notifi.isProcessing(false);
                      this.notifi.toastError('Tạo mới không thành công');
                    }
                })

            }else{
                this.notifi.toastWarning('Vui lòng Chọn lớp chủ nhiệm');
            }
        }else{
            this.notifi.toastWarning('Vui lòng nhập đủ thông tin');
        }
    }

    loopAddItem(arrnew: any[]): Observable<any[]> {
        const index = arrnew.findIndex(f => !f['isAdd']);
        if (index !== -1) {
            return this.classManagementGvcnService.add(arrnew[index]).pipe(switchMap(m => {
                    arrnew[index]['isAdd'] = true;
                    return this.loopAddItem(arrnew);
                }
            ))
        } else {
            return of(arrnew);
        }
    }

    async btnEndStatus(item:ClassManagementGvcn){
        const confirm = await this.notifi.confirm(`Xác nhận kết thúc chủ nhiệm với lớp ${item['_className']}`,'THÔNG BÁO',[BUTTON_YES,BUTTON_NO]);
        if (confirm.name =='yes'){

            this.classManagementGvcnService.update(item.id,{status:0}).subscribe({
                next: () => {

                    this.notifi.isProcessing(false);
                    this.notifi.toastSuccess('Thao tác thành công');
                    this.btnClickUser(this.user_select);
                }, error: () => {
                    this.notifi.isProcessing(false);
                    this.notifi.toastError('Thao tác không thành công');
                }
            })
        }
    }
    async btnDelete(item:ClassManagementGvcn){
        const confirm = await this.notifi.confirmDelete();
        if (confirm) {
            this.notifi.isProcessing(true);
            this.classManagementGvcnService.delete(item.id).subscribe({
                next: () => {
                    this.page = Math.max(1, this.page - (this.listData.length > 1 ? 0 : 1));
                    this.notifi.isProcessing(false);
                    this.notifi.toastSuccess('Thao tác thành công');
                    this.btnClickUser(this.user_select);
                }, error: () => {
                    this.notifi.isProcessing(false);
                    this.notifi.toastError('Thao tác không thành công');
                }
            })
        }
    }

    btngetStudentByClass(row:ClassManagementGvcn){
        this.classManagementSelect = row;
        this.pageByStudent= 1
        this.getStudentByClass(row.class_management_id,1);
        this.notifi.openSideNavigationMenu({template:this.formViewStudent,size:800,offsetTop: '0px' });

    }


    getStudentByClass(class_id: number, page: number) {
        this.pageByStudent = page;
        const conditionGetProfile: ConditionOption = {
            condition: [
                // {conditionName: 'class_management_id', condition: OvicQueryCondition.equal, value: '0'},
                {conditionName:'class_management_id',condition:OvicQueryCondition.equal,value: class_id.toString()},
                {conditionName: 'teacher', condition: OvicQueryCondition.equal, value: '0'},
            ],
            page: this.pageByStudent.toString(),
            set: [
                {label: 'limit', value: '20'},
                {label: 'orderby', value: 'name'},
                {label: 'order', value: 'ASC'},
            ]
        }
        // this.noitifi.isProcessing(true);
        this.notifi.isProcessing(true);
        this.studentsService.getElngUserProfileByPageNew(conditionGetProfile.condition, page, conditionGetProfile.set).subscribe({
            next: ({data, recordsFiltered}) => {
                this.recordsFilteredByStudent = recordsFiltered;
                this.listStudentByClass = data.length > 0 ? data.map((m, index) => {
                    m['__index'] = index + 1;
                    return m;
                }) : [];
                this.notifi.isProcessing(false);

            }, error: () => {
                this.notifi.isProcessing(false);
                this.notifi.toastError('Mất kết nối với máy chủ');
            }
        })
    }
    changePageStudent(event){
        this.pageByStudent = event + 1 ;
        this.getStudentByClass(this.classManagementSelect.id,this.pageByStudent);
    }
    closeForm(){
        this.notifi.closeSideNavigationMenu();
    }

    btnViewFormAdd(){
        if(this.viewAdd == true){
            this.viewAdd = false;
        }else{
            this.viewAdd = !this.viewAdd;
            this.resetForm()
        }
    }
}
