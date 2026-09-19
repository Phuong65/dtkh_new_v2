import { Injectable } from '@angular/core';
import { environment, getRoute } from 'src/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Dto, OvicConditionParam, OvicQueryCondition } from '@core/models/dto';
import { HoidongThamdinhMonhocThanhvien } from '../../shared/models/hoidong-thamdinh-monhoc-thanhvien';
import { map } from 'rxjs/operators';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { ConditionOption } from '../models/condition-option';

@Injectable({
    providedIn: 'root'
})

export class HoidongThamdinhMonhocThanhvienService {

    private api = getRoute('hoidong-thamdinh-monhoc-thanhvien/');

    constructor(
        private http: HttpClient,
        private httpHelper: HttpParamsHeplerService
    ) {
    }

    addHoidongThamdinhMonhocThanhvien(data: any): Observable<any> {
        return this.http.post<Dto>(this.api, data).pipe(
            map(res => res.data)
        );
    }

    updateHoidongThamdinhMonhocThanhvien(deXuatId: any, data: any): Observable<any> {
        return this.http.put<Dto>(this.api.concat(deXuatId.toString()), data).pipe(
            map(res => res.data)
        );
    }

    getAllHoidongThamdinhMonhocThanhvienByUserCreate(user_id: number): Observable<HoidongThamdinhMonhocThanhvien[]> {
        return this.http.get<Dto>(this.api.concat('?condition=creator_id,=,', user_id.toString())).pipe(
            map(res => res.data)
        );
    }

    getAllHoidongThamdinhMonhocThanhvien(): Observable<HoidongThamdinhMonhocThanhvien[]> {
        //const filter = new HttpParams().set( 'khcn_id' , khcn_id.toString() ); { params : filter }
        return this.http.get<Dto>(this.api).pipe(
            map(res => res.data)
        );
    }

    deleteHoidongThamdinhMonhocThanhvien(id: any): Observable<any> {
        return this.http.delete<Dto>(this.api.concat(id.toString())).pipe(
            map(res => res.data)
        );
    }

    getHoidongThamdinhMonhocThanhvienByCol(col: string, item: string): Observable<HoidongThamdinhMonhocThanhvien[]> {
        const filter = new HttpParams().set('condition', col.concat(',=,', item));
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => res.data)
        );
    }

    getHoidongThamdinhMonhocThanhvienByItem(item: string, col: string): Observable<HoidongThamdinhMonhocThanhvien[]> {
        const by = new HttpParams().set('condition', col.concat(',=,', item));
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

    getHoidongThamdinhMonhocThanhvienLenght(): Observable<any> {
        const filter = new HttpParams().set('teacher', '0').set('limit', 1);
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => res)
        );
    }

    getHoidongThamdinhMonhocThanhvienPage(start: number, limit: number): Observable<HoidongThamdinhMonhocThanhvien[]> {
        const filter = new HttpParams().set('limit', limit.toString()).set("offset", start.toString());
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => res.data)
        );
    }

    getHoidongThamdinhMonhocThanhvienByCols(condition: HttpParams): Observable<HoidongThamdinhMonhocThanhvien[]> {
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

    getHoidongThamdinhMonhocThanhvienByPageNew(option: ConditionOption): Observable<{ data: HoidongThamdinhMonhocThanhvien[], recordsFiltered: number }> {
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
