import { Component, Input, SimpleChange } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AbstractControl } from '@angular/forms';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { OvicEditorComponent } from '@modules/shared/components/ovic-editor/ovic-editor.component';
import { Observable, Subject, of, throwError } from 'rxjs';
import { HelperService } from '@core/services/helper.service';
import { NotificationService } from '@core-new/service/notification.service';
import { BoCtdt } from '@modules/shared/models/bo-ctdt';
import { BoCtdtCdr } from '@modules/shared/models/bo-ctdt-cdr';
import { BoCtdtCdrService } from '@modules/shared/services/ctdt-bo-cdr.service';
import { BoCtdtCdrComponent } from './bo-ctdt-cdr.component';

@Component({ selector: 'ovic-editor', standalone: true, template: '' })
class OvicEditorStubComponent {
    @Input() height = '';
    @Input() formField: AbstractControl | undefined;
    @Input() default = '';
    @Input() readonly = false;
}

describe('BoCtdtCdrComponent', () => {
    const bo: BoCtdt = { id: 7, name: 'Bộ CNTT', code: 'CNTT', category_ids: [2], year: 2026 };
    const plo: BoCtdtCdr = { id: 10, ctdt_bo_id: 7, kyhieu: 'PLO1', ordering: 1, noidung: '&lt;p&gt;PLO&lt;/p&gt;', parent_id: 0, percent_pi: 0 };
    const pi: BoCtdtCdr = { id: 11, ctdt_bo_id: 7, kyhieu: 'PI 1.1', ordering: 1, noidung: '&lt;p&gt;PI&lt;/p&gt;', parent_id: 10, percent_pi: 40 };
    let component: BoCtdtCdrComponent;
    let service: jasmine.SpyObj<BoCtdtCdrService>;
    let notification: jasmine.SpyObj<NotificationService>;

    const response = (data: BoCtdtCdr[]) => ({ data, recordsFiltered: data.length });
    const selectBo = (value: BoCtdt) => {
        const previous = component.selectedBo;
        component.selectedBo = value;
        component.ngOnChanges({ selectedBo: new SimpleChange(previous, value, !previous) });
    };

    beforeEach(() => {
        service = jasmine.createSpyObj('BoCtdtCdrService', ['getByPage', 'create', 'update', 'delete']);
        service.getByPage.and.returnValue(of(response([plo, pi])));
        service.create.and.returnValue(of({ ...plo, id: 20 }));
        service.update.and.returnValue(of(plo));
        service.delete.and.returnValue(of(true));
        notification = jasmine.createSpyObj('NotificationService', ['toastWarning', 'toastSuccess', 'toastError', 'confirmDelete2', 'startDeleting']);
        notification.confirmDelete2.and.returnValue(of(true));
        notification.startDeleting.and.callFake((progress: Observable<number>) => new Observable<boolean>(subscriber =>
            progress.subscribe({
                error: () => { subscriber.next(false); subscriber.complete(); },
                complete: () => { subscriber.next(true); subscriber.complete(); }
            })
        ));
        TestBed.configureTestingModule({
            imports: [BoCtdtCdrComponent],
            providers: [
                provideNoopAnimations(),
                { provide: BoCtdtCdrService, useValue: service },
                { provide: NotificationService, useValue: notification },
                { provide: HelperService, useValue: { decodeHTML: (text: string) => text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&') } }
            ]
        }).overrideComponent(BoCtdtCdrComponent, {
            remove: { imports: [OvicEditorComponent] },
            add: { imports: [OvicEditorStubComponent] }
        });
        component = TestBed.runInInjectionContext(() => new BoCtdtCdrComponent());
        component.canAdd = component.canUpdate = component.canDelete = true;
        selectBo(bo);
    });

    afterEach(() => component.ngOnDestroy());

    it('loads only the selected Bộ and groups its PI children', () => {
        const options = service.getByPage.calls.first().args[0];
        expect(options.condition).toContain(jasmine.objectContaining({ conditionName: 'ctdt_bo_id', value: '7' }));
        expect(component.rows().length).toBe(1);
        expect(component.rows()[0].children.map(child => child.id)).toEqual([11]);
        expect(component.state()).toBe('success');
    });

    it('has content and percent controls, rejecting empty rich text', () => {
        component.openCreatePlo();
        expect(Object.keys(component.form.controls)).toEqual(['percent_pi', 'noidung']);
        component.f.noidung.setValue('&lt;p&gt;&lt;br&gt;&lt;/p&gt;');
        component.submit();
        expect(service.create).not.toHaveBeenCalled();
        expect(component.form.invalid).toBeTrue();
    });

    it('creates a PLO without code or ordering fields', () => {
        component.openCreatePlo();
        component.f.noidung.setValue('&lt;p&gt;Nội dung mới&lt;/p&gt;');
        component.submit();
        expect(service.create.calls.mostRecent().args[0]).toEqual({
            ctdt_bo_id: 7, noidung: '&lt;p&gt;Nội dung mới&lt;/p&gt;', parent_id: 0, percent_pi: 0
        });
        expect(component.drawerVisible()).toBeFalse();
        expect(component.saving()).toBeFalse();
    });

    it('creates a PI with the entered percent', () => {
        component.openCreatePi(component.rows()[0]);
        component.f.noidung.setValue('Nội dung PI');
        component.f.percent_pi.setValue(60);
        component.submit();
        expect(service.create.calls.mostRecent().args[0]).toEqual({
            ctdt_bo_id: 7, noidung: 'Nội dung PI', parent_id: 10, percent_pi: 60
        });
    });

    it('updates PI content and percent without code or ordering fields', () => {
        component.openEdit(component.rows()[0].children[0], component.rows()[0]);
        component.f.noidung.setValue('Nội dung sửa');
        component.f.percent_pi.setValue(75);
        component.submit();
        expect(service.update.calls.mostRecent().args).toEqual([11, {
            ctdt_bo_id: 7, noidung: 'Nội dung sửa', parent_id: 10, percent_pi: 75
        }]);
    });

    it('rejects a PI percent outside the integer 0-100 range', () => {
        component.openCreatePi(component.rows()[0]);
        component.f.noidung.setValue('Nội dung PI');
        component.f.percent_pi.setValue(101);
        component.submit();
        expect(service.create).not.toHaveBeenCalled();
        component.f.percent_pi.setValue(25.5);
        component.submit();
        expect(service.create).not.toHaveBeenCalled();
    });

    it('loads legacy rows without relying on code or ordering', () => {
        service.getByPage.and.returnValue(of(response([
            { ...plo, kyhieu: null, ordering: null },
            { ...pi, kyhieu: null, ordering: null }
        ])));
        component.loadRows();
        expect(component.rows()[0].children.map(child => child.id)).toEqual([11]);
    });

    it('keeps draft on a failed save', () => {
        component.openEdit(component.rows()[0]);
        component.f.noidung.setValue('Bản nháp cần giữ');
        service.update.and.returnValue(throwError(() => new Error('save failed')));
        component.submit();
        expect(component.drawerVisible()).toBeTrue();
        expect(component.f.noidung.value).toBe('Bản nháp cần giữ');
        expect(component.saving()).toBeFalse();
    });

    it('renders PI only after clicking the last PLO action', () => {
        const fixture = TestBed.createComponent(BoCtdtCdrComponent);
        const view = fixture.componentInstance;
        view.selectedBo = bo;
        view.canAdd = view.canUpdate = view.canDelete = true;
        view.ngOnChanges({ selectedBo: new SimpleChange(null, bo, true) });
        fixture.detectChanges();
        let row = fixture.nativeElement.querySelector('.bo-cdr-row-plo') as HTMLElement;
        let actions = Array.from(row.querySelectorAll<HTMLButtonElement>('.ictu-admin-table-actions button'));
        expect(actions.at(-1)?.classList.contains('bo-cdr-toggle')).toBeTrue();
        expect(actions.at(-1)?.getAttribute('aria-expanded')).toBe('false');
        expect(fixture.nativeElement.querySelector('.bo-cdr-row-pi')).toBeNull();
        actions.at(-1)?.click();
        fixture.detectChanges();
        row = fixture.nativeElement.querySelector('.bo-cdr-row-plo') as HTMLElement;
        actions = Array.from(row.querySelectorAll<HTMLButtonElement>('.ictu-admin-table-actions button'));
        expect(actions.at(-1)?.getAttribute('aria-expanded')).toBe('true');
        const piRow = fixture.nativeElement.querySelector('.bo-cdr-row-pi') as HTMLElement;
        expect(piRow).not.toBeNull();
        expect(piRow.querySelector('i.ti-arrow-forward')).not.toBeNull();
        fixture.destroy();
    });

    it('does not expand a PLO without PI children', () => {
        service.getByPage.and.returnValue(of(response([{ ...plo, parent_id: 0 }])));
        component.loadRows();
        component.togglePlo(component.rows()[0]);
        expect(component.isPloExpanded(component.rows()[0])).toBeFalse();
    });

    it('blocks deleting PLOs with children', () => {
        component.deleteRow(component.rows()[0]);
        expect(notification.confirmDelete2).not.toHaveBeenCalled();
        expect(service.delete).not.toHaveBeenCalled();
    });

    it('keeps failed deletes and removes a PI only after success without reloading', () => {
        const getCount = service.getByPage.calls.count();
        service.delete.and.returnValue(throwError(() => new Error('delete failed')));
        component.deleteRow(component.rows()[0].children[0]);
        expect(component.rows()[0].children.length).toBe(1);
        expect(component.deleting()).toBeFalse();
        service.delete.and.returnValue(of(true));
        component.deleteRow(component.rows()[0].children[0]);
        expect(component.rows()[0].children.length).toBe(0);
        expect(service.getByPage.calls.count()).toBe(getCount);
    });

    it('ignores late data from a previously selected Bộ', () => {
        const oldRequest = new Subject<{ data: BoCtdtCdr[]; recordsFiltered: number }>();
        service.getByPage.and.returnValue(oldRequest);
        component.loadRows();
        service.getByPage.and.returnValue(of(response([])));
        selectBo({ ...bo, id: 8 });
        oldRequest.next(response([plo, pi]));
        expect(component.rows()).toEqual([]);
    });

    it('cancels a pending create when the selected Bộ changes', () => {
        const pending = new Subject<BoCtdtCdr>();
        component.openCreatePlo();
        component.f.noidung.setValue('Nội dung');
        service.create.and.returnValue(pending);
        component.submit();
        selectBo({ ...bo, id: 8 });
        pending.next(plo);
        expect(component.saving()).toBeFalse();
        expect(component.rows()).toEqual([]);
    });

    it('blocks mutations for read-only users and allows returning to the table', () => {
        component.canAdd = component.canUpdate = component.canDelete = false;
        component.openCreatePlo();
        component.openEdit(component.rows()[0]);
        component.deleteRow(component.rows()[0].children[0]);
        expect(component.drawerVisible()).toBeFalse();
        expect(service.create).not.toHaveBeenCalled();
        expect(service.update).not.toHaveBeenCalled();
        expect(service.delete).not.toHaveBeenCalled();
        const back = spyOn(component.back, 'emit');
        component.goBack();
        expect(back).toHaveBeenCalled();
        component.saving.set(true);
        component.goBack();
        expect(back).toHaveBeenCalledTimes(1);
    });
});
