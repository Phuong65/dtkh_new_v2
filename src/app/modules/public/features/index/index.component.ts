import { Component , OnInit , TemplateRef , ViewChild } from '@angular/core';
import { CHUC_VU , QuyetDinh , QuyetDinhHocVien } from '@shared/models/quyet-dinh';
import { QueryQuyetDinhHocVien , QuyetDinhHocVienService , SearchQuyetDinhHocVienOptions } from '@shared/services/quyet-dinh-hoc-vien.service';
import { debounceTime , Observable , of , Subject , Subscription , switchMap } from 'rxjs';
import { AGENCIES , ENABLE_SELECT_AGENCY } from '@env';
import { AbstractControl , FormBuilder , ValidationErrors , ValidatorFn , Validators } from '@angular/forms';
import { Paginator } from 'primeng/paginator';
import { HelperService } from '@core/services/helper.service';
import { NotificationService } from '@core/services/notification.service';
import { DanhMucService } from '@shared/services/danh-muc.service';
import { QuyetDinhService } from '@shared/services/quyet-dinh.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { filter , map } from 'rxjs/operators';
import { NgbModalOptions } from '@ng-bootstrap/ng-bootstrap/modal/modal-config';
import { DropdownFilterOptions } from 'primeng/dropdown';
import { NgPaginateEvent } from '@shared/models/ovic-models';
import { FormGroup } from '@angular/forms';

interface AgencyOption {
	id : number,
	name : string
	logo : string
}

@Component( {
	selector    : 'app-index' ,
	templateUrl : './index.component.html' ,
	styleUrls   : [ './index.component.css' ]
} )
export class IndexComponent implements OnInit {

	studentActive : QuyetDinhHocVien;

	decision : QuyetDinh;

	dsHocVien : QuyetDinhHocVien[];

	dmNganhMap : Map<string , string>;

	isLoading = false;

	// queryObject : { data : SearchQuyetDinhHocVienOptions, dirty : boolean } = {
	// 	dirty : true ,
	// 	data  : { field : 'sohieu_vbcc' , search : '' , paged : 1 , limit : 5 , ngaysinh : '' }
	// };

	subscription = new Subscription();

	private OBSERVE_SEARCH_DATA = new Subject<QueryQuyetDinhHocVien>();

	enableSelectAgency = ENABLE_SELECT_AGENCY;

	activeAgency : AgencyOption = AGENCIES[ 0 ];

	agencies : AgencyOption[] = AGENCIES;

	filterValue : '';

	tableIndex = 0;

	recordsTotal = 0;

	@ViewChild( Paginator ) paginator : Paginator;

	@ViewChild( 'showFormData' ) showFormData : TemplateRef<any>;

	listChuVuMap : Map<string , string>;

	regexYears = /[12][0-9]{3}/gi;

	regexDMY = /\d{1,2}\/\d{1,2}\/\d{4}/gi;

	pluck = 'id,donvi_id,quyetdinh_id,mahocvien,hovaten,ngaysinh,gioitinh,noisinh,dantoc,quoctich,nganhhoc,chuyenganh,namtn,nienkhoa,hinhthuc_daotao,loai_vbcc,xeploai,sohieu_vbcc,sovaoso,khoa_lop,quyetdinh_hodong,ngay_baove';

	formGroup : FormGroup;

	constructor(
		private helperService : HelperService ,
		private notificationService : NotificationService ,
		private danhMucService : DanhMucService ,
		private quyetDinhHocVienService : QuyetDinhHocVienService ,
		private quyetDinhService : QuyetDinhService ,
		private fb : FormBuilder ,
		private modalService : NgbModal
	) {
		const observeSearchData = this.OBSERVE_SEARCH_DATA.asObservable().pipe( debounceTime( 100 ) ).subscribe( ( vars ) => this.__search( vars ) );
		this.subscription.add( observeSearchData );
		this.listChuVuMap = CHUC_VU.reduce( ( collector , { value , label } ) => collector.set( value , label ) , new Map<string , string> );
		this.formGroup    = this.fb.group( {
			paged    : 1 ,
			limit    : 10 ,
			field    : [ 'sohieu_vbcc' ] ,
			search   : [ '' , [ Validators.required ] ] ,
			ngaysinh : [ '' , [ Validators.required ] ] ,
			donvi_id : this.activeAgency.id ,
			pluck    : this.pluck
		} );
	}

	ngOnInit() {
		this.f[ 'ngaysinh' ].valueChanges.pipe( debounceTime( 100 ) ).subscribe( value => {
			this.f[ 'ngaysinh' ].setValue( value ? value.replace( /[.\-]/gi , '/' ) : value , { emitEvent : false , onlySelf : false } );
		} );
	}

	get f() : { [ key : string ] : AbstractControl<any> } {
		return this.formGroup.controls;
	}

	dmyDateFormatOrFullYearsValidator( regExp1 : RegExp , regExp2 : RegExp ) : ValidatorFn {
		return ( control : AbstractControl ) : ValidationErrors | null => {
			return regExp1.test( control.value ) || regExp2.test( control.value ) ? null : { errorName : { value : control.value } };
		};
	}

	setFilterBy( field : 'cccd' | 'sohieu_vbcc' | 'mahocvien' ) {
		this.f[ 'field' ].setValue( field );
	}

