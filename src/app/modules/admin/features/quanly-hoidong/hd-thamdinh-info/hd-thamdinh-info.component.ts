import { DonViService } from '@modules/shared/services/don-vi.service';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@modules/shared/shared.module';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { OvicQueryCondition } from '@core/models/dto';
import { NotificationService } from '@core/services/notification.service';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { forkJoin } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { HoidongThamdinhService } from '@modules/shared/services/hoidong-thamdinh.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { HoidongThamdinh } from '@modules/shared/models/hoidong-thamdinh';
import { DatePickerModule } from 'primeng/datepicker';
import { OpenFileManagerV2Component } from '@modules/shared/components/open-file-manager-v2/open-file-manager-v2.component';
import { DonVi } from '@modules/shared/models/don-vi';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { HelperService } from '@core/services/helper.service';
import { HOIDONG_STATUS, ROLES } from '@modules/shared/utils/syscat';

@Component({
    selector: 'app-hd-thamdinh-info',
    standalone: true,
    imports: [
        CommonModule,
        SharedModule,
        ReactiveFormsModule,
        FormsModule,
        DatePickerModule,
        OpenFileManagerV2Component
    ],
    templateUrl: './hd-thamdinh-info.component.html',
    styleUrls: ['./hd-thamdinh-info.component.css']
})
export class HdThamdinhInfoComponent implements OnInit {

    formData: FormGroup;

    isLanhdaokhoa: boolean = false;

    isLanhDaoBomon: boolean = false;

    isManager: boolean = false;

    selectedHoidong: HoidongThamdinh;

    list_donvi_chuyenmon: DonVi[];

    hoidong_status = HOIDONG_STATUS;
    constructor(
        public formBuilder: FormBuilder,
        private notificationService: NotificationService,
        private activatedRoute: ActivatedRoute,
        private auth: AuthService,
        private router: Router,
        private hoidongThamdinhService: HoidongThamdinhService,
        private elngUserProfileService: ElngUserProfileService,
        private httpHepler: HttpParamsHeplerService,
        private donViService: DonViService,
        private helperService: HelperService
    ) {
        this.formData = this.formBuilder.group(
            {
                title: ['', Validators.required],
                desc: [''],
                date_start: ['', Validators.required],
                date_end: ['', Validators.required],
                category_id: ['', Validators.required],
                type: ['', Validators.required],
                status: [''],
                files: ['']
            }
        );

        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin) || this.auth.userHasRole(ROLES.hoidongthi_lanhdao) || this.auth.userHasRole(ROLES.chuyenvien_pdt) ? true : false;

        this.isLanhdaokhoa = this.auth.userHasRole(ROLES.lanhdaokhoa);

        this.isLanhDaoBomon = this.auth.userHasRole(ROLES.lanhdaobomon);
    }

    ngOnInit(): void {
        this.activatedRoute.queryParams.subscribe((params) => {
            if (params && params['code']) {
                this.notificationService.isProcessing(true);

                const hoidong_id = params['code'];

                const contition: ConditionOption = {
                    condition: [
                        { conditionName: 'id', condition: OvicQueryCondition.equal, value: hoidong_id.toString() },
                    ],
                    set: [
                        { label: 'limit', value: '1' }
                    ],
                    page: null
                }

                const condition_user: ConditionOption = {
                    condition: [
                        { conditionName: 'user_id', condition: OvicQueryCondition.equal, value: this.auth.user.id.toString(), orWhere: 'and' }
                    ],
                    set: [
                        { label: 'limit', value: '-1' }
                    ],
                    page: null
                }

                const condition_donvi = this.httpHepler.paramsConditionBuilder([
                    { conditionName: 'status', condition: OvicQueryCondition.greaterThan, value: '0', orWhere: 'and' },
                    { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: this.auth.user.donvi_id.toString(), orWhere: 'and' },
                ]).set("limit", -1).set("order", "ASC").set("orderby", "title");

                forkJoin([
                    this.hoidongThamdinhService.getHoidongThamdinhByPageNew(contition),
                    this.elngUserProfileService.getUserProfileByPageNewV2(condition_user),
                    this.donViService.getDonViByCols(condition_donvi)
                ]).subscribe({
                    next: ([_hoidong, _user, _donvi]) => {
                        this.list_donvi_chuyenmon = _donvi;
                        if (_hoidong.recordsFiltered) {
                            this.selectedHoidong = _hoidong.data[0];
                            if (!this.isManager) {
                                if (!_user.data[0] || this.selectedHoidong.category_id !== _user.data[0].donvi_chuyenmon_id) {
                                    this.router.navigate(['/admin/content-none']);
                                }
                            }
                            this.formReset();
                        }
                        this.notificationService.isProcessing(false)
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastWarning("Lỗi kết nối, vui lòng thử lại");
                    }
                })
            } else {
                this.router.navigate(['/admin/content-none']);
            }
        })
    }

    get f() {
        return this.formData.controls;
    }

    formReset() {
        this.formData.reset();
        this.f['title'].setValue(this.selectedHoidong.title);
        this.f['date_start'].setValue(this.selectedHoidong.date_start ? new Date(this.selectedHoidong.date_start) : null);
        this.f['date_end'].setValue(this.selectedHoidong.date_end ? new Date(this.selectedHoidong.date_start) : null);
        this.f['category_id'].setValue(this.selectedHoidong.category_id);
        this.f['status'].setValue(this.selectedHoidong.status);
        this.f['type'].setValue(this.selectedHoidong.type);
        this.f['files'].setValue(this.selectedHoidong.files);
    }


    saveHoidong() {
        if (this.formData.valid) {
            this.notificationService.isProcessing(true);
            const data = { ...this.formData.getRawValue() };
            data['date_start'] = this.helperService.strToSQLDate(data['date_start']);
            data['date_end'] = this.helperService.strToSQLDate(data['date_end']);

            this.hoidongThamdinhService.updateHoidongThamdinh(this.selectedHoidong.id, data).subscribe({
                next: () => {
                    this.notificationService.toastSuccess("Sửa thành công");
                    this.notificationService.isProcessing(false);
                },
                error: () => {
                    this.notificationService.isProcessing(false);
                    this.notificationService.toastError("Sửa thất bại");
                }
            })
        }
    }
}
