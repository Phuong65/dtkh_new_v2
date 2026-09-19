import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HuongdanComponent } from '@modules/admin/features/huongdan/huongdan/huongdan.component';

@Component({
    selector: 'app-huong-dan-public',
    standalone: true,
    imports: [CommonModule, HuongdanComponent],
    templateUrl: './huong-dan-public.component.html',
    styleUrls: ['./huong-dan-public.component.css']
})
export class HuongDanPublicComponent implements OnInit {

    constructor() { }

    ngOnInit(): void {

    }

}
