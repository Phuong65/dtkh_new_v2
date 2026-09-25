import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-giang-vien-test',
    templateUrl: './giang-vien-test.component.html',
    styleUrls: [ './giang-vien-test.component.css' ],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class GiangVienTestComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



