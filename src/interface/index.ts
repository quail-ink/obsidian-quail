export interface QuailPluginSettings {
	apikey: string;
	apibase: string;
	host: string;
	listID: string;
}

export interface QuailImageItem {
	pathname: string;
	formalized_pathname: string;
	name: string;
	data: ArrayBuffer;
	mimeType: string;
}