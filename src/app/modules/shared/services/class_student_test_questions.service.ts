import { Injectable } from '@angular/core';
import { environment, getRoute } from 'src/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Dto, OvicConditionParam, OvicQueryCondition } from '@core/models/dto';
import { ClassStudentTestQuestions } from '../models/class-student';
import { HelperService } from '@core/services/helper.service';
import { map } from 'rxjs/operators';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { ConditionOption } from '../models/condition-option';

@Injectable({
    providedIn: 'root'
})
export class ClassStudentTestQuestionsService {

    api = getRoute('class-student-test-answers/');

    constructor(
        private http: HttpClient,
        private helperService: HelperService,
        private httpHelper: HttpParamsHeplerService
    ) {
    }

    addClassStudentTestQuestions(data: any): Observable<any> {
        return this.http.post<Dto>(this.api, data).pipe(
            map(res => res.data)
        );
    }

    updateClassStudentTestQuestions(deXuatId: any, data: any): Observable<any> {
        return this.http.put<Dto>(this.api.concat(deXuatId.toString()), data).pipe(
            map(res => res.data)
        );
    }

    getAllClassStudentTestQuestions(): Observable<ClassStudentTestQuestions[]> {
        //const filter = new HttpParams().set( 'khcn_id' , khcn_id.toString() ); { params : filter }
        return this.http.get<Dto>(this.api.concat('?limit=-1')).pipe(
            map(res => res.data)
        );
    }

    // getClassStudentTestQuestionsByShiftTestIds( col : string , item : string , condition : HttpParams ) {
    // 	// include_by? : string; // tên cột
    // 	// include? : string; // ids 12,13,45,67,9,96,69
    // 	return this.http.get<Dto>( this.api.concat( item.toString() ) ).pipe(
    // 		map( res => res.data )
    // 	);
    //
    // }

    // countAllClassStudentTestQuestions(): Observable<ClassStudentTestQuestions[]> {
    //     const filter = new HttpParams().set('pluck', 'shift_id');
    //     return this.http.get<Dto>(this.api, { params: filter }).pipe(
    //         map(res => res.data)
    //     );
    // }

    deleteClassStudentTestQuestions(id: any): Observable<any> {
        return this.http.delete<Dto>(this.api.concat(id.toString())).pipe(
            map(res => res.data)
        );
    }

    // deleteClassStudentTestQuestionsByShiftTestId(id: any): Observable<any> {
    //     const by = new HttpParams().set('by', 'shift_test_id');
    //     return this.http.delete<Dto>(this.api.concat(id.toString()), { params: by });
    // }

    getClassStudentTestQuestionsByCol(col: string, item: any): Observable<ClassStudentTestQuestions[]> {
        const filter = new HttpParams().set('condition', col.concat(',=,', item)).set('limit', -1);
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => res.data)
        );
    }

    getClassStudentTestQuestionsByCols(condition: HttpParams): Observable<ClassStudentTestQuestions[]> {
        return this.http.get<Dto>(this.api, { params: condition }).pipe(
            map(res => res.data)
        );
    }
    getClassStudentTestQuestionsByItem(item: string, col: string): Observable<ClassStudentTestQuestions[]> {
        const by = new HttpParams().set('by', col).set('limit', -1);
        return this.http.get<Dto>(this.api.concat(item), { params: by }).pipe(
            map(res => res.data)
        );
    }



    deleteClassStudentTestQuestionsByCol(item: string, col: string): Observable<any> {
        const by = new HttpParams().set("include", item).set("include_by", col).set('limit', -1);
        return this.http.delete<Dto>(this.api, { params: by }).pipe(
            map(res => res.data)
        );
    }

    filterStudentClasses(userId: number, filterParams: { key: string, value: string }[] = [], pluck: string = null): Observable<ClassStudentTestQuestions[]> {
        const conditions: OvicConditionParam[] = [{ conditionName: 'user_id', condition: OvicQueryCondition.equal, value: userId.toString() }];
        if (filterParams && filterParams.length) {
            filterParams.forEach(({ key, value }) => conditions.push({ conditionName: key, condition: OvicQueryCondition.equal, value: value, orWhere: 'and' }));
        }
        const params = pluck ? this.httpHelper.paramsConditionBuilder(conditions).set('pluck', pluck).set('limit', -1) : this.httpHelper.paramsConditionBuilder(conditions).set('limit', -1);;
        return this.http.get<Dto>(this.api, { params }).pipe(map(res => res.data));
    }

    listStudentsInClass(classId: number, pluck: string = null): Observable<ClassStudentTestQuestions[]> {
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
        const params = pluck ? this.httpHelper.paramsConditionBuilder(_conditions).set('pluck', pluck).set('groupby', 'user_id').set('limit', -1) : this.httpHelper.paramsConditionBuilder(_conditions).set('groupby', 'user_id').set('limit', -1);
        return this.http.get<Dto>(this.api, { params }).pipe(map(res => res.data));
    }

    tinhDiem(id: number): Observable<any> {
        const params = new HttpParams().set('tinhdiem', id.toString());
        return this.http.post<Dto>(this.api.concat("tinhdiem/", id.toString()), {}).pipe(
            map(res => res['total'])
        );
    }
    
}
