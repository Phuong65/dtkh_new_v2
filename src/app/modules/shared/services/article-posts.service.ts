import { Injectable } from '@angular/core';
import {getRoute} from "@env";
import {HttpClient, HttpParams} from "@angular/common/http";
import {HttpParamsHeplerService} from "@core/services/http-params-hepler.service";
import {Observable} from "rxjs";
import {Dto, OvicConditionParam, OvicQueryCondition} from "@core/models/dto";
import {map} from "rxjs/operators";
import {ConditionOption} from "@shared/models/condition-option";
import {Extensions} from "@shared/services/extensions.service";
import {OvicFile} from "@core/models/file";


export interface ArticlePosts{
    id ?: number;
    title:string;
    short_desc: string;
    images:OvicFile[];
    tags:string[];
    status:number;
    image_url:OvicFile[];
    content:string;
    cate_ids:number[];
    ghim?:number;
    type?:number;//0:bài viết, 1 thongbao
    files?:OvicFile[];
}
@Injectable({
  providedIn: 'root'
})
export class ArticlePostsService {
    api = getRoute('article-posts/');

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


    delete(id: any): Observable<any> {
        return this.http.delete<Dto>(this.api.concat(id.toString())).pipe(
            map(res => res.data)
        );
    }

    getDataByPageNew(option: ConditionOption): Observable<{ data: ArticlePosts[], recordsFiltered: number }> {
        let filter = option.page ? this.httpHelper.paramsConditionBuilder(option.condition).set("paged", option.page) : this.httpHelper.paramsConditionBuilder(option.condition);
        if (option.set && option.set.length)
            option.set.forEach(f => {
                filter = filter.set(f.label, f.value);
            })
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => { return { data: res.data, recordsFiltered: res.recordsFiltered } })
        );
    }

    search(page: number, limit: number,search:string,cate_id:string,status?:string,type?:string): Observable<{ recordsTotal: number, data: ArticlePosts[] }> {
        const conditions: OvicConditionParam[] = [];
        const fromObject = {
            paged: page,
            limit: limit,
            orderby: 'ghim',
            order: 'DESC'
        };
        if (search) {
            conditions.push({
                conditionName: 'title',
                condition: OvicQueryCondition.like,
                value: `%${search}%`,
                orWhere: 'and'
            });
        }
        if(status){
            conditions.push({
                conditionName: 'status',
                condition: OvicQueryCondition.equal,
                value: status,
                orWhere: 'and'
            });
        }
        if(type){
            conditions.push({
                conditionName: 'type',
                condition: OvicQueryCondition.equal,
                value: type,
                orWhere: 'and'
            });
        }


        const params = this.httpHelper.paramsConditionBuilder(conditions, new HttpParams({ fromObject }));
        return this.http.get<Dto>(this.api + (cate_id ? `?cate_ids=` + cate_id : ''), { params }  ).pipe(map(res => ({
            recordsTotal: res.recordsFiltered,
            data: res.data
        })));
    }
}
