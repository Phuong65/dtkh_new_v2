import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ListEditorComponent } from './list-editor.component';

describe('ListEditorComponent', () => {
    let fixture: ComponentFixture<ListEditorComponent>;
    let component: ListEditorComponent;
    let formField: FormControl<string[]>;
    let root: HTMLElement;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ListEditorComponent],
            providers: [provideNoopAnimations()]
        }).compileComponents();

        formField = new FormControl<string[]>([], { nonNullable: true });
        fixture = TestBed.createComponent(ListEditorComponent);
        fixture.componentRef.setInput('formField', formField);
        fixture.componentRef.setInput('addByButton', true);
        fixture.detectChanges();
        component = fixture.componentInstance;
        root = fixture.nativeElement as HTMLElement;
    });

    it('thêm một dòng khi nhấn nút và giữ dữ liệu đã nhập', fakeAsync(() => {
        const addButton = root.querySelector<HTMLButtonElement>('.list-editor-add-btn')!;
        expect(addButton.textContent).toContain('Thêm nội dung');
        expect(fixture.nativeElement.textContent).not.toContain('Nhấn Tab');

        addButton.click();
        fixture.detectChanges();
        tick();
        expect(component.listValue.length).toBe(1);
        expect(formField.value).toEqual([]);

        component.listValue[0].value = 'Nội dung thứ nhất';
        component.setForm();
        addButton.click();
        fixture.detectChanges();
        tick();
        expect(component.listValue.length).toBe(2);
        expect(formField.value).toEqual(['Nội dung thứ nhất']);
        expect(document.activeElement).toBe(fixture.nativeElement.querySelectorAll('.content-editor-list')[1]);
    }));

    it('nạp nội dung có sẵn mà không tự thêm dòng trống', fakeAsync(() => {
        formField.setValue(['Nội dung thứ nhất', 'Nội dung thứ hai']);
        fixture.detectChanges();
        tick();

        expect(component.listValue.map(item => item.value)).toEqual(formField.value);
        expect(root.querySelectorAll('.content-editor-list').length).toBe(2);

        root.querySelector<HTMLButtonElement>('.list-editor-add-btn')!.click();
        fixture.detectChanges();
        tick();
        expect(component.listValue.length).toBe(3);
        expect(formField.value).toEqual(['Nội dung thứ nhất', 'Nội dung thứ hai']);
    }));

    it('nhấn thêm liên tiếp chỉ focus dòng trống đang có', fakeAsync(() => {
        const addButton = root.querySelector<HTMLButtonElement>('.list-editor-add-btn')!;
        addButton.click();
        fixture.detectChanges();
        tick();
        addButton.click();
        fixture.detectChanges();
        tick();

        expect(component.listValue.length).toBe(1);
        expect(document.activeElement).toBe(root.querySelector('.content-editor-list'));
        expect(formField.value).toEqual([]);
    }));

    it('dán danh sách không ghi đè nội dung đã có trong chế độ nút', () => {
        formField.setValue(['Nội dung thứ nhất', 'Nội dung thứ hai']);
        const clipboardData = new DataTransfer();
        clipboardData.setData('text/html', '<p>Mục dán thứ nhất</p><p>Mục dán thứ hai</p>');
        const event = new ClipboardEvent('paste', { clipboardData, cancelable: true });

        component.onPaste(event);

        expect(event.defaultPrevented).toBeTrue();
        expect(formField.value).toEqual([
            'Nội dung thứ nhất', 'Nội dung thứ hai', 'Mục dán thứ nhất', 'Mục dán thứ hai'
        ]);
    });

    it('dán danh sách vào dòng trống cuối mà không tạo dòng trống thừa', () => {
        formField.setValue(['Nội dung đã lưu', '']);
        const clipboardData = new DataTransfer();
        clipboardData.setData('text/html', '<p>Mục A</p><p>Mục B</p>');

        component.onPaste(new ClipboardEvent('paste', { clipboardData, cancelable: true }));

        expect(component.listValue.map(item => item.value)).toEqual(['Nội dung đã lưu', 'Mục A', 'Mục B']);
        expect(formField.value).toEqual(['Nội dung đã lưu', 'Mục A', 'Mục B']);
    });

    it('không tạo dòng khi bấm Tab trong chế độ nút', fakeAsync(() => {
        root.querySelector<HTMLButtonElement>('.list-editor-add-btn')!.click();
        fixture.detectChanges();
        tick();
        const editor = root.querySelector<HTMLElement>('.content-editor-list')!;
        const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
        editor.dispatchEvent(event);
        fixture.detectChanges();
        expect(event.defaultPrevented).toBeFalse();
        expect(component.listValue.length).toBe(1);
    }));

    it('giữ hành vi Tab cũ cho nơi không dùng chế độ nút', () => {
        fixture.componentRef.setInput('addByButton', false);
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('.list-editor-add-btn')).toBeNull();
        expect(fixture.nativeElement.textContent).toContain('Nhấn Tab');

        const editor = root.querySelector<HTMLElement>('.content-editor-list')!;
        const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
        editor.dispatchEvent(event);
        expect(event.defaultPrevented).toBeTrue();
    });

    it('xóa tất cả rồi vẫn thêm được dòng mới', fakeAsync(() => {
        root.querySelector<HTMLButtonElement>('.list-editor-add-btn')!.click();
        fixture.detectChanges();
        tick();
        component.listValue[0].value = 'Nội dung';
        component.setForm();
        component.deleteAllList();
        fixture.detectChanges();
        expect(formField.value).toEqual([]);

        root.querySelector<HTMLButtonElement>('.list-editor-add-btn')!.click();
        fixture.detectChanges();
        tick();
        expect(component.listValue.length).toBe(1);
    }));
});
