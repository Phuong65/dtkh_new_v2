import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { getRoute } from 'src/environments/environment';
import { Dto } from '@core/models/dto';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { SubjectClo } from '@modules/shared/models/subject-clo';

@Injectable({ providedIn: 'root' })
export class SubjectCloService {
    private readonly api = getRoute('subject-clo/');

    constructor(private readonly http: HttpClient, private readonly httpHelper: HttpParamsHeplerService) {}

    getByPageNew(option: ConditionOption): Observable<{ data: SubjectClo[]; recordsFiltered: number }> {
        let params = option.page
            ? this.httpHelper.paramsConditionBuilder(option.condition).set('paged', option.page)
            : this.httpHelper.paramsConditionBuilder(option.condition);
        option.set?.forEach(item => params = params.set(item.label, item.value));
        return this.http.get<Dto>(this.api, { params }).pipe(map(response => ({
            data: (response.data || []) as SubjectClo[],
            recordsFiltered: Number(response.recordsFiltered) || 0
        })));
    }

    add(data: Partial<SubjectClo>): Observable<SubjectClo | number | string> {
        return this.http.post<Dto>(this.api, data).pipe(map(response => response.data as SubjectClo | number | string));
    }

    update(id: number, data: Partial<SubjectClo>): Observable<SubjectClo> {
        return this.http.put<Dto>(this.api.concat(String(id)), data).pipe(map(response => response.data as SubjectClo));
    }

    delete(id: number): Observable<unknown> {
        return this.http.delete<Dto>(this.api.concat(String(id))).pipe(map(response => response.data));
    }
}
