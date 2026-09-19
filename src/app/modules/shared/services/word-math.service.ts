import { Injectable } from '@angular/core';
import * as katex from 'katex';

@Injectable({
    providedIn: 'root'
})
export class WordMathService {

    constructor() { }

    /**
     * Chuyển đổi LaTeX sang MathML tối giản để thừa hưởng font-size từ Word
     */
    public latexToMathML(latex: string, isBlock: boolean = false): string {
        if (!latex) return '';

        const cleanLatex = latex
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/^(\$\$?|\\\(|\\\[)/, '')
            .replace(/(\$\$?|\\\)|\\\])$/, '')
            .trim();

        try {
            // Ép kiểu hiển thị lớn nhất
            const mathml = katex.renderToString(`\\displaystyle { ${cleanLatex} }`, {
                displayMode: true, // Luôn dùng true để lấy cấu trúc "to" của tích phân
                output: 'mathml'
            });

            const parser = new DOMParser();
            const mmlDoc = parser.parseFromString(mathml, 'text/html');
            const mmlElement = mmlDoc.querySelector('math');

            if (!mmlElement) return `<span>${latex}</span>`;

            // Cấu hình bắt buộc cho Microsoft Office
            mmlElement.setAttribute('xmlns', 'http://www.w3.org/1998/Math/MathML');

            /**
             * CHIẾN THUẬT ÉP SIZE TRỰC TIẾP VÀO MATHML:
             * Word không đọc font-size của span, nhưng nó đọc thuộc tính 'mathsize' 
             * nếu nó được gán trực tiếp cho các thẻ con bên trong.
             */
            const mstyle = mmlDoc.createElement('mstyle');
            mstyle.setAttribute('mathsize', '14pt'); // Ép cỡ chữ 14pt cho toán học
            mstyle.setAttribute('displaystyle', 'true');
            mstyle.setAttribute('scriptlevel', '0');


            while (mmlElement.firstChild) {
                mstyle.appendChild(mmlElement.firstChild);
            }
            mmlElement.appendChild(mstyle);

            // Nếu là inline, ta xóa thuộc tính display="block" ở thẻ math 
            // để nó không tự nhảy dòng trong Word
            if (!isBlock) {
                mmlElement.removeAttribute('display');
            }

            return mmlElement.outerHTML;
        } catch (e) {
            return `<span>${latex}</span>`;
        }
    }

    /**
     * Biến đổi chuỗi HTML và ép Font-size 14pt từ bên ngoài
     */
    public convertHtmlString(htmlString: string): string {
        if (!htmlString) return '';

        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');
        const elements = doc.querySelectorAll('[data-latex]');

        elements.forEach((el: Element) => {
            const latex = el.getAttribute('data-latex');
            if (latex) {
                const isBlock = el.tagName.toLowerCase() === 'div';
                const mmlHtml = this.latexToMathML(latex, isBlock);

                /**
                 * TẠO THẺ BAO NGOÀI VỚI STYLE 14PT CHUẨN OFFICE
                 * Word đọc font-size từ thẻ span bao quanh rất tốt NẾU dùng đơn vị pt
                 * và có thuộc tính mso-ansi-font-size.
                 */
                const wrapper = doc.createElement('span');
                const size = '14pt';
                wrapper.setAttribute('class', 'latex-math');
                wrapper.setAttribute('style', `
                font-size: ${size}; 
                mso-ansi-font-size: ${size}; 
                font-family: 'Cambria Math', 'Times New Roman', serif;
                line-height: 100%;
                `);

                wrapper.innerHTML = mmlHtml;

                if (el.parentNode) {
                    el.parentNode.replaceChild(wrapper, el);
                }
            }
        });

        return doc.body.innerHTML;
    }
}