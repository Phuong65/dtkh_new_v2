import {Injectable} from '@angular/core';
import {environment, getRoute} from 'src/environments/environment';
import {Dto, OvicQueryCondition} from '@core/models/dto';
import {HelperService} from '@core/services/helper.service';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {HttpParamsHeplerService} from '@core/services/http-params-hepler.service';
import {ConditionOption} from "@shared/models/condition-option";
import {ClassManagement} from "@shared/services/class-management.service";

export interface Category {
  id: number;
  title: string;
  slug: string;
  desc: string;
  parent_id: number;
  ordering: number;
  status: number; //-1. Delete; 0: inactive; 1. active
  donvi_chuyenmon_id: number;
  type: string;
}

@Injectable({
  providedIn: 'root'
})

export class CategoriesService {

  private api = getRoute('nganh-bomon/');

  constructor(
    private http: HttpClient,
    private helperService: HelperService,
    private httpHelper: HttpParamsHeplerService
  ) {
  }

  private getCategories(status: number): Observable<Category[]> {
    const params = this.httpHelper.paramsConditionBuilder([{
      conditionName: 'status',
      condition: OvicQueryCondition.equal,
      value: status.toString()
    }]);
    return this.http.get<Dto>(this.api, {params: params}).pipe(map(res => res.data));
  }

  getActiveCategories(): Observable<Category[]> {
    return this.getCategories(1);
  }

  getCategoriesOfIds(ids: number[]): Observable<Category[]> {
    return this.http.get<Dto>(this.api.concat(ids.toString())).pipe(map(res => res.data));
  }

  getAllCategories(): Observable<Category[]> {
    return this.http.get<Dto>(this.api).pipe(map(res => res.data));
  }

  getCatergoriesByIdDonViBoMon(id: number): Observable<Category[]> {

    const condition_donvi: ConditionOption = {
      condition: [
        { conditionName: 'status', condition: OvicQueryCondition.equal, value: '1' },
        { conditionName: 'donvi_chuyenmon_id', condition: OvicQueryCondition.equal, value: id.toString(10) }
      ],
      set: [
        { label: 'limit', value: '-1' }
      ],
      page: '1'
    };


    let filter = condition_donvi.page ? this.httpHelper.paramsConditionBuilder(condition_donvi.condition).set("paged", condition_donvi.page) : this.httpHelper.paramsConditionBuilder(condition_donvi.condition);
    if (condition_donvi.set && condition_donvi.set.length)
      condition_donvi.set.forEach(f => {
        filter = filter.set(f.label, f.value);
      })
    return this.http.get<Dto>(this.api, { params: filter }).pipe(
      map(res => res.data)
    );

  }

    getDataByPageNew(option: ConditionOption): Observable<{ data: Category[], recordsFiltered: number }> {
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
