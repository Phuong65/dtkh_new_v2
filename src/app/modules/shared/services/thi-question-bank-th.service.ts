
import { Injectable } from '@angular/core';
import { environment, getRoute } from 'src/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Dto } from '@core/models/dto';
import { ThiQuestionBankTh } from '../models/thi-question-bank-th';
import { map } from 'rxjs/operators';
import { ConditionOption } from '../models/condition-option';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';

@Injectable({
    providedIn: 'root'
})
export class ThiQuestionBankThService {

    api = getRoute('thi-question-bank-th/');

    constructor(
        private http: HttpClient,
        private httpHelper: HttpParamsHeplerService
    ) {
    }

    addThiQuestionBankTh(data: any): Observable<any> {
        return this.http.post<Dto>(this.api, data).pipe(
            map(res => res.data)
        );
    }

    updateThiQuestionBankTh(deXuatId: number, data: any): Observable<any> {
        return this.http.put<Dto>(this.api.concat(deXuatId.toString()), data).pipe(
            map(res => res.data)
        );
    }

    getAllThiQuestionBankTh(): Observable<ThiQuestionBankTh[]> {
        return this.http.get<Dto>(this.api).pipe(
            map(res => res.data)
        );
    }


    deleteThiQuestionBankTh(id: any): Observable<any> {
        return this.http.delete<Dto>(this.api.concat(id.toString())).pipe(
            map(res => res.data)
        );
    }

    deleteThiQuestionBankThByCol(id: string, col: string): Observable<any> {
        const by = new HttpParams().set('by', col);
        return this.http.delete<Dto>(this.api.concat(id.toString()), { params: by });
    }


    getThiQuestionBankThByPageNew(option: ConditionOption): Observable<{ data: ThiQuestionBankTh[], recordsFiltered: number }> {
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
