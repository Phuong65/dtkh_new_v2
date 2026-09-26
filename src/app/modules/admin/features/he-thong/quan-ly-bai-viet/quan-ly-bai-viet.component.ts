import { Component, inject, OnInit, TemplateRef, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RippleModule } from "primeng/ripple";
import { ButtonModule } from "primeng/button";
import { Paginator, PaginatorModule } from "primeng/paginator";
import { ThemeSettingsService } from "@core/services/theme-settings.service";
import { NotificationService } from "@core/services/notification.service";
import { ArticleCategories, ArticleCategoriesService } from "@shared/services/article-categories.service";
import { ArticlePosts, ArticlePostsService } from "@shared/services/article-posts.service";
import { OvicAvatarByHethongComponent } from "@shared/components/ovic-avatar-by-hethong/ovic-avatar-by-hethong.component";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { ConditionOption } from "@shared/models/condition-option";
import { OvicQueryCondition } from "@core/models/dto";
import { Subscription } from "rxjs";
import { SharedModule } from "@shared/shared.module";
import { MultiSelectModule } from "primeng/multiselect";
import { HelperService } from "@core/services/helper.service";
import { ArticlePostCateService } from "@shared/services/article-post-cate.service";
import { getLinkDownload_aws } from "@env";
import {
    InputQuestionDirectionComponent
} from "@modules/admin/features/cauhoi-tracnghiem/input-question-direction/input-question-direction.component";
import { CheckboxModule } from "primeng/checkbox";
import { SelectModule } from 'primeng/select';
import { OpenFileManagerV2Component } from '@modules/shared/components/open-file-manager-v2/open-file-manager-v2.component';


@Component({
    selector: 'app-quan-ly-bai-viet',
    standalone: true,
    imports: [CommonModule, RippleModule, ButtonModule, PaginatorModule, OvicAvatarByHethongComponent, ReactiveFormsModule, SharedModule, MultiSelectModule, InputQuestionDirectionComponent, CheckboxModule, SelectModule, OpenFileManagerV2Component],
    templateUrl: './quan-ly-bai-viet.component.html',
    styleUrls: ['./quan-ly-bai-viet.component.css']
})
export class QuanLyBaiVietComponent implements OnInit {

    private themeSettingsService = inject(ThemeSettingsService);
    private notifi = inject(NotificationService);
    private baivietServices = inject(ArticlePostsService);
    private fb = inject(FormBuilder);
    private chuyenmucService = inject(ArticleCategoriesService);
    private helperService = inject(HelperService);
    private articlePostCateService = inject(ArticlePostCateService);
    paginator = viewChild.required<Paginator>('paginator');
    formUpdate = viewChild.required<TemplateRef<any>>('formUpdate');



    rows: number = 0;
    recordsFiltered: number = 0;

    formSave: FormGroup;
    page: number = 1;

    isUpdated: boolean = false;

    listData: ArticlePosts[] = [];
    postSelect: ArticlePosts;
    formTitle: string = '';

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

    typeList = [
        {
            value: 0,
            label: 'Bài viết',
        },
        {
            value: 1,
            label: 'Thông báo',
        }
    ]

    search: string = '';
    sizeFullWidth = 1024;
    subscription = new Subscription();
    listChuyenmuc: ArticleCategories[];

    textViewByOvic = `<p>Tải ảnh nền <span style="color:red">(*)</span></p>`;
    constructor(
    ) {
        const observerOnResize = this.notifi.observeScreenSize.subscribe(size => this.sizeFullWidth = size.width)
        this.subscription.add(observerOnResize);
        this.rows = this.themeSettingsService.settings.rows;
        // this.rows = 1;
        this.formSave = this.fb.group({
            title: ['', Validators.required],
            short_desc: [''],
            content: [''],
            image_url: [null, Validators.required],
            tags: [null, Validators.required],
            status: [1, Validators.required],
            cate_ids: [null],
            ghim: [0],
            type: [0],
            files: [null]
        })


    }

    ngOnInit(): void {
        this.loadInit()
    }

    loadInit() {
        this.notifi.isProcessing(true);
        const condition_chuyenmuc: ConditionOption = {
            condition: [],
            set: [
                { label: 'limit', value: '-1' },
            ],
            page: '1'
        }

        this.chuyenmucService.getDataByPageNew(condition_chuyenmuc).subscribe({
            next: ({ data }) => {
                this.listChuyenmuc = data;

                this.loadData(1)

            }, error: () => {
                this.notifi.toastError("Load dữ liệu không thành công");
            }
        })



    }

    type_select: number = null;
    drdSearchChage(event) {
        this.type_select = event ? event['value'] : null;
        this.type_select = event ? event['value'] : null;
        this.page = 1;
        this.loadData(this.page);
    }

