import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { getRoute } from '@env';
import { OvicQueryCondition } from '@core/models/dto';
import { CtdtBoMuctieuCutheService } from './ctdt-bo-muctieu-cuthe.service';

describe('CtdtBoMuctieuCutheService', () => {
    let service: CtdtBoMuctieuCutheService;
    let http: HttpTestingController;
    const api = getRoute('ctdt-bo-muctieu-cuthe/');

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
        service = TestBed.inject(CtdtBoMuctieuCutheService);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => http.verify());

    it('loads PEOs with the Bộ filter', () => {
        service.getByPage({
            condition: [{ conditionName: 'ctdt_bo_id', condition: OvicQueryCondition.equal, value: '7', orWhere: 'and' }],
            set: [{ label: 'limit', value: '-1' }], page: null
        }).subscribe(response => expect(response.data[0].ctdt_bo_id).toBe(7));
        const request = http.expectOne(req => req.method === 'GET' && req.url === api);
        expect(request.request.params.get('condition[0][key]')).toBe('ctdt_bo_id');
        expect(request.request.params.get('condition[0][value]')).toBe('7');
        expect(request.request.params.get('limit')).toBe('-1');
        request.flush({ data: [{ id: 1, ctdt_bo_id: 7, noidung: 'PEO' }], recordsFiltered: 1 });
    });

    it('creates with only ctdt_bo_id and noidung', () => {
        const payload = { ctdt_bo_id: 7, noidung: 'PEO mới' };
        service.create(payload).subscribe();
        const request = http.expectOne(api);
        expect(request.request.method).toBe('POST');
        expect(request.request.body).toEqual(payload);
        request.flush({ data: { id: 2, ...payload } });
    });

    it('updates and deletes by id', () => {
        const payload = { ctdt_bo_id: 7, noidung: 'PEO sửa' };
        service.update(3, payload).subscribe();
        const update = http.expectOne(api + '3');
        expect(update.request.method).toBe('PUT');
        expect(update.request.body).toEqual(payload);
        update.flush({ data: { id: 3, ...payload } });

        service.delete(3).subscribe();
        const remove = http.expectOne(api + '3');
        expect(remove.request.method).toBe('DELETE');
        remove.flush({ data: true });
    });
});
