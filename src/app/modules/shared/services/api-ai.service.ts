import { Injectable } from '@angular/core';
import { environment, getRoute } from 'src/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Dto, OvicConditionParam, OvicQueryCondition } from '@core/models/dto';
import { ClassGroup } from '../models/class-group';
import { HelperService } from '@core/services/helper.service';
import { map } from 'rxjs/operators';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { ConditionOption } from '../models/condition-option';

export interface AiRubricResponse {
    rubricMarkdown: string;
    warnings: string[];
}

@Injectable({
    providedIn: 'root'
})
export class ApiAiService {

    api = getRoute('ai-request/');

    constructor(
        private http: HttpClient,
        private helperService: HelperService,
        private httphelper: HttpParamsHeplerService
    ) {
    }

    getTieuChiChamAi(prompt: string): Observable<string> {
        return this.http.post<Dto>(this.api.concat('tao-tieu-chi-cham/'), { prompt: prompt }).pipe(
            map(res => res.data)
        );
    }

    getCauHoiTracNghiemAi(prompt: string): Observable<any> {
        return this.http.post<Dto>(this.api.concat('tao-cau-hoi-ai'), { prompt: prompt }).pipe(
            map(res => res.data)
        );
    }

    getChamDiemAi(prompt: string): Observable<string> {
        return this.http.post<Dto>(this.api.concat('cham-diem'), { prompt: prompt }).pipe(
            map(res => res.data)
        );
    }
}
