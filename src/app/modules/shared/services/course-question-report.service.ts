import { Injectable } from '@angular/core';
import {getRoute} from "@env";
import {HttpClient} from "@angular/common/http";
import {HttpParamsHeplerService} from "@core/services/http-params-hepler.service";
import {Observable} from "rxjs";
import {Dto} from "@core/models/dto";
import {map} from "rxjs/operators";
import {ConditionOption} from "@shared/models/condition-option";

export interface CourseQuestionReport {
    id?:number;
    question_id:number;
    content: CourseQuestionReportContent[];
    user_id:number;
}

export interface ItemByObjectContent{
    edit:1|0; //1:edit, 0 notEdit
    isLock:1|0;//1 locl,2 unLock
    title:string;
    value?:string;
    type:'checkbox' |'text'| 'radio';
    check:boolean;// kiem tra check,
    order:number;

}
export interface CourseQuestionReportContent {
    id:number
    header:string;
    items:ItemByObjectContent[],
    check:1|0;//
}


@Injectable({
  providedIn: 'root'
})
export class CourseQuestionReportService {
    api = getRoute('course-question-report/');

    constructor(
        private http: HttpClient,
        private httpHelper: HttpParamsHeplerService
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
    delete(ids: any): Observable<any> {
        return this.http.delete<Dto>(this.api.concat(ids)).pipe(
            map(res => res.data)
        );
    }

    getDataByPageNew(option: ConditionOption): Observable<{ data: CourseQuestionReport[], recordsFiltered: number }> {
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
