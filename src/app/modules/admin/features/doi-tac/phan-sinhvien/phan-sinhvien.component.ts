import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ToggleSwitchModule} from "primeng/toggleswitch";
import {PaginatorModule} from "primeng/paginator";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {SharedModule} from "@shared/shared.module";
import {TableModule} from "primeng/table";
import {User} from "@core/models/user";
import {NotificationService} from "@core/services/notification.service";
import {UserService} from "@core/services/user.service";
import {RoleService} from "@core/services/role.service";
import {ConditionOption} from "@shared/models/condition-option";
import {OvicQueryCondition} from "@core/models/dto";
import {Role} from "@core/models/role";
import {DoitacSinhvienService, PartnerStudents} from "@shared/services/doitac-sinhvien.service";
import {AuthService} from "@core/services/auth.service";
import {forkJoin, of, Subscription, switchMap} from "rxjs";
import {ElngUserProfileService} from "@shared/services/elearning-user-profile.service";
import {map} from "rxjs/operators";
import {RippleModule} from "primeng/ripple";
import {ButtonModule} from "primeng/button";
import {
    ThemSinhvienComponent
} from "@modules/admin/features/doi-tac/phan-sinhvien/them-sinhvien/them-sinhvien.component";

@Component({
    selector: 'app-phan-sinhvien',
    standalone: true,
    imports: [CommonModule, FormsModule, ToggleSwitchModule, PaginatorModule, ReactiveFormsModule, SharedModule, TableModule, RippleModule, ButtonModule, ThemSinhvienComponent],
    templateUrl: './phan-sinhvien.component.html',
    styleUrls: ['./phan-sinhvien.component.css']
})
export class PhanSinhvienComponent implements OnInit {
    @ViewChild('addThiSinh', {static: true}) addThiSinh : TemplateRef<any>;

    closeLeft       : boolean = false;
    textSearch      : string = '';

    listDoitac      : User[];
    recordsDoitac   : number = 0;
    limit           : number =  20;

    emptyMenu       : string='Chưa có đối tác';

    roleDoitac      : Role;
    doitacSelect    : User;
    pageDoitac      : number = 1;
    pageByStudent   : number = 1;


    loadingStudentFail:boolean = false;
    loadingStudent :boolean = false;
    dataStudents:PartnerStudents[] = [];
    recordsTotalByStudent:number = 0;
    searchTextByStudent:string ='';

    sizeFullWidth:number = 1024;

    subscription = new Subscription();
    listStudents :PartnerStudents[] = [];
    constructor(
        private notifi:NotificationService,
        private userService: UserService,
        private roleSerivce:RoleService,
        private doitacSinhvienService :DoitacSinhvienService,
        private auth: AuthService,
        private elngUserProfileService: ElngUserProfileService,
    ) {

        const observerOnResize = this.notifi.observeScreenSize.subscribe(size => this.sizeFullWidth = size.width)
        this.subscription.add(observerOnResize);
    }

    ngOnInit(): void {
        this.loadInit()

    }

    loadInit(){
        this.notifi.isProcessing(true);

        const  condition: ConditionOption = {
            condition:[
                {conditionName:'name',
                condition:OvicQueryCondition.equal,
                value:'doi-tac'
                },
            ],page:'1',
            set:[
                {label:'limit',value:'1'},
            ]
        }
        this.roleSerivce.getRolesByPageNew(condition).subscribe({
            next:({data})=>{
                this.roleDoitac = data.length ? data[0] : null;
                this.notifi.isProcessing(false);

                if(data.length>0){
                    this.getDoitac()
                }
            } ,error:()=>{
                this.notifi.isProcessing(false);

                this.notifi.toastError('Load dữ liệu ko thành công');
            }
        })
    }

    getDoitac(){
        this.notifi.isProcessing(true);

        const condition:ConditionOption = {
            condition:[

            ],
            page:this.pageDoitac.toString(),
            set:[
                { label:'limit',value:this.limit.toString()},
                { label:'role_ids',value:this.roleDoitac.id.toString()}
            ]
        }
        if(this.textSearch){
            condition.condition.push({
                conditionName:'display_name',
                condition:OvicQueryCondition.like,
                value:`%${this.textSearch}%`,
                orWhere:'or'
            },
                {conditionName:'username',
                condition:OvicQueryCondition.like,
                value:`%${this.textSearch}%`,
                orWhere:'or'
            },
            )
        }

        this.userService.getUserByPageNew(condition).subscribe({
            next:({data, recordsFiltered})=>{
                this.listDoitac = data;
                this.recordsDoitac = recordsFiltered;
                this.notifi.isProcessing(false);

            },error:(e)=>{
                this.notifi.toastError('Load dữ liệu ko thành công');
                this.notifi.isProcessing(false);
            }
        })
    }

