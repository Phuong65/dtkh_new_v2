import { CommonModule } from '@angular/common';
import { Component, OnInit, Input, SimpleChanges, OnChanges, OnDestroy, EventEmitter, Output } from '@angular/core';
import { AbstractControl, FormsModule } from '@angular/forms';
import { HelperService } from '@core/services/helper.service';
import { EditorModule } from 'primeng/editor';
import { ProtectedHeadingsController, ProtectedQuill } from './protected-headings';

@Component({standalone: true,
    selector: 'ovic-editor',
    templateUrl: './ovic-editor.component.html',
    styleUrls: ['./ovic-editor.component.css'],
    imports: [CommonModule, FormsModule, EditorModule]
})
export class OvicEditorComponent implements OnInit, OnChanges, OnDestroy {
    @Input() height = '320px';
    @Input() formField: AbstractControl;
    @Input() readonly = false;
    @Input() default: string;
    @Input() showSaveButton: boolean = false;
    @Input() protectedHeadings: readonly string[] = [];
    @Input() contextKey: number | string | null = null;

    @Output() changeText = new EventEmitter<any>();
    @Output() saveText = new EventEmitter<any>();
    textContents: any;
    protectionMessage = '';
    private protectedEditor: ProtectedHeadingsController | null = null;
    private quill: ProtectedQuill | null = null;
    private lastAcceptedValue: string | null = null;
    private sourceHtml = '';

    constructor(private helperService: HelperService) {}

    ngOnInit(): void {
        this.setData(this.default);
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['default'] || changes['contextKey'] || changes['protectedHeadings']) {
            const contextChanged = !!changes['contextKey'] || !!changes['protectedHeadings'];
            if (!contextChanged && this.protectedHeadings.length && this.default === this.lastAcceptedValue) return;
            this.setData(this.default);
        }
    }

    setData(data: string) {
        this.sourceHtml = data ? this.helperService.decodeHTML(data) : '';
        if (!this.protectedHeadings.length) {
            this.textContents = this.sourceHtml;
        } else if (this.protectedEditor) {
            this.protectedEditor.load(this.sourceHtml);
            this.acceptProtectedValue(this.protectedEditor.serialize(), false);
        }
    }

    onEditorInit(event: { editor: ProtectedQuill }): void {
        this.quill = event.editor;
        if (!this.protectedHeadings.length) return;
        this.protectedEditor?.destroy();
        this.protectedEditor = new ProtectedHeadingsController(this.quill, this.protectedHeadings,
            message => this.protectionMessage = message,
            html => this.acceptProtectedValue(html, true));
        this.protectedEditor.load(this.sourceHtml);
        this.acceptProtectedValue(this.protectedEditor.serialize(), false);
    }

    private acceptProtectedValue(html: string, userChange: boolean): void {
        const encoded = this.helperService.encodeHTML(html);
        this.lastAcceptedValue = encoded;
        if (this.formField && this.formField.value !== encoded) {
            this.formField.setValue(encoded);
            if (userChange) this.formField.markAsDirty();
        }
        if (userChange) this.changeText.emit(encoded);
    }

    onModelChange(value: string): void {
        // Protected mode owns its Delta and FormControl. Do not feed PrimeNG's
        // serialized DOM back into Quill and reset selection/history on each key.
        if (!this.protectedHeadings.length) this.textContents = value;
    }

    onTextChange(event) {
        if (this.protectedHeadings.length) return;
        this.changeText.emit(this.helperService.encodeHTML(event.htmlValue));
        if (this.formField) this.formField.setValue(this.helperService.encodeHTML(event.htmlValue));
    }

    prepareProtectedValue(): boolean {
        if (!this.protectedHeadings.length) return true;
        if (!this.protectedEditor?.isValid()) return false;
        this.acceptProtectedValue(this.protectedEditor.serialize(), false);
        return true;
    }

    onSaveEditor() {
        if (!this.prepareProtectedValue()) return;
        const html = this.protectedEditor ? this.protectedEditor.serialize() : this.textContents;
        this.saveText.emit(this.helperService.encodeHTML(html));
    }

    ngOnDestroy(): void {
        this.protectedEditor?.destroy();
        this.protectedEditor = null;
        this.quill = null;
    }
}
