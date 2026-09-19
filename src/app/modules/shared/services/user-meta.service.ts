import { Injectable } from '@angular/core';
import { environment, getRoute } from 'src/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Dto } from '@core/models/dto';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface UserMeta {
    id: number;
    user_id: number;
    meta_key: string;
    meta_title: string;
    meta_value: string;
    created_at: string;
    updated_at: string;
}

@Injectable({
    providedIn: 'root'
})
export class UserMetaService {

    private api = getRoute('user-meta');

    constructor(
        private http: HttpClient
    ) {

    }

    getUserMetaData(userId: number): Observable<UserMeta[]> {
        // const search = new HttpParams().set( 'user_id' , userId.toString() );
        return this.http.get<Dto>(this.api).pipe(
            map(res => res.data)
        );
    }

    getMetaData(userId: number, metaKey: string) {
        const search = new HttpParams().set('user_id', userId.toString()).set('meta_key', metaKey.toString());
        return this.http.get<Dto>(this.api, { params: search }).pipe(
            map(res => res.data)
        );
    }

    addNewMetaData(data: UserMeta): Observable<any> {
        return this.http.post(this.api, data);
    }

    updateMetaData(rowId: number, data: UserMeta): Observable<any> {
        return this.http.put(this.api.concat(rowId.toString()), data);
    }

    deleteMetaData(rowId: number): Observable<any> {
        return this.http.delete(this.api.concat('/', rowId.toString()));
    }

    getMetaDataByCols(condition: HttpParams): Observable<UserMeta[]> {
        return this.http.get<Dto>(this.api, { params: condition }).pipe(
            map(res => res.data)
        );
    }
}
