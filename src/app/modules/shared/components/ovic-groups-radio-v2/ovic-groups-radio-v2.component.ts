import { Component, OnInit, Input, SimpleChanges, OnChanges, Output, EventEmitter, OnDestroy, inject, AfterViewInit } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { KEY_ANSWER } from '@modules/shared/utils/syscat';

@Component({standalone: false, 
    selector: 'ovic-groups-radio-v2',
    templateUrl: './ovic-groups-radio-v2.component.html',
    styleUrls: ['./ovic-groups-radio-v2.component.css'],
})

export class OvicGroupsRadioV2Component implements OnInit, OnChanges, OnDestroy, AfterViewInit {

    @Input() options: any;

    @Input() optionLabel: string;

    @Input() optionId: string;

    @Input() group_name: string = 'group';

    @Input() styleClass: string;

    @Input() defaultValue: any;

    @Input() show_image: boolean = false;

    @Input() disabled_item: boolean = false;

    @Input() optionSrc: string;

    @Input() widthImage: number = 30;

    @Input() disabled: boolean = false;

    @Input() formField: AbstractControl;

    @Input() unSelect: boolean = false;

    @Input() rawHtml = false;

    @Input() require = true;

    @Input() verticalMode = false;

    @Input() columns: number = 1;

    @Input() abc_type: boolean = false;

    @Output() onChange = new EventEmitter<any>();

    default: any;

    key_answer = KEY_ANSWER;
    constructor(
        protected sanitizer: DomSanitizer
    ) {

    }
    ngAfterViewInit(): void {

    }

    ngOnDestroy(): void {

    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['defaultValue']) {
            if (this.defaultValue || this.defaultValue === 0) {
                this.default = this.defaultValue;
            } else {
                this.default = null;
            }
        }
    }

    ngOnInit(): void {
        if ((this.defaultValue || this.defaultValue === 0) && this.options && this.optionId) {
            this.default = this.defaultValue;
        }
    }

    onChooseItem(item) {
        if (!item['disabled']) {
            if (this.unSelect && this.default === item) {
                this.default = null;
            } else {
                this.default = item;
            }
            if (this.formField) {
                this.formField.setValue(this.default);
            }
            this.onChange.emit(this.default);
        }
        // } else {
        //     if ( this.unSelect && this.default === item ) {
        //         this.default = null;
        //     } else {
        //         this.default = item;
        //     }
        //     if ( this.formField ) {
        //         this.formField.setValue( this.default );
        //     }
        //     this.onChange.emit( this.default );
        // }        
    }
}
