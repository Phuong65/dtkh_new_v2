import { Component, Input, SimpleChange } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AbstractControl } from '@angular/forms';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Observable, Subject, of, throwError } from 'rxjs';
import { HelperService } from '@core/services/helper.service';
import { NotificationService } from '@core-new/service/notification.service';
import { BoCtdt } from '@modules/shared/models/bo-ctdt';
import { CtdtBoMuctieuCuthe } from '@modules/shared/models/ctdt-bo-muctieu-cuthe';
import { CtdtBoMuctieuCutheService } from '@modules/shared/services/ctdt-bo-muctieu-cuthe.service';
import { BoCtdtPeoComponent } from './bo-ctdt-peo.component';
import { OvicEditorComponent } from '@modules/shared/components/ovic-editor/ovic-editor.component';

@Component({ selector: 'ovic-editor', standalone: true, template: '' })
class OvicEditorStubComponent {
    @Input() height = '';
    @Input() formField: AbstractControl | undefined;
    @Input() default = '';
    @Input() readonly = false;
}

describe('BoCtdtPeoComponent', () => {
    const bo: BoCtdt = { id: 7, name: 'Bộ CNTT', code: 'CNTT', category_ids: [2], year: 2026 };
    const row: CtdtBoMuctieuCuthe = { id: 10, ctdt_bo_id: 7, noidung: '&lt;p&gt;PEO&lt;/p&gt;' };
    let component: BoCtdtPeoComponent;
    let service: jasmine.SpyObj<CtdtBoMuctieuCutheService>;
    let notification: jasmine.SpyObj<NotificationService>;

    const response = (data: CtdtBoMuctieuCuthe[]) => ({ data, recordsFiltered: data.length });

    beforeEach(() => {
        service = jasmine.createSpyObj('CtdtBoMuctieuCutheService', ['getByPage', 'create', 'update', 'delete']);
        service.getByPage.and.returnValue(of(response([row])));
        service.create.and.returnValue(of({ ...row, id: 20 }));
        service.update.and.returnValue(of(row));
        service.delete.and.returnValue(of(true));
        notification = jasmine.createSpyObj('NotificationService', ['toastSuccess', 'toastError', 'confirmDelete2', 'startDeleting']);
        notification.confirmDelete2.and.returnValue(of(true));
        notification.startDeleting.and.callFake((progress: Observable<number>) => new Observable<boolean>(subscriber =>
            progress.subscribe({ error: () => { subscriber.next(false); subscriber.complete(); }, complete: () => { subscriber.next(true); subscriber.complete(); } })
        ));
        TestBed.configureTestingModule({
            imports: [BoCtdtPeoComponent],
            providers: [
                provideNoopAnimations(),
                { provide: CtdtBoMuctieuCutheService, useValue: service },
                { provide: NotificationService, useValue: notification },
                { provide: HelperService, useValue: { decodeHTML: (text: string) => text.replace(/&lt;/g, '<').replace(/&gt;/g, '>') } }
            ]
        }).overrideComponent(BoCtdtPeoComponent, { remove: { imports: [OvicEditorComponent] }, add: { imports: [OvicEditorStubComponent] } });
        component = TestBed.runInInjectionContext(() => new BoCtdtPeoComponent());
        component.canAdd = component.canUpdate = component.canDelete = true;
        component.selectedBo = bo;
        component.ngOnChanges({ selectedBo: new SimpleChange(null, bo, true) });
    });

    afterEach(() => component.ngOnDestroy());

    it('loads only PEOs belonging to the selected Bộ', () => {
        const option = service.getByPage.calls.first().args[0];
        expect(option.condition).toContain(jasmine.objectContaining({ conditionName: 'ctdt_bo_id', value: '7' }));
        expect(component.rows().map(item => item.id)).toEqual([10]);
    });

    it('creates only the Bộ id and content', () => {
        component.openCreate();
        component.f.noidung.setValue('<p>PEO mới</p>');
        component.submit();
        expect(service.create).toHaveBeenCalledWith({ ctdt_bo_id: 7, noidung: '<p>PEO mới</p>' });
    });

    it('rejects empty rich text', () => {
        component.openCreate();
        component.f.noidung.setValue('<p><br></p>');
        component.submit();
        expect(service.create).not.toHaveBeenCalled();
        expect(component.form.invalid).toBeTrue();
    });

    it('updates the selected PEO and keeps the draft after an error', () => {
        component.openEdit(row);
        component.f.noidung.setValue('<p>Bản nháp</p>');
        service.update.and.returnValue(throwError(() => new Error('failed')));
        component.submit();
        expect(service.update).toHaveBeenCalledWith(10, { ctdt_bo_id: 7, noidung: '<p>Bản nháp</p>' });
        expect(component.drawerVisible()).toBeTrue();
        expect(component.f.noidung.value).toBe('<p>Bản nháp</p>');
    });

    it('ignores a late response from the previous Bộ', () => {
        const pending = new Subject<{ data: CtdtBoMuctieuCuthe[]; recordsFiltered: number }>();
        service.getByPage.and.returnValue(pending);
        component.loadRows();
        component.selectedBo = { ...bo, id: 8 };
        component.ngOnChanges({ selectedBo: new SimpleChange(bo, component.selectedBo, false) });
        pending.next(response([row]));
        expect(component.rows()).toEqual([]);
    });

    it('keeps loading error and retries without showing stale rows', () => {
        service.getByPage.and.returnValue(throwError(() => new Error('failed')));
        component.loadRows();
        expect(component.state()).toBe('error');
        service.getByPage.and.returnValue(of(response([])));
        component.loadRows();
        expect(component.state()).toBe('success');
        expect(component.rows()).toEqual([]);
    });

    it('cancels saving when switching Bộ before the response arrives', () => {
        const pending = new Subject<CtdtBoMuctieuCuthe>();
        component.openCreate();
        component.f.noidung.setValue('PEO mới');
        service.create.and.returnValue(pending);
        component.submit();
        component.selectedBo = { ...bo, id: 8 };
        service.getByPage.and.returnValue(of(response([])));
        component.ngOnChanges({ selectedBo: new SimpleChange(bo, component.selectedBo, false) });
        pending.next(row);
        expect(component.saving()).toBeFalse();
        expect(component.rows()).toEqual([]);
        expect(component.drawerVisible()).toBeFalse();
    });

    it('deletes a confirmed PEO without mutating other rows', () => {
        component.deleteRow(row);
        expect(service.delete).toHaveBeenCalledOnceWith(10);
        expect(component.rows()).toEqual([]);
    });

    it('does not delete after confirmation is declined', () => {
        notification.confirmDelete2.and.returnValue(of(false));
        component.deleteRow(row);
        expect(service.delete).not.toHaveBeenCalled();
        expect(component.rows().map(item => item.id)).toEqual([10]);
    });

    it('keeps toolbar and row icon buttons at the same height', () => {
        const fixture = TestBed.createComponent(BoCtdtPeoComponent);
        fixture.componentRef.setInput('selectedBo', bo);
        fixture.componentRef.setInput('canAdd', true);
        fixture.componentRef.setInput('canUpdate', true);
        fixture.componentRef.setInput('canDelete', true);
        fixture.detectChanges();

        const buttons = Array.from(fixture.nativeElement.querySelectorAll('.ictu-admin-icon-button')) as HTMLButtonElement[];
        expect(buttons.length).toBe(4);
        buttons.forEach(button => {
            expect(getComputedStyle(button).height).toBe('35px');
            expect(getComputedStyle(button).minHeight).toBe('35px');
            expect(getComputedStyle(button).width).toBe('35px');
        });
        fixture.destroy();
    });

    it('does not mutate for read-only users', () => {
        component.canAdd = component.canUpdate = component.canDelete = false;
        component.openCreate();
        component.openEdit(row);
        component.deleteRow(row);
        expect(component.drawerVisible()).toBeFalse();
        expect(service.create).not.toHaveBeenCalled();
        expect(service.update).not.toHaveBeenCalled();
        expect(service.delete).not.toHaveBeenCalled();
    });
});
