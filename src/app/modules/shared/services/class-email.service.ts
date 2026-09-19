import { Injectable } from '@angular/core';
import { environment, getRoute } from 'src/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Dto } from '@core/models/dto';
import { ClassEmail } from '../models/class-email';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class ClassEmailService {

    api = getRoute('class-emails/');

    constructor(
        private http: HttpClient,
    ) {
    }

    addClassEmail(data: any): Observable<any> {
        return this.http.post<Dto>(this.api, data).pipe(
            map(res => res.data)
        );
    }

    updateClassEmail(deXuatId: number, data: any): Observable<any> {
        return this.http.put<Dto>(this.api.concat(deXuatId.toString()), data).pipe(
            map(res => res.data)
        );
    }

    getAllClassEmail(): Observable<ClassEmail[]> {
        //const filter = new HttpParams().set( 'khcn_id' , khcn_id.toString() ); { params : filter }
        return this.http.get<Dto>(this.api).pipe(
            map(res => res.data)
        );
    }

    // getClassEmailByShiftTestIds( col : string , item : string , condition : HttpParams ) {
    // 	// include_by? : string; // tên cột
    // 	// include? : string; // ids 12,13,45,67,9,96,69
    // 	return this.http.get<Dto>( this.api.concat( item.toString() ) ).pipe(
    // 		map( res => res.data )
    // 	);
    //
    // }

    // countAllClassEmail(): Observable<ClassEmail[]> {
    //     const filter = new HttpParams().set('pluck', 'shift_id');
    //     return this.http.get<Dto>(this.api, { params: filter }).pipe(
    //         map(res => res.data)
    //     );
    // }

    deleteClassEmail(id: number): Observable<any> {
        return this.http.delete<Dto>(this.api.concat(id.toString())).pipe(
            map(res => res.data)
        );
    }

    deleteClassEmailByClassHomeWorkId(id: number): Observable<any> {
        const by = new HttpParams().set('by', 'class_homework_id');
        return this.http.delete<Dto>(this.api.concat(id.toString()), { params: by });
    }

    // deleteClassEmailByShiftTestId(id: any): Observable<any> {
    //     const by = new HttpParams().set('by', 'shift_test_id');
    //     return this.http.delete<Dto>(this.api.concat(id.toString()), { params: by });
    // }

    getClassEmailByCol(col: string, item: any): Observable<ClassEmail[]> {
        const filter = new HttpParams().set('condition', col.concat(',=,', item)).set('limit', -1);
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => res.data)
        );
    }

    getClassEmailByCols(condition: HttpParams): Observable<ClassEmail[]> {
        return this.http.get<Dto>(this.api, { params: condition }).pipe(
            map(res => res.data)
        );
    }
    getClassEmailByItem(item: string, col: string): Observable<any> {
        const by = new HttpParams().set('by', col);
        return this.http.get<Dto>(this.api.concat(item), { params: by }).pipe(
            map(res => res.data)
        );
    }
}
