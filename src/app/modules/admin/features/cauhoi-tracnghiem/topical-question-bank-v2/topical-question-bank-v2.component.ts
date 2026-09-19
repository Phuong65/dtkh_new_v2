import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-topical-question-bank-v2',
    templateUrl: './topical-question-bank-v2.component.html',
    styleUrls: ['./topical-question-bank-v2.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class TopicalQuestionBankV2Component implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



