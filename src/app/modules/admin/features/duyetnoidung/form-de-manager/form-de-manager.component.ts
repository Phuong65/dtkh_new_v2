import { CourseFormDuyetService } from './../../../../shared/services/course-form-duyet.service';
import { Component, OnInit, TemplateRef, AfterViewInit, inject, input, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { HoidongThamdinhMonhocThanhvien } from '@modules/shared/models/hoidong-thamdinh-monhoc-thanhvien';
import { AuthService } from '@core/services/auth.service';
import { HelperService } from '@core/services/helper.service';
import { NotificationService } from '@core/services/notification.service';
import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';
import { OvicDateTimeService } from '@modules/shared/services/ovic-date-time.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '@modules/shared/shared.module';
import { TabsModule } from 'primeng/tabs';
import { key_server, APP_CONFIGS } from '@env';
import { FormDeLuyentapComponent } from "../form-de-luyentap/form-de-luyentap.component";
import { FormDeDgComponent } from "../form-de-dg/form-de-dg.component";
import { FormDeTnTxComponent } from "../form-de-tn-tx/form-de-tn-tx.component";
import { FormDeTnKthpComponent } from "../form-de-tn-kthp/form-de-tn-kthp.component";
import { FormDeThKthpComponent } from "../form-de-th-kthp/form-de-th-kthp.component";
import { ConditionOption } from '@modules/shared/models/condition-option';
import { OvicQueryCondition } from '@core/models/dto';
import { firstValueFrom } from 'rxjs';
import { ROLES } from '@modules/shared/utils/syscat';

@Component({
    selector: 'app-form-de-manager',
    standalone: true,
    imports: [
        CommonModule,
        SharedModule,
        ReactiveFormsModule,
        FormsModule,
        TabsModule,
        FormDeLuyentapComponent,
        FormDeDgComponent,
        FormDeTnTxComponent,
        FormDeTnKthpComponent,
        FormDeThKthpComponent
    ],
    templateUrl: './form-de-manager.component.html',
    styleUrls: ['./form-de-manager.component.css']
})
export class FormDeManagerComponent implements OnInit, AfterViewInit {
    private notificationService = inject(NotificationService);
    private coursePlanActivitiesService = inject(CoursePlanActivitiesService);
    private auth = inject(AuthService);
    private helperService = inject(HelperService);
    private ovicDateTimeService = inject(OvicDateTimeService);
    private courseFormDuyetService = inject(CourseFormDuyetService);


    readonly selectedCourse = input<ElnKhoaHoc>(undefined);

    readonly listThamDInh = input<HoidongThamdinhMonhocThanhvien[]>(undefined);

    readonly cc = viewChild<TemplateRef<any>>("cc");

    readonly dg = viewChild<TemplateRef<any>>("dg");

    readonly tntx = viewChild<TemplateRef<any>>("tntx");

    readonly kthptn = viewChild<TemplateRef<any>>("kthptn");

    readonly kthpth = viewChild<TemplateRef<any>>("kthpth");

    activeIndexTab: number = 0;

    keyServer = key_server;

    readonly list_tab = signal<any[]>([]);

    selectTab: any;

    readonly rejectRole = signal(false);

    readonly isLoading = signal(true);

    isDttx = APP_CONFIGS.isDttx;
    constructor() {
        this.rejectRole.set(this.auth.userHasRole(ROLES.admin) || this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.chuyenvien_pdt) || this.auth.userHasRole(ROLES.hoidongthi_lanhdao) || this.auth.userHasRole(ROLES.lanhdaokhoa) || this.auth.userHasRole(ROLES.lanhdaobomon) ? true : false);
    }

    ngAfterViewInit(): void {
        this.loadStatusForm();
    }

    ngOnInit(): void {

    }

    trackByKey(index: number, item: any): string {
        return item.key;
    }

    getStatusDotClass(status: number): string {
        switch (status) {
            case 1: return 'status-dot-active';
            case 0: return 'status-dot-deactive';
            case -1: return 'status-dot-redo';
            case -2: return 'status-dot-require';
            default: return 'status-dot-deactive';
        }
    }

    changeTabView(event?: any) {
        const index = event?.index ?? this.activeIndexTab;
        this.selectTab = this.list_tab()[index] || this.list_tab()[0] || null;
    }

    async loadStatusForm() {
        this.isLoading.set(true);

        const condition_form: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse().id.toString(), orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '-1' }
            ],
            page: null
        };

        try {
            const _form = await firstValueFrom(this.courseFormDuyetService.getCourseFormDuyetByPageNew(condition_form));

            let data = [];
            const selectedCourse = this.selectedCourse();
            const selectedCourseValue = this.selectedCourse();
            switch (this.keyServer) {
                case 'hvu':
                    data = [
                        { label: 'Luyện tập tại nhà', key: 'CC', component: this.cc() },
                        { label: 'Kiểm tra TN - TX', key: 'TNTX', component: this.tntx() },
                    ];

                    if (selectedCourse && selectedCourse.params && selectedCourse.params.exam_format === "TRACNGHIEM") {
                        data.push({ label: 'KTHP - TN', key: 'TN_KTHP', component: this.kthptn() });
                    }

                    if (selectedCourse && selectedCourse.params && selectedCourse.params.exam_format === "THUCHANH") {
                        data.push({ label: 'KTHP - '.concat(selectedCourse['hinhthucthi']), key: 'TH_KTHP', component: this.kthpth() });
                    }

                    break;
                default:
                    if (this.isDttx) {
                        data = [
                            { label: 'Luyện tập tại nhà', key: 'CC', component: this.cc() },
                            { label: 'Kiểm tra giữa kỳ', key: 'TNTX', component: this.tntx() },
                        ]
                    } else {
                        data = [
                            { label: 'Luyện tập tại nhà', key: 'CC', component: this.cc() },
                            { label: 'Kiểm tra 15p', key: 'DG', component: this.dg() },
                            { label: 'Kiểm tra TN - TX', key: 'TNTX', component: this.tntx() },
                        ];
                    }
                    if (selectedCourseValue && selectedCourseValue.params && selectedCourseValue.params.exam_format === "TRACNGHIEM") {
                        data.push({ label: 'KTHP - TN', key: 'TN_KTHP', component: this.kthptn() });
                    }

                    if (selectedCourseValue && selectedCourseValue.params && selectedCourseValue.params.exam_format === "THUCHANH") {
                        data.push({ label: 'KTHP - '.concat(selectedCourseValue['hinhthucthi']), key: 'TH_KTHP', component: this.kthpth() });
                    }

                    break;
            }

            data.forEach(f => {
                const index = _form.data.findIndex(m => m.form_type === f.key);
                f['status'] = 0;
                if (index !== -1) {
                    f['id'] = _form.data[index].id;
                    f['status'] = _form.data[index].status;
                    f['approved_at'] = _form.data[index].approved_at;
                }
            });

            this.list_tab.set(data);
            if (this.activeIndexTab >= this.list_tab().length) {
                this.activeIndexTab = 0;
            }
            this.selectTab = this.list_tab()[this.activeIndexTab] || null;
        } catch (error) {
            this.list_tab.set([]);
        } finally {
            this.isLoading.set(false);
        }
    }

    onChangeStatus(event) {
        this.selectTab['id'] = event.id;
        this.selectTab['status'] = event.status;
        this.selectTab['approved_at'] = event.approved_at;
    }

    reDoAction(event, panel, status) {
        if (panel) {
            this.notificationService.isProcessing(true);
            this.courseFormDuyetService.updateCourseFormDuyet(panel.id, { status: status, old_status: !status ? 1 : 0 }).subscribe({
                next: () => {
                    this.notificationService.isProcessing(false);
                    panel.status = status;
                },
                error: () => {
                    this.notificationService.isProcessing(false);
                }
            });
        }
    }
}