    loadData(page: number) {
        this.notifi.isProcessing(true);
        this.page = page;

        const condition_data: ConditionOption = {
            condition: [],
            set: [
                { label: 'limit', value: this.rows.toString() },
                { label: 'orderby', value: 'ghim' },
                { label: 'order', value: 'DESC' },
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
        if (this.type_select) {
            condition_data.condition.push({
                conditionName: 'type',
                condition: OvicQueryCondition.equal,
                value: this.type_select.toString()
            })
        }
        this.notifi.isProcessing(true);
        this.baivietServices.getDataByPageNew(condition_data).subscribe({
            next: ({ data, recordsFiltered }) => {
                this.recordsFiltered = recordsFiltered;
                this.listData = data.length > 0 ? data.map(m => {
                    m['__status'] = m.status !== -1 ? this.statusList.find(f => f.value === m.status).color : '';
                    m['__content'] = this.helperService.decodeHTML(m.content);
                    m['__chuyenmuc'] = m.cate_ids ? (m.cate_ids.map(a => this.listChuyenmuc.find(f => f.id === a) ? this.listChuyenmuc.find(f => f.id === a).title : '').join(', ')) : '';
                    m['__link_img'] = m.image_url && m.image_url.length > 0 ? getLinkDownload_aws(m.image_url[0].id.toString()) : 'assets/images/baiviet.jpg';
                    // m['__grid'] = m.grid === 1  ? 'Dọc' : 'Ngang' ;
                    return m;
                }) : [];

                this.notifi.isProcessing(false);

            },
            error: () => {
                this.notifi.toastError('Không load được dữ liệu');
                this.notifi.isProcessing(false);

            }
        });
    }

    btnViewForm(isUpdate: boolean, id?: number) {
        this.isUpdated = isUpdate
        if (!isUpdate) {
            this.postSelect = null;
            this.formTitle = 'Tạo mới bài viết';
            this.resetForm()
            this.notifi.openSideNavigationMenu({ template: this.formUpdate(), size: this.sizeFullWidth, offsetTop: '0px' });

        } else {

            this.postSelect = this.listData.find(f => f.id === id)

            this.formSave.reset({
                title: this.postSelect.title,
                short_desc: this.postSelect.short_desc,
                content: this.helperService.decodeHTML(this.postSelect.content),
                image_url: this.postSelect.image_url,
                tags: this.postSelect.tags.join(';'),
                status: this.postSelect.status,
                cate_ids: this.postSelect.cate_ids,
                ghim: this.postSelect.ghim === 1,
                type: this.postSelect.type === 1,
                files: this.postSelect.files,
            })

            // if (this.ckEditor.editor1) {
            //     this.ckEditor.editor1.data.set('');
            // }

            if (this.ckEditor.editor1 && this.ckEditor.editor1.data) {
                this.ckEditor.editor1.data.set(this.postSelect.content ? this.postSelect.content : '');
            }
            this.formTitle = 'Cập nhật bài viết';

            this.notifi.openSideNavigationMenu({ template: this.formUpdate(), size: this.sizeFullWidth, offsetTop: '0px' });

        }
    }

    create() {
        if (this.formSave.valid) {

            // this.baivietServices.add()

            const object = {
                title: this.f['title'].value,
                short_desc: this.f['short_desc'].value,
                content: this.f['content'].value,
                image_url: this.f['image_url'].value,
                tags: this.f['tags'].value.trim().replace(/\s+/g, " ").split(';').filter(item => item !== ""),
                status: this.f['status'].value,
                cate_ids: this.f['cate_ids'].value,
                ghim: this.f['ghim'].value,
                type: this.f['type'].value,
            }
            this.notifi.isProcessing(true);
            this.baivietServices.add(object).subscribe({
                next: (id) => {

                    this.articlePostCateService.uploadByPost(id, object.cate_ids).subscribe()
                    this.closeForm();
                    this.loadData(this.page);
                    this.notifi.isProcessing(false);
                    this.notifi.toastSuccess('Thêm mới thành công');

                }, error: () => {
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
            short_desc: '',
            content: '',
            image_url: null,
            tags: null,
            status: 1,
            cate_ids: null,
            ghim: 0,
            type: 0,
            files: null,
        })

        if (this.ckEditor.editor1) {
            this.ckEditor.editor1.data.set('');
        }
    }

    update() {

        // this.f['content'].setValue()
        // console.log(this.f['image_url'].value );
        if (this.formSave.valid) {
            // this.baivietServices.add()

            const object = {
                title: this.f['title'].value,
                short_desc: this.f['short_desc'].value,
                content: this.f['content'].value,
                image_url: this.f['image_url'].value,
                tags: this.f['tags'].value.trim().replace(/\s+/g, " ").split(';').filter(item => item !== ""),
                status: this.f['status'].value,
                cate_ids: this.f['cate_ids'].value,
                ghim: this.f['ghim'].value,
                type: this.f['type'].value,
                files: this.f['files'].value,

            }


            this.notifi.isProcessing(true);
            this.baivietServices.update(this.postSelect.id, object).subscribe({
                next: () => {
                    this.articlePostCateService.uploadByPost(this.postSelect.id, object.cate_ids && object.cate_ids.length > 0 ? object.cate_ids : []).subscribe()
                    this.loadData(this.page);
                    this.closeForm();
                    this.notifi.isProcessing(false);
                    this.notifi.toastSuccess('Cập nhật thành công');

                }, error: () => {
                    this.notifi.isProcessing(false);
                    this.notifi.toastError('Cập nhật không thành công');
                }
            })
        } else {
            this.notifi.toastError('Vui lòng nhập đủ thông tin');
        }

    }

    closeForm() {
        this.notifi.closeSideNavigationMenu();

    }

    get f() {
        return this.formSave.controls;
    }

    onPageChange(event) {
        this.page = event['page'] + 1;
        this.loadData(this.page);
    }

    delete(id: number) {
        this.notifi.confirmDelete().then(
            (a) => {
                if (a) {
                    this.baivietServices.delete(id).subscribe({
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

    btnSearch(event) {
        this.search = event.target.value ? event.target.value.trim() : ''
        this.page = 1;
        this.loadData(this.page);
    }

    ckEditor = {
        editor1: null,
    };

    ckEditorSetup(ckEditor, name) {
        this.ckEditor[name] = ckEditor;
    }

}
