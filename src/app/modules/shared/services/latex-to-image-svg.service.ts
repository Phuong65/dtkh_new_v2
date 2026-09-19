import { Injectable } from '@angular/core';

// MathJax Core
import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { SVG } from 'mathjax-full/js/output/svg.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages.js';

@Injectable({
    providedIn: 'root'
})
export class LatexToImageSvgService {
    private adaptor = liteAdaptor();
    private htmlDoc: any;

    constructor() {
        // 1. Đăng ký handler để chạy trong môi trường Virtual DOM (LiteAdaptor)
        RegisterHTMLHandler(this.adaptor);

        // 2. Cấu hình TeX Input với đầy đủ các gói toán học (AMS, MathTools...)
        const texInput = new TeX({
            packages: AllPackages
        });

        // 3. Cấu hình SVG Output
        const svgOutput = new SVG({
            fontCache: 'local' // Giúp giảm dung lượng file SVG bằng cách dùng lại glyph
        });

        // 4. Tạo document ảo để thực hiện chuyển đổi
        this.htmlDoc = mathjax.document('', {
            InputJax: texInput,
            OutputJax: svgOutput
        });
    }

    /**
     * Chuyển đổi LaTeX sang chuỗi SVG Base64 sạch cho thẻ <img>
     */
    public latexToSvgBase64(latex: string): string {
        if (!latex) return '';

        // Dọn dẹp chuỗi LaTeX đầu vào
        let cleanLatex = latex
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/\r?\n|\r/g, ' ')
            .replace(/^(\$\$?|\\\(|\\\[)/, '')
            .replace(/(\$\$?|\\\)|\\\])$/, '')
            .trim();

        try {
            // 1. Chuyển đổi LaTeX sang cấu trúc MJX-CONTAINER
            const svgContainer = this.htmlDoc.convert(cleanLatex, {
                display: true,
                em: 16,
                ex: 8
            });

            // 2. Trích xuất Node con đầu tiên (là thẻ <svg>)
            // Sử dụng 'as any' để tránh lỗi TS2345 (LiteNode vs LiteElement)
            const svgNode = this.adaptor.firstChild(svgContainer) as any;

            if (!svgNode || this.adaptor.kind(svgNode) !== 'svg') {
                throw new Error('Could not extract clean SVG node.');
            }

            // 3. Lấy chuỗi XML SVG thuần túy
            let svgString = this.adaptor.outerHTML(svgNode);

            // 4. Encode chuỗi SVG sang Base64 chuẩn Unicode (hỗ trợ tích phân, pi, ...)
            const base64 = this.encodeUnicodeToBase64(svgString);

            return `data:image/svg+xml;base64,${base64}`;

        } catch (e) {
            console.error('MathJax SVG Conversion Error:', e);
            return '';
        }
    }

    /**
     * Helper: Encode chuỗi Unicode sang Base64 an toàn cho mọi trình duyệt
     */
    private encodeUnicodeToBase64(str: string): string {
        // Thêm XML header nếu cần thiết cho Word
        if (!str.startsWith('<?xml')) {
            str = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>' + str;
        }

        // Quy trình: Unicode -> UTF-8 Percent Encoding -> Binary String -> Base64
        return window.btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
            return String.fromCharCode(parseInt(p1, 16));
        }));
    }

    /**
     * Phương thức chính: Quét HTML, tìm data-latex và thay thế bằng thẻ <img> chứa SVG
     * @param htmlContent Chuỗi HTML cần xử lý
     */
    async convertHtmlForWord(htmlContent: string): Promise<string> {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');

        const elements = doc.querySelectorAll('[data-latex]');

        if (elements.length === 0) return htmlContent;

        elements.forEach((el: Element) => {
            const latex = el.getAttribute('data-latex');
            if (latex) {
                const svgBase64 = this.latexToSvgBase64(latex);

                if (svgBase64) {
                    // Tạo thẻ <img> thay thế
                    const img = doc.createElement('img');
                    img.src = svgBase64;
                    img.alt = latex; // Lưu latex gốc vào alt để dự phòng

                    // Style để ảnh hiển thị cân đối trong văn bản Word
                    img.style.verticalAlign = 'middle';
                    img.style.margin = '5px 0';
                    img.style.maxWidth = '100%';
                    img.style.height = 'auto';

                    // Thay thế hoàn toàn thẻ cũ bằng ảnh SVG
                    el.parentNode?.replaceChild(img, el);
                }
            }
        });

        return doc.body.innerHTML;
    }
}