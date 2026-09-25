import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-hoi-dap',
    templateUrl: './hoi-dap.component.html',
    styleUrls: ['./hoi-dap.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class HoiDapComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



