import { signal } from '@angular/core';
import { CtdtCauhinhComponent, CtdtConfiAll } from './ctdt-cauhinh.component';

describe('CtdtCauhinhComponent row reorder', () => {
    const createComponent = () => {
        const component = Object.create(CtdtCauhinhComponent.prototype) as CtdtCauhinhComponent;
        Object.defineProperty(component, 'state', { value: signal('success'), writable: false });
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
