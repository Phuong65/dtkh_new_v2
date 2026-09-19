import { Injectable } from '@angular/core';
import { environment, getRoute } from 'src/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Dto, OvicConditionParam, OvicQueryCondition } from '@core/models/dto';
import { HelperService } from '@core/services/helper.service';
import { map } from 'rxjs/operators';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { ConditionOption } from '../models/condition-option';

export interface HvuApiDanhsachlichgiangday {
    ma_lop: string;
    ma_giang_vien: string;
    ngay_giang_day: string;
    tiet: string;
    tuan_hoc: string;
    giang_duong: string;
    ma_mon_hoc: string;
    ten_mon_hoc: string;
    nhom_to: string;
    thu: string;
}

@Injectable({
    providedIn: 'root'
})
export class HvuApiDanhsachlichgiangdayService {

    api = getRoute('dhhv/ds-lich-giang-day/');

    constructor(
        private http: HttpClient,
        private helperService: HelperService,
        private httphelper: HttpParamsHeplerService
    ) {
    }

    addHvuApiDanhsachlichgiangday(data: any): Observable<any> {
        return this.http.post<Dto>(this.api, data).pipe(
            map(res => res.data)
        );
    }

    updateHvuApiDanhsachlichgiangday(deXuatId: any, data: any): Observable<any> {
        return this.http.put<Dto>(this.api.concat(deXuatId.toString()), data).pipe(
            map(res => res.data)
        );
    }

    getAllHvuApiDanhsachlichgiangday(): Observable<HvuApiDanhsachlichgiangday[]> {
        return this.http.get<Dto>(this.api).pipe(
            map(res => res.data)
        );
    }

    deleteHvuApiDanhsachlichgiangday(id: any): Observable<any> {
        return this.http.delete<Dto>(this.api.concat(id.toString())).pipe(
            map(res => res.data)
        );
    }

    deleteHvuApiDanhsachlichgiangdayByCol(item: string, col: string): Observable<any> {
        const by = new HttpParams().set('by', col);
        return this.http.delete<Dto>(this.api.concat(item.toString()), { params: by }).pipe(
            map(res => res.data)
        );
    }

    updateHvuApiDanhsachlichgiangdayByCol(deXuatId: any, data: any, col: string): Observable<any> {
        const by = new HttpParams().set('by', col);
        return this.http.put<Dto>(this.api.concat(deXuatId.toString()), data, { params: by }).pipe(
            map(res => res.data)
        );
    }

    getHvuApiDanhsachlichgiangdayByPageNew(option: ConditionOption): Observable<{ data: HvuApiDanhsachlichgiangday[], recordsFiltered: number }> {
        let filter = option.page ? this.httphelper.paramsConditionBuilder(option.condition).set("paged", option.page) : this.httphelper.paramsConditionBuilder(option.condition);
        if (option.set && option.set.length)
            option.set.forEach(f => {
                filter = filter.set(f.label, f.value);
            })
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => { return { data: res.data, recordsFiltered: res.recordsFiltered } })
        );
    }

    getHvuApiDanhsachlichgiangdayBybody(body: { nhhk: number }): Observable<HvuApiDanhsachlichgiangday[]> {
        return this.http.post<Dto>(this.api, body).pipe(
            map(res => res.data['ds_lich_giang_day'])
        );
    }
}
