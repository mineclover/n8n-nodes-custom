import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
	NodeOperationError,
} from 'n8n-workflow';

interface CellFormat {
	backgroundColor?: { red?: number; green?: number; blue?: number; alpha?: number };
	textFormat?: {
		foregroundColor?: { red?: number; green?: number; blue?: number; alpha?: number };
		fontFamily?: string;
		fontSize?: number;
		bold?: boolean;
		italic?: boolean;
		strikethrough?: boolean;
		underline?: boolean;
	};
	horizontalAlignment?: string;
	verticalAlignment?: string;
	wrapStrategy?: string;
	borders?: {
		top?: BorderStyle;
		bottom?: BorderStyle;
		left?: BorderStyle;
		right?: BorderStyle;
	};
}

interface BorderStyle {
	style?: string;
	color?: { red?: number; green?: number; blue?: number; alpha?: number };
}

// Utility functions
function parseRange(range: string): { startRow: number; endRow: number; startCol: number; endCol: number } {
	const match = range.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/);
	if (!match) {
		throw new Error(`Invalid range format: ${range}`);
	}
	return {
		startCol: letterToCol(match[1]),
		startRow: parseInt(match[2], 10),
		endCol: letterToCol(match[3]),
		endRow: parseInt(match[4], 10),
	};
}

function letterToCol(letter: string): number {
	let col = 0;
	for (let i = 0; i < letter.length; i++) {
		col = col * 26 + (letter.charCodeAt(i) - 64);
	}
	return col;
}

function colToLetter(col: number): string {
	let letter = '';
	while (col > 0) {
		const temp = (col - 1) % 26;
		letter = String.fromCharCode(temp + 65) + letter;
		col = Math.floor((col - temp) / 26);
	}
	return letter;
}

function hexToRgb(hex: string): { red: number; green: number; blue: number } {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	if (!result) {
		return { red: 1, green: 1, blue: 1 };
	}
	return {
		red: parseInt(result[1], 16) / 255,
		green: parseInt(result[2], 16) / 255,
		blue: parseInt(result[3], 16) / 255,
	};
}

