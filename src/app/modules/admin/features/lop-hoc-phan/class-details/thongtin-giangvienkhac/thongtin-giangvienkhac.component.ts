
import {
    Component,
    Input,
    OnInit,
    TemplateRef,
    ViewChild,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatListModule, MatSelectionList, MatSelectionListChange } from '@angular/material/list';

import { OvicButton } from '@core/models/buttons';
import { OvicQueryCondition } from '@core/models/dto';
import { User } from '@core/models/user';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { RoleService } from '@core/services/role.service';
import { UserService } from '@core/services/user.service';
import { Classes } from '@modules/shared/models/classes';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { OvicTableStructure } from '@modules/shared/models/ovic-models';
import { ClassesService } from '@modules/shared/services/classes.service';
import { SharedModule } from '@modules/shared/shared.module';
import { ROLES } from '@modules/shared/utils/syscat';


@Component({
    standalone: true,
    imports: [SharedModule, MatListModule, ReactiveFormsModule, FormsModule],
    selector: 'app-thongtin-giangvienkhac',
    templateUrl: './thongtin-giangvienkhac.component.html',
    styleUrls: ['./thongtin-giangvienkhac.component.css'],
})
export class ThongtinGiangvienkhacComponent implements OnInit {
    @Input() classSelected: Classes;

    @Input() canEdit: boolean = false;

    @ViewChild('templateGiangvien') templateGiangvien: TemplateRef<any>;

    searchUser: string;

    dmTeacher: User[] = [];

    list_all_teacher: User[] = [];


    manager_id: number;

    tblColsSupport: OvicTableStructure[] = [
        {
            fieldType: 'normal',
            field: ['display_name'],
            rowClass: '',
            header: 'Họ tên',
            sortable: false,
            headClass: '',
        },
        {
            fieldType: 'normal',
            field: ['email'],
            rowClass: '',
            header: 'email',
            sortable: false,
            innerData: true,
            headClass: '',
        },
        {
            fieldType: 'normal',
            field: ['phone'],
            rowClass: '',
            header: 'Số điện thoại',
            sortable: false,
            innerData: true,
            headClass: 'ovic-w-250px',
        },
    ];

    headButtons = [];

    constructor(
        private userService: UserService,
        private noitifi: NotificationService,
        private roleService: RoleService,
        private auth: AuthService,
        private classesService: ClassesService
    ) { }

    ngOnInit(): void {
        if (this.canEdit) {
            this.headButtons = [
                {
                    label: 'Thêm mới',
                    name: 'ADD_NEW_ROW',
                    icon: 'pi-plus pi',
                    class: 'p-button-rounded p-button-success ml-3 mr-2',
                    tooltip: 'Thêm giảng viên',
                    tooltipPosition: 'left',
                },
            ];

            this.tblColsSupport.push({
                tooltip: ' ',
                fieldType: 'actions',
                checker: 'disable_delete',
                field: ['delete'],
                rowClass: 'text-center',
                header: 'Thao tác',
                sortable: false,
                headClass: 'ovic-w-90px',
            });
        }
        this.loadGiangvienkhac();
    }

