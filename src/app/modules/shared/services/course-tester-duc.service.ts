import {Injectable} from '@angular/core';
import {environment, getRoute} from 'src/environments/environment';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Dto} from '@core/models/dto';
import {CourseTesters} from '../../shared/models/course-testers';
import {map} from 'rxjs/operators';
import {ConditionOption} from '../models/condition-option';
import {HttpParamsHeplerService} from '@core/services/http-params-hepler.service';

@Injectable( {
    providedIn: 'root'
} )
export class CourseTesterDucService {

    api = getRoute( 'course-testers/' );

    constructor (
        private http: HttpClient,
        private httpHelper: HttpParamsHeplerService
    ) {
    }

    addCourseTester( data: any ): Observable<any> {
        return this.http.post<Dto>( this.api, data ).pipe(
            map( res => res.data )
        );
    }

    updateCourseTester( deXuatId: number, data: any ): Observable<any> {
        return this.http.put<Dto>( this.api.concat( deXuatId.toString() ), data ).pipe(
            map( res => res.data )
        );
    }


    getAllCourseTester(): Observable<CourseTesters[]> {
        //const filter = new HttpParams().set( 'khcn_id' , khcn_id.toString() ); { params : filter }
        return this.http.get<Dto>( this.api ).pipe(
            map( res => res.data )
        );
    }

    deleteCourseTester( ids: any ): Observable<any> {
        return this.http.delete<Dto>( this.api.concat( ids ) ).pipe(
            map( res => res.data )
        );
    }

    getCourseTesterByCol( col: string, item: any ): Observable<CourseTesters[]> {
        const filter = new HttpParams().set( 'condition', col.concat( ',=,', item ) ).set( "limit", -1 );
        return this.http.get<Dto>( this.api, {params: filter} ).pipe(
            map( res => res.data )
        );
    }
    getCourseTesterByCols( condition: HttpParams ): Observable<CourseTesters[]> {
        return this.http.get<Dto>( this.api, {params: condition} ).pipe(
            map( res => res.data )
        );
    }

    deleteCourseTesterBy( col: string, item: string ): Observable<any> {
        const by = new HttpParams().set( 'by', col );
        return this.http.delete<Dto>( this.api.concat( item.toString() ), {params: by} );
    }

    getCourseTesterByPageNew( option: ConditionOption ): Observable<{data: CourseTesters[], recordsFiltered: number}> {
        let filter = option.page ? this.httpHelper.paramsConditionBuilder( option.condition ).set( "paged", option.page ) : this.httpHelper.paramsConditionBuilder( option.condition );
        if ( option.set && option.set.length )
            option.set.forEach( f => {
                filter = filter.set( f.label, f.value );
            } )
        return this.http.get<Dto>( this.api, {params: filter} ).pipe(
            map( res => {return {data: res.data, recordsFiltered: res.recordsFiltered}} )
        );
    }
}
