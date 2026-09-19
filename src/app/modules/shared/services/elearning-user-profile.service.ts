import { Injectable } from '@angular/core';
import { environment, getRoute } from 'src/environments/environment';
import {HttpClient, HttpParams, HttpResponse} from '@angular/common/http';
import {Observable, switchMap} from 'rxjs';
import { Dto, OvicConditionParam, OvicQueryCondition } from '@core/models/dto';
import { ElngUserProfile } from '../../shared/models/elng-user-profile';
import { map } from 'rxjs/operators';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { ConditionOption } from '../models/condition-option';
import {TnStudent} from "@shared/models/tn-student";

@Injectable({
    providedIn: 'root'
})
export class ElngUserProfileService {

    private api = getRoute('user-profile/');

    constructor(
        private http: HttpClient,
        private httpHelper: HttpParamsHeplerService
    ) {
    }

    addElngUserProfile(data: any): Observable<any> {
        return this.http.post<Dto>(this.api, data).pipe(
            map(res => res.data)
        );
    }

    updateElngUserProfile(deXuatId: number, data: any): Observable<any> {
        return this.http.put<Dto>(this.api.concat(deXuatId.toString()), data).pipe(
            map(res => res.data)
        );
    }

    getAllElngUserProfileByUserCreate(user_id: number): Observable<ElngUserProfile[]> {
        return this.http.get<Dto>(this.api.concat('?condition=creator_id,=,', user_id.toString())).pipe(
            map(res => res.data)
        );
    }

    getAllElngUserProfile(): Observable<ElngUserProfile[]> {
        //const filter = new HttpParams().set( 'khcn_id' , khcn_id.toString() ); { params : filter }
        return this.http.get<Dto>(this.api).pipe(
            map(res => res.data)
        );
    }

    deleteElngUserProfile(id: any): Observable<any> {
        return this.http.delete<Dto>(this.api.concat(id.toString())).pipe(
            map(res => res.data)
        );
    }

    getElngUserProfileByCol(col: string, item: string): Observable<ElngUserProfile[]> {
        const filter = new HttpParams().set('condition', col.concat(',=,', item)).set("limit", -1);
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => res.data)
        );
    }

    getElngUserProfileByItem(item: string, col: string): Observable<ElngUserProfile[]> {
        const by = new HttpParams().set('condition', col.concat(',=,', item)).set("limit", -1);
        return this.http.get<Dto>(this.api, { params: by }).pipe(
            map(res => res.data)
        );
    }

    deleteTnStudentByUserId(id: string): Observable<any> {
        const by = new HttpParams().set('by', 'user_id');
        return this.http.delete<Dto>(this.api.concat(id), { params: by }).pipe(
            map(res => res.data)
        );
    }

    getElngUserProfileLenght(): Observable<any> {
        const filter = new HttpParams().set('teacher', '0').set('limit', 1);
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => res)
        );
    }

    getElngUserProfilePage(start: number, limit: number): Observable<ElngUserProfile[]> {
        const filter = new HttpParams().set('limit', limit.toString()).set("offset", start.toString());
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => res.data)
        );
    }

    getElngUserProfileByCols(condition: HttpParams): Observable<ElngUserProfile[]> {
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

    getElngUserProfileByPageNew(condition: OvicConditionParam[], page: number, setCondition?: { label: string, value: string }[]): Observable<{ data: ElngUserProfile[], recordsFiltered: number }> {
        let filter = this.httpHelper.paramsConditionBuilder(condition).set("paged", page);
        if (setCondition && setCondition.length)
            setCondition.forEach(f => {
                filter = filter.set(f.label, f.value);
            })
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => { return { data: res.data, recordsFiltered: res.recordsFiltered } })
        );
    }

    getUserProfileByPageNewV2(option: ConditionOption): Observable<{ data: ElngUserProfile[], recordsFiltered: number }> {
        let filter = option.page ? this.httpHelper.paramsConditionBuilder(option.condition).set("paged", option.page) : this.httpHelper.paramsConditionBuilder(option.condition);
        if (option.set && option.set.length)
            option.set.forEach(f => {
                filter = filter.set(f.label, f.value);
            })
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => { return { data: res.data, recordsFiltered: res.recordsFiltered } })
        );
    }


  //======================== by long ===========================//
  getStudentByStudentCode(student_code:string):Observable<ElngUserProfile>{

    const conditions: OvicConditionParam[] = [
      {
        conditionName:'student_code',
        condition:OvicQueryCondition.equal,
        value: student_code
      }
    ];


    const params = this.httpHelper.paramsConditionBuilder(conditions);
    return this.http.get<Dto>(this.api, {params}).pipe(map(res => res.data[0]));
  }

    getTotalUserProfile(condition: OvicConditionParam[], page: number, setCondition?: { label: string, value: string }[]): Observable<number> {
        let filter = this.httpHelper.paramsConditionBuilder(condition).set("paged", page);
        if (setCondition && setCondition.length)
            setCondition.forEach(f => {
                filter = filter.set(f.label, f.value);
            })
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => res.recordsFiltered )
        );
    }

}
