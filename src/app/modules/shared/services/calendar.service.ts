import { Injectable } from '@angular/core';
import { environment, getRoute } from 'src/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Dto, OvicConditionParam, OvicQueryCondition } from '@core/models/dto';
import { Calendar } from '../../shared/models/calendar';
import { map } from 'rxjs/operators';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { ConditionOption } from '../models/condition-option';
import { ClassCalendar } from '../models/class-calendar';

@Injectable({
    providedIn: 'root'
})
export class CalendarService {

    private api = getRoute('class-calendar/');

    constructor(
        private http: HttpClient,
        private httpHelper: HttpParamsHeplerService
    ) {
    }

    addCalendar(data: any): Observable<any> {
        return this.http.post<Dto>(this.api, data).pipe(
            map(res => res.data)
        );
    }

    updateCalendar(deXuatId: any, data: any): Observable<any> {
        return this.http.put<Dto>(this.api.concat(deXuatId.toString()), data).pipe(
            map(res => res.data)
        );
    }

    getAllCalendarByUserCreate(user_id: number): Observable<Calendar[]> {
        return this.http.get<Dto>(this.api.concat('?condition=creator_id,=,', user_id.toString())).pipe(
            map(res => res.data)
        );
    }

    getAllCalendar(): Observable<Calendar[]> {
        //const filter = new HttpParams().set( 'khcn_id' , khcn_id.toString() ); { params : filter }
        return this.http.get<Dto>(this.api).pipe(
            map(res => res.data)
        );
    }

    deleteCalendar(id: any): Observable<any> {
        return this.http.delete<Dto>(this.api.concat(id.toString())).pipe(
            map(res => res.data)
        );
    }

    deleteCalendarFormTomorow(): Observable<any> {
        return this.http.delete<Dto>(this.api.concat("clear-calendar")).pipe(
            map(res => res.data)
        );
    }

    getCalendarByCol(col: string, item: string): Observable<Calendar[]> {
        const filter = new HttpParams().set('condition', col.concat(',=,', item)).set("limit", -1);
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => res.data)
        );
    }

    getCalendarByItem(item: string, col: string): Observable<Calendar[]> {
        const by = new HttpParams().set('condition', col.concat(',=,', item)).set("limit", -1);
        return this.http.get<Dto>(this.api, { params: by }).pipe(
            map(res => res.data)
        );
    }

    // deleteTnStudentByUserId(id: string): Observable<any> {
    //     const by = new HttpParams().set('by', 'user_id');
    //     return this.http.delete<Dto>(this.api.concat(id), { params: by }).pipe(
    //         map(res => res.data)
    //     );
    // }

    getCalendarLenght(): Observable<any> {
        const filter = new HttpParams().set('teacher', '0').set('limit', 1);
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => res)
        );
    }

    getCalendarPage(start: number, limit: number): Observable<Calendar[]> {
        const filter = new HttpParams().set('limit', limit.toString()).set("offset", start.toString());
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => res.data)
        );
    }

    getCalendarByCols(condition: HttpParams): Observable<Calendar[]> {
        return this.http.get<Dto>(this.api, { params: condition }).pipe(
            map(res => res.data)
        );
    }

    updateUserProfileByCol(deXuatId: any, data: any, col: string): Observable<any> {
        const by = new HttpParams().set('by', col);
        return this.http.put<Dto>(this.api.concat(deXuatId.toString()), data, { params: by }).pipe(
            map(res => res.data)
        );
    }


    getTotalUserByCols(condition: HttpParams): Observable<any> {
        return this.http.get<Dto>(this.api, { params: condition }).pipe(
            map(res => res)
        );
    }

    getCalendarByPageNew(option: ConditionOption): Observable<{ data: ClassCalendar[], recordsFiltered: number }> {
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