	changeAgency( { id } : AgencyOption ) {
		this.f[ 'donvi_id' ].setValue( id );
	}

	searchData() {
		if ( this.formGroup.valid ) {
			this.OBSERVE_SEARCH_DATA.next( this.formGroup.value );
		} else {
			this.formGroup.markAllAsTouched();
		}
	}

	private __search( vars : QueryQuyetDinhHocVien ) {
		if ( this.paginator ) {
			this.paginator.changePage( 0 );
			this.f[ 'paged' ].setValue( 1 );
		}
		this.__queryData( this.formGroup.value );
	}

	private __queryData( vars : QueryQuyetDinhHocVien ) {
		this.isLoading                           = true;
		const preLoadCategory$ : Observable<any> = this.dmNganhMap ? of( '' ) : this.danhMucService.get( 1 , 'nganh' , { donvi_id : vars.donvi_id , limit : -1 , orderby : 'ordering' , order : 'ASC' , pluck : 'name,code' } ).pipe( map( ( { data } ) => {
			this.dmNganhMap = data ? data.reduce( ( collector , { name , code } ) => {
				collector.set( code , name );
				return collector;
			} , new Map<string , string>() ) : new Map<string , string>();
		} ) );
		preLoadCategory$.pipe( switchMap( () => this.quyetDinhHocVienService.query( vars ) ) ).subscribe( {
			next  : ( { data , recordsTotal } ) => {
				this.tableIndex   = ( this.f[ 'paged' ].value * Math.max( this.f[ 'limit' ].value , 1 ) ) - Math.max( this.f[ 'limit' ].value , 1 ) + 1;
				this.recordsTotal = recordsTotal;
				this.dsHocVien    = data.map( u => {
					const _u           = u.ngaysinh ? u.ngaysinh.split( '/' ) : [];
					u[ 'namsinh' ]     = _u && _u[ 2 ] ? _u[ 2 ] : '';
					u[ '__loai_vbcc' ] = u.loai_vbcc ? this.helperService.slugVietnamese( u.loai_vbcc ) : '';
					return u;
				} );
				this.isLoading    = false;
			} ,
			error : () => {
				this.isLoading = false;
				this.notificationService.toastError( 'Mất kết nối với máy chủ' );
			}
		} );
	}

	showDetailInfo( student : QuyetDinhHocVien ) {
		this.studentActive                                  = student;
		this.studentActive[ '__tenNganhHocVien' ]           = student.nganhhoc && this.dmNganhMap && this.dmNganhMap.has( student.nganhhoc ) ? this.dmNganhMap.get( student.nganhhoc ) : '';
		this.studentActive[ '__ngayky_quyet_dinh' ]         = '';
		this.studentActive[ '__nguoiky_quyet_dinh' ]        = '';
		this.studentActive[ '__chucvu_nguoiky_quyet_dinh' ] = '';
		if ( student.quyetdinh_id ) {
			this.isLoading = true;
			this.quyetDinhService.getDecisionById( student.quyetdinh_id , 'nguoiky,chucvu_nguoiky,ngayky,file' ).pipe( map( ( { ngayky , nguoiky , chucvu_nguoiky , file } ) => {
				const nk = ngayky ? this.helperService.dateFormatWithTimeZone( ngayky ) : null;
				return {
					file ,
					__ngayky_quyet_dinh         : nk ? [ nk.getDate().toString( 10 ).padStart( 2 , '0' ) , ( nk.getMonth() + 1 ).toString( 10 ).padStart( 2 , '0' ) , nk.getFullYear() ].join( '/' ) : '' ,
					__nguoiky_quyet_dinh        : nguoiky ,
					__chucvu_nguoiky_quyet_dinh : chucvu_nguoiky && this.listChuVuMap.has( chucvu_nguoiky ) ? this.listChuVuMap.get( chucvu_nguoiky ) : ''
				};
			} ) ).subscribe( {
				next  : ( { __ngayky_quyet_dinh , __nguoiky_quyet_dinh , __chucvu_nguoiky_quyet_dinh , file } ) => {
					this.studentActive[ 'file' ]                        = file;
					this.studentActive[ '__ngayky_quyet_dinh' ]         = __ngayky_quyet_dinh;
					this.studentActive[ '__nguoiky_quyet_dinh' ]        = __nguoiky_quyet_dinh;
					this.studentActive[ '__chucvu_nguoiky_quyet_dinh' ] = __chucvu_nguoiky_quyet_dinh;
					this.isLoading                                      = false;
				} ,
				error : () => this.isLoading = false
			} );
		}

		const options : NgbModalOptions = {
			scrollable  : true ,
			size        : 'xl' ,
			windowClass : 'modal-xxl ovic-modal-class ovic-custom-large-popup' ,
			centered    : true
		};
		this.modalService.open( this.showFormData , options );
	}

	closePanel() {
		this.modalService.dismissAll( '' );
	}

	myResetFunction( options : DropdownFilterOptions ) {
		options.reset();
		this.filterValue = '';
	}

	paginate( { page } : NgPaginateEvent ) {
		this.f[ 'paged' ].setValue( page + 1 );
		this.__queryData( this.formGroup.value );
	}

}
