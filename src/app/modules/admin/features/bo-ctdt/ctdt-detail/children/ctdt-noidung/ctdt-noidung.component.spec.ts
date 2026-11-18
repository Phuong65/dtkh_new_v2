import { signal } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { of, Subject } from 'rxjs';
import { CtdtNoidungComponent } from './ctdt-noidung.component';

describe('CtdtNoidungComponent knowledge block credits', () => {
    const createComponent = () => {
        const component = Object.create(CtdtNoidungComponent.prototype) as CtdtNoidungComponent;
        const state = component as any;
        state.selectedCtdt = { id: 1 };
        state.destroy$ = new Subject<void>();
        state.savingKhoi = signal(false);
        state.deletingKhoi = signal(false);
        state.formKhoi = new FormGroup({
            title: new FormControl('Khối cơ sở'),
            loai_khoi: new FormControl('BAT_BUOC', Validators.required),
            sotinchi_dukien: new FormControl(18, Validators.min(0))
        });
        state.list_course = [];
        state.list_khoikienthuc = [];
        state.emptyKhoiMarker = null;
        state.emptyKhoiGroup = 'KHOI_KIEN_THUC_EMPTY';
        state.helperService = { slugVietnamese: () => 'khoi-co-so' };
        state.ctdtConfigService = {
            addCtdtConfig: jasmine.createSpy('addCtdtConfig').and.returnValue(of({ id: 3 }))
        };
        state.getKhoiConfig = jasmine.createSpy('getKhoiConfig').and.returnValue(of([]));
        state.hasPendingChanges = jasmine.createSpy('hasPendingChanges').and.returnValue(false);
        state.refreshKhoiConfig = jasmine.createSpy('refreshKhoiConfig');
        return state as CtdtNoidungComponent;
    };

    it('saves the entered credit value with a new knowledge block', () => {
        const component = createComponent();

        component.saveKhoi();

        expect((component as any).ctdtConfigService.addCtdtConfig).toHaveBeenCalledWith(
            jasmine.objectContaining({
                group: 'KHOI_KIEN_THUC',
                params: { loai_khoi: 'BAT_BUOC', sotinchi_dukien: 18 }
            })
        );
    });

    it('rejects negative credit values', () => {
        const component = createComponent();
        component.formKhoi.controls['sotinchi_dukien'].setValue(-1);

        component.saveKhoi();

        expect((component as any).ctdtConfigService.addCtdtConfig).not.toHaveBeenCalled();
    });

    it('saves an edited default block credit when materializing programme-specific blocks', () => {
        const component = createComponent();
        component.selectedKhoi = {
            ctdt_id: 1, group: 'KHOI_KIEN_THUC', key: 'core', title: 'Khối cơ sở',
            params: { loai_khoi: 'BAT_BUOC', sotinchi_dukien: 12, extra: 'retained' }
        };
        component.list_khoikienthuc = [
            {
                ctdt_id: 1, group: 'KHOI_KIEN_THUC', key: 'core', title: 'Khối cơ sở',
                params: { loai_khoi: 'BAT_BUOC', sotinchi_dukien: 12, extra: 'retained' }
            },
            {
                ctdt_id: 1, group: 'KHOI_KIEN_THUC', key: 'elective', title: 'Khối tự chọn',
                params: { loai_khoi: 'TU_CHON', sotinchi_dukien: 9 }
            }
        ];
        component.formKhoi.controls['sotinchi_dukien'].setValue(15);
        component.formKhoi.controls['loai_khoi'].setValue('TU_CHON');

        component.saveKhoi();

        const addConfig = (component as any).ctdtConfigService.addCtdtConfig;
        expect(addConfig).toHaveBeenCalledWith(jasmine.objectContaining({
            key: 'core',
            params: { loai_khoi: 'TU_CHON', sotinchi_dukien: 15, extra: 'retained' }
        }));
        expect(addConfig).toHaveBeenCalledWith(jasmine.objectContaining({
            key: 'elective',
            params: { loai_khoi: 'TU_CHON', sotinchi_dukien: 9 }
        }));
    });

    it('keeps the saved credit value when grouping courses by block', () => {
        const component = createComponent();
        component.list_khoikienthuc = [{
            ctdt_id: 1, group: 'KHOI_KIEN_THUC', key: 'core', title: 'Khối cơ sở',
            params: { loai_khoi: 'BAT_BUOC', sotinchi_dukien: 18 }
        }];
        (component as any).list_course = [];

        (component as any).groupCourses();

        expect(component.list_cdt_hocphan[0].params?.sotinchi_dukien).toBe(18);
        expect(component.list_cdt_hocphan[0].params?.loai_khoi).toBe('BAT_BUOC');
    });

    it('recognizes the default elective block and migrates legacy credits into params', () => {
        const component = createComponent();
        component.list_khoikienthuc = [{
            ctdt_id: 1, group: 'KHOI_KIEN_THUC', key: 'TUCHON', title: 'Môn tự chọn', sotinchi_dukien: 6
        }];
        (component as any).list_course = [];

        (component as any).groupCourses();

        expect(component.list_cdt_hocphan[0].params?.loai_khoi).toBe('TU_CHON');
        expect(component.list_cdt_hocphan[0].params?.sotinchi_dukien).toBe(6);
    });

    it('adds a classified elective block when the default template omits it', () => {
        const component = createComponent();

        (component as any).applyKhoiConfig([], [{ key: 'core', title: 'Khối cơ sở' }], 1);

        const elective = component.list_khoikienthuc.find(item => item.key === 'TUCHON');
        expect(elective).toEqual(jasmine.objectContaining({
            title: 'Học phần tự chọn',
            params: { loai_khoi: 'TU_CHON' },
            ordering: 2
        }));
        expect(component.list_cdt_hocphan.find(item => item.key === 'TUCHON')?.params?.loai_khoi).toBe('TU_CHON');
    });

    it('still supplies the elective block when the defaults payload is not an array', () => {
        const component = createComponent();

        (component as any).applyKhoiConfig([], null, 1);

        expect(component.list_khoikienthuc).toEqual([
            jasmine.objectContaining({
                key: 'TUCHON',
                title: 'Học phần tự chọn',
                params: { loai_khoi: 'TU_CHON' }
            })
        ]);
    });

    it('renames and classifies an existing elective default while preserving its params', () => {
        const component = createComponent();

        (component as any).applyKhoiConfig([], [{
            key: 'TUCHON',
            title: 'Môn tự chọn',
            params: { loai_khoi: 'BAT_BUOC', sotinchi_dukien: 6, extra: 'retained' }
        }], 1);

        expect(component.list_khoikienthuc).toHaveSize(1);
        expect(component.list_khoikienthuc[0].title).toBe('Học phần tự chọn');
        expect(component.list_khoikienthuc[0].params).toEqual({
            loai_khoi: 'TU_CHON',
            sotinchi_dukien: 6,
            extra: 'retained'
        });
    });

    it('does not inject default blocks into an explicitly empty or customized CTĐT', () => {
        const component = createComponent();
        const defaults = [{ key: 'TUCHON', title: 'Môn tự chọn' }];

        (component as any).applyKhoiConfig([{
            ctdt_id: 1, group: 'KHOI_KIEN_THUC_EMPTY', key: 'khoi_kien_thuc_empty',
            title: 'Đã xóa toàn bộ khối kiến thức'
        }], defaults, 1);
        expect(component.list_khoikienthuc).toEqual([]);

        (component as any).applyKhoiConfig([{
            ctdt_id: 1, group: 'KHOI_KIEN_THUC', key: 'core', title: 'Khối cơ sở'
        }], defaults, 1);
        expect(component.list_khoikienthuc.map(item => item.key)).toEqual(['core']);
    });
});

