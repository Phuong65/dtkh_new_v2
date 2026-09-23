import { Component, OnInit } from '@angular/core';

import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { Title } from '@angular/platform-browser';
import { OvicQueryCondition } from '@core/models/dto';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { CtdtService } from '@modules/shared/services/ctdt.service';
import { Ctdt } from '@modules/shared/models/ctdt';
import { ROLES, DANHHIEU_TOTNGHIEP } from '@modules/shared/utils/syscat';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { SharedModule } from '@modules/shared/shared.module';
import { DonVi } from '@modules/shared/models/don-vi';
import { ElnChuyenMuc } from '@modules/shared/models/Elng';
import { HeDt } from '@modules/shared/models/he-dt';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { firstValueFrom, forkJoin } from 'rxjs';
import { ElnChuyenMucService } from '@modules/shared/services/elearning-chuyen-muc.service';
import { HeDtService } from '@modules/shared/services/he-dt.service';
import { DonViService } from '@modules/shared/services/don-vi.service';
import { InputQuestionDirectionComponent } from "../../cauhoi-tracnghiem/input-question-direction/input-question-direction.component";
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-ctdt-thongtin',
    standalone: true,
    imports: [
    RouterModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    NgbTooltipModule
],
    templateUrl: './ctdt-thongtin.component.html',
    styleUrls: ['./ctdt-thongtin.component.css']
})
export class CtdtThongtinComponent implements OnInit {

    isLanhDaoKhoa: boolean = false;

    isManager: boolean = false;

    selectedCtdt: Ctdt;

    formCtdt: FormGroup;

    isUpdated: boolean = false;

    list_donvi: DonVi[];

    list_nganh: ElnChuyenMuc[];

    danhhieu_totnghiep = DANHHIEU_TOTNGHIEP;

    list_hedt: HeDt[];

    userId: number;

    donvi_chuyenmon_id: number;

    ckEditor = {
        mota: null,
        cohoihoctap_sautotnghiep: null,
        vitri_lamviec_sautotnghiep: null
    };
    constructor(
        private auth: AuthService,
        private notificationService: NotificationService,
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private ctdtService: CtdtService,
        private title: Title,
        public formBuilder: FormBuilder,
        private elngUserProfileService: ElngUserProfileService,
        private elnChuyenMucService: ElnChuyenMucService,
        private heDtService: HeDtService,
        private donViService: DonViService
    ) {
        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin) || this.auth.userHasRole(ROLES.troly_pdt) || this.auth.userHasRole(ROLES.chuyenvien_pdt) ? true : false;

        this.isLanhDaoKhoa = this.auth.userHasRole(ROLES.lanhdaokhoa);

        this.formCtdt = this.formBuilder.group(
            {
                ten: ['', Validators.required],
                mota: [''],
                madt: ['', Validators.required],
                nganh_id: ['', Validators.required],
                he_dt: [''],
                danhhieu_totnghiep: [''],
                thoigian_daotao: [''],
                vitri_lamviec_sautotnghiep: [''],
                cohoihoctap_sautotnghiep: [''],
                category_id: ['', Validators.required],
                khoa_apdung: [''],
            }
        );

