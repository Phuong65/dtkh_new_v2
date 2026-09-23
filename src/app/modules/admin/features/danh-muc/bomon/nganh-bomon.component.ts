import { Component, ElementRef, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { OvicTableStructure } from '../../../../shared/models/ovic-models';
import { ElnChuyenMucService } from '../../../../shared/services/elearning-chuyen-muc.service';
import { ElnChuyenMuc } from '../../../../shared/models/Elng';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NORMAL_MODAL_OPTIONS } from '../../../../shared/utils/syscat';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { HelperService } from '@core/services/helper.service';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { forkJoin } from 'rxjs';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { OvicQueryCondition } from '@core/models/dto';
import { DonViService } from '@modules/shared/services/don-vi.service';
import { DonVi } from '@modules/shared/models/don-vi';
import { Router } from '@angular/router';
import { SharedModule } from '@modules/shared/shared.module';
import { CommonModule } from '@angular/common';
import { APP_CONFIGS } from '@env';

@Component({
    standalone: true,
    imports: [CommonModule, SharedModule, ReactiveFormsModule, FormsModule],
    selector: 'app-nganh-bomon',
    templateUrl: './nganh-bomon.component.html',
    styleUrls: ['./nganh-bomon.component.css']
})
export class NganhBomonComponent implements OnInit {
    dmParent: ElnChuyenMuc[];
    @ViewChild('formInfo') formInfo: TemplateRef<any>;
    chuyenmucId: number;
    dmChuyenmuc: ElnChuyenMuc[];
    selectedChuyenmuc: ElnChuyenMuc;
    formData: FormGroup;
    formTitle = 'Thêm mới';
    isAdmin = false;
    canAdded = false;
    isUpdated = false;
    showParent = false;
    titleIsValid = true;
    slugIsValid = true;
    donviId: number;
    dmDonvi_chuyenmon: DonVi[];
    app_config = APP_CONFIGS;
    tblCols: OvicTableStructure[] = [
        {
            fieldType: 'normal',
            field: ['title'],
            rowClass: '',
            header: 'Tên',
            sortable: false,
            headClass: 'ovic-w-500px'
        },
        {
            fieldType: 'normal',
            field: ['code'],
            rowClass: 'text-center',
            header: 'Mã bộ môn',
            sortable: false,
            headClass: 'ovic-w-150px text-center',
        },
        {
            fieldType: 'normal',
            field: ['khoa'],
            rowClass: '',
            header: 'Khoa',
            sortable: false,
            innerData: true,
            headClass: 'ovic-w-500px'
        },
        {
            fieldType: 'normal',
            field: ['desc'],
            rowClass: '',
            header: 'Mô tả',
            sortable: false,
            innerData: true,
            headClass: ''
        }
    ];

    constructor(
        private helperService: HelperService,
        private modalService: NgbModal,
        private elnChuyenMucService: ElnChuyenMucService,
        public formBuilder: FormBuilder,
        private auth: AuthService,
        private noitifi: NotificationService,
        private httpHelper: HttpParamsHeplerService,
        private donViService: DonViService,
        private router: Router
    ) {
        this.formData = this.formBuilder.group(
            {
                title: ['', Validators.required],
                slug: ['', Validators.required],
                donvi_chuyenmon_id: ['', Validators.required],
                donvi_id: [''],
                type: ['', Validators.required],
                desc: [''],
                parent_id: 0,
                ordering: 1000,
                icon: [''],
            }
        );

        if (APP_CONFIGS.codeByLvl) {
            this.formData = this.formBuilder.group(
                {
                    title: ['', Validators.required],
                    slug: ['', Validators.required],
                    donvi_chuyenmon_id: ['', Validators.required],
                    donvi_id: [''],
                    type: ['', Validators.required],
                    desc: [''],
                    parent_id: 0,
                    ordering: 1000,
                    icon: [''],
                    sup_code: ['', Validators.required]
                }
            );
        }

        this.donviId = this.auth.user.donvi_id;
        const actions = [];
        const url = this.router.url.substring(7).split('?')[0];
        if (this.auth.userCanEdit(url)) {
            actions.push('edit');
        }
        if (this.auth.userCanDelete(url)) {
            actions.push('delete');
        }

        this.canAdded = this.auth.userCanAdd(url);
        if (actions.length) {
            this.tblCols.push({
                tooltip: 'Bộ môn',
                fieldType: 'actions',
                field: actions,
                rowClass: 'text-center',
                header: 'Thao tác',
                sortable: false,
                headClass: 'ovic-w-90px text-center'
            });
        }
    }