function rgbToHex(rgb: { red?: number; green?: number; blue?: number }): string {
	const r = Math.round((rgb.red || 0) * 255);
	const g = Math.round((rgb.green || 0) * 255);
	const b = Math.round((rgb.blue || 0) * 255);
	return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

function extractFormat(format: CellFormat): IDataObject {
	const result: IDataObject = {};

	if (format.backgroundColor) {
		result.backgroundColor = rgbToHex(format.backgroundColor);
	}

	if (format.textFormat) {
		result.textFormat = {
			color: format.textFormat.foregroundColor
				? rgbToHex(format.textFormat.foregroundColor)
				: undefined,
			fontFamily: format.textFormat.fontFamily,
			fontSize: format.textFormat.fontSize,
			bold: format.textFormat.bold,
			italic: format.textFormat.italic,
			strikethrough: format.textFormat.strikethrough,
			underline: format.textFormat.underline,
		};
	}

	if (format.horizontalAlignment) {
		result.horizontalAlignment = format.horizontalAlignment;
	}

	if (format.verticalAlignment) {
		result.verticalAlignment = format.verticalAlignment;
	}

	return result;
}

export class GoogleSheetsStyle implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Google Sheets Style',
		name: 'googleSheetsStyle',
		icon: 'file:googleSheets.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Read and write cell styles in Google Sheets',
		defaults: {
			name: 'Google Sheets Style',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'googleSheetsOAuth2Api',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Get Style',
						value: 'getStyle',
						description: 'Get cell formatting/style from a range',
						action: 'Get cell style',
					},
					{
						name: 'Set Style',
						value: 'setStyle',
						description: 'Set cell formatting/style for a range',
						action: 'Set cell style',
					},
				],
				default: 'getStyle',
			},
			{
				displayName: 'Spreadsheet ID',
				name: 'spreadsheetId',
				type: 'string',
				required: true,
				default: '',
				description: 'The ID of the spreadsheet (from URL)',
				placeholder: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
			},
			{
				displayName: 'Sheet ID',
				name: 'sheetId',
				type: 'number',
				required: true,
				default: 0,
				description: 'The ID of the sheet (gid parameter from URL)',
			},
			{
				displayName: 'Range',
				name: 'range',
				type: 'string',
				required: true,
				default: 'A1:B2',
				description: 'The A1 notation of the range (e.g., A1:B2)',
				placeholder: 'A1:B2',
			},
			// Set Style options
			{
				displayName: 'Background Color',
				name: 'backgroundColor',
				type: 'color',
				default: '#ffffff',
				displayOptions: {
					show: {
						operation: ['setStyle'],
					},
				},
				description: 'Background color of the cells',
			},
			{
				displayName: 'Text Color',
				name: 'textColor',
				type: 'color',
				default: '#000000',
				displayOptions: {
					show: {
						operation: ['setStyle'],
					},
				},
				description: 'Text/foreground color',
			},
			{
				displayName: 'Font Size',
				name: 'fontSize',
				type: 'number',
				default: 10,
				displayOptions: {
					show: {
						operation: ['setStyle'],
					},
				},
				description: 'Font size in points',
			},
			{
				displayName: 'Bold',
				name: 'bold',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						operation: ['setStyle'],
					},
				},
				description: 'Whether to make text bold',
			},
			{
				displayName: 'Italic',
				name: 'italic',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						operation: ['setStyle'],
					},
				},
				description: 'Whether to make text italic',
			},
			{
				displayName: 'Horizontal Alignment',
				name: 'horizontalAlignment',
				type: 'options',
				options: [
					{ name: 'Left', value: 'LEFT' },
					{ name: 'Center', value: 'CENTER' },
					{ name: 'Right', value: 'RIGHT' },
				],
				default: 'LEFT',
				displayOptions: {
					show: {
						operation: ['setStyle'],
					},
				},
				description: 'Horizontal text alignment',
			},
			{
				displayName: 'Fields to Update',
				name: 'fieldsToUpdate',
				type: 'multiOptions',
				options: [
					{ name: 'Background Color', value: 'backgroundColor' },
					{ name: 'Text Color', value: 'textColor' },
					{ name: 'Font Size', value: 'fontSize' },
					{ name: 'Bold', value: 'bold' },
					{ name: 'Italic', value: 'italic' },
					{ name: 'Horizontal Alignment', value: 'horizontalAlignment' },
				],
				default: ['backgroundColor'],
				displayOptions: {
					show: {
						operation: ['setStyle'],
					},
				},
				description: 'Which style fields to update',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				const spreadsheetId = this.getNodeParameter('spreadsheetId', i) as string;
				const sheetId = this.getNodeParameter('sheetId', i) as number;
				const range = this.getNodeParameter('range', i) as string;

				if (operation === 'getStyle') {
					const result = await getStyle.call(this, spreadsheetId, sheetId, range);
					returnData.push({ json: result });
				} else if (operation === 'setStyle') {
					const result = await setStyle.call(this, spreadsheetId, sheetId, range, i);
					returnData.push({ json: result });
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message } });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}

