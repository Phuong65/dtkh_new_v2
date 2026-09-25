import { Component , Input , OnChanges , OnInit , SimpleChanges } from '@angular/core';
import { OvicFile , SimpleFileLocal , FileLocalPermission , OvicTinyDriveFile } from '@core/models/file';
import { FileService , gDUploadRes } from '@core/services/file.service';
import { MediaService } from '@shared/services/media.service';
import { AbstractControl } from '@angular/forms';
import { catchError , map , switchMap , takeWhile } from 'rxjs/operators';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { DownloadProcess } from '@shared/components/ovic-download-progress/ovic-download-progress.component';
import { Observable , of , Subject } from 'rxjs';
import { CLOUD_STORAGE_KEY } from '../../../../../environments/environment.prod';
import { CommonModule } from '@angular/common';
import { OvicFileIconPipe } from '../../pipes/ovic-file-icon.pipe';

@Component( {standalone: true, 
	selector    : 'app-file-list-local' ,
	templateUrl : './file-list-local.component.html' ,
	styleUrls   : [ './file-list-local.component.css' ],
 imports: [CommonModule, OvicFileIconPipe]
} )
export class FileListLocalComponent implements OnInit , OnChanges {

	@Input() emptyMess = 'Không có file đính kèm';

	@Input() permission : FileLocalPermission;

	@Input() formField : AbstractControl;

	@Input() files : SimpleFileLocal[] | any;

	@Input() accept = []; // only file extension eg. .jpg, .png, .jpeg, .gif, .pdf

	@Input() multiple = true;

	@Input() serverFile : 'Drive' | 'Local' = 'Local';

	@Input() publicAfterUploaded = false; // available with drive storage type

	// @Input() accept = 'all'; // .jpg, .png, .jpeg, .gif, .bmp, .tif, .tiff|image/*  accept="audio/*|video/*|image/*|MIME_type"

	fileList : SimpleFileLocal[];

	_accept = '';

	private _temp : File[] = []; // lưu trữu file tạm thời, trường hợp cần tạo thư mục lưu trũ trước

	checking = true;

	constructor(
		private fileService : FileService ,
		private mediaService : MediaService ,
		private auth : AuthService ,
		private notificationService : NotificationService
	) {
	}

	ngOnChanges( changes : SimpleChanges ) : void {
		if ( changes[ 'accept' ] ) {
			if ( this.accept && this.accept.length ) {
				this._accept = this.accept.join( ',' );
			}
		}
		if ( changes[ 'files' ] ) {
			if ( this.files && this.files.length ) {
				this.fileList = this.files.map( file => {
					file[ 'file_size' ] = file.size ? this.fileService.formatBytes( file.size ) : '0b';
					return file;
				} );
			} else {
				this.fileList = [];
			}
		}
	}

	ngOnInit() : void {
		// this.formField.valueChanges.pipe( filter( t => t && Array.isArray( t ) ) ).subscribe( ( files : SimpleFileLocal[] ) => {
		// 	this.fileList = files.map( file => {
		// 		file[ 'file_size' ] = file.size ? this.fileService.formatBytes( file.size ) : '0b';
		// 		return file;
		// 	} );
		// } );
		if ( this.formField ) {
			this.formField.valueChanges.pipe( map( t => ( t && Array.isArray( t ) ) ? t : [] ) ).subscribe( ( files : SimpleFileLocal[] ) => {
				this.fileList = files.map( file => {
					file[ 'file_size' ] = file.size ? this.fileService.formatBytes( file.size ) : '0b';
					return file;
				} );
			} );

			if ( this.formField.value && Array.isArray( this.formField.value ) ) {
				this.fileList = this.formField.value.map( file => {
					file[ 'file_size' ] = file.size ? this.fileService.formatBytes( file.size ) : '0b';
					return file;
				} );
			}
		}
		if ( this.files && this.files.length ) {
			this.fileList = this.files.map( file => {
				file[ 'file_size' ] = file.size ? this.fileService.formatBytes( file.size ) : '0b';
				return file;
			} );
		}
		if ( this.accept && this.accept.length ) {
			this._accept = this.accept.join( ',' );
		}

		if ( this.serverFile === 'Drive' ) {
			const check : Observable<string> = localStorage.getItem( CLOUD_STORAGE_KEY ) ? of( localStorage.getItem( CLOUD_STORAGE_KEY ) ) : this.fileService.createFolderStorage();
			check.subscribe( ( id ) => {
				localStorage.setItem( CLOUD_STORAGE_KEY , id );
				this.checking = false;
			} );
		} else {
			this.checking = false;
		}

	}

	// get _key() : string {
	// 	// return '__QmuEG_9UQ' + this.auth.user.id;
	// 	return CLOUD_STORAGE_KEY;
	// }

	get storageParentId() : string {
		return localStorage.getItem( CLOUD_STORAGE_KEY );
	}

	removeFile( file : SimpleFileLocal ) {

	}

	async btnDownloadFile( file : SimpleFileLocal ) {
		const result = await this.mediaService.tplDownloadFile( file as OvicFile );
		switch ( result ) {
			case DownloadProcess.rejected:
				this.notificationService.toastInfo( 'Chưa hỗ trợ tải xuống thư mục' );
				break;
			case DownloadProcess.error:
				this.notificationService.toastError( 'Tải xuống thất bại' );
				break;
		}
	}

	btnDeleteFile( file : SimpleFileLocal ) {
		if ( this.formField ) {
			const value = JSON.parse( JSON.stringify( this.formField.value ) ).filter( f => f.id !== file.id );
			this.formField.setValue( value );
		}

	}

	async addMoreFile() {

	}

