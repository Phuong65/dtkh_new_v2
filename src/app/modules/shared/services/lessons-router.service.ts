import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { getRoute } from 'src/environments/environment';
import { Dto, OvicQueryCondition } from '@core/models/dto';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { NotificationService } from '@core/services/notification.service';
import { ConditionOption } from '../models/condition-option';
import { OvicDocument } from '../models/ovic-document';
import { Params, Media, VideoBaiHoc } from '../models/elng-bai-hoc';

export interface Lesson {
    children: any;
    id?: number;
    trailer: number;
    course_id?: number;
    slug: string;
    title: string;
    desc: string;
    type: string;
    ordering: number;
    documents?: OvicDocument[];
    video: VideoBaiHoc;
    status: number;
    parent_id: number;
    params?: Params;
    audio?: OvicDocument[];
    slide?: OvicDocument[];
    other_video?: any[];
    content_type?: string;
    status_check?: number;
    media?: Media;
    video_desc?: string;
}

@Injectable({
    providedIn: 'root'
})
export class LessonsRouterService {

    private readonly api = getRoute('lessons/');

    constructor(
        private http: HttpClient,
        private httphelper: HttpParamsHeplerService,
        private notify: NotificationService
    ) { }

    addLesson(data: Lesson): Observable<Lesson> {
        return this.http.post<Dto>(this.api, data).pipe(map(res => res.data));
    }

    updateLesson(id: number, data: Partial<Lesson>): Observable<Lesson> {
        return this.http.put<Dto>(this.api.concat(id.toString()), data).pipe(map(res => res.data));
    }

    getAllLessons(): Observable<Lesson[]> {
        return this.http.get<Dto>(this.api).pipe(map(res => res.data));
    }

    deleteLesson(id: number): Observable<Lesson> {
        return this.http.delete<Dto>(this.api.concat(id.toString())).pipe(map(res => res.data));
    }

    getLessonsByCol(col: string, value: string | number): Observable<Lesson[]> {
        const filter = new HttpParams().set('condition', `${col},=,${value}`).set('limit', '-1');
        return this.http.get<Dto>(this.api, { params: filter }).pipe(map(res => res.data));
    }

    getLessonsByCourseId(courseId: number, select: string = null): Observable<Lesson[]> {
        if (!courseId) {
            this.notify.toastWarning('Thông tin truy vấn không chính xác vui lòng kiểm tra lại');
            return of([]);
        }
        const _preSet = select ? new HttpParams().set('select', select) : new HttpParams();
        const params = this.httphelper.paramsConditionBuilder([
            {
                conditionName: 'course_id',
                condition: OvicQueryCondition.equal,
                value: courseId.toString()
            },
            {
                conditionName: 'status',
                condition: OvicQueryCondition.notEqual,
                value: '-1',
                orWhere: 'and'
            }
        ], _preSet).set('orderby', 'ordering').set('order', 'ASC');
        return this.http.get<Dto>(this.api, { params }).pipe(map(res => res.data));
    }

    getLessonByPageNew(option: ConditionOption): Observable<{ data: Lesson[]; recordsFiltered: number }> {
        let filter = option.page
            ? this.httphelper.paramsConditionBuilder(option.condition).set('paged', option.page)
            : this.httphelper.paramsConditionBuilder(option.condition);
        if (option.set && option.set.length) {
            option.set.forEach(f => {
                filter = filter.set(f.label, f.value);
            });
        }
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => ({ data: res.data, recordsFiltered: res.recordsFiltered }))
        );
    }
}
