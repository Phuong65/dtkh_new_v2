import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';
import { CoursePlanActivities } from '@modules/shared/models/course-plan-activities';

export interface PlanActivityCdr extends CoursePlanActivities {
    total_question?: number;
    cdr_percent?: {};
    cdr_name?: string;
    cdr_level?: number;
    require_cdr?: boolean;
    cdr_cauhoi_total?: {};
    question_take_total?: number;
    question_take?: {};
    weeks_test?: CoursePlanActivities[];
    canEdit?: boolean;
    require_question?: boolean;
    question_parts?: QuestionPart[];
    min_cdr_question?: {};
    total_question_cdr_private?: {};
}

export interface QuestionPart {
    part: string;
    stt_part: number;
    cdr_cauhoi: {};
    cdr_cauhoi_private?: {};
    question_take: {};
    question_take_private?: {};
    require_question?: boolean;
}

@Component({
    selector: 'app-phanbo-cdr-cauhoi',
    templateUrl: './phanbo-cdr-cauhoi.component.html',
    styleUrls: ['./phanbo-cdr-cauhoi.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class PhanboCdrCauhoiComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



