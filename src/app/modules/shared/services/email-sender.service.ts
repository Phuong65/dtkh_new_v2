import { Injectable } from '@angular/core';
import {  environment, getRoute } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface OvicEmailObject {
    name : string;
    to : string | string[];
    title : string;
    message : string; //html template
}

@Injectable( {
    providedIn : 'root'
} )
export class EmailSenderService {

    private api = getRoute( 'email/' );

    private isRealEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

    constructor(
        private http : HttpClient
    ) { }

    sendEmail( body : OvicEmailObject ) : Observable<any> {
        return this.http.post( this.api , body );
    }

    validateEmail( email : string ) : boolean {
        return email ? this.isRealEmail.test( email.toLowerCase() ) : false;
    }
}
