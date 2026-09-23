import {Component, Input, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ClassStudentMocdiemdanh} from "@shared/services/class-moc-diemdanh.service";
import {NotificationService} from "@core/services/notification.service";
import {ClassStudentService} from "@shared/services/class-student.service";
import {ClassStudentDiemdanhService} from "@shared/services/class-student-diemdanh.service";
import {forkJoin, mergeMap, switchAll, switchMap} from "rxjs";
import {ConditionOption} from "@shared/models/condition-option";
import {OvicQueryCondition} from "@core/models/dto";
import {map} from "rxjs/operators";
import {ClassStudent} from "@shared/models/class-student";
import {ButtonModule} from "primeng/button";
import {MatMenuModule} from "@angular/material/menu";
import {RippleModule} from "primeng/ripple";
import {SharedModule} from "primeng/api";
import {TableModule} from "primeng/table";
import {TooltipModule} from "primeng/tooltip";
import {ClassStudentDiemdanh} from "@shared/models/class-student-diemdanh";
import {OvicDateTimeService} from "@shared/services/ovic-date-time.service";
import {HelperService} from "@core/services/helper.service";
import {ClassCalendar} from "@shared/models/class-calendar";

@Component({
    selector: 'app-diemdanh-sinhvien',
    standalone: true,
    imports: [CommonModule, ButtonModule, MatMenuModule, RippleModule, SharedModule, TableModule, TooltipModule],
    templateUrl: './diemdanh-sinhvien.component.html',
    styleUrls: ['./diemdanh-sinhvien.component.css']
})
export class DiemdanhSinhvienComponent implements OnInit {

    @Input() set mocDiemdanh(item: ClassCalendar) {
        this.mocdiemdanhSelect = item;
        this.loadInit(this.mocdiemdanhSelect);
    }

    mocdiemdanhSelect :ClassCalendar;

    listStudent:ClassStudent[];
    ngType: 1|-0| -1 =0;
    constructor(
        private notifi: NotificationService,
        private classStudentService: ClassStudentService,
        private classStudentDiemdanhService: ClassStudentDiemdanhService,
        private ovicDateTimeService: OvicDateTimeService,
        private helperService: HelperService

    ) {
    }

    ngOnInit(): void {
    }

    loadInit(calendar: ClassCalendar){
        // this.notifi.isProcessing(true);
        this.ngType = 0;
        const conditionClass :ConditionOption = {
            condition:[
                {conditionName:'class_id',condition:OvicQueryCondition.equal, value:calendar.class_id.toString(),},
            ],
            set:[
                {label: 'limit', value: '-1'},
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'ordering' },
            ],
            page:null
        }
        const conditionMocdiendanh :ConditionOption = {
            condition:[
                {conditionName:'class_id',condition:OvicQueryCondition.equal, value:calendar.class_id.toString(),},
                {conditionName:'calendar_id',condition:OvicQueryCondition.equal,value:calendar.id.toString()}
            ],
            set:[
                {label: 'limit', value: '-1'},
            ],
            page:null
        }

