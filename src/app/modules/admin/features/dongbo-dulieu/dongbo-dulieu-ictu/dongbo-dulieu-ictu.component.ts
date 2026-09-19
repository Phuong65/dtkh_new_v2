import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-dongbo-dulieu-ictu',
    templateUrl: './dongbo-dulieu-ictu.component.html',
    styleUrls: ['./dongbo-dulieu-ictu.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class DongboDulieuIctuComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



