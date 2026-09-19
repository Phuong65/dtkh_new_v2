import { Injectable } from '@angular/core';
import {  environment, getRoute } from 'src/environments/environment';
import { HttpClient , HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Dto } from '@core/models/dto';
import { TnQLCathi } from '../../shared/models/tn-ql-ca-thi';
import { map } from 'rxjs/operators';

@Injectable( {
	providedIn : 'root'
} )
export class TnQLCathiService {

    api = getRoute('ket-shift/');
    apiThiKhac = ''.concat(environment.thikhacServer.api, 'shift/');
    
	constructor(
		private http : HttpClient
	) {
	}

	addTnQLCathi( data : any ) : Observable<any> {
		return this.http.post<Dto>( this.api , data ).pipe(
			map( res => res.data )
		);
	}

	updateTnQLCathi( deXuatId : number , data : any ) : Observable<any> {
		return this.http.put<Dto>( this.api.concat( deXuatId.toString() ) , data ).pipe(
			map( res => res.data )
		);
	}

	getAllTnQLCathi() : Observable<TnQLCathi[]> {
		//const filter = new HttpParams().set( 'khcn_id' , khcn_id.toString() ); { params : filter }
		return this.http.get<Dto>( this.api ).pipe(
			map( res => res.data )
		);
	}

	deleteTnQLCathi( id : number ) : Observable<any> {
		return this.http.delete<Dto>( this.api.concat( id.toString() ) ).pipe(
			map( res => res.data )
		);
	}

	getTnQLCathiByCol( col : string , item : any ) : Observable<TnQLCathi[]> {
		const filter = new HttpParams().set( 'condition' , col.concat( ',=,' , item ) );
		return this.http.get<Dto>( this.api , { params : filter } ).pipe(
			map( res => res.data )
		);
	}


    getTnQLCathiByCols(condition: HttpParams): Observable<TnQLCathi[]> {
		return this.http.get<Dto>( this.api , { params : condition } ).pipe(
			map( res => res.data )
		);
	}

	importTest( data , test_num : number, limit: string ) : Observable<any> {
		const params = new HttpParams().set( 'sinhde' , limit ).set( 'test_num' , test_num.toString() ).set( 'status' , '0' );
		return this.http.put<Dto>( this.api.concat( data.id.toString() ) , data , { params : params } ).pipe(
			map( res => res.data )
		);
    }
    
    importTestAnhvan(data, test_num: number, limit: string): Observable<any> {
        const params = new HttpParams().set("anhvan",'true').set('test_num', test_num.toString()).set('status', '0');
        return this.http.put<Dto>(this.api.concat(data.id.toString()), data, { params: params }).pipe(
            map(res => res.data)
        );
    }

	getTnQLCathiByIds( ids : string ) : Observable<TnQLCathi[]> {
		const filter = new HttpParams().set( 'id' , ids.toString() );
		return this.http.get<Dto>( this.api , { params : filter } ).pipe(
			map( res => res.data )
		);
    }
    
    /** thi khác */
    
    addTnQLCathic(data: any): Observable<any> {
        return this.http.post<Dto>(this.apiThiKhac, data).pipe(
            map(res => res.data)
        );
    }

    updateTnQLCathi_thikhac(deXuatId: number, data: any): Observable<any> {
        return this.http.put<Dto>(this.apiThiKhac.concat(deXuatId.toString()), data).pipe(
            map(res => res.data)
        );
    }

    getAllTnQLCathi_thikhac(): Observable<TnQLCathi[]> {
        //const filter = new HttpParams().set( 'khcn_id' , khcn_id.toString() ); { params : filter }
        return this.http.get<Dto>(this.apiThiKhac).pipe(
            map(res => res.data)
        );
    }

    deleteTnQLCathi_thikhac(id: number): Observable<any> {
        return this.http.delete<Dto>(this.apiThiKhac.concat(id.toString())).pipe(
            map(res => res.data)
        );
    }

    getTnQLCathiByCol_thikhac(col: string, item: any): Observable<TnQLCathi[]> {
        const filter = new HttpParams().set('condition', col.concat(',=,', item));
        return this.http.get<Dto>(this.apiThiKhac, { params: filter }).pipe(
            map(res => res.data)
        );
    }


    getTnQLCathiByCols_thikhac(condition: HttpParams): Observable<TnQLCathi[]> {
        return this.http.get<Dto>(this.apiThiKhac, { params: condition }).pipe(
            map(res => res.data)
        );
    }

    // importTest_thikhac(data, test_num: number, limit: string): Observable<any> {
    //     const params = new HttpParams().set('sinhde', limit).set('test_num', test_num.toString()).set('status', '0');
    //     return this.http.put<Dto>(this.api.concat(data.id.toString()), data, { params: params }).pipe(
    //         map(res => res.data)
    //     );
    // }

    // importTest_thikhac(data, test_num: number, limit: string): Observable<any> {
    //     const params = new HttpParams().set("anhvan", 'true').set('test_num', test_num.toString()).set('status', '0');
    //     return this.http.put<Dto>(this.api.concat(data.id.toString()), data, { params: params }).pipe(
    //         map(res => res.data)
    //     );
    // }

    getTnQLCathiByIds_thikhac(ids: string): Observable<TnQLCathi[]> {
        const filter = new HttpParams().set('id', ids.toString());
        return this.http.get<Dto>(this.apiThiKhac, { params: filter }).pipe(
            map(res => res.data)
        );
    }
}
