/* ===========================
   GITHUB PROJECTS DATABASE MANAGER
   Cloud storage using GitHub Projects API (GraphQL)
   Features:
   - Automatic background sync
   - Conflict resolution
   - Real-time collaboration
   - Enhanced caching
   - Webhook support
   =========================== */

class GitHubProjectsDBManager {
    constructor() {
        this.dbName = 'GitHubProjects';
        this.initialized = false;
        this.isAvailable = false;
        
        // Configuration
        this.config = this.loadConfig();
        
        // Project field definitions (cached)
        this.projectFields = {
            cached: false,
            fields: {}
        };
        
        // Project views (cached)
        this.projectViews = {
            cached: false,
            views: {}
        };
        
        // Cache layer
        this.cache = {
            materials: null,
            archive: null,
            groups: null,
            notes: null,
            alertRules: null,
            storageTypes: null,
            projectItems: null, // Cache for all project items
            lastFetch: {},
            ttl: 5 * 60 * 1000 // 5 minutes cache TTL
        };
        
        // Sync state
        this.syncState = {
            enabled: false,
            interval: null,
            intervalMs: 30000, // 30 seconds
            lastSync: null,
            isSyncing: false,
            pendingChanges: [],
            conflictQueue: []
        };
        
        // Cross-tab sync using BroadcastChannel
        this.syncChannel = null;
        this.initBroadcastChannel();
        
        // Version tracking for conflict resolution
        this.versionTracking = {
            materials: {},
            archive: {},
            groups: {},
            notes: {}
        };
        
        // Webhook handler
        this.webhookHandler = null;
        
        // Rate limiting
        this.rateLimiter = {
            requests: [],
            maxRequests: 5000, // GitHub API limit
            windowMs: 60 * 60 * 1000, // 1 hour
            remaining: 5000,
            resetTime: null
        };
        
        // Operation batching/pooling for API call optimization
        this.batchConfig = {
            enabled: true, // Enable batching by default
            debounceMs: 100, // Wait 100ms to collect operations
            maxBatchSize: 20, // Max operations per batch (GitHub limit)
            immediateOperations: ['getProjectId', 'getProjectFields'] // Critical operations that skip batching
        };
        
        this.operationQueue = {
            pending: [], // Queued operations
            timeout: null, // Debounce timer
            processing: false // Is batch currently processing
        };
        
        // Initialize
        this.init();
    }
    
    // =================== INITIALIZATION ===================
    
    init() {
        console.log('GitHubProjects: Initializing...');
        
        // Check if configuration is complete
        if (this.config.token && this.config.owner && this.config.projectNumber) {
            this.isAvailable = true;
            this.initialized = true;
            console.log('GitHubProjects: Initialized with configuration');
            
            // Start background sync if enabled
            if (this.config.autoSync) {
                this.startBackgroundSync();
            }
            
            // Initialize webhook listener
            this.initWebhookListener();
        } else {
            console.log('GitHubProjects: Configuration incomplete, not available');
            this.isAvailable = false;
        }
    }
    
    initBroadcastChannel() {
        try {
            if ('BroadcastChannel' in window) {
                this.syncChannel = new BroadcastChannel('warehouse_github_sync');
                console.log('GitHubProjects: BroadcastChannel initialized');
                
                // Listen for sync events from other tabs
                this.syncChannel.onmessage = (event) => {
                    this.handleCrossTabMessage(event.data);
                };
            }
        } catch (error) {
            console.warn('GitHubProjects: Failed to initialize BroadcastChannel:', error);
        }
    }
    
    // =================== CONFIGURATION ===================
    
    getDefaultConfig() {
        return {
            token: '',
            owner: '',
            projectNumber: null,
            autoSync: false,
            syncInterval: 30, // seconds
            webhookSecret: '',
            webhookUrl: '',
            conflictResolution: 'manual', // 'manual', 'local-wins', 'remote-wins', 'merge'
            cacheEnabled: true,
            cacheTTL: 5 * 60 * 1000, // 5 minutes
            useCustomFields: true // Map material properties to GitHub Projects custom fields (DEFAULT)
        };
    }
    
    loadConfig() {
        try {
            const stored = localStorage.getItem('warehouse_github_config');
            if (stored) {
                const parsed = JSON.parse(stored);
                return { ...this.getDefaultConfig(), ...parsed };
            }
        } catch (error) {
            console.error('GitHubProjects: Error loading config:', error);
        }
        return this.getDefaultConfig();
    }
    
    saveConfig(config) {
        try {
            this.config = { ...this.config, ...config };
            localStorage.setItem('warehouse_github_config', JSON.stringify(this.config));
            
            // Update availability
            this.isAvailable = !!(this.config.token && this.config.owner && this.config.projectNumber);
            this.initialized = this.isAvailable;
            
            // Clear cached project ID when config changes
            this._cachedProjectId = null;
            
            // Restart background sync if needed
            if (this.config.autoSync && this.isAvailable) {
                this.startBackgroundSync();
            } else {
                this.stopBackgroundSync();
            }
            
            return true;
        } catch (error) {
            console.error('GitHubProjects: Error saving config:', error);
            return false;
        }
    }
    
    clearConfig() {
        try {
            localStorage.removeItem('warehouse_github_config');
            this.config = this.getDefaultConfig();
            this.isAvailable = false;
            this.initialized = false;
            this._cachedProjectId = null;
            this.stopBackgroundSync();
            this.clearCache();
            return true;
        } catch (error) {
            console.error('GitHubProjects: Error clearing config:', error);
            return false;
        }
    }
    
    checkAvailability() {
        return this.initialized && this.isAvailable;
    }
    
    // =================== GITHUB API ===================
    
    async makeGraphQLRequest(query, variables = {}) {
        if (!this.config.token) {
            throw new Error('GitHub token not configured');
        }
        
        // Check rate limit
        this.checkRateLimit();
        
        try {
            const response = await fetch('https://api.github.com/graphql', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v4+json'
                },
                body: JSON.stringify({ query, variables })
            });
            
