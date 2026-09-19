import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-huongdan',
    templateUrl: './huongdan.component.html',
    styleUrls: ['./huongdan.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class HuongdanComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



