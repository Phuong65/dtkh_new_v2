import { Injectable } from '@angular/core';
import { environment, getRoute } from 'src/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Dto } from '@core/models/dto';
import { CtdtMuctieuCuthe } from '../models/ctdt-muctieu-cuthe';
import { map } from 'rxjs/operators';
import { ConditionOption } from '../models/condition-option';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';

@Injectable({
    providedIn: 'root'
})
export class CtdtMuctieuCutheService {

    api = getRoute('ctdt-muctieu-cuthe/');

    constructor(
        private http: HttpClient,
        private httpHelper: HttpParamsHeplerService
    ) {
    }

    addCtdtMuctieuCuthe(data: any): Observable<any> {
        return this.http.post<Dto>(this.api, data).pipe(
            map(res => res.data)
        );
    }

    updateCtdtMuctieuCuthe(deXuatId: number, data: any): Observable<any> {
        return this.http.put<Dto>(this.api.concat(deXuatId.toString()), data).pipe(
            map(res => res.data)
        );
    }

    getAllCtdtMuctieuCuthe(): Observable<CtdtMuctieuCuthe[]> {
        //const filter = new HttpParams().set( 'khcn_id' , khcn_id.toString() ); { params : filter }
        return this.http.get<Dto>(this.api).pipe(
            map(res => res.data)
        );
    }

    // getCtdtMuctieuCutheByShiftTestIds( col : string , item : string , condition : HttpParams ) {
    // 	// include_by? : string; // tên cột
    // 	// include? : string; // ids 12,13,45,67,9,96,69
    // 	return this.http.get<Dto>( this.api.concat( item.toString() ) ).pipe(
    // 		map( res => res.data )
    // 	);
    //
    // }

    // countAllCtdtMuctieuCuthe(): Observable<CtdtMuctieuCuthe[]> {
    //     const filter = new HttpParams().set('pluck', 'shift_id');
    //     return this.http.get<Dto>(this.api, { params: filter }).pipe(
    //         map(res => res.data)
    //     );
    // }

    deleteCtdtMuctieuCuthe(id: number): Observable<any> {
        return this.http.delete<Dto>(this.api.concat(id.toString())).pipe(
            map(res => res.data)
        );
    }

    deleteCtdtMuctieuCutheByClassHomeWorkId(id: number): Observable<any> {
        const by = new HttpParams().set('by', 'class_homework_id');
        return this.http.delete<Dto>(this.api.concat(id.toString()), { params: by });
    }

    // deleteCtdtMuctieuCutheByShiftTestId(id: any): Observable<any> {
    //     const by = new HttpParams().set('by', 'shift_test_id');
    //     return this.http.delete<Dto>(this.api.concat(id.toString()), { params: by });
    // }

    getCtdtMuctieuCutheByCol(col: string, item: any): Observable<CtdtMuctieuCuthe[]> {
        const filter = new HttpParams().set('condition', col.concat(',=,', item));
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => res.data)
        );
    }

    getCtdtMuctieuCutheByCols(condition: HttpParams): Observable<CtdtMuctieuCuthe[]> {
        return this.http.get<Dto>(this.api, { params: condition }).pipe(
            map(res => res.data)
        );
    }
    getCtdtMuctieuCutheByItem(item: string, col: string): Observable<CtdtMuctieuCuthe[]> {
        const by = new HttpParams().set('by', col);
        return this.http.get<Dto>(this.api.concat(item), { params: by }).pipe(
            map(res => res.data)
        );
    }

    getCtdtMuctieuCutheByPageNew(option: ConditionOption): Observable<{ data: CtdtMuctieuCuthe[], recordsFiltered: number }> {
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
