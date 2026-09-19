import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-home-chunhiem',
    templateUrl: './home-chunhiem.component.html',
    styleUrls: ['./home-chunhiem.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class HomeChunhiemComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



