import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-bieudo-phodiem',
    templateUrl: './bieudo-phodiem.component.html',
    styleUrls: ['./bieudo-phodiem.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class BieudoPhodiemComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



