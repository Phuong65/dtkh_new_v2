import {Component, OnInit, inject, input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {AbstractControl} from "@angular/forms";
import {DonViService} from "@shared/services/don-vi.service";
import {ClassManagement, ClassManagementService} from "@shared/services/class-management.service";
import {ConditionOption} from "@shared/models/condition-option";
import {OvicQueryCondition} from "@core/models/dto";
import {AuthService} from "@core/services/auth.service";
import {DonVi} from "@shared/models/don-vi";
import {SharedModule} from "@shared/shared.module";
import {ButtonModule} from "primeng/button";
import {RippleModule} from "primeng/ripple";
import {CheckboxModule} from "primeng/checkbox";
import {MatCheckboxModule} from "@angular/material/checkbox";

@Component({
    selector: 'ovic-select-classmanagement',
    standalone: true,
    imports: [CommonModule, SharedModule, ButtonModule, RippleModule, CheckboxModule, MatCheckboxModule],
    templateUrl: './ovic-select-classmanagement.component.html',
    styleUrls: ['./ovic-select-classmanagement.component.css']
})
export class OvicSelectClassmanagementComponent implements OnInit {

    defaultValue = input<any>();
    formField = input<AbstractControl>();
    mutiSelect = input<boolean>(false);

    listDonvi: DonVi[] = [];
    listKhoa: ClassManagement[] = [];
    listClassManagement: ClassManagement[] = [];

    objectFilter: { donvi_id: number, khoa: number } = {
        donvi_id: null,
        khoa: null,
    };

    ids_select: number[] = [];

    private donViService = inject(DonViService);
    private classManagementService = inject(ClassManagementService);
    private auth = inject(AuthService);

    ngOnInit(): void {

        this.getDataInit();

        const field = this.formField();
        if (field) {
            field.valueChanges.subscribe(value => {

                if (Array.isArray(value) &&  value.length == 0) {
                    this.formField()!.setValue([], {emitEvent: false});
                    this.objectFilter = {
                        khoa: null,
                        donvi_id: null
                    }
                    this.listKhoa = [];
                    this.listClassManagement = [];
                }
            });
        }
    }

    getDataInit() {
        const condition_donvi: ConditionOption = {
            condition: [
                {conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1'},
                {
                    conditionName: 'parent_id',
                    condition: OvicQueryCondition.equal,
                    value: this.auth.userDonViId.toString(),
                    orWhere: 'and'
                }
            ],
            set: [
                {label: 'limit', value: '-1'}
            ],
            page: null
        };

        this.donViService.getDonviByPageNew(condition_donvi).subscribe({
            next: ({data}) => {
                this.listDonvi = data;
            }, error: () => {

            }
        })
    }

    selectDonvi(dv: DonVi) {
        this.objectFilter.donvi_id = dv.id;
        const conditionKhoaByClassManegement: ConditionOption = {
            condition: [
                {conditionName: 'donvi_id', condition: OvicQueryCondition.equal, value: dv.id.toString()}
            ],
            set: [
                {label: 'groupby', value: 'khoa'},
                {label: 'orderby', value: 'Khoa'},
                {label: 'order', value: 'ASC'},
                {label: 'limit', value: '-1'},
            ]
            ,
            page: '1'
        }
        this.classManagementService.getDataByPageNew(conditionKhoaByClassManegement).subscribe({
            next: ({data}) => {
                this.listKhoa = data.length > 0 ? data.map(m => {
                    m['_khoa_convert'] = 'K' + m.khoa
                    return m;
                }) : [];
                // this.listClassManagementBackup = [...this.listClassManagementBackup,...data];
            }
        })
    }

    selectKhoa(khoa: ClassManagement) {
        this.objectFilter.khoa = khoa.khoa;
        const conditionGetLop: ConditionOption = {
            condition: [
                {
                    conditionName: 'donvi_id',
                    condition: OvicQueryCondition.equal,
                    value: this.objectFilter.donvi_id.toString()
                },
                {
                    conditionName: 'khoa',
                    condition: OvicQueryCondition.equal,
                    value: this.objectFilter.khoa.toString()
                },
            ],
            set: [
                {label: 'limit', value: '-1'},
                {label: 'order', value: 'ASC'},
                {label: 'orderby', value: 'title'},
            ],
            page: '1'
        }
        this.classManagementService.getDataByPageNew(conditionGetLop).subscribe({
            next: ({data}) => {
                this.listClassManagement = data.length > 0 ?
                    data.sort((a, b) => a.title.localeCompare(b.title)).map(m => {
                        m['checked'] = false;
                        return m;
                    })
                    : [];
                // this.listClassManagementBackup = [...this.listClassManagementBackup,...data].filter((obj, index, self) =>
                //     index === self.findIndex(o => o.id === obj.id)
                // );
            }
        })
    }


    onChangeClass(event, item: ClassManagement) {
        item['checked'] = event.checked;
        const ids = this.listClassManagement.filter(f => f['checked'] == true).map(m => m.id);
        this.formField()!.setValue(ids);
    }


}
