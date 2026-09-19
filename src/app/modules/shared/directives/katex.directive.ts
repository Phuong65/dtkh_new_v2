import { Directive, ElementRef, Input, OnChanges, SimpleChanges, AfterViewInit } from '@angular/core';
import katex from 'katex';

@Directive({
    selector: '[appKatex]', // Tên selector để bạn sử dụng
    standalone: true
})
export class KatexDirective implements AfterViewInit, OnChanges {
    @Input('appKatex') trigger: number = 0;

    constructor(private el: ElementRef) { }

    ngAfterViewInit() {
        this.renderKatex();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['trigger'] && !changes['trigger'].firstChange) {
            this.renderKatex();
        }
    }

    private renderKatex() {
        const host = this.el.nativeElement as HTMLElement;
        // Tìm các thẻ gốc có chứa data-latex (ví dụ thẻ span cũ từ editor chèn vào)
        const containers = host.querySelectorAll('.latex-ictu-img[data-latex]');

        containers.forEach((container: HTMLElement) => {
            const latex = container.getAttribute('data-latex');
            if (!latex) return;

            // Kiểm tra nếu đã được wrap rồi thì chỉ cần render lại nội dung bên trong (nếu cần)
            if (container.classList.contains('math-tex-wrapper')) {
                this.executeKatex(latex, container);
                return;
            }

            // 1. Tạo cấu trúc HTML mới như yêu cầu
            const wrapper = document.createElement('span');
            wrapper.className = 'math-tex-wrapper katex-ictu-admin';
            wrapper.setAttribute('data-cke-ignore-events', 'true');
            wrapper.setAttribute('data-latex', latex);

            // Ép kiểu hiển thị inline để không bị nhảy dòng
            wrapper.style.display = 'inline-block';
            wrapper.style.verticalAlign = 'middle';
            wrapper.style.margin = '0 2px';

            // 2. Thay thế thẻ cũ bằng thẻ wrapper mới
            if (container.parentNode) {
                container.parentNode.replaceChild(wrapper, container);
            }

            // 3. Render code latex vào bên trong wrapper
            this.executeKatex(latex, wrapper);
        });
    }

    private executeKatex(latex: string, element: HTMLElement) {
        try {
            katex.render(latex, element, {
                throwOnError: false,
                displayMode: false, // Render inline
                output: 'html'
            });
        } catch (err) {
            console.error('Lỗi render KaTeX:', err);
            element.innerText = latex; // Nếu lỗi thì hiện text thuần
        }
    }
}