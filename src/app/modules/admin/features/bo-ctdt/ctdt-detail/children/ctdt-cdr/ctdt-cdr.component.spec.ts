import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AbstractControl, FormBuilder } from '@angular/forms';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { HelperService } from '@core/services/helper.service';
import { NotificationService } from '@core-new/service/notification.service';
import { OvicEditorComponent } from '@modules/shared/components/ovic-editor/ovic-editor.component';
import { CtdtService } from '@modules/shared/services/ctdt.service';
import { CtdtCdrService } from '@modules/shared/services/ctdt-cdr.service';
import { BoCtdtCdrService } from '@modules/shared/services/ctdt-bo-cdr.service';
import { CtdtMuctieuCutheService } from '@modules/shared/services/ctdt-muctieu-cuthe.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { of, Subject, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { CtdtCdr } from '@modules/shared/models/ctdt-cdr';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { Ctdt } from '@modules/shared/models/ctdt';
import { BoCtdtCdr } from '@modules/shared/models/bo-ctdt-cdr';
import { CtdtCdrComponent, CtdtCdrParent } from './ctdt-cdr.component';

@Component({ selector: 'ovic-editor', standalone: true, template: '' })
class OvicEditorStubComponent {
    @Input() height = '';
    @Input() formField: AbstractControl | undefined;
    @Input() default = '';
    @Output() changeText = new EventEmitter<string>();
}

