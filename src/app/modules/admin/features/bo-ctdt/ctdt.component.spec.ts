import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core-new/service/notification.service';
import { BoCtdt } from '@modules/shared/models/bo-ctdt';
import { Ctdt } from '@modules/shared/models/ctdt';
import { BoCtdtService } from '@modules/shared/services/bo-ctdt.service';
import { CtdtService } from '@modules/shared/services/ctdt.service';
import { CtdtHocphanService } from '@modules/shared/services/ctdt-hocphan.service';
import { DonViService } from '@modules/shared/services/don-vi.service';
import { ElnChuyenMucService } from '@modules/shared/services/elearning-chuyen-muc.service';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { HeDtService } from '@modules/shared/services/he-dt.service';
import { CtdtComponent } from './ctdt.component';

describe('CtdtComponent sidebar Bộ CTĐT', () => {
    const boA: BoCtdt = { id: 1, name: 'Bộ Công nghệ thông tin', code: 'CNTT', category_ids: [2], year: 2026 };
    const boB: BoCtdt = { id: 2, name: 'Bộ Điện tử', code: 'DT', category_ids: [3], year: 2026 };
    let fixture: ComponentFixture<CtdtComponent>;
    let component: CtdtComponent;
    let boService: jasmine.SpyObj<BoCtdtService>;
    let ctdtService: jasmine.SpyObj<CtdtService>;
    let route: { snapshot: { queryParamMap: ReturnType<typeof convertToParamMap> } };
    let router: { url: string; navigate: jasmine.Spy };

    beforeEach(() => {
        boService = jasmine.createSpyObj('BoCtdtService', ['get', 'create', 'update', 'delete']);
        boService.get.and.returnValue(of({ data: [boA, boB], totalRecords: 2, rows: 0 }));
        ctdtService = jasmine.createSpyObj('CtdtService', ['getCtdtByPageNew', 'addCtdt', 'deleteCtdt']);
        ctdtService.getCtdtByPageNew.and.returnValue(of({ data: [], recordsFiltered: 0 }));
        route = { snapshot: { queryParamMap: convertToParamMap({}) } };
        router = { url: '/admin/dao-tao/chuongtrinh-daotao', navigate: jasmine.createSpy('navigate') };
        TestBed.configureTestingModule({
            imports: [CtdtComponent],
            providers: [
                provideNoopAnimations(),
                { provide: ActivatedRoute, useValue: route },
                { provide: Router, useValue: router },
                { provide: AuthService, useValue: { hasRouter: () => false, userCanAdd: () => true, userCanDelete: () => true } },
                { provide: BoCtdtService, useValue: boService },
                { provide: CtdtService, useValue: ctdtService },
                { provide: CtdtHocphanService, useValue: { getCtdtHocphanByPageNew: () => of({ data: [] }) } },
                { provide: DonViService, useValue: { getDonviByPageNew: () => of({ data: [] }) } },
                { provide: ElnChuyenMucService, useValue: { getChuyemucByPageNew: () => of({ data: [] }) } },
                { provide: HeDtService, useValue: { getAllHeDt: () => of([]) } },
                { provide: ElnKhoaHocService, useValue: {} },
                { provide: ElngUserProfileService, useValue: {} },
                { provide: NotificationService, useValue: jasmine.createSpyObj('notification', ['toastError', 'toastWarning']) }
            ]
        });
        fixture = TestBed.createComponent(CtdtComponent);
        component = fixture.componentInstance;
    });

    afterEach(() => fixture.destroy());

    const changeSearch = (value: string) => {
        const input = fixture.nativeElement.querySelector('.ctdt-master-card__search input') as HTMLInputElement;
        input.value = value;
        input.dispatchEvent(new Event('input'));
        fixture.detectChanges();
    };

    it('renders name-only selection and core-new search without Bộ CRUD controls', () => {
        fixture.detectChanges();
        const sidebar = fixture.nativeElement.querySelector('aside') as HTMLElement;
        expect(sidebar.querySelector('input')?.classList.contains('admin-wrap-table__head-actions__search')).toBeTrue();
        const items = Array.from(sidebar.querySelectorAll<HTMLButtonElement>('.ctdt-master-item'));
        expect(items.map(item => item.textContent?.trim())).toEqual([boA.name, boB.name]);
        expect(items[0].getAttribute('aria-pressed')).toBe('true');
        expect(sidebar.querySelectorAll('button').length).toBe(items.length + 1);
        expect(sidebar.querySelector('.ti-plus, .ti-edit, .ti-trash, .ti-book')).toBeNull();
        expect(fixture.nativeElement.querySelector('main .ctdt-shell__add')).not.toBeNull();
        expect(fixture.nativeElement.querySelector('.ctdt-shell__bo-select')).toBeNull();
    });

    it('filters only by name without requests or changing the selected Bộ', () => {
        fixture.detectChanges();
        const boCalls = boService.get.calls.count();
        const ctdtCalls = ctdtService.getCtdtByPageNew.calls.count();
        changeSearch('  ĐIỆN  ');
        expect(component.filteredBoOptions()).toEqual([boB]);
        expect(component.selectedBo()).toEqual(boA);
        expect(boService.get.calls.count()).toBe(boCalls);
        expect(ctdtService.getCtdtByPageNew.calls.count()).toBe(ctdtCalls);
        changeSearch('CNTT');
        expect(component.filteredBoOptions()).toEqual([]);
        expect(fixture.nativeElement.querySelector('.ctdt-master-card__empty').textContent).toContain('Không tìm thấy');
        changeSearch('');
        expect(component.filteredBoOptions()).toEqual([boA, boB]);
    });

    it('selects a Bộ and resets programme search and pagination', () => {
        fixture.detectChanges();
        component.ctdtSearchValue.set('Bản tìm cũ');
        const items = fixture.nativeElement.querySelectorAll('.ctdt-master-item') as NodeListOf<HTMLButtonElement>;
        items[1].click();
        fixture.detectChanges();
        expect(component.selectedBo()).toEqual(boB);
        expect(component.ctdtSearchValue()).toBe('');
        const query = ctdtService.getCtdtByPageNew.calls.mostRecent().args[0];
        expect(query.page).toBe('1');
        expect(query.condition).toContain(jasmine.objectContaining({ conditionName: 'ctdt_bo_id', value: '2' }));
        expect(query.condition.some(condition => condition.conditionName === 'ten')).toBeFalse();
        expect(items[1].getAttribute('aria-pressed')).toBe('true');
        const count = ctdtService.getCtdtByPageNew.calls.count();
        items[1].click();
        expect(ctdtService.getCtdtByPageNew.calls.count()).toBe(count);
    });

    it('preserves selection and search while the reopen control overlays the panel', () => {
        fixture.detectChanges();
        changeSearch('Công nghệ');
        const sidebar = fixture.nativeElement.querySelector('aside') as HTMLElement;
        (sidebar.querySelector('.ctdt-panel-toggle') as HTMLButtonElement).click();
        fixture.detectChanges();
        expect(component.masterPanelCollapsed()).toBeTrue();
        expect(sidebar.hidden).toBeTrue();
        expect(getComputedStyle(sidebar).display).toBe('none');
        const reopen = fixture.nativeElement.querySelector('.ctdt-panel-reopen') as HTMLButtonElement;
        expect(getComputedStyle(reopen).position).toBe('absolute');
        expect(reopen.getAttribute('aria-controls')).toBe(sidebar.id);
        const layout = fixture.nativeElement.querySelector('.ctdt-master-detail') as HTMLElement;
        const detail = fixture.nativeElement.querySelector('main') as HTMLElement;
        expect(Math.abs(detail.getBoundingClientRect().left - layout.getBoundingClientRect().left)).toBeLessThan(1);
        reopen.click();
        fixture.detectChanges();
        expect(sidebar.hidden).toBeFalse();
        expect(component.boSearchValue()).toBe('Công nghệ');
        expect(component.selectedBo()).toEqual(boA);
    });

    it('honours the initial bo_id and passes it when opening a programme', () => {
        route.snapshot.queryParamMap = convertToParamMap({ bo_id: '2' });
        fixture.detectChanges();
        expect(component.selectedBo()).toEqual(boB);
        component.openCtdt({ id: 42 } as Ctdt);
        expect(router.navigate).toHaveBeenCalledWith(['/chuong-trinh-dao-tao'], { queryParams: { code: 42, bo_id: 2 } });
    });

    it('keeps the sidebar usable while programme loading fails', () => {
        ctdtService.getCtdtByPageNew.and.returnValue(throwError(() => new Error('failed')));
        fixture.detectChanges();
        expect(component.ctdtState()).toBe('error');
        expect(component.boState()).toBe('success');
        expect(fixture.nativeElement.querySelectorAll('aside .ctdt-master-item').length).toBe(2);
        expect(fixture.nativeElement.querySelector('main .admin-table__alert-danger')).not.toBeNull();
        expect(fixture.nativeElement.querySelector('aside .admin-table__alert-danger')).toBeNull();
    });

    it('renders loading and retry for Bộ separately from the programme table', () => {
        const pending = new Subject<{ data: BoCtdt[]; totalRecords: number; rows: number }>();
        boService.get.and.returnValue(pending);
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('aside app-loading-progress')).not.toBeNull();
        pending.error(new Error('failed'));
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('aside .admin-table__alert-danger')).not.toBeNull();
        expect(fixture.nativeElement.querySelector('main .admin-table__alert-danger')).toBeNull();
        boService.get.and.returnValue(of({ data: [boA, boB], totalRecords: 2, rows: 0 }));
        (fixture.nativeElement.querySelector('aside .admin-table__alert-danger__btn-reload') as HTMLElement).click();
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelectorAll('aside .ctdt-master-item').length).toBe(2);
    });

    it('does not request programmes when no Bộ is available', () => {
        boService.get.and.returnValue(of({ data: [], totalRecords: 0, rows: 0 }));
        fixture.detectChanges();
        expect(component.selectedBo()).toBeNull();
        expect(ctdtService.getCtdtByPageNew).not.toHaveBeenCalled();
        expect(fixture.nativeElement.querySelector('.ctdt-master-card__empty').textContent).toContain('Chưa có');
        expect((fixture.nativeElement.querySelector('.ctdt-shell__add') as HTMLButtonElement).disabled).toBeTrue();
    });

    it('ignores programme responses from a previously selected Bộ', () => {
        const pending = new Subject<{ data: Ctdt[]; recordsFiltered: number }>();
        ctdtService.getCtdtByPageNew.and.returnValue(pending);
        fixture.detectChanges();
        ctdtService.getCtdtByPageNew.and.returnValue(of({ data: [{ id: 22, ctdt_bo_id: 2, ten: 'CTĐT B' } as Ctdt], recordsFiltered: 1 }));
        component.selectBo(boB);
        pending.next({ data: [{ id: 11, ctdt_bo_id: 1, ten: 'CTĐT A' } as Ctdt], recordsFiltered: 1 });
        expect(component.ctdtTable.data().map(row => row.id)).toEqual([22]);
    });
});
