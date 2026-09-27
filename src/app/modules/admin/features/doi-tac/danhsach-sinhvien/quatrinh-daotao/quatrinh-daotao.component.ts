import {Component, Input, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {DoitacSinhvienService, PartnerStudents} from "@shared/services/doitac-sinhvien.service";
import {ClassesService} from "@shared/services/classes.service";
import {NotificationService} from "@core/services/notification.service";
import {ClassStudentService} from "@shared/services/class-student.service";
import {ConditionOption} from "@shared/models/condition-option";
import {OvicQueryCondition} from "@core/models/dto";
import {ButtonModule} from "primeng/button";
import {RippleModule} from "primeng/ripple";
import {MatProgressBarModule} from "@angular/material/progress-bar";
import {CtdtService} from "@shared/services/ctdt.service";
import {CtdtHocphanService} from "@shared/services/ctdt-hocphan.service";
import {forkJoin, of, switchMap} from "rxjs";
import {SelectModule} from "primeng/select";
import {TableModule} from "primeng/table";
import {CtdtHocphan} from "@shared/models/ctdt_hocphan";

@Component({
    selector: 'app-quatrinh-daotao',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, RippleModule, MatProgressBarModule, SelectModule, TableModule],
    templateUrl: './quatrinh-daotao.component.html',
    styleUrls: ['./quatrinh-daotao.component.css']
})
export class QuatrinhDaotaoComponent implements OnInit {

    @Input() set student(item : PartnerStudents){
        this._studentSelect = item;
        this.loadInitV2();
    }

    _studentSelect : PartnerStudents;

    ngView : 0 | 1 |-1 = 0;

    listHocky:any[]= [];

    listCtdt:CtdtHocphan[] = [];
    listCtdtClone:CtdtHocphan[] = [];

    constructor(
        private classesService: ClassesService,
        private classStudentService: ClassStudentService,
        private notifi: NotificationService,
        private ctdtService: CtdtService,
        private ctdtHocphanService: CtdtHocphanService,
        private doitacSinhvienService :DoitacSinhvienService
    ) {
    }

    ngOnInit(): void {
    }


    loadInitV2(){

        if(this._studentSelect['_student']['ctdt_id'] && this._studentSelect['_student']['ctdt_id'] == 0){
            this.ngView = 1;
            this.listHocky = []
            this.notifi.toastWarning('Sinh viên chưa có Chương trình đào tạo')
            return ;
        }
        // this.notifi.isProcessing(true);
        this.ngView = 0 ;



        const condition: ConditionOption = {
            condition:[
                {
                    conditionName:'ctdt_id',
                    condition:OvicQueryCondition.equal,
                    value:this._studentSelect['_student']['ctdt_id'].toString()
                }
            ],
            page:'1',
            set:[
                {label:'limit',value:'-1'},
                {label:'groupby',value:'hocky'},
                {label:'orderby',value:'hocky'},
                {label:'order',value:'DESC'},
            ]
        }

        const conditionParner: ConditionOption = {
            condition:[
                {
                    conditionName:'ctdt_id',
                    condition:OvicQueryCondition.equal,
                    value:this._studentSelect['_student']['ctdt_id'].toString()
                }
            ],
            page:'1',
            set:[
                {label:'limit',value:'-1'},
                {label:'student_id',value:this._studentSelect.student_id.toString()},
                {label:'doitac_id',value:this._studentSelect.doitac_id.toString()},
                {label:'ctdt_id',value:this._studentSelect['_student']['ctdt_id'].toString()},
            ]
        }


        this.ctdtHocphanService.getCtdtHocphanByPageNew(condition).pipe(switchMap(m=>{
            return forkJoin([of(m.data),
                this.doitacSinhvienService.partnerCtdt(conditionParner)])
        })).subscribe({
            next:([listhocky,data])=>{

                this.listHocky = listhocky.map(m=>{
                    m['_hocky'] = 'HK ' + m.hocky
                    return m;
                });

                const dataView = data.sort((a,b)=> a['hocky'] - b['hocky']).map(m=>{
                    m['_isStudy'] = m['class'].length> 0 ? 1: 0;
                    return m;
                })
                this.listCtdt= dataView;
                // this.listCtdt= [];
                this.listCtdtClone= dataView;
                this.ngView = 1;

            },error:()=>{

                this.ngView = -1;
                this.notifi.toastError('Mất kết nối với máy chủ');
            }
        })
    }

    reload(){
        this.loadInitV2();
    }

    changeHocky(event){
        if(event.value == null){
            this.listCtdt = this.listCtdtClone;
            return;
        }

        this.listCtdt = this.listCtdtClone.filter(f=>f.hocky == event.value);
    }

}
