import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AbstractControl } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { HelperService } from '@core/services/helper.service';
import { NotificationService } from '@core-new/service/notification.service';
import { OvicEditorComponent } from '@modules/shared/components/ovic-editor/ovic-editor.component';
import { Ctdt } from '@modules/shared/models/ctdt';
import { CtdtMuctieuCuthe } from '@modules/shared/models/ctdt-muctieu-cuthe';
import { CtdtService } from '@modules/shared/services/ctdt.service';
import { CtdtConfigService } from '@modules/shared/services/ctdt-config.service';
import { CtdtMuctieuCutheService } from '@modules/shared/services/ctdt-muctieu-cuthe.service';
import { ConfigsService } from '@modules/shared/services/configs.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { CtdtCdrComponent, CtdtCdrSummary } from '../ctdt-cdr/ctdt-cdr.component';
import { CtdtHosoPhatTrienComponent } from '../ctdt-hoso-phattrien/ctdt-hoso-phattrien.component';
import { CtdtMuctieuCdrComponent } from './ctdt-muctieu-cdr.component';

@Component({ selector: 'ovic-editor', standalone: true, template: '' })
class OvicEditorStubComponent {
    @Input() height = '';
    @Input() formField: AbstractControl | undefined;
    @Input() default = '';
    @Output() changeText = new EventEmitter<string>();
}

@Component({ selector: 'app-ctdt-cdr', standalone: true, template: '' })
class CtdtCdrStubComponent {
    @Input() selectedCtdtInput: Ctdt | null = null;
    @Input() embedded = false;
    @Input() peoListInput: CtdtMuctieuCuthe[] | null = null;
    @Input() peoRefreshKey = 0;
    @Output() summaryChange = new EventEmitter<CtdtCdrSummary>();
}

describe('CtdtMuctieuCdrComponent settings tabs', () => {
    const createFixture = async (): Promise<ComponentFixture<CtdtMuctieuCdrComponent>> => {
        const auth = { userHasRole: () => true, user: { id: 1 } };
        const emptyService = { getCtdtMuctieuCutheByPageNew: () => of({ data: [] }) };
        await TestBed.configureTestingModule({
            imports: [CtdtMuctieuCdrComponent],
            providers: [
                provideNoopAnimations(),
                { provide: AuthService, useValue: auth },
                { provide: CtdtService, useValue: { updateCtdt: () => of({}) } },
                { provide: CtdtConfigService, useValue: emptyService },
                { provide: CtdtMuctieuCutheService, useValue: emptyService },
                { provide: ConfigsService, useValue: { getConfigsByPageNew: () => of({ data: [] }) } },
                { provide: ElngUserProfileService, useValue: { getUserProfileByPageNewV2: () => of({ data: [] }) } },
                { provide: NotificationService, useValue: {} },
                { provide: HelperService, useValue: { decodeHTML: (value: string) => value, encodeHTML: (value: string) => value } },
                { provide: Router, useValue: { navigate: () => Promise.resolve(true) } }
            ]
        }).overrideComponent(CtdtMuctieuCdrComponent, {
            remove: { imports: [OvicEditorComponent, CtdtCdrComponent] },
            add: { imports: [OvicEditorStubComponent, CtdtCdrStubComponent] }
        }).compileComponents();
        const fixture = TestBed.createComponent(CtdtMuctieuCdrComponent);
        fixture.detectChanges();
        return fixture;
    };

    const createComponent = () => {
        const component = Object.create(CtdtMuctieuCdrComponent.prototype) as CtdtMuctieuCdrComponent;
        Object.defineProperty(component, 'settingsTabs', { value: [
            { id: 'hoso-phattrien', label: 'Hồ sơ phát triển', icon: 'ti ti-file-text' },
            { id: 'muc-tieu-chung', label: 'Mục tiêu chung', icon: 'ti ti-compass' },
            { id: 'dinh-huong', label: 'Định hướng', icon: 'ti ti-arrows-left-right' },
            { id: 'muc-tieu-cu-the', label: 'Mục tiêu cụ thể', icon: 'ti ti-target' },
            { id: 'chuan-dau-ra', label: 'Chuẩn đầu ra', icon: 'ti ti-certificate' }
        ] });
        Object.defineProperty(component, 'activeSettingsTabId', { value: signal('muc-tieu-chung') });
        return component;
    };

    it('selects a subtab without clearing the general goal draft', () => {
        const component = createComponent();
        component.mucTieuChungDraft = 'Nội dung đang soạn';

        component.selectSettingsTab('dinh-huong');
        component.selectSettingsTab('muc-tieu-chung');

        expect(component.activeSettingsTabId()).toBe('muc-tieu-chung');
        expect(component.mucTieuChungDraft).toBe('Nội dung đang soạn');
    });

    it('renders one active panel and keeps the editor when switching subtabs', async () => {
        const fixture = await createFixture();
        const component = fixture.componentInstance;
        component.selectedCtdt = { id: 1, muctieu: '', ten: 'CTĐT' } as Ctdt;
        component.list_tuongthich = [];
        component.list_muctieu_cuthe = [];
        component.type_ctdt_muctieu_cuthe = [];
        component.state.set('success');
        component.goalsState.set('success');
        fixture.detectChanges();

        const editor = fixture.debugElement.query(By.directive(OvicEditorStubComponent));
        editor.componentInstance.changeText.emit('Bản nháp mục tiêu');
        component.selectSettingsTab('dinh-huong');
        fixture.detectChanges();

        expect(component.mucTieuChungDraft).toBe('Bản nháp mục tiêu');
        expect(fixture.debugElement.query(By.css('#settings-panel-muc-tieu-chung')).nativeElement.hidden).toBeTrue();
        expect(fixture.debugElement.query(By.css('#settings-panel-dinh-huong')).nativeElement.hidden).toBeFalse();
        expect(fixture.debugElement.queryAll(By.css('.settings-tabs__track > [role="tab"][aria-selected="true"]')).length).toBe(1);
    });

    it('supports arrow and boundary keys and focuses the selected tab', () => {
        const component = createComponent();
        const buttons = Array.from({ length: 5 }, () => document.createElement('button'));
        buttons.forEach(button => button.setAttribute('role', 'tab'));
        const tablist = document.createElement('div');
        buttons.forEach(button => tablist.appendChild(button));
        document.body.appendChild(tablist);

        try {
            const keydown = (key: string, index: number) => {
                const event = { key, currentTarget: buttons[index], preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;
                component.onSettingsTabKeydown(event, index);
                return event;
            };

            keydown('ArrowLeft', 0);
            expect(component.activeSettingsTabId()).toBe('chuan-dau-ra');
            expect(document.activeElement).toBe(buttons[4]);

            keydown('Home', 4);
            expect(component.activeSettingsTabId()).toBe('hoso-phattrien');
            expect(document.activeElement).toBe(buttons[0]);

            keydown('End', 0);
            expect(component.activeSettingsTabId()).toBe('chuan-dau-ra');

            keydown('ArrowRight', 4);
            expect(component.activeSettingsTabId()).toBe('hoso-phattrien');
        } finally {
            tablist.remove();
        }
    });
});
