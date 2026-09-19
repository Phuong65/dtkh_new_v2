import { Injectable } from '@angular/core';
import { environment, getRoute_city } from '../../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Dto } from '@core/models/dto';
import { Citys } from '../models/citys';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class CitysService {

    apiCity = getRoute_city('cities/');
    apiDistr = getRoute_city('districts/');
    apiWard = getRoute_city('wards/');

    constructor(
        private http: HttpClient,
    ) {
    }

    addCitys(data: any): Observable<any> {
        return this.http.post<Dto>(this.apiCity, data).pipe(
            map(res => res.data)
        );
    }

    updateCitys(deXuatId: any, data: any): Observable<any> {
        return this.http.put<Dto>(this.apiCity.concat(deXuatId.toString()), data).pipe(
            map(res => res.data)
        );
    }

    getAllCitys(): Observable<Citys[]> {
        //const filter = new HttpParams().set( 'khcn_id' , khcn_id.toString() ); { params : filter }
        return this.http.get<Dto>(this.apiCity).pipe(
            map(res => res.data)
        );
    }

    getAlldistricts(): Observable<Citys[]> {
        //const filter = new HttpParams().set( 'khcn_id' , khcn_id.toString() ); { params : filter }
        return this.http.get<Dto>(this.apiDistr).pipe(
            map(res => res.data)
        );
    }

    getAllWard(): Observable<Citys[]> {
        //const filter = new HttpParams().set( 'khcn_id' , khcn_id.toString() ); { params : filter }
        return this.http.get<Dto>(this.apiWard).pipe(
            map(res => res.data)
        );
    }

    // getCitysByShiftTestIds( col : string , item : string , condition : HttpParams ) {
    // 	// include_by? : string; // tên cột
    // 	// include? : string; // ids 12,13,45,67,9,96,69
    // 	return this.http.get<Dto>( this.api.concat( item.toString() ) ).pipe(
    // 		map( res => res.data )
    // 	);
    //
    // }

    // countAllCitys(): Observable<Citys[]> {
    //     const filter = new HttpParams().set('select', 'shift_id');
    //     return this.http.get<Dto>(this.api, { params: filter }).pipe(
    //         map(res => res.data)
    //     );
    // }

    deleteCitys(id: any): Observable<any> {
        return this.http.delete<Dto>(this.apiCity.concat(id.toString())).pipe(
            map(res => res.data)
        );
    }

    // deleteCitysByShiftTestId(id: any): Observable<any> {
    //     const by = new HttpParams().set('by', 'shift_test_id');
    //     return this.http.delete<Dto>(this.api.concat(id.toString()), { params: by });
    // }

    getCitysByCol(col: string, item: any): Observable<Citys[]> {
        const filter = new HttpParams().set(col, item);
        return this.http.get<Dto>(this.apiCity, { params: filter }).pipe(
            map(res => res.data)
        );
    }

    getdistrictsByCol(col: string, item: any): Observable<Citys[]> {
        const filter = new HttpParams().set(col, item);
        return this.http.get<Dto>(this.apiDistr, { params: filter }).pipe(
            map(res => res.data)
        );
    }

    getdistrictsByCols(condition): Observable<Citys[]> {
        return this.http.get<Dto>(this.apiDistr, { params: condition }).pipe(
            map(res => res.data)
        );
    }

    getdistrictsByIds(item: any): Observable<Citys[]> {
        const by = new HttpParams().set('include', item.toString()).set('include_by', 'id').set('limit', -1);
        return this.http.get<Dto>(this.apiDistr, { params: by }).pipe(
            map(res => res.data)
        );
    }

    getWardByCol(col: string, item: any): Observable<Citys[]> {
        const filter = new HttpParams().set(col, item);
        return this.http.get<Dto>(this.apiWard, { params: filter }).pipe(
            map(res => res.data)
        );
    }

    getWardByCols(condition): Observable<Citys[]> {
        return this.http.get<Dto>(this.apiWard, { params: condition }).pipe(
            map(res => res.data)
        );
    }

    getCitysByCols(condition: HttpParams): Observable<Citys[]> {
        return this.http.get<Dto>(this.apiCity, { params: condition }).pipe(
            map(res => res.data)
        );
    }

    getCitysByItem(item: string, col: string): Observable<Citys[]> {
        const by = new HttpParams().set('by', col);
        return this.http.get<Dto>(this.apiCity.concat(item), { params: by }).pipe(
            map(res => res.data)
        );
    }

    getdistrictsByItem(item: string, col: string): Observable<Citys[]> {
        const by = new HttpParams().set('by', col);
        return this.http.get<Dto>(this.apiDistr.concat(item), { params: by }).pipe(
            map(res => res.data)
        );
    }

    getWardByItem(item: string, col: string): Observable<Citys[]> {
        const by = new HttpParams().set('by', col);
        return this.http.get<Dto>(this.apiWard.concat(item), { params: by }).pipe(
            map(res => res.data)
        );
    }

    deleteCitysByCol(item: string, col: string): Observable<any> {
        const by = new HttpParams().set('by', col);
        return this.http.delete<Dto>(this.apiCity.concat(item.toString()), { params: by }).pipe(
            map(res => res.data)
        );
    }

    getWardByIds(item: any): Observable<Citys[]> {
        const by = new HttpParams().set('include', item.toString()).set('include_by', 'id');
        return this.http.get<Dto>(this.apiWard, { params: by }).pipe(
            map(res => res.data)
        );
    }

    updateCitysByCol(item: string, col: string, data: any): Observable<any> {
        const by = new HttpParams().set('by', col);
        return this.http.put<Dto>(this.apiCity.concat(item.toString()), data, { params: by }).pipe(
            map(res => res.data)
        );
    }
}
