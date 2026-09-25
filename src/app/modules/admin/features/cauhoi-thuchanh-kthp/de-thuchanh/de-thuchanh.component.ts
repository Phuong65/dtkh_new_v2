import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-de-thuchanh',
    templateUrl: './de-thuchanh.component.html',
    styleUrls: ['./de-thuchanh.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class DeThuchanhComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