	onSelectFiles( event : Event ) {
		this._temp = [];
		if ( event.target[ 'files' ].length ) {
			const length                           = event.target[ 'files' ].length;
			let dem                                = 0;
			const fileUploaded : SimpleFileLocal[] = [];
			this.notificationService.isProcessing( true );
			for ( let i = 0 ; i < length ; i++ ) {
				const file = event.target[ 'files' ][ i ];
				this._temp.push( file );
				// setTimeout( () => this.fileService.uploadFile( file , this.auth.userDonViId , this.auth.user.id ).subscribe( {
				// 	next  : ( f ) => {
				// 		fileUploaded.push( {
				// 			id    : f.id ,
				// 			name  : f.name ,
				// 			title : f.title ,
				// 			ext   : f.ext ,
				// 			type  : f.type ,
				// 			size  : f.size
				// 		} );
				// 		if ( ++dem === length ) {
				// 			this.notificationService.isProcessing( false );
				// 			if ( this.formField.value && Array.isArray( this.formField.value ) ) {
				// 				const value = JSON.parse( JSON.stringify( this.formField.value ) );
				// 				this.formField.setValue( [].concat( value , fileUploaded ) );
				// 			} else {
				// 				this.formField.setValue( fileUploaded );
				// 			}
				// 		}
				// 	} ,
				// 	error : () => {
				// 		if ( ++dem === length ) {
				// 			this.notificationService.isProcessing( false );
				// 			if ( this.formField.value && Array.isArray( this.formField.value ) ) {
				// 				const value = JSON.parse( JSON.stringify( this.formField.value ) );
				// 				this.formField.setValue( [].concat( value , fileUploaded ) );
				// 			} else {
				// 				this.formField.setValue( fileUploaded );
				// 			}
				// 		}
				// 	}
				// } ) , i * 50 );
			}

			this.__startUploadingFiles();
		}
	}

	private __startUploadingFiles() {
		if ( this._temp ) {
			const streamFiles = new Subject<File>();
			let index         = 0;
			const uploaded : {
				id : number | string,
				name : string,
				title : string,
				ext : string,
				type : string,
				size : number,
				webContentLink? : string,
				webViewLink? : string,
				shared? : boolean,
			}[]               = [];
			this.notificationService.isProcessing( true );
			streamFiles.asObservable().pipe( switchMap( ( file ) => this.getUploadFileStream( file ) ) , takeWhile( ( { streamOpen } ) => streamOpen ) ).subscribe( {
				next     : ( { file } ) => {
					if ( typeof file.id === 'number' ) {
						const _file = file as OvicFile;
						uploaded.push( {
							id    : _file.id ,
							name  : _file.name ,
							title : _file.title ,
							ext   : _file.ext ,
							type  : _file.type ,
							size  : _file.size
						} );
					} else {
						const _file = file as OvicTinyDriveFile;
						uploaded.push( {
							id             : _file.id ,
							name           : _file.name ,
							title          : _file.name ,
							ext            : _file.fileExtension ,
							type           : _file.mimeType ,
							size           : parseInt( _file.size , 10 ) ,
							shared         : _file.shared ,
							webContentLink : _file.webContentLink ,
							webViewLink    : _file.webViewLink
						} );
					}
					streamFiles.next( this._temp[ ++index ] );
				} ,
				complete : () => {
					if ( this.formField.value && Array.isArray( this.formField.value ) ) {
						const value = JSON.parse( JSON.stringify( this.formField.value ) );
						this.formField.setValue( [].concat( value , uploaded ) );
					} else {
						this.formField.setValue( uploaded );
					}
					this.notificationService.isProcessing( false );
				} ,
				error    : () => this.notificationService.isProcessing( false )
			} );

			streamFiles.next( this._temp[ index ] );
		}
	}


	private getUploadFileStream( file : File ) : Observable<{ file : OvicFile | OvicTinyDriveFile, streamOpen : boolean, index : number }> {
		if ( !file ) {
			return of( { file : null , streamOpen : false , index : 0 } );
		}
		let uploader : Observable<OvicFile | OvicTinyDriveFile>;// = this.serverFile === 'Local' ? this.fileService.uploadFile( file , this.auth.userDonViId , this.auth.user.id ) : this.fileService.gdUploadFile( file , parentId );
		if ( this.serverFile === 'Local' ) {
			uploader = this.fileService.uploadFile( file , this.auth.userDonViId , this.auth.user.id );
		} else {
			uploader = this.fileService.gdUploadFile( file , this.storageParentId ).pipe(
				switchMap( res => this.__checkPublicFile( res ) ) ,
				map( res => ( res.data ? {
					id             : res.data[ 0 ].id ,
					name           : res.data[ 0 ].name ,
					title          : res.data[ 0 ].originalFilename ,
					shared         : res.data[ 0 ].shared ,
					fileExtension  : res.data[ 0 ].fileExtension ,
					mimeType       : res.data[ 0 ].mimeType ,
					size           : res.data[ 0 ].size ,
					webContentLink : res.data[ 0 ].webContentLink ,
					webViewLink    : res.data[ 0 ].webViewLink
				} : null ) )
			);
		}
		return uploader.pipe(
			map( file => ( { file , streamOpen : true , index : 0 } ) ) ,
			catchError( () => of( { file : null , streamOpen : true , index : 0 } ) )
		);
	}

	private __checkPublicFile( res : gDUploadRes ) : Observable<gDUploadRes> {
		return this.publicAfterUploaded && res.data[ 0 ]?.id ? this.fileService.gdShare( res.data[ 0 ].id ).pipe( map( u => {
			res.data[ 0 ].shared = true;
			return res;
		} ) ) : of( res );
	}
}
