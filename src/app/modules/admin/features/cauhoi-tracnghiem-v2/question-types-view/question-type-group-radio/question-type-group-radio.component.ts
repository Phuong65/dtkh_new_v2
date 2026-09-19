import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-question-type-group-radio',
    templateUrl: './question-type-group-radio.component.html',
    styleUrls: ['./question-type-group-radio.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class QuestionTypeGroupRadioComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



