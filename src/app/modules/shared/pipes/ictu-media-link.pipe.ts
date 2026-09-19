import { Pipe , PipeTransform } from '@angular/core';
import { getLinkDownload , getLinkDownload_aws } from '@env';

type IctuSourceFilesSupported = 'serverAws' | 'serverFile';

@Pipe( {
	name       : 'ictuMediaLink' ,
	standalone : true
} )
export class IctuMediaLinkPipe implements PipeTransform {

	private _resource : Record<IctuSourceFilesSupported , ( id : string , accessToken : string ) => string> = {
		serverAws  : ( id : string , token : string ) : string => {
			const urlObject : URL = new URL( getLinkDownload_aws( id ) );
			urlObject.searchParams.append( 'token' , token );
			return urlObject.toString();
		} ,
		serverFile : ( id : string , token : string ) : string => {
			const urlObject : URL = new URL( getLinkDownload( id ) );
			urlObject.searchParams.append( 'token' , token );
			return urlObject.toString();
		}
	};

	transform( path : string , source : IctuSourceFilesSupported | string , token : string ) : string {
		return path && source && source in this._resource ? this._resource[ source ]( path , token ) : '';
	}

}