describe('CtdtCdrComponent PLO template drawer', () => {
    const renderPreview = async (): Promise<ComponentFixture<CtdtCdrComponent>> => {
        const parent: CtdtCdrParent = {
            id: 1, ctdt_id: 9, kyhieu: 'PLO1', ordering: 1, noidung: '<p>Dạy học 1</p>',
            parent_id: 0, percent_pi: 0, tuongthich_peos: [11],
            children: [
                { id: 2, ctdt_id: 9, kyhieu: 'PI 1.1', ordering: 1, noidung: '<p>Nội dung PI thứ nhất</p>', parent_id: 1, percent_pi: 100, tuongthich_peos: [] },
                { id: 3, ctdt_id: 9, kyhieu: 'PI 1.2', ordering: 2, noidung: '<p>Nội dung PI thứ hai</p>', parent_id: 1, percent_pi: 50, tuongthich_peos: [] }
            ]
        };
        const rows: BoCtdtCdr[] = [parent, ...parent.children].map(row => ({
            id: row.id, ctdt_bo_id: 3, kyhieu: row.kyhieu, ordering: row.ordering,
            noidung: row.noidung, parent_id: row.parent_id, percent_pi: row.percent_pi
        }));
        await TestBed.configureTestingModule({
            imports: [CtdtCdrComponent],
            providers: [
                provideNoopAnimations(),
                { provide: AuthService, useValue: { userHasRole: () => true, user: { id: 1 } } },
                { provide: Router, useValue: { navigate: jasmine.createSpy() } },
                { provide: ActivatedRoute, useValue: {} },
                { provide: CtdtService, useValue: {} },
                { provide: CtdtCdrService, useValue: {} },
                { provide: BoCtdtCdrService, useValue: { getByPage: () => of({ data: rows, recordsFiltered: rows.length }) } },
                { provide: CtdtMuctieuCutheService, useValue: {} },
                { provide: ElngUserProfileService, useValue: {} },
                { provide: NotificationService, useValue: {} },
                { provide: HelperService, useValue: { decodeHTML: (value: string) => value } }
            ]
        }).overrideComponent(CtdtCdrComponent, {
            remove: { imports: [OvicEditorComponent] },
            add: { imports: [OvicEditorStubComponent] }
        }).compileComponents();
        const fixture = TestBed.createComponent(CtdtCdrComponent);
        const component = fixture.componentInstance;
        component.embedded = true;
        component.selectedCtdt = { id: 9, ctdt_bo_id: 3 } as Ctdt;
        component.list_ctdt_cdr = [parent];
        component.list_cdr_muctieu = [{ id: 11, kyhieu: 'PEO 1' } as any];
        component.state.set('success');
        fixture.detectChanges();
        component.openAddCtdtCdr();
        component.f['ordering'].setValue(1);
        component.selectTemplate(1);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
        return fixture;
    };

    it('renders the drawer preview with the same computed table styles and no PEO UI', async () => {
        const fixture = await renderPreview();
        const live = fixture.nativeElement.querySelector('.cdr-shell .cdr-grid-table') as HTMLElement;
        const drawer = document.body.querySelector('.ctdt-cdr-form-drawer') as HTMLElement;
        expect(drawer).not.toBeNull();
        const preview = drawer.querySelector('.cdr-template-table') as HTMLElement;
        expect(preview).not.toBeNull();
        expect(document.body.contains(preview)).toBeTrue();
        expect(drawer.querySelector('p-multiselect')).not.toBeNull();
        expect(preview.querySelector('.plo-peo-links')).toBeNull();
        expect(live.querySelector('.plo-peo-links')).not.toBeNull();
        expect(preview.querySelector('.plo-total-percent.percent-danger')?.textContent?.trim()).toBe('Tổng: 150%');
        expect(Array.from(preview.querySelectorAll('.pi-percent-val')).map(el => el.textContent?.trim())).toEqual(['100', '50']);

        for (const selector of ['th', '.row-plo td', '.row-pi td', '.plo-text', '.pi-text', '.plo-code-tag', '.pi-code-tag', '.pi-percent-val']) {
            const originalStyle = getComputedStyle(live.querySelector(selector));
            const previewStyle = getComputedStyle(preview.querySelector(selector));
            for (const property of ['font-size', 'font-weight', 'color', 'background-color', 'padding-top', 'padding-left', 'border-top-width', 'border-top-color']) {
                expect(previewStyle.getPropertyValue(property)).withContext(`${selector}: ${property}`)
                    .toBe(originalStyle.getPropertyValue(property));
            }
        }
        expect(getComputedStyle(preview.querySelector('.plo-text')).fontSize).toBe('14px');
        expect(getComputedStyle(preview.querySelector('th')).borderTopWidth).toBe('1px');
        fixture.destroy();
    });

    const createComponent = () => {
        const component = Object.create(CtdtCdrComponent.prototype) as CtdtCdrComponent;
        Object.defineProperty(component, 'formBuilder', { value: new FormBuilder() });
        component.formCtdtCdr = new FormBuilder().group({
            ctdt_id: [''], kyhieu: [''], ordering: ['', []], noidung: [''], parent_id: [''], tuongthich_peos: [[]], percent_pi: ['']
        });
        Object.defineProperty(component, 'createMode', { value: signal<'template' | 'manual'>('template') });
        Object.defineProperty(component, 'templateState', { value: signal('success') });
        Object.defineProperty(component, 'ploTemplates', { value: signal<any[]>([]) });
        Object.defineProperty(component, 'selectedTemplateId', { value: signal<number | null>(null) });
        Object.defineProperty(component, 'templateCopyError', { value: signal('') });
        Object.defineProperty(component, 'templateRetryable', { value: signal(false) });
        Object.defineProperty(component, 'helperService', { value: { decodeHTML: (value: string) => value } });
        component.selectedCtdt = { id: 9, ctdt_bo_id: 3 } as Ctdt;
        component.selectedParentCtdtCdr = null;
        component.isUpdated = false;
        component.savingCdr = false;
        component.drawerVisible = true;
        Object.defineProperty(component, 'drawerToken', { value: 1, writable: true });
        Object.defineProperty(component, 'templateLoadToken', { value: 0, writable: true });
        component.list_cdr_muctieu = [{ id: 11, kyhieu: 'PEO1' } as any];
        return component;
    };

    const prepareCopy = (legacy = false) => {
        const component = createComponent();
        const template = {
            id: 1, ctdt_bo_id: 3, parent_id: 0, noidung: 'PLO nguồn', percent_pi: 0,
            label: 'PLO nguồn', searchText: 'plo nguồn',
            children: [
                { id: 3, ctdt_bo_id: 3, parent_id: 1, noidung: 'PI A', percent_pi: 40 },
                { id: 2, ctdt_bo_id: 3, parent_id: 1, noidung: 'PI B', percent_pi: 60 }
            ] as BoCtdtCdr[]
        };
        if (legacy) {
            template.children[0] = { ...template.children[0], kyhieu: 'PI 9.8', ordering: 8 };
            template.children[1] = { ...template.children[1], kyhieu: 'PI 9.3', ordering: 3 };
        }
        component.ploTemplates.set([template]);
        component.selectedTemplateId.set(1);
        component.formCtdtCdr.patchValue({ ordering: 7, tuongthich_peos: [11] });
        Object.defineProperty(component, 'cancelDrawer$', { value: new Subject<void>() });
        Object.defineProperty(component, 'destroy$', { value: new Subject<void>() });
        const notification = jasmine.createSpyObj<NotificationService>('notification', ['toastError', 'toastWarning', 'toastSuccess']);
        Object.defineProperty(component, 'notificationService', { value: notification });
        const service = jasmine.createSpyObj<CtdtCdrService>('cdr', ['getCtdtCdrByPageNew', 'addCtdtCdr']);
        Object.defineProperty(component, 'ctdtCdrService', { value: service });
        const saved: CtdtCdr[] = [];
        service.getCtdtCdrByPageNew.and.callFake((option: ConditionOption) => {
            const code = option.condition.find(condition => condition.conditionName === 'kyhieu')?.value;
            const data = saved.filter(row => row.kyhieu === code);
            return of({ data, recordsFiltered: data.length });
        });
        service.addCtdtCdr.and.callFake((payload: Omit<CtdtCdr, 'id'>) => {
            const row = { ...payload, id: 100 + saved.length };
            saved.push(row);
            return of(row);
        });
        spyOn(component, 'closeForm').and.stub();
        spyOn(component, 'loadCtdtCdr').and.stub();
        return { component, template, service, notification, saved };
    };

    [false, true].forEach(legacy => {
        it(`copies ${legacy ? 'legacy' : 'uncoded'} source PI with independent target ordering and percentages`, async () => {
            const { component, service, saved } = prepareCopy(legacy);
            await component.saveCtdtCdr();
            expect(service.addCtdtCdr).toHaveBeenCalledTimes(3);
            expect(saved.map(row => row.kyhieu)).toEqual(['PLO7', 'PI 7.1', 'PI 7.2']);
            expect(saved.map(row => row.ordering)).toEqual([7, 1, 2]);
            expect(saved.map(row => row.parent_id)).toEqual([0, 100, 100]);
            expect(saved.map(row => row.percent_pi)).toEqual([0, 40, 60]);
            expect(saved[0].tuongthich_peos).toEqual([11]);
            expect(saved.slice(1).map(row => row.noidung)).toEqual(['PI A', 'PI B']);
            expect(component.closeForm).toHaveBeenCalled();
        });
    });

    [
        { noidung: '<p><br></p>' },
        { percent_pi: 101 },
        { percent_pi: -1 },
        { percent_pi: NaN },
        { parent_id: 99 },
        { ctdt_bo_id: 99 }
    ].forEach(invalid => {
        it(`rejects invalid template PI ${JSON.stringify(invalid)}`, async () => {
            const { component, template, service, notification } = prepareCopy();
            Object.assign(template.children[0], invalid);
            await component.saveCtdtCdr();
            expect(service.addCtdtCdr).not.toHaveBeenCalled();
            expect(notification.toastError).toHaveBeenCalled();
        });
    });

    it('resumes after a saved PI response is lost without duplicating PLO or PI', async () => {
        const { component, service, saved } = prepareCopy();
        let loseChildResponse = true;
        service.addCtdtCdr.and.callFake((payload: Omit<CtdtCdr, 'id'>) => {
            const row = { ...payload, id: 100 + saved.length };
            saved.push(row);
            if (payload.kyhieu === 'PI 7.1' && loseChildResponse) {
                loseChildResponse = false;
                return throwError(() => new HttpErrorResponse({ status: 0 }));
            }
            return of(row);
        });
        await component.saveCtdtCdr();
        expect(component.hasTemplateCopyPending).toBeTrue();
        expect(saved.length).toBe(2);
        expect(component.closeForm).not.toHaveBeenCalled();
        await component.saveCtdtCdr();
        expect(saved.map(row => row.kyhieu)).toEqual(['PLO7', 'PI 7.1', 'PI 7.2']);
        expect(service.addCtdtCdr).toHaveBeenCalledTimes(3);
        expect(component.hasTemplateCopyPending).toBeFalse();
        expect(component.closeForm).toHaveBeenCalled();
    });

    it('keeps common ordering and PEO controls while switching create modes', () => {
        const component = createComponent();
        component.formCtdtCdr.patchValue({ ordering: 4, tuongthich_peos: [11], noidung: 'Bản nháp' });

        component.selectCreateMode('manual');
        component.selectCreateMode('template');

        expect(component.formCtdtCdr.controls['ordering'].value).toBe(4);
        expect(component.formCtdtCdr.controls['tuongthich_peos'].value).toEqual([11]);
        expect(component.formCtdtCdr.controls['noidung'].value).toBe('Bản nháp');
    });

    it('maps preview PI codes to the target PLO ordering', () => {
        const component = createComponent();
        component.formCtdtCdr.controls['ordering'].setValue(7);

        expect(component.previewPloCode()).toBe('PLO7');
        expect(component.previewPiCode(1)).toBe('PI 7.2');
    });

    it('loads and groups only templates from the current programme set', () => {
        const component = createComponent();
        const service = {
            getByPage: jasmine.createSpy().and.returnValue(of({
                recordsFiltered: 3,
                data: [
                    { id: 1, ctdt_bo_id: 3, kyhieu: 'PLO1', ordering: 1, noidung: 'PLO', parent_id: 0, percent_pi: 0 },
                    { id: 2, ctdt_bo_id: 3, kyhieu: 'PI 1.1', ordering: 1, noidung: 'PI', parent_id: 1, percent_pi: 100 },
                    { id: 99, ctdt_bo_id: 4, kyhieu: 'PLO9', ordering: 9, noidung: 'Sai bộ', parent_id: 0, percent_pi: 0 }
                ] as BoCtdtCdr[]
            }))
        };
        Object.defineProperty(component, 'boCtdtCdrService', { value: service });
        Object.defineProperty(component, 'cancelTemplateLoad$', { value: new Subject<void>() });
        Object.defineProperty(component, 'destroy$', { value: new Subject<void>() });

        component.loadPloTemplates();

        expect(component.ploTemplates().length).toBe(1);
        expect(component.ploTemplates()[0].children.length).toBe(1);
        expect(component.ploTemplates()[0].children[0].kyhieu).toBe('PI 1.1');
        expect(component.ploTemplates()[0].label).toBe('PLO');
        expect(component.ploTemplates()[0].searchText).toBe('plo');
        expect(component.ploTemplates()[0].label).not.toContain('PLO1');
    });

    it('shows only content when template identifiers are missing', () => {
        const component = createComponent();
        Object.defineProperty(component, 'boCtdtCdrService', { value: {
            getByPage: () => of({ recordsFiltered: 1, data: [{
                id: 1, ctdt_bo_id: 3, parent_id: 0, kyhieu: null, ordering: null,
                noidung: '<p>Vận dụng kiến thức chuyên môn</p>', percent_pi: 0
            }] })
        } });
        Object.defineProperty(component, 'cancelTemplateLoad$', { value: new Subject<void>() });
        Object.defineProperty(component, 'destroy$', { value: new Subject<void>() });

        component.loadPloTemplates();

        expect(component.ploTemplates()[0].label).toBe('Vận dụng kiến thức chuyên môn');
        expect(component.ploTemplates()[0].searchText).toBe('vận dụng kiến thức chuyên môn');
    });
});
