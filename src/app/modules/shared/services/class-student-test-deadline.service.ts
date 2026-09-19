import { Injectable } from '@angular/core';
import { environment, getRoute } from 'src/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Dto } from '@core/models/dto';
import { ClassStudentTestDeadline } from '../models/class-student-test-deadline';
import { map } from 'rxjs/operators';
import { ConditionOption } from '../models/condition-option';
import { Tuyensinh } from '../models/tuyensinh';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';

@Injectable( {
    providedIn: 'root'
} )
export class ClassStudentTestDeadlineService {

    api = getRoute( 'class-student-test-deadline/' );

    constructor (
        private http: HttpClient,
        private httpHelper: HttpParamsHeplerService
    ) {
    }

    addClassStudentTestDeadline ( data: any ): Observable<any> {
        return this.http.post<Dto>( this.api, data ).pipe(
            map( res => res.data )
        );
    }

    updateClassStudentTestDeadline ( deXuatId: number, data: any ): Observable<any> {
        return this.http.put<Dto>( this.api.concat( deXuatId.toString() ), data ).pipe(
            map( res => res.data )
        );
    }

    getAllClassStudentTestDeadline (): Observable<ClassStudentTestDeadline[]> {
        //const filter = new HttpParams().set( 'khcn_id' , khcn_id.toString() ); { params : filter }
        return this.http.get<Dto>( this.api ).pipe(
            map( res => res.data )
        );
    }

    deleteClassStudentTestDeadline ( id: number ): Observable<any> {
        return this.http.delete<Dto>( this.api.concat( id.toString() ) ).pipe(
            map( res => res.data )
        );
    }


    getClassStudentTestDeadlineByCol ( col: string, item: any ): Observable<ClassStudentTestDeadline[]> {
        const filter = new HttpParams().set( 'condition', col.concat( ',=,', item ) ).set( "limit", -1 );
        return this.http.get<Dto>( this.api, { params: filter } ).pipe(
            map( res => res.data )
        );
    }

    getClassStudentTestDeadlineByCols ( condition: HttpParams ): Observable<ClassStudentTestDeadline[]> {
        return this.http.get<Dto>( this.api, { params: condition } ).pipe(
            map( res => res.data )
        );
    }
    getClassStudentTestDeadlineByItem ( item: string, col: string ): Observable<any> {
        const by = new HttpParams().set( 'by', col );
        return this.http.get<Dto>( this.api.concat( item ), { params: by } ).pipe(
            map( res => res.data )
        );
    }

    getClassStudentTestDeadlineByPageNew ( option: ConditionOption ): Observable<{ data: ClassStudentTestDeadline[], recordsFiltered: number }> {
        let filter = option.page ? this.httpHelper.paramsConditionBuilder( option.condition ).set( "paged", option.page ) : this.httpHelper.paramsConditionBuilder( option.condition );
        if ( option.set && option.set.length )
            option.set.forEach( f => {
                filter = filter.set( f.label, f.value );
            } )
        return this.http.get<Dto>( this.api, { params: filter } ).pipe(
            map( res => { return { data: res.data, recordsFiltered: res.recordsFiltered } } )
        );
    }
}
