import { Component, ElementRef, viewChild } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { providePrimeNG } from 'primeng/config';
import Lara from '@primeuix/themes/lara';
import { Popover, PopoverModule } from 'primeng/popover';

/**
 * Regression test cho lỗi hộp "Bộ lọc" của QuanlyLophocphanV2Component.
 *
 * Lỗi: PrimeNG 21.1.1 append panel của <p-popover> vào <body> nhưng khi đóng
 * không gỡ panel khỏi DOM (overlayVisible=false, render=false, onHide đã phát
 * nhưng phần tử vẫn còn trong <body>) -> hộp bộ lọc nằm vĩnh viễn trên màn
 * hình, không đóng được và lệch vị trí khi cuộn trang.
 *
 * Cách khắc phục: ghi nhận panel khi mở (onShow) và gỡ thủ công khi đóng (onHide).
 */
@Component({
    standalone: true,
    imports: [PopoverModule],
    template: `
        <button #filterBtn type="button" (click)="toggleFilterPopover($event)">Lọc</button>
        <p-popover #op appendTo="body" (onShow)="trackFilterPopoverPanel()"
            (onHide)="removeFilterPopoverPanel()">
            <div class="layout-filter-shift" style="width: 500px;">
                <div>Nội dung bộ lọc</div>
            </div>
        </p-popover>
    `
})
class PopoverFilterHostComponent {
    op = viewChild<Popover>('op');
    filterButton = viewChild<ElementRef<HTMLButtonElement>>('filterBtn');
    private panel: HTMLElement | null = null;

    toggleFilterPopover(event: Event): void {
        this.op()?.toggle(event, this.filterButton()?.nativeElement);
    }

    trackFilterPopoverPanel(): void {
        const popover = this.op();
        if (!popover?.overlayVisible) {
            return;
        }
        let container: HTMLElement | null = popover.container;
        if (!container) {
            const host = popover.el?.nativeElement as HTMLElement | undefined;
            container = (host?.querySelector('.p-popover') as HTMLElement | null) ?? undefined;
        }
        this.panel = container ?? null;
    }

    removeFilterPopoverPanel(): void {
        const panel = this.panel;
        this.panel = null;
        if (panel?.parentElement) {
            panel.remove();
        }
        document.querySelectorAll('body > .p-popover').forEach((el) => el.remove());
    }
}

describe('p-popover bộ lọc - QuanlyLophocphanV2Component', () => {
    let fixture: ComponentFixture<PopoverFilterHostComponent>;

    const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(() => resolve(), ms));
    const panel = () => document.querySelector('.p-popover') as HTMLElement | null;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PopoverFilterHostComponent],
            providers: [providePrimeNG({ theme: { preset: Lara, options: { darkModeSelector: false } }, ripple: true })]
        }).compileComponents();

        fixture = TestBed.createComponent(PopoverFilterHostComponent);
        fixture.detectChanges();
        await wait(100);
    });

    afterEach(() => {
        document.body.click();
        fixture?.destroy();
        document.querySelectorAll('body > .p-popover').forEach((el) => el.remove());
    });

    it('mở hộp bộ lọc: panel nằm ở <body>, position absolute và bám sát nút Lọc', async () => {
        const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
        const buttonRect = button.getBoundingClientRect();

        button.click();
        fixture.detectChanges();
        await wait(400);

        const opened = panel();
        expect(opened).withContext('panel phải tồn tại sau khi bấm').toBeTruthy();
        expect(opened?.parentElement).withContext('panel phải được gắn vào <body>').toBe(document.body);
        expect(getComputedStyle(opened).position)
            .withContext('panel phải là position:absolute để căn theo nút')
            .toBe('absolute');

        const panelRect = opened.getBoundingClientRect();
        const horizontalGap = Math.abs(panelRect.left - buttonRect.left);
        expect(horizontalGap).withContext(`panel phải thẳng hàng với nút (lệch ${horizontalGap}px)`).toBeLessThan(4);

        const below = Math.abs(panelRect.top - (buttonRect.top + buttonRect.height));
        const above = Math.abs((panelRect.top + panelRect.height) - buttonRect.top);
        // chấp nhận khoảng cách gutter của mũi tên popover (~10px)
        expect(Math.min(below, above))
            .withContext(`panel phải sát mép trên/dưới nút (dưới ${below}px, trên ${above}px)`)
            .toBeLessThan(20);
    });

    it('bấm lại nút Lọc phải đóng hẳn hộp bộ lọc', async () => {
        const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');

        button.click();
        fixture.detectChanges();
        await wait(400);
        expect(panel()).toBeTruthy();

        button.click();
        fixture.detectChanges();
        await wait(400);

        expect(fixture.componentInstance.op()?.overlayVisible)
            .withContext('overlayVisible phải false sau khi bấm lại').toBe(false);
        expect(panel()).withContext('panel phải bị gỡ khỏi <body> sau khi đóng').toBeNull();
    });

    it('bấm ra ngoài phải đóng hẳn hộp bộ lọc', async () => {
        const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');

        button.click();
        fixture.detectChanges();
        await wait(400);
        expect(panel()).toBeTruthy();

        document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        fixture.detectChanges();
        await wait(400);

        expect(panel()).withContext('panel phải bị gỡ khỏi <body> sau khi bấm ra ngoài').toBeNull();
    });

    it('mở/đóng nhiều lần không được sót panel nào trong <body>', async () => {
        const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');

        for (let i = 0; i < 3; i++) {
            button.click();
            fixture.detectChanges();
            await wait(400);
            expect(panel()).withContext(`lần mở ${i + 1}: phải có panel`).toBeTruthy();

            button.click();
            fixture.detectChanges();
            await wait(500);
            expect(panel()).withContext(`lần đóng ${i + 1}: không được sót panel`).toBeNull();
        }
    });
});

