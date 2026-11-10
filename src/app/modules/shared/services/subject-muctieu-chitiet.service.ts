import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { getRoute } from 'src/environments/environment';
import { Dto } from '@core/models/dto';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { SubjectMuctieuChitiet } from '@modules/shared/models/subject-muctieu-chitiet';

@Injectable({ providedIn: 'root' })
export class SubjectMuctieuChitietService {
    private readonly api = getRoute('subject-muctieu-chitiet/');

    constructor(private readonly http: HttpClient, private readonly httpHelper: HttpParamsHeplerService) {}

    getByPageNew(option: ConditionOption): Observable<{ data: SubjectMuctieuChitiet[]; recordsFiltered: number }> {
        let params = option.page
            ? this.httpHelper.paramsConditionBuilder(option.condition).set('paged', option.page)
            : this.httpHelper.paramsConditionBuilder(option.condition);
        option.set?.forEach(item => params = params.set(item.label, item.value));
        return this.http.get<Dto>(this.api, { params }).pipe(map(response => ({
            data: (response.data || []) as SubjectMuctieuChitiet[],
            recordsFiltered: Number(response.recordsFiltered) || 0
        })));
    }

    add(data: Partial<SubjectMuctieuChitiet>): Observable<SubjectMuctieuChitiet | number | string> {
        return this.http.post<Dto>(this.api, data).pipe(map(response => response.data as SubjectMuctieuChitiet | number | string));
    }

    update(id: number, data: Partial<SubjectMuctieuChitiet>): Observable<SubjectMuctieuChitiet> {
        return this.http.put<Dto>(this.api.concat(String(id)), data).pipe(map(response => response.data as SubjectMuctieuChitiet));
    }

    delete(id: number): Observable<unknown> {
        return this.http.delete<Dto>(this.api.concat(String(id))).pipe(map(response => response.data));
    }
}
