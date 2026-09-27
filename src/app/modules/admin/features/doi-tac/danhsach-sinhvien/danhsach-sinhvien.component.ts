import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {DialogModule} from "primeng/dialog";
import {GeneralModule} from "@modules/kiem-thu-ngan-hang-cau-hoi/general/general.module";
import {MatMenuModule} from "@angular/material/menu";
import {MatProgressBarModule} from "@angular/material/progress-bar";
import {PaginatorModule} from "primeng/paginator";
import {RadioButtonModule} from "primeng/radiobutton";
import {SharedModule} from "@shared/shared.module";

import {TableModule} from "primeng/table";
import {ElngUserProfileService} from "@shared/services/elearning-user-profile.service";
import {DoitacSinhvienService, PartnerStudents} from "@shared/services/doitac-sinhvien.service";
import {NotificationService} from "@core/services/notification.service";
import {ConditionOption} from "@shared/models/condition-option";
import {OvicQueryCondition} from "@core/models/dto";
import {AuthService} from "@core/services/auth.service";
import {ButtonModule} from "primeng/button";
import {RippleModule} from "primeng/ripple";
import {
    ThemSinhvienComponent
} from "@modules/admin/features/doi-tac/phan-sinhvien/them-sinhvien/them-sinhvien.component";
import {User} from "@core/models/user";
import {Role} from "@core/models/role";
import {forkJoin, of, Subscription, switchMap} from "rxjs";
import {map} from "rxjs/operators";
import {UserService} from "@core/services/user.service";
import {RoleService} from "@core/services/role.service";
import {ROLES, ROUTERS} from "@shared/utils/syscat";
import {
    QuatrinhDaotaoComponent
} from "@modules/admin/features/doi-tac/danhsach-sinhvien/quatrinh-daotao/quatrinh-daotao.component";
import {
    KetquaHockyComponent
} from "@modules/admin/features/doi-tac/danhsach-sinhvien/ketqua-hocky/ketqua-hocky.component";

@Component({
    selector: 'app-danhsach-sinhvien',
    standalone: true,
    imports: [CommonModule, FormsModule, DialogModule, GeneralModule, MatMenuModule, MatProgressBarModule, PaginatorModule, RadioButtonModule, ReactiveFormsModule, SharedModule, TableModule, ButtonModule, RippleModule, ThemSinhvienComponent, QuatrinhDaotaoComponent, KetquaHockyComponent],
    templateUrl: './danhsach-sinhvien.component.html',
    styleUrls: ['./danhsach-sinhvien.component.css']
})
export class DanhsachSinhvienComponent implements OnInit {

    @ViewChild('quatrinhdaotao', {static: true}) quatrinhDaotao : TemplateRef<any>;
    @ViewChild('ketquahoctap', {static: true}) ketquahoctap : TemplateRef<any>;

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
    studentSelect : PartnerStudents;


    isAdmin:boolean =false;
    isPartner: boolean = false;

    constructor(
        private elngUserProfileService: ElngUserProfileService,
        private doitacSinhvienService: DoitacSinhvienService,
        private notifi: NotificationService,
        private auth: AuthService,
        private userService: UserService,
        private roleSerivce:RoleService,
    ) {

        this.isAdmin =this.auth.userHasRole(ROLES.admin) || this.auth.userHasRole(ROLES.manager) ? true : false;
        this.isPartner = this.auth.userHasRole(ROUTERS.doi_tac);
        const observerOnResize = this.notifi.observeScreenSize.subscribe(size => this.sizeFullWidth = size.width)
        this.subscription.add(observerOnResize);
    }

    ngOnInit(): void {

        if(this.isAdmin){
            this.loadInit()
        }
        else{
            this.doitacSelect = {...this.auth.user};
            this.pageByStudent= 1 ;
            this.textSearch ='';
            this.getStudentByDoitac(this.pageByStudent,this.textSearch);
        }
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
                this.loadingStudentFail = true;
                this.notifi.toastError('Mất kết nối với máy chủ');
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
    }
    // btnAddStudent(){
    //
    //     this.doitacSelect = {...this.doitacSelect};
    //     this.notifi.openSideNavigationMenu({
    //         template: this.addThiSinh,
    //         size: this.sizeFullWidth,
    //         offsetTop: '0px'
    //     });
    // }
    //------------------------------------------------------
    openViewQuatrinhdaotao(item:PartnerStudents){
        this.studentSelect = {...item}

        this.notifi.openSideNavigationMenu({
            template: this.quatrinhDaotao,
            size: this.sizeFullWidth,
            offsetTop: '0px'
        });
    }
    openKetquahoctap(item){
        this.studentSelect = {...item}

        this.notifi.openSideNavigationMenu({
            template: this.ketquahoctap,
            size: this.sizeFullWidth,
            offsetTop: '0px'
        });
    }

}
