import { CtdtCdrService } from './../../../../shared/services/ctdt-cdr.service';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@modules/shared/shared.module';
import { DividerModule } from 'primeng/divider';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { Router, ActivatedRoute } from '@angular/router';
import { OvicQueryCondition } from '@core/models/dto';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { ConfigsService } from '@modules/shared/services/configs.service';
import { CtdtMuctieuCutheService } from '@modules/shared/services/ctdt-muctieu-cuthe.service';
import { CtdtTuongthichService } from '@modules/shared/services/ctdt-tuongthich.service';
import { CtdtService } from '@modules/shared/services/ctdt.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { ROLES } from '@modules/shared/utils/syscat';
import { firstValueFrom, forkJoin } from 'rxjs';
import { Ctdt } from '@modules/shared/models/ctdt';
import { CtdtCdr } from '@modules/shared/models/ctdt-cdr';
import { CtdtMuctieuCuthe } from '@modules/shared/models/ctdt-muctieu-cuthe';
import { MultiSelectModule } from 'primeng/multiselect';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

export interface CtdtCdrParent extends CtdtCdr {
    children?: CtdtCdr[];
}

@Component({
    selector: 'app-ctdt-cdr',
    standalone: true,
    imports: [
        CommonModule,
        SharedModule,
        DividerModule,
        FormsModule,
        ReactiveFormsModule,
        TableModule,
        MultiSelectModule,
        NgbTooltipModule
    ],
    templateUrl: './ctdt-cdr.component.html',
    styleUrls: ['./ctdt-cdr.component.css']
})
export class CtdtCdrComponent implements OnInit {

    @ViewChild('templateCtdtCdr') templateCtdtCdr: TemplateRef<any>;

    isManager: boolean = false;

    isLanhDaoKhoa: boolean = false;

    userId: number = 0;

    selectedCtdt: Ctdt;

    donvi_chuyenmon_id: number;

    list_ctdt_cdr: CtdtCdrParent[] = [];

    selectedCtdtCdr: CtdtCdrParent;

    selectedParentCtdtCdr: CtdtCdrParent;

    list_cdr_muctieu: CtdtMuctieuCuthe[] = [];

    formCtdtCdr: FormGroup;

    isUpdated: boolean = false;

    formTitle: string;

    kyhieu_cdr: string;

    constructor(
        private auth: AuthService,
        private notificationService: NotificationService,
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private ctdtService: CtdtService,
        public formBuilder: FormBuilder,
        private elngUserProfileService: ElngUserProfileService,
        private ctdtCdrService: CtdtCdrService,
        private ctdtMuctieuCutheService: CtdtMuctieuCutheService,
    ) {
        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin) || this.auth.userHasRole(ROLES.troly_pdt) || this.auth.userHasRole(ROLES.chuyenvien_pdt) ? true : false;

        this.isLanhDaoKhoa = this.auth.userHasRole(ROLES.lanhdaokhoa);

        this.userId = this.auth.user.id;


        this.formCtdtCdr = this.formBuilder.group(
            {
                ctdt_id: ['', Validators.required],
                kyhieu: [''],
                ordering: ['', Validators.required],
                noidung: ['', Validators.required],
                parent_id: [''],
                tuongthich_peos: [''],
                percent_pi: ['']
            }
        );
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

                    const condition_muctieu_cuthe: ConditionOption = {
                        condition: [
                            { conditionName: 'ctdt_id', condition: OvicQueryCondition.equal, value: ctdtId.toString() },
                        ],
                        set: [
                            { label: 'limit', value: '-1' },
                            { label: 'orderby', value: 'ordering' },
                            { label: 'order', value: 'ASC' }
                        ],
                        page: null
                    }

                    forkJoin([
                        this.ctdtService.getCtdtByPageNew(contition_ctdt),
                        this.elngUserProfileService.getUserProfileByPageNewV2(condition_user),
                        this.ctdtMuctieuCutheService.getCtdtMuctieuCutheByPageNew(condition_muctieu_cuthe)
                    ]).subscribe({
                        next: ([_ctdt, _user, _ctdt_muctieu]) => {

                            this.selectedCtdt = _ctdt.data[0];

                            this.list_cdr_muctieu = _ctdt_muctieu.data;

                            if (!this.isManager && _user.data[0]) {
                                this.donvi_chuyenmon_id = _user.data[0].donvi_chuyenmon_id;
                                if (this.donvi_chuyenmon_id !== this.selectedCtdt.category_id) {
                                    this.router.navigate(['/admin/content-none']);
                                }
                            }

                            this.loadCtdtCdr();

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
        } else {
            this.router.navigate(['/admin/content-none']);
        }
    }

    get f() {
        return this.formCtdtCdr.controls;
    }

    loadCtdtCdr() {
        this.notificationService.isProcessing(true);

        const condition_ctdt_cdr: ConditionOption = {
            condition: [
                { conditionName: 'ctdt_id', condition: OvicQueryCondition.equal, value: this.selectedCtdt.id.toString() },],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'orderby', value: 'ordering' },
                { label: 'order', value: 'ASC' }
            ],
            page: null
        }

