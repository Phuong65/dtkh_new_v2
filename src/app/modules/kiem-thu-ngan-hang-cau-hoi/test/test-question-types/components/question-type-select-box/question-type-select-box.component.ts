import { Component, IctuTestQuestionTypeComponentBase   , OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({standalone: false, 
    selector: 'question-type-select-box',
    templateUrl: './question-type-select-box.component.html',
    styleUrls: [ './question-type-select-box.component.css' ],
})
export class QuestionTypeSelectBoxComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



