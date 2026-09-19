import { Injectable } from '@angular/core';
import { environment, getRoute } from 'src/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Dto } from '@core/models/dto';
import { ClassStudentPoints } from '../models/class-student-points';
import { map } from 'rxjs/operators';
import { ConditionOption } from '../models/condition-option';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';

@Injectable({
    providedIn: 'root'
})
export class ClassStudentPointsService {

    api = getRoute('class-student-points/');

    constructor(
        private http: HttpClient,
        private httpHelper: HttpParamsHeplerService
    ) {
    }

    addClassStudentPoints(data: any): Observable<any> {
        return this.http.post<Dto>(this.api, data).pipe(
            map(res => res.data)
        );
    }

    updateClassStudentPoints(deXuatId: number, data: any): Observable<any> {
        return this.http.put<Dto>(this.api.concat(deXuatId.toString()), data).pipe(
            map(res => res.data)
        );
    }

    getAllClassStudentPoints(): Observable<ClassStudentPoints[]> {
        //const filter = new HttpParams().set( 'khcn_id' , khcn_id.toString() ); { params : filter }
        return this.http.get<Dto>(this.api).pipe(
            map(res => res.data)
        );
    }

    // getClassStudentPointsByShiftTestIds( col : string , item : string , condition : HttpParams ) {
    // 	// include_by? : string; // tên cột
    // 	// include? : string; // ids 12,13,45,67,9,96,69
    // 	return this.http.get<Dto>( this.api.concat( item.toString() ) ).pipe(
    // 		map( res => res.data )
    // 	);
    //
    // }

    // countAllClassStudentPoints(): Observable<ClassStudentPoints[]> {
    //     const filter = new HttpParams().set('pluck', 'shift_id');
    //     return this.http.get<Dto>(this.api, { params: filter }).pipe(
    //         map(res => res.data)
    //     );
    // }

    deleteClassStudentPoints(id: any): Observable<any> {
        return this.http.delete<Dto>(this.api.concat(id.toString())).pipe(
            map(res => res.data)
        );
    }


    // deleteClassStudentPointsByShiftTestId(id: any): Observable<any> {
    //     const by = new HttpParams().set('by', 'shift_test_id');
    //     return this.http.delete<Dto>(this.api.concat(id.toString()), { params: by });
    // }

    getClassStudentPointsByCol(col: string, item: any): Observable<ClassStudentPoints[]> {
        const filter = new HttpParams().set('condition', col.concat(',=,', item)).set("limit", -1);
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => res.data)
        );
    }

    getClassStudentPointsByCols(condition: HttpParams): Observable<ClassStudentPoints[]> {
        return this.http.get<Dto>(this.api, { params: condition }).pipe(
            map(res => res.data)
        );
    }
    getClassStudentPointsByItem(item: string, col: string): Observable<any> {
        const by = new HttpParams().set('by', col);
        return this.http.get<Dto>(this.api.concat(item), { params: by }).pipe(
            map(res => res.data)
        );
    }

    deleteClassStudentPointsBycol(item: string, col: string): Observable<any> {
        const by = new HttpParams().set(col, item);
        return this.http.delete<Dto>(this.api.concat(item, "?by=", col)).pipe(
            map(res => res.data)
        );
    }

    deleteClassStudentPointsBycols(condition): Observable<any> {
        return this.http.put<Dto>(this.api, { params: condition, data: { is_delete: 1 } }).pipe(
            map(res => res.data)
        );
    }

    getClassStudentPointsByPageNew(option: ConditionOption): Observable<{ data: ClassStudentPoints[], recordsFiltered: number }> {
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
