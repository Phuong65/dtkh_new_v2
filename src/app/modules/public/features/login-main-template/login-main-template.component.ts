import { Component, OnInit } from '@angular/core';
import { key_server } from '@env';

@Component({
    selector: 'app-login-main-template',
    templateUrl: './login-main-template.component.html',
    styleUrls: ['./login-main-template.component.css']
})
export class LoginMainTemplateComponent implements OnInit {

    acceptDivi = true;
    key_server = key_server;
    
    constructor() {
        // if (window.innerWidth >= 1024) {
        //     this.acceptDivi = true;
        // }
    }

    ngOnInit(): void {

    }

}
