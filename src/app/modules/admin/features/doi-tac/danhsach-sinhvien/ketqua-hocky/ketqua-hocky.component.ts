import {Component, Input, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NotificationService} from "@core/services/notification.service";
import {ClassesService} from "@shared/services/classes.service";
import {ClassStudentService} from "@shared/services/class-student.service";
import {PartnerStudents} from "@shared/services/doitac-sinhvien.service";
import {ConditionOption} from "@shared/models/condition-option";
import {OvicQueryCondition} from "@core/models/dto";
import {forkJoin, Observable, of, switchMap} from "rxjs";
import {Classes} from "@shared/models/classes";
import {ButtonModule} from "primeng/button";
import {MatProgressBarModule} from "@angular/material/progress-bar";
import {RippleModule} from "primeng/ripple";
import {SharedModule} from "@shared/shared.module";
import {ClassStudent} from "@shared/models/class-student";
import {LockedContentComponent} from "@modules/admin/features/locked-content/locked-content.component";

@Component({
    selector: 'app-ketqua-hocky',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, MatProgressBarModule, RippleModule, SharedModule, LockedContentComponent],
    templateUrl: './ketqua-hocky.component.html',
    styleUrls: ['./ketqua-hocky.component.css']
})
export class KetquaHockyComponent implements OnInit {


    @Input() set student(item : PartnerStudents){
        this._studentSelect = item;
        // this.loadInit();
        this.ngView =-2;
    }

    _studentSelect : PartnerStudents;

    ngView : 0 | 1 |-1 |-2 = 0 ;

    listYear:any[]= [];
    constructor(
        private classesService: ClassesService,
        private classStudentService: ClassStudentService,
        private notifi: NotificationService
    ) {
    }

    ngOnInit(): void {
    }

    loadInit(){
        this.notifi.isProcessing( true);
        this.ngView = 0;
        const contitionClassStudent : ConditionOption= {
            condition:[
                {
                    conditionName:'student_id',
                    condition:OvicQueryCondition.equal,
                    value:this._studentSelect.student_id.toString()
                },
            ],
            page:'1',
            set:[{label:'limit',value:'-1'}]
        }

        this.classStudentService.getClassStudentByPageNew(contitionClassStudent).pipe(switchMap(m=>{
            const ids = m.data.map(m=>m.class_id)

            return forkJoin([
                of(m),
                this.loopGetClass(ids,1,50, [])
            ])
        })).subscribe({
            next:([classStudent, classes])=>{

                console.log(classStudent)

                const listYear  = classStudent.data.reduce((acc: { namhoc: string; hocky: number }[], item: any) => {
                    const key = `${item.namhoc}_${item.hocky}`;

                    if (!acc.some(x => `${x.namhoc}_${x.hocky}` === key)) {
                        acc.push({
                            namhoc: item.namhoc,
                            hocky: item.hocky
                        });
                    }
                    return acc;
                }, [])

                    .sort((a, b) => {
                        if (a.namhoc !== b.namhoc) {
                            return b.namhoc.localeCompare(a.namhoc);
                        }
                        return b.hocky - a.hocky;
                    }) ;

                this.listYear = listYear.length>0 ? listYear.map(m=>{

                    m['_classes'] = classes.filter(f=>f.namhoc == m.namhoc && f.hocky == m.hocky.toString())
                    m['_title']=  m.namhoc + ' Hk ' + m.hocky;
                    return m
                }) : [];

                console.log(this.listYear);
                this.notifi.isProcessing( false);
                this.ngView = 1;

            },error:()=>{
                this.notifi.isProcessing( false);
                this.notifi.toastError('Mất kết nối với máy chủ');
                this.ngView = -1;

            }
        })
    }

    private loopGetClass(class_ids:number[],page:number, limit:number , data:Classes[]):Observable<Classes[]>{
        const start = (page- 1)*limit;
        const end = start  + limit

        if( (page == 0 ? limit : limit *page) < data.length){
            const classIds_get = class_ids.slice(start , end);
            const conditionDm : ConditionOption = {
                condition: [
                    {
                        conditionName: 'id',
                        condition:OvicQueryCondition.equal,
                        value:classIds_get.toString(),
                        orWhere:'in'
                    }
                ],
                page: '1',
                set: [
                    {label: 'limit', value:classIds_get.length.toString(),},
                    // {label: 'select', value:'id,full_name,student_code,khoadaotao',}
                ]
            }
            return this.classesService.getClassesByPageNew(conditionDm).pipe(switchMap(a=>{
                return this.loopGetClass(class_ids,limit,page + 1,data.concat(a.data))
            }))

        }else{
            const classIds_get = class_ids.slice(start , end);
            const conditionDm : ConditionOption = {
                condition: [
                    {
                        conditionName: 'id',
                        condition:OvicQueryCondition.equal,
                        value:classIds_get.toString(),
                        orWhere:'in'
                    }
                ],
                page: '1',
                set: [
                    {label: 'limit', value:classIds_get.length.toString()},
                    // {label: 'select', value:'id,student_code,full_name,khoadaotao'},
                ]
            }
            return this.classesService.getClassesByPageNew(conditionDm).pipe(switchMap(a=>{
                return of(data.concat(a.data))
            }))
        }
    }

    reload(){

        this.loadInit();
    }
    replaceNamhoc(text:string){
        return text.replace('_' ,' - ');
    }

    YearSelect:ClassStudent;

    onChangeYear(event){
        console.log(event)
    }
}
