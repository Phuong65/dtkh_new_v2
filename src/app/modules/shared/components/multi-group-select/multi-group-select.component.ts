
import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { AbstractControl, FormsModule, ReactiveFormsModule, } from '@angular/forms';
import { OvicChooser } from '@modules/shared/models/ovic-models';
import { MultiSelectModule } from 'primeng/multiselect';

@Component({
    selector: 'app-multi-group-select',
    templateUrl: './multi-group-select.component.html',
    styleUrls: ['./multi-group-select.component.css'],
    standalone: true,
    imports: [
    FormsModule,
    ReactiveFormsModule,
    MultiSelectModule
]
})
export class MultiGroupSelectComponent implements OnInit, OnChanges {

    @Input() options: any;

    @Input() optionId: string;

    @Input() optionLabel: string;

    @Input() formField: AbstractControl;

    @Input() defaultValue: string; /* value1,value2,value3 */

    @Input() placeholder: string;

    @Input() filterPlaceHolder: string;

    @Input() filterBy: string;

    @Input() filter = false;

    @Input() filterMatchMode = 'contains'; /*valid values are "contains" (default) "startsWith", "endsWith", "equals", "notEquals", "in", "lt", "lte", "gt" and "gte".*/

    @Input() selectedItemsLabel = '{0} items selected';

    @Input() maxSelectedLabels = 3;

    @Input() displaySelectedLabel = true;

    @Input() emptyFilterMessage = 'Không có kết quả';

    @Input() appendTo = null;

    @Input() oneInGroup: boolean = false;

    @Input() group: boolean = false;

    @Input() optionGroup: string = 'items';

    @Output() onChange = new EventEmitter<any>();

    selectedValues: OvicChooser[];

    constructor() { }

    ngOnInit(): void {
        this.settingsChangeData();
    }

    ngOnChanges(changes: SimpleChanges) {
        // only run when property "data" changed
        if (changes['defaultValue']) {
            this.settingsChangeData();
        }
    }

    settingsChangeData() {
        if (this.options && this.defaultValue && typeof this.defaultValue === 'string') {
            const provide = this.defaultValue.split(',');
            if (this.group) {
                // Trường hợp có Group: Phải duyệt vào sâu bên trong mảng 'items'
                let selected: any[] = [];
                this.options.forEach(group => {
                    if (group[this.optionGroup] && Array.isArray(group[this.optionGroup])) {
                        const matchedItems = group[this.optionGroup].filter(item =>
                            item.hasOwnProperty(this.optionId) &&
                            provide.includes(item[this.optionId].toString())
                        );
                        selected = [...selected, ...matchedItems];
                    }
                });
                this.selectedValues = selected;
            } else {
                // Trường hợp không Group (Flat list)
                this.selectedValues = this.options.filter(option =>
                    option.hasOwnProperty(this.optionId) &&
                    provide.includes(option[this.optionId].toString())
                );
            }
        } else {
            this.selectedValues = [];
        }
    }
    onChangeHandle(event) {
        if (this.oneInGroup && event.itemValue) {

            const lastSelected = event.itemValue;

            const isChecked = event.value.some(item => item[this.optionId] === lastSelected[this.optionId]);

            console.log(event.value);
            if (isChecked) {
                // Lọc: Giữ lại những item khác nhóm HOẶC chính là item vừa chọn
                // Lưu ý: item phải có trường nhận diện nhóm (ví dụ: parentId)
                this.selectedValues = event.value.filter((item: any) => {
                    return item.parent_id !== lastSelected.parent_id || item[this.optionId] === lastSelected[this.optionId];
                });
            }
        } else {
            this.selectedValues = event.value;
        }

        console.log(this.selectedValues);

        // Cập nhật FormField
        if (this.formField) {
            const result = this.selectedValues.map(otp => otp[this.optionId]);
            this.formField.setValue(result.length ? result.join(',') : '');
        }

        this.onChange.emit(this.selectedValues);
        this.onChange.emit(event.value);
    }
}