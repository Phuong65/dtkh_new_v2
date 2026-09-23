import { Component, OnInit, OnDestroy, ViewChild, ElementRef, TemplateRef, ChangeDetectorRef } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { HelperService } from '@core/services/helper.service';
import { AuthService } from '@core/services/auth.service';
import { DonViService } from 'src/app/modules/shared/services/don-vi.service';
import { DonVi } from 'src/app/modules/shared/models/don-vi';
import { OvicTableStructure } from 'src/app/modules/shared/models/ovic-models';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NORMAL_MODAL_OPTIONS } from '@shared/utils/syscat';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { OvicQueryCondition } from '@core/models/dto';
import { NotificationService } from '@core/services/notification.service';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@modules/shared/shared.module';
import { Router } from '@angular/router';

@Component({
    standalone: true,
    imports: [CommonModule, SharedModule, ReactiveFormsModule, FormsModule],
    selector: 'app-donvi',
    templateUrl: './donvi.component.html',
    styleUrls: ['./donvi.component.css']
})
export class DonviComponent implements OnInit, OnDestroy {

    handleChangeDonviSubscription: Subscription;
    @ViewChild('formInfo') formInfo: TemplateRef<any>;
    donviId: number;
    dmDonvi: DonVi[];
    selectedDonvi: DonVi;
    formData: FormGroup;
    formTitle = 'Thêm khoa mới';
    isAdmin = false;
    canAdded = false;
    canUpdate = false;
    canDelete = false;
    isUpdated = false;
    slugIsValid = true;
    tblCols: OvicTableStructure[] = [
        {
            fieldType: 'normal',
            field: ['title'],
            rowClass: '',
            header: 'Tên khoa',
            sortable: true,
            headClass: 'ovic-w-25'
        },
        {
            fieldType: 'normal',
            field: ['code'],
            rowClass: '',
            header: 'Ký tự viết tắt',
            sortable: true,
            headClass: 'ovic-w-25'
        },
        {
            fieldType: 'normal',
            field: ['description'],
            rowClass: '',
            header: 'Mô tả',
            sortable: false,
            headClass: ''
        }
    ];

    constructor(
        private helperService: HelperService,
        private modalService: NgbModal,
        private donViService: DonViService,
        public formBuilder: FormBuilder,
        private oauth: AuthService,
        private httpHelper: HttpParamsHeplerService,
        private noitifi: NotificationService,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) {
        this.formData = this.formBuilder.group(
            {
                title: ['', Validators.required],
                description: [''],
                parent_id: 0,
                status: 1,
                code: ['', Validators.required],
            }
        );
    }

    ngOnInit(): void {
        this.noitifi.isProcessing(true);
        const url = this.router.url.substring(7).split('?')[0];
        this.canAdded = this.oauth.userCanAdd(url);
        this.canUpdate = this.oauth.userCanEdit(url);
        this.canDelete = this.oauth.userCanDelete(url)
        this.donviId = this.oauth.user.donvi_id;
        const actions = this.canUpdate ? ['edit'] : [];
        if (this.canDelete) {
            actions.push('delete');
        }
        if (actions.length) {
            this.tblCols.push({
                tooltip: 'khoa',
                fieldType: 'actions',
                field: actions,
                rowClass: 'text-center',
                header: 'Hành động',
                sortable: false,
                headClass: 'ovic-w-110px text-center'
            });
        }
        this.loadData();
    }

    get f() {
        return this.formData.controls;
    }

    loadData() {
        this.noitifi.isProcessing(true);
        this.f['parent_id'].setValue(this.donviId);
        const condition_donvi = this.httpHelper.paramsConditionBuilder(
            [
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' },
                { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: this.donviId.toString(), orWhere: 'and' },
            ]
        ).set('limit', '-1').set("order", "ASC").set("orderby", "title")
        this.donViService.getDonViByCols(condition_donvi).subscribe({
            next: (dsDonVi) => {
                this.dmDonvi = dsDonVi;
                this.noitifi.isProcessing(false);
                this.cdr.markForCheck();
            },
            error: () => {
                this.noitifi.isProcessing(false);
                this.noitifi.toastError('Không load được danh mục khoa');
                this.cdr.markForCheck();
            }
        });
    }

    ngOnDestroy(): void {
        if (this.isAdmin) {
            this.handleChangeDonviSubscription.unsubscribe();
        }
    }

    onChangeSlug() {
        const slug = this.f['code'].value;
        this.checkIsValid('code', slug);
    }

    checkIsValid(col: string, item: string) {
        setTimeout(() => {
            const arr_condition = [
                { conditionName: col, condition: OvicQueryCondition.equal, value: item, orWhere: 'and' },
            ]

            if (this.isUpdated && this.selectedDonvi) {
                arr_condition.push({ conditionName: 'id', condition: OvicQueryCondition.notEqual, value: this.selectedDonvi.id.toString(), orWhere: 'and' },)
            }

            const condition_nganh = this.httpHelper.paramsConditionBuilder(arr_condition);
            this.donViService.getDonViByCols(condition_nganh).subscribe(
                result => {
                    if (result.length) {
                        this.slugIsValid = false;
                    } else {
                        this.slugIsValid = true;
                    }
                });
        }, 500)
    }

    createDonvi() {
        this.formData.reset();
        this.f['parent_id'].setValue(this.donviId);
        this.f['status'].setValue(1);

        this.isUpdated = false;
        this.formTitle = 'Thêm khoa mới';
        this.noitifi.openSideNavigationMenu({ template: this.formInfo, size: 600, offsetTop: '0px' });
    }

    editDonvi(donviId: number) {
        this.selectedDonvi = this.dmDonvi.find(school => school.id === donviId);
        if (this.selectedDonvi) {
            this.f['title'].setValue(this.selectedDonvi.title);
            this.f['description'].setValue(this.selectedDonvi.description);
            this.f['parent_id'].setValue(this.selectedDonvi.parent_id);
            this.f['status'].setValue(1);
            this.f['code'].setValue(this.selectedDonvi.code)
            this.isUpdated = true;
            this.formTitle = 'Sửa thông tin khoa';
            this.noitifi.openSideNavigationMenu({ template: this.formInfo, size: 600, offsetTop: '0px' });
        }
    }

    deleteDonvi(donviId: number) {
        this.noitifi.confirmDelete().then(
            (a) => {
                if (a) {
                    this.donViService.delete(donviId).subscribe({
                        next: () => {
                            this.noitifi.toastSuccess('Xoá khoa thành công');
                            this.loadData();
                        },
                        error: () => this.noitifi.toastError('Xóa khoa thất bại')
                    });
                }
            },
            () => null
        );
    }

    saveFormData(isUpdated: boolean, dismiss) {
        if (this.formData.valid && this.slugIsValid) {
            if (isUpdated) {
                this.donViService.update(this.selectedDonvi.id, this.formData.value).subscribe({
                    next: () => {
                        this.noitifi.toastSuccess('Sửa thông tin khoa thành công');
                        this.loadData();
                        this.closeForm();
                    },
                    error: () => this.noitifi.toastError('Sửa thông tin khoa thất bại')
                });
            } else {
                this.donViService.create(this.formData.value).subscribe({
                    next: () => {
                        this.noitifi.toastSuccess('Thêm khoa mới thành công');
                        this.loadData();
                        this.closeForm();
                    },
                    error: () => this.noitifi.toastError('Thêm mới khoa thất bại')
                });
            }
        } else {
            this.formData.markAllAsTouched();
            this.noitifi.toastWarning('Lỗi nhập liệu');
        }
    }

    closeForm() {
        this.noitifi.closeSideNavigationMenu();
    }

}
