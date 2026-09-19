import { Injectable } from '@angular/core';
import { environment, getRoute } from 'src/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { HelperService } from '@core/services/helper.service';
import { Observable } from 'rxjs';
import { Dto, OvicQueryCondition } from '@core/models/dto';
import { map } from 'rxjs/operators';
import { OvicDocument } from '@core/models/file';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
export interface Courses {
    id?: number;
    subtitle: string;
    category_ids: any;
    slug: string;
    title: string;
    desc: string;
    parent_id: number;
    ordering: number;
    showName: string;
    img_url: string;
    keyword: string;
    files: OvicDocument[];
    creator_id: number;
    price: number;
    discount: number;
    seo: string;
    video_introduce: string;
    num_of_like: number;
    num_of_view: number;
    status: number;
    checkedVideo: string;
    currency_price: string;
    currency_discount: string;
    creator_name: string;
    feature: number;
    decuong: OvicDocument[];
    sobaigiang: number;
    maso: string;
    updated_by: number;
    activated?: number;
}

@Injectable({
    providedIn: 'root'
})

export class CoursesService {

    private api = getRoute('courses/');

    constructor(
        private http: HttpClient,
        private helperService: HelperService,
        private httpHelper: HttpParamsHeplerService
    ) { }

    private getCourses(params: HttpParams): Observable<Courses[]> {
        return this.http.get<Dto>(this.api, { params }).pipe(map(res => res.data));
    }

    getAllCourses(): Observable<Courses[]> {
        const params = new HttpParams().set('orderby', 'created_at').set('order', 'ASC');
        return this.getCourses(params);
    }

    getCourseOfCat(catIds: number[]): Observable<Courses[]> {
        const params = new HttpParams().set('category_ids', catIds.toString());
        return this.getCourses(params);
    }

    searchCourses(s: string, catId: number = null): Observable<Courses[]> {
        const _conditions = [
            {
                conditionName: 'title',
                condition: OvicQueryCondition.like,
                value: `%${s}%`
            },
            {
                conditionName: 'subtitle',
                condition: OvicQueryCondition.like,
                value: `%${s}%`,
                orWhere: 'or'
            },
            {
                conditionName: 'desc',
                condition: OvicQueryCondition.like,
                value: `%${s}%`,
                orWhere: 'or'
            },
            {
                conditionName: 'keyword',
                condition: OvicQueryCondition.like,
                value: `%${s}%`,
                orWhere: 'or'
            }
        ];
        const params = catId ? this.httpHelper.paramsConditionBuilder(_conditions).set('category_ids', catId.toString()) : this.httpHelper.paramsConditionBuilder(_conditions);
        return this.getCourses(params);
    }

    getCourseBySlug(slug: string): Observable<Courses[]> {
        const params = this.httpHelper.paramsConditionBuilder([{
            conditionName: 'slug',
            condition: OvicQueryCondition.equal,
            value: slug
        }]);
        return this.getCourses(params);
    }

    getCourseByIds(ids: number[], pluck: string = null): Observable<Courses[]> {
        const _construct = pluck ? new HttpParams().set('pluck', pluck) : new HttpParams();
        const params = this.httpHelper.paramsConditionBuilder([{
            conditionName: 'status',
            condition: OvicQueryCondition.equal,
            value: '1'
        }], _construct);
        return this.http.get<Dto>(this.api.concat(ids.join(',')), { params }).pipe(map(res => res.data));
    }

    getRawCourseByIds(ids: number[], pluck: string = null): Observable<Courses[]> {
        const params = pluck ? new HttpParams().set('pluck', pluck) : new HttpParams();
        return this.http.get<Dto>(this.api.concat(ids.join(',')), { params }).pipe(map(res => res.data));
    }

    getActivatedCourseNumber(id: number): Observable<number> {
        const params = new HttpParams().set('pluck', 'id,activated');
        return this.http.get<Dto>(this.api.concat(id.toString()), { params }).pipe(map(res => res.data));
    }

    updateCourse(id: number, data): Observable<any> {
        return this.http.get<Dto>(this.api.concat(id.toString()), data);
    }

}
