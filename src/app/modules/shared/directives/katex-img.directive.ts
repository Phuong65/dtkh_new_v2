import { Directive, ElementRef, Input, OnChanges, SimpleChanges, AfterViewInit } from '@angular/core';
import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { SVG } from 'mathjax-full/js/output/svg.js';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages.js';

@Directive({
    selector: '[appKatexImg]',
    standalone: true
})
export class KatexImgDirective implements AfterViewInit, OnChanges {
    @Input('appKatexImg') trigger: any;

    private readonly FAILED_IMG = 'assets/images/load-image-failed.jpg';
    private static html: any;
    private static adaptor: any;
    private static initialized = false;

    constructor(private el: ElementRef) { }

    ngAfterViewInit() {
        this.initMathJax();
        this.renderToSvgUrl();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['trigger'] && !changes['trigger'].firstChange) {
            this.renderToSvgUrl();
        }
    }

    private initMathJax() {
        if (KatexImgDirective.initialized) return;

        const adaptor = liteAdaptor();
        RegisterHTMLHandler(adaptor);

        // Sử dụng AllPackages để hỗ trợ đầy đủ ký hiệu ( \sqrt, \frac, v.v. )
        const tex = new TeX({ packages: AllPackages });
        const svg = new SVG({ fontCache: 'none' });
        // Khởi tạo đúng cách: Truyền Input và Output vào document
        KatexImgDirective.html = mathjax.document('', {
            InputJax: tex,
            OutputJax: svg
        });

        KatexImgDirective.adaptor = adaptor;

        KatexImgDirective.initialized = true;
    }

    private renderToSvgUrl() {
        const host = this.el.nativeElement as HTMLElement;
        const containers = host.querySelectorAll('.latex-ictu-img[data-latex]');
        containers.forEach((container: HTMLElement) => {
            const latex = container.getAttribute('data-latex');

            const imgElement = container.querySelector('img') as HTMLImageElement;

            if (!latex || !imgElement) return;

            try {
                // Render ra node (đây là mjx-container)
                const node = KatexImgDirective.html.convert(latex, { display: true });

                // LẤY CHÍNH XÁC THẺ <svg> BÊN TRONG
                const svgNode = KatexImgDirective.adaptor.firstChild(node);

                KatexImgDirective.adaptor.setAttribute(svgNode, 'style', 'font-size: 20px;');

                const svgString = KatexImgDirective.adaptor.outerHTML(svgNode);

                // Encode an toàn hơn cho UTF-8
                const svgBase64 = btoa(unescape(encodeURIComponent(svgString)));

                imgElement.src = `data:image/svg+xml;base64,${svgBase64}`;

                this.applyMathStyles(imgElement);
            } catch (err) {
                console.error('MathJax render error:', err);
                imgElement.src = this.FAILED_IMG;
            }
        });
    }

    private applyMathStyles(img: HTMLImageElement) {
        img.style.setProperty('display', 'inline-block', 'important');
        img.style.setProperty('height', 'auto', 'important');
        img.style.setProperty('max-width', '100%', 'important');
        img.style.setProperty('vertical-align', '-1.5rem');
        img.style.setProperty('margin', '0px 0px 1rem 0px', 'important');
    }
}