            // Update rate limit info
            this.updateRateLimit(response.headers);
            
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.errors) {
                throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
            }
            
            return data.data;
        } catch (error) {
            console.error('GitHubProjects: GraphQL request failed:', error);
            throw error;
        }
    }
    
    checkRateLimit() {
        const now = Date.now();
        
        // Clean old requests
        this.rateLimiter.requests = this.rateLimiter.requests.filter(
            time => now - time < this.rateLimiter.windowMs
        );
        
        if (this.rateLimiter.requests.length >= this.rateLimiter.maxRequests) {
            throw new Error('GitHub API rate limit exceeded. Please wait before making more requests.');
        }
        
        this.rateLimiter.requests.push(now);
    }
    
    updateRateLimit(headers) {
        if (headers.get('x-ratelimit-remaining')) {
            this.rateLimiter.remaining = parseInt(headers.get('x-ratelimit-remaining'), 10);
        }
        if (headers.get('x-ratelimit-reset')) {
            this.rateLimiter.resetTime = parseInt(headers.get('x-ratelimit-reset'), 10) * 1000;
        }
    }
    
    // =================== BATCHING/POOLING OPERATIONS ===================
    
    /**
     * Queue an operation for batched execution
     * @param {string} type - Operation type ('create', 'update', 'delete', 'updateField')
     * @param {object} params - Operation parameters
     * @param {boolean} immediate - Execute immediately without batching
     * @returns {Promise} - Resolves when operation completes
     */
    queueOperation(type, params, immediate = false) {
        return new Promise((resolve, reject) => {
            const operation = {
                id: `op_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                type,
                params,
                resolve,
                reject,
                timestamp: Date.now()
            };
            
            // Immediate execution for critical operations or operations in immediateOperations list
            if (immediate || !this.batchConfig.enabled || this.batchConfig.immediateOperations.includes(type)) {
                this.executeImmediateOperation(operation);
                return;
            }
            
            // Add to queue
            this.operationQueue.pending.push(operation);
            
            // Reset debounce timer
            clearTimeout(this.operationQueue.timeout);
            
            // Schedule batch execution
            this.operationQueue.timeout = setTimeout(() => {
                this.flushOperationQueue();
            }, this.batchConfig.debounceMs);
            
            // Force flush if max batch size reached
            if (this.operationQueue.pending.length >= this.batchConfig.maxBatchSize) {
                clearTimeout(this.operationQueue.timeout);
                this.flushOperationQueue();
            }
        });
    }
    
    /**
     * Execute a single operation immediately
     */
    async executeImmediateOperation(operation) {
        try {
            let result;
            switch (operation.type) {
                case 'create':
                    result = await this.createProjectItemDirect(operation.params.title, operation.params.body);
                    this.invalidateProjectItemsCache();
                    break;
                case 'update':
                    result = await this.updateProjectItemDirect(operation.params.itemId, operation.params.title, operation.params.body);
                    this.invalidateProjectItemsCache();
                    break;
                case 'delete':
                    result = await this.deleteProjectItemDirect(operation.params.itemId);
                    this.invalidateProjectItemsCache();
                    break;
                case 'updateField':
                    result = await this.updateItemFieldValueDirect(operation.params.itemId, operation.params.fieldId, operation.params.value);
                    // Field updates don't affect projectItems cache structure
                    break;
                default:
                    throw new Error(`Unknown operation type: ${operation.type}`);
            }
            operation.resolve(result);
        } catch (error) {
            operation.reject(error);
        }
    }
    
    /**
     * Flush the operation queue and execute as batched GraphQL
     */
    async flushOperationQueue() {
        if (this.operationQueue.processing || this.operationQueue.pending.length === 0) {
            return;
        }
        
        this.operationQueue.processing = true;
        const operations = [...this.operationQueue.pending];
        this.operationQueue.pending = [];
        
        console.log(`GitHubProjects: Flushing batch with ${operations.length} operations`);
        
        try {
            await this.executeBatchedOperations(operations);
        } catch (error) {
            console.error('GitHubProjects: Batch execution failed:', error);
            // Reject all operations in batch
            operations.forEach(op => op.reject(error));
        } finally {
            this.operationQueue.processing = false;
            
            // If operations were queued during processing, schedule another flush
            if (this.operationQueue.pending.length > 0) {
                // Clear any existing timer to avoid duplicate flushes
                clearTimeout(this.operationQueue.timeout);
                // Schedule immediate flush for waiting operations
                this.operationQueue.timeout = setTimeout(() => {
                    this.flushOperationQueue();
                }, 0);
            }
        }
    }
    
    /**
     * Execute multiple operations in a single batched GraphQL request
     */
    async executeBatchedOperations(operations) {
        if (operations.length === 0) return;
        
        const projectId = await this.getProjectId();
        
        // Group operations by type for efficient batching
        const creates = operations.filter(op => op.type === 'create');
        const updates = operations.filter(op => op.type === 'update');
        const deletes = operations.filter(op => op.type === 'delete');
        const fieldUpdates = operations.filter(op => op.type === 'updateField');
        
        // Build batched mutation
        const mutations = [];
        const variables = { projectId };
        
        // Add create operations
        creates.forEach((op, index) => {
            const alias = `create${index}`;
            mutations.push(`
                ${alias}: addProjectV2DraftIssue(input: {
                    projectId: $projectId
                    title: $${alias}_title
                    body: $${alias}_body
                }) {
                    projectItem { id }
                }
            `);
            variables[`${alias}_title`] = op.params.title;
            variables[`${alias}_body`] = op.params.body;
            op.alias = alias;
        });
        
        // Add update operations
        updates.forEach((op, index) => {
            const alias = `update${index}`;
            mutations.push(`
                ${alias}: updateProjectV2DraftIssue(input: {
                    draftIssueId: $${alias}_itemId
                    title: $${alias}_title
                    body: $${alias}_body
                }) {
                    draftIssue { id }
                }
            `);
            variables[`${alias}_itemId`] = op.params.itemId;
            variables[`${alias}_title`] = op.params.title;
            variables[`${alias}_body`] = op.params.body;
            op.alias = alias;
        });
        
        // Add delete operations
        deletes.forEach((op, index) => {
            const alias = `delete${index}`;
            mutations.push(`
                ${alias}: deleteProjectV2Item(input: {
                    projectId: $projectId
                    itemId: $${alias}_itemId
                }) {
                    deletedItemId
                }
            `);
            variables[`${alias}_itemId`] = op.params.itemId;
            op.alias = alias;
        });
        
        // Add field update operations
        fieldUpdates.forEach((op, index) => {
            const alias = `field${index}`;
            mutations.push(`
                ${alias}: updateProjectV2ItemFieldValue(input: {
                    projectId: $projectId
                    itemId: $${alias}_itemId
                    fieldId: $${alias}_fieldId
                    value: $${alias}_value
                }) {
                    projectV2Item { id }
                }
            `);
            variables[`${alias}_itemId`] = op.params.itemId;
            variables[`${alias}_fieldId`] = op.params.fieldId;
            variables[`${alias}_value`] = op.params.value;
            op.alias = alias;
        });
        
        if (mutations.length === 0) return;
        
        // Build variable definitions for the mutation
        const varDefs = [];
        varDefs.push('$projectId: ID!');
        creates.forEach((op, i) => {
            varDefs.push(`$create${i}_title: String!`);
            varDefs.push(`$create${i}_body: String!`);
        });
        updates.forEach((op, i) => {
            varDefs.push(`$update${i}_itemId: ID!`);
            varDefs.push(`$update${i}_title: String`);
            varDefs.push(`$update${i}_body: String`);
        });
        deletes.forEach((op, i) => {
            varDefs.push(`$delete${i}_itemId: ID!`);
        });
        fieldUpdates.forEach((op, i) => {
            varDefs.push(`$field${i}_itemId: ID!`);
            varDefs.push(`$field${i}_fieldId: ID!`);
            varDefs.push(`$field${i}_value: ProjectV2FieldValue!`);
        });
        
        const batchMutation = `
            mutation BatchOperations(${varDefs.join(', ')}) {
                ${mutations.join('\n')}
            }
        `;
        
        // Execute batched request
        const result = await this.makeGraphQLRequest(batchMutation, variables);
        
        // Resolve individual operations with their results
        operations.forEach(op => {
            try {
                // Security: Validate alias format to prevent property injection
                if (!op.alias || typeof op.alias !== 'string' || !/^(create|update|delete|field)\d+$/.test(op.alias)) {
                    op.reject(new Error(`Invalid operation alias: ${op.alias}`));
                    return;
                }
                
                // Safely access result property
                const opResult = Object.prototype.hasOwnProperty.call(result, op.alias) ? result[op.alias] : null;
                if (opResult) {
                    if (op.type === 'create') {
                        op.resolve(opResult.projectItem);
                    } else if (op.type === 'update') {
                        op.resolve(opResult.draftIssue);
                    } else if (op.type === 'delete') {
                        op.resolve({ deletedItemId: opResult.deletedItemId });
                    } else if (op.type === 'updateField') {
                        op.resolve(opResult.projectV2Item);
                    }
                } else {
                    op.reject(new Error(`No result for operation ${op.alias}`));
                }
            } catch (error) {
                op.reject(error);
            }
        });
        
        // Invalidate cache after batch modifications
        if (creates.length > 0 || updates.length > 0 || deletes.length > 0) {
            this.invalidateProjectItemsCache();
        }
        
        console.log(`GitHubProjects: Batch completed - ${creates.length} created, ${updates.length} updated, ${deletes.length} deleted, ${fieldUpdates.length} fields updated`);
    }
    
    /**
     * Batch update multiple fields for a single item
     */
    async batchUpdateItemFields(itemId, fieldUpdates) {
        if (!fieldUpdates || fieldUpdates.length === 0) return;
        
        console.log(`GitHubProjects: Batch updating ${fieldUpdates.length} fields for item ${itemId}`);
        
        // Queue all field updates at once
        const promises = fieldUpdates.map(update => 
            this.queueOperation('updateField', {
                itemId,
                fieldId: update.fieldId,
                value: update.value
            })
        );
        
        // Wait for all to complete
        const results = await Promise.all(promises);
        return results;
    }
    
    // =================== DIRECT OPERATIONS (used internally) ===================
    
    async createProjectItemDirect(title, body) {
        const projectId = await this.getProjectId();
        
        const mutation = `
            mutation($projectId: ID!, $title: String!, $body: String!) {
                addProjectV2DraftIssue(input: {
                    projectId: $projectId
                    title: $title
                    body: $body
                }) {
                    projectItem {
                        id
                    }
                }
            }
        `;
        
        const data = await this.makeGraphQLRequest(mutation, {
            projectId,
            title,
            body
        });
        
        return data.addProjectV2DraftIssue.projectItem;
    }
    
    async updateProjectItemDirect(itemId, title, body) {
        const mutation = `
            mutation($draftIssueId: ID!, $title: String, $body: String) {
                updateProjectV2DraftIssue(input: {
                    draftIssueId: $draftIssueId
                    title: $title
                    body: $body
                }) {
                    draftIssue {
                        id
                    }
                }
            }
        `;
        
        const data = await this.makeGraphQLRequest(mutation, {
            draftIssueId: itemId,
            title,
            body
        });
        
        return data.updateProjectV2DraftIssue.draftIssue;
    }
    
    async deleteProjectItemDirect(itemId) {
        const projectId = await this.getProjectId();
        
        const mutation = `
            mutation($projectId: ID!, $itemId: ID!) {
                deleteProjectV2Item(input: {
                    projectId: $projectId
                    itemId: $itemId
                }) {
                    deletedItemId
                }
            }
        `;
        
        const data = await this.makeGraphQLRequest(mutation, {
            projectId,
            itemId
        });
        
        return data.deleteProjectV2Item;
    }
    
    async updateItemFieldValueDirect(itemId, fieldId, value) {
        const projectId = await this.getProjectId();
        
        const mutation = `
            mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $value: ProjectV2FieldValue!) {
                updateProjectV2ItemFieldValue(input: {
                    projectId: $projectId
                    itemId: $itemId
                    fieldId: $fieldId
                    value: $value
                }) {
                    projectV2Item {
                        id
                    }
                }
            }
        `;
        
        const data = await this.makeGraphQLRequest(mutation, {
            projectId,
            itemId,
            fieldId,
            value
        });
        
        return data.updateProjectV2ItemFieldValue.projectV2Item;
    }
    
    getRateLimitStatus() {
        return {
            remaining: this.rateLimiter.remaining,
            resetTime: this.rateLimiter.resetTime,
            resetDate: this.rateLimiter.resetTime ? new Date(this.rateLimiter.resetTime) : null
        };
    }
    
    // =================== PROJECT OPERATIONS ===================
    
    async getProjectId() {
        // Return cached project ID if available
        if (this._cachedProjectId) {
            return this._cachedProjectId;
        }

        // Try as user first
        try {
            const userQuery = `
                query($owner: String!, $number: Int!) {
                    user(login: $owner) {
                        projectV2(number: $number) {
                            id
                            title
                        }
                    }
                }
            `;
            
            const userData = await this.makeGraphQLRequest(userQuery, {
                owner: this.config.owner,
                number: this.config.projectNumber
            });
            
            if (userData.user?.projectV2) {
                this.config.ownerType = 'user';
                this._cachedProjectId = userData.user.projectV2.id;
                return this._cachedProjectId;
            }
        } catch (error) {
            console.log('GitHubProjects: Not a user project, trying organization...');
        }
        
        // Try as organization if user failed
        try {
            const orgQuery = `
                query($owner: String!, $number: Int!) {
                    organization(login: $owner) {
                        projectV2(number: $number) {
                            id
                            title
                        }
                    }
                }
            `;
            
            const orgData = await this.makeGraphQLRequest(orgQuery, {
                owner: this.config.owner,
                number: this.config.projectNumber
            });
            
            if (orgData.organization?.projectV2) {
                this.config.ownerType = 'organization';
                this._cachedProjectId = orgData.organization.projectV2.id;
                return this._cachedProjectId;
            }
        } catch (error) {
            console.error('GitHubProjects: Project not found as organization either');
        }
        
        throw new Error(`Project #${this.config.projectNumber} not found for user or organization "${this.config.owner}". Please check the owner name and project number.`);
    }
    
    async getProjectItems() {
        const projectId = await this.getProjectId();
        
        const query = `
            query($projectId: ID!, $first: Int!, $after: String) {
                node(id: $projectId) {
                    ... on ProjectV2 {
                        items(first: $first, after: $after) {
                            pageInfo {
                                hasNextPage
                                endCursor
                            }
                            nodes {
                                id
                                content {
                                    ... on DraftIssue {
                                        id
                                        title
                                        body
                                    }
                                    ... on Issue {
                                        id
                                        title
                                        body
                                        number
                                        updatedAt
                                    }
                                }
                                fieldValues(first: 20) {
                                    nodes {
                                        ... on ProjectV2ItemFieldTextValue {
                                            text
                                            field {
                                                ... on ProjectV2Field {
                                                    name
                                                }
                                            }
                                        }
                                        ... on ProjectV2ItemFieldDateValue {
                                            date
                                            field {
                                                ... on ProjectV2Field {
                                                    name
                                                }
                                            }
                                        }
                                        ... on ProjectV2ItemFieldSingleSelectValue {
                                            name
                                            field {
                                                ... on ProjectV2SingleSelectField {
                                                    name
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;
        
        let allItems = [];
        let hasNextPage = true;
        let after = null;
        
        while (hasNextPage) {
            const data = await this.makeGraphQLRequest(query, {
                projectId,
                first: 100,
                after
            });
            
            const items = data.node.items;
            allItems = allItems.concat(items.nodes);
            hasNextPage = items.pageInfo.hasNextPage;
            after = items.pageInfo.endCursor;
        }
        
        return allItems;
    }
    
    async createProjectItem(title, body, fieldValues = {}) {
        // Use batching system for better performance
        return await this.queueOperation('create', { title, body });
    }
    
    async updateProjectItem(itemId, title, body) {
        // Use batching system for better performance
        return await this.queueOperation('update', { itemId, title, body });
    }
    
    // =================== CUSTOM FIELDS ===================
    
    async getProjectFields() {
        // Return cached fields if available
        if (this.projectFields.cached) {
            return this.projectFields.fields;
        }
        
        const projectId = await this.getProjectId();
        
        const query = `
            query($projectId: ID!) {
                node(id: $projectId) {
                    ... on ProjectV2 {
                        fields(first: 20) {
                            nodes {
                                ... on ProjectV2Field {
                                    id
                                    name
                                    dataType
                                }
                                ... on ProjectV2SingleSelectField {
                                    id
                                    name
                                    dataType
                                    options {
                                        id
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;
        
        const data = await this.makeGraphQLRequest(query, { projectId });
        
        if (data.node?.fields?.nodes) {
            // Convert to map for easy lookup
            const fieldsMap = {};
            data.node.fields.nodes.forEach(field => {
                fieldsMap[field.name] = field;
            });
            
            this.projectFields.fields = fieldsMap;
            this.projectFields.cached = true;
            
            console.log('GitHubProjects: Loaded project fields:', Object.keys(fieldsMap));
            return fieldsMap;
        }
        
        return {};
    }
    
    async createProjectField(name, dataType) {
        const projectId = await this.getProjectId();
        
        const mutation = `
            mutation($projectId: ID!, $name: String!, $dataType: ProjectV2CustomFieldType!) {
                createProjectV2Field(input: {
                    projectId: $projectId
                    name: $name
                    dataType: $dataType
                }) {
                    projectV2Field {
                        ... on ProjectV2Field {
                            id
                            name
                            dataType
                        }
                    }
                }
            }
        `;
        
        try {
            const data = await this.makeGraphQLRequest(mutation, {
                projectId,
                name,
                dataType
            });
            
            console.log(`GitHubProjects: Created field "${name}" (${dataType})`);
            
            // Invalidate field cache
            this.projectFields.cached = false;
            
            return data.createProjectV2Field.projectV2Field;
        } catch (error) {
            console.warn(`GitHubProjects: Could not create field "${name}":`, error.message);
            return null;
        }
    }
    
    async ensureMaterialFields() {
        // Skip if already verified this session
        if (this._fieldsEnsured) return true;
        
        console.log('GitHubProjects: Ensuring project fields exist...');
        
        const fields = await this.getProjectFields();
        
        // Define required fields (for both materials and groups)
        const requiredFields = [
            { name: 'Item Type', dataType: 'TEXT' }, // To distinguish Materials from Groups
            // Material-specific fields
            { name: 'Material Code', dataType: 'TEXT' },
            { name: 'Material Name', dataType: 'TEXT' },
            { name: 'MKT Capacity', dataType: 'NUMBER' },
            { name: 'Promo Capacity', dataType: 'NUMBER' },
            { name: 'Promo Active', dataType: 'TEXT' },
            { name: 'Group', dataType: 'TEXT' },
            // Group-specific fields
            { name: 'Group Name', dataType: 'TEXT' },
            { name: 'Description', dataType: 'TEXT' },
            { name: 'Color', dataType: 'TEXT' }
        ];
        
        // Create missing fields
        const createdFields = [];
        for (const fieldDef of requiredFields) {
            if (!fields[fieldDef.name]) {
                console.log(`GitHubProjects: Field "${fieldDef.name}" not found, creating...`);
                const created = await this.createProjectField(fieldDef.name, fieldDef.dataType);
                if (created) {
                    createdFields.push(fieldDef.name);
                }
            } else {
                console.log(`GitHubProjects: Field "${fieldDef.name}" already exists`);
            }
        }
        
        if (createdFields.length > 0) {
            console.log(`GitHubProjects: Created ${createdFields.length} new fields: ${createdFields.join(', ')}`);
            // Reload fields to get the new ones
            this.projectFields.cached = false;
            await this.getProjectFields();
        } else {
            console.log('GitHubProjects: All required fields already exist');
        }
        
        this._fieldsEnsured = true;
        return true;
    }
    
    // =================== PROJECT VIEWS ===================
    
    async getProjectViews() {
        // Return cached views if available
        if (this.projectViews.cached) {
            return this.projectViews.views;
        }
        
        const projectId = await this.getProjectId();
        
        const query = `
            query($projectId: ID!) {
                node(id: $projectId) {
                    ... on ProjectV2 {
                        views(first: 20) {
                            nodes {
                                id
                                name
                                number
                            }
                        }
                    }
                }
            }
        `;
        
        const data = await this.makeGraphQLRequest(query, { projectId });
        
        if (data.node?.views?.nodes) {
            const viewsMap = {};
            data.node.views.nodes.forEach(view => {
                viewsMap[view.name] = view;
            });
            
            this.projectViews.views = viewsMap;
            this.projectViews.cached = true;
            
            console.log('GitHubProjects: Loaded project views:', Object.keys(viewsMap));
            return viewsMap;
        }
        
        return {};
    }
    
    async updateItemFieldValue(itemId, fieldId, value) {
        const projectId = await this.getProjectId();
        
        const mutation = `
            mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $value: ProjectV2FieldValue!) {
                updateProjectV2ItemFieldValue(input: {
                    projectId: $projectId
                    itemId: $itemId
                    fieldId: $fieldId
                    value: $value
                }) {
                    projectV2Item {
                        id
                    }
                }
            }
        `;
        
        const data = await this.makeGraphQLRequest(mutation, {
            projectId,
            itemId,
            fieldId,
            value
        });
        
        return data.updateProjectV2ItemFieldValue.projectV2Item;
    }
    
    async syncMaterialToProjectFields(itemId, material, onlyFields = null) {
        try {
            const fields = await this.getProjectFields();
            
            // Resolve group name from group ID
            let groupName = 'Ungrouped';
            if (material.group) {
                try {
                    const groups = this.cache.groups || {};
                    groupName = groups[material.group]?.name || material.group;
                } catch {
                    groupName = material.group;
                }
            }
            
            // Map material properties to project fields
            const fieldMappings = [
                { prop: 'type', fieldName: 'Item Type', value: { text: 'Material' } },
                { prop: 'code', fieldName: 'Material Code', value: { text: material.code } },
                { prop: 'name', fieldName: 'Material Name', value: { text: material.name || '' } },
                { prop: 'capacity', fieldName: 'MKT Capacity', value: { number: material.capacity } },
                { prop: 'promoCapacity', fieldName: 'Promo Capacity', value: { number: material.promoCapacity || 0 } },
                { prop: 'promoActive', fieldName: 'Promo Active', value: { text: material.promoActive ? 'Yes' : 'No' } },
                { prop: 'group', fieldName: 'Group', value: { text: groupName } }
            ];
            
            // Filter to specific fields if requested
            const mappingsToSync = onlyFields 
                ? fieldMappings.filter(m => onlyFields.includes(m.fieldName))
                : fieldMappings;
            
            // Build batch field updates
            const fieldUpdates = [];
            for (const mapping of mappingsToSync) {
                const field = fields[mapping.fieldName];
                if (field) {
                    fieldUpdates.push({
                        fieldId: field.id,
                        value: mapping.value
                    });
                }
            }
            
            // Execute as batched operation for better performance
            if (fieldUpdates.length > 0) {
                await this.batchUpdateItemFields(itemId, fieldUpdates);
            }
            
            console.log(`GitHubProjects: Synced material ${material.code} fields: ${mappingsToSync.map(m => m.fieldName).join(', ')}`);
        } catch (error) {
            console.error('GitHubProjects: Error syncing material to project fields:', error);
        }
    }
    
    async deleteProjectItem(itemId) {
        // Use batching system for better performance
        return await this.queueOperation('delete', { itemId });
    }
    
    // =================== DATA SERIALIZATION ===================
    
    parseProjectItem(item) {
        try {
            const content = item.content;
            if (!content) return null;
            
            const title = content.title || '';
            const body = content.body || '';
            
            // Parse JSON from body
            if (body.startsWith('{') || body.startsWith('[')) {
                try {
                    return {
                        id: item.id,
                        title,
                        data: JSON.parse(body),
                        updatedAt: content.updatedAt || new Date().toISOString()
                    };
                } catch (parseError) {
                    console.error(`GitHubProjects: JSON parse error for "${title}". Body length: ${body.length}. Error: ${parseError.message}`);
                    return null;
                }
            }
            
            return null;
        } catch (error) {
            console.error('GitHubProjects: Error parsing item:', error);
            return null;
        }
    }
    
    serializeData(type, data) {
        return {
            title: `${type}_${Date.now()}`,
            body: JSON.stringify(data), // compact JSON to avoid size limits
            type,
            version: 1,
            timestamp: new Date().toISOString()
        };
    }
    
    // =================== MATERIALS ===================
    
    async saveMaterials(materialsObj) {
        if (!this.checkAvailability()) {
            throw new Error('GitHub Projects not configured');
        }
        
        try {
            // Log what we're saving to verify group assignments are included
            const materialCount = Object.keys(materialsObj).length;
            const materialsWithGroups = Object.values(materialsObj).filter(m => m.group).length;
            console.log(`GitHubProjects: Saving ${materialCount} materials (${materialsWithGroups} with group assignments)`);
            
            if (this.config.useCustomFields) {
                // NEW MODE: Create individual items for each material with custom fields
                console.log('GitHubProjects: Using custom fields mode - creating individual items');
                
                // Ensure all required fields exist
                await this.ensureMaterialFields();
                
                // Get existing material items
                const existingItems = await this.findAllItemsByType('material_');
                const existingMap = {};
                existingItems.forEach(item => {
                    if (item.content && item.content.title) {
                        const code = item.content.title.replace('material_', '');
                        existingMap[code] = item;
                    }
                });
                
                // Create/update each material — collect operations for batching
                let created = 0, updated = 0, skipped = 0;
                const updateOperations = [];
                const createOperations = [];
                const fieldSyncOperations = [];
                
                // Phase 1: Analyze changes and prepare operations
                for (const [code, material] of Object.entries(materialsObj)) {
                    const title = `material_${code}`;
                    const body = JSON.stringify(material, null, 2);
                    
                    if (existingMap[code]) {
                        // Check if data actually changed before updating
                        const existingBody = existingMap[code].content?.body;
                        if (existingBody === body) {
                            skipped++;
                            continue; // No change — skip API call entirely
                        }
                        
                        // Prepare update operation
                        updateOperations.push({
                            code,
                            itemId: existingMap[code].content.id,
                            projectItemId: existingMap[code].id,
                            title,
                            body,
                            material,
                            existingBody
                        });
                    } else {
                        // Prepare create operation
                        createOperations.push({
                            code,
                            title,
                            body,
                            material
                        });
                    }
                }
                
                // Phase 2: Execute creates in batch
                if (createOperations.length > 0) {
                    console.log(`GitHubProjects: Batching ${createOperations.length} material creates`);
                    const createPromises = createOperations.map(op => 
                        this.createProjectItem(op.title, op.body)
                            .then(result => ({ ...op, itemId: result.id }))
                    );
                    const createResults = await Promise.all(createPromises);
                    created = createResults.length;
                    
                    // Queue field syncs for new materials
                    createResults.forEach(result => {
                        fieldSyncOperations.push({
                            itemId: result.itemId,
                            material: result.material,
                            onlyFields: null // Sync all fields for new items
                        });
                    });
                }
                
                // Phase 3: Execute updates in batch
                if (updateOperations.length > 0) {
                    console.log(`GitHubProjects: Batching ${updateOperations.length} material updates`);
                    const updatePromises = updateOperations.map(op => 
                        this.updateProjectItem(op.itemId, op.title, op.body)
                            .then(() => op)
                    );
                    await Promise.all(updatePromises);
                    updated = updateOperations.length;
                    
                    // Detect changed fields for updates
                    updateOperations.forEach(op => {
                        try {
                            const oldData = JSON.parse(op.existingBody || '{}');
                            const changedFields = [];
                            if (oldData.group !== op.material.group) changedFields.push('Group');
                            if (oldData.name !== op.material.name) changedFields.push('Material Name');
                            if (oldData.capacity !== op.material.capacity) changedFields.push('MKT Capacity');
                            if (oldData.promoCapacity !== op.material.promoCapacity) changedFields.push('Promo Capacity');
                            if (oldData.promoActive !== op.material.promoActive) changedFields.push('Promo Active');
                            if (changedFields.length > 0) {
                                fieldSyncOperations.push({
                                    itemId: op.projectItemId,
                                    material: op.material,
                                    onlyFields: changedFields
                                });
                            }
                        } catch (fieldErr) {
                            console.warn(`GitHubProjects: Could not detect changed fields for ${op.code}:`, fieldErr.message);
                        }
                    });
                }
                
                // Phase 4: Execute field syncs in batch
                if (fieldSyncOperations.length > 0) {
                    console.log(`GitHubProjects: Batching ${fieldSyncOperations.length} field sync operations`);
                    const fieldPromises = fieldSyncOperations.map(op =>
                        this.syncMaterialToProjectFields(op.itemId, op.material, op.onlyFields)
                            .catch(err => console.warn(`GitHubProjects: Field sync failed:`, err.message))
                    );
                    await Promise.all(fieldPromises);
                }
                
                // Phase 5: Delete materials that no longer exist (batched)
                const deleteOperations = [];
                for (const [code, item] of Object.entries(existingMap)) {
                    if (!materialsObj[code]) {
                        deleteOperations.push({ code, itemId: item.id });
                    }
                }
                
                if (deleteOperations.length > 0) {
                    console.log(`GitHubProjects: Batching ${deleteOperations.length} material deletes`);
                    const deletePromises = deleteOperations.map(op =>
                        this.deleteProjectItem(op.itemId)
                            .then(() => console.log(`GitHubProjects: Deleted material ${op.code}`))
                    );
                    await Promise.all(deletePromises);
                }
                
                // Force flush any remaining queued operations
                await this.flushOperationQueue();
                
                console.log(`GitHubProjects: Successfully synced materials — ${created} created, ${updated} updated, ${skipped} unchanged`);
            } else {
                // LEGACY MODE: Save all materials as one JSON item
                const serialized = this.serializeData('materials', materialsObj);
                
                // Check if materials item exists
                const existingItem = await this.findItemByType('materials');
                
                if (existingItem) {
                    await this.updateProjectItem(existingItem.content.id, serialized.title, serialized.body);
                } else {
                    await this.createProjectItem(serialized.title, serialized.body);
                }
                
                console.log('GitHubProjects: Successfully saved materials as single JSON item');
            }
            
            // Update cache
            this.cache.materials = materialsObj;
            this.cache.lastFetch.materials = Date.now();
            
            // Broadcast change with data so other tabs can update locally
            this.broadcastChange('materials_updated', { materials: materialsObj });
            
            return true;
        } catch (error) {
            console.error('GitHubProjects: Error saving materials:', error);
            throw error;
        }
    }
    
    async loadMaterials() {
        if (!this.checkAvailability()) {
            throw new Error('GitHub Projects not configured');
        }
        
        // Check cache first - extended cache time for materials
        if (this.isCacheValid('materials')) {
            console.log('GitHubProjects: Returning cached materials');
            return this.cache.materials;
        }
        
        try {
            if (this.config.useCustomFields) {
                // NEW MODE: Load individual material items efficiently
                console.log('GitHubProjects: Loading materials from individual items with custom fields');
                
                // Use optimized loading with caching
                const materials = await this.loadMaterialsOptimized();
                
                // Update cache with extended TTL for materials
                this.cache.materials = materials;
                this.cache.lastFetch.materials = Date.now();
                
                const materialCount = Object.keys(materials).length;
                const materialsWithGroups = Object.values(materials).filter(m => m.group).length;
                console.log(`GitHubProjects: Loaded ${materialCount} materials from individual items (${materialsWithGroups} with group assignments)`);
                return materials;
            } else {
                // LEGACY MODE: Load all materials from single JSON item
                const item = await this.findItemByType('materials');
                
                if (item) {
                    const parsed = this.parseProjectItem(item);
                    if (parsed && parsed.data) {
                        // Update cache
                        this.cache.materials = parsed.data;
                        this.cache.lastFetch.materials = Date.now();
                        
                        const materialCount = Object.keys(parsed.data).length;
                        const materialsWithGroups = Object.values(parsed.data).filter(m => m.group).length;
                        console.log(`GitHubProjects: Loaded ${materialCount} materials from single JSON item (${materialsWithGroups} with group assignments)`);
                        return parsed.data;
                    }
                }
            }
            
            console.log('GitHubProjects: No materials found in GitHub Projects');
            return {};
        } catch (error) {
            console.error('GitHubProjects: Error loading materials:', error);
            throw error;
        }
    }
    
    async saveMaterial(material) {
        // Load all materials, update, and save
        const materials = await this.loadMaterials();
        materials[material.code] = material;
        await this.saveMaterials(materials);
        // saveMaterials already broadcasts with full data
        return true;
    }
    
    async deleteMaterial(code) {
        // Load, remove, and save - saveMaterials handles actual deletion in custom fields mode
        const materials = await this.loadMaterials();
        delete materials[code];
        await this.saveMaterials(materials);
        // saveMaterials already broadcasts with full data
        return true;
    }
    
    async getMaterial(code) {
        const materials = await this.loadMaterials();
        return materials[code] || null;
    }
    
    // =================== ARCHIVE ===================
    
    async saveArchive(archiveArray) {
        if (!this.checkAvailability()) {
            throw new Error('GitHub Projects not configured');
        }
        
        try {
            // Limit to 50 entries and strip rawData to reduce size
            const limitedArchive = archiveArray.slice(0, 50).map(entry => {
                const { rawData, ...entryWithoutRawData } = entry;
                return entryWithoutRawData;
            });
            
            const serialized = this.serializeData('archive', limitedArchive);
            
            // Check if serialized body exceeds GitHub's limit (65KB)
            const bodySize = new Blob([serialized.body]).size;
            if (bodySize > 65000) {
                // If still too large, reduce to 20 entries
                const reducedArchive = archiveArray.slice(0, 20).map(entry => {
                    const { rawData, results, ...essentialData } = entry;
                    // Keep only summary data, strip results too
                    return essentialData;
                });
                const reducedSerialized = this.serializeData('archive', reducedArchive);
                const existingItem = await this.findItemByType('archive');
                
                if (existingItem) {
                    await this.updateProjectItem(existingItem.content.id, reducedSerialized.title, reducedSerialized.body);
                } else {
                    await this.createProjectItem(reducedSerialized.title, reducedSerialized.body);
                }
                
                // Update cache with limited data
                this.cache.archive = reducedArchive;
                this.cache.lastFetch.archive = Date.now();
                
                this.broadcastChange('archive_updated', { archive: reducedArchive });
                
                console.warn('GitHubProjects: Archive was too large, saved reduced version (20 entries, summary only)');
                return true;
            }
            
            const existingItem = await this.findItemByType('archive');
            
            if (existingItem) {
                await this.updateProjectItem(existingItem.content.id, serialized.title, serialized.body);
            } else {
                await this.createProjectItem(serialized.title, serialized.body);
            }
            
            // Update cache
            this.cache.archive = limitedArchive;
            this.cache.lastFetch.archive = Date.now();
            
            this.broadcastChange('archive_updated', { archive: limitedArchive });
            
            console.log('GitHubProjects: Saved archive to GitHub Projects (rawData stripped)');
            return true;
        } catch (error) {
            console.error('GitHubProjects: Error saving archive:', error);
            throw error;
        }
    }
    
    async loadArchive() {
        if (!this.checkAvailability()) {
            throw new Error('GitHub Projects not configured');
        }
        
        // Check cache
        if (this.isCacheValid('archive')) {
            console.log('GitHubProjects: Returning cached archive');
            return this.cache.archive;
        }
        
        try {
            const item = await this.findItemByType('archive');
            
            if (item) {
                const parsed = this.parseProjectItem(item);
                if (parsed && parsed.data) {
                    // Update cache
                    this.cache.archive = parsed.data;
                    this.cache.lastFetch.archive = Date.now();
                    
                    console.log('GitHubProjects: Loaded archive from GitHub Projects');
                    return parsed.data;
                }
            }
            
            console.log('GitHubProjects: No archive found in GitHub Projects');
            return [];
        } catch (error) {
            console.error('GitHubProjects: Error loading archive:', error);
            throw error;
        }
    }
    
    // =================== GROUPS ===================
    
    async saveGroups(groupsObj) {
        if (!this.checkAvailability()) {
            throw new Error('GitHub Projects not configured');
        }
        
        try {
            const groupCount = Object.keys(groupsObj).length;
            console.log(`GitHubProjects: Saving ${groupCount} groups`);
            
            if (this.config.useCustomFields) {
                // NEW MODE: Create individual items for each group
                console.log('GitHubProjects: Using custom fields mode - creating individual group items');
                
                // Get existing group items
                const existingItems = await this.findAllItemsByType('group_');
                const existingMap = {};
                existingItems.forEach(item => {
                    if (item.content && item.content.title) {
                        const id = item.content.title.replace('group_', '');
                        existingMap[id] = item;
                    }
                });
                
                // Create/update each group — only sync fields for new or changed items
                let gCreated = 0, gUpdated = 0, gSkipped = 0;
                
                for (const [id, group] of Object.entries(groupsObj)) {
                    const title = `group_${id}`;
                    const body = JSON.stringify(group, null, 2);
                    
                    let itemId;
                    if (existingMap[id]) {
                        const existingBody = existingMap[id].content?.body;
                        if (existingBody === body) {
                            gSkipped++;
                            continue;
                        }
                        
                        // Update existing — body-only (1 API call, fields are cosmetic)
                        await this.updateProjectItem(existingMap[id].content.id, title, body);
                        gUpdated++;
                    } else {
                        // Create new
                        const result = await this.createProjectItem(title, body);
                        itemId = result.id;
                        gCreated++;
                        
                        // Sync custom fields only on creation (for GitHub Projects board display)
                        await this.syncGroupToProjectFields(itemId, group);
                    }
                }
                
                console.log(`GitHubProjects: Groups synced — ${gCreated} created, ${gUpdated} updated, ${gSkipped} unchanged`);
                
                // Delete groups that no longer exist
                for (const [id, item] of Object.entries(existingMap)) {
                    if (!groupsObj[id]) {
                        await this.deleteProjectItem(item.id);
                        console.log(`GitHubProjects: Deleted group ${id}`);
                    }
                }
            } else {
                // LEGACY MODE: Save all groups as one JSON item
                const serialized = this.serializeData('groups', groupsObj);
                const existingItem = await this.findItemByType('groups');
                
                if (existingItem) {
                    await this.updateProjectItem(existingItem.content.id, serialized.title, serialized.body);
                } else {
                    await this.createProjectItem(serialized.title, serialized.body);
                }
                
                console.log('GitHubProjects: Successfully saved groups as single JSON item');
            }
            
            this.cache.groups = groupsObj;
            this.cache.lastFetch.groups = Date.now();
            
            this.broadcastChange('groups_updated', { groups: groupsObj });
            
            return true;
        } catch (error) {
            console.error('GitHubProjects: Error saving groups:', error);
            throw error;
        }
    }
    
    async syncGroupToProjectFields(itemId, group) {
        try {
            const fields = await this.getProjectFields();
            
            // Map group properties to project fields
            const fieldMappings = [
                { prop: 'type', fieldName: 'Item Type', value: { text: 'Group' } },
                { prop: 'name', fieldName: 'Group Name', value: { text: group.name } },
                { prop: 'description', fieldName: 'Description', value: { text: group.description || '' } },
                { prop: 'color', fieldName: 'Color', value: { text: group.color || '' } }
            ];
            
            // Update each field if it exists in the project
            for (const mapping of fieldMappings) {
                const field = fields[mapping.fieldName];
                if (field) {
                    try {
                        await this.updateItemFieldValue(itemId, field.id, mapping.value);
                    } catch (error) {
                        console.warn(`GitHubProjects: Could not update field "${mapping.fieldName}":`, error.message);
                    }
                }
            }
            
            console.log(`GitHubProjects: Synced group ${group.name} to project fields`);
        } catch (error) {
            console.error('GitHubProjects: Error syncing group to project fields:', error);
        }
    }
    
    async loadGroups() {
        if (!this.checkAvailability()) {
            throw new Error('GitHub Projects not configured');
        }
        
        if (this.isCacheValid('groups')) {
            return this.cache.groups;
        }
        
        try {
            if (this.config.useCustomFields) {
                // NEW MODE: Load individual group items
                console.log('GitHubProjects: Loading groups from individual items');
                
                const items = await this.findAllItemsByType('group_');
                const groups = {};
                
                for (const item of items) {
                    const parsed = this.parseProjectItem(item);
                    if (parsed && parsed.data) {
                        const group = parsed.data;
                        groups[group.id] = group;
                    }
                }
                
                this.cache.groups = groups;
                this.cache.lastFetch.groups = Date.now();
                
                console.log(`GitHubProjects: Loaded ${Object.keys(groups).length} groups from individual items`);
                return groups;
            } else {
                // LEGACY MODE: Load all groups from single JSON item
                const item = await this.findItemByType('groups');
                
                if (item) {
                    const parsed = this.parseProjectItem(item);
                    if (parsed && parsed.data) {
                        this.cache.groups = parsed.data;
                        this.cache.lastFetch.groups = Date.now();
                        console.log(`GitHubProjects: Loaded ${Object.keys(parsed.data).length} groups from single JSON item`);
                        return parsed.data;
                    }
                }
            }
            
            return {};
        } catch (error) {
            console.error('GitHubProjects: Error loading groups:', error);
            throw error;
        }
    }
    
    // =================== NOTES ===================
    
    async saveNotes(notesObj) {
        if (!this.checkAvailability()) {
            throw new Error('GitHub Projects not configured');
        }
        
        try {
            const serialized = this.serializeData('notes', notesObj);
            const existingItem = await this.findItemByType('notes');
            
            if (existingItem) {
                await this.updateProjectItem(existingItem.content.id, serialized.title, serialized.body);
            } else {
                await this.createProjectItem(serialized.title, serialized.body);
            }
            
            this.cache.notes = notesObj;
            this.cache.lastFetch.notes = Date.now();
            
            this.broadcastChange('notes_updated', { notes: notesObj });
            
            return true;
        } catch (error) {
            console.error('GitHubProjects: Error saving notes:', error);
            throw error;
        }
    }
    
    async loadNotes() {
        if (!this.checkAvailability()) {
            throw new Error('GitHub Projects not configured');
        }
        
        if (this.isCacheValid('notes')) {
            return this.cache.notes;
        }
        
        try {
            const item = await this.findItemByType('notes');
            
            if (item) {
                const parsed = this.parseProjectItem(item);
                if (parsed && parsed.data) {
                    this.cache.notes = parsed.data;
                    this.cache.lastFetch.notes = Date.now();
                    return parsed.data;
                }
            }
            
            return {};
        } catch (error) {
            console.error('GitHubProjects: Error loading notes:', error);
            throw error;
        }
    }
    
    // =================== ALERT RULES ===================
    
    async saveAlertRules(alertRules) {
        if (!this.checkAvailability()) {
            throw new Error('GitHub Projects not configured');
        }
        
        try {
            const serialized = this.serializeData('alertRules', alertRules);
            const existingItem = await this.findItemByType('alertRules');
            
            if (existingItem) {
                await this.updateProjectItem(existingItem.content.id, serialized.title, serialized.body);
            } else {
                await this.createProjectItem(serialized.title, serialized.body);
            }
            
            this.cache.alertRules = alertRules;
            this.cache.lastFetch.alertRules = Date.now();
            
            return true;
        } catch (error) {
            console.error('GitHubProjects: Error saving alert rules:', error);
            throw error;
        }
    }
    
    async loadAlertRules() {
        if (!this.checkAvailability()) {
            throw new Error('GitHub Projects not configured');
        }
        
        if (this.isCacheValid('alertRules')) {
            return this.cache.alertRules;
        }
        
        try {
            const item = await this.findItemByType('alertRules');
            
            if (item) {
                const parsed = this.parseProjectItem(item);
                if (parsed && parsed.data) {
                    this.cache.alertRules = parsed.data;
                    this.cache.lastFetch.alertRules = Date.now();
                    return parsed.data;
                }
            }
            
            return null;
        } catch (error) {
            console.error('GitHubProjects: Error loading alert rules:', error);
            throw error;
        }
    }
    
    // =================== STORAGE TYPE SETTINGS ===================
    
    async saveStorageTypeSettings(settings) {
        if (!this.checkAvailability()) {
            throw new Error('GitHub Projects not configured');
        }
        
        try {
            const serialized = this.serializeData('storageTypes', settings);
            const existingItem = await this.findItemByType('storageTypes');
            
            if (existingItem) {
                await this.updateProjectItem(existingItem.content.id, serialized.title, serialized.body);
            } else {
                await this.createProjectItem(serialized.title, serialized.body);
            }
            
            this.cache.storageTypes = settings;
            this.cache.lastFetch.storageTypes = Date.now();
            
            return true;
        } catch (error) {
            console.error('GitHubProjects: Error saving storage type settings:', error);
            throw error;
        }
    }
    
    async loadStorageTypeSettings() {
        if (!this.checkAvailability()) {
            throw new Error('GitHub Projects not configured');
        }
        
        if (this.isCacheValid('storageTypes')) {
            return this.cache.storageTypes;
        }
        
        try {
            const item = await this.findItemByType('storageTypes');
            
            if (item) {
                const parsed = this.parseProjectItem(item);
                if (parsed && parsed.data) {
                    this.cache.storageTypes = parsed.data;
                    this.cache.lastFetch.storageTypes = Date.now();
                    return parsed.data;
                }
            }
            
            return null;
        } catch (error) {
            console.error('GitHubProjects: Error loading storage type settings:', error);
            throw error;
        }
    }
    
    // =================== HELPER METHODS ===================
    
    async findItemByType(type) {
        // Use cached project items for better performance
        const items = await this.getProjectItemsCached();
        
        for (const item of items) {
            const content = item.content;
            if (content && content.title && content.title.startsWith(`${type}_`)) {
                return item;
            }
        }
        
        return null;
    }
    
    async findAllItemsByType(typePrefix) {
        // Use cached project items if available
        const items = await this.getProjectItemsCached();
        const matchingItems = [];
        
        for (const item of items) {
            const content = item.content;
            if (content && content.title && content.title.startsWith(typePrefix)) {
                matchingItems.push(item);
            }
        }
        
        return matchingItems;
    }

    // Optimized materials loading
    async loadMaterialsOptimized() {
        const startTime = Date.now();
        
        // Get all project items with caching
        const allItems = await this.getProjectItemsCached();
        
        const materials = {};
        let processedCount = 0;
        
        // Process materials in batches for better performance
        for (const item of allItems) {
            const content = item.content;
            if (content && content.title && content.title.startsWith('material_')) {
                const parsed = this.parseProjectItem(item);
                if (parsed && parsed.data) {
                    const material = parsed.data;
                    materials[material.code] = material;
                    processedCount++;
                }
            }
        }
        
        const loadTime = Date.now() - startTime;
        console.log(`GitHubProjects: Optimized loading completed in ${loadTime}ms - processed ${processedCount} materials`);
        
        return materials;
    }

    // Cached version of getProjectItems for better performance
    async getProjectItemsCached() {
        // Cache project items for 2 minutes to avoid repeated API calls
        const cacheKey = 'projectItems';
        const now = Date.now();
        
        if (this.cache[cacheKey] && 
            this.cache.lastFetch[cacheKey] && 
            (now - this.cache.lastFetch[cacheKey]) < (2 * 60 * 1000)) {
            return this.cache[cacheKey];
        }
        
        console.log('GitHubProjects: Fetching project items from API...');
        const items = await this.getProjectItems();
        
        // Cache the result
        this.cache[cacheKey] = items;
        this.cache.lastFetch[cacheKey] = now;
        
        return items;
    }

    // Invalidate the projectItems cache after write operations
    invalidateProjectItemsCache() {
        this.cache.projectItems = null;
        delete this.cache.lastFetch.projectItems;
    }
    
    // =================== CACHE MANAGEMENT ===================
    
    isCacheValid(type) {
        if (!this.config.cacheEnabled) {
            return false;
        }
        
        const lastFetch = this.cache.lastFetch[type];
        if (!lastFetch) {
            return false;
        }
        
        const age = Date.now() - lastFetch;
        return age < this.cache.ttl;
    }
    
    clearCache(type = null) {
        if (type) {
            this.cache[type] = null;
            delete this.cache.lastFetch[type];
        } else {
            this.cache.materials = null;
            this.cache.archive = null;
            this.cache.groups = null;
            this.cache.notes = null;
            this.cache.alertRules = null;
            this.cache.storageTypes = null;
            this.cache.projectItems = null;
            this.cache.lastFetch = {};
        }
        console.log(`GitHubProjects: Cache cleared${type ? ` for ${type}` : ''}`);
    }
    
    getCacheStatus() {
        const now = Date.now();
        return {
            materials: this.getCacheItemStatus('materials', now),
            archive: this.getCacheItemStatus('archive', now),
            groups: this.getCacheItemStatus('groups', now),
            notes: this.getCacheItemStatus('notes', now),
            alertRules: this.getCacheItemStatus('alertRules', now),
            storageTypes: this.getCacheItemStatus('storageTypes', now)
        };
    }
    
    getCacheItemStatus(type, now) {
        const lastFetch = this.cache.lastFetch[type];
        if (!lastFetch) {
            return { cached: false, age: 0 };
        }
        
        const age = now - lastFetch;
        const valid = age < this.cache.ttl;
        
        return {
            cached: !!this.cache[type],
            valid,
            age,
            expiresIn: valid ? this.cache.ttl - age : 0
        };
    }
    
    // =================== BACKGROUND SYNC ===================
    
    startBackgroundSync() {
        if (this.syncState.interval) {
            clearInterval(this.syncState.interval);
        }
        
        const intervalMs = (this.config.syncInterval || 30) * 1000;
        this.syncState.intervalMs = intervalMs;
        
        this.syncState.interval = setInterval(() => {
            this.performBackgroundSync();
        }, intervalMs);
        
        this.syncState.enabled = true;
        console.log(`GitHubProjects: Background sync started (interval: ${intervalMs}ms)`);
        
        // Perform initial sync
        this.performBackgroundSync();
    }
    
    stopBackgroundSync() {
        if (this.syncState.interval) {
            clearInterval(this.syncState.interval);
            this.syncState.interval = null;
        }
        this.syncState.enabled = false;
        console.log('GitHubProjects: Background sync stopped');
    }
    
    async performBackgroundSync() {
        if (this.syncState.isSyncing) {
            console.log('GitHubProjects: Sync already in progress, skipping');
            return;
        }
        
        if (!this.checkAvailability()) {
            console.log('GitHubProjects: Not configured, skipping sync');
            return;
        }
        
        this.syncState.isSyncing = true;
        console.log('GitHubProjects: Starting background sync...');
        
        try {
            // 1. Snapshot current local data before fetching remote
            const localSnapshot = {
                materials: this.cache.materials ? { ...this.cache.materials } : null,
                groups: this.cache.groups ? { ...this.cache.groups } : null,
                notes: this.cache.notes ? { ...this.cache.notes } : null,
                archive: this.cache.archive ? [...this.cache.archive] : null
            };
            
            // 2. Clear cache to force fresh fetch from remote
            this.clearCache();
            
            // 3. Fetch remote data
            const remoteData = {
                materials: await this.loadMaterials().catch(() => ({})),
                groups: await this.loadGroups().catch(() => ({})),
                notes: await this.loadNotes().catch(() => ({})),
                archive: await this.loadArchive().catch(() => [])
            };
            
            // 4. Compare local vs remote and detect conflicts
            const { strategy } = this.config;
            const resolution = this.config.conflictResolution || 'manual';
            let totalConflicts = 0;
            let autoResolved = 0;
            
            const objectTypes = ['materials', 'groups', 'notes'];
            
            for (const dataType of objectTypes) {
                const localData = localSnapshot[dataType];
                // Skip comparison if we had no local data (first load)
                if (!localData) continue;
                
                const conflicts = await this.detectConflicts(localData, remoteData[dataType], dataType);
                
                if (conflicts.length > 0) {
                    totalConflicts += conflicts.length;
                    console.log(`GitHubProjects: ${conflicts.length} conflict(s) detected in ${dataType}`);
                    
                    if (resolution === 'manual') {
                        // Queue all conflicts for manual resolution
                        for (const conflict of conflicts) {
                            this.syncState.conflictQueue.push(conflict);
                        }
                    } else {
                        // Auto-resolve using configured strategy
                        for (const conflict of conflicts) {
                            const resolvedItem = await this.resolveConflict(conflict, resolution);
                            if (resolvedItem && conflict.key) {
                                // Apply resolved data back
                                remoteData[dataType][conflict.key] = resolvedItem;
                                autoResolved++;
                            }
                        }
                        
                        // Save auto-resolved data back to remote
                        if (autoResolved > 0) {
                            await this.saveResolvedData(dataType, remoteData[dataType]);
                        }
                    }
                }
            }
            
            // Handle archive conflicts (array-based)
            if (localSnapshot.archive) {
                const archiveConflicts = await this.detectConflicts(
                    localSnapshot.archive, remoteData.archive, 'archive'
                );
                if (archiveConflicts.length > 0) {
                    totalConflicts += archiveConflicts.length;
                    if (resolution === 'manual') {
                        for (const conflict of archiveConflicts) {
                            this.syncState.conflictQueue.push(conflict);
                        }
                    } else {
                        // For archive, remote-wins or merge just keeps remote
                        const resolved = await this.resolveConflict(archiveConflicts[0], resolution);
                        if (resolved) {
                            remoteData.archive = resolved;
                        }
                    }
                }
            }
            
            // 5. Update caches with final resolved data
            this.cache.materials = remoteData.materials;
            this.cache.lastFetch.materials = Date.now();
            this.cache.groups = remoteData.groups;
            this.cache.lastFetch.groups = Date.now();
            this.cache.notes = remoteData.notes;
            this.cache.lastFetch.notes = Date.now();
            this.cache.archive = remoteData.archive;
            this.cache.lastFetch.archive = Date.now();
            
            this.syncState.lastSync = Date.now();
            
            // 6. Broadcast results with resolved data snapshot
            const manualConflicts = this.syncState.conflictQueue.length;
            
            this.broadcastChange('background_sync_complete', {
                timestamp: this.syncState.lastSync,
                conflicts: totalConflicts,
                autoResolved,
                manualConflicts,
                snapshot: {
                    materials: remoteData.materials,
                    groups: remoteData.groups,
                    notes: remoteData.notes,
                    archive: remoteData.archive
                }
            });
            
            if (manualConflicts > 0) {
                // Notify UI that conflicts need manual resolution
                this.broadcastChange('conflicts_detected', {
                    count: manualConflicts
                });
            }
            
            console.log(`GitHubProjects: Background sync completed — ${totalConflicts} conflict(s), ${autoResolved} auto-resolved, ${manualConflicts} pending manual`);
        } catch (error) {
            console.error('GitHubProjects: Background sync failed:', error);
            
            this.broadcastChange('background_sync_error', {
                error: error.message
            });
        } finally {
            this.syncState.isSyncing = false;
        }
    }
    
    /**
     * Save auto-resolved data back to GitHub Projects
     */
    async saveResolvedData(dataType, data) {
        try {
            switch (dataType) {
                case 'materials':
                    await this.saveMaterials(data);
                    break;
                case 'groups':
                    await this.saveGroups(data);
                    break;
                case 'notes':
                    await this.saveNotes(data);
                    break;
                case 'archive':
                    await this.saveArchive(data);
                    break;
            }
            console.log(`GitHubProjects: Saved resolved ${dataType} back to remote`);
        } catch (error) {
            console.error(`GitHubProjects: Failed to save resolved ${dataType}:`, error);
        }
    }
    
    getSyncStatus() {
        return {
            enabled: this.syncState.enabled,
            isSyncing: this.syncState.isSyncing,
            lastSync: this.syncState.lastSync,
            intervalMs: this.syncState.intervalMs,
            pendingChanges: this.syncState.pendingChanges.length,
            conflicts: this.syncState.conflictQueue.length
        };
    }
    
    // =================== CONFLICT RESOLUTION ===================
    
    async detectConflicts(localData, remoteData, dataType) {
        const conflicts = [];
        
        if (dataType === 'materials' || dataType === 'groups' || dataType === 'notes') {
            // Object-based data
            const localKeys = new Set(Object.keys(localData));
            const remoteKeys = new Set(Object.keys(remoteData));
            
            // Check for modifications on items present in both
            for (const key of localKeys) {
                if (remoteKeys.has(key)) {
                    const localItem = localData[key];
                    const remoteItem = remoteData[key];
                    
                    // Deep compare: check updatedAt timestamps and JSON equality
                    const localTime = new Date(localItem.updatedAt || 0).getTime();
                    const remoteTime = new Date(remoteItem.updatedAt || 0).getTime();
                    const jsonEqual = JSON.stringify(localItem) === JSON.stringify(remoteItem);
                    
                    if (!jsonEqual && localTime !== remoteTime) {
                        conflicts.push({
                            key,
                            type: 'modified',
                            dataType,
                            local: localItem,
                            remote: remoteItem,
                            localTime,
                            remoteTime
                        });
                    }
                }
            }
            
            // Detect items deleted remotely but still present locally
            for (const key of localKeys) {
                if (!remoteKeys.has(key)) {
                    conflicts.push({
                        key,
                        type: 'deleted_remote',
                        dataType,
                        local: localData[key],
                        remote: null,
                        localTime: new Date(localData[key].updatedAt || 0).getTime(),
                        remoteTime: 0
                    });
                }
            }
            
            // Detect items added remotely that don't exist locally
            for (const key of remoteKeys) {
                if (!localKeys.has(key)) {
                    conflicts.push({
                        key,
                        type: 'added_remote',
                        dataType,
                        local: null,
                        remote: remoteData[key],
                        localTime: 0,
                        remoteTime: new Date(remoteData[key].updatedAt || 0).getTime()
                    });
                }
            }
        } else if (dataType === 'archive') {
            // Array-based data — compare by report IDs or length
            const localIds = new Set((localData || []).map(r => r.id || r.date));
            const remoteIds = new Set((remoteData || []).map(r => r.id || r.date));
            
            const onlyLocal = [...localIds].filter(id => !remoteIds.has(id));
            const onlyRemote = [...remoteIds].filter(id => !localIds.has(id));
            
            if (onlyLocal.length > 0 || onlyRemote.length > 0) {
                conflicts.push({
                    type: 'archive_diverged',
                    dataType,
                    local: localData,
                    remote: remoteData,
                    localOnly: onlyLocal,
                    remoteOnly: onlyRemote,
                    localTime: Date.now(),
                    remoteTime: Date.now()
                });
            }
        }
        
        return conflicts;
    }
    
    async resolveConflict(conflict, resolution) {
        // Handle added/deleted items specially
        if (conflict.type === 'added_remote') {
            // Item was added on remote — always accept unless local-wins
            return resolution === 'local-wins' ? null : conflict.remote;
        }
        if (conflict.type === 'deleted_remote') {
            // Item was deleted on remote — null means "delete locally too"
            return resolution === 'local-wins' ? conflict.local : null;
        }
        if (conflict.type === 'archive_diverged') {
            // Merge archives: combine unique entries from both sides
            if (resolution === 'local-wins') return conflict.local;
            if (resolution === 'remote-wins') return conflict.remote;
            // merge: union of both, deduplicated by id/date
            const seen = new Set();
            const merged = [];
            for (const item of [...(conflict.local || []), ...(conflict.remote || [])]) {
                const key = item.id || item.date;
                if (!seen.has(key)) {
                    seen.add(key);
                    merged.push(item);
                }
            }
            return merged;
        }
        
        switch (resolution) {
            case 'local-wins':
                return conflict.local;
            
            case 'remote-wins':
                return conflict.remote;
            
            case 'merge':
                // Prefer newer timestamp
                return conflict.localTime > conflict.remoteTime ? conflict.local : conflict.remote;
            
            case 'manual':
                // Queue for manual resolution
                this.syncState.conflictQueue.push(conflict);
                return null;
            
            default:
                return conflict.remote;
        }
    }
    
    getConflicts() {
        return this.syncState.conflictQueue;
    }
    
    async resolveConflictManually(conflictIndex, resolution, customData = null) {
        if (conflictIndex < 0 || conflictIndex >= this.syncState.conflictQueue.length) {
            throw new Error('Invalid conflict index');
        }
        
        const conflict = this.syncState.conflictQueue[conflictIndex];
        let resolvedData;
        
        if (customData) {
            resolvedData = customData;
        } else {
            resolvedData = await this.resolveConflict(conflict, resolution);
        }
        
        // Remove from queue
        this.syncState.conflictQueue.splice(conflictIndex, 1);
        
        // Save resolved data
        if (resolvedData) {
            const { dataType, key } = conflict;
            
            switch (dataType) {
                case 'materials':
                    await this.saveMaterial(resolvedData);
                    break;
                case 'groups': {
                    const groups = await this.loadGroups();
                    groups[key] = resolvedData;
                    await this.saveGroups(groups);
                    break;
                }
                case 'notes': {
                    const notes = await this.loadNotes();
                    notes[key] = resolvedData;
                    await this.saveNotes(notes);
                    break;
                }
                case 'archive':
                    // resolvedData is the full merged archive array
                    await this.saveArchive(resolvedData);
                    break;
            }
        } else if (conflict.type === 'deleted_remote' && conflict.key) {
            // null means delete — remove the item locally and remotely
            const { dataType, key } = conflict;
            switch (dataType) {
                case 'materials':
                    await this.deleteMaterial(key);
                    break;
                case 'groups': {
                    const groups = await this.loadGroups();
                    delete groups[key];
                    await this.saveGroups(groups);
                    break;
                }
                case 'notes': {
                    const notes = await this.loadNotes();
                    delete notes[key];
                    await this.saveNotes(notes);
                    break;
                }
            }
        }
        
        return resolvedData;
    }
    
    clearConflicts() {
        this.syncState.conflictQueue = [];
    }
    
    // =================== WEBHOOK SUPPORT ===================
    
    initWebhookListener() {
        // This would typically be a server-side webhook receiver
        // For client-side, we can use polling or WebSocket connections
        console.log('GitHubProjects: Webhook listener initialized (polling mode)');
    }
    
    // In a real implementation, this would be triggered by a webhook
    async handleWebhookEvent(event) {
        console.log('GitHubProjects: Webhook event received:', event);
        
        switch (event.action) {
            case 'created':
            case 'edited':
            case 'deleted':
                // Clear cache and trigger sync
                this.clearCache();
                await this.performBackgroundSync();
                break;
            
            default:
                console.log('GitHubProjects: Unhandled webhook event:', event.action);
        }
    }
    
    // =================== CROSS-TAB COMMUNICATION ===================
    
    broadcastChange(type, data = null) {
        if (this.syncChannel) {
            try {
                this.syncChannel.postMessage({
                    type,
                    timestamp: Date.now(),
                    data
                });
            } catch (error) {
                console.warn('GitHubProjects: Failed to broadcast change:', error);
            }
        }
    }
    
    onSyncMessage(callback) {
        if (this.syncChannel) {
            const originalHandler = this.syncChannel.onmessage;
            this.syncChannel.onmessage = (event) => {
                if (originalHandler) {
                    originalHandler(event);
                }
                callback(event.data);
            };
        }
    }
    
    handleCrossTabMessage(message) {
        console.log('GitHubProjects: Received cross-tab message:', message.type);
        
        const { data } = message;
        
        // Update local cache directly from broadcast data (no API calls needed)
        switch (message.type) {
            case 'materials_updated':
                if (data?.materials) {
                    this.cache.materials = data.materials;
                    this.cache.lastFetch.materials = Date.now();
                } else {
                    this.clearCache('materials');
                    this.invalidateProjectItemsCache();
                }
                break;
            
            case 'archive_updated':
                if (data?.archive) {
                    this.cache.archive = data.archive;
                    this.cache.lastFetch.archive = Date.now();
                } else {
                    this.clearCache('archive');
                    this.invalidateProjectItemsCache();
                }
                break;
            
            case 'groups_updated':
                if (data?.groups) {
                    this.cache.groups = data.groups;
                    this.cache.lastFetch.groups = Date.now();
                } else {
                    this.clearCache('groups');
                    this.invalidateProjectItemsCache();
                }
                break;
            
            case 'notes_updated':
                if (data?.notes) {
                    this.cache.notes = data.notes;
                    this.cache.lastFetch.notes = Date.now();
                } else {
                    this.clearCache('notes');
                    this.invalidateProjectItemsCache();
                }
                break;
            
            case 'background_sync_complete':
                // Another tab completed sync with fresh API data — apply it
                if (data?.snapshot) {
                    const { materials, groups, notes, archive } = data.snapshot;
                    if (materials) { this.cache.materials = materials; this.cache.lastFetch.materials = Date.now(); }
                    if (groups) { this.cache.groups = groups; this.cache.lastFetch.groups = Date.now(); }
                    if (notes) { this.cache.notes = notes; this.cache.lastFetch.notes = Date.now(); }
                    if (archive) { this.cache.archive = archive; this.cache.lastFetch.archive = Date.now(); }
                } else {
                    this.clearCache();
                }
                break;
            
            case 'conflicts_detected':
                console.log(`GitHubProjects: ${data?.count || 0} conflict(s) detected in another tab`);
                break;
        }
    }
    
    // =================== CONNECTION TEST ===================
    
    async testConnection() {
        try {
            const projectId = await this.getProjectId();
            return {
                success: true,
                projectId,
                message: 'Connection successful'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}