describe('CtdtNoidungComponent remove course from block', () => {
    const createComponent = () => {
        const component = Object.create(CtdtNoidungComponent.prototype) as CtdtNoidungComponent;
        const state = component as any;
        state.selectedCtdt = { id: 1 };
        state.destroy$ = new Subject<void>();
        state.cancelKhoi$ = new Subject<void>();
        state.savingHp = signal(false);
        state.savingKhoi = signal(false);
        state.isLoadingData = signal(false);
        state.deletingKhoi = signal(false);
        state.courseLoadError = '';
        state.list_khoikienthuc = [{ key: 'core', title: 'Khối kiến thức' }];
        state.list_course = [];
        state.list_cdt_hocphan = [];
        state.courseLinks = [];
        state.persistedCourseRows = new Map();
        state.stagedAdds = new Map();
        state.stagedDeletes = new Map();
        state.dirtyCourseIds = new Set();
        state.selectedCourseCondition = null;
        state.notificationService = {
            confirmDelete2: jasmine.createSpy('confirmDelete2').and.returnValue(of(true)),
            toastInfo: jasmine.createSpy('toastInfo'),
            toastWarning: jasmine.createSpy('toastWarning')
        };
        return state;
    };

    it('stages the CTĐT link ID and hides a persisted course until save', () => {
        const component = createComponent();
        const course = { id: 7, ctdt_hocphan_id: 29, title: 'Học phần A', khoikienthuc: 'core' };
        component.list_course = [course];
        component.persistedCourseRows.set(7, course);
        component.courseLinks = [{ id: 29, course_id: 7, ctdt_id: 1, khoikienthuc: 'core' }];
        component.removeCourseFromBlock(course);
        expect(component.stagedDeletes.get(7)).toEqual({
            linkId: 29,
            course,
            linkDeleted: false,
            membershipSynced: false
        });
        expect(component.list_course).toEqual([]);
        expect(component.hasPendingChanges()).toBeTrue();
        expect(component.persistedCourseRows.get(7)).toBe(course);
    });

    it('waits for confirmation and escapes the course title in the dialog', () => {
        const component = createComponent();
        const confirmation = new Subject<boolean>();
        const course = { id: 7, ctdt_hocphan_id: 29, title: '<b>Học phần A</b> & "B"', khoikienthuc: 'core' };
        component.list_course = [course];
        component.persistedCourseRows.set(7, course);
        component.courseLinks = [{ id: 29, course_id: 7, ctdt_id: 1, khoikienthuc: 'core' }];
        component.notificationService.confirmDelete2.and.returnValue(confirmation);

        component.removeCourseFromBlock(course);

        expect(component.list_course).toEqual([course]);
        expect(component.stagedDeletes.size).toBe(0);
        expect(component.notificationService.toastInfo).not.toHaveBeenCalled();
        const dialog = component.notificationService.confirmDelete2.calls.mostRecent().args[0];
        expect(dialog.htmlMessage).toContain('&lt;b&gt;Học phần A&lt;/b&gt; &amp; &quot;B&quot;');
        expect(dialog.htmlMessage).toContain('Bấm Lưu lại');

        confirmation.next(true);
        confirmation.complete();
        expect(component.stagedDeletes.get(7)).toEqual({
            linkId: 29,
            course,
            linkDeleted: false,
            membershipSynced: false
        });
        expect(component.list_course).toEqual([]);
    });

    it('keeps the course, pending edits and popover when confirmation is cancelled', () => {
        const component = createComponent();
        const course = { id: 7, ctdt_hocphan_id: 29, title: 'Học phần A', khoikienthuc: 'core' };
        const popover = { hide: jasmine.createSpy('hide') };
        component.list_course = [course];
        component.persistedCourseRows.set(7, course);
        component.courseLinks = [{ id: 29, course_id: 7, ctdt_id: 1, khoikienthuc: 'core' }];
        component.dirtyCourseIds.add(7);
        component.selectedCourseCondition = course;
        component.notificationService.confirmDelete2.and.returnValue(of(false));

        component.removeCourseFromBlock(course, popover);

        expect(component.list_course).toEqual([course]);
        expect(component.stagedDeletes.size).toBe(0);
        expect(component.dirtyCourseIds.has(7)).toBeTrue();
        expect(component.selectedCourseCondition).toBe(course);
        expect(popover.hide).not.toHaveBeenCalled();
        expect(component.notificationService.toastInfo).not.toHaveBeenCalled();
    });

    it('keeps an unsaved addition when confirmation is cancelled', () => {
        const component = createComponent();
        const course = { id: 8, title: 'Học phần mới', khoikienthuc: 'core' };
        component.list_course = [course];
        component.stagedAdds.set(8, { course, blockKey: 'core' });
        component.dirtyCourseIds.add(8);
        component.notificationService.confirmDelete2.and.returnValue(of(false));

        component.removeCourseFromBlock(course);

        expect(component.stagedAdds.has(8)).toBeTrue();
        expect(component.dirtyCourseIds.has(8)).toBeTrue();
        expect(component.stagedDeletes.size).toBe(0);
        expect(component.list_course).toEqual([course]);
    });

    it('ignores confirmation after switching programmes', () => {
        const component = createComponent();
        const confirmation = new Subject<boolean>();
        const course = { id: 7, ctdt_hocphan_id: 29, title: 'Học phần A', khoikienthuc: 'core' };
        component.list_course = [course];
        component.courseLinks = [{ id: 29, course_id: 7, ctdt_id: 1, khoikienthuc: 'core' }];
        component.notificationService.confirmDelete2.and.returnValue(confirmation);

        component.removeCourseFromBlock(course);
        component.selectedCtdt = { id: 2 };
        confirmation.next(true);
        confirmation.complete();

        expect(component.stagedDeletes.size).toBe(0);
        expect(component.notificationService.toastInfo).not.toHaveBeenCalled();
    });

    ['cancelKhoi$', 'destroy$'].forEach(notifier => {
        it(`stops waiting for confirmation on ${notifier}`, () => {
            const component = createComponent();
            const confirmation = new Subject<boolean>();
            const course = { id: 7, ctdt_hocphan_id: 29, title: 'Học phần A', khoikienthuc: 'core' };
            component.list_course = [course];
            component.courseLinks = [{ id: 29, course_id: 7, ctdt_id: 1, khoikienthuc: 'core' }];
            component.notificationService.confirmDelete2.and.returnValue(confirmation);

            component.removeCourseFromBlock(course);
            component[notifier].next();
            confirmation.next(true);
            confirmation.complete();

            expect(component.stagedDeletes.size).toBe(0);
            expect(component.list_course).toEqual([course]);
            expect(component.notificationService.toastInfo).not.toHaveBeenCalled();
        });
    });

    it('discards an unsaved addition without staging an API deletion', () => {
        const component = createComponent();
        const course = { id: 8, title: 'Học phần mới', khoikienthuc: 'core' };
        component.list_course = [course];
        component.stagedAdds.set(8, { course, blockKey: 'core' });
        component.dirtyCourseIds.add(8);
        component.removeCourseFromBlock(course);
        expect(component.stagedAdds.size).toBe(0);
        expect(component.stagedDeletes.size).toBe(0);
        expect(component.hasPendingChanges()).toBeFalse();
        expect(component.list_course).toEqual([]);
    });

    it('preserves unrelated pending changes and ignores invalid link IDs', () => {
        const component = createComponent();
        const course = { id: 7, ctdt_hocphan_id: 0, title: 'Học phần A', khoikienthuc: 'core' };
        component.list_course = [course];
        component.dirtyCourseIds.add(9);
        component.removeCourseFromBlock(course);
        expect(component.stagedDeletes.size).toBe(0);
        expect(component.dirtyCourseIds.has(9)).toBeTrue();
        expect(component.list_course).toEqual([course]);
        expect(component.notificationService.toastWarning).toHaveBeenCalled();
    });

    it('closes the active condition popover for the removed course', () => {
        const component = createComponent();
        const course = { id: 7, ctdt_hocphan_id: 29, title: 'Học phần A', khoikienthuc: 'core' };
        const popover = { hide: jasmine.createSpy('hide') };
        component.list_course = [course];
        component.persistedCourseRows.set(7, course);
        component.courseLinks = [{ id: 29, course_id: 7, ctdt_id: 1, khoikienthuc: 'core' }];
        component.selectedCourseCondition = course;
        component.keyHp = 'hp_tienquyet';
        component.removeCourseFromBlock(course, popover);
        expect(popover.hide).toHaveBeenCalled();
        expect(component.selectedCourseCondition).toBeNull();
        expect(component.keyHp).toBeNull();
    });

    it('does not stage removal while saving or when the course is no longer visible', () => {
        const component = createComponent();
        const course = { id: 7, ctdt_hocphan_id: 29, title: 'Học phần A', khoikienthuc: 'core' };
        component.list_course = [course];
        component.courseLinks = [{ id: 29, course_id: 7, ctdt_id: 1, khoikienthuc: 'core' }];
        component.savingHp.set(true);
        component.removeCourseFromBlock(course);
        expect(component.stagedDeletes.size).toBe(0);
        component.savingHp.set(false);
        component.list_course = [];
        component.removeCourseFromBlock(course);
        expect(component.stagedDeletes.size).toBe(0);
    });
});
