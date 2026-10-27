import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { getRoute } from '@env';
import { Dto } from '@core/models/dto';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { ConditionOption } from '../models/condition-option';
import { CtdtBoMuctieuCuthe, CtdtBoMuctieuCuthePayload } from '../models/ctdt-bo-muctieu-cuthe';

@Injectable({ providedIn: 'root' })
export class CtdtBoMuctieuCutheService {
    private readonly api = getRoute('ctdt-bo-muctieu-cuthe/');

    constructor(private readonly http: HttpClient, private readonly httpHelper: HttpParamsHeplerService) {}

    getByPage(option: ConditionOption): Observable<{ data: CtdtBoMuctieuCuthe[]; recordsFiltered: number }> {
        let params = this.httpHelper.paramsConditionBuilder(option.condition);
        if (option.page) params = params.set('paged', option.page);
        option.set?.forEach(item => params = params.set(item.label, item.value));
        return this.http.get<Dto>(this.api, { params }).pipe(map(response => ({
            data: (response.data || []) as CtdtBoMuctieuCuthe[],
            recordsFiltered: Number(response.recordsFiltered) || 0
        })));
    }

    create(data: CtdtBoMuctieuCuthePayload): Observable<CtdtBoMuctieuCuthe> {
        return this.http.post<Dto>(this.api, data).pipe(map(response => response.data as CtdtBoMuctieuCuthe));
    }

    update(id: number, data: CtdtBoMuctieuCuthePayload): Observable<CtdtBoMuctieuCuthe> {
        return this.http.put<Dto>(this.api.concat(id.toString()), data).pipe(map(response => response.data as CtdtBoMuctieuCuthe));
    }

    delete(id: number): Observable<unknown> {
        return this.http.delete<Dto>(this.api.concat(id.toString())).pipe(map(response => response.data));
    }
}
