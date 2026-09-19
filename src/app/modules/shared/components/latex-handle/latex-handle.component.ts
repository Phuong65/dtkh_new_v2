import { HelperService } from '@core/services/helper.service';
import { AfterViewInit, Component, ElementRef, Inject, OnInit, ViewChild, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NotificationService } from '@core/services/notification.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import * as Latex from 'latex.js';
import { parse, HtmlGenerator } from 'latex.js';
import * as EqEditor from 'src/assets/js/latex-toolbar.min.js';
import katex from 'katex';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import renderMathInElement from 'katex/dist/contrib/auto-render';
// declare var EqEditor;

@Component({
    selector: 'latex-handle',
    templateUrl: './latex-handle.component.html',
    styleUrls: ['./latex-handle.component.css'],
    providers: [NgbActiveModal]
})
export class LatexHandleComponent implements OnInit, AfterViewInit, OnChanges {
    // @Input() income_latex: string;

    @ViewChild('previewArea', { static: true }) previewArea!: ElementRef;

    latexInput: string = '';

    presetGroups = [
        // { f: '\\frac{a}{b}', label: 'Phân số' },
        // { f: 'x^{n}', label: 'Lũy thừa' },
        // { f: '\\sqrt{x}', label: 'Căn bậc 2' },
        // { f: '\\sqrt[n]{x}', label: 'Căn bậc n' },
        // { f: '\\log_{a}b', label: 'Logarit' },
        // { f: '|x|', label: 'Trị tuyệt đối' },
        // { f: '\\int_{a}^{b} f(x)dx', label: 'Tích phân' },
        // { f: '\\lim_{x \\to \\infty}', label: 'Giới hạn' },
        // { f: '\\sum_{i=1}^{n}', label: 'Tổng' },
        // { f: '\\Delta', label: 'Delta' },
        // { f: '\\infty', label: 'Vô cực' },
        // { f: '\\widehat{ABC}', label: 'Góc' },
        // { f: '\\vec{v}', label: 'Vectơ' },
        // { f: '90^{\\circ}', label: 'Độ' },
        // { f: '\\pi', label: 'Pi' },
        // { f: '\\perp', label: 'Vuông góc' },
        // { f: '//', label: 'Song song' },
        // { f: '\\begin{cases} x+y=2 \\\\ x-y=0 \\end{cases}', label: 'Hệ phương trình' },
        // { f: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', label: 'Ma trận' },
        // { f: '\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}', label: 'Định thức' }
        { f: 'x^n', label: 'Lũy thừa' },
        { f: '\\frac{a}{b}', label: 'Phân số' },
        { f: '\\sqrt{x}', label: 'Căn bậc 2' },
        { f: '\\sqrt[n]{x}', label: 'Căn bậc n' },
        { f: '|x|', label: 'Giá trị tuyệt đối' },

        { f: '\\lim_{x \\to a}', label: 'Giới hạn' },
        { f: '\\frac{d}{dx}', label: 'Đạo hàm' },
        { f: '\\int f(x)dx', label: 'Tích phân' },

        { f: '\\sin x', label: 'Sin' },
        { f: '\\cos x', label: 'Cos' },
        { f: '\\tan x', label: 'Tan' },

        { f: '\\pi', label: 'Pi' },
        { f: 'e^x', label: 'Hàm mũ' },
        { f: '\\log_a b', label: 'Logarit' },

        { f: '\\sum_{i=1}^{n}', label: 'Tổng' },
        { f: '\\prod_{i=1}^{n}', label: 'Tích' },

        { f: '\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}', label: 'Ma trận' },
        { f: '\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}', label: 'Định thức' },

        { f: '\\in', label: 'Thuộc' },
        { f: '\\subset', label: 'Tập con' },

        { f: '\\forall', label: 'Với mọi' },
        { f: '\\exists', label: 'Tồn tại' },

        { f: '\\approx', label: 'Xấp xỉ' },
        { f: '\\neq', label: 'Khác' },
        { f: '\\leq', label: '≤' },
        { f: '\\geq', label: '≥' }
    ];

    activeTabIndex: number = 0; // Quản lý tab đang mở

    constructor(
        public dialogRef: MatDialogRef<LatexHandleComponent>,
        private notificationService: NotificationService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        if (data && data.formula) {
            this.latexInput = data.formula;
        }
    }
    ngOnChanges(changes: SimpleChanges): void {
        // if (changes['income_latex']) {
        //     this.latexInput = this.income_latex;
        // }
    }

    ngOnInit(): void {
        // this.latexInput = this.income_latex;
        this.renderLatexPreview();
    }

    ngAfterViewInit() {
        setTimeout(() => {
            // Quét toàn bộ vùng chứa icon
            const container = document.querySelector('.presets-all-container');
            if (container && renderMathInElement) {
                renderMathInElement(container, {
                    delimiters: [{ left: '\\(', right: '\\)', display: false }],
                    throwOnError: false
                });
            }
        }, 200);
    }

    // Thêm hàm này vào component của bạn
    reRenderKatex() {
        setTimeout(() => {
            const container = document.querySelector('.tab-content');
            if (container && renderMathInElement) {
                renderMathInElement(container, {
                    delimiters: [{ left: '\\(', right: '\\)', display: false }],
                    throwOnError: false
                });
            }
        }, 150);
    }

    renderLatexPreview() {
        const container = this.previewArea.nativeElement;
        if (this.latexInput && this.latexInput.trim()) {
            try {
                // @ts-ignore (Bỏ qua kiểm tra kiểu nếu chưa cài @types/katex)
                katex.render(this.latexInput, container, {
                    throwOnError: false,
                    displayMode: true
                });
            } catch (err) {
                container.innerHTML = `<span class="text-danger small">Lỗi cú pháp: ${this.latexInput}</span>`;
            }
        } else {
            container.innerHTML = '<span class="text-muted-custom">Xem trước công thức sẽ hiển thị tại đây...</span>';
        }
    }

    onCancel(): void {
        this.dialogRef.close();
    }

    onConfirm(): void {
        this.notificationService.isProcessing(true);
        const content = `
        <span class="latex-ictu-img" data-latex="${this.latexInput}">
           <img src="assets/images/image-loading-2.gif"/>
        </span>&nbsp;`
        this.dialogRef.close(this.latexInput ? content : '');
    }

    insertPreset(f: string) {
        // Nếu textarea đã có chữ, ta thêm dấu cách rồi mới chèn
        this.latexInput += (this.latexInput ? ' ' : '') + f;
        this.renderLatexPreview();
    }

    // Hàm chuyển tab chủ động
    setActiveTab(index: number) {
        this.activeTabIndex = index;
        this.reRenderKatex();
    }
}
