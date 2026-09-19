import { Injectable } from '@angular/core';
import {  environment, getRoute } from 'src/environments/environment';
import { HttpClient , HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Dto } from '@core/models/dto';
import { TnStudentResult } from '../../shared/models/tn-student-result';
import { map } from 'rxjs/operators';

@Injectable( {
	providedIn : 'root'
} )
export class TnStudentResultService {

    api = getRoute('ket-student-test-result/');

	constructor(
		private http : HttpClient
	) {
	}

	addTnStudentResult( data : any ) : Observable<any> {
		return this.http.post<Dto>( this.api , data ).pipe(
			map( res => res.data )
		);
	}

	updateTnStudentResult( deXuatId : number , data : any ) : Observable<any> {
		return this.http.put<Dto>( this.api.concat( deXuatId.toString() ) , data ).pipe(
			map( res => res.data )
		);
	}

	getAllTnStudentResult() : Observable<TnStudentResult[]> {
		//const filter = new HttpParams().set( 'khcn_id' , khcn_id.toString() ); { params : filter }
		return this.http.get<Dto>( this.api ).pipe(
			map( res => res.data )
		);
	}

	deleteTnStudentResult( id : number ) : Observable<any> {
		return this.http.delete<Dto>( this.api.concat( id.toString() ) ).pipe(
			map( res => res.data )
		);
	}

	getTnStudentResultByCol( col : string , item : any ) : Observable<TnStudentResult[]> {
		const filter = new HttpParams().set( 'condition' , col.concat( ',=,' , item ) );
		return this.http.get<Dto>( this.api , { params : filter } ).pipe(
			map( res => res.data )
		);
	}

	getTnStudentResultByCols( condition : HttpParams ) : Observable<TnStudentResult[]> {
		return this.http.get<Dto>( this.api , { params : condition } ).pipe(
			map( res => res.data )
		);
	}

    getTTnStudentResultByItem(email: string, col: string): Observable<TnStudentResult[]> {
		const by = new HttpParams().set( 'by' , col );
		return this.http.get<Dto>( this.api.concat( email ) , { params : by } ).pipe(
			map( res => res.data )
		);
	}
}
