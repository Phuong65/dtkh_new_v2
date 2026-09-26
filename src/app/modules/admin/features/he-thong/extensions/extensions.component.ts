import { Component, inject, OnInit, TemplateRef, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { DataByExtension, Extensions, ExtensionsService } from "@shared/services/extensions.service";
import { OvicTableStructure } from "@shared/models/ovic-models";
import { NotificationService } from "@core/services/notification.service";
import { ThemeSettingsService } from "@core/services/theme-settings.service";
import { ConditionOption } from "@shared/models/condition-option";
import { SelectModule } from "primeng/select";
import { ButtonModule } from "primeng/button";
import { RippleModule } from "primeng/ripple";
import { SharedModule } from "@shared/shared.module";
import { OvicTableComponent } from '@modules/shared/components/ovic-table/ovic-table.component';

@Component({
    selector: 'app-extensions',
    standalone: true,
    imports: [CommonModule, SelectModule, ButtonModule, RippleModule, FormsModule, ReactiveFormsModule, SharedModule, OvicTableComponent],
    templateUrl: './extensions.component.html',
    styleUrls: ['./extensions.component.css']
})
export class ExtensionsComponent implements OnInit {

    private extensionsService = inject(ExtensionsService);
    private formBuilder = inject(FormBuilder);
    private noitifi = inject(NotificationService);
    private themeSettingsService = inject(ThemeSettingsService);
    formInfo = viewChild.required<TemplateRef<any>>('formInfo');


    donviId: number;

    formData: FormGroup;
    formTitle = 'Thêm mới';
    isAdmin = false;
    canAdded = true;
    canUpdate = true;
    canDelete = true;
    isUpdated = false;
    rows: number = 0;
    recordsFiltered: number = 0;
    listData: Extensions[];
    extension_select: Extensions;
    tblCols: OvicTableStructure[] = [
        {
            fieldType: 'normal',
            field: ['title'],
            rowClass: '',
            header: 'Tiêu đề',
            sortable: false,
            headClass: ''
        },
        {
            fieldType: 'normal',
            field: ['key'],
            rowClass: '',
            header: 'Ký tự viết tắt',
            sortable: false,
            headClass: ''
        },
        {
            fieldType: 'normal',
            field: ['__grid'],
            rowClass: 'text-center',
            header: 'Cách hiển thi',
            sortable: false,
            headClass: 'ovic-w-200px text-center'
        },
        {
            fieldType: 'normal',
            field: ['__status'],
            innerData: true,
            rowClass: '',
            header: 'Trạng thái',
            sortable: false,
            headClass: 'ovic-w-200px text-center'
        },
        // {
        //     fieldType: 'normal',
        //     // field:'',
        //     rowClass: '',
        //     header: 'Thao tác',
        //     sortable: false,
        //     headClass: ''
        // }
    ];


    listGrid = [
        { label: "Dọc", key: "vertical", value: 1, },
        { label: "Ngang", key: "horizontal", value: 0, },
    ]
    listStatus = [
        { label: "Kích hoạt", value: 1, },
        { label: "Chưa kích hoạt", value: 0, },
    ]
    statusList = [
        {
            value: 1,
            label: 'Đã kích hoạt',
            color: '<span class="badge badge--size-normal badge-success w-100">Kích hoạt</span>'
        },
        {
            value: 0,
            label: 'Chưa kích hoạt',
            color: '<span class="badge badge--size-normal badge-danger w-100">Chưa kích hoạt</span>'
        }
    ];

    dataAllItem: DataByExtension[] = [];

    constructor() {
        const actions = this.canUpdate ? ['edit'] : [];
        if (this.canDelete) {
            actions.push('delete');
        }
        if (actions.length) {
            this.tblCols.push({
                tooltip: '',
                fieldType: 'actions',
                field: actions,
                rowClass: 'text-center',
                header: 'Hành động',
                sortable: false,
                headClass: 'ovic-w-110px text-center'
            });
        }

        this.rows = this.themeSettingsService.settings.rows;
        this.formData = this.formBuilder.group(
            {
                title: ['', Validators.required],
                key: ['', Validators.required],
                grid: [false, Validators.required],
                grid_number: [0, Validators.required],
                enable: [false, Validators.required],
                data: [null, Validators.required],
            }
        );
    }

    ngOnInit(): void {

        this.loadData();
    }

    get f() {
        return this.formData.controls;
    }

    loadData() {
        this.noitifi.isProcessing(true);
        const condition_donvi: ConditionOption = {
            condition: [],
            set: [
                { label: 'limit', value: '20' },
                { label: 'orderby', value: 'id' },
                { label: 'include_by', value: 'name' }
            ],
            page: '1'
        }

        this.extensionsService.getDataByPageNew(condition_donvi).subscribe({
            next: ({ data, recordsFiltered }) => {
                this.recordsFiltered = recordsFiltered;
                this.listData = data.length > 0 ? data.map(m => {
                    m['__status'] = m.enable !== -1 ? this.statusList.find(f => f.value === m.enable).color : '';
                    m['__grid'] = m.grid === 1 ? 'Dọc' : 'Ngang';
                    return m;
                }) : [];
                this.noitifi.isProcessing(false);
            },
            error: () => {
                this.noitifi.isProcessing(false);
                this.noitifi.toastError('Không load được danh mục khoa')
            }
        });

    }


    create() {
        this.formData.reset({
            title: '',
            grid: false,
            grid_number: 0,
            enable: true,
            data: null,
        });
        // this.f['parent_id'].setValue(this.donviId);
        // this.f['status'].setValue(1);

        this.isUpdated = false;
        this.formTitle = 'Thêm mới';
        this.dataAllItem = [];
        this.noitifi.openSideNavigationMenu({ template: this.formInfo(), size: 600, offsetTop: '0px' });
    }

    edit(donviId: number) {
        this.extension_select = this.listData.find(item => item.id === donviId);

        if (this.extension_select) {
            this.formData.reset({
                title: this.extension_select.title,
                key: this.extension_select.key,
                grid: this.extension_select.grid,
                grid_number: this.extension_select.grid_number,
                enable: this.extension_select.enable,
                data: this.extension_select.data,
            });
            this.dataAllItem = this.extension_select.data;
            this.isUpdated = true;
            this.formTitle = 'Cập nhật';
            this.noitifi.openSideNavigationMenu({ template: this.formInfo(), size: 600, offsetTop: '0px' });

        }
    }

    delete(donviId: number) {
        this.noitifi.confirmDelete().then(
            (a) => {
                if (a) {
                    this.extensionsService.delete(donviId).subscribe({
                        next: () => {
                            this.noitifi.toastSuccess('Xoá thành công');
                            this.loadData();
                        },
                        error: () => this.noitifi.toastError('Xóa thất bại')
                    });
                }
            },
            () => null
        );
    }

    saveFormData(isUpdated: boolean) {
        const data = { ... this.formData.value, data: this.dataAllItem }
        this.f['data'].setValue(this.dataAllItem);
        if (this.formData.valid && !this.hasAnyEmptyValue(this.dataAllItem)) {
            if (isUpdated) {
                this.noitifi.isProcessing(true);
                this.extensionsService.update(this.extension_select.id, data).subscribe({
                    next: () => {
                        this.noitifi.toastSuccess('Cập nhật thành công');
                        this.loadData();
                        this.closeForm();
                        this.noitifi.isProcessing(false);

                    },
                    error: () => {
                        this.noitifi.isProcessing(false);
                        this.noitifi.toastError('Cập nhật thất bại')
                    }
                });
            } else {
                this.noitifi.isProcessing(true);
                this.extensionsService.add(data).subscribe({
                    next: () => {
                        this.noitifi.toastSuccess('Thêm mới thành công');
                        this.loadData();
                        this.closeForm();
                        this.noitifi.isProcessing(false);

                    },
                    error: () => {
                        this.noitifi.isProcessing(false);
                        this.noitifi.toastError('Thêm mới thất bại')
                    }
                });
            }
        } else {
            this.formData.markAllAsTouched();
            this.noitifi.toastWarning('Vui lòng nhập đủ thông tin ');
        }
    }

    private hasAnyEmptyValue(objArr: any[]): boolean {
        return objArr.some(obj => {
            return Object.keys(obj).some(key => {
                const value = obj[key];
                return value === null || value === undefined || value === '';
            });
        });
    }

    closeForm() {
        this.noitifi.closeSideNavigationMenu();
    }

    btnAddItem() {

        const item: DataByExtension = {
            id: this.reCreatId(this.dataAllItem),
            ordering: this.reCreatId(this.dataAllItem),
            name: '',
            image: '',
            url: '',
            enable: true,

        }
        this.dataAllItem.push(item);
    }

    reCreatId(data: any[]): number {
        if (!data || data.length === 0) {
            return 1;
        }

        const maxId = Math.max(...data.map(item => item.id));
        return maxId + 1;
    }
    btnAddItemSapxep() {
        if (this.dataAllItem.length > 0) {
            const data = this.dataAllItem.sort((a, b) => a.ordering - b.ordering);
            this.dataAllItem = [...data];
        }

    }
    btnDeleteItem(item: DataByExtension) {
        this.dataAllItem = this.dataAllItem.filter(f => f.id !== item.id);
    }

}
