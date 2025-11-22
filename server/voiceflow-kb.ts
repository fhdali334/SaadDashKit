/**
 * Voiceflow Knowledge Base Manager
 *
 * Node.js library for managing documents in Voiceflow Knowledge Base.
 * Supports uploading, updating, and deleting documents.
 */

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

interface VFDocument {
  documentID: string;
  name: string;
  status?: string;
  data?: any;
  createdAt?: string;
  updatedAt?: string;
}

interface VFListResponse {
  data: VFDocument[];
}

interface VFUploadResponse {
  data: VFDocument;
}

/**
 * Main class for interacting with Voiceflow Knowledge Base API
 */
export class VoiceflowKB {
    private apiKey: string;
    private projectId: string;
    private baseUrl: string;
    private headers: Record<string, string>;

    /**
     * Initialize the Voiceflow KB manager
     * @param {string} apiKey - Voiceflow Dialog Manager API Key (VF.DM.xxx)
     * @param {string} projectId - Your Voiceflow project ID
     */
    constructor(apiKey: string, projectId: string) {
        this.apiKey = apiKey;
        this.projectId = projectId;
        this.baseUrl = "https://api.voiceflow.com";
        this.headers = {
            "Authorization": apiKey,
            "Content-Type": "application/json; charset=utf-8"
        };
    }

    /**
     * Upload a document to the Knowledge Base (PDF, TXT, DOCX)
     * @param {string} filePath - Path to the file to upload
     * @param {Array} tags - Optional list of tags (deprecated, use metadata instead)
     * @param {Object} metadata - Optional metadata dict for the document
     * @param {boolean} overwrite - Whether to overwrite existing documents
     * @param {number} maxChunkSize - Maximum chunk size for document processing
     * @param {string} fileName - Optional custom filename
     * @returns {Promise<Object>} Response from the API with document details
     */
    async uploadDocument(filePath: string, tags: string[] | null = null, metadata: Record<string, any> | null = null, overwrite: boolean | null = null, maxChunkSize: number | null = null, fileName: string | null = null): Promise<any> {
        const url = `${this.baseUrl}/v1/knowledge-base/docs/upload`;

        console.log('[VoiceflowKB] uploadDocument called');
        console.log('[VoiceflowKB] - filePath:', filePath);
        console.log('[VoiceflowKB] - fileName:', fileName);
        console.log('[VoiceflowKB] - url:', url);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.error('[VoiceflowKB] File does not exist:', filePath);
            throw new Error(`File not found: ${filePath}`);
        }

        console.log('[VoiceflowKB] File exists, creating FormData...');

        const formData = new FormData();
        const finalName = fileName || path.basename(filePath);
        console.log('[VoiceflowKB] Final file name:', finalName);
        formData.append('file', fs.createReadStream(filePath), finalName);

        // Add tags if provided (deprecated but still supported)
        if (tags) {
            console.log('[VoiceflowKB] Adding tags:', tags);
            formData.append('tags', JSON.stringify(tags));
        }

        // Add metadata if provided
        if (metadata) {
            console.log('[VoiceflowKB] Adding metadata:', metadata);
            formData.append('metadata', JSON.stringify(metadata));
        }

        // Remove Content-Type header for multipart/form-data
        const headers = {
            "Authorization": this.apiKey
        };

        console.log('[VoiceflowKB] Authorization header set (first 20 chars):', this.apiKey.substring(0, 20));

        // Add query parameters
        const params: Record<string, string> = {};
        if (overwrite !== null) {
            params.overwrite = overwrite ? "true" : "false";
        }
        if (maxChunkSize !== null) {
            params.maxChunkSize = maxChunkSize.toString();
        }

        if (Object.keys(params).length > 0) {
            console.log('[VoiceflowKB] Query params:', params);
        }

