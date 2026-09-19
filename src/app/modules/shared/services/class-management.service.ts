import { Injectable } from '@angular/core';
import { getRoute } from "@env";
import { HttpClient } from "@angular/common/http";
import { HttpParamsHeplerService } from "@core/services/http-params-hepler.service";
import { Observable } from "rxjs";
import { Dto } from "@core/models/dto";
import { map } from "rxjs/operators";
import { ConditionOption } from "@shared/models/condition-option";

export interface ClassManagement {
    id: number;
    khoa: number;
    donvi_id: number;//donvi_id;
    title: string;
    desc: string;
    nganh_id: number;
    kyhieu: string;
}
@Injectable({
    providedIn: 'root'
})
export class ClassManagementService {
    api = getRoute('class-management/');

    constructor(
        private http: HttpClient,
        private httpHelper: HttpParamsHeplerService,
    ) {
    }

    add(data: any): Observable<any> {
        return this.http.post<Dto>(this.api, data).pipe(
            map(res => res.data)
        );
    }

    update(deXuatId: number, data: any): Observable<any> {
        return this.http.put<Dto>(this.api.concat(deXuatId.toString()), data).pipe(
            map(res => res.data)
        );
    }


    delete(id: any): Observable<any> {
        return this.http.delete<Dto>(this.api.concat(id.toString())).pipe(
            map(res => res.data)
        );
    }

    getDataByPageNew(option: ConditionOption): Observable<{ data: ClassManagement[], recordsFiltered: number }> {
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