        forkJoin([
            this.classStudentService.getClassStudentByPageNew(conditionClass).pipe(map(m=>m.data)),
            this.classStudentDiemdanhService.getClassStudentDiemdanhByPageNew(conditionMocdiendanh).pipe(map(m=>m.data)),
        ]).subscribe({
            next:([classStudent,classStudentDiemdanh])=>{


                this.listStudent = classStudent && classStudent.length>0  ? classStudent.map((m,index)=>{
                    m['_index'] = index + 1;
                    const diemdanh = classStudentDiemdanh.find(f=>f.student_id == m.student_id)
                    m['_diemdanh'] = diemdanh
                    m['_isdiemdanh'] = !!diemdanh;
                    m['_keydiemdanh'] = diemdanh ? diemdanh.loaiphep : 'DD';
                    m['__titleDiemdanh'] = diemdanh ? (diemdanh.loaiphep == 'K'?'Vắng K' :(diemdanh.loaiphep == 'P'?'Vắng P':'Muộn')) : 'Có';

                    const info = m.user_info;
                    m['full_name'] = info ? info.full_name : '';
                    m['student_code'] = info ? info.student_code : '';
                    return m;
                }): [];
                this.ngType =1;
                // this.notifi.isProcessing(false);


            },error:()=>{
                this.ngType =0;

                // this.notifi.isProcessing(false);
                this.notifi.toastError('Load dữ liệu không thành công');
            }
        })
    }


    async btnDelete(item:ClassStudentDiemdanh){
        const btn = await this.notifi.confirmDelete('Thao tác này sẽ xóa đánh dấu nghỉ của sinh viên ' + item['full_name'] + ' ?');

        if(btn){
            const id = item['_diemdanh'] ? item['_diemdanh'].id : 0;
            if(id !== 0){
                this.notifi.isProcessing(true);
                this.classStudentDiemdanhService.deleteClassStudentDiemdanh(id).subscribe({
                    next:()=> {
                        this.notifi.isProcessing(false);
                        this.notifi.toastSuccess('Thao tác thành công');
                        this.loadInit(this.mocdiemdanhSelect);
                    },
                    error:()=>{
                        this.notifi.isProcessing(false);
                        this.notifi.toastError('Thao tác không thành công');

                    }
                })
            }else{
                this.notifi.toastWarning('Không tìm thấy điểm danh của sinh viên');
            }

        }
    }

    // async btnCheckItemNghi(item:ClassStudentDiemdanh,type:'K'|'M'|'P'){
    //     const diemdanh: ClassStudentDiemdanh = item['_diemdanh'];
    //     if( diemdanh && diemdanh.loaiphep == type){
    //         const title :string = type == "K" ? 'Nghỉ không phép' : (type == "P" ? 'Nghỉ có phép' : 'Muộn');
    //         return this.notifi.toastWarning('Giảng viên đã điểm danh '+ title + ' cho sinh viên');
    //     }else{
    //
    //         const title :string = type == "K" ? 'Nghỉ không phép' : (type == "P" ? 'Nghỉ có phép' : 'Muộn');
    //         const html = `Thao tác này sẽ điểm danh <strong>${title}</strong> với sinh viên <strong>${item['full_name']}</strong>` ;
    //         const btn = await this.notifi.confirmRounded(html,'XÁC NHẬN')
    //         if(btn.name == 'yes'){
    //             this.notifi.isProcessing(true);
    //             this.ovicDateTimeService.getCurrentDateTime().pipe(switchMap(m=>{
    //
    //                 const itemAdd = {
    //                     class_id: this.mocdiemdanhSelect.class_id,
    //                     student_id: item.student_id,
    //                     calendar_id: this.mocdiemdanhSelect.id,
    //                     loaiphep: type,
    //                     ngay: this.helperService.formatSQLDateTime(m),
    //                     tiet: this.mocdiemdanhSelect.tiet
    //                 }
    //
    //
    //                 return this.classStudentDiemdanhService.addClassStudentDiemdanh(itemAdd)
    //
    //             })).subscribe({
    //                 next:()=>{
    //                     this.notifi.isProcessing(false);
    //                     this.notifi.toastSuccess('Thao tác thành công');
    //                     this.loadInit(this.mocdiemdanhSelect);
    //
    //                 },error:()=>{
    //                     this.notifi.isProcessing(false);
    //                     this.notifi.toastError('Thao tác không thành công');
    //                 }
    //             })
    //         }
    //     }
    // }

    btnCheckItemNghi(item:ClassStudentDiemdanh,type:'K'|'M'|'P'){
        const diemdanh: ClassStudentDiemdanh = item['_diemdanh'];
        if( diemdanh && diemdanh.loaiphep == type){
            const title :string = type == "K" ? 'Nghỉ không phép' : (type == "P" ? 'Nghỉ có phép' : 'Muộn');
            return this.notifi.toastWarning('Giảng viên đã điểm danh '+ title + ' cho sinh viên');
        }else{

            // const title :string = type == "K" ? 'Nghỉ không phép' : (type == "P" ? 'Nghỉ có phép' : 'Muộn');
            // const html = `Thao tác này sẽ điểm danh <strong>${title}</strong> với sinh viên <strong>${item['full_name']}</strong>` ;
            // const btn = await this.notifi.confirmRounded(html,'XÁC NHẬN')
            // if(btn.name == 'yes'){
                this.notifi.isProcessing(true);
                this.ovicDateTimeService.getCurrentDateTime().pipe(switchMap(m=>{

                    const itemAdd = {
                        class_id: this.mocdiemdanhSelect.class_id,
                        student_id: item.student_id,
                        calendar_id: this.mocdiemdanhSelect.id,
                        loaiphep: type,
                        ngay: this.helperService.formatSQLDateTime(m),
                        tiet: this.mocdiemdanhSelect.tiet
                    }


                    return this.classStudentDiemdanhService.addClassStudentDiemdanh(itemAdd)

                })).subscribe({
                    next:()=>{
                        this.notifi.isProcessing(false);
                        this.notifi.toastSuccess('Thao tác thành công');
                        this.loadInit(this.mocdiemdanhSelect);

                    },error:()=>{
                        this.notifi.isProcessing(false);
                        this.notifi.toastError('Thao tác không thành công');
                    }
                })
            }
        // }
    }


    coventDiemdanh(type:string){
        return this.listStudent.reduce((acc, cur) => {
            const key = cur['_keydiemdanh']; // key cần đếm
            if(key == type){
                acc += 1;
            }
            return acc;
        }, 0);
    }

}
