import { Injectable } from '@angular/core';
import { environment, getRoute } from 'src/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Dto } from '@core/models/dto';
import { Room } from '../models/room';
import { map } from 'rxjs/operators';
import { ConditionOption } from '../models/condition-option';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';

@Injectable({
    providedIn: 'root'
})
export class RoomService {

    api = getRoute('chat-room/');

    constructor(
        private http: HttpClient,
        private httpHelper: HttpParamsHeplerService
    ) {
    }

    addRoom(data: any): Observable<any> {
        return this.http.post<Dto>(this.api, data).pipe(
            map(res => res.data)
        );
    }

    updateRoom(deXuatId: number, data: any): Observable<any> {
        return this.http.put<Dto>(this.api.concat(deXuatId.toString()), data).pipe(
            map(res => res.data)
        );
    }

    getAllRoom(): Observable<Room[]> {
        //const filter = new HttpParams().set( 'khcn_id' , khcn_id.toString() ); { params : filter }
        return this.http.get<Dto>(this.api).pipe(
            map(res => res.data)
        );
    }

    // getRoomByShiftTestIds( col : string , item : string , condition : HttpParams ) {
    // 	// include_by? : string; // tên cột
    // 	// include? : string; // ids 12,13,45,67,9,96,69
    // 	return this.http.get<Dto>( this.api.concat( item.toString() ) ).pipe(
    // 		map( res => res.data )
    // 	);
    //
    // }

    // countAllRoom(): Observable<Room[]> {
    //     const filter = new HttpParams().set('pluck', 'shift_id');
    //     return this.http.get<Dto>(this.api, { params: filter }).pipe(
    //         map(res => res.data)
    //     );
    // }

    deleteRoom(id: number): Observable<any> {
        return this.http.delete<Dto>(this.api.concat(id.toString())).pipe(
            map(res => res.data)
        );
    }


    // deleteRoomByShiftTestId(id: any): Observable<any> {
    //     const by = new HttpParams().set('by', 'shift_test_id');
    //     return this.http.delete<Dto>(this.api.concat(id.toString()), { params: by });
    // }

    getRoomByCol(col: string, item: any): Observable<Room[]> {
        const filter = new HttpParams().set('condition', col.concat(',=,', item));
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => res.data)
        );
    }

    getRoomByCols(condition: HttpParams): Observable<Room[]> {
        return this.http.get<Dto>(this.api, { params: condition }).pipe(
            map(res => res.data)
        );
    }

    getRoomByItem(item: string, col: string): Observable<any> {
        const by = new HttpParams().set('by', col);
        return this.http.get<Dto>(this.api.concat(item), { params: by }).pipe(
            map(res => res.data)
        );
    }

    getUserRoom(item: string): Observable<any> {
        return this.http.get<Dto>(this.api.concat("users/", item)).pipe(
            map(res => res.data)
        );
    }

    getUserRoomByPageNew(option: ConditionOption, room_id: string): Observable<{ data: [], recordsFiltered: number }> {
        let filter = option.page ? this.httpHelper.paramsConditionBuilder(option.condition).set("paged", option.page) : this.httpHelper.paramsConditionBuilder(option.condition);
        if (option.set && option.set.length)
            option.set.forEach(f => {
                filter = filter.set(f.label, f.value);
            })
        return this.http.get<Dto>(this.api.concat("users/", room_id), { params: filter }).pipe(
            map(res => { return { data: res.data, recordsFiltered: res.recordsFiltered } })
        );
    }

    addUserRoom(item: string, data): Observable<any> {
        return this.http.post<Dto>(this.api.concat("users/", item), data).pipe(
            map(res => res.data)
        );
    }
}
