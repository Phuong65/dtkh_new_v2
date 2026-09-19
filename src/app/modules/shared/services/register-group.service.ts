import { Injectable } from '@angular/core';
import { environment, getRoute } from 'src/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Dto, OvicConditionParam, OvicQueryCondition } from '@core/models/dto';
import { RegisterGroup } from '../../shared/models/register-group';
import { map } from 'rxjs/operators';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { ConditionOption } from '../models/condition-option';

@Injectable({
    providedIn: 'root'
})
export class RegisterGroupStatusService {

    private api = getRoute('class-group/');

    constructor(
        private http: HttpClient,
        private httpHelper: HttpParamsHeplerService
    ) {
    }

    addRegisterGroupStatus(data: any): Observable<any> {
        return this.http.post<Dto>(this.api, data).pipe(
            map(res => res.data)
        );
    }

    updateRegisterGroupStatus(deXuatId: any, data: any): Observable<any> {
        return this.http.put<Dto>(this.api.concat(deXuatId.toString()), data).pipe(
            map(res => res.data)
        );
    }

    getAllRegisterGroupStatusByUserCreate(user_id: number): Observable<RegisterGroup[]> {
        return this.http.get<Dto>(this.api.concat('?condition=creator_id,=,', user_id.toString())).pipe(
            map(res => res.data)
        );
    }

    getAllRegisterGroupStatus(): Observable<RegisterGroup[]> {
        //const filter = new HttpParams().set( 'khcn_id' , khcn_id.toString() ); { params : filter }
        return this.http.get<Dto>(this.api).pipe(
            map(res => res.data)
        );
    }

    deleteRegisterGroupStatus(id: number): Observable<any> {
        return this.http.delete<Dto>(this.api.concat(id.toString())).pipe(
            map(res => res.data)
        );
    }

    getRegisterGroupStatusByCol(col: string, item: string): Observable<RegisterGroup[]> {
        const filter = new HttpParams().set('condition', col.concat(',=,', item));
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => res.data)
        );
    }

    getRegisterGroupStatusByItem(item: string, col: string): Observable<RegisterGroup[]> {
        const by = new HttpParams().set('condition', col.concat(',=,', item));
        return this.http.get<Dto>(this.api, { params: by }).pipe(
            map(res => res.data)
        );
    }

    deleteTnStudentByUserId(id: string): Observable<any> {
        const by = new HttpParams().set('by', 'user_id');
        return this.http.delete<Dto>(this.api.concat(id), { params: by }).pipe(
            map(res => res.data)
        );
    }

    getRegisterGroupStatusLenght(): Observable<any> {
        const filter = new HttpParams().set('teacher', '0').set('limit', 1);
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => res)
        );
    }

    getRegisterGroupStatusPage(start: number, limit: number): Observable<RegisterGroup[]> {
        const filter = new HttpParams().set('limit', limit.toString()).set("offset", start.toString());
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => res.data)
        );
    }

    getRegisterGroupStatusByCols(condition: HttpParams): Observable<RegisterGroup[]> {
        return this.http.get<Dto>(this.api, { params: condition }).pipe(
            map(res => res.data)
        );
    }

    updateUserProfileByCol(deXuatId: any, data: any, col: string): Observable<any> {
        const by = new HttpParams().set('by', col);
        return this.http.put<Dto>(this.api.concat(deXuatId.toString()), data, { params: by }).pipe(
            map(res => res.data)
        );
    }


    // getRegisterGroupStatusByCols(condition: HttpParams): Observable<any> {
    //     return this.http.get<Dto>(this.api, { params: condition }).pipe(
    //         map(res => res)
    //     );
    // }

    getRegisterGroupStatusByPageNew(option: ConditionOption): Observable<{ data: RegisterGroup[], recordsFiltered: number }> {
        let filter = this.httpHelper.paramsConditionBuilder(option.condition).set("paged", option.page);
        if (option.set && option.set.length)
            option.set.forEach(f => {
                filter = filter.set(f.label, f.value);
            })
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => { return { data: res.data, recordsFiltered: res.recordsFiltered } })
        );
    }
}
