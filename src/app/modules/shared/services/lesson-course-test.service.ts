import { Injectable } from '@angular/core';
import {  environment, getRoute } from 'src/environments/environment';
import { HttpClient , HttpParams } from '@angular/common/http';
import { HelperService } from '@core/services/helper.service';
import { Observable } from 'rxjs';
import { map , retry } from 'rxjs/operators';
import { Dto } from '@core/models/dto';

export interface UserCourseTest {
    id : number;
    user_id : number;
    course_id : number;
    lesson_id : number;
    num_question : number; //tổng số câu hỏi
    total_point : number; //Tổng điểm
    num_corect : number; //Tổng số câu đúng
    created_at : Date;
    updated_at : Date;
    num_point : number;
}

export interface UserCourseTestResult {
    correct_questions : number[];
    course_id : number;
    id : number;
    lesson_id : number;
    num_corect : number;
    num_point : string;
    num_question : number;
    total_point : number;
    user_id : number;
    created_at : Date;
    updated_at : Date;
}

interface CourseTestDTO {
    user_id : number;
    course_id : number;
    lesson_id : number;
    num_question : number;
    total_point : number;
    answers : {}; //{ 81: "Phương án trả lời 1", 90: "Phương án trả lời 2" }
}

@Injectable( {
    providedIn : 'root'
} )
export class LessonCourseTestService {

    private api = getRoute( 'lesson-course-test/' );

    constructor(
        private http : HttpClient ,
        private helperService : HelperService
    ) { }

    sendData( data : CourseTestDTO ) : Observable<UserCourseTestResult> {
        const params = new HttpParams().set( 'nopbai' , '035' );
        return this.http.post<Dto>( this.api , data , { params } ).pipe(
            map( res => res.data )
        );
    }
}
