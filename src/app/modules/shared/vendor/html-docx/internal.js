"use strict";
Object.defineProperty( exports , "__esModule" , { value : true } );
exports.addFiles           = exports.generateDocument = void 0;
var utils_1                = require( "./utils" );
var assets_1               = require( "./assets" );
var templates_1            = require( "./templates" );
var isBrowser              = typeof window !== 'undefined' && typeof Blob !== 'undefined';
var defaultDocumentOptions = {
    orientation : 'portrait' ,
    margins     : {} ,
};

function mergeOptions( options , patch ) {
    return Object.assign( {} , options , patch );
}

async function generateDocument( zip ) {
    var buffer = await zip.generateAsync( { type : 'arraybuffer' } );
    if ( isBrowser ) {
        return new Blob( [ buffer ] , {
            type : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ,
        } );
    }
    return new Buffer( new Uint8Array( buffer ) );
}

exports.generateDocument = generateDocument;

function getBinaryData( str ) {
    return isBrowser ? new Blob( [ str ] ) : new Buffer( str , 'utf-8' );
}

function renderDocumentFile( documentOptions ) {
    var orientation    = documentOptions.orientation , margins = documentOptions.margins;
    var marginsOptions = mergeOptions( templates_1.defaultMargins , margins );
    var width          = 0;
    var height         = 0;
    if ( orientation === 'landscape' ) {
        height = 11906;
        width  = 16838;
    } else {
        width  = 11906;
        height = 16838;
    }
    return templates_1.documentTemplate( width , height , orientation , marginsOptions );
}

function addFiles( zip , htmlSource , options ) {
    var documentOptions = mergeOptions( defaultDocumentOptions , options );
    zip.file( '[Content_Types].xml' , getBinaryData( assets_1.contentTypesXml ) , {
        createFolders : false ,
    } );
    zip.folder( '_rels' ).file( '.rels' , getBinaryData( assets_1.relsXml ) , { createFolders : false } );
    return zip
        .folder( 'word' )
        .file( 'document.xml' , renderDocumentFile( documentOptions ) , {
            createFolders : false ,
        } )
        .file( 'afchunk.mht' , utils_1.getMHTdocument( htmlSource ) , {
            createFolders : false ,
        } )
        .folder( '_rels' )
        .file( 'document.xml.rels' , getBinaryData( assets_1.documentXmlRels ) , {
            createFolders : false ,
        } );
}

exports.addFiles = addFiles;
//# sourceMappingURL=internal.js.map
