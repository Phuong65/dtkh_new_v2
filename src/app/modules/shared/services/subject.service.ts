import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { getRoute } from 'src/environments/environment';
import { Dto, IctuPaginator, IctuQueryParams, OvicConditionParam, dtoToIctuPaginator } from '@core/models/dto';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { Subject } from '@modules/shared/models/subject';

@Injectable({
    providedIn: 'root'
})
export class SubjectService {
    private readonly api = getRoute('subjects/');

    constructor(
        private http: HttpClient,
        private httpHelper: HttpParamsHeplerService
    ) {}

    get(conditions?: OvicConditionParam[], queryParams?: IctuQueryParams): Observable<IctuPaginator<Subject>> {
        const conds: OvicConditionParam[] = conditions || [];
        const fromObject: IctuQueryParams = queryParams || {};
        const params: HttpParams = this.httpHelper.paramsConditionBuilder(conds, new HttpParams({ fromObject }));
        return this.http.get<Dto>(this.api, { params }).pipe(
            map(response => dtoToIctuPaginator<Subject>(response))
        );
    }

    create(data: Partial<Subject>): Observable<Subject> {
        return this.http.post<Dto>(this.api, data).pipe(map(res => res.data as Subject));
    }

    update(id: number, data: Partial<Subject>): Observable<Subject> {
        return this.http.put<Dto>(this.api.concat(id.toString()), data).pipe(map(res => res.data as Subject));
    }

    delete(id: number): Observable<unknown> {
        return this.http.delete<Dto>(this.api.concat(id.toString())).pipe(map(res => res.data));
    }
}
