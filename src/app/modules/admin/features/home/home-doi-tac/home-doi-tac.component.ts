import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-home-doi-tac',
    templateUrl: './home-doi-tac.component.html',
    styleUrls: ['./home-doi-tac.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class HomeDoiTacComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



