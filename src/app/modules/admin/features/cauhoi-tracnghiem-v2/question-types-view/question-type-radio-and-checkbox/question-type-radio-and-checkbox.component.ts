import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-question-type-radio-and-checkbox',
    templateUrl: './question-type-radio-and-checkbox.component.html',
    styleUrls: ['./question-type-radio-and-checkbox.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class QuestionTypeRadioAndCheckboxComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