    changePageDoitac(event){
        this.pageDoitac = event+ 1;
        this.getDoitac();
    }
    onSearchByTitle(){
        this.pageDoitac = 1;
        this.getDoitac();

    }

    closeLeftBody(){
        this.closeLeft = !this.closeLeft;
    }
    onSelectDoitac(doitac: User){
        this.doitacSelect = {...doitac};
        this.pageByStudent = 1;

        this.getStudentByDoitac(this.pageByStudent, '');

    }

    getStudentByDoitac(page:number,search:string){
        this.notifi.isProcessing(true);

        const condtion : ConditionOption = {
            condition:[
                {
                    conditionName:'doitac_id',
                    condition:OvicQueryCondition.equal,
                    value:this.doitacSelect.id.toString()
                }
            ],
            page:page.toString(),
            set:[
                {label:'limit',value:this.limit.toString()},
                {label:'partner',value:search},

            ]
        }
        // if(search){
        //     condtion.condition.push({
        //         conditionName:'full_name',
        //         condition:OvicQueryCondition.like,
        //         value:`%${search}%`
        //     })
        // }



        this.doitacSinhvienService.getDataByPageNew(condtion).pipe(switchMap(m=>{
            const student_ids = m.data.map(a=>a.student_id);

            if (student_ids.length === 0) {
                // return of([m, [] as ]);
                return forkJoin([of(m),of([])]);
            }

            const condiStudent:ConditionOption = {
                condition:[
                    {
                        conditionName:'id',
                        condition:OvicQueryCondition.equal,
                        value:student_ids.toString(),
                        orWhere:'in'
                    }
                ],
                page: '1',
                set:[
                    {
                        label: 'limit',value: m.data.length.toString()
                    }
                ]
            }

            return forkJoin([of(m), this.elngUserProfileService.getUserProfileByPageNewV2(condiStudent).pipe(map(e=>e.data)) ])
        })).subscribe({
            next:([partnerStudent,students])=>{
                this.recordsTotalByStudent =partnerStudent.recordsFiltered;
                this.dataStudents = partnerStudent.data.length> 0 ? partnerStudent.data.map((m,index)=>{
                    m['_index'] = (this.pageByStudent - 1)*this.limit + index + 1;
                    m['_student'] = students.length > 0 ? students.find(f=>f.id  === m['student_id']) : null;
                    return m;
                    }) : [];
                this.notifi.isProcessing(false);

            },error:()=>{
                this.notifi.isProcessing(false);
                // loadingStudentFail
            }
        })

    }

    reloadingGetStudent(){
        this.pageByStudent = 1;
        this.searchTextByStudent= ''
        this.getStudentByDoitac(1,'')
    }
    searchStudents(event){
        this.pageByStudent = 1;
        this.searchTextByStudent = event;
        this.getStudentByDoitac(1,event)
    }

    changePageByStudent(event){
        this.pageByStudent = event.page + 1;
        this.getStudentByDoitac(event.page + 1,this.searchTextByStudent );
    }

    closeForm(){
        this.notifi.closeSideNavigationMenu();
        this.pageByStudent = 1;
        this.textSearch = '';
        this.getStudentByDoitac(1,'')
    }
    btnAddStudent(){

        this.doitacSelect = {...this.doitacSelect};
        this.notifi.openSideNavigationMenu({
            template: this.addThiSinh,
            size: this.sizeFullWidth,
            offsetTop: '0px'
        });
    }

    async btnDeleteStudent(row:PartnerStudents){
        const confirm : boolean = await this.notifi.confirmDelete();
        if ( confirm ) {
            this.doitacSinhvienService.delete(row.id).subscribe({
                next:()=>{
                    this.notifi.toastSuccess("Xóa thành công");
                    this.pageByStudent = 1;
                    this.getStudentByDoitac(this.pageByStudent,this.searchTextByStudent);
                },
                error:()=>{
                    this.notifi.toastError("Xóa không thành công");
                }
            })
        }
    }
}
