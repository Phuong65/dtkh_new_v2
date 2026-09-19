import { Injectable } from '@angular/core';
import { environment, getRoute } from 'src/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Dto } from '@core/models/dto';
import { RoomMessage } from '../models/room-message';
import { map } from 'rxjs/operators';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { ConditionOption } from '../models/condition-option';

@Injectable({
    providedIn: 'root'
})
export class RoomMessageService {

    api = getRoute('chat/');

    constructor(
        private http: HttpClient,
        private httpHelper: HttpParamsHeplerService
    ) {
    }

    addRoomMessage(data: any): Observable<any> {
        return this.http.post<Dto>(this.api, data).pipe(
            map(res => res.data)
        );
    }

    updateRoomMessage(deXuatId: number, data: any): Observable<any> {
        return this.http.put<Dto>(this.api.concat(deXuatId.toString()), data).pipe(
            map(res => res.data)
        );
    }

    getAllRoomMessage(): Observable<RoomMessage[]> {
        //const filter = new HttpParams().set( 'khcn_id' , khcn_id.toString() ); { params : filter }
        return this.http.get<Dto>(this.api).pipe(
            map(res => res.data)
        );
    }

    // getRoomMessageByShiftTestIds( col : string , item : string , condition : HttpParams ) {
    // 	// include_by? : string; // tên cột
    // 	// include? : string; // ids 12,13,45,67,9,96,69
    // 	return this.http.get<Dto>( this.api.concat( item.toString() ) ).pipe(
    // 		map( res => res.data )
    // 	);
    //
    // }

    // countAllRoomMessage(): Observable<RoomMessage[]> {
    //     const filter = new HttpParams().set('pluck', 'shift_id');
    //     return this.http.get<Dto>(this.api, { params: filter }).pipe(
    //         map(res => res.data)
    //     );
    // }

    deleteRoomMessage(id: number): Observable<any> {
        return this.http.delete<Dto>(this.api.concat(id.toString())).pipe(
            map(res => res.data)
        );
    }


    // deleteRoomMessageByShiftTestId(id: any): Observable<any> {
    //     const by = new HttpParams().set('by', 'shift_test_id');
    //     return this.http.delete<Dto>(this.api.concat(id.toString()), { params: by });
    // }

    getRoomMessageByCol(col: string, item: any): Observable<RoomMessage[]> {
        const filter = new HttpParams().set('condition', col.concat(',=,', item));
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => res.data)
        );
    }

    getRoomMessageByCols(condition: HttpParams): Observable<RoomMessage[]> {
        return this.http.get<Dto>(this.api, { params: condition }).pipe(
            map(res => res.data)
        );
    }
    getRoomMessageByItem(item: string, col: string): Observable<any> {
        const by = new HttpParams().set('condition', col.concat(',=,', item)).set("limit", -1);
        return this.http.get<Dto>(this.api, { params: by }).pipe(
            map(res => res.data)
        );
    }


    getRoomMessageByPageNew(option: ConditionOption): Observable<{ data: RoomMessage[], recordsFiltered: number }> {
        let filter = option.page ? this.httpHelper.paramsConditionBuilder(option.condition).set("paged", option.page) : this.httpHelper.paramsConditionBuilder(option.condition);
        if (option.set && option.set.length)
            option.set.forEach(f => {
                filter = filter.set(f.label, f.value);
            })
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => { return { data: res.data, recordsFiltered: res.recordsFiltered } })
        );
    }
    // getRoomMessageByRoomId(item: string, col: string): Observable<any> {
    //     const by = new HttpParams().set("limit", -1);
    //     return this.http.get<Dto>(this.api.concat(item), { params: by }).pipe(
    //         map(res => res.data)
    //     );
    // }
}
