import { Component, OnInit, TemplateRef, computed, inject, input, output, signal, viewChild } from '@angular/core';

import { SharedModule } from '@modules/shared/shared.module';
import { forkJoin } from 'rxjs';
import { ReactiveFormsModule, FormsModule, FormGroup, FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { OvicQueryCondition } from '@core/models/dto';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { CourseClo } from '@modules/shared/models/course-clo';
import { CourseFormThKthp } from '@modules/shared/models/course-form-th-kthp';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { HoidongThamdinhMonhocThanhvien } from '@modules/shared/models/hoidong-thamdinh-monhoc-thanhvien';
import { CourseFormThKthpService } from '@modules/shared/services/courrse-form-th-kthp.service';
import { CourseCloService } from '@modules/shared/services/course-clo.service';
import { CoursePlanActivityTuluanService } from '@modules/shared/services/course-plan-activity-tuluan.service';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { CHUAN_DAU_RA } from '@modules/shared/utils/syscat';
import { TableModule } from 'primeng/table';
import { DuyetFormDeComponent } from "../duyet-form-de/duyet-form-de.component";

@Component({
    selector: 'app-form-de-th-kthp',
    standalone: true,
    imports: [
    SharedModule,
    ReactiveFormsModule,
    FormsModule,
    TableModule,
    DuyetFormDeComponent
],
    templateUrl: './form-de-th-kthp.component.html',
    styleUrls: ['./form-de-th-kthp.component.css']
})
export class FormDeThKthpComponent implements OnInit {
    private notificationService = inject(NotificationService);
    private activatedRoute = inject(ActivatedRoute);
    private elnKhoaHocService = inject(ElnKhoaHocService);
    private elngUserProfileService = inject(ElngUserProfileService);
    private courseCloService = inject(CourseCloService);
    private router = inject(Router);
    private auth = inject(AuthService);
    private courseFormThKthpService = inject(CourseFormThKthpService);
    private formBuilder = inject(FormBuilder);
    private coursePlanActivityTuluanService = inject(CoursePlanActivityTuluanService);



    readonly templateAddForm = viewChild<TemplateRef<any>>('templateAddForm');

    readonly selectedCourse = input<ElnKhoaHoc>(undefined);

    readonly listThamDInh = input<HoidongThamdinhMonhocThanhvien[]>(undefined);

    readonly formType = input<'TN_KTHP' | 'TH_KTHP' | 'DG' | 'TNTX' | 'CC'>(undefined);

    readonly onChangeStatus = output<any>();

    readonly isManager = signal(false);

    readonly isLanhDaoKhoa = signal(false);

    readonly isLanhDaoBomon = signal(false);

    readonly routerAdmin = signal(false);

    readonly routerDaotao = signal(false);

    readonly routerLanhdaokhoa = signal(false);

    readonly routerGiangvien = signal(false);

    readonly routerLanhdaobomon = signal(false);

    readonly userId = signal<number>(undefined);

    readonly canAdded = signal(false);

    chuandaura = CHUAN_DAU_RA;

    readonly list_form = signal<CourseFormThKthp[]>(undefined);

    readonly selectForm = signal<CourseFormThKthp>(undefined);

    formData: FormGroup;

    readonly formTitle = signal<string>(undefined);

    readonly list_clo = signal<CourseClo[]>(undefined);

    readonly isUpdated = signal(false);

    readonly totalScore = computed(() => {
        const list_form = this.list_form();
        return list_form && list_form.length ? list_form.reduce((sum, x) => sum + (x.point * x.question_take || 0), 0) : 0;
    });

    readonly totalTake = computed(() => {
        const list_form = this.list_form();
        return list_form && list_form.length ? list_form.reduce((sum, x) => sum + (x.question_take || 0), 0) : 0;
    });

    ngOnInit(): void {
        this.loadForm();
    }

    loadForm() {
        this.notificationService.isProcessing(true);

        const condition_form: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse().id.toString() },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'ordering' },
            ],
            page: null
        }

        const condition_clo: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse().id.toString(), orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'ordering' }
            ],
            page: null
        }

        forkJoin([
            this.courseFormThKthpService.getCourseFormThKthpByPageNew(condition_form),
            this.courseCloService.getCourseCloByPageNew(condition_clo),
        ]).subscribe({
            next: ([_course_form, _clo]) => {
                _clo.data.forEach(f => {
                    f['show_name'] = f.kyhieu.concat(" - ", f.noidung ? f.noidung : 'Chưa có nội dung');
                })

                this.list_clo.set(_clo.data);

                this.list_form.set(_course_form.data);

                this.notificationService.isProcessing(false);
            },
            error: () => {
                this.notificationService.isProcessing(false);
            }
        })
    }

    changeStatusForm(event) {
        this.onChangeStatus.emit(event);
    }
}
