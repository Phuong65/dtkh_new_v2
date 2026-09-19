import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-present-question-content-single',
    templateUrl: './present-question-content-single.component.html',
    styleUrls: [ './present-question-content-single.component.css' ],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class PresentQuestionContentSingleComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



