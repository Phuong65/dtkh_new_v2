import { Directive, ElementRef, HostListener } from '@angular/core';
import { DialogService } from 'primeng/dynamicdialog';
import { ViewDocumentComponent } from '../components/view-document/view-document.component';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LARGE_MODAL_OPTIONS } from '../utils/syscat';

@Directive({standalone: false, 
    selector: '[clickableImagePreview]'
})
export class ClickableImagePreviewDirective {
    constructor(private el: ElementRef<HTMLElement>, private dialogService: DialogService, private modalService: NgbModal) { }

    @HostListener('click', ['$event'])
    onClick(event: MouseEvent) {
        const target = event.target as HTMLElement | null;
        if (!target) return;

        // nếu click vào <img> (hoặc thẻ con của <img>), lấy img element
        let imgEl: HTMLImageElement | null = null;
        if (target.tagName.toLowerCase() === 'img') {
            imgEl = target as HTMLImageElement;
        } else {
            // trường hợp click vào phần tử con (hiếm) — tìm thằng ancestor là IMG
            imgEl = target.closest('img');
        }

        if (imgEl) {
            // dùng getAttribute để lấy src nguyên văn nếu cần (relative path)
            const src = imgEl.getAttribute('src') || imgEl.src;
            if (src) {

            }
        }
    }
}