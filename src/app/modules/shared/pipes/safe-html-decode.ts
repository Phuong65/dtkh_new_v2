import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HelperService } from '@core/services/helper.service';

@Pipe({
    name: 'safeHtmlDecode'
})
export class SafeHtmlDecodePipe implements PipeTransform {

    constructor(
        private sanitized: DomSanitizer,
        private helperService: HelperService
    ) { }

    transform(html: string, clearHtmlTag: boolean = false): SafeHtml {
        const result = html ? this.helperService.decodeHTML(html) : 'chưa có dữ liệu';
        if (clearHtmlTag) {
            return this.sanitized.bypassSecurityTrustHtml(result.replace(/<(.*?)>/gi, ''));
        }
        return this.sanitized.bypassSecurityTrustHtml(result);
    }
}
