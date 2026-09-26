import { Component, inject, OnInit, TemplateRef, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { OvicTableStructure } from "@shared/models/ovic-models";
import { ArticleCategories, ArticleCategoriesService } from "@shared/services/article-categories.service";
import { NotificationService } from "@core/services/notification.service";
import { FileService } from "@core/services/file.service";
import { ThemeSettingsService } from "@core/services/theme-settings.service";
import { Paginator, PaginatorModule } from "primeng/paginator";
import { SharedModule } from "@shared/shared.module";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { ConditionOption } from "@shared/models/condition-option";
import { OvicQueryCondition } from "@core/models/dto";
import { OvicButton } from "@core/models/buttons";
import { OvicAvatarByHethongComponent } from "@shared/components/ovic-avatar-by-hethong/ovic-avatar-by-hethong.component";
import { UnsubscribeAndCompleteObserversOnDestroy } from "@core/utils/decorator";
import { OvicTableComponent } from '@modules/shared/components/ovic-table/ovic-table.component';
import { SelectModule } from 'primeng/select';
@UnsubscribeAndCompleteObserversOnDestroy()
@Component({
    selector: 'app-quan-ly-chuyen-muc',
    standalone: true,
    imports: [CommonModule, PaginatorModule, SharedModule, MatCheckboxModule, ReactiveFormsModule, OvicAvatarByHethongComponent, OvicTableComponent, SelectModule],
    templateUrl: './quan-ly-chuyen-muc.component.html',
    styleUrls: ['./quan-ly-chuyen-muc.component.css']
})
export class QuanLyChuyenMucComponent implements OnInit {
    private notifi = inject(NotificationService);
    private chuyenmucService = inject(ArticleCategoriesService);
    private fileService = inject(FileService);
    private themeSettingsService = inject(ThemeSettingsService);
    private fb = inject(FormBuilder);
    paginator = viewChild.required<Paginator>('paginator');

    formUpdate = viewChild.required<TemplateRef<any>>('formUpdate');
    page: number = 1;
    formSave: FormGroup;
    search: string = '';
    formTitle: string = 'Thêm chuyên mục mới';
    isAdmin: boolean = false;
    canAdded: boolean = true;
    canUpdate: boolean = true;
    canDelete: boolean = true;
    isUpdated: boolean = false;
    rows: number = 0;
    recordsFiltered: number = 0;
    listData: ArticleCategories[];
    chuyenMucSelect: ArticleCategories;


    private noitifi = inject(NotificationService);
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
            field: ['__status'],
            innerData: true,
            rowClass: '',
            header: 'Trạng thái',
            sortable: false,
            headClass: 'ovic-w-200px text-center'
        },

    ];

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

    // -----------------------------new -------------------------

    headButtons = [

        {
            label: 'Thêm mới',
            name: 'ADD_NEW_ROW',
            icon: 'pi-plus pi',
            class: 'p-button-rounded p-button-primary ml-3 mr-2',
            tooltip: 'Thêm tài khoản mới',
            tooltipPosition: 'left'
        }
    ];
    file_name: string = '';

    constructor(
    ) {
        this.rows = this.themeSettingsService.settings.rows;
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

        this.formSave = this.fb.group({
            title: ['', Validators.required],
            desc: [''],
            status: [1, Validators.required],
            image_url: [null],
        })
    }

    ngOnInit(): void {
        this.loadInit()
    }


    loadInit() {
        this.loadData(1)
    }

    loadData(page: number) {
        this.noitifi.isProcessing(true);
        this.page = page;
        const condition_data: ConditionOption = {
            condition: [],
            set: [
                { label: 'limit', value: this.rows.toString() },
                { label: 'orderby', value: 'id' },
            ],
            page: this.page.toString()
        }
        if (this.search) {
            condition_data.condition.push({
                conditionName: 'title',
                condition: OvicQueryCondition.like,
                value: `%${this.search}%`
            })
        }

        this.chuyenmucService.getDataByPageNew(condition_data).subscribe({
            next: ({ data, recordsFiltered }) => {
                this.recordsFiltered = recordsFiltered;
                this.listData = data.length > 0 ? data.map(m => {
                    m['__status'] = m.status !== -1 ? this.statusList.find(f => f.value === m.status).color : '';
                    // m['__grid'] = m.grid === 1  ? 'Dọc' : 'Ngang' ;
                    return m;
                }) : [];

                this.noitifi.isProcessing(false);


            },
            error: () => {
                this.noitifi.isProcessing(false);
                this.notifi.toastError('Không load được');

            }
        });

    }

    onPageChange(event) {
        this.page = event['page'] + 1;
        this.loadData(this.page);
    }

    get f() {
        return this.formSave.controls;
    }

    onSearch(event) {
        this.search = event ? event.trim() : '';
        this.loadData(1);
    }

    closeForm() {
        this.notifi.closeSideNavigationMenu();
    }

    openFormCreate(isUpdate: boolean, id?: number) {
        this.isUpdated = isUpdate;
        if (!this.isUpdated) {
            this.formTitle = 'Tạo mới';
            this.resetForm()

        } else {
            this.formTitle = 'Cập nhật';
            this.chuyenMucSelect = this.listData.find(f => f.id == id)
            this.formSave.reset({
                title: this.chuyenMucSelect.title,
                desc: this.chuyenMucSelect.desc,
                status: this.chuyenMucSelect.status,
                image_url: this.chuyenMucSelect.image_url,
            })
        }

        this.notifi.openSideNavigationMenu({ template: this.formUpdate(), size: 600, offsetTop: '0px' });
    }
    create() {
        if (this.formSave.valid) {
            const item = this.formSave.value;
            this.chuyenmucService.add(item).subscribe({
                next: () => {
                    this.loadData(this.page);
                    this.closeForm();
                    this.notifi.isProcessing(false);
                    this.notifi.toastSuccess('Thêm mới thành công');
                },
                error: () => {
                    this.notifi.isProcessing(false);
                    this.notifi.toastError('Thêm mới không thành công');
                }
            })

        } else {
            this.notifi.toastError('Vui lòng nhập đủ thông tin');
        }

    }

    resetForm() {
        this.formSave.reset({
            title: '',
            desc: '',
            status: 1,
            image_url: '',
        })
    }

    update() {
        if (this.formSave.valid) {
            const item = this.formSave.value;
            this.chuyenmucService.update(this.chuyenMucSelect.id, item).subscribe({
                next: (i) => {
                    this.loadData(this.page);
                    this.closeForm();
                    this.notifi.isProcessing(false);
                    this.notifi.toastSuccess('Thêm mới thành công');
                },
                error: () => {
                    this.notifi.isProcessing(false);
                    this.notifi.toastError('Thêm mới không thành công');
                }
            })

        } else {
            this.notifi.toastError('Vui lòng nhập đủ thông tin');
        }

    }

    userActions(btn: OvicButton) {
        switch (btn.name) {
            case 'DELETE':
                void this.delete(btn.data);
                break;
            case 'EDIT':
                void this.openFormCreate(true, btn.data);
                break;
            case 'ADD_NEW_ROW':
                void this.openFormCreate(false);
                break;
            default:
                break;
        }
    }

    delete(id: number) {
        this.notifi.confirmDelete().then(
            (a) => {
                if (a) {
                    this.chuyenmucService.delete(id).subscribe({
                        next: () => {
                            this.notifi.toastSuccess('Xoá thành công');
                            this.loadData(this.page);
                        },
                        error: () => this.notifi.toastError('Xóa thất bại')
                    });
                }
            },
            () => null
        );
    }



}
