import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Dto, IctuPaginator, IctuQueryParams, OvicConditionParam, OvicQueryCondition, dtoToIctuPaginator } from '@core/models/dto';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { SubjectCourse, SubjectCourseExtend } from '@modules/shared/models/subject-course';
import { map, Observable } from 'rxjs';
import { getRoute } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class SubjectCourseService {
    private readonly api = getRoute('subject-courses/');

    constructor(
        private http: HttpClient,
        private httpHelper: HttpParamsHeplerService
    ) {}

    get(conditions: OvicConditionParam[] = [], queryParams: IctuQueryParams = {}): Observable<IctuPaginator<SubjectCourseExtend>> {
        const params = this.httpHelper.paramsConditionBuilder(conditions, new HttpParams({ fromObject: queryParams }));
        return this.http.get<Dto>(this.api, { params }).pipe(
            map(response => dtoToIctuPaginator<SubjectCourseExtend>(response))
        );
    }

    getByBoCtdt(boId: number): Observable<IctuPaginator<SubjectCourseExtend>> {
        return this.get(
            [{ conditionName: 'ctdt_bo_id', condition: OvicQueryCondition.equal, value: String(boId) }],
            { limit: -1, with: 'subjects' }
        );
    }

    create(data: Pick<SubjectCourse, 'ctdt_bo_id' | 'subject_id' | 'course_id'>): Observable<SubjectCourse> {
        return this.http.post<Dto>(this.api, data).pipe(map(response => response.data as SubjectCourse));
    }

    delete(id: number): Observable<unknown> {
        return this.http.delete<Dto>(this.api.concat(String(id))).pipe(map(response => response.data));
    }
}
