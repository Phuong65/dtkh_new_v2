import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';
import { CourseQuestions } from '@shared/models/course-questions';
import { CourseTesterResults } from '@shared/models/course-tester-results';
import { Duration } from 'moment';

export interface CourseTesterResultExtend {
    courseQuestion: CourseQuestions;
    completed: boolean;
    courseTesterResult: Pick<CourseTesterResults, 'course_tester_id' | 'round' | 'question_id' | 'answer' | 'result' | 'time_to_answer' | 'course_tester_session_id' | 'temporary'>;
    duration: Duration;
    totalTime: number;
    child: CourseTesterResultExtend[];
    questionNumber: number;
    fakeQuestionCode: string;
}

@Component({
    selector: 'app-kiem-thu-ngan-hang-cau-hoi',
    templateUrl: './kiem-thu-ngan-hang-cau-hoi.component.html',
    styleUrls: ['./kiem-thu-ngan-hang-cau-hoi.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export default class KiemThuNganHangCauHoiComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