    get f() {
        return this.formData.controls;
    }

    ngOnInit(): void {

        //this.helperService.( 'Danh mục Ngành - Bộ môn' );
        this.noitifi.isProcessing(true);
        this.loadData();
    }

    loadData(donvi_chuyenmon_id?: number) {
        const arr_condition = [
            { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' },
            { conditionName: 'donvi_id', condition: OvicQueryCondition.equal, value: this.donviId.toString(), orWhere: 'and' },
        ]

        const condition_donvi = this.httpHelper.paramsConditionBuilder([
            { conditionName: 'status', condition: OvicQueryCondition.greaterThan, value: '0', orWhere: 'and' },
            { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: this.donviId.toString(), orWhere: 'and' },
        ]).set('limit', '-1').set("order", "ASC").set("orderby", "title");


        if (donvi_chuyenmon_id) {
            arr_condition.push({ conditionName: 'donvi_chuyenmon_id', condition: OvicQueryCondition.equal, value: donvi_chuyenmon_id.toString(), orWhere: 'and' },)
        }

        arr_condition.push({ conditionName: 'type', condition: OvicQueryCondition.equal, value: "bomon", orWhere: 'and' },)

        const condition_nganh = this.httpHelper.paramsConditionBuilder(arr_condition).set('limit', '-1');

        forkJoin([
            this.elnChuyenMucService.getElnChuyenMucByCols(condition_nganh),
            this.donViService.getDonViByCols(condition_donvi)
        ]).subscribe({
            next: ([_nganh, _donvi]) => {
                _nganh.forEach(f => {
                    const index = _donvi.findIndex(m => m.id === f.donvi_chuyenmon_id);
                    if (index !== -1) {
                        f['khoa'] = _donvi[index].title;
                    }
                })
                this.dmChuyenmuc = this.helperService.sort(_nganh, 'ordering');
                this.dmDonvi_chuyenmon = _donvi;
                this.noitifi.isProcessing(false)
            },
            error: () => {
                this.noitifi.isProcessing(false);
                this.noitifi.toastError('Không tải được danh mục Bộ môn');
            }
        });
    }

    onChangeTitle() {
        if (this.f['title'].value) {
            const slug = this.helperService.slugVietnamese(this.f['title'].value);
            const title = this.f['title'].value;
            this.f['slug'].setValue(slug);
            this.checkIsValid('slug', slug);
        }
    }

    onChangeSlug() {
        const slug = this.f['slug'].value;
        this.checkIsValid('slug', slug);
    }

    checkIsValid(col: string, item: string) {
        setTimeout(() => {
            const arr_condition = [
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' },
                { conditionName: col, condition: OvicQueryCondition.equal, value: item, orWhere: 'and' },
            ]

            if (this.isUpdated && this.selectedChuyenmuc) {
                arr_condition.push({ conditionName: 'id', condition: OvicQueryCondition.notEqual, value: this.selectedChuyenmuc.id.toString(), orWhere: 'and' },)
            }

            const condition_nganh = this.httpHelper.paramsConditionBuilder(arr_condition);
            this.elnChuyenMucService.getElnChuyenMucByCols(condition_nganh).subscribe(
                result => {
                    if (result.length) {
                        this.slugIsValid = false;
                    } else {
                        this.slugIsValid = true;
                    }
                });
        }, 500)
    }

    afterDeleteData(chuyenmucId: number) {
        const index = this.dmChuyenmuc.findIndex(m => m.id === chuyenmucId);
        if (index !== -1) {
            this.dmChuyenmuc.splice(index, 1);
        }
    }

    resetForm() {
        this.formData.reset();
        this.slugIsValid = true;
        this.f['ordering'].setValue(1000);
        this.f['type'].setValue("bomon");
        this.f['donvi_id'].setValue(this.donviId);
        this.f['donvi_chuyenmon_id'].setValue(this.dmDonvi_chuyenmon && this.dmDonvi_chuyenmon.length ? this.dmDonvi_chuyenmon[0].id : null);
        this.isUpdated = false;
    }


    createChuyenmuc() {
        this.resetForm();
        this.formTitle = 'Thêm mới';
        this.noitifi.openSideNavigationMenu({ template: this.formInfo, size: 600, offsetTop: '0px' })
    }

    editChuyenmuc(chuyenmucId: number) {
        this.resetForm();
        this.slugIsValid = true;
        this.selectedChuyenmuc = this.dmChuyenmuc.find(m => m.id === chuyenmucId);
        if (this.selectedChuyenmuc) {
            this.f['title'].setValue(this.selectedChuyenmuc.title);
            this.f['desc'].setValue(this.selectedChuyenmuc.desc);
            this.f['ordering'].setValue(this.selectedChuyenmuc.ordering);
            this.f['slug'].setValue(this.selectedChuyenmuc.slug);
            this.f['donvi_chuyenmon_id'].setValue(this.selectedChuyenmuc.donvi_chuyenmon_id);
            this.f['type'].setValue(this.selectedChuyenmuc.type);
            if (this.selectedChuyenmuc.code) {
                const sup_code = this.selectedChuyenmuc.code.split(".");
                if (sup_code[1]) {
                    this.f['sup_code'].setValue(sup_code[1]);
                }
            }
            this.isUpdated = true;
            this.formTitle = 'Sửa thông tin ';
            this.noitifi.openSideNavigationMenu({ template: this.formInfo, size: 600, offsetTop: '0px' })
        }
    }

    deleteChuyenmuc(chuyenmucId: number) {
        this.noitifi.confirmDelete().then(
            (a) => {
                if (a) {
                    this.noitifi.isProcessing(true);
                    this.elnChuyenMucService.deleteElnChuyenMuc(chuyenmucId).subscribe({
                        next: () => {
                            this.noitifi.toastSuccess('Xoá thành công');
                            this.loadData();
                        },
                        error: () => {
                            this.noitifi.toastError('Xóa thất bại');
                            this.noitifi.isProcessing(false);
                        }
                    });
                }
            },
            () => null
        );
    }

    saveFormData(isUpdated: boolean) {
        if (this.formData.valid) {
            const data = { ... this.formData.getRawValue() };
            let first_code = '';
            const index_code = this.dmDonvi_chuyenmon.findIndex(m => m.id === data['donvi_chuyenmon_id']);
            if (this.app_config.codeByLvl) {
                if (index_code !== -1) {
                    first_code = this.dmDonvi_chuyenmon[index_code].code;
                    console.log(data['sup_code'])
                    data['code'] = first_code.concat(".", data['sup_code']);
                }
            } else {
                data['code'] = data['sup_code'];
            }
            
            delete data['sup_code'];

            this.noitifi.isProcessing(true);

            if (this.isUpdated) {
                this.elnChuyenMucService.updateElnChuyenMuc(this.selectedChuyenmuc.id, data).subscribe({
                    next: () => {
                        this.noitifi.toastSuccess('Sửa thông tin thành công');
                        this.resetForm();
                        this.closeForm();
                        this.loadData();
                    },
                    error: () => {
                        this.noitifi.isProcessing(false);
                        this.noitifi.toastError('Sửa thông tin thất bại');
                    }
                });
            } else {
                this.elnChuyenMucService.addElnChuyenMuc(data).subscribe({
                    next: () => {
                        this.noitifi.toastSuccess('Thêm mới thành công');
                        this.resetForm();
                        this.loadData();
                    },
                    error: () => {
                        this.noitifi.toastError('Thêm thất bại');
                        this.noitifi.isProcessing(false);
                    }
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

    creatNgChangeActive(type) {
        this.f['type'].setValue(type);
    }

    onChangeDropdownEvent(event: DonVi) {
        if (event && event.id) {
            this.loadData(event.id);
        } else {
            this.loadData();
        }
    }


}
