import { Injectable } from '@angular/core';
import { environment, getRoute } from 'src/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Dto, OvicConditionParam } from '@core/models/dto';
import { ElnLessonTestQuestion } from '../../shared/models/elng-lesson-test-question';
import { map } from 'rxjs/operators';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { ConditionOption } from '../models/condition-option';

@Injectable({
    providedIn: 'root'
})
export class ElnLessonTestQuestionService {

    api = getRoute('lesson-test-questions/');

    constructor(
        private http: HttpClient,
        private httpHelper: HttpParamsHeplerService
    ) {
    }

    addElnLessonTestQuestion(data: any): Observable<any> {
        return this.http.post<Dto>(this.api, data).pipe(
            map(res => res.data)
        );
    }

    updateElnLessonTestQuestion(deXuatId: number, data: any): Observable<any> {
        return this.http.put<Dto>(this.api.concat(deXuatId.toString()), data).pipe(
            map(res => res.data)
        );
    }


    getAllElnLessonTestQuestion(): Observable<ElnLessonTestQuestion[]> {
        //const filter = new HttpParams().set( 'khcn_id' , khcn_id.toString() ); { params : filter }
        return this.http.get<Dto>(this.api).pipe(
            map(res => res.data)
        );
    }

    deleteElnLessonTestQuestion(ids: string): Observable<any> {
        return this.http.delete<Dto>(this.api.concat(ids)).pipe(
            map(res => res.data)
        );
    }
    
    deleteElnLessonTestQuestionByCol(col: string, ids: string): Observable<any> {
        const by = new HttpParams().set('by', col);
        return this.http.delete<Dto>(this.api.concat(ids), { params: by }).pipe(
            map(res => res.data)
        );
    }


    getElnLessonTestQuestionByCol(col: string, item: any): Observable<ElnLessonTestQuestion[]> {
        const filter = new HttpParams().set('condition', col.concat(',=,', item)).set("limit", -1);
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => res.data)
        );
    }
    getElnLessonTestQuestionByCols(condition: HttpParams): Observable<ElnLessonTestQuestion[]> {
        return this.http.get<Dto>(this.api, { params: condition }).pipe(
            map(res => res.data)
        );
    }


    getElnLessonTestQuestionByPageNew(option: ConditionOption): Observable<{ data: ElnLessonTestQuestion[], recordsFiltered: number }> {
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
