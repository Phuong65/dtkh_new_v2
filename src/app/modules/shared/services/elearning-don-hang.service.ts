import { Injectable } from '@angular/core';
import {  environment, getRoute } from 'src/environments/environment';
import { HttpClient , HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Dto } from '@core/models/dto';
import { ElnDonHang } from '../../shared/models/elng-don-hang';
import { map } from 'rxjs/operators';

@Injectable ( {
	providedIn : 'root'
} )
export class ElnDonHangService {

	api = getRoute( 'order/' );

	constructor (
		private http : HttpClient
	) {
	}

	addElnDonHang ( data : any ) : Observable<any> {
		return this.http.post<Dto> ( this.api , data ).pipe (
			map ( res => res.data )
		);
	}

	updateElnDonHang ( deXuatId : number , data : any ) : Observable<any> {
		return this.http.put<Dto> ( this.api.concat ( deXuatId.toString () ) , data ).pipe (
			map ( res => res.data )
		);
	}

	getAllElnDonHangByUserCreate ( user_id : number ) : Observable<ElnDonHang[]> {
		return this.http.get<Dto> ( this.api.concat ( '?condition=creator_id,=,' , user_id.toString () ) ).pipe (
			map ( res => res.data )
		);
	}

	getAllElnDonHang () : Observable<ElnDonHang[]> {
		//const filter = new HttpParams().set( 'khcn_id' , khcn_id.toString() ); { params : filter }
		return this.http.get<Dto> ( this.api ).pipe (
			map ( res => res.data )
		);
	}

	deleteElnDonHang ( id : number ) : Observable<any> {
		return this.http.delete<Dto> ( this.api.concat ( id.toString () ) ).pipe (
			map ( res => res.data )
		);
	}

	getElnDonHangByCol ( col : string , item : string ) : Observable<ElnDonHang[]> {
		const filter = new HttpParams ().set ( 'condition' , col.concat ( ',=,' , item ) );
		return this.http.get<Dto> ( this.api , { params : filter } ).pipe (
			map ( res => res.data )
		);
	}
}
