import { Injectable } from '@angular/core';
import {getRoute} from "@env";
import {HttpClient} from "@angular/common/http";
import {HelperService} from "@core/services/helper.service";
import {HttpParamsHeplerService} from "@core/services/http-params-hepler.service";
import {Observable} from "rxjs";
import {Dto} from "@core/models/dto";
import {map} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class RptClassStudentTestTxService {

  api = getRoute('rpt-class-student-test-tx/');

  constructor(
    private http: HttpClient,
    private helperService: HelperService,
    private httphelper: HttpParamsHeplerService
  ) {
  }

  add(data: any): Observable<any> {
    return this.http.post<Dto>(this.api, data).pipe(map(res => res.data));
  }
  update(id: number, data: any): Observable<any> {
    return this.http.put<Dto>(this.api.concat(id.toString()), data).pipe(map(res => res.data));
  }



}
