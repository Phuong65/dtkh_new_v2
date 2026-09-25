import { Component, OnInit, Input, SimpleChanges, OnChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormGroup } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RawHtmlPipe } from '../../pipes/innerhtml-raw-pipe';

@Component({standalone: true,
    selector: 'ovic-groups-checkbox',
    templateUrl: './ovic-groups-checkbox.component.html',
    styleUrls: ['./ovic-groups-checkbox.component.css'],
    imports: [CommonModule, RawHtmlPipe]
})
export class OvicGroupsCheckboxComponent implements OnInit {

    version: '1.0.1';

    constructor(protected sanitizer: DomSanitizer) { }

    @Input() options: any;

    @Input() ortherDefault: any;

    @Input() classOrther: string;

    @Input() default: any;

    @Input() disabled: boolean;

    @Input() show_image: boolean = false;

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
    correct_object = {};
    other_correct = {}
    ngOnInit(): void {
        if (this.default && this.options && this.optionId) {
            const t = this.default.split(",");
            t.forEach(f => {
                this.correct_object[f] = true;
            })
        } else {
            this.correct_object = {};
        }

        if (this.ortherDefault && this.options && this.optionId) {
            const t = this.ortherDefault.split(",");
            t.forEach(f => {
                this.other_correct[f] = true;
            })
        } else {
            this.other_correct = {};
        }

    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['default']) {
            if (this.default && this.options && this.optionId) {
                const t = this.default.split(",");
                t.forEach(f => {
                    this.correct_object[f] = true;
                })
            } else {
                this.correct_object = {};
            }
        }
        if (changes['ortherDefault']) {
            if (this.ortherDefault && this.options && this.optionId) {
                const t = this.ortherDefault.split(",");
                t.forEach(f => {
                    this.other_correct[f] = true;
                })
            } else {
                this.other_correct = {};
            }
        }
    }

    transform(inputHtml: string): SafeHtml {
        return this.sanitizer.bypassSecurityTrustHtml(inputHtml);
    }

    updateValue(value: any, index: number) {
        if (!this.correct_object[value]) {
            this.correct_object[value] = true
        } else {
            this.correct_object[value] = false;
        }

        const keys = [];
        Object.keys(this.correct_object).forEach(f => {
            if (this.correct_object[f]) {
                keys.push(f);
            }
        })

        this.onChange.emit(keys.length ? keys : null);
    }
    
    setActiveLi(i) {
        let classLi = this.correct_object[i + 1] ? 'active_li' : null;
        if (this.other_correct[i + 1]) {
            classLi = 'orther-active';
        }
        return classLi
    }

}
