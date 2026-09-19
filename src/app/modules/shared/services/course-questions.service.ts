import { Injectable } from '@angular/core';
import { getRoute } from 'src/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, switchMap } from 'rxjs';
import { Dto, IctuQueryParams, OvicConditionParam, OvicQueryCondition } from '@core/models/dto';
import { CourseQuestions } from '@shared/models/course-questions';
import { map } from 'rxjs/operators';
import { ConditionOption } from '../models/condition-option';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';

@Injectable({
	providedIn: 'root'
})
export class CourseQuestionsService {

	api = getRoute('course-questions/');

	constructor(
		private http: HttpClient,
		private httpHelper: HttpParamsHeplerService
	) {
	}

	addCourseQuestions(data: any): Observable<any> {
		return this.http.post<Dto>(this.api, data).pipe(
			map(res => res.data)
		);
	}

	updateCourseQuestions(deXuatId: number, data: any): Observable<any> {
		return this.http.put<Dto>(this.api.concat(deXuatId.toString()), data).pipe(
			map(res => res.data)
		);
	}


	getAllCourseQuestions(): Observable<CourseQuestions[]> {
		//const filter = new HttpParams().set( 'khcn_id' , khcn_id.toString() ); { params : filter }
		return this.http.get<Dto>(this.api).pipe(
			map(res => res.data)
		);
	}

	deleteCourseQuestions(ids: any): Observable<any> {
		return this.http.delete<Dto>(this.api.concat(ids)).pipe(
			map(res => res.data)
		);
	}

	getCourseQuestionsByCol(col: string, item: any): Observable<CourseQuestions[]> {
		const filter = new HttpParams().set('condition', col.concat(',=,', item)).set("limit", -1);
		return this.http.get<Dto>(this.api, { params: filter }).pipe(
			map(res => res.data)
		);
	}

	getCourseQuestionsByCols(condition: HttpParams): Observable<CourseQuestions[]> {
		return this.http.get<Dto>(this.api, { params: condition }).pipe(
			map(res => res.data)
		);
	}

	deleteCourseQuestionsBy(col: string, item: string): Observable<any> {
		const by = new HttpParams().set('by', col);
		return this.http.delete<Dto>(this.api.concat(item.toString()), { params: by });
	}

	getCourseQuestionsByPageNew(option: ConditionOption): Observable<{ data: CourseQuestions[], recordsFiltered: number }> {
		let filter = option.page ? this.httpHelper.paramsConditionBuilder(option.condition).set("paged", option.page) : this.httpHelper.paramsConditionBuilder(option.condition);
		if (option.set && option.set.length)
			option.set.forEach(f => {
				filter = filter.set(f.label, f.value);
			})
		return this.http.get<Dto>(this.api, { params: filter }).pipe(
			map(res => {
				return { data: res.data, recordsFiltered: res.recordsFiltered }
			})
		);
	}

	updateCourseQuestionsByCol(deXuatId: any, data: any, col: string): Observable<any> {
		const by = new HttpParams().set('by', col);
		return this.http.put<Dto>(this.api.concat(deXuatId.toString()), data, { params: by }).pipe(
			map(res => res.data)
		);
	}

	query<T>(conditions: OvicConditionParam[], queryParams?: IctuQueryParams): Observable<T[]> {
		const params: HttpParams = this.httpHelper.paramsConditionBuilder(conditions, new HttpParams({ fromObject: queryParams }));
		return this.http.get<Dto>(this.api, { params }).pipe(map((res: Dto) => res.data));
	}

	resolveLatestQuestion(question: CourseQuestions): Observable<CourseQuestions> {
		if (!question?.id) {
			return of(question);
		}

		return this.resolveLatestQuestionById(question, new Set<number>());
	}

	private resolveLatestQuestionById(question: CourseQuestions, visited: Set<number>): Observable<CourseQuestions> {
		const questionId = Number(question.id);
		if (!questionId || visited.has(questionId)) {
			return of(question);
		}
		visited.add(questionId);

		return this.query<CourseQuestions>([
			{
				conditionName: 'question_root_id',
				condition: OvicQueryCondition.equal,
				value: questionId.toString()
			}
		], {
			limit: -1,
			paged: 1,
			orderby: 'id',
			order: 'DESC'
		}).pipe(
			switchMap(clones => {
				const latestClone = clones
					.filter(clone => clone?.id && !visited.has(Number(clone.id)))
					.sort((a, b) => Number(b.id) - Number(a.id))[0];
				return latestClone
					? this.resolveLatestQuestionById(latestClone, visited)
					: of(question);
			})
		);
	}

	promptAi(prompt: string): Observable<any> {
		return this.http.post<Dto>(this.api.concat('tao-cau-hoi-ai'), { prompt: prompt }).pipe(
			map(res => res.data)
		);
	}
}
