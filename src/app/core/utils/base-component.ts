import { BehaviorSubject , defer , Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { NgPaginateEvent } from '@shared/models/ovic-models';

type LoaderState = 'error' | 'success' | 'loading';

export abstract class BaseComponent {

	public recordsTotal = 0;

	public tblIndex = 1;

	public paged = 1;

	public rows = 20;

	public states$ = new BehaviorSubject<LoaderState>( 'loading' );

	public observerLoadingState<T>() : ( source : Observable<T> ) => Observable<T> {
		return source => {
			return defer( () => {
				this.states$.next( 'loading' );
				return source.pipe(
					tap( {
						next  : () => this.states$.next( 'success' ) ,
						error : () => this.states$.next( 'error' )
					} )
				);
			} );
		};
	}

	public paginate( { page } : NgPaginateEvent ) {
		this.paged    = page + 1;
		this.tblIndex = ( this.paged * Math.max( this.rows , 1 ) ) - Math.max( this.rows , 1 ) + 1;
		this.loadData( this.paged );
	}

	public loadData( paged : number ) {}
}