    loadGiangvienkhac() {
        if (this.classSelected && this.classSelected.manager_ids) {
            const supporter_ids = this.classSelected.manager_ids
                .split('|')
                .filter((m) => m && m !== '');
            if (supporter_ids.length > 1) {
                this.manager_id = supporter_ids[0];
                supporter_ids.splice(0, 1);
                const condition_giangvien: ConditionOption = {
                    condition: [],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'include', value: supporter_ids.toString() },
                        { label: 'include_by', value: 'id' },
                    ],
                    page: null,
                };
                this.noitifi.isProcessing(true);
                this.userService
                    .getUserByPageNew(condition_giangvien)
                    .subscribe({
                        next: (_giangvien) => {
                            this.dmTeacher = _giangvien.data;
                            this.noitifi.isProcessing(false);
                        },
                        error: () => {
                            this.noitifi.isProcessing(false);
                            this.noitifi.toastError(
                                'Lỗi kết nối, vui lòng thử lại'
                            );
                        },
                    });
            } else if (supporter_ids.length === 1) {
                this.manager_id = supporter_ids[0];
                this.dmTeacher = [];
            } else {
                this.manager_id = null;
                this.dmTeacher = [];
            }
        }
    }

    userActions(btn: OvicButton) {
        switch (btn.name) {
            case 'DELETE':
                this.deleteSupport(btn.data);
                break;
            case 'ADD_NEW_ROW':
                this.loadALLSupport();
                break;
            default:
                break;
        }
    }

    getRolesPromise(): Promise<any> {
        return new Promise((resolve, reject) => {
            const objectRoles = {};
            const condition: ConditionOption = {
                condition: [],
                set: [
                    { label: 'limit', value: '-1' },
                    { label: 'include', value: ROLES.giangvien.concat(",", ROLES.trogiang) },
                    { label: 'include_by', value: 'name' },
                ],
                page: null,
            };
            this.roleService.getRolesByPageNew(condition).subscribe({
                next: (_role) => {
                    _role.data.forEach((f) => {
                        objectRoles[f.name] = f;
                    });

                    this.noitifi.isProcessing(false);
                    resolve(objectRoles);
                },
                error: () => {
                    this.noitifi.isProcessing(false);
                    this.noitifi.toastError(
                        'Lỗi kết nối, vui lòng thử lại, hoặc liên hệ với kỹ thuật viên nếu thử lại không thành công'
                    );
                    resolve(null);
                },
            });
        });
    }

    async loadALLSupport() {
        if (this.manager_id) {
            this.noitifi.isProcessing(true);

            const objectRoles = await this.getRolesPromise();

            const ids_roles = [];

            Object.keys(objectRoles).forEach((f) => {
                ids_roles.push(objectRoles[f].id);
            });

            const roleATeacher = this.auth.roles.find((r) => r.name === ROLES.giangvien);

            const option: ConditionOption = {
                condition: [
                    {
                        conditionName: 'id',
                        condition: OvicQueryCondition.notEqual,
                        value: this.manager_id.toString(),
                    },
                ],
                set: [
                    { label: 'limit', value: '-1' },
                    {
                        label: 'role_ids',
                        value: roleATeacher
                            ? roleATeacher['id'].toString()
                            : ids_roles.toString(),
                    },
                ],
                page: null,
            };

            this.userService.getUserByPageNew(option).subscribe({
                next: (_teach) => {
                    _teach.data.forEach((f) => {
                        const index = this.dmTeacher.findIndex(
                            (m) => m.id === f.id
                        );
                        if (index !== -1) {
                            f['checked'] = true;
                        } else {
                            f['checked'] = false;
                        }
                    });
                    this.list_all_teacher = _teach.data;
                    this.noitifi.openSideNavigationMenu({
                        template: this.templateGiangvien,
                        size: 600,
                        offsetTop: '0px'
                    });
                    this.noitifi.isProcessing(false);
                },
                error: () => {
                    this.noitifi.toastError('Lỗi kết nối, vui lòng thử lại');
                    this.noitifi.isProcessing(false);
                },
            });
        } else {
            this.noitifi.toastWarning('Vui lòng chọn giảng viên chính trước');
        }
    }

    changeSelecGiangvien(event: MatSelectionListChange) {
        if (event) {

            const index = this.list_all_teacher.findIndex(m => m.id === event.options[0].value['id']);
            if (index !== -1) {
                this.list_all_teacher[index]['checked'] = event.options[0].selected;
            }
        }
    }

    saveSupport() {
        const manager_ids = [this.classSelected['manager_id']];
        const manager_info = [this.classSelected['giangvien'].concat('*')];
        const trogiang = [];
        const data_checked = this.list_all_teacher.filter(m => m['checked'] === true);
        if (data_checked.length) {
            data_checked.forEach((f, key) => {
                manager_ids.push(f.id);
                manager_info.push(f.display_name);
                trogiang.push(f.display_name);
            });

            this.noitifi.isProcessing(true);
            this.classesService.updateDataClasses(this.classSelected.id, {
                manager_ids: '|'.concat(manager_ids.join('|'), '|'),
                manager_info: manager_info.toString(),
            }).subscribe({
                next: (res) => {
                    this.noitifi.toastSuccess('Cập nhật thành công');
                    this.classSelected.manager_ids = '|'.concat(manager_ids.join('|'), '|');
                    this.classSelected.manager_info = manager_info.toString();
                    if (trogiang.length)
                        this.classSelected['trogiang'] = trogiang.join(', ');
                    this.closeForm();
                    this.noitifi.isProcessing(false);
                    this.loadGiangvienkhac();
                },
                error: () => {
                    this.noitifi.isProcessing(false);
                    this.noitifi.toastError(
                        'Cập nhật thất bại, vui lòng thử lại'
                    );
                },
            });
        } else {
            this.noitifi.isProcessing(false);
        }
    }

    deleteSupport(event) {
        if (this.canEdit) {
            this.noitifi.confirmDelete().then(
                (a) => {
                    if (a) {
                        const manager_ids = [this.classSelected['manager_id']];
                        const manager_info = [
                            this.classSelected['giangvien'].concat('*'),
                        ];
                        const trogiang = [];
                        this.dmTeacher.forEach((f, key) => {
                            if (f.id !== event) {
                                manager_ids.push(f.id);
                                manager_info.push(f.display_name);
                                trogiang.push(f.display_name);
                            }
                        });
                        this.classesService.updateDataClasses(this.classSelected.id, {
                            manager_ids: '|'.concat(manager_ids.join('|'), '|'),
                            manager_info: manager_info.toString(),
                        }).subscribe({
                            next: (res) => {
                                this.classSelected.manager_ids = '|'.concat(manager_ids.join('|'), '|');
                                this.classSelected.manager_info = manager_info.toString();
                                if (trogiang.length)
                                    this.classSelected['trogiang'] =
                                        trogiang.join(', ');
                                this.noitifi.toastSuccess('Xóa thành công');
                                this.loadGiangvienkhac();
                            },
                            error: () =>
                                this.noitifi.toastError('Xóa thất bại'),
                        });
                    }
                },
                () => null
            );
        } else {
            this.noitifi.toastWarning('Bạn không có quyền');
        }
    }

    closeForm() {
        this.noitifi.closeSideNavigationMenu();
    }
}
