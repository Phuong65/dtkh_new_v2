import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-thong-tin-co-ban',
    templateUrl: './thong-tin-co-ban.component.html',
    styleUrls: ['./thong-tin-co-ban.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class ThongTinCoBanComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



