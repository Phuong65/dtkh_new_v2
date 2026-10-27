import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AbstractControl } from '@angular/forms';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { HelperService } from '@core/services/helper.service';
import { NotificationService } from '@core-new/service/notification.service';
import { Ctdt } from '@modules/shared/models/ctdt';
import { CtdtService } from '@modules/shared/services/ctdt.service';
import { OvicEditorComponent } from '@modules/shared/components/ovic-editor/ovic-editor.component';
import { CtdtHosoPhatTrienComponent } from './ctdt-hoso-phattrien.component';

@Component({ selector: 'ovic-editor', standalone: true, template: '' })
class OvicEditorStubComponent {
    @Input() height = '';
    @Input() formField: AbstractControl | undefined;
    @Input() default = '';
    @Output() changeText = new EventEmitter<string>();
}

describe('CtdtHosoPhatTrienComponent', () => {
    let fixture: ComponentFixture<CtdtHosoPhatTrienComponent>;
    let component: CtdtHosoPhatTrienComponent;
    let updateCtdt: jasmine.Spy;

    beforeEach(async () => {
        updateCtdt = jasmine.createSpy('updateCtdt').and.returnValue(of({}));
        await TestBed.configureTestingModule({
            imports: [CtdtHosoPhatTrienComponent],
            providers: [
                provideNoopAnimations(),
                { provide: AuthService, useValue: { userHasRole: () => true } },
                { provide: CtdtService, useValue: { updateCtdt } },
                { provide: HelperService, useValue: { decodeHTML: (value: string) => value, encodeHTML: (value: string) => value } },
                { provide: NotificationService, useValue: { toastSuccess: jasmine.createSpy(), toastError: jasmine.createSpy() } }
            ]
        }).overrideComponent(CtdtHosoPhatTrienComponent, {
            remove: { imports: [OvicEditorComponent] },
            add: { imports: [OvicEditorStubComponent] }
        }).compileComponents();
        fixture = TestBed.createComponent(CtdtHosoPhatTrienComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('selectedCtdt', {
            id: 7,
            ten: 'CTĐT',
            mota: 'Mô tả cũ',
            cohoihoctap_sautotnghiep: 'Cơ hội cũ',
            vitri_lamviec_sautotnghiep: 'Vị trí cũ'
        } as Ctdt);
        fixture.componentRef.setInput('disabled', false);
        fixture.detectChanges();
    });

    it('loads all three profile fields and keeps the draft across editor tabs', () => {
        expect(component.formProfile.getRawValue()).toEqual({
            mota: 'Mô tả cũ',
            cohoihoctap_sautotnghiep: 'Cơ hội cũ',
            vitri_lamviec_sautotnghiep: 'Vị trí cũ'
        });
        component.formProfile.controls['mota'].setValue('Bản nháp mới');
        component.selectEditorTab('cohoi');
        component.selectEditorTab('mota');
        expect(component.formProfile.controls['mota'].value).toBe('Bản nháp mới');
    });

    it('saves only profile fields and emits the updated programme', () => {
        const updated = jasmine.createSpy('updated');
        component.ctdtUpdated.subscribe(updated);
        component.formProfile.setValue({ mota: 'Mới', cohoihoctap_sautotnghiep: 'Cơ hội', vitri_lamviec_sautotnghiep: 'Vị trí' });

        component.saveProfile();

        expect(updateCtdt).toHaveBeenCalledWith(7, {
            mota: 'Mới', cohoihoctap_sautotnghiep: 'Cơ hội', vitri_lamviec_sautotnghiep: 'Vị trí'
        });
        expect(updated).toHaveBeenCalled();
    });

    it('keeps the draft when save fails', () => {
        updateCtdt.and.returnValue(throwError(() => new Error('failed')));
        component.formProfile.controls['mota'].setValue('Không mất nội dung');

        component.saveProfile();

        expect(component.formProfile.controls['mota'].value).toBe('Không mất nội dung');
    });
});