        this.ctdtCdrService.getCtdtCdrByPageNew(condition_ctdt_cdr).subscribe({
            next: (_ctdt_cdr) => {
                const parent: CtdtCdrParent[] = _ctdt_cdr.data.filter(m => m.parent_id === 0);
                parent.forEach(f => {
                    f.children = _ctdt_cdr.data.filter(m => m.parent_id === f.id);
                })
                this.list_ctdt_cdr = parent;

                if (this.selectedParentCtdtCdr) {
                    this.selectedParentCtdtCdr = this.list_ctdt_cdr.find(m => m.id === this.selectedParentCtdtCdr.id);
                }

                this.resetForm();
                this.notificationService.isProcessing(false);
            },
            error: () => {
                this.notificationService.isProcessing(false);
            }
        })
    }

    resetForm() {
        this.formCtdtCdr.reset();
        this.f['ctdt_id'].setValue(this.selectedCtdt.id);
        this.f['parent_id'].setValue(this.selectedParentCtdtCdr ? this.selectedParentCtdtCdr.id : 0);
        this.f['ordering'].setValue(this.list_ctdt_cdr.length ? this.list_ctdt_cdr[this.list_ctdt_cdr.length - 1].ordering + 1 : 1);
        if (this.selectedParentCtdtCdr) {
            const child = this.selectedParentCtdtCdr.children;
            this.f['ordering'].setValue(child.length ? child[child.length - 1].ordering + 1 : 1);
        }
        this.isUpdated = false;
    }

    openAddCtdtCdr(parent?: CtdtCdrParent) {
        this.selectedParentCtdtCdr = null;
        this.formTitle = "Tạo CDR";
        this.kyhieu_cdr = "PLO";
        if (parent) {
            this.selectedParentCtdtCdr = parent;
            this.kyhieu_cdr = "PI ".concat(parent.ordering.toString(), ".");
        }
        this.resetForm();
        this.notificationService.openSideNavigationMenu({ template: this.templateCtdtCdr, size: 700, offsetTop: '0px' })
    }


    async saveCtdtCdr() {
        if (this.formCtdtCdr.valid) {
            const data = { ...this.formCtdtCdr.getRawValue() };

            data['kyhieu'] = this.kyhieu_cdr.concat("", data['ordering'].toString());

            const condition: ConditionOption = {
                condition: [
                    { conditionName: 'kyhieu', condition: OvicQueryCondition.equal, value: data['kyhieu'], orWhere: 'and' },
                    { conditionName: 'ctdt_id', condition: OvicQueryCondition.equal, value: this.selectedCtdt.id.toString(), orWhere: 'and' },
                ],
                set: [
                    { label: 'limit', value: '1' }
                ],
                page: null
            }

            if (this.isUpdated && this.selectedCtdtCdr) {
                condition.condition.push({ conditionName: 'id', condition: OvicQueryCondition.notEqual, value: this.selectedCtdtCdr.id.toString(), orWhere: 'and' })
            }

            const check_data = await firstValueFrom(this.ctdtCdrService.getCtdtCdrByPageNew(condition));

            if (check_data.recordsFiltered !== 0) {
                this.notificationService.isProcessing(false);
                return this.notificationService.toastWarning("Ký hiệu đã tồn tại, vui lòng nhập lại");
            }

            if (this.isUpdated) {
                this.ctdtCdrService.updateCtdtCdr(this.selectedCtdtCdr.id, data).subscribe({
                    next: () => {
                        this.notificationService.toastSuccess("Sửa thành công");
                        this.closeForm();
                        this.loadCtdtCdr();
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError("Sửa thất bại")
                    }
                })
            } else {
                this.ctdtCdrService.addCtdtCdr(data).subscribe({
                    next: () => {
                        this.notificationService.toastSuccess("Thêm thành công");
                        this.loadCtdtCdr();
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError("Thêm thất bại")
                    }
                })
            }
        }
    }

    closeForm() {
        this.selectedParentCtdtCdr = null;
        this.notificationService.closeSideNavigationMenu();
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

    editCtdtCdr(ctdtCdr: CtdtCdrParent, ctdtCdrParent?: CtdtCdrParent) {
        this.selectedCtdtCdr = ctdtCdr;
        this.selectedParentCtdtCdr = ctdtCdrParent ? ctdtCdrParent : null;
        this.formTitle = "Sửa CDR";
        this.kyhieu_cdr = "PLO";
        if (ctdtCdrParent) {
            this.selectedParentCtdtCdr = ctdtCdrParent;
            this.kyhieu_cdr = "PI ".concat(ctdtCdrParent.ordering.toString(), ".");
        }
        this.resetForm();
        this.isUpdated = true;
        this.f['kyhieu'].setValue(ctdtCdr.kyhieu);
        this.f['ordering'].setValue(ctdtCdr.ordering);
        this.f['noidung'].setValue(ctdtCdr.noidung);
        this.f['parent_id'].setValue(ctdtCdr.parent_id);
        this.f['tuongthich_peos'].setValue(ctdtCdr.tuongthich_peos);
        this.f['percent_pi'].setValue(ctdtCdr.percent_pi);
        this.notificationService.openSideNavigationMenu({ template: this.templateCtdtCdr, size: 700, offsetTop: '0px' })
    }

    deleteCtdtCdr(ctdtCdr: CtdtCdrParent) {
        this.notificationService.confirmDelete().then(a => {
            if (a) {
                this.notificationService.isProcessing(true);
                let id_delete = [ctdtCdr.id];
                if (ctdtCdr.children && ctdtCdr.children.length) {
                    id_delete = id_delete.concat(ctdtCdr.children.map(m => m.id));
                }
                this.ctdtCdrService.deleteCtdtCdr(id_delete.toString()).subscribe({
                    next: () => {
                        this.notificationService.toastSuccess("Xóa thành công");
                        this.loadCtdtCdr();
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError("Xóa thất bại");
                    }
                })
            }
        })
    }

    checkTuongthich(id_tuongthich: number, _cdr: CtdtCdrParent) {
        const check = _cdr.tuongthich_peos.includes(id_tuongthich);
        if (check) {
            return true;
        }
        return false;
    }

}
