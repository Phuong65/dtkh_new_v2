import { HttpClient, HttpParams } from "@angular/common/http";
import { HelperService } from "@core/services/helper.service";
import { getRoute } from "@env";
import { map, Observable } from "rxjs";
import { Dto, IctuQueryParams, OvicConditionParam } from "@core/models/dto";
import { HttpParamsHeplerService } from "@core/services/http-params-hepler.service";
import { Injectable } from "@angular/core";
import { SurveyParticipant } from "../models/survey-participant";
@Injectable({
    providedIn: 'root'
})
export class SurveyParticipantsService {

    private api = getRoute('survey-participants/');

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

    postData(info: Partial<SurveyParticipant>): Observable<Dto> {
        return this.http.post<Dto>(this.api, info);
    }

    putData(info: Partial<SurveyParticipant>, id: string): Observable<Dto> {
        return this.http.put<Dto>(this.api.concat(id), info,);
    }

    delData(id: string): Observable<Dto> {
        return this.http.delete<Dto>(this.api.concat(id));
    }

}