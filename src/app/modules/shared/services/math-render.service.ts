import { Injectable } from '@angular/core';
import { mathjax } from 'mathjax-full/js/mathjax.js';
import { MathML } from 'mathjax-full/js/input/mathml.js';
import { SVG } from 'mathjax-full/js/output/svg.js';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';


@Injectable({
    providedIn: 'root'
})
export class MathRenderService {
    private adaptor = liteAdaptor();
    private html: any;

    constructor() {
        RegisterHTMLHandler(this.adaptor);

        const mathml = new MathML();
        const svg = new SVG({ fontCache: 'none' });

        this.html = mathjax.document('', { InputJax: mathml, OutputJax: svg });
    }

    renderMathML(mathml: string): string {
        const node = this.html.convert(mathml, { display: false });
        return this.adaptor.innerHTML(node); // SVG string
    }

    svgToDataUri(svg: string): string {
        // Nếu svg đã có xmlns thì giữ nguyên
        if (!svg.includes('xmlns="http://www.w3.org/2000/svg"')) {
            svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
        }

        // Encode về dạng base64
        const encoded = btoa(unescape(encodeURIComponent(svg)));
        return `data:image/svg+xml;base64,${encoded}`;
    }

}
