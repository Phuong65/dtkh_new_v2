import { Injectable } from '@angular/core';
import { environment, getRoute } from 'src/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Dto } from '@core/models/dto';
import { TnShiftTest } from '../../shared/models/tn-shift-test';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class TnShiftTestService {

    api = getRoute('ket-shift-test/');
    api_thikhac = ''.concat(environment.thikhacServer.api, 'shift-test/');

    constructor(
        private http: HttpClient
    ) {
    }

    addTnShiftTest(data: any): Observable<any> {
        return this.http.post<Dto>(this.api, data).pipe(
            map(res => res.data)
        );
    }

    updateTnShiftTest(deXuatId: number, data: any): Observable<any> {
        return this.http.put<Dto>(this.api.concat(deXuatId.toString()), data).pipe(
            map(res => res.data)
        );
    }

    getAllTnShiftTest(): Observable<TnShiftTest[]> {
        //const filter = new HttpParams().set( 'khcn_id' , khcn_id.toString() ); { params : filter }
        return this.http.get<Dto>(this.api).pipe(
            map(res => res.data)
        );
    }

    countAllTnShiftTest(): Observable<TnShiftTest[]> {
        const filter = new HttpParams().set('pluck', 'shift_id');
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => res.data)
        );
    }

    getTnShiftTestRoom(col: string, item: any): Observable<TnShiftTest[]> {
        const filter = new HttpParams().set('condition', col.concat(',=,', item)).set('pluck', 'room');
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => res.data)
        );
    }

    deleteTnShiftTest(id: number): Observable<any> {
        return this.http.delete<Dto>(this.api.concat(id.toString())).pipe(
            map(res => res.data)
        );
    }

    deleteTnShiftTestByShiftId(id: number): Observable<any> {
        const by = new HttpParams().set('by', 'shift_id');
        return this.http.delete<Dto>(this.api.concat(id.toString()), { params: by });
    }

    getTnShiftTestByCol(col: string, item: any): Observable<TnShiftTest[]> {
        const filter = new HttpParams().set('condition', col.concat(',=,', item)).set("limit", "-1");
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => res.data)
        );
    }

    getTnShiftTestByCols(condition: HttpParams): Observable<TnShiftTest[]> {
        return this.http.get<Dto>(this.api, { params: condition }).pipe(
            map(res => res.data)
        );
    }
    /** thi khác */

    addTnShiftTest_thikhac(data: any): Observable<any> {
        return this.http.post<Dto>(this.api_thikhac, data).pipe(
            map(res => res.data)
        );
    }

    updateTnShiftTest_thikhac(deXuatId: number, data: any): Observable<any> {
        return this.http.put<Dto>(this.api_thikhac.concat(deXuatId.toString()), data).pipe(
            map(res => res.data)
        );
    }

    getAllTnShiftTest_thikhac(): Observable<TnShiftTest[]> {
        //const filter = new HttpParams().set( 'khcn_id' , khcn_id.toString() ); { params : filter }
        return this.http.get<Dto>(this.api_thikhac).pipe(
            map(res => res.data)
        );
    }

    countAllTnShiftTest_thikhac(): Observable<TnShiftTest[]> {
        const filter = new HttpParams().set('pluck', 'shift_id');
        return this.http.get<Dto>(this.api_thikhac, { params: filter }).pipe(
            map(res => res.data)
        );
    }

    getTnShiftTestRoom_thikhac(col: string, item: any): Observable<TnShiftTest[]> {
        const filter = new HttpParams().set('condition', col.concat(',=,', item)).set('pluck', 'room');
        return this.http.get<Dto>(this.api_thikhac, { params: filter }).pipe(
            map(res => res.data)
        );
    }

    deleteTnShiftTest_thikhac(id: number): Observable<any> {
        return this.http.delete<Dto>(this.api_thikhac.concat(id.toString())).pipe(
            map(res => res.data)
        );
    }

    deleteTnShiftTestByShiftId_thikhac(id: number): Observable<any> {
        const by = new HttpParams().set('by', 'shift_id');
        return this.http.delete<Dto>(this.api_thikhac.concat(id.toString()), { params: by });
    }

    getTnShiftTestByCol_thikhac(col: string, item: any): Observable<TnShiftTest[]> {
        const filter = new HttpParams().set('condition', col.concat(',=,', item));
        return this.http.get<Dto>(this.api_thikhac, { params: filter }).pipe(
            map(res => res.data)
        );
    }

    getTnShiftTestByCols_thikhac(condition: HttpParams): Observable<TnShiftTest[]> {
        return this.http.get<Dto>(this.api_thikhac, { params: condition }).pipe(
            map(res => res.data)
        );
    }
}
