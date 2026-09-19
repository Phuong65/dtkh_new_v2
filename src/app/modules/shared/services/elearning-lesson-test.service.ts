import { Injectable } from '@angular/core';
import { environment, getRoute } from 'src/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Dto } from '@core/models/dto';
import { ElnLessonTest } from '../../shared/models/elng-lesson-test';
import { map } from 'rxjs/operators';
import { ConditionOption } from '../models/condition-option';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';

@Injectable({
    providedIn: 'root'
})
export class ElnLessonTestService {

    api = getRoute('lesson-tests/');

    constructor(
        private http: HttpClient,
        private httpHelper: HttpParamsHeplerService
    ) {
    }

    addElnLessonTest(data: any): Observable<any> {
        return this.http.post<Dto>(this.api, data).pipe(
            map(res => res.data)
        );
    }

    updateElnLessonTest(deXuatId: any, data: any): Observable<any> {
        return this.http.put<Dto>(this.api.concat(deXuatId.toString()), data).pipe(
            map(res => res.data)
        );
    }


    getAllElnLessonTest(): Observable<ElnLessonTest[]> {
        //const filter = new HttpParams().set( 'khcn_id' , khcn_id.toString() ); { params : filter }
        return this.http.get<Dto>(this.api).pipe(
            map(res => res.data)
        );
    }

    deleteElnLessonTest(ids: string): Observable<any> {
        return this.http.delete<Dto>(this.api.concat(ids)).pipe(
            map(res => res.data)
        );
    }

    getElnLessonTestByCol(col: string, item: any): Observable<ElnLessonTest[]> {
        const filter = new HttpParams().set('condition', col.concat(',=,', item)).set("limit", -1);
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => res.data)
        );
    }

    deleteElnLessonTestByCol(col: string, ids: string): Observable<any> {
        const by = new HttpParams().set('by', col);
        return this.http.delete<Dto>(this.api.concat(ids), { params: by }).pipe(
            map(res => res.data)
        );
    }

    getElnLessonTestByItem(col: string, item: any): Observable<ElnLessonTest[]> {
        const by = new HttpParams().set('condition', col.concat(',=,', item)).set("limit", -1);
        return this.http.get<Dto>(this.api, { params: by }).pipe(
            map(res => res.data)
        );
    }
    
    getElnLessonTestByPageNew(option: ConditionOption): Observable<{ data: ElnLessonTest[], recordsFiltered: number }> {
        let filter = option.page ? this.httpHelper.paramsConditionBuilder(option.condition).set("paged", option.page) : this.httpHelper.paramsConditionBuilder(option.condition);
        if (option.set && option.set.length)
            option.set.forEach(f => {
                filter = filter.set(f.label, f.value);
            })
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => { return { data: res.data, recordsFiltered: res.recordsFiltered } })
        );
    }
}
