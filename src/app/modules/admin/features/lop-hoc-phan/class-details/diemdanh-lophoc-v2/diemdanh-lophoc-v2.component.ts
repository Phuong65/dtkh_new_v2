import {Component, Input, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Classes} from "@shared/models/classes";
import {ClassStudent} from "@shared/models/class-student";
import {ClassCalendar} from "@shared/models/class-calendar";
import {ClassStudentDiemdanh} from "@shared/models/class-student-diemdanh";
import {ClassPlansService} from "@shared/services/class-plans.service";
import {CoursePlanActivitiesService} from "@shared/services/course-plan-activities.service";
import {NotificationService} from "@core/services/notification.service";
import {ConditionOption} from "@shared/models/condition-option";
import {OvicQueryCondition} from "@core/models/dto";
import {CoursePlanActivities} from "@shared/models/course-plan-activities";
import {RippleModule} from "primeng/ripple";
import {ButtonModule} from "primeng/button";
import {ClassStudentMocDiemdanhService, ClassStudentMocdiemdanh} from "@shared/services/class-moc-diemdanh.service";
import {HelperService} from "@core/services/helper.service";
import {MatMenuModule} from "@angular/material/menu";
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {GeneralModule} from "@modules/kiem-thu-ngan-hang-cau-hoi/general/general.module";
import {SharedModule} from "@shared/shared.module";
import {APP_CONFIGS} from "@env";
import {CalendarModule} from "primeng/calendar";
import {
    DiemdanhSinhvienComponent
} from "@modules/admin/features/lop-hoc-phan/class-details/diemdanh-lophoc-v2/diemdanh-sinhvien/diemdanh-sinhvien.component";
import {mergeMap, switchMap} from "rxjs";
import {ClassStudentDiemdanhService} from "@shared/services/class-student-diemdanh.service";
import {CalendarService} from "@shared/services/calendar.service";

@Component({
    selector: 'app-diemdanh-lophoc-v2',
    standalone: true,
    imports: [CommonModule, RippleModule, ButtonModule, MatMenuModule, GeneralModule, ReactiveFormsModule, SharedModule, CalendarModule, DiemdanhSinhvienComponent],
    templateUrl: './diemdanh-lophoc-v2.component.html',
    styleUrls: ['./diemdanh-lophoc-v2.component.css']
})
export class DiemdanhLophocV2Component implements OnInit {
    @ViewChild('formInfo') formInfo: TemplateRef<any>;

    @Input() classSelected: Classes;

    search_student: string;

    cols_student: any[];

    isLoading: boolean = false;

    listMocdiemdanh: ClassStudentMocdiemdanh[];
    ngType: 0 | 1 | -1 = 0;//0 loadding,1:true: -1 false

    form: FormGroup;
    formTitle: string = '';
    menuName: string = '';
    isUpdated: boolean = false;

    itemCalendar: ClassCalendar;



    listCalendar : ClassCalendar[];

    constructor(
        private notificationService: NotificationService,
        private classMocDiemdanhService: ClassStudentMocDiemdanhService,
        private classStudentDiemdanhService: ClassStudentDiemdanhService,
        private helperService: HelperService,
        private fb: FormBuilder,
        private calendarService: CalendarService
    ) {
        this.form = this.fb.group({
            ngay: ['', Validators.required],
            class_id: [0, Validators.required],
            mota: ['']
        })
    }

    ngOnInit(): void {
        this.initLoad();
    }

    initLoad() {
        // this.notificationService.isProcessing(true);
        this.itemCalendar = null;
        this.ngType = 0;


        const condition_calendar:ConditionOption = {
                condition: [
                    {
                        conditionName: 'class_id',
                        condition: OvicQueryCondition.equal,
                        value: this.classSelected.id.toString(),
                    },


                ],
                set: [
                    {label: 'orderby', value: 'ngay'},
                    {label: 'order', value: 'ASC'},
                        {label: 'limit', value: '-1'},
                ],

                page: '1',
        };
        this.calendarService.getCalendarByPageNew(condition_calendar).subscribe({
            next: (data) => {

                this.listCalendar = data.data.length > 0 ? data.data.map(m => {
                    m['__ngay'] = this.formatSQLDateTime(new Date(m.ngay));
                    return m
                }) : [];
                this.ngType = 1;

            }, error: () => {
                this.ngType = -1;
                this.notificationService.toastError('Mất kết nối với máy chủ');
            }
        })


    }


    formatSQLDateTime(date: Date): string {
        const y = date.getFullYear().toString();
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const d = date.getDate().toString().padStart(2, '0');
        const h = date.getHours().toString().padStart(2, '0');
        const min = date.getMinutes().toString().padStart(2, '0');
        const sec = date.getSeconds().toString().padStart(2, '0');
        //'YYYY-MM-DD hh:mm:ss' type of sql DATETIME format
        return `${d}-${m}-${y}`;
    }

    btnSelectItemView(item: ClassCalendar) {
        this.itemCalendar = {...item};
    }

}
