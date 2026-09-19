import { Component, OnInit, Input, SimpleChanges, OnChanges, Output, EventEmitter } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
    selector: 'ovic-groups-radio',
    templateUrl: './ovic-groups-radio.component.html',
    styleUrls: ['./ovic-groups-radio.component.css']
})
export class OvicGroupsRadioComponent implements OnInit, OnChanges {

    version: '1.0.1';

    constructor(protected sanitizer: DomSanitizer) { }

    @Input() options: any;

    @Input() ortherDefault: any;

    @Input() classOrther: string;



    @Input() default: any;

    @Input() disabled: boolean;

    @Input() optionId: string;

    @Input() classes: string; //elearning-style

    @Input() optionLabel: string;

    @Input() formField: AbstractControl;

    @Input() rawHtml = false;

    @Input() require = true;

    @Input() verticalMode = false;

    @Input() columns: 1 | 2 | 3 | 4 = 1;

    @Output() onChange = new EventEmitter<any>();


    active: any;
    index: number;
    indexOther: number;

    ngOnInit(): void {
        if (this.default && this.options && this.optionId) {
            this.index = this.options.findIndex(elm => elm.hasOwnProperty(this.optionId) && elm[this.optionId] === this.default);
        } else {
            this.index = -1;
        }

        if (this.ortherDefault && this.options && this.optionId) {
            this.indexOther = this.options.findIndex(elm => elm.hasOwnProperty(this.optionId) && elm[this.optionId] === this.ortherDefault);
        } else {
            this.indexOther = -1;
        }

    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['default']) {
            if (this.default) {
                this.active = this.default;
                
                if (this.options && this.optionId) {
                    this.index = this.options.findIndex(elm => elm.hasOwnProperty(this.optionId) && elm[this.optionId].toString() === this.default.toString());
                } else {
                    this.index = -1;
                }
            }
        }
        if (changes['ortherDefault']) {

            if (this.ortherDefault && this.options && this.optionId) {
                this.indexOther = this.options.findIndex(elm => elm.hasOwnProperty(this.optionId) && elm[this.optionId] === this.ortherDefault);
            } else {
                this.indexOther = -1;
            }
        }
    }

    transform(inputHtml: string): SafeHtml {
        return this.sanitizer.bypassSecurityTrustHtml(inputHtml);
    }

    updateValue(value: any, index: number) {
        if (!this.require) {
            if (this.index !== index) {
                this.index = index;
                this.active = value;
            } else {
                this.index = null;
                this.active = null;
            }
        } else {
            this.index = index;
            this.active = value;
        }
        if (this.formField) {
            this.formField.setValue(this.active);
        }
        this.onChange.emit(this.active);
    }
    setActiveLi(i) {
        let classLi = this.index === i ? 'active_li' : null;
        if (this.indexOther === i && this.indexOther !== this.index) {
            classLi = 'orther-active';
        }
        return classLi
    }

}
