
import { Injectable } from '@angular/core';
import {  environment, getDateTime, getRoute } from 'src/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Dto } from '@core/models/dto';
import { map } from 'rxjs/operators';
import { OvicDateTime } from '../models/classes';

@Injectable({
    providedIn: 'root'
})
    
export class OvicDateTimeService {

    private API = getDateTime('datetime');

    constructor(
        private http: HttpClient
    ) { }

    getCurrentTime(): Observable<number> {
        return this.http.get<OvicDateTime>(this.API).pipe(map(res => res.timestamps));
    }

    getCurrentDateTime(): Observable<Date> {
        return this.http.get<OvicDateTime>(this.API).pipe(map(res => new Date(res.date)));
    }

    getCurrentDateTimeRaw(): Observable<OvicDateTime> {
        return this.http.get<OvicDateTime>(this.API);
    }
}