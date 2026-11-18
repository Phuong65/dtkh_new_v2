import { signal } from '@angular/core';
import { CtdtCauhinhComponent, CtdtConfiAll } from './ctdt-cauhinh.component';

describe('CtdtCauhinhComponent row reorder', () => {
    const createComponent = () => {
        const component = Object.create(CtdtCauhinhComponent.prototype) as CtdtCauhinhComponent;
        Object.defineProperty(component, 'state', { value: signal('success'), writable: false });
        (component as any).selectedCtdt = { id: 1 };
        return component;
    };

    it('updates ordering from the reordered rows within one group', () => {
        const component = createComponent();
        const parent: CtdtConfiAll = {
            group: 'KHOI_KIEN_THUC',
            title: 'Khối kiến thức',
            ctdt_config: [
                { ctdt_id: 1, group: 'KHOI_KIEN_THUC', key: 'b', title: 'B', ordering: 2 },
                { ctdt_id: 1, group: 'KHOI_KIEN_THUC', key: 'a', title: 'A', ordering: 1 }
            ]
        };

        component.onConfigRowReorder(parent, { dragIndex: 0, dropIndex: 1 });

        expect(parent.ctdt_config.map(config => config.key)).toEqual(['b', 'a']);
        expect(parent.ctdt_config.map(config => config.ordering)).toEqual([1, 2]);
    });

    it('does not update ordering while a request is in progress', () => {
        const component = createComponent();
        component.state.set('loading');
        const parent: CtdtConfiAll = {
            group: 'KHOI_KIEN_THUC', title: 'Khối kiến thức',
            ctdt_config: [{ ctdt_id: 1, group: 'KHOI_KIEN_THUC', key: 'a', title: 'A', ordering: 3 }]
        };

        component.onConfigRowReorder(parent, { dragIndex: 0, dropIndex: 0 });

        expect(parent.ctdt_config[0].ordering).toBe(3);
    });
});

describe('CtdtCauhinhComponent default knowledge blocks', () => {
    const createComponent = () => {
        const component = Object.create(CtdtCauhinhComponent.prototype) as CtdtCauhinhComponent;
        (component as any).selectedCtdt = { id: 1 };
        return component;
    };

    it('adds the elective block and retains default params when mapping knowledge blocks', () => {
        const component = createComponent();

        const configs = (component as any).mapDefaultConfigs('KHOI_KIEN_THUC', [{
            key: 'core', title: 'Khối cơ sở', params: { sotinchi_dukien: 18, extra: 'retained' }
        }]);

        expect(configs).toEqual([
            jasmine.objectContaining({
                key: 'core',
                params: { sotinchi_dukien: 18, extra: 'retained' }
            }),
            jasmine.objectContaining({
                key: 'TUCHON',
                title: 'Học phần tự chọn',
                params: { loai_khoi: 'TU_CHON' }
            })
        ]);
    });

    it('supplies the elective block when no knowledge-block defaults are configured', () => {
        const component = createComponent();

        const configs = (component as any).mapDefaultConfigs('KHOI_KIEN_THUC', null);

        expect(configs).toEqual([
            jasmine.objectContaining({
                key: 'TUCHON',
                title: 'Học phần tự chọn',
                params: { loai_khoi: 'TU_CHON' }
            })
        ]);
    });

    it('normalizes an existing elective default without duplicating it or dropping its credits', () => {
        const component = createComponent();

        const configs = (component as any).mapDefaultConfigs('KHOI_KIEN_THUC', [{
            key: 'TUCHON',
            title: 'Môn tự chọn',
            sotinchi_dukien: 6,
            params: { loai_khoi: 'BAT_BUOC', extra: 'retained' }
        }]);

        expect(configs).toHaveSize(1);
        expect(configs[0]).toEqual(jasmine.objectContaining({
            key: 'TUCHON',
            title: 'Học phần tự chọn',
            sotinchi_dukien: 6,
            params: { loai_khoi: 'TU_CHON', extra: 'retained' }
        }));
    });
});