async function getStyle(
	this: IExecuteFunctions,
	spreadsheetId: string,
	sheetId: number,
	range: string,
): Promise<IDataObject> {
	const { startRow, endRow, startCol, endCol } = parseRange(range);

	const response = await this.helpers.requestOAuth2.call(
		this,
		'googleSheetsOAuth2Api',
		{
			method: 'GET',
			uri: `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
			qs: {
				ranges: range,
				fields: 'sheets.data.rowData.values.effectiveFormat,sheets.properties',
			},
			json: true,
		},
	);

	const sheets = (response as IDataObject).sheets as IDataObject[];
	if (!sheets || sheets.length === 0) {
		return { error: 'No sheet data found' };
	}

	const sheetData = sheets[0] as IDataObject;
	const data = (sheetData.data as IDataObject[]) || [];
	if (data.length === 0) {
		return { error: 'No data in range' };
	}

	const rowData = (data[0] as IDataObject).rowData as IDataObject[] || [];
	const styles: IDataObject[] = [];

	rowData.forEach((row, rowIndex) => {
		const values = (row.values as IDataObject[]) || [];
		values.forEach((cell, colIndex) => {
			const format = cell.effectiveFormat as CellFormat || {};
			styles.push({
				row: startRow + rowIndex,
				col: startCol + colIndex,
				cell: colToLetter(startCol + colIndex) + (startRow + rowIndex),
				format: extractFormat(format),
			});
		});
	});

	return {
		spreadsheetId,
		sheetId,
		range,
		styles,
	};
}

async function setStyle(
	this: IExecuteFunctions,
	spreadsheetId: string,
	sheetId: number,
	range: string,
	itemIndex: number,
): Promise<IDataObject> {
	const { startRow, endRow, startCol, endCol } = parseRange(range);
	const fieldsToUpdate = this.getNodeParameter('fieldsToUpdate', itemIndex) as string[];

	const cellFormat: IDataObject = {};
	const fields: string[] = [];

	if (fieldsToUpdate.includes('backgroundColor')) {
		const bgColor = this.getNodeParameter('backgroundColor', itemIndex) as string;
		cellFormat.backgroundColor = hexToRgb(bgColor);
		fields.push('userEnteredFormat.backgroundColor');
	}

	if (fieldsToUpdate.includes('textColor')) {
		const textColor = this.getNodeParameter('textColor', itemIndex) as string;
		if (!cellFormat.textFormat) cellFormat.textFormat = {};
		(cellFormat.textFormat as IDataObject).foregroundColor = hexToRgb(textColor);
		fields.push('userEnteredFormat.textFormat.foregroundColor');
	}

	if (fieldsToUpdate.includes('fontSize')) {
		const fontSize = this.getNodeParameter('fontSize', itemIndex) as number;
		if (!cellFormat.textFormat) cellFormat.textFormat = {};
		(cellFormat.textFormat as IDataObject).fontSize = fontSize;
		fields.push('userEnteredFormat.textFormat.fontSize');
	}

	if (fieldsToUpdate.includes('bold')) {
		const bold = this.getNodeParameter('bold', itemIndex) as boolean;
		if (!cellFormat.textFormat) cellFormat.textFormat = {};
		(cellFormat.textFormat as IDataObject).bold = bold;
		fields.push('userEnteredFormat.textFormat.bold');
	}

	if (fieldsToUpdate.includes('italic')) {
		const italic = this.getNodeParameter('italic', itemIndex) as boolean;
		if (!cellFormat.textFormat) cellFormat.textFormat = {};
		(cellFormat.textFormat as IDataObject).italic = italic;
		fields.push('userEnteredFormat.textFormat.italic');
	}

	if (fieldsToUpdate.includes('horizontalAlignment')) {
		const alignment = this.getNodeParameter('horizontalAlignment', itemIndex) as string;
		cellFormat.horizontalAlignment = alignment;
		fields.push('userEnteredFormat.horizontalAlignment');
	}

	const request = {
		requests: [
			{
				repeatCell: {
					range: {
						sheetId,
						startRowIndex: startRow - 1,
						endRowIndex: endRow,
						startColumnIndex: startCol - 1,
						endColumnIndex: endCol,
					},
					cell: {
						userEnteredFormat: cellFormat,
					},
					fields: fields.join(','),
				},
			},
		],
	};

	await this.helpers.requestOAuth2.call(
		this,
		'googleSheetsOAuth2Api',
		{
			method: 'POST',
			uri: `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
			body: request,
			json: true,
		},
	);

	return {
		success: true,
		spreadsheetId,
		sheetId,
		range,
		appliedFormat: cellFormat,
	};
}
