import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { getRoute } from 'src/environments/environment';
import { Dto, IctuPaginator, IctuQueryParams, OvicConditionParam, dtoToIctuPaginator } from '@core/models/dto';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { BoCtdt } from '@modules/shared/models/bo-ctdt';

@Injectable({
    providedIn: 'root'
})
export class BoCtdtService {
    private readonly api = getRoute('ctdt-bo/');

    constructor(
        private http: HttpClient,
        private httpHelper: HttpParamsHeplerService
    ) {}

    get(conditions?: OvicConditionParam[], queryParams?: IctuQueryParams): Observable<IctuPaginator<BoCtdt>> {
        const conds: OvicConditionParam[] = conditions || [];
        const fromObject: IctuQueryParams = queryParams || {};
        const params: HttpParams = this.httpHelper.paramsConditionBuilder(conds, new HttpParams({ fromObject }));
        return this.http.get<Dto>(this.api, { params }).pipe(
            map(response => dtoToIctuPaginator<BoCtdt>(response))
        );
    }

    create(data: Partial<BoCtdt>): Observable<BoCtdt> {
        return this.http.post<Dto>(this.api, data).pipe(map(response => response.data as BoCtdt));
    }

    update(id: number, data: Partial<BoCtdt>): Observable<BoCtdt> {
        return this.http.put<Dto>(this.api.concat(id.toString()), data).pipe(map(response => response.data as BoCtdt));
    }

    delete(id: number): Observable<unknown> {
        return this.http.delete<Dto>(this.api.concat(id.toString())).pipe(map(response => response.data));
    }
}
