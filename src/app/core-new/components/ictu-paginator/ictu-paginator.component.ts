import { Component, computed, input, InputSignal, output, OutputEmitterRef, Signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { MatButton } from '@angular/material/button';
import { IctuPaginatorControl } from '@core-new/components/ictu-paginator/ictu-paginator-control';

@Component({
    selector: 'ictu-paginator',
    standalone: true,
    imports: [NgClass, MatButton],
    templateUrl: './ictu-paginator.component.html',
    styleUrl: './ictu-paginator.component.css',
    host: {
        class: 'ictu-paginator w-100 d-flex align-items-center justify-content-center',
        style: `
            --mat-button-filled-label-text-font: "Roboto", sans-serif;
            --mat-button-filled-label-text-size: 14px;
            --mat-button-filled-label-text-tracking: normal;
            --mat-button-filled-label-text-weight: 400;
            --mat-button-filled-label-text-transform: none;
            --mat-button-filled-container-height:35px;
            --p-icon-size:14px;
        `
    }
})
export class IctuPaginatorComponent {
    control: InputSignal<IctuPaginatorControl> = input.required<IctuPaginatorControl>();
    onChangePage: OutputEmitterRef<number> = output<number>();

    pageCount: Signal<number> = computed(() => Math.ceil(this.control().totalRecords() / this.control().rows()));
    empty: Signal<boolean> = computed(() => this.control().totalRecords() === 0);
    isFirstPage: Signal<boolean> = computed(() => this.control().paged() === 1);
    isLastPage: Signal<boolean> = computed(() => this.control().paged() === this.pageCount());

    elements: Signal<number[]> = computed(() => {
        const numberOfPages: number = this.pageCount();
        const visiblePages: number = Math.min(Math.max(this.control().pageLinkSize() - 1, 2), numberOfPages);
        let start: number = Math.max(1, Math.ceil(this.control().paged() - visiblePages / 2));
        const end: number = Math.min(numberOfPages, start + visiblePages);
        const delta: number = this.control().pageLinkSize() - (end - start + 1);
        start = Math.max(1, start - delta);
        const pageLinks: number[] = [];
        for (let i = start; i <= end; i++) {
            pageLinks.push(i);
        }
        return pageLinks;
    });

    changePageToFirst(event: MouseEvent): void {
        if (!this.isFirstPage()) {
            this.changePage(1);
        }
        event.preventDefault();
    }

    changePageToPrev(event: MouseEvent): void {
        this.changePage(this.control().paged() - 1);
        event.preventDefault();
    }

    changePageToNext(event: MouseEvent): void {
        this.changePage(this.control().paged() + 1);
        event.preventDefault();
    }

    changePageToLast(event: MouseEvent): void {
        if (!this.isLastPage()) {
            this.changePage(this.pageCount());
        }
        event.preventDefault();
    }

    changePage(pageNumber: number, event?: MouseEvent): void {
        if (pageNumber >= 1 && pageNumber <= this.pageCount() && pageNumber !== this.control().paged()) {
            this.onChangePage.emit(pageNumber);
        }
        event?.preventDefault();
    }
}