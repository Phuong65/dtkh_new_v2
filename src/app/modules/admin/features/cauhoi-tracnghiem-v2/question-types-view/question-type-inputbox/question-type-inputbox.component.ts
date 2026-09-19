import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-question-type-inputbox',
    templateUrl: './question-type-inputbox.component.html',
    styleUrls: ['./question-type-inputbox.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class QuestionTypeInputboxComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



