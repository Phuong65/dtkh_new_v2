import { signal } from '@angular/core';
import { of, Subject } from 'rxjs';
import { CtdtNoidungComponent } from './ctdt-noidung.component';

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
