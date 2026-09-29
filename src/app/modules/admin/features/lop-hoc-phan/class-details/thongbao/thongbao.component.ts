import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-thongbao',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './thongbao.component.html',
    styleUrls: ['./thongbao.component.css']
})
export class ThongbaoComponent implements OnInit {

    constructor () {}

    ngOnInit(): void {
    }

}
