import { Injectable } from '@angular/core';
import { environment, getRoute } from 'src/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { HelperService } from '@core/services/helper.service';
import { Observable, of } from 'rxjs';
import { Dto, OvicQueryCondition } from '@core/models/dto';
import { map } from 'rxjs/operators';
import { OvicDocument } from '../models/ovic-document';
import { ElnBaiHoc } from '../models/elng-bai-hoc';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { NotificationService } from '@core/services/notification.service';

export interface Lesson {
    id?: number;
    course_id: number;
    parent_id: number;
    title: string;
    slug: string;
    type: string;
    desc: string;
    video: any;
    trailer: number;
    params: { condition: number };
    documents: OvicDocument[];
    ordering: number;
    teacher: string;
    activated: number;
    status: number;
    created_at: string;
    updated_at: string;
}

@Injectable({
    providedIn: 'root'
})
export class LessonsService {

    private api = getRoute('lessons/');

    constructor(
        private http: HttpClient,
        private helperService: HelperService,
        private httpHelper: HttpParamsHeplerService,
        private noitifi: NotificationService
    ) { }

    getLessonsByCourseId(courseId: number, pluck: string = null): Observable<ElnBaiHoc[]> {
        if (!courseId) {
            this.noitifi.toastWarning('Không tìm thấy dữ liệu của môn học gắn với lớp học phần này');
            return of([]);
        }
        const _preSet = pluck ? new HttpParams().set('pluck', pluck) : new HttpParams();
        const params = this.httpHelper.paramsConditionBuilder([{
            conditionName: 'course_id',
            condition: OvicQueryCondition.equal,
            value: courseId.toString()
        },
        {
            conditionName: 'status',
            condition: OvicQueryCondition.notEqual,
            value: '-1',
            orWhere: 'and'
        }], _preSet).set('orderby', 'ordering').set('order', 'ASC');
        return this.http.get<Dto>(this.api, { params: params }).pipe(
            map(res => res.data)
        );
    }

}
