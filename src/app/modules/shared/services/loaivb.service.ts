import { Injectable } from '@angular/core';
import { getRoute } from '@env';
import { HttpClient, HttpParams } from '@angular/common/http';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { HelperService } from '@core/services/helper.service';
import { ThemeSettingsService } from '@core/services/theme-settings.service';
import { Observable } from 'rxjs';
import { LoaiVanBang, VanBang } from '@shared/models/loaivb';
import { Dto, OvicConditionParam, OvicQueryCondition } from '@core/models/dto';
import { map } from 'rxjs/operators';
import { ConditionOption } from '../models/condition-option';

@Injectable({
    providedIn: 'root'
})
export class LoaivbService {

    private readonly api = getRoute('media-lcms/');
    private readonly api_ = getRoute('sso-users-new/');
    private readonly api_user_back = getRoute('users-back/');
    private readonly api_user = getRoute('sys-users/');
    private readonly api_playlist = getRoute('playlists-aws/');

    constructor(
        private http: HttpClient,
        private httpParamsHelper: HttpParamsHeplerService,
        private helperService: HelperService,
        private themeSettingsService: ThemeSettingsService
    ) { }

    get(paged: number): Observable<{ recordsTotal: number, data: VanBang[] }> {
        const fromObject = {
            paged: paged,
            limit: this.themeSettingsService.settings.rows,
            orderby: 'id',
            order: 'ASC'
        };
        const params = new HttpParams({ fromObject });
        return this.http.get<Dto>(this.api, { params }).pipe(map(res => ({ recordsTotal: res.recordsFiltered, data: res.data })));
    }

    update(id: number, data: any): Observable<number> {
        return this.http.put<Dto>(''.concat(this.api, id.toString(10)), data).pipe(map(res => res.data));
    }

    create(data: any): Observable<number> {
        return this.http.post<Dto>(this.api, data).pipe(map(res => res.data));
    }

    delete(id: number): Observable<any> {
        return this.http.delete<Dto>(''.concat(this.api, id.toString(10))).pipe(map(res => res.data));
    }

    filter(type: LoaiVanBang, pluck: string = ''): Observable<VanBang[]> {
        const fromObject = {
            limit: -1,
            orderby: 'name',
            order: 'ASC'
        };

        if (pluck) {
            fromObject['pluck'] = pluck;
        }
        const conditions: OvicConditionParam[] = [{
            conditionName: 'type',
            condition: OvicQueryCondition.like,
            value: type
        }];

        const params = this.httpParamsHelper.paramsConditionBuilder(conditions, new HttpParams({ fromObject }));
        return this.http.get<Dto>(this.api, { params }).pipe(map(res => res.data));
    }

    getElnBaiHocByCol(): Observable<any[]> {
        const filter = new HttpParams().set("limit", -1);
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => res.data)
        );
    }

    getMediaCols(condition: HttpParams): Observable<any[]> {
        return this.http.get<Dto>(this.api, { params: condition }).pipe(
            map(res => res.data)
        );
    }

    getMediaByPageNew(option: ConditionOption): Observable<{ data: any[], recordsFiltered: number }> {
        let filter = this.httpParamsHelper.paramsConditionBuilder(option.condition).set("paged", option.page);
        if (option.set && option.set.length)
            option.set.forEach(f => {
                filter = filter.set(f.label, f.value);
            })
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => { return { data: res.data, recordsFiltered: res.recordsFiltered } })
        );
    }

    getUserSSOByPageNew(option: ConditionOption): Observable<{ data: any[], recordsFiltered: number }> {
        let filter = this.httpParamsHelper.paramsConditionBuilder(option.condition).set("paged", option.page);
        if (option.set && option.set.length)
            option.set.forEach(f => {
                filter = filter.set(f.label, f.value);
            })
        return this.http.get<Dto>(this.api_, { params: filter }).pipe(
            map(res => { return { data: res.data, recordsFiltered: res.recordsFiltered } })
        );
    }

    getUserByPageNew(option: ConditionOption): Observable<{ data: any[], recordsFiltered: number }> {
        let filter = this.httpParamsHelper.paramsConditionBuilder(option.condition).set("paged", option.page);
        if (option.set && option.set.length)
            option.set.forEach(f => {
                filter = filter.set(f.label, f.value);
            })
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => { return { data: res.data, recordsFiltered: res.recordsFiltered } })
        );
    }

    getUserBackByPageNew(option: ConditionOption): Observable<{ data: any[], recordsFiltered: number }> {
        let filter = this.httpParamsHelper.paramsConditionBuilder(option.condition).set("paged", option.page);
        if (option.set && option.set.length)
            option.set.forEach(f => {
                filter = filter.set(f.label, f.value);
            })
        return this.http.get<Dto>(this.api_user_back, { params: filter }).pipe(
            map(res => { return { data: res.data, recordsFiltered: res.recordsFiltered } })
        );
    }

    createUser(data: any): Observable<number> {
        return this.http.post<Dto>(this.api_user, data).pipe(map(res => res.data));
    }

    getUserPlaylistByPageNew(option: ConditionOption): Observable<{ data: any[], recordsFiltered: number }> {
        let filter = this.httpParamsHelper.paramsConditionBuilder(option.condition).set("paged", option.page);
        if (option.set && option.set.length)
            option.set.forEach(f => {
                filter = filter.set(f.label, f.value);
            })
        return this.http.get<Dto>(this.api_playlist, { params: filter }).pipe(
            map(res => { return { data: res.data, recordsFiltered: res.recordsFiltered } })
        );
    }
}
