import { Injectable } from '@angular/core';
import { LocalStoreFile } from '@modules/kiem-thu-ngan-hang-cau-hoi/models/file';
@Injectable( {
	providedIn : 'root'
} )
export class StoreService {

	private _store : Map<string , LocalStoreFile> = new Map<string , LocalStoreFile>();

	constructor() { }

	clear() : void {
		this._store.clear();
	}

	get( info : Partial<LocalStoreFile> ) : LocalStoreFile {
		if ( info.nonce ) {
			return this._store.has( info.nonce ) ? this._store.get( info.nonce ) : null;
		}
		if ( info.id && info.org ) {
			const nonce : string = info.org + '-' + info.id;
			return this._store.has( nonce ) ? this._store.get( nonce ) : null;
		}
		return null;
	}

	store( info : Pick<LocalStoreFile , 'org' | 'id' | 'url'> | Pick<LocalStoreFile , 'org' | 'id' | 'file'> | Pick<LocalStoreFile , 'org' | 'id' | 'url' | 'file'> ) : void {
		const nonce : string = info.org + '-' + info.id;
		if ( nonce ) {
			this._store.set( nonce , Object.assign<LocalStoreFile , Partial<LocalStoreFile>>( { nonce , org : '' , id : '' , url : '' , file : null } , info ) );
		}
	}
}
