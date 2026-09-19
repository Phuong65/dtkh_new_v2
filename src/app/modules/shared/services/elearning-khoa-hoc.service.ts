import { Injectable } from '@angular/core';
import { environment, getRoute } from 'src/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Dto, IctuPaginator, IctuQueryParams, OvicConditionParam, OvicQueryCondition } from '@core/models/dto';
import { ElnKhoaHoc } from '../../shared/models/elng-khoa-hoc';
import { map } from 'rxjs/operators';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { Courses } from './courses.service';
import { ConditionOption } from '../models/condition-option';

@Injectable({
    providedIn: 'root'
})
export class ElnKhoaHocService {

    private api = getRoute('courses/');

    constructor(
        private http: HttpClient,
        private httpHelper: HttpParamsHeplerService
    ) {
    }

    addElnKhoaHoc(data: any): Observable<any> {
        return this.http.post<Dto>(this.api, data).pipe(
            map(res => res.data)
        );
    }

    updateElnKhoaHoc(deXuatId: number, data: any): Observable<any> {
        return this.http.put<Dto>(this.api.concat(deXuatId.toString()), data).pipe(
            map(res => res.data)
        );
    }

    getAllElnKhoaHocByUserCreate(user_id: number): Observable<ElnKhoaHoc[]> {
        return this.http.get<Dto>(this.api.concat('?condition=creator_id,=,', user_id.toString())).pipe(
            map(res => res.data)
        );
    }

    getAllElnKhoaHoc(): Observable<ElnKhoaHoc[]> {
        //const filter = new HttpParams().set( 'khcn_id' , khcn_id.toString() ); { params : filter }
        return this.http.get<Dto>(this.api).pipe(
            map(res => res.data)
        );
    }

    deleteElnKhoaHoc(id: number): Observable<any> {
        return this.http.delete<Dto>(this.api.concat(id.toString())).pipe(
            map(res => res.data)
        );
    }

    getElnKhoaHocByCol(col: string, item: string): Observable<ElnKhoaHoc[]> {
        const filter = this.httpHelper.paramsConditionBuilder([
            { conditionName: 'status', condition: OvicQueryCondition.greaterThan, value: '-1', orWhere: 'and' },
            { conditionName: col, condition: OvicQueryCondition.equal, value: item, orWhere: 'and' },
        ]).set("limit", -1);
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => res.data)
        );
    }

    getElnKhoaHocByCols(condition: HttpParams): Observable<ElnKhoaHoc[]> {
        return this.http.get<Dto>(this.api, { params: condition }).pipe(
            map(res => res.data)
        );
    }

    getElnKhoaHocByColCondition(col: string, item: any): Observable<ElnKhoaHoc[]> {
        const filter = new HttpParams().set('condition', col.concat(',=,', item)).set('limit', -1);
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => res.data)
        );
    }

    getElnKhoaHocByItem(item: string, col: string): Observable<ElnKhoaHoc[]> {
        const by = new HttpParams().set('condition', col.concat(',=,', item)).set('limit', -1);
        return this.http.get<Dto>(this.api, { params: by }).pipe(
            map(res => res.data)
        );
    }

    getKhoaHocByPageNew(condition: OvicConditionParam[], page: number, setCondition?: { label: string, value: string }[]): Observable<{ data: ElnKhoaHoc[], recordsFiltered: number }> {
        let filter = this.httpHelper.paramsConditionBuilder(condition).set("paged", page);
        if (setCondition && setCondition.length)
            setCondition.forEach(f => {
                filter = filter.set(f.label, f.value);
            })
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => { return { data: res.data, recordsFiltered: res.recordsFiltered } })
        );
    }

    getKhoaHocByPageNew_2(option: ConditionOption): Observable<{ data: ElnKhoaHoc[], recordsFiltered: number }> {
        let filter = option.page ? this.httpHelper.paramsConditionBuilder(option.condition).set("paged", option.page) : this.httpHelper.paramsConditionBuilder(option.condition);
        if (option.set && option.set.length)
            option.set.forEach(f => {
                filter = filter.set(f.label, f.value);
            })
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => { return { data: res.data, recordsFiltered: res.recordsFiltered } })
        );
    }

    get<T>( conditions? : OvicConditionParam[] , queryParams? : IctuQueryParams ) : Observable<IctuPaginator<T>> {
		const _conditions : OvicConditionParam[] = conditions ? conditions : [];
		const fromObject : IctuQueryParams       = queryParams ? queryParams : {};
		const params : HttpParams                = this.httpHelper.paramsConditionBuilder( _conditions , new HttpParams( { fromObject } ) );
		return this.http.get<IctuPaginator<T>>( this.api , { params } );
	}

    getTotalnghiemthuCauhoi(option: ConditionOption):Observable<ElnKhoaHoc[]>{
        let filter = option.page ? this.httpHelper.paramsConditionBuilder(option.condition).set("paged", option.page) : this.httpHelper.paramsConditionBuilder(option.condition);
        if (option.set && option.set.length)
            option.set.forEach(f => {
                filter = filter.set(f.label, f.value);
            })
        return this.http.get<Dto>(this.api + 'nghiemthu-tracnghiem' , { params: filter }).pipe(
            map(res => res.data )
        );
    }

    getTotalQuestion(option: any):Observable<ElnKhoaHoc[]>{

        return this.http.get<Dto>(this.api + 'total-questions' , { params: option }).pipe(
            map(res => res.data )
        );
    }
}
