export interface LocalStoreFile {
	nonce : string, // org-id, eg: serverAws-1452
	org : string,
	id : string, // file id or name
	url : string,
	file : File;
}
