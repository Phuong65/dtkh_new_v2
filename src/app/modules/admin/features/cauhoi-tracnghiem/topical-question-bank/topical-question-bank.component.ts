import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-topical-question-bank',
    templateUrl: './topical-question-bank.component.html',
    styleUrls: ['./topical-question-bank.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class TopicalQuestionBankComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



