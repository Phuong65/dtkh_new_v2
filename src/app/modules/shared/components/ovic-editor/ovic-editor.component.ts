import { CommonModule } from '@angular/common';
import { Component, OnInit, Input, SimpleChanges, OnChanges, EventEmitter, Output } from '@angular/core';
import { AbstractControl, FormsModule } from '@angular/forms';
import { HelperService } from '@core/services/helper.service';
import { EditorModule } from 'primeng/editor';

@Component({standalone: true, 
    selector: 'ovic-editor',
    templateUrl: './ovic-editor.component.html',
    styleUrls: ['./ovic-editor.component.css'],
    imports: [CommonModule, FormsModule, EditorModule]
})
export class OvicEditorComponent implements OnInit, OnChanges {

    @Input() height = '320px';

    @Input() formField: AbstractControl;

    @Input() readonly = false;

    @Input() default: string;

    @Input() showSaveButton: boolean = false;

    @Output() changeText = new EventEmitter<any>();

    @Output() saveText = new EventEmitter<any>();
    textContents: any;

    constructor(
        private helperService: HelperService
    ) {
    }

    ngOnInit(): void {
        this.setData(this.default);
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['default']) {
            this.setData(this.default);
        }
    }

    setData(data: string) {
        this.textContents = data ? this.helperService.decodeHTML(data) : '';
    }

    onTextChange(event) {
        this.changeText.emit(this.helperService.encodeHTML(event.htmlValue));
        if (this.formField) {
            this.formField.setValue(this.helperService.encodeHTML(event.htmlValue));
        }
    }

    onSaveEditor() {
        this.saveText.emit(this.helperService.encodeHTML(this.textContents));
    }
}
