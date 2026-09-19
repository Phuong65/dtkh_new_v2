import { Injectable } from '@angular/core';
import { environment, getRoute } from 'src/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { HelperService } from '@core/services/helper.service';
import { Observable } from 'rxjs';
import { Dto, OvicQueryCondition } from '@core/models/dto';
import { map } from 'rxjs/operators';
import { OvicMedia } from 'src/app/core/models/file';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';

export interface Question {
    id: number;
    lesson_id: number;
    test_id: number;
    question: string;
    answer: string;
    answer_correct: string;
    hint: string;
    explain: string;
}

export interface RawQuestion {
    id?: number;
    lesson_id: number;
    test_id: number;
    question: string;
    answer: Answers[];
    answer_correct: any;
    hint: string;
    explain: string;
    question_number: number;
    question_direction: string;
    question_type: string;
    answer_option: Answers[];
    group_id: number;
    part: number;
    media: Media;
}

export interface Answers {
    id: string;
    value: string;
}

export interface Media {
    type: string;
    source: string;
    path: string;
    replay: number;
}

export interface AnswerQuestion {
    id: number;
    answer_correct: string;
    explain: string;
}

export interface DirectionQuestion {
    id: number;
    lesson_id: number;
    test_id: number;
    question_number: number;
    question_direction: string;
    question_type: string;
    group_id: number;
    media: OvicMedia;
    part: number; // 10 20 30 => part 1, part 2, part 3
}

@Injectable({
    providedIn: 'root'
})
export class LessonTestsQuestionsService {

    private api = getRoute('lesson-tests-questions/');

    constructor(
        private http: HttpClient,
        private helperService: HelperService,
        private httpHepler: HttpParamsHeplerService
    ) { }

    getLessonTestsQuestions(lessonId: number): Observable<RawQuestion[]> {
        const params = this.httpHepler.paramsConditionBuilder([{
            conditionName: 'lesson_id',
            condition: OvicQueryCondition.equal,
            value: lessonId.toString()
        }]);
        return this.http.get<Dto>(this.api, { params }).pipe(
            map(res => res.data)
        );
    }

    getCorrectAnswers(questionIds: string[]): Observable<AnswerQuestion[]> {
        const params = new HttpParams().set('pluck', 'id,explain,answer_correct');
        return this.http.get<Dto>(this.api.concat(questionIds.toString()), { params }).pipe(
            map(res => res.data)
        );
    }
}
