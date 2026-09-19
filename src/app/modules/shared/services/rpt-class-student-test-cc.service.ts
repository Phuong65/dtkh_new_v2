import { Injectable } from '@angular/core';
import {getRoute} from "@env";
import {HttpClient, HttpParams} from "@angular/common/http";
import {HelperService} from "@core/services/helper.service";
import {HttpParamsHeplerService} from "@core/services/http-params-hepler.service";
import {Observable} from "rxjs";
import {Dto, OvicConditionParam, OvicQueryCondition} from "@core/models/dto";
import {map} from "rxjs/operators";
import {ConditionOption} from "@shared/models/condition-option";
import {ClassStudent} from "@shared/models/class-student";

export interface RptClassStudentTestCc{
  id        ?   : number;
  course_id	    : number;
  class_id	    : number;
  student_id	: number;
  week	        : number;
  maxpoint_3t   : number;
  maxpoint_at   : number;
  num_of_test	: number;
  last_check    : number;
  passing_point : number;
  type          ?:string;
  point_15      ?:number;

}
@Injectable({
  providedIn: 'root'
})
export class RptClassStudentTestCcService {

  api = getRoute('rpt-class-student-test-cc/');

  constructor(
    private http: HttpClient,
    private helperService: HelperService,
    private httpParamsHelper: HttpParamsHeplerService
  ) {
  }

  add(data: any): Observable<any> {
    return this.http.post<Dto>(this.api, data).pipe(map(res => res.data));
  }
  update(id: number, data: any): Observable<any> {
    return this.http.put<Dto>(this.api.concat(id.toString()), data).pipe(map(res => res.data));
  }

  getDataByCourseId(course_id:number,limit?:number):Observable<{data:RptClassStudentTestCc[] ,recordsTotal:number}>{
    const conditions: OvicConditionParam[] = [
      {
        conditionName: 'course_id',
        condition: OvicQueryCondition.equal,
        value: course_id.toString(10),
      },
    ];
    const fromObject = {
      paged: 1,
      limit:limit ? limit : -1,
      orderby: 'title',
      order: 'ASC'
    };
    const params = this.httpParamsHelper.paramsConditionBuilder(conditions, new HttpParams({fromObject}));
    return this.http.get<Dto>(this.api, {params}).pipe(map(res => ({
      recordsTotal: res.recordsFiltered,
      data: res.data
    })));
  }


  getClassStudentByPageNew(option: ConditionOption): Observable<{ data: RptClassStudentTestCc[], recordsFiltered: number }> {
    let filter = option.page ? this.httpParamsHelper.paramsConditionBuilder(option.condition).set("paged", option.page) : this.httpParamsHelper.paramsConditionBuilder(option.condition);
    if (option.set && option.set.length)
      option.set.forEach(f => {
        filter = filter.set(f.label, f.value);
      })
    return this.http.get<Dto>(this.api, { params: filter }).pipe(
      map(res => { return { data: res.data, recordsFiltered: res.recordsFiltered } })
    );
  }

}
