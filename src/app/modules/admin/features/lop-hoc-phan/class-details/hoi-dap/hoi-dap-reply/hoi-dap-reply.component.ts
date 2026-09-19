import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-hoi-dap-reply',
    templateUrl: './hoi-dap-reply.component.html',
    styleUrls: ['./hoi-dap-reply.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class HoiDapReplyComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



