import {Injectable} from '@angular/core';
import {environment, getRoute} from 'src/environments/environment';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Dto, OvicConditionParam, OvicQueryCondition} from '@core/models/dto';
import {TnStudent} from '../../shared/models/tn-student';
import {map} from 'rxjs/operators';
import {HttpParamsHeplerService} from "@core/services/http-params-hepler.service";

@Injectable({
    providedIn: 'root'
})
export class TnStudentService {

    api = getRoute('ket-student/');
    api_thikhac = ''.concat(environment.thikhacServer.api, 'student/');
    // apiLcms = ''.concat(environment.lcmsServer.api, 'user-profile/');
    constructor(
        private http: HttpClient,
        private httpParamsHelper:HttpParamsHeplerService
    ) {
    }

    addTnStudent(data: any): Observable<any> {
        return this.http.post<Dto>(this.api, data).pipe(
            map(res => res.data)
        );
    }

    updateTnStudent(deXuatId: number, data: any): Observable<any> {
        return this.http.put<Dto>(this.api.concat(deXuatId.toString()), data).pipe(
            map(res => res.data)
        );
    }

    getAllTnStudent(): Observable<TnStudent[]> {
        //const filter = new HttpParams().set( 'khcn_id' , khcn_id.toString() ); { params : filter }
        return this.http.get<Dto>(this.api).pipe(
            map(res => res.data)
        );
    }

    deleteTnStudent(id: number): Observable<any> {
        return this.http.delete<Dto>(this.api.concat(id.toString())).pipe(
            map(res => res.data)
        );
    }

    getTnStudentByCol(col: string, item: any): Observable<TnStudent[]> {
        const filter = new HttpParams().set('condition', col.concat(',=,', item));
        return this.http.get<Dto>(this.api, { params: filter }).pipe(
            map(res => res.data)
        );
    }

    getTnStudentByCols(condition: HttpParams): Observable<TnStudent[]> {
        return this.http.get<Dto>(this.api, { params: condition }).pipe(
            map(res => res.data)
        );
    }

    getTnStudentByItem(email: string, col: string): Observable<TnStudent[]> {
        const by = new HttpParams().set('condition', col.concat(',=,', email)).set("limit", -1);
        return this.http.get<Dto>(this.api.concat(email), { params: by }).pipe(
            map(res => res.data)
        );
    }

    deleteTnStudentByEmail(email: string): Observable<any> {
        const by = new HttpParams().set('by', 'email');
        return this.http.delete<Dto>(this.api.concat(email), { params: by }).pipe(
            map(res => res.data)
        );
    }

    getAllLcmsProfile(): Observable<TnStudent[]> {
        //const filter = new HttpParams().set( 'khcn_id' , khcn_id.toString() ); { params : filter }
        return this.http.get<Dto>(this.api).pipe(
            map(res => res.data)
        );
    }

    /** thi khác */

    addTnStudent_thikhac(data: any): Observable<any> {
        return this.http.post<Dto>(this.api_thikhac, data).pipe(
            map(res => res.data)
        );
    }

    updateTnStudent_thikhac(deXuatId: number, data: any): Observable<any> {
        return this.http.put<Dto>(this.api_thikhac.concat(deXuatId.toString()), data).pipe(
            map(res => res.data)
        );
    }

    getAllTnStudent_thikhac(): Observable<TnStudent[]> {
        //const filter = new HttpParams().set( 'khcn_id' , khcn_id.toString() ); { params : filter }
        return this.http.get<Dto>(this.api_thikhac).pipe(
            map(res => res.data)
        );
    }

    deleteTnStudent_thikhac(id: number): Observable<any> {
        return this.http.delete<Dto>(this.api_thikhac.concat(id.toString())).pipe(
            map(res => res.data)
        );
    }

    getTnStudentByCol_thikhac(col: string, item: any): Observable<TnStudent[]> {
        const filter = new HttpParams().set('condition', col.concat(',=,', item));
        return this.http.get<Dto>(this.api_thikhac, { params: filter }).pipe(
            map(res => res.data)
        );
    }

    getTnStudentByCols_thikhac(condition: HttpParams): Observable<TnStudent[]> {
        return this.http.get<Dto>(this.api_thikhac, { params: condition }).pipe(
            map(res => res.data)
        );
    }

    getTnStudentByItem_thikhac(email: string, col: string): Observable<TnStudent[]> {
        const by = new HttpParams().set('condition', col.concat(',=,', email)).set("limit", -1);
        return this.http.get<Dto>(this.api_thikhac.concat(email), { params: by }).pipe(
            map(res => res.data)
        );
    }

    deleteTnStudentByEmail_thikhac(email: string): Observable<any> {
        const by = new HttpParams().set('by', 'email');
        return this.http.delete<Dto>(this.api_thikhac.concat(email), { params: by }).pipe(
            map(res => res.data)
        );
    }

    getAllLcmsProfile_thikhac(): Observable<TnStudent[]> {
        //const filter = new HttpParams().set( 'khcn_id' , khcn_id.toString() ); { params : filter }
        return this.http.get<Dto>(this.api_thikhac).pipe(
            map(res => res.data)
        );
    }


}
