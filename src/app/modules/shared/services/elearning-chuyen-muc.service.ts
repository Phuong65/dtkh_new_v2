import { Injectable } from '@angular/core';
import { environment, getRoute } from 'src/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Dto } from '@core/models/dto';
import { ElnChuyenMuc } from '../../shared/models/Elng';
import { map } from 'rxjs/operators';
import { ConditionOption } from '../models/condition-option';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';

@Injectable({
    providedIn: 'root'
})

export class ElnChuyenMucService {

    private api = getRoute('nganh-bomon/');

    constructor(
        private http: HttpClient,
        private httphelper: HttpParamsHeplerService
    ) {
    }

    addElnChuyenMuc(data: any): Observable<any> {
        return this.http.post<Dto>(this.api, data).pipe(
            map(res => res.data)
        );
    }

    updateElnChuyenMuc(deXuatId: number, data: any): Observable<any> {
        return this.http.put<Dto>(this.api.concat(deXuatId.toString()), data).pipe(
            map(res => res.data)
        );
    }


    getAllElnChuyenMuc(): Observable<ElnChuyenMuc[]> {
        //const filter = new HttpParams().set( 'khcn_id' , khcn_id.toString() ); { params : filter }
        const param = new HttpParams().set("limit", -1);
        return this.http.get<Dto>(this.api, { params: param }).pipe(
            map(res => res.data)
        );
    }

    deleteElnChuyenMuc(id: number): Observable<any> {
        return this.http.delete<Dto>(this.api.concat(id.toString())).pipe(
            map(res => res.data)
        );
    }

    getElnChuyenMucByCol(col: string, item: string): Observable<ElnChuyenMuc[]> {
        const filter = new HttpParams().set(col, item);
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => res.data)
        );
    }

    getElnChuyenMucByCols(condition: HttpParams): Observable<ElnChuyenMuc[]> {
        return this.http.get<Dto>(this.api, { params: condition }).pipe(
            map(res => res.data)
        );
    }

    getElnChuyenMucByItem(item: string, col: string): Observable<ElnChuyenMuc[]> {
        const by = new HttpParams().set('by', col);
        return this.http.get<Dto>(this.api.concat(item), { params: by }).pipe(
            map(res => res.data)
        );
    }

    getChuyemucByPageNew(option: ConditionOption): Observable<{ data: ElnChuyenMuc[], recordsFiltered: number }> {
        let filter = option.page ? this.httphelper.paramsConditionBuilder(option.condition).set("paged", option.page) : this.httphelper.paramsConditionBuilder(option.condition);
        if (option.set && option.set.length)
            option.set.forEach(f => {
                filter = filter.set(f.label, f.value);
            })
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => { return { data: res.data, recordsFiltered: res.recordsFiltered } })
        );
    }
}
