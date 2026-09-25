import { Component , OnInit , Input , ViewChild , ElementRef , Output , EventEmitter , SimpleChanges , OnChanges } from '@angular/core';

@Component( {standalone: true, 
    selector : 'su-input-switch' ,
    templateUrl : './su-input-switch.component.html' ,
    styleUrls : [ './su-input-switch.component.css' ]
} )
export class SuInputSwitchComponent implements OnInit , OnChanges {
    isCheck : boolean;

    @Input() value : boolean;

    @Output() onChangeValue = new EventEmitter<boolean>();

    constructor() {
    }

    ngOnInit() : void {
        this.isCheck = this.value || false;
    }

    ngOnChanges( changes : SimpleChanges ) {
        if ( changes[ 'value' ] ) {
            this.isCheck = this.value;
        }
    }

    onCheck() {
        this.isCheck = this.isCheck === true ? false : true;
        this.onChangeValue.emit( this.isCheck );
    }

}
