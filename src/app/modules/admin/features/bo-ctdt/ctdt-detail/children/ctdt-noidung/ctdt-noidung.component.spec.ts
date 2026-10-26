import { signal } from '@angular/core';
import { CtdtNoidungComponent } from './ctdt-noidung.component';

describe('CtdtNoidungComponent remove course from block', () => {
    const createComponent = () => {
        const component = Object.create(CtdtNoidungComponent.prototype) as CtdtNoidungComponent;
        const state = component as any;
        state.selectedCtdt = { id: 1 };
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
        state.notificationService = { toastInfo: jasmine.createSpy('toastInfo'), toastWarning: jasmine.createSpy('toastWarning') };
        return state;
    };

    it('stages the CTĐT link ID and hides a persisted course until save', () => {
        const component = createComponent();
        const course = { id: 7, ctdt_hocphan_id: 29, title: 'Học phần A', khoikienthuc: 'core' };
        component.list_course = [course];
        component.persistedCourseRows.set(7, course);
        component.courseLinks = [{ id: 29, course_id: 7, ctdt_id: 1, khoikienthuc: 'core' }];
        component.removeCourseFromBlock(course);
        expect(component.stagedDeletes.get(7)).toBe(29);
        expect(component.list_course).toEqual([]);
        expect(component.hasPendingChanges()).toBeTrue();
        expect(component.persistedCourseRows.get(7)).toBe(course);
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
