import { Injectable } from '@angular/core';
import { environment, getRoute } from 'src/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Dto, OvicConditionParam, OvicQueryCondition } from '@core/models/dto';
import { HelperService } from '@core/services/helper.service';
import { map } from 'rxjs/operators';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { ConditionOption } from '../models/condition-option';

export interface HvuApiDanhsachdiemdanh {
    ma_sinh_vien: string;
    tong_so_buoi: number;
    vang_co_phep: number;
    vang_khong_phep: number;
    di_muon: number;
    ve_som: number;
    cam_thi: number;
    so_tiet: number;
}

@Injectable({
    providedIn: 'root'
})
export class HvuApiDanhsachdiemdanhService {

    api = getRoute('dhhv/ds-diem-danh/');

    constructor(
        private http: HttpClient,
        private helperService: HelperService,
        private httphelper: HttpParamsHeplerService
    ) {
    }

    addHvuApiDanhsachdiemdanh(data: any): Observable<any> {
        return this.http.post<Dto>(this.api, data).pipe(
            map(res => res.data)
        );
    }

    updateHvuApiDanhsachdiemdanh(deXuatId: any, data: any): Observable<any> {
        return this.http.put<Dto>(this.api.concat(deXuatId.toString()), data).pipe(
            map(res => res.data)
        );
    }

    getAllHvuApiDanhsachdiemdanh(): Observable<HvuApiDanhsachdiemdanh[]> {
        return this.http.get<Dto>(this.api).pipe(
            map(res => res.data)
        );
    }

    deleteHvuApiDanhsachdiemdanh(id: any): Observable<any> {
        return this.http.delete<Dto>(this.api.concat(id.toString())).pipe(
            map(res => res.data)
        );
    }

    deleteHvuApiDanhsachdiemdanhByCol(item: string, col: string): Observable<any> {
        const by = new HttpParams().set('by', col);
        return this.http.delete<Dto>(this.api.concat(item.toString()), { params: by }).pipe(
            map(res => res.data)
        );
    }

    updateHvuApiDanhsachdiemdanhByCol(deXuatId: any, data: any, col: string): Observable<any> {
        const by = new HttpParams().set('by', col);
        return this.http.put<Dto>(this.api.concat(deXuatId.toString()), data, { params: by }).pipe(
            map(res => res.data)
        );
    }

    getHvuApiDanhsachdiemdanhByPageNew(option: ConditionOption): Observable<{ data: HvuApiDanhsachdiemdanh[], recordsFiltered: number }> {
        let filter = option.page ? this.httphelper.paramsConditionBuilder(option.condition).set("paged", option.page) : this.httphelper.paramsConditionBuilder(option.condition);
        if (option.set && option.set.length)
            option.set.forEach(f => {
                filter = filter.set(f.label, f.value);
            })
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => { return { data: res.data, recordsFiltered: res.recordsFiltered } })
        );
    }

    getHvuApiDanhsachdiemdanhBybody(body: { ma_mon_hoc: string, nhom_to: string, nhhk: string }): Observable<HvuApiDanhsachdiemdanh[]> {
        return this.http.post<Dto>(this.api, body).pipe(
            map(res => res.data)
        );
    }
}
