import { HttpClient, HttpParams } from "@angular/common/http";
import { HelperService } from "@core/services/helper.service";
import { getRoute } from "@env";
import { map, Observable } from "rxjs";
import { Survey } from "../models/survey";
import { Dto, IctuQueryParams, OvicConditionParam } from "@core/models/dto";
import { ConditionOption } from "../models/condition-option";
import { HttpParamsHeplerService } from "@core/services/http-params-hepler.service";
import { Injectable } from "@angular/core";
@Injectable({
    providedIn: 'root'
})
export class SurveyService {

    private api = getRoute('surveys/');

    constructor(
        private http: HttpClient,
        private helperService: HelperService,
        private httpHelper: HttpParamsHeplerService
    ) { }

    loadData(condition: OvicConditionParam[], queryParams: IctuQueryParams): Observable<Dto> {
        const fromObject: IctuQueryParams = queryParams;
        const params: HttpParams = this.httpHelper.paramsConditionBuilder(condition, new HttpParams({ fromObject }));
        return this.http.get<Dto>(this.api, { params: params });
    }

    loadData1(id: string): Observable<Dto> {
        const fromObject: IctuQueryParams = { limit: 1, paged: 1 };
        const params: HttpParams = this.httpHelper.paramsConditionBuilder([], new HttpParams({ fromObject }));
        return this.http.get<Dto>(this.api.concat(id), { params: params });
    }


    postData(info: Partial<Survey>): Observable<Dto> {
        return this.http.post<Dto>(this.api, info);
    }

    putData(info: Partial<Survey>, id: string): Observable<Dto> {
        return this.http.put<Dto>(this.api.concat(id), info,);
    }

    delData(id: string): Observable<Dto> {
        return this.http.delete<Dto>(this.api.concat(id));
    }
}