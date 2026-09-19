import { Injectable } from '@angular/core';
import { environment, getRoute } from 'src/environments/environment';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Dto, OvicConditionParam, OvicQueryCondition } from '@core/models/dto';
import { ReportActivity } from '../models/report-activity';
import { HelperService } from '@core/services/helper.service';
import { map } from 'rxjs/operators';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { ConditionOption } from '../models/condition-option';

@Injectable({
    providedIn: 'root'
})
export class ReportStudentActivityService {

    api = getRoute('report-student-activity/');

    constructor(
        private http: HttpClient,
        private helperService: HelperService,
        private httphelper: HttpParamsHeplerService
    ) {
    }

    addReportStudentActivity(data: any): Observable<any> {
        return this.http.post<Dto>(this.api, data).pipe(
            map(res => res.data)
        );
    }

    updateReportStudentActivity(deXuatId: any, data: any): Observable<any> {
        return this.http.put<Dto>(this.api.concat(deXuatId.toString()), data).pipe(
            map(res => res.data)
        );
    }

    getAllReportStudentActivity(): Observable<ReportActivity[]> {
        //const filter = new HttpParams().set( 'khcn_id' , khcn_id.toString() ); { params : filter }
        return this.http.get<Dto>(this.api).pipe(
            map(res => res.data)
        );
    }

    // getReportStudentActivityByShiftTestIds( col : string , item : string , condition : HttpParams ) {
    // 	// include_by? : string; // tên cột
    // 	// include? : string; // ids 12,13,45,67,9,96,69
    // 	return this.http.get<Dto>( this.api.concat( item.toString() ) ).pipe(
    // 		map( res => res.data )
    // 	);
    //
    // }

    // countAllReportStudentActivity(): Observable<ReportStudentActivity[]> {
    //     const filter = new HttpParams().set('pluck', 'shift_id');
    //     return this.http.get<Dto>(this.api, { params: filter }).pipe(
    //         map(res => res.data)
    //     );
    // }

    deleteReportStudentActivity(id: any): Observable<any> {
        return this.http.delete<Dto>(this.api.concat(id.toString())).pipe(
            map(res => res.data)
        );
    }

    // deleteReportStudentActivityByShiftTestId(id: any): Observable<any> {
    //     const by = new HttpParams().set('by', 'shift_test_id');
    //     return this.http.delete<Dto>(this.api.concat(id.toString()), { params: by });
    // }

    getReportStudentActivityByCol(col: string, item: any): Observable<ReportActivity[]> {
        const filter = new HttpParams().set('condition', col.concat(',=,', item)).set("limit", -1);
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => res.data)
        );
    }

    getReportStudentActivityByCols(condition: HttpParams): Observable<ReportActivity[]> {
        return this.http.get<Dto>(this.api, { params: condition }).pipe(
            map(res => res.data)
        );
    }
    getReportStudentActivityByItem(item: string, col: string): Observable<ReportActivity[]> {
        const by = new HttpParams().set('condition', col.concat(',=,', item)).set("limit", -1);
        return this.http.get<Dto>(this.api.concat(item), { params: by }).pipe(
            map(res => res.data)
        );
    }



    deleteReportStudentActivityByCol(item: string, col: string): Observable<any> {
        const by = new HttpParams().set('by', col);
        return this.http.delete<Dto>(this.api.concat(item.toString()), { params: by }).pipe(
            map(res => res.data)
        );
    }

    filterStudentClasses(userId: number, filterParams: { key: string, value: string }[] = [], pluck: string = null): Observable<ReportActivity[]> {
        const conditions: OvicConditionParam[] = [{ conditionName: 'user_id', condition: OvicQueryCondition.equal, value: userId.toString() }];
        if (filterParams && filterParams.length) {
            filterParams.forEach(({ key, value }) => conditions.push({ conditionName: key, condition: OvicQueryCondition.equal, value: value, orWhere: 'and' }));
        }
        const params = pluck ? this.httphelper.paramsConditionBuilder(conditions).set('pluck', pluck) : this.httphelper.paramsConditionBuilder(conditions);
        return this.http.get<Dto>(this.api, { params }).pipe(map(res => res.data));
    }

    listStudentsInClass(classId: number, pluck: string = null): Observable<ReportActivity[]> {
        if (!classId) {
            return of([]);
        }
        const _conditions = [
            {
                conditionName: 'class_id',
                condition: OvicQueryCondition.equal,
                value: classId.toString()
            }
        ];
        const params = pluck ? this.httphelper.paramsConditionBuilder(_conditions).set('pluck', pluck).set('groupby', 'user_id') : this.httphelper.paramsConditionBuilder(_conditions).set('groupby', 'user_id');
        return this.http.get<Dto>(this.api, { params }).pipe(map(res => res.data));
    }

    updateReportStudentActivityByCol(deXuatId: any, data: any, col: string): Observable<any> {
        const by = new HttpParams().set('by', col);
        return this.http.put<Dto>(this.api.concat(deXuatId.toString()), data, { params: by }).pipe(
            map(res => res.data)
        );
    }

    getReportStudentActivityByPageNew(option: ConditionOption): Observable<{ data: ReportActivity[], recordsFiltered: number }> {
        let filter = option.page ? this.httphelper.paramsConditionBuilder(option.condition).set("paged", option.page) : this.httphelper.paramsConditionBuilder(option.condition);
        if (option.set && option.set.length)
            option.set.forEach(f => {
                filter = filter.set(f.label, f.value);
            })

        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => { return { data: res.data, recordsFiltered: res.recordsFiltered } })
        );
    }

    getReportStudentActivityHeadByPageNew(option: ConditionOption): Observable<any> {
        let filter = option.page ? this.httphelper.paramsConditionBuilder(option.condition).set("paged", option.page) : this.httphelper.paramsConditionBuilder(option.condition);
        if (option.set && option.set.length)
            option.set.forEach(f => {
                filter = filter.set(f.label, f.value);
            })
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => { return res })
        );
    }
}
