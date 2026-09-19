import { Source } from 'plyr';

export interface File {
}

export type IctuMediaSourceType = 'googleDrive' | 'serverFile' | 'local' | 'vimeo' | 'youtube' | 'encrypted' | 'serverAws';

export type IctuDocumentType = 'docx' | 'pptx' | 'pdf' | 'xlsx' | 'audio' | 'video' | 'image' | 'text' | 'zip';

export interface IctuDocument {
	type : IctuDocumentType;
	source : IctuMediaSourceType;
	path : string | number;
	size? : number;
	fileName? : string;
	preview? : boolean;
	_ext? : IctuDocumentType;
	download? : boolean;
}

type DownloadStateType = 'PENDING' | 'IN_PROGRESS' | 'DONE';

export interface Download {
	content : Blob | null;
	progress : number;
	state : DownloadStateType;
}

export interface EncryptedFormats {
	itag : number;
	url : string;
	mimeType : string;
	bitrate : number;
	width : number;
	height : number;
	lastModified : string;
	fps : number;
	quality : string;
	qualityLabel : string;
	initRange? : {
		start : string;
		end : string;
	};
	indexRange? : {
		start : string;
		end : string;
	};
	projectionType? : string;
	audioQuality? : string;
	approxDurationMs? : string;
	audioSampleRate? : string;
	audioChannels? : 2;
	type? : string;
	averageBitrate? : string;
	highReplication? : boolean;
	loudnessDb? : number;
}

export interface EncryptedSource extends Source {
	src : string;
	approxDurationMs? : string;
}

export interface IctuMedia {
	type : string; // only 'audio' and 'video' is accepted
	source : IctuMediaSourceType;
	path : string | number;
	replay? : number;
	encryptedSource? : EncryptedSource[]; // Trường hợp source === encrypted thì trường này chứa link video
}

export interface AwsResponseInfo {
	code : string,
	data : string,
	message : string
}

export type IctuMediaHandlerFullType = { [T in IctuMediaSourceType] : ( file : IctuMedia ) => void };

export interface EncryptedVideo {
	code : string,
	message : string,
	videoDetails : EncryptedVideoDetails;
	video? : EncryptedVideoDetails;
	formats? : EncryptedFormats[];
	format? : EncryptedFormats;
}

export interface EncryptedVideoDetails {
	title : string;
	lengthSeconds : string;
	keywords : string[];
	channelId : string;
	isOwnerViewing : boolean;
	shortDescription : string;
	isCrawlable : boolean;
	allowRatings : boolean;
	viewCount : string;
	author : string;
	isPrivate : boolean;
	isUnpluggedCorpus : boolean;
	isLiveContent : boolean;
}

export interface IctuFileInfo {
	id? : number;
	name : string;
	size : number;
	type : string;
	donvi_id? : number;
	ext? : string;
	realm? : string;
	title? : string;
	url? : string;
	user_id? : number;
	updated_at? : string;
	created_at? : string;
}

export interface IctuDocumentDownloadResult {
	state : 'REJECTED' | 'ERROR' | 'INVALIDATE' | 'COMPLETED' | 'CANCEL';
	download : Download;
}

export interface IctuDriveFile extends IctuTinyDriveFile {
	parents : string[];
	spaces : string[];
	webContentLink? : string;
	webViewLink? : string;
	thumbnailLink? : string;
	createdTime : string;
	modifiedTime : string;
	originalFilename : string;
	fullFileExtension : string;
}

export interface IctuFileStore {
	id : number;
	name : string;
	title : string;
	size : number;
	type : string;
	ext : string;
	progress? : number;
}

export interface IctuTinyDriveFile {
	id : string;
	mimeType : string;
	name : string;
	fileExtension : string;
	shared : boolean;
	size : string;
}

export interface IctuFile {
	id : number;
	name : string;
	title : string;
	url : string;
	ext : string;
	type : string;
	size : number;
	user_id : number;
	public? : number; // '-1' => public | '0' => private | '|12|24|25|' => share group
	created_at? : string; // mySql DATETIME format: YYYY-MM-DD HH:MI:SS
	updated_at? : string; // mySql DATETIME format: YYYY-MM-DD HH:MI:SS
}

export interface IctuPreviewFileContent {
	id : string | number;
	file? : IctuFile | IctuDriveFile | IctuTinyDriveFile | SimpleFileLocal;
}

export interface SimpleFileLocal {
	id : number,
	name : string,
	title : string,
	ext : string,
	type : string,
	size : number
}

export interface AwsFileInfo {
	id : number,
	name : string,
	title : string,
	tag : string,
	url : string,
	ext : string,
	type : string,
	size : number,
	user_id : number,
	public : number,
	status : number,
	is_deleted : number,
	deleted_by : number,
	created_by : number,
	updated_by : number,
	created_at : string,
	updated_at : string,
}

export interface LocalStoreFile {
	nonce : string, // org-id, eg: serverAws-1452
	org : string,
	id : string, // file id or name
	url : string,
	file : File;
}
