import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-home-baocao',
    templateUrl: './home-baocao.component.html',
    styleUrls: ['./styles/layout.scss' ,'./home-baocao.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class HomeBaocaoComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



