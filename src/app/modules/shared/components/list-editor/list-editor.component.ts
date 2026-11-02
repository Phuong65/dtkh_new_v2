import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, ElementRef, Input, OnChanges, OnInit, QueryList, SimpleChanges, ViewChild, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ButtonModule } from 'primeng/button';
import { ContenteditableModelDirective } from '../../directives/contenteditable-model.directive';

@Component({standalone: true, 
    selector: 'app-list-editor',
    templateUrl: './list-editor.component.html',
    styleUrls: ['./list-editor.component.css'],
    imports: [CommonModule, FormsModule, DragDropModule, ButtonModule, ContenteditableModelDirective]
})
export class ListEditorComponent implements OnInit, OnChanges {

    @Input() formField: AbstractControl;

    @Input() set resetTrigger(val: boolean) {
        if (val) {
            this.deleteAllList();
        }
    }

    @Input() addByButton: boolean = false;

    @ViewChild('lastEditor') lastEditor!: ElementRef<HTMLDivElement>;

    @ViewChildren('editor') editors!: QueryList<ElementRef<HTMLDivElement>>;

    currentEditorIndex: number | null = null;

    listValue: { value: string }[] = [];

    last_value: string;

    value: string;

    private updatingData = false;

    constructor() { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['formField'] && this.formField && Array.isArray(this.formField.value)) {
            this.updateListValue(this.formField.value);
        }
    }

    ngOnInit(): void {
        this.formField.valueChanges.subscribe(value => {
            if (value && value.length) {
                this.updatingData = true;
                this.updateListValue(value);
                this.updatingData = false;
            }
        });
    }

    private updateListValue(value: string[]) {
        if (!Array.isArray(value)) {
            this.listValue = [{ value: '' }];
            return;
        }

        this.listValue = value.map(v => ({ value: v }));

        if (!this.listValue.length || (!this.addByButton && this.listValue[this.listValue.length - 1].value !== '')) {
            this.listValue.push({ value: '' });
        }
    }

    onPaste(event: ClipboardEvent) {
        const pastedHtml = event.clipboardData?.getData('text/html') || '';

        const json = this.convertWordListToJson(pastedHtml);

        if (json && json.length > 1) {

            event.preventDefault();

            if (!this.listValue.length) {
                this.listValue.push({ value: '' });
            }

            const lastItem = this.listValue[this.listValue.length - 1];
            const hasEmptyLastItem = lastItem && !lastItem.value?.trim();

            json.forEach((f, key) => {
                if (key === 0 && (!this.addByButton || hasEmptyLastItem)) {
                    lastItem.value = f;
                } else {
                    this.listValue.push({ value: f });
                }
            });

            this.setForm();
        }
    }

    convertWordListToJson(html: string) {
        const parser = new DOMParser();

        const doc = parser.parseFromString(html, 'text/html');

        const items: string[] = [];

        const blocks = doc.querySelectorAll('p, li, div');

        blocks.forEach(block => {

            let content = block.innerHTML.replace(/<br\s*\/?>|<br>/gi, '|[#down#]|');

            content = content.replace(/<[^>]+>/g, '');

            content = content.replace(/^•\s*/g, '');

            content = content.replace(/^\d+\.\s*/g, '');

            content = content.replace(/&nbsp;/g, '');

            content = content.trim();

            if (!content) return;

            const lines = content.split('|[#down#]|');

            lines.forEach(line => {
                const clean = line.trim();
                if (clean.length > 0) items.push(clean);
            });
        });

        return [...new Set(items)];
    }

    deleteList(index) {
        this.listValue.splice(index, 1);
        if (this.addByButton && !this.listValue.length) this.listValue.push({ value: '' });
        this.setForm();
    }

    deleteAllList() {
        this.listValue = this.addByButton ? [] : [{ value: '' }, { value: '' }];
        this.setForm();
    }

    checkCaret(event: HTMLElement, handle) {
        // const inside = this.isCaretInsideEditor(event);
        // if (inside) {
        if (handle.code === 'Tab') {
            handle.preventDefault()
            this.listValue.push({ value: this.last_value });
            this.formField.setValue(this.listValue.map(m => m.value));
            this.last_value = null;
            setTimeout(() => {
                this.lastEditor.nativeElement.focus();
                const range = document.createRange();
                const sel = window.getSelection();
                range.selectNodeContents(this.lastEditor.nativeElement);
                range.collapse(false);
                sel.removeAllRanges();
                sel.addRange(range);
            })
        }
        // }
    }

    // isCaretInsideEditor(el: HTMLElement): boolean {
    //     // const sel = window.getSelection();
    //     // if (!sel || !sel.anchorNode) return false;
    //     // return el.contains(sel.anchorNode);
    // }

    addItemByButton(): void {
        const lastItem = this.listValue[this.listValue.length - 1];
        if (lastItem && !lastItem.value?.trim()) {
            setTimeout(() => {
                const editors = this.editors?.toArray() || [];
                editors[editors.length - 1]?.nativeElement.focus();
            });
            return;
        }

        this.listValue.push({ value: '' });
        this.setForm();
        setTimeout(() => {
            const editors = this.editors?.toArray() || [];
            editors[editors.length - 1]?.nativeElement.focus();
        });
    }

    onKeyDown(event, index) {
        if (event.key === 'Tab' && !this.addByButton) {
            event.preventDefault(); // chặn indent mặc định

            const editorsArray = this.editors.toArray();

            // editor tiếp theo
            const next = editorsArray[index + 1];
            if (next) {
                const el = next.nativeElement;
                el.focus();

                // Đặt caret ở cuối editor tiếp theo
                const range = document.createRange();
                const sel = window.getSelection();
                range.selectNodeContents(el);
                range.collapse(false);
                sel.removeAllRanges();
                sel.addRange(range);
            }

            if (index + 1 === editorsArray.length) {
                this.listValue.push({ value: this.last_value });
            }
        } else {

        }
    }

    onKeyUpEditor(event: HTMLElement, index) {
        this.setForm();
    }

    drop(event: CdkDragDrop<string[]>) {
        moveItemInArray(this.listValue, event.previousIndex, event.currentIndex);
        this.setForm();
    }

    setForm() {
        if (this.updatingData) return;
        this.listValue.forEach(f => {
            if (f.value)
                f.value = f.value.replace(/\<br\>/gi, '');
        })

        const data = this.listValue.filter(m => m.value && m.value !== '').map(x => x.value);

        data.forEach(f => {
            f = f.replace(/(\r\n|\r|\n|\u2028|\u2029)/gu, "")
        })

        if (this.formField)
            this.formField.setValue(
                data.filter(m => m && m !== ''),
                { emitEvent: false }
            );

    }
}