        try {
            console.log('[VoiceflowKB] Making POST request to Voiceflow API...');
            const response = await axios.post(url, formData, {
                headers: { ...headers, ...formData.getHeaders() },
                params: params
            });
            console.log('[VoiceflowKB] Upload successful! Status:', response.status);
            console.log('[VoiceflowKB] Response data:', JSON.stringify(response.data, null, 2));
            return response.data;
        } catch (error: any) {
            console.error('[VoiceflowKB] Upload FAILED!');
            console.error('[VoiceflowKB] Error message:', error.message);
            if (error.response) {
                console.error('[VoiceflowKB] Response status:', error.response.status);
                console.error('[VoiceflowKB] Response headers:', error.response.headers);
                console.error('[VoiceflowKB] Response data:', JSON.stringify(error.response.data, null, 2));
            }
            console.error('[VoiceflowKB] Full error:', error);
            throw new Error(`Upload failed: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Upload a URL document to the Knowledge Base
     * @param {string} url - The URL to add to the knowledge base
     * @param {string} name - Optional name for the document
     * @param {Array} tags - Optional list of tags
     * @param {Object} metadata - Optional metadata dict for the document
     * @param {boolean} overwrite - Whether to overwrite existing documents
     * @param {number} maxChunkSize - Maximum chunk size for document processing
     * @returns {Promise<Object>} Response from the API with document details
     */
    async uploadUrl(url: string, name: string | null = null, tags: string[] | null = null, metadata: Record<string, any> | null = null, overwrite: boolean | null = null, maxChunkSize: number | null = null): Promise<any> {
        const endpoint = `${this.baseUrl}/v1/knowledge-base/docs/upload`;

        // Per docs, URL uploads must be JSON with a top-level `data` object
        const payload: any = {
            data: {
                type: "url",
                url: url
            }
        };

        if (metadata) {
            payload.data.metadata = metadata;
        }
        if (name) {
            // Name is optional; API may generate one from the URL
            payload.data.name = name;
        }
        if (tags) {
            // Tags are deprecated but still supported as legacy
            payload.data.tags = tags;
        }

        // Add query parameters
        const params: Record<string, string> = {};
        if (overwrite !== null) {
            params.overwrite = overwrite ? "true" : "false";
        }
        if (maxChunkSize !== null) {
            params.maxChunkSize = maxChunkSize.toString();
        }

        try {
            const response = await axios.post(endpoint, payload, {
                headers: this.headers,
                params: params
            });
            return response.data;
        } catch (error: any) {
            throw new Error(`URL upload failed: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Upload table data to the Knowledge Base
     * @param {string} name - Name for the table
     * @param {Array} data - List of row dictionaries
     * @param {Object} schema - Schema definition for the table columns
     * @param {Array} tags - Optional list of tags
     * @param {Object} metadata - Optional metadata dict for the table
     * @param {boolean} overwrite - Whether to overwrite existing documents
     * @param {number} maxChunkSize - Maximum chunk size for document processing
     * @returns {Promise<Object>} Response from the API with table details
     */
    async uploadTable(name: string, data: any[], schema: Record<string, any>, tags: string[] | null = null, metadata: Record<string, any> | null = null, overwrite: boolean | null = null, maxChunkSize: number | null = null): Promise<any> {
        const url = `${this.baseUrl}/v1/knowledge-base/docs/upload/table`;

        // Build schema with searchableFields and fields map
        const fields: Record<string, any> = {};
        const searchableFields: string[] = [];

        for (const [fieldName, fieldCfg] of Object.entries(schema)) {
            const fieldType = fieldCfg.type;
            if (!fieldType) {
                continue;
            }
            fields[fieldName] = { type: fieldType };
            if (fieldCfg.searchable === true) {
                searchableFields.push(fieldName);
            }
        }

        // Per API validation errors, expects: data.items (array) and schema.searchableFields (array)
        const payload: any = {
            data: {
                name: name,
                schema: {
                    fields: fields,
                    searchableFields: searchableFields
                },
                items: data
            }
        };

        if (metadata) {
            payload.data.metadata = metadata;
        }
        if (tags) {
            payload.data.tags = tags;
        }

        // Add query parameters
        const params: Record<string, string> = {};
        if (overwrite !== null) {
            params.overwrite = overwrite ? "true" : "false";
        }
        if (maxChunkSize !== null) {
            params.maxChunkSize = maxChunkSize.toString();
        }

        try {
            const response = await axios.post(url, payload, {
                headers: this.headers,
                params: params
            });
            return response.data;
        } catch (error: any) {
            throw new Error(`Table upload failed: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Retrieve a document by its ID
     * @param {string} documentId - The document ID
     * @returns {Promise<Object>} Document details
     */
    async getDocument(documentId: string): Promise<any> {
        const url = `${this.baseUrl}/v1/knowledge-base/docs/${documentId}`;

        try {
            const response = await axios.get(url, { headers: this.headers });
            return response.data;
        } catch (error: any) {
            throw new Error(`Get document failed: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Delete a document by its ID
     * @param {string} documentId - The document ID to delete
     * @returns {Promise<Object>} Response from the API
     */
    async deleteDocument(documentId: string): Promise<any> {
        const url = `${this.baseUrl}/v1/knowledge-base/docs/${documentId}`;

        try {
            const response = await axios.delete(url, { headers: this.headers });
            return response.data;
        } catch (error: any) {
            throw new Error(`Delete document failed: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Replace/update an existing document by its ID
     * @param {string} documentId - The document ID to update
     * @param {string} filePath - Path to the new file
     * @param {Array} tags - Optional list of tags
     * @param {Object} metadata - Optional metadata dict for the document
     * @returns {Promise<Object>} Response from the API
     */
    async updateDocument(documentId: string, filePath: string, tags: string[] | null = null, metadata: Record<string, any> | null = null): Promise<any> {
        const url = `${this.baseUrl}/v1/knowledge-base/docs/${documentId}/upload`;

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        const formData = new FormData();
        formData.append('file', fs.createReadStream(filePath));

        if (tags) {
            formData.append('tags', JSON.stringify(tags));
        }

        if (metadata) {
            formData.append('metadata', JSON.stringify(metadata));
        }

        const headers = {
            "Authorization": this.apiKey
        };

        try {
            const response = await axios.put(url, formData, {
                headers: { ...headers, ...formData.getHeaders() }
            });
            return response.data;
        } catch (error: any) {
            throw new Error(`Update document failed: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * List all documents in the knowledge base
     * @param {number} limit - Number of documents to return (default: 50)
     * @param {number} offset - Offset for pagination (default: 0)
     * @returns {Promise<Object>} List of documents
     */
    async listDocuments(limit: number = 50, offset: number = 0): Promise<VFListResponse> {
        const url = `${this.baseUrl}/v1/knowledge-base/docs`;
        const params = {
            limit: limit,
            offset: offset
        };

        try {
            const response = await axios.get(url, {
                headers: this.headers,
                params: params
            });
            return response.data;
        } catch (error: any) {
            throw new Error(`List documents failed: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Upload a document from buffer (for compatibility with existing code)
     * @param buffer - File buffer
     * @param fileName - Name of the file
     * @param options - Upload options
     * @returns Response from the API with document details
     */
    async uploadDocumentFromBuffer(
        buffer: Buffer,
        fileName: string,
        options: {
            metadata?: Record<string, any>;
            overwrite?: boolean;
            maxChunkSize?: number;
        } = {}
    ): Promise<VFUploadResponse> {
        const url = `${this.baseUrl}/v1/knowledge-base/docs/upload`;

        console.log("[VoiceflowKB] uploadDocumentFromBuffer called");
        console.log("[VoiceflowKB] - fileName:", fileName);
        console.log("[VoiceflowKB] - buffer size:", buffer.length);
        console.log("[VoiceflowKB] - url:", url);

        const formData = new FormData();

        // Create a readable stream from the buffer
        const Readable = require('stream').Readable;
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);

        formData.append("file", stream, {
            filename: fileName,
        });

        // Add metadata if provided
        if (options.metadata) {
            console.log("[VoiceflowKB] Adding metadata:", options.metadata);
            formData.append("metadata", JSON.stringify(options.metadata));
        }

        const headers = {
            "Authorization": this.apiKey
        };

        const params: Record<string, string> = {};
        if (options.overwrite !== undefined) {
            params.overwrite = options.overwrite ? "true" : "false";
        }
        if (options.maxChunkSize !== undefined) {
            params.maxChunkSize = options.maxChunkSize.toString();
        }

        try {
            console.log("[VoiceflowKB] Making POST request to Voiceflow API...");
            const response = await axios.post(url, formData, {
                headers: { ...headers, ...formData.getHeaders() },
                params: params
            });

            console.log("[VoiceflowKB] Upload successful! Status:", response.status);
            console.log("[VoiceflowKB] Response data:", JSON.stringify(response.data, null, 2));

            return response.data;
        } catch (error: any) {
            console.error("[VoiceflowKB] Upload FAILED!");
            console.error("[VoiceflowKB] Error message:", error.message);
            if (error.response) {
                console.error("[VoiceflowKB] Response status:", error.response.status);
                console.error("[VoiceflowKB] Response data:", JSON.stringify(error.response.data, null, 2));
            }
            throw new Error(`Upload failed: ${error.response?.data?.message || error.message}`);
        }
    }
}

