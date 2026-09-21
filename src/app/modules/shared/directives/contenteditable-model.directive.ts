import {
    Directive,
    ElementRef,
    forwardRef,
    HostListener
} from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

@Directive({standalone: false, 
    selector: '[contenteditableModel]',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ContenteditableModelDirective),
            multi: true
        }
    ]
})
export class ContenteditableModelDirective implements ControlValueAccessor {
    private onChange = (_: any) => { };
    private onTouched = () => { };

    private isWriting = false;        // Ngăn writeValue chạy vòng lặp
    private lastValue: string = '';   // Lưu giá trị cũ để so sánh

    constructor(private el: ElementRef<HTMLElement>) { }

    writeValue(value: any): void {
        if (this.isWriting) return;

        const element = this.el.nativeElement;

        if (value !== this.lastValue) {
            const sel = saveSelection(element);      // ⭐ Lưu vị trí caret
            element.innerHTML = value || '';
            restoreSelection(element, sel);          // ⭐ Khôi phục caret
            this.lastValue = value;
        }
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    @HostListener('input')
    onInput() {
        this.isWriting = true; // Ngăn writeValue chạy lại

        const value = this.el.nativeElement.innerHTML;
        this.lastValue = value;
        this.onChange(value);

        setTimeout(() => (this.isWriting = false), 0); // reset flag
    }

    @HostListener('blur')
    onBlur() {
        this.onTouched();
    }
}

// -------------------------------------------------------
// ⭐ Hai hàm lưu & phục hồi caret — chìa khóa chống nhảy
// -------------------------------------------------------

function saveSelection(containerEl: HTMLElement) {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const preSelectionRange = range.cloneRange();
        preSelectionRange.selectNodeContents(containerEl);
        preSelectionRange.setEnd(range.startContainer, range.startOffset);

        const start = preSelectionRange.toString().length;

        return { start: start, end: start + range.toString().length };
    }
    return null;
}

function restoreSelection(containerEl: HTMLElement, savedSel: any) {
    if (!savedSel) return;

    let charIndex = 0;
    const range = document.createRange();
    range.setStart(containerEl, 0);
    range.collapse(true);

    const nodeStack = [containerEl];
    let node;

    while ((node = nodeStack.pop())) {
        if (node.nodeType === 3) {
            const nextCharIndex = charIndex + node.length;

            if (savedSel.start >= charIndex && savedSel.start <= nextCharIndex) {
                range.setStart(node, savedSel.start - charIndex);
            }

            if (savedSel.end >= charIndex && savedSel.end <= nextCharIndex) {
                range.setEnd(node, savedSel.end - charIndex);
                break;
            }

            charIndex = nextCharIndex;
        } else {
            let i = node.childNodes.length;
            while (i--) nodeStack.push(node.childNodes[i]);
        }
    }

    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
}
