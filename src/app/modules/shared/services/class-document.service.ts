import { Injectable } from '@angular/core';
import { environment, getRoute } from 'src/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Dto, OvicConditionParam, OvicQueryCondition } from '@core/models/dto';
import { ClassDocument } from '../models/class-document';
import { HelperService } from '@core/services/helper.service';
import { map } from 'rxjs/operators';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';

@Injectable({
    providedIn: 'root'
})
export class ClassDocumentService {

    api = getRoute('class-documents/');

    constructor(
        private http: HttpClient,
        private httpHepler: HttpParamsHeplerService,
        private helperService: HelperService
    ) {
    }

    addClassDocument(data: any): Observable<any> {
        return this.http.post<Dto>(this.api, data).pipe(
            map(res => res.data)
        );
    }

    updateClassDocument(deXuatId: number, data: any): Observable<any> {
        return this.http.put<Dto>(this.api.concat(deXuatId.toString()), data).pipe(
            map(res => res.data)
        );
    }

    getAllClassDocument(): Observable<ClassDocument[]> {
        //const filter = new HttpParams().set( 'khcn_id' , khcn_id.toString() ); { params : filter }
        return this.http.get<Dto>(this.api).pipe(
            map(res => res.data)
        );
    }

    // getClassDocumentByShiftTestIds( col : string , item : string , condition : HttpParams ) {
    // 	// include_by? : string; // tên cột
    // 	// include? : string; // ids 12,13,45,67,9,96,69
    // 	return this.http.get<Dto>( this.api.concat( item.toString() ) ).pipe(
    // 		map( res => res.data )
    // 	);
    //
    // }

    // countAllClassDocument(): Observable<ClassDocument[]> {
    //     const filter = new HttpParams().set('pluck', 'shift_id');
    //     return this.http.get<Dto>(this.api, { params: filter }).pipe(
    //         map(res => res.data)
    //     );
    // }

    deleteClassDocument(id: string): Observable<any> {
        return this.http.delete<Dto>(this.api.concat(id.toString())).pipe(
            map(res => res.data)
        );
    }

    // deleteClassDocumentByShiftTestId(id: any): Observable<any> {
    //     const by = new HttpParams().set('by', 'shift_test_id');
    //     return this.http.delete<Dto>(this.api.concat(id.toString()), { params: by });
    // }

    getClassDocumentByCol(col: string, item: any): Observable<ClassDocument[]> {
        const filter = new HttpParams().set('condition', col.concat(',=,', item));
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => res.data)
        );
    }

    getClassDocumentByCols(condition: HttpParams): Observable<ClassDocument[]> {
        return this.http.get<Dto>(this.api, { params: condition }).pipe(
            map(res => res.data)
        );
    }
    getClassDocumentByItem(item: string, col: string): Observable<ClassDocument[]> {
        const by = new HttpParams().set('condition', col.concat(',=,', item)).set("limit", -1);
        return this.http.get<Dto>(this.api, { params: by }).pipe(
            map(res => res.data)
        );
    }

    getClassDocuments(classId: number, pluck: string = null): Observable<ClassDocument[]> {
        if (!classId) {
            return of(null);
        }
        const conditions: OvicConditionParam[] = [{
            conditionName: 'class_id',
            condition: OvicQueryCondition.equal,
            value: classId.toString()
        }];
        const params: HttpParams = pluck ? this.httpHepler.paramsConditionBuilder(conditions).set('pluck', pluck) : this.httpHepler.paramsConditionBuilder(conditions);
        return this.http.get<Dto>(this.api, { params }).pipe(map(res => res.data || []));
    }
}
