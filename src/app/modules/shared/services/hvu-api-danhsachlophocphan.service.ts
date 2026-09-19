import { Injectable } from '@angular/core';
import { environment, getRoute } from 'src/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Dto, OvicConditionParam, OvicQueryCondition } from '@core/models/dto';
import { HelperService } from '@core/services/helper.service';
import { map } from 'rxjs/operators';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { ConditionOption } from '../models/condition-option';
import { StringLiteral } from 'typescript';

export interface HvuApiDanhsachlophocphan {
    id_lop: string;
    ten_mon_hoc: string;
    lopth: string;
    ma_gv: string;
    ma_tg: string;
    so_tin_chi: number;
    ma_mon_hoc: string;
    nam_hoc: number;
    hoc_ky: number;
    ds_ma_lop: string;
    nhom_to: string;
    khoa: string; //K23
}

@Injectable({
    providedIn: 'root'
})
export class HvuApiDanhsachlophocphanService {

    api = getRoute('dhhv/ds-lop-hoc-phan/');

    constructor(
        private http: HttpClient,
        private helperService: HelperService,
        private httphelper: HttpParamsHeplerService
    ) {
    }

    addHvuApiDanhsachlophocphan(data: any): Observable<any> {
        return this.http.post<Dto>(this.api, data).pipe(
            map(res => res.data)
        );
    }

    updateHvuApiDanhsachlophocphan(deXuatId: any, data: any): Observable<any> {
        return this.http.put<Dto>(this.api.concat(deXuatId.toString()), data).pipe(
            map(res => res.data)
        );
    }

    getAllHvuApiDanhsachlophocphan(): Observable<HvuApiDanhsachlophocphan[]> {
        return this.http.get<Dto>(this.api).pipe(
            map(res => res.data)
        );
    }

    deleteHvuApiDanhsachlophocphan(id: any): Observable<any> {
        return this.http.delete<Dto>(this.api.concat(id.toString())).pipe(
            map(res => res.data)
        );
    }

    deleteHvuApiDanhsachlophocphanByCol(item: string, col: string): Observable<any> {
        const by = new HttpParams().set('by', col);
        return this.http.delete<Dto>(this.api.concat(item.toString()), { params: by }).pipe(
            map(res => res.data)
        );
    }

    updateHvuApiDanhsachlophocphanByCol(deXuatId: any, data: any, col: string): Observable<any> {
        const by = new HttpParams().set('by', col);
        return this.http.put<Dto>(this.api.concat(deXuatId.toString()), data, { params: by }).pipe(
            map(res => res.data)
        );
    }

    getHvuApiDanhsachlophocphanByPageNew(option: ConditionOption): Observable<{ data: HvuApiDanhsachlophocphan[], recordsFiltered: number }> {
        let filter = option.page ? this.httphelper.paramsConditionBuilder(option.condition).set("paged", option.page) : this.httphelper.paramsConditionBuilder(option.condition);
        if (option.set && option.set.length)
            option.set.forEach(f => {
                filter = filter.set(f.label, f.value);
            })
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => { return { data: res.data, recordsFiltered: res.recordsFiltered } })
        );
    }

    getHvuApiDanhsachlophocphanBybody(body: { nhhk: number, nien_khoa: string }): Observable<HvuApiDanhsachlophocphan[]> {
        return this.http.post<Dto>(this.api, body).pipe(
            map(res => res.data['ds_lop_hoc_phan'])
        );
    }
}