        this.userId = this.auth.user.id;
    }

    get f() {
        return this.formCtdt.controls;
    }

    ngOnInit(): void {
        if (this.isLanhDaoKhoa || this.isManager) {
            this.activatedRoute.queryParams.subscribe(async (params) => {
                if (params && params['code']) {

                    this.notificationService.isProcessing(true);

                    const ctdtId = params['code'];

                    const contition_ctdt: ConditionOption = {
                        condition: [
                            { conditionName: 'id', condition: OvicQueryCondition.equal, value: ctdtId.toString() },
                        ],
                        set: [
                            { label: 'limit', value: '1' }
                        ],
                        page: null
                    }

                    const condition_user: ConditionOption = {
                        condition: [
                            { conditionName: 'user_id', condition: OvicQueryCondition.equal, value: this.userId.toString(), orWhere: 'and' },
                        ],
                        set: [
                            { label: 'limit', value: '1' },
                        ],
                        page: null
                    }

                    const condition_nganh: ConditionOption = {
                        condition: [
                            { conditionName: 'type', condition: OvicQueryCondition.equal, value: 'nganh', orWhere: 'and' },
                        ],
                        set: [
                            { label: 'limit', value: '-1' }
                        ],
                        page: null
                    }

                    const condition_donvi: ConditionOption = {
                        condition: [
                            { conditionName: 'status', condition: OvicQueryCondition.greaterThan, value: '0', orWhere: 'and' },
                            { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: this.auth.user.donvi_id.toString(), orWhere: 'and' },
                        ],
                        set: [
                            { label: 'limit', value: '-1' },
                            { label: 'order', value: 'ASC' },
                            { label: 'orderby', value: 'title' }
                        ],
                        page: null
                    }


                    forkJoin([
                        this.ctdtService.getCtdtByPageNew(contition_ctdt),
                        this.elnChuyenMucService.getChuyemucByPageNew(condition_nganh),
                        this.donViService.getDonviByPageNew(condition_donvi),
                        this.elngUserProfileService.getUserProfileByPageNewV2(condition_user),
                        this.heDtService.getAllHeDt(),
                    ]).subscribe({
                        next: ([_ctdt, _nganh, _donvi, _user, _hedt]) => {

                            this.selectedCtdt = _ctdt.data[0];

                            if (!this.isManager && _user.data[0]) {
                                this.donvi_chuyenmon_id = _user.data[0].donvi_chuyenmon_id;
                                if (this.donvi_chuyenmon_id !== this.selectedCtdt.category_id) {
                                    this.router.navigate(['/admin/content-none']);
                                }
                            }

                            this.list_nganh = _nganh.data;
                            this.list_donvi = _donvi.data;
                            this.list_hedt = _hedt;
                            this.resetForm();
                            this.notificationService.isProcessing(false);
                        },
                        error: () => {

                        }
                    })
                } else {
                    this.router.navigate(['/admin/content-none']);
                }
            })
        } else {
            this.router.navigate(['/admin/content-none']);
        }
    }

    pointQuestionKeyDown(event: KeyboardEvent) {
        if (!event) return;

        const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight'];

        if (/^[0-9]$/.test(event.key)) {
            return;
        }

        if (allowedKeys.includes(event.key)) {
            return;
        }

        event.preventDefault();
    }

    onChangeDonviCM(event: DonVi) {
        this.f['nganh_id'].setValue(null);
    }

    resetForm() {
        this.formCtdt.reset();
        this.f['ten'].setValue(this.selectedCtdt.ten);
        this.f['mota'].setValue(this.selectedCtdt.mota);
        this.f['nganh_id'].setValue(this.selectedCtdt.nganh_id);
        this.f['he_dt'].setValue(this.selectedCtdt.he_dt);
        this.f['danhhieu_totnghiep'].setValue(this.selectedCtdt.danhhieu_totnghiep);
        this.f['thoigian_daotao'].setValue(this.selectedCtdt.thoigian_daotao);
        this.f['madt'].setValue(this.selectedCtdt.madt);
        this.f['category_id'].setValue(this.selectedCtdt.category_id);
        this.f['khoa_apdung'].setValue(this.selectedCtdt.khoa_apdung);
        // if (this.ckEditor.mota) {
        //     this.ckEditor.mota.data.set('');
        // }

        // if (this.ckEditor.vitri_lamviec_sautotnghiep) {
        //     this.ckEditor.vitri_lamviec_sautotnghiep.data.set('');
        // }
        // if (this.ckEditor.cohoihoctap_sautotnghiep) {
        //     this.ckEditor.cohoihoctap_sautotnghiep.data.set('');
        // }

        this.f['vitri_lamviec_sautotnghiep'].setValue(this.selectedCtdt.vitri_lamviec_sautotnghiep);
        this.f['cohoihoctap_sautotnghiep'].setValue(this.selectedCtdt.cohoihoctap_sautotnghiep);
    }

    saveCtdt() {
        if (this.formCtdt.valid) {
            this.notificationService.isProcessing(true);
            const data = { ...this.formCtdt.getRawValue() }
            this.ctdtService.updateCtdt(this.selectedCtdt.id, data).subscribe({
                next: () => {
                    this.notificationService.isProcessing(false);
                    this.notificationService.toastSuccess("Sửa thành công");
                },
                error: () => {
                    this.notificationService.isProcessing(false);
                    this.notificationService.toastError("Sửa thất bại");
                }
            })
        }
    }

    ckEditorSetup(ckEditor, name) {
        this.ckEditor[name] = ckEditor;
    }
}
